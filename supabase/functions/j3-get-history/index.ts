import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const j3Username = Deno.env.get('J3_USERNAME')!;
    const j3Password = Deno.env.get('J3_PASSWORD')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const codremessa = url.searchParams.get('codremessa');
    const numpedido = url.searchParams.get('numpedido');
    const notafiscal = url.searchParams.get('notafiscal');

    console.log('History request params:', { codremessa, numpedido, notafiscal });

    if (!codremessa && !numpedido && !notafiscal) {
      throw new Error('Informe codremessa, numpedido ou notafiscal');
    }

    // Buscar configurações do vendedor
    const { data: sellerConfig, error: configError } = await supabase
      .from('j3_seller_config')
      .select('cnpj_transportadora, ambiente')
      .limit(1)
      .maybeSingle();

    if (configError || !sellerConfig) {
      console.error('Error fetching seller config:', configError);
      throw new Error('Configurações do vendedor não encontradas');
    }

    // Definir URL base de acordo com ambiente
    const baseUrl = sellerConfig.ambiente === 'producao' 
      ? 'https://tracken.app.br/tracken/api'
      : 'https://pgsite.com.br/tracken/api';

    // Montar URL com parâmetros
    const historyUrl = new URL(`${baseUrl}/pedido/historico`);
    
    if (codremessa) {
      historyUrl.searchParams.set('codremessa', codremessa);
    }
    if (numpedido) {
      historyUrl.searchParams.set('numpedido', numpedido);
    }
    if (notafiscal) {
      historyUrl.searchParams.set('notafiscal', notafiscal);
    }

    console.log('Fetching history from:', historyUrl.toString());

    const credentials = btoa(`${j3Username}:${j3Password}`);
    const historyResponse = await fetch(historyUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'cpfcnpjtransportadora': sellerConfig.cnpj_transportadora,
      },
    });

    console.log('History response status:', historyResponse.status);

    if (!historyResponse.ok) {
      const errorText = await historyResponse.text();
      console.error('J3 history error:', errorText);
      throw new Error(`Erro ao buscar histórico: ${historyResponse.status} - ${errorText}`);
    }

    const historyData = await historyResponse.json();
    console.log('History data:', JSON.stringify(historyData));

    return new Response(JSON.stringify({ 
      success: true, 
      data: historyData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in j3-get-history:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
