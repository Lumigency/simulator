console.log("🔥 script.js bien chargé !");
console.log("✅ Script Lumigency chargé");

// === LUMIGENCY SIMULATEUR — V2 SMART ===

// ---- 1) Defaults secteur (baromètre CPA 2025) ----
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

// ---- 2) Pondérations par levier ----
const LEVER_WEIGHTS = {
  cashback:        { orders: 1.10, aov: 0.95, note: "💰 Cashback : +volumes, panier un peu plus bas." },
  bonsplans:       { orders: 1.15, aov: 0.90, note: "🏷️ Bons plans : croissance rapide, pression sur le panier." },
  retargeting:     { orders: 1.15, aov: 1.00, note: "🎯 Retargeting : optimise la conversion." },
  css:             { orders: 1.10, aov: 1.00, note: "🛍️ CSS/Comparateurs : intention forte, conversion saine." },
  comparateurs:    { orders: 1.10, aov: 1.00, note: "🛍️ Comparateurs : intention d’achat, bon mix." },
  display:         { orders: 1.05, aov: 1.00, note: "📣 Display : visibilité, uplift modéré direct." },
  "display-networks": { orders: 1.05, aov: 1.00, note: "📣 Display networks : visibilité, uplift modéré direct." },
  retention:       { orders: 1.10, aov: 1.02, note: "🔁 Rétention on-site : panier & LTV améliorés." },
  content:         { orders: 1.08, aov: 1.02, note: "📰 Content commerce : panier et confiance." },
  emailing:        { orders: 1.10, aov: 1.01, note: "✉️ Emailing/NL : très ROIste si base saine." },
  ppc:             { orders: 1.25, aov: 1.00, note: "🔍 PPC/SEA : gros volume, surveiller le CAC." },
  affinitaires:    { orders: 1.12, aov: 1.02, note: "🤝 Affinitaires : audience quali, meilleure valeur." },
  influence:       { orders: 1.20, aov: 0.98, note: "🌟 Influence : notoriété + ventes incrémentales." }
};

// ---- 3) Ajustement du trafic (annualisé 12 mois) ----
function annualAffiliatedTraffic(trafficMonthly) {
  if (trafficMonthly < 10000) {
    return trafficMonthly * 0.20 * 6 + trafficMonthly * 0.30 * 6;
  }
  if (trafficMonthly < 50000) {
    return trafficMonthly * 0.40 * 6 + trafficMonthly * 0.30 * 6;
  }
  if (trafficMonthly < 500000) {
    return trafficMonthly * 0.40 * 12;
  }
  return trafficMonthly * 0.70 * 12;
}

