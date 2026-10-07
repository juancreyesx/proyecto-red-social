# MiniRed — red social con estructuras de datos

Proyecto integrador de **Estructuras de Datos y Algoritmos 2** (Universidad Autónoma de Occidente, 2026-5B).
Una mini red social (publicaciones, comentarios, notificaciones, amigos y búsqueda de personas) donde cada
funcionalidad está construida sobre una estructura de datos programada desde cero.

## Integrantes

| Integrante | Código | Rama de trabajo |
|---|---|---|
| Juan Camilo Reyes Cardona | 2235983 | `juan-camilo-reyes` |

Docente: Jonathan López Londoño.

## Enlaces publicados

| Qué | Enlace |
|---|---|
| Aplicación (frontend + backend) | _PENDIENTE: pegar aquí la URL de Render_ |
| Repositorio | _PENDIENTE: pegar aquí la URL de GitHub_ |

## Las 5 estructuras de datos

| # | Estructura | Categoría | Dónde se usa | Archivo |
|---|---|---|---|---|
| 1 | Lista enlazada simple | lista | Feed de publicaciones (la más nueva va a la cabeza) | `frontend/js/estructuras/lista-publicaciones.js` |
| 2 | Árbol n-ario | árbol | Comentarios y respuestas de cada publicación | `frontend/js/estructuras/arbol-comentarios.js` |
| 3 | Cola (FIFO) | cola | Notificaciones: se atienden en orden de llegada | `frontend/js/estructuras/cola-notificaciones.js` |
| 4 | Grafo (lista de adyacencia, no dirigido) | grafo | Amistades y sugerencias por amigos en común | `frontend/js/estructuras/grafo-amigos.js` |
| 5 | Árbol binario de búsqueda (BST) | árbol | Búsqueda de personas por nombre | `frontend/js/estructuras/bst-usuarios.js` |

Cumple la rúbrica: 2 de {lista, pila, cola} (lista y cola) + 2 de {árbol, trie, heap} (árbol n-ario y BST) + 1 grafo.
La justificación de cada elección está en [`docs/DOCUMENTO_FINAL.md`](docs/DOCUMENTO_FINAL.md).

## Cómo funciona

```
Navegador (frontend, JS puro)  <-- fetch/JSON -->  Servidor (Node + Express)  <-->  MongoDB
  reconstruye las 5 estructuras                      API REST /api/...              (Atlas en la nube)
  con los datos que llegan
```

La base de datos guarda los datos "planos"; al abrir la página el frontend pide `/api/estado` y arma las
estructuras en memoria. Cada acción (publicar, comentar, dar like, agregar amigo...) se guarda primero en
MongoDB y después se recarga el estado, así lo que ves siempre coincide con lo guardado.

## Ejecutar en tu computador

Necesitas **Node.js 18+** y una base MongoDB (local o la cadena de conexión de MongoDB Atlas).

```bash
cd backend
npm install
cp .env.example .env     # abre .env y pon tu MONGODB_URI
npm start
```

Abre <http://localhost:3000>. La primera vez se crean usuarios y amistades de ejemplo.

### Variables de entorno (`backend/.env`)

| Variable | Para qué | Valor por defecto |
|---|---|---|
| `MONGODB_URI` | Cadena de conexión a MongoDB | `mongodb://127.0.0.1:27017/minired` |
| `PORT` | Puerto del servidor (Render lo asigna solo) | `3000` |
| `CORS_ORIGIN` | Dominio del frontend si va separado (Netlify) | `*` |

## Pruebas

```bash
cd backend
npm test
```

Ejecuta 20 pruebas: estructuras de datos (unitarias), API REST (con base de datos real) y la pantalla completa
(abre `index.html` en jsdom y simula clics contra el backend). Usan las bases `minired_test` y
`minired_test_ui`, que se borran al terminar; necesitan MongoDB en `127.0.0.1:27017`
(o las variables `MONGODB_TEST_URI` / `MONGODB_TEST_URI_UI`).

## API

| Método y ruta | Acción |
|---|---|
| `GET /api/salud` | Estado del servidor y la base de datos |
| `GET /api/estado?usuario=` | Todo lo necesario para armar las estructuras |
| `POST /api/publicaciones` · `POST /api/publicaciones/:id/like` · `DELETE /api/publicaciones/:id` | Publicaciones |
| `POST /api/publicaciones/:id/comentarios` · `POST /api/comentarios/:id/like` · `DELETE /api/comentarios/:id` | Comentarios (árbol) |
| `POST /api/amistades` · `DELETE /api/amistades?a=&b=` | Amistades (aristas del grafo) |
| `POST /api/usuarios` | Registrar usuario (entra al BST) |
| `DELETE /api/notificaciones/siguiente?usuario=` · `DELETE /api/notificaciones?usuario=` | Atender siguiente / vaciar la cola |

## Publicar en internet (Render + MongoDB Atlas)

El mismo servidor entrega el frontend y la API, así que se publica **una sola cosa**.

1. **Base de datos:** en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) crea un cluster gratis (M0), un usuario de base de datos
   y en *Network Access* permite `0.0.0.0/0`. Copia la cadena de conexión (`mongodb+srv://...`) y agrega el nombre
   de la base antes del `?`, por ejemplo `.../minired?retryWrites=true&w=majority`.
2. **Servidor:** en [Render](https://render.com) → *New → Web Service* → conecta este repositorio y configura:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `MONGODB_URI` = la cadena de Atlas
3. Cuando termine, Render muestra la URL pública (`https://....onrender.com`). Pégala arriba en **Enlaces publicados**.

_Opcional (Netlify para el frontend):_ publica la carpeta `frontend`, edita `frontend/js/config.js` con
`window.MINIRED_API_URL = "https://tu-servicio.onrender.com";` y en Render pon `CORS_ORIGIN` con la URL de Netlify.

## Estructura del repositorio

```
frontend/   index.html, css/, js/ (app.js, amigos.js, api.js, estructuras/)
backend/    src/ (models, controllers, routes, middlewares), test/
docs/       DOCUMENTO_FINAL.md (alcance, tecnologías y estructuras)
```

## Flujo de Git

Ramas, todas integradas a `main` (`git branch --merged main`):

| Rama | Contenido |
|---|---|
| `etapa-1-publicaciones` | Lista enlazada: publicaciones |
| `etapa-2-comentarios` | Árbol n-ario: comentarios y respuestas |
| `etapa-3-notificaciones` | Cola: notificaciones |
| `etapa-4-amigos` | Grafo: amigos y sugerencias |
| `juan-camilo-reyes` | Backend, MongoDB, BST (estructura 5), pruebas y documentación (integrada con *merge* a `main`) |
