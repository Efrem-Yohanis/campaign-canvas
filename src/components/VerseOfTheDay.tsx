import { Sparkles, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

// TODO: Replace with API call (e.g. bibleService.getVerseOfTheDay()) when the
// backend endpoint is available. For now we surface a small curated mock list
// and rotate by day-of-year so each day shows a stable verse.
type DailyVerse = {
  reference: string; // e.g. "John 3:16"
  text: string;
  book: string;
  chapter: number;
  verse: number;
};

const MOCK_VERSES: DailyVerse[] = [
  {
    reference: "John 3:16",
    book: "John",
    chapter: 3,
    verse: 16,
    text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
  },
  {
    reference: "Psalms 23:1",
    book: "Psalms",
    chapter: 23,
    verse: 1,
    text: "The Lord is my shepherd; I shall not want.",
  },
  {
    reference: "Proverbs 3:5",
    book: "Proverbs",
    chapter: 3,
    verse: 5,
    text: "Trust in the Lord with all thine heart; and lean not unto thine own understanding.",
  },
  {
    reference: "Philippians 4:13",
    book: "Philippians",
    chapter: 4,
    verse: 13,
    text: "I can do all things through Christ which strengtheneth me.",
  },
  {
    reference: "Isaiah 41:10",
    book: "Isaiah",
    chapter: 41,
    verse: 10,
    text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee.",
  },
  {
    reference: "Romans 8:28",
    book: "Romans",
    chapter: 8,
    verse: 28,
    text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.",
  },
  {
    reference: "Matthew 6:33",
    book: "Matthew",
    chapter: 6,
    verse: 33,
    text: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.",
  },
];

function dayOfYear(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function VerseOfTheDay() {
  const todayIdx = useMemo(() => dayOfYear() % MOCK_VERSES.length, []);
  const [idx, setIdx] = useState(todayIdx);
  const v = MOCK_VERSES[idx];

  return (
    <section
      aria-label="Verse of the day"
      className="mb-10 overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-sm sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Verse of the day
        </div>
        <button
          onClick={() => setIdx((i) => (i + 1) % MOCK_VERSES.length)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-primary"
          aria-label="Show another verse"
        >
          <RefreshCw className="h-3 w-3" /> Another
        </button>
      </div>
      <blockquote className="mt-4 font-serif text-xl leading-relaxed text-foreground sm:text-2xl">
        “{v.text}”
      </blockquote>
      <div className="mt-4 text-sm font-semibold text-primary">— {v.reference}</div>
    </section>
  );
}
