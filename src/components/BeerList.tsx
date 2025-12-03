import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExpirationBadge, getDaysUntilExpiration } from './ExpirationBadge';
import { Trash2, Beer as BeerIcon, Package, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo, useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BeerBatch } from '@/hooks/useBeers';
import { cn } from '@/lib/utils';

interface BeerListProps {
  batches: BeerBatch[];
  onDeleteBatch: (batchId: string, batchInfo?: { beer_name: string; lot: string }) => void;
  onUpdateBatch: (batchId: string, updates: Partial<BeerBatch>, oldBatch?: BeerBatch) => void;
  filter: string;
}

export function BeerList({ batches, onDeleteBatch, onUpdateBatch, filter }: BeerListProps) {
  const [editingBatch, setEditingBatch] = useState<BeerBatch | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editBeerName, setEditBeerName] = useState('');
  const [editExpirationDate, setEditExpirationDate] = useState('');

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
    <Card className="border border-border/50 shadow-sm overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-secondary/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <BeerIcon className="h-5 w-5 text-primary" />
            </div>
            Cervejas Cadastradas
          </CardTitle>
          <div className="flex gap-3 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border/50">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{filteredBatches.length} lote{filteredBatches.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="font-bold text-primary">{totalQuantity}</span>
              <span className="text-muted-foreground">un.</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {sortedBatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-secondary mb-4">
              <BeerIcon className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground font-medium">
              {filter === 'all' 
                ? 'Nenhuma cerveja cadastrada ainda.' 
                : 'Nenhuma cerveja encontrada com este filtro.'}
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {filter === 'all' && 'Adicione seu primeiro lote usando o formulário acima.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50 hover:bg-secondary/50 border-b border-border/50">
                  <TableHead className="font-semibold text-foreground">Cerveja</TableHead>
                  <TableHead className="font-semibold text-foreground">Lote</TableHead>
                  <TableHead className="text-center font-semibold text-foreground">Qtd</TableHead>
                  <TableHead className="font-semibold text-foreground">Validade</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedBatches).map(([beerName, beerBatches]) =>
                  beerBatches.map((batch, index) => {
                    const days = getDaysUntilExpiration(batch.expiration_date);
                    const isUrgent = days <= 7;
                    
                    return (
                      <TableRow 
                        key={batch.id}
                        className={cn(
                          "transition-colors border-b border-border/30",
                          isUrgent && "bg-destructive/5 hover:bg-destructive/10",
                          !isUrgent && "hover:bg-secondary/30"
                        )}
                      >
                        {index === 0 ? (
                          <TableCell rowSpan={beerBatches.length} className="font-medium align-top">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-primary"></span>
                              {beerName}
                              {beerBatches.length > 1 && (
                                <Badge variant="secondary" className="text-xs">
                                  {beerBatches.length} lotes
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        ) : null}
                        <TableCell>
                          <code className="px-2 py-1 rounded-md bg-secondary text-sm font-mono">
                            {batch.lot}
                          </code>
                        </TableCell>
                        <TableCell className="text-center font-bold">{batch.quantity}</TableCell>
                        <TableCell>
                          {format(new Date(batch.expiration_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <ExpirationBadge expirationDate={batch.expiration_date} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              onClick={() => {
                                setEditingBatch(batch);
                                setEditQuantity(batch.quantity.toString());
                                setEditBeerName(batch.beer_name);
                                setEditExpirationDate(batch.expiration_date);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                >
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
                                    onClick={() => onDeleteBatch(batch.id, { beer_name: batch.beer_name, lot: batch.lot })}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={!!editingBatch} onOpenChange={(open) => !open && setEditingBatch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Lote</DialogTitle>
            <DialogDescription>
              Altere as informações do lote {editingBatch?.lot}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="beer_name">Nome da Cerveja</Label>
              <Input
                id="beer_name"
                value={editBeerName}
                onChange={(e) => setEditBeerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiration_date">Data de Validade</Label>
              <Input
                id="expiration_date"
                type="date"
                value={editExpirationDate}
                onChange={(e) => setEditExpirationDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBatch(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (editingBatch) {
                  const updates: Partial<BeerBatch> = {};
                  if (editQuantity && parseInt(editQuantity) !== editingBatch.quantity) {
                    updates.quantity = parseInt(editQuantity);
                  }
                  if (editBeerName && editBeerName !== editingBatch.beer_name) {
                    updates.beer_name = editBeerName;
                  }
                  if (editExpirationDate && editExpirationDate !== editingBatch.expiration_date) {
                    updates.expiration_date = editExpirationDate;
                  }
                  if (Object.keys(updates).length > 0) {
                    onUpdateBatch(editingBatch.id, updates, editingBatch);
                  }
                  setEditingBatch(null);
                }
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}