const cartStorageKey = "laImperialCart";
const accountsStorageKey = "laImperialAccounts";
const currentUserStorageKey = "laImperialCurrentUser";

function getCart() {
  return JSON.parse(localStorage.getItem(cartStorageKey)) || [];
}

function saveCart(cart) {
  localStorage.setItem(cartStorageKey, JSON.stringify(cart));
}

function getCartCount() {
  return getCart().reduce((total, item) => total + item.quantity, 0);
}

function ensureToastContainer() {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container-custom";
    document.body.appendChild(container);
  }
  return container;
}

function showToast(message) {
  const container = ensureToastContainer();
  const toast = document.createElement("div");
  toast.className = "cart-toast";
  toast.innerHTML = `
    <span class="toast-check"><i class="fa-solid fa-circle-check"></i></span>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 250);
  }, 2400);
}

function updateCartCountUI() {
  const countElement = document.getElementById("cartCount");
  if (!countElement) return;

  countElement.textContent = getCartCount();
  countElement.classList.remove("cart-count-pulse");
  void countElement.offsetWidth;
  countElement.classList.add("cart-count-pulse");
}

function renderCartItems() {
  const cartItemsElement = document.getElementById("cartItems");
  const cartTotalElement = document.getElementById("cartTotal");
  if (!cartItemsElement || !cartTotalElement) return;

  const cart = getCart();
  if (!cart.length) {
    cartItemsElement.innerHTML = `<p class="text-muted mb-0">Your cart is empty.</p>`;
    cartTotalElement.textContent = "0";
    return;
  }

  let total = 0;
  cartItemsElement.innerHTML = cart.map((item) => {
    total += item.price * item.quantity;
    return `
      <div class="cart-item d-flex gap-2 align-items-center mb-3 pb-2 border-bottom">
        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
        <div class="flex-grow-1">
          <h6 class="mb-1">${item.name}</h6>
          <small class="text-muted d-block">PKR ${item.price.toLocaleString()}</small>
          <div class="d-flex align-items-center mt-2 gap-2">
            <button class="btn btn-sm btn-outline-primary cart-qty-btn" data-id="${item.id}" data-action="decrease">-</button>
            <span>${item.quantity}</span>
            <button class="btn btn-sm btn-outline-primary cart-qty-btn" data-id="${item.id}" data-action="increase">+</button>
            <button class="btn btn-sm btn-outline-danger ms-auto cart-remove-btn" data-id="${item.id}">Remove</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  cartTotalElement.textContent = total.toLocaleString();
}

function openCartSidebar() {
  const cartCanvas = document.getElementById("cartCanvas");
  if (!cartCanvas || typeof bootstrap === "undefined" || !bootstrap.Offcanvas) return;
  renderCartItems();
  updateCartCountUI();
  bootstrap.Offcanvas.getOrCreateInstance(cartCanvas).show();
}

function addItemToCart(product) {
  if (!product || !product.id) return;
  const cart = getCart();
  const existingItem = cart.find((item) => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      image: product.image,
      quantity: 1,
    });
  }

  saveCart(cart);
  updateCartCountUI();
  renderCartItems();
  openCartSidebar();
  showToast("Product added to cart");
}

function updateCartItemQuantity(id, delta) {
  const cart = getCart();
  const item = cart.find((cartItem) => cartItem.id === id);
  if (!item) return;

  item.quantity += delta;
  saveCart(item.quantity <= 0 ? cart.filter((cartItem) => cartItem.id !== id) : cart);
  updateCartCountUI();
  renderCartItems();
}

function removeCartItem(id) {
  saveCart(getCart().filter((item) => item.id !== id));
  updateCartCountUI();
  renderCartItems();
}

function bindCartEvents() {
  const cartItemsElement = document.getElementById("cartItems");
  if (!cartItemsElement) return;

  cartItemsElement.addEventListener("click", (event) => {
    const qtyButton = event.target.closest(".cart-qty-btn");
    const removeButton = event.target.closest(".cart-remove-btn");
    if (qtyButton) {
      updateCartItemQuantity(Number(qtyButton.dataset.id), qtyButton.dataset.action === "increase" ? 1 : -1);
      return;
    }
    if (removeButton) removeCartItem(Number(removeButton.dataset.id));
  });
}

