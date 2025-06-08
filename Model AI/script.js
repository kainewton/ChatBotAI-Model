document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const typingIndicator = document.getElementById('typing');
    const minimizeBtn = document.getElementById('minimize-btn');
    const closeBtn = document.getElementById('close-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const uploadBtn = document.getElementById('upload-btn');
    const fileBtn = document.getElementById('file-btn');
    const fileInput = document.getElementById('file-input');
    const modelSelect = document.getElementById('model-select');
    const currentModelSpan = document.getElementById('current-model');
    const keywords = document.querySelectorAll('.keyword');
    const offlineIndicator = document.getElementById('offline-indicator');
    const pwaInstallBtn = document.getElementById('pwa-install');
    const bookmarkBtn = document.getElementById('bookmark-btn');
    const downloadBtn = document.getElementById('download-btn');
    const shareBtn = document.getElementById('share-btn');
    
    // API Configuration
    const API_KEY = "YOUR_API_KEY"; #type your API key
    const API_URL = "https://openrouter.ai/api/v1/chat/completions";
    const model = "deepseek/deepseek-chat:free";
    
    // State management
    let conversationHistory = [];
    let attachedFile = null;
    let currentModel = "deepseek/deepseek-chat:free";
    let deferredPrompt = null;
    
    // Check online status
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    function updateOnlineStatus() {
        if (!navigator.onLine) {
            offlineIndicator.style.display = 'block';
            addMessage("You're offline. Some features may be limited. Basic responses will be provided from local cache.", false);
        } else {
            offlineIndicator.style.display = 'none';
        }
    }
    
    // Initial status check
    updateOnlineStatus();
    
    // Update model display
    function updateModelDisplay() {
        currentModelSpan.textContent = currentModel;
    }
    
    // Function to add a message to the chat
    function addMessage(text, isUser, fileInfo = null) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');
        
        const time = new Date();
        const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <div class="${isUser ? 'user-icon' : 'bot-icon'}">
                    <i class="fas ${isUser ? 'fa-user' : 'fa-robot'}"></i>
                </div>
                <div>${isUser ? 'You' : 'MaoMao'}</div>
            </div>
            <div class="message-content">${text}</div>
            ${fileInfo ? `
            <div class="file-preview">
                <i class="fas fa-file-alt"></i>
                <span>${fileInfo.name} (${formatFileSize(fileInfo.size)})</span>
                <button class="remove-file" onclick="removeAttachedFile()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            ` : ''}
            <div class="message-time">${timeString}</div>
        `;
        
        chatMessages.insertBefore(messageDiv, typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Function to simulate typing effect
    function simulateTypingEffect(message, callback) {
        let i = 0;
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'bot-message');
        
        const time = new Date();
        const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <div class="bot-icon">
                    <i class="fas fa-robot"></i>
                </div>
                <div>MaoMao</div>
            </div>
            <div class="message-content" id="typing-content"></div>
            <div class="message-time">${timeString}</div>
        `;
        
        chatMessages.insertBefore(messageDiv, typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        const contentDiv = messageDiv.querySelector('.message-content');
        
        function type() {
            if (i < message.length) {
                contentDiv.innerHTML += message.charAt(i);
                i++;
                setTimeout(type, 20);
            } else {
                if (callback) callback();
            }
        }
        
        type();
    }
    
    // Function to send message to OpenRouter API
    async function sendToOpenRouter(message) {
        try {
            // Add user message to history
            conversationHistory.push({ role: "user", content: message });
            
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": currentModel,
                    "messages": conversationHistory
                })
            });
            
            const data = await response.json();
            const botResponse = data.choices[0].message.content;
            
            // Add bot response to history
            conversationHistory.push({ role: "assistant", content: botResponse });
            
            return botResponse;
        } catch (error) {
            console.error("Error fetching from OpenRouter:", error);
            return "Sorry, I encountered an error processing your request. Please try again.";
        }
    }
    
    // Offline response handler
    function getOfflineResponse(message) {
        const offlineResponses = {
            "hello": "Hello! I'm in offline mode. My responses are limited.",
            "offline": "You're currently offline. When online, I can access the latest information.",
            "help": "I can help with basic questions while offline. For more advanced features, please connect to the internet.",
            "who are you": "I'm OAT AI, your personal assistant. Currently in offline mode.",
            "what can you do": "While offline, I can answer basic questions and provide pre-loaded information. When online, I can access real-time data and advanced AI models."
        };
        
        const lowerMessage = message.toLowerCase();
        
        for (const [key, response] of Object.entries(offlineResponses)) {
            if (lowerMessage.includes(key)) {
                return response;
            }
        }
        
        return "I'm offline right now. My responses are limited. Please connect to the internet for full functionality.";
    }
    
    // Function to handle user message
    async function handleUserMessage() {
        const message = userInput.value.trim();
        if (message) {
            // Add user message to chat
            addMessage(message, true, attachedFile);
            
            // Clear input and disable send button
            userInput.value = '';
            sendBtn.disabled = true;
            
            // Show typing indicator
            typingIndicator.style.display = 'block';
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            try {
                let botResponse;
                
                if (navigator.onLine) {
                    // Send to OpenRouter API
                    botResponse = await sendToOpenRouter(message);
                } else {
                    // Offline mode
                    botResponse = getOfflineResponse(message);
                }
                
                // Hide typing indicator
                typingIndicator.style.display = 'none';
                
                // Add bot response to chat with typing effect
                simulateTypingEffect(botResponse);
                
                // Reset attached file
                attachedFile = null;
            } catch (error) {
                typingIndicator.style.display = 'none';
                addMessage("Sorry, I'm having trouble processing your request. Please try again later.", false);
            }
            
            // Re-enable send button
            sendBtn.disabled = false;
        }
    }
    
    // Handle file upload
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            attachedFile = {
                name: file.name,
                size: file.size,
                type: file.type
            };
            
            // Add message with file info
            addMessage("I've attached a file for reference", true, attachedFile);
            
            // Reset file input
            fileInput.value = '';
        }
    }
    
    // Remove attached file
    function removeAttachedFile() {
        attachedFile = null;
        const filePreviews = document.querySelectorAll('.file-preview');
        filePreviews.forEach(preview => preview.remove());
    }
    
    // PWA Installation
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Show the install button
        pwaInstallBtn.style.display = 'block';
    });
    
    pwaInstallBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            // We've used the prompt, and can't use it again, throw it away
            deferredPrompt = null;
        }
    });
    
    // Bookmark functionality
    bookmarkBtn.addEventListener('click', () => {
        addMessage("To bookmark this page:", false);
        simulateTypingEffect("1. Press Ctrl+D (Windows/Linux) or Cmd (Mac) 2. Or click the star icon in your browser's address bar");
    });
    
    // Download functionality
    downloadBtn.addEventListener('click', () => {
        const htmlContent = document.documentElement.outerHTML;
        const blob = new Blob([htmlContent], {type: 'text/html'});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'OAT-AI-Chatbot.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        addMessage("The chatbot has been downloaded to your device. You can now open it anytime without an internet connection.", false);
    });
    
    // Share functionality
    shareBtn.addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: 'OAT AI Chatbot',
                text: 'Check out this awesome AI chatbot powered by OpenRouter!',
                url: window.location.href
            })
            .then(() => console.log('Successful share'))
            .catch((error) => console.log('Error sharing:', error));
        } else {
            addMessage("To share this chatbot:", false);
            simulateTypingEffect("1. Copy the URL from your browser's address bar 2. Send it to anyone you want to share with");
        }
    });
    
    // Event listeners
    sendBtn.addEventListener('click', handleUserMessage);
    
    userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleUserMessage();
        }
    });
    
    // Enable send button when user types
    userInput.addEventListener('input', function() {
        sendBtn.disabled = !this.value.trim();
    });
    
    minimizeBtn.addEventListener('click', function() {
        const messages = document.querySelectorAll('.message');
        const welcome = document.querySelector('.welcome-container');
        const isHidden = messages[0] && messages[0].style.display === 'none';
        
        messages.forEach(msg => {
            msg.style.display = isHidden ? 'block' : 'none';
        });
        
        if (welcome) {
            welcome.style.display = isHidden ? 'block' : 'none';
        }
        
        typingIndicator.style.display = 'none';
        minimizeBtn.innerHTML = isHidden ? '<i class="fas fa-minus"></i>' : '<i class="fas fa-plus"></i>';
    });
    
    closeBtn.addEventListener('click', function() {
        // Reset chat
        const messages = document.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
        conversationHistory = [];
        typingIndicator.style.display = 'none';
        minimizeBtn.innerHTML = '<i class="fas fa-minus"></i>';
        document.querySelector('.welcome-container').style.display = 'block';
    });
    
    newChatBtn.addEventListener('click', function() {
        // Reset chat
        const messages = document.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
        conversationHistory = [];
        typingIndicator.style.display = 'none';
        document.querySelector('.welcome-container').style.display = 'block';
    });
    
    fileBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', handleFileUpload);
    
    uploadBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    modelSelect.addEventListener('change', function() {
        currentModel = this.value;
        updateModelDisplay();
        
        // Show model change notification
        const notification = document.createElement('div');
        notification.classList.add('message', 'bot-message');
        notification.innerHTML = `
            <div class="message-content">
                <i class="fas fa-info-circle"></i> Switched to ${currentModel} model
            </div>
        `;
        chatMessages.appendChild(notification);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Remove notification after delay
        setTimeout(() => {
            notification.remove();
        }, 3000);
    });
    
    // Keyword click handlers
    keywords.forEach(keyword => {
        keyword.addEventListener('click', function() {
            const prompt = this.getAttribute('data-prompt');
            userInput.value = prompt;
            handleUserMessage();
        });
    });
    
    // Initial welcome message
    setTimeout(() => {
        simulateTypingEffect("Hello! I'm your OAT AI assistant. You can access me anytime by:"  +
        "1. Installing me as an app (click 'Install as App' below)" +

        "2. Bookmarking this page in your browser" + 

        "3. Downloading me to your device" + 

        "What would you like to explore today?");
    }, 1000);
    
    window.removeAttachedFile = removeAttachedFile;
    updateModelDisplay();
});
