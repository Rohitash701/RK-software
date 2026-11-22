let currency = "INR";
let currentUser = null;
let customerProfile = null;
let customerWallet = null;
let customerTools = [];
let websiteSettings = {};

const $ = id => document.getElementById(id);
const symbol = () => currency === "INR" ? "₹" : "$";

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[char]);
}

function money(amount, cur = currency) {
  return (cur === "INR" ? "₹" : "$") +
    Number(amount || 0).toFixed(2);
}

function toolPrice(tool) {
  return currency === "INR"
    ? Number(tool.price_inr ?? tool.price ?? 0)
    : Number(tool.price_usd ?? 0);
}

function injectStyles() {
  if ($("rkDynamicStyles")) return;

  const style = document.createElement("style");
  style.id = "rkDynamicStyles";
  style.textContent = `
    .rk-account-area{padding:24px;background:#171717;color:white;border-radius:14px;margin:25px 0}
    .rk-account-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px}
    .rk-info-card{background:#242424;border:1px solid #444;padding:16px;border-radius:10px}
    .rk-info-card h3{margin:0 0 10px;color:#f59e0b}
    .rk-action{background:#f59e0b;color:#111;border:0;border-radius:7px;padding:11px 16px;font-weight:bold;cursor:pointer;margin:5px 4px 5px 0}
    .rk-secondary{background:#444;color:white}
    .rk-order{background:#222;border:1px solid #444;padding:14px;border-radius:10px;margin:10px 0;color:white}
    .rk-order small{color:#bbb}
    .rk-modal{position:fixed;inset:0;background:#000c;z-index:99999;display:flex;align-items:center;justify-content:center;padding:15px}
    .rk-modal-box{background:#1e293b;color:white;width:100%;max-width:480px;max-height:90vh;overflow:auto;padding:22px;border-radius:14px}
    .rk-modal-box input,.rk-modal-box textarea,.rk-modal-box select{width:100%;padding:12px;margin:7px 0 13px;border-radius:7px;border:1px solid #64748b;background:#fff;color:#111}
    .rk-modal-box label{display:block;margin-top:8px}
    .rk-modal-close{float:right;background:#475569;color:white;border:0;padding:7px 12px;border-radius:6px}
    .rk-status{display:inline-block;padding:5px 9px;border-radius:5px;background:#444;color:#fff;font-size:12px}
    .rk-product-photo{width:100%;height:160px;object-fit:contain;background:#222;border-radius:8px;margin-bottom:10px}
    .rk-contact{background:#202020;color:white;padding:20px;border-radius:12px;margin:20px 0}
    .rk-contact img{max-width:210px;display:block;margin:12px 0;border-radius:8px;background:white;padding:5px}
    .rk-muted{color:#bbb;font-size:13px}
    .rk-empty{padding:16px;background:#222;color:#ccc;border-radius:8px}
  `;
  document.head.appendChild(style);
}

function ensureAccountArea() {
  if ($("rkCustomerArea")) return;

  const area = document.createElement("section");
  area.id = "rkCustomerArea";
  area.className = "rk-account-area";
  area.innerHTML = `
    <h2>MY <span style="color:#f59e0b">ACCOUNT</span></h2>
    <div id="rkAccountContent">Checking account...</div>
  `;

  const main = document.querySelector("main");
  const support = $("support");

  if (support && support.closest("section")) {
    support.closest("section").before(area);
  } else if (main) {
    main.appendChild(area);
  }
}

function ensureContactArea() {
  let contact = $("rkContactDetails");
  if (!contact) {
    contact = document.createElement("div");
    contact.id = "rkContactDetails";
    contact.className = "rk-contact";

    const support = $("support");
    if (support) {
      support.appendChild(contact);
    } else {
      document.querySelector("main")?.appendChild(contact);
    }
  }
  return contact;
}

