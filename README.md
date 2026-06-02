# Digital Wardrobe — Documento técnico

Este repositorio implementa una aplicación web llamada "Digital Wardrobe" construida con Next.js (App Router) y TypeScript. A continuación encontrarás una descripción técnica completa: estructura, responsabilidades de archivos, parámetros y flujo de datos, instrucciones de desarrollo y despliegue, y tareas previstas.

**Resumen:**
- **Propósito:** Permitir subir, procesar y visualizar prendas, ofreciendo herramientas de análisis (ej. remover fondo, analizar ropa, sugerencias de estilo) y una interfaz para gestionar prendas.
- **Stack principal:** Next.js (App Router), TypeScript, Supabase (auth + storage + DB), CSS global (postcss).

**Cómo usar (rápido):**
```bash
npm install
npm run dev
# Visitar http://localhost:3000
```

**Estructura general del repositorio**
- **[src/app](src/app)**: Código de la aplicación (rutas, layout, páginas).
- **[src/app/api](src/app/api)**: Endpoints de la API (serverless routes).
- **[src/app/components](src/app/components)**: Componentes React reutilizables.
- **[src/app/data](src/app/data)**: Datos estáticos o helpers (ej. `clothes.ts`).
- **[src/app/lib](src/app/lib)**: Helpers de cliente (ej. `supabase.ts`).
- **[lib](lib)**: Helpers compartidos fuera de `src` (ej. duplicado de `supabase.ts` para entorno servidor o utilidad de backend).

Descripción por archivos y carpetas clave
- **[src/app/layout.tsx](src/app/layout.tsx)**: Root layout que envuelve las páginas, incluye `globals.css`.
- **[src/app/page.tsx](src/app/page.tsx)**: Página de inicio; punto de entrada de la UI.
- **[src/app/api/analyze-clothing/route.ts](src/app/api/analyze-clothing/route.ts)**: Endpoint que recibe una imagen o referencia y ejecuta la lógica de análisis de prenda (p. ej. clasificación, extracción de etiquetas). Aquí se integraría un modelo o servicio externo.
- **[src/app/api/remove-background/route.ts](src/app/api/remove-background/route.ts)**: Endpoint que procesa imágenes para eliminar el fondo (llama a un servicio de IA o librería de imagen). Devuelve la imagen procesada (o URL en storage).
- **[src/app/api/stylist/route.ts](src/app/api/stylist/route.ts)**: Endpoint que conecta la lógica de recomendaciones de estilo (puede comunicarse con un LLM o regla interna).
- **[src/app/auth/page.tsx](src/app/auth/page.tsx)**: Pantalla de autenticación (login / signup) — integra con Supabase Auth.

Componentes principales (ubicación y propósito)
- **[src/app/components/UploadMenu.tsx](src/app/components/UploadMenu.tsx)**: UI para subir imágenes de prendas.
- **[src/app/components/ClothingCard.tsx](src/app/components/ClothingCard.tsx)**: Tarjeta que muestra metadata y acciones sobre una prenda.
- **[src/app/components/ImageViewer.tsx](src/app/components/ImageViewer.tsx)**: Visualizador de imágenes con controles (zoom, descarga, etc.).
- **[src/app/components/ProcessedClothingImage.tsx](src/app/components/ProcessedClothingImage.tsx)**: Componente para mostrar imagenes tras procesamiento (fondo eliminado, máscaras).
- **[src/app/components/StylistChat.tsx](src/app/components/StylistChat.tsx)**: Interfaz de chat para recibir sugerencias de estilo.
- **[src/app/components/ClothingEditorModal.tsx](src/app/components/ClothingEditorModal.tsx)**: Modal para editar metadatos de una prenda.

Conexiones y flujo de datos
- Subida: el usuario sube una imagen desde `UploadMenu`. El cliente guarda la imagen en Supabase Storage o la envía al endpoint `remove-background`.
- Procesado: `remove-background` devuelve imagen con fondo removido; la versión final se almacena y se indexa en la BDD (o en un bucket).
- Análisis: `analyze-clothing` recibe la imagen (o su URL) y extrae etiquetas (tipo, color, patrón). Los resultados se asocian al objeto prenda.
- Recomendaciones: `stylist` usa la metadata y (opcionalmente) un LLM para generar sugerencias.
- Visualización: componentes como `ClothingCard`, `ImageViewer` y `ProcessedClothingImage` presentan la información al usuario.

Supabase y autenticación
- **[src/app/lib/supabase.ts](src/app/lib/supabase.ts)** y **[lib/supabase.ts](lib/supabase.ts)**: Clientes para interactuar con Supabase. Uno suele utilizarse client-side (con `NEXT_PUBLIC_...`) y otro server-side (con claves de servicio). Asegúrate de usar la variable de entorno correcta según el contexto.
- Variables de entorno recomendadas:
	- `NEXT_PUBLIC_SUPABASE_URL` — URL pública de Supabase.
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — clave anónima para cliente.
	- `SUPABASE_SERVICE_ROLE_KEY` — (opcional, solo server) clave con permisos elevados.

