import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { campaign_id } = await req.json();
    if (!campaign_id) throw new Error("campaign_id is required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Get campaign + template
    const { data: campaign, error: campErr } = await supabase
      .from("survey_campaigns")
      .select("id, template_id, tenant_id")
      .eq("id", campaign_id)
      .single();
    if (campErr) throw campErr;

    // Get tenant for min_group_size
    const { data: tenant } = await supabase
      .from("tenants")
      .select("min_group_size")
      .eq("id", campaign.tenant_id)
      .single();
    const minGroupSize = tenant?.min_group_size ?? 7;

    // 2. Get dimensions + items
    const { data: dimensions } = await supabase
      .from("survey_dimensions")
      .select("id, name, sort_order")
      .eq("template_id", campaign.template_id)
      .order("sort_order");

    const dimensionIds = dimensions!.map((d: any) => d.id);

    const { data: items } = await supabase
      .from("survey_items")
      .select("id, dimension_id, is_inverted")
      .in("dimension_id", dimensionIds);

    const itemMap = new Map<string, { dimension_id: string; is_inverted: boolean }>();
    for (const item of items!) {
      itemMap.set(item.id, { dimension_id: item.dimension_id, is_inverted: item.is_inverted });
    }

    // 3. Get all complete responses
    const { data: responses } = await supabase
      .from("survey_responses")
      .select("id, department_id, org_unit_id, job_role_id")
      .eq("campaign_id", campaign_id)
      .eq("is_complete", true);

    if (!responses?.length) {
      return new Response(JSON.stringify({ message: "No complete responses found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const responseIds = responses.map((r: any) => r.id);

    // Fetch all answers in batches (avoid 1000 row limit)
    let allAnswers: any[] = [];
    for (let i = 0; i < responseIds.length; i += 50) {
      const batch = responseIds.slice(i, i + 50);
      const { data: answers } = await supabase
        .from("survey_answers")
        .select("response_id, item_id, value")
        .in("response_id", batch);
      if (answers) allAnswers = allAnswers.concat(answers);
    }

    // 4. Delete old scores for this campaign
    await supabase.from("response_scores").delete().in("response_id", responseIds);
    await supabase.from("campaign_scores").delete().eq("campaign_id", campaign_id);
    await supabase.from("group_scores").delete().eq("campaign_id", campaign_id);

    // 5. Calculate per-response scores
    const responseScoreRows: any[] = [];
    const dimScoresAgg: Record<string, number[]> = {};

    // Group answers by response
    const answersByResponse = new Map<string, any[]>();
    for (const a of allAnswers) {
      if (!answersByResponse.has(a.response_id)) answersByResponse.set(a.response_id, []);
      answersByResponse.get(a.response_id)!.push(a);
    }

    // Build response metadata map
    const responseMeta = new Map<string, any>();
    for (const r of responses) responseMeta.set(r.id, r);

    // Group scores by group for aggregation
    const groupAgg: Record<string, Record<string, number[]>> = {};

    for (const [responseId, answers] of answersByResponse) {
      // Group answers by dimension
      const dimValues: Record<string, number[]> = {};
      for (const a of answers) {
        const meta = itemMap.get(a.item_id);
        if (!meta) continue;
        const value = meta.is_inverted ? 6 - a.value : a.value;
        if (!dimValues[meta.dimension_id]) dimValues[meta.dimension_id] = [];
        dimValues[meta.dimension_id].push(value);
      }

      // Calculate score per dimension
      for (const [dimId, values] of Object.entries(dimValues)) {
        const avg = values.reduce((s, v) => s + v, 0) / values.length;
        const score = ((avg - 1) / 4) * 100; // normalize to 0-100

        responseScoreRows.push({
          response_id: responseId,
          dimension_id: dimId,
          score: Math.round(score * 100) / 100,
          items_count: values.length,
        });

        if (!dimScoresAgg[dimId]) dimScoresAgg[dimId] = [];
        dimScoresAgg[dimId].push(score);
      }

      // Aggregate for groups
      const meta = responseMeta.get(responseId);
      if (!meta) continue;

      const groups: [string, string][] = [];
      if (meta.department_id) groups.push(["department", meta.department_id]);
      if (meta.org_unit_id) groups.push(["org_unit", meta.org_unit_id]);
      if (meta.job_role_id) groups.push(["job_role", meta.job_role_id]);

      for (const [groupType, groupId] of groups) {
        const key = `${groupType}::${groupId}`;
        if (!groupAgg[key]) groupAgg[key] = {};
        for (const [dimId, values] of Object.entries(dimValues)) {
          const avg = values.reduce((s, v) => s + v, 0) / values.length;
          const score = ((avg - 1) / 4) * 100;
          if (!groupAgg[key][dimId]) groupAgg[key][dimId] = [];
          groupAgg[key][dimId].push(score);
        }
      }
    }

    // Insert response_scores in batches
    for (let i = 0; i < responseScoreRows.length; i += 500) {
      await supabase.from("response_scores").insert(responseScoreRows.slice(i, i + 500));
    }

    // 6. Campaign-level aggregation
    const campaignScoreRows: any[] = [];
    for (const [dimId, scores] of Object.entries(dimScoresAgg)) {
      const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
      const min = Math.min(...scores);
      const max = Math.max(...scores);
      const variance = scores.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / scores.length;
      const stdDev = Math.sqrt(variance);

      campaignScoreRows.push({
        campaign_id,
        dimension_id: dimId,
        avg_score: Math.round(avg * 100) / 100,
        min_score: Math.round(min * 100) / 100,
        max_score: Math.round(max * 100) / 100,
        std_dev: Math.round(stdDev * 100) / 100,
        responses_count: scores.length,
      });
    }
    await supabase.from("campaign_scores").insert(campaignScoreRows);

    // 7. Group-level aggregation
    const groupScoreRows: any[] = [];
    for (const [key, dims] of Object.entries(groupAgg)) {
      const [groupType, groupId] = key.split("::");
      for (const [dimId, scores] of Object.entries(dims)) {
        const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
        groupScoreRows.push({
          campaign_id,
          dimension_id: dimId,
          group_type: groupType,
          group_id: groupId,
          avg_score: Math.round(avg * 100) / 100,
          responses_count: scores.length,
          is_suppressed: scores.length < minGroupSize,
        });
      }
    }
    if (groupScoreRows.length > 0) {
      for (let i = 0; i < groupScoreRows.length; i += 500) {
        await supabase.from("group_scores").insert(groupScoreRows.slice(i, i + 500));
      }
    }

    return new Response(
      JSON.stringify({
        message: "Scoring complete",
        responses_processed: responses.length,
        campaign_scores: campaignScoreRows.length,
        group_scores: groupScoreRows.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
