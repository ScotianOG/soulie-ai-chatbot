// src/routes/api.js
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { Anthropic } = require("@anthropic-ai/sdk");
const { botPersona } = require("../utils/solessKnowledge");
const { generatePrompt } = require("../utils/promptGenerator");
const multer = require("multer");
const fs = require("fs-extra");
const path = require("path");
const { DOCS_DIR } = require("../utils/documentLoader");
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

// Use our custom env loader (already loaded in server.js)
const env = require('../../load-env');

// Initialize Anthropic client
let anthropic = null;
try {
  // Remove any whitespace that might have been added in the .env file
  const apiKey = env.ANTHROPIC_API_KEY ? env.ANTHROPIC_API_KEY.trim() : '';
  
  if (apiKey && 
      apiKey !== 'your-actual-anthropic-api-key' && 
      apiKey.startsWith('sk-')) {
    
    console.log("API key validation passed, initializing Anthropic client");
    
    anthropic = new Anthropic({
      apiKey: apiKey,
    });
    
    console.log("Anthropic API client initialized successfully with latest SDK.");
  } else {
    console.warn("No valid Anthropic API key found. Running in demo mode with mock responses.");
    if (apiKey) {
      console.log("Key format issue - starts with sk-:", apiKey.startsWith('sk-'));
    }
  }
} catch (error) {
  console.error("Error initializing Anthropic client:", error);
}

// In-memory store for conversations
const conversations = new Map();

// Mock response function when API key is not available
function getMockResponse(message) {
  const responses = [
    "Welcome to SOLess! I'm running in demo mode as no API key is configured. In a proper setup, I would provide detailed information about the SOLess project on Solana.",
    "This is a demo response. With a valid Anthropic API key, I would provide helpful information about SOLess features and capabilities.",
    "I'm currently running without an API key. Please add a valid Anthropic API key to your .env file to enable full functionality.",
    "SOLess is a project designed to simplify Solana interactions. In demo mode, I can only provide limited information. Please configure a valid API key for full support.",
    "Thanks for your interest in SOLess! This is a placeholder response. To experience the full capabilities, please configure a valid Anthropic API key."
  ];
  
  // Return a message about being in demo mode, plus a random response
  return `[DEMO MODE] ${responses[Math.floor(Math.random() * responses.length)]}`;
}

// Generate a response using Claude API or mock response if no API key
async function generateResponse(message, conversationId) {
  try {
    // Get or create conversation
    let conversation = conversations.get(conversationId);
    if (!conversation) {
      conversation = {
        id: conversationId,
        messages: [],
        createdAt: new Date(),
      };
      conversations.set(conversationId, conversation);
    }

    // Update conversation history
    conversation.messages.push({ role: "user", content: message });

    let aiResponse;
    
    if (anthropic) {
      // Generate the prompt for Claude (now async)
      const prompt = await generatePrompt(message, conversation.messages);

      // Call Claude API
      const response = await anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
        system: `You are the SOLess project assistant, providing helpful information about the SOLess project on Solana.`,
      });

      // Extract Claude's response
      aiResponse = response.content[0].text;
    } else {
      // Provide a mock response when API key is not available
      aiResponse = getMockResponse(message);
    }
    
    // Save the response to conversation history
    conversation.messages.push({ role: "assistant", content: aiResponse });

    return {
      message: aiResponse,
    };
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, DOCS_DIR);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".pdf" && ext !== ".md" && ext !== ".txt") {
      return cb(new Error("Only PDF, Markdown, and TXT files are allowed"));
    }
    cb(null, true);
  },
});

