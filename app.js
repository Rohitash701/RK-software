const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const seedProducts = [
  {id:1,title:"Unlock Tool · 6 Hours",category:"unlock",price:0.51,delivery:"Instant",desc:"Sample server access listing for demonstration."},
  {id:2,title:"Android Multi Tool (AMT) · 2 Hours",category:"utility",price:0.42,delivery:"Instant",desc:"Sample Android utility listing for demonstration."},
  {id:3,title:"TSM Pro Rent · 5 Hours",category:"unlock",price:0.74,delivery:"Manual",desc:"Sample tool rental listing for demonstration."},
  {id:4,title:"MDM Fix Beta · 2 Hours",category:"utility",price:3.57,delivery:"Instant",desc:"Sample device-management service listing."},
  {id:5,title:"Premium Server Credit",category:"unlock",price:2.00,delivery:"Manual",desc:"Sample credit product. Configure your actual service details."},
  {id:6,title:"Remote Service Enquiry",category:"utility",price:1.25,delivery:"Manual",desc:"Sample remote service listing; availability must be confirmed."}
];
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
let products = read("rk_products", seedProducts);
let currentUser = read("rk_current_user", null);
let authMode = "login";
let activeFilter = "all";
const money = n => "₹" + Number(n).toFixed(2);
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2400)}
function productMarkup(list){return list.map(p=>`<article class="tool-card"><div class="tool-top"><div class="tool-symbol">${p.category==="unlock"?"RK":"AMT"}</div><span class="tag">${escapeHtml(p.delivery)}</span></div><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.desc||"RK SOFTWARE service listing.")}</p><div class="tool-foot"><div class="price">₹${Number(p.price).toFixed(2)} <small>INR</small></div><button class="order-btn" data-order="${p.id}">Enquire / Order ↗</button></div></article>`).join("")||'<p class="form-note">No products in this category yet.</p>';}
function renderProducts(){
  const list=products.filter(p=>activeFilter==="all"||p.category===activeFilter);
  $("#toolGrid").innerHTML=productMarkup(list.slice(0,6));
  $("#recentGrid").innerHTML=productMarkup([...products].reverse().slice(0,6));
  $$("[data-order]").forEach(b=>b.addEventListener("click",()=>orderProduct(Number(b.dataset.order))));
  renderAdmin();
}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function orderProduct(id){
  const p=products.find(x=>x.id===id);if(!p)return;
  if(!currentUser){toast("Please login or register to continue.");showView("account");return}
  const orders=read("rk_orders",[]);orders.unshift({id:Date.now(),user:currentUser.email,title:p.title,price:p.price,status:"Enquiry submitted"});
  write("rk_orders",orders);toast("Demo order enquiry saved.");renderDashboard();
}
function showView(view){
  const homeSections=["home","services","tools","recent","credits","support"];
  homeSections.forEach(id=>$("#"+id).classList.toggle("hidden",view!=="home"));
  $("#account").classList.toggle("hidden",view!=="account");
  $("#admin").classList.toggle("hidden",view!=="admin");
  if(view==="account")renderDashboard();
  if(view==="admin")renderAdmin();
  window.scrollTo({top:0,behavior:"smooth"});
  $("#mainNav").classList.remove("open");
}
$$("[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
$("#menuToggle").addEventListener("click",()=>$("#mainNav").classList.toggle("open"));
$$(".nav-link").forEach(a=>a.addEventListener("click",()=>{$$(".nav-link").forEach(x=>x.classList.remove("active"));a.classList.add("active");$("#mainNav").classList.remove("open")}));
$$(".filter").forEach(b=>b.addEventListener("click",()=>{$$(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");activeFilter=b.dataset.filter;renderProducts()}));
$$("[data-auth]").forEach(b=>b.addEventListener("click",()=>setAuthMode(b.dataset.auth)));
function setAuthMode(mode){authMode=mode;$$("[data-auth]").forEach(b=>b.classList.toggle("active",b.dataset.auth===mode));$("#nameField").classList.toggle("hidden",mode!=="register");$("#nameField input").required=mode==="register";$("#authSubmit").textContent=mode==="register"?"Create account ↗":"Login to account ↗";$("#authMessage").textContent=""}
$("#authForm").addEventListener("submit",e=>{
  e.preventDefault();const fd=new FormData(e.currentTarget),email=String(fd.get("email")).trim().toLowerCase(),password=String(fd.get("password"));
  let users=read("rk_users",[]);
  if(authMode==="register"){
    if(users.some(u=>u.email===email)){ $("#authMessage").textContent="An account with this email already exists.";return}
    const user={name:String(fd.get("name")).trim(),email,password};users.push(user);write("rk_users",users);currentUser={name:user.name,email:user.email};write("rk_current_user",currentUser);toast("Demo account created.");
  }else{
    const user=users.find(u=>u.email===email&&u.password===password);
    if(!user){$("#authMessage").textContent="Login not found. Create a demo account first.";return}
    currentUser={name:user.name,email:user.email};write("rk_current_user",currentUser);toast("Logged in successfully.");
  }
  e.currentTarget.reset();renderDashboard();
});
function renderDashboard(){
  const dash=$("#dashboard"),form=$("#authForm");
  if(!currentUser){dash.classList.add("hidden");form.classList.remove("hidden");return}
  form.classList.add("hidden");dash.classList.remove("hidden");$("#dashName").textContent="Hello, "+(currentUser.name||"Customer");const orders=read("rk_orders",[]).filter(o=>o.user===currentUser.email);$("#dashOrders").textContent=orders.length;$("#dashCredits").textContent="$0.00";
  $("#orderList").innerHTML=orders.length?orders.map(o=>`<div class="admin-row"><span>${escapeHtml(o.title)} · ${money(o.price)}</span><span>${escapeHtml(o.status)}</span></div>`).join(""):"No orders yet.";
}
$("#logoutBtn").addEventListener("click",()=>{currentUser=null;localStorage.removeItem("rk_current_user");renderDashboard();toast("Logged out.")});
$("#supportForm").addEventListener("submit",e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const enquiries=read("rk_enquiries",[]);enquiries.unshift({name:fd.get("name"),contact:fd.get("contact"),message:fd.get("message"),date:new Date().toISOString()});write("rk_enquiries",enquiries);e.currentTarget.reset();toast("Enquiry saved in this browser demo.")});
$("#productForm").addEventListener("submit",e=>{e.preventDefault();const fd=new FormData(e.currentTarget);products.push({id:Date.now(),title:fd.get("title"),category:fd.get("category"),price:Number(fd.get("price")),delivery:fd.get("delivery"),desc:"Added from local admin demo."});write("rk_products",products);e.currentTarget.reset();renderProducts();toast("Product added to demo catalogue.")});
function renderAdmin(){
  const el=$("#adminProducts");if(!el)return;
  el.innerHTML=products.map(p=>`<div class="admin-row"><span><b>${escapeHtml(p.title)}</b> · ${money(p.price)} · ${escapeHtml(p.delivery)}</span><button data-delete="${p.id}">Delete</button></div>`).join("")||"No products.";
  $$("[data-delete]",el).forEach(b=>b.addEventListener("click",()=>{products=products.filter(p=>p.id!==Number(b.dataset.delete));write("rk_products",products);renderProducts();toast("Product removed.")}));
}
$("#year").textContent=new Date().getFullYear();
renderProducts();setAuthMode("login");renderDashboard();
