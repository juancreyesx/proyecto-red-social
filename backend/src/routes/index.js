const { Router } = require("express");
const mongoose = require("mongoose");
const { validarId } = require("../middlewares/validar");
const estado = require("../controllers/estado");
const publicaciones = require("../controllers/publicaciones");
const comentarios = require("../controllers/comentarios");
const amistades = require("../controllers/amistades");
const usuarios = require("../controllers/usuarios");
const notificaciones = require("../controllers/notificaciones");

const r = Router();

r.get("/salud", (req, res) => {
  res.json({ ok: true, baseDeDatos: mongoose.connection.readyState === 1 ? "conectada" : "desconectada" });
});
r.get("/estado", estado.obtener);

r.post("/usuarios", usuarios.crear);

r.post("/publicaciones", publicaciones.crear);
r.post("/publicaciones/:id/like", validarId, publicaciones.darLike);
r.delete("/publicaciones/:id", validarId, publicaciones.eliminar);

r.post("/publicaciones/:id/comentarios", validarId, comentarios.crear);
r.post("/comentarios/:id/like", validarId, comentarios.darLike);
r.delete("/comentarios/:id", validarId, comentarios.eliminar);

r.post("/amistades", amistades.crear);
r.delete("/amistades", amistades.eliminar);

r.delete("/notificaciones/siguiente", notificaciones.atenderSiguiente);
r.delete("/notificaciones", notificaciones.vaciar);

module.exports = r;
