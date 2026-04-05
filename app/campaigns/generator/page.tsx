"use client";

import { useEffect, useState } from "react";
import { CampaignGeneratorPanel } from "@/components/campaign/CampaignGeneratorPanel";
import { useSearchParams } from "next/navigation";

export default function AICampaignGeneratorPage() {
  const searchParams = useSearchParams();
  const songId = searchParams.get("song_id");

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">AI Campaign Generator</h2>
        <p className="text-white/40 text-sm mt-1">Generate comprehensive campaign assets directly from Creative DNA.</p>
      </div>
      
      <div className="pt-4">
        <CampaignGeneratorPanel initialSongId={songId || undefined} />
      </div>
    </div>
  );
}
