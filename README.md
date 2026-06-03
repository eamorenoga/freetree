# TerraBioCol

Aplicacion web full stack para venta, asignacion y seguimiento de arboles en Colombia.

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Base de datos: PostgreSQL
- ORM: Prisma
- Autenticacion: JWT
- Roles: `CLIENTE` y `ADMIN`

## Modelo de datos

El esquema Prisma define las entidades principales de TerraBioCol:

- `User` y `Role` para usuarios y roles de acceso.
- `TreeProduct` para catalogo de arboles disponibles.
- `TreePurchase` para cada arbol comprado por un usuario.
- `Payment` con estados `PENDING`, `APPROVED`, `REJECTED` y `CANCELLED`.
- `QRCode` unico por arbol comprado.
- `TreeTracking` para seguimientos con fecha, descripcion, ubicacion opcional y estado.
- `TreePhoto` para fotos cargadas por administradores.
- `CarbonFootprint` para calculos por arbol y acumulados por usuario.
- `AdminUploadLog` para auditar cargas administrativas.

## Requisitos

- Node.js 20 o superior con npm
- Docker Desktop o PostgreSQL local

## Instalacion

```bash
npm install
cp .env.example .env
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

Frontend: http://localhost:5173

Backend: http://localhost:4000

## Despliegue en Render

El proyecto incluye `render.yaml` para desplegar una sola Web Service Node que sirve la API y el frontend compilado.

1. Haz push del repositorio a GitHub.
2. En Render, crea un Blueprint desde este repo.
3. Render creara:
   - Web Service: `terrabiocol`
   - PostgreSQL: `terrabiocol-db`
4. El build ejecuta `npm install && npm run build`.
5. El pre-deploy ejecuta migraciones y seed:
   `npm run db:migrate:deploy && npm run db:seed`
6. La app quedara disponible en la URL del Web Service.

Si cambias el subdominio del servicio en Render, actualiza `CLIENT_URL` en el dashboard o en `render.yaml`.

## Usuarios demo

- Admin: `admin` o `admin@terrabiocol.com`
- Cliente: `cliente` o `cliente@terrabiocol.com`
- Contrasena para ambos: `Terrabio123!`

## Autenticacion

Endpoints REST principales:

- `POST /api/auth/register`: crea usuario `CLIENTE` con nombre, usuario, correo y contrasena cifrada con bcrypt.
- `POST /api/auth/login`: inicia sesion con usuario/correo y contrasena.
- `GET /api/auth/me`: devuelve el usuario autenticado usando JWT.
- `PUT /api/auth/profile`: actualiza nombre y usuario.
- `POST /api/auth/forgot-password`: genera token de recuperacion simulado.
- `POST /api/auth/reset-password`: restablece contrasena con token.

El middleware `requireAuth` valida JWT y `requireRole("ADMIN")` protege rutas administrativas.

## Scripts

- `npm run dev`: ejecuta frontend y backend.
- `npm run dev:client`: ejecuta solo React/Vite.
- `npm run dev:server`: ejecuta solo Express.
- `npm run db:migrate`: aplica migraciones Prisma.
- `npm run db:seed`: carga datos iniciales.
- `npm run build`: compila el frontend.

## Variables de entorno

Copia `.env.example` a `.env` y ajusta valores segun tu entorno.

Si ves `Environment variable not found: DATABASE_URL`, significa que Prisma no encontro la cadena de conexion.
En local, confirma que existe `.env` en la raiz con `DATABASE_URL`.
En Render, confirma que el servicio tenga `DATABASE_URL` apuntando a la base PostgreSQL.

Para configurarlo manualmente en Render:

1. Abre tu base PostgreSQL en Render.
2. Copia el valor de `Internal Database URL`.
3. Abre el Web Service de TerraBioCol.
4. Ve a `Environment`.
5. Agrega:
   - Key: `DATABASE_URL`
   - Value: el `Internal Database URL` de PostgreSQL
6. Guarda y ejecuta `Manual Deploy > Clear build cache & deploy`.

## Flujo de uso

1. Registrate o inicia sesion.
2. Compra un arbol desde el catalogo.
3. Consulta tus arboles asignados.
4. Revisa eventos de seguimiento.
5. Calcula la huella de carbono compensada.
6. Accede al panel de administracion con un usuario `ADMIN`.
