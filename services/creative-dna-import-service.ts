import Papa from 'papaparse';
import { AlbumWithSongs, Song } from '@/types';

export type ImportAction = 'create' | 'update' | 'skip';

export interface SongImportRow {
  action: ImportAction;
  originalSong?: Song;
  
  // Parsed and clean data
  trackNumber?: number;
  songTitle?: string;
  
  // Root metadata overrides
  emotionalSummary?: string;
  visualIdentity?: string;
  canonicalPhrase?: string;
  
  // Deep creative DNA overrides
  themes?: string[];
  symbolism?: string[];
  visualKeywords?: string[];
  campaignTone?: string;
  promptNotes?: string;
  
  warnings: string[];
}

export interface AlbumImportData {
  albumTitle?: string;
  era?: string;
  narrativeSummary?: string;
  visualIdentity?: string;
  canonicalPhrase?: string;
  emotionalDirection?: string;
  visualKeywords?: string[];
  promptNotes?: string;
}

export interface ImportDiffResult {
  albumUpdates: AlbumImportData;
  songRows: SongImportRow[];
  totalUpdates: number;
  totalCreates: number;
  totalSkips: number;
  hasErrors: boolean;
}

export class CreativeDnaImportService {
  
  static parseCsv(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.error('CSV Parsing errors:', results.errors);
          }
          resolve(results.data);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  static diffImportData(album: AlbumWithSongs, rows: any[]): ImportDiffResult {
    const result: ImportDiffResult = {
      albumUpdates: {},
      songRows: [],
      totalUpdates: 0,
      totalCreates: 0,
      totalSkips: 0,
      hasErrors: false,
    };

    if (!rows || rows.length === 0) return result;

    const currentSongs = album.songs || [];

    // Assuming the CSV structure might be flat, we extract album updates from the first row if present.
    const firstRow = rows[0];
    
    // Attempt extract album data (only looking at first row to represent album state)
    if (firstRow['album_title'] || firstRow['Album Title']) result.albumUpdates.albumTitle = firstRow['album_title'] || firstRow['Album Title'];
    if (firstRow['era'] || firstRow['Era']) result.albumUpdates.era = firstRow['era'] || firstRow['Era'];
    if (firstRow['narrative_summary'] || firstRow['Narrative Summary']) result.albumUpdates.narrativeSummary = firstRow['narrative_summary'] || firstRow['Narrative Summary'];
    if (firstRow['visual_identity'] || firstRow['Visual Identity']) result.albumUpdates.visualIdentity = firstRow['visual_identity'] || firstRow['Visual Identity'];
    if (firstRow['canonical_phrase'] || firstRow['Canonical Phrase']) result.albumUpdates.canonicalPhrase = firstRow['canonical_phrase'] || firstRow['Canonical Phrase'];
    if (firstRow['emotional_direction'] || firstRow['Emotional Direction']) result.albumUpdates.emotionalDirection = firstRow['emotional_direction'] || firstRow['Emotional Direction'];
    if (firstRow['visual_keywords'] || firstRow['Visual Keywords']) {
      const kw = firstRow['visual_keywords'] || firstRow['Visual Keywords'];
      result.albumUpdates.visualKeywords = kw.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (firstRow['prompt_notes'] || firstRow['Prompt Notes']) result.albumUpdates.promptNotes = firstRow['prompt_notes'] || firstRow['Prompt Notes'];

    for (const row of rows) {
      const rawTrack = row['track_number'] || row['Track Number'];
      const trackNumber = rawTrack ? parseInt(String(rawTrack), 10) : undefined;
      const songTitle = (row['song_title'] || row['Song Title'] || '').trim();

      // Skip empty or invalid rows silently
      if (!songTitle && !trackNumber) {
        continue;
      }

      const songRow: SongImportRow = {
        action: 'skip',
        warnings: [],
        trackNumber: isNaN(trackNumber as number) ? undefined : trackNumber,
        songTitle: songTitle || undefined,
        emotionalSummary: row['emotional_summary'] || row['Emotional Summary'],
        visualIdentity: row['visual_identity'] || row['Visual Identity'],
        canonicalPhrase: row['canonical_phrase'] || row['Canonical Phrase'],
        campaignTone: row['campaign_tone'] || row['Campaign Tone'],
        promptNotes: row['prompt_notes'] || row['Prompt Notes'],
      };

      if (row['themes'] || row['Themes']) {
        songRow.themes = String(row['themes'] || row['Themes']).split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      if (row['symbolism'] || row['Symbolism']) {
        songRow.symbolism = String(row['symbolism'] || row['Symbolism']).split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      if (row['visual_keywords'] || row['Visual Keywords']) {
        songRow.visualKeywords = String(row['visual_keywords'] || row['Visual Keywords']).split(',').map((s: string) => s.trim()).filter(Boolean);
      }

      // Matching Strategy
      let matchedSong = undefined;
      
      // 1. By Track Number
      if (songRow.trackNumber !== undefined) {
        matchedSong = currentSongs.find(s => s.track_number === songRow.trackNumber);
      }
      
      // 2. By Title (case insensitive)
      if (!matchedSong && songRow.songTitle) {
        matchedSong = currentSongs.find(s => s.title.toLowerCase() === songRow.songTitle!.toLowerCase());
      }

      if (matchedSong) {
        songRow.action = 'update';
        songRow.originalSong = matchedSong;
        result.totalUpdates++;
      } else {
        songRow.action = 'create';
        result.totalCreates++;
        
        if (!songRow.songTitle) {
          songRow.warnings.push('Song title missing. Creation might fail.');
          songRow.action = 'skip';
          result.totalCreates--;
          result.totalSkips++;
          result.hasErrors = true;
        }
      }

      result.songRows.push(songRow);
    }

    return result;
  }
}
