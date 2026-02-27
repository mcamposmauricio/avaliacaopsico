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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser(token);
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { tenant_id, email, password, full_name, role } = await req.json();
    if (!tenant_id || !email || !password || !full_name || !role) {
      return new Response(JSON.stringify({ error: "tenant_id, email, password, full_name and role are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Create user
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { tenant_id, full_name },
    });

    if (createErr) {
      return new Response(JSON.stringify({ error: createErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = created.user.id;

    // Wait for trigger
    await new Promise((r) => setTimeout(r, 500));

    // Ensure profile has correct tenant_id and force password change
    await adminClient
      .from("profiles")
      .update({ tenant_id, full_name, must_change_password: true })
      .eq("user_id", userId);

    // For gestor, assign first department
    if (role === "gestor") {
      const { data: departments } = await adminClient
        .from("departments")
        .select("id")
        .eq("tenant_id", tenant_id)
        .limit(1);
      if (departments?.[0]?.id) {
        await adminClient
          .from("profiles")
          .update({ department_id: departments[0].id })
          .eq("user_id", userId);
      }
    }

    // Remove auto-assigned admin_rh
    await adminClient
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("tenant_id", tenant_id);

    // Insert chosen role
    await adminClient
      .from("user_roles")
      .insert({ user_id: userId, tenant_id, role });

    return new Response(JSON.stringify({ user_id: userId, email, role, status: "created" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
