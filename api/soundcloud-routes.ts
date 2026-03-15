import { Router, type IRouter, type Request, type Response } from "express";
import https from "https";
import http from "http";
import { URL } from "url";

const router: IRouter = Router();

let clientId: string | null = null;
let clientIdExpiry = 0;

async function fetchJson(url: string, headers?: Record<string, string>): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === "https:" ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      path: parsed.pathname + parsed.search,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://soundcloud.com/",
        Origin: "https://soundcloud.com",
        ...headers,
      },
    };
    const req = lib.get(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Failed to parse JSON from ${url}: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });
  });
}

async function fetchRaw(url: string, headers?: Record<string, string>): Promise<{ body: Buffer; contentType: string; status: number }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === "https:" ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      path: parsed.pathname + parsed.search,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://soundcloud.com/",
        Origin: "https://soundcloud.com",
        ...headers,
      },
    };
    const req = lib.get(options, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchRaw(res.headers.location, headers).then(resolve).catch(reject);
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        resolve({
          body: Buffer.concat(chunks),
          contentType: res.headers["content-type"] || "application/octet-stream",
          status: res.statusCode || 200,
        });
      });
    });
    req.on("error", reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });
  });
}

const KNOWN_CLIENT_IDS = [
  "khI8ciOiYPX6UVGInQY5zA0zvTkfzuuC",
  "2t9loNQH90kzJcsFCODdigxfp325aq4z",
  "iZIs9mchVcX5lhVRyQGGAYlNPVldzAoX",
];

async function verifyClientId(cid: string): Promise<boolean> {
  try {
    const data = await fetchJson(
      `https://api-v2.soundcloud.com/search/tracks?q=test&limit=1&client_id=${cid}`
    );
    return !!data?.collection;
  } catch {
    return false;
  }
}

