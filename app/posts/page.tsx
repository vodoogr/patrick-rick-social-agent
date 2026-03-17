"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Filter, MoreHorizontal, CheckCircle2, Clock, AlertCircle, Eye, Edit3, Send, Calendar } from "lucide-react";
import { PostService } from "@/services/post-service";
import { GeneratedPost, PostStatus } from "@/types";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { format } from "date-fns";

const statusStyles: Record<PostStatus, string> = {
  [PostStatus.PUBLISHED]: "bg-green-500/10 text-green-400 border-green-500/20",
  [PostStatus.SCHEDULED]: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  [PostStatus.QUEUED]: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  [PostStatus.GENERATED]: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  [PostStatus.DRAFT]: "bg-white/5 text-white/40 border-white/10",
  [PostStatus.FAILED]: "bg-red-500/10 text-red-400 border-red-500/20",
  [PostStatus.CANCELLED]: "bg-zinc-800 text-zinc-500 border-zinc-700",
};

export default function PostsPage() {
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [filter, setFilter] = useState<PostStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await PostService.getQueue();
      setPosts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      await PostService.approve(id);
      await fetchData();
    } catch (err: any) {
      alert("Approval failed: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPosts = filter === "ALL" ? posts : posts.filter(p => p.status === filter);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={fetchData} />;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Content Queue</h2>
          <p className="text-white/40 text-sm mt-1">Review, edit, and manage all generated social assets.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="h-11 pl-10 pr-6 rounded-2xl glass border border-white/10 font-bold text-sm bg-transparent appearance-none hover:bg-white/5 transition-all outline-none"
            >
              <option value="ALL">All Status</option>
              {Object.values(PostStatus).map(status => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredPosts.length > 0 ? (
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
              {filteredPosts.map((post) => (
                <tr key={post.id} className="group hover:bg-white/5 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                         <Send className="w-5 h-5 text-white/20" />
                      </div>
                      <div>
                        {/* Note: campaign/song details might need population in getQueue if not already there */}
                        <p className="text-sm font-bold">{post.hook || "Generated Narrative"}</p>
                        <p className="text-[10px] text-white/40 uppercase font-black">Day {post.campaign_day}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${statusStyles[post.status]}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-white/60">
                      <Calendar className="w-3 h-3 opacity-40" />
                      <p className="text-xs font-medium">
                        {post.scheduled_for ? format(new Date(post.scheduled_for), "MMM dd, HH:mm") : "Unscheduled"}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Multi-Platform</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-2">
                      {post.status === PostStatus.GENERATED && (
                        <button 
                          onClick={() => handleApprove(post.id)}
                          disabled={actionLoading === post.id}
                          className="h-9 px-4 rounded-xl bg-white text-zinc-950 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-50"
                        >
                          {actionLoading === post.id ? "..." : "Approve"}
                        </button>
                      )}
                      <button className="p-2 rounded-xl glass border border-white/10 hover:bg-white/10 transition-all">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-xl glass border border-white/10 hover:bg-white/10 transition-all text-white/20 hover:text-white">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState 
          icon={Clock}
          title="Queue is empty"
          description={filter !== "ALL" ? `No posts found with status ${filter}.` : "The editorial queue is currently empty. Content will appear here as your active campaign progresses."}
          action={filter !== "ALL" ? { label: "Show All", onClick: () => setFilter("ALL") } : undefined}
        />
      )}
    </div>
  );
}

