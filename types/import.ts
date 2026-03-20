export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number | string;
  thumbnailLink?: string;
  webContentLink?: string;
  webViewLink?: string;
}

export interface TrackCandidate {
  driveFile: DriveFile;
  inferredTitle: string;
  inferredTrackNumber: number | null;
  status: 'new' | 'update' | 'skip';
  existingSongId?: string;
}

export interface CoverCandidate {
  driveFile: DriveFile;
  isConfirmed: boolean;
}

export interface AlbumImportPreview {
  folderId: string;
  inferredAlbumTitle: string;
  coverCandidate: CoverCandidate | null;
  trackCandidates: TrackCandidate[];
  otherFiles: DriveFile[];
  status: 'new' | 'update';
  existingAlbumId?: string;
}
