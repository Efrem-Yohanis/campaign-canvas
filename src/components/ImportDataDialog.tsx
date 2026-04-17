import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { insertCampaignMsisdns } from "@/lib/campaigns";
import * as XLSX from "xlsx";

interface ImportDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  campaignName: string;
  onSuccess: () => void;
}

export function ImportDataDialog({
  open,
  onOpenChange,
  campaignId,
  campaignName,
  onSuccess,
}: ImportDataDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

      if (jsonData.length === 0) {
        setResult({ success: false, message: "The file contains no data rows." });
        return;
      }

      const inserted = await insertCampaignMsisdns(campaignId, jsonData);

      if (inserted === 0) {
        setResult({
          success: false,
          message:
            "No MSISDN values found. Make sure your file has a column named 'msisdn', 'phone', 'phone_number', or 'mobile'.",
        });
        return;
      }

      setResult({ success: true, message: `Successfully imported ${inserted} MSISDN rows.` });
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Import failed";
      setResult({ success: false, message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Data</DialogTitle>
          <DialogDescription>
            Upload an Excel (.xlsx) or CSV file with MSISDN numbers for{" "}
            <strong>{campaignName}</strong>. The file should contain a column named{" "}
            <code>msisdn</code>, <code>phone</code>, <code>phone_number</code>, or{" "}
            <code>mobile</code>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div
            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary/50 hover:bg-muted/50"
            onClick={() => fileRef.current?.click()}
          >
            <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {file ? file.name : "Click to select a file"}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFile}
              className="hidden"
            />
          </div>

          {result && (
            <div
              className={`flex items-center gap-2 rounded-md p-3 text-sm ${
                result.success
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0" />
              )}
              {result.message}
            </div>
          )}

          <Button onClick={handleImport} disabled={!file || loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {loading ? "Importing…" : "Import"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
