import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Download, Loader2, ChevronUp } from "lucide-react";
import { usePlayerStore } from "@/store/use-player-store";
import { Slider } from "@/components/ui/slider";
import { formatDuration, getArtworkUrl } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

export function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    progress,
    duration,
    seek,
    setNowPlayingOpen,
  } = usePlayerStore();

  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = React.useState(false);

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  const handleDownload = async () => {
    if (!currentTrack) return;
    try {
      setIsDownloading(true);
      const params = new URLSearchParams({
        trackUrl: currentTrack.permalink_url,
        title: currentTrack.title,
      });
      const response = await fetch(`/api/soundcloud/download?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentTrack.artist} - ${currentTrack.title}.mp3`.replace(/[/\\?%*:|"<>]/g, '-');
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

  return (
    <AnimatePresence>
      <motion.div
        key="player-bar"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        className="shrink-0 bg-card border-t border-border"
      >
        {/* Progress bar at top of player */}
        <div className="relative h-1 w-full bg-white/10 cursor-pointer">
          <div
            className="absolute top-0 left-0 h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={progress}
            onChange={(e) => seek(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-3">
          {/* Tappable area: artwork + info opens Now Playing */}
          <div
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
            onClick={() => setNowPlayingOpen(true)}
          >
            <div className="w-12 h-12 rounded-md overflow-hidden shrink-0 shadow-lg relative">
              <img
                src={getArtworkUrl(currentTrack.artwork)}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm truncate">{currentTrack.title}</p>
              <p className="text-xs text-[#b3b3b3] truncate mt-0.5">{currentTrack.artist}</p>
            </div>
            <ChevronUp className="w-4 h-4 text-white/40 shrink-0 mr-1" />
          </div>

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-9 h-9 flex items-center justify-center rounded-full text-[#b3b3b3] hover:text-white transition-colors disabled:opacity-50 active:scale-90"
            title="Download"
          >
            {isDownloading
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <Download className="w-5 h-5" />
            }
          </button>

          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-md"
          >
            {isPlaying
              ? <Pause className="w-5 h-5 fill-black" />
              : <Play className="w-5 h-5 fill-black translate-x-0.5" />
            }
          </button>
        </div>

        {/* Time labels */}
        <div className="flex justify-between text-[10px] text-[#b3b3b3] px-4 pb-2 -mt-1">
          <span>{formatDuration(progress * 1000)}</span>
          <span>{formatDuration(duration * 1000)}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
