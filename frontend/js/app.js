// Lógica de la pantalla Home y carga de datos.
// Los datos viven en MongoDB (backend). Al cargar, el servidor entrega todo en "crudo"
// y aquí lo reconstruimos en las 5 estructuras de datos:
//   publicaciones -> lista enlazada | comentarios -> árbol n-ario | notificaciones -> cola
//   usuarios + amistades -> grafo   | usuarios -> árbol binario de búsqueda (BST)
const USUARIO_ACTUAL = "Juan Camilo";
let lista = new ListaPublicaciones();
let notificaciones = new ColaNotificaciones();
let red = new Grafo();
let arbolUsuarios = new ArbolUsuarios();
let formularioAbierto = null; // dónde está abierto el cuadro de respuesta: "p3" o "c7"
let panelNotifAbierto = false;

const campoTexto = document.getElementById("texto");
const contador = document.getElementById("contador");
const botonPublicar = document.getElementById("btn-publicar");
const feed = document.getElementById("feed");
const botonNotif = document.getElementById("btn-notif");
const panelNotif = document.getElementById("panel-notif");

/* ---------- Notificaciones (cola) ---------- */
function resumir(texto) {
  return texto.length > 30 ? texto.slice(0, 30) + "…" : texto;
}

async function atenderSiguiente() {
  await ejecutar(() => api.atenderNotificacion(USUARIO_ACTUAL));
}

async function vaciarNotificaciones() {
  await ejecutar(() => api.vaciarNotificaciones(USUARIO_ACTUAL));
}

function dibujarNotificaciones() {
  botonNotif.textContent = "Notificaciones (" + notificaciones.size() + ")";
  panelNotif.hidden = !panelNotifAbierto;
  panelNotif.innerHTML = "";
  if (!panelNotifAbierto) return;

  const titulo = document.createElement("h2");
  titulo.textContent = "Notificaciones";
  const ayuda = document.createElement("p");
  ayuda.className = "ayuda";
  ayuda.textContent = "Se atienden en orden de llegada: la primera que llega es la primera que sale (cola).";
  panelNotif.append(titulo, ayuda);

  if (notificaciones.isEmpty()) {
    const vacio = document.createElement("p");
    vacio.className = "vacio";
    vacio.textContent = "No tienes notificaciones pendientes.";
    panelNotif.append(vacio);
    return;
  }

  const ol = document.createElement("ol");
  notificaciones.recorrer().forEach((n, i) => {
    const li = document.createElement("li");
    li.textContent = n.hora + " - " + n.mensaje;
    if (i === 0) li.className = "siguiente"; // el primero es el siguiente en atender
    ol.append(li);
  });

  const acciones = document.createElement("div");
  acciones.className = "acciones";
  acciones.append(
    boton("Atender siguiente", atenderSiguiente),
    boton("Vaciar", vaciarNotificaciones)
  );
  panelNotif.append(ol, acciones);
}

botonNotif.addEventListener("click", () => {
  panelNotifAbierto = !panelNotifAbierto;
  dibujarNotificaciones();
});

/* ---------- Conexión con el backend ---------- */
const aviso = document.getElementById("aviso");

function mostrarAviso(mensaje) {
  aviso.hidden = !mensaje;
  aviso.textContent = mensaje || "";
}

// Reconstruye las estructuras de datos con lo que hay en la base de datos y vuelve a dibujar todo
async function cargarEstado() {
  const e = await api.estado(USUARIO_ACTUAL);

  lista = new ListaPublicaciones();
  e.publicaciones.forEach((p) => {            // vienen de la más vieja a la más nueva
    const arbol = new ArbolComentarios();
    p.comentarios.forEach((c) => arbol.agregar(c.padre, c)); // el padre siempre llega antes que sus hijas
    lista.agregarAlInicio({ ...p, comentarios: arbol });
  });

  notificaciones = new ColaNotificaciones();
  e.notificaciones.forEach((n) => notificaciones.encolar(n));

  red = new Grafo();
  e.usuarios.forEach((u) => red.addNode(u));
  e.amistades.forEach(([a, b]) => red.addEdge(a, b));

  arbolUsuarios = ArbolUsuarios.desdeLista(e.usuarios);

  mostrarAviso("");
  dibujarFeed();
  dibujarNotificaciones();
  if (typeof dibujarAmigos === "function" && !vistaAmigos.hidden) dibujarAmigos();
}

// Ejecuta una acción contra el API y recarga; si algo falla muestra el mensaje en pantalla
async function ejecutar(accion) {
  try {
    await accion();
    await cargarEstado();
  } catch (error) {
    mostrarAviso(error.message);
  }
}

