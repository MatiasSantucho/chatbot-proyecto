// backend/server.js

// 1. Cargar variables de entorno PRIMERO que nada
require('dotenv').config();

// 2. Importar módulos necesarios
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");
// Importar el modelo de conversación (asegúrate que la ruta sea correcta)
// Si 'models' está al mismo nivel que server.js, la ruta es './models/Conversation'
// Si server.js está dentro de 'backend', y 'models' también, la ruta es './models/Conversation'
const Conversation = require('./models/Conversation');

// 3. Inicializar Express
const app = express();
// Usar process.env.PORT o un valor por defecto (ej. 3000 o 3001)
const port = process.env.PORT || 3000;

// 4. Middlewares
app.use(cors()); // Habilita CORS para todas las solicitudes
app.use(express.json()); // Permite parsear JSON en el body de las requests

// 5. Conexión a MongoDB
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.error("ERROR FATAL: MONGODB_URI no está definida en el archivo .env.");
  process.exit(1); // Salir si no hay URI de DB
}
// Opciones de conexión (pueden ayudar con algunos warnings o errores futuros)
const mongoOptions = {
  // useNewUrlParser: true, // Deprecated, no longer needed in recent Mongoose versions
  // useUnifiedTopology: true // Deprecated, no longer needed
};
mongoose.connect(mongoURI, mongoOptions)
  .then(() => console.log('MongoDB conectado exitosamente.'))
  .catch(err => {
    console.error('Error de conexión con MongoDB:', err);
    process.exit(1); // Salir si la conexión falla
  });

// 6. Configuración de Gemini
const geminiAPIKey = process.env.GEMINI_API_KEY;
if (!geminiAPIKey) {
  console.error("ERROR FATAL: GEMINI_API_KEY no está definida en el archivo .env.");
  process.exit(1); // Salir si no hay API key de Gemini
}
const genAI = new GoogleGenerativeAI(geminiAPIKey);
// Configuración para la generación de respuestas
const generationConfig = {
  // temperature: 0.7, // Puedes ajustar la creatividad
  maxOutputTokens: 8192, // Límite de tokens para la respuesta
};
// Obtener el modelo con la configuración
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest", // Modelo a usar
  generationConfig: generationConfig
});

// 7. Definición del Endpoint '/api/chat' (¡Solo una vez!)
app.post('/api/chat', async (req, res) => { // ¡Asegúrate que 'async' esté aquí!
  // Extraer datos del cuerpo de la solicitud
  const { message, clientId } = req.body;
  // Crear un prefijo para los logs de esta sesión específica
  const logPrefix = `[${clientId || 'UnknownSession'}]`;

  console.log(`${logPrefix} Mensaje recibido: ${message}`);

  // Validar que el mensaje no esté vacío
  if (!message || message.trim() === '') {
      return res.status(400).json({ response: 'El mensaje no puede estar vacío.' });
  }

  // Instrucciones para darle contexto y personalidad a Gemini
  const systemInstructions = `Eres 'SantecBot', un asistente virtual IA creado por Santec Software para ayudar a los usuarios de este sitio web. Tu personalidad debe ser siempre **amable, servicial y paciente**.

**Tu Rol y Contexto:**
* Actúas como el primer punto de contacto en esta página web (imagina que es una tienda de ropa local en San Lorenzo, Santa Fe, Argentina, a menos que se te indique otro contexto).
* Tu objetivo es ayudar a los visitantes respondiendo sus preguntas sobre la tienda, sus productos, horarios, proceso de compra, etc.
* Eres un chatbot diseñado específicamente para integrarse en sitios web de clientes de Santec Software.

**Instrucciones de Conversación:**
* Saluda siempre cordialmente al inicio si parece ser el primer mensaje.
* Usa un lenguaje claro, cercano pero respetuoso. Evita ser demasiado técnico.
* Si no sabes la respuesta a una pregunta específica sobre la tienda (ej. stock exacto de un producto), indícalo honestamente y sugiere cómo el usuario podría obtener la información (ej. "No tengo acceso a esa información específica del inventario en tiempo real, pero puedes contactar directamente a la tienda en [sugiere método de contacto si lo sabes]"). No inventes detalles.
* Sé conciso pero completo en tus respuestas.
* Despídete amablemente al finalizar la interacción si parece apropiado.`;

  // Combinar instrucciones con el mensaje del usuario para formar el prompt completo
  const fullPrompt = `${systemInstructions}\n\nMensaje del Usuario: ${message}`;

  try {
    // Llamada a la API de Gemini
    console.log(`${logPrefix} Llamando a Gemini API...`);
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;

    // Verificar si la respuesta fue bloqueada por seguridad u otra razón
    if (!response || !response.candidates || response.candidates.length === 0 || !response.candidates[0].content) {
        console.warn(`${logPrefix} Respuesta de Gemini bloqueada o vacía.`);
        // Intentar obtener la razón del bloqueo si está disponible
        const blockReason = response?.promptFeedback?.blockReason;
        const safetyRatings = response?.promptFeedback?.safetyRatings;
        console.warn(`${logPrefix} Razón Bloqueo: ${blockReason || 'No disponible'}, Ratings: ${JSON.stringify(safetyRatings)}`);
        throw new Error('Respuesta de IA bloqueada o inválida.'); // Lanzar error para ir al catch
    }

    const botReply = response.text() || "Lo siento, no pude procesar la respuesta."; // Extraer texto
    console.log(`${logPrefix} Respuesta de Gemini: ${botReply}`);

    // Guardado en MongoDB
    try {
      // Verificar que el modelo Conversation fue importado correctamente
      if (typeof Conversation !== 'undefined') {
          const newConversation = new Conversation({
            sessionId: clientId || 'defaultSession', // Usar ID por defecto si no viene
            userMessage: message,
            botMessage: botReply
          });
          await newConversation.save(); // Guardar en la base de datos
          console.log(`${logPrefix} Conversación guardada en DB.`);
      } else {
          // Advertencia si el modelo no se pudo importar (error en la ruta de require?)
          console.warn(`${logPrefix} Modelo Conversation no definido. No se guardó en DB.`);
      }
    } catch (dbError) {
      // Manejar errores específicos del guardado en la base de datos
      console.error(`${logPrefix} Error al guardar la conversación en DB:`, dbError);
      // No interrumpir la respuesta al usuario, pero registrar el error
    }

    // Enviar la respuesta de Gemini (o mensaje de error si aplica) al frontend
    res.json({ response: botReply });

  } catch (apiError) {
    // Manejar errores generales de la API de Gemini o del procesamiento
    console.error(`${logPrefix} Error en el endpoint /api/chat:`, apiError);
    // Enviar un estado 500 y un mensaje de error genérico
    res.status(500).json({ response: 'Hubo un problema al contactar al asistente de IA.' });
  }
}); // <-- Llave de cierre de app.post('/api/chat', ...)

// 8. Iniciar el Servidor Express (¡Solo una vez al final!)
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
