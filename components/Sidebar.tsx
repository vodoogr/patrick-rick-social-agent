"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Music, 
  Target, 
  Send, 
  Library, 
  Settings, 
  Layers,
  LogOut
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useEffect, useState } from "react";
import { ProfileService } from "@/services/profile-service";
import { Profile } from "@/types";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Songs", href: "/songs", icon: Music },
  { name: "Campaigns", href: "/campaigns", icon: Target },
  { name: "Posts", href: "/posts", icon: Send },
  { name: "Queue", href: "/queue", icon: Layers },
  { name: "Assets", href: "/assets", icon: Library },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      const data = await ProfileService.getCurrent();
      setProfile(data);
    }
    fetchProfile();
  }, []);

  const handleSignOut = () => {
    ProfileService.signOut();
  };

  return (
    <aside className="w-64 glass border-r border-white/10 h-screen fixed left-0 top-0 z-50 flex flex-col">
      <div className="p-8 text-center sm:text-left">
        <h1 className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent transform hover:scale-105 transition-transform duration-500 cursor-default">
          PATRICK RICK
        </h1>
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mt-1 font-black">SOCIAL AGENT</p>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 custom-scrollbar overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                isActive 
                  ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-50" />
              )}
              <item.icon className={cn("w-5 h-5 relative z-10", isActive ? "text-white" : "text-white/40 group-hover:text-white")} />
              <span className="font-bold text-sm tracking-tight relative z-10">{item.name}</span>
              {isActive && (
                <div className="ml-auto w-1 h-1 rounded-full bg-white shadow-[0_0_8px_white] relative z-10" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3 p-4 rounded-[24px] bg-white/5 border border-white/5 group hover:border-white/10 transition-all duration-500 relative">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-xs font-black shadow-inner border border-white/5">
            {profile?.display_name?.substring(0, 2).toUpperCase() || profile?.email?.substring(0, 1).toUpperCase() || '??'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black truncate text-white tracking-tight">
              {profile?.display_name || profile?.email?.split('@')[0] || 'Loading...'}
            </p>
            <p className="text-[9px] text-white/30 truncate font-bold uppercase tracking-widest italic group-hover:text-white/50 transition-colors">
              Session Active
            </p>
          </div>
          <button 
            onClick={handleSignOut}
            className="p-2 rounded-xl text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all duration-300"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
