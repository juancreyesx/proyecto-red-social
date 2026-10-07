// Estructura 5: árbol binario de búsqueda (BST) de usuarios
// Sirve para buscar personas por nombre. Cada nodo guarda el nombre "normalizado"
// (minúsculas y sin tildes) como llave: lo menor va a la izquierda, lo mayor a la derecha.
// Así, en vez de revisar todos los usuarios uno por uno (O(n)), descartamos la mitad
// del árbol en cada paso (O(log n) si el árbol está balanceado).
function normalizar(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

class NodoUsuario {
  constructor(nombre) {
    this.nombre = nombre;            // nombre original: "Andrés Mejía"
    this.llave = normalizar(nombre); // llave de comparación: "andres mejia"
    this.left = null;
    this.right = null;
  }
}

class ArbolUsuarios {
  constructor() {
    this.root = null;
    this.size = 0;
  }

  // Inserta un usuario. Devuelve false si ya existía (no se permiten repetidos).
  insertar(nombre) {
    const nuevo = new NodoUsuario(nombre);
    if (this.root === null) {
      this.root = nuevo;
      this.size++;
      return true;
    }
    let actual = this.root;
    while (true) {
      if (nuevo.llave === actual.llave) return false;
      if (nuevo.llave < actual.llave) {
        if (actual.left === null) { actual.left = nuevo; break; }
        actual = actual.left;
      } else {
        if (actual.right === null) { actual.right = nuevo; break; }
        actual = actual.right;
      }
    }
    this.size++;
    return true;
  }

  // Construye un árbol balanceado: ordena y usa siempre el elemento del medio como raíz.
  // (Insertar una lista ya ordenada uno a uno degeneraría el árbol en una lista.)
  static desdeLista(nombres) {
    const arbol = new ArbolUsuarios();
    const ordenados = [...nombres]
      .map((n) => new NodoUsuario(n))
      .sort((x, y) => (x.llave < y.llave ? -1 : x.llave > y.llave ? 1 : 0))
      .filter((n, i, arr) => i === 0 || n.llave !== arr[i - 1].llave);

    function construir(desde, hasta) {
      if (desde > hasta) return null;
      const medio = Math.floor((desde + hasta) / 2);
      const nodo = ordenados[medio];
      nodo.left = construir(desde, medio - 1);
      nodo.right = construir(medio + 1, hasta);
      return nodo;
    }
    arbol.root = construir(0, ordenados.length - 1);
    arbol.size = ordenados.length;
    return arbol;
  }

  // Búsqueda exacta. Devuelve el nombre o null.
  buscarExacto(nombre) {
    const llave = normalizar(nombre);
    let actual = this.root;
    while (actual !== null) {
      if (llave === actual.llave) return actual.nombre;
      actual = llave < actual.llave ? actual.left : actual.right;
    }
    return null;
  }

  // Búsqueda por prefijo ("an" -> Andrés, Ana...). Devuelve los nombres encontrados
  // en orden alfabético y cuántos nodos tuvo que visitar (para ver el ahorro frente a recorrer todo).
  buscarPrefijo(texto) {
    const prefijo = normalizar(texto);
    const encontrados = [];
    let visitados = 0;

    const visitar = (nodo) => {
      if (nodo === null) return;
      visitados++;
      if (nodo.llave.startsWith(prefijo)) {
        // puede haber coincidencias a ambos lados
        visitar(nodo.left);
        encontrados.push(nodo.nombre);
        visitar(nodo.right);
      } else if (prefijo < nodo.llave) {
        visitar(nodo.left);   // todo lo que empieza con el prefijo es menor que este nodo
      } else {
        visitar(nodo.right);  // ...o mayor
      }
    };
    if (prefijo !== "") visitar(this.root);
    return { nombres: encontrados, visitados };
  }

  // Recorrido inorden: devuelve todos los nombres en orden alfabético.
  recorridoInOrden(nodo = this.root, resultado = []) {
    if (nodo === null) return resultado;
    this.recorridoInOrden(nodo.left, resultado);
    resultado.push(nodo.nombre);
    this.recorridoInOrden(nodo.right, resultado);
    return resultado;
  }

  altura(nodo = this.root) {
    if (nodo === null) return 0;
    return 1 + Math.max(this.altura(nodo.left), this.altura(nodo.right));
  }
}

if (typeof module !== "undefined") module.exports = { ArbolUsuarios, normalizar };
