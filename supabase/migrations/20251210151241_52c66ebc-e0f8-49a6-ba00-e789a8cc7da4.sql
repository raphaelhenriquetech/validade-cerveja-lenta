-- Add archived columns to beer_batches table
ALTER TABLE public.beer_batches 
ADD COLUMN archived BOOLEAN DEFAULT FALSE,
ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for faster queries on archived status
CREATE INDEX idx_beer_batches_archived ON public.beer_batches(archived);