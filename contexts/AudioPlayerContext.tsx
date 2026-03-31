"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Song, Album } from "@/types";
import { X, Music2 } from "lucide-react";
import { AssetService } from "@/services/asset-service";

interface AudioPlayerContextType {
  playSong: (song: Song, album?: Partial<Album>) => void;
  stopSong: () => void;
  playingSong: Song | null;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  return context;
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [playingSong, setPlayingSong] = useState<Song | null>(null);
  const [albumContext, setAlbumContext] = useState<Partial<Album> | null>(null);

  const playSong = (song: Song, album?: Partial<Album>) => {
    setPlayingSong(song);
    if (album) setAlbumContext(album);
  };

  const stopSong = () => {
    setPlayingSong(null);
    setAlbumContext(null);
  };

  // Derive audio url: If we have an uploaded direct path that is not drive, use it. Otherwise stream via our native proxy API.
  let audioSrc = "";
  if (playingSong) {
      if (playingSong.audio_path && !playingSong.audio_path.includes("drive.google.com")) {
          audioSrc = playingSong.audio_path;
      } else if (playingSong.drive_file_id) {
          audioSrc = `/api/stream/${playingSong.drive_file_id}`;
      } else {
          // Fallback if no drive ID but has a raw google URL
          audioSrc = playingSong.audio_path || "";
      }
  }

  return (
    <AudioPlayerContext.Provider value={{ playSong, stopSong, playingSong }}>
      {children}
      
      {/* Global Sticky Audio Player */}
      {playingSong && audioSrc && (
        <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 z-50 animate-in slide-in-from-bottom-full duration-500">
          <div className="max-w-4xl mx-auto">
            <div className="glass border border-white/10 rounded-3xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-zinc-950/90 backdrop-blur-3xl">
               <div className="flex-1 flex items-center gap-4 w-full">
                 {playingSong.cover_path || albumContext?.cover_path ? (
                    <img 
                      src={playingSong.cover_path ? (playingSong.cover_path.startsWith('http') ? playingSong.cover_path : AssetService.getPublicUrl(playingSong.cover_path)) : (albumContext?.cover_path?.startsWith('http') ? albumContext.cover_path : AssetService.getPublicUrl(albumContext?.cover_path || ''))} 
                      alt="Cover" 
                      className="w-12 h-12 rounded-xl object-cover border border-white/10" 
                    />
                 ) : (
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                      <Music2 className="w-5 h-5 text-white/20"/>
                    </div>
                 )}
                 <div className="min-w-0 flex-1">
                   <p className="font-bold text-sm text-white truncate">{playingSong.title}</p>
                   <p className="text-[10px] text-white/50 truncate font-bold uppercase tracking-widest">{albumContext?.title || "Unknown Album"}</p>
                 </div>
               </div>
               
               <div className="flex-[2] w-full">
                 <audio 
                   controls 
                   autoPlay 
                   src={audioSrc} 
                   className="w-full h-10 outline-none opacity-80 hover:opacity-100 transition-opacity" 
                   controlsList="nodownload" 
                 />
               </div>
               
               <button 
                 onClick={stopSong} 
                 className="w-10 h-10 flex-shrink-0 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white/40 hover:text-white"
                 title="Close Player"
               >
                 <X className="w-5 h-5"/>
               </button>
            </div>
          </div>
        </div>
      )}
    </AudioPlayerContext.Provider>
  );
}
