/**
 * Daily Reminders — the 35 hadith/wisdom lines supplied by the client
 * (§7 of the project documentation), verbatim.
 *
 * One per calendar day, the same for every user on a given day, rotating
 * through the set. Kept as a constant rather than a table for now: the
 * content is fixed and client-supplied, and the admin panel that would
 * justify a table arrives in M7. `theme` is used to pick a related nasheed
 * once tracks exist; `article` is the longer reflection the client asked
 * tapping a reminder to open, and is deliberately optional so a reminder
 * renders fine before its article is written.
 */

export type Reminder = {
  id: number;
  text: string;
  theme: string;
  article?: string;
};

export const REMINDERS: Reminder[] = [
  { id: 1, text: "The most beloved deeds to Allah are those done regularly, even if they are small.", theme: "consistency" },
  { id: 2, text: "Actions are judged by intentions.", theme: "sincerity" },
  { id: 3, text: "The best of you are the best in manners and character.", theme: "character" },
  { id: 4, text: "Do not get angry.", theme: "patience" },
  { id: 5, text: "Make things easy for people and do not make them difficult.", theme: "mercy" },
  { id: 6, text: "Even a smile is charity.", theme: "kindness" },
  { id: 7, text: "If you are three, two among you should not converse secretly to the exclusion of the third, as it may hurt his feelings.", theme: "kindness" },
  { id: 8, text: "Whoever among you sees wrong, let him change it with his hand; if he cannot, then with his tongue; if he cannot, then with his heart — and that is the weakest of faith.", theme: "justice" },
  { id: 9, text: "Speak a good word or remain silent.", theme: "speech" },
  { id: 10, text: "A kind word is charity.", theme: "kindness" },
  { id: 11, text: "Those most complete in faith are those best in character and kindest to their families.", theme: "family" },
  { id: 12, text: "Love for your brother what you love for yourself.", theme: "brotherhood" },
  { id: 13, text: "Allah is beautiful and loves beauty.", theme: "beauty" },
  { id: 14, text: "Cleanliness is half of faith.", theme: "purity" },
  { id: 15, text: "When Allah loves a person, He tests him.", theme: "trials" },
  { id: 16, text: "All mankind is from Adam and Eve. An Arab has no superiority over a non-Arab, nor a non-Arab over an Arab, nor a white person over a black person, nor a black person over a white person — except by piety and good action. Every Muslim is a brother to every Muslim, and nothing of a Muslim's is lawful to another except what is given freely.", theme: "justice" },
  { id: 17, text: "Be in this world as though you were a stranger or a traveler.", theme: "detachment" },
  { id: 18, text: "If you relied on God as He should be relied upon, He would provide for you as He provides for the birds — they leave hungry in the morning and return full in the evening.", theme: "trust" },
  { id: 19, text: "You will not enter Paradise until you believe, and you will not believe until you love one another. Shall I show you something that, if you did it, you would love one another? Spread peace among yourselves.", theme: "peace" },
  { id: 20, text: "Greet with peace those you know and those you do not know.", theme: "peace" },
  { id: 21, text: "Do not cause harm, and do not return harm.", theme: "justice" },
  { id: 22, text: "Leave what makes you doubt for what does not make you doubt — truth brings peace of mind, and falsehood sows doubt.", theme: "honesty" },
  { id: 23, text: "The upper hand is better than the lower hand — the upper hand is the one that gives, the lower hand is the one that receives.", theme: "generosity" },
  { id: 24, text: "Those who are merciful will be shown mercy by the Most Merciful — be merciful to those on earth, and the One in the heavens will have mercy on you.", theme: "mercy" },
  { id: 25, text: "Paradise lies beneath the feet of mothers.", theme: "family" },
  { id: 26, text: "Whoever believes in Allah and the Last Day should honour his neighbour.", theme: "neighbours" },
  { id: 27, text: "My brothers are those who believe in me without having seen me.", theme: "faith" },
  { id: 28, text: "You will be with those you love.", theme: "love" },
  { id: 29, text: "Trust in God, but tie your camel.", theme: "trust" },
  { id: 30, text: "When putting on sandals, start with the right foot; when removing them, start with the left — wear both or remove both, not just one.", theme: "sunnah" },
  { id: 31, text: "Eat together and mention the name of Allah over your food — it will be blessed for you.", theme: "gratitude" },
  { id: 32, text: "Do not ask someone to give up their seat to take it — instead, make room and sit at ease.", theme: "humility" },
  { id: 33, text: "If someone leaves their seat and returns, they are more entitled to it.", theme: "courtesy" },
  { id: 34, text: "The best gatherings are those where people make room for one another.", theme: "courtesy" },
  { id: 35, text: "Whoever does not show mercy to our young or acknowledge the rights of our elders is not one of us.", theme: "mercy" },
];

/**
 * The reminder for a given day.
 *
 * Keyed to the calendar date rather than a random pick, so everyone sees
 * the same line on the same day and it changes at local midnight.
 */
export function reminderForDate(date = new Date()): Reminder {
  const days = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
  return REMINDERS[((days % REMINDERS.length) + REMINDERS.length) % REMINDERS.length];
}
