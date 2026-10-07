const mongoose = require("mongoose");

const publicacionSchema = new mongoose.Schema(
  {
    autor: { type: String, required: true, trim: true },
    texto: { type: String, required: true, trim: true, maxlength: 280 },
    likes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Publicacion", publicacionSchema);
