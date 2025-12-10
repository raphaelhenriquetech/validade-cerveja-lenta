import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BeerBatch {
  id: string;
  beer_name: string;
  lot: string;
  quantity: number;
  expiration_date: string;
  sku?: string | null;
  olist_synced?: boolean;
  olist_synced_at?: string | null;
  archived?: boolean;
  archived_at?: string | null;
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
  const [archivedBatches, setArchivedBatches] = useState<BeerBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBatches = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('beer_batches')
        .select('*')
        .eq('archived', false)
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

  const fetchArchivedBatches = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('beer_batches')
        .select('*')
        .eq('archived', true)
        .order('archived_at', { ascending: false });

      if (error) throw error;
      setArchivedBatches(data || []);
    } catch (error: any) {
      console.error('Error fetching archived batches:', error);
      toast({
        title: 'Erro ao carregar lotes arquivados',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchBatches();
    fetchArchivedBatches();
  }, [fetchBatches, fetchArchivedBatches]);

  const addBatch = async (beerName: string, lot: string, quantity: number, expirationDate: string, sku?: string) => {
    try {
      const { error } = await supabase
        .from('beer_batches')
        .insert({
          beer_name: beerName,
          lot,
          quantity,
          expiration_date: expirationDate,
          sku: sku || null,
        });

      if (error) throw error;

      toast({
        title: 'Lote adicionado',
        description: `${beerName} - Lote ${lot}${sku ? ` (SKU: ${sku})` : ''}`,
      });

      await logActivity(
        'batch_created',
        'beer_batch',
        null,
        `Novo lote cadastrado: ${beerName} - Lote ${lot}${sku ? ` - SKU ${sku}` : ''} (${quantity} un.)`
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
      fetchArchivedBatches();
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
        if (updates.sku !== undefined && updates.sku !== oldBatch.sku) {
          changes.push(`SKU: ${oldBatch.sku || '(vazio)'} → ${updates.sku || '(vazio)'}`);
        }

        await logActivity(
          'batch_updated',
          'beer_batch',
          batchId,
          `Lote ${oldBatch.lot} atualizado: ${changes.join(', ')}`,
          { quantity: oldBatch.quantity, beer_name: oldBatch.beer_name, expiration_date: oldBatch.expiration_date, sku: oldBatch.sku },
          updates
        );
      }

      fetchBatches();
      fetchArchivedBatches();
    } catch (error: any) {
      console.error('Error updating batch:', error);
      toast({
        title: 'Erro ao atualizar lote',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleOlistSync = async (batchId: string, currentState: boolean, batchInfo: { beer_name: string; lot: string }) => {
    try {
      const newState = !currentState;
      const syncedAt = newState ? new Date().toISOString() : null;

      const { error } = await supabase
        .from('beer_batches')
        .update({
          olist_synced: newState,
          olist_synced_at: syncedAt,
        })
        .eq('id', batchId);

      if (error) throw error;

      toast({
        title: newState ? 'Marcado como lançado' : 'Desmarcado',
        description: `${batchInfo.beer_name} - Lote ${batchInfo.lot}`,
      });

      await logActivity(
        newState ? 'olist_synced' : 'olist_unsynced',
        'beer_batch',
        batchId,
        newState 
          ? `Lote marcado como lançado no Olist: ${batchInfo.beer_name} - Lote ${batchInfo.lot}`
          : `Lote desmarcado do Olist: ${batchInfo.beer_name} - Lote ${batchInfo.lot}`
      );

      fetchBatches();
      fetchArchivedBatches();
    } catch (error: any) {
      console.error('Error toggling Olist sync:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleArchive = async (batchId: string, currentState: boolean, batchInfo: { beer_name: string; lot: string }) => {
    try {
      const newState = !currentState;
      const archivedAt = newState ? new Date().toISOString() : null;

      const { error } = await supabase
        .from('beer_batches')
        .update({
          archived: newState,
          archived_at: archivedAt,
        })
        .eq('id', batchId);

      if (error) throw error;

      toast({
        title: newState ? 'Lote arquivado' : 'Lote desarquivado',
        description: `${batchInfo.beer_name} - Lote ${batchInfo.lot}`,
      });

      await logActivity(
        newState ? 'batch_archived' : 'batch_unarchived',
        'beer_batch',
        batchId,
        newState 
          ? `Lote arquivado: ${batchInfo.beer_name} - Lote ${batchInfo.lot}`
          : `Lote desarquivado: ${batchInfo.beer_name} - Lote ${batchInfo.lot}`
      );

      fetchBatches();
      fetchArchivedBatches();
    } catch (error: any) {
      console.error('Error toggling archive:', error);
      toast({
        title: 'Erro ao arquivar/desarquivar lote',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return { 
    batches, 
    archivedBatches,
    loading, 
    addBatch, 
    deleteBatch, 
    updateBatch, 
    toggleOlistSync, 
    toggleArchive,
    refetch: fetchBatches,
    refetchArchived: fetchArchivedBatches
  };
}
