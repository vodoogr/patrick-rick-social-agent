"use client";

import { useEffect, useState } from "react";
import { Bell, Shield, Smartphone, Globe, Save, RefreshCw } from "lucide-react";
import { SettingService } from "@/services/setting-service";
import { AppSettings, PublishMode } from "@/types";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await SettingService.get();
      setSettings(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      await SettingService.update(settings);
      alert("Settings saved successfully");
    } catch (err: any) {
      alert("Failed to save settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const togglePlatform = (key: keyof AppSettings) => {
    if (!settings) return;
    const value = settings[key];
    if (typeof value === 'boolean') {
      setSettings({ ...settings, [key]: !value as any });
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={fetchData} />;
  if (!settings) return null;

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
               <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-blue-400" />
               </div>
               <div>
                  <h4 className="font-bold">Campaign Automation</h4>
                  <p className="text-xs text-white/40">Define how the engine generates daily content.</p>
               </div>
            </div>

            <div className="space-y-6">
               <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div>
                    <p className="text-sm font-semibold">Publishing Mode</p>
                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1">
                      {settings.publish_mode === PublishMode.AUTO ? "Fully Autonomous" : "Manual Approval Required"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSettings({ ...settings, publish_mode: PublishMode.AUTO })}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${settings.publish_mode === PublishMode.AUTO ? 'bg-white text-zinc-950 shadow-lg' : 'bg-white/5 text-white/40'}`}
                    >
                      Auto
                    </button>
                    <button 
                      onClick={() => setSettings({ ...settings, publish_mode: PublishMode.APPROVAL })}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${settings.publish_mode === PublishMode.APPROVAL ? 'bg-white text-zinc-950 shadow-lg' : 'bg-white/5 text-white/40'}`}
                    >
                      Approval
                    </button>
                  </div>
               </div>

               <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div>
                    <p className="text-sm font-semibold">Daily Generation Time</p>
                    <p className="text-[10px] text-white/40">Hour of the day to process new narrative posts.</p>
                  </div>
                  <div className="text-xl font-black text-white/20">
                    {settings.daily_post_time || "10:00"}
                  </div>
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
                  <h4 className="font-bold">Active Social Hubs</h4>
                  <p className="text-xs text-white/40">Enable or disable delivery platforms.</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {[
                 { label: 'TikTok', key: 'enable_tiktok' as const },
                 { label: 'Instagram', key: 'enable_instagram_reels' as const },
                 { label: 'YouTube', key: 'enable_youtube_shorts' as const },
               ].map((platform) => {
                 const isEnabled = settings[platform.key];
                 return (
                   <div key={platform.key} className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-4 ${isEnabled ? 'bg-white/5 border-white/20 shadow-xl' : 'bg-white/[0.02] border-white/5 opacity-40'}`}
                        onClick={() => togglePlatform(platform.key)}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isEnabled ? 'bg-white/10' : 'bg-white/5 opacity-50'}`}>
                        <Smartphone className={`w-6 h-6 ${isEnabled ? 'text-white' : 'text-white/20'}`} />
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest">{platform.label}</p>
                      <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${isEnabled ? 'text-green-400' : 'text-zinc-600'}`}>
                        {isEnabled ? "Active" : "Silenced"}
                      </div>
                   </div>
                 );
               })}
            </div>
         </div>

         <div className="flex items-center justify-end gap-4">
            <button className="px-6 py-3 rounded-2xl glass border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-white/30">
              Clear Cache
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 rounded-2xl bg-white text-zinc-950 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] disabled:opacity-50"
            >
              {saving ? "Saving..." : <><Save className="w-4 h-4" /> Save System DNA</>}
            </button>
         </div>
      </div>
    </div>
  );
}

