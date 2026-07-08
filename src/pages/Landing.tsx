import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  Beer,
  BarChart3,
  FileText,
  Tag,
  MapPin,
  History,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Package,
  Truck,
  MessageCircle,
  Mail,
  Star,
  Zap,
  Shield,
  TrendingDown,
  Settings2,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { ThemeToggle } from "@/components/ThemeToggle";
import logoLight from "@/assets/stockbrew-logo-light.png";
import logoDark from "@/assets/stockbrew-logo-dark.png";

const features = [
  {
    icon: Beer,
    title: "Controle de Validade",
    description: "Monitore lotes com alertas automáticos por faixas de vencimento: crítico, atenção, alerta e OK.",
  },
  {
    icon: BarChart3,
    title: "Dashboard em Tempo Real",
    description: "Visualize total de lotes, produtos vencidos, críticos e em atenção em cards coloridos.",
  },
  {
    icon: FileText,
    title: "Relatórios Automáticos",
    description: "Receba relatórios por e-mail e WhatsApp nos horários programados ou gere PDFs sob demanda.",
  },
  {
    icon: History,
    title: "Histórico de Atividades",
    description: "Auditoria completa de todas as ações: criação, edição, exclusão e arquivamento de lotes.",
  },
];

const integrations = [
  { icon: Package, name: "Tiny ERP", description: "Sincronização bidirecional de estoque por SKU" },
  
  { icon: MessageCircle, name: "WhatsApp", description: "Relatórios automáticos via CallMeBot" },
  { icon: Mail, name: "Email (Resend)", description: "Notificações e relatórios por e-mail" },
  { icon: Smartphone, name: "PWA", description: "Instale no celular como um app nativo" },
];

const benefits = [
  { icon: TrendingDown, text: "Reduza perdas com alertas de validade em tempo real" },
  { icon: Zap, text: "Automatize relatórios e sincronização de estoque" },
  { icon: Shield, text: "Controle centralizado de lotes, envios e integrações" },
  { icon: Globe, text: "Acesse de qualquer lugar — celular, tablet ou desktop" },
  { icon: Settings2, text: "Configure integrações sem precisar de desenvolvedor" },
];

const testimonials = [
  {
    name: "Ricardo M.",
    role: "Cervejaria Artesanal do Sul",
    text: "Antes do StockBrew, perdíamos lotes por falta de controle. Agora recebemos alertas automáticos e nunca mais tivemos prejuízo com validade.",
    rating: 5,
  },
  {
    name: "Juliana S.",
    role: "Distribuidora Premium Drinks",
    text: "A integração com o Tiny ERP foi um divisor de águas. O estoque sincroniza sozinho e a gente ganha horas por semana.",
    rating: 5,
  },
  {
    name: "Carlos A.",
    role: "Brew House Microbrewery",
    text: "O painel de validades por cores facilita demais a rotina. Nossa equipe adotou em 1 dia.",
    rating: 5,
  },
  {
    name: "Fernanda L.",
    role: "Empório da Cerveja",
    text: "Os relatórios por WhatsApp às 8h da manhã me dão visibilidade total do estoque antes de abrir a loja. Sensacional!",
    rating: 5,
  },
];

const Landing = () => {
  const { resolvedTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-3">
            <img
              src={resolvedTheme === "dark" ? logoDark : logoLight}
              alt="StockBrew"
              className="h-16 md:h-24"
            />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-12 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <Badge variant="secondary" className="mb-6 text-sm px-4 py-1.5">
            <Smartphone className="mr-1.5 h-3.5 w-3.5" />
            PWA — Instale no celular
          </Badge>
          <h1 className="font-display text-3xl md:text-6xl font-extrabold tracking-tight mb-4 md:mb-6 leading-tight">
            Controle de validade
            <br />
            <span className="text-primary">inteligente</span> para cervejarias
          </h1>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 md:mb-10 px-2">
            Gerencie lotes, automatize relatórios, sincronize estoque com o Tiny ERP e gere
            etiquetas de envio — tudo em um só lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-base px-8">
              <Link to="/auth">
                Comece Agora <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8">
              <a href="#funcionalidades">Ver Funcionalidades</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="py-12 md:py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-14">
            <Badge variant="outline" className="mb-4">Funcionalidades</Badge>
            <h2 className="font-display text-2xl md:text-4xl font-bold">
              Tudo que você precisa para gerenciar seus lotes
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="hover-lift border-border/50">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integrações */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-14">
            <Badge variant="outline" className="mb-4">Integrações</Badge>
            <h2 className="font-display text-2xl md:text-4xl font-bold">
              Conectado com suas ferramentas
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
            {integrations.map((item) => (
              <Card key={item.name} className="hover-lift text-center border-border/50">
                <CardContent className="p-6 flex flex-col items-center">
                  <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                    <item.icon className="h-7 w-7 text-accent" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-12 md:py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-14">
            <Badge variant="outline" className="mb-4">Benefícios</Badge>
            <h2 className="font-display text-2xl md:text-4xl font-bold">
              Por que escolher o StockBrew?
            </h2>
          </div>
          <div className="max-w-2xl mx-auto space-y-5">
            {benefits.map((b) => (
              <div key={b.text} className="flex items-start gap-4 animate-fade-in">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-base md:text-lg">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-14">
            <Badge variant="outline" className="mb-4">Depoimentos</Badge>
            <h2 className="font-display text-2xl md:text-4xl font-bold">
              O que nossos clientes dizem
            </h2>
          </div>
          <div className="max-w-4xl mx-auto px-2 md:px-12">
            <Carousel opts={{ loop: true }}>
              <CarouselContent>
                {testimonials.map((t) => (
                  <CarouselItem key={t.name} className="md:basis-1/2">
                    <Card className="border-border/50 h-full">
                      <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div>
                          <div className="flex gap-0.5 mb-3">
                            {Array.from({ length: t.rating }).map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground mb-4 italic">"{t.text}"</p>
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.role}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </Carousel>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-12 md:py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-2xl md:text-4xl font-bold mb-4">
            Pronto para eliminar perdas e automatizar seu controle?
          </h2>
          <p className="text-lg opacity-90 max-w-xl mx-auto mb-8">
            Comece a usar o StockBrew agora mesmo. Cadastro rápido, sem cartão de crédito.
          </p>
          <Button size="lg" variant="secondary" asChild className="text-base px-8">
            <Link to="/auth">
              Criar Conta Grátis <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Feito por Cerveja Lenta Tech
        </div>
      </footer>
    </div>
  );
};

export default Landing;
