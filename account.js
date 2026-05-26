(function () {
  const STORAGE_KEY = "computerCornerAccount";
  const modal = document.querySelector("[data-account-modal]");
  const openButton = document.querySelector("[data-account-open]");
  const closeButtons = document.querySelectorAll("[data-account-close]");
  const tabs = document.querySelectorAll("[data-account-tab]");
  const panels = document.querySelectorAll("[data-account-panel]");
  const registerForm = document.querySelector("[data-register-form]");
  const loginForm = document.querySelector("[data-login-form]");
  const profileView = document.querySelector("[data-profile-view]");
  const logoutButton = document.querySelector("[data-account-logout]");
  const accountLabel = document.querySelector("[data-account-label]");

  if (!modal || !openButton) return;

  function loadAccount() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (error) {
      return null;
    }
  }

  function saveAccount(account) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
  }

  function showPanel(name) {
    tabs.forEach((tab) => {
      const isActive = tab.dataset.accountTab === name;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });

    panels.forEach((panel) => {
      panel.hidden = panel.dataset.accountPanel !== name;
    });
  }

  function renderProfile() {
    const account = loadAccount();
    if (!account) {
      accountLabel.textContent = "Cuenta";
      profileView.innerHTML = '<p class="account-empty">Aún no tienes una sesión iniciada.</p>';
      showPanel("login");
      return;
    }

    accountLabel.textContent = account.name.split(" ")[0] || "Perfil";
    profileView.innerHTML = `
      <div class="profile-summary">
        <span>${account.name.charAt(0).toUpperCase()}</span>
        <div>
          <strong>${escapeHtml(account.name)}</strong>
          <small>${escapeHtml(account.email)}</small>
        </div>
      </div>
      <dl>
        <div><dt>Documento</dt><dd>${escapeHtml(`${account.documentType || "DNI"} ${account.document || "No registrado"}`)}</dd></div>
        <div><dt>Teléfono</dt><dd>${escapeHtml(account.phone || "No registrado")}</dd></div>
      </dl>
    `;
    showPanel("profile");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formValue(form, name) {
    return form.querySelector(`[name="${name}"]`)?.value.trim() || "";
  }

  function onlyDigits(input, maxLength) {
    input.value = input.value.replace(/\D/g, "").slice(0, maxLength);
  }

  function expectedDocumentLength(type) {
    return type === "RUC" ? 11 : 8;
  }

  function syncDocumentField(form) {
    const type = form.querySelector("[data-document-type]")?.value || "DNI";
    const documentInput = form.querySelector("[data-document-number]");
    if (!documentInput) return;

    const length = expectedDocumentLength(type);
    documentInput.maxLength = length;
    documentInput.placeholder = `${length} dígitos`;
    onlyDigits(documentInput, length);
  }

  function setupValidation(form) {
    if (!form) return;

    const documentType = form.querySelector("[data-document-type]");
    const documentInput = form.querySelector("[data-document-number]");
    const phoneInput = form.querySelector("[data-phone-number]");

    documentType?.addEventListener("change", () => syncDocumentField(form));
    documentInput?.addEventListener("input", () => syncDocumentField(form));
    phoneInput?.addEventListener("input", () => onlyDigits(phoneInput, 9));
    syncDocumentField(form);
  }

  function validateRegisterForm(form) {
    const documentType = formValue(form, "documentType") || "DNI";
    const documentInput = form.querySelector("[data-document-number]");
    const phoneInput = form.querySelector("[data-phone-number]");
    const documentLength = expectedDocumentLength(documentType);

    documentInput?.setCustomValidity("");
    phoneInput?.setCustomValidity("");

    if (documentInput && documentInput.value.length !== documentLength) {
      documentInput.setCustomValidity(`${documentType} debe tener ${documentLength} dígitos numéricos.`);
      documentInput.reportValidity();
      return false;
    }

    if (phoneInput && phoneInput.value.length !== 9) {
      phoneInput.setCustomValidity("El número celular debe tener 9 dígitos.");
      phoneInput.reportValidity();
      return false;
    }

    return true;
  }

  function openModal() {
    renderProfile();
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeModal() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    openButton.focus();
  }

  openButton.addEventListener("click", openModal);
  closeButtons.forEach((button) => button.addEventListener("click", closeModal));

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => showPanel(tab.dataset.accountTab));
  });

  registerForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateRegisterForm(registerForm)) return;
    const account = {
      name: formValue(registerForm, "name"),
      documentType: formValue(registerForm, "documentType") || "DNI",
      document: formValue(registerForm, "document"),
      email: formValue(registerForm, "email"),
      countryCode: formValue(registerForm, "countryCode") || "+51",
      phone: `${formValue(registerForm, "countryCode") || "+51"} ${formValue(registerForm, "phone")}`,
    };
    saveAccount(account);
    registerForm.reset();
    renderProfile();
  });

  loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = formValue(loginForm, "email");
    const account = loadAccount();
    if (account && account.email.toLowerCase() === email.toLowerCase()) {
      loginForm.reset();
      renderProfile();
      return;
    }
    showPanel("register");
  });

  logoutButton?.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    renderProfile();
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.hasAttribute("data-account-close")) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.getAttribute("aria-hidden") === "false") {
      closeModal();
    }
  });

  setupValidation(registerForm);
  renderProfile();
})();
