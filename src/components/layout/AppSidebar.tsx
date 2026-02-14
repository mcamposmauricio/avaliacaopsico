import {
  LayoutDashboard,
  Building2,
  Users,
  ClipboardList,
  BarChart3,
  FileText,
  Settings,
  Shield,
  Target,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useTenant } from "@/hooks/useTenant";

type AppRole = "admin_rh" | "gestor" | "diretoria" | "auditoria";

interface NavItem {
  title: string;
  url: string;
  icon: any;
  roles?: AppRole[];
}

const mainNav: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Estrutura", url: "/estrutura", icon: Building2, roles: ["admin_rh"] },
  { title: "Colaboradores", url: "/colaboradores", icon: Users, roles: ["admin_rh"] },
  { title: "Campanhas", url: "/campanhas", icon: ClipboardList, roles: ["admin_rh"] },
  { title: "Análises", url: "/analises", icon: BarChart3 },
  { title: "Relatórios", url: "/relatorios", icon: FileText, roles: ["admin_rh", "diretoria", "auditoria"] },
  { title: "Plano de Ação", url: "/plano-acao", icon: Target, roles: ["admin_rh", "gestor"] },
];

const adminNav: NavItem[] = [
  { title: "Configurações", url: "/configuracoes", icon: Settings, roles: ["admin_rh"] },
  { title: "Governança", url: "/governanca", icon: Shield, roles: ["admin_rh", "auditoria"] },
];

export function AppSidebar() {
  const { tenant, roles } = useTenant();

  const hasAccess = (item: NavItem) => {
    if (!item.roles) return true; // visible to all
    if (roles.length === 0) return true; // no roles loaded yet, show all
    return roles.some((r) => item.roles!.includes(r as AppRole));
  };

  const filteredMain = mainNav.filter(hasAccess);
  const filteredAdmin = adminNav.filter(hasAccess);

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          {tenant?.logo_url ? (
            <img src={tenant.logo_url} alt="Logo" className="h-9 w-9 rounded-lg object-contain" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
              AP
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">
              {tenant?.name || "Avaliação"}
            </span>
            <span className="text-xs text-sidebar-foreground/60">
              Psicossocial
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredAdmin.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAdmin.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="hover:bg-sidebar-accent/50"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="text-xs text-sidebar-foreground/40">
          © 2026 {tenant?.name || "Avaliação Psicossocial"}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
