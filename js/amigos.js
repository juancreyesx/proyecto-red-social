// Etapa 4: página de Amigos (grafo) y navegación entre Home y Amigos.
// Usa funciones de app.js (notificar, boton) y la constante USUARIO_ACTUAL.
const red = new Grafo();

// Personas de ejemplo (simulan los demás usuarios de la red)
["Camila Ortiz", "Andrés Mejía", "Valentina Ruiz", "Santiago Pérez", "Laura Gómez", "Mateo Rojas"]
  .forEach((nombre) => red.addNode(nombre));
red.addNode(USUARIO_ACTUAL);

// Amistades iniciales (aristas)
[
  [USUARIO_ACTUAL, "Camila Ortiz"],
  [USUARIO_ACTUAL, "Laura Gómez"],
  ["Camila Ortiz", "Andrés Mejía"],
  ["Camila Ortiz", "Valentina Ruiz"],
  ["Laura Gómez", "Valentina Ruiz"],
  ["Andrés Mejía", "Santiago Pérez"],
  ["Valentina Ruiz", "Santiago Pérez"],
  ["Santiago Pérez", "Mateo Rojas"],
].forEach(([a, b]) => red.addEdge(a, b));

const vistaHome = document.getElementById("vista-home");
const vistaAmigos = document.getElementById("vista-amigos");
const navHome = document.getElementById("nav-home");
const navAmigos = document.getElementById("nav-amigos");

function mostrarVista(nombre) {
  const enAmigos = nombre === "amigos";
  vistaHome.hidden = enAmigos;
  vistaAmigos.hidden = !enAmigos;
  navHome.classList.toggle("activo", !enAmigos);
  navAmigos.classList.toggle("activo", enAmigos);
  if (enAmigos) dibujarAmigos();
}

function agregarAmigo(nombre) {
  if (red.addEdge(USUARIO_ACTUAL, nombre)) {
    notificar(nombre + " ahora es tu amigo");
    dibujarAmigos();
  }
}

function eliminarAmigo(nombre) {
  if (red.removeEdge(USUARIO_ACTUAL, nombre)) {
    dibujarAmigos();
  }
}

function crearPersona(nombre, detalle, textoBoton, claseBoton, alHacerClic) {
  const fila = document.createElement("div");
  fila.className = "persona";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = nombre.charAt(0);

  const datos = document.createElement("div");
  datos.className = "datos";
  const n = document.createElement("div");
  n.className = "nombre";
  n.textContent = nombre;
  const d = document.createElement("div");
  d.className = "detalle";
  d.textContent = detalle;
  datos.append(n, d);

  const b = boton(textoBoton, alHacerClic);
  if (claseBoton) b.className = claseBoton;

  fila.append(avatar, datos, b);
  return fila;
}

function dibujarAmigos() {
  vistaAmigos.innerHTML = "";

  // --- Mis amigos: vecinos de mi nodo en el grafo ---
  const amigos = red.getNeighbors(USUARIO_ACTUAL);
  const tarjetaAmigos = document.createElement("section");
  tarjetaAmigos.className = "tarjeta";
  const t1 = document.createElement("h2");
  t1.textContent = "Mis amigos (" + amigos.length + ")";
  tarjetaAmigos.append(t1);

  if (amigos.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "vacio";
    vacio.textContent = "Aún no tienes amigos. Agrega a alguien de la lista de abajo.";
    tarjetaAmigos.append(vacio);
  }
  amigos.forEach((nombre) => {
    const enComun = red.amigosEnComun(USUARIO_ACTUAL, nombre).length;
    tarjetaAmigos.append(
      crearPersona(nombre, enComun + " amigos en común", "Eliminar", "btn-peligro", () => eliminarAmigo(nombre))
    );
  });

  // --- Agregar amigos: sugerencias ordenadas por amigos en común ---
  const sugeridos = red.sugerencias(USUARIO_ACTUAL);
  const tarjetaSug = document.createElement("section");
  tarjetaSug.className = "tarjeta";
  const t2 = document.createElement("h2");
  t2.textContent = "Personas que quizá conoces";
  const ayuda = document.createElement("p");
  ayuda.className = "ayuda";
  ayuda.textContent = "Se sugieren según tus amigos en común (recorriendo el grafo: amigos de tus amigos).";
  tarjetaSug.append(t2, ayuda);

  if (sugeridos.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "vacio";
    vacio.textContent = "Ya eres amigo de todos.";
    tarjetaSug.append(vacio);
  }
  sugeridos.forEach((s) => {
    tarjetaSug.append(
      crearPersona(s.nombre, s.enComun + " amigos en común", "Agregar", null, () => agregarAmigo(s.nombre))
    );
  });

  vistaAmigos.append(tarjetaAmigos, tarjetaSug);
}

navHome.addEventListener("click", () => mostrarVista("home"));
navAmigos.addEventListener("click", () => mostrarVista("amigos"));
