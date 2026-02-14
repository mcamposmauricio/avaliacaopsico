import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line,
} from "recharts";

function getScoreColor(score: number): string {
  if (score >= 75) return "bg-green-500/20 text-green-700";
  if (score >= 60) return "bg-yellow-500/20 text-yellow-700";
  return "bg-red-500/20 text-red-700";
}

export default function Analises() {
  const { tenantId } = useTenant();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");

  // Fetch closed/archived campaigns for selector
  const { data: campaigns = [] } = useQuery({
    queryKey: ["analises_campaigns", tenantId],
    queryFn: async () => {
      const { data } = await supabase
        .from("survey_campaigns")
        .select("id, name, status, updated_at")
        .in("status", ["closed", "archived"] as any[])
        .order("updated_at", { ascending: false });
      return data || [];
    },
    enabled: !!tenantId,
  });

  // Auto-select first campaign
  const campaignId = selectedCampaignId || campaigns[0]?.id || "";

  // Campaign scores (radar + evolution base)
  const { data: campaignScores = [] } = useQuery({
    queryKey: ["analises_scores", campaignId],
    queryFn: async () => {
      const { data } = await supabase
        .from("campaign_scores")
        .select("avg_score, min_score, max_score, std_dev, responses_count, dimension_id, survey_dimensions(name, sort_order)")
        .eq("campaign_id", campaignId)
        .order("survey_dimensions(sort_order)");
      return data || [];
    },
    enabled: !!campaignId,
  });

  // Group scores for heatmap (departments)
  const { data: groupScores = [] } = useQuery({
    queryKey: ["analises_group_scores", campaignId],
    queryFn: async () => {
      const { data } = await supabase
        .from("group_scores")
        .select("avg_score, group_type, group_id, dimension_id, is_suppressed, responses_count, survey_dimensions(name)")
        .eq("campaign_id", campaignId)
        .eq("group_type", "department")
        .eq("is_suppressed", false);
      return data || [];
    },
    enabled: !!campaignId,
  });

  // Fetch department names
  const deptIds = [...new Set(groupScores.map((g: any) => g.group_id))];
  const { data: departments = [] } = useQuery({
    queryKey: ["analises_depts", deptIds],
    queryFn: async () => {
      const { data } = await supabase.from("departments").select("id, name").in("id", deptIds);
      return data || [];
    },
    enabled: deptIds.length > 0,
  });
  const deptNameMap = new Map(departments.map((d: any) => [d.id, d.name]));

  // Evolution data: scores from all closed campaigns
  const { data: evolutionData = [] } = useQuery({
    queryKey: ["analises_evolution", tenantId],
    queryFn: async () => {
      const { data: allCamps } = await supabase
        .from("survey_campaigns")
        .select("id, name")
        .in("status", ["closed", "archived"] as any[])
        .order("updated_at");
      if (!allCamps?.length) return [];

      const results: any[] = [];
      for (const camp of allCamps) {
        const { data: scores } = await supabase
          .from("campaign_scores")
          .select("avg_score, survey_dimensions(name)")
          .eq("campaign_id", camp.id);
        if (!scores?.length) continue;
        const entry: any = { periodo: camp.name };
        let total = 0;
        for (const s of scores) {
          const name = (s as any).survey_dimensions?.name || "?";
          const short = name.split(" ")[0];
          entry[short] = Number((s as any).avg_score).toFixed(1);
          total += Number((s as any).avg_score);
        }
        entry.indice = (total / scores.length).toFixed(1);
        results.push(entry);
      }
      return results;
    },
    enabled: !!tenantId,
  });

  // Radar data
  const radarData = campaignScores.map((s: any) => ({
    dimension: (s.survey_dimensions?.name || "").split(" ")[0],
    fullName: s.survey_dimensions?.name || "",
    score: Number(s.avg_score),
  }));

  // Heatmap data
  const heatmapByDept = new Map<string, Record<string, number>>();
  for (const gs of groupScores as any[]) {
    const deptName = deptNameMap.get(gs.group_id) || gs.group_id.substring(0, 8);
    if (!heatmapByDept.has(deptName)) heatmapByDept.set(deptName, {});
    const dimName = gs.survey_dimensions?.name?.split(" ")[0]?.toLowerCase() || "?";
    heatmapByDept.get(deptName)![dimName] = Number(gs.avg_score);
  }
  const heatmapData = Array.from(heatmapByDept.entries()).map(([area, dims]) => ({ area, ...dims }));
  const dimKeys = [...new Set((groupScores as any[]).map((g: any) => g.survey_dimensions?.name?.split(" ")[0]?.toLowerCase() || "?"))];

  // Bar chart data (same as heatmap)
  const barColors = ["hsl(199, 89%, 48%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(213, 56%, 24%)", "hsl(350, 89%, 60%)", "hsl(270, 50%, 50%)"];

  // Evolution line keys
  const evoKeys = evolutionData.length > 0 ? Object.keys(evolutionData[0]).filter((k) => k !== "periodo") : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Análises e Dashboards</h1>
        {campaigns.length > 0 && (
          <Select value={campaignId} onValueChange={setSelectedCampaignId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Selecione a campanha" />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma campanha encerrada com dados de scoring. Encerre uma campanha para visualizar as análises.
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="radar">
          <TabsList>
            <TabsTrigger value="radar">Dimensões</TabsTrigger>
            <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
            <TabsTrigger value="comparison">Comparativo</TabsTrigger>
            <TabsTrigger value="evolution">Evolução</TabsTrigger>
          </TabsList>

          <TabsContent value="radar" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Radar — Dimensões Psicossociais</CardTitle></CardHeader>
              <CardContent>
                {radarData.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Sem dados</p>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="dimension" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name="Score" dataKey="score" stroke="hsl(199, 89%, 48%)" fill="hsl(199, 89%, 48%)" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="heatmap" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Heatmap por Departamento</CardTitle></CardHeader>
              <CardContent>
                {heatmapData.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Sem dados de grupo (N insuficiente ou sem departamentos)</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="text-left p-2 font-medium text-muted-foreground">Departamento</th>
                          {dimKeys.map((k) => (
                            <th key={k} className="p-2 font-medium text-muted-foreground capitalize">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {heatmapData.map((row: any) => (
                          <tr key={row.area}>
                            <td className="p-2 font-medium text-foreground">{row.area}</td>
                            {dimKeys.map((key) => {
                              const val = row[key] as number | undefined;
                              return (
                                <td key={key} className="p-1">
                                  {val != null ? (
                                    <div className={`rounded-md p-2 text-center font-semibold ${getScoreColor(val)}`}>
                                      {val.toFixed(1)}
                                    </div>
                                  ) : (
                                    <div className="rounded-md p-2 text-center text-muted-foreground">—</div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Comparativo entre Departamentos</CardTitle></CardHeader>
              <CardContent>
                {heatmapData.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Sem dados</p>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={heatmapData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="area" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      {dimKeys.map((key, i) => (
                        <Bar key={key} dataKey={key} name={key} fill={barColors[i % barColors.length]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evolution" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Evolução Temporal</CardTitle></CardHeader>
              <CardContent>
                {evolutionData.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Necessário ao menos 1 campanha encerrada</p>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={evolutionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="periodo" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      {evoKeys.map((key, i) => (
                        <Line key={key} type="monotone" dataKey={key} name={key === "indice" ? "Índice Geral" : key} stroke={barColors[i % barColors.length]} strokeWidth={key === "indice" ? 3 : 1} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
