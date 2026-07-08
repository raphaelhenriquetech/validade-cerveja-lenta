CREATE TABLE public.tiny_product_cache (
  sku TEXT PRIMARY KEY,
  image_url TEXT,
  product_name TEXT,
  tiny_product_id TEXT,
  not_found BOOLEAN NOT NULL DEFAULT false,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tiny_product_cache TO authenticated;
GRANT ALL ON public.tiny_product_cache TO service_role;

ALTER TABLE public.tiny_product_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tiny product cache"
  ON public.tiny_product_cache
  FOR SELECT
  TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_tiny_product_cache_updated_at
BEFORE UPDATE ON public.tiny_product_cache
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();