import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { CampaignForm } from "@/components/CampaignForm";
import { fetchCampaign, updateCampaign, type Campaign } from "@/lib/campaigns";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/campaigns/$campaignId/edit")({
  head: () => ({
    meta: [
      { title: "Edit Campaign" },
      { name: "description", content: "Edit campaign details" },
    ],
  }),
  component: EditCampaignPage,
});

function EditCampaignPage() {
  const { campaignId } = Route.useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaign(campaignId)
      .then(setCampaign)
      .finally(() => setLoading(false));
  }, [campaignId]);

  if (loading) {
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
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">Edit Campaign</h1>
        <div className="rounded-lg border border-border bg-card p-6">
          <CampaignForm
            initialName={campaign.name}
            initialTable={campaign.table_name}
            submitLabel="Update Campaign"
            onSubmit={async (name, tableName) => {
              await updateCampaign(campaignId, name, tableName);
              navigate({ to: "/" });
            }}
          />
        </div>
      </div>
    </AppLayout>
  );
}
