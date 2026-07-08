import { useState } from 'react';
import { Loader2, Plus, FileText, Settings, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Footer from '@/components/Footer';
import { J3OrderForm } from '@/components/j3/J3OrderForm';
import { J3OrderList } from '@/components/j3/J3OrderList';
import { J3SellerConfig } from '@/components/j3/J3SellerConfig';
import { CepChecker } from '@/components/j3/CepChecker';
import { useJ3Orders } from '@/hooks/useJ3Orders';
import { useJ3SellerConfig } from '@/hooks/useJ3SellerConfig';

const J3Orders = () => {
  const { toast } = useToast();
  const { orders, loading: ordersLoading, refetch: refetchOrders } = useJ3Orders();
  const { config, loading: configLoading, refetch: refetchConfig } = useJ3SellerConfig();
  const [activeTab, setActiveTab] = useState('new-order');

  const handleOrderCreated = () => {
    refetchOrders();
    toast({ title: 'Pedido criado', description: 'O pedido foi enviado com sucesso para a J3.' });
  };

  const handleConfigSaved = () => {
    refetchConfig();
    toast({ title: 'Configurações salvas', description: 'As configurações do vendedor foram atualizadas.' });
  };

  if (ordersLoading || configLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-muted-foreground">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <main className="flex-grow p-4 md:p-6 lg:p-8">
        <div className="max-w-screen-xl mx-auto">
          {!config && (
            <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <p className="text-amber-800 dark:text-amber-200">
                    Configure os dados do vendedor na aba "Configurações" antes de criar pedidos.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="new-order" className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Pedido
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-2">
                <FileText className="h-4 w-4" />
                Histórico
                <span className="bg-primary/20 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                  {orders.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="check-cep" className="gap-2">
                <MapPin className="h-4 w-4" />
                Consultar CEP
              </TabsTrigger>
              <TabsTrigger value="config" className="gap-2">
                <Settings className="h-4 w-4" />
                Configurações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new-order">
              <Card>
                <CardHeader>
                  <CardTitle>Criar Novo Pedido</CardTitle>
                  <CardDescription>
                    Preencha os dados do destinatário e da entrega para gerar uma etiqueta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <J3OrderForm 
                    onSuccess={handleOrderCreated} 
                    disabled={!config}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Pedidos</CardTitle>
                  <CardDescription>
                    Pedidos enviados para a J3/Tracken
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <J3OrderList orders={orders} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="check-cep">
              <Card>
                <CardHeader>
                  <CardTitle>Consultar Cobertura de CEP</CardTitle>
                  <CardDescription>
                    Verifique se um CEP está dentro da área de entrega da J3/Tracken
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CepChecker />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="config">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações do Vendedor</CardTitle>
                  <CardDescription>
                    Dados fixos que serão usados em todos os pedidos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <J3SellerConfig 
                    config={config} 
                    onSuccess={handleConfigSaved}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default J3Orders;
