const mongoose = require("mongoose");

// Elementos de la cola de notificaciones: se atienden por orden de creación (FIFO).
const notificacionSchema = new mongoose.Schema(
  {
    usuario: { type: String, required: true, index: true },
    mensaje: { type: String, required: true, maxlength: 300 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notificacion", notificacionSchema);
