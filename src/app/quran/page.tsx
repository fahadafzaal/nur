import ComingSoon from "@/components/ComingSoon";

export const metadata = { title: "Qur'an Explorer — NUR" };

export default function QuranPage() {
  return (
    <ComingSoon
      title="Qur'an Explorer"
      body="The full Mushaf with translation, recitation, daily lessons and your own private notes."
      blockedOn="Being built next. The Arabic text, translation and Alafasy recitation all come from the Al Qur'an Cloud API, so this needs nothing from the client."
    />
  );
}
