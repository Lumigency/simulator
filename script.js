// === LUMIGENCY SIMULATEUR — V3 (Budget-first) ===
console.log("🔥 script.js bien chargé !");

// === Defaults secteur (baromètre CPA 2025) ===
const SECTOR_DEFAULTS = {
  fashion:     { aov: 66.67, cvr: 0.0155, roi: 14.43, label: "Mode & Beauté" },
  electronics: { aov: 110.93, cvr: 0.0171, roi: 17.31, label: "High Tech & Électroménager" },
  home:        { aov: 112.69, cvr: 0.0160, roi: 20.71, label: "Maison & Décoration" },
  food:        { aov: 80.71, cvr: 0.0216, roi: 25.65, label: "Alimentaire & Drive" },
  sports:      { aov: 79.21, cvr: 0.0107, roi: 11.08, label: "Sport & Loisirs" },
  travel:      { aov: 171.80, cvr: 0.0125, roi: 24.03, label: "Voyage & Tourisme" },
  luxury:      { aov: 200.00, cvr: 0.0120, roi: 18.00, label: "Luxe & Bijoux" },
  auto:        { aov: 85.59, cvr: 0.0169, roi: 13.02, label: "Automobile" },
  services:    { aov: 60.24, cvr: 0.0184, roi: 12.73, label: "B2B / Finance / Assurance" },
  culture:     { aov: 82.61, cvr: 0.0228, roi: 16.50, label: "Produits culturels & Loisirs" },
  other:       { aov: 80, cvr: 0.015, roi: 15, label: "Autre" }
};

// === Parts de ventes par leviers (CPA 2025) ===
const SECTOR_SHARES = {
  fashion: {
    cashback: 0.12, bonsplans: 0.24, comparateurs: 0.02, emailing: 0.12,
    retargeting: 0.15, affinitaires: 0.14, display: 0.16, content: 0.12
  },
  travel: {
    cashback: 0.21, comparateurs: 0.27, content: 0.04, bonsplans: 0.05,
    affinitaires: 0.11, emailing: 0.14, "display-networks": 0.18
  },
  auto: {
    cashback: 0.13, bonsplans: 0.30, comparateurs: 0.11, emailing: 0.12,
    retargeting: 0.12, affinitaires: 0.05, "display-networks": 0.12, content: 0.04
  },
  food: {
    cashback: 0.21, bonsplans: 0.41, comparateurs: 0.09, emailing: 0.03,
    retargeting: 0.20, affinitaires: 0.03, display: 0.03, content: 0.01
  }
};

// === Pondérations par levier ===
const LEVER_WEIGHTS = {
  cashback: { orders: 1.10, aov: 0.95, note: "💰 Cashback : volumes accrus, panier plus bas." },
  bonsplans: { orders: 1.15, aov: 0.90, note: "🏷️ Bons plans : croissance rapide, panier réduit." },
  retargeting: { orders: 1.15, aov: 1.00, note: "🎯 Retargeting : améliore la conversion." },
  css: { orders: 1.10, aov: 1.00, note: "🛍️ CSS : intention forte, conversion saine." },
  comparateurs: { orders: 1.10, aov: 1.00, note: "🛍️ Comparateurs : intention d’achat, bon mix." },
  display: { orders: 1.05, aov: 1.00, note: "📣 Display : visibilité, uplift modéré." },
  "display-networks": { orders: 1.05, aov: 1.00, note: "📣 Display networks : uplift modéré direct." },
  retention: { orders: 1.10, aov: 1.02, note: "🔁 Rétention on-site : panier & LTV améliorés." },
  content: { orders: 1.08, aov: 1.02, note: "📰 Content commerce : panier et confiance." },
  emailing: { orders: 1.10, aov: 1.01, note: "✉️ Emailing/NL : très ROIste si base saine." },
  ppc: { orders: 1.25, aov: 1.00, note: "🔍 PPC/SEA : gros volume, surveiller le CAC." },
  affinitaires: { orders: 1.12, aov: 1.02, note: "🤝 Affinitaires : audience quali, meilleure valeur." },
  influence: { orders: 1.20, aov: 0.98, note: "🌟 Influence : notoriété + ventes incrémentales." }
};

// === Ajustement trafic annualisé ===
function annualAffiliatedTraffic(trafficMonthly) {
  if (trafficMonthly < 10000) return trafficMonthly * 0.20 * 6 + trafficMonthly * 0.30 * 6;
  if (trafficMonthly < 50000) return trafficMonthly * 0.40 * 6 + trafficMonthly * 0.30 * 6;
  if (trafficMonthly < 500000) return trafficMonthly * 0.40 * 12;
  return trafficMonthly * 0.70 * 12;
}

