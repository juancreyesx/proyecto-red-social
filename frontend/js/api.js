// Comunicación con el backend (fetch). Todas las funciones devuelven una promesa.
async function llamarApi(metodo, ruta, cuerpo) {
  const base = window.MINIRED_API_URL || "";
  let respuesta;
  try {
    respuesta = await fetch(base + ruta, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch (e) {
    throw new Error("No se pudo conectar con el servidor. ¿Está encendido?");
  }
  if (respuesta.status === 204) return null;
  let datos = null;
  try { datos = await respuesta.json(); } catch (e) { /* respuesta sin cuerpo */ }
  if (!respuesta.ok) throw new Error((datos && datos.error) || "Error " + respuesta.status);
  return datos;
}

const api = {
  estado: (usuario) => llamarApi("GET", "/api/estado?usuario=" + encodeURIComponent(usuario)),
  crearPublicacion: (autor, texto) => llamarApi("POST", "/api/publicaciones", { autor, texto }),
  likePublicacion: (id) => llamarApi("POST", "/api/publicaciones/" + id + "/like"),
  borrarPublicacion: (id) => llamarApi("DELETE", "/api/publicaciones/" + id),
  crearComentario: (idPublicacion, autor, texto, padre) =>
    llamarApi("POST", "/api/publicaciones/" + idPublicacion + "/comentarios", { autor, texto, padre }),
  likeComentario: (id) => llamarApi("POST", "/api/comentarios/" + id + "/like"),
  borrarComentario: (id) => llamarApi("DELETE", "/api/comentarios/" + id),
  crearAmistad: (a, b) => llamarApi("POST", "/api/amistades", { a, b }),
  borrarAmistad: (a, b) =>
    llamarApi("DELETE", "/api/amistades?a=" + encodeURIComponent(a) + "&b=" + encodeURIComponent(b)),
  crearUsuario: (nombre) => llamarApi("POST", "/api/usuarios", { nombre }),
  atenderNotificacion: (usuario) =>
    llamarApi("DELETE", "/api/notificaciones/siguiente?usuario=" + encodeURIComponent(usuario)),
  vaciarNotificaciones: (usuario) =>
    llamarApi("DELETE", "/api/notificaciones?usuario=" + encodeURIComponent(usuario)),
};
