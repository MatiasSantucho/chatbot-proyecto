console.log("Iniciando servidor...");
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware para habilitar CORS y parsear JSON
app.use(cors());
app.use(express.json());

// Endpoint para procesar mensajes del chatbot
app.post('/api/chat', (req, res) => {
  const { message, clientId } = req.body;
  console.log(`Mensaje recibido de ${clientId}: ${message}`);
  res.json({ response: `Has dicho: ${message}` });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
