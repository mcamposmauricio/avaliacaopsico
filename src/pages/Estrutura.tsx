import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Building2, FolderTree, Briefcase, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Estrutura() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  // Org Units
  const { data: orgUnits = [] } = useQuery({
    queryKey: ["org_units", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("org_units").select("*").order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  // Departments
  const { data: departments = [] } = useQuery({
    queryKey: ["departments", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("*, org_units(name)").order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  // Job Roles
  const { data: jobRoles = [] } = useQuery({
    queryKey: ["job_roles", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("job_roles").select("*").order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Estrutura Organizacional</h1>
      <Tabs defaultValue="units">
        <TabsList>
          <TabsTrigger value="units" className="gap-2"><Building2 className="h-4 w-4" />Unidades</TabsTrigger>
          <TabsTrigger value="departments" className="gap-2"><FolderTree className="h-4 w-4" />Departamentos</TabsTrigger>
          <TabsTrigger value="roles" className="gap-2"><Briefcase className="h-4 w-4" />Cargos</TabsTrigger>
        </TabsList>

        <TabsContent value="units">
          <OrgUnitsTab orgUnits={orgUnits} tenantId={tenantId} queryClient={queryClient} />
        </TabsContent>
        <TabsContent value="departments">
          <DepartmentsTab departments={departments} orgUnits={orgUnits} tenantId={tenantId} queryClient={queryClient} />
        </TabsContent>
        <TabsContent value="roles">
          <JobRolesTab jobRoles={jobRoles} tenantId={tenantId} queryClient={queryClient} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrgUnitsTab({ orgUnits, tenantId, queryClient }: any) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("org_units").insert({ name, tenant_id: tenantId });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["org_units"] }); setOpen(false); setName(""); toast.success("Unidade criada"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("org_units").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["org_units"] }); toast.success("Unidade removida"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Unidades Organizacionais</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova Unidade</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Unidade</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Matriz São Paulo" />
              </div>
              <Button onClick={() => createMutation.mutate()} disabled={!name || createMutation.isPending} className="w-full">
                Criar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orgUnits.length === 0 ? (
              <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Nenhuma unidade cadastrada</TableCell></TableRow>
            ) : orgUnits.map((u: any) => (
              <TableRow key={u.id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(u.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function DepartmentsTab({ departments, orgUnits, tenantId, queryClient }: any) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [orgUnitId, setOrgUnitId] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("departments").insert({ name, org_unit_id: orgUnitId, tenant_id: tenantId });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["departments"] }); setOpen(false); setName(""); setOrgUnitId(""); toast.success("Departamento criado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("departments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["departments"] }); toast.success("Departamento removido"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Departamentos</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo Departamento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Departamento</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Tecnologia" />
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select value={orgUnitId} onValueChange={setOrgUnitId}>
                  <SelectTrigger><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                  <SelectContent>
                    {orgUnits.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => createMutation.mutate()} disabled={!name || !orgUnitId || createMutation.isPending} className="w-full">
                Criar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Nenhum departamento cadastrado</TableCell></TableRow>
            ) : departments.map((d: any) => (
              <TableRow key={d.id}>
                <TableCell>{d.name}</TableCell>
                <TableCell>{d.org_units?.name}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(d.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function JobRolesTab({ jobRoles, tenantId, queryClient }: any) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("job_roles").insert({ name, tenant_id: tenantId });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["job_roles"] }); setOpen(false); setName(""); toast.success("Cargo criado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("job_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["job_roles"] }); toast.success("Cargo removido"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Cargos / Funções</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo Cargo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Cargo</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Analista de RH" />
              </div>
              <Button onClick={() => createMutation.mutate()} disabled={!name || createMutation.isPending} className="w-full">
                Criar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobRoles.length === 0 ? (
              <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Nenhum cargo cadastrado</TableCell></TableRow>
            ) : jobRoles.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell>{r.name}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(r.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
