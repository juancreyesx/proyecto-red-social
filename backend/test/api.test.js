// Pruebas de la API. Necesitan MongoDB (o FerretDB) en MONGODB_TEST_URI.
// Por defecto usan una base aparte llamada "minired_test" (se borra al empezar).
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { crearApp } = require("../src/app");
const { sembrarSiVacia } = require("../src/seed");

const URI = process.env.MONGODB_TEST_URI || "mongodb://127.0.0.1:27017/minired_test";
const YO = "Juan Camilo";
let servidor, base;

async function api(metodo, ruta, cuerpo) {
  const r = await fetch(base + ruta, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await r.text();
  return { status: r.status, datos: texto ? JSON.parse(texto) : null };
}
const estado = async () => (await api("GET", "/api/estado?usuario=" + encodeURIComponent(YO))).datos;

before(async () => {
  await mongoose.connect(URI, { serverSelectionTimeoutMS: 4000 });
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.createIndexes()));
  await sembrarSiVacia();
  servidor = crearApp().listen(0);
  base = "http://127.0.0.1:" + servidor.address().port;
});

after(async () => {
  servidor.close();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("salud y datos iniciales", async () => {
  assert.equal((await api("GET", "/api/salud")).datos.baseDeDatos, "conectada");
  const e = await estado();
  assert.ok(e.usuarios.includes(YO));
  assert.equal(e.amistades.length, 10);
  assert.deepEqual(e.publicaciones, []);
});

test("publicaciones: crear, validar, like, eliminar", async () => {
  assert.equal((await api("POST", "/api/publicaciones", { autor: YO, texto: "   " })).status, 400);
  assert.equal((await api("POST", "/api/publicaciones", { autor: YO, texto: "x".repeat(281) })).status, 400);
  assert.equal((await api("POST", "/api/publicaciones", { autor: "Nadie", texto: "hola" })).status, 404);

  const { status, datos } = await api("POST", "/api/publicaciones", { autor: YO, texto: "Mi primera publicación" });
  assert.equal(status, 201);
  assert.equal((await api("POST", `/api/publicaciones/${datos.id}/like`)).datos.likes, 1);
  assert.equal((await api("POST", "/api/publicaciones/abc/like")).status, 400);
  assert.equal((await api("POST", "/api/publicaciones/aaaaaaaaaaaaaaaaaaaaaaaa/like")).status, 404);

  let e = await estado();
  assert.equal(e.publicaciones.length, 1);
  assert.equal(e.publicaciones[0].likes, 1);
  assert.match(e.notificaciones.at(-1).mensaje, /Me gusta en tu publicación/);

  assert.equal((await api("DELETE", `/api/publicaciones/${datos.id}`)).status, 204);
  e = await estado();
  assert.equal(e.publicaciones.length, 0);
  await api("DELETE", "/api/notificaciones?usuario=" + encodeURIComponent(YO));
});

test("comentarios: árbol, respuestas y borrado en cascada", async () => {
  const pub = (await api("POST", "/api/publicaciones", { autor: YO, texto: "Con comentarios" })).datos.id;
  const c1 = (await api("POST", `/api/publicaciones/${pub}/comentarios`, { autor: YO, texto: "raíz" })).datos.id;
  const c2 = (await api("POST", `/api/publicaciones/${pub}/comentarios`, { autor: YO, texto: "hija", padre: c1 })).datos.id;
  await api("POST", `/api/publicaciones/${pub}/comentarios`, { autor: YO, texto: "nieta", padre: c2 });
  await api("POST", `/api/publicaciones/${pub}/comentarios`, { autor: YO, texto: "otra raíz" });

  assert.equal((await api("POST", `/api/publicaciones/${pub}/comentarios`, { autor: YO, texto: "mal", padre: "xyz" })).status, 400);
  assert.equal((await api("POST", `/api/publicaciones/${pub}/comentarios`, { autor: YO, texto: "mal", padre: "aaaaaaaaaaaaaaaaaaaaaaaa" })).status, 404);

  let e = await estado();
  assert.equal(e.publicaciones[0].comentarios.length, 4);
  assert.equal(e.publicaciones[0].comentarios.find((c) => c.texto === "nieta").padre, c2);

  assert.equal((await api("POST", `/api/comentarios/${c1}/like`)).datos.likes, 1);

  // al borrar "raíz" se van ella, "hija" y "nieta"; queda "otra raíz"
  assert.equal((await api("DELETE", `/api/comentarios/${c1}`)).datos.eliminados, 3);
  e = await estado();
  assert.deepEqual(e.publicaciones[0].comentarios.map((c) => c.texto), ["otra raíz"]);

  // borrar la publicación borra los comentarios restantes
  await api("DELETE", `/api/publicaciones/${pub}`);
  const Comentario = mongoose.models.Comentario;
  assert.equal(await Comentario.countDocuments(), 0);
  await api("DELETE", "/api/notificaciones?usuario=" + encodeURIComponent(YO));
});

test("notificaciones: cola FIFO", async () => {
  await api("DELETE", "/api/notificaciones?usuario=" + encodeURIComponent(YO));
  const pub = (await api("POST", "/api/publicaciones", { autor: YO, texto: "cola" })).datos.id;
  await api("POST", `/api/publicaciones/${pub}/like`); // 1.º en llegar
  await api("POST", `/api/publicaciones/${pub}/comentarios`, { autor: YO, texto: "hola" }); // 2.º

  let e = await estado();
  assert.equal(e.notificaciones.length, 2);
  assert.match(e.notificaciones[0].mensaje, /Me gusta/);

  await api("DELETE", "/api/notificaciones/siguiente?usuario=" + encodeURIComponent(YO));
  e = await estado();
  assert.equal(e.notificaciones.length, 1);
  assert.match(e.notificaciones[0].mensaje, /Nuevo comentario/);

  await api("DELETE", "/api/notificaciones?usuario=" + encodeURIComponent(YO));
  assert.equal((await estado()).notificaciones.length, 0);
  await api("DELETE", `/api/publicaciones/${pub}`);
});

test("amistades: crear, duplicados, eliminar y usuarios nuevos", async () => {
  await api("DELETE", "/api/notificaciones?usuario=" + encodeURIComponent(YO));
  assert.equal((await api("POST", "/api/amistades", { a: YO, b: "Mateo Rojas" })).status, 201);
  assert.equal((await api("POST", "/api/amistades", { a: "Mateo Rojas", b: YO })).status, 409); // mismo par al revés
  assert.equal((await api("POST", "/api/amistades", { a: YO, b: YO })).status, 400);
  assert.equal((await api("POST", "/api/amistades", { a: YO, b: "Fantasma" })).status, 404);

  let e = await estado();
  assert.equal(e.amistades.length, 11);
  assert.match(e.notificaciones[0].mensaje, /Mateo Rojas ahora es tu amigo/);

  assert.equal((await api("DELETE", `/api/amistades?a=${encodeURIComponent("Mateo Rojas")}&b=${encodeURIComponent(YO)}`)).status, 204);
  assert.equal((await api("DELETE", `/api/amistades?a=${encodeURIComponent("Mateo Rojas")}&b=${encodeURIComponent(YO)}`)).status, 404);

  assert.equal((await api("POST", "/api/usuarios", { nombre: "Nuevo Usuario" })).status, 201);
  assert.equal((await api("POST", "/api/usuarios", { nombre: "Nuevo Usuario" })).status, 409);
  e = await estado();
  assert.ok(e.usuarios.includes("Nuevo Usuario"));
});

test("rutas inexistentes y JSON mal formado", async () => {
  assert.equal((await api("GET", "/api/nada")).status, 404);
  const r = await fetch(base + "/api/publicaciones", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{mal" });
  assert.equal(r.status, 400);
});
