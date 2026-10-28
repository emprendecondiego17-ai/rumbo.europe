const formularioBusqueda = document.querySelector("#form-busqueda");

if (formularioBusqueda) {
  const resultadoBusqueda = document.querySelector("#resultado");
  const textoResultado = document.querySelector("#resultado-text");
  const errorMotivacion = document.querySelector("#motivation-error");

  formularioBusqueda.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const motivaciones = Array.from(
      formularioBusqueda.querySelectorAll('input[name="motivation"]:checked')
    ).map(function (opcion) {
      return opcion.value;
    });

    if (motivaciones.length === 0) {
      errorMotivacion.textContent = "Selecciona al menos una motivación para continuar.";
      errorMotivacion.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    errorMotivacion.textContent = "";

    const edad = formularioBusqueda.querySelector('input[name="age"]:checked').value;
    const paisElegido = document.querySelector("#country").value;
    const otroPais = document.querySelector("#other-country").value.trim();
    const sectorElegido = document.querySelector("#sector").value;
    const otroSector = document.querySelector("#other-sector").value.trim();
    const duracion = formularioBusqueda.querySelector('input[name="duration"]:checked').value;
    const alojamiento = formularioBusqueda.querySelector('input[name="housing"]:checked').value;

    const pais = otroPais ? paisElegido + " (" + otroPais + ")" : paisElegido;
    const sector = otroSector ? sectorElegido + " (" + otroSector + ")" : sectorElegido;

    const resumen = [
      "Rango de edad: " + edad,
      "País preferido: " + pais,
      "Sector: " + sector,
      "Duración del contrato: " + duracion,
      "Alojamiento: " + alojamiento,
      "Motivaciones: " + motivaciones.join(", ")
    ];

    textoResultado.textContent = resumen.join("\n");
    resultadoBusqueda.hidden = false;
    resultadoBusqueda.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

document.querySelectorAll(".transport-checkbox").forEach(function (casilla) {
  casilla.addEventListener("change", function () {
    const precioBase = Number(casilla.dataset.basePrice);
    const total = document.querySelector("#" + casilla.dataset.totalId);
    const extraTransporte = casilla.checked ? 30 : 0;
    total.textContent = (precioBase + extraTransporte) + " €";
  });
});

const formularioOferta = document.querySelector("#offer-form");

if (formularioOferta) {
  const vistaPrevia = document.querySelector("#offer-preview");

  formularioOferta.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const empresa = document.querySelector("#company-name").value.trim();
    const puesto = document.querySelector("#job-title").value.trim();
    const pais = document.querySelector("#job-country").value.trim();
    const sector = document.querySelector("#job-sector").value.trim();
    const duracion = document.querySelector("#job-duration").value;
    const alojamiento = document.querySelector("#job-housing").value;
    const salario = document.querySelector("#job-salary").value.trim();
    const descripcion = document.querySelector("#job-description").value.trim();

    document.querySelector("#preview-title").textContent = puesto;
    document.querySelector("#preview-meta").textContent = empresa + " · " + pais + " · " + sector + " · " + duracion;
    document.querySelector("#preview-housing").textContent = "Alojamiento: " + alojamiento;
    document.querySelector("#preview-salary").textContent = salario ? "Salario indicado: " + salario : "Salario: pendiente de indicar";
    document.querySelector("#preview-description").textContent = descripcion;

    vistaPrevia.hidden = false;
    vistaPrevia.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}
