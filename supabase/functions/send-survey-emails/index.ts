import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaign_id, base_url } = await req.json();
    if (!campaign_id) {
      return new Response(JSON.stringify({ error: "campaign_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch campaign + tenant data
    const { data: campaign, error: campErr } = await supabase
      .from("survey_campaigns")
      .select("*, survey_templates(name), tenants:tenant_id(name, logo_url, primary_color)")
      .eq("id", campaign_id)
      .single();

    if (campErr || !campaign) {
      return new Response(JSON.stringify({ error: "Campanha não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch pending invitations with employee data
    const { data: invitations, error: invErr } = await supabase
      .from("survey_invitations")
      .select("id, token, is_used, employees(full_name, email)")
      .eq("campaign_id", campaign_id)
      .eq("is_used", false);

    if (invErr) throw invErr;

    const withEmail = (invitations || []).filter(
      (inv: any) => inv.employees?.email
    );

    if (!withEmail.length) {
      return new Response(
        JSON.stringify({ error: "Nenhum convite pendente com email encontrado", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tenantName = (campaign as any).tenants?.name || "Avaliação Psicossocial";
    const tenantColor = (campaign as any).tenants?.primary_color || "#1e3a5f";
    const campaignName = campaign.name;
    const inviteMessage = campaign.invite_message || "Você foi convidado(a) a participar de uma avaliação psicossocial. Sua participação é fundamental e as respostas são anônimas.";
    const origin = base_url || "https://avaliacaopsico.lovable.app";

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const inv of withEmail) {
      const emp = (inv as any).employees;
      const surveyUrl = `${origin}/survey?token=${inv.token}`;

      const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: ${tenantColor}; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 20px;">${tenantName}</h1>
  </div>
  <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px 24px; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; color: #1f2937;">Olá, <strong>${emp.full_name}</strong>!</p>
    <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">${inviteMessage}</p>
    <p style="font-size: 14px; color: #4b5563;"><strong>Campanha:</strong> ${campaignName}</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${surveyUrl}" style="background: ${tenantColor}; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
        Responder Avaliação
      </a>
    </div>
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">Este link é pessoal e intransferível. Suas respostas são anônimas.</p>
  </div>
</body>
</html>`;

      if (resendApiKey) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: `${tenantName} <noreply@avaliacaopsico.lovable.app>`,
              to: [emp.email],
              subject: `${campaignName} - ${tenantName}`,
              html: htmlBody,
            }),
          });

          if (res.ok) {
            sent++;
          } else {
            const errBody = await res.text();
            failed++;
            errors.push(`${emp.email}: ${errBody}`);
          }
        } catch (e) {
          failed++;
          errors.push(`${emp.email}: ${e.message}`);
        }
      } else {
        // Simulated send (no Resend key configured)
        console.log(`[SIMULATED] Email to ${emp.email} for survey ${surveyUrl}`);
        sent++;
      }
    }

    const simulated = !resendApiKey;

    return new Response(
      JSON.stringify({
        sent,
        failed,
        total: withEmail.length,
        simulated,
        message: simulated
          ? `${sent} emails simulados (configure RESEND_API_KEY para envio real)`
          : `${sent} emails enviados com sucesso`,
        ...(errors.length > 0 && { errors }),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
