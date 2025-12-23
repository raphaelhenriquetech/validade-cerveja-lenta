import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface J3SellerConfig {
  id: string;
  cnpj_transportadora: string;
  cnpj_vendedor: string;
  cliente: string;
  razao_social: string;
  cod_cliente: string;
  ie_vendedor: string | null;
  telefone_vendedor: string | null;
  email_vendedor: string | null;
  local_retirada: string;
  numero_retirada: string | null;
  complemento_retirada: string | null;
  bairro_retirada: string;
  cidade_retirada: string;
  estado_retirada: string;
  cep_vendedor: string;
  ambiente: string;
  created_at: string | null;
  updated_at: string | null;
}

export const useJ3SellerConfig = () => {
  const [config, setConfig] = useState<J3SellerConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('j3_seller_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setConfig(data);
    } catch (error) {
      console.error('Error fetching J3 seller config:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    loading,
    refetch: fetchConfig,
  };
};
