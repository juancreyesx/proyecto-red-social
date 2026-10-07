// Estructura 3: cola (FIFO) de notificaciones
// La primera notificación que llega es la primera que se atiende.
class ColaNotificaciones {
  constructor() {
    this.items = [];
  }
  encolar(notificacion) {            // agrega al final
    this.items.push(notificacion);
  }
  descolar() {                       // quita y devuelve el primero
    return this.items.shift();
  }
  peek() {                           // el siguiente a atender, sin quitarlo
    return this.isEmpty() ? null : this.items[0];
  }
  isEmpty() {
    return this.items.length === 0;
  }
  size() {
    return this.items.length;
  }
  recorrer() {                       // en orden de llegada
    return this.items.slice();
  }
  vaciar() {
    this.items = [];
  }
}

if (typeof module !== "undefined") module.exports = { ColaNotificaciones };
