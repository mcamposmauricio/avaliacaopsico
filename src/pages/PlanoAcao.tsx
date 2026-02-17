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
import { Plus, CheckCircle2, Clock, Loader2, Target, AlertCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { FLEW_DIMENSIONS, classifyRisk, getRiskBadgeClass } from "@/lib/flew";
import { TestModeButton } from "@/components/TestModeButton";

const statusConfig: Record<string, { label: string; icon: any; variant: "default" | "secondary" | "outline"; border: string; color: string }> = {
  pending: { label: "Pendente", icon: Clock, variant: "secondary", border: "border-l-muted-foreground", color: "bg-muted-foreground" },
  in_progress: { label: "Em Andamento", icon: Loader2, variant: "default", border: "border-l-accent", color: "bg-accent" },
  completed: { label: "Concluído", icon: CheckCircle2, variant: "outline", border: "border-l-success", color: "bg-success" },
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

  // Fetch risk alerts for auto-suggestions
  const { data: riskAlerts = [] } = useQuery({
    queryKey: ["plano_risk_alerts", tenantId],
    queryFn: async () => {
      const { data } = await supabase
        .from("risk_alerts")
        .select("*")
        .is("resolved_at", null)
        .order("score", { ascending: false });
      return data || [];
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

  const summary = {
    total: plans.length,
    pending: plans.filter((p: any) => p.status === "pending").length,
    in_progress: plans.filter((p: any) => p.status === "in_progress").length,
    completed: plans.filter((p: any) => p.status === "completed").length,
  };

  const completionPct = summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;

  function getDueStatus(dueDate: string | null) {
    if (!dueDate) return null;
    const diff = new Date(dueDate).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: "Atrasado", className: "text-destructive" };
    if (days <= 7) return { label: `${days}d restantes`, className: "text-warning" };
    return { label: `${days}d restantes`, className: "text-success" };
  }

  return (
    <div className="space-y-8">
      <TestModeButton
        label="Gerar Planos de Teste"
        onExecute={async () => {
          const plans = FLEW_DIMENSIONS.slice(0, 5).map((dim, i) => ({
            title: `Ação corretiva — ${dim}`,
            description: `Plano de ação de teste para a dimensão ${dim}`,
            dimension_name: dim,
            responsible: ["Maria Silva", "João Santos", "Ana Costa", "Pedro Lima", "Carla Souza"][i],
            due_date: new Date(Date.now() + (i + 1) * 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            tenant_id: tenantId,
            created_by: user?.id,
            status: (["pending", "in_progress", "pending", "completed", "in_progress"][i]) as "pending" | "in_progress" | "completed",
          }));
          const { error } = await supabase.from("action_plans").insert(plans);
          if (error) throw error;
          queryClient.invalidateQueries({ queryKey: ["action_plans"] });
          toast.success("5 planos de ação de teste criados");
        }}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Planos de Ação</h1>
          <p className="text-muted-foreground mt-1">Ações corretivas e preventivas — Flew</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />Nova Ação</Button>
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
                    {FLEW_DIMENSIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
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

      {/* Risk alerts suggestions */}
      {riskAlerts.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              Sugestões automáticas — Dimensões com risco elevado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {riskAlerts.map((alert: any) => {
                const risk = classifyRisk(Number(alert.score));
                return (
                  <div key={alert.id} className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-warning/20">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${getRiskBadgeClass(risk.level)}`}>
                        {Number(alert.score).toFixed(1)}
                      </Badge>
                      <span className="text-sm font-medium">{alert.dimension_name}</span>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => {
                      setForm({ ...form, dimension_name: alert.dimension_name, title: `Ação para ${alert.dimension_name}` });
                      setOpen(true);
                    }}>
                      Criar Ação
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: summary.total, icon: Target, color: "bg-primary/10 text-primary" },
          { label: "Pendentes", value: summary.pending, icon: Clock, color: "bg-muted text-muted-foreground" },
          { label: "Em Andamento", value: summary.in_progress, icon: Loader2, color: "bg-accent/10 text-accent" },
          { label: "Concluídos", value: summary.completed, icon: CheckCircle2, color: "bg-success/10 text-success" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{item.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {summary.total > 0 && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-success transition-all" style={{ width: `${completionPct}%` }} />
          </div>
          <span className="font-medium">{completionPct}% concluído</span>
        </div>
      )}

      <div className="grid gap-4">
        {plans.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Target className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum plano de ação registrado</p>
            </CardContent>
          </Card>
        ) : plans.map((plan: any) => {
          const st = statusConfig[plan.status] || statusConfig.pending;
          const Icon = st.icon;
          const due = getDueStatus(plan.due_date);
          return (
            <Card key={plan.id} className={`border-l-4 ${st.border} hover:shadow-md transition-shadow`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{plan.title}</CardTitle>
                    {plan.dimension_name && <Badge variant="outline" className="mt-1.5">{plan.dimension_name}</Badge>}
                  </div>
                  <Badge variant={st.variant} className="gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${st.color}`} />
                    {st.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {plan.description && <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>}
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {plan.responsible && <span>Responsável: {plan.responsible}</span>}
                    {plan.due_date && (
                      <span className={`flex items-center gap-1 ${due?.className || ""}`}>
                        {due && due.label === "Atrasado" && <AlertCircle className="h-3 w-3" />}
                        Prazo: {new Date(plan.due_date).toLocaleDateString("pt-BR")}
                        {due && <span className="font-medium">({due.label})</span>}
                      </span>
                    )}
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
