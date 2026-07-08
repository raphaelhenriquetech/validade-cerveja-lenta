import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

const routeTitles: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Estoque", subtitle: "Lotes ativos e validades" },
  "/configuracoes": { title: "Configurações", subtitle: "Emails, WhatsApp e integrações" },
  "/produtos-tiny": { title: "Produtos Tiny", subtitle: "Consulta ao Olist Tiny ERP" },
  "/etiquetas-j3": { title: "Etiquetas J3", subtitle: "Geração de etiquetas de envio" },
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const meta = routeTitles[pathname] ?? { title: "StockBrew", subtitle: "" };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 h-14 flex items-center gap-3 border-b border-border/60 bg-background/85 backdrop-blur-md px-3 md:px-6">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="min-w-0 flex-1">
              <h1 className="font-heading text-base md:text-lg font-semibold text-foreground truncate leading-tight">
                {meta.title}
              </h1>
              {meta.subtitle && (
                <p className="text-[11px] md:text-xs text-muted-foreground truncate leading-tight">
                  {meta.subtitle}
                </p>
              )}
            </div>
          </header>

          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