// === Gestion du formulaire ===
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-simu");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const trafficMonthly = numberOf(form.elements["traffic"]?.value);
    const aovInput = numberOf(form.elements["aov"]?.value);
    const cvrInputPct = numberOf(form.elements["cvr"]?.value);
    const budgetMensuel = numberOf(form.elements["budget"]?.value);
    const sectorKey = form.elements["sector"]?.value || "other";
    const sector = SECTOR_DEFAULTS[sectorKey] || SECTOR_DEFAULTS.other;

    const aov = aovInput > 0 ? aovInput : sector.aov;
    const cvr = (cvrInputPct > 0 ? cvrInputPct : sector.cvr * 100) / 100;

    const affiliatedTrafficYear = annualAffiliatedTraffic(trafficMonthly);
    let baseOrders = affiliatedTrafficYear * cvr;

    // --- Pondérations leviers ---
    let ordersFactor = 1, aovFactor = 1;
    const leverNotes = [];
    const selectedLevers = Array.from(form.querySelectorAll('input[name="levers"]:checked')).map(n => n.value);
    selectedLevers.forEach(lv => {
      const w = LEVER_WEIGHTS[lv];
      if (w) { ordersFactor *= w.orders; aovFactor *= w.aov; if (w.note) leverNotes.push(w.note); }
    });

    const finalOrders = Math.round(baseOrders * ordersFactor);
    const adjAOV = aov * aovFactor;
    const finalRevenue = Math.round(finalOrders * adjAOV);

    // --- CAC & budget affiliation ---
    const cac = finalOrders > 0 ? (budgetMensuel * 12) / finalOrders : Infinity;
    let budgetAff = cac * finalOrders;
    const budgetCap = budgetMensuel * 12;
    if (budgetAff > budgetCap) budgetAff = budgetCap;

    // --- Insights ---
    const insights = [];
    insights.push(`💼 Budget annuel affiliation estimé : ${formatEur(budgetAff)} (cappé par ${formatEur(budgetCap)}).`);
    insights.push(`📅 Estimations projetées sur 12 mois (levier long terme).`);
    insights.push(`🏷️ Secteur choisi : ${sector.label}.`);

    // Panier
    if (aov > sector.aov * 1.1) insights.push(`🛒 Panier moyen (${formatEur(aov)}) > moyenne du secteur (${formatEur(sector.aov)}).`);
    else if (aov < sector.aov * 0.9) insights.push(`⚠️ Panier moyen (${formatEur(aov)}) < secteur (${formatEur(sector.aov)}).`);
    else insights.push(`✅ Panier moyen (${formatEur(aov)}) ~ cohérent avec le secteur.`);

    // Conversion
    if (cvr > sector.cvr * 1.1) insights.push(`✅ Taux de conversion ${(cvr*100).toFixed(2)}% > secteur ${(sector.cvr*100).toFixed(2)}%.`);
    else if (cvr < sector.cvr * 0.9) insights.push(`📉 Taux de conversion ${(cvr*100).toFixed(2)}% < secteur ${(sector.cvr*100).toFixed(2)}%.`);
    else insights.push(`✅ Taux de conversion ${(cvr*100).toFixed(2)}% ~ cohérent avec secteur.`);

    leverNotes.forEach(n => insights.push(n));

    // --- Analyse sectorielle leviers clés ---
    const sectorShares = SECTOR_SHARES[sectorKey] || {};
    const leverAnalysis = [];
    Object.entries(sectorShares).forEach(([lever, share]) => {
      if (share >= 0.15) {
        if (selectedLevers.includes(lever)) {
          leverAnalysis.push(`✅ Vous avez activé ${lever}, qui pèse ${Math.round(share*100)}% des ventes dans votre secteur.`);
        } else {
          leverAnalysis.push(`⚠️ ${lever} représente ${Math.round(share*100)}% des ventes dans votre secteur, mais vous ne l’avez pas activé.`);
        }
      }
    });

    // --- CTA ---
    let ctaText = "📅 Prenez RDV pour aller plus loin dans l’analyse ou créer votre programme d’affiliation";

    showResults(finalRevenue, finalOrders, cac, insights, ctaText, leverAnalysis);
  });
});

// === Helpers ===
function showResults(revenue, orders, cac, insights, ctaText, leverAnalysis) {
  document.getElementById("kpi-revenue").textContent = formatEur(revenue);
  document.getElementById("kpi-orders").textContent  = formatInt(orders);
  document.getElementById("kpi-cac").textContent     = isFinite(cac) ? formatEur(cac) : "—";

  const insightsBox = document.getElementById("insights");
  if (insightsBox) {
    insightsBox.innerHTML = `
      <h3>📊 Vous voilà avec vos potentielles futures performances :</h3>
      <ul>${insights.map(t => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
      <h3>🎯 Leviers activés et analyse sectorielle :</h3>
      <ul>${leverAnalysis.map(t => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
    `;
  }

  const ctaLink = document.getElementById("cta-link");
  if (ctaLink) {
    ctaLink.outerHTML = `
      <button class="cta" onclick="window.location.href='https://www.lumigency.com/consultation-gratuite'">
        ${ctaText}
      </button>
    `;
  }

  document.getElementById("results").style.display = "block";
}

function numberOf(v) { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? 0 : n; }
function formatEur(n) { return new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n); }
function formatInt(n) { return new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(Math.round(n)); }
function escapeHtml(str) { return String(str).replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[s])); }
