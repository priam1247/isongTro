import React from "react";
import { Link } from "wouter";
import { Music2, Heart, Search } from "lucide-react";
import { usePlayerStore } from "@/store/use-player-store";
import { TrackRow } from "@/components/TrackRow";

export default function Favourites() {
  const favourites = usePlayerStore(s => s.favourites);
  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-4 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30"><Music2 className="w-4 h-4 text-black" /></div>
          <span className="font-display font-extrabold text-xl text-white tracking-tight">isongz mw</span>
        </div>
        <Link href="/search">
          <div className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-90"><Search className="w-5 h-5" /></div>
        </Link>
      </header>
      <div className="px-5 pt-6 pb-3 flex items-center gap-3">
        <Heart className="w-6 h-6 text-primary fill-primary" />
        <h1 className="text-2xl font-display font-extrabold text-white">Favourites</h1>
        <span className="text-xs font-medium text-[#b3b3b3] ml-auto">{favourites.length} tracks</span>
      </div>
      <section className="flex-1 px-2 pb-4">
        {favourites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4"><Heart className="w-8 h-8 text-[#b3b3b3]" /></div>
            <h3 className="text-lg font-display font-bold text-white">No favourites yet</h3>
            <p className="text-[#b3b3b3] text-sm mt-1 max-w-xs mx-auto">Tap the heart on any track to save it here</p>
          </div>
        ) : (
          <div className="space-y-0.5">{favourites.map((track, idx) => (<TrackRow key={track.id} track={track} index={idx} queue={favourites} />))}</div>
        )}
      </section>
    </div>
  );
}
