import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      console.error('TINY_API_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Token da API Tiny não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body for optional filters
    let pesquisa = '';
    let pagina = 1;
    
    if (req.method === 'POST') {
      const body = await req.json();
      pesquisa = body.pesquisa || '';
      pagina = body.pagina || 1;
    }

    console.log(`Fetching Tiny products - pesquisa: "${pesquisa}", pagina: ${pagina}`);

    // Build URL with parameters
    const params = new URLSearchParams({
      token: TINY_API_TOKEN,
      formato: 'JSON',
      pagina: pagina.toString(),
    });

    if (pesquisa) {
      params.append('pesquisa', pesquisa);
    }

    const tinyUrl = `https://api.tiny.com.br/api2/produtos.pesquisa.php?${params.toString()}`;
    
    console.log('Calling Tiny API...');
    
    const response = await fetch(tinyUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Tiny API error: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ error: `Erro na API Tiny: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Tiny API response received:', JSON.stringify(data).substring(0, 500));

    // Check for Tiny API errors
    if (data.retorno?.status === 'Erro') {
      console.error('Tiny API returned error:', data.retorno.erros);
      return new Response(
        JSON.stringify({ 
          error: 'Erro na API Tiny', 
          details: data.retorno.erros 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract products from response
    const produtos = data.retorno?.produtos || [];
    const totalPaginas = data.retorno?.numero_paginas || 1;
    const totalRegistros = data.retorno?.numero_registros || 0;

    console.log(`Found ${produtos.length} products, total: ${totalRegistros}, pages: ${totalPaginas}`);

    // Format products for frontend
    const formattedProducts = produtos.map((item: any) => ({
      id: item.produto?.id,
      codigo: item.produto?.codigo,
      nome: item.produto?.nome,
      preco: item.produto?.preco,
      preco_custo: item.produto?.preco_custo,
      situacao: item.produto?.situacao,
      unidade: item.produto?.unidade,
    }));

    return new Response(
      JSON.stringify({
        produtos: formattedProducts,
        pagina_atual: pagina,
        total_paginas: totalPaginas,
        total_registros: totalRegistros,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-tiny-products:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
