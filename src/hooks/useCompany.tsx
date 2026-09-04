import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  accent_color: string | null;
}

interface CompanyContextValue {
  company: Company | null;
  companies: Company[];
  companyId: string | null;
  loading: boolean;
  selectCompany: (id: string) => void;
}

const CompanyContext = createContext<CompanyContextValue>({
  company: null,
  companies: [],
  companyId: null,
  loading: true,
  selectCompany: () => {},
});

const STORAGE_KEY = "stockbrew:selected-company";

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setCompanies([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("companies")
      .select("id, name, slug, logo_url, accent_color")
      .order("name", { ascending: true });

    if (error) {
      console.error("Erro ao carregar empresas:", error);
      setCompanies([]);
    } else {
      setCompanies(data ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const company = useMemo(() => {
    if (companies.length === 0) return null;
    return companies.find((c) => c.id === selectedId) ?? companies[0];
  }, [companies, selectedId]);

  useEffect(() => {
    if (company) localStorage.setItem(STORAGE_KEY, company.id);
  }, [company]);

  const selectCompany = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setSelectedId(id);
  }, []);

  return (
    <CompanyContext.Provider
      value={{
        company,
        companies,
        companyId: company?.id ?? null,
        loading,
        selectCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => useContext(CompanyContext);

/** Resolve a empresa ativa fora de componentes React (helpers, logs). */
export async function resolveActiveCompanyId(): Promise<string | null> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;
  const { data } = await supabase
    .from("companies")
    .select("id")
    .order("name", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (data?.id) localStorage.setItem(STORAGE_KEY, data.id);
  return data?.id ?? null;
}
