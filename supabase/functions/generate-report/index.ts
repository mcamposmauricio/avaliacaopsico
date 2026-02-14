import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { campaign_id, report_type, tenant_id, report_id } = await req.json();
    if (!campaign_id || !report_type || !tenant_id || !report_id)
      throw new Error("campaign_id, report_type, tenant_id, report_id are required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch data
    const [tenantRes, campaignRes, scoresRes, groupRes] = await Promise.all([
      supabase.from("tenants").select("*").eq("id", tenant_id).single(),
      supabase.from("survey_campaigns").select("*, survey_templates(name)").eq("id", campaign_id).single(),
      supabase.from("campaign_scores").select("*, survey_dimensions(name, sort_order)").eq("campaign_id", campaign_id).order("survey_dimensions(sort_order)"),
      supabase.from("group_scores").select("*, survey_dimensions(name)").eq("campaign_id", campaign_id).eq("is_suppressed", false),
    ]);

    const tenant = tenantRes.data;
    const campaign = campaignRes.data;
    const scores = scoresRes.data || [];
    const groupScores = groupRes.data || [];

    const primaryColor = tenant?.primary_color || "#1e3a5f";

    // Calculate IGP (general index)
    const igp = scores.length > 0
      ? Math.round((scores.reduce((s: number, sc: any) => s + Number(sc.avg_score), 0) / scores.length) * 100) / 100
      : 0;

    // Get AI summary
    let aiSummary = "";
    try {
      const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
      if (lovableApiKey) {
        const scoresText = scores.map((s: any) => `${s.survey_dimensions?.name}: ${s.avg_score}`).join(", ");
        const prompt = report_type === "technical"
          ? `Gere um resumo técnico de um relatório de avaliação psicossocial organizacional. IGP: ${igp}/100. Dimensões: ${scoresText}. Mencione os pontos fortes e áreas de atenção. Máximo 200 palavras. Em português.`
          : `Gere um sumário executivo de um relatório de avaliação psicossocial organizacional para diretoria. IGP: ${igp}/100. Dimensões: ${scoresText}. Destaque top 3 riscos e recomendações estratégicas. Máximo 150 palavras. Em português.`;

        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 500,
          }),
        });
        const aiData = await aiRes.json();
        aiSummary = aiData.choices?.[0]?.message?.content || "";
      }
    } catch { /* AI summary is optional */ }

    // Build HTML report
    const dimensionRows = scores.map((s: any) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;">${s.survey_dimensions?.name || "—"}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;">${Number(s.avg_score).toFixed(1)}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;">${s.min_score != null ? Number(s.min_score).toFixed(1) : "—"}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;">${s.max_score != null ? Number(s.max_score).toFixed(1) : "—"}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;">${s.std_dev != null ? Number(s.std_dev).toFixed(2) : "—"}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;">${s.responses_count}</td>
      </tr>
    `).join("");

    // Group scores by department
    const deptGroups: Record<string, any[]> = {};
    for (const gs of groupScores) {
      if (gs.group_type === "department") {
        if (!deptGroups[gs.group_id]) deptGroups[gs.group_id] = [];
        deptGroups[gs.group_id].push(gs);
      }
    }

    let groupSection = "";
    if (report_type === "technical" && Object.keys(deptGroups).length > 0) {
      const groupRows = Object.entries(deptGroups).map(([, scores]) =>
        scores.map((gs: any) => `
          <tr>
            <td style="padding:6px;border:1px solid #ddd;">${gs.group_id.substring(0, 8)}...</td>
            <td style="padding:6px;border:1px solid #ddd;">${gs.survey_dimensions?.name || "—"}</td>
            <td style="padding:6px;border:1px solid #ddd;text-align:center;">${Number(gs.avg_score).toFixed(1)}</td>
            <td style="padding:6px;border:1px solid #ddd;text-align:center;">${gs.responses_count}</td>
          </tr>
        `).join("")
      ).join("");

      groupSection = `
        <h2 style="color:${primaryColor};margin-top:30px;">Scores por Departamento</h2>
        <table style="width:100%;border-collapse:collapse;margin:10px 0;">
          <thead>
            <tr style="background:${primaryColor};color:white;">
              <th style="padding:8px;">Grupo</th>
              <th style="padding:8px;">Dimensão</th>
              <th style="padding:8px;">Score</th>
              <th style="padding:8px;">N</th>
            </tr>
          </thead>
          <tbody>${groupRows}</tbody>
        </table>
      `;
    }

    const title = report_type === "technical" ? "Laudo Técnico de Avaliação Psicossocial" : "Relatório Executivo";
    const date = new Date().toLocaleDateString("pt-BR");

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
  h1 { color: ${primaryColor}; border-bottom: 3px solid ${primaryColor}; padding-bottom: 10px; }
  h2 { color: ${primaryColor}; }
  .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
  .igp-box { background: ${primaryColor}; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
  .igp-value { font-size: 48px; font-weight: bold; }
  .igp-label { font-size: 14px; opacity: 0.8; }
  .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  th { background: ${primaryColor}; color: white; padding: 8px; }
  .methodology { background: #fafafa; padding: 15px; border-left: 4px solid ${primaryColor}; margin: 20px 0; font-size: 13px; }
</style></head>
<body>
  <div class="header">
    <div>
      <h1>${title}</h1>
      <p><strong>Empresa:</strong> ${tenant?.name || "—"}</p>
      <p><strong>Campanha:</strong> ${campaign?.name || "—"}</p>
      <p><strong>Período:</strong> ${campaign?.starts_at ? new Date(campaign.starts_at).toLocaleDateString("pt-BR") : "—"} a ${campaign?.ends_at ? new Date(campaign.ends_at).toLocaleDateString("pt-BR") : "—"}</p>
      <p><strong>Data:</strong> ${date}</p>
    </div>
  </div>

  <div class="igp-box">
    <div class="igp-label">ÍNDICE GERAL PSICOSSOCIAL (IGP)</div>
    <div class="igp-value">${igp.toFixed(1)}</div>
    <div class="igp-label">de 100 pontos</div>
  </div>

  ${aiSummary ? `<div class="summary"><h3>Sumário</h3><p>${aiSummary}</p></div>` : ""}

  <h2>Resultados por Dimensão</h2>
  <table>
    <thead>
      <tr>
        <th style="padding:8px;">Dimensão</th>
        <th style="padding:8px;">Média</th>
        <th style="padding:8px;">Mín</th>
        <th style="padding:8px;">Máx</th>
        <th style="padding:8px;">Desvio</th>
        <th style="padding:8px;">N</th>
      </tr>
    </thead>
    <tbody>${dimensionRows}</tbody>
  </table>

  ${groupSection}

  ${report_type === "technical" ? `
  <div class="methodology">
    <h3>Metodologia</h3>
    <p>Avaliação realizada com questionário validado baseado no modelo Demanda-Controle-Suporte, complementado com dimensões de Reconhecimento, Equilíbrio Vida-Trabalho e Segurança Psicológica.</p>
    <p>Escala Likert de 5 pontos normalizada para 0-100. Itens invertidos tratados com fórmula (6 - resposta). Grupos com N &lt; ${tenant?.min_group_size || 7} suprimidos para garantir anonimato.</p>
  </div>` : ""}

  <div style="margin-top:40px;text-align:center;color:#999;font-size:12px;">
    Documento gerado automaticamente em ${date} — ${tenant?.name || ""}
  </div>
</body>
</html>`;

    // Store HTML as file in reports bucket
    const fileName = `${campaign_id}/${report_type}_v${Date.now()}.html`;
    const { error: uploadErr } = await supabase.storage
      .from("reports")
      .upload(fileName, new Blob([html], { type: "text/html" }), { contentType: "text/html", upsert: true });

    if (uploadErr) throw uploadErr;

    // Get signed URL (valid for 7 days)
    const { data: urlData } = await supabase.storage
      .from("reports")
      .createSignedUrl(fileName, 60 * 60 * 24 * 7);

    const fileUrl = urlData?.signedUrl || null;

    // Update report record
    await supabase
      .from("reports")
      .update({ file_url: fileUrl })
      .eq("id", report_id);

    return new Response(JSON.stringify({ message: "Report generated", file_url: fileUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
