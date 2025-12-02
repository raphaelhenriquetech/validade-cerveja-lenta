-- Criar tabela para lotes de cerveja
CREATE TABLE public.beer_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beer_name TEXT NOT NULL,
  lot TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  expiration_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.beer_batches ENABLE ROW LEVEL SECURITY;

-- Política de acesso público (sistema interno sem autenticação)
CREATE POLICY "Allow all access to beer_batches" ON public.beer_batches
  FOR ALL USING (true) WITH CHECK (true);

-- Criar tabela para configurações de email
CREATE TABLE public.email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- Política de acesso público
CREATE POLICY "Allow all access to email_settings" ON public.email_settings
  FOR ALL USING (true) WITH CHECK (true);