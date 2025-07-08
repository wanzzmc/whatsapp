// Quick script to test and setup the Telegram bot
const TELEGRAM_BOT_TOKEN = "7755543107:AAG5kuaQXqZAvbVv2UUQSN4qQ60IL5eaMWE";
const TELEGRAM_ADMIN_ID = "7877620348";

async function testBot() {
  try {
    // Test bot info
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
    const botInfo = await response.json();
    
    if (botInfo.ok) {
      console.log("✅ Bot is working!");
      console.log("Bot name:", botInfo.result.username);
      console.log("Bot ID:", botInfo.result.id);
    } else {
      console.log("❌ Bot error:", botInfo.description);
    }
    
    // Send updated menu message to admin
    const menuMessage = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_ADMIN_ID,
        parse_mode: 'HTML',
        text: `🤖 <b>Bot Updated Successfully!</b>

📋 <b>New Commands Available:</b>

🔹 <b>/start</b> - Show main menu
🔹 <b>/adddb [username]</b> - Add user to database
🔹 <b>/adduser [username]</b> - Add user (alias)
🔹 <b>/help</b> - Show detailed help

💡 <b>Try it now:</b>
Send <code>/start</code> to see the new menu!`,
      }),
    });
    
    const messageResult = await menuMessage.json();
    if (messageResult.ok) {
      console.log("✅ Updated menu sent successfully!");
    } else {
      console.log("❌ Failed to send message:", messageResult.description);
    }
    
  } catch (error) {
    console.error("Error testing bot:", error);
  }
}

// Run the test
testBot();