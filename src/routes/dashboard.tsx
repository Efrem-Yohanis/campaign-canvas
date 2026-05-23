import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Play, BarChart3, Settings, PlayCircle } from "lucide-react";
import { ProtectedPage, StatCard, SectionCard } from "@/components/ProtectedPage";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { userService } from "@/services/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Bible Quiz" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();

  const summary = useQuery({
    queryKey: ["user", "summary"],
    queryFn: () => userService.getSummary(),
    enabled: !!user,
  });

  const inProgress = useQuery({
    queryKey: ["user", "in-progress"],
    queryFn: () => userService.getInProgressQuizzes(),
    enabled: !!user,
  });

  const stats: any = summary.data?.profile?.statistics ?? {};
  const quizzes = inProgress.data?.quizzes ?? [];
  const recent = summary.data?.profile?.recent_activity ?? [];

  return (
    <ProtectedPage>
      <h1 className="mb-1 font-serif text-3xl font-semibold text-foreground">
        Welcome back, {user?.name}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">Here is your learning at a glance.</p>

      <SectionCard title="Statistics" action={<Link to="/statistics" className="text-sm text-primary hover:underline">See all</Link>}>
        {summary.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Quizzes" value={stats.total_quizzes_taken ?? 0} />
            <StatCard label="Correct" value={stats.total_correct_answers ?? 0} />
            <StatCard label="Answered" value={stats.total_questions_answered ?? 0} />
            <StatCard
              label="Accuracy"
              value={`${
                stats.total_questions_answered
                  ? Math.round((stats.total_correct_answers / stats.total_questions_answered) * 100)
                  : 0
              }%`}
            />
          </div>
        )}
      </SectionCard>

      <SectionCard title="Quick actions">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <QuickLink to="/" icon={<Play className="h-5 w-5" />} label="Start quiz" />
          <QuickLink to="/reading-progress" icon={<BookOpen className="h-5 w-5" />} label="Continue reading" />
          <QuickLink to="/statistics" icon={<BarChart3 className="h-5 w-5" />} label="Statistics" />
          <QuickLink to="/profile" icon={<Settings className="h-5 w-5" />} label="Profile" />
        </div>
      </SectionCard>

      <SectionCard
        title={`In progress quizzes (${quizzes.length})`}
        action={<Link to="/history" className="text-sm text-primary hover:underline">History</Link>}
      >
        {inProgress.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : quizzes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No quizzes in progress. Start one to see it here.</p>
        ) : (
          <ul className="space-y-3">
            {quizzes.map((q: any) => {
              const total = q.total_questions ?? 10;
              const current = q.current_question_number ?? q.questions_answered ?? 0;
              const pct = Math.min(100, Math.round((current / total) * 100));
              return (
                <li key={q.attempt_id ?? q.id} className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{q.book_name ?? q.book ?? "Quiz"}</p>
                    <p className="text-xs text-muted-foreground">Level {q.level_name ?? q.level_id ?? "—"}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={pct} className="h-1.5" />
                      <span className="text-xs tabular-nums text-muted-foreground">{current}/{total}</span>
                    </div>
                  </div>
                  <Link
                    to="/quiz/$book"
                    params={{ book: String(q.book_name ?? q.book ?? "") }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                  >
                    <PlayCircle className="h-3.5 w-3.5" /> Resume
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Recent activity">
        {summary.isLoading ? (
          <Skeleton className="h-20" />
        ) : recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">Take a quiz to see recent activity here.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.slice(0, 5).map((a: any, i: number) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="text-foreground">{a.book_name ?? a.activity ?? "Activity"}</span>
                <span className="text-muted-foreground">
                  {a.score_percentage != null ? `${Math.round(a.score_percentage)}%` : (a.completed_at ?? "")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </ProtectedPage>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary"
    >
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </Link>
  );
}