function showMessage(messageText, isError = false) {
  let box = $("rkGlobalMessage");

  if (!box) {
    box = document.createElement("div");
    box.id = "rkGlobalMessage";
    box.style.cssText =
      "position:fixed;bottom:15px;left:15px;right:15px;z-index:100000;padding:13px;border-radius:8px;text-align:center;background:#222;color:white;box-shadow:0 3px 15px #0008";
    document.body.appendChild(box);
  }

  box.style.border = isError
    ? "1px solid #ef4444"
    : "1px solid #22c55e";

  box.textContent = messageText;

  setTimeout(() => box.remove(), 4500);
}

async function loadWebsiteSettings() {
  const { data, error } = await supabaseClient
    .from("rk_website_settings")
    .select("setting_key, setting_value");

  if (error) {
    console.warn("Website settings:", error.message);
    return;
  }

  websiteSettings = {};

  (data || []).forEach(row => {
    websiteSettings[row.setting_key] = row.setting_value;
  });

  renderContactDetails();
}

function settingValue(key) {
  const value = websiteSettings[key];

  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value.value ?? value.url ?? "";
  }

  return value ?? "";
}

function renderContactDetails() {
  const contact = ensureContactArea();

  const email = settingValue("contact_email");
  const whatsapp = settingValue("whatsapp_number");

  contact.innerHTML = `
    <h3>RK SOFTWARE SUPPORT</h3>
    ${email ? `<p>Contact Email: <a style="color:#f59e0b" href="mailto:${escapeHTML(email)}">${escapeHTML(email)}</a></p>` : ""}
    ${whatsapp ? `<p>WhatsApp: ${escapeHTML(whatsapp)}</p>` : ""}
    ${!email && !whatsapp ? `<p class="rk-muted">Official contact details will appear here when configured by Admin.</p>` : ""}
  `;
}

async function loadTools() {
  const productGrid = $("productGrid");
  const recentGrid = $("recentGrid");

  if (productGrid) productGrid.textContent = "Loading tools...";
  if (recentGrid) recentGrid.textContent = "Loading tools...";

  const { data, error } = await supabaseClient
    .from("tools")
    .select("*")
    .eq("is_active", true)
    .order("id", { ascending: false });

  if (error) {
    if (productGrid) productGrid.textContent = "Error: " + error.message;
    if (recentGrid) recentGrid.textContent = "Error: " + error.message;
    return;
  }

  customerTools = data || [];

  if (!customerTools.length) {
    if (productGrid) productGrid.textContent = "No tools available yet.";
    if (recentGrid) recentGrid.textContent = "No tools available yet.";
    return;
  }

  renderTools();
}

function renderToolCard(tool) {
  const price = toolPrice(tool);
  const photo = tool.image_url
    ? `<img class="rk-product-photo" src="${escapeHTML(tool.image_url)}" alt="${escapeHTML(tool.name)}">`
    : `<div class="product-image">${escapeHTML(tool.name)}</div>`;

  return `
    <article class="product">
      ${photo}
      <div class="product-body">
        <h3>${escapeHTML(tool.name)}</h3>
        <div class="product-meta">
          <span>${escapeHTML(tool.category || "Service")}</span>
          <b class="price">${money(price)}</b>
        </div>
        <p>${escapeHTML(tool.description || "Details coming soon")}</p>
        <button type="button" class="rk-action" onclick="rkOpenOrder(${Number(tool.id)})">
          View Details / Order
        </button>
      </div>
    </article>
  `;
}

function renderTools() {
  const productGrid = $("productGrid");
  const recentGrid = $("recentGrid");

  if (!productGrid || !recentGrid) return;

  if (!customerTools.length) {
    productGrid.textContent = "No tools available yet.";
    recentGrid.textContent = "No tools available yet.";
    return;
  }

  productGrid.innerHTML = customerTools.slice(0, 4)
    .map(renderToolCard).join("");

  recentGrid.innerHTML = customerTools.slice(4)
    .map(renderToolCard).join("");
}

