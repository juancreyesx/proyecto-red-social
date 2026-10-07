// Lógica de la pantalla Home (etapa 1: publicaciones)
const USUARIO_ACTUAL = "Juan Camilo";
const lista = new ListaPublicaciones();
let siguienteId = 1;

const campoTexto = document.getElementById("texto");
const contador = document.getElementById("contador");
const botonPublicar = document.getElementById("btn-publicar");
const feed = document.getElementById("feed");

function crearPublicacion() {
  const texto = campoTexto.value.trim();
  if (texto === "") return;

  lista.agregarAlInicio({
    id: siguienteId++,
    autor: USUARIO_ACTUAL,
    texto: texto,
    fecha: new Date().toLocaleString("es-CO"),
    likes: 0,
  });

  campoTexto.value = "";
  actualizarContador();
  dibujarFeed();
}

function darLike(id) {
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

    const cabecera = document.createElement("div");
    const autor = document.createElement("span");
    autor.className = "autor";
    autor.textContent = p.autor;
    const fecha = document.createElement("span");
    fecha.className = "fecha";
    fecha.textContent = p.fecha;
    cabecera.append(autor, fecha);

    const texto = document.createElement("p");
    texto.textContent = p.texto; // textContent evita que se ejecute HTML escrito por el usuario

    const acciones = document.createElement("div");
    acciones.className = "acciones";
    const btnLike = document.createElement("button");
    btnLike.textContent = "Me gusta (" + p.likes + ")";
    btnLike.addEventListener("click", () => darLike(p.id));
    const btnBorrar = document.createElement("button");
    btnBorrar.textContent = "Eliminar";
    btnBorrar.addEventListener("click", () => borrarPublicacion(p.id));
    acciones.append(btnLike, btnBorrar);

    tarjeta.append(cabecera, texto, acciones);
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
