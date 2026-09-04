/* ================================
   Erolles Club — script principal
   Compartilhado entre todas as páginas
   ================================ */

const state = {
  products: [],
  activeFilter: "Todos",
  cart: JSON.parse(localStorage.getItem("erolles_cart") || "[]"),
  user: JSON.parse(localStorage.getItem("erolles_user") || "null")
};

/* ---------- Utilidades ---------- */
const formatBRL = (value) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const saveCart = () =>
  localStorage.setItem("erolles_cart", JSON.stringify(state.cart));

const qs = (name) => new URLSearchParams(window.location.search).get(name);

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
}

/* ---------- Filtros de categoria (home) ---------- */
function renderFilters() {
  const bar = document.getElementById("filter-bar");
  if (!bar) return;
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

/* ---------- Grid de produtos (home) ---------- */
function renderProducts() {
  const grid = document.getElementById("products-grid");
  if (!grid) return;
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
      <a class="product" href="produto.html?id=${p.id}">
        <div class="product-image">
          <img src="${p.images[0]}" alt="${p.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">
          ${p.tag ? `<span class="product-tag">${p.tag}</span>` : ""}
        </div>
        <div class="product-info">
          <div>
            <h3>${p.name}</h3>
            <span class="cat">${p.category}</span>
          </div>
          <span class="price">${formatBRL(p.price)}</span>
        </div>
      </a>`
    )
    .join("");
}

/* ---------- Página de produto ---------- */
function renderProductDetail() {
  const container = document.getElementById("product-detail");
  if (!container) return;

  const id = qs("id");
  const product = state.products.find((p) => p.id === id) || state.products[0];
  if (!product) {
    container.innerHTML = `<p>Produto não encontrado.</p>`;
    return;
  }

  document.title = `${product.name} — Erolles Club`;
  document.getElementById("breadcrumb-name").textContent = product.name;

  container.innerHTML = `
    <div>
      <div class="pd-gallery-main">
        <img id="pd-main-img" src="${product.images[0]}" alt="${product.name}">
      </div>
      ${
        product.images.length > 1
          ? `<div class="pd-thumbs">
              ${product.images
                .map(
                  (img, i) =>
                    `<img src="${img}" class="${i === 0 ? "active" : ""}" data-src="${img}">`
                )
                .join("")}
            </div>`
          : ""
      }
    </div>
    <div class="pd-info">
      <div class="cat-label">${product.category}</div>
      <h1>${product.name}</h1>
      <div class="pd-price">${formatBRL(product.price)}</div>
      <p class="pd-desc">${product.description || ""}</p>

      <div class="pd-size-label">TAMANHO</div>
      <div class="size-options" id="size-options">
        ${["P", "M", "G", "GG"].map((s, i) => `<button class="size-btn${i === 1 ? " active" : ""}" data-size="${s}">${s}</button>`).join("")}
      </div>

      <div class="pd-qty">
        <button id="qty-dec">−</button>
        <span id="qty-val">1</span>
        <button id="qty-inc">+</button>
      </div>

      <button class="btn" id="pd-add-btn">Adicionar ao carrinho</button>
      <div class="pd-add-msg" id="pd-add-msg"></div>

      <div class="pd-meta">
        <details open>
          <summary>Composição e cuidados</summary>
          <p>100% algodão, produzido no Brasil. Lavar à mão ou máquina com água fria, não usar alvejante.</p>
        </details>
        <details>
          <summary>Envio e trocas</summary>
          <p>Envio em até 3 dias úteis. Trocas gratuitas em até 30 dias após o recebimento.</p>
        </details>
      </div>
    </div>
  `;

  // Galeria
  container.querySelectorAll(".pd-thumbs img").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      document.getElementById("pd-main-img").src = thumb.dataset.src;
      container.querySelectorAll(".pd-thumbs img").forEach((t) => t.classList.remove("active"));
      thumb.classList.add("active");
    });
  });

  // Tamanho
  let selectedSize = "M";
  container.querySelectorAll(".size-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".size-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedSize = btn.dataset.size;
    });
  });

  // Quantidade
  let qty = 1;
  const qtyVal = document.getElementById("qty-val");
  document.getElementById("qty-inc").addEventListener("click", () => {
    qty += 1;
    qtyVal.textContent = qty;
  });
  document.getElementById("qty-dec").addEventListener("click", () => {
    if (qty > 1) qty -= 1;
    qtyVal.textContent = qty;
  });

  // Adicionar ao carrinho
  document.getElementById("pd-add-btn").addEventListener("click", () => {
    addToCart(product.id, selectedSize, qty);
    document.getElementById("pd-add-msg").textContent = `Adicionado: ${qty}x ${product.name} (tam. ${selectedSize})`;
  });

  // Relacionados
  const relatedGrid = document.getElementById("related-grid");
  if (relatedGrid) {
    const related = state.products.filter((p) => p.id !== product.id).slice(0, 4);
    relatedGrid.innerHTML = related
      .map(
        (p) => `
        <a class="product" href="produto.html?id=${p.id}">
          <div class="product-image">
            <img src="${p.images[0]}" alt="${p.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">
          </div>
          <div class="product-info">
            <div><h3>${p.name}</h3><span class="cat">${p.category}</span></div>
            <span class="price">${formatBRL(p.price)}</span>
          </div>
        </a>`
      )
      .join("");
  }
}

/* ---------- Carrinho (lógica compartilhada) ---------- */
function addToCart(id, size, qty) {
  const product = state.products.find((p) => p.id === id);
  if (!product) return;
  const key = `${id}-${size}`;
  const existing = state.cart.find((item) => item.key === key);
  if (existing) {
    existing.qty += qty;
  } else {
    state.cart.push({
      key,
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      size,
      qty
    });
  }
  saveCart();
  renderCartDrawer();
  openCart();
}

function changeQty(key, delta) {
  const item = state.cart.find((i) => i.key === key);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    state.cart = state.cart.filter((i) => i.key !== key);
  }
  saveCart();
  renderCartDrawer();
  renderCartPage();
}

function removeItem(key) {
  state.cart = state.cart.filter((i) => i.key !== key);
  saveCart();
  renderCartDrawer();
  renderCartPage();
}

function cartTotal() {
  return state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}
function cartCount() {
  return state.cart.reduce((sum, item) => sum + item.qty, 0);
}

/* Drawer (mini carrinho, todas as páginas) */
function renderCartDrawer() {
  const container = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total-value");
  const countEls = document.querySelectorAll(".cart-count-badge");

  countEls.forEach((el) => (el.textContent = cartCount() > 0 ? cartCount() : ""));
  if (totalEl) totalEl.textContent = formatBRL(cartTotal());
  if (!container) return;

  if (!state.cart.length) {
    container.innerHTML = `<div class="cart-empty">Seu carrinho está vazio.</div>`;
    return;
  }

  container.innerHTML = state.cart
    .map(
      (item) => `
      <div class="cart-item" data-key="${item.key}">
        <img src="${item.image}" alt="${item.name}" style="width:56px;height:70px;object-fit:cover;">
        <div style="flex:1;">
          <strong>${item.name}</strong><br>
          <span style="font-size:12px;opacity:0.6;">Tam. ${item.size}</span><br>
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
    const key = el.dataset.key;
    el.querySelector('[data-action="inc"]').addEventListener("click", () => changeQty(key, 1));
    el.querySelector('[data-action="dec"]').addEventListener("click", () => changeQty(key, -1));
  });
}

