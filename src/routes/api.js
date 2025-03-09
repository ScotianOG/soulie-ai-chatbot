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

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// In-memory store for conversations
const conversations = new Map();

// Generate a response using Claude API
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

    // Generate the prompt for Claude (now async)
    const prompt = await generatePrompt(message, conversation.messages);

    // Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
      system: `You are the SOLess project assistant, providing helpful information about the SOLess project on Solana.`,
    });

    // Extract and save Claude's response
    const aiResponse = response.content[0].text;
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

module.exports = router;
