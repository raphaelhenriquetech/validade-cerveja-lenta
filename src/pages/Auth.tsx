import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Beer, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const authSchema = z.object({
  email: z.string().email('Email inválido').max(255, 'Email muito longo'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(72, 'Senha muito longa'),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = authSchema.safeParse({ email: email.trim(), password });
    if (!result.success) {
      toast({
        title: 'Erro de validação',
        description: result.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Erro ao entrar',
              description: 'Email ou senha incorretos',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erro ao entrar',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Bem-vindo!',
            description: 'Login realizado com sucesso',
          });
          navigate('/');
        }
      } else {
        const { error } = await signUp(email.trim(), password);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Erro ao cadastrar',
              description: 'Este email já está cadastrado',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erro ao cadastrar',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Conta criada!',
            description: 'Você já pode fazer login',
          });
          navigate('/');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full font-display">
      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="relative hidden w-2/5 flex-col items-center justify-center bg-[#101622] text-primary-foreground lg:flex">
        {/* SVG Pattern Background */}
        <div className="absolute inset-0 z-0">
          <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern 
                height="48" 
                id="grid-pattern" 
                patternTransform="scale(1) rotate(0)" 
                patternUnits="userSpaceOnUse" 
                width="48"
              >
                <rect fill="hsla(0,0%,100%,0)" height="100%" width="100%" x="0" y="0" />
                <path 
                  d="M12 16H0v-4h12V0h4v12h12v4H16v12h-4V16zm12 20H12v-4h12V20h4v12h12v4H28v12h-4V36zM36 0v4h12v12h4V4h-4V0h-8z" 
                  fill="hsla(223, 75%, 25%, 0.1)" 
                  stroke="none" 
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect fill="url(#grid-pattern)" height="800%" transform="translate(0,0)" width="800%" />
          </svg>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-start px-16 max-w-lg">
          <div className="flex items-center gap-3 pb-6">
            <Beer className="h-10 w-10 text-primary" />
            <h2 className="text-2xl font-bold text-primary-foreground">Cerveja Lenta</h2>
          </div>
          <h3 className="text-4xl font-bold tracking-tight text-primary-foreground mb-4">
            Controle de lotes e validades para sua cervejaria.
          </h3>
          <p className="text-lg text-muted-foreground">
            Monitore validades, evite perdas e otimize seu estoque com nossa solução inteligente.
          </p>
        </div>
        
        {/* Copyright */}
        <div className="absolute bottom-6 left-6 text-sm text-muted-foreground">
          <p>© 2024 Cerveja Lenta. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#f6f6f8] dark:bg-background p-4 sm:p-6 lg:p-8 relative">
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <div className="flex w-full max-w-md flex-col items-start gap-2">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 pb-4 lg:hidden">
            <Beer className="h-8 w-8 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Cerveja Lenta</h2>
          </div>

          <h1 className="text-foreground tracking-tight text-[32px] font-bold leading-tight text-left pb-1">
            {isLogin ? 'Acesse sua conta' : 'Crie sua conta'}
          </h1>
          <p className="text-muted-foreground text-base font-normal leading-normal pb-6">
            {isLogin 
              ? 'Bem-vindo de volta! Por favor, insira seus dados.' 
              : 'Preencha os dados abaixo para criar sua conta.'}
          </p>

          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">
            {/* Email Field */}
            <label className="flex flex-col w-full">
              <p className="text-foreground text-base font-medium leading-normal pb-2">Email</p>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Digite seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 pl-12 pr-4 text-base bg-background border-border focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
            </label>

            {/* Password Field */}
            <label className="flex flex-col w-full">
              <p className="text-foreground text-base font-medium leading-normal pb-2">Senha</p>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 h-5 w-5 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 pl-12 pr-12 text-base bg-background border-border focus:ring-2 focus:ring-primary/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </label>

            {/* Forgot Password Link (only on login) */}
            {isLogin && (
              <div className="flex w-full items-center justify-end -mt-2">
                <button
                  type="button"
                  className="text-primary text-sm font-medium leading-normal underline hover:text-primary/80 transition-colors"
                  onClick={() => toast({
                    title: 'Em breve',
                    description: 'Funcionalidade de recuperação de senha em desenvolvimento.',
                  })}
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-14 text-base font-bold mt-2"
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
              {isLogin ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center w-full">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
