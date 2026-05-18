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

  let cart = loadCart();

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
    return document.querySelector('input[name="payment"]:checked')?.value || "Tarjeta";
  }

  function checkout() {
    if (!cart.length) return;

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
  }

  function closeCart() {
    cartDrawer.setAttribute("aria-hidden", "true");
  }

  cartButton?.addEventListener("click", openCart);
  cartClose?.addEventListener("click", closeCart);
  checkoutButton?.addEventListener("click", checkout);
  clearButton?.addEventListener("click", () => {
    cart = [];
    saveCart();
    renderCart();
  });

  cartDrawer?.addEventListener("click", (event) => {
    if (event.target === cartDrawer) closeCart();
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
  renderCart();
})();
