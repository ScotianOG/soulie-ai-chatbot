// src/utils/documentLoader.js
const fs = require('fs-extra');
const path = require('path');
const pdfParse = require('pdf-parse');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();

// Define a documents directory
const DOCS_DIR = path.join(__dirname, '../../docs');

// Ensure the docs directory exists
fs.ensureDirSync(DOCS_DIR);

// Process a PDF file
async function processPdf(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error(`Error processing PDF ${filePath}:`, error);
    return '';
  }
}

// Process a Markdown file
async function processMarkdown(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const result = md.render(content);
    // Convert HTML to plain text (simple approach)
    const plainText = result.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return plainText;
  } catch (error) {
    console.error(`Error processing Markdown ${filePath}:`, error);
    return '';
  }
}

// Process a text file
async function processText(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    console.error(`Error processing text file ${filePath}:`, error);
    return '';
  }
}

// Load all documents from the docs directory
async function loadAllDocuments() {
  try {
    // Check if directory exists
    if (!fs.existsSync(DOCS_DIR)) {
      console.log('Documents directory not found, creating it.');
      fs.mkdirSync(DOCS_DIR, { recursive: true });
      return 'No documents found. Please add documents to the docs directory.';
    }

    const files = await fs.readdir(DOCS_DIR);
    let combinedContent = '';

    for (const file of files) {
      const filePath = path.join(DOCS_DIR, file);
      const fileStats = await fs.stat(filePath);
      
      if (fileStats.isFile()) {
        const extension = path.extname(file).toLowerCase();
        let content = '';
        
        if (extension === '.pdf') {
          content = await processPdf(filePath);
        } else if (extension === '.md') {
          content = await processMarkdown(filePath);
        } else if (extension === '.txt' || extension === '.text') {
          content = await processText(filePath);
        }
        
        if (content) {
          combinedContent += `\n\n# Document: ${file}\n${content}`;
        }
      }
    }

    return combinedContent || 'No readable documents found.';
  } catch (error) {
    console.error('Error loading documents:', error);
    return 'Error loading documents.';
  }
}

module.exports = {
  loadAllDocuments,
  processPdf,
  processMarkdown,
  processText,
  DOCS_DIR
};