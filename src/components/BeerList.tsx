import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExpirationBadge, getDaysUntilExpiration } from './ExpirationBadge';
import { Trash2, Beer as BeerIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';
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
import { BeerBatch } from '@/hooks/useBeers';

interface BeerListProps {
  batches: BeerBatch[];
  onDeleteBatch: (batchId: string) => void;
  filter: string;
}

export function BeerList({ batches, onDeleteBatch, filter }: BeerListProps) {
  const filteredBatches = useMemo(() => {
    return batches.filter(batch => {
      const days = getDaysUntilExpiration(batch.expiration_date);
      switch (filter) {
        case 'expired':
          return days < 0;
        case 'critical':
          return days >= 0 && days <= 7;
        case '15days':
          return days >= 8 && days <= 15;
        case '30days':
          return days >= 16 && days <= 30;
        case 'ok':
          return days > 30;
        default:
          return true;
      }
    });
  }, [batches, filter]);

  const sortedBatches = useMemo(() => {
    return [...filteredBatches].sort((a, b) => 
      getDaysUntilExpiration(a.expiration_date) - getDaysUntilExpiration(b.expiration_date)
    );
  }, [filteredBatches]);

  const totalQuantity = filteredBatches.reduce((acc, batch) => acc + batch.quantity, 0);

  // Group by beer name for display
  const groupedBatches = useMemo(() => {
    const groups: { [key: string]: BeerBatch[] } = {};
    sortedBatches.forEach(batch => {
      if (!groups[batch.beer_name]) {
        groups[batch.beer_name] = [];
      }
      groups[batch.beer_name].push(batch);
    });
    return groups;
  }, [sortedBatches]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <BeerIcon className="h-5 w-5" />
            Cervejas Cadastradas
          </CardTitle>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{filteredBatches.length} lote{filteredBatches.length !== 1 ? 's' : ''}</span>
          <span>•</span>
          <span>{totalQuantity} unidade{totalQuantity !== 1 ? 's' : ''}</span>
        </div>
      </CardHeader>
      <CardContent>
        {sortedBatches.length === 0 ? (
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
                {Object.entries(groupedBatches).map(([beerName, beerBatches]) =>
                  beerBatches.map((batch, index) => (
                    <TableRow key={batch.id}>
                      {index === 0 ? (
                        <TableCell rowSpan={beerBatches.length} className="font-medium align-top">
                          <div className="flex items-center gap-2">
                            {beerName}
                            {beerBatches.length > 1 && (
                              <Badge variant="outline" className="text-xs">
                                {beerBatches.length} lotes
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      ) : null}
                      <TableCell className="font-mono text-sm">{batch.lot}</TableCell>
                      <TableCell className="text-center">{batch.quantity}</TableCell>
                      <TableCell>
                        {format(new Date(batch.expiration_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <ExpirationBadge expirationDate={batch.expiration_date} />
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
                                Tem certeza que deseja excluir o lote "{batch.lot}" da cerveja "{beerName}"?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDeleteBatch(batch.id)}
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
