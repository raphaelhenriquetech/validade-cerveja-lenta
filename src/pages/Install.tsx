import { usePWA } from "@/hooks/usePWA";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Monitor, Apple, CheckCircle2, ArrowLeft, Share, MoreVertical, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";

const Install = () => {
  const navigate = useNavigate();
  const { isInstalled, isIOS, isMacOS, isWindows, isAndroid, promptInstall, canInstall } = usePWA();

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      navigate('/');
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>App Instalado!</CardTitle>
              <CardDescription>
                O StockBrew já está instalado no seu dispositivo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para o App
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <span className="text-3xl">🍺</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Instalar StockBrew</h1>
            <p className="text-muted-foreground">
              Instale o app no seu dispositivo para acesso rápido e funcionamento offline.
            </p>
          </div>

          {canInstall && (
            <Card className="mb-6 border-primary/50 bg-primary/5">
              <CardContent className="pt-6">
                <Button onClick={handleInstall} size="lg" className="w-full">
                  <Download className="mr-2 h-5 w-5" />
                  Instalar Agora
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {/* iOS Instructions */}
            <Card className={isIOS ? "border-primary/50 bg-primary/5" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <Apple className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">iPhone / iPad</CardTitle>
                    <CardDescription>Safari</CardDescription>
                  </div>
                  {isIOS && <span className="ml-auto text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">Seu dispositivo</span>}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs font-medium">1</span>
                    <span>Toque no ícone <Share className="inline h-4 w-4 mx-1" /> <strong>Compartilhar</strong> na barra inferior do Safari</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs font-medium">2</span>
                    <span>Role para baixo e toque em <Plus className="inline h-4 w-4 mx-1" /> <strong>Adicionar à Tela de Início</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs font-medium">3</span>
                    <span>Toque em <strong>Adicionar</strong> no canto superior direito</span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            {/* macOS Instructions */}
            <Card className={isMacOS ? "border-primary/50 bg-primary/5" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Mac</CardTitle>
                    <CardDescription>Safari ou Chrome</CardDescription>
                  </div>
                  {isMacOS && <span className="ml-auto text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">Seu dispositivo</span>}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Safari:</p>
                    <ol className="space-y-2 text-sm text-muted-foreground ml-4">
                      <li>1. Clique em <strong>Arquivo</strong> na barra de menu</li>
                      <li>2. Selecione <strong>Adicionar ao Dock</strong></li>
                    </ol>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Chrome:</p>
                    <ol className="space-y-2 text-sm text-muted-foreground ml-4">
                      <li>1. Clique no ícone <MoreVertical className="inline h-4 w-4 mx-1" /> no canto superior direito</li>
                      <li>2. Selecione <strong>Instalar StockBrew...</strong></li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Windows Instructions */}
            <Card className={isWindows ? "border-primary/50 bg-primary/5" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Windows</CardTitle>
                    <CardDescription>Chrome ou Edge</CardDescription>
                  </div>
                  {isWindows && <span className="ml-auto text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">Seu dispositivo</span>}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs font-medium">1</span>
                    <span>Clique no ícone <Download className="inline h-4 w-4 mx-1" /> na barra de endereço ou no menu <MoreVertical className="inline h-4 w-4 mx-1" /></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs font-medium">2</span>
                    <span>Selecione <strong>Instalar StockBrew</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs font-medium">3</span>
                    <span>Clique em <strong>Instalar</strong> na janela de confirmação</span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            {/* Android Instructions */}
            <Card className={isAndroid ? "border-primary/50 bg-primary/5" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Android</CardTitle>
                    <CardDescription>Chrome</CardDescription>
                  </div>
                  {isAndroid && <span className="ml-auto text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">Seu dispositivo</span>}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs font-medium">1</span>
                    <span>Toque no ícone <MoreVertical className="inline h-4 w-4 mx-1" /> no canto superior direito</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs font-medium">2</span>
                    <span>Selecione <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs font-medium">3</span>
                    <span>Toque em <strong>Instalar</strong></span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-2">Benefícios do App Instalado</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Acesso rápido direto da tela inicial</li>
              <li>✓ Funciona mesmo sem internet</li>
              <li>✓ Atualizações automáticas</li>
              <li>✓ Experiência em tela cheia</li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Install;