/**
 * SOLess Admin Panel JavaScript
 */

// Global variables
let conversationId = null;
const apiBaseUrl = '/api';

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
  // Chat Elements
  const chatContainer = document.getElementById('chat-container');
  const messagesContainer = document.getElementById('messages');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  
  // Document Elements
  const uploadForm = document.getElementById('upload-form');
  const documentsContainer = document.getElementById('documents-container');
  
  // Integration Elements
  const widgetCodeBox = document.getElementById('widget-code');
  const copyWidgetButton = document.getElementById('copy-widget-button');
  
  // Settings Elements
  const personaForm = document.getElementById('persona-form');
  const telegramForm = document.getElementById('telegram-form');
  
  // Initialize functionality based on what elements exist on the page
  if (chatContainer) initializeChat();
  if (uploadForm) initializeDocumentUpload();
  if (widgetCodeBox) initializeIntegration();
  if (personaForm) initializePersonaSettings();
  if (telegramForm) initializeTelegramSettings();
  
  // Initialize navigation
  initializeNavigation();
});

/**
 * Navigation Functionality
 */
function initializeNavigation() {
  // Set active navigation item based on current page
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-links a, .sidebar-nav a');
  
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
}

/**
 * Chat Functionality
 */
async function initializeChat() {
  try {
    const response = await fetch(`${apiBaseUrl}/conversations`, {
      method: 'POST'
    });
    const data = await response.json();
    conversationId = data.conversationId;
    
    // Add welcome message
    addBotMessage("Admin connection established. How can I assist with the SOLess project today?");
  } catch (error) {
    console.error('Error initializing chat:', error);
    addBotMessage("Unable to connect to chat interface. Please check the server connection.");
  }
  
  // Event listeners
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  
  sendButton.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message) {
      sendMessage(message);
    }
  });
  
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const message = messageInput.value.trim();
      if (message) {
        sendMessage(message);
      }
    }
  });
}

async function sendMessage(message) {
  if (!conversationId) {
    console.error('No active conversation');
    return;
  }
  
  try {
    // Add user message to UI
    addUserMessage(message);
    
    // Clear input
    document.getElementById('message-input').value = '';
    
    // Call API
    const response = await fetch(`${apiBaseUrl}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });
    
    const data = await response.json();
    
    // Add bot response to UI
    addBotMessage(data.message, data.persona);
    
  } catch (error) {
    console.error('Error sending message:', error);
    addBotMessage("Communication error. Please try again later.");
  }
}

function addUserMessage(text) {
  const messagesContainer = document.getElementById('messages');
  const messageElement = document.createElement('div');
  messageElement.className = 'message user';
  messageElement.textContent = text;
  messagesContainer.appendChild(messageElement);
  scrollToBottom();
}

function addBotMessage(text, persona) {
  const messagesContainer = document.getElementById('messages');
  const messageElement = document.createElement('div');
  messageElement.className = 'message bot';
  messageElement.textContent = text;
  
  if (persona) {
    const personaElement = document.createElement('div');
    personaElement.className = 'persona';
    personaElement.textContent = persona.name;
    messageElement.appendChild(personaElement);
  }
  
  messagesContainer.appendChild(messageElement);
  scrollToBottom();
}

function scrollToBottom() {
  const messagesContainer = document.getElementById('messages');
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Document Management Functionality
 */
function initializeDocumentUpload() {
  // Load document list
  loadDocuments();
  
  // Handle form submission
  const uploadForm = document.getElementById('upload-form');
  
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('document');
    if (!fileInput.files.length) {
      alert('Please select a file to upload');
      return;
    }
    
    const formData = new FormData();
    formData.append('document', fileInput.files[0]);
    
    try {
      const response = await fetch(`${apiBaseUrl}/documents/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        fileInput.value = '';
        loadDocuments();
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Error uploading document');
    }
  });
}

async function loadDocuments() {
  const documentsContainer = document.getElementById('documents-container');
  if (!documentsContainer) return;
  
  try {
    const response = await fetch(`${apiBaseUrl}/documents`);
    const data = await response.json();
    
    if (data.documents && data.documents.length > 0) {
      documentsContainer.innerHTML = '';
      
      data.documents.forEach(doc => {
        const item = document.createElement('div');
        item.className = 'document-item';
        
        const name = document.createElement('div');
        name.className = 'document-name';
        name.textContent = doc;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteDocument(doc);
        
        item.appendChild(name);
        item.appendChild(deleteBtn);
        documentsContainer.appendChild(item);
      });
    } else {
      documentsContainer.innerHTML = '<p>No documents uploaded yet.</p>';
    }
  } catch (error) {
    console.error('Error loading documents:', error);
    documentsContainer.innerHTML = 
      '<p>Error loading documents. Please try again.</p>';
  }
}

