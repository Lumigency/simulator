console.log("🔥 script.js chargé");

// === Paramètres secteurs (par défaut, baromètre CPA 2025) ===
const SECTOR_DEFAULTS = {
  fashion: { aov: 67, cvr: 0.0155, label: "Mode & Beauté" },
  electronics: { aov: 111, cvr: 0.017, label: "Électronique & High-tech" },
  home: { aov: 113, cvr: 0.016, label: "Maison & Décoration" },
  food: { aov: 81, cvr: 0.022, label: "Alimentaire & Boissons" },
  sports: { aov: 79, cvr: 0.011, label: "Sport & Loisirs" },
  travel: { aov: 172, cvr: 0.013, label: "Voyage & Tourisme" },
  luxury: { aov: 200, cvr: 0.012, label: "Luxe & Bijoux" },
  auto: { aov: 86, cvr: 0.017, label: "Automobile" },
  services: { aov: 60, cvr: 0.018, label: "Services / B2B / SaaS" },
  other: { aov: 80, cvr: 0.015, label: "Autre" }
};

// === Pondérations leviers ===
const LEVER_RULES = {
  cashback: { cr: 0.20, aov: -0.05, cac: 0.4 },
  bonsplans: { cr: 0.30, aov: -0.10, cac: 0.2 },
  retargeting: { cr: 0.15, aov: 0, cac: 0.3 },
  css: { cr: 0.10, aov: 0, cac: 0.65 },
  comparateurs: { cr: 0, aov: 0, cac: 0.65 },
  "display-networks": { cr: 0, aov: 0, cac: 0.3 },
  retention: { cr: 0.05, aov: 0.05, cac: 0.15 },
  content: { cr: 0.05, aov: 0.03, cac: 1 },
  emailing: { cr: 0.10, aov: 0.02, cac: 0.5 },
  ppc: { cr: 0.25, aov: 0, cac: 1 },
  affinitaires: { cr: 0.05, aov: 0.05, cac: 0.9 },
  influence: { cr: 0.10, aov: 0.05, cac: 1.2 }
};

// === Trafic annualisé ===
function annualAffiliatedTraffic(trafficMonthly) {
  if (trafficMonthly < 10000) return trafficMonthly * (0.10 * 6 + 0.12 * 6);
  if (trafficMonthly < 50000) return trafficMonthly * (0.12 * 6 + 0.14 * 6);
  if (trafficMonthly < 100000) return trafficMonthly * 0.15 * 12;
  return trafficMonthly * 0.18 * 12;
}

// === Helpers ===
function numberOf(v) {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}
function formatEur(n) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(n);
}
function formatInt(n) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0
  }).format(Math.round(n));
}

// === Résultats ===
function showResults(revenue, orders, budget, insights, leverShares) {
  document.getElementById("kpi-revenue").textContent = formatEur(revenue);
  document.getElementById("kpi-orders").textContent = formatInt(orders);
  document.getElementById("kpi-budget").textContent = formatEur(budget);

  const insightsBox = document.getElementById("insights");
  insightsBox.innerHTML =
    "<h3>Analyse rapide</h3><ul>" +
    insights.map(t => `<li>${t}</li>`).join("") +
    "</ul>";

  // === Graph Chart.js ===
  const ctx = document.getElementById("chart-levers").getContext("2d");
  if (window.leversChart) window.leversChart.destroy(); // reset si déjà créé
  window.leversChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(leverShares),
      datasets: [
        {
          data: Object.values(leverShares),
          backgroundColor: [
            "#4e79a7",
            "#f28e2b",
            "#e15759",
            "#76b7b2",
            "#59a14f",
            "#edc949",
            "#af7aa1",
            "#ff9da7",
            "#9c755f",
            "#bab0ab"
          ]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: { boxWidth: 12, font: { size: 12 } }
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: ${ctx.parsed}%`
          }
        }
      }
    }
  });

  document.getElementById("results").style.display = "block";
}

// === Formulaire ===
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-simu");
  form.addEventListener("submit", e => {
    e.preventDefault();

    const traffic = numberOf(form.elements["traffic"].value);
    const aovInput = numberOf(form.elements["aov"].value);
    const cvrInput = numberOf(form.elements["cvr"].value);
    const cacInput = numberOf(form.elements["cac"].value);
    const budgetMonthly = numberOf(form.elements["budget"].value);
    const sectorKey = form.elements["sector"].value || "other";

    const sector = SECTOR_DEFAULTS[sectorKey];
    let aov = aovInput || sector.aov;
    let cvr = (cvrInput || sector.cvr * 100) / 100;
    let cac = cacInput;

    const selectedLevers = Array.from(
      form.querySelectorAll('input[name="levers"]:checked')
    ).map(n => n.value);

    // === Trafic annualisé
    const trafficYear = annualAffiliatedTraffic(traffic);

    // === Ajustements leviers
    let crBoost = 0;
    let aovFactor = 1;
    let cacWeights = [];

    selectedLevers.forEach(lv => {
      const r = LEVER_RULES[lv];
      if (r) {
        crBoost += r.cr;
        aovFactor *= 1 + r.aov;
        cacWeights.push(r.cac);
      }
    });

    // CR plafonné selon nbre leviers
    if (selectedLevers.length < 4) crBoost = Math.min(crBoost, 0.5);
    else if (selectedLevers.length < 8) crBoost = Math.min(crBoost, 1.0);
    else crBoost = Math.min(crBoost, 2.0);

    cvr = cvr + crBoost / 100;
    aov = aov * aovFactor;

    // CAC moyen pondéré
    const avgWeight =
      cacWeights.length > 0
        ? cacWeights.reduce((a, b) => a + b, 0) / cacWeights.length
        : 1;
    cac = cac * avgWeight;

    // Commandes max possible
    let orders = Math.round(trafficYear * cvr);
    let budgetYear = budgetMonthly * 12;
    let ordersCap = Math.floor(budgetYear / cac);
    if (orders > ordersCap) orders = ordersCap;

    const revenue = orders * aov;

    // Insights
    const insights = [];
    insights.push("Projection prudente sur 12 mois.");
    insights.push(
      `Panier moyen simulé : ${formatEur(aov)} vs ${formatEur(sector.aov)} (secteur).`
    );
    insights.push(
      `Taux de conversion simulé : ${(cvr * 100).toFixed(2)} % vs ${(sector.cvr * 100).toFixed(2)} % (secteur).`
    );

    // Répartition par levier (en % des ventes)
    const leverShares = {};
    if (selectedLevers.length > 0) {
      const baseShare = 100 / selectedLevers.length;
      selectedLevers.forEach(lv => (leverShares[lv] = baseShare.toFixed(1)));
    }

    showResults(revenue, orders, budgetYear, insights, leverShares);
  });
});
