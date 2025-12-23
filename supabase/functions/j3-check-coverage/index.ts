import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const cep = url.searchParams.get('cep');

    if (!cep) {
      console.error('[j3-check-coverage] CEP não fornecido');
      return new Response(
        JSON.stringify({ success: false, error: 'CEP é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      console.error('[j3-check-coverage] CEP inválido:', cep);
      return new Response(
        JSON.stringify({ success: false, error: 'CEP inválido. Deve conter 8 dígitos.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get seller config
    const { data: sellerConfig, error: configError } = await supabase
      .from('j3_seller_config')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (configError) {
      console.error('[j3-check-coverage] Erro ao buscar config:', configError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao buscar configurações do vendedor' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!sellerConfig) {
      console.error('[j3-check-coverage] Configuração do vendedor não encontrada');
      return new Response(
        JSON.stringify({ success: false, error: 'Configure os dados do vendedor antes de consultar cobertura' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get J3 credentials
    const j3Token = Deno.env.get('J3_TOKEN');
    if (!j3Token) {
      console.error('[j3-check-coverage] J3_TOKEN não configurado');
      return new Response(
        JSON.stringify({ success: false, error: 'Token da J3 não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine API URL based on environment
    const isProduction = sellerConfig.ambiente === 'producao';
    const baseUrl = isProduction 
      ? 'https://tracken.app.br/tracken/api'
      : 'https://pgsite.com.br/tracken/api';

    // Build query params for /api/prazo endpoint
    const prazoParams = new URLSearchParams({
      filial: sellerConfig.cnpj_transportadora.replace(/\D/g, ''),
      cep: cleanCep,
      cliente: sellerConfig.cod_cliente,
      servico: '2', // Serviço padrão
    });

    console.log('[j3-check-coverage] Consultando cobertura:', {
      url: `${baseUrl}/prazo?${prazoParams.toString()}`,
      cep: cleanCep,
      cliente: sellerConfig.cod_cliente,
      servico: '2',
      ambiente: sellerConfig.ambiente,
    });

    // Call J3 API
    const j3Response = await fetch(`${baseUrl}/prazo?${prazoParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${j3Token}`,
        'Accept': 'application/json',
      },
    });

    console.log('[j3-check-coverage] Status da resposta J3:', j3Response.status);

    if (j3Response.status === 404) {
      // CEP not covered
      console.log('[j3-check-coverage] CEP não atendido:', cleanCep);
      return new Response(
        JSON.stringify({ 
          success: true, 
          covered: false, 
          message: 'CEP fora da área de entrega da J3/Tracken',
          cep: cleanCep,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!j3Response.ok) {
      const errorText = await j3Response.text();
      console.error('[j3-check-coverage] Erro da API J3:', j3Response.status, errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro ao consultar API J3: ${j3Response.status}`,
          details: errorText,
        }),
        { status: j3Response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prazoData = await j3Response.json();
    console.log('[j3-check-coverage] Dados de prazo:', prazoData);

    // Parse the response - the API returns delivery info
    return new Response(
      JSON.stringify({ 
        success: true, 
        covered: true, 
        cep: cleanCep,
        prazo: prazoData.prazo || prazoData.dias || null,
        valor: prazoData.valor || prazoData.frete || null,
        message: prazoData.prazo 
          ? `Entrega disponível - ${prazoData.prazo} dias úteis` 
          : 'Entrega disponível',
        rawResponse: prazoData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[j3-check-coverage] Erro interno:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno ao verificar cobertura' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
