import { useEffect, useCallback } from "react";
import Hls from "hls.js";
import { usePlayerStore } from "@/store/use-player-store";
import { getStreamUrl } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";

// Module-level singleton — shared across every component that calls this hook
let _audio: HTMLAudioElement | null = null;
let _hls: Hls | null = null;
let _listenersAttached = false;

function getAudio(): HTMLAudioElement {
  if (!_audio) _audio = new Audio();
  return _audio;
}

export function useAudioPlayer() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying    = usePlayerStore((s) => s.isPlaying);
  const volume       = usePlayerStore((s) => s.volume);
  const { toast }    = useToast();

  // Attach DOM event listeners exactly once for the lifetime of the app
  useEffect(() => {
    if (_listenersAttached) return;
    _listenersAttached = true;

    const audio = getAudio();

    audio.addEventListener("timeupdate", () => {
      usePlayerStore.getState().setProgress(audio.currentTime);
    });
    audio.addEventListener("durationchange", () => {
      const d = audio.duration;
      if (d && !isNaN(d) && d !== Infinity) {
        usePlayerStore.getState().setDuration(d);
      }
    });
    audio.addEventListener("ended", () => {
      usePlayerStore.getState().setPlaying(false);
      usePlayerStore.getState().setProgress(0);
    });
    audio.addEventListener("pause", () => usePlayerStore.getState().setPlaying(false));
    audio.addEventListener("play",  () => usePlayerStore.getState().setPlaying(true));
    audio.addEventListener("error", (e) => console.error("Audio error:", e));
  }, []);

  // Load a new track whenever currentTrack.id changes
  useEffect(() => {
    if (!currentTrack) return;

    let cancelled = false;

    const loadTrack = async () => {
      try {
        const streamInfo = await getStreamUrl({ trackUrl: currentTrack.permalink_url });
        if (cancelled) return;

        // Tear down previous HLS instance
        if (_hls) { _hls.destroy(); _hls = null; }

        const audio = getAudio();

        if (streamInfo.hls_url && Hls.isSupported()) {
          const proxiedUrl = `/api/soundcloud/proxy-hls?url=${encodeURIComponent(streamInfo.hls_url)}`;
          const hls = new Hls({ xhrSetup: (xhr) => { xhr.withCredentials = false; } });
          _hls = hls;
          hls.loadSource(proxiedUrl);
          hls.attachMedia(audio);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (usePlayerStore.getState().isPlaying) {
              audio.play().catch(console.error);
            }
          });

          hls.on(Hls.Events.ERROR, (_e, data) => {
            if (data.fatal) {
              if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
              else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
              else hls.destroy();
            }
          });
        } else if (streamInfo.progressive_url) {
          audio.src = streamInfo.progressive_url;
          if (usePlayerStore.getState().isPlaying) {
            audio.play().catch(console.error);
          }
        } else {
          toast({ title: "Playback Error", description: "No stream found for this track.", variant: "destructive" });
          usePlayerStore.getState().setPlaying(false);
        }
      } catch (err) {
        console.error("Failed to load track:", err);
        toast({ title: "Failed to load track", description: "Could not resolve stream URL.", variant: "destructive" });
        usePlayerStore.getState().setPlaying(false);
      }
    };

    loadTrack();
    return () => { cancelled = true; };
  }, [currentTrack?.id]);

  // Sync play / pause
  useEffect(() => {
    const audio = getAudio();
    if (isPlaying && audio.paused && audio.src) {
      audio.play().catch((err) => {
        console.error("Play error:", err);
        usePlayerStore.getState().setPlaying(false);
      });
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [isPlaying]);

  // Sync volume
  useEffect(() => {
    getAudio().volume = volume;
  }, [volume]);

  const seek = useCallback((time: number) => {
    const audio = getAudio();
    audio.currentTime = time;
    usePlayerStore.getState().setProgress(time);
  }, []);

  return { seek };
}
