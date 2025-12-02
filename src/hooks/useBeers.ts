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

const logActivity = async (
  actionType: string,
  entityType: string,
  entityId: string | null,
  description: string,
  oldValues?: Record<string, any> | null,
  newValues?: Record<string, any> | null
) => {
  try {
    await supabase.from('activity_logs').insert({
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId,
      description,
      old_values: oldValues || null,
      new_values: newValues || null,
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

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

      await logActivity(
        'batch_created',
        'beer_batch',
        null,
        `Novo lote cadastrado: ${beerName} - Lote ${lot} (${quantity} un.)`
      );

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

  const deleteBatch = async (batchId: string, batchInfo?: { beer_name: string; lot: string }) => {
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

      if (batchInfo) {
        await logActivity(
          'batch_deleted',
          'beer_batch',
          batchId,
          `Lote excluído: ${batchInfo.beer_name} - Lote ${batchInfo.lot}`
        );
      }

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

  const updateBatch = async (batchId: string, updates: Partial<BeerBatch>, oldBatch?: BeerBatch) => {
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

      if (oldBatch) {
        const changes: string[] = [];
        if (updates.quantity !== undefined && updates.quantity !== oldBatch.quantity) {
          changes.push(`quantidade: ${oldBatch.quantity} → ${updates.quantity}`);
        }
        if (updates.beer_name && updates.beer_name !== oldBatch.beer_name) {
          changes.push(`nome: ${oldBatch.beer_name} → ${updates.beer_name}`);
        }
        if (updates.expiration_date && updates.expiration_date !== oldBatch.expiration_date) {
          changes.push(`validade alterada`);
        }

        await logActivity(
          'batch_updated',
          'beer_batch',
          batchId,
          `Lote ${oldBatch.lot} atualizado: ${changes.join(', ')}`,
          { quantity: oldBatch.quantity, beer_name: oldBatch.beer_name, expiration_date: oldBatch.expiration_date },
          updates
        );
      }

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
