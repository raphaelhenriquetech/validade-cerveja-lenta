import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExpirationBadge, getDaysUntilExpiration } from './ExpirationBadge';
import { Trash2, Beer as BeerIcon, Package, Pencil, Search, X, Archive, ArchiveRestore, RefreshCw, Scale, Loader2, AlertTriangle } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BeerBatch } from '@/hooks/useBeers';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BeerListProps {
  batches: BeerBatch[];
  onDeleteBatch: (batchId: string, batchInfo?: { beer_name: string; lot: string }) => void;
  onUpdateBatch: (batchId: string, updates: Partial<BeerBatch>, oldBatch?: BeerBatch) => void;
  onToggleOlistSync?: (batchId: string, currentState: boolean, batchInfo: { beer_name: string; lot: string }) => void;
  onToggleArchive?: (batchId: string, currentState: boolean, batchInfo: { beer_name: string; lot: string }) => void;
  onSyncToTiny?: (sku: string, batchInfo: { beer_name: string; lot: string }) => Promise<boolean>;
  syncingSkus?: Set<string>;
  filter: string;
  isArchivedView?: boolean;
}

export function BeerList({ 
  batches, 
  onDeleteBatch, 
  onUpdateBatch, 
  onToggleOlistSync, 
  onToggleArchive,
  onSyncToTiny,
  syncingSkus = new Set(),
  filter,
  isArchivedView = false
}: BeerListProps) {
  const [editingBatch, setEditingBatch] = useState<BeerBatch | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editBeerName, setEditBeerName] = useState('');
  const [editExpirationDate, setEditExpirationDate] = useState('');
  const [editSku, setEditSku] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [tinyStocks, setTinyStocks] = useState<Record<string, number | null>>({});
  const [isComparing, setIsComparing] = useState(false);
  const [hasCompared, setHasCompared] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // First filter by search term
  const searchFilteredBatches = useMemo(() => {
    if (!searchTerm.trim()) return batches;
    const search = searchTerm.toLowerCase();
    return batches.filter(batch =>
      batch.beer_name.toLowerCase().includes(search) ||
      batch.lot.toLowerCase().includes(search) ||
      (batch.sku && batch.sku.toLowerCase().includes(search))
    );
  }, [batches, searchTerm]);

  // Then filter by status (only for active view)
  const filteredBatches = useMemo(() => {
    if (isArchivedView) return searchFilteredBatches;
    
    return searchFilteredBatches.filter(batch => {
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
  }, [searchFilteredBatches, filter, isArchivedView]);

  const sortedBatches = useMemo(() => {
    if (isArchivedView) {
      return [...filteredBatches].sort((a, b) => {
        const dateA = a.archived_at ? new Date(a.archived_at).getTime() : 0;
        const dateB = b.archived_at ? new Date(b.archived_at).getTime() : 0;
        return dateB - dateA;
      });
    }
    return [...filteredBatches].sort((a, b) => 
      getDaysUntilExpiration(a.expiration_date) - getDaysUntilExpiration(b.expiration_date)
    );
  }, [filteredBatches, isArchivedView]);

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

  // Calculate local stock by SKU (sum of all active batches per SKU)
  const localStockBySku = useMemo(() => {
    const stockMap: Record<string, number> = {};
    batches.forEach(batch => {
      if (batch.sku) {
        const cleanSku = batch.sku.trim();
        stockMap[cleanSku] = (stockMap[cleanSku] || 0) + batch.quantity;
      }
    });
    return stockMap;
  }, [batches]);

  const handleSyncToTiny = async (batch: BeerBatch) => {
    if (onSyncToTiny && batch.sku) {
      await onSyncToTiny(batch.sku, { beer_name: batch.beer_name, lot: batch.lot });
    }
  };

  const handleCompareStock = async () => {
    setIsComparing(true);
    try {
      // Get unique SKUs from active batches
      const uniqueSkus = [...new Set(batches.map(b => b.sku?.trim()).filter(Boolean))] as string[];
      
      if (uniqueSkus.length === 0) {
        toast({
          title: 'Nenhum SKU encontrado',
          description: 'Não há lotes com SKU cadastrado para comparar.',
        });
        setIsComparing(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('compare-tiny-stock', {
        body: { skus: uniqueSkus }
      });

      if (error) throw error;

      setTinyStocks(data.stocks || {});
      setHasCompared(true);

      // Count divergences
      const divergencias = Object.keys(data.stocks || {}).filter(sku => {
        const tinyStock = data.stocks[sku];
        const localStock = localStockBySku[sku] || 0;
        return tinyStock !== null && tinyStock !== localStock;
      });

      toast({
        title: divergencias.length > 0 
          ? `${divergencias.length} divergência(s) encontrada(s)` 
          : 'Estoque OK!',
        description: divergencias.length > 0 
          ? 'Verifique os itens marcados com "Divergente"'
          : 'Todos os estoques estão sincronizados com o Tiny',
        variant: divergencias.length > 0 ? 'destructive' : 'default',
      });
    } catch (error) {
      console.error('Erro ao comparar estoque:', error);
      toast({ 
        title: 'Erro', 
        description: error instanceof Error ? error.message : 'Erro ao comparar estoque', 
        variant: 'destructive' 
      });
    } finally {
      setIsComparing(false);
    }
  };

  // Check if a SKU has stock divergence
  const hasDivergence = (sku: string | null | undefined): boolean => {
    if (!hasCompared || !sku) return false;
    const cleanSku = sku.trim();
    const tinyStock = tinyStocks[cleanSku];
    const localStock = localStockBySku[cleanSku] || 0;
    return tinyStock !== null && tinyStock !== undefined && tinyStock !== localStock;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 md:p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isArchivedView 
                ? "bg-gray-100 dark:bg-gray-800" 
                : "bg-primary/10 dark:bg-primary/20"
            )}>
              {isArchivedView ? (
                <Archive className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <BeerIcon className="h-5 w-5 text-primary" />
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isArchivedView ? 'Lotes Arquivados' : 'Cervejas Cadastradas'}
            </h2>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="bg-gray-100 dark:bg-zinc-800 rounded-full px-3 py-1 text-sm flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">{filteredBatches.length} lotes</span>
            </div>
            <div className={cn(
              "rounded-full px-3 py-1 text-sm font-semibold",
              isArchivedView 
                ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                : "bg-primary/10 dark:bg-primary/20 text-primary"
            )}>
              {totalQuantity} un.
            </div>
          </div>
        </div>
        
        {/* Search field and Compare button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar cerveja ou lote..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-100 dark:bg-zinc-800 border-transparent focus:ring-primary focus:border-primary rounded-lg pl-10 pr-10 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Compare Stock Button - Desktop only, Active view only */}
          {!isMobile && !isArchivedView && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCompareStock}
              disabled={isComparing}
              className="gap-2 whitespace-nowrap"
            >
              {isComparing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Scale className="h-4 w-4" />
              )}
              Fazer Comparativo
            </Button>
          )}
        </div>
        
        {/* Stock Comparison Summary Card - Desktop only */}
        {!isMobile && hasCompared && !isArchivedView && (
          <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Resultado do Comparativo</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-semibold text-foreground">{Object.keys(tinyStocks).length} SKUs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                    <span className="text-muted-foreground">Divergentes:</span>
                    <span className="font-semibold text-destructive">
                      {Object.keys(tinyStocks).filter(sku => {
                        const tinyStock = tinyStocks[sku];
                        const localStock = localStockBySku[sku] || 0;
                        return tinyStock !== null && tinyStock !== localStock;
                      }).length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">OK:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {Object.keys(tinyStocks).filter(sku => {
                        const tinyStock = tinyStocks[sku];
                        const localStock = localStockBySku[sku] || 0;
                        return tinyStock !== null && tinyStock === localStock;
                      }).length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <span className="text-muted-foreground">Não encontrados:</span>
                    <span className="font-semibold text-muted-foreground">
                      {Object.values(tinyStocks).filter(v => v === null).length}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHasCompared(false)}
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {sortedBatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-gray-100 dark:bg-zinc-800 mb-4">
            {searchTerm ? (
              <Search className="h-10 w-10 text-gray-400 dark:text-gray-500" />
            ) : isArchivedView ? (
              <Archive className="h-10 w-10 text-gray-400 dark:text-gray-500" />
            ) : (
              <BeerIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            {searchTerm 
              ? `Nenhuma cerveja encontrada para "${searchTerm}"`
              : isArchivedView
                ? 'Nenhum lote arquivado ainda.'
                : filter === 'all' 
                  ? 'Nenhuma cerveja cadastrada ainda.' 
                  : 'Nenhuma cerveja encontrada com este filtro.'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            {!searchTerm && !isArchivedView && filter === 'all' && 'Adicione seu primeiro lote usando o formulário acima.'}
            {!searchTerm && isArchivedView && 'Os lotes arquivados aparecerão aqui.'}
          </p>
        </div>
      ) : (
        isMobile ? (
          // Mobile: Cards
          <div className="space-y-3 p-4">
            {sortedBatches.map((batch) => {
              const days = getDaysUntilExpiration(batch.expiration_date);
              const isUrgent = days <= 7 && !isArchivedView;
              const isSyncing = batch.sku ? syncingSkus.has(batch.sku) : false;
              
              return (
                <div 
                  key={batch.id}
                  className={cn(
                    "bg-card rounded-xl border p-4 space-y-3",
                    isUrgent 
                      ? "border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10" 
                      : "border-border"
                  )}
                >
                  {/* Header: Nome da cerveja + Badge de status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        isArchivedView ? "bg-muted-foreground" : "bg-primary"
                      )} />
                      <span className="font-medium text-foreground truncate">{batch.beer_name}</span>
                    </div>
                    {!isArchivedView && <ExpirationBadge expirationDate={batch.expiration_date} />}
                  </div>
                  
                  {/* Info grid: SKU, Lote, Qtd, Validade */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SKU:</span>
                      <span className="font-mono text-foreground">{batch.sku || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lote:</span>
                      <span className="font-mono text-foreground">{batch.lot}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Qtd:</span>
                      <span className="font-semibold text-foreground">{batch.quantity} un.</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Validade:</span>
                      <span className="text-foreground">{format(parseISO(batch.expiration_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                    {isArchivedView && batch.archived_at && (
                      <div className="col-span-2 flex justify-between pt-1 border-t border-border">
                        <span className="text-muted-foreground">Arquivado:</span>
                        <span className="text-muted-foreground">{format(new Date(batch.archived_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Olist checkbox (only for active view) */}
                  {!isArchivedView && (
                    <div className="border-t border-border pt-3">
                      <div 
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => {
                          if (onToggleOlistSync) {
                            onToggleOlistSync(batch.id, batch.olist_synced || false, {
                              beer_name: batch.beer_name,
                              lot: batch.lot,
                            });
                          }
                        }}
                      >
                        <Checkbox
                          checked={batch.olist_synced || false}
                          onCheckedChange={() => {}}
                          className={cn(
                            batch.olist_synced && "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                          )}
                        />
                        <span className={cn(
                          "text-sm",
                          batch.olist_synced 
                            ? "text-green-600 dark:text-green-400 font-medium" 
                            : "text-muted-foreground"
                        )}>
                          {batch.olist_synced ? "Lançado no Olist ✓" : "Lançar no Olist"}
                        </span>
                        {batch.olist_synced && batch.olist_synced_at && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {format(new Date(batch.olist_synced_at), "dd/MM", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Actions - Icon only buttons with tooltips */}
                  <TooltipProvider>
                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <div className="flex items-center gap-2">
                        {!isArchivedView && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 w-9 p-0"
                                  onClick={() => {
                                    setEditingBatch(batch);
                                    setEditQuantity(batch.quantity.toString());
                                    setEditBeerName(batch.beer_name);
                                    setEditExpirationDate(batch.expiration_date);
                                    setEditSku(batch.sku || '');
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 w-9 p-0"
                                  onClick={() => handleSyncToTiny(batch)}
                                  disabled={!batch.sku || isSyncing}
                                >
                                  <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Sincronizar Tiny</TooltipContent>
                            </Tooltip>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Archive/Unarchive */}
                        {onToggleArchive && (
                          <AlertDialog>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                      "h-9 w-9 p-0",
                                      isArchivedView 
                                        ? "text-green-600 hover:text-green-700 dark:text-green-400"
                                        : "text-amber-600 hover:text-amber-700 dark:text-amber-400"
                                    )}
                                  >
                                    {isArchivedView ? (
                                      <ArchiveRestore className="h-4 w-4" />
                                    ) : (
                                      <Archive className="h-4 w-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent>{isArchivedView ? 'Restaurar' : 'Arquivar'}</TooltipContent>
                            </Tooltip>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {isArchivedView ? 'Desarquivar lote?' : 'Arquivar lote?'}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {isArchivedView 
                                    ? `Tem certeza que deseja desarquivar o lote "${batch.lot}" da cerveja "${batch.beer_name}"?`
                                    : `Tem certeza que deseja arquivar o lote "${batch.lot}" da cerveja "${batch.beer_name}"?`
                                  }
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onToggleArchive(batch.id, batch.archived || false, { 
                                    beer_name: batch.beer_name, 
                                    lot: batch.lot 
                                  })}
                                  className={cn(
                                    isArchivedView 
                                      ? "bg-green-500 hover:bg-green-600"
                                      : "bg-amber-500 hover:bg-amber-600"
                                  )}
                                >
                                  {isArchivedView ? 'Desarquivar' : 'Arquivar'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {/* Delete */}
                        <AlertDialog>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent>Excluir</TooltipContent>
                          </Tooltip>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir lote?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o lote "{batch.lot}" da cerveja "{batch.beer_name}"?
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
                    </div>
                  </TooltipProvider>
                </div>
              );
            })}
          </div>
        ) : (
          // Desktop: Table
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                  <TableHead className="p-4 pl-6 text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wider">Cerveja</TableHead>
                  <TableHead className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wider">SKU</TableHead>
                  <TableHead className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wider">Lote</TableHead>
                  <TableHead className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wider text-center">Qtd</TableHead>
                  <TableHead className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wider">Validade</TableHead>
                  {isArchivedView ? (
                    <TableHead className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wider">Arquivado em</TableHead>
                  ) : (
                    <>
                      <TableHead className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wider">Status</TableHead>
                      <TableHead className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wider">Olist</TableHead>
                    </>
                  )}
                  <TableHead className="p-4 pr-6 text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wider">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-200 dark:divide-zinc-800">
                {Object.entries(groupedBatches).map(([beerName, beerBatches]) =>
                  beerBatches.map((batch, index) => {
                    const days = getDaysUntilExpiration(batch.expiration_date);
                    const isUrgent = days <= 7 && !isArchivedView;
                    const isSyncing = batch.sku ? syncingSkus.has(batch.sku) : false;
                    
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
                              <span className={cn(
                                "w-2 h-2 rounded-full flex-shrink-0",
                                isArchivedView ? "bg-gray-400" : "bg-primary"
                              )}></span>
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
                          {batch.sku || '—'}
                        </TableCell>
                        <TableCell className="p-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
                          {batch.lot}
                        </TableCell>
                        <TableCell className="p-4 text-sm text-gray-900 dark:text-white font-semibold">
                          <div className="flex items-center justify-center gap-2">
                            <span>{batch.quantity}</span>
                            {hasDivergence(batch.sku) && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="destructive" className="text-xs cursor-help gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      Divergente
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Sistema: {localStockBySku[batch.sku!.trim()]} un.</p>
                                    <p>Tiny: {tinyStocks[batch.sku!.trim()]} un.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="p-4 text-sm text-gray-500 dark:text-gray-400">
                          {format(parseISO(batch.expiration_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        {isArchivedView ? (
                          <TableCell className="p-4 text-sm text-gray-500 dark:text-gray-400">
                            {batch.archived_at 
                              ? format(new Date(batch.archived_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                              : '—'}
                          </TableCell>
                        ) : (
                          <>
                            <TableCell className="p-4">
                              <ExpirationBadge expirationDate={batch.expiration_date} />
                            </TableCell>
                            <TableCell className="p-4">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2 cursor-pointer">
                                      <Checkbox
                                        checked={batch.olist_synced || false}
                                        onCheckedChange={() => {
                                          if (onToggleOlistSync) {
                                            onToggleOlistSync(batch.id, batch.olist_synced || false, {
                                              beer_name: batch.beer_name,
                                              lot: batch.lot,
                                            });
                                          }
                                        }}
                                        className={cn(
                                          batch.olist_synced && "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                        )}
                                      />
                                      <span className={cn(
                                        "text-xs whitespace-nowrap",
                                        batch.olist_synced 
                                          ? "text-green-600 dark:text-green-400 font-medium" 
                                          : "text-gray-500 dark:text-gray-400"
                                      )}>
                                        {batch.olist_synced ? "Lançado ✓" : "Lançar"}
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  {batch.olist_synced && batch.olist_synced_at && (
                                    <TooltipContent>
                                      <p>Lançado em: {format(new Date(batch.olist_synced_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          </>
                        )}
                        <TableCell className="p-4 pr-6">
                          <div className="flex items-center gap-2">
                            {!isArchivedView && (
                              <>
                                <button 
                                  className="text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary transition-colors"
                                  onClick={() => {
                                    setEditingBatch(batch);
                                    setEditQuantity(batch.quantity.toString());
                                    setEditBeerName(batch.beer_name);
                                    setEditExpirationDate(batch.expiration_date);
                                    setEditSku(batch.sku || '');
                                  }}
                                >
                                  <Pencil className="h-5 w-5" />
                                </button>

                                {/* Sync to Tiny button */}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button 
                                        className={cn(
                                          "transition-colors",
                                          batch.sku 
                                            ? "text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400" 
                                            : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                        )}
                                        onClick={() => handleSyncToTiny(batch)}
                                        disabled={!batch.sku || isSyncing}
                                      >
                                        <RefreshCw className={cn(
                                          "h-5 w-5",
                                          isSyncing && "animate-spin"
                                        )} />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {batch.sku 
                                        ? isSyncing 
                                          ? 'Sincronizando...' 
                                          : 'Sincronizar estoque com Tiny'
                                        : 'Adicione um SKU para sincronizar'}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </>
                            )}
                            
                            {/* Archive/Unarchive button */}
                            {onToggleArchive && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button 
                                    className={cn(
                                      "transition-colors",
                                      isArchivedView 
                                        ? "text-gray-400 dark:text-gray-500 hover:text-green-500 dark:hover:text-green-500"
                                        : "text-gray-400 dark:text-gray-500 hover:text-amber-500 dark:hover:text-amber-500"
                                    )}
                                    title={isArchivedView ? "Desarquivar lote" : "Arquivar lote"}
                                  >
                                    {isArchivedView ? (
                                      <ArchiveRestore className="h-5 w-5" />
                                    ) : (
                                      <Archive className="h-5 w-5" />
                                    )}
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {isArchivedView ? 'Desarquivar lote?' : 'Arquivar lote?'}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {isArchivedView 
                                        ? `Tem certeza que deseja desarquivar o lote "${batch.lot}" da cerveja "${beerName}"? O lote voltará para a lista de lotes ativos.`
                                        : `Tem certeza que deseja arquivar o lote "${batch.lot}" da cerveja "${beerName}"? Você poderá desarquivá-lo a qualquer momento.`
                                      }
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => onToggleArchive(batch.id, batch.archived || false, { 
                                        beer_name: batch.beer_name, 
                                        lot: batch.lot 
                                      })}
                                      className={cn(
                                        isArchivedView 
                                          ? "bg-green-500 hover:bg-green-600"
                                          : "bg-amber-500 hover:bg-amber-600"
                                      )}
                                    >
                                      {isArchivedView ? 'Desarquivar' : 'Arquivar'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}

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
        )
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
              <Label htmlFor="edit_sku">SKU</Label>
              <Input
                id="edit_sku"
                value={editSku}
                onChange={(e) => setEditSku(e.target.value)}
                placeholder="Ex: SKU-001"
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
                  if (editSku !== (editingBatch.sku || '')) {
                    updates.sku = editSku || null;
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
