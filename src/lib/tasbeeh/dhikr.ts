/**
 * The adhkar offered by the tasbeeh counter.
 *
 * Kept in a plain module, NOT in actions.ts: a "use server" file keeps its
 * contents on the server, so a list exported from there never reaches the
 * browser — the counter received nothing and the page crashed on load.
 */
export type DhikrOption = {
  id: string;
  arabic: string;
  translit: string;
  meaning: string;
};

export const DHIKR: DhikrOption[] = [
  { id: "subhanallah", arabic: "سُبْحَانَ ٱللَّٰه", translit: "SubhanAllah", meaning: "Glory be to Allah" },
  { id: "alhamdulillah", arabic: "ٱلْحَمْدُ لِلَّٰه", translit: "Alhamdulillah", meaning: "All praise is for Allah" },
  { id: "allahuakbar", arabic: "ٱللَّٰهُ أَكْبَر", translit: "Allahu Akbar", meaning: "Allah is the greatest" },
  { id: "tahlil", arabic: "لَا إِلَٰهَ إِلَّا ٱللَّٰه", translit: "La ilaha illa Allah", meaning: "There is no god but Allah" },
  { id: "istighfar", arabic: "أَسْتَغْفِرُ ٱللَّٰه", translit: "Astaghfirullah", meaning: "I seek forgiveness from Allah" },
];
