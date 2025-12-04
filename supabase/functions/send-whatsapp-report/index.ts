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

const sendWhatsAppMessage = async (phone: string, apikey: string, message: string): Promise<{success: boolean, response: string, attempts: number}> => {
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds
  const timeout = 30000; // 30 seconds
  let lastResponse = '';
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[WhatsApp] Attempt ${attempt}/${maxRetries} - Sending to ${phone}`);
      
      const encodedMessage = encodeURIComponent(message);
      const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodedMessage}&apikey=${apikey}`;
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`[WhatsApp] Request timeout after ${timeout}ms`);
        controller.abort();
      }, timeout);
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const responseText = await response.text();
      lastResponse = responseText;
      
      console.log(`[WhatsApp] CallMeBot response (attempt ${attempt}):`, {
        status: response.status,
        statusText: response.statusText,
        body: responseText.substring(0, 500) // Log first 500 chars
      });
      
      // More specific success validation
      const successIndicators = [
        "Message sent",
        "Message queued", 
        "OK",
        "success"
      ];
      
      const isSuccess = response.ok && successIndicators.some(indicator => 
        responseText.toLowerCase().includes(indicator.toLowerCase())
      );
      
      if (isSuccess) {
        console.log(`[WhatsApp] ✅ Successfully sent to ${phone} on attempt ${attempt}`);
        return { success: true, response: responseText, attempts: attempt };
      }
      
      // Check for specific error messages
      if (responseText.includes("Invalid API key") || responseText.includes("API key")) {
        console.log(`[WhatsApp] ❌ Invalid API key for ${phone}, skipping retries`);
        return { success: false, response: "Invalid API key", attempts: attempt };
      }
      
      if (responseText.includes("not activated") || responseText.includes("Phone not activated")) {
        console.log(`[WhatsApp] ❌ Phone not activated for ${phone}, skipping retries`);
        return { success: false, response: "Phone not activated on CallMeBot", attempts: attempt };
      }
      
      // If not success and we have retries left, wait and try again
      if (attempt < maxRetries) {
        console.log(`[WhatsApp] ⚠️ Attempt ${attempt} failed, retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    } catch (error: any) {
      const errorMessage = error.name === 'AbortError' ? 'Request timeout' : error.message;
      console.error(`[WhatsApp] ❌ Error on attempt ${attempt}:`, errorMessage);
      lastResponse = errorMessage;
      
      if (attempt < maxRetries) {
        console.log(`[WhatsApp] Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  console.log(`[WhatsApp] ❌ All ${maxRetries} attempts failed for ${phone}`);
  return { success: false, response: lastResponse, attempts: maxRetries };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log(`[WhatsApp] ====== Starting WhatsApp report at ${new Date().toISOString()} ======`);

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
      console.error("[WhatsApp] Error fetching batches:", batchesError);
      throw new Error("Failed to fetch beer batches");
    }

    console.log(`[WhatsApp] Found ${batches?.length || 0} beer batches`);

    // Fetch active WhatsApp numbers
    const { data: whatsappNumbers, error: whatsappError } = await supabase
      .from("whatsapp_settings")
      .select("phone_number, apikey")
      .eq("is_active", true);

    if (whatsappError) {
      console.error("[WhatsApp] Error fetching WhatsApp numbers:", whatsappError);
      throw new Error("Failed to fetch WhatsApp numbers");
    }

    if (!whatsappNumbers || whatsappNumbers.length === 0) {
      console.log("[WhatsApp] No active WhatsApp numbers configured");
      return new Response(
        JSON.stringify({ success: false, message: "Nenhum número de WhatsApp ativo configurado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[WhatsApp] Found ${whatsappNumbers.length} active WhatsApp number(s)`);

    // Generate message
    const categories = categorizeBatches(batches || []);
    const message = generateTextMessage(categories);

    console.log(`[WhatsApp] Message length: ${message.length} characters`);

    // Send to all active numbers
    const results = await Promise.all(
      whatsappNumbers.map(async (wp: WhatsAppSetting) => {
        const result = await sendWhatsAppMessage(wp.phone_number, wp.apikey, message);
        return { 
          phone: wp.phone_number, 
          success: result.success, 
          response: result.response,
          attempts: result.attempts
        };
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    const totalTime = Date.now() - startTime;

    console.log(`[WhatsApp] ====== Report complete ======`);
    console.log(`[WhatsApp] Success: ${successCount}, Failed: ${failedCount}, Total time: ${totalTime}ms`);

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        message: `Relatório enviado para ${successCount} número(s)${failedCount > 0 ? `, ${failedCount} falha(s)` : ''}`,
        results,
        executionTime: totalTime
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[WhatsApp] Error in send-whatsapp-report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
