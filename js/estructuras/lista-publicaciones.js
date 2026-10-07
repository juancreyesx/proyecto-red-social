// Estructura 1: lista simplemente enlazada de publicaciones
class NodoPublicacion {
  constructor(value) {
    this.value = value; // la publicación
    this.next = null;   // apuntador a la siguiente
  }
}

class ListaPublicaciones {
  constructor() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  // La publicación nueva va al inicio, así la más reciente se ve primero
  agregarAlInicio(publicacion) {
    const nuevo = new NodoPublicacion(publicacion);
    if (!this.head) {            // lista vacía
      this.head = nuevo;
      this.tail = nuevo;
    } else {
      nuevo.next = this.head;    // el nuevo apunta a la antigua cabeza
      this.head = nuevo;
    }
    this.size++;
  }

  buscarPorId(id) {
    let nodo = this.head;
    while (nodo !== null) {
      if (nodo.value.id === id) return nodo.value;
      nodo = nodo.next;
    }
    return null;
  }

  eliminar(id) {
    if (!this.head) return false;

    if (this.head.value.id === id) {        // eliminar cabeza
      this.head = this.head.next;
      if (!this.head) this.tail = null;
      this.size--;
      return true;
    }

    let anterior = this.head;
    while (anterior.next) {
      if (anterior.next.value.id === id) {
        const borrado = anterior.next;
        if (borrado === this.tail) this.tail = anterior; // eliminar cola
        anterior.next = borrado.next;                    // reconectar
        this.size--;
        return true;
      }
      anterior = anterior.next;
    }
    return false;
  }

  // Recorre la lista y devuelve un arreglo para poder dibujarla en pantalla
  recorrer() {
    const resultado = [];
    let nodo = this.head;
    while (nodo !== null) {
      resultado.push(nodo.value);
      nodo = nodo.next;
    }
    return resultado;
  }
}

if (typeof module !== "undefined") module.exports = { ListaPublicaciones };
