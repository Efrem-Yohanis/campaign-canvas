import { supabase } from "@/integrations/supabase/client";

export type Campaign = {
  id: string;
  name: string;
  table_name: string;
  created_at: string;
  updated_at: string;
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

export async function getTableRowCount(tableName: string) {
  const { data, error } = await supabase.rpc("get_table_row_count", {
    target_table: tableName,
  });
  if (error) throw error;
  return data as number;
}

export async function getTableData(tableName: string, page = 1, pageSize = 20) {
  const { data, error } = await supabase.rpc("get_table_data", {
    target_table: tableName,
    page_num: page,
    page_size: pageSize,
  });
  if (error) throw error;
  return (data ?? []) as Record<string, unknown>[];
}

export async function getTableColumns(tableName: string) {
  const { data, error } = await supabase.rpc("get_table_columns", {
    target_table: tableName,
  });
  if (error) throw error;
  return data as { column_name: string; data_type: string }[];
}

export async function insertTableData(tableName: string, rows: Record<string, unknown>[]) {
  const { data, error } = await supabase.rpc("insert_table_data", {
    target_table: tableName,
    rows: rows as unknown as string,
  });
  if (error) throw error;
  return data as number;
}
