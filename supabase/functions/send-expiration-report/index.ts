import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BeerBatch {
  id: string;
  beer_name: string;
  lot: string;
  quantity: number;
  expiration_date: string;
}

function getDaysUntilExpiration(expirationDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);
  const diffTime = expDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function categorizeBatches(batches: BeerBatch[]) {
  const expired: BeerBatch[] = [];
  const critical: BeerBatch[] = [];
  const attention: BeerBatch[] = [];
  const alert: BeerBatch[] = [];

  batches.forEach(batch => {
    const days = getDaysUntilExpiration(batch.expiration_date);
    if (days < 0) expired.push(batch);
    else if (days <= 7) critical.push(batch);
    else if (days <= 15) attention.push(batch);
    else if (days <= 30) alert.push(batch);
  });

  return { expired, critical, attention, alert };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function generateHTML(categories: ReturnType<typeof categorizeBatches>): string {
  const { expired, critical, attention, alert } = categories;
  
  const renderTable = (batches: BeerBatch[], color: string) => {
    if (batches.length === 0) return '<p style="color: #666;">Nenhum lote nesta categoria.</p>';
    
    return `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: ${color}; color: white;">
            <th style="padding: 10px; text-align: left;">Cerveja</th>
            <th style="padding: 10px; text-align: left;">Lote</th>
            <th style="padding: 10px; text-align: center;">Qtd</th>
            <th style="padding: 10px; text-align: center;">Validade</th>
          </tr>
        </thead>
        <tbody>
          ${batches.map(b => `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px;">${b.beer_name}</td>
              <td style="padding: 10px;">${b.lot}</td>
              <td style="padding: 10px; text-align: center;">${b.quantity}</td>
              <td style="padding: 10px; text-align: center;">${formatDate(b.expiration_date)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Relatório de Validades - Cerveja Lenta</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1a1a1a;">🍺 Relatório de Validades</h1>
        <p style="color: #666;">Cerveja Lenta - ${new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      ${expired.length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h2 style="color: #dc2626;">🔴 Vencidos (${expired.length} lotes)</h2>
          ${renderTable(expired, '#dc2626')}
        </div>
      ` : ''}

      ${critical.length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h2 style="color: #ea580c;">🟠 Crítico - até 7 dias (${critical.length} lotes)</h2>
          ${renderTable(critical, '#ea580c')}
        </div>
      ` : ''}

      ${attention.length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h2 style="color: #ca8a04;">🟡 Atenção - 8 a 15 dias (${attention.length} lotes)</h2>
          ${renderTable(attention, '#ca8a04')}
        </div>
      ` : ''}

      ${alert.length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h2 style="color: #2563eb;">🔵 Alerta - 16 a 30 dias (${alert.length} lotes)</h2>
          ${renderTable(alert, '#2563eb')}
        </div>
      ` : ''}

      ${expired.length === 0 && critical.length === 0 && attention.length === 0 && alert.length === 0 ? `
        <div style="text-align: center; padding: 40px; background-color: #f0fdf4; border-radius: 8px;">
          <h2 style="color: #16a34a;">✅ Tudo OK!</h2>
          <p style="color: #666;">Nenhum lote com vencimento próximo nos próximos 30 dias.</p>
        </div>
      ` : ''}

      <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
        <p>Relatório gerado automaticamente pelo sistema Cerveja Lenta</p>
      </footer>
    </body>
    </html>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting expiration report generation...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all batches
    const { data: batches, error: batchError } = await supabase
      .from("beer_batches")
      .select("*")
      .order("expiration_date", { ascending: true });

    if (batchError) {
      console.error("Error fetching batches:", batchError);
      throw batchError;
    }

    console.log(`Found ${batches?.length || 0} batches`);

    // Fetch active email recipients
    const { data: emailSettings, error: emailError } = await supabase
      .from("email_settings")
      .select("email")
      .eq("is_active", true);

    if (emailError) {
      console.error("Error fetching email settings:", emailError);
      throw emailError;
    }

    const recipients = emailSettings?.map(e => e.email) || [];
    console.log(`Found ${recipients.length} recipients`);

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Nenhum email cadastrado para receber relatórios" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Categorize and generate report
    const categories = categorizeBatches(batches || []);
    const html = generateHTML(categories);

    // Send email
    const { expired, critical, attention, alert } = categories;
    const totalUrgent = expired.length + critical.length;
    const subject = totalUrgent > 0 
      ? `⚠️ ALERTA: ${totalUrgent} lote(s) com vencimento urgente - Cerveja Lenta`
      : `📊 Relatório de Validades - Cerveja Lenta`;

    const emailResponse = await resend.emails.send({
      from: "Cerveja Lenta <onboarding@resend.dev>",
      to: recipients,
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Relatório enviado para ${recipients.length} destinatário(s)`,
        stats: {
          expired: expired.length,
          critical: critical.length,
          attention: attention.length,
          alert: alert.length
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-expiration-report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