Parámetros y configuración importantes
- **[next.config.ts](next.config.ts)**: Configuración de Next.js (optimización, imágenes, rewrites).
- **[tsconfig.json](tsconfig.json)**: Configuración TypeScript y paths.
- **[postcss.config.mjs](postcss.config.mjs)** y **[src/app/globals.css](src/app/globals.css)**: Configuración y estilos globales.
- **[eslint.config.mjs](eslint.config.mjs)**: Reglas de linting.

Scripts útiles
- `npm run dev`: arranca el servidor en modo desarrollo.
- `npm run build`: construye para producción.
- `npm start` o `npm run start`: ejecuta la versión built.

Ejecución local (detallada)
1. Copiar variables de entorno en un `.env.local` basado en `.env.example` (crear si no existe):
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Opcional: claves para servicios externos de procesamiento de imagen o LLM
IMAGE_PROCESSING_API_KEY=...
LLM_API_KEY=...
```
2. Instalar dependencias y lanzar la app:
```bash
npm install
npm run dev
```

Despliegue
- Recomendado: Vercel (integración nativa con Next.js). Configura las mismas variables de entorno en el panel de Vercel.
- Asegúrate de no exponer `SUPABASE_SERVICE_ROLE_KEY` en variables públicas; solo usarla en funciones server-side.

Diagrama simplificado del flujo
```mermaid
flowchart LR
	U[Usuario] -->|Sube imagen| UploadMenu
	UploadMenu -->|POST| remove-bg[/api/remove-background]
	remove-bg -->|almacena| SupabaseStorage
	remove-bg -->|call| analyze[/api/analyze-clothing]
	analyze --> DB[Supabase DB]
	stylist[/api/stylist] -->|consulta| DB
	stylist -->|respuesta| StylistChat
```

Buenas prácticas y notas de diseño
- Mantener la lógica de permisos y claves solo en el servidor.
- Separar el cliente y el servidor: usar `src/app/lib/supabase.ts` para código cliente y `lib/supabase.ts` para utilidades server-side.
- Caching: cachear respuestas de análisis para evitar costos de llamadas a IA repetidas.

Plan de trabajo y próximas tareas (visión)
- Mejora de la experiencia de subida (progreso, cancelación, previews).
- Persistencia avanzada: categorías, etiquetas manuales, búsqueda y filtros.
- Integracion de visores 2D y 3D con ia de diseño 3D

Cómo contribuir
- Abre un issue describiendo la propuesta o bug.
- Crea una rama con prefijo `feature/` o `fix/` y envía un PR.

Contacto y mantenimiento
- Autor: Joan sebastian arango arango.
- contacto:arangorangojoansebastian0@gmail.com
- Para preguntas técnicas, abrir un issue o contactar al mantenedor del repo.

---
Archivo principal de referencia: [src/app](src/app)

**Documentación de las APIs (endpoints server-side)**

1) `/api/remove-background` — Eliminar fondo
- Método: `POST`.
- Autenticación: ninguna en la petición, pero el servidor requiere la variable de entorno `REMOVE_BG_API_KEY` para llamar al servicio externo remove.bg.
- Entradas (form-data):
	- `image`: archivo (`File`) opcional.
	- `imageUrl`: URL pública a imagen opcional (string).
	- `imageBase64`: base64 raw opcional (string).
	- `imageDataUrl`: data URL (`data:image/..;base64,...`) opcional.
- Comportamiento:
	- Valida la input; si recibe `imageUrl` intentará descargar la imagen. Si la URL devuelve HTML intentará extraer `og:image` o un `<img>` y volver a intentar.
	- Envía la imagen al API de remove.bg (`REMOVE_BG_API_KEY`) y devuelve la imagen procesada en `image/png` (blob).
	- Si falla, devuelve JSON con `{ error: string }` y código HTTP apropiado.
- Respuestas de éxito:
	- `200` con cuerpo `image/png` (imagen sin fondo).
- Errores comunes:
	- `400` si no se recibe imagen válida.
	- `500` si falta `REMOVE_BG_API_KEY` o hay error en el servidor.
- Ejemplo (cURL con archivo):
```bash
curl -X POST "http://localhost:3000/api/remove-background" \
	-F "image=@/ruta/a/mi-foto.jpg"