/* Página completa de carrinho (carrinho.html) */
function renderCartPage() {
  const container = document.getElementById("cart-page-items");
  if (!container) return;

  const summarySubtotal = document.getElementById("summary-subtotal");
  const summaryTotal = document.getElementById("summary-total");

  if (!state.cart.length) {
    container.innerHTML = `<div class="cart-page-empty">Seu carrinho está vazio. <a href="index.html#colecao" style="text-decoration:underline;">Ver coleção</a></div>`;
    if (summarySubtotal) summarySubtotal.textContent = formatBRL(0);
    if (summaryTotal) summaryTotal.textContent = formatBRL(0);
    return;
  }

  container.innerHTML = state.cart
    .map(
      (item) => `
      <div class="cart-line" data-key="${item.key}">
        <img src="${item.image}" alt="${item.name}">
        <div>
          <h3>${item.name}</h3>
          <div class="meta">Tamanho ${item.size} · ${formatBRL(item.price)}</div>
          <div class="qty-controls">
            <button data-action="dec">−</button>
            <span>${item.qty}</span>
            <button data-action="inc">+</button>
          </div>
          <span class="remove-link" data-action="remove">Remover</span>
        </div>
        <div><strong>${formatBRL(item.price * item.qty)}</strong></div>
      </div>`
    )
    .join("");

  container.querySelectorAll(".cart-line").forEach((el) => {
    const key = el.dataset.key;
    el.querySelector('[data-action="inc"]').addEventListener("click", () => changeQty(key, 1));
    el.querySelector('[data-action="dec"]').addEventListener("click", () => changeQty(key, -1));
    el.querySelector('[data-action="remove"]').addEventListener("click", () => removeItem(key));
  });

  const subtotal = cartTotal();
  if (summarySubtotal) summarySubtotal.textContent = formatBRL(subtotal);
  if (summaryTotal) summaryTotal.textContent = formatBRL(subtotal);
}

function openCart() {
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("overlay");
  if (drawer) drawer.classList.add("open");
  if (overlay) overlay.classList.add("open");
}
function closeCart() {
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("overlay");
  if (drawer) drawer.classList.remove("open");
  if (overlay) overlay.classList.remove("open");
}

