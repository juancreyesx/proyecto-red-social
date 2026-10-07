// Prueba de pantalla completa: abre el index.html real en jsdom, lo conecta al backend real
// (con MongoDB/FerretDB) y simula los clics de una persona usando la aplicación.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { JSDOM } = require("jsdom");
const { crearApp } = require("../src/app");
const { sembrarSiVacia } = require("../src/seed");

const URI = process.env.MONGODB_TEST_URI_UI || "mongodb://127.0.0.1:27017/minired_test_ui";
const FRONT = path.join(__dirname, "..", "..", "frontend");
let servidor, w;

const $ = (s) => w.document.querySelector(s);
const $$ = (s) => [...w.document.querySelectorAll(s)];
const click = (el) => el.dispatchEvent(new w.Event("click", { bubbles: true }));
const btn = (txt, ctx = w.document) => [...ctx.querySelectorAll("button")].find((b) => b.textContent.startsWith(txt));
const escribir = (el, valor) => { el.value = valor; el.dispatchEvent(new w.Event("input", { bubbles: true })); };

// Las acciones son asíncronas (fetch al servidor): esperamos a que la pantalla cambie
async function hasta(condicion, mensaje) {
  for (let i = 0; i < 200; i++) {
    if (condicion()) return;
    await new Promise((r) => setTimeout(r, 25));
  }
  assert.fail("Tiempo agotado esperando: " + mensaje);
}
const notifs = () => Number($("#btn-notif").textContent.match(/\((\d+)\)/)[1]);

