console.log("🔥 script.js chargé correctement !");

// === LUMIGENCY SIMULATEUR — V2 CLEAN ===

// ---- 1) Defaults secteur (baromètre CPA 2025) ----
const SECTOR_DEFAULTS = {
  fashion:     { aov: 66.67, cvr: 0.0155, roi: 14.43, levers: { bonsplans: 24, retargeting: 15, display: 16 } },
  electronics: { aov: 110.93, cvr: 0.0171, roi: 17.31, levers: { comparateurs: 20, css: 18, retargeting: 12 } },
  home:        { aov: 112.69, cvr: 0.0160, roi: 20.71, levers: { cashback: 22, bonsplans: 19, display: 15 } },
  food:        { aov: 80.71,  cvr: 0.0216, roi: 25.65, levers: { emailing: 23, cashback: 18, comparateurs: 15 } },
  sports:      { aov: 79.21,  cvr: 0.0107, roi: 11.08, levers: { bonsplans: 20, influence: 15, display: 14 } },
  travel:      { aov: 171.80, cvr: 0.0125, roi: 24.03, levers: { comparateurs: 25, css: 20, display: 18 } },
  luxury:      { aov: 200.00, cvr: 0.0120, roi: 18.00, levers: { influence: 22, content: 18, emailing: 12 } },
  auto:        { aov: 85.59,  cvr: 0.0169, roi: 13.02, levers: { comparateurs: 21, css: 17, retargeting: 15 } },
  services:    { aov: 60.24,  cvr: 0.0184, roi: 12.73, levers: { content: 20, emailing: 19, ppc: 15 } },
  other:       { aov: 80,     cvr: 0.015,  roi: 15,    levers: { display: 18, cashback: 14, bonsplans: 13 } }
};

// ---- 2) Pondérations par levier ----
const LEVER_WEIGHTS = {
  cashback:     { orders: 1.10, aov: 0.95, note: "Cashback : volumes accrus, panier un peu plus bas." },
  bonsplans:    { orders: 1.15, aov: 0.90, note: "Bons plans : croissance rapide, pression sur le panier." },
  retargeting:  { orders: 1.15, aov: 1.00, note: "Retargeting : améliore la conversion." },
  css:          { orders: 1.10, aov: 1.00, note: "CSS : intention forte, conversion saine." },
  comparateurs: { orders: 1.10, aov: 1.00, note: "Comparateurs : intention d’achat, bon mix." },
  display:      { orders: 1.05, aov: 1.00, note: "Display : visibilité, uplift modéré." },
  content:      { orders: 1.08, aov: 1.02, note: "Content commerce : panier et confiance." },
  emailing:     { orders: 1.10, aov: 1.01, note: "Emailing : très ROIste si base saine." },
  ppc:          { orders: 1.25, aov: 1.00, note: "PPC/SEA : gros volume, surveiller le CAC." },
  influence:    { orders: 1.20, aov: 0.98, note: "Influence : notoriété + ventes incrémentales." }
};

// ---- 3) Ajustement du trafic annualisé ----
function annualAffiliatedTraffic(trafficMonthly) {
  if (trafficMonthly < 10000) return trafficMonthly * 0.20 * 6 + trafficMonthly * 0.30 * 6;
  if (trafficMonthly < 50000) return trafficMonthly * 0.40 * 6 + trafficMonthly * 0.30 * 6;
  if (trafficMonthly < 500000) return trafficMonthly * 0.40 * 12;
  return trafficMonthly * 0.70 * 12;
}

