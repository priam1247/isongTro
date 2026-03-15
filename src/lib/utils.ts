import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(ms: number): string {
  if (!ms || isNaN(ms)) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatNumber(num: number | null | undefined): string {
  if (!num) return "0";
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}

export function getArtworkUrl(url?: string | null): string {
  if (!url) return "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=400&h=400&fit=crop";
  // Often SC artwork is returned as 'large' which is 100x100. We can replace it with 't500x500' for better quality.
  return url.replace("-large", "-t500x500");
}
