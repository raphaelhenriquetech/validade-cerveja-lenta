import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, Plus, Trash2, Send, Loader2 } from 'lucide-react';

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
      <header className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Mail className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
              <p className="text-sm text-muted-foreground">Gerenciar emails para relatórios</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Emails para Relatório</CardTitle>
            <CardDescription>
              Cadastre os emails que receberão o relatório diário de validades
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={addEmail} className="flex gap-2">
              <Input
                type="email"
                placeholder="Digite o email..."
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </form>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum email cadastrado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emails.map((email) => (
                    <TableRow key={email.id}>
                      <TableCell>{email.email}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteEmail(email.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Envio Manual</CardTitle>
            <CardDescription>
              Envie um relatório de teste para os emails cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={sendTestReport} disabled={sending || emails.length === 0}>
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {sending ? 'Enviando...' : 'Enviar Relatório Agora'}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
