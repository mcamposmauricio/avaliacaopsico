import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, ClipboardList, TrendingUp } from "lucide-react";

const stats = [
  { title: "Campanhas Ativas", value: "1", icon: ClipboardList, change: "+1 este mês" },
  { title: "Taxa de Adesão", value: "78%", icon: TrendingUp, change: "+5% vs anterior" },
  { title: "Colaboradores", value: "245", icon: Users, change: "12 novos" },
  { title: "Índice Geral", value: "72.4", icon: BarChart3, change: "Bom" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Visão geral do sistema de avaliação psicossocial
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
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
            <div className="space-y-3">
              {[
                { name: "Demanda de Trabalho", score: 68, color: "bg-warning" },
                { name: "Controle sobre o Trabalho", score: 75, color: "bg-success" },
                { name: "Suporte Social", score: 82, color: "bg-success" },
                { name: "Reconhecimento", score: 61, color: "bg-warning" },
                { name: "Equilíbrio Vida-Trabalho", score: 55, color: "bg-destructive" },
                { name: "Segurança Psicológica", score: 71, color: "bg-success" },
              ].map((dim) => (
                <div key={dim.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{dim.name}</span>
                    <span className="font-medium text-foreground">{dim.score}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className={`h-2 rounded-full ${dim.color}`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Campanha Ativa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground">Avaliação Q1 2026</h3>
              <p className="text-sm text-muted-foreground">
                Período: 01/01/2026 - 31/03/2026
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium text-foreground">191/245 respostas</span>
              </div>
              <div className="h-3 rounded-full bg-muted">
                <div className="h-3 rounded-full bg-primary" style={{ width: "78%" }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">245</div>
                <div className="text-xs text-muted-foreground">Convidados</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">191</div>
                <div className="text-xs text-muted-foreground">Respondidos</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">54</div>
                <div className="text-xs text-muted-foreground">Pendentes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
