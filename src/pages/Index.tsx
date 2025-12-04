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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-muted-foreground">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Modern Header with backdrop blur */}
      <header className="bg-card/80 dark:bg-card/50 backdrop-blur-sm border-b border-border/50 dark:border-border/30 px-4 lg:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="bg-primary p-2.5 lg:p-3 rounded-xl shadow-lg shadow-primary/30">
              <Beer className="h-5 w-5 lg:h-6 lg:w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-foreground">StockBrew</h1>
              <p className="text-xs lg:text-sm text-muted-foreground">Controle de Validades</p>
            </div>
          </div>
          <div className="flex items-center gap-1 lg:gap-2 text-muted-foreground">
            <ReportGenerator batches={batches} />
            <Link to="/produtos-tiny">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 lg:h-10 lg:w-10 hover:bg-secondary dark:hover:bg-secondary/50"
                title="Produtos Tiny"
              >
                <Package className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/configuracoes">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 lg:h-10 lg:w-10 hover:bg-secondary dark:hover:bg-secondary/50"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="h-9 w-9 lg:h-10 lg:w-10 hover:bg-secondary dark:hover:bg-secondary/50"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 lg:p-8">
        <div className="max-w-screen-2xl mx-auto space-y-6 lg:space-y-8">
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
