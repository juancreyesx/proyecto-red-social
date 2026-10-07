// Arranque: pide los datos al backend y dibuja la pantalla.
cargarEstado().catch((error) => mostrarAviso(error.message));
