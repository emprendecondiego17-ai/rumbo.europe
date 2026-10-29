# Rumbo

Rumbo conecta a personas que buscan empleo en Europa con ofertas de empresas. La portada es pública; cada cuenta tiene un perfil persistente de persona candidata o empresa. El icono del perfil abre el área de esa cuenta y no permite cambiar el tipo de perfil.

## Activar cuentas, ofertas y actualizaciones en directo

La web necesita un proyecto gratuito de Supabase para guardar cuentas y compartir datos entre usuarios. La integración ya está preparada en estos archivos; mientras la conexión siga vacía, el acceso y la publicación online mostrarán que falta configurarla.

1. Entra en [supabase.com](https://supabase.com), inicia sesión y crea un proyecto. Guarda la contraseña de la base de datos en un lugar privado.
2. En el proyecto, abre **SQL Editor → New query**. Copia todo el contenido de `supabase-schema.sql`, pégalo y pulsa **Run**. Esto crea las tablas, los permisos de privacidad, el espacio privado para CV y las suscripciones de actualizaciones.
3. En **Project Settings → API Keys**, copia el **Project URL** y la **Publishable key** (en proyectos antiguos puede llamarse `anon` key). En `supabase-config.js`, pega esos dos valores en `url` y `publishableKey`.
4. En Supabase, abre **Authentication → URL Configuration**. Configura `https://emprendecondiego17-ai.github.io/rumbo.europe/` como **Site URL**. En **Redirect URLs**, añade `https://emprendecondiego17-ai.github.io/rumbo.europe/**` y, si pruebas con VS Code Live Server, `http://127.0.0.1:5500/**`. Supabase usa la lista de destinos permitidos para los enlaces de confirmación; consulta su [guía oficial de redirecciones](https://supabase.com/docs/guides/auth/redirect-urls) si tu dominio de GitHub Pages es distinto.
5. Sube todos los archivos de esta carpeta al nivel principal del repositorio, incluido `supabase-config.js`, y espera a que GitHub Pages publique los cambios. Abre la web con `https://...`; las cuentas requieren conexión segura y no funcionan desde `file:///`.
6. Crea una cuenta de prueba de cada tipo con correos distintos. Si Supabase pide confirmar el correo, abre el enlace recibido y después inicia sesión.

**Clave importante:** en la web solo se pega la URL y la Publishable/anon key. Nunca copies una clave `secret` o `service_role` aquí: esa clave daría acceso administrativo a la base de datos.

## Qué hace cada cuenta

### Persona candidata

- La portada se puede visitar sin cuenta. Al abrir Encuesta, Paquetes o Empresas recomendadas se pide iniciar sesión y, tras entrar, se abre la página elegida.
- El formulario de acceso inicia sesión en una cuenta existente. Para crear una, pulsa **Crear cuenta** y selecciona el tipo de perfil; ese tipo no se puede cambiar desde el icono.
- El perfil y el CV se guardan en la cuenta. El archivo del CV queda privado y solo se permite a una empresa verlo después de pasar a selección o de ser marcada como contratada.
- Las ofertas publicadas dentro de Rumbo se pueden guardar y valorar. La empresa recibe en directo favoritos, visitas, valoraciones y cambios en el proceso de selección.

### Empresa

- Al registrarse, completa nombre legal o comercial, CIF/NIF, país, domicilio, teléfono y los demás datos que correspondan. El perfil de empresa se asocia al correo de acceso.
- Publica ofertas desde **Publicar una oferta** e indica el número de vacantes. El nombre de empresa y el correo de contacto se toman del perfil de la cuenta.
- El icono de perfil abre el panel de candidaturas, en una página independiente. Allí hay pestañas para personas que guardaron ofertas, visitas, selección y contrataciones. Se muestra nombre, ciudad, sector, destino y breve descripción; el correo y el teléfono no se muestran.
- Los cambios de favoritos, visitas y candidaturas se actualizan en las otras sesiones conectadas. Una visita se cuenta cuando la tarjeta de una oferta aparece en pantalla o al abrir su enlace, una vez por persona y sesión para evitar inflar el contador.
- Las empresas pueden valorar las ofertas publicadas en Rumbo. La encuesta conserva primero las coincidencias por país, sector y duración y, dentro de ellas, ordena mejor las valoradas y con mayor interés.

## Promoción y precios

Los importes mostrados son orientativos. La web no cobra todavía. Una empresa puede solicitar promoción, pero su oferta no aparecerá como patrocinada hasta que la contratación y el pago se confirmen. La activación de pagos requerirá conectar un proveedor de pagos y definir quién valida las promociones.

## Páginas principales

- `index.html`: portada pública y espacio para empresas patrocinadoras.
- `acceso.html`: iniciar sesión o crear una cuenta.
- `encuesta.html`: buscar ofertas que coincidan con las preferencias.
- `paquetes.html` y `paquetes-empresas.html`: servicios y desglose de precios.
- `recomendadas.html`: mapa interactivo, ofertas externas y ofertas de Rumbo.
- `perfil.html`, `curriculum.html` y `guardadas.html`: perfil personal, CV y ofertas guardadas.
- `empresas.html`: perfil y actividad de la empresa.
- `candidatos-empresa.html`: favoritos, visitas, selección y contrataciones.
- `publicar-oferta.html`: formulario de publicación de vacantes.

## Límites actuales

El inicio de sesión es por correo y contraseña; Google y Apple todavía no están conectados. Los pagos tampoco están habilitados. Las ofertas externas enlazan a sus fuentes originales, así que su disponibilidad puede cambiar; solo las ofertas creadas por empresas en Rumbo generan métricas y valoraciones dentro de Rumbo. Antes de usar la web con público real, añade moderación de anuncios, política de privacidad y condiciones del servicio.

## Mapa

Las formas de los países proceden del conjunto Admin 0 de Natural Earth a escala 1:50m, recortado al área europea. Natural Earth permite el uso libre de sus datos; consulta su [página de descarga y condiciones](https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-countries/). Algunos microestados se señalan con un punto auxiliar para facilitar su selección.
