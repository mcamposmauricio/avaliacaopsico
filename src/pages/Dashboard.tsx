import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, ClipboardList, TrendingUp, Activity, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { tenantId, profile } = useTenant();

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
    if (score >= 75) return "bg-success";
    if (score >= 60) return "bg-warning";
    return "bg-destructive";
  }

  function getScoreBadge(score: number) {
    if (score >= 75) return { label: "Bom", className: "bg-success/10 text-success border-success/20" };
    if (score >= 60) return { label: "Atenção", className: "bg-warning/10 text-warning border-warning/20" };
    return { label: "Crítico", className: "bg-destructive/10 text-destructive border-destructive/20" };
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  const stats = [
    { title: "Campanhas Ativas", value: String(activeCampaigns), icon: ClipboardList, sub: "", loading: loadingCamp, color: "bg-primary/10 text-primary" },
    { title: "Taxa de Adesão", value: `${adhesionRate}%`, icon: TrendingUp, sub: inviteStats ? `${inviteStats.used}/${inviteStats.total}` : "", loading: false, color: "bg-accent/10 text-accent" },
    { title: "Colaboradores", value: String(employeeCount), icon: Users, sub: "ativos", loading: loadingEmp, color: "bg-success/10 text-success" },
    { title: "Índice Geral", value: igp != null ? String(igp) : "—", icon: BarChart3, sub: igp != null ? (igp >= 75 ? "Bom" : igp >= 60 ? "Atenção" : "Crítico") : "Sem dados", loading: false, color: "bg-warning/10 text-warning" },
  ];

  return (
    <div className="space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          {greeting()}, {profile?.full_name?.split(" ")[0] || "Usuário"}
        </h1>
        <p className="text-muted-foreground mt-1">Visão geral do sistema de avaliação psicossocial</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow duration-200 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</CardTitle>
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {stat.loading ? (
                <Skeleton className="h-9 w-20" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-fade-in" style={{ animationDelay: "320ms" }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              Dimensões Psicossociais
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dimensionScores.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Nenhuma campanha encerrada com scores calculados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dimensionScores.map((dim: any) => {
                  const score = Number(dim.avg_score);
                  const badge = getScoreBadge(score);
                  return (
                    <div key={dim.survey_dimensions?.name} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-foreground font-medium">{dim.survey_dimensions?.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{score.toFixed(1)}</span>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${badge.className}`}>
                            {badge.label}
                          </Badge>
                        </div>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getBarColor(score)} transition-all duration-500`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: "400ms" }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              Campanha Ativa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeCampaign ? (
              <>
                <div>
                  <h3 className="font-semibold text-foreground text-base">{activeCampaign.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activeCampaign.starts_at ? new Date(activeCampaign.starts_at).toLocaleDateString("pt-BR") : "—"} — {activeCampaign.ends_at ? new Date(activeCampaign.ends_at).toLocaleDateString("pt-BR") : "—"}
                  </p>
                </div>
                {inviteStats && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-semibold text-foreground">{inviteStats.rate}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${inviteStats.rate}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-2">
                      {[
                        { label: "Convidados", value: inviteStats.total },
                        { label: "Respondidos", value: inviteStats.used },
                        { label: "Pendentes", value: inviteStats.total - inviteStats.used },
                      ].map((item) => (
                        <div key={item.label} className="text-center p-3 rounded-xl bg-muted/50">
                          <div className="text-xl font-bold text-foreground">{item.value}</div>
                          <div className="text-[11px] text-muted-foreground font-medium">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Nenhuma campanha ativa</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