// ---- 4) Gestion du formulaire ----
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-simu");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // --- Inputs utilisateur
    const trafficMonthly = numberOf(form.elements["traffic"]?.value);
    const aovInput       = numberOf(form.elements["aov"]?.value);
    const cvrInputPct    = numberOf(form.elements["cvr"]?.value);
    const budget         = numberOf(form.elements["budget"]?.value);
    const cacMax         = numberOf(form.elements["cac"]?.value);
    const sectorKey      = form.elements["sector"]?.value || "other";

    const sector = SECTOR_DEFAULTS[sectorKey] || SECTOR_DEFAULTS.other;

    const aov = aovInput > 0 ? aovInput : sector.aov;
    const cvr = (cvrInputPct > 0 ? cvrInputPct : sector.cvr * 100) / 100;

    // --- Trafic affilié annualisé
    const affiliatedTrafficYear = annualAffiliatedTraffic(trafficMonthly);

    // --- Commandes de base
    let baseOrders = affiliatedTrafficYear * cvr;

    // --- Pondérations leviers
    let ordersFactor = 1, aovFactor = 1;
    const leverNotes = [];
    const selectedLevers = Array.from(form.querySelectorAll('input[name="levers"]:checked')).map(n => n.value);
    selectedLevers.forEach(lv => {
      const w = LEVER_WEIGHTS[lv];
      if (w) { 
        ordersFactor *= w.orders; 
        aovFactor *= w.aov; 
        if (w.note) leverNotes.push(w.note); 
      }
    });

    // --- Résultats bruts
    const finalOrders  = Math.round(baseOrders * ordersFactor);
    const adjAOV       = aov * aovFactor;
    const finalRevenue = Math.round(finalOrders * adjAOV);
    const cac          = finalOrders > 0 ? budget / finalOrders : Infinity;

    // --- Comparatif secteur
    const insights = [];
    insights.push("📅 Estimations projetées sur 12 mois (l’affiliation est un levier long terme).");
    insights.push(`🏷️ Secteur choisi : ${sector.label}.`);

    // Panier moyen
    if (aov > sector.aov * 1.1) insights.push(`🛒 Votre panier moyen (${format€(aov)}) est supérieur à la moyenne du secteur (${format€(sector.aov)}).`);
    else if (aov < sector.aov * 0.9) insights.push(`⚠️ Votre panier moyen (${format€(aov)}) est inférieur à la moyenne du secteur (${format€(sector.aov)}).`);
    else insights.push(`✅ Votre panier moyen (${format€(aov)}) est proche de la moyenne du secteur (${format€(sector.aov)}).`);

    // Conversion
    if (cvr > sector.cvr * 1.1) insights.push(`✅ Votre taux de conversion (${(cvr*100).toFixed(2)}%) est au-dessus de la moyenne sectorielle (${(sector.cvr*100).toFixed(2)}%).`);
    else if (cvr < sector.cvr * 0.9) insights.push(`📉 Votre taux de conversion (${(cvr*100).toFixed(2)}%) est en dessous de la moyenne sectorielle (${(sector.cvr*100).toFixed(2)}%).`);
    else insights.push(`✅ Votre taux de conversion (${(cvr*100).toFixed(2)}%) est cohérent avec votre secteur (${(sector.cvr*100).toFixed(2)}%).`);

    // CAC comparatif (approx via ROI secteur -> CAC moyen sectoriel ~ 1/ROI)
    const sectorCAC = 1 / sector.roi * aov; 
    if (isFinite(cac) && finalOrders > 0) {
      if (cac < sectorCAC) insights.push(`🚀 Votre CAC simulé (${format€(cac)}) est meilleur que la moyenne du secteur (~${format€(sectorCAC)}).`);
      else insights.push(`⚠️ Votre CAC simulé (${format€(cac)}) est au-dessus de la moyenne du secteur (~${format€(sectorCAC)}).`);
    }

    // Leviers
    if (leverNotes.length) leverNotes.forEach(n => insights.push(n));
    else insights.push("ℹ️ Aucun levier sélectionné : résultats basés uniquement sur le trafic et la conversion.");

    // Trafic pris en compte
    insights.push(`👥 Trafic annuel pris en compte après règles : ${formatInt(affiliatedTrafficYear)} visites.`);

    // CTA contextuel
    let ctaText = "";
    if (cac < sectorCAC && cvr >= sector.cvr) {
      ctaText = "✅ Vous êtes bien positionné ! Passez à l’action pour accélérer vos performances → réservez un RDV gratuit.";
    } else {
      ctaText = "📊 Vos résultats montrent un potentiel d’optimisation. Découvrez votre positionnement exact par rapport au marché → réservez un RDV gratuit.";
    }

    // --- Affichage
    showResults(finalRevenue, finalOrders, cac, insights, ctaText);
  });
});

// ---- Helpers ----
function showResults(revenue, orders, cac, insights, ctaText) {
  document.getElementById("kpi-revenue").textContent = format€(revenue);
  document.getElementById("kpi-orders").textContent  = formatInt(orders);
  document.getElementById("kpi-cac").textContent     = isFinite(cac) ? format€(cac) : "—";

  const insightsBox = document.getElementById("insights");
  if (insightsBox) {
    insightsBox.innerHTML = `<h3>💡 Insights personnalisés</h3><ul>${insights.map(t => `<li>${escapeHtml(t)}</li>`).join("")}</ul>`;
  }

  const ctaLink = document.getElementById("cta-link");
  if (ctaLink) ctaLink.textContent = ctaText;

  document.getElementById("results").style.display = "block";
}

function numberOf(v) { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? 0 : n; }
function format€(n) { return new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n); }
function formatInt(n) { return new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(Math.round(n)); }
function escapeHtml(str) { return String(str).replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[s])); }

