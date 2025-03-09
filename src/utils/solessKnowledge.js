// src/utils/solessKnowledge.js
const { loadAllDocuments } = require('./documentLoader');

// Single persona configuration for the SOLess bot
const botPersona = {
  name: "SOLess Guide",
  style: "Helpful, knowledgeable about Solana and SOLess, technically accurate but approachable",
  background: "Technical expert on the SOLess project and Solana ecosystem"
};

// Core SOLess information (this will be combined with document content)
const coreInfo = `
# SOLess Project

## Core Concept
SOLess is a project designed to [describe main purpose].

[Add any essential information that might not be in your documents]
`;

// Function to get combined knowledge
async function getKnowledgeBase() {
  try {
    const documentContent = await loadAllDocuments();
    return `${coreInfo}\n\n${documentContent}`;
  } catch (error) {
    console.error('Error getting knowledge base:', error);
    return coreInfo;
  }
}

module.exports = {
  botPersona,
  getKnowledgeBase,
  coreInfo
};