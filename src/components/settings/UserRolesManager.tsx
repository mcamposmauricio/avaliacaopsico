import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ALL_ROLES: AppRole[] = ["admin_rh", "gestor", "diretoria", "auditoria"];

const ROLE_LABELS: Record<AppRole, string> = {
  admin_rh: "Admin RH",
  gestor: "Gestor",
  diretoria: "Diretoria",
  auditoria: "Auditoria",
};

export default function UserRolesManager() {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<Record<string, AppRole | "">>({});

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
    queryClient.invalidateQueries({ queryKey: ["user_roles_all", tenantId] });
    queryClient.invalidateQueries({ queryKey: ["user_roles", user?.id] });
  };

  const addRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role,
        tenant_id: tenantId!,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Role adicionada");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeRole = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Role removida");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const getRolesForUser = (userId: string) =>
    userRoles.filter((r) => r.user_id === userId);

  const handleAdd = (userId: string) => {
    const role = selectedRole[userId];
    if (!role) return;
    addRole.mutate({ userId, role });
    setSelectedRole((prev) => ({ ...prev, [userId]: "" }));
  };

  const handleRemove = (roleEntry: { id: string; user_id: string; role: string }) => {
    // Prevent removing own last admin_rh
    if (
      roleEntry.user_id === user?.id &&
      roleEntry.role === "admin_rh"
    ) {
      const adminCount = userRoles.filter(
        (r) => r.user_id === user?.id && r.role === "admin_rh"
      ).length;
      if (adminCount <= 1) {
        toast.error("Você não pode remover sua própria última role de Admin RH");
        return;
      }
    }
    removeRole.mutate(roleEntry.id);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Roles</TableHead>
          <TableHead>Adicionar Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {profiles.map((profile) => {
          const roles = getRolesForUser(profile.user_id);
          const existingRoles = roles.map((r) => r.role);
          const availableRoles = ALL_ROLES.filter((r) => !existingRoles.includes(r));

          return (
            <TableRow key={profile.user_id}>
              <TableCell className="font-medium">
                {profile.full_name || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {profile.email || "—"}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((r) => (
                    <Badge key={r.id} variant="secondary" className="gap-1 pr-1">
                      {ROLE_LABELS[r.role as AppRole] || r.role}
                      <button
                        onClick={() => handleRemove(r)}
                        className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5"
                        disabled={removeRole.isPending}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {roles.length === 0 && (
                    <span className="text-xs text-muted-foreground">Sem roles</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {availableRoles.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedRole[profile.user_id] || ""}
                      onValueChange={(v) =>
                        setSelectedRole((prev) => ({
                          ...prev,
                          [profile.user_id]: v as AppRole,
                        }))
                      }
                    >
                      <SelectTrigger className="w-36 h-8">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1"
                      disabled={!selectedRole[profile.user_id] || addRole.isPending}
                      onClick={() => handleAdd(profile.user_id)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Todas atribuídas</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
