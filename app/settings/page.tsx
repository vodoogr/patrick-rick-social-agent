"use client";

import { Bell, Shield, Smartphone, Globe, Save, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
        <p className="text-white/40 text-sm mt-1">Configure global automation rules and platform integrations.</p>
      </div>

      <div className="space-y-6">
         {/* General Automation */}
         <div className="glass border border-white/5 rounded-[2rem] p-8 space-y-8">
            <div className="flex items-center gap-4 mb-2">
               <div className="w-10 h-10 rounded-xl bg-era-blue/20 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-era-blue" />
               </div>
               <div>
                  <h4 className="font-bold">Campaign Automation</h4>
                  <p className="text-xs text-white/40">Define how the engine generates daily content.</p>
               </div>
            </div>

            <div className="space-y-6">
               <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div>
                    <p className="text-sm font-semibold">Auto-Publish Mode</p>
                    <p className="text-[10px] text-white/40">Posts will be published immediately after generation.</p>
                  </div>
                  <div className="w-12 h-6 rounded-full bg-white/10 relative cursor-pointer">
                     <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white/20" />
                  </div>
               </div>

               <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div>
                    <p className="text-sm font-semibold">Daily Generation Time</p>
                    <p className="text-[10px] text-white/40">Select the hour of the day to process new posts.</p>
                  </div>
                  <input type="time" defaultValue="10:00" className="bg-black border border-white/10 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-white/20" />
               </div>
            </div>
         </div>

         {/* Platform Integrations */}
         <div className="glass border border-white/5 rounded-[2rem] p-8 space-y-8">
            <div className="flex items-center gap-4 mb-2">
               <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-purple-400" />
               </div>
               <div>
                  <h4 className="font-bold">Social Platforms</h4>
                  <p className="text-xs text-white/40">Manage API connections and default formatting.</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {['TikTok', 'Instagram', 'YouTube'].map((platform) => (
                 <div key={platform} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" />
                    <p className="text-xs font-bold">{platform}</p>
                    <button className="text-[10px] uppercase font-black text-blue-400">Connected</button>
                 </div>
               ))}
            </div>
         </div>

         <div className="flex items-center justify-end gap-4">
            <button className="px-6 py-3 rounded-2xl glass border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
              Reset Defaults
            </button>
            <button className="px-8 py-3 rounded-2xl bg-white text-black text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/90 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)]">
              <Save className="w-4 h-4" /> Save Configuration
            </button>
         </div>
      </div>
    </div>
  );
}
