import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Info, UserPlus, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ALL_ROLES: AppRole[] = ["admin_rh", "gestor", "diretoria", "auditoria"];

const ROLE_INFO: { role: AppRole; label: string; description: string }[] = [
  { role: "admin_rh", label: "Admin RH", description: "Acesso total: estrutura, colaboradores, campanhas, relatórios, planos de ação, configurações e governança" },
  { role: "gestor", label: "Gestor", description: "Dashboard, análises e planos de ação filtrados pelo seu departamento" },
  { role: "diretoria", label: "Diretoria", description: "Visão consolidada somente-leitura: dashboard, análises e relatórios" },
  { role: "auditoria", label: "Auditoria", description: "Somente-leitura em governança e relatórios" },
];

const ROLE_LABELS: Record<AppRole, string> = Object.fromEntries(
  ROLE_INFO.map((r) => [r.role, r.label])
) as Record<AppRole, string>;

export default function UserRolesManager() {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<AppRole | "">("");

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .eq("tenant_id", tenantId!);
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ["user_roles_all", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("id, user_id, role")
        .eq("tenant_id", tenantId!);
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["profiles", tenantId] });
    queryClient.invalidateQueries({ queryKey: ["user_roles_all", tenantId] });
    queryClient.invalidateQueries({ queryKey: ["user_roles", user?.id] });
  };

  const createUser = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("create-tenant-user", {
        body: { tenant_id: tenantId, email: newEmail, password: newPassword, full_name: newName, role: newRole },
      });
      if (error) {
        const context = await (error as any).context?.json?.().catch(() => null);
        throw new Error(context?.error || error.message);
      }
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      invalidate();
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("");
      toast.success("Usuário criado com sucesso");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const changeRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      const { error: delErr } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("tenant_id", tenantId!);
      if (delErr) throw delErr;
      const { error: insErr } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole, tenant_id: tenantId! });
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Papel atualizado");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const getCurrentRole = (userId: string): AppRole | undefined => {
    const entry = userRoles.find((r) => r.user_id === userId);
    return entry?.role as AppRole | undefined;
  };

  const handleChange = (userId: string, newRole: AppRole) => {
    const currentRole = getCurrentRole(userId);
    if (userId === user?.id && currentRole === "admin_rh" && newRole !== "admin_rh") {
      const otherAdmins = userRoles.filter(
        (r) => r.role === "admin_rh" && r.user_id !== user?.id
      );
      if (otherAdmins.length === 0) {
        toast.error("Você é o único Admin RH. Atribua este papel a outro usuário antes de alterar o seu.");
        return;
      }
    }
    changeRole.mutate({ userId, newRole });
  };

  const canSubmit = newName.trim() && newEmail.trim() && newPassword.trim() && newRole;

  return (
    <div className="space-y-6">
      {/* Create user form */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-foreground">Criar novo usuário</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-name" className="text-xs">Nome completo</Label>
            <Input
              id="new-name"
              placeholder="Ex: João Silva"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-email" className="text-xs">Email</Label>
            <Input
              id="new-email"
              type="email"
              placeholder="usuario@empresa.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-xs">Senha</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Papel</Label>
            <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-3">
          <Button
            size="sm"
            onClick={() => createUser.mutate()}
            disabled={!canSubmit || createUser.isPending}
            className="gap-2"
          >
            {createUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {createUser.isPending ? "Criando..." : "Criar Usuário"}
          </Button>
        </div>
      </div>

      {/* Role descriptions */}
      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Descrição dos papéis</span>
        </div>
        <div className="grid gap-2">
          {ROLE_INFO.map((r) => (
            <div key={r.role} className="flex gap-2 text-sm">
              <span className="font-medium text-foreground min-w-[90px]">{r.label}:</span>
              <span className="text-muted-foreground">{r.description}</span>
            </div>
          ))}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Papel</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile) => {
            const currentRole = getCurrentRole(profile.user_id);
            return (
              <TableRow key={profile.user_id}>
                <TableCell className="font-medium">
                  {profile.full_name || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {profile.email || "—"}
                </TableCell>
                <TableCell>
                  <Select
                    value={currentRole || ""}
                    onValueChange={(v) => handleChange(profile.user_id, v as AppRole)}
                    disabled={changeRole.isPending}
                  >
                    <SelectTrigger className="w-40 h-8">
                      <SelectValue placeholder="Selecione um papel" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
