import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ImportDataDialog } from "@/components/ImportDataDialog";
import {
  fetchCampaign,
  getCampaignData,
  type Campaign,
  type CampaignDataRow,
} from "@/lib/campaigns";
import {
  Upload,
  ArrowLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  Phone,
  User,
  Clock,
  Database,
  ListChecks,
} from "lucide-react";

export const Route = createFileRoute("/campaigns/$campaignId/")({
  head: () => ({
    meta: [
      { title: "Campaign Detail" },
      { name: "description", content: "View campaign details and MSISDN data" },
    ],
  }),
  component: CampaignDetailPage,
});

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function CampaignDetailPage() {
  const { campaignId } = Route.useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [rows, setRows] = useState<CampaignDataRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const pageSize = 20;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const c = await fetchCampaign(campaignId);
      setCampaign(c);
      const { rows: r, total: t } = await getCampaignData(campaignId, page, pageSize, debouncedSearch);
      setRows(r);
      setTotal(t);
    } finally {
      setLoading(false);
    }
  }, [campaignId, page, debouncedSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (loading && !campaign) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!campaign) return null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button size="icon" variant="ghost">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{campaign.name}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              MSISDN list for this campaign
            </p>
          </div>
          <Button onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" />
            Import Data
          </Button>
        </div>

        {/* Campaign info card */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <InfoCard icon={<Database className="h-4 w-4" />} label="Campaign Name" value={campaign.name} />
          <InfoCard icon={<Database className="h-4 w-4" />} label="Table Name" value={campaign.table_name} mono />
          <InfoCard
            icon={<ListChecks className="h-4 w-4" />}
            label="Total Rows"
            value={total.toLocaleString()}
          />
          <InfoCard
            icon={<User className="h-4 w-4" />}
            label="Created By"
            value={campaign.created_by ?? "system"}
          />
          <InfoCard
            icon={<Clock className="h-4 w-4" />}
            label="Last Update"
            value={formatDate(campaign.last_inserted_at ?? campaign.updated_at)}
            sub={
              campaign.last_insert_count
                ? `${campaign.last_insert_count.toLocaleString()} rows inserted`
                : "No imports yet"
            }
          />
        </div>

        {/* Search + table */}
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">MSISDN List</h2>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search MSISDN (e.g. +251707035315)…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="overflow-auto rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>MSISDN</TableHead>
                  <TableHead>Imported At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-10 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                      {debouncedSearch ? "No MSISDN matches your search." : "No data yet. Import an Excel/CSV file to get started."}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, i) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {(page - 1) * pageSize + i + 1}
                      </TableCell>
                      <TableCell className="font-mono">
                        <span className="inline-flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-primary" />
                          {row.msisdn}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(row.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {total > 0
                ? `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total.toLocaleString()}`
                : "0 rows"}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ImportDataDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        campaignId={campaign.id}
        campaignName={campaign.name}
        onSuccess={loadData}
      />
    </AppLayout>
  );
}

function InfoCard({
  icon,
  label,
  value,
  sub,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <p
        className={`mt-1.5 truncate text-base font-semibold text-foreground ${
          mono ? "font-mono text-sm" : ""
        }`}
        title={value}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
