-- Add SKU column to beer_batches table
ALTER TABLE public.beer_batches 
ADD COLUMN sku TEXT DEFAULT NULL;