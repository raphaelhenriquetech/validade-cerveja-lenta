CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  accent_color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id)
);
GRANT SELECT ON public.company_members TO authenticated;
GRANT ALL ON public.company_members TO service_role;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_members_updated_at BEFORE UPDATE ON public.company_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.has_company_access(_user_id uuid, _company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = _user_id AND company_id = _company_id
  )
$$;

CREATE OR REPLACE FUNCTION public.current_company_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.company_members
  WHERE user_id = _user_id
  ORDER BY created_at ASC
  LIMIT 1
$$;

CREATE POLICY "Members can view their companies" ON public.companies
  FOR SELECT TO authenticated USING (public.has_company_access(auth.uid(), id));

CREATE POLICY "Users can view their own memberships" ON public.company_members
  FOR SELECT TO authenticated USING (user_id = auth.uid());

INSERT INTO public.companies (name, slug, accent_color)
VALUES ('Cerveja Lenta', 'cerveja-lenta', '#7C3AED');
INSERT INTO public.companies (name, slug, accent_color)
VALUES ('Na Caixa Cestaria', 'na-caixa-cestaria', '#DC2626');

-- Vincula todos os usuários existentes à Cerveja Lenta
INSERT INTO public.company_members (user_id, company_id, role)
SELECT u.id, c.id, 'admin'
FROM auth.users u
CROSS JOIN public.companies c
WHERE c.slug = 'cerveja-lenta'
ON CONFLICT DO NOTHING;

ALTER TABLE public.beer_batches ADD COLUMN company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.activity_logs ADD COLUMN company_id uuid REFERENCES public.companies(id);

UPDATE public.beer_batches SET company_id = (SELECT id FROM public.companies WHERE slug = 'cerveja-lenta') WHERE company_id IS NULL;
UPDATE public.activity_logs SET company_id = (SELECT id FROM public.companies WHERE slug = 'cerveja-lenta') WHERE company_id IS NULL;

CREATE OR REPLACE FUNCTION public.set_company_id_from_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    NEW.company_id := public.current_company_id(auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_beer_batches_company BEFORE INSERT ON public.beer_batches
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id_from_user();
CREATE TRIGGER set_activity_logs_company BEFORE INSERT ON public.activity_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id_from_user();

ALTER TABLE public.beer_batches ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.activity_logs ALTER COLUMN company_id SET NOT NULL;

CREATE INDEX idx_beer_batches_company ON public.beer_batches(company_id);
CREATE INDEX idx_activity_logs_company ON public.activity_logs(company_id);

DROP POLICY IF EXISTS "Authenticated users can view batches" ON public.beer_batches;
DROP POLICY IF EXISTS "Authenticated users can insert batches" ON public.beer_batches;
DROP POLICY IF EXISTS "Authenticated users can update batches" ON public.beer_batches;
DROP POLICY IF EXISTS "Authenticated users can delete batches" ON public.beer_batches;

CREATE POLICY "Company members can view batches" ON public.beer_batches
  FOR SELECT TO authenticated USING (public.has_company_access(auth.uid(), company_id));
CREATE POLICY "Company members can insert batches" ON public.beer_batches
  FOR INSERT TO authenticated WITH CHECK (public.has_company_access(auth.uid(), company_id));
CREATE POLICY "Company members can update batches" ON public.beer_batches
  FOR UPDATE TO authenticated USING (public.has_company_access(auth.uid(), company_id))
  WITH CHECK (public.has_company_access(auth.uid(), company_id));
CREATE POLICY "Company members can delete batches" ON public.beer_batches
  FOR DELETE TO authenticated USING (public.has_company_access(auth.uid(), company_id));

DROP POLICY IF EXISTS "Authenticated users can view activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Authenticated users can insert activity logs" ON public.activity_logs;

CREATE POLICY "Company members can view activity logs" ON public.activity_logs
  FOR SELECT TO authenticated USING (public.has_company_access(auth.uid(), company_id));
CREATE POLICY "Company members can insert activity logs" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (public.has_company_access(auth.uid(), company_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.beer_batches TO authenticated;
GRANT ALL ON public.beer_batches TO service_role;
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;