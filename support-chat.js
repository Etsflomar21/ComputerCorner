(function () {
  const chat = document.querySelector("[data-support-chat]");
  if (!chat) return;

  const toggle = document.querySelector("[data-support-toggle]");
  const close = chat.querySelector("[data-support-close]");
  const form = chat.querySelector("[data-support-form]");
  const input = chat.querySelector("[data-support-input]");
  const messages = chat.querySelector("[data-support-messages]");
  const emailLink = chat.querySelector("[data-support-email]");
  const quickButtons = chat.querySelectorAll("[data-support-topic]");
  const email = "computer-corner@outlook.com";
  let transcript = [];

  function addMessage(text, type) {
    const bubble = document.createElement("p");
    bubble.className = `support-message ${type}`;
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
    transcript.push(`${type === "user" ? "Cliente" : "Soporte"}: ${text}`);
  }

  function updateEmailLink() {
    const subject = encodeURIComponent("Consulta desde el chat de Computer Corner");
    const body = encodeURIComponent([
      "Hola Computer Corner, escribo desde el chat de la página.",
      "",
      ...transcript,
    ].join("\n"));
    emailLink.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  function openChat() {
    chat.classList.add("is-open");
    chat.setAttribute("aria-hidden", "false");
    toggle?.setAttribute("aria-expanded", "true");
    input?.focus();
  }

  function closeChat() {
    chat.classList.remove("is-open");
    chat.setAttribute("aria-hidden", "true");
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.focus();
  }

  function handleText(text) {
    const value = text.trim();
    if (!value) return;

    addMessage(value, "user");
    addMessage("Gracias. Déjame tu consulta con el mayor detalle posible; puedes enviarla por correo desde este chat para que una persona la revise.", "agent");
    updateEmailLink();
  }

  toggle?.addEventListener("click", () => {
    if (chat.classList.contains("is-open")) {
      closeChat();
    } else {
      openChat();
    }
  });

  close?.addEventListener("click", closeChat);

  quickButtons.forEach((button) => {
    button.addEventListener("click", () => {
      handleText(button.dataset.supportTopic || button.textContent);
    });
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    handleText(input.value);
    input.value = "";
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && chat.classList.contains("is-open")) {
      closeChat();
    }
  });

  updateEmailLink();
})();