```

Ejemplo (fetch desde cliente):
```js
const fd = new FormData();
fd.append('image', file);
const res = await fetch('/api/remove-background', { method: 'POST', body: fd });
if (!res.ok) throw new Error('Error removing background');
const blob = await res.blob();
// subir blob a Supabase Storage o crear URL con URL.createObjectURL(blob)
```

2) `/api/analyze-clothing` — Analizar prenda
- Método: `POST`.
- Autenticación: requiere `GEMINI_API_KEY` en servidor (Google Gemini). No se necesita auth en la petición desde cliente.
- Entradas (form-data):
	- `image`: archivo (`File`) opcional.
	- `imageUrl`: URL de imagen (string) opcional.
- Comportamiento:
	- Convierte la imagen a inline data (base64) si es necesario, valida tamaño (máx ~5MB) y llama a la API de Gemini para generar un JSON estructurado con metadatos de la prenda.
	- Intenta usar varios modelos indicados en código; normaliza y valida el JSON devuelto.
- Respuestas de éxito:
	- `200` JSON: `{ analysis: { title, category, type, color, style, season, tags: [], description, details, fabric, fit, occasion, formality }, model: string }`
- Errores comunes:
	- `400` para inputs inválidos.
	- `500` si falta `GEMINI_API_KEY` o error servidor.
- Ejemplo (fetch con URL):
```js
const fd = new FormData();
fd.append('imageUrl', 'https://ejemplo.com/mi-foto.jpg');
const res = await fetch('/api/analyze-clothing', { method: 'POST', body: fd });
const json = await res.json();
// json.analysis -> objeto con metadatos
```

3) `/api/stylist` — Asistente de estilo (chat)
- Método: `POST`.
- Autenticación: requiere `GEMINI_API_KEY` en servidor.
- Entradas (JSON):
	- `messages`: array de mensajes [{ role: 'user'|'assistant', content: string }]
	- `clothes`: array de prendas (cada prenda puede incluir `id`, `title`, `category`, `image`, `type`, `color`, `style`, etc.)
	- `context` (opcional): `{ mood?, city?, temperature?, disliked_colors? }`
- Comportamiento:
	- Normaliza mensajes y prendas, opcionalmente adjunta hasta 3 imágenes inline para que Gemini genere propuestas visuales.
	- Construye un prompt del sistema que incluye inventario del usuario y reglas de formato estrictas.
	- Llama a la API de Gemini y devuelve el texto generado.
- Respuestas de éxito:
	- `200` JSON: `{ message: string, model: string }`
- Ejemplo (fetch):
```js
const body = {
	messages: [{ role: 'user', content: 'Recomiendame un outfit para lluvia' }],
	clothes: [{ id: 'c1', title: 'Gabardina', category: 'Chaquetas', image: 'https://...' }],
	context: { city: 'Bogotá', temperature: '12°C' }
};
const res = await fetch('/api/stylist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const json = await res.json();
// json.message -> texto de recomendación
```

Formato de errores general
- Todas las rutas devuelven JSON `{ error: string }` en errores salvo `/remove-background` que puede devolver blob en éxito.

Flujo de archivos: paso a paso (cliente → procesamiento → almacenamiento → visualización)
1. Cliente (UI) selecciona archivo con `UploadMenu` y obtiene un `File`.
2. Opciones de flujo comunes:
	 a) Procesar en servidor primero (sin subir directamente a storage):
			- Enviar `File` al endpoint `/api/remove-background` (FormData).
			- Recibir `image/png` como blob.
			- Subir el blob final a Supabase Storage: `supabase.storage.from('clothes').upload(path, file)` y guardar la URL en la tabla `clothes`.
	 b) Subir directamente a Supabase Storage y luego procesar por URL:
			- `supabase.storage.from('clothes').upload(path, file)` → obtener `publicUrl` o `signedUrl`.
			- Enviar `imageUrl` al endpoint `/api/remove-background` o `/api/analyze-clothing` para procesamiento o análisis.

Ejemplo de subida + análisis (cliente, usando `src/app/lib/supabase.ts`):
```js
import { supabase } from 'src/app/lib/supabase';

// 1) Subir archivo al bucket 'clothes'
const { data, error } = await supabase.storage.from('clothes').upload('uploads/mi-foto.png', file);
if (error) throw error;

// 2) Obtener URL pública (o signed)
const { publicURL } = supabase.storage.from('clothes').getPublicUrl(data.path);

// 3) Llamar al analizador
const fd = new FormData();
fd.append('imageUrl', publicURL);
const res = await fetch('/api/analyze-clothing', { method: 'POST', body: fd });
const analysis = await res.json();

// 4) Guardar metadata en tu tabla 'clothes' en Supabase (ejemplo simplificado)
await supabase.from('clothes').insert([{ title: analysis.analysis.title, image: publicURL, metadata: analysis.analysis }]);
```

Esquema recomendado de la tabla `clothes` (ejemplo)
- `id` (uuid, pk)
- `user_id` (uuid)
- `title` (text)
- `image_url` (text)
- `category` (text)
- `type` (text)
- `color` (text)
- `style` (text)
- `tags` (text[])
- `metadata` (jsonb) — guardamos el objeto completo devuelto por `analyze-clothing`
- `created_at`, `updated_at`

Logs y manejo de errores
- Registra errores de servicios externos (remove.bg, Gemini) en servidor. Las rutas ya generan console.error para ayudar en debugging.



