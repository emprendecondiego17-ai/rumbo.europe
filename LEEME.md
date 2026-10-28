# Rumbo — prototipo académico

## Páginas del sitio
- `index.html`: acceso de demostración y selección de perfil.
- `candidatos.html`: portada para personas que buscan empleo.
- `encuesta.html`: compara las preferencias con las ofertas incluidas y muestra empresas coincidentes o cercanas.
- `paquetes.html`: servicios y precios provisionales para personas candidatas.
- `recomendadas.html`: mapa con formas reales de los países, espacio patrocinado y ofertas enlazadas a sus fuentes.
- `empresas.html`: portada del portal de empresas.
- `paquetes-empresas.html`: propuesta provisional de precios para empresas.
- `publicar-oferta.html`: formulario para preparar y guardar una oferta de demostración.
- `styles.css`, `script.js` y `europe-map-data.js`: diseño, funciones compartidas y fronteras del mapa.

## Cómo probar el recorrido
1. Abre `index.html` desde el sitio publicado con HTTPS y crea una cuenta de demostración como empresa.
2. Entra en **Publicar una oferta**, completa los datos y guarda el anuncio.
3. Abre `recomendadas.html`: la oferta se verá en la lista y en el país correspondiente del mapa. Si marcaste promoción, también aparecerá en el espacio patrocinado.
4. Crea o utiliza una cuenta de demostración de candidato en el mismo navegador, completa la encuesta y comprueba las recomendaciones.

## Subida a GitHub Pages
Sube todos los archivos de la web al nivel principal del repositorio, conservando los nombres. `index.html` debe quedar en la raíz para que GitHub Pages lo abra al visitar el sitio. Tras cada cambio, vuelve a subir los archivos modificados y espera a que Pages termine de publicarlos.

## Límites de la maqueta
El registro, la sesión, los anuncios y las respuestas funcionan como demostración en el almacenamiento local de un solo navegador. Los anuncios de empresa no se comparten con otros visitantes y no hay pagos reales. Google y Apple todavía requieren configuración. Para un servicio público hace falta un servidor con cuentas, moderación de anuncios y una base de datos. El recomendador compara una selección de ofertas; no consulta EURES en directo. Confirma la vigencia y condiciones de cada oferta en su fuente original. Las tarifas empresariales son propuestas académicas pendientes de validación.

## Mapa
Las formas de los países proceden del conjunto Admin 0 de Natural Earth a escala 1:50m, recortado al área europea. Natural Earth permite el uso libre de sus datos; consulta su [página de descarga y condiciones](https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-countries/). Algunos microestados se señalan con un punto auxiliar para facilitar su selección.
