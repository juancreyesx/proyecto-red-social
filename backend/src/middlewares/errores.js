function noEncontrada(req, res) {
  res.status(404).json({ error: "Ruta no encontrada" });
}

// Express 5 envía aquí cualquier error lanzado dentro de los controladores (incluso async)
function manejarErrores(err, req, res, next) {
  if (err.code === 11000) return res.status(409).json({ error: "Ese registro ya existe" });
  if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "JSON mal formado" });
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? "Error interno del servidor" : err.message });
}

module.exports = { noEncontrada, manejarErrores };
