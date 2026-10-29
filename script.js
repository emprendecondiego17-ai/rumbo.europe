(function () {
  "use strict";

  var cloudOffers = [];
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
    "publicar-oferta.html": "empresa",
    "candidatos-empresa.html": "empresa",
    "candidato-detalle.html": "empresa"
  };

  function currentProfile() {
    try {
      var account = JSON.parse(sessionStorage.getItem("rumboDemoProfile") || localStorage.getItem("rumboDemoProfile") || "null");
      if (account && !account.id && !(window.RumboCloud && window.RumboCloud.isConfigured)) {
        var accounts = JSON.parse(localStorage.getItem("rumboDemoAccounts") || "[]");
        var stored = Array.isArray(accounts) && accounts.find(function (item) { return item.email === account.email && item.role === account.role; });
        if (stored) {
          if (!stored.id) stored.id = createId();
          account.id = stored.id;
          localStorage.setItem("rumboDemoAccounts", JSON.stringify(accounts));
          sessionStorage.setItem("rumboDemoProfile", JSON.stringify(account));
          localStorage.setItem("rumboDemoProfile", JSON.stringify(account));
        }
      }
      return account;
    } catch (error) { return null; }
  }

  function accessUrl(destination, role, pathAndSearch) {
    var query = new URLSearchParams();
    query.set("next", pathAndSearch || destination);
    query.set("role", role);
    return "acceso.html?" + query.toString();
  }

  function protectPageAndLinks() {
    var currentPage = window.location.pathname.split("/").pop().toLowerCase();
    var requiredRole = protectedPageRoles[currentPage];
    var profile = currentProfile();
    if (requiredRole && (!profile || profile.role !== requiredRole)) {
      window.location.replace(accessUrl(currentPage, requiredRole, currentPage + window.location.search));
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
        window.location.href = accessUrl(destination, role, rawHref);
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

  function getAllOffers() {
    var local = [];
    try {
      var saved = JSON.parse(localStorage.getItem("rumboDemoOffers") || "[]");
      if (Array.isArray(saved)) local = saved;
    } catch (error) { local = []; }
    return curatedOffers.concat(local, cloudOffers);
  }

  function offerRatingHtml(offer) {
    if (!offer || !offer.isCompanyOffer) return "";
    var average = Number(offer.averageRating || 0);
    var count = Number(offer.ratingCount || 0);
    var userRating = Number(offer.userRating || 0);
    var profile = currentProfile();
    var stars = "";
    if (profile && profile.role === "candidato") {
      for (var value = 1; value <= 5; value += 1) {
        stars += '<button class="rating-star' + (value <= userRating ? " is-selected" : "") + '" type="button" data-rate-offer="' + value + '" data-offer-id="' + escapeHtml(offer.id) + '" aria-label="Valorar con ' + value + ' estrellas" aria-pressed="' + String(value === userRating) + '">★</button>';
      }
    }
    return '<div class="offer-rating" aria-label="Valoraciones de la oferta"><span class="offer-rating-score">' + (count ? average.toFixed(1) : "—") + '</span><span class="offer-rating-stars" aria-hidden="true">' + "★".repeat(Math.max(0, Math.min(5, Math.round(average)))) + "☆".repeat(Math.max(0, 5 - Math.round(average))) + '</span><span class="offer-rating-count">' + count + (count === 1 ? " valoración" : " valoraciones") + '</span>' + (stars ? '<span class="offer-rating-input" aria-label="Tu valoración">' + stars + '</span>' : '') + '</div>';
  }

  function offerCardHtml(offer, badge) {
    var contactLabel = offer.isDemo || offer.isCompanyOffer ? "Contactar con la empresa" : "Ver oferta en " + offer.source + " ↗";
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
      isDemo: !!offer.isDemo,
      ownerEmail: offer.ownerEmail || "",
      ownerId: offer.ownerId || "",
      vacancies: Number(offer.vacancies || 1),
      averageRating: Number(offer.averageRating || 0),
      ratingCount: Number(offer.ratingCount || 0),
      favoritesCount: Number(offer.favoritesCount || 0),
      viewsCount: Number(offer.viewsCount || 0)
    };
    var saveControl = offer.isCompanyOffer
      ? '<button class="save-offer" type="button" data-save-offer="' + escapeHtml(savedPayload.key) + '" data-offer="' + escapeHtml(JSON.stringify(savedPayload)) + '" aria-pressed="false">☆ Guardar oferta</button>'
      : '';
    var activeAccount = currentProfile();
    var applied = !!offer.applicationStatus;
    if (!applied && activeAccount && activeAccount.role === "candidato" && !(window.RumboCloud && window.RumboCloud.isConfigured)) {
      try {
        var userApplications = JSON.parse(localStorage.getItem("rumboApplications") || "[]");
        applied = userApplications.some(function (item) { return item.offerKey === savedPayload.key && item.candidateEmail === activeAccount.email; });
      } catch (error) { applied = false; }
    }
    var applyControl = offer.isCompanyOffer && activeAccount && activeAccount.role === "candidato"
      ? '<button class="button secondary apply-offer" type="button" data-apply-offer="' + escapeHtml(savedPayload.key) + '" ' + (applied ? 'disabled aria-label="Solicitud enviada"' : '') + '>' + (applied ? 'Solicitud enviada' : 'Solicitar empleo') + '</button>'
      : '';
    var tags = '<div class="offer-meta"><span>' + escapeHtml(offer.sectorLabel) + '</span><span>' + escapeHtml(offer.durationLabel) + '</span><span>Vacantes: ' + escapeHtml(offer.vacancies || 1) + '</span></div>';
    return '<article class="surface offer-card" data-offer-card-id="' + escapeHtml(offer.id || "") + '" data-offer-id="' + escapeHtml(offer.id || "") + '" data-offer-key="' + escapeHtml(savedPayload.key) + '" data-offer-owner="' + escapeHtml(offer.ownerId || offer.ownerEmail || "") + '">' +
      '<div class="offer-head"><div><h3>' + escapeHtml(offer.title) + '</h3>' +
      '<div class="offer-company">' + escapeHtml(offer.company) + ' · ' + escapeHtml(offer.location || "Ubicación no indicada") + '</div></div>' +
      '<span class="pill">' + escapeHtml(offer.country) + '</span></div>' +
      tags +
      offerRatingHtml(offer) +
      '<p class="offer-details">' + escapeHtml(offer.details) + '</p>' +
      '<p class="offer-details"><strong>Alojamiento indicado:</strong> ' + escapeHtml(offer.housing) +
      '<br><strong>Condición/plazo:</strong> ' + escapeHtml(offer.deadline) + '</p>' +
      (offer.isDemo ? '<p class="offer-details"><strong>Servicio elegido:</strong> ' + escapeHtml(offer.packageLabel || "Publicación estándar") + (offer.sponsored ? ' · extra de promoción indicado' : '') + '</p>' : '') +
      (offer.isDemo ? '<span class="pill demo-badge">Anuncio de demostración · no verificado</span>' : '') +
      (badge ? '<span class="pill gold offer-badge">' + escapeHtml(badge) + '</span>' : '') +
      '<div class="offer-bottom"><strong>' + escapeHtml(offer.salary || "Salario no indicado") + '</strong>' +
      '<div class="offer-actions">' + applyControl + '<a href="' + escapeHtml(offer.url) + '" ' + (offer.isDemo || offer.isCompanyOffer ? '' : 'target="_blank" rel="noopener noreferrer"') + '>' + escapeHtml(contactLabel) + '</a>' + saveControl + '</div></div>' +
      (offer.isCompanyOffer ? '<p class="save-status" role="status" aria-live="polite"></p>' : '') +
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

    var sponsored = offers.filter(function (offer) { return offer.sponsored; });
    var sponsorList = document.getElementById("paid-sponsored-offers");
    var sponsorEmpty = document.getElementById("no-paid-sponsors");
    if (sponsorList) sponsorList.innerHTML = sponsored.map(function (offer) {
      return offerCardHtml(offer, "Oferta patrocinada");
    }).join("");
    if (sponsorEmpty) sponsorEmpty.hidden = sponsored.length > 0;

    renderHomeSponsors();
    if (document.getElementById("map-country-select")) updateMapCountry(selectedCountry || "cualquiera");
    registerOfferViewTracking(document);
  }

  function registerOfferViewTracking(root) {
    var candidate = currentProfile();
    if (!candidate || candidate.role !== "candidato" || !window.IntersectionObserver || !root || !root.querySelectorAll) return;
    if (window.RumboCloud && window.RumboCloud.isConfigured) {
      var cloudCards = root.querySelectorAll(".offer-card[data-offer-id]");
      if (!cloudCards.length) return;
      var cloudObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          cloudObserver.unobserve(entry.target);
          var offerId = entry.target.getAttribute("data-offer-id");
          if (!offerId || entry.target.getAttribute("data-view-recorded") === "true") return;
          entry.target.setAttribute("data-view-recorded", "true");
          window.RumboCloud.recordView(offerId).catch(function (error) { console.error("No se pudo registrar la visita:", error); });
        });
      }, { threshold: 0.45 });
      cloudCards.forEach(function (card) { cloudObserver.observe(card); });
      return;
    }
    var cards = root.querySelectorAll(".offer-card[data-offer-key][data-offer-owner]");
    if (!cards.length) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        var offerKey = entry.target.getAttribute("data-offer-key");
        var ownerEmail = entry.target.getAttribute("data-offer-owner");
        if (!offerKey || !ownerEmail) return;
        var views = readJson("rumboOfferViews", []);
        if (!Array.isArray(views)) views = [];
        var alreadyViewed = views.some(function (view) { return view.offerKey === offerKey && view.candidateEmail === candidate.email; });
        if (alreadyViewed) return;
        views.push({ offerKey: offerKey, ownerEmail: ownerEmail, candidateEmail: candidate.email, viewedAt: Date.now() });
        try { localStorage.setItem("rumboOfferViews", JSON.stringify(views)); } catch (error) { /* El contador es opcional en la demo. */ }
      });
    }, { threshold: 0.55 });
    cards.forEach(function (card) { observer.observe(card); });
  }

  function renderHomeSponsors() {
    var container = document.getElementById("home-sponsored-companies");
    var empty = document.getElementById("home-sponsors-empty");
    if (!container) return;

    var seenCompanies = {};
    var sponsored = getAllOffers().filter(function (offer) {
      var companyKey = String(offer.company || "").trim().toLowerCase();
      if (!offer.sponsored || !companyKey || seenCompanies[companyKey]) return false;
      seenCompanies[companyKey] = true;
      return true;
    });

    container.innerHTML = sponsored.map(function (offer) {
      var initials = String(offer.company || "R").trim().split(/\s+/).slice(0, 2).map(function (word) { return word.charAt(0); }).join("").toUpperCase();
      return '<article class="surface sponsor-card">' +
        '<div class="sponsor-card-top"><span class="sponsor-mark" aria-hidden="true">' + escapeHtml(initials || "R") + '</span><span class="pill gold">Patrocinado</span></div>' +
        '<h3>' + escapeHtml(offer.company) + '</h3>' +
        '<p class="sponsor-role">' + escapeHtml(offer.title) + '</p>' +
        '<p class="sponsor-location">' + escapeHtml(offer.country) + (offer.location ? ' · ' + escapeHtml(offer.location) : '') + ' · ' + escapeHtml(offer.sectorLabel) + '</p>' +
        '<a class="text-link" href="recomendadas.html#mapa">Ver ofertas de esta empresa <span aria-hidden="true">→</span></a>' +
        '<small>Anuncio patrocinado por la empresa.</small>' +
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
        ? offers.length + (offers.length === 1 ? " oferta disponible en Rumbo." : " ofertas disponibles en Rumbo.")
        : (selected.length ? selected.length + (selected.length === 1 ? " oferta para este país." : " ofertas para este país.") : "Aún no tenemos ofertas registradas en este país.");
    }

    if (list) {
      list.innerHTML = selected.length ? selected.map(function (offer) {
        return offerCardHtml(offer, offer.isDemo ? "Oferta de demostración" : "Oferta disponible");
      }).join("") : '<div class="notice map-empty"><strong>Aún no tenemos ofertas para ' + escapeHtml(countryName) + '.</strong><br>Prueba otro país o revisa el portal oficial de empleo europeo en <a href="https://eures.europa.eu/index_es" target="_blank" rel="noopener noreferrer">EURES ↗</a>.</div>';
      registerOfferViewTracking(list);
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

  function startRumboUi() {
    protectPageAndLinks();
    var currentPage = window.location.pathname.split("/").pop().toLowerCase();
    var activeProfile = currentProfile();
    // La portada siempre debe ser la entrada. Solo retomamos una página tras
    // una confirmación explícita de correo, nunca por un destino antiguo guardado.
    var resumeDestination = new URLSearchParams(window.location.search).get("resume") || "";
    if (currentPage === "index.html" && resumeDestination && activeProfile && protectedPageRoles[resumeDestination] === activeProfile.role) {
      try { localStorage.removeItem("rumboPendingDestination"); } catch (error) { /* La portada sigue disponible si no hay almacenamiento local. */ }
      window.location.replace(resumeDestination);
      return;
    }
    fillCountrySelect(document.getElementById("country"), !!document.getElementById("survey-form"));
    fillCountrySelect(document.querySelector('#offer-form select[name="country"]'), false);
    initializeMap();
    renderCollections("cualquiera");
    if (window.RumboCloud && window.RumboCloud.isConfigured) {
      window.RumboCloud.loadOffers().catch(function (error) { console.error("No se pudieron cargar las ofertas:", error); });
      window.RumboCloud.subscribeOffers(function () {
        window.RumboCloud.loadOffers().catch(function (error) { console.error("No se pudieron actualizar las ofertas:", error); });
      });
    }
  }

  if (window.RumboCloud && window.RumboCloud.ready) window.RumboCloud.ready.then(startRumboUi);
  else startRumboUi();

  window.addEventListener("rumbo:offers", function (event) {
    cloudOffers = Array.isArray(event.detail) ? event.detail : [];
    var selectedCountry = document.getElementById("map-country-select");
    renderCollections(selectedCountry ? selectedCountry.value : "cualquiera");
  });

  document.addEventListener("click", function (event) {
    var offerLink = event.target.closest(".offer-card a[href]");
    if (!offerLink) return;
    var card = offerLink.closest(".offer-card");
    var offerId = card && card.getAttribute("data-offer-id");
    if (!card) return;
    var account = currentProfile();
    if (!account || account.role !== "candidato") return;
    if (offerId && window.RumboCloud && window.RumboCloud.isConfigured) {
      window.RumboCloud.recordView(offerId).catch(function (error) { console.error("No se pudo registrar la visita:", error); });
    } else {
      try {
        var views = JSON.parse(localStorage.getItem("rumboOfferViews") || "[]");
        var key = card.getAttribute("data-offer-key") || offerId;
        if (!views.some(function (view) { return view.offerKey === key && view.candidateEmail === account.email; })) {
          views.push({ offerKey: key, ownerEmail: card.getAttribute("data-offer-owner") || "", candidateEmail: account.email, candidateId: account.id || "", createdAt: new Date().toISOString() });
          localStorage.setItem("rumboOfferViews", JSON.stringify(views));
        }
      } catch (error) { /* La visita es opcional en el modo de prueba. */ }
    }
  });

  document.addEventListener("click", async function (event) {
    var button = event.target.closest("[data-apply-offer]");
    if (!button) return;
    var account = currentProfile();
    if (!account || account.role !== "candidato") { window.location.href = accessUrl("recomendadas.html", "candidato"); return; }
    var offerKey = button.getAttribute("data-apply-offer");
    button.disabled = true;
    try {
      if (window.RumboCloud && window.RumboCloud.isConfigured) {
        await window.RumboCloud.applyToOffer(offerKey);
      } else {
        var applications = [];
        try { applications = JSON.parse(localStorage.getItem("rumboApplications") || "[]"); } catch (error) { applications = []; }
        if (applications.some(function (item) { return item.offerKey === offerKey && item.candidateEmail === account.email; })) {
          button.textContent = "Solicitud enviada";
          return;
        }
        var card = button.closest(".offer-card");
        var savedControl = card && card.querySelector("[data-offer]");
        var offer = {};
        try { offer = JSON.parse(savedControl && savedControl.getAttribute("data-offer") || "{}"); } catch (error) { offer = {}; }
        offer.key = offerKey;
        applications.push({ offerKey: offerKey, candidateEmail: account.email, candidateId: account.id || "", status: "recibida", createdAt: new Date().toISOString(), offer: offer });
        localStorage.setItem("rumboApplications", JSON.stringify(applications));
      }
      button.textContent = "Solicitud enviada";
      button.setAttribute("aria-label", "Has enviado una solicitud para esta oferta");
      if (window.RumboCloud && window.RumboCloud.isConfigured) window.RumboCloud.loadOffers();
    } catch (error) {
      button.disabled = false;
      button.textContent = error.message || "No se pudo enviar la solicitud";
    }
  });

  document.addEventListener("click", async function (event) {
    var ratingButton = event.target.closest("[data-rate-offer]");
    if (!ratingButton) return;
    event.preventDefault();
    if (!window.RumboCloud || !window.RumboCloud.isConfigured) return;
    ratingButton.disabled = true;
    try {
      await window.RumboCloud.rateOffer(ratingButton.getAttribute("data-offer-id"), ratingButton.getAttribute("data-rate-offer"));
    } catch (error) {
      ratingButton.disabled = false;
      var card = ratingButton.closest(".offer-card");
      if (card) {
        var message = card.querySelector(".rating-status");
        if (!message) { message = document.createElement("span"); message.className = "rating-status"; card.querySelector(".offer-rating").appendChild(message); }
        message.textContent = error.message || "No se pudo guardar tu valoración.";
      }
    }
  });

  function goToPortal(account) {
    try {
      var profileSession = JSON.stringify(account);
      sessionStorage.setItem("rumboDemoProfile", profileSession);
      localStorage.setItem("rumboDemoProfile", profileSession);
    } catch (error) { /* La demo no depende de la sesión. */ }
    var requestedPage = new URLSearchParams(window.location.search).get("next") || "";
    var safePage = requestedPage.split(/[?#]/)[0].split("/").pop();
    var isSafePage = /^[a-z0-9-]+\.html$/i.test(safePage) && protectedPageRoles[safePage] === account.role;
    if (isSafePage) {
      try { localStorage.removeItem("rumboPendingDestination"); } catch (error) { /* El acceso no depende de la redirección guardada. */ }
    }
    var targetUrl = isSafePage ? safePage : (account.role === "empresa" ? "empresas.html" : "index.html");
    if (isSafePage && requestedPage.indexOf("?") >= 0) {
      var requestedQuery = new URLSearchParams(requestedPage.slice(requestedPage.indexOf("?") + 1));
      var safeQuery = new URLSearchParams();
      ["candidate", "offer"].forEach(function (key) { if (requestedQuery.has(key)) safeQuery.set(key, requestedQuery.get(key)); });
      if (safeQuery.toString()) targetUrl += "?" + safeQuery.toString();
    }
    window.location.href = targetUrl;
  }

  function bytesToBase64(bytes) {
    var binary = "";
    bytes.forEach(function (byte) { binary += String.fromCharCode(byte); });
    return btoa(binary);
  }

  function base64ToBytes(value) {
    return Uint8Array.from(atob(value), function (character) { return character.charCodeAt(0); });
  }

  async function hashLocalPassword(password, salt) {
    if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) {
      throw new Error("Este navegador no permite proteger la contraseña. Abre Rumbo desde su dirección https.");
    }
    var key = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    var bits = await window.crypto.subtle.deriveBits({ name: "PBKDF2", salt: base64ToBytes(salt), iterations: 120000, hash: "SHA-256" }, key, 256);
    return bytesToBase64(new Uint8Array(bits));
  }

  function makeLocalSalt() {
    var bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return bytesToBase64(bytes);
  }

  function localAccounts() {
    try {
      var accounts = JSON.parse(localStorage.getItem("rumboDemoAccounts") || "[]");
      if (!Array.isArray(accounts)) return [];
      var changed = false;
      accounts.forEach(function (item) { if (item && !item.id) { item.id = createId(); changed = true; } });
      if (changed) localStorage.setItem("rumboDemoAccounts", JSON.stringify(accounts));
      return accounts;
    } catch (error) { return []; }
  }

  function publicLocalAccount(account) {
    var safe = Object.assign({}, account);
    delete safe.passwordHash;
    delete safe.passwordSalt;
    return safe;
  }

  async function localSignUp(email, password, role, name, company) {
    var accounts = localAccounts();
    if (accounts.some(function (item) { return item.email === email; })) throw new Error("Ya existe una cuenta con ese correo. Inicia sesión.");
    var salt = makeLocalSalt();
    var account = {
      id: createId(), email: email, role: role, name: name, passwordSalt: salt,
      passwordHash: await hashLocalPassword(password, salt), createdAt: new Date().toISOString()
    };
    if (role === "empresa") account.company = company;
    accounts.push(account);
    localStorage.setItem("rumboDemoAccounts", JSON.stringify(accounts));
    return publicLocalAccount(account);
  }

  async function localSignIn(email, password, requiredRole) {
    var account = localAccounts().find(function (item) { return item.email === email; });
    if (!account || !account.passwordSalt || !account.passwordHash) throw new Error("No encontramos una cuenta con ese correo. Comprueba los datos o crea una cuenta.");
    if (await hashLocalPassword(password, account.passwordSalt) !== account.passwordHash) throw new Error("La contraseña no coincide. Compruébala e inténtalo de nuevo.");
    if (requiredRole && account.role !== requiredRole) throw new Error("Esta página requiere una cuenta de " + (requiredRole === "empresa" ? "empresa" : "persona candidata") + ". Usa el perfil correcto.");
    return publicLocalAccount(account);
  }

  function updateAuthRegistrationFields() {
    var form = document.getElementById("auth-form");
    var companyFields = document.getElementById("company-fields");
    if (!form || !companyFields) return;
    var signup = form.dataset.mode === "signup";
    var roleInput = form.querySelector('input[name="role"]:checked');
    var isCompanySignup = signup && roleInput && roleInput.value === "empresa";
    var roleSelect = document.getElementById("role-select");
    if (roleSelect) roleSelect.hidden = !signup || !!form.dataset.requiredRole;
    companyFields.hidden = !isCompanySignup;
    companyFields.querySelectorAll("[data-company-required]").forEach(function (field) {
      field.required = isCompanySignup;
    });
    var nameLabel = form.querySelector('label[for="name"]');
    var nameInput = document.getElementById("name");
    var emailInput = document.getElementById("email");
    if (nameLabel) nameLabel.textContent = isCompanySignup ? "Nombre de la persona de contacto" : "Nombre";
    if (nameInput) nameInput.placeholder = isCompanySignup ? "Nombre de la persona de contacto" : "Tu nombre";
    if (emailInput) emailInput.placeholder = isCompanySignup ? "Correo de contacto de la empresa" : "Correo electrónico";
  }

  function setAuthMode(mode) {
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
      document.getElementById("auth-subtitle").textContent = signup ? "Elige tu tipo de cuenta y completa tus datos." : "Accede a tu espacio personal de empleo o empresa.";
      document.getElementById("auth-switch-text").textContent = signup ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?";
      submit.innerHTML = signup ? 'Crear cuenta y continuar <span aria-hidden="true">→</span>' : 'Iniciar sesión <span aria-hidden="true">→</span>';
      document.getElementById("password").autocomplete = signup ? "new-password" : "current-password";
      document.getElementById("auth-status").textContent = "";
      document.querySelectorAll("[data-auth-mode]").forEach(function (item) { item.hidden = item.dataset.authMode === mode; });
      updateAuthRegistrationFields();
  }

  document.querySelectorAll("[data-auth-mode]").forEach(function (button) {
    button.addEventListener("click", function () { setAuthMode(button.dataset.authMode); });
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
    authForm.dataset.requiredRole = requiredRole;
    if (requiredRole) {
      var requestedRoleInput = authForm.querySelector('input[name="role"][value="' + requiredRole + '"]');
      if (requestedRoleInput) requestedRoleInput.checked = true;
    }
    authForm.querySelectorAll('input[name="role"]').forEach(function (input) {
      input.addEventListener("change", updateAuthRegistrationFields);
    });
    if (accessParams.get("mode") === "signup") setAuthMode("signup");
    else setAuthMode(authForm.dataset.mode || "login");
    var cloudNotice = document.getElementById("auth-connection-notice");
    var authFootnote = document.getElementById("auth-footnote");
    if (!window.RumboCloud || !window.RumboCloud.isConfigured) {
      if (cloudNotice) {
        cloudNotice.hidden = false;
        cloudNotice.innerHTML = '<strong>Modo de prueba en este dispositivo.</strong> Puedes crear una cuenta y entrar; los datos se guardan solo en este navegador. Para sincronizarlos entre dispositivos y compartir actividad, falta conectar la base de datos. Consulta <a href="LEEME.md">la guía de configuración</a>.';
      }
      if (authFootnote) authFootnote.textContent = "La contraseña se guarda como una huella protegida en este navegador. Esta cuenta no se sincroniza con otros dispositivos.";
    } else if (authFootnote) authFootnote.textContent = "Tu sesión y perfil quedarán asociados a tu cuenta Rumbo.";
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
      "publicar-oferta.html": "la publicación de ofertas",
      "candidatos-empresa.html": "el panel de candidaturas de empresa",
      "candidato-detalle.html": "el perfil de una persona candidata"
    };
    var nextName = requestedNext ? requestedNext.split(/[?#]/)[0].split("/").pop() : "";
    var accessContext = document.getElementById("auth-context");
    if (accessContext && destinationNames[nextName]) {
      accessContext.hidden = false;
      accessContext.textContent = "Inicia sesión o crea una cuenta para acceder a " + destinationNames[nextName] + ".";
    }

    var sessionNotice = document.getElementById("auth-session-notice");
    var sessionMessage = document.getElementById("auth-session-message");
    var switchAccountButton = document.getElementById("auth-switch-account");
    if (requiredRole) {
      var showRoleMismatch = function (activeProfile) {
        if (activeProfile && activeProfile.role !== requiredRole && sessionNotice) {
          sessionNotice.hidden = false;
          if (sessionMessage) sessionMessage.textContent = "Ya hay una sesión de " + (activeProfile.role === "empresa" ? "empresa" : "persona candidata") + " abierta. Cierra esa sesión para entrar en esta sección con el otro tipo de cuenta.";
        }
      };
      if (window.RumboCloud && window.RumboCloud.isConfigured) window.RumboCloud.ready.then(function () { showRoleMismatch(window.RumboCloud.getCurrentProfile()); });
      else showRoleMismatch(currentProfile());
    }
    if (switchAccountButton) switchAccountButton.addEventListener("click", async function () {
      switchAccountButton.disabled = true;
      try {
        if (window.RumboCloud && window.RumboCloud.isConfigured) await window.RumboCloud.signOut(false);
        else { sessionStorage.removeItem("rumboDemoProfile"); localStorage.removeItem("rumboDemoProfile"); }
        window.location.reload();
      } catch (error) {
        switchAccountButton.disabled = false;
        if (sessionMessage) sessionMessage.textContent = error.message || "No se pudo cerrar la sesión actual.";
      }
    });

    authForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      var status = document.getElementById("auth-status");
      var submit = document.getElementById("auth-submit");
      var email = document.getElementById("email").value.trim().toLowerCase();
      var password = document.getElementById("password").value;
      var roleChoice = authForm.querySelector('input[name="role"]:checked');
      var role = roleChoice ? roleChoice.value : "";
      var signup = authForm.dataset.mode === "signup";
      submit.disabled = true;
      status.textContent = signup ? "Creando tu cuenta Rumbo…" : "Iniciando sesión…";
      try {
        var account;
        if (signup) {
          var name = document.getElementById("name").value.trim();
          var confirmation = document.getElementById("confirm-password").value;
          if (requiredRole && role !== requiredRole) throw new Error("Para abrir esta sección, selecciona el perfil indicado.");
          if (password !== confirmation) throw new Error("Las contraseñas no coinciden. Comprueba las dos casillas.");
          var companyDetails = null;
          if (role === "empresa") {
            companyDetails = {
              companyName: document.getElementById("company-name").value.trim(),
              taxId: document.getElementById("company-tax-id").value.trim().toUpperCase(),
              country: document.getElementById("company-country").value,
              legalForm: document.getElementById("company-legal-form").value.trim(),
              address: document.getElementById("company-address").value.trim(),
              phone: document.getElementById("company-phone").value.trim(),
              website: document.getElementById("company-website").value.trim(),
              contactEmail: email,
              vacancyCount: Math.max(0, Math.floor(Number(document.getElementById("company-vacancies").value || 0)))
            };
          }
          var signupData = {
            name: name,
            role: role,
            companyName: companyDetails && companyDetails.companyName,
            taxId: companyDetails && companyDetails.taxId,
            country: companyDetails && companyDetails.country,
            legalForm: companyDetails && companyDetails.legalForm,
            address: companyDetails && companyDetails.address,
            companyPhone: companyDetails && companyDetails.phone,
            website: companyDetails && companyDetails.website,
            vacancyCount: companyDetails && companyDetails.vacancyCount,
            redirectTo: (function () {
              var redirect = new URL("index.html", window.location.href);
              var destination = requestedNext ? requestedNext.split(/[?#]/)[0].split("/").pop().toLowerCase() : "";
              if (/^[a-z0-9-]+\.html$/i.test(destination) && protectedPageRoles[destination] === role) redirect.searchParams.set("resume", destination);
              return redirect.href;
            }())
          };
          if (!window.RumboCloud || !window.RumboCloud.isConfigured) {
            if (!role) throw new Error("Elige si buscas empleo o si eres una empresa.");
            account = await localSignUp(email, password, role, name, companyDetails);
          } else {
            var created = await window.RumboCloud.signUp(email, password, signupData);
            if (!created.session) {
              status.textContent = "Hemos enviado un enlace de confirmación a tu correo. Confírmalo y después inicia sesión para entrar.";
              submit.disabled = false;
              return;
            }
            account = created.profile;
          }
          status.textContent = "Cuenta creada. Entrando en Rumbo…";
        } else {
          account = (window.RumboCloud && window.RumboCloud.isConfigured)
            ? await window.RumboCloud.signIn(email, password, requiredRole)
            : await localSignIn(email, password, requiredRole);
          status.textContent = "Sesión iniciada. Entrando en Rumbo…";
        }
        document.getElementById("password").value = "";
        var confirmPassword = document.getElementById("confirm-password");
        if (confirmPassword) confirmPassword.value = "";
        window.setTimeout(function () { goToPortal(account); }, 450);
      } catch (error) {
        status.textContent = error.message || "No se pudo completar el acceso. Comprueba tus datos e inténtalo de nuevo.";
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

      var scores = offers.map(function (offer) {
        var score = 0;
        if (country !== "cualquiera" && offer.country === country) score += 1;
        if (sector !== "cualquiera" && offer.sector === sector) score += 1;
        if (duration !== "cualquiera" && offer.durations.indexOf(duration) !== -1) score += 1;
        var rating = Number(offer.averageRating || 0);
        var favorites = Number(offer.favoritesCount || 0);
        var views = Number(offer.viewsCount || 0);
        var recommendationScore = score * 1000 + rating * 10 + Math.log(favorites + 1) * 5 + Math.log(views + 1) * 2;
        return { offer: offer, score: score, recommendationScore: recommendationScore };
      }).filter(function (item) { return item.score > 0 || activeFilters.length === 0; })
        .sort(function (a, b) { return b.recommendationScore - a.recommendationScore; });
      var exactOffers = scores.filter(function (item) { return matches(item.offer); }).map(function (item) { return item.offer; });
      var exactMatch = exactOffers.length > 0;
      var selectedOffers = exactMatch ? exactOffers.slice(0, 5) : scores.slice(0, 3).map(function (item) { return item.offer; });

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
        (exactMatch ? " Estas vacantes coinciden en país, sector y duración. Dentro de las coincidencias, priorizamos las mejor valoradas por las personas usuarias." :
          (selectedOffers.length ? " No hay coincidencia exacta en esta selección; estas ofertas comparten parte de tus criterios." : " Prueba otros filtros o consulta más vacantes en EURES."));

      var list = document.getElementById("recommendation-list");
      if (selectedOffers.length) {
        list.innerHTML = selectedOffers.map(function (offer) {
          var badge = "Coincide con tus filtros";
          if (!exactMatch) {
            var item = scores.find(function (scoreItem) { return scoreItem.offer.id === offer.id && scoreItem.offer.title === offer.title; });
            badge = "Coincide en " + item.score + " de " + activeFilters.length + " preferencias";
          }
          return offerCardHtml(offer, badge);
        }).join("");
      } else {
        list.innerHTML = '<div class="notice">No encontramos ofertas con esos filtros. Prueba con otro país o sector, o consulta <a class="text-link" href="https://eures.europa.eu/index_es" target="_blank" rel="noopener noreferrer">EURES ↗</a>.</div>';
      }
      registerOfferViewTracking(list);

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
    offerForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      var data = new FormData(offerForm);
      var company = String(data.get("company") || "").trim();
      var contact = String(data.get("email") || "").trim();
      var title = String(data.get("title") || "").trim();
      var country = String(data.get("country") || "").trim();
      var location = String(data.get("location") || "").trim();
      var sector = sectorDetails(data.get("sector"));
      var duration = durationDetails(data.get("duration"), offerForm.querySelector('[name="duration"]').selectedOptions[0].textContent);
      var vacancies = Math.max(1, Math.floor(Number(data.get("vacancies") || 1)));
      var activeCompany = currentProfile();
      var packageLabel = data.get("package") === "selection" ? "Apoyo de selección · 149 €" : "Publicación estándar · 49 €";
      var packagePrice = data.get("package") === "selection" ? 149 : 49;
      var sponsored = data.get("sponsor") === "si";
      var estimatedPrice = packagePrice + (sponsored ? 29 : 0);
      var housing = String(data.get("housing") || "No indicado");
      var salary = String(data.get("salary") || "Salario no indicado").trim();
      var language = String(data.get("language") || "").trim();
      var description = String(data.get("description") || "").trim();
      var status = document.getElementById("offer-save-status");
      var previewText = document.getElementById("offer-preview-text");
      try {
        if (!activeCompany || activeCompany.role !== "empresa") throw new Error("Inicia sesión con una cuenta de empresa para publicar la oferta.");
        var offerValues = {
          company: company,
          title: title,
          country: country,
          location: location,
          sectorKey: sector.key,
          sectorLabel: sector.label,
          contractType: duration.values[0],
          durationLabel: duration.label,
          vacancies: vacancies,
          salary: salary,
          housing: housing,
          details: description + (language ? " Idiomas: " + language + "." : ""),
          applicationEmail: contact,
          promotionRequested: sponsored
        };
        if (window.RumboCloud && window.RumboCloud.isConfigured) {
          await window.RumboCloud.createOffer(offerValues);
        } else {
          if (!activeCompany.company || !activeCompany.company.companyName || !activeCompany.company.taxId) throw new Error("Completa primero los datos básicos del perfil de empresa.");
          var storedOffers = [];
          try { storedOffers = JSON.parse(localStorage.getItem("rumboDemoOffers") || "[]"); } catch (error) { storedOffers = []; }
          var offerId = createId();
          storedOffers.unshift({
            id: offerId, isDemo: true, isCompanyOffer: true, ownerEmail: activeCompany.email,
            ownerId: activeCompany.id || "", company: company, title: title, country: country,
            location: location, sector: sector.key, sectorLabel: sector.label,
            durations: duration.values, contractType: duration.values[0], durationLabel: duration.label,
            vacancies: vacancies, salary: salary, housing: housing,
            deadline: "Consulta a la empresa para confirmar disponibilidad.",
            details: description + (language ? " Idiomas: " + language + "." : ""),
            url: "mailto:" + contact, applicationEmail: contact, source: "Rumbo · demostración",
            sponsored: false, promotionRequested: sponsored, packageLabel: packageLabel,
            averageRating: 0, ratingCount: 0, favoritesCount: 0, viewsCount: 0,
            isActive: true, createdAt: new Date().toISOString()
          });
          localStorage.setItem("rumboDemoOffers", JSON.stringify(storedOffers));
        }
        if (previewText) previewText.textContent = "Oferta publicada en Rumbo.\nPuesto: " + title + "\nEmpresa: " + company +
          "\nPaís: " + country + "\nSector: " + sector.label + "\nContrato: " + duration.label +
          "\nAlojamiento: " + housing + "\nSalario: " + salary + "\nServicio: " + packageLabel +
          "\nPromoción: " + (sponsored ? "Solicitada; pendiente de contratación y confirmación" : "No solicitada") +
          "\nTotal orientativo: " + estimatedPrice + " €" +
          "\n\n" + description;
        if (status) status.innerHTML = 'Oferta publicada y visible en Rumbo. <a href="recomendadas.html#mapa">Ver oferta →</a>' +
          (sponsored ? ' <span class="pill gold">Promoción solicitada · pendiente de confirmación</span>' : '');
        document.getElementById("offer-preview").classList.add("visible");
        offerForm.reset();
        renderCollections("cualquiera");
        document.getElementById("offer-preview").scrollIntoView({ behavior: "smooth", block: "nearest" });
      } catch (error) {
        if (status) status.textContent = error.message || "No se pudo publicar la oferta. Inténtalo de nuevo.";
        document.getElementById("offer-preview").classList.add("visible");
      }
    });
  }
}());
