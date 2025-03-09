require('dotenv').config();

// Manually set the environment variable if it's not being loaded
if (!process.env.ANTHROPIC_API_KEY && require('fs').existsSync('.env')) {
  const envContent = require('fs').readFileSync('.env', 'utf8');
  const apiKeyLine = envContent.split('\n').find(line => line.startsWith('ANTHROPIC_API_KEY='));
  
  if (apiKeyLine) {
    const apiKey = apiKeyLine.split('=')[1];
    process.env.ANTHROPIC_API_KEY = apiKey;
    console.log('Manually loaded API key from .env file');
  }
}

// Export for requiring in other files
module.exports = process.env;
