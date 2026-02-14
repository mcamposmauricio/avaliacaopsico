import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Square, Archive, Send, Loader2, ClipboardList } from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; border: string; dot: string }> = {
  draft: { label: "Rascunho", variant: "secondary", border: "border-l-muted-foreground", dot: "bg-muted-foreground" },
  active: { label: "Ativa", variant: "default", border: "border-l-success", dot: "bg-success animate-pulse" },
  closed: { label: "Encerrada", variant: "outline", border: "border-l-accent", dot: "bg-accent" },
  archived: { label: "Arquivada", variant: "destructive", border: "border-l-destructive", dot: "bg-destructive" },
};

export default function Campanhas() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", template_id: "", starts_at: "", ends_at: "", invite_message: "" });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("survey_campaigns")
        .select("*, survey_templates(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["survey_templates", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("survey_templates").select("id, name").eq("is_active", true);
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("survey_campaigns").insert({
        name: form.name,
        description: form.description || null,
        template_id: form.template_id,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        invite_message: form.invite_message || null,
        tenant_id: tenantId,
        status: "draft" as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setOpen(false);
      setForm({ name: "", description: "", template_id: "", starts_at: "", ends_at: "", invite_message: "" });
      toast.success("Campanha criada");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("survey_campaigns").update({ status: status as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["campaigns"] }); toast.success("Status atualizado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const closeCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      setClosingId(campaignId);
      const res = await supabase.functions.invoke("process-scoring", {
        body: { campaign_id: campaignId },
      });
      if (res.error) throw new Error(res.error.message || "Erro no scoring");
      const processed = res.data?.responses_processed ?? 0;
      if (processed === 0) {
        throw new Error("Nenhuma resposta completa encontrada. Não é possível encerrar a campanha sem respostas.");
      }
      const { error } = await supabase.from("survey_campaigns").update({ status: "closed" as any }).eq("id", campaignId);
      if (error) throw error;
    },
    onSuccess: () => {
      setClosingId(null);
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campanha encerrada e scores calculados");
    },
    onError: (e: any) => {
      setClosingId(null);
      toast.error(e.message);
    },
  });

  const generateInvites = useMutation({
    mutationFn: async (campaignId: string) => {
      const { data: employees, error: empErr } = await supabase
        .from("employees")
        .select("id")
        .eq("is_active", true);
      if (empErr) throw empErr;
      if (!employees?.length) throw new Error("Nenhum colaborador ativo encontrado");
      const invites = employees.map((emp) => ({
        campaign_id: campaignId,
        employee_id: emp.id,
      }));
      const { error } = await supabase.from("survey_invitations").insert(invites);
      if (error) throw error;
      return employees.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success(`${count} convites gerados`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Campanhas</h1>
          <p className="text-muted-foreground mt-1">Gerencie os ciclos de avaliação psicossocial</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />Nova Campanha</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nova Campanha</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Avaliação Q1 2026" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Questionário</Label>
                <Select value={form.template_id} onValueChange={(v) => setForm({ ...form, template_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o template" /></SelectTrigger>
                  <SelectContent>
                    {templates.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Input type="date" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Fim</Label>
                  <Input type="date" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mensagem de convite</Label>
                <Textarea value={form.invite_message} onChange={(e) => setForm({ ...form, invite_message: e.target.value })} placeholder="Mensagem opcional para o convite" />
              </div>
              <Button onClick={() => createMutation.mutate()} disabled={!form.name || !form.template_id || createMutation.isPending} className="w-full">
                Criar Campanha
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma campanha criada. Crie um template de questionário primeiro.</p>
            </CardContent>
          </Card>
        ) : campaigns.map((c: any) => {
          const st = statusConfig[c.status] || statusConfig.draft;
          const isClosing = closingId === c.id;
          return (
            <Card key={c.id} className={`border-l-4 ${st.border} hover:shadow-md transition-shadow duration-200`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{c.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {c.survey_templates?.name} • {c.starts_at ? new Date(c.starts_at).toLocaleDateString("pt-BR") : "—"} a {c.ends_at ? new Date(c.ends_at).toLocaleDateString("pt-BR") : "—"}
                    </CardDescription>
                  </div>
                  <Badge variant={st.variant} className="gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                    {st.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {c.status === "draft" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => generateInvites.mutate(c.id)} className="gap-1.5">
                        <Send className="h-3.5 w-3.5" />Gerar Convites
                      </Button>
                      <Button size="sm" onClick={() => updateStatus.mutate({ id: c.id, status: "active" })} className="gap-1.5">
                        <Play className="h-3.5 w-3.5" />Ativar
                      </Button>
                    </>
                  )}
                  {c.status === "active" && (
                    <Button size="sm" variant="outline" onClick={() => closeCampaign.mutate(c.id)} disabled={isClosing} className="gap-1.5">
                      {isClosing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3.5 w-3.5" />}
                      {isClosing ? "Processando..." : "Encerrar"}
                    </Button>
                  )}
                  {c.status === "closed" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: c.id, status: "archived" })} className="gap-1.5">
                      <Archive className="h-3.5 w-3.5" />Arquivar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