async function loadCustomerData() {
  if (!currentUser) return;

  const [profileResult, walletResult] = await Promise.all([
    supabaseClient
      .from("rk_customer_profiles")
      .select("*")
      .eq("user_id", currentUser.id)
      .maybeSingle(),

    supabaseClient
      .from("rk_wallet_accounts")
      .select("*")
      .eq("user_id", currentUser.id)
      .eq("currency", currency)
      .maybeSingle()
  ]);

  if (profileResult.error) {
    console.error(profileResult.error.message);
  }

  if (walletResult.error) {
    console.error(walletResult.error.message);
  }

  customerProfile = profileResult.data;
  customerWallet = walletResult.data;

  renderAccount();
}

function renderAccount() {
  const content = $("rkAccountContent");
  if (!content) return;

  if (!currentUser) {
    content.innerHTML = `
      <p>Login to view your wallet, place orders and check order history.</p>
      <button class="rk-action" onclick="window.location.href='server.html#login'">
        Login / Register
      </button>
    `;
    return;
  }

  const name = customerProfile?.full_name ||
    currentUser.user_metadata?.full_name ||
    currentUser.email;

  const balance = customerWallet?.balance ?? 0;

  content.innerHTML = `
    <p>Welcome, <b>${escapeHTML(name)}</b></p>
    <div class="rk-account-grid">
      <div class="rk-info-card">
        <h3>Wallet Balance</h3>
        <h2>${money(balance)}</h2>
        <small>${escapeHTML(currency)}</small>
      </div>
      <div class="rk-info-card">
        <h3>Customer ID</h3>
        <b>${escapeHTML(customerProfile?.customer_id || "Pending")}</b>
      </div>
      <div class="rk-info-card">
        <h3>Account</h3>
        <b>${customerProfile?.is_blocked ? "Blocked" : "Active"}</b>
      </div>
    </div>
    <div style="margin-top:15px">
      <button class="rk-action" onclick="rkShowAddMoney()">Add Money Details</button>
      <button class="rk-action" onclick="rkLoadOrders()">My Orders</button>
      <button class="rk-action rk-secondary" onclick="rkLoadTransactions()">Transactions</button>
      <button class="rk-action rk-secondary" onclick="rkLogout()">Logout</button>
    </div>
    <div id="rkAccountExtra" style="margin-top:18px"></div>
  `;

  if (customerProfile?.is_blocked) {
    content.insertAdjacentHTML("beforeend", `
      <p style="color:#f87171">Your account is blocked. Please contact support.</p>
    `);
  }
}

function showModal(title, body) {
  closeModal();

  const modal = document.createElement("div");
  modal.id = "rkModal";
  modal.className = "rk-modal";

  modal.innerHTML = `
    <div class="rk-modal-box">
      <button class="rk-modal-close" onclick="rkCloseModal()">Close</button>
      <h2>${escapeHTML(title)}</h2>
      <div>${body}</div>
    </div>
  `;

  modal.addEventListener("click", event => {
    if (event.target === modal) closeModal();
  });

  document.body.appendChild(modal);
}

function closeModal() {
  $("rkModal")?.remove();
}

window.rkCloseModal = closeModal;

window.rkOpenOrder = function(toolId) {
  const tool = customerTools.find(item => Number(item.id) === Number(toolId));
  if (!tool) return;

  if (!currentUser) {
    showModal("Login Required", `
      <p>Please login before placing an order.</p>
      <button class="rk-action" onclick="window.location.href='server.html#login'">Login / Register</button>
    `);
    return;
  }

  if (customerProfile?.is_blocked) {
    showMessage("Your account is blocked. Please contact support.", true);
    return;
  }

  const required = [];
  if (tool.username_required) required.push(["username", "Username"]);
  if (tool.email_required) required.push(["email", "Email Address"]);
  if (tool.otp_enabled) required.push(["otp", "OTP"]);
  if (tool.credit_enabled) required.push(["credits", "Credits"]);

  const quantityEnabled = !!tool.quantity_enabled;
  const quantityField = quantityEnabled
    ? `<label>Quantity</label><input id="rkOrderQuantity" type="number" min="${Number(tool.min_quantity || 1)}" max="${Number(tool.max_quantity || 999999)}" value="${Number(tool.min_quantity || 1)}">`
    : "";

  const fields = required.map(([key, label]) => `
    <label>${escapeHTML(label)}</label>
    <input id="rkField_${key}" ${key === "email" ? 'type="email"' : "type='text'"} placeholder="Enter ${escapeHTML(label)}">
  `).join("");

  showModal("Place Order", `
    <h3>${escapeHTML(tool.name)}</h3>
    <p>${escapeHTML(tool.description || "")}</p>
    <p>Price: <b>${money(toolPrice(tool))}</b></p>
    <p>Wallet: <b>${money(customerWallet?.balance || 0)}</b></p>
    ${fields}
    ${quantityField}
    <p class="rk-muted">Your wallet will be charged when the order is placed.</p>
    <button class="rk-action" id="rkConfirmOrder">Confirm Place Order</button>
    <p id="rkOrderMessage"></p>
  `);

  $("rkConfirmOrder").addEventListener("click", () => rkSubmitOrder(tool));
};

