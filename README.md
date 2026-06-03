# TerraBioCol

Aplicacion web full stack para venta, asignacion y seguimiento de arboles en Colombia.

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Base de datos: PostgreSQL
- ORM: Prisma
- Autenticacion: JWT
- Roles: `CLIENTE` y `ADMIN`

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

- Admin: `admin@terrabiocol.com`
- Cliente: `cliente@terrabiocol.com`
- Contrasena para ambos: `Terrabio123!`

## Scripts

- `npm run dev`: ejecuta frontend y backend.
- `npm run dev:client`: ejecuta solo React/Vite.
- `npm run dev:server`: ejecuta solo Express.
- `npm run db:migrate`: aplica migraciones Prisma.
- `npm run db:seed`: carga datos iniciales.
- `npm run build`: compila el frontend.

## Variables de entorno

Copia `.env.example` a `.env` y ajusta valores segun tu entorno.

## Flujo de uso

1. Registrate o inicia sesion.
2. Compra un arbol desde el catalogo.
3. Consulta tus arboles asignados.
4. Revisa eventos de seguimiento.
5. Calcula la huella de carbono compensada.
6. Accede al panel de administracion con un usuario `ADMIN`.
