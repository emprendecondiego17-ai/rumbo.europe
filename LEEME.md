# Rumbo — prototipo académico

## Páginas del sitio
- `index.html`: portada pública de Rumbo.
- `acceso.html`: registro e inicio de sesión de demostración, con selección de perfil.
- `candidatos.html`: espacio de inicio para personas candidatas una vez dentro.
- `perfil.html`: edición del perfil personal y acceso a las otras secciones de la cuenta.
- `curriculum.html`: subida local de un CV o creación de uno imprimible/guardable como PDF.
- `guardadas.html`: lista personal de ofertas que se hayan marcado como guardadas.
- `encuesta.html`: compara las preferencias con las ofertas incluidas y muestra empresas coincidentes o cercanas.
- `paquetes.html`: servicios y precios provisionales para personas candidatas.
- `recomendadas.html`: mapa con formas reales de los países, espacio patrocinado y ofertas enlazadas a sus fuentes.
- `empresas.html`: portada del portal de empresas.
- `paquetes-empresas.html`: propuesta provisional de precios para empresas.
- `publicar-oferta.html`: formulario para preparar y guardar una oferta de demostración.
- `styles.css`, `script.js`, `perfil.js` y `europe-map-data.js`: diseño, funciones compartidas, cuenta personal y fronteras del mapa.

## Cómo probar el recorrido
1. Abre `index.html`: es la portada pública.
2. Pulsa **Encuesta**, **Paquetes** o **Empresas recomendadas**. Rumbo te llevará a `acceso.html` para registrarte o iniciar sesión.
3. Al crear una cuenta de persona candidata, volverás a la sección que habías elegido. Las rutas también comprueban la sesión si se abren directamente.
4. Tras entrar con una cuenta de persona candidata, el botón de acceso se convierte en un icono de perfil. Desde ahí puedes editar los datos, preparar el CV y consultar las ofertas guardadas.
5. Para probar el portal de empresas, entra en **Acceder / crear cuenta**, selecciona **Soy empresa** y completa nombre de contacto, nombre legal, CIF/NIF o NIF-IVA, país, domicilio y teléfono. Después guarda una oferta desde **Publicar una oferta**. Si ya tienes una cuenta de persona candidata con ese correo, puedes crear además un perfil de empresa con el mismo correo, seleccionando **Soy empresa**.

## Subida a GitHub Pages
Sube todos los archivos de la web al nivel principal del repositorio, conservando los nombres. `index.html` debe quedar en la raíz para que GitHub Pages lo abra al visitar el sitio. Tras cada cambio, vuelve a subir los archivos modificados y espera a que Pages termine de publicarlos.

## Límites de la maqueta
La portada es pública; las secciones de candidato y empresa requieren una sesión. El registro, la sesión, el perfil, el CV y las ofertas guardadas funcionan como demostración en el almacenamiento local de un solo navegador. Los archivos del CV no se envían ni comparten; el CV subido está limitado a 1,5 MB. Los anuncios de empresa no se comparten con otros visitantes y no hay pagos reales. Google y Apple todavía requieren configuración. Para un servicio público hace falta un servidor con cuentas, almacenamiento protegido de CV, moderación de anuncios y una base de datos. El recomendador compara una selección de ofertas; no consulta EURES en directo. Confirma la vigencia y condiciones de cada oferta en su fuente original. Las tarifas empresariales son propuestas académicas pendientes de validación.

## Mapa
Las formas de los países proceden del conjunto Admin 0 de Natural Earth a escala 1:50m, recortado al área europea. Natural Earth permite el uso libre de sus datos; consulta su [página de descarga y condiciones](https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-countries/). Algunos microestados se señalan con un punto auxiliar para facilitar su selección.
