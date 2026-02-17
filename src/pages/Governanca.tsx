import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, FileCheck, History, BookOpen } from "lucide-react";
import { FLEW_DIMENSIONS, FLEW_DISCLAIMER } from "@/lib/flew";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function Governanca() {
  const { tenantId, tenant } = useTenant();
  const queryClient = useQueryClient();

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["audit_logs", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const { data: consentRecords = [] } = useQuery({
    queryKey: ["consent_records", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consent_records")
        .select("*, survey_campaigns(name)")
        .order("accepted_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Governança e Compliance</h1>
        <p className="text-muted-foreground mt-1">LGPD, auditoria, consentimento e metodologia</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "Política de Anonimato", value: `N ≥ ${tenant?.min_group_size || 7}`, sub: "Tamanho mínimo de grupo", icon: Shield, color: "bg-primary/10 text-primary" },
          { title: "Consentimentos", value: String(consentRecords.length), sub: "Registros de consentimento", icon: FileCheck, color: "bg-success/10 text-success" },
          { title: "Audit Log", value: String(auditLogs.length), sub: "Registros de auditoria", icon: History, color: "bg-accent/10 text-accent" },
          { title: "Instrumento", value: "FPI v1.0", sub: "Flew Psychosocial Index", icon: BookOpen, color: "bg-warning/10 text-warning" },
        ].map((item) => (
          <Card key={item.title}>
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{item.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                </div>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="methodology">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="methodology" className="rounded-lg gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"><BookOpen className="h-4 w-4" />Metodologia Flew</TabsTrigger>
          <TabsTrigger value="audit" className="rounded-lg gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"><History className="h-4 w-4" />Log de Auditoria</TabsTrigger>
          <TabsTrigger value="consent" className="rounded-lg gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"><FileCheck className="h-4 w-4" />Consentimentos</TabsTrigger>
        </TabsList>

        <TabsContent value="methodology" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Flew Psychosocial Index (FPI) v1.0</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total de Itens</p>
                  <p className="text-2xl font-bold text-foreground mt-1">30</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dimensões</p>
                  <p className="text-2xl font-bold text-foreground mt-1">8</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Escala</p>
                  <p className="text-2xl font-bold text-foreground mt-1">Likert 1-5</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-3">Dimensões Avaliadas</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FLEW_DIMENSIONS.map((dim, idx) => (
                    <div key={dim} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-foreground">{dim}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-3">Classificação de Risco</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                    <div className="h-3 w-3 rounded-full bg-success" />
                    <span className="text-sm font-medium text-foreground">0–33: Baixo risco</span>
                    <span className="text-xs text-muted-foreground ml-auto">Condições adequadas</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <div className="h-3 w-3 rounded-full bg-warning" />
                    <span className="text-sm font-medium text-foreground">34–66: Atenção</span>
                    <span className="text-xs text-muted-foreground ml-auto">Necessita monitoramento</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="h-3 w-3 rounded-full bg-destructive" />
                    <span className="text-sm font-medium text-foreground">67–100: Risco elevado</span>
                    <span className="text-xs text-muted-foreground ml-auto">Requer ação prioritária</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-3">Fórmula de Scoring</h4>
                <div className="p-4 rounded-xl bg-muted/50 font-mono text-sm space-y-1">
                  <p>Score_dimensão = Média × 20</p>
                  <p>Item_invertido = 6 − resposta_original</p>
                  <p>IGP = Média simples dos scores das 8 dimensões</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-3">Regras de Governança</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />Grupos com N &lt; {tenant?.min_group_size || 7} são suprimidos para garantir anonimato</li>
                  <li className="flex items-start gap-2"><Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />Respostas com &lt; 90% completude são descartadas</li>
                  <li className="flex items-start gap-2"><Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />Dados pessoais nunca são vinculados às respostas</li>
                  <li className="flex items-start gap-2"><Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />Consentimento LGPD registrado eletronicamente</li>
                  <li className="flex items-start gap-2"><Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />Retenção de dados conforme política da empresa ({tenant?.data_retention_days || 1825} dias)</li>
                </ul>
              </div>

              <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
                <p className="text-xs text-warning font-medium italic">{FLEW_DISCLAIMER}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Data</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-16">
                        <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">Nenhum registro de auditoria</p>
                      </TableCell>
                    </TableRow>
                  ) : auditLogs.map((log: any) => (
                    <TableRow key={log.id} className="hover:bg-muted/50">
                      <TableCell className="text-sm">{new Date(log.created_at).toLocaleString("pt-BR")}</TableCell>
                      <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                      <TableCell>{log.entity_type}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {log.details ? JSON.stringify(log.details) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consent" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Data</TableHead>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Versão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consentRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-16">
                        <FileCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">Nenhum registro de consentimento</p>
                      </TableCell>
                    </TableRow>
                  ) : consentRecords.map((c: any) => (
                    <TableRow key={c.id} className="hover:bg-muted/50">
                      <TableCell className="text-sm">{new Date(c.accepted_at).toLocaleString("pt-BR")}</TableCell>
                      <TableCell>{c.survey_campaigns?.name || "—"}</TableCell>
                      <TableCell>v{c.consent_version}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
