// Pruebas unitarias de las 5 estructuras de datos del frontend (no necesitan base de datos)
const { test } = require("node:test");
const assert = require("node:assert/strict");
const dir = "../../frontend/js/estructuras/";
const { ListaPublicaciones } = require(dir + "lista-publicaciones.js");
const { ArbolComentarios } = require(dir + "arbol-comentarios.js");
const { ColaNotificaciones } = require(dir + "cola-notificaciones.js");
const { Grafo } = require(dir + "grafo-amigos.js");
const { ArbolUsuarios, normalizar } = require(dir + "bst-usuarios.js");

test("lista enlazada de publicaciones", () => {
  const l = new ListaPublicaciones();
  [1, 2, 3].forEach((id) => l.agregarAlInicio({ id }));
  assert.deepEqual(l.recorrer().map((p) => p.id), [3, 2, 1]); // la más nueva primero
  assert.equal(l.size, 3);
  assert.equal(l.buscarPorId(2).id, 2);
  assert.ok(l.eliminar(3) && l.eliminar(1)); // cabeza y cola
  assert.deepEqual(l.recorrer().map((p) => p.id), [2]);
  assert.ok(!l.eliminar(99));
  assert.ok(l.eliminar(2));
  assert.equal(l.size, 0);
  assert.equal(l.head, null);
});

test("árbol n-ario de comentarios", () => {
  const a = new ArbolComentarios();
  assert.ok(a.agregar(null, { id: "a" }));
  assert.ok(a.agregar("a", { id: "b" }));
  assert.ok(a.agregar("b", { id: "c" }));
  assert.ok(a.agregar(null, { id: "d" }));
  assert.ok(!a.agregar("zzz", { id: "x" })); // padre inexistente
  assert.equal(a.contar(), 4);
  assert.deepEqual(a.recorrer().map((x) => [x.comentario.id, x.nivel]), [["a", 0], ["b", 1], ["c", 2], ["d", 0]]);
  assert.ok(a.eliminar("b")); // se va con su subárbol
  assert.equal(a.contar(), 2);
});

test("cola de notificaciones (FIFO)", () => {
  const c = new ColaNotificaciones();
  assert.ok(c.isEmpty());
  c.encolar("uno"); c.encolar("dos"); c.encolar("tres");
  assert.equal(c.peek(), "uno");
  assert.equal(c.descolar(), "uno");
  assert.equal(c.size(), 2);
  assert.deepEqual(c.recorrer(), ["dos", "tres"]);
  c.vaciar();
  assert.ok(c.isEmpty());
});

test("grafo de amigos", () => {
  const g = new Grafo();
  ["A", "B", "C", "D"].forEach((n) => g.addNode(n));
  assert.ok(g.addEdge("A", "B"));
  assert.ok(!g.addEdge("B", "A")); // duplicada (no dirigido)
  g.addEdge("A", "C"); g.addEdge("B", "D"); g.addEdge("C", "D");
  assert.ok(g.areConnected("B", "A"));
  assert.deepEqual(g.amigosEnComun("A", "D").sort(), ["B", "C"]);
  assert.deepEqual(g.sugerencias("A"), [{ nombre: "D", enComun: 2 }]);
  assert.ok(g.removeEdge("A", "B"));
  assert.ok(!g.areConnected("A", "B"));
  g.removeNode("D");
  assert.deepEqual(g.getNeighbors("C"), ["A"]); // sin referencias al nodo borrado
});

test("BST de usuarios: normalizar, insertar y buscar", () => {
  assert.equal(normalizar("  Andrés MEJÍA "), "andres mejia");
  const t = new ArbolUsuarios();
  ["Mateo", "Camila", "Santiago", "Ana", "Andrés"].forEach((n) => assert.ok(t.insertar(n)));
  assert.ok(!t.insertar("ANDRES")); // repetido (sin importar tildes ni mayúsculas)
  assert.equal(t.size, 5);
  assert.deepEqual(t.recorridoInOrden(), ["Ana", "Andrés", "Camila", "Mateo", "Santiago"]); // alfabético
  assert.equal(t.buscarExacto("andres"), "Andrés");
  assert.equal(t.buscarExacto("Zoe"), null);
});

test("BST de usuarios: búsqueda por prefijo y balance", () => {
  const nombres = [];
  for (let i = 0; i < 1000; i++) nombres.push("Usuario" + String(i).padStart(4, "0"));
  nombres.push("Zoe Prueba", "Álvaro Gil");
  const t = ArbolUsuarios.desdeLista(nombres);
  assert.equal(t.size, 1002);
  assert.ok(t.altura() <= 11, "altura " + t.altura()); // balanceado: ~log2(1002)
  assert.deepEqual(t.recorridoInOrden().slice(0, 2), ["Álvaro Gil", "Usuario0000"]);

  const r = t.buscarPrefijo("alva");
  assert.deepEqual(r.nombres, ["Álvaro Gil"]);
  assert.ok(r.visitados <= 12, "visitó " + r.visitados);

  const muchos = t.buscarPrefijo("usuario00");
  assert.equal(muchos.nombres.length, 100);
  assert.deepEqual(t.buscarPrefijo("nadie").nombres, []);
  assert.deepEqual(t.buscarPrefijo("   ").nombres, []);

  // el resultado coincide con filtrar linealmente
  const lineal = nombres.filter((n) => normalizar(n).startsWith("zo")).sort();
  assert.deepEqual(t.buscarPrefijo("zo").nombres, lineal);
});

test("BST: insertar en orden no rompe la búsqueda", () => {
  const t = new ArbolUsuarios();
  ["a", "b", "c", "d", "e"].forEach((n) => t.insertar(n)); // peor caso: degenera en lista
  assert.equal(t.altura(), 5);
  assert.deepEqual(t.buscarPrefijo("c").nombres, ["c"]);
});
