const path = require("path");
const express = require("express");
const cors = require("cors");
const config = require("./config");
const rutas = require("./routes");
const { noEncontrada, manejarErrores } = require("./middlewares/errores");

function crearApp() {
  const app = express();
  app.use(cors({ origin: config.CORS_ORIGIN === "*" ? true : config.CORS_ORIGIN.split(",") }));
  app.use(express.json({ limit: "20kb" }));

  app.use("/api", rutas);
  app.use("/api", noEncontrada);

  // El mismo servidor entrega el frontend, así en local y en Render todo vive en una sola URL
  app.use(express.static(path.join(__dirname, "..", "..", "frontend")));

  app.use(manejarErrores);
  return app;
}

module.exports = { crearApp };