/* ---------- Publicaciones ---------- */
async function crearPublicacion() {
  const texto = campoTexto.value.trim();
  if (texto === "") return;
  await ejecutar(() => api.crearPublicacion(USUARIO_ACTUAL, texto));
  campoTexto.value = "";
  actualizarContador();
}

function darLikePublicacion(id) {
  return ejecutar(() => api.likePublicacion(id));
}

function borrarPublicacion(id) {
  return ejecutar(() => api.borrarPublicacion(id));
}

/* ---------- Comentarios ---------- */
async function agregarComentario(publicacion, idPadre, texto) {
  texto = texto.trim();
  if (texto === "") return;
  formularioAbierto = null;
  await ejecutar(() => api.crearComentario(publicacion.id, USUARIO_ACTUAL, texto, idPadre));
}

function darLikeComentario(publicacion, idComentario) {
  return ejecutar(() => api.likeComentario(idComentario));
}

function borrarComentario(publicacion, idComentario) {
  return ejecutar(() => api.borrarComentario(idComentario));
}

/* ---------- Dibujo en pantalla ---------- */
function boton(texto, alHacerClic) {
  const b = document.createElement("button");
  b.textContent = texto;
  b.addEventListener("click", alHacerClic);
  return b;
}

function crearFormulario(placeholder, alEnviar) {
  const form = document.createElement("div");
  form.className = "form-comentario";
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = placeholder;
  input.maxLength = 280;
  const enviar = boton("Enviar", () => alEnviar(input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") alEnviar(input.value);
  });
  form.append(input, enviar);
  setTimeout(() => input.focus(), 0);
  return form;
}

function crearEncabezado(autorTexto, fechaTexto) {
  const cab = document.createElement("div");
  const autor = document.createElement("span");
  autor.className = "autor";
  autor.textContent = autorTexto;
  const fecha = document.createElement("span");
  fecha.className = "fecha";
  fecha.textContent = fechaTexto;
  cab.append(autor, fecha);
  return cab;
}

function dibujarComentario(publicacion, item) {
  const c = item.comentario;
  const caja = document.createElement("div");
  caja.className = "comentario";
  caja.style.marginLeft = item.nivel * 20 + "px"; // sangría según la profundidad

  const texto = document.createElement("p");
  texto.textContent = c.texto; // textContent evita que se ejecute HTML escrito por el usuario

  const acciones = document.createElement("div");
  acciones.className = "acciones";
  acciones.append(
    boton("Me gusta (" + c.likes + ")", () => darLikeComentario(publicacion, c.id)),
    boton("Responder", () => {
      formularioAbierto = formularioAbierto === "c" + c.id ? null : "c" + c.id;
      dibujarFeed();
    }),
    boton("Eliminar", () => borrarComentario(publicacion, c.id))
  );

  caja.append(crearEncabezado(c.autor, c.fecha), texto, acciones);

  if (formularioAbierto === "c" + c.id) {
    caja.append(
      crearFormulario("Escribe tu respuesta...", (t) => agregarComentario(publicacion, c.id, t))
    );
  }
  return caja;
}

function dibujarFeed() {
  feed.innerHTML = "";
  const publicaciones = lista.recorrer();

  if (publicaciones.length === 0) {
    feed.innerHTML = '<p class="vacio">Aún no hay publicaciones. ¡Escribe la primera!</p>';
    return;
  }

  publicaciones.forEach((p) => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "post";

    const texto = document.createElement("p");
    texto.textContent = p.texto;

    const total = p.comentarios.contar();
    const acciones = document.createElement("div");
    acciones.className = "acciones";
    acciones.append(
      boton("Me gusta (" + p.likes + ")", () => darLikePublicacion(p.id)),
      boton("Comentar (" + total + ")", () => {
        formularioAbierto = formularioAbierto === "p" + p.id ? null : "p" + p.id;
        dibujarFeed();
      }),
      boton("Eliminar", () => borrarPublicacion(p.id))
    );

    tarjeta.append(crearEncabezado(p.autor, p.fecha), texto, acciones);

    if (formularioAbierto === "p" + p.id) {
      tarjeta.append(
        crearFormulario("Escribe un comentario...", (t) => agregarComentario(p, null, t))
      );
    }

    if (total > 0) {
      const zona = document.createElement("div");
      zona.className = "comentarios";
      p.comentarios.recorrer().forEach((item) => zona.append(dibujarComentario(p, item)));
      tarjeta.append(zona);
    }

    feed.append(tarjeta);
  });
}

function actualizarContador() {
  contador.textContent = campoTexto.value.length + " / 280";
  botonPublicar.disabled = campoTexto.value.trim() === "";
}

campoTexto.addEventListener("input", actualizarContador);
botonPublicar.addEventListener("click", crearPublicacion);

actualizarContador();
