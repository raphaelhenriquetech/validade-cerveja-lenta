import { useState } from 'react';
import { BeerForm } from '@/components/BeerForm';
import { BeerList } from '@/components/BeerList';
import { ExpirationDashboard } from '@/components/ExpirationDashboard';
import { useBeers } from '@/hooks/useBeers';
import { Loader2 } from 'lucide-react';
import { ReportGenerator } from '@/components/ReportGenerator';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const {
    batches, archivedBatches, loading, addBatch, deleteBatch, updateBatch,
    toggleOlistSync, toggleArchive, syncStockToTiny, syncingSkus, updateTinyDescription,
  } = useBeers();
  const [filter, setFilter] = useState('all');

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-muted-foreground">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-grow p-4 md:p-6 lg:p-8">
        <div className="max-w-screen-2xl mx-auto space-y-6 md:space-y-8">
          <div className="flex items-center justify-between animate-fade-in">
            <div>
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Visão geral</h2>
              <p className="text-sm text-muted-foreground">Acompanhe validades e movimente estoque com o Tiny.</p>
            </div>
            <ReportGenerator batches={batches} />
          </div>

          <div className="animate-fade-in">
            <ExpirationDashboard batches={batches} onFilterChange={setFilter} activeFilter={filter} />
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <BeerForm onAdd={addBatch} />
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="active" className="gap-2">
                  Lotes ativos
                  <span className="bg-primary/15 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                    {batches.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="archived" className="gap-2">
                  Arquivados
                  <span className="bg-muted text-muted-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                    {archivedBatches.length}
                  </span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="active">
                <BeerList
                  batches={batches}
                  onDeleteBatch={deleteBatch}
                  onUpdateBatch={updateBatch}
                  onToggleOlistSync={toggleOlistSync}
                  onToggleArchive={toggleArchive}
                  filter={filter}
                />
              </TabsContent>
              <TabsContent value="archived">
                <BeerList
                  batches={archivedBatches}
                  onDeleteBatch={deleteBatch}
                  onUpdateBatch={updateBatch}
                  onToggleArchive={toggleArchive}
                  filter="all"
                  isArchivedView={true}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Index;
