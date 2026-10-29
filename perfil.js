(function () {
  "use strict";

  var PROFILE_PREFIX = "rumboUserProfile:";
  var SAVED_PREFIX = "rumboSavedOffers:";
  var CV_PREFIX = "rumboCvData:";
  var CV_FILE_PREFIX = "rumboCvFile:";
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
      var label = isCompany ? "Mi empresa" : "Mi perfil";
      link.href = isCompany ? "empresas.html" : "perfil.html";
      link.classList.add("profile-nav-link");
      link.setAttribute("aria-label", label);
      link.setAttribute("title", label);
      link.innerHTML = '<span class="profile-nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="8" r="3.4"></circle><path d="M5.5 20a6.5 6.5 0 0 1 13 0"></path></svg></span><span class="sr-only">' + label + '</span>';
    });
  }

  function getProfileData(account) {
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

    form.addEventListener("submit", function (event) {
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
      sessionStorage.removeItem("rumboDemoProfile");
      localStorage.removeItem("rumboDemoProfile");
      window.location.href = "index.html";
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
      '<div class="offer-meta"><span>' + escapeHtml(offer.sectorLabel) + '</span><span>' + escapeHtml(offer.durationLabel) + '</span></div>' +
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

  function initializeSavedOffers() {
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
    var cvKey = accountKey(CV_PREFIX, account.email);
    var fileKey = accountKey(CV_FILE_PREFIX, account.email);
    var cvData = readStored(cvKey, {});
    ["summary", "experience", "education", "skills", "languages"].forEach(function (field) {
      if (form.elements[field]) form.elements[field].value = cvData[field] || "";
    });

    var fileInput = document.getElementById("cv-file");
    var fileStatus = document.getElementById("cv-upload-status");
    var currentFile = document.getElementById("cv-upload-current");
    var downloadFile = document.getElementById("cv-download-upload");
    var removeFile = document.getElementById("cv-remove-upload");
    function showUploadedFile() {
      var file = readStored(fileKey, null);
      if (!file || !downloadFile || !currentFile) {
        if (currentFile) currentFile.hidden = true;
        return;
      }
      downloadFile.href = file.dataUrl;
      downloadFile.download = file.name;
      downloadFile.textContent = "Descargar " + file.name;
      currentFile.hidden = false;
    }
    showUploadedFile();

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var updated = {};
      ["summary", "experience", "education", "skills", "languages"].forEach(function (field) {
        updated[field] = form.elements[field].value.trim();
      });
      try {
        writeStored(cvKey, updated);
        document.getElementById("cv-status").textContent = "Tu CV se ha guardado en este navegador.";
      } catch (error) {
        document.getElementById("cv-status").textContent = "No se pudo guardar el CV. Comprueba el espacio disponible.";
      }
    });

    if (fileInput) fileInput.addEventListener("change", function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      if (!/\.(pdf|doc|docx)$/i.test(file.name)) {
        fileStatus.textContent = "Elige un archivo PDF o Word (.doc/.docx).";
        fileInput.value = "";
        return;
      }
      if (file.size > MAX_CV_FILE_BYTES) {
        fileStatus.textContent = "El archivo ocupa más de 1,5 MB. Reduce su tamaño y vuelve a intentarlo.";
        fileInput.value = "";
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

    if (removeFile) removeFile.addEventListener("click", function () {
      localStorage.removeItem(fileKey);
      if (fileInput) fileInput.value = "";
      showUploadedFile();
      fileStatus.textContent = "Se ha eliminado el CV guardado en este navegador.";
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
      ["companyName", "taxId", "country", "legalForm", "address", "phone", "website"].forEach(function (field) {
        if (form.elements[field]) form.elements[field].value = company[field] || "";
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
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var updatedCompany = {
        companyName: form.elements.companyName.value.trim(),
        taxId: form.elements.taxId.value.trim().toUpperCase(),
        country: form.elements.country.value,
        legalForm: form.elements.legalForm.value.trim(),
        address: form.elements.address.value.trim(),
        phone: form.elements.phone.value.trim(),
        website: form.elements.website.value.trim(),
        contactEmail: account.email
      };
      try {
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
    if (form.elements.company && !form.elements.company.value) form.elements.company.value = company.companyName || "";
    if (form.elements.email && !form.elements.email.value) form.elements.email.value = company.contactEmail || account.email || "";
  }

  accountControls();
  initializeProfileEditor();
  initializeCvBuilder();
  initializeSavedOffers();
  initializeCompanyProfile();
  fillCompanyOfferForm();
}());
