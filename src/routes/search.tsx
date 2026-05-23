import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, Loader2, Search as SearchIcon } from "lucide-react";
import { Header } from "@/components/Header";
import { bibleService } from "@/services/api";
import { useI18n } from "@/lib/i18n";
import { bookSlug, localizedBookName } from "@/data/bible";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search verses — Bible" },
      { name: "description", content: "Search the full text of any book of the Bible for a word or phrase." },
    ],
  }),
  component: SearchPage,
});

type Hit = { book: string; chapter: number; verse: number; text: string };

function SearchPage() {
  const { lang } = useI18n();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [selectedBook, setSelectedBook] = useState<string>(""); // empty = first available

  const booksQ = useQuery({
    queryKey: ["bible-books-by-language", lang],
    queryFn: () => bibleService.getBooksByLanguage(lang),
    staleTime: 1000 * 60 * 10,
  });
  const books = booksQ.data?.books ?? [];
  const activeBook = selectedBook || books[0]?.name || "";

  const bookQ = useQuery({
    enabled: !!activeBook && !!submitted,
    queryKey: ["bible-full-book", activeBook, lang],
    queryFn: () => bibleService.getFullBook(activeBook, lang),
    staleTime: 1000 * 60 * 30,
  });

  const hits: Hit[] = useMemo(() => {
    if (!submitted || !bookQ.data) return [];
    const q = submitted.toLowerCase();
    const out: Hit[] = [];
    for (const ch of bookQ.data.chapters) {
      for (const v of ch.verses) {
        if (v.text.toLowerCase().includes(q)) {
          out.push({ book: bookQ.data.book, chapter: ch.chapter, verse: v.verse, text: v.text });
        }
      }
    }
    return out;
  }, [submitted, bookQ.data]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(query.trim());
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>

        <h1 className="font-serif text-4xl font-semibold text-foreground">Search verses</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Search the full text of a book for a word or phrase. Pick a book and enter your query.
        </p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-3 sm:grid-cols-[220px_1fr_auto]">
          <select
            value={activeBook}
            onChange={(e) => setSelectedBook(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm outline-none focus:border-primary"
          >
            {books.map((b) => (
              <option key={b.id} value={b.name}>
                {localizedBookName(b.name, lang)}
              </option>
            ))}
          </select>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. love, faith, shepherd…"
              className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm text-foreground shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim() || !activeBook}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-40"
          >
            Search
          </button>
        </form>

        <div className="mt-8">
          {!submitted ? (
            <p className="text-sm text-muted-foreground">Enter a word above to find every verse that contains it.</p>
          ) : bookQ.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching {activeBook}…
            </div>
          ) : bookQ.isError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Failed to load book. {(bookQ.error as Error)?.message}
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                Found <span className="font-semibold text-foreground">{hits.length}</span> verse
                {hits.length === 1 ? "" : "s"} in {localizedBookName(activeBook, lang)} containing
                {" "}
                <span className="font-semibold text-foreground">“{submitted}”</span>.
              </p>
              <ul className="space-y-3">
                {hits.map((h) => (
                  <li
                    key={`${h.chapter}:${h.verse}`}
                    className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                  >
                    <Link
                      to="/book/$book"
                      params={{ book: bookSlug(h.book) }}
                      className="text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
                    >
                      {localizedBookName(h.book, lang)} {h.chapter}:{h.verse}
                    </Link>
                    <p className="mt-1 font-serif text-base leading-relaxed text-foreground/90">
                      {highlight(h.text, submitted)}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function highlight(text: string, term: string) {
  if (!term) return text;
  const parts = text.split(new RegExp(`(${escapeReg(term)})`, "ig"));
  return parts.map((p, i) =>
    p.toLowerCase() === term.toLowerCase() ? (
      <mark key={i} className="rounded bg-primary/20 px-0.5 text-foreground">
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

function escapeReg(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
