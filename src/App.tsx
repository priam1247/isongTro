import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/BottomNav";
import { PlayerBar } from "@/components/PlayerBar";
import { NowPlaying } from "@/components/NowPlaying";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { usePlayerStore } from "@/store/use-player-store";
import Home from "@/pages/Home";
import Search from "@/pages/Search";
import Favourites from "@/pages/Favourites";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000 } }
});

// Exact original AudioEngine
function AudioEngine() {
  const { seek } = useAudioPlayer();
  const setSeek = usePlayerStore((s) => s.setSeek);
  useEffect(() => { setSeek(seek); }, [seek, setSeek]);
  return null;
}

function AppRouter() {
  return (
    <div className="min-h-screen w-full bg-[#050505] flex items-start justify-center">
      <div className="relative w-full max-w-[430px] h-screen flex flex-col bg-background text-foreground overflow-hidden shadow-2xl">
        <AudioEngine />
        <main className="flex-1 overflow-y-auto">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/search" component={Search} />
            <Route path="/favourites" component={Favourites} />
            <Route component={NotFound} />
          </Switch>
        </main>
        <PlayerBar />
        <BottomNav />
        <NowPlaying />
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppRouter />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
