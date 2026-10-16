import CryptoJS from 'crypto-js';

export function sha256(message: string): string {
  return CryptoJS.SHA256(message).toString(CryptoJS.enc.Hex);
}
