const Amistad = require("../models/Amistad");
const Usuario = require("../models/Usuario");
const { ErrorHttp, textoValido } = require("../middlewares/validar");
const { crearNotificacion } = require("./notificaciones");

const ordenar = (x, y) => (x < y ? [x, y] : [y, x]);

async function leerPareja(origen) {
  const x = textoValido(origen.a, "a", 60);
  const y = textoValido(origen.b, "b", 60);
  if (x === y) throw new ErrorHttp(400, "Una persona no puede ser amiga de sí misma");
  const existentes = await Usuario.countDocuments({ nombre: { $in: [x, y] } });
  if (existentes !== 2) throw new ErrorHttp(404, "Alguno de los usuarios no existe");
  return [x, y];
}

// POST /api/amistades { a, b }
async function crear(req, res) {
  const [x, y] = await leerPareja(req.body);
  const [a, b] = ordenar(x, y);
  if (await Amistad.exists({ a, b })) throw new ErrorHttp(409, "Ya son amigos");
  await Amistad.create({ a, b });
  await crearNotificacion(x, y + " ahora es tu amigo");
  await crearNotificacion(y, x + " te agregó como amigo");
  res.status(201).json({ a, b });
}

// DELETE /api/amistades?a=&b=
async function eliminar(req, res) {
  const [x, y] = await leerPareja(req.query);
  const [a, b] = ordenar(x, y);
  const r = await Amistad.deleteOne({ a, b });
  if (r.deletedCount === 0) throw new ErrorHttp(404, "No eran amigos");
  res.status(204).end();
}

module.exports = { crear, eliminar };
