import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Send, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const orderSchema = z.object({
  id_envio: z.string().min(1, 'Código de barras/QRCode é obrigatório'),
  id_venda: z.string().min(1, 'Número da NF é obrigatório'),
  nome_comprador: z.string().min(1, 'Nome do destinatário é obrigatório'),
  cpf_cnpj_comprador: z.string().optional(),
  telefone_comprador: z.string().min(1, 'Telefone é obrigatório'),
  cep_entrega: z.string().min(8, 'CEP deve ter 8 dígitos').max(9, 'CEP inválido'),
  endereco_entrega: z.string().min(1, 'Endereço é obrigatório'),
  bairro_entrega: z.string().min(1, 'Bairro é obrigatório'),
  cidade_entrega: z.string().min(1, 'Cidade é obrigatória'),
  estado_entrega: z.string().min(2, 'Estado é obrigatório').max(2, 'Use sigla do estado'),
  valor_pago: z.string().optional(),
  peso: z.string().optional(),
  cod_servico: z.string().default('2'),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface J3OrderFormProps {
  onSuccess: () => void;
  disabled?: boolean;
}

export const J3OrderForm = ({ onSuccess, disabled }: J3OrderFormProps) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [lastCodpedido, setLastCodpedido] = useState<number | null>(null);
  const [downloadingLabel, setDownloadingLabel] = useState(false);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      id_envio: '',
      id_venda: '',
      nome_comprador: '',
      cpf_cnpj_comprador: '',
      telefone_comprador: '',
      cep_entrega: '',
      endereco_entrega: '',
      bairro_entrega: '',
      cidade_entrega: '',
      estado_entrega: '',
      valor_pago: '',
      peso: '',
      cod_servico: '2',
    },
  });

  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        form.setValue('endereco_entrega', data.logradouro || '');
        form.setValue('bairro_entrega', data.bairro || '');
        form.setValue('cidade_entrega', data.localidade || '');
        form.setValue('estado_entrega', data.uf || '');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

  const onSubmit = async (data: OrderFormData) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        valor_pago: data.valor_pago ? parseFloat(data.valor_pago) : 0,
        peso: data.peso ? parseInt(data.peso) : 0,
      };

      const { data: response, error } = await supabase.functions.invoke('j3-create-order', {
        body: payload,
      });

      if (error) throw error;

      if (!response.success) {
        throw new Error(response.error || 'Erro ao criar pedido');
      }

      setLastCodpedido(response.data.codpedido);
      form.reset();
      onSuccess();

    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Erro ao criar pedido',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const downloadLabel = async () => {
    if (!lastCodpedido) return;
    
    setDownloadingLabel(true);
    try {
      const { data, error } = await supabase.functions.invoke('j3-get-label', {
        body: {},
        headers: {},
      });

      // Fazer fetch direto para obter o PDF
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/j3-get-label?codpedido=${lastCodpedido}`,
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
      a.download = `etiqueta-${lastCodpedido}.pdf`;
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
      setDownloadingLabel(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Dados da Venda */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Dados da Venda</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="id_venda"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nº Nota Fiscal *</FormLabel>
                  <FormControl>
                    <Input placeholder="123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="id_envio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Barras/QRCode *</FormLabel>
                  <FormControl>
                    <Input placeholder="Código que será bipado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cod_servico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Serviço</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">Mercado Envios Flex</SelectItem>
                      <SelectItem value="2">E-commerce/Avulso</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="valor_pago"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor da NF (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="peso"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Peso (gramas)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Dados do Destinatário */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Dados do Destinatário</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="nome_comprador"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cpf_cnpj_comprador"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF/CNPJ</FormLabel>
                  <FormControl>
                    <Input placeholder="000.000.000-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="telefone_comprador"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone *</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 99999-9999" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Endereço de Entrega */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Endereço de Entrega</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="cep_entrega"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="00000-000" 
                      {...field}
                      onBlur={(e) => {
                        field.onBlur();
                        fetchAddressByCep(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="estado_entrega"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado *</FormLabel>
                  <FormControl>
                    <Input placeholder="SP" maxLength={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cidade_entrega"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade *</FormLabel>
                  <FormControl>
                    <Input placeholder="São Paulo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="endereco_entrega"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, número, complemento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bairro_entrega"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bairro *</FormLabel>
                  <FormControl>
                    <Input placeholder="Centro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button type="submit" disabled={submitting || disabled} className="flex-1">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Criar Pedido
              </>
            )}
          </Button>
          
          {lastCodpedido && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={downloadLabel}
              disabled={downloadingLabel}
            >
              {downloadingLabel ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Baixar Etiqueta
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};
