(function () {
  "use strict";

  var ACCOUNT_KEY = "rumboDemoAccounts";
  var HASH_ITERATIONS = 120000;

  // Selección de ofertas verificadas manualmente; actualizar esta lista con regularidad.
  var jobOffers = [
    {
      company: "Racemark International GmbH",
      title: "Operario/a de producción",
      country: "Alemania",
      location: "Empfingen",
      sector: "industria",
      sectorLabel: "Industria y fabricación",
      durations: ["corta"],
      durationLabel: "Contrato temporal de 6 meses",
      salary: "30.344,64 € brutos/año (según el anuncio)",
      housing: "El anuncio no indica alojamiento",
      deadline: "Publicado hace poco y actualizado por la Agencia Federal de Empleo; confirma que sigue abierto.",
      details: "Apoyo en fabricación, lectura de órdenes de trabajo, manejo de máquina y control de calidad. Se pide experiencia inicial en producción, conocimientos básicos de ordenador y alemán. Jornada completa; posibilidad de prórroga.",
      url: "https://www.arbeitsagentur.de/jobsuche/jobdetail/10001-1003559188-S",
      source: "Agencia Federal de Empleo de Alemania"
    },
    {
      company: "Mechatronics in motion GmbH",
      title: "Operario/a de producción y montaje",
      country: "Alemania",
      location: "Burgstetten",
      sector: "industria",
      sectorLabel: "Industria y fabricación",
      durations: ["corta"],
      durationLabel: "Contrato inicial de 6 meses",
      salary: "16,00–16,50 € brutos/hora",
      housing: "El anuncio no indica alojamiento",
      deadline: "El anuncio indica incorporación inmediata; confirma que sigue abierto.",
      details: "Fabricación en serie y montaje de cables y componentes, controles de calidad y embalaje. Se valora experiencia inicial; la experiencia con cables es una ventaja, pero no un requisito.",
      url: "https://www.arbeitsagentur.de/jobsuche/jobdetail/10001-1003784448-S",
      source: "Agencia Federal de Empleo de Alemania"
    },
    {
      company: "Hoteles y restaurantes colaboradores de EURES",
      title: "Personal de hostelería · temporada de invierno",
      country: "Austria",
      location: "Vorarlberg",
      sector: "hosteleria",
      sectorLabel: "Hostelería, turismo y ocio",
      durations: ["corta"],
      durationLabel: "Temporada de invierno · noviembre/diciembre 2026 a abril 2027",
      salary: "2.096,50–2.659,60 € brutos/mes, según perfil y experiencia",
      housing: "Alojamiento y comidas proporcionados por el empleador",
      deadline: "Solicitudes hasta el 30/11/2026, según el anuncio consultado.",
      details: "Perfiles de camarero/a, barman/ba, chef de rang y commis de rang. Se pide alemán e inglés B1 y el anuncio indica que solo pueden solicitarlo ciudadanos de la Unión Europea.",
      url: "https://eures.hzz.hr/oglasi/zimska-sezona-u-austriji-pokrajina-vorarlberg-konobar-konobarica-2/",
      source: "EURES Croacia (HZZ)"
    },
    {
      company: "AquaBioTech Group",
      title: "Técnico/a de acuicultura",
      country: "Malta",
      location: "Il-Mosta",
      sector: "agro",
      sectorLabel: "Agricultura, medioambiente y acuicultura",
      durations: ["larga"],
      durationLabel: "Contrato de larga duración",
      salary: "16.000–18.000 € brutos/año",
      housing: "Alojamiento disponible a precio inferior al alquiler privado",
      deadline: "Solicitudes hasta el 01/11/2026, según el anuncio consultado.",
      details: "Trabajo con sistemas acuícolas, control de agua y proyectos de investigación. Se valora formación o experiencia en acuicultura y se pide inglés; hay dos puestos.",
      url: "https://eures.hzz.hr/oglasi/tehnicar-tehnicarka-akvakulture-2/",
      source: "EURES Croacia (HZZ)"
    },
    {
      company: "Robust Bemanning AS",
      title: "Personal de construcción",
      country: "Noruega",
      location: "Stavanger",
      sector: "construccion",
      sectorLabel: "Construcción y oficios",
      durations: ["corta", "larga"],
      durationLabel: "El empleador ofrece contratos temporales o indefinidos",
      salary: "275–295 NOK brutos/hora",
      housing: "Ayuda para encontrar alojamiento o alojamiento con coste",
      deadline: "Solicitudes hasta el 31/12/2026, según el anuncio consultado.",
      details: "Vacante para trabajos en distintos proyectos de construcción. Se pide experiencia similar, inglés y capacidad para leer planos. El anuncio indica 30 puestos.",
      url: "https://eures.hzz.hr/oglasi/gradevinski-radnik-gradevinska-radnica-3/",
      source: "EURES Croacia (HZZ)"
    }
  ];

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character];
    });
  }

  function offerCardHtml(offer, badge) {
    return '<article class="surface offer-card">' +
      '<div class="offer-head"><div><h3>' + escapeHtml(offer.title) + '</h3>' +
      '<div class="offer-company">' + escapeHtml(offer.company) + ' · ' + escapeHtml(offer.location) + '</div></div>' +
      '<span class="pill">' + escapeHtml(offer.country) + '</span></div>' +
      '<div class="offer-meta"><span>' + escapeHtml(offer.sectorLabel) + '</span><span>' + escapeHtml(offer.durationLabel) + '</span></div>' +
      '<p class="offer-details">' + escapeHtml(offer.details) + '</p>' +
      '<p class="offer-details"><strong>Alojamiento indicado por la empresa:</strong> ' + escapeHtml(offer.housing) +
      '<br><strong>Condición/plazo:</strong> ' + escapeHtml(offer.deadline) + '</p>' +
      (badge ? '<span class="pill gold" style="align-self:flex-start;margin-bottom:12px">' + escapeHtml(badge) + '</span>' : '') +
      '<div class="offer-bottom"><strong>' + escapeHtml(offer.salary) + '</strong>' +
      '<a href="' + escapeHtml(offer.url) + '" target="_blank" rel="noopener noreferrer">Ver oferta en ' + escapeHtml(offer.source) + ' ↗</a></div>' +
      '</article>';
  }

  var menuButtons = document.querySelectorAll(".menu-toggle");
  menuButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var nav = document.getElementById(button.getAttribute("aria-controls"));
      if (!nav) return;
      var isOpen = nav.classList.toggle("open");
      button.setAttribute("aria-expanded", String(isOpen));
      button.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    });
  });

  var allOffers = document.getElementById("all-offers");
  if (allOffers) {
    allOffers.innerHTML = jobOffers.map(function (offer) {
      return offerCardHtml(offer, "");
    }).join("");
  }

  function getAccounts() {
    try {
      return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "[]");
    } catch (error) {
      return [];
    }
  }

  function bytesToHex(bytes) {
    return Array.from(bytes).map(function (byte) {
      return byte.toString(16).padStart(2, "0");
    }).join("");
  }

  function hexToBytes(hex) {
    var bytes = new Uint8Array(hex.length / 2);
    for (var index = 0; index < bytes.length; index += 1) {
      bytes[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16);
    }
    return bytes;
  }

  function createSalt() {
    var bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return bytesToHex(bytes);
  }

  async function passwordHash(password, salt) {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error("Para crear una cuenta de prueba, abre la web publicada con https.");
    }
    var key = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    var bits = await window.crypto.subtle.deriveBits({
      name: "PBKDF2",
      salt: hexToBytes(salt),
      iterations: HASH_ITERATIONS,
      hash: "SHA-256"
    }, key, 256);
    return bytesToHex(new Uint8Array(bits));
  }

  function goToPortal(account) {
    try {
      sessionStorage.setItem("rumboDemoProfile", JSON.stringify({ name: account.name, email: account.email, role: account.role }));
    } catch (error) {
      // La navegación de demostración sigue funcionando si el navegador bloquea la sesión.
    }
    window.location.href = account.role === "empresa" ? "empresas.html" : "candidatos.html";
  }

  document.querySelectorAll("[data-auth-mode]").forEach(function (button) {
    button.addEventListener("click", function () {
      var mode = button.dataset.authMode;
      var signup = mode === "signup";
      var form = document.getElementById("auth-form");
      var nameField = document.getElementById("name-field");
      var nameInput = document.getElementById("name");
      var confirmField = document.getElementById("confirm-field");
      var confirmInput = document.getElementById("confirm-password");
      var submit = document.getElementById("auth-submit");
      if (!form || !nameField || !nameInput || !confirmField || !confirmInput || !submit) return;
      form.dataset.mode = mode;
      nameField.hidden = !signup;
      nameInput.required = signup;
      confirmField.hidden = !signup;
      confirmInput.required = signup;
      document.getElementById("auth-heading").textContent = signup ? "Crea tu cuenta" : "Inicia sesión";
      document.getElementById("auth-subtitle").textContent = signup
        ? "Elige tu perfil y completa tus datos para entrar."
        : "Escribe el correo y la contraseña que registraste en este navegador.";
      document.getElementById("auth-switch-text").textContent = signup ? "¿Ya tienes cuenta?" : "¿Todavía no tienes cuenta?";
      submit.innerHTML = signup ? "Crear cuenta y continuar <span aria-hidden=\"true\">→</span>" : "Iniciar sesión <span aria-hidden=\"true\">→</span>";
      document.getElementById("password").autocomplete = signup ? "new-password" : "current-password";
      document.getElementById("auth-status").textContent = "";
      document.querySelectorAll("[data-auth-mode]").forEach(function (item) {
        item.hidden = item.dataset.authMode === mode;
      });
    });
  });

  var authForm = document.getElementById("auth-form");
  if (authForm) {
    authForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      var status = document.getElementById("auth-status");
      var submit = document.getElementById("auth-submit");
      var email = document.getElementById("email").value.trim().toLowerCase();
      var password = document.getElementById("password").value;
      var role = authForm.querySelector('input[name="role"]:checked').value;
      var signup = authForm.dataset.mode === "signup";
      submit.disabled = true;
      status.textContent = signup ? "Creando tu cuenta de demostración…" : "Comprobando tus datos…";
      try {
        var accounts = getAccounts();
        var account;
        if (signup) {
          var name = document.getElementById("name").value.trim();
          var confirmation = document.getElementById("confirm-password").value;
          if (password !== confirmation) throw new Error("Las contraseñas no coinciden. Comprueba las dos casillas.");
          if (accounts.some(function (item) { return item.email === email; })) {
            throw new Error("Ya existe una cuenta de prueba con ese correo en este navegador. Inicia sesión.");
          }
          var salt = createSalt();
          account = { name: name, email: email, role: role, salt: salt, passwordHash: await passwordHash(password, salt) };
          accounts.push(account);
          localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));
          status.textContent = "Cuenta creada. Entrando en Rumbo…";
        } else {
          account = accounts.find(function (item) { return item.email === email; });
          if (!account) throw new Error("No encuentro esa cuenta en este navegador. Pulsa «Crear cuenta» primero.");
          var enteredHash = await passwordHash(password, account.salt);
          if (enteredHash !== account.passwordHash) throw new Error("La contraseña no coincide. Vuelve a intentarlo.");
          status.textContent = "Sesión iniciada. Entrando en Rumbo…";
        }
        document.getElementById("password").value = "";
        var confirmPassword = document.getElementById("confirm-password");
        if (confirmPassword) confirmPassword.value = "";
        window.setTimeout(function () { goToPortal(account); }, 650);
      } catch (error) {
        status.textContent = error.message || "No se pudo crear la cuenta en este navegador.";
        submit.disabled = false;
      }
    });

    document.querySelectorAll("[data-social-demo]").forEach(function (button) {
      button.addEventListener("click", function () {
        document.getElementById("auth-status").textContent =
          "El acceso con " + button.dataset.socialDemo + " todavía no está conectado. Usa el registro con correo para probar la web.";
      });
    });
  }

  var survey = document.getElementById("survey-form");
  if (survey) {
    survey.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(survey);
      var country = data.get("country");
      var sector = data.get("sector");
      var duration = data.get("duration");
      var activeFilters = [];
      if (country !== "cualquiera") activeFilters.push("país");
      if (sector !== "cualquiera") activeFilters.push("sector");
      if (duration !== "cualquiera") activeFilters.push("duración");

      function matches(offer) {
        return (country === "cualquiera" || offer.country === country) &&
          (sector === "cualquiera" || offer.sector === sector) &&
          (duration === "cualquiera" || offer.durations.indexOf(duration) !== -1);
      }

      var exactOffers = jobOffers.filter(matches);
      var selectedOffers = exactOffers;
      var exactMatch = exactOffers.length > 0;
      var scores = [];
      if (!exactMatch) {
        scores = jobOffers.map(function (offer) {
          var score = 0;
          if (country !== "cualquiera" && offer.country === country) score += 1;
          if (sector !== "cualquiera" && offer.sector === sector) score += 1;
          if (duration !== "cualquiera" && offer.durations.indexOf(duration) !== -1) score += 1;
          return { offer: offer, score: score };
        }).filter(function (item) { return item.score > 0; })
          .sort(function (a, b) { return b.score - a.score; })
          .slice(0, 3);
        selectedOffers = scores.map(function (item) { return item.offer; });
      }

      var age = data.get("age");
      var countryLabel = country === "cualquiera" ? "cualquier país europeo" : country;
      var sectorLabel = sector === "cualquiera" ? "cualquier sector" : document.getElementById("sector").selectedOptions[0].textContent;
      var durationLabel = duration === "corta" ? "3–6 meses" : (duration === "larga" ? "más de 6 meses" : "sin preferencia");
      var motivations = data.getAll("motivation");
      var motivationText = motivations.length ? motivations.join(", ") : "sin motivación indicada";
      document.getElementById("matching-title").textContent = exactMatch
        ? "Empresas que encajan con tus preferencias"
        : (selectedOffers.length ? "Las ofertas más cercanas a tus preferencias" : "Aún no hay una oferta que encaje en esta selección");
      document.getElementById("survey-summary").textContent =
        "Buscas " + sectorLabel + " en " + countryLabel + " durante " + durationLabel +
        ". Perfil de edad: " + age + ". Te motiva: " + motivationText + "." +
        (exactMatch ? " Estas vacantes coinciden en país, sector y duración." :
          (selectedOffers.length ? " No hay coincidencia exacta en la selección actual; estas ofertas comparten parte de tus criterios." :
            " Prueba a cambiar el país, el sector o la duración, o consulta todas las ofertas de EURES."));

      var list = document.getElementById("recommendation-list");
      if (selectedOffers.length) {
        list.innerHTML = selectedOffers.map(function (offer) {
          var badge = "Coincidencia exacta";
          if (!exactMatch) {
            var item = scores.find(function (scoreItem) { return scoreItem.offer === offer; });
            badge = "Coincide en " + item.score + " de " + activeFilters.length + " preferencias";
          }
          return offerCardHtml(offer, badge);
        }).join("");
      } else {
        list.innerHTML = '<div class="notice">No tenemos una vacante de muestra con esos filtros. Puedes consultar más anuncios en <a class="text-link" href="https://eures.europa.eu/index_es" target="_blank" rel="noopener noreferrer">EURES ↗</a>.</div>';
      }

      var needsHousing = data.get("accommodation") === "si";
      var needsTransport = data.get("transport") === "si";
      var total = 89 + (needsHousing ? 60 : 0) + (needsTransport ? 30 : 0);
      var base = needsHousing ? 149 : 89;
      var priceText = "Tu paquete de búsqueda de empleo: 89 €";
      if (needsHousing) priceText += " + búsqueda y gestión inicial de vivienda: 60 € = 149 €";
      if (needsTransport) priceText += " + gestión del transporte: 30 €";
      priceText += ". Total orientativo de Rumbo: " + total + " €.";
      priceText += " " + (needsHousing
        ? "Rumbo buscaría y te facilitaría opciones de piso; el alquiler, la fianza y los suministros se pagan aparte."
        : "No se añade la búsqueda de vivienda.");
      if (needsTransport) priceText += " Los billetes y gastos del viaje no están incluidos.";
      else priceText += " No se ha añadido la gestión del transporte.";
      document.getElementById("recommended-price").textContent = priceText;
      document.getElementById("survey-result").classList.add("visible");
      document.getElementById("survey-result").scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  var offerForm = document.getElementById("offer-form");
  if (offerForm) {
    offerForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(offerForm);
      var description = data.get("description").trim();
      var preview = "Puesto: " + data.get("title") + "\nEmpresa: " + data.get("company") +
        "\nPaís: " + data.get("country") + "\nSector: " + data.get("sector") +
        "\nDuración: " + data.get("duration") + "\nAlojamiento: " + data.get("housing") +
        "\nIdiomas: " + (data.get("language") || "No indicado") +
        "\nSalario indicado: " + (data.get("salary") || "No indicado") +
        "\nPromoción: " + data.get("sponsor") +
        "\n\nDescripción:\n" + description;
      document.getElementById("offer-preview-text").textContent = preview;
      document.getElementById("offer-preview").classList.add("visible");
      document.getElementById("offer-preview").scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }
}());

