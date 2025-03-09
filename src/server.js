// src/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs-extra');

// Load environment variables with our custom loader
const env = require('../load-env');

// Load telegram settings to see if we should start the bot
const SETTINGS_DIR = path.join(__dirname, '../config');
const TELEGRAM_SETTINGS_PATH = path.join(SETTINGS_DIR, 'telegram.json');
let telegramBot = null;

// Debug environment variables
console.log('ENV DEBUG - ANTHROPIC_API_KEY exists:', env.ANTHROPIC_API_KEY ? 'Yes' : 'No');
if (env.ANTHROPIC_API_KEY) {
  console.log('ENV DEBUG - API Key length:', env.ANTHROPIC_API_KEY.length);
  console.log('ENV DEBUG - API Key starts with sk-:', env.ANTHROPIC_API_KEY.startsWith('sk-'));
}

const apiRoutes = require('./routes/api');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', apiRoutes);

// Admin panel route
app.get('/admin', (req, res) => {
  res.redirect('/admin/index.html');
});

// Root path redirect to admin dashboard
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize Telegram bot if enabled
async function initializeTelegramBot() {
  try {
    // Create config directory if it doesn't exist
    fs.ensureDirSync(SETTINGS_DIR);
    
    // Check if Telegram is enabled in settings
    let telegramSettings = { enabled: false };
    if (fs.existsSync(TELEGRAM_SETTINGS_PATH)) {
      try {
        const settingsContent = await fs.readFile(TELEGRAM_SETTINGS_PATH, 'utf8');
        telegramSettings = JSON.parse(settingsContent);
      } catch (err) {
        console.error('Error parsing Telegram settings:', err);
      }
    }
    
    // If Telegram is enabled and we have a token (either from settings or env)
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN || (telegramSettings.enabled ? telegramSettings.token : null);
    
    if (telegramSettings.enabled && telegramToken) {
      console.log('Initializing Telegram bot integration...');
      telegramBot = require('./telegramBot');
      console.log('Telegram bot started successfully');
    } else {
      console.log('Telegram bot integration is disabled');
    }
  } catch (error) {
    console.error('Failed to initialize Telegram bot:', error);
  }
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`SOLess AI Engine running on port ${PORT}`);
  console.log(`Admin dashboard available at http://localhost:${PORT}/admin`);
  
  // Initialize Telegram bot after server starts
  await initializeTelegramBot();
});
