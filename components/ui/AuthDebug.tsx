"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Shield, User, Mail, Database } from "lucide-react";

export function AuthDebug() {
  const [sessionInfo, setSessionInfo] = useState<{
    id: string | null;
    email: string | null;
    hasSession: boolean;
    loading: boolean;
  }>({
    id: null,
    email: null,
    hasSession: false,
    loading: true,
  });

  useEffect(() => {
    async function getSession() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setSessionInfo({
          id: session.user.id,
          email: session.user.email || "No email",
          hasSession: true,
          loading: false,
        });
      } else {
        setSessionInfo({
          id: null,
          email: null,
          hasSession: false,
          loading: false,
        });
      }
    }

    getSession();
  }, []);

  if (sessionInfo.loading) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-zinc-900/90 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl max-w-xs animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
        <Shield className="w-4 h-4 text-yellow-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Auth Debug Mode</span>
      </div>
      
      <div className="space-y-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-white/40">
            <User className="w-3 h-3" />
            <span className="text-[9px] font-bold uppercase tracking-tighter">User ID</span>
          </div>
          <code className="text-[10px] bg-black/50 p-1.5 rounded border border-white/5 block break-all font-mono text-blue-400">
            {sessionInfo.id || "NULL (Not Logged In)"}
          </code>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-white/40">
            <Mail className="w-3 h-3" />
            <span className="text-[9px] font-bold uppercase tracking-tighter">Email</span>
          </div>
          <p className="text-[10px] font-medium text-white/80">
            {sessionInfo.email || "—"}
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <div className={`w-2 h-2 rounded-full ${sessionInfo.hasSession ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[10px] font-bold text-white/60">
            {sessionInfo.hasSession ? 'ACTIVE SESSION' : 'NO SESSION'}
          </span>
        </div>
      </div>
    </div>
  );
}
