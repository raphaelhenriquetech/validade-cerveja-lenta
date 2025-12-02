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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <Beer className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Controle de Validades</h1>
                <p className="text-sm text-muted-foreground">Cerveja Lenta</p>
              </div>
            </div>
            <Link to="/configuracoes">
              <Button variant="outline" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <ExpirationDashboard 
          batches={batches} 
          onFilterChange={setFilter} 
          activeFilter={filter} 
        />
        <BeerForm onAdd={addBatch} />
        <BeerList batches={batches} onDeleteBatch={deleteBatch} filter={filter} />
      </main>
    </div>
  );
};

export default Index;
