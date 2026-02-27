import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TEST_USERS = [
  { email: "gestor@teste.flew.com", role: "gestor", full_name: "Teste Gestor" },
  { email: "diretoria@teste.flew.com", role: "diretoria", full_name: "Teste Diretoria" },
  { email: "auditoria@teste.flew.com", role: "auditoria", full_name: "Teste Auditoria" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate caller
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

    // Verify the caller is authenticated
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { tenant_id } = await req.json();
    if (!tenant_id) {
      return new Response(JSON.stringify({ error: "tenant_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get first department for gestor
    const { data: departments } = await adminClient
      .from("departments")
      .select("id")
      .eq("tenant_id", tenant_id)
      .limit(1);
    const firstDeptId = departments?.[0]?.id ?? null;

    const results: { email: string; role: string; status: string; error?: string }[] = [];

    for (const testUser of TEST_USERS) {
      try {
        // Create user with tenant_id in metadata so trigger uses it
        const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
          email: testUser.email,
          password: "teste123456",
          email_confirm: true,
          user_metadata: { tenant_id, full_name: testUser.full_name },
        });

        if (createErr) {
          // User might already exist
          results.push({ email: testUser.email, role: testUser.role, status: "error", error: createErr.message });
          continue;
        }

        const userId = created.user.id;

        // Small delay to let trigger execute
        await new Promise((r) => setTimeout(r, 500));

        // Update profile tenant_id (in case trigger used a different one)
        await adminClient
          .from("profiles")
          .update({ tenant_id, full_name: testUser.full_name })
          .eq("user_id", userId);

        // For gestor, also set department_id
        if (testUser.role === "gestor" && firstDeptId) {
          await adminClient
            .from("profiles")
            .update({ department_id: firstDeptId })
            .eq("user_id", userId);
        }

        // Delete auto-assigned admin_rh role
        await adminClient
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("tenant_id", tenant_id);

        // Insert correct role
        await adminClient
          .from("user_roles")
          .insert({ user_id: userId, tenant_id, role: testUser.role });

        results.push({ email: testUser.email, role: testUser.role, status: "created" });
      } catch (e) {
        results.push({ email: testUser.email, role: testUser.role, status: "error", error: String(e) });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
