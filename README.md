# SOLess AI Chatbot

A knowledge-based AI chatbot for the SOLess project on Solana, powered by Anthropic's Claude AI.

## Features

- **AI-powered chat interface** - Answers questions about the SOLess project
- **Document management** - Upload and manage PDF, Markdown, and text files
- **Admin dashboard** - Test the chatbot and manage knowledge documents
- **Website integration** - Easily embed the chatbot on any website

## Tech Stack

- Node.js and Express for the backend
- Anthropic Claude API for AI responses
- Pure JavaScript, HTML and CSS for the frontend
- No extra frontend frameworks required

## Project Structure

```
├── docs/                   # Knowledge documents folder
├── logs/                   # Log files
├── src/
│   ├── public/             # Static files
│   │   ├── admin/          # Admin dashboard
│   │   │   ├── css/        # Admin styles
│   │   │   ├── js/         # Admin scripts
│   │   │   ├── index.html  # Dashboard home
│   │   │   ├── documents.html  # Document management
│   │   │   └── integration.html # Website integration
│   │   ├── upload.html     # Legacy upload page
│   │   └── widget.js       # Website integration widget
│   ├── routes/
│   │   └── api.js          # API endpoints
│   ├── utils/
│   │   ├── documentLoader.js  # Document processing
│   │   ├── promptGenerator.js # Claude prompt creation
│   │   └── solessKnowledge.js # Core knowledge
│   ├── server.js           # Express server
│   └── telegramBot.js      # Telegram integration
├── .env                    # Environment variables
├── load-env.js             # Custom environment loader
├── package.json            # Dependencies
└── README.md               # This file
```

## Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env` file with your API keys:
   ```
   ANTHROPIC_API_KEY=your-actual-anthropic-api-key
   TELEGRAM_BOT_TOKEN=your-telegram-bot-token
   PORT=3000
   ```
4. Create a `docs` directory for document uploads
5. Start the server with `npm start`
6. Visit `http://localhost:3000/admin` in your browser

## Usage

### Admin Dashboard

Access the admin dashboard at `/admin` to:
- Test the SOLess chatbot directly
- Upload and manage knowledge documents
- Get code snippets for website integration

### API Endpoints

- `POST /api/conversations` - Create a new conversation
- `POST /api/conversations/:id/messages` - Send a message
- `GET /api/documents` - List all documents
- `POST /api/documents/upload` - Upload a document
- `DELETE /api/documents/:filename` - Delete a document

### Website Integration

Embed the chatbot on any website by adding the following script before the closing `</body>` tag:

```html
<!-- SOLess Chat Widget -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://your-server-url/widget.js';
    script.async = true;
    document.head.appendChild(script);
    
    window.SOLessConfig = {
      position: 'bottom-right',
      primaryColor: '#4a148c',
      welcomeMessage: 'Hello! Ask me about SOLess...'
    };
  })();
</script>
```

## License

[License information]

## Contributing

[Contribution guidelines]
