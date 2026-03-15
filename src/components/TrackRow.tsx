import React, { useState } from "react";
import { Play, Pause, Download, Loader2, Heart } from "lucide-react";
import { Track } from "@/lib/api-client";
import { usePlayerStore } from "@/store/use-player-store";
import { formatDuration, getArtworkUrl } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface TrackRowProps {
  track: Track;
  index: number;
  queue?: Track[];
}

export function TrackRow({ track, queue }: TrackRowProps) {
  const { currentTrack, isPlaying, playTrack, toggleFavourite, isFavourite } = usePlayerStore();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const isActive = currentTrack?.id === track.id;
  const liked = isFavourite(track.id);

  // EXACT original download logic
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsDownloading(true);
      const params = new URLSearchParams({ trackUrl: track.permalink_url, title: track.title });
      const response = await fetch(`/api/soundcloud/download?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${track.artist} - ${track.title}.mp3`.replace(/[/\\?%*:|"<>]/g, '-');
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Download complete", description: "Track saved to your device." });
    } catch {
      toast({ title: "Download failed", description: "Could not download the track.", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFavourite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavourite(track);
  };

  return (
    <div
      onClick={() => playTrack(track, queue)}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer active:scale-[0.98] ${isActive ? "bg-white/10" : "hover:bg-white/5 active:bg-white/10"}`}
    >
      <div className="relative w-12 h-12 rounded-md overflow-hidden bg-white/10 shrink-0">
        <img src={getArtworkUrl(track.artwork)} alt={track.title} className="object-cover w-full h-full" loading="lazy" />
        {isActive && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            {isPlaying ? (
              <div className="flex items-end gap-0.5 h-4">
                <span className="w-1 bg-primary rounded-full animate-pulse" style={{ height: '60%' }} />
                <span className="w-1 bg-primary rounded-full animate-pulse" style={{ height: '100%', animationDelay: '75ms' }} />
                <span className="w-1 bg-primary rounded-full animate-pulse" style={{ height: '40%', animationDelay: '150ms' }} />
              </div>
            ) : (
              <Pause className="w-4 h-4 text-white fill-white" />
            )}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm truncate ${isActive ? 'text-primary' : 'text-white'}`}>{track.title}</p>
        <p className="text-xs text-[#b3b3b3] truncate mt-0.5">{track.artist}</p>
      </div>
      <span className="text-xs text-[#b3b3b3] font-medium shrink-0">{formatDuration(track.duration)}</span>
      <button onClick={handleFavourite} className={`w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 transition-all shrink-0 ${liked ? "text-primary" : "text-[#b3b3b3] hover:text-white"}`}>
        <Heart className={`w-4 h-4 ${liked ? "fill-primary" : ""}`} />
      </button>
      <button onClick={handleDownload} disabled={isDownloading} className="w-8 h-8 flex items-center justify-center rounded-full text-[#b3b3b3] hover:text-white hover:bg-white/10 active:scale-90 transition-all disabled:opacity-50 shrink-0">
        {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      </button>
    </div>
  );
}
