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
  
  // Initialize functionality based on what elements exist on the page
  if (chatContainer) initializeChat();
  if (uploadForm) initializeDocumentUpload();
  if (widgetCodeBox) initializeIntegration();
  
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
