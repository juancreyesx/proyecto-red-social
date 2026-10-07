---
title: "MiniRed — Documento final del proyecto integrador"
subtitle: "Estructuras de Datos y Algoritmos 2 · Universidad Autónoma de Occidente · 2026-5B"
author: "Juan Camilo Reyes Cardona (cód. 2235983) · Docente: Jonathan López Londoño"
---

# 1. Alcance

**MiniRed** es una red social en miniatura. Su objetivo no es competir con una red real, sino mostrar que cada
funcionalidad de una red social se apoya de forma natural en una estructura de datos distinta, implementada
desde cero (la lógica principal no usa librerías de estructuras de datos).

**Funcionalidades incluidas**

- Publicar texto (hasta 280 caracteres), dar "me gusta" y eliminar publicaciones.
- Comentar publicaciones y responder comentarios a cualquier profundidad; eliminar un comentario elimina sus respuestas.
- Notificaciones por actividad (likes, comentarios, respuestas, nuevos amigos), atendidas en orden de llegada.
- Amigos: agregar y eliminar, y sugerencias ordenadas por cantidad de amigos en común.
- Búsqueda de personas por el inicio del nombre (sin importar tildes ni mayúsculas) y registro de nuevos usuarios.
- Persistencia en base de datos: al recargar la página todo sigue ahí.

**Fuera de alcance (a propósito)**

- No hay inicio de sesión: la aplicación simula un único usuario activo ("Juan Camilo"); los demás usuarios son personas de ejemplo.
- No hay imágenes, mensajes privados ni tiempo real (los cambios de otros usuarios se ven al recargar).
- Las operaciones de la API son atómicas por documento; no se usan transacciones multi-documento (ver sección 6).

# 2. Tecnologías

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | HTML, CSS y JavaScript puro | Las estructuras de datos se ven con claridad, sin la capa de un framework |
| Backend | Node.js + Express 5 | Mismo lenguaje que el frontend, API REST sencilla |
| Base de datos | MongoDB (Atlas) con Mongoose | Documentos flexibles; plan gratuito para publicar |
| Pruebas | `node:test` + jsdom | Sin dependencias pesadas; prueba hasta la pantalla |
| Publicación | Render (servidor + frontend) y MongoDB Atlas | Planes gratuitos, despliegue desde GitHub |
| Control de versiones | Git y GitHub, ramas integradas a `main` | Lo pide la rúbrica |

# 3. Arquitectura

El navegador pide `GET /api/estado` y recibe publicaciones, comentarios, notificaciones, usuarios y amistades en
formato plano. Con esos datos el frontend **reconstruye las cinco estructuras en memoria** y dibuja la pantalla a partir
de ellas. Cada acción del usuario viaja al servidor, se guarda en MongoDB y luego se vuelve a pedir el estado, de modo
que la pantalla siempre refleja lo guardado.

Colecciones de MongoDB: `usuarios`, `publicacions`, `comentarios` (con `publicacion` y `padre`), `amistads`
(par ordenado `a`,`b` con índice único) y `notificacions` (ordenadas por fecha de creación).

# 4. Estructuras de datos y por qué se eligieron

## 4.1 Lista enlazada simple — publicaciones

El feed muestra primero lo más reciente. En una lista enlazada con puntero a la cabeza, publicar es insertar al inicio
en **O(1)**, sin desplazar elementos como ocurriría al insertar al inicio de un arreglo (O(n)). El feed siempre se
recorre completo de principio a fin, que es justo lo que la lista hace bien; no se necesita acceso por posición.

## 4.2 Árbol n-ario — comentarios y respuestas

Los comentarios son jerárquicos: un comentario tiene respuestas, y estas tienen otras respuestas, sin límite de
profundidad ni de cantidad. Es la definición de un árbol n-ario (cada nodo con una lista de hijos). La raíz es virtual
(la publicación). Un recorrido en profundidad (DFS) entrega los comentarios en el orden de lectura natural junto con su
nivel, que se usa para la sangría. Eliminar un nodo elimina su subárbol completo de forma natural.

