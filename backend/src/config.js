// Configuración leída de variables de entorno (archivo .env en local, panel de Render en producción)
require("dotenv").config({ quiet: true });

module.exports = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/minired",
  // Dominio del frontend si se publica aparte (ej. Netlify). "*" = cualquiera.
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  USUARIO_INICIAL: "Juan Camilo",
};
