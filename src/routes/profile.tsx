import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProtectedPage, SectionCard } from "@/components/ProtectedPage";
import { Skeleton } from "@/components/ui/skeleton";
import { userService } from "@/services/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "My Profile — Bible Quiz" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["user", "profile"],
    queryFn: () => userService.getProfile(),
    enabled: !!user,
  });

  const p = data?.user;

  return (
    <ProtectedPage max="max-w-3xl">
      <h1 className="mb-6 font-serif text-3xl font-semibold text-foreground">My profile</h1>

      <SectionCard
        title="Account information"
        action={
          <Link to="/profile/edit" className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary">
            Edit profile
          </Link>
        }
      >
        {isLoading ? (
          <Skeleton className="h-32" />
        ) : (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Row label="Username" value={p?.username ?? user?.name ?? "—"} />
            <Row label="Email" value={p?.email ?? user?.email ?? "—"} />
            <Row label="Member since" value={p?.created_at ? new Date(p.created_at).toLocaleDateString() : "—"} />
            <Row label="Status" value="Active" />
          </dl>
        )}
      </SectionCard>

      <SectionCard
        title="Security"
        action={
          <Link to="/profile/change-password" className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary">
            Change password
          </Link>
        }
      >
        <Row label="Password" value="••••••••" />
      </SectionCard>
    </ProtectedPage>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