function bindGlobalAddToCartButtons() {
  const buttons = document.querySelectorAll(".js-add-to-cart");
  buttons.forEach((btn) => {
    if (btn.dataset.bound === "true") return;
    btn.dataset.bound = "true";

    btn.addEventListener("click", (event) => {
      event.preventDefault();
      if (btn.classList.contains("is-adding")) return;

      const id = Number(btn.dataset.id);
      const name = btn.dataset.name;
      const image = btn.dataset.image;
      const price = Number(btn.dataset.price) || 0;
      if (!id || !name || !image) return;

      const originalHtml = btn.innerHTML;
      btn.classList.add("is-adding");
      btn.disabled = true;
      btn.innerHTML = `<span class="btn-spinner"></span> Adding...`;

      setTimeout(() => {
        addItemToCart({ id, name, image, price });
        btn.classList.remove("is-adding");
        btn.classList.add("added");
        btn.innerHTML = `Added <i class="fa-solid fa-check ms-1"></i>`;
        setTimeout(() => {
          btn.classList.remove("added");
          btn.disabled = false;
          btn.innerHTML = originalHtml;
        }, 1100);
      }, 220);
    });
  });
}

function getAccounts() {
  return JSON.parse(localStorage.getItem(accountsStorageKey)) || [];
}

function saveAccounts(accounts) {
  localStorage.setItem(accountsStorageKey, JSON.stringify(accounts));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem(currentUserStorageKey));
}

function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(currentUserStorageKey, JSON.stringify(user));
  } else {
    localStorage.removeItem(currentUserStorageKey);
  }
}

function updateAuthUI() {
  const authBtn = document.getElementById("authBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const user = getCurrentUser();
  if (!authBtn || !logoutBtn) return;

  if (user) {
    authBtn.textContent = user.name.split(" ")[0] || "My Account";
    authBtn.classList.remove("btn-primary");
    authBtn.classList.add("btn-outline-primary");
    logoutBtn.classList.remove("d-none");
  } else {
    authBtn.textContent = "Login / Signup";
    authBtn.classList.remove("btn-outline-primary");
    authBtn.classList.add("btn-primary");
    logoutBtn.classList.add("d-none");
  }
}

function bindAuthEvents() {
  const authBtn = document.getElementById("authBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const authForm = document.getElementById("authForm");
  const authName = document.getElementById("authName");
  const authEmail = document.getElementById("authEmail");
  const authPassword = document.getElementById("authPassword");
  const authNameWrap = document.getElementById("authNameWrap");
  const authTitle = document.getElementById("authModalTitle");
  const authSubmit = document.getElementById("authSubmitBtn");
  const toggleAuthMode = document.getElementById("toggleAuthMode");
  const authError = document.getElementById("authError");
  const authModalElement = document.getElementById("authModal");

  if (!authBtn || !authForm || !authModalElement) return;

  let isSignup = false;
  const authModal = bootstrap.Modal.getOrCreateInstance(authModalElement);

  function setMode(signupMode) {
    isSignup = signupMode;
    authTitle.textContent = isSignup ? "Create Account" : "Login";
    authSubmit.textContent = isSignup ? "Create Account" : "Login";
    if (authNameWrap) authNameWrap.classList.toggle("d-none", !isSignup);
    toggleAuthMode.textContent = isSignup ? "Already have an account? Login" : "New user? Create account";
    authError.classList.add("d-none");
    authError.textContent = "";
  }

  authBtn.addEventListener("click", () => {
    const user = getCurrentUser();
    if (user) {
      showToast(`Welcome back, ${user.name}`);
      return;
    }
    setMode(false);
    authForm.reset();
    authModal.show();
  });

  toggleAuthMode.addEventListener("click", () => setMode(!isSignup));

  authForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = authName.value.trim();
    const email = authEmail.value.trim().toLowerCase();
    const password = authPassword.value.trim();
    const accounts = getAccounts();
    const account = accounts.find((item) => item.email === email);

    if (!email || !password || (isSignup && !name)) {
      authError.textContent = "Please fill all required fields.";
      authError.classList.remove("d-none");
      return;
    }

    if (isSignup) {
      if (account) {
        authError.textContent = "Account already exists with this email.";
        authError.classList.remove("d-none");
        return;
      }
      if (password.length < 6) {
        authError.textContent = "Password must be at least 6 characters.";
        authError.classList.remove("d-none");
        return;
      }
      const newAccount = { name, email, password };
      saveAccounts([...accounts, newAccount]);
      setCurrentUser({ name, email });
      authModal.hide();
      updateAuthUI();
      showToast("Account created successfully");
      return;
    }

    if (!account || account.password !== password) {
      authError.textContent = "Invalid email or password.";
      authError.classList.remove("d-none");
      return;
    }

    setCurrentUser({ name: account.name, email: account.email });
    authModal.hide();
    updateAuthUI();
    showToast("Logged in successfully");
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      setCurrentUser(null);
      updateAuthUI();
      showToast("Logged out");
    });
  }

  updateAuthUI();
}

