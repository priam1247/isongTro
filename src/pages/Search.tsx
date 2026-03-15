import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { useSearchSoundCloud } from "@/lib/api-client";
import { TrackRow } from "@/components/TrackRow";
import { Search as SearchIcon, X, Music, Music2, Heart } from "lucide-react";

export default function Search() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(timer);
  }, [query]);

  const searchQuery = debouncedQuery.trim() || "lofi hip hop";
  const { data, isLoading, error } = useSearchSoundCloud(
    { q: searchQuery, limit: 30 },
    { query: { enabled: searchQuery.length > 0 } }
  );

  return (
    <div className="flex flex-col min-h-full pb-4">
      <header className="sticky top-0 z-30 px-5 pt-4 pb-3 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Music2 className="w-4 h-4 text-black" />
            </div>
            <span className="font-display font-extrabold text-xl text-white tracking-tight">isongz mw</span>
          </div>
          <Link href="/favourites">
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-90">
              <Heart className="w-5 h-5" />
            </div>
          </Link>
        </div>
        <div className="relative">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#b3b3b3]" />
          <input type="text" className="w-full pl-11 pr-10 py-3 bg-white/10 rounded-full text-sm text-white placeholder:text-[#b3b3b3] outline-none focus:ring-2 focus:ring-primary/60 transition-all" placeholder="Artists, songs, or podcasts" value={query} onChange={(e) => setQuery(e.target.value)} />
          {query && <button onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#b3b3b3] hover:text-white"><X className="w-4 h-4" /></button>}
        </div>
      </header>
      <div className="px-2 pt-4">
        <div className="flex items-center justify-between mb-3 px-3">
          {debouncedQuery.trim() ? <h2 className="text-sm font-bold text-white">Results for <span className="text-primary">"{debouncedQuery}"</span></h2> : <h2 className="text-sm font-bold text-white">Suggested</h2>}
          <span className="text-xs text-[#b3b3b3]">{data?.tracks?.length || 0} tracks</span>
        </div>
        {isLoading ? (
          <div className="space-y-1 px-1">{[...Array(10)].map((_, i) => (<div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl animate-pulse"><div className="w-12 h-12 bg-white/10 rounded-md shrink-0" /><div className="flex-1 space-y-2"><div className="h-3.5 bg-white/10 rounded w-3/4" /><div className="h-3 bg-white/10 rounded w-1/2" /></div></div>))}</div>
        ) : error ? (
          <div className="text-center py-16 mx-4 bg-white/5 rounded-2xl"><p className="text-red-400 font-semibold">Search failed</p><p className="text-[#b3b3b3] text-sm mt-1">Try a different term</p></div>
        ) : data?.tracks?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center"><div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4"><Music className="w-8 h-8 text-[#b3b3b3]" /></div><h3 className="text-lg font-display font-bold text-white">No results found</h3><p className="text-[#b3b3b3] text-sm mt-1 max-w-xs mx-auto">Try different keywords</p></div>
        ) : (
          <div className="space-y-0.5">{data?.tracks?.map((track, idx) => (<TrackRow key={track.id} track={track} index={idx} queue={data.tracks} />))}</div>
        )}
      </div>
    </div>
  );
}
