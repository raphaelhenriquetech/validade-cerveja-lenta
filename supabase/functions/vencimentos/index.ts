import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-token",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

interface Row {
  beer_name: string;
  sku: string | null;
  lot: string;
  quantity: number;
  expiration_date: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const expectedToken = Deno.env.get("VENCIMENTOS_TOKEN");
  const providedToken = req.headers.get("x-api-token");

  if (!expectedToken) {
    console.error("VENCIMENTOS_TOKEN secret not configured");
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!providedToken || providedToken !== expectedToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("beer_batches")
      .select("beer_name, sku, lot, quantity, expiration_date")
      .eq("archived", false)
      .eq("company_id", "9139bec3-dc48-4c00-aec8-3e1235d3219b")
      .gte("expiration_date", todayStr)
      .order("expiration_date", { ascending: true });

    if (error) throw error;

    const critico: any[] = [];
    const atencao: any[] = [];
    const alerta: any[] = [];

    const msPerDay = 1000 * 60 * 60 * 24;
    const todayMid = new Date(todayStr + "T00:00:00Z").getTime();

    for (const row of (data || []) as Row[]) {
      const expMid = new Date(row.expiration_date + "T00:00:00Z").getTime();
      const dias = Math.round((expMid - todayMid) / msPerDay);
      const item = { ...row, dias_para_vencer: dias };
      if (dias <= 7) critico.push(item);
      else if (dias <= 15) atencao.push(item);
      else if (dias <= 30) alerta.push(item);
    }

    const sortFn = (a: any, b: any) => a.dias_para_vencer - b.dias_para_vencer;
    critico.sort(sortFn);
    atencao.sort(sortFn);
    alerta.sort(sortFn);

    return new Response(
      JSON.stringify({
        gerado_em: todayStr,
        resumo: {
          critico: critico.length,
          atencao: atencao.length,
          alerta: alerta.length,
        },
        critico,
        atencao,
        alerta,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("vencimentos error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
