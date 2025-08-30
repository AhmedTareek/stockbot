var botui = new BotUI('chatbot');
const API_URL = 'http://localhost:3000/chatbot/message';
// Generate a unique conversation ID
let conversationId = generateUUID();

/*
{
    "message": "<user_message>",
    "conversationId":"<conversation_id>"
}
*/

// Function to generate a UUID for conversation ID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function startChat() {
  botui.message.add({
    content: 'Hi! What\'s on your mind?',
    delay: 500
  }).then(function () {
    return botui.action.text({
      action: { placeholder: 'Type your message...' }
    });
  }).then(function (res) {
    sendToAPI(res.value);
  });
}

function sendToAPI(message) {
  // Show loading state
  botui.message.add({
    loading: true,
    delay: 500
  }).then(function (index) {
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        conversationId: conversationId
      })
    })
      .then(response => response.json())
      .then(response => {
        botui.message.remove(index);
        
        // Extract the text content from the response.data
        let replyText = '';
        if (response && response.data) {
          replyText = response.data;
        } else {
          replyText = `Got your message: ${message}`;
        }
        
        // Convert markdown to HTML
        // Handle bold text (**text**)
        replyText = replyText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Handle bullet points
        replyText = replyText.replace(/\n\* /g, '<br>• ');
        
        // Handle line breaks
        replyText = replyText.replace(/\n/g, '<br>');
        
        // Add conversation ID info in small text
        const conversationIdText = `<br><small class="conversation-id">Conversation ID: ${conversationId}</small>`;
        replyText += conversationIdText;
        
        botui.message.add({
          type: 'html',
          content: replyText,
          delay: 500
        }).then(continueChat);
      })
      .catch(error => {
        botui.message.remove(index);
        botui.message.add({
          type: 'html',
          content: `Error: ${error.message}<br><small class="conversation-id">Conversation ID: ${conversationId}</small>`,
          delay: 500
        }).then(continueChat);
      });
  });
}

function continueChat() {
  botui.action.text({
    action: { placeholder: 'Anything else?' }
  }).then(function (res) {
    sendToAPI(res.value);
  });
}

// Start the chatbot
startChat();