import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <span className="text-base font-semibold tracking-tight">Campaigns</span>
          </Link>
          {location.pathname === "/" && (
            <Link to="/campaigns/create">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Create Campaign
              </Button>
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
