import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BeerForm } from '@/components/BeerForm';
import { BeerList } from '@/components/BeerList';
import { ExpirationDashboard } from '@/components/ExpirationDashboard';
import { useBeers } from '@/hooks/useBeers';
import { useAuth } from '@/hooks/useAuth';
import { Beer, Settings, Loader2, LogOut, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ReportGenerator } from '@/components/ReportGenerator';
import Footer from '@/components/Footer';

const Index = () => {
  const { batches, loading, addBatch, deleteBatch, updateBatch } = useBeers();
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
          <div className="flex items-center gap-3 md:gap-4">
            <div className="bg-primary p-2.5 md:p-3 rounded-lg shadow-md shadow-primary/30">
              <Beer className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Controle de Validades</h1>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Cerveja Lenta</p>
            </div>
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
            <Link to="/configuracoes">
              <Button 
                variant="ghost" 
                size="icon" 
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
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
            <BeerList 
              batches={batches} 
              onDeleteBatch={deleteBatch} 
              onUpdateBatch={updateBatch}
              filter={filter} 
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
