import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExpirationBadge, getDaysUntilExpiration } from './ExpirationBadge';
import { Trash2, Beer as BeerIcon, Package, Pencil } from 'lucide-react';
import { format, parseISO } from 'date-fns';
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
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
            <BeerIcon className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cervejas Cadastradas</h2>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="bg-gray-100 dark:bg-zinc-800 rounded-full px-3 py-1 text-sm flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300">{filteredBatches.length} lotes</span>
          </div>
          <div className="bg-primary/10 dark:bg-primary/20 text-primary rounded-full px-3 py-1 text-sm font-semibold">
            {totalQuantity} un.
          </div>
        </div>
      </div>

      {sortedBatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-gray-100 dark:bg-zinc-800 mb-4">
            <BeerIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            {filter === 'all' 
              ? 'Nenhuma cerveja cadastrada ainda.' 
              : 'Nenhuma cerveja encontrada com este filtro.'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            {filter === 'all' && 'Adicione seu primeiro lote usando o formulário acima.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                <TableHead className="p-4 pl-6 text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wider w-2/5">Cerveja</TableHead>
                <TableHead className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wider">Lote</TableHead>
                <TableHead className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wider text-center">Qtd</TableHead>
                <TableHead className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wider">Validade</TableHead>
                <TableHead className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wider">Status</TableHead>
                <TableHead className="p-4 pr-6 text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wider">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-200 dark:divide-zinc-800">
              {Object.entries(groupedBatches).map(([beerName, beerBatches]) =>
                beerBatches.map((batch, index) => {
                  const days = getDaysUntilExpiration(batch.expiration_date);
                  const isUrgent = days <= 7;
                  
                  return (
                    <TableRow 
                      key={batch.id}
                      className={cn(
                        "transition-colors",
                        isUrgent && "bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20",
                        !isUrgent && "hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                      )}
                    >
                      {index === 0 ? (
                        <TableCell rowSpan={beerBatches.length} className="p-4 pl-6 text-sm text-gray-900 dark:text-white font-medium align-top">
                          <div className="flex items-center gap-3">
                            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                            <span>{beerName}</span>
                            {beerBatches.length > 1 && (
                              <Badge variant="secondary" className="text-xs">
                                {beerBatches.length} lotes
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      ) : null}
                      <TableCell className="p-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {batch.lot}
                      </TableCell>
                      <TableCell className="p-4 text-sm text-gray-900 dark:text-white font-semibold text-center">
                        {batch.quantity}
                      </TableCell>
                      <TableCell className="p-4 text-sm text-gray-500 dark:text-gray-400">
                        {format(parseISO(batch.expiration_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="p-4">
                        <ExpirationBadge expirationDate={batch.expiration_date} />
                      </TableCell>
                      <TableCell className="p-4 pr-6">
                        <div className="flex items-center gap-2">
                          <button 
                            className="text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary transition-colors"
                            onClick={() => {
                              setEditingBatch(batch);
                              setEditQuantity(batch.quantity.toString());
                              setEditBeerName(batch.beer_name);
                              setEditExpirationDate(batch.expiration_date);
                            }}
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-500 transition-colors">
                                <Trash2 className="h-5 w-5" />
                              </button>
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
    </div>
  );
}
