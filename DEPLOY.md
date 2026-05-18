# Pulsar — Git + siempre online (como Impostor Dominicano)

## Cómo lo hace Impostor Dominicano

| Pieza | Impostor | Pulsar |
|-------|----------|--------|
| Código | GitHub `Camacho-Dev/impostor-dominicano` | Tu repo en GitHub |
| Web online | **GitHub Pages** (estático, Vite) | **Render** (servidor Node + SQLite) |
| Push a `main` | GitHub Actions despliega solo | Render redespliega solo |
| APK Android | Capacitor → URL de GitHub Pages | Capacitor → URL de Render |

Impostor no necesita servidor propio: es HTML/JS + Firebase.  
Pulsar sí necesita **Node + Socket.IO + base de datos**, por eso usamos **Render** (gratis con disco para SQLite).

---

## 1. Subir a GitHub

```bash
cd pulsar
git add .
git commit -m "Pulsar: app completa + deploy Render"
git branch -M main
git remote add origin https://github.com/Camacho-Dev/pulsar.git
git push -u origin main
```

(Si ya tienes remote, solo `git push`.)

---

## 2. Dejarlo siempre online en Render

1. Entra en [render.com](https://render.com) e inicia sesión con GitHub.
2. **New → Blueprint** y selecciona el repo `pulsar`.
3. Render lee `render.yaml` y crea el servicio.
4. En el panel del servicio, configura variables (si no las pusiste al crear):

   | Variable | Ejemplo |
   |----------|---------|
   | `AUTH_URL` | `https://pulsar-xxxx.onrender.com` |
   | `NEXT_PUBLIC_APP_URL` | igual que AUTH_URL |
   | `NEXT_PUBLIC_MAPBOX_TOKEN` | tu token `pk....` de Mapbox |
   | `AUTH_SECRET` | (Render puede generarla) |

5. Cada **push a `main`** vuelve a desplegar automáticamente.

URL final: `https://pulsar-xxxx.onrender.com`  
Login demo: `mover@pulsar.app` / `pilot@pulsar.app` — `pulsar123`

---

## 3. APK con Android Studio (igual que Impostor)

Cuando ya tengas la URL pública de Render:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init Pulsar com.pulsar.mobility
# Edita capacitor.config.json: server.url = tu URL de Render (ver capacitor.config.example.json)
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

En Android Studio: **Build → Build APK(s)**.

---

## 4. Probar Docker en local (opcional)

```bash
docker build -t pulsar .
docker run -p 3000:3000 -e AUTH_SECRET=local-secret-32chars-minimum -e AUTH_URL=http://localhost:3000 -e NEXT_PUBLIC_APP_URL=http://localhost:3000 -e NEXT_PUBLIC_MAPBOX_TOKEN=pk... -v pulsar-data:/data pulsar
```

---

## 5. Mantenerlo despierto (plan free de Render)

Impostor en GitHub Pages **no se duerme**; Render free sí, tras ~15 min sin tráfico.

1. Cuando tengas la URL de Render, en GitHub: **Settings → Secrets and variables → Actions**.
2. Crea `PULSAR_URL` = `https://pulsar-xxxx.onrender.com`.
3. El workflow `.github/workflows/keep-alive.yml` hace ping a `/login` cada 14 minutos.

También puedes usar [UptimeRobot](https://uptimerobot.com) (gratis) apuntando a la misma URL.

---

## Notas

- El plan **free** de Render puede tardar ~30 s en el primer acceso tras despertar; con keep-alive suele quedar casi siempre activo.
- Para producción seria: plan de pago en Render o VPS (Railway, Fly.io, DigitalOcean).
- No subas `.env.local` a Git (ya está en `.gitignore`).
