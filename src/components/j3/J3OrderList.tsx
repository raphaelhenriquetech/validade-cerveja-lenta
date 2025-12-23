import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, Eye, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Json } from '@/integrations/supabase/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface J3Order {
  id: string;
  codpedido: number | null;
  id_envio: string;
  id_venda: string;
  nome_comprador: string;
  endereco_entrega: string;
  bairro_entrega: string;
  cidade_entrega: string;
  estado_entrega: string;
  cep_entrega: string;
  telefone_comprador: string;
  cpf_cnpj_comprador: string | null;
  valor_pago: number | null;
  peso: number | null;
  cod_servico: string | null;
  status: string | null;
  api_response: Json | null;
  created_at: string | null;
}

interface J3OrderListProps {
  orders: J3Order[];
}

interface TrackingHistory {
  codhistorico: number;
  codstatus: number;
  dtstatus: string;
  hrstatus: string;
  status: string;
  observacao?: string;
  recebedor?: string;
  documento?: string;
}

export const J3OrderList = ({ orders }: J3OrderListProps) => {
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingHistory[]>([]);
  const [loadingTracking, setLoadingTracking] = useState(false);

  const downloadLabel = async (order: J3Order) => {
    if (!order.codpedido) {
      toast({
        title: 'Erro',
        description: 'Código do pedido não encontrado',
        variant: 'destructive',
      });
      return;
    }

    setDownloadingId(order.id);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/j3-get-label?codpedido=${order.codpedido}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao baixar etiqueta');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `etiqueta-${order.codpedido}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Etiqueta baixada',
        description: 'O PDF foi baixado com sucesso.',
      });

    } catch (error) {
      console.error('Error downloading label:', error);
      toast({
        title: 'Erro ao baixar etiqueta',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const fetchTracking = async (order: J3Order) => {
    if (!order.codpedido) return;

    setLoadingTracking(true);
    setTrackingData([]);

    try {
      const { data, error } = await supabase.functions.invoke('j3-get-history', {
        body: {},
        headers: {},
      });

      // Fazer fetch direto
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/j3-get-history?codremessa=${order.codpedido}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar histórico');
      }

      const result = await response.json();
      
      if (result.success && result.data?.[0]?.historicos) {
        setTrackingData(result.data[0].historicos);
      } else {
        setTrackingData([]);
      }

    } catch (error) {
      console.error('Error fetching tracking:', error);
      toast({
        title: 'Erro ao buscar histórico',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoadingTracking(false);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Nenhum pedido enviado ainda</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Cód. Pedido</TableHead>
            <TableHead>NF</TableHead>
            <TableHead>Destinatário</TableHead>
            <TableHead>Cidade/UF</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="whitespace-nowrap">
                {order.created_at 
                  ? format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                  : '-'}
              </TableCell>
              <TableCell className="font-mono">{order.codpedido || '-'}</TableCell>
              <TableCell>{order.id_venda}</TableCell>
              <TableCell className="max-w-[200px] truncate">{order.nome_comprador}</TableCell>
              <TableCell>{order.cidade_entrega}/{order.estado_entrega}</TableCell>
              <TableCell>
                <Badge variant={order.status === 'enviado' ? 'default' : 'secondary'}>
                  {order.status || 'enviado'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => downloadLabel(order)}
                    disabled={downloadingId === order.id || !order.codpedido}
                    title="Baixar Etiqueta"
                  >
                    {downloadingId === order.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fetchTracking(order)}
                        disabled={!order.codpedido}
                        title="Ver Rastreamento"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Rastreamento - Pedido {order.codpedido}</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="max-h-[400px]">
                        {loadingTracking ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : trackingData.length > 0 ? (
                          <div className="space-y-4">
                            {trackingData.map((item, index) => (
                              <div key={item.codhistorico} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-primary' : 'bg-muted'}`} />
                                  {index < trackingData.length - 1 && (
                                    <div className="w-0.5 h-full bg-muted" />
                                  )}
                                </div>
                                <div className="flex-1 pb-4">
                                  <p className="font-medium">{item.status}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.dtstatus} às {item.hrstatus}
                                  </p>
                                  {item.observacao && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {item.observacao}
                                    </p>
                                  )}
                                  {item.recebedor && (
                                    <p className="text-sm text-muted-foreground">
                                      Recebedor: {item.recebedor}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground py-8">
                            Nenhum histórico encontrado
                          </p>
                        )}
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
