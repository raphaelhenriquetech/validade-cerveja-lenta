-- Create activity_logs table for tracking all changes
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL, -- 'batch_created', 'batch_updated', 'batch_deleted', 'email_added', 'email_deleted'
  entity_type TEXT NOT NULL, -- 'beer_batch', 'email_setting'
  entity_id UUID,
  description TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users
CREATE POLICY "Authenticated users can view activity logs"
ON public.activity_logs
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (true);