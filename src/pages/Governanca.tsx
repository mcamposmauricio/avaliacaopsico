import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, FileCheck, History } from "lucide-react";

export default function Governanca() {
  const { tenantId } = useTenant();

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
        <p className="text-muted-foreground mt-1">LGPD, auditoria e consentimento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "Política de Anonimato", value: "N ≥ 7", sub: "Tamanho mínimo de grupo", icon: Shield, color: "bg-primary/10 text-primary" },
          { title: "Consentimentos", value: String(consentRecords.length), sub: "Registros de consentimento", icon: FileCheck, color: "bg-success/10 text-success" },
          { title: "Audit Log", value: String(auditLogs.length), sub: "Registros de auditoria", icon: History, color: "bg-accent/10 text-accent" },
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

      <Tabs defaultValue="audit">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="audit" className="rounded-lg gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"><History className="h-4 w-4" />Log de Auditoria</TabsTrigger>
          <TabsTrigger value="consent" className="rounded-lg gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"><FileCheck className="h-4 w-4" />Consentimentos</TabsTrigger>
        </TabsList>

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
