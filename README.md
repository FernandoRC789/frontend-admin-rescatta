# Rescatta · Panel de Administrador (Veterinaria / Refugio)

Panel web (React + TypeScript + Vite + Tailwind) para el rol **Administrador** de
Rescatta: veterinarias y refugios que revisan, aprueban y gestionan los reportes de
animales enviados desde la app iOS, y chatean en tiempo real con el ciudadano que
reportó cada caso.

Usa **Firebase Authentication** — el mismo proyecto de Firebase que ya usa la app iOS.
El rol (Ciudadano / Administrador / Superadmin) no vive en Firebase, vive en el backend
(tabla `app_users`), así que cualquier cuenta de Firebase puede loguearse aquí; si es su
primera vez, el backend la crea como CIUDADANO y quedará bloqueada hasta que
registre una organización.

## Flujo de una veterinaria/refugio nuevo

1. Entra a `/registrar-organizacion`, completa el formulario y crea su cuenta (o usa una
   ya logueada). Esto la vincula como ADMINISTRADOR de una nueva `Organization`
   (`verified = false`).
2. Ve la pantalla "Pendiente de verificación" hasta que el equipo de Rescatta (rol
   SUPERADMIN) la valide desde `/rescatta-admin/organizaciones`.
3. Una vez verificada, tiene acceso completo: Dashboard, Reportes (aprobar/rechazar/
   actualizar estado), Chat, y su perfil de organización (ubicación en mapa, horario,
   contacto, logo).

## Setup local

```bash
npm install
cp .env.example .env
# completa .env con la URL de tu backend y las credenciales de tu proyecto Firebase
npm run dev
```

Variables de entorno (`.env`):

| Variable | Descripción |
|---|---|
| `VITE_API_BASE_URL` | Raíz del backend, **sin** `/api/v1` (ej. `http://localhost:8081`) |
| `VITE_WS_URL` | Endpoint WebSocket del chat (ej. `http://localhost:8081/ws`) |
| `VITE_FIREBASE_*` | Config del mismo proyecto Firebase que usa la app iOS (Project Settings → Web App en la consola de Firebase) |

La app valida estas variables al arrancar y muestra un error claro si falta alguna.

### Imágenes

Las imágenes nuevas de Cloudinary llegan como URLs absolutas y se usan tal cual. Las
URLs relativas antiguas (`/uploads/...`) se resuelven contra `VITE_API_BASE_URL` con
`src/lib/imageUrl.ts`. No antepongas el dominio del backend a una URL que ya empieza
por `http://` o `https://`.

## Crear el primer SUPERADMIN

1. En el backend, define la variable de entorno `RESCATTA_SUPERADMIN_SECRET` con un
   valor secreto.
2. Inicia sesión en el panel con la cuenta que quieres que sea SUPERADMIN.
3. Llama una sola vez (Postman, curl, o Swagger UI del backend):
   ```
   POST {API_BASE_URL}/api/v1/superadmin/bootstrap?secret=<tu_secreto>
   Authorization: Bearer <idToken de esa cuenta>
   ```
4. Recarga el panel — ahora verás "Verificar organizaciones" en el menú lateral.
5. Rota/borra la variable de entorno para que nadie más pueda auto-otorgarse el rol.

## Deploy

Este es un sitio estático (build con Vite) — despliega el contenido de `dist/` en
**Render (Static Site)**, Vercel, Netlify o Firebase Hosting. En Render:

1. New → Static Site → conecta el repo.
2. Build command: `npm ci && npm run build`
3. Publish directory: `dist`
4. Agrega las variables de entorno `VITE_*` en la sección Environment.
5. El repo incluye `render.yaml`, `public/_redirects` y `vercel.json` con la regla de
   rewrite a `index.html`, necesaria para que rutas como `/reportes/1` no den 404.
6. Una vez desplegado, copia su URL (ej. `https://rescatta-admin.onrender.com`) y
   configúrala como `RESCATTA_CORS_ORIGINS` en el backend, para que el navegador pueda
   llamar a la API y conectarse al WebSocket sin bloqueos de CORS.

## Estructura

```
src/
  api/          cliente axios + funciones por dominio (auth, organizations, reports, chat)
  context/      AuthContext (Firebase + perfil/rol desde el backend)
  components/   Layout, ProtectedRoute, StatusBadge
  hooks/        useChatSocket (STOMP/SockJS para mensajes en tiempo real)
  pages/        una página por ruta
  lib/          utilidades (env, URLs de imágenes, fix de íconos de Leaflet)
```
