/**
 * QR Code Utility Functions
 * Uses the 'qrcode' library to generate high-resolution QR codes containing tokens.
 */
import QRCode from 'qrcode';

import { getPublicVerifyUrl } from './privacy';

/**
 * Generates a Data URL (base64 image) of a QR code containing the specified text or token.
 * @param text - The content to encode in the QR code (e.g. qr_token or full url)
 * @returns Promise with base64 PNG data URL
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  // If text is a token like LV-DOC-..., encode full verification URL so scanning opens the page directly
  const contentToEncode = text.startsWith('http') ? text : getPublicVerifyUrl(text);

  return await QRCode.toDataURL(contentToEncode, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 320,
    color: {
      dark: '#064e3b', // Deep Government Emerald
      light: '#ffffff', // Clean white
    },
  });
}

/**
 * Triggers a browser download of a QR code image as PNG.
 * @param dataUrl - Base64 Data URL of the QR code
 * @param filename - File name for the downloaded image
 */
export function downloadQrImage(dataUrl: string, filename = 'landverify-qr.png'): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
