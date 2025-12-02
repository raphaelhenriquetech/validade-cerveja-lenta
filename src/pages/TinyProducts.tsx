import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8" />
                <div>
                  <h1 className="text-xl font-bold">Produtos Olist Tiny</h1>
                  <p className="text-sm text-primary-foreground/80">Consulta de produtos do ERP</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Search Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Produtos
            </CardTitle>
            <CardDescription>
              Pesquise por nome, código ou SKU dos produtos cadastrados no Tiny ERP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-3">
              <Input
                placeholder="Digite o nome ou código do produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
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
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card>
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
            {hasSearched && (
              <CardDescription>
                {totalRecords} produto(s) encontrado(s) • Página {currentPage} de {totalPages}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {!hasSearched ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Clique em "Buscar" para carregar os produtos do Tiny ERP</p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum produto encontrado</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="text-right">Preço Custo</TableHead>
                        <TableHead className="text-right">Preço Venda</TableHead>
                        <TableHead className="text-center">Unidade</TableHead>
                        <TableHead className="text-center">Situação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono text-sm">{product.codigo}</TableCell>
                          <TableCell className="font-medium">{product.nome}</TableCell>
                          <TableCell className="text-right">{formatPrice(product.preco_custo)}</TableCell>
                          <TableCell className="text-right">{formatPrice(product.preco)}</TableCell>
                          <TableCell className="text-center">{product.unidade || '-'}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={product.situacao === 'A' ? 'default' : 'secondary'}>
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
                  <div className="flex items-center justify-between mt-4">
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
