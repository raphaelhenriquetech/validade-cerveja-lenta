import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, Package, Settings as SettingsIcon, LogOut, Menu, X } from "lucide-react";
import stockbrewLogoLight from "@/assets/stockbrew-logo-light.png";
import stockbrewLogoDark from "@/assets/stockbrew-logo-dark.png";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { title: "Estoque", url: "/", icon: Home },
  { title: "Produtos Tiny", url: "/produtos-tiny", icon: Package },
  { title: "Configurações", url: "/configuracoes", icon: SettingsIcon },
];

export default function AppLayout() {
  const { pathname } = useLocation();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const { company, companies, selectCompany } = useCompany();
  const logoSrc = resolvedTheme === "dark" ? stockbrewLogoDark : stockbrewLogoLight;

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) toast({ title: "Erro ao sair", description: error.message, variant: "destructive" });
  };

  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="max-w-screen-2xl mx-auto flex items-center gap-4 px-4 md:px-6 h-16">
          {/* Brand */}
          <NavLink to="/" className="flex items-center gap-3 shrink-0 group" aria-label={company?.name ?? "Stock Brew"}>
            <img
              src={company?.logo_url ?? logoSrc}
              alt={company?.name ?? "Stock Brew"}
              className="h-9 md:h-10 w-auto max-w-[160px] object-contain transition-transform group-hover:scale-[1.03]"
            />
            {company?.logo_url && (
              <span className="hidden lg:inline text-sm font-semibold text-foreground truncate max-w-[180px]">
                {company.name}
              </span>
            )}
          </NavLink>


          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {navItems.map((item) => {
              const active = isActive(item.url);
              return (
                <NavLink
                  key={item.url}
                  to={item.url}
                  end={item.url === "/"}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-purple/10 text-brand-purple"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="flex-1" />

          <div className="hidden md:flex items-center gap-1">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="h-7 w-7 rounded-full bg-brand-purple flex items-center justify-center text-[11px] font-bold text-brand-purple-foreground shadow-sm overflow-hidden">
                    {company?.logo_url ? (
                      <img src={company.logo_url} alt={company.name} className="h-full w-full object-contain bg-background" />
                    ) : (
                      user?.email?.[0]?.toUpperCase() ?? "U"
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
                {company && (
                  <div className="px-2 pb-1 text-xs text-muted-foreground truncate">{company.name}</div>
                )}
                <DropdownMenuSeparator />
                {companies.length > 1 && (
                  <>
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Empresa</DropdownMenuLabel>
                    {companies.map((c) => (
                      <DropdownMenuItem
                        key={c.id}
                        onClick={() => selectCompany(c.id)}
                        className={cn("gap-2", c.id === company?.id && "text-brand-purple font-medium")}
                      >
                        {c.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile trigger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/60 bg-background">
            <nav className="max-w-screen-2xl mx-auto px-4 py-3 flex flex-col gap-1">
              {navItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <NavLink
                    key={item.url}
                    to={item.url}
                    end={item.url === "/"}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                      active
                        ? "bg-brand-purple/10 text-brand-purple"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </NavLink>
                );
              })}
              <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between">
                <span className="text-xs text-muted-foreground truncate">
                  {company ? `${company.name} · ${user?.email}` : user?.email}
                </span>
                <div className="flex items-center gap-1">
                  <ThemeToggle />
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-destructive hover:bg-destructive/10"
                    aria-label="Sair"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
