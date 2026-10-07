const mongoose = require("mongoose");

// Un comentario guarda la publicación y su comentario "padre" (null si es de primer nivel).
// Así la base de datos guarda el árbol "plano" y el frontend lo reconstruye con el árbol n-ario.
const comentarioSchema = new mongoose.Schema(
  {
    publicacion: { type: mongoose.Schema.Types.ObjectId, ref: "Publicacion", required: true, index: true },
    padre: { type: mongoose.Schema.Types.ObjectId, ref: "Comentario", default: null },
    autor: { type: String, required: true, trim: true },
    texto: { type: String, required: true, trim: true, maxlength: 280 },
    likes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comentario", comentarioSchema);
