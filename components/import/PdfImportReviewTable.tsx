"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, FileText, Music } from "lucide-react";

interface ReviewTableProps {
  preview: any; // Using any here for quick dev, adapt to proper Type later
  onUpdateTrackStatus: (index: number, status: 'create' | 'update' | 'skip') => void;
  onUpdateTrackField: (index: number, field: string, value: any) => void;
}

export function PdfImportReviewTable({ preview, onUpdateTrackStatus, onUpdateTrackField }: ReviewTableProps) {
  if (!preview) return null;

  return (
    <div className="space-y-8">
      {/* Album Preview */}
      <div className="glass p-6 rounded-2xl space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 text-white">
          <FileText className="w-5 h-5 text-purple-400" />
          Album Metadata Extracted
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Title</span>
            <p className="font-medium">{preview.albumUpdates.albumTitle || <span className="text-white/30 italic">Not found</span>}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Era</span>
            <p className="font-medium">{preview.albumUpdates.era || <span className="text-white/30 italic">Not found</span>}</p>
          </div>
          <div className="space-y-1 col-span-full">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Narrative Summary</span>
            <p className="font-medium text-white/80 leading-relaxed text-xs">
              {preview.albumUpdates.narrativeSummary?.substring(0, 150)}{preview.albumUpdates.narrativeSummary?.length > 150 ? '...' : ''}
              {!preview.albumUpdates.narrativeSummary && <span className="text-white/30 italic">Not found</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Songs Preview */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Music className="w-5 h-5 text-blue-400" />
          Extracted Song DNA ({preview.songRows.length})
        </h3>
        
        <div className="glass rounded-xl overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-widest font-bold text-white/40">
                <tr>
                  <th className="px-4 py-3 w-12">#</th>
                  <th className="px-4 py-3">Song Title</th>
                  <th className="px-4 py-3 text-center">Action</th>
                  <th className="px-4 py-3">Warnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {preview.songRows.map((track: any, i: number) => (
                  <tr key={i} className={`transition-colors ${track.action === 'skip' ? 'text-white/40 bg-black/20' : 'hover:bg-white/5'}`}>
                    <td className="px-4 py-3 w-12 font-medium">
                      {track.trackNumber || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        className="bg-transparent border-b border-white/10 focus:border-white/50 focus:outline-none w-full max-w-[200px]"
                        value={track.songTitle || ''} 
                        onChange={(e) => onUpdateTrackField(i, 'songTitle', e.target.value)}
                        disabled={track.action === 'skip'}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select 
                        value={track.action}
                        onChange={(e) => onUpdateTrackStatus(i, e.target.value as any)}
                        className={`bg-black/50 border rounded px-2 py-1 text-xs font-bold uppercase tracking-wider outline-none cursor-pointer ${
                          track.action === 'create' ? 'border-green-500/50 text-green-400' :
                          track.action === 'update' ? 'border-blue-500/50 text-blue-400' :
                          'border-white/20 text-white/50'
                        }`}
                      >
                        <option value="create">Create</option>
                        <option value="update">Update</option>
                        <option value="skip">Skip</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {track.warnings?.length > 0 ? (
                        <div className="flex items-center gap-1 text-orange-400 text-xs">
                          <AlertCircle className="w-3 h-3" />
                          <span>{track.warnings[0]}</span>
                        </div>
                      ) : (
                        <span className="text-white/20 text-xs italic">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