function initCartSidebarSync() {
  const cartTrigger = document.querySelector(".cart-trigger");
  const cartCanvas = document.getElementById("cartCanvas");
  if (!cartTrigger || !cartCanvas) return;

  cartTrigger.addEventListener("click", (event) => {
    event.preventDefault();
    openCartSidebar();
  });

  cartCanvas.addEventListener("show.bs.offcanvas", () => {
    renderCartItems();
    updateCartCountUI();
  });
}

const navbarElement = document.getElementById("navbar");
if (navbarElement) {
  navbarElement.innerHTML = `
  <nav class="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
    <div class="container-fluid">
      <div class="navbar-brand"><a href="index.html"><img src="ASSETS/IMG/la_imperial-removebg-preview.png" alt="La Imperial logo"></a></div>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navigationbar" aria-controls="navigationbar" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse navbar-menu-panel" id="navigationbar">
        <ul class="navbar-nav mx-auto">
          <li class="nav-item mx-2"><a href="index.html" class="nav-link fw-bold">Home</a></li>
          <li class="nav-item mx-2"><a href="about.html" class="nav-link fw-bold">About</a></li>
          <li class="nav-item mx-2"><a href="contact.html" class="nav-link fw-bold">Contact</a></li>
          <li class="nav-item mx-2"><a href="product.html" class="nav-link fw-bold">Products</a></li>
        </ul>
        <div class="d-flex align-items-center gap-2 nav-action-group">
          <button class="btn btn-outline-primary cart-trigger" type="button" aria-controls="cartCanvas" aria-label="View Cart" title="View Cart">
            <i class="fa-solid fa-cart-shopping"></i>
            <span class="badge bg-primary ms-1" id="cartCount">0</span>
          </button>
          <button class="btn btn-primary" id="authBtn" type="button">Login / Signup</button>
          <button class="btn btn-outline-danger d-none" id="logoutBtn" type="button">Logout</button>
        </div>
      </div>
    </div>
  </nav>

  <div class="offcanvas offcanvas-end custom-cart-offcanvas" tabindex="-1" id="cartCanvas" aria-labelledby="cartCanvasLabel">
    <div class="offcanvas-header">
      <h5 id="cartCanvasLabel" class="mb-0">Your Cart</h5>
      <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    </div>
    <div class="offcanvas-body d-flex flex-column">
      <div id="cartItems" class="flex-grow-1"></div>
      <div class="pt-3 border-top">
        <h6 class="mb-0">Total: PKR <span id="cartTotal">0</span></h6>
      </div>
    </div>
  </div>

  <div class="modal fade" id="authModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content auth-modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="authModalTitle">Login</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <form id="authForm">
            <div class="mb-2 d-none" id="authNameWrap">
              <label for="authName" class="form-label">Full Name</label>
              <input type="text" class="form-control" id="authName" placeholder="Enter your full name">
            </div>
            <div class="mb-2">
              <label for="authEmail" class="form-label">Email</label>
              <input type="email" class="form-control" id="authEmail" placeholder="Enter your email" required>
            </div>
            <div class="mb-2">
              <label for="authPassword" class="form-label">Password</label>
              <input type="password" class="form-control" id="authPassword" placeholder="Enter password" required>
            </div>
            <p class="text-danger small d-none mb-2" id="authError"></p>
            <button type="submit" class="btn btn-primary w-100" id="authSubmitBtn">Login</button>
          </form>
          <button type="button" class="auth-toggle-link mt-2" id="toggleAuthMode">New user? Create account</button>
        </div>
      </div>
    </div>
  </div>`;
}

