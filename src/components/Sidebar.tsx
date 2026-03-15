import React from "react";
import { Link, useLocation } from "wouter";
import { Home, Search, Compass, Library, Heart, ListMusic, AudioWaveform } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Search", href: "/search", icon: Search },
    { name: "Trending", href: "/#trending", icon: Compass },
  ];

  const libraryItems = [
    { name: "Liked Tracks", href: "/#liked", icon: Heart },
    { name: "Playlists", href: "/#playlists", icon: ListMusic },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-full bg-card/50 border-r border-border backdrop-blur-3xl shrink-0 p-6">
      <div className="flex items-center gap-3 mb-10 text-primary">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-lg shadow-primary/20">
          <AudioWaveform className="w-5 h-5 text-white" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-foreground">SoundStream</span>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-2">Discover</p>
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href} className="block">
                  <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}>
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-2">Your Library</p>
          <div className="space-y-1">
            {libraryItems.map((item) => (
              <Link key={item.name} href={item.href} className="block">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-auto pt-6 border-t border-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden">
            {/* abstract avatar stock photo */}
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" alt="User" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Guest User</p>
            <p className="text-xs text-muted-foreground">Free Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