async function rkSubmitOrder(tool) {
  const button = $("rkConfirmOrder");
  const message = $("rkOrderMessage");

  const details = {};

  for (const [key, required, label] of [
    ["username", tool.username_required, "Username"],
    ["email", tool.email_required, "Email"],
    ["otp", tool.otp_enabled, "OTP"],
    ["credits", tool.credit_enabled, "Credits"]
  ]) {
    if (required) {
      const value = $("rkField_" + key)?.value.trim();
      if (!value) {
        message.textContent = label + " is required.";
        return;
      }
      details[key] = value;
    }
  }

  let quantity = 1;

  if (tool.quantity_enabled) {
    quantity = Number($("rkOrderQuantity")?.value || 0);
    if (!Number.isInteger(quantity) ||
        quantity < Number(tool.min_quantity || 1) ||
        (Number(tool.max_quantity || 0) > 0 &&
         quantity > Number(tool.max_quantity))) {
      message.textContent = "Please enter a valid quantity.";
      return;
    }
  }

  button.disabled = true;
  button.textContent = "Processing...";
  message.textContent = "Please wait...";

  try {
    const { data, error } = await supabaseClient.rpc("rk_place_order", {
      p_tool_id: tool.id,
      p_currency: currency,
      p_details: details,
      p_quantity: quantity
    });

    if (error) throw error;

    if (!data?.success) {
      throw new Error(data?.message || "Order could not be placed.");
    }

    closeModal();
    showMessage("Order placed successfully! Order ID: " + data.order_code);

    await loadCustomerData();
    await rkLoadOrders();
  } catch (error) {
    message.textContent = error.message;
    button.disabled = false;
    button.textContent = "Confirm Place Order";
  }
}

window.rkLoadOrders = async function() {
  if (!currentUser) return;

  const extra = $("rkAccountExtra");
  if (!extra) return;

  extra.innerHTML = "<p>Loading orders...</p>";

  const { data, error } = await supabaseClient
    .from("orders")
    .select("id,order_code,tool_name,amount,currency,status,payment_status,refund_status,result,created_at")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    extra.textContent = "Could not load orders: " + error.message;
    return;
  }

  if (!data?.length) {
    extra.innerHTML = "<div class='rk-empty'>No orders yet.</div>";
    return;
  }

  extra.innerHTML = `
    <h3>My Orders</h3>
    ${data.map(order => `
      <div class="rk-order">
        <b>${escapeHTML(order.tool_name)}</b>
        <p>Order: ${escapeHTML(order.order_code || order.id)}</p>
        <p>Amount: ${money(order.amount, order.currency)}</p>
        <p>Status: <span class="rk-status">${escapeHTML(order.status)}</span></p>
        <p>Payment: ${escapeHTML(order.payment_status || "Paid")}</p>
        <p>Refund: ${escapeHTML(order.refund_status || "Not Refunded")}</p>
        ${order.result ? `<p><b>Result / Delivery:</b><br>${escapeHTML(order.result)}</p><button class="rk-action" onclick="rkCopyResult(${JSON.stringify(order.result).replace(/"/g, "&quot;")})">Copy Result</button>` : ""}
        <small>${escapeHTML(new Date(order.created_at).toLocaleString())}</small>
      </div>
    `).join("")}
  `;
};