const footerElement = document.getElementById("footer");
if (footerElement) {
  footerElement.innerHTML = `<footer class="footer mt-5">
  <div class="container py-5">
    <div class="row">
      <div class="col-md-3 col-sm-6 mb-4">
        <h4 style="color: white;" class="fw-bold">LA IMPERIAL</h4>
        <p class="footer-text">La Imperial has been providing quality home appliances for over 20 years, offering trusted brands and modern technology across Pakistan.</p>
      </div>
      <div class="col-md-3 col-sm-6 mb-4">
        <h5 class="footer-title">Quick Links</h5>
        <ul class="footer-links">
          <li><a href="index.html">Home</a></li>
          <li><a href="product.html">Products</a></li>
          <li><a href="about.html">About Us</a></li>
          <li><a href="contact.html">Contact Us</a></li>
        </ul>
      </div>
      <div class="col-md-3 col-sm-6 mb-4">
        <h5 class="footer-title">Categories</h5>
        <ul class="footer-links">
          <li>Refrigerators</li>
          <li>Washers & Dryers</li>
          <li>Cooling & Heating</li>
          <li>Kitchen Appliances</li>
          <li>Televisions & Entertainment</li>
        </ul>
      </div>
      <div class="col-md-3 col-sm-6 mb-4">
        <h5 class="footer-title">Contact Us</h5>
        <p><i class="fas fa-map-marker-alt"></i>Aptech Metro Star Gate, Karachi</p>
        <p><i class="fas fa-phone"></i> +92 300 1234567</p>
        <p><i class="fas fa-envelope"></i><a href="mailto:hamnaaptech66@gmail.com">la-imperial@gmail.com</a></p>
        <div class="footer-social mt-3">
          <a href="#"><i class="fab fa-facebook-f"></i></a>
          <a href="#"><i class="fab fa-instagram"></i></a>
          <a href="#"><i class="fab fa-youtube"></i></a>
        </div>
      </div>
    </div>
  </div>
  <div class="footer-bottom text-center py-3">© 2026 La Imperial Appliances. All Rights Reserved.</div>
</footer>`;
}

function initNavbarCollapseBehavior() {
  const navCollapse = document.getElementById("navigationbar");
  if (!navCollapse || typeof bootstrap === "undefined" || !bootstrap.Collapse) return;
  const collapseInstance = bootstrap.Collapse.getOrCreateInstance(navCollapse, { toggle: false });
  navCollapse.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 992 && navCollapse.classList.contains("show")) collapseInstance.hide();
    });
  });
}

function initHeroCarousel() {
  const carouselElement = document.getElementById("heroCarousel");
  if (!carouselElement || typeof bootstrap === "undefined" || !bootstrap.Carousel) return;
  bootstrap.Carousel.getOrCreateInstance(carouselElement, {
    interval: 4500,
    pause: "hover",
    touch: true,
    ride: "carousel",
    wrap: true
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initNavbarCollapseBehavior();
  bindCartEvents();
  bindGlobalAddToCartButtons();
  initCartSidebarSync();
  bindAuthEvents();
  renderCartItems();
  updateCartCountUI();
  initHeroCarousel();
});

window.cartManager = {
  addItemToCart,
  updateCartCountUI,
};