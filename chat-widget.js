(function() {
    // Crear el contenedor principal del chatbot
    const chatWidget = document.createElement('div');
    chatWidget.id = 'chat-widget';
    chatWidget.style.position = 'fixed';
    chatWidget.style.bottom = '20px';
    chatWidget.style.right = '20px';
    chatWidget.style.width = '300px';
    chatWidget.style.height = '400px';
    chatWidget.style.background = '#fff';
    chatWidget.style.border = '1px solid #ccc';
    chatWidget.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
    chatWidget.style.fontFamily = 'Arial, sans-serif';
    chatWidget.style.zIndex = '1000';
  
    // Estructura interna: encabezado, área de mensajes e input
    chatWidget.innerHTML = `
      <div id="chat-header" style="padding: 10px; background: #007bff; color: #fff; font-weight: bold;">Asesor Virtual</div>
      <div id="chat-messages" style="height: 300px; overflow-y: auto; padding: 10px; background: #f9f9f9;"></div>
      <input id="chat-input" type="text" placeholder="Escribe tu mensaje..." style="width: calc(100% - 20px); margin: 10px; padding: 5px;" />
    `;
    document.body.appendChild(chatWidget);
  
    const input = document.getElementById('chat-input');
    const messagesDiv = document.getElementById('chat-messages');
  
    // Función para añadir mensajes al área de chat
    function addMessage(sender, text) {
      const msgDiv = document.createElement('div');
      msgDiv.style.marginBottom = '8px';
      msgDiv.textContent = sender + ': ' + text;
      messagesDiv.appendChild(msgDiv);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  
    // Manejar la pulsación de "Enter" para enviar el mensaje
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && input.value.trim() !== '') {
        const userMessage = input.value.trim();
        addMessage('Tú', userMessage);
        input.value = '';
  
        // Realizar la petición al backend
        fetch('http://localhost:3000/api/chat', {  // Reemplaza 'TU_DOMINIO_DEL_BACKEND' por la URL de tu servidor
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: userMessage,
            clientId: 'ID_UNICO_DEL_CLIENTE' // Puedes parametrizar este valor según el cliente
          })
        })
        .then(response => response.json())
        .then(data => {
          addMessage('Asesor', data.response);
        })
        .catch(error => {
          console.error('Error:', error);
          addMessage('Asesor', 'Ocurrió un error al procesar tu mensaje.');
        });
      }
    });
  })();
  