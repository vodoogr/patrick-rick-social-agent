"use server"

import { DriveService } from '@/services/drive-service';
import { ImportService } from '@/services/import-service';
import { AlbumImportPreview } from '@/types/import';

/**
 * Server Action to generate a preview from a given Drive folder ID.
 */
export async function generateImportPreview(folderId: string): Promise<AlbumImportPreview> {
  try {
    // 1. Fetch metadata & files from Google Drive API
    const metadata = await DriveService.getFolderMetadata(folderId);
    if (!metadata || metadata.mimeType !== 'application/vnd.google-apps.folder') {
      throw new Error("Provided ID is not a Google Drive folder.");
    }

    const files = await DriveService.getFolderContents(folderId);

    // 2. Map files to Patrick Rick models
    const preview = await ImportService.mapFolderToPreview(metadata, files);
    
    return preview;
  } catch (err: any) {
    console.error("Error generating import preview:", err);
    throw new Error(err.message || "Failed to parse Google Drive folder.");
  }
}
