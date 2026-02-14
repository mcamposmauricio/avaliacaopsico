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

// Demo data for analytics
const dimensionData = [
  { dimension: "Demanda", score: 68, fullName: "Demanda de Trabalho" },
  { dimension: "Controle", score: 75, fullName: "Controle sobre o Trabalho" },
  { dimension: "Suporte", score: 82, fullName: "Suporte Social" },
  { dimension: "Reconhecimento", score: 61, fullName: "Reconhecimento" },
  { dimension: "Equilíbrio", score: 55, fullName: "Equilíbrio Vida-Trabalho" },
  { dimension: "Segurança", score: 71, fullName: "Segurança Psicológica" },
];

const heatmapData = [
  { area: "TI", demanda: 72, controle: 78, suporte: 85, reconhecimento: 65, equilibrio: 58, seguranca: 74 },
  { area: "RH", demanda: 65, controle: 80, suporte: 88, reconhecimento: 72, equilibrio: 68, seguranca: 79 },
  { area: "Financeiro", demanda: 70, controle: 68, suporte: 75, reconhecimento: 55, equilibrio: 50, seguranca: 65 },
  { area: "Comercial", demanda: 75, controle: 70, suporte: 78, reconhecimento: 60, equilibrio: 52, seguranca: 68 },
  { area: "Operações", demanda: 62, controle: 72, suporte: 80, reconhecimento: 58, equilibrio: 60, seguranca: 70 },
];

const evolutionData = [
  { periodo: "Q1 2025", indice: 65, demanda: 60, suporte: 75, equilibrio: 48 },
  { periodo: "Q2 2025", indice: 68, demanda: 63, suporte: 78, equilibrio: 50 },
  { periodo: "Q3 2025", indice: 70, demanda: 65, suporte: 80, equilibrio: 53 },
  { periodo: "Q4 2025", indice: 71, demanda: 67, suporte: 81, equilibrio: 54 },
  { periodo: "Q1 2026", indice: 72.4, demanda: 68, suporte: 82, equilibrio: 55 },
];

function getScoreColor(score: number): string {
  if (score >= 75) return "bg-success/20 text-success";
  if (score >= 60) return "bg-warning/20 text-warning";
  return "bg-destructive/20 text-destructive";
}

export default function Analises() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Análises e Dashboards</h1>
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
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={dimensionData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Score" dataKey="score" stroke="hsl(199, 89%, 48%)" fill="hsl(199, 89%, 48%)" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Heatmap por Área</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-2 font-medium text-muted-foreground">Área</th>
                      <th className="p-2 font-medium text-muted-foreground">Demanda</th>
                      <th className="p-2 font-medium text-muted-foreground">Controle</th>
                      <th className="p-2 font-medium text-muted-foreground">Suporte</th>
                      <th className="p-2 font-medium text-muted-foreground">Reconhecimento</th>
                      <th className="p-2 font-medium text-muted-foreground">Equilíbrio</th>
                      <th className="p-2 font-medium text-muted-foreground">Segurança</th>
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapData.map((row) => (
                      <tr key={row.area}>
                        <td className="p-2 font-medium text-foreground">{row.area}</td>
                        {["demanda", "controle", "suporte", "reconhecimento", "equilibrio", "seguranca"].map((key) => {
                          const val = row[key as keyof typeof row] as number;
                          return (
                            <td key={key} className="p-1">
                              <div className={`rounded-md p-2 text-center font-semibold ${getScoreColor(val)}`}>
                                {val}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Comparativo entre Áreas</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={heatmapData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="area" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="demanda" name="Demanda" fill="hsl(199, 89%, 48%)" />
                  <Bar dataKey="suporte" name="Suporte" fill="hsl(142, 71%, 45%)" />
                  <Bar dataKey="equilibrio" name="Equilíbrio" fill="hsl(38, 92%, 50%)" />
                  <Bar dataKey="reconhecimento" name="Reconhecimento" fill="hsl(213, 56%, 24%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evolution" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Evolução Temporal</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="indice" name="Índice Geral" stroke="hsl(213, 56%, 24%)" strokeWidth={3} />
                  <Line type="monotone" dataKey="demanda" name="Demanda" stroke="hsl(199, 89%, 48%)" />
                  <Line type="monotone" dataKey="suporte" name="Suporte" stroke="hsl(142, 71%, 45%)" />
                  <Line type="monotone" dataKey="equilibrio" name="Equilíbrio" stroke="hsl(38, 92%, 50%)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
