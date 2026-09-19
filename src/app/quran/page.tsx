import { getSurahIndex } from "@/lib/quran";
import SurahList from "@/components/quran/SurahList";

export const metadata = { title: "Qur'an Explorer — NUR" };

export default async function QuranPage() {
  const surahs = await getSurahIndex();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pt-12 pb-28">
      <header className="text-center">
        <p
          lang="ar"
          dir="rtl"
          className="font-arabic text-gold-light text-4xl"
        >
          ٱلْقُرْءَان
        </p>
        <h1 className="font-display text-parchment mt-3 text-3xl">
          Qur&apos;an Explorer
        </h1>
        <p className="font-body text-muted mx-auto mt-3 max-w-md text-sm leading-relaxed">
          Read, listen, and keep your own reflections — surah by surah.
        </p>
      </header>

      <div className="mt-10">
        <SurahList surahs={surahs} />
      </div>
    </main>
  );
}
