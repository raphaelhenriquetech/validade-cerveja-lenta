import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BeerBatch {
  id: string;
  beer_name: string;
  lot: string;
  quantity: number;
  expiration_date: string;
}

export function useBeers() {
  const [batches, setBatches] = useState<BeerBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBatches = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('beer_batches')
        .select('*')
        .order('expiration_date', { ascending: true });

      if (error) throw error;
      setBatches(data || []);
    } catch (error: any) {
      console.error('Error fetching batches:', error);
      toast({
        title: 'Erro ao carregar lotes',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const addBatch = async (beerName: string, lot: string, quantity: number, expirationDate: string) => {
    try {
      const { error } = await supabase
        .from('beer_batches')
        .insert({
          beer_name: beerName,
          lot,
          quantity,
          expiration_date: expirationDate,
        });

      if (error) throw error;

      toast({
        title: 'Lote adicionado',
        description: `${beerName} - Lote ${lot}`,
      });

      fetchBatches();
    } catch (error: any) {
      console.error('Error adding batch:', error);
      toast({
        title: 'Erro ao adicionar lote',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteBatch = async (batchId: string) => {
    try {
      const { error } = await supabase
        .from('beer_batches')
        .delete()
        .eq('id', batchId);

      if (error) throw error;

      toast({
        title: 'Lote excluído',
        description: 'O lote foi removido com sucesso',
      });

      fetchBatches();
    } catch (error: any) {
      console.error('Error deleting batch:', error);
      toast({
        title: 'Erro ao excluir lote',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateBatch = async (batchId: string, updates: Partial<BeerBatch>) => {
    try {
      const { error } = await supabase
        .from('beer_batches')
        .update(updates)
        .eq('id', batchId);

      if (error) throw error;

      toast({
        title: 'Lote atualizado',
        description: 'As alterações foram salvas',
      });

      fetchBatches();
    } catch (error: any) {
      console.error('Error updating batch:', error);
      toast({
        title: 'Erro ao atualizar lote',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return { batches, loading, addBatch, deleteBatch, updateBatch, refetch: fetchBatches };
}
