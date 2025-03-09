// src/utils/promptGenerator.js
const { botPersona, getKnowledgeBase } = require('./solessKnowledge');

/**
 * Generate a prompt for Claude based on the user message
 */
async function generatePrompt(message, conversationHistory = []) {
  // Get knowledge from documents
  const knowledge = await getKnowledgeBase();
  
  const formattedHistory = conversationHistory.map(msg => 
    `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
  ).join('\n\n');

  // Main prompt template
  const prompt = `
You are a knowledgeable assistant named "${botPersona.name}" for the SOLess project. 
Your communication style is: ${botPersona.style}

You have the following knowledge about SOLess:

${knowledge}

Some key principles to follow:
1. Provide accurate information about the SOLess project based on the provided knowledge
2. If you don't know something specific or it's not in the provided knowledge, acknowledge it rather than making up details
3. Be helpful and focus on answering the user's questions directly
4. Use technical language when appropriate but explain complex concepts clearly
5. Keep responses concise but informative
6. When sharing opinions, make it clear they are recommendations, not financial advice

H: ${message}

Previous conversation:
${formattedHistory}
`;

  return prompt;
}
module.exports = { generatePrompt };
