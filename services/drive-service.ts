import { DriveFile } from '@/types/import';

export const DriveService = {
  /**
   * Get basic metadata for a folder.
   */
  async getFolderMetadata(folderId: string): Promise<DriveFile> {
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_DRIVE_API_KEY is not configured in .env");

    const url = `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType,thumbnailLink,webContentLink,webViewLink&key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) throw new Error("Folder not found or API key does not have access.");
      const text = await response.text();
      throw new Error(`Drive API Error (${response.status}): ${text}`);
    }

    return await response.json();
  },

  /**
   * List all files inside a folder.
   */
  async getFolderContents(folderId: string): Promise<DriveFile[]> {
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_DRIVE_API_KEY is not configured in .env");

    const query = `'${folderId}' in parents and trashed = false`;
    const fields = `files(id,name,mimeType,size,thumbnailLink,webContentLink,webViewLink)`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&pageSize=1000&key=${apiKey}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Drive API Error (${response.status}): ${text}`);
    }

    const data = await response.json();
    return data.files || [];
  }
};
