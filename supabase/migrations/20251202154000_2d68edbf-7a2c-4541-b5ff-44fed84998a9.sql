-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all access to beer_batches" ON public.beer_batches;
DROP POLICY IF EXISTS "Allow all access to email_settings" ON public.email_settings;

-- Create proper RLS policies for beer_batches (require authentication)
CREATE POLICY "Authenticated users can view batches"
ON public.beer_batches
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert batches"
ON public.beer_batches
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update batches"
ON public.beer_batches
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete batches"
ON public.beer_batches
FOR DELETE
TO authenticated
USING (true);

-- Create proper RLS policies for email_settings (require authentication)
CREATE POLICY "Authenticated users can view email settings"
ON public.email_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert email settings"
ON public.email_settings
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update email settings"
ON public.email_settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete email settings"
ON public.email_settings
FOR DELETE
TO authenticated
USING (true);