// ---- 4) Gestion du formulaire ----
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-simu");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Inputs
    const trafficMonthly = numberOf(form.elements["traffic"]?.value);
    const aovInput       = numberOf(form.elements["aov"]?.value);
    const cvrInputPct    = numberOf(form.elements["cvr"]?.value);
    const budgetMensuel  = numberOf(form.elements["budget"]?.value);
    const cacMax         = numberOf(form.elements["cac"]?.value);
    const sectorKey      = form.elements["sector"]?.value || "other";

    const sector = SECTOR_DEFAULTS[sectorKey] || SECTOR_DEFAULTS.other;
    const aov = aovInput > 0 ? aovInput : sector.aov;
    const cvr = (cvrInputPct > 0 ? cvrInputPct : sector.cvr * 100) / 100;

    // Trafic affilié
    const affiliatedTrafficYear = annualAffiliatedTraffic(trafficMonthly);

    // Commandes
    let baseOrders = affiliatedTrafficYear * cvr;

    // Pondérations leviers
    let ordersFactor = 1, aovFactor = 1;
    const leverNotes = [];
    const selectedLevers = Array.from(form.querySelectorAll('input[name="levers"]:checked')).map(n => n.value);
    selectedLevers.forEach(lv => {
      const w = LEVER_WEIGHTS[lv];
      if (w) { ordersFactor *= w.orders; aovFactor *= w.aov; if (w.note) leverNotes.push(w.note); }
    });

    // Résultats bruts
    const finalOrders  = Math.round(baseOrders * ordersFactor);
    const adjAOV       = aov * aovFactor;
    const finalRevenue = Math.round(finalOrders * adjAOV);

    // 💼 Budget affiliation annuel
    const budgetTheorique = cacMax * finalOrders;
    const budgetAnnuel = Math.min(budgetTheorique, budgetMensuel * 12);

    // Analyse narrative
    const insights = [];
    insights.push(`📊 Sur la base de vos données et du secteur ${sectorKey}, voici quelques enseignements :`);
    if (aov > sector.aov * 1.1) insights.push(`Votre panier moyen (${format€(aov)}) est supérieur à la moyenne du secteur (${format€(sector.aov)}), signe d’une bonne valorisation client.`);
    else if (aov < sector.aov * 0.9) insights.push(`Votre panier moyen (${format€(aov)}) est en dessous de la moyenne du secteur (${format€(sector.aov)}), ce qui peut limiter la marge.`);
    else insights.push(`Votre panier moyen (${format€(aov)}) est cohérent avec celui de votre secteur (${format€(sector.aov)}).`);

    if (cvr > sector.cvr * 1.1) insights.push(`Votre taux de conversion (${(cvr*100).toFixed(2)}%) est au-dessus de la moyenne (${(sector.cvr*100).toFixed(2)}%).`);
    else if (cvr < sector.cvr * 0.9) insights.push(`Votre taux de conversion (${(cvr*100).toFixed(2)}%) est inférieur à la moyenne (${(sector.cvr*100).toFixed(2)}%).`);
    else insights.push(`Votre taux de conversion (${(cvr*100).toFixed(2)}%) est proche de la moyenne (${(sector.cvr*100).toFixed(2)}%).`);

    leverNotes.forEach(n => insights.push(n));

    // Comparatif leviers sectoriels
    const leverComparisons = [];
    Object.entries(sector.levers).forEach(([lever, share]) => {
      if (!selectedLevers.includes(lever) && share >= 15) {
        leverComparisons.push(`⚠️ ${lever} représente ${share}% des ventes dans votre secteur, mais vous ne l’avez pas activé.`);
      } else if (selectedLevers.includes(lever)) {
        leverComparisons.push(`✅ Vous avez activé ${lever}, qui pèse ${share}% des ventes dans votre secteur.`);
      }
    });

    // CTA
    const ctaText = "📅 Prenez RDV pour aller plus loin dans l’analyse ou créer votre programme d’affiliation";

    // Affichage
    showResults(finalRevenue, finalOrders, budgetAnnuel, insights, leverComparisons, ctaText);
  });
});

// ---- Helpers ----
function showResults(revenue, orders, budget, insights, leverComparisons, ctaText) {
  document.getElementById("kpi-revenue").textContent = format€(revenue);
  document.getElementById("kpi-orders").textContent  = formatInt(orders);
  document.getElementById("kpi-cac").textContent     = format€(budget);

  const insightsBox = document.getElementById("insights");
  insightsBox.innerHTML = `
    <h3>📊 Analyse rapide</h3>
    <ul>${insights.map(t => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
    <h3>🎯 Leviers activés et analyse sectorielle</h3>
    <ul>${leverComparisons.map(t => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
    <a id="cta-link" href="https://www.lumigency.com/consultation-gratuite" class="cta">${ctaText}</a>
    <p><em>⚠️ Ces chiffres sont des estimations indicatives et non des valeurs garanties.</em></p>
  `;
}

function numberOf(v) { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? 0 : n; }
function format€(n) { return new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n); }
function formatInt(n) { return new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(Math.round(n)); }
function escapeHtml(str) { return String(str).replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[s])); }
