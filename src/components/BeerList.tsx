import { Beer, ExpirationFilter } from '@/types/beer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExpirationBadge, getDaysUntilExpiration } from './ExpirationBadge';
import { Trash2, Beer as BeerIcon, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useMemo } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface BeerListProps {
  beers: Beer[];
  onDeleteBatch: (beerId: string, batchId: string) => void;
}

const filterOptions: { value: ExpirationFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'critical', label: 'Crítico (até 7 dias)' },
  { value: '15days', label: 'Até 15 dias' },
  { value: '30days', label: 'Até 30 dias' },
  { value: '60days', label: 'Até 60 dias' },
  { value: '120days', label: 'Até 120 dias' },
];

export function BeerList({ beers, onDeleteBatch }: BeerListProps) {
  const [filter, setFilter] = useState<ExpirationFilter>('all');

  const filteredBeers = useMemo(() => {
    return beers.map(beer => ({
      ...beer,
      batches: beer.batches.filter(batch => {
        const days = getDaysUntilExpiration(batch.expirationDate);
        switch (filter) {
          case 'critical':
            return days <= 7;
          case '15days':
            return days <= 15;
          case '30days':
            return days <= 30;
          case '60days':
            return days <= 60;
          case '120days':
            return days <= 120;
          default:
            return true;
        }
      })
    })).filter(beer => beer.batches.length > 0);
  }, [beers, filter]);

  const totalBatches = filteredBeers.reduce((acc, beer) => acc + beer.batches.length, 0);
  const totalQuantity = filteredBeers.reduce((acc, beer) => 
    acc + beer.batches.reduce((bAcc, batch) => bAcc + batch.quantity, 0), 0
  );

  const sortedBeers = useMemo(() => {
    return filteredBeers.map(beer => ({
      ...beer,
      batches: [...beer.batches].sort((a, b) => 
        getDaysUntilExpiration(a.expirationDate) - getDaysUntilExpiration(b.expirationDate)
      )
    })).sort((a, b) => {
      const aMinDays = Math.min(...a.batches.map(batch => getDaysUntilExpiration(batch.expirationDate)));
      const bMinDays = Math.min(...b.batches.map(batch => getDaysUntilExpiration(batch.expirationDate)));
      return aMinDays - bMinDays;
    });
  }, [filteredBeers]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <BeerIcon className="h-5 w-5" />
            Cervejas Cadastradas
          </CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filter} onValueChange={(value) => setFilter(value as ExpirationFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por validade" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{totalBatches} lote{totalBatches !== 1 ? 's' : ''}</span>
          <span>•</span>
          <span>{totalQuantity} unidade{totalQuantity !== 1 ? 's' : ''}</span>
        </div>
      </CardHeader>
      <CardContent>
        {sortedBeers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BeerIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {filter === 'all' 
                ? 'Nenhuma cerveja cadastrada ainda.' 
                : 'Nenhuma cerveja encontrada com este filtro.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cerveja</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedBeers.map(beer => 
                  beer.batches.map((batch, index) => (
                    <TableRow key={batch.id}>
                      {index === 0 ? (
                        <TableCell rowSpan={beer.batches.length} className="font-medium align-top">
                          <div className="flex items-center gap-2">
                            {beer.name}
                            {beer.batches.length > 1 && (
                              <Badge variant="outline" className="text-xs">
                                {beer.batches.length} lotes
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      ) : null}
                      <TableCell className="font-mono text-sm">{batch.lot}</TableCell>
                      <TableCell className="text-center">{batch.quantity}</TableCell>
                      <TableCell>
                        {format(new Date(batch.expirationDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <ExpirationBadge expirationDate={batch.expirationDate} />
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir lote?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o lote "{batch.lot}" da cerveja "{beer.name}"?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDeleteBatch(beer.id, batch.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
