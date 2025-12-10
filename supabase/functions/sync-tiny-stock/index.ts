import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TINY_API_TOKEN = Deno.env.get('TINY_API_TOKEN');
    if (!TINY_API_TOKEN) {
      throw new Error('TINY_API_TOKEN not configured');
    }

    const { sku, quantity } = await req.json();
    
    if (!sku) {
      throw new Error('SKU é obrigatório para sincronização');
    }

    if (quantity === undefined || quantity < 0) {
      throw new Error('Quantidade inválida');
    }

    console.log(`[sync-tiny-stock] Starting sync for SKU: ${sku}, quantity: ${quantity}`);

    // Step 1: Search for product by SKU (codigo) in Tiny
    const searchParams = new URLSearchParams({
      token: TINY_API_TOKEN,
      pesquisa: sku,
      formato: 'JSON',
    });

    const searchResponse = await fetch(
      `https://api.tiny.com.br/api2/produtos.pesquisa.php?${searchParams.toString()}`,
      { method: 'GET' }
    );

    if (!searchResponse.ok) {
      throw new Error(`Erro ao buscar produto no Tiny: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log(`[sync-tiny-stock] Tiny search response:`, JSON.stringify(searchData));

    if (searchData.retorno?.status === 'Erro') {
      const errorMsg = searchData.retorno?.erros?.[0]?.erro || 'Produto não encontrado no Tiny';
      throw new Error(errorMsg);
    }

    const produtos = searchData.retorno?.produtos || [];
    
    // Find exact match by codigo (SKU)
    const produto = produtos.find((p: any) => p.produto?.codigo === sku);
    
    if (!produto) {
      throw new Error(`Produto com SKU "${sku}" não encontrado no Tiny`);
    }

    const idProduto = produto.produto?.id;
    console.log(`[sync-tiny-stock] Found product ID: ${idProduto}`);

    // Step 2: Update stock in Tiny using type 'B' (balance/balanço)
    // API Tiny requires 'estoque' parameter as JSON object in form data
    const estoqueData = JSON.stringify({
      idProduto: idProduto,
      tipo: 'B', // B = Balanço (set absolute value)
      quantidade: quantity.toString()
    });

    const formData = `token=${TINY_API_TOKEN}&estoque=${encodeURIComponent(estoqueData)}&formato=JSON`;

    console.log(`[sync-tiny-stock] Sending estoque update:`, estoqueData);

    const updateResponse = await fetch(
      'https://api.tiny.com.br/api2/produto.atualizar.estoque.php',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      }
    );

    if (!updateResponse.ok) {
      throw new Error(`Erro ao atualizar estoque no Tiny: ${updateResponse.status}`);
    }

    const updateData = await updateResponse.json();
    console.log(`[sync-tiny-stock] Tiny update response:`, JSON.stringify(updateData));

    if (updateData.retorno?.status === 'Erro') {
      const errorMsg = updateData.retorno?.erros?.[0]?.erro || 'Erro ao atualizar estoque';
      throw new Error(errorMsg);
    }

    console.log(`[sync-tiny-stock] Stock updated successfully for SKU: ${sku}, new quantity: ${quantity}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Estoque atualizado no Tiny: ${quantity} unidades`,
        sku,
        quantity,
        idProduto
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[sync-tiny-stock] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
