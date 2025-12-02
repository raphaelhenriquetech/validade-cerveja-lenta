import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, Plus, Trash2, Send, Loader2, Settings as SettingsIcon, MessageCircle } from 'lucide-react';
import { ActivityHistory } from '@/components/ActivityHistory';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import Footer from '@/components/Footer';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.string()
    .trim()
    .email('Email inválido')
    .max(255, 'Email muito longo')
});

const phoneSchema = z.object({
  phone: z.string()
    .trim()
    .regex(/^\+?[1-9]\d{10,14}$/, 'Número inválido. Use formato: +5511999999999'),
  apikey: z.string()
    .trim()
    .min(1, 'API Key é obrigatória')
    .max(50, 'API Key muito longa')
});

interface EmailSetting {
  id: string;
  email: string;
  is_active: boolean;
}

interface WhatsAppSetting {
  id: string;
  phone_number: string;
  apikey: string;
  is_active: boolean;
}

const Settings = () => {
  const [emails, setEmails] = useState<EmailSetting[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [whatsappNumbers, setWhatsappNumbers] = useState<WhatsAppSetting[]>([]);
  const [newPhone, setNewPhone] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [loadingWhatsapp, setLoadingWhatsapp] = useState(true);
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  const { toast } = useToast();
  const { logActivity, refetch: refetchLogs } = useActivityLogs();

  const fetchEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('email_settings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmails(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar emails',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWhatsappNumbers = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_settings' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWhatsappNumbers((data || []) as unknown as WhatsAppSetting[]);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar números WhatsApp',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingWhatsapp(false);
    }
  };

  useEffect(() => {
    fetchEmails();
    fetchWhatsappNumbers();
  }, []);

  const addEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = emailSchema.safeParse({ email: newEmail });
    if (!result.success) {
      toast({
        title: 'Erro de validação',
        description: result.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    const validatedEmail = result.data.email;

    try {
      const { error } = await supabase
        .from('email_settings')
        .insert({ email: validatedEmail });

      if (error) throw error;

      toast({
        title: 'Email adicionado',
        description: `${validatedEmail} foi cadastrado para receber relatórios`,
      });

      await logActivity('email_added', 'email_setting', null, `Email adicionado: ${validatedEmail}`);
      refetchLogs();
      setNewEmail('');
      fetchEmails();
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar email',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteEmail = async (id: string, email: string) => {
    try {
      const { error } = await supabase
        .from('email_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Email removido',
        description: 'O email foi removido da lista de destinatários',
      });

      await logActivity('email_deleted', 'email_setting', id, `Email removido: ${email}`);
      refetchLogs();
      fetchEmails();
    } catch (error: any) {
      toast({
        title: 'Erro ao remover email',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const sendTestReport = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-expiration-report');

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Relatório enviado!',
          description: data.message,
        });
      } else {
        toast({
          title: 'Aviso',
          description: data.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar relatório',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const addPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = phoneSchema.safeParse({ phone: newPhone, apikey: newApiKey });
    if (!result.success) {
      toast({
        title: 'Erro de validação',
        description: result.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    const validatedPhone = result.data.phone;
    const validatedApiKey = result.data.apikey;

    try {
      const { error } = await supabase
        .from('whatsapp_settings' as any)
        .insert({ phone_number: validatedPhone, apikey: validatedApiKey });

      if (error) throw error;

      toast({
        title: 'Número adicionado',
        description: `${validatedPhone} foi cadastrado para receber relatórios via WhatsApp`,
      });

      await logActivity('whatsapp_added', 'whatsapp_setting', null, `WhatsApp adicionado: ${validatedPhone}`);
      refetchLogs();
      setNewPhone('');
      setNewApiKey('');
      fetchWhatsappNumbers();
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar número',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const sendWhatsAppReport = async () => {
    setSendingWhatsapp(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-report');

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'WhatsApp enviado!',
          description: data.message,
        });
      } else {
        toast({
          title: 'Aviso',
          description: data.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar WhatsApp',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSendingWhatsapp(false);
    }
  };

  const deletePhone = async (id: string, phone: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_settings' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Número removido',
        description: 'O número foi removido da lista de destinatários',
      });

      await logActivity('whatsapp_deleted', 'whatsapp_setting', id, `WhatsApp removido: ${phone}`);
      refetchLogs();
      fetchWhatsappNumbers();
    } catch (error: any) {
      toast({
        title: 'Erro ao remover número',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with gradient */}
      <header className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button 
                variant="secondary" 
                size="icon" 
                className="bg-primary-foreground/10 hover:bg-primary-foreground/20 border-primary-foreground/20 backdrop-blur-sm transition-all hover:scale-105"
              >
                <ArrowLeft className="h-5 w-5 text-primary-foreground" />
              </Button>
            </Link>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 shadow-xl">
              <SettingsIcon className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
              <p className="text-sm text-primary-foreground/80">Gerenciar emails e WhatsApp para relatórios</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Email Recipients Card */}
        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="bg-gradient-to-r from-card to-secondary/20">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              Emails para Relatório
            </CardTitle>
            <CardDescription>
              Cadastre os emails que receberão o relatório diário de validades
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <form onSubmit={addEmail} className="flex gap-3">
              <Input
                type="email"
                placeholder="Digite o email..."
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1 h-11 bg-background/50 border-border/50 focus:border-primary transition-all"
              />
              <Button 
                type="submit"
                className="h-11 px-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </form>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-secondary/50 w-fit mx-auto mb-4">
                  <Mail className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground font-medium">Nenhum email cadastrado</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Adicione um email para receber relatórios.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emails.map((email) => (
                      <TableRow key={email.id} className="hover:bg-secondary/20 transition-colors">
                        <TableCell className="font-medium">{email.email}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteEmail(email.id, email.email)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* WhatsApp Recipients Card */}
        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
          <CardHeader className="bg-gradient-to-r from-card to-secondary/20">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-500/10">
                <MessageCircle className="h-5 w-5 text-green-600" />
              </div>
              WhatsApp para Relatório (CallMeBot)
            </CardTitle>
            <CardDescription>
              Cadastre os números que receberão o relatório via WhatsApp. 
              <a href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                Como obter a API Key
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <form onSubmit={addPhone} className="flex flex-col sm:flex-row gap-3">
              <Input
                type="tel"
                placeholder="+5511999999999"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="flex-1 h-11 bg-background/50 border-border/50 focus:border-primary transition-all"
              />
              <Input
                type="text"
                placeholder="API Key do CallMeBot"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                className="flex-1 h-11 bg-background/50 border-border/50 focus:border-primary transition-all"
              />
              <Button 
                type="submit"
                className="h-11 px-6 bg-gradient-to-r from-green-600 to-green-500 hover:opacity-90 transition-all shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </form>

            {loadingWhatsapp ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : whatsappNumbers.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-secondary/50 w-fit mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground font-medium">Nenhum número cadastrado</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Adicione um número para receber relatórios via WhatsApp.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                      <TableHead className="font-semibold">Número</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {whatsappNumbers.map((item) => (
                      <TableRow key={item.id} className="hover:bg-secondary/20 transition-colors">
                        <TableCell className="font-medium">{item.phone_number}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deletePhone(item.id, item.phone_number)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Send Card */}
        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <CardHeader className="bg-gradient-to-r from-card to-secondary/20">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Send className="h-5 w-5 text-primary" />
              </div>
              Envio Manual
            </CardTitle>
            <CardDescription>
              Envie um relatório de teste para os emails ou WhatsApp cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={sendTestReport} 
                disabled={sending || emails.length === 0}
                className="h-12 px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-md font-medium"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                {sending ? 'Enviando...' : 'Enviar Email'}
              </Button>
              <Button 
                onClick={sendWhatsAppReport} 
                disabled={sendingWhatsapp || whatsappNumbers.length === 0}
                className="h-12 px-8 bg-gradient-to-r from-green-600 to-green-500 hover:opacity-90 transition-all shadow-md font-medium"
              >
                {sendingWhatsapp ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <MessageCircle className="h-4 w-4 mr-2" />
                )}
                {sendingWhatsapp ? 'Enviando...' : 'Enviar WhatsApp'}
              </Button>
            </div>
            {emails.length === 0 && whatsappNumbers.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Adicione pelo menos um email ou número de WhatsApp para enviar o relatório.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Activity History */}
        <ActivityHistory />
      </main>
      <Footer />
    </div>
  );
};

export default Settings;
