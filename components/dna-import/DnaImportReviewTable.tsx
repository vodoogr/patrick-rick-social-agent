"use client";

import React from "react";
import { ImportDiffResult } from "@/services/creative-dna-import-service";
import { CheckCircle2, AlertTriangle, Plus, PenTool, SkipForward, Disc3 } from "lucide-react";

export function DnaImportReviewTable({ diffData }: { diffData: ImportDiffResult }) {
  
  if (!diffData || diffData.songRows.length === 0) return null;

  const albumHasUpdates = Object.keys(diffData.albumUpdates).length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-white mb-1">{diffData.totalUpdates}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Updates</span>
        </div>
        <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-white mb-1">{diffData.totalCreates}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">Creates</span>
        </div>
        <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-white mb-1">{diffData.totalSkips}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Skipped</span>
        </div>
        <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
          <span className={`text-3xl font-bold mb-1 ${diffData.hasErrors ? 'text-red-400' : 'text-green-500'}`}>
            {diffData.hasErrors ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-widest ${diffData.hasErrors ? 'text-red-400' : 'text-green-500'}`}>
            {diffData.hasErrors ? "Warnings" : "Valid"}
          </span>
        </div>
      </div>

      {/* Album Level Review */}
      {albumHasUpdates && (
        <div className="glass p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center gap-3 text-white/80">
            <Disc3 className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Album Metadata Overrides</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium">
             {Object.entries(diffData.albumUpdates).map(([key, value]) => (
                <div key={key} className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </div>
                  <div className="truncate text-white/80">
                    {Array.isArray(value) ? value.join(", ") : String(value)}
                  </div>
                </div>
             ))}
          </div>
        </div>
      )}

      {/* Songs Table */}
      <div className="glass rounded-3xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-white/40">
                <th className="p-4 font-bold">Action</th>
                <th className="p-4 font-bold">Trk</th>
                <th className="p-4 font-bold">Song Title</th>
                <th className="p-4 font-bold">DNA Elements</th>
                <th className="p-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {diffData.songRows.map((row, idx) => {
                const ActionIcon = row.action === 'create' ? Plus : row.action === 'update' ? PenTool : SkipForward;
                const activeColor = row.action === 'create' ? 'text-green-400 bg-green-400/10 border-green-400/20' : 
                                  row.action === 'update' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' : 
                                  'text-white/40 bg-white/5 border-white/10';

                const dnaFeatures = [
                  row.emotionalSummary ? "Summary" : null,
                  row.visualIdentity ? "Visual Id" : null,
                  row.themes?.length ? "Themes" : null,
                  row.visualKeywords?.length ? "Keywords" : null,
                ].filter(Boolean);

                return (
                  <tr key={idx} className="hover:bg-white/5 transition-colors text-sm">
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${activeColor}`}>
                        <ActionIcon className="w-3 h-3" />
                        {row.action}
                      </span>
                    </td>
                    <td className="p-4 text-white/60 font-mono text-xs">{row.trackNumber || "—"}</td>
                    <td className="p-4 font-medium text-white/90">{row.songTitle || "—"}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5">
                        {dnaFeatures.length > 0 ? dnaFeatures.map(f => (
                          <span key={f} className="px-2 py-0.5 rounded border border-white/10 bg-white/5 text-[9px] uppercase tracking-wider text-white/60">
                            {f}
                          </span>
                        )) : (
                          <span className="text-[10px] text-white/30 italic">No DNA provided</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {row.warnings.length > 0 ? (
                        <div className="flex items-center gap-2 text-red-400 text-xs">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{row.warnings[0]}</span>
                        </div>
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-green-500/50" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
