import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listPublicTables } from "@/lib/campaigns";
import { Loader2 } from "lucide-react";

interface CampaignFormProps {
  initialName?: string;
  initialTable?: string;
  onSubmit: (name: string, tableName: string) => Promise<void>;
  submitLabel: string;
}

export function CampaignForm({ initialName = "", initialTable = "", onSubmit, submitLabel }: CampaignFormProps) {
  const navigate = useNavigate();
  const [name, setName] = useState(initialName);
  const [tableName, setTableName] = useState(initialTable);
  const [tables, setTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTables, setLoadingTables] = useState(true);
  const [errors, setErrors] = useState<{ name?: string; table?: string }>({});

  useEffect(() => {
    listPublicTables()
      .then(setTables)
      .finally(() => setLoadingTables(false));
  }, []);

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Campaign name is required";
    if (!tableName) e.table = "Table selection is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit(name.trim(), tableName);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Campaign Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter campaign name"
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="table">Select Table</Label>
        <Select value={tableName} onValueChange={setTableName}>
          <SelectTrigger>
            <SelectValue placeholder={loadingTables ? "Loading tables…" : "Choose a table"} />
          </SelectTrigger>
          <SelectContent>
            {tables.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.table && <p className="text-sm text-destructive">{errors.table}</p>}
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/" })}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
