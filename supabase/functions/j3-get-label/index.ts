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
    const j3Token = Deno.env.get('J3_TOKEN')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const codpedido = url.searchParams.get('codpedido');
    const notafiscal = url.searchParams.get('notafiscal');
    const pedido = url.searchParams.get('pedido');

    console.log('Label request params:', { codpedido, notafiscal, pedido });

    // Buscar configurações do vendedor para obter CNPJ da transportadora e ambiente
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
    const labelUrl = new URL(`${baseUrl}/pedido/etiqueta/pdf`);
    labelUrl.searchParams.set('filial', sellerConfig.cnpj_transportadora);
    
    if (codpedido) {
      labelUrl.searchParams.set('remessa', codpedido);
    } else if (notafiscal) {
      labelUrl.searchParams.set('notafiscal', notafiscal);
    } else if (pedido) {
      labelUrl.searchParams.set('pedido', pedido);
    } else {
      throw new Error('Informe codpedido, notafiscal ou pedido');
    }

    console.log('Fetching label from:', labelUrl.toString());

    const labelResponse = await fetch(labelUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Token ${j3Token}`,
      },
    });

    console.log('Label response status:', labelResponse.status);

    if (!labelResponse.ok) {
      const errorText = await labelResponse.text();
      console.error('J3 label error:', errorText);
      throw new Error(`Erro ao buscar etiqueta: ${labelResponse.status} - ${errorText}`);
    }

    // Retornar PDF
    const pdfBuffer = await labelResponse.arrayBuffer();

    return new Response(pdfBuffer, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="etiqueta-${codpedido || notafiscal || pedido}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error in j3-get-label:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
