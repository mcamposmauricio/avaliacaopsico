import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle } from "lucide-react";

type SurveyItem = {
  id: string;
  text: string;
  is_inverted: boolean;
  sort_order: number;
  dimension_id: string;
  dimension_name: string;
};

export default function SurveyRuntime() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [step, setStep] = useState<"consent" | "survey" | "done" | "error" | "loading">("loading");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [items, setItems] = useState<SurveyItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [currentDimension, setCurrentDimension] = useState(0);

  useEffect(() => {
    if (!token) { setStep("error"); return; }
    loadSurvey();
  }, [token]);

  async function loadSurvey() {
    try {
      // Load invitation
      const { data: inv, error: invErr } = await supabase
        .from("survey_invitations")
        .select("*, survey_campaigns(*, survey_templates(*))")
        .eq("token", token!)
        .single();

      if (invErr || !inv) { setStep("error"); return; }
      if (inv.is_used) { setStep("done"); return; }

      setInvitation(inv);
      setCampaign(inv.survey_campaigns);

      // Load dimensions and items
      const { data: dims } = await supabase
        .from("survey_dimensions")
        .select("id, name, sort_order")
        .eq("template_id", inv.survey_campaigns.template_id)
        .order("sort_order");

      if (!dims?.length) { setStep("error"); return; }

      const { data: surveyItems } = await supabase
        .from("survey_items")
        .select("*")
        .in("dimension_id", dims.map((d) => d.id))
        .order("sort_order");

      const enriched = (surveyItems || []).map((item) => ({
        ...item,
        dimension_name: dims.find((d) => d.id === item.dimension_id)?.name || "",
      }));

      setItems(enriched);
      setStep("consent");
    } catch {
      setStep("error");
    }
  }

  const dimensions = [...new Map(items.map((i) => [i.dimension_id, { id: i.dimension_id, name: i.dimension_name }])).values()];
  const currentDimItems = items.filter((i) => i.dimension_id === dimensions[currentDimension]?.id);
  const answeredCount = Object.keys(answers).length;
  const totalItems = items.length;
  const progressPct = totalItems > 0 ? (answeredCount / totalItems) * 100 : 0;
  const completionPct = totalItems > 0 ? answeredCount / totalItems : 0;

  async function handleSubmit() {
    if (completionPct < 0.9) {
      toast.error("Responda pelo menos 90% das perguntas");
      return;
    }

    setSubmitting(true);
    try {
      // Create response
      const { data: response, error: respErr } = await supabase
        .from("survey_responses")
        .insert({
          campaign_id: campaign.id,
        })
        .select()
        .single();

      if (respErr) throw respErr;

      // Insert answers
      const answerRows = Object.entries(answers).map(([item_id, value]) => ({
        response_id: response.id,
        item_id,
        value,
      }));

      const { error: ansErr } = await supabase.from("survey_answers").insert(answerRows);
      if (ansErr) throw ansErr;

      // Mark invitation as used
      await supabase.from("survey_invitations").update({ is_used: true, used_at: new Date().toISOString() }).eq("id", invitation.id);

      // Record consent
      await supabase.from("consent_records").insert({
        campaign_id: campaign.id,
        consent_text: "Aceito participar desta avaliação de forma anônima conforme a LGPD.",
        consent_version: 1,
      });

      setStep("done");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Carregando avaliação...</p>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Link inválido</h2>
            <p className="text-muted-foreground">Este link de avaliação é inválido ou já foi utilizado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Obrigado!</h2>
            <p className="text-muted-foreground">Sua avaliação foi registrada de forma anônima. Suas respostas contribuirão para a melhoria do ambiente de trabalho.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "consent") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle>Avaliação Psicossocial</CardTitle>
            <CardDescription>{campaign?.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm text-muted-foreground">
              <h3 className="text-foreground text-base font-semibold">Termo de Consentimento (LGPD)</h3>
              <p>
                Esta avaliação é totalmente anônima. Suas respostas não serão vinculadas à sua identidade.
                Os dados serão utilizados exclusivamente para fins de análise organizacional agregada.
              </p>
              <p>
                De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem o direito de:
              </p>
              <ul>
                <li>Saber como seus dados serão utilizados</li>
                <li>Garantia de anonimato total</li>
                <li>Resultados apresentados apenas de forma agregada</li>
              </ul>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="consent" checked={consentAccepted} onCheckedChange={(c) => setConsentAccepted(c === true)} />
              <Label htmlFor="consent" className="text-sm">
                Li e aceito os termos acima, concordando em participar desta avaliação de forma anônima.
              </Label>
            </div>
            <Button className="w-full" disabled={!consentAccepted} onClick={() => setStep("survey")}>
              Iniciar Avaliação
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Survey step
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progresso: {answeredCount}/{totalItems} perguntas</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <Progress value={progressPct} />
        </div>

        <div className="flex gap-2 flex-wrap">
          {dimensions.map((dim, idx) => (
            <Button
              key={dim.id}
              size="sm"
              variant={idx === currentDimension ? "default" : "outline"}
              onClick={() => setCurrentDimension(idx)}
            >
              {dim.name}
            </Button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{dimensions[currentDimension]?.name}</CardTitle>
            <CardDescription>
              Avalie cada item de 1 (Discordo totalmente) a 5 (Concordo totalmente)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentDimItems.map((item, idx) => (
              <div key={item.id} className="space-y-3 pb-4 border-b last:border-0">
                <p className="text-sm font-medium text-foreground">
                  {idx + 1}. {item.text}
                </p>
                <RadioGroup
                  value={answers[item.id]?.toString()}
                  onValueChange={(v) => setAnswers({ ...answers, [item.id]: parseInt(v) })}
                  className="flex gap-4"
                >
                  {[1, 2, 3, 4, 5].map((val) => (
                    <div key={val} className="flex flex-col items-center gap-1">
                      <RadioGroupItem value={val.toString()} id={`${item.id}-${val}`} />
                      <Label htmlFor={`${item.id}-${val}`} className="text-xs text-muted-foreground">
                        {val}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            disabled={currentDimension === 0}
            onClick={() => setCurrentDimension((p) => p - 1)}
          >
            Anterior
          </Button>
          {currentDimension < dimensions.length - 1 ? (
            <Button onClick={() => setCurrentDimension((p) => p + 1)}>
              Próxima
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting || completionPct < 0.9}>
              {submitting ? "Enviando..." : "Enviar Avaliação"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
