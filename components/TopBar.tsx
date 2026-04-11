"use client";

import { useEffect, useState } from "react";
import { Plus, Radio, Search, Bell } from "lucide-react";
import { CampaignService } from "@/services/campaign-service";
import { useLanguage } from "@/contexts/LanguageContext";
import { Campaign } from "@/types";

export function TopBar() {
  const { t, language, setLanguage } = useLanguage();
  const [activeCampaign, setActiveCampaign] = useState<any | null>(null);

  useEffect(() => {
    async function fetchActive() {
      const campaign = await CampaignService.getActive();
      setActiveCampaign(campaign);
    }
    fetchActive();
    
    // Refresh occasionally or on an event (simplification)
    const interval = setInterval(fetchActive, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-20 glass border-b border-white/10 sticky top-0 z-40 px-8 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-0.5">{t('topbar.current_campaign')}</span>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold">{activeCampaign?.songs?.title || t('topbar.no_active_campaign')}</h2>
            {activeCampaign && (
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold border border-white/10 text-white/60">
                {t('topbar.day')} {activeCampaign.day_number || 1}
              </span>
            )}
          </div>
        </div>

        <div className="h-10 w-px bg-white/10" />

        <div className="flex flex-col">
           <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-0.5">{t('topbar.narrative_pulse')}</span>
           <div className="flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${activeCampaign ? 'bg-green-500 animate-pulse' : 'bg-zinc-700'}`} />
             <span className="text-xs font-bold tracking-widest uppercase">
               {activeCampaign ? activeCampaign.status : t('topbar.idle')}
             </span>
           </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative group">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white transition-colors" />
          <input 
            type="text" 
            placeholder={t('topbar.search')}
            className="h-10 w-64 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 text-xs focus:outline-none focus:border-white/20 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
           <button className="h-10 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest transition-all">
             {t('topbar.system_pause')}
           </button>
           <button className="h-10 px-6 rounded-xl bg-white text-black hover:bg-zinc-200 text-[10px] font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center gap-2">
             <Plus className="w-3.5 h-3.5" />
             {t('topbar.new_campaign')}
           </button>
        </div>

        <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-full">
           <button 
             onClick={() => setLanguage('en')}
             className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all ${language === 'en' ? 'bg-white/20 scale-110 shadow-lg' : 'opacity-50 hover:opacity-100'}`}
             title="English"
           >
             🇬🇧
           </button>
           <button 
             onClick={() => setLanguage('es')}
             className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all ${language === 'es' ? 'bg-white/20 scale-110 shadow-lg' : 'opacity-50 hover:opacity-100'}`}
             title="Español"
           >
             🇪🇸
           </button>
        </div>

        <div className="h-6 w-px bg-white/10" />
        
        <button className="relative p-2 text-white/50 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-600" />
        </button>
      </div>
    </header>
  );
}
