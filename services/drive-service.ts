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
    let allFiles: DriveFile[] = data.files || [];
    
    // Handle recursive folders natively
    const subfolders = allFiles.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
    const flatFiles = allFiles.filter(f => f.mimeType !== 'application/vnd.google-apps.folder');
    
    // Let's recurse for any subfolders found
    const nestedPromises = subfolders.map(async sub => {
       const children = await DriveService.getFolderContents(sub.id);
       children.forEach(c => {
         c.name = `${sub.name} - ${c.name}`;
       });
       return children;
    });
    const nestedResults = await Promise.all(nestedPromises);
    
    for (const res of nestedResults) {
       flatFiles.push(...res);
    }
    
    return flatFiles;
  }
};
