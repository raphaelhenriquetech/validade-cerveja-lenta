import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BeerForm } from '@/components/BeerForm';
import { BeerList } from '@/components/BeerList';
import { ExpirationDashboard } from '@/components/ExpirationDashboard';
import { useBeers } from '@/hooks/useBeers';
import { Beer, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { batches, loading, addBatch, deleteBatch } = useBeers();
  const [filter, setFilter] = useState('all');

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
    <div className="min-h-screen bg-background">
      {/* Header with gradient */}
      <header className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 shadow-xl">
                <Beer className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Controle de Validades</h1>
                <p className="text-sm text-primary-foreground/80">Cerveja Lenta</p>
              </div>
            </div>
            <Link to="/configuracoes">
              <Button 
                variant="secondary" 
                size="icon" 
                className="bg-primary-foreground/10 hover:bg-primary-foreground/20 border-primary-foreground/20 backdrop-blur-sm transition-all hover:scale-105"
              >
                <Settings className="h-5 w-5 text-primary-foreground" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ExpirationDashboard 
            batches={batches} 
            onFilterChange={setFilter} 
            activeFilter={filter} 
          />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <BeerForm onAdd={addBatch} />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <BeerList batches={batches} onDeleteBatch={deleteBatch} filter={filter} />
        </div>
      </main>
    </div>
  );
};

export default Index;