/* ---------- Menu mobile ---------- */
function openMenu() {
  document.getElementById("mobile-nav")?.classList.add("open");
  document.getElementById("overlay")?.classList.add("open");
}
function closeMenu() {
  document.getElementById("mobile-nav")?.classList.remove("open");
  document.getElementById("overlay")?.classList.remove("open");
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

/* ---------- Login / Cadastro (simulado, localStorage) ---------- */
function getUsers() {
  return JSON.parse(localStorage.getItem("erolles_users") || "[]");
}
function saveUsers(users) {
  localStorage.setItem("erolles_users", JSON.stringify(users));
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  const msg = document.getElementById("login-msg");

  const users = getUsers();
  const found = users.find((u) => u.email === email && u.password === password);

  if (!found) {
    msg.textContent = "E-mail ou senha incorretos.";
    msg.style.color = "#c4552e";
    return;
  }

  state.user = { name: found.name, email: found.email };
  localStorage.setItem("erolles_user", JSON.stringify(state.user));
  msg.style.color = "";
  msg.textContent = `Bem-vindo(a) de volta, ${found.name}!`;
  setTimeout(() => (window.location.href = "index.html"), 800);
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById("register-name").value.trim();
  const email = document.getElementById("register-email").value.trim().toLowerCase();
  const password = document.getElementById("register-password").value;
  const msg = document.getElementById("register-msg");

  if (!name || !email || password.length < 4) {
    msg.textContent = "Preencha nome, e-mail e uma senha com 4+ caracteres.";
    msg.style.color = "#c4552e";
    return;
  }

  const users = getUsers();
  if (users.some((u) => u.email === email)) {
    msg.textContent = "Já existe uma conta com esse e-mail.";
    msg.style.color = "#c4552e";
    return;
  }

  users.push({ name, email, password });
  saveUsers(users);
  state.user = { name, email };
  localStorage.setItem("erolles_user", JSON.stringify(state.user));
  msg.style.color = "";
  msg.textContent = `Conta criada! Bem-vindo(a), ${name}.`;
  setTimeout(() => (window.location.href = "index.html"), 800);
}

function renderUserChip() {
  document.querySelectorAll(".user-chip").forEach((chip) => {
    if (state.user) {
      chip.classList.add("show");
      chip.innerHTML = `<span>Olá, ${state.user.name.split(" ")[0]}</span> <button id="logout-btn" style="background:none;border:none;text-decoration:underline;cursor:pointer;font-size:12px;color:inherit;">Sair</button>`;
      chip.querySelector("#logout-btn")?.addEventListener("click", () => {
        state.user = null;
        localStorage.removeItem("erolles_user");
        window.location.reload();
      });
    }
  });
}

function switchAuthTab(tab) {
  document.getElementById("login-panel").style.display = tab === "login" ? "block" : "none";
  document.getElementById("register-panel").style.display = tab === "register" ? "block" : "none";
  document.querySelectorAll(".auth-tab").forEach((t) => t.classList.remove("active"));
  document.querySelector(`.auth-tab[data-tab="${tab}"]`)?.classList.add("active");
}

/* ---------- Modo escuro ---------- */
function initThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("erolles_theme", "light");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("erolles_theme", "dark");
    }
  });
}

/* ---------- Gate de senha ---------- */
const SITE_PASSWORD = "erolles2026";

function initPasswordGate() {
  const submit = document.getElementById("gate-submit");
  if (!submit) return;

  const input = document.getElementById("gate-password");
  const msg = document.getElementById("gate-msg");
  const toggle = document.getElementById("gate-toggle-visibility");

  toggle?.addEventListener("click", () => {
    input.type = input.type === "password" ? "text" : "password";
  });

  const tryUnlock = () => {
    if (input.value === SITE_PASSWORD) {
      localStorage.setItem("erolles_unlocked", "true");
      const redirect = qs("redirect") || "index.html";
      window.location.href = redirect;
    } else {
      msg.textContent = "Senha incorreta. Tente novamente.";
      msg.style.color = "#5796ec";
    }
  };

  submit.addEventListener("click", tryUnlock);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") tryUnlock();
  });

  document.getElementById("gate-news-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    msg.style.color = "";
    msg.textContent = "Obrigado por assinar!";
  });
}

function enforcePasswordGate() {
  // Não protege a própria página de senha
  if (window.location.pathname.endsWith("senha.html")) return;
  const unlocked = localStorage.getItem("erolles_unlocked") === "true";
  if (!unlocked) {
    const current = window.location.pathname.split("/").pop() || "index.html";
    window.location.href = `senha.html?redirect=${encodeURIComponent(current)}`;
  }
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  initPasswordGate();
  await loadProducts();

  renderFilters();
  renderProducts();
  renderProductDetail();
  renderCartDrawer();
  renderCartPage();
  renderUserChip();
  initThemeToggle();

  document.getElementById("cart-btn")?.addEventListener("click", openCart);
  document.getElementById("cart-close")?.addEventListener("click", closeCart);
  document.getElementById("menu-btn")?.addEventListener("click", openMenu);
  document.getElementById("menu-close")?.addEventListener("click", closeMenu);
  document.getElementById("overlay")?.addEventListener("click", () => {
    closeCart();
    closeMenu();
  });
  document.getElementById("news-form")?.addEventListener("submit", handleNewsletterSubmit);

  document.getElementById("login-form")?.addEventListener("submit", handleLogin);
  document.getElementById("register-form")?.addEventListener("submit", handleRegister);
  document.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => switchAuthTab(tab.dataset.tab));
  });
});
