// Initialize AOS after DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  if (window.AOS) {
    AOS.init({
      once: true,
      mirror: false,
    });
  }
});

// Product page
let products = [];
let selectedCompareIds = new Set();

function getInitialCategoryFilter() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("category");
  if (fromQuery) return fromQuery;

  const fromStorage = localStorage.getItem("selectedCategory");
  if (fromStorage) {
    localStorage.removeItem("selectedCategory");
    return fromStorage;
  }
  return "all";
}

// FETCH JSON
fetch("data/products.json")
  .then(res => res.json())
  .then(data => {
    products = data;
    const initialCategory = getInitialCategoryFilter();
    const categoryFilter = document.getElementById("categoryFilter");
    if (categoryFilter && initialCategory && initialCategory !== "all") {
      categoryFilter.value = initialCategory;
    }
    filterProducts();
  })
  .catch(err => console.error("JSON fetch error:", err));

// DISPLAY PRODUCTS
function displayProducts(list) {
  const productList = document.getElementById("productList");
  if (!productList) return;
  productList.innerHTML = ""; // clear previous products

  list.forEach((p, index) => {
    const col = document.createElement("div");
    col.className = "col-6 col-md-4 mb-4";
    col.setAttribute("data-aos", "fade-up");
    col.setAttribute("data-aos-delay", (index % 4) * 50);
    col.setAttribute("data-aos-duration", "800");

    col.innerHTML = `
      <div class="card h-100 shadow-sm p-2 product-list-card">
        <img src="${p.image}" class="card-img" style="height:180px; object-fit:contain;">
        <div class="card-body">
          <h6 class="product-title">${p.name}</h6>
          <p class="text-muted product-feature-text">${p.features}</p>
          <strong class="product-price">PKR ${(Number(p.price) || 0).toLocaleString()}</strong>
          <div class="mt-2">
            <a href="${p.specs}" class="btn btn-primary btn-sm w-100">Download Details</a>
            <button class="btn btn-primary btn-sm mt-1 w-100 addToCart" data-id="${p.id}">Add to Cart</button>
          </div>
          <div class="form-check d-flex align-items-center gap-2 mt-2">
            <input class="form-check-input compare-checkbox"
              type="checkbox"
              value="${p.id}"
              ${selectedCompareIds.has(p.id) ? "checked" : ""}
              onchange="updateCompareButton()">
            <label class="form-check-label">Compare</label>
          </div>
        </div>
      </div>
    `;

    productList.appendChild(col);
  });

  // Add to cart with modern interactive feedback
  document.querySelectorAll(".addToCart").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("is-adding")) return;

      const id = Number(btn.getAttribute("data-id"));
      const product = products.find(item => item.id === id);
      if (!product || !window.cartManager) return;

      const originalText = btn.textContent;
      btn.classList.add("is-adding");
      btn.disabled = true;
      btn.innerHTML = `<span class="btn-spinner"></span> Adding...`;

      // Fast micro-delay for smoother interaction feel.
      setTimeout(() => {
        window.cartManager.addItemToCart(product);
        btn.classList.remove("is-adding");
        btn.classList.add("added");
        btn.innerHTML = `Added <i class="fa-solid fa-check ms-1"></i>`;

        setTimeout(() => {
          btn.classList.remove("added");
          btn.disabled = false;
          btn.textContent = originalText;
        }, 1100);
      }, 250);
    });
  });

  // Card hover polish
  document.querySelectorAll(".product-list-card").forEach((card) => {
    card.addEventListener("mouseenter", () => card.classList.add("hovered"));
    card.addEventListener("mouseleave", () => card.classList.remove("hovered"));
  });

  // Refresh AOS for dynamically added elements (if library loaded)
  if (window.AOS) {
    AOS.refresh();
  }
}

function wireFilterEvents() {
  const brandFilter = document.getElementById("brandFilter");
  const categoryFilter = document.getElementById("categoryFilter");
  if (!brandFilter || !categoryFilter) return;

  if (!brandFilter.dataset.bound) {
    brandFilter.addEventListener("change", filterProducts);
    brandFilter.dataset.bound = "true";
  }
  if (!categoryFilter.dataset.bound) {
    categoryFilter.addEventListener("change", filterProducts);
    categoryFilter.dataset.bound = "true";
  }
}

wireFilterEvents();

// FILTERING
function filterProducts() {
  const brandFilter = document.getElementById("brandFilter");
  const categoryFilter = document.getElementById("categoryFilter");
  if (!brandFilter || !categoryFilter) return;

  const brand = brandFilter.value;
  const category = categoryFilter.value;

  const filtered = products.filter(p =>
    (brand === "all" || p.brand === brand) &&
    (category === "all" || p.category === category)
  );

  displayProducts(filtered);
  updateCompareButton();
}

// ENABLE / DISABLE COMPARE BUTTON
function updateCompareButton() {
  const compareBtn = document.getElementById("compareBtn");
  if (!compareBtn) return;
  const checked = document.querySelectorAll(".compare-checkbox:checked");
  selectedCompareIds = new Set(Array.from(checked, (checkbox) => Number(checkbox.value)));
  compareBtn.disabled = checked.length < 2;
}

// COMPARE PRODUCTS
const compareButtonElement = document.getElementById("compareBtn");
if (compareButtonElement) compareButtonElement.addEventListener("click", () => {
  const checked = document.querySelectorAll(".compare-checkbox:checked");
  const compareResult = document.getElementById("compareResult");

  if (checked.length < 2) {
    compareResult.innerHTML = `
      <p class="text-danger">Please select at least 2 products to compare.</p>
    `;
    return;
  }

  compareResult.innerHTML = "";

  checked.forEach((cb, index) => {
    const product = products.find(p => p.id == cb.value);

    const col = document.createElement("div");
    col.className = "col-md-6 mb-3";
    col.setAttribute("data-aos", "fade-up");
    col.setAttribute("data-aos-delay", index * 100);
    col.setAttribute("data-aos-duration", "800");

    col.innerHTML = `
      <div class="card shadow-sm p-3">
        <img src="${product.image}"
             class="card-img-top p-3"
             style="height:180px; object-fit:contain;"
             onerror="this.src='ASSETS/IMG/no-image.png'">
        <div class="card-body">
          <h5 class="text-primary">${product.name}</h5>
          <p><strong>Brand:</strong> ${product.brand}</p>
          <p><strong>Category:</strong> ${product.category}</p>
          <p><strong>Price:</strong> PKR ${product.price}</p>
          <p><strong>Features:</strong> ${product.features}</p>
        </div>
      </div>
    `;

    compareResult.appendChild(col);
  });

  // Refresh AOS for comparison cards
  if (window.AOS) {
    AOS.refresh();
  }

  // AUTO SCROLL TO COMPARISON
  document.getElementById("compareSection").scrollIntoView({
    behavior: "smooth"
  });
});
