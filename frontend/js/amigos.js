// Página de Amigos: grafo (amigos y sugerencias) + búsqueda de usuarios (BST).
// Usa lo definido en app.js: red, arbolUsuarios, ejecutar, boton y USUARIO_ACTUAL.
let textoBusqueda = "";

function enComun(n) {
  return n + (n === 1 ? " amigo en común" : " amigos en común");
}
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
  return ejecutar(() => api.crearAmistad(USUARIO_ACTUAL, nombre));
}

function eliminarAmigo(nombre) {
  return ejecutar(() => api.borrarAmistad(USUARIO_ACTUAL, nombre));
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

// Dibuja solo los resultados de la búsqueda (así el cuadro de texto no pierde el foco al escribir)
function dibujarResultados(contenedor) {
  contenedor.innerHTML = "";
  const texto = textoBusqueda.trim();
  if (texto === "") return;

  const { nombres, visitados } = arbolUsuarios.buscarPrefijo(texto);
  const otros = nombres.filter((n) => n !== USUARIO_ACTUAL);

  const info = document.createElement("p");
  info.className = "ayuda";
  info.textContent =
    "El BST revisó " + visitados + " de " + arbolUsuarios.size + " usuarios (altura del árbol: " +
    arbolUsuarios.altura() + ").";
  contenedor.append(info);

  if (otros.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "vacio";
    vacio.textContent = "No hay usuarios que empiecen con «" + texto + "».";
    contenedor.append(vacio);
  }
  otros.forEach((nombre) => {
    if (red.areConnected(USUARIO_ACTUAL, nombre)) {
      contenedor.append(crearPersona(nombre, "Ya es tu amigo", "Eliminar", "btn-peligro", () => eliminarAmigo(nombre)));
    } else {
      const cantidad = red.amigosEnComun(USUARIO_ACTUAL, nombre).length;
      contenedor.append(crearPersona(nombre, enComun(cantidad), "Agregar", null, () => agregarAmigo(nombre)));
    }
  });

  // Si el nombre exacto no existe, se puede registrar (inserta en la base de datos y en el BST)
  if (texto.length >= 2 && arbolUsuarios.buscarExacto(texto) === null) {
    const registrar = boton("Registrar a «" + texto + "» como nuevo usuario", () =>
      ejecutar(() => api.crearUsuario(texto))
    );
    registrar.className = "btn-registrar";
    contenedor.append(registrar);
  }
}

function crearTarjetaBusqueda() {
  const tarjeta = document.createElement("section");
  tarjeta.className = "tarjeta";
  const t = document.createElement("h2");
  t.textContent = "Buscar personas";
  const ayuda = document.createElement("p");
  ayuda.className = "ayuda";
  ayuda.textContent = "Escribe el inicio de un nombre. La búsqueda usa un árbol binario de búsqueda (BST).";

  const campo = document.createElement("input");
  campo.type = "search";
  campo.id = "busqueda";
  campo.placeholder = "Ej: ca, san, val...";
  campo.maxLength = 60;
  campo.value = textoBusqueda;

  const resultados = document.createElement("div");
  resultados.id = "resultados";
  campo.addEventListener("input", () => {
    textoBusqueda = campo.value;
    dibujarResultados(resultados);
  });

  tarjeta.append(t, ayuda, campo, resultados);
  dibujarResultados(resultados);
  return tarjeta;
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
    const cantidad = red.amigosEnComun(USUARIO_ACTUAL, nombre).length;
    tarjetaAmigos.append(
      crearPersona(nombre, enComun(cantidad), "Eliminar", "btn-peligro", () => eliminarAmigo(nombre))
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
      crearPersona(s.nombre, enComun(s.enComun), "Agregar", null, () => agregarAmigo(s.nombre))
    );
  });

  vistaAmigos.append(crearTarjetaBusqueda(), tarjetaAmigos, tarjetaSug);
}

navHome.addEventListener("click", () => mostrarVista("home"));
navAmigos.addEventListener("click", () => mostrarVista("amigos"));
