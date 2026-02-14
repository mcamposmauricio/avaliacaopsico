import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Governança e Compliance</h1>
        <p className="text-muted-foreground text-sm mt-1">LGPD, auditoria e consentimento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />Política de Anonimato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">N ≥ 7</div>
            <p className="text-xs text-muted-foreground">Tamanho mínimo de grupo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileCheck className="h-4 w-4" />Consentimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{consentRecords.length}</div>
            <p className="text-xs text-muted-foreground">Registros de consentimento</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <History className="h-4 w-4" />Audit Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{auditLogs.length}</div>
            <p className="text-xs text-muted-foreground">Registros de auditoria</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="audit">
        <TabsList>
          <TabsTrigger value="audit">Log de Auditoria</TabsTrigger>
          <TabsTrigger value="consent">Consentimentos</TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum registro de auditoria</TableCell></TableRow>
                  ) : auditLogs.map((log: any) => (
                    <TableRow key={log.id}>
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

        <TabsContent value="consent">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Versão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consentRecords.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Nenhum registro de consentimento</TableCell></TableRow>
                  ) : consentRecords.map((c: any) => (
                    <TableRow key={c.id}>
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
