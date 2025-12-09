-- Add Olist sync tracking columns to beer_batches
ALTER TABLE public.beer_batches 
ADD COLUMN olist_synced BOOLEAN DEFAULT FALSE,
ADD COLUMN olist_synced_at TIMESTAMPTZ DEFAULT NULL;