"use server"

import { AlbumService } from "@/services/album-service";
import { SongService } from "@/services/song-service";
import { AlbumImportData, SongImportRow } from "@/services/creative-dna-import-service";
import { SongEra } from "@/types";

export async function executeDnaImport(
  albumId: string,
  albumUpdates: AlbumImportData,
  songRows: SongImportRow[]
) {
  try {
    // 1. Fetch current Album to merge DNA safely
    const currentAlbum = await AlbumService.getById(albumId);
    if (!currentAlbum) throw new Error("Album not found");

    // 2. Update Album Data
    const albumMetaUpdates: any = {};
    if (albumUpdates.albumTitle) albumMetaUpdates.title = albumUpdates.albumTitle;
    if (albumUpdates.era) albumMetaUpdates.era = albumUpdates.era;
    
    if (Object.keys(albumMetaUpdates).length > 0) {
      await AlbumService.update(albumId, albumMetaUpdates);
    }

    // 3. Update Album Creative DNA (merge)
    const currentAlbumDna = currentAlbum.creative_dna || {};
    const newAlbumDna = { ...currentAlbumDna };
    
    if (albumUpdates.narrativeSummary !== undefined) newAlbumDna.narrative_summary = albumUpdates.narrativeSummary;
    if (albumUpdates.visualIdentity !== undefined) newAlbumDna.visual_identity = albumUpdates.visualIdentity;
    if (albumUpdates.canonicalPhrase !== undefined) newAlbumDna.canonical_phrase = albumUpdates.canonicalPhrase;
    if (albumUpdates.emotionalDirection !== undefined) newAlbumDna.emotional_direction = albumUpdates.emotionalDirection;
    if (albumUpdates.visualKeywords !== undefined) newAlbumDna.visual_keywords = albumUpdates.visualKeywords;
    if (albumUpdates.promptNotes !== undefined) newAlbumDna.prompt_notes = albumUpdates.promptNotes;

    await AlbumService.updateCreativeDNA(albumId, newAlbumDna);

    // 4. Process Songs
    for (const row of songRows) {
      if (row.action === 'skip') continue;

      const songMetaUpdates: any = {};
      if (row.songTitle) songMetaUpdates.title = row.songTitle;
      if (row.trackNumber !== undefined) songMetaUpdates.track_number = row.trackNumber;
      if (row.emotionalSummary !== undefined) songMetaUpdates.emotional_summary = row.emotionalSummary;
      if (row.visualIdentity !== undefined) songMetaUpdates.visual_identity = row.visualIdentity;
      if (row.canonicalPhrase !== undefined) songMetaUpdates.canonical_phrase = row.canonicalPhrase;

      const songDnaUpdates: any = {};
      if (row.emotionalSummary !== undefined) songDnaUpdates.emotional_summary = row.emotionalSummary;
      if (row.visualIdentity !== undefined) songDnaUpdates.visual_identity = row.visualIdentity;
      if (row.canonicalPhrase !== undefined) songDnaUpdates.canonical_phrase = row.canonicalPhrase;
      if (row.themes !== undefined) songDnaUpdates.themes = row.themes;
      if (row.symbolism !== undefined) songDnaUpdates.symbolism = row.symbolism;
      if (row.visualKeywords !== undefined) songDnaUpdates.visual_keywords = row.visualKeywords;
      if (row.campaignTone !== undefined) songDnaUpdates.campaign_tone = row.campaignTone;
      if (row.promptNotes !== undefined) songDnaUpdates.prompt_notes = row.promptNotes;

      if (row.action === 'update' && row.originalSong) {
        // Update existing song
        if (Object.keys(songMetaUpdates).length > 0) {
          await SongService.update(row.originalSong.id, songMetaUpdates);
        }

        const currentSongDna = row.originalSong.creative_dna || {};
        const newSongDna = { ...currentSongDna, ...songDnaUpdates };
        await SongService.updateCreativeDNA(row.originalSong.id, newSongDna);

      } else if (row.action === 'create' && row.songTitle) {
        // Create new song
        const baseEra: SongEra = albumUpdates.era ? (albumUpdates.era as SongEra) : currentAlbum.era;
        
        const newSong = await SongService.create({
          album_id: albumId,
          owner_id: currentAlbum.owner_id,
          title: row.songTitle,
          slug: row.songTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          era: baseEra,
          track_number: row.trackNumber,
          is_active: true,
          creative_dna: songDnaUpdates,
          ...songMetaUpdates
        });
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("executeDnaImport failed:", error);
    return { success: false, error: error.message };
  }
}
