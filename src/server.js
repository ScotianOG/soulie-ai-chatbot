// src/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');
const apiRoutes = require('./routes/api');

// Load environment variables
dotenv.config();

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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SOLess AI Engine running on port ${PORT}`);
  console.log(`Admin dashboard available at http://localhost:${PORT}/admin`);
});
