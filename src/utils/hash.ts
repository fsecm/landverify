/**
 * Cryptographic Utility Functions
 * Uses the native browser Web Crypto API (SubtleCrypto) to calculate SHA-256 digests.
 * No external cryptography libraries required.
 */

/**
 * Converts an ArrayBuffer to a lowercase hexadecimal string.
 * @param buffer - The raw binary hash buffer
 * @returns 64-character lowercase hexadecimal hash string
 */
export function bufferToHex(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  const hexCodes: string[] = [];
  for (let i = 0; i < byteArray.length; i++) {
    const byte = byteArray[i];
    const hex = byte.toString(16).padStart(2, '0');
    hexCodes.push(hex);
  }
  return hexCodes.join('');
}

/**
 * Computes the SHA-256 hash of a string (UTF-8 encoded).
 * Used for hash-chain calculations: SHA-256(prevHash + plotId + deedId + eventType + createdAt).
 * @param message - Text to hash
 * @returns Promise resolving to 64-character hex SHA-256 hash
 */
export async function computeStringHash(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

/**
 * Computes the SHA-256 hash of a file or Blob uploaded in the browser.
 * Reads the raw byte stream to ensure bit-exact document fingerprinting.
 * @param file - File or Blob object
 * @returns Promise resolving to 64-character hex SHA-256 hash
 */
export async function computeFileHash(file: File | Blob): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  return bufferToHex(hashBuffer);
}

/**
 * Compares two SHA-256 hashes in a case-insensitive manner.
 * @param hashA - First hash
 * @param hashB - Second hash
 * @returns boolean indicating whether hashes are identical
 */
export function compareHashes(hashA: string, hashB: string): boolean {
  if (!hashA || !hashB) return false;
  return hashA.trim().toLowerCase() === hashB.trim().toLowerCase();
}

/**
 * Formats a 64-character SHA-256 hash for display with truncation or spacing.
 * @param hash - Full 64-character hex hash
 * @param start - Characters to show at start (default 8)
 * @param end - Characters to show at end (default 8)
 */
export function formatHashShort(hash: string, start = 8, end = 8): string {
  if (!hash || hash.length <= start + end) return hash;
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}
