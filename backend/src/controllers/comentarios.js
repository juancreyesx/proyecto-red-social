const mongoose = require("mongoose");
const Publicacion = require("../models/Publicacion");
const Comentario = require("../models/Comentario");
const Usuario = require("../models/Usuario");
const { ErrorHttp, textoValido } = require("../middlewares/validar");
const { crearNotificacion } = require("./notificaciones");

const resumir = (t) => (t.length > 30 ? t.slice(0, 30) + "…" : t);

// POST /api/publicaciones/:id/comentarios  { autor, texto, padre? }
async function crear(req, res) {
  const autor = textoValido(req.body.autor, "autor", 60);
  const texto = textoValido(req.body.texto, "texto");
  const { padre = null } = req.body;
  if (!(await Usuario.exists({ nombre: autor }))) throw new ErrorHttp(404, "El usuario no existe");

  const pub = await Publicacion.findById(req.params.id);
  if (!pub) throw new ErrorHttp(404, "La publicación no existe");

  let comentarioPadre = null;
  if (padre !== null) {
    if (!mongoose.isValidObjectId(padre)) throw new ErrorHttp(400, "El comentario padre no es válido");
    comentarioPadre = await Comentario.findOne({ _id: padre, publicacion: pub._id });
    if (!comentarioPadre) throw new ErrorHttp(404, "El comentario al que respondes no existe en esta publicación");
  }

  const c = await Comentario.create({
    publicacion: pub._id,
    padre: comentarioPadre ? comentarioPadre._id : null,
    autor,
    texto,
  });

  if (comentarioPadre) {
    await crearNotificacion(comentarioPadre.autor, "Nueva respuesta a tu comentario «" + resumir(comentarioPadre.texto) + "»");
  } else {
    await crearNotificacion(pub.autor, "Nuevo comentario en «" + resumir(pub.texto) + "»");
  }
  res.status(201).json({ id: c._id.toString() });
}

async function darLike(req, res) {
  const c = await Comentario.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { returnDocument: "after" });
  if (!c) throw new ErrorHttp(404, "El comentario no existe");
  await crearNotificacion(c.autor, "Me gusta en tu comentario «" + resumir(c.texto) + "»");
  res.json({ likes: c.likes });
}

// Eliminar un comentario elimina también todas sus respuestas (todo el subárbol)
async function eliminar(req, res) {
  const raiz = await Comentario.findById(req.params.id);
  if (!raiz) throw new ErrorHttp(404, "El comentario no existe");

  const todos = await Comentario.find({ publicacion: raiz.publicacion }, { padre: 1 });
  const hijosDe = new Map();
  todos.forEach((c) => {
    const k = c.padre ? c.padre.toString() : null;
    if (!hijosDe.has(k)) hijosDe.set(k, []);
    hijosDe.get(k).push(c._id.toString());
  });

  const ids = [];
  const pila = [raiz._id.toString()]; // recorrido en profundidad con pila
  while (pila.length) {
    const id = pila.pop();
    ids.push(id);
    (hijosDe.get(id) || []).forEach((h) => pila.push(h));
  }
  await Comentario.deleteMany({ _id: { $in: ids } });
  res.json({ eliminados: ids.length });
}

module.exports = { crear, darLike, eliminar };
