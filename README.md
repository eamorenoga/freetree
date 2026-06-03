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
