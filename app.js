"use strict";
const STORAGE_KEY = "sarahStockDataV1";
let data = { products: [], sales: [] };
try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) { const parsed = JSON.parse(saved);
if (
  parsed &&
  Array.isArray(parsed.products) &&
  Array.isArray(parsed.sales)
) {
  data = parsed;
}
} } catch (error) { console.error("Erreur de lecture des données :", error); }
function money(amount) { return Math.round(Number(amount) || 0) .toLocaleString("fr-FR") + " FCFA"; }
function esc(value) { return String(value).replace(/[&<>"']/g, char => ({ "&": "&", "<": "<", ">": ">", '"': """, "'": "'" })[char]); }
function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); render(); } catch (error) { alert("Impossible de sauvegarder. Vérifiez l'espace disponible."); console.error(error); } }
function show(sectionId) { document.querySelectorAll("main section").forEach(section => { section.hidden = section.id !== sectionId; });
render(); }
function render() { const count = document.getElementById("count"); if (!count) return;
document.getElementById("count").textContent = data.products.length;
document.getElementById("stock").textContent = data.products.reduce((sum, product) => sum + Number(product.qty || 0), 0 );
const today = new Date().toLocaleDateString("sv-SE");
const todaysSales = data.sales.filter(sale => sale.date.slice(0, 10) === today );
document.getElementById("today").textContent = money( todaysSales.reduce((sum, sale) => sum + sale.total, 0) );
document.getElementById("profit").textContent = money( todaysSales.reduce((sum, sale) => sum + sale.profit, 0) );
const lowStock = data.products.filter(product => Number(product.qty) <= Number(product.threshold) );
document.getElementById("alerts").innerHTML = lowStock.length ? lowStock.map(product => '' + esc(product.name) + " : " + product.qty + " bouteille(s)" ).join("") : "Aucune alerte de stock.";
document.getElementById("productRows").innerHTML = data.products.map(product => "" + "" + esc(product.name) + '
' + esc(product.brand || "") + "" + "" + product.qty + "" + "" + money(product.price) + "" + "" + '+ Stock ' + 'Supprimer' + "" ).join("");
const select = document.getElementById("saleProduct"); const previousSelection = select.value;
select.innerHTML = data.products.map(product => '' + esc(product.name) + "" ).join("");
if (data.products.some(product => String(product.id) === previousSelection )) { select.value = previousSelection; }
updateSaleInfo();
document.getElementById("salesRows").innerHTML = [...data.sales].reverse().map(sale => "" + "" + new Date(sale.date).toLocaleString("fr-FR") + "" + "" + esc(sale.name) + "" + "" + sale.qty + "" + "" + money(sale.total) + "" + "" ).join(""); }
document.getElementById("productForm").addEventListener("submit", event => { event.preventDefault();
const product = { id: Date.now(), name: document.getElementById("pname").value.trim(), brand: document.getElementById("brand").value.trim(), units: Number(document.getElementById("units").value), qty: Number(document.getElementById("qty").value), cost: Number(document.getElementById("cost").value), price: Number(document.getElementById("price").value), threshold: Number(document.getElementById("threshold").value) };
if (!product.name || product.units < 1 || product.qty < 0) { alert("Vérifiez les informations saisies."); return; }
data.products.push(product); save();
event.target.reset(); document.getElementById("units").value = 12; document.getElementById("threshold").value = 12;
alert("Boisson enregistrée !"); show("products"); });
function addStock(id) { const product = data.products.find(item => item.id === id); if (!product) return;
const quantity = prompt( "Nombre de bouteilles à ajouter pour " + product.name + " :", "12" );
if (quantity === null) return;
const number = Number(quantity);
if (!Number.isInteger(number) || number <= 0) { alert("Saisissez un nombre entier positif."); return; }
product.qty += number; save(); alert("Stock mis à jour."); }
function removeProduct(id) { if (!confirm("Supprimer cette boisson du catalogue ?")) return;
data.products = data.products.filter(product => product.id !== id); save(); }
document.getElementById("saleProduct").addEventListener( "change", updateSaleInfo );
document.getElementById("crates").addEventListener( "input", updateSaleInfo );
document.getElementById("bottles").addEventListener( "input", updateSaleInfo );
document.getElementById("cratePrice").addEventListener( "input", updateSaleInfo );
function updateSaleInfo() { const product = data.products.find(item => item.id === Number(document.getElementById("saleProduct").value) );
const crates = Number(document.getElementById("crates").value) || 0; const bottles = Number(document.getElementById("bottles").value) || 0; const cratePrice = Number(document.getElementById("cratePrice").value) || 0;
if (!product) { document.getElementById("saleInfo").textContent = "Ajoutez d'abord une boisson dans le catalogue."; return; }
const quantity = crates * product.units + bottles; const total = crates * cratePrice + bottles * product.price;
document.getElementById("saleInfo").textContent = "Stock disponible : " + product.qty + " bouteilles. Quantité vendue : " + quantity + ". Total estimé : " + money(total); }
document.getElementById("saleForm").addEventListener("submit", event => { event.preventDefault();
const product = data.products.find(item => item.id === Number(document.getElementById("saleProduct").value) );
if (!product) { alert("Ajoutez d'abord une boisson."); return; }
const crates = Number(document.getElementById("crates").value); const bottles = Number(document.getElementById("bottles").value); const cratePrice = Number(document.getElementById("cratePrice").value);
const quantity = crates * product.units + bottles;
if (!Number.isInteger(quantity) || quantity <= 0) { alert("Saisissez une quantité valide."); return; }
if (quantity > product.qty) { alert("Stock insuffisant. Il reste " + product.qty + " bouteilles."); return; }
const total = crates * cratePrice + bottles * product.price; const profit = total - quantity * product.cost;
if (!confirm( "Confirmer la vente de " + quantity + " bouteille(s) pour " + money(total) + " ?" )) return;
product.qty -= quantity;
data.sales.push({ date: new Date().toISOString(), productId: product.id, name: product.name, qty: quantity, total: total, profit: profit });
save();
event.target.reset(); document.getElementById("crates").value = 0; document.getElementById("bottles").value = 0;
alert("Vente enregistrée !"); show("dashboard"); });
function exportData() { const blob = new Blob( [JSON.stringify(data, null, 2)], { type: "application/json" } );
const url = URL.createObjectURL(blob); const link = document.createElement("a");
link.href = url; link.download = "sarah-stock-sauvegarde.json"; link.click();
setTimeout(() => URL.revokeObjectURL(url), 1000); }
document.getElementById("importFile").addEventListener("change", async event => { const file = event.target.files[0]; if (!file) return;
try { const imported = JSON.parse(await file.text());
if (
  !imported ||
  !Array.isArray(imported.products) ||
  !Array.isArray(imported.sales)
) {
  throw new Error("Fichier invalide");
}

if (!confirm(
  "Remplacer les données actuelles par celles de la sauvegarde ?"
)) return;

data = imported;
save();
alert("Sauvegarde importée avec succès.");
} catch (error) { alert("Impossible de lire cette sauvegarde."); } finally { event.target.value = ""; } });
render();
