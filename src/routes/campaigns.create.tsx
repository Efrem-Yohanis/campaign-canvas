import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { CampaignForm } from "@/components/CampaignForm";
import { createCampaign } from "@/lib/campaigns";

export const Route = createFileRoute("/campaigns/create")({
  head: () => ({
    meta: [
      { title: "Create Campaign" },
      { name: "description", content: "Create a new data campaign" },
    ],
  }),
  component: CreateCampaignPage,
});

function CreateCampaignPage() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">Create Campaign</h1>
        <div className="rounded-lg border border-border bg-card p-6">
          <CampaignForm
            submitLabel="Create Campaign"
            onSubmit={async (name, tableName) => {
              await createCampaign(name, tableName);
              navigate({ to: "/" });
            }}
          />
        </div>
      </div>
    </AppLayout>
  );
}
