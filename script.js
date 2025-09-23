console.log("🔥 script.js chargé !");

// === 1) Defaults secteur (CPA 2025) ===
const SECTOR_DEFAULTS = {
  fashion:     { aov: 66.67, cvr: 0.0155, label: "Mode & Beauté" },
  electronics: { aov: 110.93, cvr: 0.0171, label: "High Tech & Électroménager" },
  home:        { aov: 112.69, cvr: 0.0160, label: "Maison & Décoration" },
  food:        { aov: 80.71,  cvr: 0.0216, label: "Alimentaire & Drive" },
  sports:      { aov: 79.21,  cvr: 0.0107, label: "Sport & Loisirs" },
  travel:      { aov: 171.80, cvr: 0.0125, label: "Voyage & Tourisme" },
  luxury:      { aov: 200.00, cvr: 0.0120, label: "Luxe & Bijoux" },
  auto:        { aov: 85.59,  cvr: 0.0169, label: "Automobile" },
  services:    { aov: 60.24,  cvr: 0.0184, label: "B2B / Finance / Assurance" },
  culture:     { aov: 82.61,  cvr: 0.0228, label: "Produits culturels & Loisirs" },
  other:       { aov: 80,     cvr: 0.015,  label: "Autre" }
};

// === 2) Trafic annualisé ===
function annualAffiliatedTraffic(trafficMonthly) {
  if (trafficMonthly < 10000) {
    return trafficMonthly * (0.10 * 6 + 0.15 * 6);
  }
  if (trafficMonthly < 50000) {
    return trafficMonthly * (0.15 * 6 + 0.16 * 6);
  }
  if (trafficMonthly < 500000) {
    return trafficMonthly * 0.25 * 12;
  }
  return trafficMonthly * 0.30 * 12;
}

// === 3) Ajustement CR selon leviers ===
function adjustCVR(baseCvr, selectedLevers) {
  let cvr = baseCvr;

  if (selectedLevers.includes("cashback") || selectedLevers.includes("bonsplans")) {
    cvr *= 1.2; // boost léger
  } else {
    cvr *= 0.5; // pas de leviers volumiques = moins de conversion
  }

  if (selectedLevers.includes("retargeting")) {
    cvr *= 1.15;
  }

  if (selectedLevers.includes("influence")) {
    cvr *= 1.1;
  }

  return cvr;
}

// === 4) Répartition des ventes par leviers (baromètre simplifié) ===
const LEVER_SHARE = {
  cashback: 25,
  bonsplans: 20,
  retargeting: 15,
  comparateurs: 15,
  display: 10,
  influence: 15
};

function distributeOrders(finalOrders, selectedLevers) {
  let filteredShares = {};
  let totalShare = 0;

  for (let [lever, share] of Object.entries(LEVER_SHARE)) {
    if (selectedLevers.includes(lever)) {
      filteredShares[lever] = share;
      totalShare += share;
    }
  }

  for (let lever in filteredShares) {
    filteredShares[lever] = (filteredShares[lever] / totalShare) * finalOrders;
  }

  return filteredShares;
}

// === 5) Chart.js ===
function showLeversChart(ordersByLevers) {
  const ctx = document.getElementById("chart-levers").getContext("2d");
  if (window.leversChart) window.leversChart.destroy();

  const labels = Object.keys(ordersByLevers);
  const values = Object.values(ordersByLevers);

  window.leversChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: [
          "#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f",
          "#edc949", "#af7aa1", "#ff9da7", "#9c755f", "#bab0ac"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        tooltip: { callbacks: {
          label: (context) => `${context.label}: ${formatInt(context.raw)} ventes`
        }}
      }
    }
  });
}

// === 6) Helpers ===
function numberOf(v) { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? 0 : n; }
function formatEur(n) { return new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n); }
function formatInt(n) { return new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(Math.round(n)); }

// === 7) Form submit ===
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-simu");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const trafficMonthly = numberOf(form.elements["traffic"]?.value);
    const aovInput       = numberOf(form.elements["aov"]?.value);
    const cvrInputPct    = numberOf(form.elements["cvr"]?.value);
    const budgetMonthly  = numberOf(form.elements["budget"]?.value);
    const sectorKey      = form.elements["sector"]?.value || "other";

    const sector = SECTOR_DEFAULTS[sectorKey] || SECTOR_DEFAULTS.other;

    const aov = aovInput > 0 ? aovInput : sector.aov;
    const baseCvr = (cvrInputPct > 0 ? cvrInputPct : sector.cvr * 100) / 100;

    const affiliatedTrafficYear = annualAffiliatedTraffic(trafficMonthly);

    const selectedLevers = Array.from(form.querySelectorAll('input[name="levers"]:checked')).map(n => n.value);
    const adjCvr = adjustCVR(baseCvr, selectedLevers);

    let potentialOrders = affiliatedTrafficYear * adjCvr;
    let potentialRevenue = potentialOrders * aov;

    // Budget cap
    const budgetYear = budgetMonthly * 12;
    const budgetCapOrders = budgetYear / aov;
    let finalOrders = Math.min(potentialOrders, budgetCapOrders);
    let finalRevenue = finalOrders * aov;

    // Insights (analyse simplifiée : panier moyen)
    const insights = [];
    if (aov > sector.aov * 1.1) insights.push(`Votre panier moyen (${formatEur(aov)}) est supérieur à la moyenne de votre secteur (${formatEur(sector.aov)}).`);
    else if (aov < sector.aov * 0.9) insights.push(`Votre panier moyen (${formatEur(aov)}) est inférieur à la moyenne de votre secteur (${formatEur(sector.aov)}).`);
    else insights.push(`Votre panier moyen (${formatEur(aov)}) est cohérent avec la moyenne de votre secteur (${formatEur(sector.aov)}).`);

    // Affichage
    document.getElementById("kpi-revenue").textContent = formatEur(finalRevenue);
    document.getElementById("kpi-orders").textContent  = formatInt(finalOrders);
    document.getElementById("kpi-budget").textContent  = formatEur(budgetYear);

    const insightsBox = document.getElementById("insights");
    insightsBox.innerHTML = `<h3>Analyse rapide</h3><p>${insights[0]}</p>`;

    // Graphique
    const ordersByLevers = distributeOrders(finalOrders, selectedLevers);
    showLeversChart(ordersByLevers);

    document.getElementById("results").style.display = "block";
  });
});
