// backend/models/Conversation.js
const mongoose = require('mongoose');

// Define el schema (la estructura) para cada documento de conversación
const conversationSchema = new mongoose.Schema({
  // Usaremos clientId que viene del frontend, o podríamos cambiarlo a sessionId
  // Es útil para agrupar mensajes de una misma 'sesión' del widget
  sessionId: {
    type: String,
    required: [true, 'Session ID is required.'], // Mensaje de error si falta
    index: true // Indexar ayuda a buscar conversaciones de una sesión específica más rápido
  },
  // El mensaje que envió el usuario
  userMessage: {
    type: String,
    required: [true, 'User message is required.']
  },
  // La respuesta que dio la IA (Gemini en este caso)
  botMessage: {
    type: String,
    required: [true, 'Bot message is required.']
  },
  // Fecha y hora en que se guardó el registro
  timestamp: {
    type: Date,
    default: Date.now // Se establece automáticamente al momento de la creación
  }
});

// Crea el modelo 'Conversation' a partir del schema.
// Mongoose usará este nombre (en plural y minúsculas: 'conversations')
// para la colección en MongoDB donde se guardarán los documentos.
const Conversation = mongoose.model('Conversation', conversationSchema);

// Exporta el modelo para poder usarlo en otros archivos (como server.js)
module.exports = Conversation;