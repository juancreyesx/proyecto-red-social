const mongoose = require("mongoose");
const config = require("./config");
const { crearApp } = require("./app");
const { sembrarSiVacia } = require("./seed");

async function iniciar() {
  await mongoose.connect(config.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("Conectado a MongoDB");
  if (await sembrarSiVacia()) console.log("Se crearon los datos iniciales");
  crearApp().listen(config.PORT, () => console.log("MiniRed lista en http://localhost:" + config.PORT));
}

iniciar().catch((err) => {
  console.error("No se pudo iniciar:", err.message);
  process.exit(1);
});
