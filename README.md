# WeatherPulse

Aplicación full-stack de clima en tiempo real construida con Next.js (App Router). Permite buscar ciudades con autocompletado, consultar el clima actual y un pronóstico a 5 días, y guardar ciudades favoritas por usuario. Todas las llamadas a la API externa pasan por un proxy seguro en el backend, de modo que el navegador nunca contacta directamente al servicio externo.

## Qué hace

- **Buscador de ciudades** con autocompletado y *debounce* (400 ms) para no saturar la API.
- **Clima actual**: temperatura, humedad, viento e índice UV.
- **Pronóstico a 5 días** en tarjetas dinámicas.
- **Proxy seguro en el backend**: el frontend solo llama a `/api/weather` y `/api/geocoding`; el servidor consume Open-Meteo.
- **Favoritos (CRUD)** persistidos en PostgreSQL mediante Prisma, con protección contra IDOR (toda mutación filtra por `userId`).
- **Caché** en memoria (10 min para el clima, 1 h para geocodificación) y **rate limiting** básico por IP (30 req/60 s) en el endpoint de geocodificación.
- **Autenticación** con Auth.js v5 (GitHub) y sesiones en base de datos.

## Stack técnico

- **Next.js 16** (App Router, Server & Client Components) + **TypeScript** estricto.
- **Tailwind CSS v4**.
- **Prisma ORM** sobre **PostgreSQL** (Neon).
- **Auth.js v5** (`next-auth@beta`) con `@auth/prisma-adapter` y proveedor de GitHub, estrategia de sesión en base de datos.
- **Open-Meteo** para clima y geocodificación (sin API key).
- **zod** para validación de entrada.

## Estructura de carpetas

```
app/
  api/
    weather/route.ts        # Proxy del clima (validación zod + caché)
    geocoding/route.ts      # Proxy de geocodificación (rate limiting + caché)
    auth/[...nextauth]/route.ts
  favorites/page.tsx        # Lista de favoritos (Server Component, dinámico)
  layout.tsx                # Layout raíz (metadata, lang="es")
  page.tsx                  # Home: búsqueda + tarjeta de clima
components/
  search-bar.tsx            # Input con debounce + AbortController
  weather-card.tsx          # Tarjeta de clima + botón de favorito
  weather-skeleton.tsx      # Skeleton de carga
  favorite-item.tsx         # Ítem de favorito + eliminar
lib/
  prisma.ts                 # Singleton de PrismaClient
  auth.ts                   # Configuración de Auth.js v5
  cache.ts                  # Caché en memoria con TTL
  use-debounce.ts           # Hook useDebounce
services/
  weather.ts                # Llamadas a Open-Meteo (solo servidor)
actions/
  favorites.ts              # Server Actions del CRUD de favoritos
types/
  weather.ts                # Tipos estrictos del clima
  next-auth.d.ts            # Augmentación de sesión (session.user.id)
prisma/
  schema.prisma             # Modelos User, FavoriteCity, Account, Session...
```

## Configuración local

Requisitos: Node.js 18.18+ y npm.

1. Instala las dependencias:

   ```bash
   npm install
   ```

   El script `postinstall` ejecuta `prisma generate` automáticamente.

2. Crea tu archivo `.env` a partir de `.env.example`:

   ```bash
   cp .env.example .env
   ```

3. Completa las variables (ver más abajo). Para desarrollo local, genera un `AUTH_SECRET`:

   ```bash
   npx auth secret
   ```

4. Arranca el servidor de desarrollo:

   ```bash
   npm run dev
   ```

## Variables de entorno

| Variable             | Descripción                                                        |
| -------------------- | ------------------------------------------------------------------ |
| `DATABASE_URL`       | Cadena de conexión a PostgreSQL (con *pooling* en Neon).           |
| `DIRECT_URL`         | Conexión directa (sin pooler), usada por Prisma Migrate.           |
| `AUTH_SECRET`        | Secreto de Auth.js (genéralo con `npx auth secret`).               |
| `AUTH_GITHUB_ID`     | Client ID de la OAuth App de GitHub.                               |
| `AUTH_GITHUB_SECRET` | Client Secret de la OAuth App de GitHub.                           |

> **Seguridad:** ninguna de estas variables lleva el prefijo `NEXT_PUBLIC_`. Las claves de API y de base de datos se quedan siempre en el servidor y nunca se exponen al navegador. El cliente solo habla con los endpoints internos `/api/weather` y `/api/geocoding`.

## Base de datos (Neon)

1. Crea un proyecto en [Neon](https://neon.tech) y una base de datos PostgreSQL.
2. Copia la cadena de conexión *pooled* en `DATABASE_URL` y la cadena *direct* en `DIRECT_URL`.
3. Aplica el esquema con una migración:

   ```bash
   npx prisma migrate dev --name init
   ```

   > `prisma generate` no necesita conexión a la base de datos; `prisma migrate` sí.

## GitHub OAuth

1. En GitHub: *Settings → Developer settings → OAuth Apps → New OAuth App*.
2. **Authorization callback URL**:
   - Local: `http://localhost:3000/api/auth/callback/github`
   - Producción: `https://TU-DOMINIO/api/auth/callback/github`
3. Copia el Client ID y el Client Secret en `AUTH_GITHUB_ID` y `AUTH_GITHUB_SECRET`.

## Despliegue en Vercel

1. Importa el repositorio en [Vercel](https://vercel.com).
2. **Build command**: `npm run build` (ejecuta `prisma generate && next build`).
3. Configura las variables de entorno en el proyecto de Vercel:
   `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`.
4. Actualiza la **callback URL** de la OAuth App de GitHub al dominio de producción:
   `https://TU-DOMINIO/api/auth/callback/github`.
5. Ejecuta las migraciones contra la base de datos de producción:

   ```bash
   npx prisma migrate deploy
   ```

## Scripts

- `npm run dev` — servidor de desarrollo.
- `npm run build` — `prisma generate` + build de producción.
- `npm run start` — servidor de producción.
- `npm run lint` — ESLint.
