let currency = "INR";

const symbol = () => currency === "INR" ? "₹" : "$";

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, function(char) {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return entities[char];
  });
}

function card(p) {
  const price = currency === "INR" ? p.price_inr : p.price_usd;

  return `
    <article class="product">
      <div class="product-image">${escapeHTML(p.name)}</div>
      <div class="product-body">
        <h3>${escapeHTML(p.name)}</h3>
        <div class="product-meta">
          <span>${escapeHTML(p.category)}</span>
          <b class="price">${symbol()}${escapeHTML(price ?? 0)}</b>
        </div>
        <div class="product-meta" style="margin-top:9px">
          <span>Description</span>
          <span>${escapeHTML(p.description || "Details coming soon")}</span>
        </div>
        <button type="button" onclick="alert('Please contact RK SOFTWARE support for details.')">
          View Details
        </button>
      </div>
    </article>
  `;
}

async function loadTools() {
  const productGrid = document.getElementById("productGrid");
  const recentGrid = document.getElementById("recentGrid");

  productGrid.textContent = "Loading tools...";
  recentGrid.textContent = "Loading tools...";

  const { data, error } = await supabaseClient
    .from("tools")
    .select("*")
    .eq("is_active", true)
    .order("id", { ascending: false });

  if (error) {
    productGrid.textContent = "Error: " + error.message;
    recentGrid.textContent = "Error: " + error.message;
    return;
  }

  if (!data || data.length === 0) {
    productGrid.textContent = "No tools available yet.";
    recentGrid.textContent = "No tools available yet.";
    return;
  }

  productGrid.innerHTML = data.slice(0, 4).map(card).join("");
  recentGrid.innerHTML = data.slice(4).map(card).join("");
}

document.getElementById("currency").addEventListener("change", function(e) {
  currency = e.target.value;
  loadTools();
});

document.getElementById("menuToggle").addEventListener("click", function() {
  document.getElementById("mainNav").classList.toggle("open");
});

document.getElementById("year").textContent = new Date().getFullYear();

loadTools();
