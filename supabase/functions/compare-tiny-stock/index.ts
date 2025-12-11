import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function with retry and exponential backoff
async function fetchWithRetry(
  url: string,
  formData: FormData,
  maxRetries: number = 3
): Promise<any> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      // Detect rate limiting (codigo_erro 6)
      if (data.retorno?.codigo_erro === 6 ||
          data.retorno?.erros?.[0]?.erro?.includes('API Bloqueada')) {

        // Exponential backoff: 2s, 4s, 8s
        const backoffMs = Math.pow(2, attempt) * 1000;
        console.log(`Rate limited. Aguardando ${backoffMs}ms antes do retry ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue; // Try again
      }

      return data; // Success

    } catch (error) {
      lastError = error as Error;
      console.error(`Tentativa ${attempt} falhou:`, error);

      // Exponential backoff for network errors too
      const backoffMs = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }

  // All attempts failed
  throw lastError || new Error('Máximo de tentativas excedido');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TINY_API_TOKEN = Deno.env.get('TINY_API_TOKEN');

    if (!TINY_API_TOKEN) {
      throw new Error('TINY_API_TOKEN não configurado');
    }

    const { skus } = await req.json();

    if (!skus || !Array.isArray(skus) || skus.length === 0) {
      return new Response(
        JSON.stringify({ stocks: {} }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Buscando estoque no Tiny para ${skus.length} SKUs:`, skus);

    const stocks: Record<string, number | null> = {};

    // Fetch stock for each SKU
    for (const sku of skus) {
      try {
        // First, search for the product by code (SKU)
        const searchFormData = new FormData();
        searchFormData.append('token', TINY_API_TOKEN);
        searchFormData.append('pesquisa', sku);
        searchFormData.append('formato', 'JSON');

        const searchData = await fetchWithRetry(
          'https://api.tiny.com.br/api2/produtos.pesquisa.php',
          searchFormData
        );
        console.log(`Pesquisa SKU ${sku}:`, JSON.stringify(searchData));

        if (searchData.retorno?.status !== 'OK' || !searchData.retorno?.produtos?.length) {
          console.log(`SKU ${sku} não encontrado no Tiny`);
          stocks[sku] = null;
          // Delay before next SKU
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        // Find exact match by codigo
        const products = searchData.retorno.produtos;
        const exactMatch = products.find((p: any) => p.produto?.codigo === sku);

        if (!exactMatch) {
          console.log(`SKU ${sku} não encontrado com match exato`);
          stocks[sku] = null;
          // Delay before next SKU
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        const productId = exactMatch.produto.id;
        console.log(`SKU ${sku} encontrado, ID: ${productId}`);

        // Delay between search and stock request
        await new Promise(resolve => setTimeout(resolve, 500));

        // Get stock for this product
        const stockFormData = new FormData();
        stockFormData.append('token', TINY_API_TOKEN);
        stockFormData.append('id', productId.toString());
        stockFormData.append('formato', 'JSON');

        const stockData = await fetchWithRetry(
          'https://api.tiny.com.br/api2/produto.obter.estoque.php',
          stockFormData
        );
        console.log(`Estoque SKU ${sku}:`, JSON.stringify(stockData));

        if (stockData.retorno?.status === 'OK' && stockData.retorno?.produto) {
          const saldo = parseFloat(stockData.retorno.produto.saldo || '0');
          stocks[sku] = Math.floor(saldo);
          console.log(`SKU ${sku}: estoque Tiny = ${stocks[sku]}`);
        } else {
          stocks[sku] = null;
        }

        // Delay of 1 second before next SKU to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Erro ao buscar SKU ${sku}:`, error);
        stocks[sku] = null;
        // Still delay even on error
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('Resultado final:', stocks);

    return new Response(
      JSON.stringify({ stocks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função compare-tiny-stock:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
