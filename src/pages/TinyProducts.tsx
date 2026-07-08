import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, RefreshCw, Loader2, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import Footer from '@/components/Footer';

interface TinyProduct {
  id: string;
  codigo: string;
  nome: string;
  preco: string;
  preco_custo: string;
  situacao: string;
  unidade: string;
  estoque: number | null;
}

interface TinyResponse {
  produtos: TinyProduct[];
  pagina_atual: number;
  total_paginas: number;
  total_registros: number;
}

const TinyProducts = () => {
  const [products, setProducts] = useState<TinyProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const fetchProducts = async (page: number = 1, search: string = '') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-tiny-products', {
        body: { pesquisa: search, pagina: page }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const response = data as TinyResponse;
      setProducts(response.produtos);
      setCurrentPage(response.pagina_atual);
      setTotalPages(response.total_paginas);
      setTotalRecords(response.total_registros);
      setHasSearched(true);

      toast({
        title: 'Produtos carregados',
        description: `${response.total_registros} produtos encontrados`,
      });
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Erro ao buscar produtos',
        description: error.message || 'Não foi possível conectar à API do Tiny',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts(1, searchTerm);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchProducts(newPage, searchTerm);
    }
  };

  const formatPrice = (price: string) => {
    const num = parseFloat(price || '0');
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="min-h-full pb-20">
      <main className="container py-6 space-y-6">
        {/* Search Card */}
        <Card className="border border-border/50 shadow-sm animate-fade-in">
          <CardHeader className="border-b border-border/50 bg-secondary/30">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Search className="h-5 w-5 text-primary" />
              </div>
              Buscar Produtos
            </CardTitle>
            <CardDescription>
              Pesquise por nome, código ou SKU dos produtos cadastrados no Tiny ERP
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <Input
                placeholder="Digite o nome ou código do produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 h-11 border-border/60 focus:border-primary transition-all"
              />
              <Button type="submit" disabled={loading} className="h-11 px-6 bg-primary hover:bg-primary/90 shadow-md">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2">Buscar</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fetchProducts(currentPage, searchTerm)}
                disabled={loading}
                className="h-11"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card className="border border-border/50 shadow-sm animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardHeader className="border-b border-border/50 bg-secondary/30">
            <CardTitle>Resultados</CardTitle>
            {hasSearched && (
              <CardDescription>
                {totalRecords} produto(s) encontrado(s) • Página {currentPage} de {totalPages}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {!hasSearched ? (
              <div className="text-center py-16">
                <div className="p-4 rounded-full bg-secondary w-fit mx-auto mb-4">
                  <Package className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground font-medium">Clique em "Buscar" para carregar os produtos do Tiny ERP</p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-4 rounded-full bg-secondary w-fit mx-auto mb-4">
                  <Package className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground font-medium">Nenhum produto encontrado</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                        <TableHead className="font-semibold text-foreground">Código</TableHead>
                        <TableHead className="font-semibold text-foreground">Nome</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">Preço Custo</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">Preço Venda</TableHead>
                        <TableHead className="text-center font-semibold text-foreground">Unidade</TableHead>
                        <TableHead className="text-center font-semibold text-foreground">Estoque</TableHead>
                        <TableHead className="text-center font-semibold text-foreground">Situação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id} className="hover:bg-secondary/30 transition-colors">
                          <TableCell>
                            <code className="px-2 py-1 rounded-md bg-secondary text-sm font-mono">
                              {product.codigo}
                            </code>
                          </TableCell>
                          <TableCell className="font-medium">{product.nome}</TableCell>
                          <TableCell className="text-right">{formatPrice(product.preco_custo)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatPrice(product.preco)}</TableCell>
                          <TableCell className="text-center">{product.unidade || '-'}</TableCell>
                          <TableCell className="text-center">
                            <span className={`font-semibold ${
                              product.estoque === null ? 'text-muted-foreground' :
                              product.estoque === 0 ? 'text-destructive' :
                              product.estoque <= 5 ? 'text-orange-500' :
                              'text-foreground'
                            }`}>
                              {product.estoque !== null ? product.estoque : 'N/D'}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              className={product.situacao === 'A' 
                                ? 'bg-[hsl(160,84%,45%)] hover:bg-[hsl(160,84%,40%)] text-white' 
                                : 'bg-secondary text-secondary-foreground'
                              }
                            >
                              {product.situacao === 'A' ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-border/50">
                    <p className="text-sm text-muted-foreground">
                      Mostrando página {currentPage} de {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1 || loading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages || loading}
                      >
                        Próxima
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default TinyProducts;