// API routes - now with async/await
router.post("/conversations", (req, res) => {
  try {
    const conversationId = uuidv4();
    conversations.set(conversationId, {
      id: conversationId,
      messages: [],
      createdAt: new Date(),
    });

    res.status(201).json({ conversationId });
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.get("/conversations/:conversationId", (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = conversations.get(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.status(200).json({
      conversation: {
        id: conversation.id,
        messages: conversation.messages,
      },
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

router.post("/conversations/:conversationId/messages", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const conversation = conversations.get(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const response = await generateResponse(message, conversationId);

    res.status(200).json({
      message: response.message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to process message" });
  }
});

// Add file upload endpoint
router.post("/documents/upload", upload.single("document"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    res.status(200).json({
      message: "File uploaded successfully",
      filename: req.file.originalname,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// Get list of uploaded documents
router.get("/documents", async (req, res) => {
  try {
    const files = await fs.readdir(DOCS_DIR);
    const documents = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return ext === ".pdf" || ext === ".md" || ext === ".txt";
    });

    res.status(200).json({ documents });
  } catch (error) {
    console.error("Error listing documents:", error);
    res.status(500).json({ error: "Failed to list documents" });
  }
});

// Delete a document
router.delete("/documents/:filename", async (req, res) => {
  try {
    const filePath = path.join(DOCS_DIR, req.params.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Document not found" });
    }

    await fs.unlink(filePath);
    res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

// Settings file paths
const SETTINGS_DIR = path.join(__dirname, '../../config');
const PERSONA_SETTINGS_PATH = path.join(SETTINGS_DIR, 'persona.json');
const TELEGRAM_SETTINGS_PATH = path.join(SETTINGS_DIR, 'telegram.json');

// Ensure settings directory exists
fs.ensureDirSync(SETTINGS_DIR);

// Default persona settings
const DEFAULT_PERSONA = {
  name: "SOLess Guide",
  style: "Helpful, knowledgeable about Solana and SOLess, technically accurate but approachable",
  background: "Technical expert on the SOLess project and Solana ecosystem"
};

// Default telegram settings
const DEFAULT_TELEGRAM = {
  enabled: false,
  token: "",
  status: "inactive"
};

// Helper function to load settings file
async function loadSettingsFile(filePath, defaultSettings) {
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = await fs.readFile(filePath, 'utf8');
      return JSON.parse(fileContent);
    }
    // If file doesn't exist, create it with default settings
    await fs.writeFile(filePath, JSON.stringify(defaultSettings, null, 2));
    return defaultSettings;
  } catch (error) {
    console.error(`Error loading settings file ${filePath}:`, error);
    return defaultSettings;
  }
}

// Helper function to save settings file
async function saveSettingsFile(filePath, settings) {
  try {
    await fs.writeFile(filePath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error(`Error saving settings file ${filePath}:`, error);
    throw error;
  }
}

// Get persona settings
router.get("/settings/persona", async (req, res) => {
  try {
    const personaSettings = await loadSettingsFile(PERSONA_SETTINGS_PATH, DEFAULT_PERSONA);
    res.status(200).json({ persona: personaSettings });
  } catch (error) {
    console.error("Error fetching persona settings:", error);
    res.status(500).json({ error: "Failed to fetch persona settings" });
  }
});

// Update persona settings
router.post("/settings/persona", async (req, res) => {
  try {
    const { persona } = req.body;
    
    if (!persona || typeof persona !== 'object') {
      return res.status(400).json({ error: "Invalid persona settings" });
    }
    
    // Validate required fields
    if (!persona.name || !persona.style || !persona.background) {
      return res.status(400).json({ error: "Name, style, and background are required" });
    }
    
    // Save to file
    await saveSettingsFile(PERSONA_SETTINGS_PATH, persona);
    
    // Update the loaded persona in memory
    Object.assign(botPersona, persona);
    
    res.status(200).json({ 
      success: true, 
      message: "Persona settings updated successfully" 
    });
  } catch (error) {
    console.error("Error updating persona settings:", error);
    res.status(500).json({ error: "Failed to update persona settings" });
  }
});

// Get telegram settings
router.get("/settings/telegram", async (req, res) => {
  try {
    const telegramSettings = await loadSettingsFile(TELEGRAM_SETTINGS_PATH, DEFAULT_TELEGRAM);
    
    // Check telegram status if enabled
    if (telegramSettings.enabled && telegramSettings.token) {
      // Set status based on environment variable matching
      if (process.env.TELEGRAM_BOT_TOKEN === telegramSettings.token) {
        telegramSettings.status = "connected";
      } else {
        telegramSettings.status = "inactive";
        telegramSettings.message = "Telegram bot needs server restart to apply new settings";
      }
    } else {
      telegramSettings.status = "inactive";
    }
    
    res.status(200).json(telegramSettings);
  } catch (error) {
    console.error("Error fetching telegram settings:", error);
    res.status(500).json({ error: "Failed to fetch telegram settings" });
  }
});

// Update telegram settings
router.post("/settings/telegram", async (req, res) => {
  try {
    const { enabled, token } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: "Invalid enabled status" });
    }
    
    // If enabled, token is required
    if (enabled && (!token || token.trim() === '')) {
      return res.status(400).json({ error: "Telegram bot token is required when enabled" });
    }
    
    // Create settings object
    const telegramSettings = {
      enabled,
      token: token || "",
      status: "inactive"
    };
    
    // Save to file
    await saveSettingsFile(TELEGRAM_SETTINGS_PATH, telegramSettings);
    
    // Update .env file with the token
    if (enabled && token) {
      try {
        // Read current .env file
        const envPath = path.join(__dirname, '../../.env');
        let envContent = '';
        
        if (fs.existsSync(envPath)) {
          envContent = await fs.readFile(envPath, 'utf8');
        }
        
        // Check if TELEGRAM_BOT_TOKEN already exists
        if (envContent.includes('TELEGRAM_BOT_TOKEN=')) {
          // Replace existing token
          envContent = envContent.replace(
            /TELEGRAM_BOT_TOKEN=.*/,
            `TELEGRAM_BOT_TOKEN=${token}`
          );
        } else {
          // Add new token
          envContent += `\nTELEGRAM_BOT_TOKEN=${token}`;
        }
        
        // Save updated .env
        await fs.writeFile(envPath, envContent);
        
        telegramSettings.status = "inactive";
        telegramSettings.message = "Token updated in .env file. Restart server to apply changes.";
      } catch (envError) {
        console.error("Error updating .env file:", envError);
        telegramSettings.status = "error";
        telegramSettings.message = "Could not update .env file";
      }
    } else if (!enabled) {
      telegramSettings.status = "inactive";
      telegramSettings.message = "Telegram bot is disabled";
    }
    
    res.status(200).json(telegramSettings);
  } catch (error) {
    console.error("Error updating telegram settings:", error);
    res.status(500).json({ error: "Failed to update telegram settings" });
  }
});

module.exports = router;
