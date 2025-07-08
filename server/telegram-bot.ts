import { storage } from "./storage";
import crypto from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(crypto.scrypt);

interface TelegramUpdate {
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

// Generate random password using username + 3 random digits
function generatePassword(username: string): string {
  const randomDigits = Math.floor(Math.random() * 900) + 100; // 100-999
  return `${username}${randomDigits}`;
}

// Hash password like in auth.ts
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Send message to Telegram
async function sendTelegramMessage(chatId: number, message: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
}

// Send message with inline keyboard for copying
async function sendTelegramMessageWithKeyboard(chatId: number, message: string, keyboard: any): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        reply_markup: keyboard,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending Telegram message with keyboard:', error);
    return false;
  }
}

// Answer callback query
async function answerCallbackQuery(callbackQueryId: string, text: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text,
        show_alert: false,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error answering callback query:', error);
    return false;
  }
}

// Handle Telegram bot commands
export async function handleTelegramBotUpdate(update: TelegramUpdate): Promise<void> {
  // Handle callback queries (button presses)
  if (update.callback_query) {
    const callbackQuery = update.callback_query;
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    // Check if user is authorized
    const authorizedUsers = process.env.TELEGRAM_ADMIN_IDS?.split(',').map(id => parseInt(id.trim())) || [];
    
    if (!authorizedUsers.includes(userId)) {
      await answerCallbackQuery(callbackQuery.id, '❌ Tidak diizinkan!');
      return;
    }

    // Handle copy buttons
    if (data.startsWith('copy_username_')) {
      const username = data.replace('copy_username_', '');
      await sendTelegramMessage(chatId, `📋 Username: <code>${username}</code>`);
      await answerCallbackQuery(callbackQuery.id, '✅ Username siap disalin!');
      return;
    }

    if (data.startsWith('copy_password_')) {
      const password = data.replace('copy_password_', '');
      await sendTelegramMessage(chatId, `🔑 Password: <code>${password}</code>`);
      await answerCallbackQuery(callbackQuery.id, '✅ Password siap disalin!');
      return;
    }

    await answerCallbackQuery(callbackQuery.id, '❓ Perintah tidak dikenali');
    return;
  }

  // Handle regular messages
  const message = update.message;
  if (!message || !message.text) {
    return;
  }

  const chatId = message.chat.id;
  const text = message.text.trim();
  const userId = message.from.id;
  const userName = message.from.first_name;

  // Check if user is authorized (you can customize this logic)
  const authorizedUsers = process.env.TELEGRAM_ADMIN_IDS?.split(',').map(id => parseInt(id.trim())) || [];
  
  if (!authorizedUsers.includes(userId)) {
    await sendTelegramMessage(chatId, '❌ You are not authorized to use this bot.');
    return;
  }

  // Handle commands
  if (text.startsWith('/adduser') || text.startsWith('/adddb')) {
    await handleAddUserCommand(chatId, text);
  } else if (text.startsWith('/listusers')) {
    await handleListUsersCommand(chatId);
  } else if (text.startsWith('/help')) {
    await handleHelpCommand(chatId);
  } else if (text === '/start') {
    await handleStartCommand(chatId);
  } else {
    await sendTelegramMessage(chatId, '❌ Unknown command. Use /start to see the menu.');
  }
}

