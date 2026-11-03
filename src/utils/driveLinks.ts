/**
 * Google Drive link parsing and URL handling helpers.
 */

export function extractDriveFileId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  // Patterns like drive.google.com/file/d/<FILE_ID>/view or /preview or ?...
  const filePattern = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const matchFile = url.match(filePattern);
  if (matchFile && matchFile[1]) {
    return matchFile[1];
  }

  // Patterns like drive.google.com/open?id=<FILE_ID> or uc?id=<FILE_ID>
  const idParamPattern = /[?&]id=([a-zA-Z0-9_-]+)/;
  const matchId = url.match(idParamPattern);
  if (matchId && matchId[1]) {
    return matchId[1];
  }

  return null;
}

/**
 * Returns direct download link for Google Drive files, or the fallback url for standard https links.
 */
export function getDriveDownloadUrl(url: string): string {
  if (!url) return '';
  const fileId = extractDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  return url;
}

/**
 * Validates that the drive link is a valid https URL.
 */
export function isValidDriveUrl(url: string): boolean {
  if (!url) return true; // optional
  const trimmed = url.trim();
  return trimmed.startsWith('https://');
}
