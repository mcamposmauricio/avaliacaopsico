import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, FilePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

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
      
      // 1. Insert report record
      const { data: reportData, error: insertErr } = await supabase.from("reports").insert({
        campaign_id: campaignId,
        report_type: type,
        tenant_id: tenantId,
        file_url: null,
      }).select("id").single();
      if (insertErr) throw insertErr;
      if (!reportData?.id) throw new Error("Falha ao criar registro do relatório. Tente novamente.");

      // 2. Call edge function
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatórios e Laudos</h1>
        <p className="text-muted-foreground text-sm mt-1">Geração e download de relatórios formais</p>
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
                  <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium text-foreground">{c.name}</span>
                      <Badge variant="outline" className="ml-2">{c.status === "closed" ? "Encerrada" : "Arquivada"}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => generateReport.mutate({ campaignId: c.id, type: "technical" })} disabled={!!generatingId}>
                        {isTechGen ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FilePlus className="h-4 w-4 mr-1" />}
                        Laudo Técnico
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => generateReport.mutate({ campaignId: c.id, type: "executive" })} disabled={!!generatingId}>
                        {isExecGen ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FilePlus className="h-4 w-4 mr-1" />}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Relatórios Gerados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Versão</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum relatório gerado</TableCell></TableRow>
              ) : reports.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.survey_campaigns?.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      <FileText className="h-3 w-3 mr-1" />
                      {reportTypeLabels[r.report_type] || r.report_type}
                    </Badge>
                  </TableCell>
                  <TableCell>v{r.version}</TableCell>
                  <TableCell>{new Date(r.generated_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    {r.file_url ? (
                      <a href={r.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    ) : (
                      <Button variant="ghost" size="icon" disabled>
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
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
