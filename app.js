const products = [
  {name:"Unlock Tool", tag:"UNLOCK", category:"Server Tool", delivery:"Manual / API later"},
  {name:"MDM Fix Tool", tag:"MDM FIX", category:"Device Service", delivery:"Manual / API later"},
  {name:"MRST Credit", tag:"MRST", category:"Server Credit", delivery:"Manual / API later"},
  {name:"FRP Unlock Tool", tag:"FRP", category:"Unlock Service", delivery:"Manual / API later"},
  {name:"Z3X", tag:"Z3X", category:"Server Tool", delivery:"Manual / API later"},
  {name:"TSM Pro Credit", tag:"TSM PRO", category:"Server Credit", delivery:"Manual / API later"},
  {name:"Vivo ADB", tag:"VIVO ADB", category:"Device Service", delivery:"Manual / API later"}
];
let currency = "INR";
const symbol = () => currency === "INR" ? "₹" : "$";
function card(p){return `<article class="product"><div class="product-image">${p.tag}</div><div class="product-body"><h3>${p.name}</h3><div class="product-meta"><span>${p.category}</span><b class="price">${symbol()}0</b></div><div class="product-meta" style="margin-top:9px"><span>Delivery</span><span>${p.delivery}</span></div><button type="button" onclick="alert('Service details and secure ordering will be enabled after backend/API setup.')">View Details</button></div></article>`}
function render(){document.getElementById("productGrid").innerHTML=products.slice(0,4).map(card).join("");document.getElementById("recentGrid").innerHTML=products.slice(4).map(card).join("")}
document.getElementById("currency").addEventListener("change",e=>{currency=e.target.value;render()});
document.getElementById("menuToggle").addEventListener("click",()=>document.getElementById("mainNav").classList.toggle("open"));
document.getElementById("year").textContent=new Date().getFullYear();
render();