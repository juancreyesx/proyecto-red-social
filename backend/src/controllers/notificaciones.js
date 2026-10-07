const Notificacion = require("../models/Notificacion");
const { textoValido } = require("../middlewares/validar");

// Crea un aviso (lo usan también los otros controladores)
async function crearNotificacion(usuario, mensaje) {
  return Notificacion.create({ usuario, mensaje: mensaje.slice(0, 300) });
}

// Atender siguiente = sacar de la cola el aviso más antiguo (FIFO)
async function atenderSiguiente(req, res) {
  const usuario = textoValido(req.query.usuario, "usuario", 60);
  const primero = await Notificacion.findOneAndDelete({ usuario }, { sort: { createdAt: 1, _id: 1 } });
  res.json({ atendida: primero ? primero._id.toString() : null });
}

async function vaciar(req, res) {
  const usuario = textoValido(req.query.usuario, "usuario", 60);
  const r = await Notificacion.deleteMany({ usuario });
  res.json({ eliminadas: r.deletedCount });
}

module.exports = { crearNotificacion, atenderSiguiente, vaciar };
