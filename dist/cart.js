(function () {
  const WHATSAPP_NUMBER = "51918260798";
  const STORAGE_KEY = "computerCornerCart";

  const cartButton = document.querySelector(".cart-button");
  const cartDrawer = document.querySelector("#cart-drawer");
  const cartClose = document.querySelector(".cart-close");
  const cartItems = document.querySelector("#cart-items");
  const cartCount = document.querySelector("#cart-count");
  const checkoutButton = document.querySelector("#checkout-button");
  const clearButton = document.querySelector("#clear-cart");
  const receiptModal = document.querySelector("[data-receipt-modal]");
  const receiptPreview = document.querySelector("#receipt-preview");
  const sendOrder = document.querySelector("#send-order");
  const printReceipt = document.querySelector("#print-receipt");
  const closeReceiptButtons = document.querySelectorAll("[data-close-receipt]");
  const paymentDetails = document.querySelectorAll("[data-payment-detail]");

  if (!cartButton || !cartDrawer || !cartItems || !cartCount || !checkoutButton || !clearButton) {
    return;
  }

  let cart = loadCart();
  let toastTimeout;

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (error) {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function productNameFrom(card) {
    return card.querySelector("h3")?.textContent.trim() || "Producto";
  }

  function productCategoryFrom(card) {
    const block = card.closest(".catalog-block");
    return block?.querySelector(".catalog-heading h3")?.textContent.trim() || "Catálogo";
  }

  function addBuyButtons() {
    document.querySelectorAll(".product-card").forEach((card) => {
      if (card.querySelector(".buy-button")) return;

      const name = productNameFrom(card);
      const category = productCategoryFrom(card);
      const button = document.createElement("button");
      button.className = "buy-button";
      button.type = "button";
      button.textContent = "Comprar";
      button.addEventListener("click", () => addToCart({ name, category }));
      card.appendChild(button);
    });

    const romPanel = document.querySelector(".phone-rom-panel");
    if (romPanel && !romPanel.querySelector(".buy-button")) {
      const button = document.createElement("button");
      button.className = "buy-button";
      button.type = "button";
      button.textContent = "Comprar";
      button.addEventListener("click", () =>
        addToCart({
          name: "ROM y flasheo de celulares Android",
          category: "Servicio técnico Android",
        })
      );
      romPanel.querySelector(".phone-rom-content")?.appendChild(button);
    }
  }

  function addToCart(product) {
    const found = cart.find((item) => item.name === product.name);
    if (found) {
      found.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    renderCart();
    showToast(`${product.name} agregado al carrito`);
    openCart();
  }

  function removeFromCart(name) {
    cart = cart.filter((item) => item.name !== name);
    saveCart();
    renderCart();
  }

  function updateQuantity(name, amount) {
    const item = cart.find((entry) => entry.name === name);
    if (!item) return;
    item.quantity += amount;
    if (item.quantity <= 0) {
      removeFromCart(name);
      return;
    }
    saveCart();
    renderCart();
  }

  function renderCart() {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = String(total);
    cartButton.setAttribute("aria-label", `Abrir carrito, ${total} productos`);

    if (!cart.length) {
      cartItems.innerHTML = '<p class="cart-empty">Todavía no agregaste productos.</p>';
      checkoutButton.disabled = true;
      return;
    }

    checkoutButton.disabled = false;
    cartItems.innerHTML = cart
      .map(
        (item) => `
          <article class="cart-item">
            <div>
              <strong>${escapeHtml(item.name)}</strong>
              <span>${escapeHtml(item.category)}</span>
            </div>
            <div class="cart-qty">
              <button type="button" data-action="decrease" data-name="${escapeHtml(item.name)}">−</button>
              <span>${item.quantity}</span>
              <button type="button" data-action="increase" data-name="${escapeHtml(item.name)}">+</button>
              <button type="button" data-action="remove" data-name="${escapeHtml(item.name)}">Quitar</button>
            </div>
          </article>
        `
      )
      .join("");
  }

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function selectedPayment() {
    return document.querySelector('input[name="payment"]:checked')?.value || "Pasarela segura con tarjeta";
  }

  function selectedPaymentType() {
    return document.querySelector('input[name="payment"]:checked')?.dataset.paymentMethod || "card";
  }

  function fieldValue(selector, fallback = "Por completar") {
    return document.querySelector(selector)?.value.trim() || fallback;
  }

  function receiptNumber() {
    const date = new Date();
    return `CC-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}`;
  }

  function billingData() {
    return {
      name: fieldValue("#billing-name"),
      document: fieldValue("#billing-document"),
      email: fieldValue("#billing-email"),
      payment: selectedPayment(),
      paymentType: selectedPaymentType(),
      yapeOperation: fieldValue("#yape-operation", "Pendiente"),
      yapePhone: fieldValue("#yape-phone", "Pendiente"),
    };
  }

  function orderLines() {
    return cart.map((item, index) => ({
      index: index + 1,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
    }));
  }

  function buildReceipt(data, number) {
    const rows = orderLines()
      .map(
        (item) => `
          <tr>
            <td>${item.index}</td>
            <td><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.category)}</span></td>
            <td>${item.quantity}</td>
            <td>Por confirmar</td>
          </tr>
        `
      )
      .join("");

    const paymentMeta =
      data.paymentType === "yape"
        ? `<p><strong>Operación Yape:</strong> ${escapeHtml(data.yapeOperation)}</p><p><strong>Celular Yape:</strong> ${escapeHtml(data.yapePhone)}</p>`
        : `<p><strong>Pasarela:</strong> Link seguro pendiente de generación.</p>`;

    return `
      <div class="receipt-head">
        <div>
          <p class="section-kicker">Pre-boleta de venta</p>
          <h2 id="receipt-title">Pedido ${escapeHtml(number)}</h2>
          <p>Documento preliminar. La boleta oficial se emite al confirmar disponibilidad y pago.</p>
        </div>
        <strong>Computer Corner</strong>
      </div>
      <div class="receipt-meta">
        <p><strong>Cliente:</strong> ${escapeHtml(data.name)}</p>
        <p><strong>DNI/RUC:</strong> ${escapeHtml(data.document)}</p>
        <p><strong>Correo:</strong> ${escapeHtml(data.email)}</p>
        <p><strong>Pago:</strong> ${escapeHtml(data.payment)}</p>
        ${paymentMeta}
      </div>
      <table class="receipt-table">
        <thead><tr><th>#</th><th>Producto</th><th>Cant.</th><th>Importe</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="receipt-total"><span>Total</span><strong>Por confirmar</strong></div>
    `;
  }

  function buildWhatsappMessage(data, number) {
    const products = orderLines()
      .map((item) => `${item.index}. ${item.name} x${item.quantity} (${item.category})`)
      .join("\n");

    const paymentDetail =
      data.paymentType === "yape"
        ? `Operación Yape: ${data.yapeOperation}\nCelular Yape: ${data.yapePhone}`
        : "Solicito link de pasarela segura para pagar con tarjeta.";

    return [
      `Hola Computer Corner, generé la pre-boleta ${number}.`,
      "",
      "Datos para boleta:",
      `Cliente: ${data.name}`,
      `DNI/RUC: ${data.document}`,
      `Correo: ${data.email}`,
      "",
      "Productos:",
      products,
      "",
      `Forma de pago: ${data.payment}`,
      paymentDetail,
      "",
      "Por favor confirma disponibilidad, importe final y emisión de la boleta.",
    ].join("\n");
  }

  function openReceipt(data, number) {
    if (!receiptModal || !receiptPreview || !sendOrder) return;
    receiptPreview.innerHTML = buildReceipt(data, number);
    sendOrder.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsappMessage(data, number))}`;
    receiptModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeReceipt() {
    receiptModal?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    checkoutButton?.focus();
  }

  function syncPaymentDetails() {
    const type = selectedPaymentType();
    paymentDetails.forEach((detail) => {
      detail.hidden = detail.dataset.paymentDetail !== type;
    });
  }

  function checkout() {
    if (!cart.length) return;
    const data = billingData();
    const number = receiptNumber();
    openReceipt(data, number);
    return;

    const products = cart
      .map((item, index) => `${index + 1}. ${item.name} x${item.quantity} (${item.category})`)
      .join("\n");

    const message = [
      "Hola Computer Corner, quiero comprar estos productos:",
      products,
      `Forma de pago: ${selectedPayment()}`,
      "Por favor indícame disponibilidad, precio final y pasos para continuar.",
    ].join("\n\n");

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
  }

  function openCart() {
    cartDrawer.setAttribute("aria-hidden", "false");
    cartClose?.focus();
  }

  function closeCart() {
    cartDrawer.setAttribute("aria-hidden", "true");
    cartButton?.focus();
  }

  function showToast(message) {
    let toast = document.querySelector(".cart-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "cart-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.dataset.visible = "true";
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => {
      toast.dataset.visible = "false";
    }, 2200);
  }

  cartButton?.addEventListener("click", openCart);
  cartClose?.addEventListener("click", closeCart);
  checkoutButton?.addEventListener("click", checkout);
  printReceipt?.addEventListener("click", () => window.print());
  closeReceiptButtons.forEach((button) => button.addEventListener("click", closeReceipt));
  document.querySelector('[data-payment-method="card"]')?.click();
  document.querySelectorAll('input[name="payment"]').forEach((input) => {
    input.addEventListener("change", syncPaymentDetails);
  });
  clearButton?.addEventListener("click", () => {
    cart = [];
    saveCart();
    renderCart();
  });

  cartDrawer?.addEventListener("click", (event) => {
    if (event.target === cartDrawer) closeCart();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && cartDrawer.getAttribute("aria-hidden") === "false") {
      closeCart();
    }
    if (event.key === "Escape" && receiptModal?.getAttribute("aria-hidden") === "false") {
      closeReceipt();
    }
  });

  cartItems?.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    const name = button.dataset.name;
    if (button.dataset.action === "increase") updateQuantity(name, 1);
    if (button.dataset.action === "decrease") updateQuantity(name, -1);
    if (button.dataset.action === "remove") removeFromCart(name);
  });

  addBuyButtons();
  syncPaymentDetails();
  renderCart();
})();