before(async () => {
  await mongoose.connect(URI, { serverSelectionTimeoutMS: 4000 });
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.createIndexes()));
  await sembrarSiVacia();
  servidor = crearApp().listen(0);

  const dom = new JSDOM(fs.readFileSync(path.join(FRONT, "index.html"), "utf8"), {
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  w = dom.window;
  w.fetch = fetch;
  w.MINIRED_API_URL = "http://127.0.0.1:" + servidor.address().port;
  // Mismos archivos y mismo orden que los <script> del index.html (menos config.js)
  const archivos = [
    "estructuras/lista-publicaciones.js", "estructuras/arbol-comentarios.js", "estructuras/cola-notificaciones.js",
    "estructuras/grafo-amigos.js", "estructuras/bst-usuarios.js", "api.js", "app.js", "amigos.js", "main.js",
  ];
  w.eval(archivos.map((f) => fs.readFileSync(path.join(FRONT, "js", f), "utf8").replace(/if \(typeof module[^\n]*\n?/, "")).join("\n"));
  await hasta(() => $("#feed").textContent.includes("Aún no hay publicaciones"), "carga inicial");
});

after(async () => {
  w.close();
  servidor.close();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("Home: publicar, like, comentar, responder", async () => {
  escribir($("#texto"), "hola mundo");
  click($("#btn-publicar"));
  await hasta(() => $$(".post").length === 1, "publicación");
  assert.equal($("#texto").value, "");

  click(btn("Me gusta"));
  await hasta(() => notifs() === 1, "notificación de like");
  assert.ok(btn("Me gusta (1)"));

  click(btn("Comentar"));
  $(".form-comentario input").value = "primer comentario";
  click(btn("Enviar"));
  await hasta(() => $$(".comentario").length === 1, "comentario");
  await hasta(() => notifs() === 2, "notificación de comentario");

  click(btn("Responder"));
  $(".form-comentario input").value = "una respuesta";
  click(btn("Enviar"));
  await hasta(() => $$(".comentario").length === 2, "respuesta");
  assert.equal($$(".comentario")[1].style.marginLeft, "20px"); // sangría del 2.º nivel
  await hasta(() => notifs() === 3, "notificación de respuesta");
});

test("Notificaciones: se atienden en orden de llegada (cola)", async () => {
  click($("#btn-notif"));
  assert.equal($("#panel-notif").hidden, false);
  const items = $$("#panel-notif li").map((li) => li.textContent);
  assert.ok(items[0].includes("Me gusta en tu publicación"), items[0]);
  assert.ok(items[2].includes("Nueva respuesta"), items[2]);

  click(btn("Atender siguiente", $("#panel-notif")));
  await hasta(() => notifs() === 2, "atender siguiente");
  assert.ok($$("#panel-notif li")[0].textContent.includes("Nuevo comentario"));

  click(btn("Vaciar", $("#panel-notif")));
  await hasta(() => notifs() === 0, "vaciar");
  assert.ok($("#panel-notif").textContent.includes("No tienes notificaciones"));
});

test("Persistencia: al recargar los datos siguen ahí", async () => {
  // Una "pantalla nueva" (como abrir la página otra vez) debe ver lo guardado en la base de datos
  const respuesta = await fetch(w.MINIRED_API_URL + "/api/estado?usuario=Juan%20Camilo");
  const e = await respuesta.json();
  assert.equal(e.publicaciones.length, 1);
  assert.equal(e.publicaciones[0].comentarios.length, 2);
  assert.equal(e.publicaciones[0].likes, 1);
});

test("Home: eliminar comentario (con sus respuestas) y publicación", async () => {
  click(btn("Eliminar", $$(".comentario")[0]));
  await hasta(() => $$(".comentario").length === 0, "comentario eliminado");
  click(btn("Eliminar", $(".post")));
  await hasta(() => $$(".post").length === 0, "publicación eliminada");
});

test("Amigos: grafo, sugerencias y navegación", async () => {
  click($("#nav-amigos"));
  assert.equal($("#vista-amigos").hidden, false);
  assert.equal($("#vista-home").hidden, true);
  const tarjetas = () => $$("#vista-amigos .tarjeta"); // [búsqueda, mis amigos, sugerencias]
  assert.ok(tarjetas()[1].textContent.includes("Mis amigos (2)"));
  const sug = () => [...tarjetas()[2].querySelectorAll(".persona .nombre")].map((n) => n.textContent);
  assert.equal(sug()[0], "Valentina Ruiz"); // 2 amigos en común: la primera sugerida
  assert.ok(tarjetas()[2].textContent.includes("2 amigos en común"));
  assert.ok(tarjetas()[2].textContent.includes("1 amigo en común")); // singular (Andrés, vía Camila)
  assert.ok(!tarjetas()[2].textContent.includes("1 amigos"));

  click(btn("Agregar", tarjetas()[2].querySelector(".persona")));
  await hasta(() => tarjetas()[1].textContent.includes("Mis amigos (3)"), "amigo agregado");
  assert.ok(tarjetas()[1].textContent.includes("Valentina Ruiz"));
  assert.equal(notifs(), 1); // "Valentina Ruiz ahora es tu amigo"
  assert.ok(!sug().includes("Valentina Ruiz"));

  click(btn("Eliminar", tarjetas()[1].querySelector(".persona")));
  await hasta(() => tarjetas()[1].textContent.includes("Mis amigos (2)"), "amigo eliminado");
});

test("Amigos: búsqueda de usuarios con el BST", async () => {
  const campo = $("#busqueda");
  escribir(campo, "san");
  const nombres = () => [...$$("#resultados .persona .nombre")].map((n) => n.textContent);
  assert.deepEqual(nombres(), ["Santiago Pérez"]);
  assert.match($("#resultados .ayuda").textContent, /El BST revisó \d+ de 9 usuarios/);

  escribir(campo, "ANDRES"); // sin tildes ni mayúsculas
  assert.deepEqual(nombres(), ["Andrés Mejía"]);

  escribir(campo, "lau"); // Laura sigue siendo amiga (Camila se eliminó en la prueba anterior)
  assert.deepEqual(nombres(), ["Laura Gómez"]);
  assert.ok($("#resultados").textContent.includes("Ya es tu amigo"));
  escribir(campo, "ca");
  assert.deepEqual(nombres(), ["Camila Ortiz"]);
  assert.ok($("#resultados").textContent.includes("1 amigo en común"));

  // registrar un usuario que no existe: va a la base de datos y entra al BST
  escribir(campo, "Zoe Nueva");
  assert.deepEqual(nombres(), []);
  click(btn("Registrar a"));
  await hasta(() => $$("#resultados .persona").length === 1, "nuevo usuario en el BST");
  assert.equal(nombres()[0], "Zoe Nueva");
  assert.match($("#resultados .ayuda").textContent, /de 10 usuarios/);
  assert.ok(!btn("Registrar a")); // ya existe
  click($("#nav-home"));
  assert.equal($("#vista-home").hidden, false);
});

test("Errores: sin conexión se muestra un aviso", async () => {
  const antes = w.MINIRED_API_URL;
  w.eval('window.MINIRED_API_URL = "http://127.0.0.1:1"');
  escribir($("#texto"), "no se podrá");
  click($("#btn-publicar"));
  await hasta(() => !$("#aviso").hidden, "aviso de error");
  assert.match($("#aviso").textContent, /No se pudo conectar/);
  w.eval('window.MINIRED_API_URL = "' + antes + '"');
});
