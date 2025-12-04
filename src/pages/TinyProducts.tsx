import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Search, RefreshCw, Loader2, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import Footer from '@/components/Footer';

interface TinyProduct {
  id: string;
  codigo: string;
  nome: string;
  preco: string;
  preco_custo: string;
  situacao: string;
  unidade: string;
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
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/80 dark:bg-card/50 backdrop-blur-sm border-b border-border/50 dark:border-border/30 px-4 lg:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto flex items-center gap-3 lg:gap-4">
          <Link to="/">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 lg:h-10 lg:w-10 hover:bg-secondary dark:hover:bg-secondary/50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="bg-primary p-2.5 lg:p-3 rounded-xl shadow-lg shadow-primary/30">
            <Package className="h-5 w-5 lg:h-6 lg:w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg lg:text-xl font-bold text-foreground">Produtos Olist Tiny</h1>
            <p className="text-xs lg:text-sm text-muted-foreground">Consulta de produtos do ERP</p>
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 lg:p-8">
        <div className="max-w-screen-2xl mx-auto space-y-6 lg:space-y-8">
          {/* Search Card */}
          <div className="bg-card dark:bg-card/80 rounded-xl shadow-sm border border-border/50 dark:border-border/30 overflow-hidden animate-fade-in">
            <div className="p-4 lg:p-6 border-b border-border/50 dark:border-border/30">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Buscar Produtos</h2>
              </div>
              <p className="text-sm text-muted-foreground">Pesquise por nome, código ou SKU</p>
            </div>
            <div className="p-4 lg:p-6">
              <form onSubmit={handleSearch} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Digite o nome ou código do produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 h-11 px-3 bg-secondary dark:bg-secondary/50 border-0 rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                />
                <Button type="submit" disabled={loading} className="h-11 px-6 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Buscar</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fetchProducts(currentPage, searchTerm)}
                  disabled={loading}
                  className="h-11 w-11 p-0"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </form>
            </div>
          </div>

          {/* Results Card */}
          <div className="bg-card dark:bg-card/80 rounded-xl shadow-sm border border-border/50 dark:border-border/30 overflow-hidden animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="p-4 lg:p-6 border-b border-border/50 dark:border-border/30">
              <h2 className="text-lg font-semibold text-foreground">Resultados</h2>
              {hasSearched && (
                <p className="text-sm text-muted-foreground">
                  {totalRecords} produto(s) encontrado(s) • Página {currentPage} de {totalPages}
                </p>
              )}
            </div>
            <div className="p-0">
              {!hasSearched ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-secondary dark:bg-secondary/50 w-fit mx-auto mb-4">
                    <Package className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">Clique em "Buscar" para carregar os produtos</p>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-secondary dark:bg-secondary/50 w-fit mx-auto mb-4">
                    <Package className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">Nenhum produto encontrado</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary/50 dark:bg-secondary/30 hover:bg-secondary/50 dark:hover:bg-secondary/30">
                          <TableHead className="font-semibold text-muted-foreground">Código</TableHead>
                          <TableHead className="font-semibold text-muted-foreground">Nome</TableHead>
                          <TableHead className="text-right font-semibold text-muted-foreground hidden sm:table-cell">Preço Custo</TableHead>
                          <TableHead className="text-right font-semibold text-muted-foreground">Preço Venda</TableHead>
                          <TableHead className="text-center font-semibold text-muted-foreground hidden md:table-cell">Unidade</TableHead>
                          <TableHead className="text-center font-semibold text-muted-foreground">Situação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow key={product.id} className="hover:bg-secondary/30 dark:hover:bg-secondary/20 transition-colors">
                            <TableCell>
                              <code className="px-2 py-1 rounded-md bg-secondary dark:bg-secondary/50 text-xs lg:text-sm font-mono text-muted-foreground">
                                {product.codigo}
                              </code>
                            </TableCell>
                            <TableCell className="font-medium text-foreground text-sm">{product.nome}</TableCell>
                            <TableCell className="text-right text-muted-foreground hidden sm:table-cell">{formatPrice(product.preco_custo)}</TableCell>
                            <TableCell className="text-right font-semibold text-foreground">{formatPrice(product.preco)}</TableCell>
                            <TableCell className="text-center text-muted-foreground hidden md:table-cell">{product.unidade || '-'}</TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                className={product.situacao === 'A' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' 
                                  : 'bg-secondary text-muted-foreground'
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
                    <div className="flex items-center justify-between p-4 border-t border-border/50 dark:border-border/30">
                      <p className="text-sm text-muted-foreground hidden sm:block">
                        Página {currentPage} de {totalPages}
                      </p>
                      <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage <= 1 || loading}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">Anterior</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage >= totalPages || loading}
                        >
                          <span className="hidden sm:inline mr-1">Próxima</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TinyProducts;
