// Estructura 4: grafo no dirigido de amigos (lista de adyacencia)
// Cada persona es un nodo y cada amistad es una arista que va en los dos sentidos.
class Grafo {
  constructor() {
    this.nodes = [];       // nombres de las personas
    this.adjacency = {};   // nombre -> arreglo con los nombres de sus amigos
  }

  findNode(nodo) {
    return this.nodes.includes(nodo);
  }

  // Valida duplicados: si ya existe no lo agrega (así no se pierden sus conexiones)
  addNode(nodo) {
    if (this.findNode(nodo)) return false;
    this.nodes.push(nodo);
    this.adjacency[nodo] = [];
    return true;
  }

  // Amistad = conexión en ambos sentidos. No permite repetir ni conectar a alguien consigo mismo.
  addEdge(a, b) {
    if (a === b || !this.findNode(a) || !this.findNode(b) || this.areConnected(a, b)) return false;
    this.adjacency[a].push(b);
    this.adjacency[b].push(a);
    return true;
  }

  // Eliminar amistad: se quita de las dos listas
  removeEdge(a, b) {
    if (!this.areConnected(a, b)) return false;
    this.adjacency[a] = this.adjacency[a].filter((x) => x !== b);
    this.adjacency[b] = this.adjacency[b].filter((x) => x !== a);
    return true;
  }

  // Eliminar una persona: se quita de nodes, se borra su lista y se limpian
  // las referencias en los demás (si no, otros seguirían apuntando a alguien que ya no existe)
  removeNode(nodo) {
    if (!this.findNode(nodo)) return false;
    this.nodes = this.nodes.filter((n) => n !== nodo);
    delete this.adjacency[nodo];
    for (const n of this.nodes) {
      this.adjacency[n] = this.adjacency[n].filter((x) => x !== nodo);
    }
    return true;
  }

  areConnected(a, b) {
    return this.findNode(a) && this.adjacency[a].includes(b);
  }

  getNeighbors(nodo) {
    return this.findNode(nodo) ? this.adjacency[nodo].slice() : [];
  }

  // Amigos que dos personas tienen en común
  amigosEnComun(a, b) {
    const deB = this.getNeighbors(b);
    return this.getNeighbors(a).filter((x) => deB.includes(x));
  }

  // Sugerencias de amistad: personas que aún no son amigos, ordenadas por
  // cuántos amigos en común tienen contigo (recorrer "amigos de amigos")
  sugerencias(nodo) {
    return this.nodes
      .filter((n) => n !== nodo && !this.areConnected(nodo, n))
      .map((n) => ({ nombre: n, enComun: this.amigosEnComun(nodo, n).length }))
      .sort((x, y) => y.enComun - x.enComun || x.nombre.localeCompare(y.nombre));
  }
}

if (typeof module !== "undefined") module.exports = { Grafo };
