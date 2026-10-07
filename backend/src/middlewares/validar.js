const mongoose = require("mongoose");

class ErrorHttp extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

// Verifica que :id sea un ObjectId válido antes de consultar la base de datos
function validarId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ErrorHttp(400, "El id no es válido");
  }
  next();
}

// Devuelve el texto limpio o lanza un error 400
function textoValido(valor, campo, max = 280) {
  if (typeof valor !== "string" || valor.trim() === "") {
    throw new ErrorHttp(400, `El campo "${campo}" es obligatorio`);
  }
  const limpio = valor.trim();
  if (limpio.length > max) {
    throw new ErrorHttp(400, `El campo "${campo}" no puede superar ${max} caracteres`);
  }
  return limpio;
}

module.exports = { ErrorHttp, validarId, textoValido };
