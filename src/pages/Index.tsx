import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BeerForm } from '@/components/BeerForm';
import { BeerList } from '@/components/BeerList';
import { ExpirationDashboard } from '@/components/ExpirationDashboard';
import { useBeers } from '@/hooks/useBeers';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Loader2, LogOut, Package, Truck } from 'lucide-react';
import stockbrewLogoLight from '@/assets/stockbrew-logo-light.png';
import stockbrewLogoDark from '@/assets/stockbrew-logo-dark.png';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ReportGenerator } from '@/components/ReportGenerator';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/ThemeToggle';

const Index = () => {
  const { batches, archivedBatches, loading, addBatch, deleteBatch, updateBatch, toggleOlistSync, toggleArchive, syncStockToTiny, syncingSkus, updateTinyDescription } = useBeers();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState('all');

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Erro ao sair',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#18181B] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-muted-foreground">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] dark:bg-[#18181B]">
      {/* Modern Header */}
      <header className="bg-white dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-700/50 px-4 md:px-6 py-4 sticky top-0 backdrop-blur-sm z-10">
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src={stockbrewLogoLight} 
              alt="StockBrew" 
              className="h-[68px] md:h-[82px] w-auto dark:hidden"
            />
            <img 
              src={stockbrewLogoDark} 
              alt="StockBrew" 
              className="h-[68px] md:h-[82px] w-auto hidden dark:block"
            />
          </div>
          <div className="flex items-center gap-1 md:gap-2 text-gray-500 dark:text-gray-400">
            <ReportGenerator batches={batches} />
            <Link to="/produtos-tiny">
              <Button 
                variant="ghost" 
                size="icon" 
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700"
                title="Produtos Tiny"
              >
                <Package className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/etiquetas-j3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700"
                title="Etiquetas J3/Tracken"
              >
                <Truck className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/configuracoes">
              <Button 
                variant="ghost" 
                size="icon" 
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-6 lg:p-8">
        <div className="max-w-screen-2xl mx-auto space-y-6 md:space-y-8">
          <div className="animate-fade-in">
            <ExpirationDashboard 
              batches={batches} 
              onFilterChange={setFilter} 
              activeFilter={filter} 
            />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <BeerForm onAdd={addBatch} />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="active" className="gap-2">
                  Lotes Ativos
                  <span className="bg-primary/20 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                    {batches.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="archived" className="gap-2">
                  Lotes Arquivados
                  <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-semibold px-2 py-0.5 rounded-full">
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
                  onSyncToTiny={syncStockToTiny}
                  onUpdateTinyDescription={updateTinyDescription}
                  syncingSkus={syncingSkus}
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
      </main>
      <Footer />
    </div>
  );
};

export default Index;
