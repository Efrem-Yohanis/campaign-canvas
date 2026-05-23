import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ProtectedPage, SectionCard } from "@/components/ProtectedPage";
import { Skeleton } from "@/components/ui/skeleton";
import { userService } from "@/services/api";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "Quiz history — Bible Quiz" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["user", "history", 100],
    queryFn: () => userService.getQuizHistory(100),
  });
  const [bookFilter, setBookFilter] = useState<string>("all");

  const items = data?.history ?? [];
  const books = useMemo(() => Array.from(new Set(items.map((i) => i.book_name))), [items]);
  const filtered = useMemo(
    () => (bookFilter === "all" ? items : items.filter((i) => i.book_name === bookFilter)),
    [items, bookFilter]
  );

  return (
    <ProtectedPage>
      <h1 className="mb-6 font-serif text-3xl font-semibold text-foreground">Quiz history</h1>

      <SectionCard
        title={`${filtered.length} attempts`}
        action={
          <select
            value={bookFilter}
            onChange={(e) => setBookFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          >
            <option value="all">All books</option>
            {books.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        }
      >
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No quizzes yet. Take one to see it here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Book</th>
                  <th className="py-2 pr-4">Score</th>
                  <th className="py-2 pr-4">Questions</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr key={q.id} className="border-b border-border/60">
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {new Date(q.completed_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-foreground">{q.book_name}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{Math.round(q.score_percentage)}%</td>
                    <td className="py-2.5 pr-4 tabular-nums text-muted-foreground">
                      {q.correct_answers}/{q.total_questions}
                    </td>
                    <td className="py-2.5 text-right">
                      <Link
                        to="/quiz/$book"
                        params={{ book: q.book_name }}
                        className="text-xs text-primary hover:underline"
                      >
                        Retry
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </ProtectedPage>
  );
}
