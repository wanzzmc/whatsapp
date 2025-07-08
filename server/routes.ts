import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupTelegramBotWebhook, setTelegramWebhook } from "./telegram-bot";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Setup Telegram bot webhook
  setupTelegramBotWebhook(app);

  // Telegram bot integration endpoint
  app.post("/api/send-telegram", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { command, targetNumber } = req.body;
    
    if (!command || !targetNumber) {
      return res.status(400).json({ message: "Missing command or target number" });
    }

    try {
      // Send simple command format
      const telegramMessage = `/${command} ${targetNumber}`;
      
      // Get tokens for both bots
      const axoragacorBotToken = process.env.AXORAGACOR_BOT_TOKEN;
      const adminIds = process.env.TELEGRAM_ADMIN_IDS?.split(',') || [];
      const adminId = adminIds[0]; // Use first admin ID
      
      if (!adminId) {
        return res.status(500).json({ message: "Admin ID not configured" });
      }

      // Use SENDER_BOT_TOKEN (sendersukimay_bot) to send message
      const senderBotToken = process.env.SENDER_BOT_TOKEN;
      
      if (senderBotToken) {
        // Send message using sender bot to group
        const senderUrl = `https://api.telegram.org/bot${senderBotToken}/sendMessage`;
        
        const senderResponse = await fetch(senderUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: process.env.AXORAGACOR_CHAT_ID || '-1002875645772',
            text: telegramMessage,
          }),
        });

        if (!senderResponse.ok) {
          const errorData = await senderResponse.json();
          console.error('Sender bot error:', errorData);
          throw new Error(`Failed to send message via sender bot: ${errorData.description || 'Unknown error'}`);
        }

        const senderResult = await senderResponse.json();
        return res.json({ 
          message: `Attack command sent by sender bot: ${telegramMessage}`,
          telegramResponse: senderResult,
          chatId: process.env.AXORAGACOR_CHAT_ID || 'default'
        });
      } else {
        // Fallback: send to admin through our bot
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
          return res.status(500).json({ message: "Telegram bot not configured" });
        }

        const instructionMessage = `🤖 PESAN OTOMATIS UNTUK @axoragacor_bot:\n\n${telegramMessage}\n\n⚡ Silakan forward pesan ini ke @axoragacor_bot untuk eksekusi attack`;
        
        const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        
        const response = await fetch(telegramUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: adminId,
            text: instructionMessage,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message to Telegram');
        }

        const result = await response.json();
        return res.json({ 
          message: `Command sent to admin for forwarding to @axoragacor_bot: ${telegramMessage}`,
          telegramResponse: result 
        });
      }
    } catch (error) {
      console.error('Telegram API error:', error);
      res.status(500).json({ 
        message: "Failed to send command to Telegram bot" 
      });
    }
  });

  // Debug endpoint to get sender bot updates and find group chat ID
  app.get("/api/debug/sender-updates", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const senderBotToken = process.env.SENDER_BOT_TOKEN;
      if (!senderBotToken) {
        return res.status(500).json({ message: "Sender bot not configured" });
      }

      const updatesUrl = `https://api.telegram.org/bot${senderBotToken}/getUpdates?limit=20`;
      const response = await fetch(updatesUrl);
      const data = await response.json();

      return res.json(data);
    } catch (error) {
      console.error('Error getting sender bot updates:', error);
      return res.status(500).json({ message: "Failed to get updates" });
    }
  });

  // Endpoint to setup bot webhook
  app.post("/api/setup-bot-webhook", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { webhookUrl } = req.body;
    
    if (!webhookUrl) {
      return res.status(400).json({ message: "Missing webhook URL" });
    }

    try {
      const success = await setTelegramWebhook(webhookUrl);
      if (success) {
        res.json({ success: true, message: "Webhook setup successfully" });
      } else {
        res.status(500).json({ message: "Failed to setup webhook" });
      }
    } catch (error) {
      console.error('Setup webhook error:', error);
      res.status(500).json({ message: "Error setting up webhook" });
    }
  });

  // Endpoint to check bot status
  app.get("/api/bot-status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminIds = process.env.TELEGRAM_ADMIN_IDS;
    
    res.json({
      botConfigured: !!botToken,
      adminConfigured: !!adminIds,
      webhookEndpoint: "/api/telegram-webhook"
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
