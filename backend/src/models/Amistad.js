const mongoose = require("mongoose");

// Una arista del grafo. Los dos nombres se guardan ordenados (a < b) para que
// "Ana-Luis" y "Luis-Ana" sean la misma amistad (grafo no dirigido).
const amistadSchema = new mongoose.Schema(
  {
    a: { type: String, required: true },
    b: { type: String, required: true },
  },
  { timestamps: true }
);
amistadSchema.index({ a: 1, b: 1 }, { unique: true });

module.exports = mongoose.model("Amistad", amistadSchema);
