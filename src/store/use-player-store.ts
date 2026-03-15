import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Track } from "@/lib/api-client";

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  nowPlayingOpen: boolean;
  shuffle: boolean;
  repeat: boolean;
  favourites: Track[];
  seek: (time: number) => void;

  playTrack: (track: Track, queue?: Track[]) => void;
  playNext: () => void;
  playPrev: () => void;
  togglePlay: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleFavourite: (track: Track) => void;
  isFavourite: (id: number) => boolean;
  setPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  setNowPlayingOpen: (open: boolean) => void;
  setSeek: (fn: (time: number) => void) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      queue: [],
      isPlaying: false,
      volume: 0.8,
      progress: 0,
      duration: 0,
      nowPlayingOpen: false,
      shuffle: false,
      repeat: false,
      favourites: [],
      seek: () => {},

      playTrack: (track: Track, queue?: Track[]) => {
        const { currentTrack, isPlaying } = get();
        if (currentTrack?.id === track.id) {
          set({ isPlaying: !isPlaying });
        } else {
          set({ currentTrack: track, isPlaying: true, progress: 0, duration: track.duration / 1000, queue: queue ?? get().queue });
        }
      },

      playNext: () => {
        const { currentTrack, queue, shuffle, repeat, seek } = get();
        if (!currentTrack) return;
        if (repeat) { seek(0); set({ isPlaying: true }); return; }
        if (queue.length === 0) return;
        const idx = queue.findIndex((t) => t.id === currentTrack.id);
        const nextIdx = shuffle ? Math.floor(Math.random() * queue.length) : (idx + 1) % queue.length;
        const next = queue[nextIdx];
        set({ currentTrack: next, isPlaying: true, progress: 0, duration: next.duration / 1000 });
      },

      playPrev: () => {
        const { currentTrack, queue, progress, seek } = get();
        if (!currentTrack) return;
        if (progress > 3) { seek(0); return; }
        if (queue.length === 0) return;
        const idx = queue.findIndex((t) => t.id === currentTrack.id);
        const prevIdx = (idx - 1 + queue.length) % queue.length;
        const prev = queue[prevIdx];
        set({ currentTrack: prev, isPlaying: true, progress: 0, duration: prev.duration / 1000 });
      },

      togglePlay: () => {
        const { currentTrack, isPlaying } = get();
        if (!currentTrack) return;
        set({ isPlaying: !isPlaying });
      },

      toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
      toggleRepeat: () => set((s) => ({ repeat: !s.repeat })),

      toggleFavourite: (track: Track) => {
        const { favourites } = get();
        const exists = favourites.some((f) => f.id === track.id);
        set({ favourites: exists ? favourites.filter((f) => f.id !== track.id) : [...favourites, track] });
      },

      isFavourite: (id: number) => get().favourites.some((f) => f.id === id),

      setPlaying: (playing) => set({ isPlaying: playing }),
      setVolume: (volume) => set({ volume }),
      setProgress: (progress) => set({ progress }),
      setDuration: (duration) => set({ duration }),
      setNowPlayingOpen: (open) => set({ nowPlayingOpen: open }),
      setSeek: (fn) => set({ seek: fn }),
    }),
    {
      name: "isongz-player",
      partialize: (s) => ({ favourites: s.favourites, volume: s.volume, shuffle: s.shuffle, repeat: s.repeat }),
    }
  )
);
