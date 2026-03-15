import React from "react";
import { Link, useLocation } from "wouter";
import { Home, Search, Heart } from "lucide-react";

export function BottomNav() {
  const [location] = useLocation();
  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Search", href: "/search", icon: Search },
    { name: "Favourites", href: "/favourites", icon: Heart },
  ];
  return (
    <nav className="flex items-center justify-around bg-card border-t border-border px-2 py-2 pb-safe shrink-0">
      {navItems.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.name} href={item.href} className="flex-1">
            <div className={`flex flex-col items-center gap-1 py-1 transition-colors ${isActive ? "text-white" : "text-[#b3b3b3]"}`}>
              <item.icon className={`w-6 h-6 ${isActive ? (item.name === "Favourites" ? "fill-primary text-primary" : "fill-white stroke-white") : ""}`} />
              <span className={`text-[10px] font-semibold tracking-wide ${isActive ? "text-white" : "text-[#b3b3b3]"}`}>{item.name}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
