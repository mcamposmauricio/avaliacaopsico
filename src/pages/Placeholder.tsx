import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/estrutura": "Estrutura Organizacional",
  "/colaboradores": "Colaboradores",
  "/campanhas": "Campanhas de Avaliação",
  "/analises": "Análises e Dashboards",
  "/relatorios": "Relatórios e Laudos",
  "/configuracoes": "Configurações",
  "/governanca": "Governança e Compliance",
};

export default function Placeholder() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "Página";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Construction className="h-5 w-5" />
            Em Construção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta funcionalidade será implementada nas próximas fases.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
