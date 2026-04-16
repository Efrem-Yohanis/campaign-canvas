import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ImportDataDialog } from "@/components/ImportDataDialog";
import { fetchCampaign, getTableRowCount, getTableData, getTableColumns, type Campaign } from "@/lib/campaigns";
import { Upload, ArrowLeft, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/campaigns_/$campaignId")({
  head: () => ({
    meta: [
      { title: "Campaign Detail" },
      { name: "description", content: "View campaign details and table data" },
    ],
  }),
  component: CampaignDetailPage,
});

function CampaignDetailPage() {
  const { campaignId } = Route.useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [rowCount, setRowCount] = useState<number>(0);
  const [columns, setColumns] = useState<{ column_name: string; data_type: string }[]>([]);
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const pageSize = 20;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const c = await fetchCampaign(campaignId);
      setCampaign(c);
      const [count, cols, data] = await Promise.all([
        getTableRowCount(c.table_name),
        getTableColumns(c.table_name),
        getTableData(c.table_name, page, pageSize),
      ]);
      setRowCount(count);
      setColumns(cols);
      setTableData(data);
    } finally {
      setLoading(false);
    }
  }, [campaignId, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.max(1, Math.ceil(rowCount / pageSize));

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
              Table: <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{campaign.table_name}</code>
              {" · "}
              {rowCount.toLocaleString()} rows
            </p>
          </div>
          <Button onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" />
            Import Data
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Campaign</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{campaign.name}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Table</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{campaign.table_name}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Rows</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{rowCount.toLocaleString()}</p>
          </div>
        </div>

        {/* Table data preview */}
        <div>
          <h2 className="mb-3 text-base font-semibold text-foreground">Table Preview</h2>
          {columns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No columns found.</p>
          ) : (
            <div className="overflow-auto rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    {columns.map((col) => (
                      <TableHead key={col.column_name} className="whitespace-nowrap">
                        {col.column_name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                        No data yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    tableData.map((row, i) => (
                      <TableRow key={i}>
                        {columns.map((col) => (
                          <TableCell key={col.column_name} className="max-w-[200px] truncate whitespace-nowrap">
                            {String(row[col.column_name] ?? "")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ImportDataDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        tableName={campaign.table_name}
        onSuccess={loadData}
      />
    </AppLayout>
  );
}
