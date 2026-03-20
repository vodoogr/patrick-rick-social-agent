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

    // Determine Cover Candidate
    let coverCandidate: CoverCandidate | null = null;
    if (imageFiles.length > 0) {
      // Find one named "cover" or take the first
      const exactCover = imageFiles.find(i => i.name.toLowerCase().includes('cover'));
      coverCandidate = {
        driveFile: exactCover || imageFiles[0],
        isConfirmed: true
      };
      
      // Put non-cover images back into otherFiles
      imageFiles.forEach(img => {
        if (img.id !== coverCandidate!.driveFile.id) {
          otherFiles.push(img);
        }
      });
    }

    // Determine Tracks
    const trackCandidates: TrackCandidate[] = audioFiles.map(file => {
      // Very basic parsing: "01 - Title.mp3", "1. Title.WAV", "Title.mp3"
      let trackNum: number | null = null;
      let title = file.name.replace(/\.(mp3|wav|flac|m4a)$/i, '');

      // Try to extract initial numbers
      const match = title.match(/^0*(\d+)[\s-_\.]+(.*)$/);
      if (match) {
        trackNum = parseInt(match[1], 10);
        title = match[2].trim();
      }

      return {
        driveFile: file,
        inferredTitle: title,
        inferredTrackNumber: trackNum,
        status: 'new' // To be updated below,
      };
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
