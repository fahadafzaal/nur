/**
 * The six traits the Seerah is organised around — the client's framing:
 * the Prophet's character ﷺ, not a chronology.
 *
 * Each trait is anchored to a verse. Only the reference is stored here;
 * the Arabic and translation are read from the Qur'an data at render time,
 * so the wording can never drift from the source text.
 *
 * The one-line descriptions are placeholders in plain words, written to be
 * replaced or approved by the client.
 */
export const TRAITS = [
  {
    slug: "mercy",
    name: "Mercy",
    arabic: "رَحْمَة",
    translit: "Rahmah",
    line: "Gentleness with the weak and the grieving — and with those who opposed him.",
    verse: { surah: 21, ayah: 107 },
  },
  {
    slug: "honesty",
    name: "Honesty",
    arabic: "صِدْق",
    translit: "Sidq",
    line: "Known as al-Amīn, the Trustworthy, long before revelation came.",
    verse: { surah: 9, ayah: 119 },
  },
  {
    slug: "patience",
    name: "Patience",
    arabic: "صَبْر",
    translit: "Sabr",
    line: "Steadfast through loss, hardship and rejection.",
    verse: { surah: 16, ayah: 127 },
  },
  {
    slug: "humility",
    name: "Humility",
    arabic: "تَوَاضُع",
    translit: "Tawāḍuʿ",
    line: "Living simply, and sitting among people as one of them.",
    verse: { surah: 25, ayah: 63 },
  },
  {
    slug: "justice",
    name: "Justice",
    arabic: "عَدْل",
    translit: "ʿAdl",
    line: "Fairness that did not bend for status, kinship or friendship.",
    verse: { surah: 4, ayah: 135 },
  },
  {
    slug: "forgiveness",
    name: "Forgiveness",
    arabic: "عَفْو",
    translit: "ʿAfw",
    line: "Pardoning those who had wronged him, even when he had the power not to.",
    verse: { surah: 3, ayah: 159 },
  },
] as const;

export type Trait = (typeof TRAITS)[number];
export type TraitSlug = Trait["slug"];

export function getTrait(slug: string) {
  return TRAITS.find((t) => t.slug === slug) ?? null;
}
