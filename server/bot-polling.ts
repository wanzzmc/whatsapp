import { handleTelegramBotUpdate } from "./telegram-bot";

let isPolling = false;
let pollingInterval: NodeJS.Timeout | null = null;

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    message: {
      message_id: number;
      chat: {
        id: number;
        type: string;
      };
    };
    data: string;
  };
}

// Get updates from Telegram using long polling
async function getUpdates(offset?: number): Promise<TelegramUpdate[]> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    return [];
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/getUpdates?offset=${offset || 0}&timeout=30`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.ok) {
      return data.result || [];
    } else {
      console.error('Failed to get updates:', data.description);
      return [];
    }
  } catch (error) {
    console.error('Error getting updates:', error);
    return [];
  }
}

// Start polling for updates
export async function startBotPolling(): Promise<void> {
  if (isPolling) {
    console.log('Bot polling already active');
    return;
  }

  console.log('🤖 Starting Telegram bot polling...');
  isPolling = true;
  let lastUpdateId = 0;

  const poll = async () => {
    if (!isPolling) return;

    try {
      const updates = await getUpdates(lastUpdateId + 1);
      
      for (const update of updates) {
        lastUpdateId = Math.max(lastUpdateId, update.update_id);
        
        if (update.message) {
          console.log(`📨 Received message from ${update.message.from.first_name}: ${update.message.text}`);
          await handleTelegramBotUpdate(update);
        } else if (update.callback_query) {
          console.log(`🔘 Received callback query from ${update.callback_query.from.first_name}: ${update.callback_query.data}`);
          await handleTelegramBotUpdate(update);
        }
      }
    } catch (error) {
      console.error('Error in polling:', error);
    }

    // Continue polling
    if (isPolling) {
      setTimeout(poll, 1000); // Poll every second
    }
  };

  poll();
}

// Stop polling
export function stopBotPolling(): void {
  console.log('🛑 Stopping Telegram bot polling...');
  isPolling = false;
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

// Check if polling is active
export function isBotPolling(): boolean {
  return isPolling;
}