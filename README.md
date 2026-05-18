# Pulsar

App de movilidad (pasajero + conductor) con Next.js, Socket.IO, Mapbox y SQLite.

## Desarrollo local

```bash
npm install
npm run db:setup
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

**Demo:** `mover@pulsar.app` / `pilot@pulsar.app` — contraseña `pulsar123`

## Git + siempre online (como Impostor Dominicano)

| | Impostor Dominicano | Pulsar |
|---|---------------------|--------|
| Repo | `Camacho-Dev/impostor-dominicano` | `Camacho-Dev/pulsar` (crear y subir) |
| Hosting | GitHub Pages (estático) | Render (Node + SQLite) |
| Auto-deploy | push a `main` → Actions | push a `main` → Render |
| APK | Capacitor → URL de Pages | Capacitor → URL de Render |

Guía paso a paso: **[DEPLOY.md](./DEPLOY.md)**