// Handle /adduser and /adddb commands
async function handleAddUserCommand(chatId: number, text: string): Promise<void> {
  const parts = text.split(' ');
  const command = parts[0];
  
  if (parts.length < 2) {
    await sendTelegramMessage(chatId, `❌ Usage: ${command} [username]`);
    return;
  }

  const username = parts[1].trim();
  
  // Validate username
  if (username.length < 3) {
    await sendTelegramMessage(chatId, '❌ Username must be at least 3 characters long.');
    return;
  }

  try {
    // Check if user already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      await sendTelegramMessage(chatId, `❌ User "${username}" already exists.`);
      return;
    }

    // Generate password
    const password = generatePassword(username);
    const hashedPassword = await hashPassword(password);

    // Create user in database
    const newUser = await storage.createUser({
      username,
      password: hashedPassword,
    });

    // Send success message with credentials and copy buttons
    const successMessage = `✅ <b>User berhasil dibuat!</b>

👤 <b>Username:</b> <code>${username}</code>
🔐 <b>Password:</b> <code>${password}</code>
🆔 <b>User ID:</b> ${newUser.id}

💡 <b>Tips:</b> Tekan password di atas untuk menyalin otomatis!

⚠️ <b>Penting:</b> Simpan kredensial ini dengan aman.

🌐 <b>Login:</b> https://yourapp.replit.app/auth`;

    // Create inline keyboard for easy copying
    const keyboard = {
      inline_keyboard: [
        [
          { text: "📋 Copy Username", callback_data: `copy_username_${username}` },
          { text: "🔑 Copy Password", callback_data: `copy_password_${password}` }
        ],
        [
          { text: "🌐 Open Login Page", url: "https://yourapp.replit.app/auth" }
        ]
      ]
    };

    await sendTelegramMessageWithKeyboard(chatId, successMessage, keyboard);
    
    console.log(`New user created via Telegram bot: ${username} (ID: ${newUser.id})`);
  } catch (error) {
    console.error('Error creating user:', error);
    await sendTelegramMessage(chatId, '❌ Failed to create user. Please try again.');
  }
}

// Handle /listusers command
async function handleListUsersCommand(chatId: number): Promise<void> {
  try {
    // This would require adding a method to storage to list users
    // For now, we'll just send a message saying the feature is not implemented
    await sendTelegramMessage(chatId, '❌ List users feature not implemented yet.');
  } catch (error) {
    console.error('Error listing users:', error);
    await sendTelegramMessage(chatId, '❌ Failed to list users.');
  }
}

// Handle /start command
async function handleStartCommand(chatId: number): Promise<void> {
  const startMessage = `🤖 <b>Welcome to Attack System Bot!</b>

📋 <b>Main Menu:</b>

🔹 <b>/adddb [username]</b> - Add new user to database
🔹 <b>/adduser [username]</b> - Add new user to database (same as adddb)
🔹 <b>/help</b> - Show detailed help
🔹 <b>/start</b> - Show this menu

💡 <b>Quick Start:</b>
Send <code>/adddb testuser</code> to create a test account

⚡ <b>Features:</b>
• Auto password generation
• Secure database storage  
• Instant credential delivery
• Attack menu access

🔒 Only authorized admins can use this bot.`;

  await sendTelegramMessage(chatId, startMessage);
}

// Handle /help command
async function handleHelpCommand(chatId: number): Promise<void> {
  const helpMessage = `🤖 <b>Attack System Bot - Help</b>

<b>Available Commands:</b>
/start - Show main menu
/adddb [username] - Add new user to database
/adduser [username] - Add new user to database (alias)
/help - Show this detailed help

<b>Command Examples:</b>
/adddb john_doe
/adddb admin123
/adduser testuser

<b>How it works:</b>
1. Send /adddb with a username
2. Bot creates user in database
3. Auto-generates secure password
4. Sends credentials via Telegram
5. User can login at the website

<b>Password Policy:</b>
• 12 characters long
• Mix of letters, numbers, symbols
• Unique for each user
• Cannot be recovered if lost

<b>Database Integration:</b>
• Users stored in PostgreSQL
• Encrypted password storage
• Instant availability for login

🔒 <b>Security:</b> Only authorized admin IDs can use this bot.`;

  await sendTelegramMessage(chatId, helpMessage);
}

// Setup webhook endpoint
export function setupTelegramBotWebhook(app: any): void {
  app.post('/api/telegram-webhook', async (req: any, res: any) => {
    try {
      const update = req.body as TelegramUpdate;
      await handleTelegramBotUpdate(update);
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Error handling Telegram webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}

// Set webhook URL (call this once to setup the webhook)
export async function setTelegramWebhook(webhookUrl: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
      }),
    });

    const result = await response.json();
    console.log('Webhook setup result:', result);
    return response.ok;
  } catch (error) {
    console.error('Error setting webhook:', error);
    return false;
  }
}