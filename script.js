/* ================================
   Erolles Club — script principal
   ================================ */

const state = {
  products: [],
  activeFilter: "Todos",
  cart: JSON.parse(localStorage.getItem("erolles_cart") || "[]")
};

/* ---------- Utilidades ---------- */
const formatBRL = (value) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const saveCart = () =>
  localStorage.setItem("erolles_cart", JSON.stringify(state.cart));

/* ---------- Carregar produtos do JSON ---------- */
async function loadProducts() {
  try {
    const res = await fetch("products.json");
    if (!res.ok) throw new Error("Falha ao carregar produtos");
    state.products = await res.json();
  } catch (err) {
    console.error(err);
    state.products = [];
  }
  renderFilters();
  renderProducts();
}

/* ---------- Filtros de categoria ---------- */
function renderFilters() {
  const bar = document.getElementById("filter-bar");
  const categories = ["Todos", ...new Set(state.products.map((p) => p.category))];
  bar.innerHTML = categories
    .map(
      (cat) =>
        `<button class="filter-btn${cat === state.activeFilter ? " active" : ""}" data-cat="${cat}">${cat}</button>`
    )
    .join("");

  bar.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeFilter = btn.dataset.cat;
      renderFilters();
      renderProducts();
    });
  });
}

/* ---------- Grid de produtos ---------- */
function renderProducts() {
  const grid = document.getElementById("products-grid");
  const list =
    state.activeFilter === "Todos"
      ? state.products
      : state.products.filter((p) => p.category === state.activeFilter);

  if (!list.length) {
    grid.innerHTML = `<div class="products-empty">Nenhuma peça encontrada nessa categoria.</div>`;
    return;
  }

  grid.innerHTML = list
    .map(
      (p) => `
      <div class="product" data-id="${p.id}">
        <div class="product-image">
          <span class="mark">${p.mark}</span>
          ${p.tag ? `<span class="product-tag">${p.tag}</span>` : ""}
        </div>
        <div class="product-info">
          <div>
            <h3>${p.name}</h3>
            <span class="cat">${p.category}</span>
          </div>
          <span class="price">${formatBRL(p.price)}</span>
        </div>
      </div>`
    )
    .join("");

  grid.querySelectorAll(".product").forEach((card) => {
    card.addEventListener("click", () => addToCart(card.dataset.id));
  });
}

/* ---------- Carrinho ---------- */
function addToCart(id) {
  const product = state.products.find((p) => p.id === id);
  if (!product) return;
  const existing = state.cart.find((item) => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
  }
  saveCart();
  renderCart();
  openCart();
}

function changeQty(id, delta) {
  const item = state.cart.find((i) => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    state.cart = state.cart.filter((i) => i.id !== id);
  }
  saveCart();
  renderCart();
}

function cartTotal() {
  return state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function cartCount() {
  return state.cart.reduce((sum, item) => sum + item.qty, 0);
}

function renderCart() {
  const container = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total-value");
  const countEl = document.getElementById("cart-count");

  countEl.textContent = cartCount();
  totalEl.textContent = formatBRL(cartTotal());

  if (!state.cart.length) {
    container.innerHTML = `<div class="cart-empty">Seu carrinho está vazio.</div>`;
    return;
  }

  container.innerHTML = state.cart
    .map(
      (item) => `
      <div class="cart-item" data-id="${item.id}">
        <div>
          <strong>${item.name}</strong><br>
          <span>${formatBRL(item.price)}</span>
          <div class="qty-controls">
            <button data-action="dec">−</button>
            <span>${item.qty}</span>
            <button data-action="inc">+</button>
          </div>
        </div>
        <div>${formatBRL(item.price * item.qty)}</div>
      </div>`
    )
    .join("");

  container.querySelectorAll(".cart-item").forEach((el) => {
    const id = el.dataset.id;
    el.querySelector('[data-action="inc"]').addEventListener("click", () => changeQty(id, 1));
    el.querySelector('[data-action="dec"]').addEventListener("click", () => changeQty(id, -1));
  });
}

function openCart() {
  document.getElementById("cart-drawer").classList.add("open");
  document.getElementById("overlay").classList.add("open");
}
function closeCart() {
  document.getElementById("cart-drawer").classList.remove("open");
  document.getElementById("overlay").classList.remove("open");
}

/* ---------- Menu mobile ---------- */
function openMenu() {
  document.getElementById("mobile-nav").classList.add("open");
  document.getElementById("overlay").classList.add("open");
}
function closeMenu() {
  document.getElementById("mobile-nav").classList.remove("open");
  document.getElementById("overlay").classList.remove("open");
}

/* ---------- Newsletter ---------- */
function handleNewsletterSubmit(e) {
  e.preventDefault();
  const input = e.target.querySelector("input[type=email]");
  const msg = document.getElementById("news-msg");
  if (!input.value) return;
  msg.textContent = `Cadastrado! Vamos te avisar em ${input.value} sobre os próximos drops.`;
  input.value = "";
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  renderCart();

  document.getElementById("cart-btn").addEventListener("click", openCart);
  document.getElementById("cart-close").addEventListener("click", closeCart);
  document.getElementById("menu-btn").addEventListener("click", openMenu);
  document.getElementById("menu-close").addEventListener("click", closeMenu);
  document.getElementById("overlay").addEventListener("click", () => {
    closeCart();
    closeMenu();
  });
  document.getElementById("news-form").addEventListener("submit", handleNewsletterSubmit);
});
