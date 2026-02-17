import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, FilePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { TestModeButton } from "@/components/TestModeButton";

export default function Relatorios() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const { data: reports = [] } = useQuery({
    queryKey: ["reports", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*, survey_campaigns(name)")
        .order("generated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["closed_campaigns", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("survey_campaigns")
        .select("id, name, status")
        .in("status", ["closed", "archived"] as any[]);
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const generateReport = useMutation({
    mutationFn: async ({ campaignId, type }: { campaignId: string; type: string }) => {
      setGeneratingId(`${campaignId}-${type}`);
      const { data: reportData, error: insertErr } = await supabase.from("reports").insert({
        campaign_id: campaignId,
        report_type: type,
        tenant_id: tenantId,
        file_url: null,
      }).select("id").single();
      if (insertErr) throw insertErr;
      if (!reportData?.id) throw new Error("Falha ao criar registro do relatório. Tente novamente.");
      const res = await supabase.functions.invoke("generate-report", {
        body: {
          campaign_id: campaignId,
          report_type: type,
          tenant_id: tenantId,
          report_id: reportData.id,
        },
      });
      if (res.error) throw new Error(res.error.message || "Erro na geração");
      return res.data;
    },
    onSuccess: () => {
      setGeneratingId(null);
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Relatório gerado com sucesso");
    },
    onError: (e: any) => {
      setGeneratingId(null);
      toast.error(e.message);
    },
  });

  const reportTypeLabels: Record<string, string> = {
    technical: "Laudo Técnico",
    executive: "Relatório Executivo",
  };

  return (
    <div className="space-y-8">
      <TestModeButton
        label="Gerar Relatório de Teste"
        onExecute={async () => {
          const { data: closedCampaigns } = await supabase
            .from("survey_campaigns")
            .select("id, name")
            .eq("status", "closed" as any)
            .order("created_at", { ascending: false })
            .limit(1);
          if (!closedCampaigns?.length) throw new Error("Nenhuma campanha encerrada encontrada. Gere uma campanha de teste primeiro.");
          const c = closedCampaigns[0];
          const { data: reportData, error: insertErr } = await supabase.from("reports").insert({
            campaign_id: c.id,
            report_type: "technical",
            tenant_id: tenantId,
            file_url: null,
          }).select("id").single();
          if (insertErr) throw insertErr;
          const res = await supabase.functions.invoke("generate-report", {
            body: { campaign_id: c.id, report_type: "technical", tenant_id: tenantId, report_id: reportData!.id },
          });
          if (res.error) throw new Error(res.error.message);
          queryClient.invalidateQueries({ queryKey: ["reports"] });
          toast.success(`Laudo técnico gerado para "${c.name}"`);
        }}
      />
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Relatórios e Laudos</h1>
        <p className="text-muted-foreground mt-1">Geração e download de relatórios formais</p>
      </div>

      {campaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gerar Novo Relatório</CardTitle>
            <CardDescription>Selecione uma campanha encerrada para gerar relatórios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {campaigns.map((c: any) => {
                const isTechGen = generatingId === `${c.id}-technical`;
                const isExecGen = generatingId === `${c.id}-executive`;
                return (
                  <div key={c.id} className="flex items-center justify-between p-4 border border-border/60 rounded-xl hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <span className="font-medium text-foreground">{c.name}</span>
                        <Badge variant="outline" className="ml-2 text-[10px]">{c.status === "closed" ? "Encerrada" : "Arquivada"}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => generateReport.mutate({ campaignId: c.id, type: "technical" })} disabled={!!generatingId} className="gap-1.5">
                        {isTechGen ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FilePlus className="h-3.5 w-3.5" />}
                        Laudo Técnico
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => generateReport.mutate({ campaignId: c.id, type: "executive" })} disabled={!!generatingId} className="gap-1.5">
                        {isExecGen ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FilePlus className="h-3.5 w-3.5" />}
                        Rel. Executivo
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Relatórios Gerados</h2>
        {reports.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum relatório gerado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((r: any) => (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-destructive" />
                    </div>
                    <Badge variant="outline" className="text-[10px]">v{r.version}</Badge>
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{r.survey_campaigns?.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {reportTypeLabels[r.report_type] || r.report_type}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground">{new Date(r.generated_at).toLocaleDateString("pt-BR")}</span>
                    {r.file_url ? (
                      <a href={r.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <Download className="h-3.5 w-3.5" />Download
                        </Button>
                      </a>
                    ) : (
                      <Button variant="outline" size="sm" disabled className="gap-1.5">
                        <Download className="h-3.5 w-3.5" />Indisponível
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
