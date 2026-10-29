(function () {
  "use strict";

  var ACCOUNT_KEY = "rumboDemoAccounts";
  var DEMO_OFFERS_KEY = "rumboDemoOffers";
  var HASH_ITERATIONS = 120000;
  var protectedPageRoles = {
    "candidatos.html": "candidato",
    "encuesta.html": "candidato",
    "paquetes.html": "candidato",
    "recomendadas.html": "candidato",
    "perfil.html": "candidato",
    "curriculum.html": "candidato",
    "guardadas.html": "candidato",
    "empresas.html": "empresa",
    "paquetes-empresas.html": "empresa",
    "publicar-oferta.html": "empresa"
  };

  function currentProfile() {
    try { return JSON.parse(sessionStorage.getItem("rumboDemoProfile") || localStorage.getItem("rumboDemoProfile") || "null"); } catch (error) { return null; }
  }

  function accessUrl(destination, role) {
    var query = new URLSearchParams();
    query.set("next", destination);
    query.set("role", role);
    return "acceso.html?" + query.toString();
  }

  function protectPageAndLinks() {
    var currentPage = window.location.pathname.split("/").pop().toLowerCase();
    var requiredRole = protectedPageRoles[currentPage];
    var profile = currentProfile();
    if (requiredRole && (!profile || profile.role !== requiredRole)) {
      window.location.replace(accessUrl(currentPage, requiredRole));
    }

    document.querySelectorAll("a[href]").forEach(function (link) {
      var rawHref = link.getAttribute("href") || "";
      if (/^(https?:|mailto:|tel:|#|javascript:)/i.test(rawHref)) return;
      var destination = rawHref.split(/[?#]/)[0].split("/").pop().toLowerCase();
      var role = protectedPageRoles[destination];
      if (!role) return;
      link.addEventListener("click", function (event) {
        var activeProfile = currentProfile();
        if (activeProfile && activeProfile.role === role) return;
        event.preventDefault();
        window.location.href = accessUrl(destination, role);
      });
    });
  }

  // Estas vacantes se seleccionaron de fuentes externas. La disponibilidad puede cambiar.
  var curatedOffers = [
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
      deadline: "Publicado y actualizado por la Agencia Federal de Empleo; confirma que sigue abierto.",
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
      durationLabel: "Contratos temporales o indefinidos",
      salary: "275–295 NOK brutos/hora",
      housing: "Ayuda para encontrar alojamiento o alojamiento con coste",
      deadline: "Solicitudes hasta el 31/12/2026, según el anuncio consultado.",
      details: "Vacante para trabajos en distintos proyectos de construcción. Se pide experiencia similar, inglés y capacidad para leer planos. El anuncio indica 30 puestos.",
      url: "https://eures.hzz.hr/oglasi/gradevinski-radnik-gradevinska-radnica-3/",
      source: "EURES Croacia (HZZ)"
    }
  ];

  // Nombres y códigos de países; sus fronteras reales están en europe-map-data.js.
  var europeanCountries = [
    { name: "Albania", code: "AL" }, { name: "Alemania", code: "DE" },
    { name: "Andorra", code: "AD" }, { name: "Armenia", code: "AM" },
    { name: "Austria", code: "AT" }, { name: "Azerbaiyán", code: "AZ" },
    { name: "Bélgica", code: "BE" }, { name: "Bielorrusia", code: "BY" },
    { name: "Bosnia y Herzegovina", code: "BA" }, { name: "Bulgaria", code: "BG" },
    { name: "Chipre", code: "CY" }, { name: "Ciudad del Vaticano", code: "VA" },
    { name: "Croacia", code: "HR" }, { name: "Dinamarca", code: "DK" },
    { name: "Eslovaquia", code: "SK" }, { name: "Eslovenia", code: "SI" },
    { name: "España", code: "ES" }, { name: "Estonia", code: "EE" },
    { name: "Finlandia", code: "FI" }, { name: "Francia", code: "FR" },
    { name: "Georgia", code: "GE" }, { name: "Grecia", code: "GR" },
    { name: "Hungría", code: "HU" }, { name: "Irlanda", code: "IE" },
    { name: "Islandia", code: "IS" }, { name: "Italia", code: "IT" },
    { name: "Kosovo", code: "XK" }, { name: "Letonia", code: "LV" },
    { name: "Liechtenstein", code: "LI" }, { name: "Lituania", code: "LT" },
    { name: "Luxemburgo", code: "LU" }, { name: "Macedonia del Norte", code: "MK" },
    { name: "Malta", code: "MT" }, { name: "Moldavia", code: "MD" },
    { name: "Mónaco", code: "MC" }, { name: "Montenegro", code: "ME" },
    { name: "Noruega", code: "NO" }, { name: "Países Bajos", code: "NL" },
    { name: "Polonia", code: "PL" }, { name: "Portugal", code: "PT" },
    { name: "Reino Unido", code: "GB" }, { name: "República Checa", code: "CZ" },
    { name: "Rumanía", code: "RO" }, { name: "Rusia", code: "RU" },
    { name: "San Marino", code: "SM" }, { name: "Serbia", code: "RS" },
    { name: "Suecia", code: "SE" }, { name: "Suiza", code: "CH" },
    { name: "Turquía", code: "TR" }, { name: "Ucrania", code: "UA" }
  ];

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character];
    });
  }

  function readJson(key, fallback) {
    try {
      var value = JSON.parse(localStorage.getItem(key) || "null");
      return value == null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function getDemoOffers() {
    var offers = readJson(DEMO_OFFERS_KEY, []);
    return Array.isArray(offers) ? offers.filter(function (offer) {
      return offer && typeof offer === "object" && offer.isDemo === true && offer.country && offer.title;
    }).map(function (offer) {
      var email = String(offer.contactEmail || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
      offer.url = "mailto:" + encodeURIComponent(email).replace(/%40/gi, "@");
      offer.source = "Contacto directo";
      return offer;
    }).filter(Boolean) : [];
  }

  function getAllOffers() {
    return curatedOffers.concat(getDemoOffers());
  }

  function offerCardHtml(offer, badge) {
    var contactLabel = offer.isDemo ? "Contactar con la empresa" : "Ver oferta en " + offer.source + " ↗";
    var savedPayload = {
      key: String(offer.id || offer.url || (offer.company + "-" + offer.title)),
      company: offer.company || "",
      title: offer.title || "",
      country: offer.country || "",
      location: offer.location || "",
      sectorLabel: offer.sectorLabel || "",
      durationLabel: offer.durationLabel || "",
      salary: offer.salary || "Salario no indicado",
      housing: offer.housing || "No indicado",
      deadline: offer.deadline || "",
      details: offer.details || "",
      url: offer.url || "",
      source: offer.source || "",
      isDemo: !!offer.isDemo
    };
    var tags = '<div class="offer-meta"><span>' + escapeHtml(offer.sectorLabel) + '</span><span>' + escapeHtml(offer.durationLabel) + '</span></div>';
    return '<article class="surface offer-card">' +
      '<div class="offer-head"><div><h3>' + escapeHtml(offer.title) + '</h3>' +
      '<div class="offer-company">' + escapeHtml(offer.company) + ' · ' + escapeHtml(offer.location || "Ubicación no indicada") + '</div></div>' +
      '<span class="pill">' + escapeHtml(offer.country) + '</span></div>' +
      tags +
      '<p class="offer-details">' + escapeHtml(offer.details) + '</p>' +
      '<p class="offer-details"><strong>Alojamiento indicado:</strong> ' + escapeHtml(offer.housing) +
      '<br><strong>Condición/plazo:</strong> ' + escapeHtml(offer.deadline) + '</p>' +
      (offer.isDemo ? '<p class="offer-details"><strong>Servicio elegido:</strong> ' + escapeHtml(offer.packageLabel || "Publicación estándar") + (offer.sponsored ? ' · extra de promoción indicado' : '') + '</p>' : '') +
      (offer.isDemo ? '<span class="pill demo-badge">Anuncio de demostración · no verificado</span>' : '') +
      (badge ? '<span class="pill gold offer-badge">' + escapeHtml(badge) + '</span>' : '') +
      '<div class="offer-bottom"><strong>' + escapeHtml(offer.salary || "Salario no indicado") + '</strong>' +
      '<div class="offer-actions"><a href="' + escapeHtml(offer.url) + '" ' + (offer.isDemo ? '' : 'target="_blank" rel="noopener noreferrer"') + '>' + escapeHtml(contactLabel) + '</a>' +
      '<button class="save-offer" type="button" data-save-offer="' + escapeHtml(savedPayload.key) + '" data-offer="' + escapeHtml(JSON.stringify(savedPayload)) + '" aria-pressed="false">☆ Guardar oferta</button></div></div>' +
      (offer.isDemo ? '<button class="remove-demo-offer" type="button" data-remove-offer="' + escapeHtml(offer.id) + '">Retirar de esta demostración</button>' : '') +
      '</article>';
  }

  function fillCountrySelect(select, includeAny) {
    if (!select) return;
    var placeholder = select.options[0];
    var placeholderText = placeholder ? placeholder.textContent : "Selecciona un país";
    var placeholderValue = placeholder ? placeholder.value : "";
    select.innerHTML = "";
    select.appendChild(new Option(placeholderText, placeholderValue));
    if (includeAny) select.appendChild(new Option("Cualquier país / abierto a Europa", "cualquiera"));
    europeanCountries.forEach(function (country) {
      select.appendChild(new Option(country.name, country.name));
    });
  }

  function sectorDetails(label) {
    var value = String(label || "").toLowerCase();
    if (value === "agro" || /agric|medioambiente|acuicultura/.test(value)) return { key: "agro", label: "Agricultura y medioambiente" };
    if (/industria|fabricaci|producci|montaje/.test(value)) return { key: "industria", label: "Industria y fabricación" };
    if (/construcci|oficios/.test(value)) return { key: "construccion", label: "Construcción y oficios" };
    if (/tecnolog|inform.tica/.test(value)) return { key: "tecnologia", label: "Tecnología e informática" };
    if (/sanidad|cuidados/.test(value)) return { key: "sanidad", label: "Sanidad y cuidados" };
    if (/educaci/.test(value)) return { key: "educacion", label: "Educación" };
    if (/log.stica|transporte/.test(value)) return { key: "logistica", label: "Logística y transporte" };
    if (/comercio|ventas/.test(value)) return { key: "comercio", label: "Comercio y ventas" };
    if (/hosteler|turismo|ocio/.test(value)) return { key: "hosteleria", label: "Hostelería, turismo y ocio" };
    if (/administraci|atenci.n al cliente/.test(value)) return { key: "administracion", label: "Administración y atención al cliente" };
    if (/energ.a/.test(value)) return { key: "energia", label: "Energía" };
    return { key: "otro", label: "Otro sector" };
  }

  function durationDetails(value, label) {
    var duration = String(value || "");
    var durationLabel = String(label || duration);
    if (duration === "corta" || /temporal|3.?6|estacional|temporada/i.test(durationLabel)) return { values: ["corta"], label: durationLabel };
    return { values: ["larga"], label: durationLabel };
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return "demo-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function renderCollections(selectedCountry) {
    var offers = getAllOffers();
    var allContainer = document.getElementById("all-offers");
    if (allContainer) allContainer.innerHTML = offers.map(function (offer) {
      return offerCardHtml(offer, offer.isDemo ? "Oferta enviada desde este navegador" : "");
    }).join("");

    var sponsored = offers.filter(function (offer) { return offer.isDemo && offer.sponsored; });
    var sponsorList = document.getElementById("paid-sponsored-offers");
    var sponsorEmpty = document.getElementById("no-paid-sponsors");
    if (sponsorList) sponsorList.innerHTML = sponsored.map(function (offer) {
      return offerCardHtml(offer, "Patrocinado · demostración");
    }).join("");
    if (sponsorEmpty) sponsorEmpty.hidden = sponsored.length > 0;

    renderHomeSponsors();
    if (document.getElementById("map-country-select")) updateMapCountry(selectedCountry || "cualquiera");
  }

  function renderHomeSponsors() {
    var container = document.getElementById("home-sponsored-companies");
    var empty = document.getElementById("home-sponsors-empty");
    if (!container) return;

    var seenCompanies = {};
    var sponsored = getDemoOffers().filter(function (offer) {
      var companyKey = String(offer.company || "").trim().toLowerCase();
      if (!offer.sponsored || !companyKey || seenCompanies[companyKey]) return false;
      seenCompanies[companyKey] = true;
      return true;
    });

    container.innerHTML = sponsored.map(function (offer) {
      var initials = String(offer.company || "R").trim().split(/\s+/).slice(0, 2).map(function (word) { return word.charAt(0); }).join("").toUpperCase();
      return '<article class="surface sponsor-card">' +
        '<div class="sponsor-card-top"><span class="sponsor-mark" aria-hidden="true">' + escapeHtml(initials || "R") + '</span><span class="pill gold">Patrocinado · demostración</span></div>' +
        '<h3>' + escapeHtml(offer.company) + '</h3>' +
        '<p class="sponsor-role">' + escapeHtml(offer.title) + '</p>' +
        '<p class="sponsor-location">' + escapeHtml(offer.country) + (offer.location ? ' · ' + escapeHtml(offer.location) : '') + ' · ' + escapeHtml(offer.sectorLabel) + '</p>' +
        '<a class="text-link" href="recomendadas.html#mapa">Ver ofertas de esta empresa <span aria-hidden="true">→</span></a>' +
        '<small>Patrocinio de demostración; no confirma una relación comercial real.</small>' +
        '</article>';
    }).join("");
    if (empty) empty.hidden = sponsored.length > 0;
  }

  function updateMapCountry(countryName) {
    var select = document.getElementById("map-country-select");
    var result = document.getElementById("map-country-result");
    var list = document.getElementById("map-offers");
    var mapCountries = document.querySelectorAll(".map-country, .map-country-marker");
    var offers = getAllOffers();
    var selected = countryName === "cualquiera" ? offers : offers.filter(function (offer) { return offer.country === countryName; });
    if (select && select.value !== countryName) select.value = countryName;

    mapCountries.forEach(function (mapCountry) {
      var mapCountryName = mapCountry.getAttribute("data-country");
      mapCountry.classList.toggle("selected", mapCountryName === countryName);
      mapCountry.classList.toggle("has-offers", offers.some(function (offer) { return offer.country === mapCountryName; }));
    });

    if (result) {
      var heading = result.querySelector("strong");
      var message = result.querySelector("span");
      if (heading) heading.textContent = countryName === "cualquiera" ? "Toda Europa" : countryName;
      if (message) message.textContent = countryName === "cualquiera"
        ? offers.length + (offers.length === 1 ? " oferta disponible en la demostración." : " ofertas disponibles en la demostración.")
        : (selected.length ? selected.length + (selected.length === 1 ? " oferta para este país." : " ofertas para este país.") : "Aún no tenemos ofertas de demostración en este país.");
    }

    if (list) {
      list.innerHTML = selected.length ? selected.map(function (offer) {
        return offerCardHtml(offer, offer.isDemo ? "Oferta de demostración" : "Oferta disponible");
      }).join("") : '<div class="notice map-empty"><strong>Aún no tenemos ofertas para ' + escapeHtml(countryName) + '.</strong><br>Prueba otro país o revisa el portal oficial de empleo europeo en <a href="https://eures.europa.eu/index_es" target="_blank" rel="noopener noreferrer">EURES ↗</a>.</div>';
    }
  }

  function initializeMap() {
    var shapesContainer = document.getElementById("map-country-shapes");
    var markersContainer = document.getElementById("map-country-markers");
    var select = document.getElementById("map-country-select");
    if (!shapesContainer || !markersContainer || !select) return;
    fillCountrySelect(select, false);
    var countryNames = new Set(europeanCountries.map(function (country) { return country.name; }));
    var mapData = Array.isArray(window.RUMBO_EUROPE_MAP) ? window.RUMBO_EUROPE_MAP : [];
    mapData.filter(function (country) { return countryNames.has(country.name); }).forEach(function (country) {
      var shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
      shape.setAttribute("class", "map-country");
      shape.setAttribute("d", country.d);
      shape.setAttribute("tabindex", "0");
      shape.setAttribute("role", "button");
      shape.setAttribute("aria-label", "Ver ofertas de " + country.name);
      shape.setAttribute("data-country", country.name);
      shape.setAttribute("fill-rule", "evenodd");
      var title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      title.textContent = country.name + " · seleccionar país";
      shape.appendChild(title);
      shapesContainer.appendChild(shape);

      if (country.tiny) {
        var marker = document.createElementNS("http://www.w3.org/2000/svg", "g");
        marker.setAttribute("class", "map-country-marker");
        marker.setAttribute("transform", "translate(" + country.cx + " " + country.cy + ")");
        marker.setAttribute("tabindex", "0");
        marker.setAttribute("role", "button");
        marker.setAttribute("aria-label", "Ver ofertas de " + country.name);
        marker.setAttribute("data-country", country.name);
        marker.innerHTML = '<title>' + escapeHtml(country.name) + '</title><circle r="8"></circle><text y="3">' + escapeHtml(country.code) + '</text>';
        markersContainer.appendChild(marker);
      }
    });

    select.addEventListener("change", function () { updateMapCountry(select.value); });
    function activateMapCountry(event) {
      var target = event.target.closest(".map-country, .map-country-marker");
      if (target) updateMapCountry(target.getAttribute("data-country"));
    }
    function keyboardMapCountry(event) {
      var target = event.target.closest(".map-country, .map-country-marker");
      if (target && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        updateMapCountry(target.getAttribute("data-country"));
      }
    }
    [shapesContainer, markersContainer].forEach(function (container) {
      container.addEventListener("click", activateMapCountry);
      container.addEventListener("keydown", keyboardMapCountry);
    });
    updateMapCountry("cualquiera");
  }

  protectPageAndLinks();

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

  fillCountrySelect(document.getElementById("country"), !!document.getElementById("survey-form"));
  fillCountrySelect(document.querySelector('#offer-form select[name="country"]'), false);
  initializeMap();
  renderCollections("cualquiera");

  document.addEventListener("click", function (event) {
    var removeButton = event.target.closest("[data-remove-offer]");
    if (!removeButton) return;
    var id = removeButton.getAttribute("data-remove-offer");
    var remaining = getDemoOffers().filter(function (offer) { return offer.id !== id; });
    try {
      localStorage.setItem(DEMO_OFFERS_KEY, JSON.stringify(remaining));
      renderCollections(document.getElementById("map-country-select") ? document.getElementById("map-country-select").value : "cualquiera");
    } catch (error) {
      window.alert("No se pudo retirar la oferta en este navegador.");
    }
  });

  function getAccounts() {
    var accounts = readJson(ACCOUNT_KEY, []);
    return Array.isArray(accounts) ? accounts : [];
  }

  function bytesToHex(bytes) {
    return Array.from(bytes).map(function (byte) { return byte.toString(16).padStart(2, "0"); }).join("");
  }

  function hexToBytes(hex) {
    var bytes = new Uint8Array(hex.length / 2);
    for (var index = 0; index < bytes.length; index += 1) bytes[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16);
    return bytes;
  }

  function createSalt() {
    var bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return bytesToHex(bytes);
  }

  async function passwordHash(password, salt) {
    if (!window.crypto || !window.crypto.subtle) throw new Error("Para crear una cuenta de prueba, abre la web publicada con https.");
    var key = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    var bits = await window.crypto.subtle.deriveBits({
      name: "PBKDF2", salt: hexToBytes(salt), iterations: HASH_ITERATIONS, hash: "SHA-256"
    }, key, 256);
    return bytesToHex(new Uint8Array(bits));
  }

  function goToPortal(account) {
    try {
      var profileSession = JSON.stringify({ name: account.name, email: account.email, role: account.role });
      sessionStorage.setItem("rumboDemoProfile", profileSession);
      localStorage.setItem("rumboDemoProfile", profileSession);
    } catch (error) { /* La demo no depende de la sesión. */ }
    var requestedPage = new URLSearchParams(window.location.search).get("next") || "";
    var safePage = requestedPage.split(/[?#]/)[0];
    var isSafePage = /^[a-z0-9-]+\.html$/i.test(safePage) && protectedPageRoles[safePage] === account.role;
    window.location.href = isSafePage ? safePage : (account.role === "empresa" ? "empresas.html" : "index.html");
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
      document.getElementById("auth-subtitle").textContent = signup ? "Elige tu perfil y completa tus datos para entrar." : "Escribe el correo y la contraseña que registraste en este navegador.";
      document.getElementById("auth-switch-text").textContent = signup ? "¿Ya tienes cuenta?" : "¿Todavía no tienes cuenta?";
      submit.innerHTML = signup ? 'Crear cuenta y continuar <span aria-hidden="true">→</span>' : 'Iniciar sesión <span aria-hidden="true">→</span>';
      document.getElementById("password").autocomplete = signup ? "new-password" : "current-password";
      document.getElementById("auth-status").textContent = "";
      document.querySelectorAll("[data-auth-mode]").forEach(function (item) { item.hidden = item.dataset.authMode === mode; });
    });
  });

  var authForm = document.getElementById("auth-form");
  if (authForm) {
    var accessParams = new URLSearchParams(window.location.search);
    var initialRole = accessParams.get("role");
    var initialDestination = accessParams.get("next");
    if (!initialDestination && initialRole !== "candidato" && initialRole !== "empresa" && accessParams.get("access") !== "1") {
      window.location.replace("index.html");
    }
    var requiredRole = accessParams.get("role");
    if (requiredRole !== "candidato" && requiredRole !== "empresa") requiredRole = "";
    if (requiredRole) {
      var requestedRoleInput = authForm.querySelector('input[name="role"][value="' + requiredRole + '"]');
      if (requestedRoleInput) requestedRoleInput.checked = true;
    }
    var requestedNext = accessParams.get("next");
    var destinationNames = {
      "encuesta.html": "la encuesta",
      "paquetes.html": "los paquetes para personas candidatas",
      "recomendadas.html": "las empresas recomendadas",
      "perfil.html": "tu perfil",
      "curriculum.html": "tu CV",
      "guardadas.html": "tus ofertas guardadas",
      "candidatos.html": "el área de empleo",
      "empresas.html": "el portal de empresas",
      "paquetes-empresas.html": "los paquetes para empresas",
      "publicar-oferta.html": "la publicación de ofertas"
    };
    var nextName = requestedNext ? requestedNext.split(/[?#]/)[0].split("/").pop() : "";
    var accessContext = document.getElementById("auth-context");
    if (accessContext && destinationNames[nextName]) {
      accessContext.hidden = false;
      accessContext.textContent = "Inicia sesión o crea una cuenta para acceder a " + destinationNames[nextName] + ".";
    }

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
          if (requiredRole && role !== requiredRole) throw new Error("Para abrir esta sección, selecciona el perfil indicado.");
          if (password !== confirmation) throw new Error("Las contraseñas no coinciden. Comprueba las dos casillas.");
          if (accounts.some(function (item) { return item.email === email; })) throw new Error("Ya existe una cuenta de prueba con ese correo en este navegador. Inicia sesión.");
          var salt = createSalt();
          account = { name: name, email: email, role: role, salt: salt, passwordHash: await passwordHash(password, salt) };
          accounts.push(account);
          localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));
          status.textContent = "Cuenta creada. Entrando en Rumbo…";
        } else {
          account = accounts.find(function (item) { return item.email === email; });
          if (!account) throw new Error("No encuentro esa cuenta en este navegador. Pulsa «Crear cuenta» primero.");
          if (requiredRole && account.role !== requiredRole) throw new Error("Esta sección requiere una cuenta de " + (requiredRole === "empresa" ? "empresa" : "persona candidata") + ". Usa el perfil correcto.");
          var enteredHash = await passwordHash(password, account.salt);
          if (enteredHash !== account.passwordHash) throw new Error("La contraseña no coincide. Vuelve a intentarlo.");
          status.textContent = "Sesión iniciada. Entrando en Rumbo…";
        }
        document.getElementById("password").value = "";
        var confirmPassword = document.getElementById("confirm-password");
        if (confirmPassword) confirmPassword.value = "";
        window.setTimeout(function () { goToPortal(account); }, 450);
      } catch (error) {
        status.textContent = error.message || "No se pudo crear la cuenta en este navegador.";
        submit.disabled = false;
      }
    });

    document.querySelectorAll("[data-social-demo]").forEach(function (button) {
      button.addEventListener("click", function () {
        document.getElementById("auth-status").textContent = "El acceso con " + button.dataset.socialDemo + " aún no está conectado. Usa el registro con correo para probar la web.";
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
      var offers = getAllOffers();
      var activeFilters = [];
      if (country !== "cualquiera") activeFilters.push("país");
      if (sector !== "cualquiera") activeFilters.push("sector");
      if (duration !== "cualquiera") activeFilters.push("duración");

      function matches(offer) {
        return (country === "cualquiera" || offer.country === country) &&
          (sector === "cualquiera" || offer.sector === sector) &&
          (duration === "cualquiera" || offer.durations.indexOf(duration) !== -1);
      }

      var exactOffers = offers.filter(matches);
      var selectedOffers = exactOffers;
      var exactMatch = exactOffers.length > 0;
      var scores = [];
      if (!exactMatch) {
        scores = offers.map(function (offer) {
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
        ? "Empresas y ofertas que encajan con tus preferencias"
        : (selectedOffers.length ? "Las ofertas más cercanas a tus preferencias" : "Aún no hay una oferta que encaje en esta selección");
      document.getElementById("survey-summary").textContent = "Buscas " + sectorLabel + " en " + countryLabel + " durante " + durationLabel +
        ". Perfil de edad: " + age + ". Te motiva: " + motivationText + "." +
        (exactMatch ? " Estas vacantes coinciden en país, sector y duración." :
          (selectedOffers.length ? " No hay coincidencia exacta en esta selección; estas ofertas comparten parte de tus criterios." : " Prueba otros filtros o consulta más vacantes en EURES."));

      var list = document.getElementById("recommendation-list");
      if (selectedOffers.length) {
        list.innerHTML = selectedOffers.map(function (offer) {
          var badge = "Coincide con tus filtros";
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
      var priceText = "Búsqueda de empleo: 89 €";
      if (needsHousing) priceText += " + gestión de búsqueda de vivienda: 60 €";
      if (needsTransport) priceText += " + gestión de transporte: 30 €";
      priceText += ". Total orientativo de los servicios de Rumbo: " + total + " €.";
      priceText += needsHousing ? " El alquiler, la fianza y los suministros se pagan aparte." : " No se añade la búsqueda de vivienda.";
      priceText += needsTransport ? " Los billetes y gastos del viaje no están incluidos." : " No se añade la gestión del transporte.";
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
      var company = String(data.get("company") || "").trim();
      var contact = String(data.get("email") || "").trim();
      var title = String(data.get("title") || "").trim();
      var country = String(data.get("country") || "").trim();
      var location = String(data.get("location") || "").trim();
      var sector = sectorDetails(data.get("sector"));
      var duration = durationDetails(data.get("duration"), offerForm.querySelector('[name="duration"]').selectedOptions[0].textContent);
      var packageLabel = data.get("package") === "selection" ? "Apoyo de selección · 149 €" : "Publicación estándar · 49 €";
      var packagePrice = data.get("package") === "selection" ? 149 : 49;
      var sponsored = data.get("sponsor") === "si";
      var estimatedPrice = packagePrice + (sponsored ? 29 : 0);
      var housing = String(data.get("housing") || "No indicado");
      var salary = String(data.get("salary") || "Salario no indicado").trim();
      var language = String(data.get("language") || "").trim();
      var description = String(data.get("description") || "").trim();
      var offer = {
        id: createId(),
        isDemo: true,
        sponsored: sponsored,
        packageLabel: packageLabel,
        company: company,
        title: title,
        country: country,
        location: location || "Ubicación no indicada",
        sector: sector.key,
        sectorLabel: sector.label,
        durations: duration.values,
        durationLabel: duration.label,
        salary: salary,
        housing: housing,
        deadline: "Anuncio de demostración enviado desde este navegador; no verificado por Rumbo.",
        details: description + (language ? " Idiomas: " + language + "." : ""),
        contactEmail: contact,
        url: "mailto:" + encodeURIComponent(contact).replace(/%40/gi, "@"),
        source: "Contacto directo",
        createdAt: Date.now()
      };

      var status = document.getElementById("offer-save-status");
      var previewText = document.getElementById("offer-preview-text");
      try {
        var offers = getDemoOffers();
        offers.unshift(offer);
        localStorage.setItem(DEMO_OFFERS_KEY, JSON.stringify(offers));
        if (previewText) previewText.textContent = "Oferta guardada en esta demostración.\nPuesto: " + title + "\nEmpresa: " + company +
          "\nPaís: " + country + "\nSector: " + sector.label + "\nContrato: " + duration.label +
          "\nAlojamiento: " + housing + "\nSalario: " + salary + "\nServicio: " + packageLabel +
          "\nPromoción: " + (offer.sponsored ? "Sí, se verá como patrocinada" : "No") +
          "\nTotal orientativo: " + estimatedPrice + " € (sin cobro)" +
          "\n\n" + description;
        if (status) status.innerHTML = 'Ya aparece en las ofertas y en el mapa de este navegador. <a href="recomendadas.html#mapa">Ver la oferta →</a>' +
          (offer.sponsored ? ' <span class="pill gold">Patrocinada en esta demo</span>' : '');
        document.getElementById("offer-preview").classList.add("visible");
        offerForm.reset();
        renderCollections("cualquiera");
        document.getElementById("offer-preview").scrollIntoView({ behavior: "smooth", block: "nearest" });
      } catch (error) {
        if (status) status.textContent = "No se pudo guardar. Comprueba que el navegador permita guardar datos de esta página.";
        document.getElementById("offer-preview").classList.add("visible");
      }
    });
  }
}());
