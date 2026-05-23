import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProtectedPage, StatCard, SectionCard } from "@/components/ProtectedPage";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { userService } from "@/services/api";

export const Route = createFileRoute("/statistics")({
  head: () => ({ meta: [{ title: "Statistics — Bible Quiz" }] }),
  component: StatisticsPage,
});

function StatisticsPage() {
  const stats = useQuery({ queryKey: ["user", "stats"], queryFn: () => userService.getStats() });
  const history = useQuery({ queryKey: ["user", "history", 100], queryFn: () => userService.getQuizHistory(100) });

  const s: any = stats.data?.stats ?? {};
  const items = history.data?.history ?? [];

  const accuracy = s.total_questions_answered
    ? Math.round((s.total_correct_answers / s.total_questions_answered) * 100)
    : 0;
  const avgScore = items.length
    ? Math.round(items.reduce((a, b) => a + (b.score_percentage ?? 0), 0) / items.length)
    : 0;

  const byBook = aggregate(items, (q) => q.book_name);

  return (
    <ProtectedPage>
      <h1 className="mb-6 font-serif text-3xl font-semibold text-foreground">Statistics</h1>

      <SectionCard title="Overall">
        {stats.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Quizzes" value={s.total_quizzes_taken ?? 0} />
            <StatCard label="Correct" value={s.total_correct_answers ?? 0} />
            <StatCard label="Answered" value={s.total_questions_answered ?? 0} />
            <StatCard label="Accuracy" value={`${accuracy}%`} />
            <StatCard label="Wrong" value={(s.total_questions_answered ?? 0) - (s.total_correct_answers ?? 0)} />
            <StatCard label="Avg score" value={`${avgScore}%`} />
            <StatCard label="Best" value={items.length ? `${Math.round(Math.max(...items.map((i) => i.score_percentage)))}%` : "—"} />
            <StatCard label="Books played" value={Object.keys(byBook).length} />
          </div>
        )}
      </SectionCard>

      <SectionCard title="Performance by book">
        {history.isLoading ? (
          <Skeleton className="h-32" />
        ) : Object.keys(byBook).length === 0 ? (
          <p className="text-sm text-muted-foreground">No completed quizzes yet.</p>
        ) : (
          <ul className="space-y-3">
            {Object.entries(byBook).map(([book, list]) => {
              const avg = Math.round(list.reduce((a, b) => a + b.score_percentage, 0) / list.length);
              return (
                <li key={book}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{book}</span>
                    <span className="tabular-nums text-muted-foreground">{avg}% · {list.length} quiz{list.length > 1 ? "es" : ""}</span>
                  </div>
                  <Progress value={avg} className="h-1.5" />
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </ProtectedPage>
  );
}

function aggregate<T extends { score_percentage: number }>(items: T[], key: (x: T) => string) {
  return items.reduce<Record<string, T[]>>((acc, x) => {
    const k = key(x);
    (acc[k] ||= []).push(x);
    return acc;
  }, {});
}
