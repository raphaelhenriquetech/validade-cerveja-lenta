-- Criar tabela para configurações do WhatsApp com CallMeBot
CREATE TABLE public.whatsapp_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  apikey TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can view whatsapp settings"
ON public.whatsapp_settings FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert whatsapp settings"
ON public.whatsapp_settings FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can delete whatsapp settings"
ON public.whatsapp_settings FOR DELETE USING (true);

CREATE POLICY "Authenticated users can update whatsapp settings"
ON public.whatsapp_settings FOR UPDATE USING (true) WITH CHECK (true);