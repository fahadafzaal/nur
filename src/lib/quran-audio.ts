/**
 * Mishary Rashid Alafasy recitation, served by the Islamic Network CDN.
 * One file per ayah, addressed by the ayah's global number (1..6236).
 * Shared by server and client code, so it lives outside quran.ts.
 */
export function ayahAudioUrl(globalNumber: number, bitrate: 64 | 128 = 128) {
  return `https://cdn.islamic.network/quran/audio/${bitrate}/ar.alafasy/${globalNumber}.mp3`;
}

/** Western digits → Arabic-Indic, for verse-end markers. */
export function toArabicDigits(n: number) {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
