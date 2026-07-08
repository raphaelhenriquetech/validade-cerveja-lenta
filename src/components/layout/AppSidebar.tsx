import { NavLink, useLocation } from "react-router-dom";
import { Home, Package, Truck, Settings as SettingsIcon, LogOut, Beer } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

const stockItems = [
  { title: "Estoque", url: "/", icon: Home },
  { title: "Produtos Tiny", url: "/produtos-tiny", icon: Package },
];

const logisticsItems = [
  { title: "Etiquetas J3", url: "/etiquetas-j3", icon: Truck },
];

const systemItems = [
  { title: "Configurações", url: "/configuracoes", icon: SettingsIcon },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { signOut, user } = useAuth();
  const { toast } = useToast();

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({ title: "Erro ao sair", description: error.message, variant: "destructive" });
    }
  };

  const renderGroup = (label: string, items: typeof stockItems) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase tracking-wider text-[10px] font-semibold">{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url)} className="h-10">
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  className={({ isActive: active }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 transition-colors",
                      active
                        ? "bg-sidebar-primary/15 text-sidebar-primary font-semibold"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )
                  }
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span className="text-sm">{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border/50">
        <div className={cn("flex items-center gap-3 px-2 py-3", collapsed && "justify-center px-0")}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-gold shadow-emerald">
            <Beer className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-heading text-base font-bold text-sidebar-foreground">StockBrew</span>
              <span className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">Cerveja Lenta</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {renderGroup("Estoque", stockItems)}
        {renderGroup("Logística", logisticsItems)}
        {renderGroup("Sistema", systemItems)}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-2 gap-1">
        {!collapsed && user?.email && (
          <div className="px-2 py-1.5 text-[11px] text-sidebar-foreground/60 truncate" title={user.email}>
            {user.email}
          </div>
        )}
        <div className={cn("flex items-center gap-1", collapsed && "flex-col")}>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
              collapsed ? "justify-center w-full" : "flex-1"
            )}
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
