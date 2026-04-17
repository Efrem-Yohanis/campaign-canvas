
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS created_by text DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS last_insert_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_inserted_at timestamptz;

CREATE TABLE IF NOT EXISTS public.campaign_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  msisdn text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_data_campaign_id ON public.campaign_data(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_data_msisdn ON public.campaign_data(msisdn);

ALTER TABLE public.campaign_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view campaign data" ON public.campaign_data FOR SELECT USING (true);
CREATE POLICY "Anyone can insert campaign data" ON public.campaign_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update campaign data" ON public.campaign_data FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete campaign data" ON public.campaign_data FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.get_campaign_row_count(target_campaign uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*) FROM public.campaign_data WHERE campaign_id = target_campaign;
$$;

CREATE OR REPLACE FUNCTION public.insert_campaign_msisdns(target_campaign uuid, rows jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row_data jsonb;
  msisdn_val text;
  inserted int := 0;
BEGIN
  FOR row_data IN SELECT * FROM jsonb_array_elements(rows)
  LOOP
    msisdn_val := COALESCE(
      row_data->>'msisdn',
      row_data->>'MSISDN',
      row_data->>'phone',
      row_data->>'Phone',
      row_data->>'phone_number',
      row_data->>'mobile'
    );
    IF msisdn_val IS NOT NULL AND length(trim(msisdn_val)) > 0 THEN
      INSERT INTO public.campaign_data(campaign_id, msisdn, payload)
      VALUES (target_campaign, trim(msisdn_val), row_data);
      inserted := inserted + 1;
    END IF;
  END LOOP;

  UPDATE public.campaigns
  SET last_insert_count = inserted,
      last_inserted_at = now(),
      updated_at = now()
  WHERE id = target_campaign;

  RETURN inserted;
END;
$$;
