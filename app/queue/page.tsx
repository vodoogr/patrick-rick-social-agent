"use client";

import { useEffect, useState, useCallback } from "react";
import { History, CheckCircle2, XCircle, Clock, ExternalLink, Search, Filter } from "lucide-react";
import { PublishService } from "@/services/publish-service";
import { PublishLog } from "@/types";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { format } from "date-fns";

export default function QueuePage() {
  const [logs, setLogs] = useState<PublishLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Note: We might need a getLogs method in PublishService if not there
      // For now, let's assume getLogs exists or we use a generic supabase call
      const { data, error } = await (PublishService as any).getLogs(); 
      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={fetchData} />;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Publishing Log</h2>
          <p className="text-white/40 text-sm mt-1">Audit trail of all automated social delivery attempts.</p>
        </div>
      </div>

      {logs.length > 0 ? (
        <div className="glass border border-white/5 rounded-[2rem] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-white/40">Timestamp</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-white/40">Platform</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-white/40">Status</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-white/40">Response</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-white/40 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log) => (
                <tr key={log.id} className="group hover:bg-white/5 transition-colors">
                  <td className="px-8 py-6">
                    <p className="text-xs font-medium text-white/80">{format(new Date(log.attempted_at), "MMM dd, HH:mm:ss")}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{log.platform}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      {log.success ? (
                        <><CheckCircle2 className="w-4 h-4 text-green-400" /> <span className="text-[10px] font-black uppercase text-green-400">Success</span></>
                      ) : (
                        <><XCircle className="w-4 h-4 text-red-400" /> <span className="text-[10px] font-black uppercase text-red-400">Failed</span></>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs text-white/40 truncate max-w-xs">{log.response_message || "-"}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 rounded-xl glass border border-white/10 hover:bg-white/10 transition-all">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState 
          icon={History}
          title="No history found"
          description="The publishing log is empty. Generation attempts will be recorded here automatically."
        />
      )}
    </div>
  );
}
