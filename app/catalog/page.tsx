"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Music2, Play, Filter, ChevronDown, Check, Disc3, Loader2, Target, Type } from "lucide-react";
import { SongService } from "@/services/song-service";
import { AlbumService } from "@/services/album-service";
import { AssetService } from "@/services/asset-service";
import { Song, Album, SongEra } from "@/types";
import { CampaignStatus } from "@/types/enums";
import { LoadingState } from "@/components/ui/LoadingState";
import Link from "next/link";

export default function CatalogPage() {
  const [viewMode, setViewMode] = useState<"songs" | "albums">("songs");
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [filteredAlbums, setFilteredAlbums] = useState<Album[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [eraFilter, setEraFilter] = useState<SongEra | null>(null);
  const [albumFilter, setAlbumFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showEraDropdown, setShowEraDropdown] = useState(false);
  const [showAlbumDropdown, setShowAlbumDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const fetchSongs = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(0);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 0 : page;
      const result = await SongService.search(query, {
        era: eraFilter ?? undefined,
        albumId: albumFilter ?? undefined,
        campaignStatus: statusFilter ?? undefined,
        page: currentPage,
      });

      if (reset) {
        setSongs(result.songs);
      } else {
        setSongs(prev => [...prev, ...result.songs]);
      }
      setTotal(result.total);
    } catch (err) {
      console.error("Catalog search error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [query, eraFilter, albumFilter, statusFilter, page]);

  useEffect(() => {
    if (viewMode === "songs") {
      fetchSongs(true);
    }
  }, [query, eraFilter, albumFilter, statusFilter, viewMode]);

  useEffect(() => {
    AlbumService.getAll().then(setAlbums).catch(console.error);
  }, []);

  useEffect(() => {
    if (viewMode === "albums") {
      AlbumService.search(query, eraFilter ?? undefined)
        .then(setFilteredAlbums)
        .catch(console.error);
    }
  }, [query, eraFilter, viewMode]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    // Trigger fetch manually for next page
    SongService.search(query, {
      era: eraFilter ?? undefined,
      albumId: albumFilter ?? undefined,
      campaignStatus: statusFilter ?? undefined,
      page: nextPage,
    }).then(result => {
      setSongs(prev => [...prev, ...result.songs]);
      setTotal(result.total);
    }).catch(console.error);
  };

  const hasMore = songs.length < total;

  if (loading) return <LoadingState />;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Catalog</h2>
          <p className="text-white/40 text-sm mt-1">Search and browse the complete discography.</p>
        </div>
        
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 w-fit">
          <button
            onClick={() => { setViewMode("songs"); setPage(0); }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${
              viewMode === "songs" ? "bg-white text-zinc-950" : "text-white/40 hover:text-white"
            }`}
          >
            Songs
          </button>
          <button
            onClick={() => { setViewMode("albums"); setPage(0); setAlbumFilter(null); setStatusFilter(null); }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${
              viewMode === "albums" ? "bg-white text-zinc-950" : "text-white/40 hover:text-white"
            }`}
          >
            Albums
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder={`Search ${viewMode}...`}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>

        {/* Era Filter */}
        <div className="relative">
          <button
            onClick={() => { setShowEraDropdown(!showEraDropdown); setShowAlbumDropdown(false); setShowStatusDropdown(false); }}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors whitespace-nowrap"
          >
            <Filter className="w-4 h-4 text-white/30" />
            {eraFilter ? `${eraFilter} Era` : "All Eras"}
            <ChevronDown className="w-3 h-3 text-white/30" />
          </button>
          {showEraDropdown && (
            <div className="absolute top-full mt-2 right-0 z-50 w-48 glass border border-white/10 rounded-2xl p-2 space-y-1 shadow-2xl">
              <button
                onClick={() => { setEraFilter(null); setShowEraDropdown(false); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors flex items-center justify-between"
              >
                All Eras {!eraFilter && <Check className="w-3 h-3 text-green-500" />}
              </button>
              {Object.values(SongEra).map(era => (
                <button
                  key={era}
                  onClick={() => { setEraFilter(era); setShowEraDropdown(false); }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors flex items-center justify-between capitalize"
                >
                  {era} Era {eraFilter === era && <Check className="w-3 h-3 text-green-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Album Filter (Only in Songs Mode) */}
        {viewMode === "songs" && (
          <div className="relative">
            <button
              onClick={() => { setShowAlbumDropdown(!showAlbumDropdown); setShowEraDropdown(false); setShowStatusDropdown(false); }}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors whitespace-nowrap"
            >
            <Disc3 className="w-4 h-4 text-white/30" />
            {albumFilter ? albums.find(a => a.id === albumFilter)?.title || "Album" : "All Albums"}
            <ChevronDown className="w-3 h-3 text-white/30" />
          </button>
          {showAlbumDropdown && (
            <div className="absolute top-full mt-2 right-0 z-50 w-56 glass border border-white/10 rounded-2xl p-2 space-y-1 shadow-2xl max-h-64 overflow-y-auto custom-scrollbar">
              <button
                onClick={() => { setAlbumFilter(null); setShowAlbumDropdown(false); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors flex items-center justify-between"
              >
                All Albums {!albumFilter && <Check className="w-3 h-3 text-green-500" />}
              </button>
              {albums.map(album => (
                <button
                  key={album.id}
                  onClick={() => { setAlbumFilter(album.id); setShowAlbumDropdown(false); }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors flex items-center justify-between truncate"
                >
                  <span className="truncate">{album.title}</span>
                  {albumFilter === album.id && <Check className="w-3 h-3 text-green-500 flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Campaign Status Filter (Only in Songs Mode) */}
        {viewMode === "songs" && (
          <div className="relative">
            <button
              onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowEraDropdown(false); setShowAlbumDropdown(false); }}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              <Target className="w-4 h-4 text-white/30" />
              {statusFilter ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}` : "All Statuses"}
              <ChevronDown className="w-3 h-3 text-white/30" />
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full mt-2 right-0 z-50 w-48 glass border border-white/10 rounded-2xl p-2 space-y-1 shadow-2xl max-h-64 overflow-y-auto custom-scrollbar">
                <button
                  onClick={() => { setStatusFilter(null); setShowStatusDropdown(false); }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  All Statuses {!statusFilter && <Check className="w-3 h-3 text-green-500" />}
                </button>
                {Object.values(CampaignStatus).map(status => (
                  <button
                    key={status}
                    onClick={() => { setStatusFilter(status); setShowStatusDropdown(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors flex items-center justify-between truncate capitalize"
                  >
                    <span className="truncate">{status}</span>
                    {statusFilter === status && <Check className="w-3 h-3 text-green-500 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/30 font-bold uppercase tracking-widest">
          {viewMode === "songs" ? `${total} ${total === 1 ? "track" : "tracks"}` : `${filteredAlbums.length} ${filteredAlbums.length === 1 ? "album" : "albums"}`} found
        </p>
      </div>

      {/* Grid */}
      {viewMode === "songs" ? (
        songs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {songs.map(song => (
            <Link key={song.id} href={`/songs/${song.id}`}>
              <div className="glass border border-white/5 rounded-3xl p-5 group hover:border-white/20 transition-all cursor-pointer">
                <div className="relative aspect-square rounded-2xl bg-white/5 mb-4 overflow-hidden flex items-center justify-center">
                  {song.cover_path ? (
                    <img
                      src={song.cover_path.startsWith('http') ? song.cover_path : AssetService.getPublicUrl(song.cover_path)}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : null}
                  <Music2 className={`w-10 h-10 text-white/10 group-hover:scale-110 transition-transform duration-500 ${song.cover_path ? 'hidden' : ''}`} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white text-zinc-950 flex items-center justify-center translate-y-4 group-hover:translate-y-0 transition-transform">
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm truncate">{song.title}</h4>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                    {song.era} Era {song.album ? `• ${song.album}` : ''}
                  </p>
                </div>
                {/* Asset Indicators */}
                <div className="mt-3 flex items-center gap-2">
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${song.audio_path ? 'border-green-500/30 text-green-500/70 bg-green-500/10' : 'border-white/10 text-white/20 bg-white/5'}`}>
                    Audio {song.audio_path ? '✓' : '✗'}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${song.cover_path ? 'border-green-500/30 text-green-500/70 bg-green-500/10' : 'border-white/10 text-white/20 bg-white/5'}`}>
                    Cover {song.cover_path ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Music2 className="w-16 h-16 text-white/10 mb-4" />
          <h3 className="text-xl font-bold mb-2 text-white/40">No tracks found</h3>
          <p className="text-sm text-white/20">Try adjusting your search or filters.</p>
        </div>
      )) : (
        filteredAlbums.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAlbums.map(album => (
              <Link key={album.id} href={`/albums/${album.id}`}>
                <div className="glass border border-white/5 rounded-3xl p-5 group hover:border-white/20 transition-all cursor-pointer">
                  <div className="relative aspect-square rounded-2xl bg-white/5 mb-4 overflow-hidden flex items-center justify-center">
                    {album.cover_path ? (
                      <img
                        src={album.cover_path.startsWith('http') ? album.cover_path : AssetService.getPublicUrl(album.cover_path)}
                        alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : null}
                    <Disc3 className={`w-10 h-10 text-white/10 group-hover:rotate-12 transition-transform duration-500 ${album.cover_path ? 'hidden' : ''}`} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-lg truncate">{album.title}</h4>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                      {album.era} Era {album.release_year ? `• ${album.release_year}` : ''}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Disc3 className="w-16 h-16 text-white/10 mb-4" />
            <h3 className="text-xl font-bold mb-2 text-white/40">No albums found</h3>
            <p className="text-sm text-white/20">Try adjusting your search or filters.</p>
          </div>
        )
      )}

      {/* Load More (Only for Songs) */}
      {viewMode === "songs" && hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-8 py-3 rounded-2xl border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
