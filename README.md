# Social Network (Node + Express + React + Prisma + PostgreSQL)

Red social simple con: registro/login JWT + bcrypt, subida de avatar con multer, posts con imagen, comentarios, reacciones personalizadas, menciones @, amistades con solicitud y relación, notificaciones, chat 1:1, personalización de UI por usuario, modo oscuro y lightbox para imágenes (frontend en React + Vite + Tailwind + React Query + React Router + Framer Motion).

## Requisitos
- Node.js 18+
- PostgreSQL local
- npm

## Variables de entorno
Copia `.env.example` a `.env` (raiz o al menos `backend/.env` y `frontend/.env`) y ajusta credenciales:
```
PORT=4000
DATABASE_URL="postgresql://postgres:"tuclave123".@localhost:5432/redecita?schema=public"
JWT_SECRET="cambia-esta-clave-super-secreta"
VITE_API_URL="http://localhost:4000/api"
```

## Pasos para levantar todo
1) Crea la base:
```sql
CREATE DATABASE socialnetwork;
```
2) Backend:
```bash
cd backend
npm install
npx prisma migrate dev --name init      # aplica todas las migraciones
npm run dev                             # http://localhost:4000
```
3) Frontend:
```bash
cd frontend
npm install
npm run dev                             # http://localhost:5173 por defecto
```
4) Abre el frontend, regístrate y prueba el feed, reacciones, menciones, chat, notificaciones, personalización y modo oscuro.

## Qué hay y dónde
### Backend (`backend/`)
- `src/server.js`: arranque Express, CORS, morgan, JSON, estáticos `/uploads`, monta rutas.
- `src/prisma.js`: PrismaClient con adaptador pg.
- `src/middleware/auth.js`: `requireAuth` valida JWT y setea `req.userId`.
- `src/routes/auth.js`: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`.
- `src/routes/users.js`: perfil `/api/users/:username` (estado de amistad, relación y posts con reacciones), `PUT /api/users/me`, `PUT /api/users/me/avatar`, buscador `/api/users/search?q=` (máx 5).
- `src/routes/posts.js`: feed `/api/posts`, detalle `/api/posts/:id`, crear con imagen, comentarios, likes toggle, reacciones `/api/posts/:id/reactions`, menciones @ (post y comentarios) generan notificación.
- `src/routes/friends.js`: `GET /api/friends`, enviar solicitud `/api/friends/:username`, aceptar `/api/friends/:username/accept`, cancelar/eliminar `/api/friends/:username`, clasificar relación `/api/friends/:username/relation` (category/detail).
- `src/routes/notifications.js`: listar y marcar como leídas.
- `src/routes/chat.js`: conversaciones `/api/chat/conversations`, mensajes `/api/chat/:id/messages`, enviar `/api/chat/to/:username` (notifica).
- `src/routes/preferences.js`: guardar/leer preferencias UI del usuario.
- `uploads/avatars`, `uploads/posts`: archivos servidos desde `/uploads/...`.
- `prisma/schema.prisma`: modelos `User`, `Post`, `Comment`, `Like`, `Reaction` (enum), `Friendship` (enum + relación categoría/detalle), `Notification` (REACTION, MENTION, MESSAGE), `UserPreference`, `Conversation`, `ConversationParticipant`, `Message`.
- Scripts: `npm run dev`, `npm start`, `npm run prisma:migrate`, `npm run prisma:generate`.

### Frontend (`frontend/`)
- Config: `tailwind.config.js` (darkMode class), `postcss.config.js`, `src/index.css`.
- Contextos: `AuthContext` (usuario/token), `ThemeContext` (oscuro/claro), `PreferencesContext` (cardStyle/theme por usuario), `LightboxContext`.
- API: `src/api/client.js` (Axios con `VITE_API_URL`).
- Constantes: `src/constants/reactions.js`.
- Componentes clave: `NavBar` (buscador, campana de notificaciones, toggle tema, enlaces), `NotificationBell`, `UserSearch`, `ThemeToggle`, `Avatar` (abre lightbox), `Lightbox`, `PostComposer` (FormData + imagen), `PostCard` (reacciones por tipo con animación, comentarios, imagen fullscreen), etc.
- Páginas: `Login`, `Register`, `Feed`, `Profile` (amistad, relación, posts), `EditProfile` (bio/username/avatar), `Chat` (conversaciones 1:1), `Settings` (preferencias UI).
- `App.jsx`: rutas protegidas con `ProtectedRoute`.

## Endpoints principales
- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
- Usuarios: `GET /api/users/:username`, `PUT /api/users/me`, `PUT /api/users/me/avatar` (FormData `avatar`), `GET /api/users/search?q=`.
- Amigos: `GET /api/friends`, `POST /api/friends/:username`, `POST /api/friends/:username/accept`, `POST /api/friends/:username/relation`, `DELETE /api/friends/:username`.
- Posts: `GET /api/posts`, `GET /api/posts/:id`, `POST /api/posts` (FormData `content`, opcional `image`), `POST /api/posts/:id/like`, `GET/POST /api/posts/:id/comments` (body `{content}`), `POST /api/posts/:id/reactions` (body `{type}`), menciones `@username` notifican.
- Notificaciones: `GET /api/notifications`, `POST /api/notifications/read`.
- Chat: `GET /api/chat/conversations`, `GET /api/chat/:id/messages`, `POST /api/chat/to/:username`.
- Preferencias: `GET/PUT /api/preferences`.

## Modelos (Prisma)
- `User`, `Post`, `Comment`, `Like`, `Reaction` (ReactionType), `Friendship` (PENDING/ACCEPTED + category/detail), `Notification` (REACTION/MENTION/MESSAGE con data JSON), `UserPreference` (cardStyle/theme), `Conversation`, `ConversationParticipant`, `Message`.

## Cómo probar rápido
1) Levanta backend (`npm run dev`) y frontend (`npm run dev`).
2) Regístrate y entra al feed: publica con imagen, reacciona, comenta, menciona con `@usuario`.
3) Mira el header: campana de notificaciones, toggle de tema, buscador. Las reacciones/menciones/mensajes generan notificaciones.
4) Envía solicitud de amistad desde un perfil, acéptala desde el otro, clasifica la relación y observa el estado.
5) Usa el chat (link en barra) para enviar mensajes (1:1); las imágenes se ven completas al click (lightbox).
6) Personaliza UI en `/settings` (radio, glass, tema) y observa cómo se aplican las cards solo para tu sesión.
