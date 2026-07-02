import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function formatBRDate(iso: string): string {
  // iso like "YYYY-MM-DD"
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TINY_API_TOKEN = Deno.env.get('TINY_API_TOKEN');
    if (!TINY_API_TOKEN) throw new Error('TINY_API_TOKEN not configured');

    const { sku, expirationDate, batchId } = await req.json();
    if (!sku) throw new Error('SKU é obrigatório');
    if (!expirationDate) throw new Error('Data de validade é obrigatória');

    const validadeBR = formatBRDate(expirationDate);
    console.log(`[update-tiny-description] SKU=${sku} validade=${validadeBR}`);

    // Step 1: search product by SKU
    const searchParams = new URLSearchParams({
      token: TINY_API_TOKEN,
      pesquisa: sku,
      formato: 'JSON',
    });
    const searchRes = await fetch(
      `https://api.tiny.com.br/api2/produtos.pesquisa.php?${searchParams.toString()}`
    );
    const searchData = await searchRes.json();
    console.log('[update-tiny-description] search:', JSON.stringify(searchData).slice(0, 500));

    if (searchData.retorno?.status === 'Erro') {
      const err = searchData.retorno?.erros?.[0]?.erro || 'Produto não encontrado no Tiny';
      throw new Error(err);
    }

    const produtos = searchData.retorno?.produtos || [];
    const found = produtos.find((p: any) => p.produto?.codigo === sku);
    if (!found) throw new Error(`Produto com SKU "${sku}" não encontrado no Tiny`);

    const idProduto = found.produto?.id;
    console.log(`[update-tiny-description] idProduto=${idProduto}`);

    // Step 2: get current product details
    const obterParams = new URLSearchParams({
      token: TINY_API_TOKEN,
      id: String(idProduto),
      formato: 'JSON',
    });
    const obterRes = await fetch(
      `https://api.tiny.com.br/api2/produto.obter.php?${obterParams.toString()}`
    );
    const obterData = await obterRes.json();

    if (obterData.retorno?.status === 'Erro') {
      const err = obterData.retorno?.erros?.[0]?.erro || 'Erro ao obter produto';
      throw new Error(err);
    }

    const produto = obterData.retorno?.produto || {};
    const currentDesc: string = produto.descricao_complementar || '';

    // Remove any existing "Validade: ..." line (case-insensitive)
    const cleaned = currentDesc
      .split(/\r?\n/)
      .filter((line) => !/^\s*validade\s*:/i.test(line))
      .join('\n')
      .replace(/\s+$/g, '');

    const newDesc = (cleaned ? cleaned + '\n' : '') + `Validade: ${validadeBR}`;

    // Step 3: update product - Tiny requires sequencia + mandatory fields
    const produtoPayload = {
      produtos: [
        {
          produto: {
            sequencia: 1,
            id: idProduto,
            codigo: produto.codigo,
            nome: produto.nome,
            unidade: produto.unidade || 'UN',
            preco: produto.preco ?? 0,
            origem: produto.origem ?? '0',
            situacao: produto.situacao || 'A',
            tipo: produto.tipo || 'P',
            descricao_complementar: newDesc,
          },
        },
      ],
    };

    const body = `token=${encodeURIComponent(TINY_API_TOKEN)}&produto=${encodeURIComponent(
      JSON.stringify(produtoPayload)
    )}&formato=JSON`;

    const updateRes = await fetch('https://api.tiny.com.br/api2/produto.alterar.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const updateData = await updateRes.json();
    console.log('[update-tiny-description] update:', JSON.stringify(updateData).slice(0, 800));

    if (updateData.retorno?.status === 'Erro') {
      // Try to surface nested errors
      const registros = updateData.retorno?.registros;
      let err = updateData.retorno?.erros?.[0]?.erro;
      if (!err && registros) {
        const reg = Array.isArray(registros) ? registros[0]?.registro : registros?.registro;
        err = reg?.erros?.[0]?.erro;
      }
      throw new Error(err || 'Erro ao atualizar descrição no Tiny');
    }

    // Persist timestamp in DB using service role (bypasses RLS)
    const nowIso = new Date().toISOString();
    try {
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
      const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
      let upd;
      if (batchId) {
        upd = await admin
          .from('beer_batches')
          .update({ tiny_description_updated_at: nowIso })
          .eq('id', batchId);
      } else {
        upd = await admin
          .from('beer_batches')
          .update({ tiny_description_updated_at: nowIso })
          .eq('sku', sku)
          .eq('archived', false);
      }
      if (upd.error) console.error('[update-tiny-description] DB update error:', upd.error);
      else console.log('[update-tiny-description] DB timestamp saved for', batchId || `sku=${sku}`);
    } catch (dbErr) {
      console.error('[update-tiny-description] DB update exception:', dbErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Descrição atualizada no Tiny com validade ${validadeBR}`,
        sku,
        idProduto,
        validade: validadeBR,
        tinyDescriptionUpdatedAt: nowIso,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[update-tiny-description] Error:', msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