## 4.3 Cola (FIFO) — notificaciones

Las notificaciones se atienden en el orden en que llegaron: la más antigua primero. Eso es exactamente una cola:
`encolar` al final, `descolar` del frente, `peek` para ver la siguiente. El botón "Atender siguiente" es la operación
`descolar`. Se eligió sobre una pila porque con LIFO las notificaciones antiguas nunca se atenderían mientras llegaran nuevas.

## 4.4 Grafo no dirigido (lista de adyacencia) — amigos

Una amistad es una relación simétrica entre dos personas: usuarios = nodos, amistades = aristas. La lista de
adyacencia usa memoria proporcional a las amistades reales (una matriz gastaría n² con muy pocos amigos por persona) y
permite listar los amigos de alguien recorriendo solo sus vecinos. Las **sugerencias** son un recorrido a distancia 2:
por cada amigo se visitan sus amigos, se cuentan las coincidencias (amigos en común) y se ordena de mayor a menor. Se
validan aristas duplicadas, y al eliminar un nodo se limpian todas las referencias a él.

## 4.5 Árbol binario de búsqueda (BST) — búsqueda de usuarios

Para buscar personas por nombre, recorrer todos los usuarios cuesta O(n). En un BST cada comparación descarta una
rama completa: la búsqueda cuesta O(altura), que es O(log n) si el árbol está balanceado. Se usa la llave "nombre
normalizado" (minúsculas y sin tildes) y la búsqueda por **prefijo** aprovecha que todos los nombres que empiezan igual
quedan contiguos en el orden del árbol, así que solo se exploran las ramas que pueden contenerlos. Para evitar que el
árbol degenere en una lista (ocurre si se insertan nombres ya ordenados), al cargar los usuarios se construye
**balanceado**: se ordenan y se toma siempre el elemento del medio como raíz. La pantalla muestra cuántos nodos revisó
el BST frente al total (por ejemplo "4 de 9 usuarios") y la altura del árbol. El recorrido inorden entrega los nombres en
orden alfabético.

| Estructura | Operación clave | Costo |
|---|---|---|
| Lista enlazada | publicar (insertar al inicio) | O(1) |
| Árbol n-ario | buscar un comentario / dibujar todo (DFS) | O(n) |
| Cola | encolar / descolar | O(1)* |
| Grafo | agregar amistad / listar amigos | O(grado) |
| BST balanceado | buscar por nombre o prefijo | O(log n) |

\* `descolar` usa `Array.shift`; para colas muy grandes convendría una cola con punteros. Con las decenas de
notificaciones de una persona no es relevante.

# 5. API y persistencia

Resumen de rutas (detalle en el README): publicaciones, comentarios, amistades, usuarios y notificaciones, más
`/api/estado` y `/api/salud`. Se valida cada entrada (texto obligatorio y máximo 280 caracteres, identificadores válidos,
usuarios existentes, amistades no repetidas ni consigo mismo) y se devuelven códigos HTTP claros (400, 404, 409).
Borrar una publicación borra sus comentarios; borrar un comentario borra su subárbol.

# 6. Pruebas y limitaciones conocidas

Se ejecutan con `npm test` (20 pruebas): estructuras de datos, API con base de datos real y la pantalla completa. Las
pruebas del desarrollo se corrieron contra FerretDB (compatible con el protocolo de MongoDB); la publicación usa MongoDB Atlas.

Limitaciones: sin autenticación (usuario único simulado); sin transacciones multi-documento (por ejemplo, un "me gusta"
y su notificación son dos escrituras seguidas; si el servidor se cae entre ambas, la notificación podría faltar); el
estado completo se recarga después de cada acción, lo cual es simple y suficiente para el tamaño del proyecto.

# 7. Contribución

| Integrante | Contribución |
|---|---|
| Juan Camilo Reyes Cardona | Diseño, estructuras de datos 1–5, interfaz, backend, base de datos, pruebas, documentación y despliegue |
