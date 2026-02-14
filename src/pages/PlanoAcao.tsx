import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; icon: any; variant: "default" | "secondary" | "outline" }> = {
  pending: { label: "Pendente", icon: Clock, variant: "secondary" },
  in_progress: { label: "Em Andamento", icon: Loader2, variant: "default" },
  completed: { label: "Concluído", icon: CheckCircle2, variant: "outline" },
};

export default function PlanoAcao() {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", dimension_name: "", responsible: "", due_date: "" });

  const { data: plans = [] } = useQuery({
    queryKey: ["action_plans", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("action_plans")
        .select("*, departments(name), survey_campaigns(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("action_plans").insert({
        title: form.title,
        description: form.description || null,
        dimension_name: form.dimension_name || null,
        responsible: form.responsible || null,
        due_date: form.due_date || null,
        tenant_id: tenantId,
        created_by: user?.id,
        status: "pending" as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action_plans"] });
      setOpen(false);
      setForm({ title: "", description: "", dimension_name: "", responsible: "", due_date: "" });
      toast.success("Plano de ação criado");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("action_plans").update({ status: status as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["action_plans"] }); toast.success("Status atualizado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const dimensions = [
    "Demanda de Trabalho", "Controle sobre o Trabalho", "Suporte Social",
    "Reconhecimento", "Equilíbrio Vida-Trabalho", "Segurança Psicológica"
  ];

  const summary = {
    total: plans.length,
    pending: plans.filter((p: any) => p.status === "pending").length,
    in_progress: plans.filter((p: any) => p.status === "in_progress").length,
    completed: plans.filter((p: any) => p.status === "completed").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Planos de Ação</h1>
          <p className="text-muted-foreground text-sm mt-1">Ações corretivas e preventivas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nova Ação</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Ação</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Dimensão relacionada</Label>
                <Select value={form.dimension_name} onValueChange={(v) => setForm({ ...form, dimension_name: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {dimensions.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Input value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Prazo</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <Button onClick={() => createMutation.mutate()} disabled={!form.title || createMutation.isPending} className="w-full">
                Criar Ação
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold text-foreground">{summary.total}</div><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold text-foreground">{summary.pending}</div><p className="text-xs text-muted-foreground">Pendentes</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold text-foreground">{summary.in_progress}</div><p className="text-xs text-muted-foreground">Em Andamento</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold text-foreground">{summary.completed}</div><p className="text-xs text-muted-foreground">Concluídos</p></CardContent></Card>
      </div>

      <div className="grid gap-4">
        {plans.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum plano de ação registrado</CardContent></Card>
        ) : plans.map((plan: any) => {
          const st = statusConfig[plan.status] || statusConfig.pending;
          const Icon = st.icon;
          return (
            <Card key={plan.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{plan.title}</CardTitle>
                    {plan.dimension_name && <Badge variant="outline" className="mt-1">{plan.dimension_name}</Badge>}
                  </div>
                  <Badge variant={st.variant} className="gap-1">
                    <Icon className="h-3 w-3" />{st.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {plan.description && <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>}
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {plan.responsible && <span>Responsável: {plan.responsible}</span>}
                    {plan.due_date && <span>Prazo: {new Date(plan.due_date).toLocaleDateString("pt-BR")}</span>}
                  </div>
                  <div className="flex gap-1">
                    {plan.status !== "in_progress" && plan.status !== "completed" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: plan.id, status: "in_progress" })}>Iniciar</Button>
                    )}
                    {plan.status !== "completed" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: plan.id, status: "completed" })}>Concluir</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
