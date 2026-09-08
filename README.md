# Centro de tareas

App de gestión de tareas (SuccessFactors · Time Tracking) construida con Next.js 14, Tailwind CSS, Recharts y Lucide Icons.

## Diferencia con la versión "artifact"

La versión original usaba `window.storage`, una API que solo existe dentro de los artifacts de Claude. Esta versión usa `localStorage` del navegador, así que los datos se guardan **por navegador/dispositivo**, no en un servidor. Si más adelante quieres que las tareas se compartan entre usuarios o dispositivos, habría que añadir una base de datos (por ejemplo Vercel Postgres, Supabase o Firebase) y una API route en Next.js.

## Ejecutar en local

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## Subir a GitHub

```bash
git init
git add .
git commit -m "Centro de tareas inicial"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/centro-tareas.git
git push -u origin main
```

(Sustituye la URL por la de tu propio repositorio, creado antes en https://github.com/new)

## Desplegar en Vercel

1. Ve a https://vercel.com/new
2. Importa el repositorio de GitHub que acabas de crear.
3. Vercel detecta automáticamente que es un proyecto Next.js — no hace falta configurar nada más.
4. Pulsa "Deploy".

Cada vez que hagas `git push` a `main`, Vercel volverá a desplegar automáticamente.

## Estructura del proyecto

```
centro-tareas/
├── app/
│   ├── layout.jsx      # layout raíz
│   ├── page.jsx        # página principal
│   └── globals.css     # Tailwind + fuentes
├── components/
│   └── TaskCenter.jsx  # componente principal (toda la lógica y UI)
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── next.config.mjs
```
