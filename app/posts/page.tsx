"use client";

import { Search, Filter, MoreHorizontal, CheckCircle2, Clock, AlertCircle, Eye, Edit3, Send } from "lucide-react";

const posts = [
  { id: 1, song: "Blue Night City", angle: "Atmospheric Teaser", status: "Published", date: "Mar 16, 2026", platform: "TikTok" },
  { id: 2, song: "Blue Night City", angle: "Lyric Fragment", status: "Published", date: "Mar 17, 2026", platform: "Instagram" },
  { id: 3, song: "Blue Night City", angle: "Emotional Hook", status: "Queued", date: "Today", platform: "YouTube" },
  { id: 4, song: "Golden Rebirth", angle: "Cinematic Visual", status: "Draft", date: "Mar 18, 2026", platform: "TikTok" },
];

const statusStyles = {
  Published: "bg-green-500/20 text-green-400 border-green-500/20",
  Queued: "bg-blue-500/20 text-blue-400 border-blue-500/20",
  Draft: "bg-white/10 text-white/40 border-white/10",
  Failed: "bg-red-500/20 text-red-400 border-red-500/20",
};

export default function PostsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Content Queue</h2>
          <p className="text-white/40 text-sm mt-1">Review, edit, and manage all generated social assets.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-11 px-6 rounded-2xl glass border border-white/10 font-bold flex items-center gap-2 hover:bg-white/5 transition-all text-sm">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      <div className="glass border border-white/5 rounded-[2rem] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-white/40">Song & Angle</th>
              <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-white/40">Status</th>
              <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-white/40">Scheduled</th>
              <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-white/40">Platform</th>
              <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-white/40 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {posts.map((post) => (
              <tr key={post.id} className="group hover:bg-white/5 transition-colors cursor-pointer">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-era-blue/20 flex items-center justify-center">
                       <Send className="w-5 h-5 text-white/30" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{post.song}</p>
                      <p className="text-[10px] text-white/40 uppercase font-black">{post.angle}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${(statusStyles as any)[post.status]}`}>
                    {post.status}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <p className="text-xs font-medium text-white/60">{post.date}</p>
                </td>
                <td className="px-8 py-6">
                  <p className="text-xs font-bold">{post.platform}</p>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 rounded-xl glass border border-white/10 hover:bg-white/10 transition-all">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-xl glass border border-white/10 hover:bg-white/10 transition-all">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-xl glass border border-white/10 hover:bg-white/10 transition-all">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
