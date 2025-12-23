-- Tabela para configurações do vendedor (dados fixos)
CREATE TABLE public.j3_seller_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj_transportadora TEXT NOT NULL,
  cnpj_vendedor TEXT NOT NULL,
  cliente TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  cod_cliente TEXT NOT NULL,
  ie_vendedor TEXT,
  telefone_vendedor TEXT,
  email_vendedor TEXT,
  local_retirada TEXT NOT NULL,
  numero_retirada TEXT,
  complemento_retirada TEXT,
  bairro_retirada TEXT NOT NULL,
  cidade_retirada TEXT NOT NULL,
  estado_retirada TEXT NOT NULL,
  cep_vendedor TEXT NOT NULL,
  ambiente TEXT DEFAULT 'homologacao',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para histórico de pedidos enviados
CREATE TABLE public.j3_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codpedido INTEGER,
  id_envio TEXT NOT NULL,
  id_venda TEXT NOT NULL,
  nome_comprador TEXT NOT NULL,
  endereco_entrega TEXT NOT NULL,
  bairro_entrega TEXT NOT NULL,
  cidade_entrega TEXT NOT NULL,
  estado_entrega TEXT NOT NULL,
  cep_entrega TEXT NOT NULL,
  telefone_comprador TEXT NOT NULL,
  cpf_cnpj_comprador TEXT,
  valor_pago DECIMAL(10,2),
  peso INTEGER,
  cod_servico TEXT DEFAULT '2',
  status TEXT DEFAULT 'enviado',
  api_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.j3_seller_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.j3_orders ENABLE ROW LEVEL SECURITY;

-- Políticas para j3_seller_config
CREATE POLICY "Authenticated users can view seller config"
ON public.j3_seller_config FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert seller config"
ON public.j3_seller_config FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update seller config"
ON public.j3_seller_config FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete seller config"
ON public.j3_seller_config FOR DELETE
USING (true);

-- Políticas para j3_orders
CREATE POLICY "Authenticated users can view orders"
ON public.j3_orders FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert orders"
ON public.j3_orders FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update orders"
ON public.j3_orders FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete orders"
ON public.j3_orders FOR DELETE
USING (true);