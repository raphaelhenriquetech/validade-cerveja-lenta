import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const configSchema = z.object({
  cnpj_transportadora: z.string().min(1, 'CNPJ da transportadora é obrigatório'),
  cnpj_vendedor: z.string().min(1, 'CNPJ do vendedor é obrigatório'),
  cliente: z.string().min(1, 'Nome fantasia é obrigatório'),
  razao_social: z.string().min(1, 'Razão social é obrigatória'),
  cod_cliente: z.string().min(1, 'Código do cliente é obrigatório'),
  ie_vendedor: z.string().optional(),
  telefone_vendedor: z.string().optional(),
  email_vendedor: z.string().email('E-mail inválido').optional().or(z.literal('')),
  local_retirada: z.string().min(1, 'Endereço de coleta é obrigatório'),
  numero_retirada: z.string().optional(),
  complemento_retirada: z.string().optional(),
  bairro_retirada: z.string().min(1, 'Bairro é obrigatório'),
  cidade_retirada: z.string().min(1, 'Cidade é obrigatória'),
  estado_retirada: z.string().min(2, 'Estado é obrigatório').max(2, 'Use sigla do estado'),
  cep_vendedor: z.string().min(8, 'CEP deve ter 8 dígitos'),
  ambiente: z.string().default('homologacao'),
});

type ConfigFormData = z.infer<typeof configSchema>;

interface J3SellerConfigProps {
  config: ConfigFormData | null;
  onSuccess: () => void;
}

export const J3SellerConfig = ({ config, onSuccess }: J3SellerConfigProps) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: config || {
      cnpj_transportadora: '',
      cnpj_vendedor: '',
      cliente: '',
      razao_social: '',
      cod_cliente: '',
      ie_vendedor: '',
      telefone_vendedor: '',
      email_vendedor: '',
      local_retirada: '',
      numero_retirada: '',
      complemento_retirada: '',
      bairro_retirada: '',
      cidade_retirada: '',
      estado_retirada: '',
      cep_vendedor: '',
      ambiente: 'homologacao',
    },
  });

  const onSubmit = async (data: ConfigFormData) => {
    setSubmitting(true);
    try {
      if (config) {
        // Atualizar configuração existente
        const { error } = await supabase
          .from('j3_seller_config')
          .update(data)
          .eq('id', (config as unknown as { id: string }).id);
        
        if (error) throw error;
      } else {
        // Criar nova configuração
        const { error } = await supabase
          .from('j3_seller_config')
          .insert(data);
        
        if (error) throw error;
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: 'Erro ao salvar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Ambiente */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Ambiente</h3>
          <FormField
            control={form.control}
            name="ambiente"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ambiente da API</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="homologacao">Homologação (testes)</SelectItem>
                    <SelectItem value="producao">Produção</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Use homologação para testes antes de ir para produção
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Dados da Transportadora */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Dados da Transportadora</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cnpj_transportadora"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ da Transportadora *</FormLabel>
                  <FormControl>
                    <Input placeholder="00.000.000/0001-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cod_cliente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código Parceiro *</FormLabel>
                  <FormControl>
                    <Input placeholder="Código fornecido pela J3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Dados do Vendedor */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Dados do Vendedor</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cnpj_vendedor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ do Vendedor *</FormLabel>
                  <FormControl>
                    <Input placeholder="00.000.000/0001-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ie_vendedor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inscrição Estadual</FormLabel>
                  <FormControl>
                    <Input placeholder="Opcional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cliente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Fantasia *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da loja" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="razao_social"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razão Social *</FormLabel>
                  <FormControl>
                    <Input placeholder="Razão social completa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="telefone_vendedor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(11) 99999-9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email_vendedor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contato@empresa.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Endereço de Coleta */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Endereço de Coleta</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="cep_vendedor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP *</FormLabel>
                  <FormControl>
                    <Input placeholder="00000-000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="estado_retirada"
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
              name="cidade_retirada"
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="local_retirada"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Endereço *</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, Avenida..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numero_retirada"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input placeholder="123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="complemento_retirada"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complemento</FormLabel>
                  <FormControl>
                    <Input placeholder="Sala, Bloco..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bairro_retirada"
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

        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};
