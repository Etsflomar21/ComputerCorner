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
  const billingDocumentType = document.querySelector("#billing-document-type");
  const billingDocument = document.querySelector("#billing-document");
  const billingName = document.querySelector("#billing-name");
  const billingEmail = document.querySelector("#billing-email");
  const qrModal = document.querySelector("[data-qr-modal]");
  const qrTitle = document.querySelector("#qr-modal-title");
  const qrImage = document.querySelector("#qr-modal-image");
  const qrCloseButtons = document.querySelectorAll("[data-qr-close]");
  const productInfoModal = document.querySelector("[data-product-info-modal]");
  const productInfoTitle = document.querySelector("#product-info-title");
  const productInfoCategory = document.querySelector("#product-info-category");
  const productInfoImage = document.querySelector("#product-info-image");
  const productInfoPrice = document.querySelector("#product-info-price");
  const productInfoDescription = document.querySelector("#product-info-description");
  const productInfoDetails = document.querySelector("#product-info-details");
  const productInfoConsult = document.querySelector("#product-info-consult");
  const productInfoCloseButtons = document.querySelectorAll("[data-product-info-close]");

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

  function priceFromText(value) {
    const price = Number(String(value || "").replace(/[^\d.]/g, ""));
    return Number.isFinite(price) ? price : 0;
  }

  function productPriceFrom(card) {
    return priceFromText(card.querySelector(".price-badge")?.textContent);
  }

  function formatMoney(value) {
    return `S/ ${Number(value || 0).toFixed(2)}`;
  }

  function lineSubtotal(item) {
    return Number(item.price || 0) * Number(item.quantity || 0);
  }

  function cartSubtotal() {
    return cart.reduce((sum, item) => sum + lineSubtotal(item), 0);
  }

  function normalizeCartPrices() {
    const cards = [...document.querySelectorAll(".product-card")];
    const romPrice = priceFromText(document.querySelector(".phone-rom-panel .price-badge")?.textContent);
    cart = cart.map((item) => {
      if (Number(item.price) > 0) return item;
      if (item.name === "ROM y flasheo de celulares Android") {
        return { ...item, price: romPrice };
      }
      const card = cards.find((entry) => productNameFrom(entry) === item.name);
      return { ...item, price: card ? productPriceFrom(card) : Number(item.price || 0) };
    });
    saveCart();
  }

  function productCategoryFrom(card) {
    const block = card.closest(".catalog-block");
    return block?.querySelector(".catalog-heading h3")?.textContent.trim() || "Catálogo";
  }

  function productInfoFrom(card) {
    const details = [...card.querySelectorAll(".product-details li")].map((item) => item.textContent.trim());
    return {
      name: productNameFrom(card),
      category: productCategoryFrom(card),
      image: card.querySelector(".product-thumb-img")?.getAttribute("src") || "",
      imageAlt: card.querySelector(".product-thumb-img")?.getAttribute("alt") || "",
      price: card.querySelector(".price-badge")?.textContent.trim() || formatMoney(productPriceFrom(card)),
      description: card.querySelector(":scope > p")?.textContent.trim() || "Consulta disponibilidad, compatibilidad e instalacion antes de comprar.",
      details,
      consultHref: card.querySelector("a")?.href || `https://wa.me/${WHATSAPP_NUMBER}`,
    };
  }

  function addProductInfoButtons() {
    document.querySelectorAll(".product-card").forEach((card) => {
      if (card.querySelector(".product-info-button")) return;
      const button = document.createElement("button");
      button.className = "product-info-button";
      button.type = "button";
      button.textContent = "Ver info";
      button.addEventListener("click", () => openProductInfo(card));
      const consultLink = card.querySelector("a");
      if (consultLink) {
        consultLink.before(button);
      } else {
        card.appendChild(button);
      }
    });
  }

  function addBuyButtons() {
    document.querySelectorAll(".product-card").forEach((card) => {
      if (card.querySelector(".buy-button")) return;

      const name = productNameFrom(card);
      const category = productCategoryFrom(card);
      const price = productPriceFrom(card);
      const button = document.createElement("button");
      button.className = "buy-button";
      button.type = "button";
      button.textContent = "Comprar";
      button.addEventListener("click", () => addToCart({ name, category, price }));
      card.appendChild(button);
    });

    const romPanel = document.querySelector(".phone-rom-panel");
    if (romPanel && !romPanel.querySelector(".buy-button")) {
      const price = priceFromText(romPanel.querySelector(".price-badge")?.textContent);
      const button = document.createElement("button");
      button.className = "buy-button";
      button.type = "button";
      button.textContent = "Comprar";
      button.addEventListener("click", () =>
        addToCart({
          name: "ROM y flasheo de celulares Android",
          price,
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
    const itemsHtml = cart
      .map((item) => {
        const name = escapeHtml(item.name);
        return `
          <article class="cart-item">
            <div class="cart-item-main">
              <div>
                <strong>${name}</strong>
                <span>${escapeHtml(item.category)}</span>
              </div>
              <div class="cart-item-price">
                <span>Precio</span>
                <strong>${formatMoney(item.price)}</strong>
              </div>
            </div>
            <div class="cart-qty">
              <button type="button" data-action="decrease" data-name="${name}">-</button>
              <span>${item.quantity}</span>
              <button type="button" data-action="increase" data-name="${name}">+</button>
              <button type="button" data-action="remove" data-name="${name}">Quitar</button>
            </div>
            <div class="cart-line-total">
              <span>Subtotal</span>
              <strong>${formatMoney(lineSubtotal(item))}</strong>
            </div>
          </article>
        `;
      })
      .join("");

    cartItems.innerHTML = `${itemsHtml}
      <section class="cart-summary" aria-label="Resumen del carrito">
        <div><span>Productos seleccionados</span><strong>${total}</strong></div>
        <div><span>Total a pagar</span><strong>${formatMoney(cartSubtotal())}</strong></div>
      </section>
    `;
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

  function onlyDigits(input, maxLength) {
    input.value = input.value.replace(/\D/g, "").slice(0, maxLength);
  }

  function expectedDocumentLength(type) {
    return type === "RUC" ? 11 : 8;
  }

  function syncBillingDocument() {
    if (!billingDocument) return;
    const type = billingDocumentType?.value || "DNI";
    const length = expectedDocumentLength(type);
    billingDocument.maxLength = length;
    billingDocument.placeholder = `${length} dígitos`;
    onlyDigits(billingDocument, length);
  }

  function receiptNumber() {
    const date = new Date();
    return `CC-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}`;
  }

  function billingData() {
    const paymentType = selectedPaymentType();
    const transferPrefix = paymentType === "plin" ? "plin" : "yape";
    const transferOperation = fieldValue(`#${transferPrefix}-operation`, "Pendiente");
    const transferPhone = `${fieldValue(`#${transferPrefix}-country-code`, "+51")} ${fieldValue(`#${transferPrefix}-phone`, "Pendiente")}`;

    return {
      name: fieldValue("#billing-name"),
      documentType: fieldValue("#billing-document-type", "DNI"),
      document: fieldValue("#billing-document"),
      email: fieldValue("#billing-email"),
      payment: selectedPayment(),
      paymentType,
      transferOperation,
      transferPhone,
    };
  }

  function warn(message, input) {
    showToast(message);
    if (input) {
      input.setCustomValidity(message);
      input.reportValidity();
      input.addEventListener("input", () => input.setCustomValidity(""), { once: true });
    }
  }

  function validateBillingData() {
    const data = billingData();
    const documentLength = expectedDocumentLength(data.documentType);
    const transferPrefix = data.paymentType === "plin" ? "plin" : "yape";
    const operationInput = document.querySelector(`#${transferPrefix}-operation`);
    const phoneInput = document.querySelector(`#${transferPrefix}-phone`);

    billingName?.setCustomValidity("");
    billingDocument?.setCustomValidity("");
    billingEmail?.setCustomValidity("");
    operationInput?.setCustomValidity("");
    phoneInput?.setCustomValidity("");

    if (billingName && !billingName.value.trim()) {
      warn("Debes ingresar el nombre completo o razón social.", billingName);
      return false;
    }

    if (billingDocument && billingDocument.value.length !== documentLength) {
      warn(`${data.documentType} debe tener ${documentLength} dígitos numéricos.`, billingDocument);
      return false;
    }

    if (billingEmail && !billingEmail.value.trim()) {
      warn("Debes ingresar un correo para la boleta.", billingEmail);
      return false;
    }

    if (billingEmail && !billingEmail.checkValidity()) {
      warn("Debes ingresar un correo válido.", billingEmail);
      return false;
    }

    if ((data.paymentType === "yape" || data.paymentType === "plin") && operationInput && !operationInput.value.trim()) {
      warn(`Debes ingresar el número de operación de ${data.paymentType === "plin" ? "Plin" : "Yape"}.`, operationInput);
      return false;
    }

    if ((data.paymentType === "yape" || data.paymentType === "plin") && phoneInput && phoneInput.value.length !== 9) {
      warn(`El celular usado en ${data.paymentType === "plin" ? "Plin" : "Yape"} debe tener 9 dígitos.`, phoneInput);
      return false;
    }

    return true;
  }

  function orderLines() {
    return cart.map((item, index) => ({
      index: index + 1,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      price: Number(item.price || 0),
      subtotal: lineSubtotal(item),
    }));
  }

  function buildReceipt(data, number) {
    const total = cartSubtotal();
    const rows = orderLines()
      .map(
        (item) => `
          <tr>
            <td class="receipt-index">${item.index}</td>
            <td><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.category)}</span></td>
            <td class="receipt-qty">${item.quantity}</td>
            <td class="receipt-money">${formatMoney(item.price)}</td>
            <td class="receipt-money">${formatMoney(item.subtotal)}</td>
          </tr>
        `
      )
      .join("");

    return `
      <article class="receipt-document">
        <header class="receipt-head">
          <div class="receipt-brand-block">
            <img src="assets/computer-corner-logo.png" alt="Logo de Computer Corner">
            <div>
              <strong>Computer Corner</strong>
              <span>Venta digital y soporte tecnológico</span>
            </div>
          </div>
          <div class="receipt-number-box">
            <span>PRE-BOLETA</span>
            <strong id="receipt-title">${escapeHtml(number)}</strong>
          </div>
        </header>

        <section class="receipt-note">
          Documento preliminar. La boleta oficial se emite al confirmar disponibilidad, importe final y pago.
        </section>

        <section class="receipt-meta">
          <div><span>Cliente</span><strong>${escapeHtml(data.name)}</strong></div>
          <div><span>${escapeHtml(data.documentType)}</span><strong>${escapeHtml(data.document)}</strong></div>
          <div><span>Correo</span><strong>${escapeHtml(data.email)}</strong></div>
          <div><span>Pago</span><strong>${escapeHtml(data.payment)}</strong></div>
          ${
            data.paymentType === "yape" || data.paymentType === "plin"
              ? `<div><span>Operación</span><strong>${escapeHtml(data.transferOperation)}</strong></div><div><span>Celular</span><strong>${escapeHtml(data.transferPhone)}</strong></div>`
              : `<div class="receipt-meta-wide"><span>Pasarela</span><strong>Link seguro pendiente de generación</strong></div>`
          }
        </section>

        <table class="receipt-table">
          <thead><tr><th>#</th><th>Producto / servicio</th><th>Cant.</th><th>P. unit.</th><th>Subtotal</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>

        <section class="receipt-total">
          <span>Total</span>
          <strong>${formatMoney(total)}</strong>
        </section>

        <footer class="receipt-footer">
          <div>
            <strong>Computer Corner</strong>
            <span>WhatsApp: +51 918 260 798 · computer-corner@outlook.com</span>
          </div>
          <p>Patrocinado por ING. Etsflomar21</p>
        </footer>
      </article>
    `;
  }

  function buildWhatsappMessage(data, number) {
    const total = cartSubtotal();
    const products = orderLines()
      .map((item) => `${item.index}. ${item.name} x${item.quantity} - ${formatMoney(item.subtotal)} (${item.category})`)
      .join("\n");

    const paymentDetail =
      data.paymentType === "yape" || data.paymentType === "plin"
        ? `Operación ${data.paymentType === "plin" ? "Plin" : "Yape"}: ${data.transferOperation}\nCelular ${data.paymentType === "plin" ? "Plin" : "Yape"}: ${data.transferPhone}`
        : "Solicito link de pasarela segura para pagar con tarjeta.";

    return [
      `Hola Computer Corner, generé la pre-boleta ${number}.`,
      "",
      "Datos para boleta:",
      `Cliente: ${data.name}`,
      `${data.documentType}: ${data.document}`,
      `Correo: ${data.email}`,
      "",
      "Productos:",
      products,
      `Total referencial: ${formatMoney(total)}`,
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
    if (!validateBillingData()) return;
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

  function openQrModal(button) {
    if (!qrModal || !qrTitle || !qrImage) return;
    qrTitle.textContent = button.dataset.qrTitle || "QR de pago";
    qrImage.src = button.dataset.qrSrc || "";
    qrImage.alt = `${qrTitle.textContent} ampliado`;
    qrModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    qrModal.querySelector(".qr-close")?.focus();
  }

  function closeQrModal() {
    qrModal?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function openProductInfo(card) {
    if (!productInfoModal || !productInfoTitle || !productInfoDetails) return;
    const info = productInfoFrom(card);
    productInfoTitle.textContent = info.name;
    if (productInfoCategory) productInfoCategory.textContent = info.category;
    if (productInfoPrice) productInfoPrice.textContent = info.price;
    if (productInfoDescription) productInfoDescription.textContent = info.description;
    if (productInfoImage) {
      productInfoImage.src = info.image;
      productInfoImage.alt = info.imageAlt || info.name;
      productInfoImage.hidden = !info.image;
    }
    productInfoDetails.innerHTML = info.details.length
      ? info.details.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
      : "<li>Asesoria previa para validar disponibilidad y compatibilidad.</li>";
    if (productInfoConsult) productInfoConsult.href = info.consultHref;
    productInfoModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    productInfoModal.querySelector(".product-info-close")?.focus();
  }

  function closeProductInfo() {
    productInfoModal?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  cartButton?.addEventListener("click", openCart);
  cartClose?.addEventListener("click", closeCart);
  checkoutButton?.addEventListener("click", checkout);
  printReceipt?.addEventListener("click", () => window.print());
  sendOrder?.addEventListener("click", (event) => {
    const proceed = window.confirm(
      "Recomendación: antes de enviar por WhatsApp, guarda la pre-boleta como PDF y adjúntala manualmente en el chat. ¿Deseas continuar a WhatsApp?"
    );
    if (!proceed) {
      event.preventDefault();
    }
  });
  closeReceiptButtons.forEach((button) => button.addEventListener("click", closeReceipt));
  document.querySelectorAll("[data-qr-open]").forEach((button) => {
    button.addEventListener("click", () => openQrModal(button));
  });
  qrCloseButtons.forEach((button) => button.addEventListener("click", closeQrModal));
  productInfoCloseButtons.forEach((button) => button.addEventListener("click", closeProductInfo));
  document.querySelector('[data-payment-method="card"]')?.click();
  billingDocumentType?.addEventListener("change", syncBillingDocument);
  billingDocument?.addEventListener("input", syncBillingDocument);
  document.querySelectorAll("[data-phone-number]").forEach((input) => {
    input.addEventListener("input", () => onlyDigits(input, 9));
  });
  document.querySelectorAll("[data-operation-number]").forEach((input) => {
    input.addEventListener("input", () => onlyDigits(input, 20));
  });
  syncBillingDocument();
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
    if (event.key === "Escape" && productInfoModal?.getAttribute("aria-hidden") === "false") {
      closeProductInfo();
      return;
    }
    if (event.key === "Escape" && qrModal?.getAttribute("aria-hidden") === "false") {
      closeQrModal();
      return;
    }
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

  addProductInfoButtons();
  addBuyButtons();
  normalizeCartPrices();
  syncPaymentDetails();
  renderCart();
})();
