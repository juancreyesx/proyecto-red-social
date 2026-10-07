// Datos iniciales (se ejecuta solo si la base está vacía). También: npm run seed
const Usuario = require("./models/Usuario");
const Amistad = require("./models/Amistad");
const config = require("./config");

const PERSONAS = ["Camila Ortiz", "Andrés Mejía", "Valentina Ruiz", "Santiago Pérez", "Laura Gómez", "Mateo Rojas", "Daniela Castro", "Felipe Vargas"];
const AMISTADES = [
  [config.USUARIO_INICIAL, "Camila Ortiz"],
  [config.USUARIO_INICIAL, "Laura Gómez"],
  ["Camila Ortiz", "Andrés Mejía"],
  ["Camila Ortiz", "Valentina Ruiz"],
  ["Laura Gómez", "Valentina Ruiz"],
  ["Andrés Mejía", "Santiago Pérez"],
  ["Valentina Ruiz", "Santiago Pérez"],
  ["Santiago Pérez", "Mateo Rojas"],
  ["Mateo Rojas", "Daniela Castro"],
  ["Daniela Castro", "Felipe Vargas"],
];

async function sembrarSiVacia() {
  if ((await Usuario.estimatedDocumentCount()) > 0) return false;
  await Usuario.insertMany([config.USUARIO_INICIAL, ...PERSONAS].map((nombre) => ({ nombre })));
  await Amistad.insertMany(
    AMISTADES.map(([x, y]) => (x < y ? { a: x, b: y } : { a: y, b: x }))
  );
  return true;
}

module.exports = { sembrarSiVacia };

if (require.main === module) {
  const mongoose = require("mongoose");
  mongoose
    .connect(config.MONGODB_URI)
    .then(sembrarSiVacia)
    .then((hecho) => console.log(hecho ? "Datos iniciales creados" : "La base ya tiene datos"))
    .finally(() => mongoose.disconnect());
}
