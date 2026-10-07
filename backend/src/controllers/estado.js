const Usuario = require("../models/Usuario");
const Publicacion = require("../models/Publicacion");
const Comentario = require("../models/Comentario");
const Amistad = require("../models/Amistad");
const Notificacion = require("../models/Notificacion");
const { textoValido } = require("../middlewares/validar");

const fecha = (d) => d.toLocaleString("es-CO", { timeZone: "America/Bogota" });

// GET /api/estado?usuario=Nombre
// Devuelve TODO lo que el frontend necesita para reconstruir sus estructuras de datos:
// publicaciones (lista), comentarios (árbol), notificaciones (cola), usuarios+amistades (grafo / BST).
async function obtener(req, res) {
  const usuario = textoValido(req.query.usuario, "usuario", 60);
  const [usuarios, amistades, publicaciones, comentarios, notificaciones] = await Promise.all([
    Usuario.find().sort({ nombre: 1 }),
    Amistad.find(),
    Publicacion.find().sort({ createdAt: 1, _id: 1 }),
    Comentario.find().sort({ createdAt: 1, _id: 1 }),
    Notificacion.find({ usuario }).sort({ createdAt: 1, _id: 1 }),
  ]);

  const porPublicacion = new Map();
  comentarios.forEach((c) => {
    const k = c.publicacion.toString();
    if (!porPublicacion.has(k)) porPublicacion.set(k, []);
    porPublicacion.get(k).push({
      id: c._id.toString(),
      padre: c.padre ? c.padre.toString() : null,
      autor: c.autor,
      texto: c.texto,
      likes: c.likes,
      fecha: fecha(c.createdAt),
    });
  });

  res.json({
    usuarios: usuarios.map((u) => u.nombre),
    amistades: amistades.map((a) => [a.a, a.b]),
    publicaciones: publicaciones.map((p) => ({
      id: p._id.toString(),
      autor: p.autor,
      texto: p.texto,
      likes: p.likes,
      fecha: fecha(p.createdAt),
      comentarios: porPublicacion.get(p._id.toString()) || [],
    })),
    notificaciones: notificaciones.map((n) => ({
      id: n._id.toString(),
      mensaje: n.mensaje,
      hora: n.createdAt.toLocaleTimeString("es-CO", { timeZone: "America/Bogota" }),
    })),
  });
}

module.exports = { obtener };
