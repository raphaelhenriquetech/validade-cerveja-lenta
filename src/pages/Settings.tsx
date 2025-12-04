import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
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
            <SettingsIcon className="h-5 w-5 lg:h-6 lg:w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg lg:text-xl font-bold text-foreground">Configurações</h1>
            <p className="text-xs lg:text-sm text-muted-foreground">Gerenciar emails e WhatsApp</p>
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 lg:p-8">
        <div className="max-w-screen-2xl mx-auto space-y-6 lg:space-y-8">
          {/* Email Card */}
          <div className="bg-card dark:bg-card/80 rounded-xl shadow-sm border border-border/50 dark:border-border/30 overflow-hidden animate-fade-in">
            <div className="p-4 lg:p-6 border-b border-border/50 dark:border-border/30">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Emails para Relatório</h2>
              </div>
              <p className="text-sm text-muted-foreground">Cadastre os emails que receberão o relatório diário</p>
            </div>
            <div className="p-4 lg:p-6 space-y-4">
              <form onSubmit={addEmail} className="flex gap-3">
                <input
                  type="email"
                  placeholder="Digite o email..."
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="flex-1 h-11 px-3 bg-secondary dark:bg-secondary/50 border-0 rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                />
                <Button type="submit" className="h-11 px-6 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
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
                  <div className="p-4 rounded-full bg-secondary dark:bg-secondary/50 w-fit mx-auto mb-4">
                    <Mail className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">Nenhum email cadastrado</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border/50 dark:border-border/30 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50 dark:bg-secondary/30 hover:bg-secondary/50 dark:hover:bg-secondary/30">
                        <TableHead className="font-semibold text-muted-foreground">Email</TableHead>
                        <TableHead className="w-[100px] font-semibold text-muted-foreground">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emails.map((email) => (
                        <TableRow key={email.id} className="hover:bg-secondary/30 dark:hover:bg-secondary/20 transition-colors">
                          <TableCell className="font-medium text-foreground">{email.email}</TableCell>
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
            </div>
          </div>

          {/* WhatsApp Card */}
          <div className="bg-card dark:bg-card/80 rounded-xl shadow-sm border border-border/50 dark:border-border/30 overflow-hidden animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="p-4 lg:p-6 border-b border-border/50 dark:border-border/30">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-500/10 dark:bg-green-500/20 p-2 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-green-500" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">WhatsApp para Relatório</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Cadastre os números para relatórios via WhatsApp.{' '}
                <a href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Como obter API Key
                </a>
              </p>
            </div>
            <div className="p-4 lg:p-6 space-y-4">
              <form onSubmit={addPhone} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="tel"
                  placeholder="+5511999999999"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="flex-1 h-11 px-3 bg-secondary dark:bg-secondary/50 border-0 rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
                />
                <input
                  type="text"
                  placeholder="API Key do CallMeBot"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  className="flex-1 h-11 px-3 bg-secondary dark:bg-secondary/50 border-0 rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
                />
                <Button type="submit" className="h-11 px-6 bg-green-500 hover:bg-green-600 shadow-md shadow-green-500/20">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </form>

              {loadingWhatsapp ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                </div>
              ) : whatsappNumbers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 rounded-full bg-secondary dark:bg-secondary/50 w-fit mx-auto mb-4">
                    <MessageCircle className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">Nenhum número cadastrado</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border/50 dark:border-border/30 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50 dark:bg-secondary/30 hover:bg-secondary/50 dark:hover:bg-secondary/30">
                        <TableHead className="font-semibold text-muted-foreground">Número</TableHead>
                        <TableHead className="w-[100px] font-semibold text-muted-foreground">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {whatsappNumbers.map((item) => (
                        <TableRow key={item.id} className="hover:bg-secondary/30 dark:hover:bg-secondary/20 transition-colors">
                          <TableCell className="font-medium text-foreground">{item.phone_number}</TableCell>
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
            </div>
          </div>

          {/* Manual Send Card */}
          <div className="bg-card dark:bg-card/80 rounded-xl shadow-sm border border-border/50 dark:border-border/30 overflow-hidden animate-fade-in" style={{ animationDelay: '150ms' }}>
            <div className="p-4 lg:p-6 border-b border-border/50 dark:border-border/30">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Envio Manual</h2>
              </div>
              <p className="text-sm text-muted-foreground">Envie relatórios manualmente para testar</p>
            </div>
            <div className="p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={sendTestReport}
                  disabled={sending || emails.length === 0}
                  className="flex-1 h-11 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Enviar Email
                </Button>
                <Button
                  onClick={sendWhatsAppReport}
                  disabled={sendingWhatsapp || whatsappNumbers.length === 0}
                  className="flex-1 h-11 bg-green-500 hover:bg-green-600 shadow-md shadow-green-500/20"
                >
                  {sendingWhatsapp ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MessageCircle className="h-4 w-4 mr-2" />
                  )}
                  Enviar WhatsApp
                </Button>
              </div>
            </div>
          </div>

          {/* Activity History */}
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <ActivityHistory />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
