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
  Layers 
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

  return (
    <aside className="w-64 glass border-r border-white/10 h-screen fixed left-0 top-0 z-50 flex flex-col">
      <div className="p-8">
        <h1 className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          PATRICK RICK
        </h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mt-1">SOCIAL AGENT</p>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                isActive 
                  ? "bg-white/10 text-white" 
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-white/40 group-hover:text-white")} />
              <span className="font-medium">{item.name}</span>
              {isActive && (
                <div className="ml-auto w-1 h-1 rounded-full bg-white shadow-[0_0_8px_white]" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-white/10">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
          <div className="w-10 h-10 rounded-full bg-era-blue flex items-center justify-center text-sm font-bold">
            PR
          </div>
          <div>
            <p className="text-xs font-semibold">Patrick Rick</p>
            <p className="text-[10px] text-white/40">ADMIN MODE</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
