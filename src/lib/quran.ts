import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Qur'an data, read from src/data/quran/ (see scripts/fetch-quran.mjs).
 *
 * Server-only: this is read while pages are prerendered at build time, so
 * the 2.9MB of text never ships to the browser as JavaScript — each surah
 * page carries only its own verses.
 */

export type SurahMeta = {
  number: number;
  arabic: string;
  name: string;
  meaning: string;
  ayahs: number;
  revelation: "Meccan" | "Medinan";
};

export type Ayah = {
  n: number;
  g: number;
  ar: string;
  en: string;
  juz: number;
  page: number;
  sajda: boolean;
};

/** In the index `ayahs` is a count; in a loaded surah it is the verses. */
export type Surah = Omit<SurahMeta, "ayahs"> & {
  ayahs: Ayah[];
  bismillah: boolean;
};

const DATA_DIR = path.join(process.cwd(), "src", "data", "quran");

export async function getSurahIndex(): Promise<SurahMeta[]> {
  return JSON.parse(await readFile(path.join(DATA_DIR, "index.json"), "utf8"));
}

/**
 * Strips Arabic diacritics and tatweel so two spellings of the same words
 * compare equal. Used only to *detect* the Bismillah — displayed text is
 * never altered this way.
 */
function bare(text: string) {
  return text.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "");
}

const BISMILLAH_BARE = bare("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ");

/**
 * Every surah except Al-Fatiha and At-Tawbah opens with the Bismillah as a
 * prefix of its first ayah in the source text. Qur'an readers conventionally
 * show it as a header instead, so it is lifted off ayah 1 here.
 *
 * Compared word-by-word with diacritics set aside, because surahs 95 and 97
 * spell it with an additional shadda (بِّسْمِ) — an exact string match
 * misses those two and would render the Bismillah twice.
 */
function liftBismillah(number: number, ayahs: Ayah[]) {
  if (number === 1 || number === 9) return { ayahs, bismillah: number === 1 };

  const first = ayahs[0];
  const words = first.ar.split(" ");
  if (bare(words.slice(0, 4).join(" ")) !== BISMILLAH_BARE) {
    return { ayahs, bismillah: false };
  }
  const rest = words.slice(4).join(" ").trim();
  return {
    ayahs: [{ ...first, ar: rest }, ...ayahs.slice(1)],
    bismillah: true,
  };
}

export async function getSurah(number: number): Promise<Surah | null> {
  if (!Number.isInteger(number) || number < 1 || number > 114) return null;
  const file = path.join(DATA_DIR, `${String(number).padStart(3, "0")}.json`);
  const raw = JSON.parse(await readFile(file, "utf8")) as Omit<
    SurahMeta,
    "ayahs"
  > & { ayahs: Ayah[] };
  const { ayahs, bismillah } = liftBismillah(number, raw.ayahs);
  return { ...raw, ayahs, bismillah };
}
