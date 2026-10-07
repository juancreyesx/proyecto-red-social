// Lógica de la pantalla Home
// Etapa 1: publicaciones (lista enlazada). Etapa 2: comentarios (árbol n-ario).
const USUARIO_ACTUAL = "Juan Camilo";
const lista = new ListaPublicaciones();
let siguienteId = 1;          // sirve para publicaciones y comentarios
let formularioAbierto = null; // dónde está abierto el cuadro de respuesta: "p3" o "c7"

const campoTexto = document.getElementById("texto");
const contador = document.getElementById("contador");
const botonPublicar = document.getElementById("btn-publicar");
const feed = document.getElementById("feed");

/* ---------- Publicaciones ---------- */
function crearPublicacion() {
  const texto = campoTexto.value.trim();
  if (texto === "") return;

  lista.agregarAlInicio({
    id: siguienteId++,
    autor: USUARIO_ACTUAL,
    texto: texto,
    fecha: new Date().toLocaleString("es-CO"),
    likes: 0,
    comentarios: new ArbolComentarios(), // cada publicación tiene su árbol
  });

  campoTexto.value = "";
  actualizarContador();
  dibujarFeed();
}

function darLikePublicacion(id) {
  const publicacion = lista.buscarPorId(id);
  if (publicacion) {
    publicacion.likes++;
    dibujarFeed();
  }
}

function borrarPublicacion(id) {
  lista.eliminar(id);
  dibujarFeed();
}

/* ---------- Comentarios ---------- */
function agregarComentario(publicacion, idPadre, texto) {
  texto = texto.trim();
  if (texto === "") return;
  publicacion.comentarios.agregar(idPadre, {
    id: siguienteId++,
    autor: USUARIO_ACTUAL,
    texto: texto,
    fecha: new Date().toLocaleString("es-CO"),
    likes: 0,
  });
  formularioAbierto = null;
  dibujarFeed();
}

function darLikeComentario(publicacion, idComentario) {
  const nodo = publicacion.comentarios.buscarNodo(idComentario);
  if (nodo) {
    nodo.value.likes++;
    dibujarFeed();
  }
}

function borrarComentario(publicacion, idComentario) {
  publicacion.comentarios.eliminar(idComentario);
  dibujarFeed();
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
dibujarFeed();