async function deleteDocument(filename) {
  if (!confirm(`Are you sure you want to delete ${filename}?`)) {
    return;
  }
  
  try {
    const response = await fetch(`${apiBaseUrl}/documents/${filename}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      loadDocuments();
    } else {
      alert('Failed to delete document');
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    alert('Error deleting document');
  }
}

/**
 * Website Integration Functionality
 */
function initializeIntegration() {
  // Generate widget code
  const hostUrl = window.location.origin;
  const widgetCode = document.getElementById('widget-code');
  
  if (widgetCode) {
    widgetCode.textContent = `<!-- SOLess Chat Widget -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${hostUrl}/widget.js';
    script.async = true;
    document.head.appendChild(script);
    
    window.SOLessConfig = {
      position: 'bottom-right',
      primaryColor: '#4a148c',
      welcomeMessage: 'Hello! Ask me about SOLess...'
    };
  })();
</script>`;
  }
  
  // Copy button functionality
  const copyButton = document.getElementById('copy-widget-button');
  
  if (copyButton) {
    copyButton.addEventListener('click', () => {
      const codeText = widgetCode.textContent;
      navigator.clipboard.writeText(codeText).then(() => {
        // Visual feedback
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
          copyButton.textContent = 'Copy Code';
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy code to clipboard');
      });
    });
  }
}

/**
 * Persona Settings Functionality
 */
async function initializePersonaSettings() {
  const personaForm = document.getElementById('persona-form');
  if (!personaForm) return;
  
  try {
    // Fetch current persona settings
    const response = await fetch(`${apiBaseUrl}/settings/persona`);
    if (response.ok) {
      const { persona } = await response.json();
      
      // Fill form with current settings
      document.getElementById('persona-name').value = persona.name || '';
      document.getElementById('persona-style').value = persona.style || '';
      document.getElementById('persona-background').value = persona.background || '';
    } else {
      console.warn('Could not load persona settings');
    }
  } catch (error) {
    console.error('Error loading persona settings:', error);
  }
  
  // Handle form submission
  personaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const personaData = {
      name: document.getElementById('persona-name').value.trim(),
      style: document.getElementById('persona-style').value.trim(),
      background: document.getElementById('persona-background').value.trim()
    };
    
    try {
      const response = await fetch(`${apiBaseUrl}/settings/persona`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ persona: personaData })
      });
      
      if (response.ok) {
        // Show success message
        alert('Persona settings saved successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to save persona settings: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving persona settings:', error);
      alert('Error saving persona settings. Please try again.');
    }
  });
}

/**
 * Telegram Bot Settings Functionality
 */
async function initializeTelegramSettings() {
  const telegramForm = document.getElementById('telegram-form');
  const telegramStatus = document.getElementById('telegram-status');
  if (!telegramForm || !telegramStatus) return;
  
  try {
    // Fetch current telegram settings
    const response = await fetch(`${apiBaseUrl}/settings/telegram`);
    if (response.ok) {
      const { enabled, token, status } = await response.json();
      
      // Fill form with current settings
      document.getElementById('telegram-enabled').checked = enabled;
      document.getElementById('telegram-token').value = token || '';
      
      // Update status display
      updateTelegramStatus(status);
    } else {
      console.warn('Could not load telegram settings');
      updateTelegramStatus('inactive');
    }
  } catch (error) {
    console.error('Error loading telegram settings:', error);
    updateTelegramStatus('error', 'Could not connect to server');
  }
  
  // Handle form submission
  telegramForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const telegramData = {
      enabled: document.getElementById('telegram-enabled').checked,
      token: document.getElementById('telegram-token').value.trim()
    };
    
    try {
      const response = await fetch(`${apiBaseUrl}/settings/telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(telegramData)
      });
      
      if (response.ok) {
        const { status, message } = await response.json();
        updateTelegramStatus(status, message);
        alert('Telegram settings saved successfully!');
      } else {
        const error = await response.json();
        updateTelegramStatus('error', error.error || 'Unknown error');
        alert(`Failed to save Telegram settings: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving Telegram settings:', error);
      updateTelegramStatus('error', 'Connection error');
      alert('Error saving Telegram settings. Please try again.');
    }
  });
}

function updateTelegramStatus(status, message) {
  const telegramStatus = document.getElementById('telegram-status');
  if (!telegramStatus) return;
  
  telegramStatus.className = 'telegram-status';
  
  switch (status) {
    case 'connected':
      telegramStatus.classList.add('status-connected');
      telegramStatus.innerHTML = `<strong>Status:</strong> Connected and running`;
      if (message) telegramStatus.innerHTML += `<br>${message}`;
      break;
    case 'error':
      telegramStatus.classList.add('status-error');
      telegramStatus.innerHTML = `<strong>Status:</strong> Error`;
      if (message) telegramStatus.innerHTML += `<br>${message}`;
      break;
    case 'inactive':
    default:
      telegramStatus.classList.add('status-inactive');
      telegramStatus.innerHTML = `<strong>Status:</strong> Inactive`;
      if (message) telegramStatus.innerHTML += `<br>${message}`;
      break;
  }
}
