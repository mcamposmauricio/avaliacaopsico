import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Estrutura from "./pages/Estrutura";
import Colaboradores from "./pages/Colaboradores";
import Campanhas from "./pages/Campanhas";
import Analises from "./pages/Analises";
import Relatorios from "./pages/Relatorios";
import PlanoAcao from "./pages/PlanoAcao";
import Configuracoes from "./pages/Configuracoes";
import Governanca from "./pages/Governanca";
import SurveyRuntime from "./pages/SurveyRuntime";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/survey" element={<SurveyRuntime />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/estrutura" element={<Estrutura />} />
            <Route path="/colaboradores" element={<Colaboradores />} />
            <Route path="/campanhas" element={<Campanhas />} />
            <Route path="/analises" element={<Analises />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/plano-acao" element={<PlanoAcao />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/governanca" element={<Governanca />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
