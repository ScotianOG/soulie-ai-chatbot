// src/telegramBot.js
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Check for required environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = 'http://localhost:3000/api'; // Adjust if needed

if (!TELEGRAM_BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is required. Please add it to your .env file.');
  process.exit(1);
}

console.log('Starting SOLess Project Bot...');

// Initialize bot
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Store active conversations
const conversations = new Map();

// Welcome message
const WELCOME_MESSAGE = `
*Welcome to the SOLess Project Bot!*

I'm here to answer your questions about the SOLess project on Solana.

How can I help you today?
`;

// Start command handler
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    // Create a new conversation
    const response = await axios.post(`${API_URL}/conversations`);
    const conversationId = response.data.conversationId;
    
    // Store the conversation
    conversations.set(chatId, conversationId);
    
    // Send welcome message
    await bot.sendMessage(chatId, WELCOME_MESSAGE, { parse_mode: 'Markdown' });
    
    console.log(`New conversation started: ${chatId} -> ${conversationId}`);
  } catch (error) {
    console.error('Error starting conversation:', error.message);
    await bot.sendMessage(
      chatId, 
      "Sorry, I'm having trouble connecting. Please try again later.",
      { parse_mode: 'Markdown' }
    );
  }
});

// Handle all text messages
bot.on('message', async (msg) => {
  // Skip if not text or is a command
  if (!msg.text || msg.text.startsWith('/')) return;
  
  const chatId = msg.chat.id;
  const userMessage = msg.text;
  
  // Get conversation ID or create new one
  let conversationId = conversations.get(chatId);
  if (!conversationId) {
    try {
      const response = await axios.post(`${API_URL}/conversations`);
      conversationId = response.data.conversationId;
      conversations.set(chatId, conversationId);
    } catch (error) {
      console.error('Error creating conversation:', error.message);
      await bot.sendMessage(
        chatId, 
        "Sorry, I'm having trouble connecting. Please try again later.",
        { parse_mode: 'Markdown' }
      );
      return;
    }
  }
  
  try {
    // Show typing indicator
    bot.sendChatAction(chatId, 'typing');
    
    // Send message to API
    const response = await axios.post(
      `${API_URL}/conversations/${conversationId}/messages`,
      { message: userMessage }
    );
    
    // Get response
    const { message } = response.data;
    
    // Send message
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
    console.log(`Message processed for ${chatId}`);
  } catch (error) {
    console.error('Error processing message:', error.message);
    await bot.sendMessage(
      chatId, 
      "Sorry, I couldn't process your message. Please try again later.",
      { parse_mode: 'Markdown' }
    );
  }
});

// Help command
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
*SOLess Project Bot Help*

I can answer your questions about the SOLess project on Solana.

Commands:
/start - Start or restart our conversation
/help - Show this help message
/about - Learn about the SOLess project

Just ask me anything about SOLess!
`;
  
  await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// About command
bot.onText(/\/about/, async (msg) => {
  const chatId = msg.chat.id;
  const aboutMessage = `
*About SOLess Project*

SOLess is [brief description of your project].

[Include a short paragraph about your project's main features]

For more information, visit [your website or resources].
`;
  
  await bot.sendMessage(chatId, aboutMessage, { parse_mode: 'Markdown' });
});

console.log('SOLess Project Bot is running...');

// Export the bot for standalone or integrated usage
module.exports = bot;