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

    const orderData = await req.json();
    console.log('Received order data:', JSON.stringify(orderData));

    // Buscar configurações do vendedor
    const { data: sellerConfig, error: configError } = await supabase
      .from('j3_seller_config')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (configError) {
      console.error('Error fetching seller config:', configError);
      throw new Error('Erro ao buscar configurações do vendedor');
    }

    if (!sellerConfig) {
      throw new Error('Configurações do vendedor não encontradas. Configure primeiro na aba Configurações.');
    }

    // Definir URL base de acordo com ambiente
    const baseUrl = sellerConfig.ambiente === 'producao' 
      ? 'https://tracken.app.br/tracken/api'
      : 'https://pgsite.com.br/tracken/api';

    // Montar payload completo
    const payload = {
      cnpjCpfTransportadora: sellerConfig.cnpj_transportadora,
      idEnvio: orderData.id_envio,
      idVenda: orderData.id_venda,
      dtCriacao: new Date().toISOString().replace('T', ' ').slice(0, 19),
      vlPago: orderData.valor_pago || 0,
      peso: orderData.peso || 0,
      tipoEndereco: orderData.tipo_endereco || 'I',
      cnpjCpfVendedor: sellerConfig.cnpj_vendedor,
      cliente: sellerConfig.cliente,
      razaoSocial: sellerConfig.razao_social,
      codCliente: sellerConfig.cod_cliente,
      localRetirada: sellerConfig.local_retirada,
      numeroRetirada: sellerConfig.numero_retirada || '',
      complementoRetirada: sellerConfig.complemento_retirada || '',
      bairroRetirada: sellerConfig.bairro_retirada,
      cidadeRetirada: sellerConfig.cidade_retirada,
      estadoRetirada: sellerConfig.estado_retirada,
      cepVendedor: sellerConfig.cep_vendedor,
      cnpjCpfComprador: orderData.cpf_cnpj_comprador || '',
      nomeComprador: orderData.nome_comprador,
      enderecoEntrega: orderData.endereco_entrega,
      bairroEntrega: orderData.bairro_entrega,
      cidadeEntrega: orderData.cidade_entrega,
      estadoEntrega: orderData.estado_entrega,
      cepEntrega: orderData.cep_entrega,
      telefoneComprador: orderData.telefone_comprador,
      codServico: orderData.cod_servico || '2',
      ieVendedor: sellerConfig.ie_vendedor || '',
      chave_nf: orderData.chave_nf || '',
      telefoneVendedor: sellerConfig.telefone_vendedor || '',
      emailVendedor: sellerConfig.email_vendedor || '',
      largura: orderData.largura || 0,
      altura: orderData.altura || 0,
      comprimento: orderData.comprimento || 0,
      volume: orderData.volume || 0
    };

    console.log('Sending payload to J3:', JSON.stringify(payload));

    // Fazer requisição para API J3
    const credentials = btoa(`${j3Username}:${j3Password}`);
    const j3Response = await fetch(`${baseUrl}/pedido`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('J3 API response status:', j3Response.status);

    if (!j3Response.ok) {
      const errorText = await j3Response.text();
      console.error('J3 API error:', errorText);
      throw new Error(`Erro na API J3: ${j3Response.status} - ${errorText}`);
    }

    const j3Data = await j3Response.json();
    console.log('J3 API response:', JSON.stringify(j3Data));

    // Salvar pedido no banco
    const { data: savedOrder, error: saveError } = await supabase
      .from('j3_orders')
      .insert({
        codpedido: j3Data.codpedido,
        id_envio: orderData.id_envio,
        id_venda: orderData.id_venda,
        nome_comprador: orderData.nome_comprador,
        endereco_entrega: orderData.endereco_entrega,
        bairro_entrega: orderData.bairro_entrega,
        cidade_entrega: orderData.cidade_entrega,
        estado_entrega: orderData.estado_entrega,
        cep_entrega: orderData.cep_entrega,
        telefone_comprador: orderData.telefone_comprador,
        cpf_cnpj_comprador: orderData.cpf_cnpj_comprador,
        valor_pago: orderData.valor_pago,
        peso: orderData.peso,
        cod_servico: orderData.cod_servico || '2',
        status: 'enviado',
        api_response: j3Data,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving order:', saveError);
      // Não falha a requisição, pois o pedido foi criado na J3
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: j3Data,
      savedOrder 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in j3-create-order:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
