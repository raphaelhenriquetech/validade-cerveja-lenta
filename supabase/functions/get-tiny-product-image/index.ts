import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TINY_BASE = "https://api.tiny.com.br/api2";

// Sleep helper
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callTiny(endpoint: string, params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams(params).toString();
  const url = `${TINY_BASE}/${endpoint}?${qs}`;

  // Exponential backoff for rate limit (Tiny error code 6)
  // Tiny allows ~60 req/min. Start slow to give room to recover.
  let delay = 2500;
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) throw new Error(`Tiny HTTP ${res.status}`);
    const data = await res.json();
    const status = data?.retorno?.status;
    if (status === "OK") return data;
    const codes: any[] = data?.retorno?.codigo_erro
      ? [data.retorno.codigo_erro]
      : (data?.retorno?.erros || []).map((e: any) => e?.erro?.codigo ?? e?.codigo);
    const isRateLimited = codes.some((c) => String(c) === "6");
    if (!isRateLimited) return data;
    console.log(`[callTiny] rate limited, waiting ${delay}ms (attempt ${attempt + 1}/6)`);
    await sleep(delay);
    delay = Math.min(delay * 2, 20000);
  }
  throw new Error("Tiny rate limit exceeded after retries");
}

async function fetchProductImage(sku: string, token: string): Promise<{
  image_url: string | null;
  product_name: string | null;
  tiny_product_id: string | null;
}> {
  // 1) Search product by SKU
  const search = await callTiny("produtos.pesquisa.php", {
    token,
    formato: "JSON",
    pesquisa: sku,
  });

  const produtos = search?.retorno?.produtos || [];
  // Match exact SKU (codigo) to avoid partial-match noise
  const match = produtos.find(
    (p: any) => String(p?.produto?.codigo || "").trim().toLowerCase() === sku.trim().toLowerCase()
  ) || produtos[0];

  const productId = match?.produto?.id;
  const productName = match?.produto?.nome ?? null;

  if (!productId) {
    return { image_url: null, product_name: null, tiny_product_id: null };
  }

  // 2) Get full product details (includes anexos)
  const details = await callTiny("produto.obter.php", {
    token,
    id: String(productId),
    formato: "JSON",
  });

  const produto = details?.retorno?.produto;
  const anexos = produto?.anexos || [];
  // Tiny returns [{ anexo: { url, ... } }] or [{ anexo: "https..." }] depending on account
  let imageUrl: string | null = null;
  for (const a of anexos) {
    const val = a?.anexo;
    if (typeof val === "string" && val.startsWith("http")) {
      imageUrl = val;
      break;
    }
    if (val && typeof val === "object") {
      const candidate = val.url || val.anexo || val.link;
      if (typeof candidate === "string" && candidate.startsWith("http")) {
        imageUrl = candidate;
        break;
      }
    }
  }

  // Fallback: some accounts expose `imagem_url_externa` or `imagem`
  if (!imageUrl) {
    const alt = produto?.imagem_url_externa || produto?.imagem;
    if (typeof alt === "string" && alt.startsWith("http")) imageUrl = alt;
  }

  return {
    image_url: imageUrl,
    product_name: productName,
    tiny_product_id: String(productId),
  };
}

serve(async (req) => {
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

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const TINY_API_TOKEN = Deno.env.get("TINY_API_TOKEN");

    if (!TINY_API_TOKEN) {
      return new Response(JSON.stringify({ error: "Token da API Tiny não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller
    const supaAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supaAuth.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const skus: string[] = Array.isArray(body?.skus)
      ? body.skus.filter((s: any) => typeof s === "string" && s.trim().length > 0).map((s: string) => s.trim())
      : [];
    const force: boolean = body?.force === true;

    if (skus.length === 0) {
      return new Response(JSON.stringify({ results: {} }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client for cache
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const uniqueSkus = Array.from(new Set(skus));
    const CACHE_TTL_DAYS = 7;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - CACHE_TTL_DAYS);

    // Load existing cache
    const { data: cached } = await admin
      .from("tiny_product_cache")
      .select("*")
      .in("sku", uniqueSkus);
    const cacheMap = new Map<string, any>((cached || []).map((r: any) => [r.sku, r]));

    const results: Record<string, { image_url: string | null; product_name: string | null }> = {};
    const toFetch: string[] = [];

    for (const sku of uniqueSkus) {
      const c = cacheMap.get(sku);
      const fresh = c && new Date(c.fetched_at).getTime() > cutoff.getTime();
      if (!force && c && fresh) {
        results[sku] = { image_url: c.image_url, product_name: c.product_name };
      } else {
        toFetch.push(sku);
      }
    }

    // Fetch sequentially to respect Tiny rate limits
    for (const sku of toFetch) {
      try {
        const info = await fetchProductImage(sku, TINY_API_TOKEN);
        const not_found = !info.image_url;
        await admin.from("tiny_product_cache").upsert(
          {
            sku,
            image_url: info.image_url,
            product_name: info.product_name,
            tiny_product_id: info.tiny_product_id,
            not_found,
            fetched_at: new Date().toISOString(),
          },
          { onConflict: "sku" },
        );
        results[sku] = { image_url: info.image_url, product_name: info.product_name };
        // Small pause between calls
        await sleep(250);
      } catch (err) {
        console.error(`[get-tiny-product-image] SKU ${sku} failed:`, err);
        results[sku] = { image_url: null, product_name: null };
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("get-tiny-product-image error:", error);
    const msg = error instanceof Error ? error.message : "Erro interno";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
