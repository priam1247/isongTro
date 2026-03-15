import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Download, Loader2, Heart, Shuffle, Repeat
} from "lucide-react";
import { usePlayerStore } from "@/store/use-player-store";
import { Slider } from "@/components/ui/slider";
import { formatDuration, getArtworkUrl } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

export function NowPlaying() {
  const {
    currentTrack, isPlaying, togglePlay,
    volume, setVolume, progress, duration,
    nowPlayingOpen, setNowPlayingOpen, seek,
    shuffle, repeat, toggleShuffle, toggleRepeat,
    playNext, playPrev, toggleFavourite, isFavourite,
  } = usePlayerStore();

  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = React.useState(false);

  const liked = currentTrack ? isFavourite(currentTrack.id) : false;

  // EXACT original download logic — unchanged
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
      {nowPlayingOpen && currentTrack && (
        <motion.div
          key="now-playing"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 35 }}
          className="absolute inset-0 z-50 flex flex-col overflow-hidden will-change-transform"
          style={{ background: "linear-gradient(180deg, #1c1c1c 0%, #0f0f0f 50%, #0a0a0a 100%)" }}
        >
          <div className="flex items-center justify-between px-5 pt-8 pb-3 shrink-0">
            <button onClick={() => setNowPlayingOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-90">
              <ChevronDown className="w-5 h-5" />
            </button>
            <p className="text-xs font-semibold text-white/60 uppercase tracking-widest">Now Playing</p>
            <div className="w-9" />
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-5">
            <motion.div
              key={currentTrack.id}
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: isPlaying ? 1 : 0.92, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="w-full aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-black/70 shrink-0"
            >
              <img src={getArtworkUrl(currentTrack.artwork)} alt={currentTrack.title} className="w-full h-full object-cover" />
            </motion.div>

            <div className="flex items-center justify-between gap-3 shrink-0">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-display font-bold text-white truncate leading-tight">{currentTrack.title}</h2>
                <p className="text-sm text-white/60 truncate mt-0.5">{currentTrack.artist}</p>
              </div>
              <button onClick={() => toggleFavourite(currentTrack)} className="w-10 h-10 flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                <Heart className={`w-6 h-6 transition-colors ${liked ? "fill-primary text-primary" : "text-white/50 hover:text-white"}`} />
              </button>
            </div>

            <div className="shrink-0">
              <Slider value={[progress]} max={duration || 100} step={0.1} onValueChange={(val) => seek(val[0])} className="w-full" />
              <div className="flex justify-between text-[11px] text-white/40 font-medium mt-1.5">
                <span>{formatDuration(progress * 1000)}</span>
                <span>{formatDuration(duration * 1000)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between shrink-0 px-1">
              <button onClick={toggleShuffle} className={`transition-colors active:scale-90 ${shuffle ? "text-primary" : "text-white/30 hover:text-white/80"}`}>
                <Shuffle className="w-5 h-5" />
              </button>
              <button onClick={playPrev} className="text-white/70 hover:text-white transition-colors active:scale-90">
                <SkipBack className="w-7 h-7 fill-current" />
              </button>
              <button onClick={togglePlay} className="w-14 h-14 flex items-center justify-center rounded-full bg-white text-black shadow-lg hover:scale-105 active:scale-95 transition-all">
                {isPlaying ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black translate-x-0.5" />}
              </button>
              <button onClick={playNext} className="text-white/70 hover:text-white transition-colors active:scale-90">
                <SkipForward className="w-7 h-7 fill-current" />
              </button>
              <button onClick={toggleRepeat} className={`transition-colors active:scale-90 ${repeat ? "text-primary" : "text-white/30 hover:text-white/80"}`}>
                <Repeat className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => setVolume(volume === 0 ? 0.8 : 0)} className="text-white/50 hover:text-white transition-colors shrink-0">
                {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <Slider value={[volume * 100]} max={100} step={1} onValueChange={(val) => setVolume(val[0] / 100)} className="flex-1" />
              <button onClick={handleDownload} disabled={isDownloading} className="w-9 h-9 flex items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50 active:scale-90 shrink-0">
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
