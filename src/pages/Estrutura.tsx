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
import { Plus, Building2, FolderTree, Briefcase, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Estrutura() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  const { data: orgUnits = [] } = useQuery({
    queryKey: ["org_units", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("org_units").select("*").order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("*, org_units(name)").order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Estrutura Organizacional</h1>
        <p className="text-muted-foreground mt-1">Unidades, departamentos e cargos</p>
      </div>
      <Tabs defaultValue="units">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="units" className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"><Building2 className="h-4 w-4" />Unidades</TabsTrigger>
          <TabsTrigger value="departments" className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"><FolderTree className="h-4 w-4" />Departamentos</TabsTrigger>
          <TabsTrigger value="roles" className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"><Briefcase className="h-4 w-4" />Cargos</TabsTrigger>
        </TabsList>

        <TabsContent value="units" className="mt-6">
          <OrgUnitsTab orgUnits={orgUnits} tenantId={tenantId} queryClient={queryClient} />
        </TabsContent>
        <TabsContent value="departments" className="mt-6">
          <DepartmentsTab departments={departments} orgUnits={orgUnits} tenantId={tenantId} queryClient={queryClient} />
        </TabsContent>
        <TabsContent value="roles" className="mt-6">
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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Unidades Organizacionais</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Nova Unidade</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Unidade</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Matriz São Paulo" />
              </div>
              <Button onClick={() => createMutation.mutate()} disabled={!name || createMutation.isPending} className="w-full">Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {orgUnits.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Nenhuma unidade cadastrada</p>
            </CardContent>
          </Card>
        ) : orgUnits.map((u: any) => (
          <Card key={u.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium text-foreground">{u.name}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(u.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Departamentos</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Novo Departamento</Button>
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
              <Button onClick={() => createMutation.mutate()} disabled={!name || !orgUnitId || createMutation.isPending} className="w-full">Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <FolderTree className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Nenhum departamento cadastrado</p>
            </CardContent>
          </Card>
        ) : departments.map((d: any) => (
          <Card key={d.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <FolderTree className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <span className="font-medium text-foreground block">{d.name}</span>
                  <span className="text-xs text-muted-foreground">{d.org_units?.name}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(d.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Cargos / Funções</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Novo Cargo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Cargo</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Analista de RH" />
              </div>
              <Button onClick={() => createMutation.mutate()} disabled={!name || createMutation.isPending} className="w-full">Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobRoles.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Briefcase className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Nenhum cargo cadastrado</p>
            </CardContent>
          </Card>
        ) : jobRoles.map((r: any) => (
          <Card key={r.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-warning" />
                </div>
                <span className="font-medium text-foreground">{r.name}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(r.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
