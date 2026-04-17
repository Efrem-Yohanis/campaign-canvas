import { supabase } from "@/integrations/supabase/client";

export type Campaign = {
  id: string;
  name: string;
  table_name: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  last_insert_count?: number | null;
  last_inserted_at?: string | null;
};

export type CampaignDataRow = {
  id: string;
  campaign_id: string;
  msisdn: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

export async function fetchCampaigns() {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Campaign[];
}

export async function fetchCampaign(id: string) {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Campaign;
}

export async function createCampaign(name: string, table_name: string) {
  const { data, error } = await supabase
    .from("campaigns")
    .insert({ name, table_name })
    .select()
    .single();
  if (error) throw error;
  return data as Campaign;
}

export async function updateCampaign(id: string, name: string, table_name: string) {
  const { data, error } = await supabase
    .from("campaigns")
    .update({ name, table_name })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Campaign;
}

export async function deleteCampaign(id: string) {
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) throw error;
}

export async function listPublicTables() {
  const { data, error } = await supabase.rpc("list_public_tables");
  if (error) throw error;
  return (data as { table_name: string }[]).map((t) => t.table_name);
}

// Per-campaign data (MSISDN list)
export async function getCampaignRowCount(campaignId: string) {
  const { count, error } = await supabase
    .from("campaign_data")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", campaignId);
  if (error) throw error;
  return count ?? 0;
}

export async function getCampaignData(
  campaignId: string,
  page = 1,
  pageSize = 20,
  search = ""
) {
  let query = supabase
    .from("campaign_data")
    .select("*", { count: "exact" })
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (search.trim()) {
    query = query.ilike("msisdn", `%${search.trim()}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, count, error } = await query.range(from, to);
  if (error) throw error;
  return {
    rows: (data ?? []) as CampaignDataRow[],
    total: count ?? 0,
  };
}

export async function insertCampaignMsisdns(
  campaignId: string,
  rows: Record<string, unknown>[]
) {
  const { data, error } = await supabase.rpc("insert_campaign_msisdns", {
    target_campaign: campaignId,
    rows: rows as unknown as string,
  });
  if (error) throw error;
  return data as number;
}