window.rkCopyResult = async function(value) {
  try {
    await navigator.clipboard.writeText(value);
    showMessage("Result copied.");
  } catch {
    showMessage("Could not copy result. Please select and copy manually.", true);
  }
};

window.rkLoadTransactions = async function() {
  if (!currentUser) return;

  const extra = $("rkAccountExtra");
  extra.innerHTML = "<p>Loading transactions...</p>";

  const { data, error } = await supabaseClient
    .from("rk_wallet_transactions")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    extra.textContent = "Could not load transactions: " + error.message;
    return;
  }

  if (!data?.length) {
    extra.innerHTML = "<div class='rk-empty'>No transactions yet.</div>";
    return;
  }

  extra.innerHTML = `
    <h3>Wallet Transactions</h3>
    ${data.map(tx => `
      <div class="rk-order">
        <b>${escapeHTML(tx.description || tx.transaction_type)}</b>
        <p>${escapeHTML(tx.transaction_type)}: ${money(tx.amount, tx.currency)}</p>
        <small>${escapeHTML(new Date(tx.created_at).toLocaleString())}</small>
      </div>
    `).join("")}
  `;
};

window.rkShowAddMoney = function() {
  const upi = settingValue("upi_id");
  const qr = settingValue("payment_qr_url");
  const email = settingValue("contact_email");
  const whatsapp = settingValue("whatsapp_number");

  showModal("Add Money Details", `
    <p>Pay using the details configured by RK SOFTWARE Admin.</p>
    ${upi ? `<p><b>UPI ID:</b> ${escapeHTML(upi)}</p><button class="rk-action" onclick="rkCopyResult(${JSON.stringify(String(upi)).replace(/"/g, "&quot;")})">Copy UPI ID</button>` : "<p>UPI ID has not been configured yet.</p>"}
    ${qr ? `<p><b>Payment QR:</b></p><img src="${escapeHTML(qr)}" alt="Payment QR" style="max-width:220px;width:100%;background:white;padding:8px;border-radius:8px">` : "<p>Payment QR has not been configured yet.</p>"}
    <p class="rk-muted">After payment, contact support with your payment reference. Wallet balance is not credited automatically by this display.</p>
    ${email ? `<p>Email: <a style="color:#f59e0b" href="mailto:${escapeHTML(email)}">${escapeHTML(email)}</a></p>` : ""}
    ${whatsapp ? `<p>WhatsApp: ${escapeHTML(whatsapp)}</p>` : ""}
  `);
};

window.rkLogout = async function() {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    showMessage(error.message, true);
    return;
  }

  currentUser = null;
  customerProfile = null;
  customerWallet = null;

  await startApp();
  showMessage("Logged out successfully.");
};

async function startApp() {
  injectStyles();
  ensureAccountArea();

  const sessionResult = await supabaseClient.auth.getSession();

  if (sessionResult.error) {
    showMessage(sessionResult.error.message, true);
    return;
  }

  currentUser = sessionResult.data.session?.user || null;

  if (currentUser) {
    const profileResult = await supabaseClient
      .from("rk_customer_profiles")
      .select("currency")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    currency = profileResult.data?.currency ||
      currentUser.user_metadata?.currency || "INR";
  } else {
    currency = $("currency")?.value || "INR";
  }

  if ($("currency")) $("currency").value = currency;

  await loadWebsiteSettings();
  await loadTools();

  if (currentUser) {
    await loadCustomerData();
  } else {
    renderAccount();
  }
}

if ($("currency")) {
  $("currency").addEventListener("change", async event => {
    currency = event.target.value;
    renderTools();

    if (currentUser) {
      await loadCustomerData();
    }
  });
}

if ($("menuToggle")) {
  $("menuToggle").addEventListener("click", () => {
    $("mainNav")?.classList.toggle("open");
  });
}

if ($("year")) {
  $("year").textContent = new Date().getFullYear();
}

supabaseClient.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user || null;
  setTimeout(() => startApp(), 0);
});

startApp();
