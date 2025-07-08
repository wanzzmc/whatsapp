// Script to set up webhook for the Telegram bot
const TELEGRAM_BOT_TOKEN = "7755543107:AAG5kuaQXqZAvbVv2UUQSN4qQ60IL5eaMWE";

async function setupWebhook() {
  try {
    // Get the Replit URL - you'll need to replace this with your actual Replit app URL
    const webhookUrl = "https://5000-idx-rest-express-1751895439854.cluster-w4c6fbzsvdxsyqzqmrxjce27zq.cloudworkstations.dev/api/telegram-webhook";
    
    console.log("Setting up webhook...");
    console.log("Webhook URL:", webhookUrl);
    
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
      }),
    });

    const result = await response.json();
    
    if (result.ok) {
      console.log("✅ Webhook set up successfully!");
      console.log("Description:", result.description);
    } else {
      console.log("❌ Failed to set webhook:", result.description);
    }
    
    // Test webhook info
    const webhookInfo = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
    const webhookResult = await webhookInfo.json();
    
    if (webhookResult.ok) {
      console.log("\n📋 Webhook Info:");
      console.log("URL:", webhookResult.result.url);
      console.log("Has custom certificate:", webhookResult.result.has_custom_certificate);
      console.log("Pending update count:", webhookResult.result.pending_update_count);
      if (webhookResult.result.last_error_message) {
        console.log("Last error:", webhookResult.result.last_error_message);
      }
    }
    
  } catch (error) {
    console.error("Error setting up webhook:", error);
  }
}

setupWebhook();