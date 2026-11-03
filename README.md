# Mapa de Oportunidades con IA 🚀🌍

Una aplicación web pública y colaborativa donde cualquier persona puede descubrir, publicar y votar oportunidades de negocio basadas en Inteligencia Artificial detectadas en diversas ciudades del mundo.

---

## ⚡ Conexión con Supabase

Esta aplicación no depende de almacenamiento local para los datos compartidos: todas las oportunidades y los votos se leen y escriben directamente en **Supabase** de manera pública y en tiempo real.

- **Proyecto Supabase:** `mapa-oportunidades-ia` (`ecwqlqlhutiwlmmdvpoa`)
- **Tabla:** `public.opportunities`
- **Políticas RLS:** Acceso público de lectura (`SELECT`), inserción (`INSERT`) y actualización de likes (`UPDATE`).

### Estructura de la tabla `opportunities`:
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `BIGINT` | Identificador único autoincremental |
| `name` | `TEXT` | Nombre o título de la oportunidad |
| `city` | `TEXT` | Ciudad donde se detectó |
| `country` | `TEXT` | País |
| `problem` | `TEXT` | Descripción del problema o ineficiencia detectada |
| `ai_solution` | `TEXT` | Propuesta de solución utilizando IA |
| `category` | `TEXT` | Categoría (Logística, Salud, Agrotech, Finanzas, etc.) |
| `potential` | `TEXT` | Nivel de potencial de mercado (Alto, Medio, Bajo) |
| `likes` | `INTEGER` | Contador de votos/likes comunitarios |
| `created_at` | `TIMESTAMPTZ` | Fecha y hora de publicación |

---

## 🛠️ Tecnologías Utilizadas
- **HTML5:** Estructura semántica accesible con modales y banners.
- **CSS3:** Diseño responsivo moderno con tema oscuro, microinteracciones y variables CSS.
- **JavaScript (ES6+):** Lógica del cliente, filtrado dinámico y reactivo, cálculo de estadísticas.
- **Supabase JS Client (`@supabase/supabase-js`):** Integración directa con la base de datos Postgres y suscripción en tiempo real.

---

## 🚀 Cómo Ejecutar la Aplicación

Puedes abrir y probar la aplicación de dos formas muy sencillas:

### Opción 1: Con un servidor local ligero (Recomendado)
Abre una terminal en esta carpeta y ejecuta:
```bash
# Con Python (incluido en la mayoría de sistemas)
python -m http.server 3000

# O con Node.js / npx
npx serve .
```
Luego abre tu navegador en: [http://localhost:3000](http://localhost:3000)

### Opción 2: Directamente desde el navegador
Simplemente haz doble clic en el archivo [`index.html`](file:///C:/Users/edu_t/.gemini/antigravity/scratch/mapa-oportunidades-ia/index.html) para abrirlo en Chrome, Edge o tu navegador favorito.

---

## 👥 Cómo probar que una oportunidad publicada por una persona aparece para otra

Para comprobar que la sincronización es **100% pública y global**:

1. **Abre dos navegadores distintos o dos ventanas:**
   - Abre la aplicación en una ventana normal de tu navegador (Persona A).
   - Abre la aplicación en una ventana de incógnito o en otro navegador (por ejemplo, Edge y Chrome) (Persona B).

2. **Publicar como Persona A:**
   - Haz clic en **"+ Publicar Oportunidad"**.
   - Ingresa los datos (por ejemplo: Ciudad: *Valencia*, País: *España*, Oportunidad: *Clasificación de Residuos Urbanos con Visión Artificial*).
   - Pulsa **"Publicar en Supabase"**.

3. **Verificar como Persona B:**
   - En la ventana de la Persona B, la nueva oportunidad aparecerá automáticamente (gracias al canal en tiempo real de Supabase) o pulsando el botón **"🔄 Actualizar"**.
   - Haz clic en el botón de **Like (❤️)** en la ventana de la Persona B.
   - Verás cómo el contador sube inmediatamente y queda guardado en la base de datos de Supabase para todos los visitantes del mundo.
