(function () {
  "use strict";

  var ACCOUNT_KEY = "rumboDemoAccounts";
  var HASH_ITERATIONS = 120000;

  document.querySelectorAll(".menu-toggle").forEach(function (button) {
    button.addEventListener("click", function () {
      var nav = document.getElementById(button.getAttribute("aria-controls"));
      if (!nav) return;
      var isOpen = nav.classList.toggle("open");
      button.setAttribute("aria-expanded", String(isOpen));
      button.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    });
  });

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
      throw new Error("Para crear la cuenta de prueba, abre la web publicada en GitHub Pages con https.");
    }
    var key = await window.crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
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
      sessionStorage.setItem("rumboDemoProfile", JSON.stringify({
        name: account.name,
        email: account.email,
        role: account.role
      }));
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
        : "Escribe el correo y la contraseña que usaste al registrarte en este navegador.";
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
          if (password !== confirmation) {
            throw new Error("Las contraseñas no coinciden. Comprueba las dos casillas.");
          }
          if (accounts.some(function (item) { return item.email === email; })) {
            throw new Error("Ya existe una cuenta de prueba con ese correo en este navegador. Inicia sesión.");
          }
          var salt = createSalt();
          account = {
            name: name,
            email: email,
            role: role,
            salt: salt,
            passwordHash: await passwordHash(password, salt)
          };
          accounts.push(account);
          localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));
          status.textContent = "Cuenta creada. Entrando en Rumbo…";
        } else {
          account = accounts.find(function (item) { return item.email === email; });
          if (!account) {
            throw new Error("No encuentro una cuenta de prueba con ese correo en este navegador. Pulsa «Crear cuenta».");
          }
          var enteredHash = await passwordHash(password, account.salt);
          if (enteredHash !== account.passwordHash) {
            throw new Error("La contraseña no coincide. Vuelve a intentarlo.");
          }
          status.textContent = "Sesión iniciada. Entrando en Rumbo…";
        }
        document.getElementById("password").value = "";
        document.getElementById("confirm-password").value = "";
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
      var motivations = data.getAll("motivation");
      var reasons = motivations.length ? motivations.join(", ") : "sin motivación seleccionada";
      var text = "Tienes " + data.get("age") + " años, buscas en " + data.get("country") +
        " y te interesa " + data.get("sector") + ". Prefieres un contrato " + data.get("duration") +
        "; alojamiento: " + data.get("accommodation") + ". Te motiva: " + reasons + ".";
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
