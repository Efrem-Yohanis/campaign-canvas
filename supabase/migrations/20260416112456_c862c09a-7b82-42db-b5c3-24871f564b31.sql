
-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Allow all users to manage campaigns
CREATE POLICY "Allow all select on campaigns" ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "Allow all insert on campaigns" ON public.campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on campaigns" ON public.campaigns FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on campaigns" ON public.campaigns FOR DELETE USING (true);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to list public user tables
CREATE OR REPLACE FUNCTION public.list_public_tables()
RETURNS TABLE(table_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT t.table_name::TEXT
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get row count for a table
CREATE OR REPLACE FUNCTION public.get_table_row_count(target_table TEXT)
RETURNS BIGINT AS $$
DECLARE
  row_count BIGINT;
BEGIN
  EXECUTE format('SELECT count(*) FROM public.%I', target_table) INTO row_count;
  RETURN row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get table data with pagination
CREATE OR REPLACE FUNCTION public.get_table_data(target_table TEXT, page_num INT DEFAULT 1, page_size INT DEFAULT 20)
RETURNS JSON AS $$
DECLARE
  result JSON;
  offset_val INT;
BEGIN
  offset_val := (page_num - 1) * page_size;
  EXECUTE format('SELECT json_agg(t) FROM (SELECT * FROM public.%I LIMIT %s OFFSET %s) t', target_table, page_size, offset_val) INTO result;
  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get table columns
CREATE OR REPLACE FUNCTION public.get_table_columns(target_table TEXT)
RETURNS TABLE(column_name TEXT, data_type TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT c.column_name::TEXT, c.data_type::TEXT
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = target_table
  ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to insert data into a table dynamically
CREATE OR REPLACE FUNCTION public.insert_table_data(target_table TEXT, rows JSONB)
RETURNS INT AS $$
DECLARE
  row_data JSONB;
  col_names TEXT;
  col_values TEXT;
  keys TEXT[];
  vals TEXT[];
  k TEXT;
  v TEXT;
  inserted INT := 0;
BEGIN
  FOR row_data IN SELECT * FROM jsonb_array_elements(rows)
  LOOP
    keys := ARRAY[]::TEXT[];
    vals := ARRAY[]::TEXT[];
    FOR k, v IN SELECT * FROM jsonb_each_text(row_data)
    LOOP
      keys := array_append(keys, quote_ident(k));
      vals := array_append(vals, quote_literal(v));
    END LOOP;
    col_names := array_to_string(keys, ', ');
    col_values := array_to_string(vals, ', ');
    EXECUTE format('INSERT INTO public.%I (%s) VALUES (%s)', target_table, col_names, col_values);
    inserted := inserted + 1;
  END LOOP;
  RETURN inserted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
