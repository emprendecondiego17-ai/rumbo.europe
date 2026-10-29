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
      var label = isCompany ? "Perfil de mi empresa" : "Mi perfil";
      link.href = isCompany ? "empresas.html" : "perfil.html";
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
    return Object.assign({ id: account.id || "", name: account.name || "", email: account.email || "", phone: "", city: "", destination: "", sector: "", bio: "", avatarDataUrl: "" }, stored);
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
    var photoInput = document.getElementById("profile-photo");
    var photoPreview = document.getElementById("profile-photo-preview");
    async function showPhoto() {
      if (!photoPreview) return;
      var source = data.avatarDataUrl || "";
      if (window.RumboCloud && window.RumboCloud.isConfigured) {
        try { source = await window.RumboCloud.getMyAvatarUrl(); } catch (error) { source = ""; }
      }
      photoPreview.hidden = !source;
      if (source) photoPreview.src = source;
    }
    showPhoto();
    if (photoInput) photoInput.addEventListener("change", function () {
      var file = photoInput.files && photoInput.files[0];
      if (!file) return;
      if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 2000000) {
        document.getElementById("profile-status").textContent = "Elige una imagen JPG, PNG o WEBP de hasta 2 MB.";
        photoInput.value = "";
        return;
      }
      var reader = new FileReader();
      reader.onload = async function () {
        try {
          if (window.RumboCloud && window.RumboCloud.isConfigured) {
            await window.RumboCloud.uploadAvatar(file);
            data.avatarDataUrl = "";
            await showPhoto();
            document.getElementById("profile-status").textContent = "Foto guardada en tu perfil.";
          } else {
            data.avatarDataUrl = String(reader.result || "");
            var profile = getProfileData(account);
            profile.avatarDataUrl = data.avatarDataUrl;
            writeStored(accountKey(PROFILE_PREFIX, account.email), profile);
            await showPhoto();
            document.getElementById("profile-status").textContent = "Foto guardada en este navegador.";
          }
        } catch (error) {
          document.getElementById("profile-status").textContent = error.message || "No se pudo guardar la foto.";
        }
      };
      reader.onerror = function () { document.getElementById("profile-status").textContent = "No se pudo leer la imagen."; };
      reader.readAsDataURL(file);
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
        bio: form.elements.bio.value.trim(),
        avatarDataUrl: data.avatarDataUrl || ""
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

  function initializeCandidateDetail() {
    var card = document.getElementById("candidate-detail-card");
    if (!card) return;
    var account = readSession();
    if (!account || account.role !== "empresa") {
      var query = new URLSearchParams({ next: "candidato-detalle.html", role: "empresa" });
      query.set("candidate", new URLSearchParams(window.location.search).get("candidate") || "");
      query.set("offer", new URLSearchParams(window.location.search).get("offer") || "");
      window.location.replace("acceso.html?" + query.toString());
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var candidateId = params.get("candidate") || "";
    var offerId = params.get("offer") || "";
    var status = document.getElementById("candidate-detail-status");
    var actions = document.getElementById("candidate-detail-actions");

    function section(title, value) {
      if (!value) return "";
      return '<section class="candidate-detail-section"><h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(value).replace(/\n/g, "<br>") + '</p></section>';
    }

    async function load() {
      try {
        var detail;
        if (window.RumboCloud && window.RumboCloud.isConfigured) {
          detail = await window.RumboCloud.getCandidateDetail(candidateId, offerId);
        } else {
          var candidateAccount = readStored(ACCOUNTS_KEY, []).find(function (item) { return item && item.id === candidateId && item.role === "candidato"; });
          var offer = storedCompanyOffers(account).find(function (item) { return offerKey(item) === offerId; });
          if (!candidateAccount || !offer) throw new Error("No encontramos esta persona o esta oferta en este navegador.");
          var profile = readStored(accountKey(PROFILE_PREFIX, candidateAccount.email), {});
          var pipeline = readStored(HIRING_PIPELINE_KEY, []);
          var stageRecord = pipeline.find(function (item) { return normalizedEmail(item.companyEmail) === normalizedEmail(account.email) && normalizedEmail(item.candidateEmail) === normalizedEmail(candidateAccount.email) && item.offerKey === offerId; });
          var application = readStored("rumboApplications", []).find(function (item) { return item.candidateEmail === candidateAccount.email && item.offerKey === offerId; }) || null;
          var fullAllowed = stageRecord && (stageRecord.stage === "proceso" || stageRecord.stage === "contratado");
          var cvData = fullAllowed ? readStored(accountKey(CV_PREFIX, candidateAccount.email), {}) : null;
          var uploaded = fullAllowed ? readStored(accountKey(CV_FILE_PREFIX, candidateAccount.email), null) : null;
          detail = {
            offer: offer,
            candidate: { full_name: profile.name || candidateAccount.name, city: profile.city || "", sector: profile.sector || "", destination: profile.destination || "", bio: profile.bio || "" },
            stage: stageRecord && stageRecord.stage || "",
            application: application,
            full: fullAllowed ? Object.assign({ contact_email: candidateAccount.email, phone: profile.phone || "" }, cvData || {}) : null,
            avatarUrl: profile.avatarDataUrl || "",
            cvUrl: uploaded && uploaded.dataUrl || ""
          };
        }
        var candidate = detail.candidate || {};
        var full = detail.full || null;
        var name = candidate.full_name || candidate.name || "Persona candidata";
        document.getElementById("candidate-detail-name").textContent = name;
        document.getElementById("candidate-detail-offer").textContent = "Oferta: " + ((detail.offer && detail.offer.title) || "");
        document.getElementById("candidate-detail-basics").textContent = [candidate.city, candidate.sector, candidate.destination ? "Destino preferido: " + candidate.destination : ""].filter(Boolean).join(" · ") || "Aún no ha añadido ciudad, sector o destino.";
        document.getElementById("candidate-detail-bio").textContent = candidate.bio || "La persona todavía no ha añadido una presentación.";
        var stageLabel = detail.stage === "contratado" ? "Contratada" : detail.stage === "proceso" ? "En selección" : (detail.application ? "Solicitud recibida" : "Persona interesada");
        document.getElementById("candidate-detail-stage").textContent = stageLabel;
        var avatar = document.getElementById("candidate-detail-avatar");
        var placeholder = document.getElementById("candidate-detail-avatar-placeholder");
        avatar.hidden = !detail.avatarUrl;
        placeholder.hidden = !!detail.avatarUrl;
        if (detail.avatarUrl) avatar.src = detail.avatarUrl;
        else placeholder.textContent = String(name).trim().charAt(0).toUpperCase();
        var sections = full ? section("Resumen profesional", full.cv_summary || full.summary) + section("Experiencia", full.cv_experience || full.experience) + section("Formación", full.cv_education || full.education) + section("Competencias", full.cv_skills || full.skills) + section("Idiomas", full.cv_languages || full.languages) : "";
        if (full) sections += section("Contacto", [full.contact_email || full.email, full.phone].filter(Boolean).join(" · "));
        if (detail.cvUrl) sections += '<section class="candidate-detail-section"><h3>Currículum adjunto</h3><p><a class="button secondary" href="' + escapeHtml(detail.cvUrl) + '" target="_blank" rel="noopener">Abrir o descargar CV</a></p></section>';
        document.getElementById("candidate-detail-sections").innerHTML = sections;
        document.getElementById("candidate-detail-private").hidden = !!full;
        actions.innerHTML = detail.stage === "proceso"
          ? '<button class="button" type="button" data-detail-stage="contratado">Marcar como contratada</button>'
          : detail.stage === "contratado"
            ? '<span class="pill">Empleado/a contratado/a</span>'
            : '<button class="button" type="button" data-detail-stage="proceso">Pasar a selección y ver CV</button>';
        card.hidden = false;
        status.textContent = "";
      } catch (error) {
        status.textContent = error.message || "No se pudo cargar este perfil.";
      }
    }

    actions.addEventListener("click", async function (event) {
      var button = event.target.closest("[data-detail-stage]");
      if (!button) return;
      button.disabled = true;
      try {
        var stage = button.getAttribute("data-detail-stage");
        if (window.RumboCloud && window.RumboCloud.isConfigured) {
          await window.RumboCloud.setCandidateStage(offerId, candidateId, stage);
        } else {
          var accounts = readStored(ACCOUNTS_KEY, []);
          var candidateAccount = accounts.find(function (item) { return item && item.id === candidateId; });
          var candidateEmail = normalizedEmail(candidateAccount && candidateAccount.email);
          if (!candidateEmail) throw new Error("No encontramos la cuenta candidata en este navegador.");
          var pipeline = readStored(HIRING_PIPELINE_KEY, []);
          if (!Array.isArray(pipeline)) pipeline = [];
          var existing = pipeline.find(function (item) { return normalizedEmail(item.companyEmail) === normalizedEmail(account.email) && normalizedEmail(item.candidateEmail) === candidateEmail && item.offerKey === offerId; });
          if (existing) { existing.stage = stage; existing.updatedAt = Date.now(); }
          else pipeline.push({ companyEmail: account.email, candidateEmail: candidateEmail, offerKey: offerId, stage: stage, updatedAt: Date.now() });
          writeStored(HIRING_PIPELINE_KEY, pipeline);
          var applications = readStored("rumboApplications", []);
          applications.forEach(function (item) { if (item.candidateEmail === candidateEmail && item.offerKey === offerId) item.status = stage === "contratado" ? "contratada" : "proceso"; });
          writeStored("rumboApplications", applications);
        }
        await load();
      } catch (error) {
        status.textContent = error.message || "No se pudo actualizar la candidatura.";
        button.disabled = false;
      }
    });
    load();
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
    var activeFilter = "solicitudes";
    var dashboard = { offers: [], favorites: [], views: [], pipeline: [], applications: [], candidates: {} };
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
      if (filter === "solicitudes") return (dashboard.applications || []).filter(function (entry) { return entry.status === "recibida"; });
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
      var candidateId = entry.candidate_id;
      var detailUrl = "candidato-detalle.html?candidate=" + encodeURIComponent(candidateId) + "&offer=" + encodeURIComponent(entry.offer_id);
      var avatar = candidate.avatarUrl ? '<img class="profile-avatar" src="' + escapeHtml(candidate.avatarUrl) + '" alt="Foto de ' + escapeHtml(candidate.full_name || "persona candidata") + '">' : '<span class="profile-avatar profile-avatar-placeholder" aria-hidden="true">' + escapeHtml(String(candidate.full_name || "?").trim().charAt(0).toUpperCase()) + '</span>';
      var actions = '<a class="button secondary" href="' + detailUrl + '">Ver perfil y CV</a>';
      if (filter === "proceso") actions += '<button class="button" type="button" data-candidate-stage="contratado" data-candidate-id="' + escapeHtml(candidateId) + '" data-offer-id="' + escapeHtml(entry.offer_id) + '">Marcar como contratada</button>';
      else if (filter === "contratados") actions += '<button class="button secondary" type="button" data-candidate-stage="proceso" data-candidate-id="' + escapeHtml(candidateId) + '" data-offer-id="' + escapeHtml(entry.offer_id) + '">Reabrir candidatura</button>';
      else if (filter === "solicitudes") actions += '<button class="button" type="button" data-candidate-stage="proceso" data-candidate-id="' + escapeHtml(candidateId) + '" data-offer-id="' + escapeHtml(entry.offer_id) + '">Pasar a selección</button><button class="button secondary" type="button" data-candidate-discard="true" data-candidate-id="' + escapeHtml(candidateId) + '" data-offer-id="' + escapeHtml(entry.offer_id) + '">Descartar</button>';
      else actions += '<button class="button" type="button" data-candidate-stage="proceso" data-candidate-id="' + escapeHtml(candidateId) + '" data-offer-id="' + escapeHtml(entry.offer_id) + '">Pasar a selección</button>';
      return '<article class="surface company-candidate-card"><div class="candidate-card-heading">' + avatar + '<div class="candidate-card-main"><span class="pill">' + escapeHtml(filter === "proceso" ? "En selección" : (filter === "contratados" ? "Contratada" : filter === "solicitudes" ? "Solicitó el puesto" : (filter === "vistos" ? "Vio la oferta" : "Guardó la oferta"))) + '</span><h3>' + escapeHtml(candidate.full_name || "Persona candidata") + '</h3><p class="candidate-offer-title">Interés en: <strong>' + escapeHtml(offer.title || "Oferta") + '</strong> · ' + escapeHtml(offer.company || "Empresa") + ' · ' + escapeHtml(Number(offer.vacancies || 1)) + (Number(offer.vacancies || 1) === 1 ? " vacante" : " vacantes") + '</p></div><span class="candidate-stage-mark" aria-hidden="true">' + (stage === "contratado" ? "✓" : "→") + '</span></div>' +
        (details.length ? '<p class="candidate-profile-line">' + details.map(escapeHtml).join(" · ") + '</p>' : '<p class="candidate-profile-line">La persona aún no ha completado su ciudad, sector o destino.</p>') +
        (candidate.bio ? '<p class="candidate-profile-bio">' + escapeHtml(String(candidate.bio).slice(0, 240)) + (String(candidate.bio).length > 240 ? "…" : "") + '</p>' : '') +
        '<div class="candidate-card-actions">' + actions + '</div></article>';
    }

    function render() {
      var offers = dashboard.offers || [];
      var favorites = uniqueCandidateOfferRows(dashboard.favorites || []);
      var views = dashboard.views || [];
      var pipeline = dashboard.pipeline || [];
      var applications = dashboard.applications || [];
      var values = {
        "company-metric-vacancies": offers.reduce(function (total, offer) { return total + Number(offer.vacancies || 1); }, 0),
        "company-metric-declared": Number(account.company && account.company.vacancyCount || 0),
        "company-metric-offers": offers.filter(function (offer) { return offer.isActive !== false; }).length,
        "company-metric-favorites": distinctCandidateCount(favorites),
        "company-metric-views": views.length,
        "company-metric-applications": applications.filter(function (entry) { return entry.status === "recibida"; }).length,
        "company-metric-process": distinctCandidateCount(pipeline.filter(function (entry) { return entry.stage === "proceso"; })),
        "company-metric-hired": distinctCandidateCount(pipeline.filter(function (entry) { return entry.stage === "contratado"; }))
      };
      Object.keys(values).forEach(function (id) { var node = document.getElementById(id); if (node) node.textContent = String(values[id]); });
      var visibleCounts = {
        "count-favoritos": distinctCandidateCount(recordsFor("favoritos")),
        "count-vistos": distinctCandidateCount(recordsFor("vistos")),
        "count-solicitudes": distinctCandidateCount(recordsFor("solicitudes")),
        "count-proceso": distinctCandidateCount(recordsFor("proceso")),
        "count-contratados": distinctCandidateCount(recordsFor("contratados"))
      };
      Object.keys(visibleCounts).forEach(function (id) { var node = document.getElementById(id); if (node) node.textContent = String(visibleCounts[id]); });
      if (activityPanel) activityPanel.hidden = false;
      var offerList = document.getElementById("company-offers-list");
      var offerEmpty = document.getElementById("company-offers-empty");
      if (offerList) {
        offerList.innerHTML = offers.map(function (offer) {
          var favoriteCount = favorites.filter(function (row) { return row.offer_id === offer.id; }).length;
          var viewCount = views.filter(function (row) { return row.offer_id === offer.id; }).length;
          var applicationCount = applications.filter(function (row) { return row.offer_id === offer.id && row.status !== "descartada"; }).length;
          var hiredCount = pipeline.filter(function (row) { return row.offer_id === offer.id && row.stage === "contratado"; }).length;
          return '<article class="surface company-offer-row"><div><span class="pill">' + escapeHtml(offer.country || "Europa") + '</span><h3>' + escapeHtml(offer.title || "Oferta") + '</h3><p>' + escapeHtml(offer.sectorLabel || "Sector sin indicar") + ' · ' + escapeHtml(offer.location || "Ubicación no indicada") + ' · ' + escapeHtml(Number(offer.vacancies || 1)) + (Number(offer.vacancies || 1) === 1 ? " vacante" : " vacantes") + '</p></div><div class="company-offer-impact"><span><strong>' + viewCount + '</strong> visitas</span><span><strong>' + favoriteCount + '</strong> favoritos</span><span><strong>' + applicationCount + '</strong> solicitudes</span><span><strong>' + hiredCount + '</strong> contrataciones</span></div><a class="text-link" href="candidatos-empresa.html">Gestionar →</a></article>';
        }).join("");
      }
      if (offerEmpty) offerEmpty.hidden = offers.length > 0;
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
      labels.solicitudes = "solicitudes de empleo";
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
        var discard = event.target.closest("[data-candidate-discard]");
        if (discard) {
          try {
            await window.RumboCloud.setApplicationStatus(discard.getAttribute("data-offer-id"), discard.getAttribute("data-candidate-id"), "descartada");
            await refresh();
            if (status) status.textContent = "Solicitud descartada.";
          } catch (error) { if (status) status.textContent = error.message || "No se pudo descartar la solicitud."; }
          return;
        }
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
    var applications = readStored("rumboApplications", []);
    if (!Array.isArray(applications)) applications = [];
    var applicationRecords = [];

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

    function refreshApplicationRecords() {
      applicationRecords.length = 0;
      applications.forEach(function (application) {
        if (!application) return;
        var key = String(application.offerKey || "");
        if (!offerByKey[key] && normalizedEmail(application.offer && application.offer.ownerEmail) === normalizedEmail(account.email)) {
          var matchedOffer = offers.find(function (offer) { return offer.title === application.offer.title; });
          if (matchedOffer) key = offerKey(matchedOffer);
        }
        var email = normalizedEmail(application.candidateEmail);
        var offer = offerByKey[key];
        if (!offer || !email || !accountsByEmail[email]) return;
        applicationRecords.push({ candidateEmail: email, candidateId: application.candidateId || accountsByEmail[email].id || "", offerKey: key, offer: offer, type: "solicitudes", status: application.status || "recibida", createdAt: application.createdAt || "" });
      });
    }
    refreshApplicationRecords();

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
      if (filter === "solicitudes") return applicationRecords.filter(function (record) { return record.status === "recibida"; });
      var source = filter === "vistos" ? viewRecords : favoriteRecords;
      return source.filter(function (record) { return !pipelineStage(record.candidateEmail, record.offerKey); });
    }

    function candidateCard(record, filter) {
      var profile = profileFor(record.candidateEmail);
      var candidateAccount = accountsByEmail[record.candidateEmail] || {};
      var candidateId = record.candidateId || candidateAccount.id || "";
      var details = [profile.city, profile.sector, profile.destination ? "Busca empleo en " + profile.destination : ""].filter(Boolean);
      var stage = pipelineStage(record.candidateEmail, record.offerKey);
      var detailUrl = "candidato-detalle.html?candidate=" + encodeURIComponent(candidateId) + "&offer=" + encodeURIComponent(record.offerKey);
      var avatar = profile.avatarDataUrl ? '<img class="profile-avatar" src="' + escapeHtml(profile.avatarDataUrl) + '" alt="Foto de ' + escapeHtml(profile.name || "persona candidata") + '">' : '<span class="profile-avatar profile-avatar-placeholder" aria-hidden="true">' + escapeHtml(String(profile.name || "?").trim().charAt(0).toUpperCase()) + '</span>';
      var action = '<a class="button secondary" href="' + detailUrl + '">Ver perfil y CV</a>';
      if (filter === "proceso") action += '<button class="button" type="button" data-candidate-stage="contratado" data-candidate-email="' + escapeHtml(record.candidateEmail) + '" data-offer-key="' + escapeHtml(record.offerKey) + '">Marcar como contratada</button>';
      else if (filter === "contratados") action += '<button class="button secondary" type="button" data-candidate-stage="proceso" data-candidate-email="' + escapeHtml(record.candidateEmail) + '" data-offer-key="' + escapeHtml(record.offerKey) + '">Reabrir candidatura</button>';
      else if (filter === "solicitudes") action += '<button class="button" type="button" data-candidate-stage="proceso" data-candidate-email="' + escapeHtml(record.candidateEmail) + '" data-offer-key="' + escapeHtml(record.offerKey) + '">Pasar a selección</button><button class="button secondary" type="button" data-candidate-discard="true" data-candidate-email="' + escapeHtml(record.candidateEmail) + '" data-offer-key="' + escapeHtml(record.offerKey) + '">Descartar</button>';
      else action += '<button class="button" type="button" data-candidate-stage="proceso" data-candidate-email="' + escapeHtml(record.candidateEmail) + '" data-offer-key="' + escapeHtml(record.offerKey) + '">Pasar a selección</button>';
      return '<article class="surface company-candidate-card"><div class="candidate-card-heading">' + avatar + '<div class="candidate-card-main"><span class="pill">' + escapeHtml(filter === "proceso" ? "En selección" : (filter === "contratados" ? "Contratada" : filter === "solicitudes" ? "Solicitó el puesto" : (filter === "vistos" ? "Vio la oferta" : "Guardó la oferta"))) + '</span><h3>' + escapeHtml(profile.name || candidateAccount.name || "Persona candidata") + '</h3><p class="candidate-offer-title">Interés en: <strong>' + escapeHtml(record.offer.title) + '</strong> · ' + escapeHtml(record.offer.company) + ' · ' + escapeHtml(Number(record.offer.vacancies || 1)) + (Number(record.offer.vacancies || 1) === 1 ? " vacante" : " vacantes") + '</p></div><span class="candidate-stage-mark" aria-hidden="true">' + (stage === "contratado" ? "✓" : "→") + '</span></div>' +
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
      var labels = { solicitudes: "solicitudes recibidas", favoritos: "personas que hayan guardado", vistos: "personas que hayan visto", proceso: "candidaturas en selección", contratados: "personas contratadas" };
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
        "company-metric-applications": applicationRecords.filter(function (record) { return record.status === "recibida"; }).length,
        "company-metric-process": uniqueEmails(processRecords).length,
        "company-metric-hired": uniqueEmails(hiredRecords).length
      };
      Object.keys(values).forEach(function (id) { var node = document.getElementById(id); if (node) node.textContent = String(values[id]); });
      var countValues = {
        "count-favoritos": uniqueEmails(recordsFor("favoritos")).length,
        "count-vistos": uniqueEmails(recordsFor("vistos")).length,
        "count-solicitudes": uniqueEmails(recordsFor("solicitudes")).length,
        "count-proceso": uniqueEmails(processRecords).length,
        "count-contratados": uniqueEmails(hiredRecords).length
      };
      Object.keys(countValues).forEach(function (id) { var node = document.getElementById(id); if (node) node.textContent = String(countValues[id]); });
      if (activityPanel) activityPanel.hidden = false;
      var offerList = document.getElementById("company-offers-list");
      var offerEmpty = document.getElementById("company-offers-empty");
      if (offerList) offerList.innerHTML = offers.map(function (offer) {
        var key = offerKey(offer);
        var favoriteCount = favoriteRecords.filter(function (record) { return record.offerKey === key; }).length;
        var viewCount = viewRecords.filter(function (record) { return record.offerKey === key; }).length;
        var applicationCount = applicationRecords.filter(function (record) { return record.offerKey === key && record.status !== "descartada"; }).length;
        var hiredCount = hiredRecords.filter(function (record) { return record.offerKey === key; }).length;
        return '<article class="surface company-offer-row"><div><span class="pill">' + escapeHtml(offer.country || "Europa") + '</span><h3>' + escapeHtml(offer.title || "Oferta") + '</h3><p>' + escapeHtml(offer.sectorLabel || "Sector sin indicar") + ' · ' + escapeHtml(offer.location || "Ubicación no indicada") + ' · ' + escapeHtml(Number(offer.vacancies || 1)) + (Number(offer.vacancies || 1) === 1 ? " vacante" : " vacantes") + '</p></div><div class="company-offer-impact"><span><strong>' + viewCount + '</strong> visitas</span><span><strong>' + favoriteCount + '</strong> favoritos</span><span><strong>' + applicationCount + '</strong> solicitudes</span><span><strong>' + hiredCount + '</strong> contrataciones</span></div><a class="text-link" href="candidatos-empresa.html">Gestionar →</a></article>';
      }).join("");
      if (offerEmpty) offerEmpty.hidden = offers.length > 0;
    }

    updateMetrics();
    window.addEventListener("rumboCompanyProfileUpdated", updateMetrics);
    if (candidateList) {
      var initialFilter = "solicitudes";
      renderCandidateList(initialFilter);
      document.querySelectorAll("[data-candidate-filter]").forEach(function (button) {
        button.addEventListener("click", function () { renderCandidateList(button.getAttribute("data-candidate-filter")); });
      });
      document.addEventListener("click", function (event) {
        var discard = event.target.closest("[data-candidate-discard]");
        if (discard) {
          var discardEmail = normalizedEmail(discard.getAttribute("data-candidate-email"));
          var discardKey = discard.getAttribute("data-offer-key");
          applications.forEach(function (application) {
            if (normalizedEmail(application.candidateEmail) === discardEmail && application.offerKey === discardKey) application.status = "descartada";
          });
          writeStored("rumboApplications", applications);
          var selectedFilter = document.querySelector('[data-candidate-filter][aria-selected="true"]');
          refreshApplicationRecords();
          updateMetrics();
          renderCandidateList(selectedFilter ? selectedFilter.getAttribute("data-candidate-filter") : "solicitudes");
          var discardStatus = document.getElementById("company-candidate-status");
          if (discardStatus) discardStatus.textContent = "Solicitud descartada.";
          return;
        }
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
          applications.forEach(function (application) {
            if (normalizedEmail(application.candidateEmail) === candidateEmail && application.offerKey === key) application.status = stage === "contratado" ? "contratada" : "proceso";
          });
          writeStored("rumboApplications", applications);
          refreshPipelineRecords();
          refreshApplicationRecords();
          updateMetrics();
          var activeTab = document.querySelector('[data-candidate-filter][aria-selected="true"]');
          renderCandidateList(activeTab ? activeTab.getAttribute("data-candidate-filter") : "solicitudes");
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
    initializeCandidateDetail();
    fillCompanyOfferForm();
  }

  if (window.RumboCloud && window.RumboCloud.ready) window.RumboCloud.ready.then(startProfileApp);
  else startProfileApp();
}());
