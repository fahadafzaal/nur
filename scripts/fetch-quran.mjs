/**
 * Downloads the Qur'an text once and stores it in src/data/quran/.
 *
 *   node scripts/fetch-quran.mjs
 *
 * Why commit the data instead of fetching at build or request time:
 * the text never changes, so storing it removes the Al Qur'an Cloud API
 * as a dependency for every deploy and every reader. If their API is down,
 * NUR still builds and still serves every surah from Vercel's CDN.
 *
 * Sources (via api.alquran.cloud):
 *   quran-uthmani — Tanzil Project Uthmani text (tanzil.net)
 *   en.sahih      — Saheeh International translation
 * Recitation audio is not stored: its URL is derived from the global ayah
 * number (see src/lib/quran.ts).
 *
 * Nothing in the Arabic text is altered. The only processing is removing
 * a byte-order mark the source leaves at the start of Al-Fatiha.
 */
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "src/data/quran";
const API = "https://api.alquran.cloud/v1";
const BOM = /^\uFEFF/;

async function get(url, attempt = 1) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.code !== 200) throw new Error(`API code ${json.code}`);
    return json.data;
  } catch (err) {
    if (attempt >= 4) throw new Error(`${url}: ${err.message}`);
    await new Promise((r) => setTimeout(r, 800 * attempt));
    return get(url, attempt + 1);
  }
}

mkdirSync(OUT, { recursive: true });

const list = await get(`${API}/surah`);
const index = list.map((s) => ({
  number: s.number,
  arabic: s.name,
  name: s.englishName,
  meaning: s.englishNameTranslation,
  ayahs: s.numberOfAyahs,
  revelation: s.revelationType,
}));
writeFileSync(`${OUT}/index.json`, JSON.stringify(index));
console.log(`index: ${index.length} surahs`);

let total = 0;
for (const s of index) {
  const [ar, en] = await get(
    `${API}/surah/${s.number}/editions/quran-uthmani,en.sahih`,
  );
  if (ar.ayahs.length !== s.ayahs || en.ayahs.length !== s.ayahs) {
    throw new Error(`surah ${s.number}: ayah count mismatch`);
  }
  const ayahs = ar.ayahs.map((a, i) => ({
    n: a.numberInSurah,
    g: a.number, // global ayah number, 1..6236 — drives the audio URL
    ar: a.text.replace(BOM, ""),
    en: en.ayahs[i].text,
    juz: a.juz,
    page: a.page,
    sajda: Boolean(a.sajda),
  }));
  writeFileSync(
    `${OUT}/${String(s.number).padStart(3, "0")}.json`,
    JSON.stringify({ ...s, ayahs }),
  );
  total += ayahs.length;
  process.stdout.write(`\r${s.number}/114`);
}
console.log(`\ndone: ${total} ayahs`);
if (total !== 6236) throw new Error(`expected 6236 ayahs, got ${total}`);
