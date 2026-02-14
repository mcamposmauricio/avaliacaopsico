import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, ClipboardList, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { tenantId } = useTenant();

  const { data: activeCampaigns = 0, isLoading: loadingCamp } = useQuery({
    queryKey: ["dashboard_active_campaigns", tenantId],
    queryFn: async () => {
      const { count } = await supabase
        .from("survey_campaigns")
        .select("id", { count: "exact", head: true })
        .eq("status", "active" as any);
      return count || 0;
    },
    enabled: !!tenantId,
  });

  const { data: employeeCount = 0, isLoading: loadingEmp } = useQuery({
    queryKey: ["dashboard_employees", tenantId],
    queryFn: async () => {
      const { count } = await supabase
        .from("employees")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);
      return count || 0;
    },
    enabled: !!tenantId,
  });

  // Active campaign progress
  const { data: activeCampaign } = useQuery({
    queryKey: ["dashboard_active_campaign_detail", tenantId],
    queryFn: async () => {
      const { data } = await supabase
        .from("survey_campaigns")
        .select("id, name, starts_at, ends_at")
        .eq("status", "active" as any)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!tenantId,
  });

  const { data: inviteStats } = useQuery({
    queryKey: ["dashboard_invite_stats", activeCampaign?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("survey_invitations")
        .select("is_used")
        .eq("campaign_id", activeCampaign!.id);
      const total = data?.length || 0;
      const used = data?.filter((i) => i.is_used).length || 0;
      return { total, used, rate: total > 0 ? Math.round((used / total) * 100) : 0 };
    },
    enabled: !!activeCampaign?.id,
  });

  // Last closed campaign scores
  const { data: lastClosedCampaign } = useQuery({
    queryKey: ["dashboard_last_closed", tenantId],
    queryFn: async () => {
      const { data } = await supabase
        .from("survey_campaigns")
        .select("id")
        .in("status", ["closed", "archived"] as any[])
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!tenantId,
  });

  const { data: dimensionScores = [] } = useQuery({
    queryKey: ["dashboard_dim_scores", lastClosedCampaign?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("campaign_scores")
        .select("avg_score, survey_dimensions(name, sort_order)")
        .eq("campaign_id", lastClosedCampaign!.id)
        .order("survey_dimensions(sort_order)");
      return data || [];
    },
    enabled: !!lastClosedCampaign?.id,
  });

  const igp = dimensionScores.length > 0
    ? Math.round((dimensionScores.reduce((s: number, d: any) => s + Number(d.avg_score), 0) / dimensionScores.length) * 10) / 10
    : null;

  const adhesionRate = inviteStats?.rate ?? 0;

  function getBarColor(score: number) {
    if (score >= 75) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  }

  const stats = [
    { title: "Campanhas Ativas", value: String(activeCampaigns), icon: ClipboardList, change: "", loading: loadingCamp },
    { title: "Taxa de Adesão", value: `${adhesionRate}%`, icon: TrendingUp, change: inviteStats ? `${inviteStats.used}/${inviteStats.total}` : "", loading: false },
    { title: "Colaboradores", value: String(employeeCount), icon: Users, change: "ativos", loading: loadingEmp },
    { title: "Índice Geral", value: igp != null ? String(igp) : "—", icon: BarChart3, change: igp != null ? (igp >= 75 ? "Bom" : igp >= 60 ? "Atenção" : "Crítico") : "Sem dados", loading: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral do sistema de avaliação psicossocial</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {stat.loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dimensões Psicossociais</CardTitle>
          </CardHeader>
          <CardContent>
            {dimensionScores.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Nenhuma campanha encerrada com scores calculados</p>
            ) : (
              <div className="space-y-3">
                {dimensionScores.map((dim: any) => {
                  const score = Number(dim.avg_score);
                  return (
                    <div key={dim.survey_dimensions?.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground">{dim.survey_dimensions?.name}</span>
                        <span className="font-medium text-foreground">{score.toFixed(1)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div className={`h-2 rounded-full ${getBarColor(score)}`} style={{ width: `${score}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Campanha Ativa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeCampaign ? (
              <>
                <div>
                  <h3 className="font-semibold text-foreground">{activeCampaign.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Período: {activeCampaign.starts_at ? new Date(activeCampaign.starts_at).toLocaleDateString("pt-BR") : "—"} - {activeCampaign.ends_at ? new Date(activeCampaign.ends_at).toLocaleDateString("pt-BR") : "—"}
                  </p>
                </div>
                {inviteStats && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium text-foreground">{inviteStats.used}/{inviteStats.total} respostas</span>
                      </div>
                      <div className="h-3 rounded-full bg-muted">
                        <div className="h-3 rounded-full bg-primary" style={{ width: `${inviteStats.rate}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">{inviteStats.total}</div>
                        <div className="text-xs text-muted-foreground">Convidados</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">{inviteStats.used}</div>
                        <div className="text-xs text-muted-foreground">Respondidos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">{inviteStats.total - inviteStats.used}</div>
                        <div className="text-xs text-muted-foreground">Pendentes</div>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">Nenhuma campanha ativa</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
