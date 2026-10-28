(function () {
  "use strict";

  document.querySelectorAll(".menu-toggle").forEach(function (button) {
    button.addEventListener("click", function () {
      var nav = document.getElementById(button.getAttribute("aria-controls"));
      if (!nav) return;
      var isOpen = nav.classList.toggle("open");
      button.setAttribute("aria-expanded", String(isOpen));
      button.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    });
  });

  document.querySelectorAll("[data-auth-mode]").forEach(function (button) {
    button.addEventListener("click", function () {
      var signup = button.dataset.authMode === "signup";
      var nameField = document.getElementById("name-field");
      var submit = document.getElementById("auth-submit");
      var heading = document.getElementById("auth-heading");
      var switchText = document.getElementById("auth-switch-text");
      if (!nameField || !submit || !heading || !switchText) return;
      nameField.hidden = !signup;
      nameField.querySelector("input").required = signup;
      submit.textContent = signup ? "Crear cuenta de demostración" : "Entrar en la demo";
      heading.textContent = signup ? "Crea tu cuenta Rumbo" : "Accede a Rumbo";
      switchText.textContent = signup ? "¿Ya tienes cuenta?" : "¿Todavía no tienes cuenta?";
      document.querySelectorAll("[data-auth-mode]").forEach(function (item) {
        item.hidden = item === button;
      });
    });
  });

  var authForm = document.getElementById("auth-form");
  if (authForm) {
    authForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var role = authForm.querySelector('input[name="role"]:checked').value;
      var status = document.getElementById("auth-status");
      status.textContent = "Abriendo la versión de demostración…";
      window.setTimeout(function () {
        window.location.href = role === "empresa" ? "empresas.html" : "candidatos.html";
      }, 350);
    });
    document.querySelectorAll("[data-social-demo]").forEach(function (button) {
      button.addEventListener("click", function () {
        document.getElementById("auth-status").textContent = "El acceso con " + button.dataset.socialDemo + " está dibujado como ejemplo; requiere configurar una autenticación real.";
      });
    });
  }

  var survey = document.getElementById("survey-form");
  if (survey) {
    survey.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(survey);
      var motivations = data.getAll("motivation");
      var reasons = motivations.length ? motivations.join(", ") : "sin motivación seleccionada";
      var accommodation = data.get("accommodation");
      var text = "Tienes " + data.get("age") + " años, buscas en " + data.get("country") +
        " y te interesa " + data.get("sector") + ". Prefieres un contrato " + data.get("duration") +
        "; alojamiento: " + accommodation + ". Te motiva: " + reasons + ".";
      document.getElementById("survey-summary").textContent = text;
      document.getElementById("survey-result").classList.add("visible");
      document.getElementById("survey-result").scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  var offer = document.getElementById("offer-form");
  if (offer) {
    offer.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(offer);
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
