import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, Plus, Trash2, Send, Loader2, Settings as SettingsIcon } from 'lucide-react';

interface EmailSetting {
  id: string;
  email: string;
  is_active: boolean;
}

const Settings = () => {
  const [emails, setEmails] = useState<EmailSetting[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

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

  useEffect(() => {
    fetchEmails();
  }, []);

  const addEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    try {
      const { error } = await supabase
        .from('email_settings')
        .insert({ email: newEmail.trim() });

      if (error) throw error;

      toast({
        title: 'Email adicionado',
        description: `${newEmail} foi cadastrado para receber relatórios`,
      });

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

  const deleteEmail = async (id: string) => {
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
              <p className="text-sm text-primary-foreground/80">Gerenciar emails para relatórios</p>
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
                            onClick={() => deleteEmail(email.id)}
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
              Envie um relatório de teste para os emails cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Button 
              onClick={sendTestReport} 
              disabled={sending || emails.length === 0}
              className="h-12 px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-md font-medium"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {sending ? 'Enviando...' : 'Enviar Relatório Agora'}
            </Button>
            {emails.length === 0 && (
              <p className="text-sm text-muted-foreground mt-3">
                Adicione pelo menos um email para enviar o relatório.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
