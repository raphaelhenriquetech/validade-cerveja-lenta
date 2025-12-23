import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

import type { Json } from '@/integrations/supabase/types';

interface J3Order {
  id: string;
  codpedido: number | null;
  id_envio: string;
  id_venda: string;
  nome_comprador: string;
  endereco_entrega: string;
  bairro_entrega: string;
  cidade_entrega: string;
  estado_entrega: string;
  cep_entrega: string;
  telefone_comprador: string;
  cpf_cnpj_comprador: string | null;
  valor_pago: number | null;
  peso: number | null;
  cod_servico: string | null;
  status: string | null;
  api_response: Json | null;
  created_at: string | null;
}

export const useJ3Orders = () => {
  const [orders, setOrders] = useState<J3Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('j3_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching J3 orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    refetch: fetchOrders,
  };
};
