import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Trash2, UserCheck, UserX, Search, Users } from "lucide-react";
import { toast } from "sonner";

export default function Colaboradores() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ full_name: "", email: "", department_id: "", job_role_id: "" });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*, departments(name), job_roles(name)")
        .order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const { data: jobRoles = [] } = useQuery({
    queryKey: ["job_roles", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("job_roles").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("employees").insert({
        full_name: form.full_name,
        email: form.email,
        department_id: form.department_id || null,
        job_role_id: form.job_role_id || null,
        tenant_id: tenantId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setOpen(false);
      setForm({ full_name: "", email: "", department_id: "", job_role_id: "" });
      toast.success("Colaborador cadastrado");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("employees").update({ is_active: !is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["employees"] }); toast.success("Colaborador removido"); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = employees.filter((e: any) =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Colaboradores</h1>
          <p className="text-muted-foreground mt-1">
            Gestão de colaboradores elegíveis para avaliação
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />Novo Colaborador</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Colaborador</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Select value={form.job_role_id} onValueChange={(v) => setForm({ ...form, job_role_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {jobRoles.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => createMutation.mutate()} disabled={!form.full_name || !form.email || createMutation.isPending} className="w-full">
                Cadastrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          Mostrando {filtered.length} de {employees.length}
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhum colaborador encontrado</p>
                  </TableCell>
                </TableRow>
              ) : filtered.map((emp: any) => (
                <TableRow key={emp.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {getInitials(emp.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{emp.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{emp.email}</TableCell>
                  <TableCell>{emp.departments?.name || "—"}</TableCell>
                  <TableCell>{emp.job_roles?.name || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={emp.is_active ? "default" : "secondary"} className="gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${emp.is_active ? "bg-success" : "bg-muted-foreground"}`} />
                      {emp.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleMutation.mutate({ id: emp.id, is_active: emp.is_active })}>
                        {emp.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(emp.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
