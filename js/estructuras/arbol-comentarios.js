// Estructura 2: árbol n-ario de comentarios y respuestas
// Cada publicación tiene su propio árbol. La raíz es "virtual": representa la
// publicación y sus hijos son los comentarios de primer nivel. Cada comentario
// puede tener cualquier cantidad de respuestas (children).
class NodoComentario {
  constructor(value) {
    this.value = value;   // { id, autor, texto, fecha, likes } (null en la raíz)
    this.children = [];   // respuestas
  }
  addChild(nodo) {
    this.children.push(nodo);
  }
}

class ArbolComentarios {
  constructor() {
    this.root = new NodoComentario(null);
  }

  // Búsqueda en profundidad (DFS), recursiva. Devuelve el nodo o null.
  buscarNodo(id, nodo = this.root) {
    if (nodo.value !== null && nodo.value.id === id) return nodo;
    for (const hijo of nodo.children) {
      const encontrado = this.buscarNodo(id, hijo);
      if (encontrado) return encontrado;
    }
    return null;
  }

  // idPadre = null -> comentario directo a la publicación
  // idPadre = id   -> respuesta a otro comentario
  agregar(idPadre, comentario) {
    const padre = idPadre === null ? this.root : this.buscarNodo(idPadre);
    if (!padre) return false;
    padre.addChild(new NodoComentario(comentario));
    return true;
  }

  // Eliminar un comentario elimina también todas sus respuestas (su subárbol)
  eliminar(id, nodo = this.root) {
    const indice = nodo.children.findIndex((h) => h.value.id === id);
    if (indice !== -1) {
      nodo.children.splice(indice, 1);
      return true;
    }
    for (const hijo of nodo.children) {
      if (this.eliminar(id, hijo)) return true;
    }
    return false;
  }

  // Recorrido en profundidad: devuelve [{ comentario, nivel }] para dibujar con sangría
  recorrer(nodo = this.root, nivel = 0, resultado = []) {
    for (const hijo of nodo.children) {
      resultado.push({ comentario: hijo.value, nivel: nivel });
      this.recorrer(hijo, nivel + 1, resultado);
    }
    return resultado;
  }

  contar() {
    return this.recorrer().length;
  }
}

if (typeof module !== "undefined") module.exports = { ArbolComentarios, NodoComentario };
