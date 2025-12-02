import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

interface WhatsAppSetting {
  phone_number: string;
  apikey: string;
}

const getDaysUntilExpiration = (expirationDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);
  const diffTime = expDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const categorizeBatches = (batches: BeerBatch[]) => {
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
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
};

const generateTextMessage = (categories: ReturnType<typeof categorizeBatches>): string => {
  const { expired, critical, attention, alert } = categories;
  const totalItems = expired.length + critical.length + attention.length + alert.length;

  if (totalItems === 0) {
    return "✅ *Relatório de Validades*\n\nNenhum produto com vencimento próximo nos próximos 30 dias.";
  }

  let message = "🍺 *RELATÓRIO DE VALIDADES*\n_Cerveja Lenta_\n\n";

  if (expired.length > 0) {
    message += "🔴 *VENCIDOS*\n";
    expired.forEach(b => {
      const days = Math.abs(getDaysUntilExpiration(b.expiration_date));
      message += `• ${b.beer_name} (Lote: ${b.lot}) - ${b.quantity}un - Vencido há ${days} dias\n`;
    });
    message += "\n";
  }

  if (critical.length > 0) {
    message += "🟠 *CRÍTICO (até 7 dias)*\n";
    critical.forEach(b => {
      const days = getDaysUntilExpiration(b.expiration_date);
      message += `• ${b.beer_name} (Lote: ${b.lot}) - ${b.quantity}un - ${days} dias\n`;
    });
    message += "\n";
  }

  if (attention.length > 0) {
    message += "🟡 *ATENÇÃO (8-15 dias)*\n";
    attention.forEach(b => {
      const days = getDaysUntilExpiration(b.expiration_date);
      message += `• ${b.beer_name} (Lote: ${b.lot}) - ${b.quantity}un - ${days} dias\n`;
    });
    message += "\n";
  }

  if (alert.length > 0) {
    message += "🟢 *ALERTA (16-30 dias)*\n";
    alert.forEach(b => {
      const days = getDaysUntilExpiration(b.expiration_date);
      message += `• ${b.beer_name} (Lote: ${b.lot}) - ${b.quantity}un - ${days} dias\n`;
    });
    message += "\n";
  }

  const now = new Date();
  message += `\n📅 _Gerado em ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}_`;

  return message;
};

const sendWhatsAppMessage = async (phone: string, apikey: string, message: string): Promise<boolean> => {
  try {
    const encodedMessage = encodeURIComponent(message);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodedMessage}&apikey=${apikey}`;
    
    console.log(`Sending WhatsApp message to ${phone}`);
    
    const response = await fetch(url);
    const responseText = await response.text();
    
    console.log(`CallMeBot response for ${phone}:`, responseText);
    
    return response.ok || responseText.includes("Message queued");
  } catch (error) {
    console.error(`Error sending WhatsApp to ${phone}:`, error);
    return false;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch beer batches
    const { data: batches, error: batchesError } = await supabase
      .from("beer_batches")
      .select("*")
      .order("expiration_date", { ascending: true });

    if (batchesError) {
      console.error("Error fetching batches:", batchesError);
      throw new Error("Failed to fetch beer batches");
    }

    // Fetch active WhatsApp numbers
    const { data: whatsappNumbers, error: whatsappError } = await supabase
      .from("whatsapp_settings")
      .select("phone_number, apikey")
      .eq("is_active", true);

    if (whatsappError) {
      console.error("Error fetching WhatsApp numbers:", whatsappError);
      throw new Error("Failed to fetch WhatsApp numbers");
    }

    if (!whatsappNumbers || whatsappNumbers.length === 0) {
      console.log("No active WhatsApp numbers configured");
      return new Response(
        JSON.stringify({ success: false, message: "Nenhum número de WhatsApp ativo configurado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate message
    const categories = categorizeBatches(batches || []);
    const message = generateTextMessage(categories);

    console.log("Message to send:", message);

    // Send to all active numbers
    const results = await Promise.all(
      whatsappNumbers.map(async (wp: WhatsAppSetting) => {
        const success = await sendWhatsAppMessage(wp.phone_number, wp.apikey, message);
        return { phone: wp.phone_number, success };
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    console.log(`WhatsApp report sent: ${successCount} success, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Relatório enviado para ${successCount} número(s)`,
        results
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-whatsapp-report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
