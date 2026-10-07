const Usuario = require("../models/Usuario");
const { textoValido } = require("../middlewares/validar");

async function crear(req, res) {
  const nombre = textoValido(req.body.nombre, "nombre", 60);
  const u = await Usuario.create({ nombre });
  res.status(201).json({ id: u._id.toString(), nombre: u.nombre });
}

module.exports = { crear };
