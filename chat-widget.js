// frontend/chat-widget.js (Versión 2 - Mejorada)

/**
 * Santec Chat Widget - Mejorado
 * - Estilos CSS mejorados
 * - Diferenciación de mensajes User/Bot
 * - Indicador "Escribiendo..."
 * - Session ID dinámico
 * - Mejor manejo visual de errores
 */
(function() {
  // --- Configuración ---
  // ¡¡ASEGÚRATE DE QUE ESTA URL APUNTE A TU BACKEND DESPLEGADO EN RENDER!!
  const BACKEND_API_URL = 'https://santec-chatbot-backend.onrender.com/api/chat'; // Reemplaza con tu URL real de Render
  const WIDGET_HOST_ID = 'santec-chat-widget-container'; // Opcional: ID del div anfitrión
  const BOT_NAME = 'Asistente Santec';
  const INPUT_PLACEHOLDER = 'Escribe tu consulta aquí...';
  const SEND_BUTTON_TEXT = 'Enviar';
  const TOGGLE_BUTTON_TEXT = 'Chat';
  const BOT_THINKING_MESSAGE = 'Escribiendo...';
  const ERROR_MESSAGE = 'Lo siento, ocurrió un error. Intenta de nuevo.';

  // --- Generar Session ID único para esta carga del widget ---
  const SESSION_ID = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  console.log("SantecWidget Session ID:", SESSION_ID); // Para depuración

  // --- CSS Styles ---
  const styles = `
    :root {
      --widget-primary-color: #007bff;
      --widget-secondary-color: #0056b3;
      --widget-bg-color: #ffffff;
      --widget-header-bg: #f8f9fa;
      --widget-text-color: #333;
      --widget-header-text: #495057;
      --widget-border-color: #dee2e6;
      --messages-bg: #fdfdfd;
      --user-msg-bg: #007bff;
      --user-msg-text: #ffffff;
      --bot-msg-bg: #e9ecef;
      --bot-msg-text: #343a40;
      --input-bg: #ffffff;
    }
    #santec-chat-toggle-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 20px;
      background-color: var(--widget-primary-color);
      color: white;
      border: none;
      border-radius: 50px;
      cursor: pointer;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      font-size: 16px;
      font-family: inherit;
      z-index: 9999;
      transition: background-color 0.3s ease;
    }
    #santec-chat-toggle-button:hover {
      background-color: var(--widget-secondary-color);
    }
    #santec-chat-window {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 340px;
      height: 480px;
      border: 1px solid var(--widget-border-color);
      border-radius: 10px;
      background-color: var(--widget-bg-color);
      box-shadow: 0 5px 15px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 9998;
      transition: opacity 0.3s ease, transform 0.3s ease;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      pointer-events: none;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    }
    #santec-chat-window.santec-chat-open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }
    .santec-chat-header {
      padding: 12px 15px;
      background-color: var(--widget-header-bg);
      border-bottom: 1px solid var(--widget-border-color);
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
      font-weight: 600; /* Semibold */
      color: var(--widget-header-text);
      text-align: center;
      position: relative; /* Para el botón de cerrar */
    }
    .santec-chat-close-button {
        position: absolute;
        top: 5px;
        right: 10px;
        background: none;
        border: none;
        font-size: 20px;
        font-weight: bold;
        color: var(--widget-header-text);
        cursor: pointer;
        padding: 5px;
        line-height: 1;
    }
    #santec-messages-area {
      flex-grow: 1;
      padding: 15px;
      overflow-y: auto; /* Enable scrolling for messages */
      background-color: var(--messages-bg);
      scroll-behavior: smooth;
    }
    .santec-message {
      margin-bottom: 12px;
      padding: 10px 15px;
      border-radius: 18px;
      max-width: 85%; /* Un poco más anchas */
      word-wrap: break-word; /* Prevent long words from overflowing */
      line-height: 1.45;
      font-size: 14px;
      clear: both; /* Asegura que floten correctamente */
    }
    .santec-message.santec-user-message {
      background-color: var(--user-msg-bg);
      color: var(--user-msg-text);
      margin-left: auto; /* Align user messages to the right */
      border-bottom-right-radius: 5px; /* Slightly different corner */
      float: right; /* Flota a la derecha */
    }
    .santec-message.santec-bot-message {
      background-color: var(--bot-msg-bg);
      color: var(--bot-msg-text);
      margin-right: auto; /* Align bot messages to the left */
      border-bottom-left-radius: 5px; /* Slightly different corner */
      float: left; /* Flota a la izquierda */
    }
     .santec-message.santec-bot-thinking {
        font-style: italic;
        color: #6c757d;
        background-color: var(--bot-msg-bg);
        /* Estilos similares al bot, pero podría ser más tenue */
        float: left;
     }
    .santec-input-area {
      display: flex;
      padding: 12px 15px; /* Más padding */
      border-top: 1px solid var(--widget-border-color);
      background-color: var(--widget-header-bg); /* Mismo fondo que header */
    }
    #santec-message-input {
      flex-grow: 1;
      padding: 10px 15px; /* Más padding interno */
      border: 1px solid var(--widget-border-color);
      border-radius: 20px;
      margin-right: 8px;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      background-color: var(--input-bg);
      color: var(--widget-text-color);
    }
    #santec-message-input:focus {
        border-color: var(--widget-primary-color);
        box-shadow: 0 0 0 2px rgba(0,123,255,.25);
    }
    #santec-send-button {
      padding: 10px 15px;
      border: none;
      background-color: var(--widget-primary-color);
      color: white;
      border-radius: 20px;
      cursor: pointer;
      font-size: 14px;
      font-family: inherit;
      font-weight: 500;
      transition: background-color 0.3s ease;
    }
    #santec-send-button:hover {
      background-color: var(--widget-secondary-color);
    }
    #santec-send-button:disabled {
        background-color: #adb5bd; /* Gris más claro para deshabilitado */
        cursor: not-allowed;
    }
    /* Estilo para scrollbar (opcional, mejora estética) */
    #santec-messages-area::-webkit-scrollbar {
      width: 6px;
    }
    #santec-messages-area::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }
    #santec-messages-area::-webkit-scrollbar-thumb {
      background: #ccc;
      border-radius: 10px;
    }
    #santec-messages-area::-webkit-scrollbar-thumb:hover {
      background: #aaa;
    }
  `;

  // --- Crear DOM Elements ---
  function createDOM() {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    const toggleButton = document.createElement('button');
    toggleButton.id = 'santec-chat-toggle-button';
    toggleButton.textContent = TOGGLE_BUTTON_TEXT;

    const chatWindow = document.createElement('div');
    chatWindow.id = 'santec-chat-window';

    const header = document.createElement('div');
    header.className = 'santec-chat-header';
    header.textContent = BOT_NAME;
    // Botón de cerrar
    const closeButton = document.createElement('button');
    closeButton.className = 'santec-chat-close-button';
    closeButton.innerHTML = '&times;'; // Símbolo 'x'
    closeButton.setAttribute('aria-label', 'Cerrar chat');
    header.appendChild(closeButton);
    chatWindow.appendChild(header);


    const messagesArea = document.createElement('div');
    messagesArea.id = 'santec-messages-area';
    chatWindow.appendChild(messagesArea);

    const inputArea = document.createElement('div');
    inputArea.className = 'santec-input-area';

    const messageInput = document.createElement('input');
    messageInput.id = 'santec-message-input';
    messageInput.type = 'text';
    messageInput.placeholder = INPUT_PLACEHOLDER;
    inputArea.appendChild(messageInput);

    const sendButton = document.createElement('button');
    sendButton.id = 'santec-send-button';
    sendButton.textContent = SEND_BUTTON_TEXT;
    inputArea.appendChild(sendButton);

    chatWindow.appendChild(inputArea);

    let hostElement = document.getElementById(WIDGET_HOST_ID) || document.body;
    hostElement.appendChild(toggleButton);
    hostElement.appendChild(chatWindow);

    return { toggleButton, chatWindow, messagesArea, messageInput, sendButton, closeButton };
  }

  // --- Initialize Widget ---
  function initializeWidget() {
    const { toggleButton, chatWindow, messagesArea, messageInput, sendButton, closeButton } = createDOM();
    let isChatOpen = false;
    let isWaitingForBot = false;
    let thinkingMessageElement = null; // Para guardar referencia al mensaje "Escribiendo..."

    function toggleChatWindow(forceClose = false) {
      if (forceClose) {
        isChatOpen = false;
      } else {
        isChatOpen = !isChatOpen;
      }

      if (isChatOpen) {
        chatWindow.classList.add('santec-chat-open');
        messageInput.focus();
      } else {
        chatWindow.classList.remove('santec-chat-open');
      }
    }

    function addMessageToUI(text, sender = 'user', isThinking = false) {
      const messageElement = document.createElement('div');
      messageElement.classList.add('santec-message');
      messageElement.classList.add(sender === 'user' ? 'santec-user-message' : 'santec-bot-message');

      // Limpiar HTML potencialmente peligroso (muy básico)
      const sanitizedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
       // Reemplazar saltos de línea \n con <br> para visualización HTML
      const formattedText = sanitizedText.replace(/\n/g, '<br>');
      messageElement.innerHTML = formattedText; // Usar innerHTML permite <br>

      if (isThinking) {
          messageElement.classList.add('santec-bot-thinking');
          thinkingMessageElement = messageElement; // Guardar referencia
      }

      messagesArea.appendChild(messageElement);
      // Scroll to the bottom
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    function removeThinkingIndicator() {
        if (thinkingMessageElement && messagesArea.contains(thinkingMessageElement)) {
            messagesArea.removeChild(thinkingMessageElement);
        }
        thinkingMessageElement = null; // Limpiar referencia
    }

    async function handleSendMessage() {
      const messageText = messageInput.value.trim();
      if (messageText === '' || isWaitingForBot) return;

      isWaitingForBot = true;
      sendButton.disabled = true;
      messageInput.disabled = true;

      addMessageToUI(messageText, 'user');
      messageInput.value = '';
      addMessageToUI(BOT_THINKING_MESSAGE, 'bot', true); // Mostrar indicador "Escribiendo..."

      try {
        const response = await fetch(BACKEND_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // Enviar sessionId dinámico (generado arriba) como clientId
          body: JSON.stringify({ message: messageText, clientId: SESSION_ID }),
        });

        removeThinkingIndicator(); // Quitar "Escribiendo..."

        if (!response.ok) {
          // Intentar obtener mensaje de error del backend si existe
          let errorMsg = ERROR_MESSAGE;
          try {
              const errorData = await response.json();
              errorMsg = errorData.response || errorData.error || ERROR_MESSAGE;
          } catch(e) { /* Ignorar si no se puede parsear JSON */ }
          console.error('API Error Status:', response.status, response.statusText);
          addMessageToUI(errorMsg, 'bot'); // Mostrar error en el chat
        } else {
          const data = await response.json();
          addMessageToUI(data.response || ERROR_MESSAGE, 'bot');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        removeThinkingIndicator();
        addMessageToUI(ERROR_MESSAGE, 'bot');
      } finally {
         isWaitingForBot = false;
         sendButton.disabled = false;
         messageInput.disabled = false;
         messageInput.focus();
      }
    }

    // --- Event Listeners ---
    toggleButton.addEventListener('click', () => toggleChatWindow());
    closeButton.addEventListener('click', () => toggleChatWindow(true)); // Forzar cierre
    sendButton.addEventListener('click', handleSendMessage);
    messageInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        handleSendMessage();
      }
    });
  }

  // --- Run Initialization ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWidget);
  } else {
    initializeWidget();
  }

})();