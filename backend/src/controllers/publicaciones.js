const Publicacion = require("../models/Publicacion");
const Comentario = require("../models/Comentario");
const Usuario = require("../models/Usuario");
const { ErrorHttp, textoValido } = require("../middlewares/validar");
const { crearNotificacion } = require("./notificaciones");

const resumir = (t) => (t.length > 30 ? t.slice(0, 30) + "…" : t);

async function crear(req, res) {
  const autor = textoValido(req.body.autor, "autor", 60);
  const texto = textoValido(req.body.texto, "texto");
  if (!(await Usuario.exists({ nombre: autor }))) throw new ErrorHttp(404, "El usuario no existe");
  const p = await Publicacion.create({ autor, texto });
  res.status(201).json({ id: p._id.toString() });
}

async function darLike(req, res) {
  const p = await Publicacion.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { returnDocument: "after" });
  if (!p) throw new ErrorHttp(404, "La publicación no existe");
  await crearNotificacion(p.autor, "Me gusta en tu publicación «" + resumir(p.texto) + "»");
  res.json({ likes: p.likes });
}

// Borrar una publicación también borra todo su árbol de comentarios
async function eliminar(req, res) {
  const p = await Publicacion.findByIdAndDelete(req.params.id);
  if (!p) throw new ErrorHttp(404, "La publicación no existe");
  await Comentario.deleteMany({ publicacion: p._id });
  res.status(204).end();
}

module.exports = { crear, darLike, eliminar };
