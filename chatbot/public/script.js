// Chatbot Frontend Script
// Manages conversation history and API communication

const ChatApp = (() => {
  // State
  const state = {
    conversation: [],
    isWaiting: false,
  };

  // DOM elements
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');

  // Initialize app
  const init = () => {
    if (!chatForm || !userInput || !chatBox) {
      console.error('Required DOM elements not found');
      return;
    }
    chatForm.addEventListener('submit', handleSubmit);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const message = userInput.value.trim();

    // Validation
    if (!message) return;
    if (state.isWaiting) return;

    // Clear input
    userInput.value = '';
    userInput.focus();

    // Add user message to conversation and UI
    state.conversation.push({ role: 'user', text: message });
    addMessageToUI('user', message);

    // Show thinking indicator
    const thinkingId = addMessageToUI('model', 'Thinking...');

    // Prevent multiple requests
    state.isWaiting = true;

    try {
      // Build request payload
      const payload = {
        conversation: state.conversation,
      };

      // Send request to backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Handle HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse response
      const data = await response.json();

      // Validate response structure
      if (!data.result) {
        throw new Error('No result in response');
      }

      // Add model response to conversation
      const aiMessage = data.result;
      state.conversation.push({ role: 'model', text: aiMessage });

      // Replace thinking message with actual response
      replaceMessageInUI(thinkingId, aiMessage);
    } catch (error) {
      console.error('Error:', error);

      // Determine error message
      let errorMessage = 'Failed to get response from server.';
      if (error instanceof TypeError) {
        errorMessage = 'Network error. Please check your connection.';
      }

      // Replace thinking message with error message
      replaceMessageInUI(thinkingId, errorMessage);

      // Remove the user message from conversation if request failed
      state.conversation.pop();
    } finally {
      state.isWaiting = false;
    }
  };

  // Add message to UI and return element ID
  const addMessageToUI = (role, text) => {
    const messageId = `msg-${Date.now()}-${Math.random()}`;
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = `message message-${role}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;

    messageDiv.appendChild(contentDiv);
    chatBox.appendChild(messageDiv);

    // Auto-scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;

    return messageId;
  };

  // Replace message text in UI
  const replaceMessageInUI = (messageId, newText) => {
    const messageElement = document.getElementById(messageId);
    if (messageElement) {
      const contentDiv = messageElement.querySelector('.message-content');
      if (contentDiv) {
        contentDiv.textContent = newText;
      }
    }
  };

  // Public API
  return {
    init,
  };
})();

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ChatApp.init);
} else {
  ChatApp.init();
}
