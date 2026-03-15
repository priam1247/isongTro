import React from "react";
import { Link } from "wouter";
import { useSearchSoundCloud } from "@/lib/api-client";
import { TrackRow } from "@/components/TrackRow";
import { Play, Music2, Search, Heart } from "lucide-react";
import { usePlayerStore } from "@/store/use-player-store";

export default function Home() {
  const { data, isLoading, error } = useSearchSoundCloud({ q: "trending 2024", limit: 30 });
  const playTrack = usePlayerStore(s => s.playTrack);

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-4 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Music2 className="w-4 h-4 text-black" />
          </div>
          <span className="font-display font-extrabold text-xl text-white tracking-tight">isongz mw</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/favourites">
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-90">
              <Heart className="w-5 h-5" />
            </div>
          </Link>
          <Link href="/search">
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-90">
              <Search className="w-5 h-5" />
            </div>
          </Link>
        </div>
      </header>

      <section className="relative w-full h-52 flex items-end overflow-hidden shrink-0">
        <div className="absolute inset-0 z-0">
          <img src={`${import.meta.env.BASE_URL}images/hero-bg.png`} alt="Hero background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        </div>
        <div className="relative z-10 w-full px-5 pb-5 flex items-end justify-between">
          <div>
            <span className="inline-block px-2.5 py-0.5 bg-primary/20 text-primary font-bold text-xs uppercase tracking-widest rounded-full mb-2">Trending Now</span>
            <h1 className="text-3xl font-display font-extrabold text-white drop-shadow-lg">Top Tracks</h1>
          </div>
          <button
            onClick={() => data?.tracks?.[0] && playTrack(data.tracks[0], data.tracks)}
            disabled={!data?.tracks?.length}
            className="flex items-center justify-center w-12 h-12 bg-primary rounded-full shadow-xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <Play className="w-5 h-5 fill-black text-black translate-x-0.5" />
          </button>
        </div>
      </section>

      <section className="flex-1 px-2 pt-4 pb-4">
        <div className="flex items-center justify-between mb-3 px-3">
          <h2 className="text-base font-display font-bold text-white">Songs</h2>
          <span className="text-xs font-medium text-[#b3b3b3]">{data?.tracks?.length || 0} tracks</span>
        </div>
        {isLoading ? (
          <div className="space-y-1 px-1">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl animate-pulse">
                <div className="w-12 h-12 bg-white/10 rounded-md shrink-0" />
                <div className="flex-1 space-y-2"><div className="h-3.5 bg-white/10 rounded w-3/4" /><div className="h-3 bg-white/10 rounded w-1/2" /></div>
                <div className="w-8 h-8 bg-white/10 rounded-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 mx-4 bg-white/5 rounded-2xl">
            <p className="text-red-400 font-semibold">Failed to load tracks</p>
            <p className="text-[#b3b3b3] text-sm mt-1">Check your connection</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {data?.tracks?.map((track, idx) => (
              <TrackRow key={track.id} track={track} index={idx} queue={data.tracks} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
