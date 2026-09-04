import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { resolveActiveCompanyId } from '@/hooks/useCompany';

export interface ActivityLog {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  description: string;
  old_values: Json | null;
  new_values: Json | null;
  created_at: string;
}

export function useActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const logActivity = async (
    actionType: string,
    entityType: string,
    entityId: string | null,
    description: string,
    oldValues?: Record<string, any> | null,
    newValues?: Record<string, any> | null
  ) => {
    try {
      const companyId = await resolveActiveCompanyId();
      if (!companyId) return;
      const { error } = await supabase
        .from('activity_logs')
        .insert({
          company_id: companyId,
          action_type: actionType,
          entity_type: entityType,
          entity_id: entityId,
          description,
          old_values: oldValues || null,
          new_values: newValues || null,
        });

      if (error) throw error;
      fetchLogs();
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  return { logs, loading, logActivity, refetch: fetchLogs };
}
