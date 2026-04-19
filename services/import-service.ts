import { DriveFile, AlbumImportPreview, TrackCandidate, CoverCandidate } from '@/types/import';
import { AlbumService } from './album-service';
import { SongService } from './song-service';

export const ImportService = {
  /**
   * Parse a drive folder and its files into a structured AlbumImportPreview MVP.
   */
  async mapFolderToPreview(folderMetadata: DriveFile, files: DriveFile[]): Promise<AlbumImportPreview> {
    const albumTitle = folderMetadata.name;
    const audioFiles: DriveFile[] = [];
    const imageFiles: DriveFile[] = [];
    const otherFiles: DriveFile[] = [];

    files.forEach(file => {
      const mime = file.mimeType?.toLowerCase() || '';
      const nameL = file.name.toLowerCase();
      
      const isAudioExt = nameL.endsWith('.mp3') || nameL.endsWith('.wav') || nameL.endsWith('.flac') || nameL.endsWith('.m4a') || nameL.endsWith('.aac') || nameL.endsWith('.ogg');
      const isImageExt = nameL.endsWith('.jpg') || nameL.endsWith('.jpeg') || nameL.endsWith('.png') || nameL.endsWith('.webp');

      if (mime.includes('audio') || isAudioExt) {
        audioFiles.push(file);
      } else if (mime.includes('image') || isImageExt) {
        imageFiles.push(file);
      } else {
        otherFiles.push(file);
      }
    });

    // Determine Album Cover Candidate
    let coverCandidate: CoverCandidate | null = null;
    if (imageFiles.length > 0) {
      // Find one named exactly "cover" or "COVER" (without extension)
      const exactCover = imageFiles.find(i => {
         const n = i.name.toLowerCase().replace(/\.[^/.]+$/, "");
         return n === 'cover';
      });
      
      // If exact cover found, assign it. If not, don't blindly take imageFiles[0], unless there's only 1 image maybe? The prompt said: "la caratula por defecto del album debe ser el archivo llamado COVER o cover"
      if (exactCover) {
        coverCandidate = { driveFile: exactCover, isConfirmed: true };
      }
    }

    /**
     * Extracts the pure "essence" of a name for matching purposes.
     * Strips: extension, track numbers, parenthetical tags like (Remastered),
     * suffixes like _cover, and normalizes to lowercase alphanumeric only.
     */
    const extractEssence = (filename: string, stripCoverSuffix: boolean = false): string => {
      let name = filename;
      // 1. Remove file extension
      name = name.replace(/\.[^/.]+$/, '');
      // 2. Remove leading track numbers like "5.", "01-", "12 - ", etc.
      name = name.replace(/^\d+[\s.\-_]+/, '');
      // 3. Remove parenthetical/bracketed tags: (Remastered), [Bonus Track], etc.
      name = name.replace(/\s*[\(\[][^\)\]]*[\)\]]\s*/g, '');
      // 4. If requested, remove cover/caratula suffix (for image files)
      if (stripCoverSuffix) {
        name = name.replace(/[\s_\-]*(cover|caratula)\s*$/i, '');
      }
      // 5. Normalize to lowercase, only keep letters and numbers
      return name.toLowerCase().replace(/[^a-z0-9]/g, '');
    };

    // Determine Tracks
    const trackCandidates: TrackCandidate[] = audioFiles.map(file => {
      let trackNum: number | null = null;
      let title = file.name.replace(/\.(mp3|wav|flac|m4a|aac|ogg)$/i, '');

      // Try to extract initial numbers
      const match = title.match(/(?:.*-\s*)?0*(\d+)[\s-_\.]+(.*)$/);
      if (match) {
        trackNum = parseInt(match[1], 10);
        title = match[2].trim();
      }
      
      const isSpecial = file.name.toLowerCase().match(/(bonus|special|extra)/);
      if (isSpecial) {
         if (trackNum !== null) trackNum += 100;
         else trackNum = 999;
      }

      // Extract the pure essence of the song name
      const songEssence = extractEssence(file.name);

      // Find matching cover image
      const trackCover = imageFiles.find(img => {
        // Skip the album cover
        if (coverCandidate && img.id === coverCandidate.driveFile.id) return false;
        
        const imgEssence = extractEssence(img.name, true); // strip _cover suffix
        
        // Direct essence match (most reliable)
        if (songEssence === imgEssence) return true;
        
        // One contains the other (handles minor differences)
        if (songEssence.includes(imgEssence) || imgEssence.includes(songEssence)) return true;
        
        return false;
      });

      return {
        driveFile: file,
        inferredTitle: title,
        inferredTrackNumber: trackNum,
        status: 'new',
        coverCandidate: trackCover ? { driveFile: trackCover, isConfirmed: true } : null
      };

    });



    // Populate otherFiles
    imageFiles.forEach(img => {
      const isAlbumCover = coverCandidate && img.id === coverCandidate.driveFile.id;
      const isTrackCover = trackCandidates.some(tc => tc.coverCandidate && tc.coverCandidate.driveFile.id === img.id);
      if (!isAlbumCover && !isTrackCover) {
        otherFiles.push(img);
      }
    });

    // Try to detect existing matched Album
    let albumStatus: 'new' | 'update' = 'new';
    let existingAlbumId: string | undefined;

    // 1. Check for existing matched Album
    const possibleAlbums = await AlbumService.getAll();
    const matchedAlbum = possibleAlbums.find(a => a.drive_folder_id === folderMetadata.id || a.title.toLowerCase() === albumTitle.toLowerCase());
    
    if (matchedAlbum) {
      albumStatus = 'update';
      existingAlbumId = matchedAlbum.id;
    }

    // 2. Check for existing matched Songs globally
    const allSongs = await SongService.getAll();
    trackCandidates.forEach(tc => {
      // Find by drive_file_id first (safest), then by title within matched album
      const matchingSong = allSongs.find(s => 
        (s.drive_file_id && s.drive_file_id === tc.driveFile.id) || 
        (matchedAlbum && s.album_id === matchedAlbum.id && s.title.toLowerCase() === tc.inferredTitle.toLowerCase())
      );

      if (matchingSong) {
        tc.status = 'update';
        tc.existingSongId = matchingSong.id;
      }
    });

    // Sort tracks logically
    trackCandidates.sort((a, b) => {
      if (a.inferredTrackNumber !== null && b.inferredTrackNumber !== null) {
        return a.inferredTrackNumber - b.inferredTrackNumber;
      }
      return a.inferredTitle.localeCompare(b.inferredTitle);
    });

    return {
      folderId: folderMetadata.id,
      inferredAlbumTitle: albumTitle,
      coverCandidate,
      trackCandidates,
      otherFiles,
      status: albumStatus,
      existingAlbumId
    };
  }
};
