(function () {
  "use strict";

  var PROFILE_PREFIX = "rumboUserProfile:";
  var SAVED_PREFIX = "rumboSavedOffers:";
  var CV_PREFIX = "rumboCvData:";
  var CV_FILE_PREFIX = "rumboCvFile:";
  var OFFER_VIEWS_KEY = "rumboOfferViews";
  var HIRING_PIPELINE_KEY = "rumboHiringPipeline";
  var DEMO_OFFERS_KEY = "rumboDemoOffers";
  var ACCOUNTS_KEY = "rumboDemoAccounts";
  var MAX_CV_FILE_BYTES = 1500000;

  function readSession() {
    try { return JSON.parse(sessionStorage.getItem("rumboDemoProfile") || localStorage.getItem("rumboDemoProfile") || "null"); } catch (error) { return null; }
  }

  function accountKey(prefix, email) {
    return prefix + encodeURIComponent(String(email || "").trim().toLowerCase());
  }

  function readStored(key, fallback) {
    try {
      var value = JSON.parse(localStorage.getItem(key) || "null");
      return value == null ? fallback : value;
    } catch (error) { return fallback; }
  }

  function writeStored(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character];
    });
  }

  function requireCandidate() {
    var account = readSession();
    if (!account || account.role !== "candidato") {
      var page = window.location.pathname.split("/").pop() || "perfil.html";
      var query = new URLSearchParams({ next: page, role: "candidato" });
      window.location.replace("acceso.html?" + query.toString());
      return null;
    }
    return account;
  }

  function accountControls() {
    var account = readSession();
    document.querySelectorAll("[data-account-control]").forEach(function (link) {
      link.classList.remove("nav-cta", "profile-nav-link");
      if (!account) {
        link.href = "acceso.html?access=1";
        link.classList.add("nav-cta");
        link.textContent = "Acceder / crear cuenta";
        link.removeAttribute("aria-label");
        link.removeAttribute("title");
        return;
      }

      var isCompany = account.role === "empresa";
      var label = isCompany ? "Candidatos de mi empresa" : "Mi perfil";
      link.href = isCompany ? "candidatos-empresa.html" : "perfil.html";
      link.classList.add("profile-nav-link");
      link.setAttribute("aria-label", label);
      link.setAttribute("title", label);
      link.innerHTML = '<span class="profile-nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="8" r="3.4"></circle><path d="M5.5 20a6.5 6.5 0 0 1 13 0"></path></svg></span><span class="sr-only">' + label + '</span>';
    });
  }

  document.querySelectorAll("[data-logout]").forEach(function (button) {
    button.addEventListener("click", function () {
      if (window.RumboCloud && window.RumboCloud.isConfigured) window.RumboCloud.signOut().catch(function () { window.location.href = "index.html"; });
      else { sessionStorage.removeItem("rumboDemoProfile"); localStorage.removeItem("rumboDemoProfile"); window.location.href = "index.html"; }
    });
  });

  function getProfileData(account) {
    if (window.RumboCloud && window.RumboCloud.isConfigured) return window.RumboCloud.getCurrentProfile() || account;
    var stored = readStored(accountKey(PROFILE_PREFIX, account.email), {});
    return Object.assign({ name: account.name || "", email: account.email || "", phone: "", city: "", destination: "", sector: "", bio: "" }, stored);
  }

  function initializeProfileEditor() {
    var form = document.getElementById("profile-form");
    if (!form) return;
    var account = requireCandidate();
    if (!account) return;
    var data = getProfileData(account);
    ["name", "email", "phone", "city", "destination", "sector", "bio"].forEach(function (field) {
      var input = form.elements[field];
      if (input) input.value = data[field] || "";
    });

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      var updated = {
        name: form.elements.name.value.trim(),
        email: account.email,
        phone: form.elements.phone.value.trim(),
        city: form.elements.city.value.trim(),
        destination: form.elements.destination.value.trim(),
        sector: form.elements.sector.value,
        bio: form.elements.bio.value.trim()
      };
      try {
        if (window.RumboCloud && window.RumboCloud.isConfigured) {
          await window.RumboCloud.updateProfile(updated);
          document.getElementById("profile-status").textContent = "Perfil guardado en tu cuenta Rumbo.";
          accountControls();
          return;
        }
        writeStored(accountKey(PROFILE_PREFIX, account.email), updated);
        var sessionAccount = readSession();
        sessionAccount.name = updated.name;
        sessionStorage.setItem("rumboDemoProfile", JSON.stringify(sessionAccount));
        localStorage.setItem("rumboDemoProfile", JSON.stringify(sessionAccount));
        var accounts = readStored("rumboDemoAccounts", []);
        var savedAccount = accounts.find(function (item) { return item.email === account.email && item.role === "candidato"; });
        if (savedAccount) {
          savedAccount.name = updated.name;
          writeStored("rumboDemoAccounts", accounts);
        }
        accountControls();
        document.getElementById("profile-status").textContent = "Perfil guardado en este navegador.";
      } catch (error) {
        document.getElementById("profile-status").textContent = "No se pudo guardar. Comprueba el espacio disponible en el navegador.";
      }
    });

    var logout = document.getElementById("logout-button");
    if (logout) logout.addEventListener("click", function () {
      if (window.RumboCloud && window.RumboCloud.isConfigured) window.RumboCloud.signOut().catch(function () { window.location.href = "index.html"; });
      else { sessionStorage.removeItem("rumboDemoProfile"); localStorage.removeItem("rumboDemoProfile"); window.location.href = "index.html"; }
    });
  }

  function getSavedOffers(account) {
    return readStored(accountKey(SAVED_PREFIX, account.email), []);
  }

  function setSavedButton(button, isSaved) {
    button.setAttribute("aria-pressed", String(isSaved));
    button.classList.toggle("is-saved", isSaved);
    button.textContent = isSaved ? "★ Guardada · quitar" : "☆ Guardar oferta";
  }

  function refreshSavedButtons() {
    var account = readSession();
    if (!account || account.role !== "candidato") return;
    var saved = getSavedOffers(account);
    document.querySelectorAll("[data-save-offer]").forEach(function (button) {
      setSavedButton(button, saved.some(function (offer) { return offer.key === button.getAttribute("data-save-offer"); }));
    });
  }

  function safeOfferUrl(url) {
    var value = String(url || "");
    return /^https:\/\//i.test(value) || /^mailto:/i.test(value) ? value : "#";
  }

  function savedOfferCard(offer) {
    var link = safeOfferUrl(offer.url);
    var payload = JSON.stringify(offer);
    return '<article class="surface offer-card">' +
      '<div class="offer-head"><div><h3>' + escapeHtml(offer.title) + '</h3><div class="offer-company">' + escapeHtml(offer.company) + ' · ' + escapeHtml(offer.location || "Ubicación no indicada") + '</div></div><span class="pill">' + escapeHtml(offer.country) + '</span></div>' +
      '<div class="offer-meta"><span>' + escapeHtml(offer.sectorLabel) + '</span><span>' + escapeHtml(offer.durationLabel) + '</span><span>Vacantes: ' + escapeHtml(offer.vacancies || 1) + '</span></div>' +
      '<p class="offer-details">' + escapeHtml(offer.details) + '</p>' +
      '<div class="offer-bottom"><strong>' + escapeHtml(offer.salary || "Salario no indicado") + '</strong><div class="offer-actions">' +
      '<a href="' + escapeHtml(link) + '" ' + (link.charAt(0) === "#" ? '' : 'target="_blank" rel="noopener noreferrer"') + '>Ver anuncio ↗</a>' +
      '<button class="save-offer is-saved" type="button" data-save-offer="' + escapeHtml(offer.key) + '" data-offer="' + escapeHtml(payload) + '" aria-pressed="true">★ Guardada · quitar</button></div></div></article>';
  }

  function renderSavedOffers() {
    var list = document.getElementById("saved-offers");
    if (!list) return;
    var empty = document.getElementById("saved-offers-empty");
    var account = requireCandidate();
    if (!account) return;
    var saved = getSavedOffers(account);
    list.innerHTML = saved.map(savedOfferCard).join("");
    if (empty) empty.hidden = saved.length > 0;
  }

  function initializeCloudSavedOffers() {
    var list = document.getElementById("saved-offers");
    var empty = document.getElementById("saved-offers-empty");
    var status = document.getElementById("saved-status");
    async function refresh() {
      try {
        var ids = await window.RumboCloud.loadFavoriteIds();
        document.querySelectorAll("[data-save-offer]").forEach(function (button) {
          setSavedButton(button, ids.indexOf(button.getAttribute("data-save-offer")) !== -1);
        });
        if (list) {
          var saved = await window.RumboCloud.getSavedOffers();
          list.innerHTML = saved.map(savedOfferCard).join("");
          if (empty) empty.hidden = saved.length > 0;
        }
      } catch (error) {
        if (status) status.textContent = error.message || "No se pudieron cargar tus ofertas guardadas.";
      }
    }
    if (list || document.querySelector("[data-save-offer]")) refresh();
    document.addEventListener("click", async function (event) {
      var button = event.target.closest("[data-save-offer]");
      if (!button) return;
      var account = requireCandidate();
      if (!account) return;
      var offerId = button.getAttribute("data-save-offer");
      button.disabled = true;
      try {
        var saved = await window.RumboCloud.toggleFavorite(offerId);
        setSavedButton(button, saved);
        await refresh();
        if (status) status.textContent = saved ? "Oferta guardada en tu cuenta." : "Oferta retirada de tus guardadas.";
      } catch (error) {
        var feedback = button.closest(".offer-card") && button.closest(".offer-card").querySelector(".save-status");
        if (feedback) feedback.textContent = error.message || "No se pudo actualizar el favorito.";
        if (status) status.textContent = error.message || "No se pudo actualizar el favorito.";
      } finally {
        button.disabled = false;
      }
    });
    window.RumboCloud.subscribeCandidateData(function () {
      if (list || document.querySelector("[data-save-offer]")) refresh();
    });
    window.addEventListener("rumbo:offers", function () {
      if (list || document.querySelector("[data-save-offer]")) refresh();
    });
  }

  function initializeSavedOffers() {
    if (window.RumboCloud && window.RumboCloud.isConfigured) {
      initializeCloudSavedOffers();
      return;
    }
    refreshSavedButtons();
    renderSavedOffers();
    document.addEventListener("click", function (event) {
      var button = event.target.closest("[data-save-offer]");
      if (!button) return;
      var account = requireCandidate();
      if (!account) return;
      var key = button.getAttribute("data-save-offer");
      var saved = getSavedOffers(account);
      var index = saved.findIndex(function (offer) { return offer.key === key; });
      try {
        if (index >= 0) {
          saved.splice(index, 1);
        } else {
          var offer = JSON.parse(button.getAttribute("data-offer") || "{}");
          if (!offer.key || offer.key !== key) throw new Error("Oferta no válida");
          offer.savedAt = Date.now();
          saved.unshift(offer);
        }
        writeStored(accountKey(SAVED_PREFIX, account.email), saved);
        refreshSavedButtons();
        renderSavedOffers();
        var status = document.getElementById("saved-status");
        if (status) status.textContent = index >= 0 ? "Oferta retirada de tus guardadas." : "Oferta guardada en tu perfil.";
      } catch (error) {
        var statusMessage = document.getElementById("saved-status");
        if (statusMessage) statusMessage.textContent = "No se pudo actualizar la lista de ofertas.";
      }
    });
  }

  function initializeCvBuilder() {
    var form = document.getElementById("cv-builder-form");
    if (!form) return;
    var account = requireCandidate();
    if (!account) return;
    var cloudMode = !!(window.RumboCloud && window.RumboCloud.isConfigured);
    var cvKey = accountKey(CV_PREFIX, account.email);
    var fileKey = accountKey(CV_FILE_PREFIX, account.email);
    var currentProfile = cloudMode ? window.RumboCloud.getCurrentProfile() || account : null;
    var cvData = cloudMode ? currentProfile : readStored(cvKey, {});
    ["summary", "experience", "education", "skills", "languages"].forEach(function (field) {
      if (form.elements[field]) form.elements[field].value = cvData[field] || "";
    });

    var fileInput = document.getElementById("cv-file");
    var fileStatus = document.getElementById("cv-upload-status");
    var currentFile = document.getElementById("cv-upload-current");
    var downloadFile = document.getElementById("cv-download-upload");
    var removeFile = document.getElementById("cv-remove-upload");
    async function showUploadedFile() {
      var file = cloudMode ? (currentProfile && currentProfile.cvPath ? { name: currentProfile.cvName } : null) : readStored(fileKey, null);
      if (!file || !downloadFile || !currentFile) {
        if (currentFile) currentFile.hidden = true;
        return;
      }
      if (cloudMode) {
        try { downloadFile.href = await window.RumboCloud.getCvDownloadUrl(); }
        catch (error) { fileStatus.textContent = "No se pudo preparar la descarga segura del CV."; return; }
      } else downloadFile.href = file.dataUrl;
      downloadFile.download = file.name;
      downloadFile.textContent = "Descargar " + file.name;
      currentFile.hidden = false;
    }
    showUploadedFile();

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      var updated = {};
      ["summary", "experience", "education", "skills", "languages"].forEach(function (field) {
        updated[field] = form.elements[field].value.trim();
      });
      try {
        if (cloudMode) {
          currentProfile = await window.RumboCloud.saveCvData(updated);
          document.getElementById("cv-status").textContent = "Tu CV se ha guardado en tu cuenta Rumbo.";
          return;
        }
        writeStored(cvKey, updated);
        document.getElementById("cv-status").textContent = "Tu CV se ha guardado en este navegador.";
      } catch (error) {
        document.getElementById("cv-status").textContent = "No se pudo guardar el CV. Comprueba el espacio disponible.";
      }
    });

    if (fileInput) fileInput.addEventListener("change", async function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      if (!/\.(pdf|doc|docx)$/i.test(file.name)) {
        fileStatus.textContent = "Elige un archivo PDF o Word (.doc/.docx).";
        fileInput.value = "";
        return;
      }
      if (file.size > (cloudMode ? 5000000 : MAX_CV_FILE_BYTES)) {
        fileStatus.textContent = cloudMode ? "El archivo ocupa más de 5 MB. Reduce su tamaño y vuelve a intentarlo." : "El archivo ocupa más de 1,5 MB. Reduce su tamaño y vuelve a intentarlo.";
        fileInput.value = "";
        return;
      }
      if (cloudMode) {
        fileStatus.textContent = "Subiendo el CV a tu espacio privado…";
        try {
          currentProfile = await window.RumboCloud.uploadCv(file);
          await showUploadedFile();
          fileStatus.textContent = "CV guardado en tu cuenta privada.";
        } catch (error) {
          fileStatus.textContent = error.message || "No se pudo guardar el CV.";
        }
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        try {
          writeStored(fileKey, { name: file.name, type: file.type || "application/octet-stream", dataUrl: reader.result, size: file.size });
          showUploadedFile();
          fileStatus.textContent = "CV guardado solo en este navegador.";
        } catch (error) {
          fileStatus.textContent = "No se pudo guardar el archivo. Prueba con un CV más pequeño.";
        }
      };
      reader.onerror = function () { fileStatus.textContent = "No se pudo leer el archivo."; };
      reader.readAsDataURL(file);
    });

    if (removeFile) removeFile.addEventListener("click", async function () {
      if (cloudMode) {
        try { currentProfile = await window.RumboCloud.removeCv(); }
        catch (error) { fileStatus.textContent = error.message || "No se pudo eliminar el CV."; return; }
      } else localStorage.removeItem(fileKey);
      if (fileInput) fileInput.value = "";
      await showUploadedFile();
      fileStatus.textContent = cloudMode ? "CV eliminado de tu cuenta Rumbo." : "Se ha eliminado el CV guardado en este navegador.";
    });

    var printButton = document.getElementById("cv-print");
    var preview = document.getElementById("cv-preview");
    function cvSection(title, value) {
      if (!value) return "";
      return '<section><h2>' + escapeHtml(title) + '</h2><p>' + escapeHtml(value).replace(/\n/g, "<br>") + '</p></section>';
    }
    if (printButton && preview) printButton.addEventListener("click", function () {
      var profile = getProfileData(account);
      var values = {};
      ["summary", "experience", "education", "skills", "languages"].forEach(function (field) { values[field] = form.elements[field].value.trim(); });
      preview.innerHTML = '<header><h1>' + escapeHtml(profile.name) + '</h1><p>' + [profile.email, profile.phone, profile.city].filter(Boolean).map(escapeHtml).join(" · ") + '</p></header>' +
        cvSection("Perfil profesional", values.summary) + cvSection("Experiencia", values.experience) + cvSection("Formación", values.education) + cvSection("Competencias", values.skills) + cvSection("Idiomas", values.languages);
      preview.hidden = false;
      document.body.classList.add("printing-cv");
      window.setTimeout(function () { window.print(); }, 100);
    });
    window.addEventListener("afterprint", function () {
      document.body.classList.remove("printing-cv");
      if (preview) preview.hidden = true;
    });
  }

  function initializeCompanyProfile() {
    var panel = document.getElementById("company-profile-panel");
    var form = document.getElementById("company-profile-form");
    var account = readSession();
    if (!panel || !form || !account || account.role !== "empresa") return;
    panel.hidden = false;
    var summary = document.getElementById("company-profile-summary");
    var edit = document.getElementById("company-profile-edit");
    var cancel = document.getElementById("company-profile-cancel");
    var status = document.getElementById("company-profile-status");
    var data = account.company || {};

    function fillForm(company) {
      ["companyName", "taxId", "country", "legalForm", "address", "phone", "website", "vacancyCount"].forEach(function (field) {
        if (form.elements[field]) form.elements[field].value = company[field] == null ? "" : company[field];
      });
    }
    function showSummary(company) {
      var hasMinimumData = !!(company.companyName && company.taxId && company.country && company.address && company.phone);
      if (summary) summary.hidden = !hasMinimumData;
      form.hidden = hasMinimumData;
      if (edit) edit.hidden = !hasMinimumData;
      if (cancel) cancel.hidden = true;
      if (!hasMinimumData) return;
      document.getElementById("company-summary-name").textContent = company.companyName;
      document.getElementById("company-summary-tax").textContent = (company.legalForm ? company.legalForm + " · " : "") + company.taxId + " · " + company.country;
      document.getElementById("company-summary-address").textContent = company.address;
      document.getElementById("company-summary-contact").textContent = "Contacto: " + account.email + " · " + company.phone + (company.website ? " · " + company.website : "");
      var vacancySummary = document.getElementById("company-summary-vacancies");
      if (vacancySummary) vacancySummary.textContent = Number(company.vacancyCount || 0) + " vacantes declaradas por la empresa";
    }
    fillForm(data);
    showSummary(data);

    if (edit) edit.addEventListener("click", function () {
      form.hidden = false;
      if (summary) summary.hidden = true;
      edit.hidden = true;
      if (cancel) cancel.hidden = false;
      status.textContent = "";
    });
    if (cancel) cancel.addEventListener("click", function () {
      fillForm(data);
      showSummary(data);
      status.textContent = "";
    });
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      var updatedCompany = {
        companyName: form.elements.companyName.value.trim(),
        taxId: form.elements.taxId.value.trim().toUpperCase(),
        country: form.elements.country.value,
        legalForm: form.elements.legalForm.value.trim(),
        address: form.elements.address.value.trim(),
        phone: form.elements.phone.value.trim(),
        website: form.elements.website.value.trim(),
        contactEmail: account.email,
        vacancyCount: Math.max(0, Math.floor(Number(form.elements.vacancyCount.value || 0)))
      };
      try {
        if (window.RumboCloud && window.RumboCloud.isConfigured) {
          account = await window.RumboCloud.updateCompany(updatedCompany);
          data = account.company || updatedCompany;
          showSummary(data);
          status.textContent = "Datos de empresa guardados en tu cuenta Rumbo.";
          accountControls();
          window.dispatchEvent(new Event("rumboCompanyProfileUpdated"));
          return;
        }
        var accounts = readStored("rumboDemoAccounts", []);
        var storedAccount = accounts.find(function (item) { return item.email === account.email && item.role === "empresa"; });
        if (storedAccount) {
          storedAccount.company = updatedCompany;
          writeStored("rumboDemoAccounts", accounts);
        }
        account.company = updatedCompany;
        sessionStorage.setItem("rumboDemoProfile", JSON.stringify(account));
        localStorage.setItem("rumboDemoProfile", JSON.stringify(account));
        data = updatedCompany;
        showSummary(data);
        status.textContent = "Datos de empresa guardados en este navegador.";
        accountControls();
        window.dispatchEvent(new Event("rumboCompanyProfileUpdated"));
      } catch (error) {
        status.textContent = "No se pudieron guardar los datos. Comprueba el espacio disponible en el navegador.";
      }
    });
  }

  function fillCompanyOfferForm() {
    var account = readSession();
    var form = document.getElementById("offer-form");
    if (!form || !account || account.role !== "empresa") return;
    var company = account.company || {};
    if (form.elements.company) {
      form.elements.company.value = company.companyName || "";
      form.elements.company.readOnly = true;
    }
    if (form.elements.email) {
      form.elements.email.value = account.email || company.contactEmail || "";
      form.elements.email.readOnly = true;
    }
  }

  function normalizedEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function offerKey(offer) {
    return String(offer && (offer.id || offer.url || ((offer.company || "") + "-" + (offer.title || ""))) || "");
  }

  function storedCompanyOffers(account) {
    var savedOffers = readStored(DEMO_OFFERS_KEY, []);
    var email = normalizedEmail(account.email);
    return (Array.isArray(savedOffers) ? savedOffers : []).filter(function (offer) {
      var owner = normalizedEmail(offer && (offer.ownerEmail || offer.contactEmail));
      return offer && offer.isDemo === true && offer.title && owner === email;
    });
  }

  function uniqueEmails(records) {
    var values = {};
    records.forEach(function (record) { if (record.candidateEmail) values[record.candidateEmail] = true; });
    return Object.keys(values);
  }

  function initializeRealtimeCompanyDashboard(activityPanel, candidateList) {
    var account = readSession();
    if (!account || account.role !== "empresa") return;
    var activeFilter = "favoritos";
    var dashboard = { offers: [], favorites: [], views: [], pipeline: [], candidates: {} };
    var status = document.getElementById("company-candidate-status");

    function distinctCandidateCount(records) {
      var ids = {};
      records.forEach(function (record) { ids[record.candidate_id] = true; });
      return Object.keys(ids).length;
    }

    function stageFor(candidateId, offerId) {
      var entry = dashboard.pipeline.find(function (item) { return item.candidate_id === candidateId && item.offer_id === offerId; });
      return entry ? entry.stage : "";
    }

    function uniqueCandidateOfferRows(rows) {
      var found = {};
      return rows.filter(function (row) {
        var key = row.candidate_id + "|" + row.offer_id;
        if (found[key]) return false;
        found[key] = true;
        return true;
      });
    }

    function recordsFor(filter) {
      var source = filter === "vistos" ? dashboard.views : dashboard.favorites;
      if (filter === "proceso" || filter === "contratados") {
        return dashboard.pipeline.filter(function (entry) { return entry.stage === (filter === "proceso" ? "proceso" : "contratado"); });
      }
      return uniqueCandidateOfferRows(source).filter(function (entry) { return !stageFor(entry.candidate_id, entry.offer_id); });
    }

    function makeCandidateCard(entry, filter) {
      var candidate = dashboard.candidates[entry.candidate_id] || {};
      var offer = dashboard.offers.find(function (item) { return item.id === entry.offer_id; }) || {};
      var stage = stageFor(entry.candidate_id, entry.offer_id);
      var details = [candidate.city, candidate.sector, candidate.destination ? "Busca empleo en " + candidate.destination : ""].filter(Boolean);
      var buttonText = filter === "proceso" ? "Marcar como contratada" : (filter === "contratados" ? "Reabrir candidatura" : "Pasar a selección");
      var nextStage = filter === "proceso" || filter === "vistos" || filter === "favoritos" ? "contratado" : "proceso";
      if (filter === "favoritos" || filter === "vistos") { buttonText = "Pasar a selección"; nextStage = "proceso"; }
      if (filter === "proceso") { buttonText = "Marcar como contratada"; nextStage = "contratado"; }
      if (filter === "contratados") { buttonText = "Reabrir candidatura"; nextStage = "proceso"; }
      return '<article class="surface company-candidate-card"><div class="candidate-card-heading"><div><span class="pill">' + escapeHtml(filter === "proceso" ? "En selección" : (filter === "contratados" ? "Contratada" : (filter === "vistos" ? "Vio la oferta" : "Guardó la oferta"))) + '</span><h3>' + escapeHtml(candidate.full_name || "Persona candidata") + '</h3><p class="candidate-offer-title">Interés en: <strong>' + escapeHtml(offer.title || "Oferta") + '</strong> · ' + escapeHtml(offer.company || "Empresa") + ' · ' + escapeHtml(Number(offer.vacancies || 1)) + (Number(offer.vacancies || 1) === 1 ? " vacante" : " vacantes") + '</p></div><span class="candidate-stage-mark" aria-hidden="true">' + (stage === "contratado" ? "✓" : "→") + '</span></div>' +
        (details.length ? '<p class="candidate-profile-line">' + details.map(escapeHtml).join(" · ") + '</p>' : '<p class="candidate-profile-line">La persona aún no ha completado su ciudad, sector o destino.</p>') +
        (candidate.bio ? '<p class="candidate-profile-bio">' + escapeHtml(String(candidate.bio).slice(0, 240)) + (String(candidate.bio).length > 240 ? "…" : "") + '</p>' : '') +
        '<div class="candidate-card-actions"><button class="button' + (nextStage === "proceso" ? " secondary" : "") + '" type="button" data-candidate-stage="' + nextStage + '" data-candidate-id="' + escapeHtml(entry.candidate_id) + '" data-offer-id="' + escapeHtml(entry.offer_id) + '">' + buttonText + '</button></div></article>';
    }

    function render() {
      var offers = dashboard.offers || [];
      var favorites = uniqueCandidateOfferRows(dashboard.favorites || []);
      var views = dashboard.views || [];
      var pipeline = dashboard.pipeline || [];
      var values = {
        "company-metric-vacancies": offers.reduce(function (total, offer) { return total + Number(offer.vacancies || 1); }, 0),
        "company-metric-declared": Number(account.company && account.company.vacancyCount || 0),
        "company-metric-offers": offers.filter(function (offer) { return offer.isActive !== false; }).length,
        "company-metric-favorites": distinctCandidateCount(favorites),
        "company-metric-views": views.length,
        "company-metric-process": distinctCandidateCount(pipeline.filter(function (entry) { return entry.stage === "proceso"; })),
        "company-metric-hired": distinctCandidateCount(pipeline.filter(function (entry) { return entry.stage === "contratado"; }))
      };
      Object.keys(values).forEach(function (id) { var node = document.getElementById(id); if (node) node.textContent = String(values[id]); });
      var visibleCounts = {
        "count-favoritos": distinctCandidateCount(recordsFor("favoritos")),
        "count-vistos": distinctCandidateCount(recordsFor("vistos")),
        "count-proceso": distinctCandidateCount(recordsFor("proceso")),
        "count-contratados": distinctCandidateCount(recordsFor("contratados"))
      };
      Object.keys(visibleCounts).forEach(function (id) { var node = document.getElementById(id); if (node) node.textContent = String(visibleCounts[id]); });
      if (activityPanel) activityPanel.hidden = false;
      if (!candidateList) return;
      var rows = recordsFor(activeFilter);
      candidateList.innerHTML = rows.map(function (entry) { return makeCandidateCard(entry, activeFilter); }).join("");
      document.querySelectorAll("[data-candidate-filter]").forEach(function (button) {
        var active = button.getAttribute("data-candidate-filter") === activeFilter;
        button.setAttribute("aria-selected", String(active));
        button.classList.toggle("is-active", active);
      });
      var empty = document.getElementById("company-candidate-empty");
      var emptyTitle = document.getElementById("company-candidate-empty-title");
      var labels = { favoritos: "personas que hayan guardado ofertas", vistos: "personas que hayan visitado ofertas", proceso: "candidaturas en selección", contratados: "personas contratadas" };
      if (empty) empty.hidden = rows.length > 0;
      if (emptyTitle) emptyTitle.textContent = "Todavía no hay " + (labels[activeFilter] || "personas") + " en esta sección.";
      if (status) status.textContent = rows.length + (rows.length === 1 ? " candidatura visible." : " candidaturas visibles.");
    }

    async function refresh() {
      try {
        dashboard = await window.RumboCloud.getCompanyDashboard();
        var current = window.RumboCloud.getCurrentProfile();
        if (current) account = current;
        render();
      } catch (error) {
        if (status) status.textContent = error.message || "No se pudo cargar la actividad de tus ofertas.";
      }
    }

    if (candidateList) {
      document.querySelectorAll("[data-candidate-filter]").forEach(function (button) {
        button.addEventListener("click", function () { activeFilter = button.getAttribute("data-candidate-filter"); render(); });
      });
      document.addEventListener("click", async function (event) {
        var button = event.target.closest("[data-candidate-stage]");
        if (!button) return;
        try {
          await window.RumboCloud.setCandidateStage(button.getAttribute("data-offer-id"), button.getAttribute("data-candidate-id"), button.getAttribute("data-candidate-stage"));
          await refresh();
          if (status) status.textContent = button.getAttribute("data-candidate-stage") === "contratado" ? "Candidatura marcada como contratada." : "Candidatura pasada a selección.";
        } catch (error) {
          if (status) status.textContent = error.message || "No se pudo actualizar el estado de la candidatura.";
        }
      });
    }
    refresh();
    window.addEventListener("rumboCompanyProfileUpdated", refresh);
    var refreshTimer = null;
    window.RumboCloud.subscribeCompanyData(function () {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(refresh, 180);
    });
  }

  function initializeCompanyDashboard() {
    var activityPanel = document.getElementById("company-activity-overview");
    var candidateList = document.getElementById("company-candidate-list");
    if (!activityPanel && !candidateList) return;
    var account = readSession();
    if (!account || account.role !== "empresa") return;
    if (window.RumboCloud && window.RumboCloud.isConfigured) {
      initializeRealtimeCompanyDashboard(activityPanel, candidateList);
      return;
    }

    var offers = storedCompanyOffers(account);
    var offerByKey = {};
    offers.forEach(function (offer) { offerByKey[offerKey(offer)] = offer; });

    var storage = window.localStorage;
    var allAccounts = readStored(ACCOUNTS_KEY, []);
    var candidateAccounts = (Array.isArray(allAccounts) ? allAccounts : []).filter(function (item) { return item && item.role === "candidato"; });
    var accountsByEmail = {};
    candidateAccounts.forEach(function (item) { accountsByEmail[normalizedEmail(item.email)] = item; });
    var favoriteRecords = [];
    var views = readStored(OFFER_VIEWS_KEY, []);
    var viewRecords = [];

    function addRecord(records, candidateEmail, key, type) {
      var email = normalizedEmail(candidateEmail);
      var offer = offerByKey[key];
      if (!offer || !email || !accountsByEmail[email]) return;
      if (!records.some(function (record) { return record.candidateEmail === email && record.offerKey === key; })) {
        records.push({ candidateEmail: email, offerKey: key, offer: offer, type: type });
      }
    }

    for (var index = 0; index < storage.length; index += 1) {
      var storageKey = storage.key(index) || "";
      if (storageKey.indexOf(SAVED_PREFIX) !== 0) continue;
      var candidateEmail;
      try { candidateEmail = decodeURIComponent(storageKey.slice(SAVED_PREFIX.length)); } catch (error) { continue; }
      var saved = readStored(storageKey, []);
      (Array.isArray(saved) ? saved : []).forEach(function (savedOffer) {
        if (!savedOffer) return;
        var key = String(savedOffer.key || "");
        var matchedOffer = offerByKey[key];
        if (!matchedOffer) {
          matchedOffer = offers.find(function (offer) {
            return offer.company === savedOffer.company && offer.title === savedOffer.title;
          });
          if (matchedOffer) key = offerKey(matchedOffer);
        }
        addRecord(favoriteRecords, candidateEmail, key, "favoritos");
      });
    }

    (Array.isArray(views) ? views : []).forEach(function (view) {
      if (!view) return;
      var key = String(view.offerKey || "");
      var owner = normalizedEmail(view.ownerEmail);
      if (!offerByKey[key] && owner === normalizedEmail(account.email)) {
        var matchedOffer = offers.find(function (offer) { return offerKey(offer) === key; });
        if (matchedOffer) key = offerKey(matchedOffer);
      }
      addRecord(viewRecords, view.candidateEmail, key, "vistos");
    });

    var pipeline = readStored(HIRING_PIPELINE_KEY, []);
    if (!Array.isArray(pipeline)) pipeline = [];
    var companyPipeline = pipeline.filter(function (item) { return item && normalizedEmail(item.companyEmail) === normalizedEmail(account.email); });
    function pipelineStage(candidate, key) {
      var item = companyPipeline.find(function (entry) { return normalizedEmail(entry.candidateEmail) === candidate && entry.offerKey === key; });
      return item ? item.stage : "";
    }

    var processRecords = [];
    var hiredRecords = [];
    function refreshPipelineRecords() {
      companyPipeline = pipeline.filter(function (item) { return item && normalizedEmail(item.companyEmail) === normalizedEmail(account.email); });
      processRecords = [];
      hiredRecords = [];
      companyPipeline.forEach(function (entry) {
        var stage = entry.stage;
        if ((stage !== "proceso" && stage !== "contratado") || !offerByKey[entry.offerKey]) return;
        addRecord(stage === "proceso" ? processRecords : hiredRecords, entry.candidateEmail, entry.offerKey, stage);
      });
    }
    refreshPipelineRecords();

    function profileFor(email) {
      var candidateAccount = accountsByEmail[email] || {};
      var profile = readStored(accountKey(PROFILE_PREFIX, email), {});
      return Object.assign({ name: candidateAccount.name || "Persona candidata", city: "", destination: "", sector: "", bio: "" }, profile);
    }

    function recordsFor(filter) {
      if (filter === "proceso") return processRecords;
      if (filter === "contratados") return hiredRecords;
      var source = filter === "vistos" ? viewRecords : favoriteRecords;
      return source.filter(function (record) { return !pipelineStage(record.candidateEmail, record.offerKey); });
    }

    function candidateCard(record, filter) {
      var profile = profileFor(record.candidateEmail);
      var details = [profile.city, profile.sector, profile.destination ? "Busca empleo en " + profile.destination : ""].filter(Boolean);
      var stage = pipelineStage(record.candidateEmail, record.offerKey);
      var action = "";
      if (filter === "proceso") action = '<button class="button" type="button" data-candidate-stage="contratado" data-candidate-email="' + escapeHtml(record.candidateEmail) + '" data-offer-key="' + escapeHtml(record.offerKey) + '">Marcar como contratada</button>';
      else if (filter === "contratados") action = '<button class="button secondary" type="button" data-candidate-stage="proceso" data-candidate-email="' + escapeHtml(record.candidateEmail) + '" data-offer-key="' + escapeHtml(record.offerKey) + '">Reabrir candidatura</button>';
      else action = '<button class="button secondary" type="button" data-candidate-stage="proceso" data-candidate-email="' + escapeHtml(record.candidateEmail) + '" data-offer-key="' + escapeHtml(record.offerKey) + '">Pasar a selección</button>';
      return '<article class="surface company-candidate-card"><div class="candidate-card-heading"><div><span class="pill">' + escapeHtml(filter === "proceso" ? "En selección" : (filter === "contratados" ? "Contratada" : (filter === "vistos" ? "Vio la oferta" : "Oferta guardada"))) + '</span><h3>' + escapeHtml(profile.name || "Persona candidata") + '</h3><p class="candidate-offer-title">Interés en: <strong>' + escapeHtml(record.offer.title) + '</strong> · ' + escapeHtml(record.offer.company) + ' · ' + escapeHtml(Number(record.offer.vacancies || 1)) + (Number(record.offer.vacancies || 1) === 1 ? " vacante" : " vacantes") + '</p></div><span class="candidate-stage-mark" aria-hidden="true">' + (stage === "contratado" ? "✓" : "→") + '</span></div>' +
        (details.length ? '<p class="candidate-profile-line">' + details.map(escapeHtml).join(" · ") + '</p>' : '<p class="candidate-profile-line">Aún no ha completado ciudad, sector o destino en su perfil.</p>') +
        (profile.bio ? '<p class="candidate-profile-bio">' + escapeHtml(String(profile.bio).slice(0, 240)) + (String(profile.bio).length > 240 ? "…" : "") + '</p>' : '') + '<div class="candidate-card-actions">' + action + '</div></article>';
    }

    function renderCandidateList(filter) {
      if (!candidateList) return;
      var currentRecords = recordsFor(filter);
      candidateList.innerHTML = currentRecords.map(function (record) { return candidateCard(record, filter); }).join("");
      document.querySelectorAll("[data-candidate-filter]").forEach(function (button) {
        var active = button.getAttribute("data-candidate-filter") === filter;
        button.setAttribute("aria-selected", String(active));
        button.classList.toggle("is-active", active);
      });
      var empty = document.getElementById("company-candidate-empty");
      var title = document.getElementById("company-candidate-empty-title");
      var status = document.getElementById("company-candidate-status");
      var labels = { favoritos: "personas que hayan guardado", vistos: "personas que hayan visto", proceso: "candidaturas en selección", contratados: "personas contratadas" };
      if (empty) empty.hidden = currentRecords.length > 0;
      if (title) title.textContent = currentRecords.length ? "" : "Todavía no hay " + (labels[filter] || "personas") + " en esta sección.";
      if (status) status.textContent = currentRecords.length + (currentRecords.length === 1 ? " candidatura en esta sección." : " candidaturas en esta sección.");
    }

    function updateMetrics() {
      var vacancyTotal = offers.reduce(function (total, offer) { return total + Math.max(1, Math.floor(Number(offer.vacancies || 1))); }, 0);
      var latestAccount = readSession();
      var declaredVacancies = Number(latestAccount && latestAccount.company && latestAccount.company.vacancyCount || 0);
      var values = {
        "company-metric-vacancies": vacancyTotal,
        "company-metric-declared": declaredVacancies,
        "company-metric-offers": offers.length,
        "company-metric-favorites": uniqueEmails(favoriteRecords).length,
        "company-metric-views": uniqueEmails(viewRecords).length,
        "company-metric-process": uniqueEmails(processRecords).length,
        "company-metric-hired": uniqueEmails(hiredRecords).length
      };
      Object.keys(values).forEach(function (id) { var node = document.getElementById(id); if (node) node.textContent = String(values[id]); });
      var countValues = {
        "count-favoritos": uniqueEmails(recordsFor("favoritos")).length,
        "count-vistos": uniqueEmails(recordsFor("vistos")).length,
        "count-proceso": uniqueEmails(processRecords).length,
        "count-contratados": uniqueEmails(hiredRecords).length
      };
      Object.keys(countValues).forEach(function (id) { var node = document.getElementById(id); if (node) node.textContent = String(countValues[id]); });
      if (activityPanel) activityPanel.hidden = false;
    }

    updateMetrics();
    window.addEventListener("rumboCompanyProfileUpdated", updateMetrics);
    if (candidateList) {
      var initialFilter = "favoritos";
      renderCandidateList(initialFilter);
      document.querySelectorAll("[data-candidate-filter]").forEach(function (button) {
        button.addEventListener("click", function () { renderCandidateList(button.getAttribute("data-candidate-filter")); });
      });
      document.addEventListener("click", function (event) {
        var button = event.target.closest("[data-candidate-stage]");
        if (!button) return;
        var candidateEmail = normalizedEmail(button.getAttribute("data-candidate-email"));
        var key = button.getAttribute("data-offer-key");
        var stage = button.getAttribute("data-candidate-stage");
        var record = pipeline.find(function (item) { return normalizedEmail(item.companyEmail) === normalizedEmail(account.email) && normalizedEmail(item.candidateEmail) === candidateEmail && item.offerKey === key; });
        if (record) { record.stage = stage; record.updatedAt = Date.now(); }
        else pipeline.push({ companyEmail: normalizedEmail(account.email), candidateEmail: candidateEmail, offerKey: key, stage: stage, updatedAt: Date.now() });
        try {
          writeStored(HIRING_PIPELINE_KEY, pipeline);
          refreshPipelineRecords();
          updateMetrics();
          var activeTab = document.querySelector('[data-candidate-filter][aria-selected="true"]');
          renderCandidateList(activeTab ? activeTab.getAttribute("data-candidate-filter") : "favoritos");
          var status = document.getElementById("company-candidate-status");
          if (status) status.textContent = stage === "contratado" ? "Candidatura marcada como contratada." : "Candidatura añadida al proceso de selección.";
        } catch (error) {
          var status = document.getElementById("company-candidate-status");
          if (status) status.textContent = "No se pudo guardar el cambio en este navegador.";
        }
      });
    }
  }

  function startProfileApp() {
    accountControls();
    initializeProfileEditor();
    initializeCvBuilder();
    initializeSavedOffers();
    initializeCompanyProfile();
    initializeCompanyDashboard();
    fillCompanyOfferForm();
  }

  if (window.RumboCloud && window.RumboCloud.ready) window.RumboCloud.ready.then(startProfileApp);
  else startProfileApp();
}());