async function getSoundCloudClientId(): Promise<string> {
  const now = Date.now();
  if (clientId && now < clientIdExpiry) return clientId;

  try {
    const pageResult = await fetchRaw("https://soundcloud.com", {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    });
    const html = pageResult.body.toString("utf8");

    const scriptMatches = html.match(/https?:\/\/[^"']+\.js/g) || [];
    const appScripts = scriptMatches.filter((s) => s.includes("sndcdn.com"));

    for (const scriptUrl of appScripts.slice(0, 8)) {
      try {
        const scriptResult = await fetchRaw(scriptUrl);
        const script = scriptResult.body.toString("utf8");
        const patterns = [
          /client_id\s*:\s*["']([a-zA-Z0-9]{20,32})["']/,
          /client_id=["']([a-zA-Z0-9]{20,32})["']/,
          /,client_id:"([a-zA-Z0-9]{20,32})"/,
          /"client_id","([a-zA-Z0-9]{20,32})"/,
          /\{client_id:"([a-zA-Z0-9]{20,32})"/,
        ];
        for (const pattern of patterns) {
          const match = script.match(pattern);
          if (match) {
            const candidate = match[1];
            if (await verifyClientId(candidate)) {
              clientId = candidate;
              clientIdExpiry = now + 3600000;
              console.log("Found valid SoundCloud client_id:", clientId);
              return clientId;
            }
          }
        }
      } catch {
        continue;
      }
    }
  } catch (err) {
    console.error("Failed to fetch SoundCloud client_id from scripts:", err);
  }

  for (const cid of KNOWN_CLIENT_IDS) {
    if (await verifyClientId(cid)) {
      clientId = cid;
      clientIdExpiry = now + 600000;
      console.log("Using known working client_id:", clientId);
      return clientId;
    }
  }

  clientId = KNOWN_CLIENT_IDS[0];
  clientIdExpiry = now + 60000;
  return clientId;
}

function formatTrack(track: any) {
  return {
    id: track.id,
    title: track.title || "Unknown Title",
    artist: track.user?.username || track.user?.full_name || "Unknown Artist",
    duration: track.duration || 0,
    artwork: track.artwork_url
      ? track.artwork_url.replace("large", "t500x500")
      : track.user?.avatar_url || null,
    permalink_url: track.permalink_url,
    stream_url: track.stream_url || null,
    waveform_url: track.waveform_url || null,
    playback_count: track.playback_count || null,
    likes_count: track.likes_count || track.favoritings_count || null,
    genre: track.genre || null,
    description: track.description || null,
  };
}

router.get("/search", async (req: Request, res: Response) => {
  const { q, limit } = req.query;
  if (!q || typeof q !== "string") {
    res.status(400).json({ error: "Bad Request", message: "Query parameter 'q' is required" });
    return;
  }
  const resultLimit = parseInt(String(limit)) || 20;
  try {
    const cid = await getSoundCloudClientId();
    const searchUrl = `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(q)}&limit=${resultLimit}&offset=0&client_id=${cid}`;
    const data = await fetchJson(searchUrl);
    const tracks = (data.collection || [])
      .filter((t: any) => t.streamable)
      .map(formatTrack);
    res.json({ tracks, total: data.total_results || tracks.length, query: q });
  } catch (err: any) {
    console.error("Search error:", err.message);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

router.get("/resolve", async (req: Request, res: Response) => {
  const { url } = req.query;
  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "Bad Request", message: "Query parameter 'url' is required" });
    return;
  }
  try {
    const cid = await getSoundCloudClientId();
    const resolveUrl = `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(url)}&client_id=${cid}`;
    const data = await fetchJson(resolveUrl);
    res.json(formatTrack(data));
  } catch (err: any) {
    console.error("Resolve error:", err.message);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

router.get("/stream", async (req: Request, res: Response) => {
  const { trackUrl } = req.query;
  if (!trackUrl || typeof trackUrl !== "string") {
    res.status(400).json({ error: "Bad Request", message: "Query parameter 'trackUrl' is required" });
    return;
  }
  try {
    const cid = await getSoundCloudClientId();
    const resolveUrl = `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(trackUrl)}&client_id=${cid}`;
    const track = await fetchJson(resolveUrl);
    const trackId = track.id;

    const media = track.media?.transcodings || [];
    let hlsUrl: string | null = null;
    let progressiveUrl: string | null = null;

    const hlsTranscoding = media.find(
      (t: any) => t.format?.protocol === "hls" && t.format?.mime_type?.includes("mpeg")
    ) || media.find((t: any) => t.format?.protocol === "hls");

    const progressiveTranscoding = media.find(
      (t: any) => t.format?.protocol === "progressive"
    );

    if (hlsTranscoding) {
      try {
        const hlsData = await fetchJson(`${hlsTranscoding.url}?client_id=${cid}`);
        hlsUrl = hlsData.url || null;
      } catch (e) {
        console.error("Failed to get HLS URL:", e);
      }
    }

    if (progressiveTranscoding) {
      try {
        const progData = await fetchJson(`${progressiveTranscoding.url}?client_id=${cid}`);
        progressiveUrl = progData.url || null;
      } catch (e) {
        console.error("Failed to get progressive URL:", e);
      }
    }

    res.json({ hls_url: hlsUrl, progressive_url: progressiveUrl, track_id: trackId });
  } catch (err: any) {
    console.error("Stream error:", err.message);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

router.get("/proxy-hls", async (req: Request, res: Response) => {
  const { url } = req.query;
  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "Bad Request", message: "Query parameter 'url' is required" });
    return;
  }

  try {
    const result = await fetchRaw(url);
    const contentType = result.contentType;

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (contentType.includes("mpegurl") || contentType.includes("x-mpegURL") || url.includes(".m3u8")) {
      let manifest = result.body.toString("utf8");
      const baseUrl = new URL(url);

      manifest = manifest.replace(/(https?:\/\/[^\s\n"']+\.ts[^\s\n"']*)/g, (match) => {
        return `/api/soundcloud/proxy-hls?url=${encodeURIComponent(match)}`;
      });

      manifest = manifest.replace(/^(?!#)(?!https?:\/\/)([^\s\n]+\.ts[^\s\n]*)/gm, (match) => {
        const absoluteUrl = new URL(match, baseUrl.origin + baseUrl.pathname.replace(/[^/]*$/, "")).toString();
        return `/api/soundcloud/proxy-hls?url=${encodeURIComponent(absoluteUrl)}`;
      });

      manifest = manifest.replace(/(https?:\/\/[^\s\n"']+\.m3u8[^\s\n"']*)/g, (match) => {
        return `/api/soundcloud/proxy-hls?url=${encodeURIComponent(match)}`;
      });

      res.set("Content-Type", "application/vnd.apple.mpegurl");
      res.send(manifest);
    } else {
      res.set("Content-Type", contentType);
      res.send(result.body);
    }
  } catch (err: any) {
    console.error("HLS proxy error:", err.message);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

router.get("/download", async (req: Request, res: Response) => {
  const { trackUrl, title } = req.query;
  if (!trackUrl || typeof trackUrl !== "string") {
    res.status(400).json({ error: "Bad Request", message: "Query parameter 'trackUrl' is required" });
    return;
  }

  try {
    const cid = await getSoundCloudClientId();
    const resolveUrl = `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(trackUrl)}&client_id=${cid}`;
    const track = await fetchJson(resolveUrl);
    const media = track.media?.transcodings || [];

    const progressiveTranscoding = media.find(
      (t: any) => t.format?.protocol === "progressive"
    );

    let downloadUrl: string | null = null;

    if (progressiveTranscoding) {
      try {
        const progData = await fetchJson(`${progressiveTranscoding.url}?client_id=${cid}`);
        downloadUrl = progData.url || null;
      } catch {
        console.error("Failed to get progressive URL for download");
      }
    }

    if (!downloadUrl) {
      const hlsTranscoding = media.find(
        (t: any) => t.format?.protocol === "hls"
      );
      if (hlsTranscoding) {
        try {
          const hlsData = await fetchJson(`${hlsTranscoding.url}?client_id=${cid}`);
          downloadUrl = hlsData.url || null;
        } catch {
          console.error("Failed to get HLS URL for download");
        }
      }
    }

    if (!downloadUrl) {
      res.status(500).json({ error: "Internal Server Error", message: "No downloadable stream found for this track" });
      return;
    }

    const safeTitle = (typeof title === "string" ? title : track.title || "track")
      .replace(/[^a-z0-9\s\-_]/gi, "")
      .trim()
      .slice(0, 100);

    res.set("Content-Disposition", `attachment; filename="${safeTitle}.mp3"`);
    res.set("Content-Type", "audio/mpeg");
    res.set("Access-Control-Allow-Origin", "*");

    const audioResult = await fetchRaw(downloadUrl);
    res.send(audioResult.body);
  } catch (err: any) {
    console.error("Download error:", err.message);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

export default router;
