console.log("script.js chargé ✅");

// === CONFIG SECTEURS ===
const SECTORS = {
  fashion: { aov: 67, cvr: 0.0155, label: "Mode & Beauté" },
  electronics: { aov: 111, cvr: 0.0171, label: "Électronique & High-tech" },
  home: { aov: 113, cvr: 0.016, label: "Maison & Décoration" },
  food: { aov: 81, cvr: 0.0216, label: "Alimentaire & Drive" },
  sports: { aov: 79, cvr: 0.0107, label: "Sport & Loisirs" },
  travel: { aov: 172, cvr: 0.0125, label: "Voyage & Tourisme" },
  luxury: { aov: 200, cvr: 0.012, label: "Luxe & Bijoux" },
  auto: { aov: 86, cvr: 0.0169, label: "Automobile" },
  services: { aov: 60, cvr: 0.0184, label: "Services / B2B / SaaS" },
  culture: { aov: 83, cvr: 0.0228, label: "Produits culturels" },
  other: { aov: 80, cvr: 0.015, label: "Autre" }
};

// === PARTS DE VENTES PAR LEVIER ===
const LEVER_SHARE = {
  cashback: 0.23,
  bonsplans: 0.18,
  retargeting: 0.14,
  css: 0.12,
  comparateurs: 0.11,
  "display-networks": 0.10,
  retention: 0.06,
  content: 0.04,
  emailing: 0.02,
  influence: 0.02
};

// === CAC PAR LEVIER (pondéré sur base CAC client = 15€ par défaut) ===
const CAC_BASE = {
  cashback: 10,
  bonsplans: 6,
  css: 13,
  comparateurs: 13,
  "display-networks": 12,
  retargeting: 12,
  retention: 4,
  emailing: 8,
  content: 9,
  influence: 15
};

// === TRAFIC ANNUALISÉ SELON PALIERS ===
function annualAffiliatedTraffic(trafficMonthly) {
  if (trafficMonthly < 10000) return trafficMonthly * (0.10 * 6 + 0.12 * 6);
  if (trafficMonthly < 50000) return trafficMonthly * (0.12 * 6 + 0.14 * 6);
  if (trafficMonthly < 100000) return trafficMonthly * (0.12 * 6 + 0.15 * 6);
  if (trafficMonthly < 500000) return trafficMonthly * 0.15 * 12;
  return trafficMonthly * 0.18 * 12;
}

// === FONCTION PRINCIPALE ===
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-simu");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const traffic = numberOf(form.elements["traffic"].value);
    const aovInput = numberOf(form.elements["aov"].value);
    const cvrInput = numberOf(form.elements["cvr"].value) / 100;
    const cacInput = numberOf(form.elements["cac"].value);
    const budgetMensuel = numberOf(form.elements["budget"].value);
    const sectorKey = form.elements["sector"].value || "other";
    const hybrides = form.elements["hybrides"].value === "oui";

    const sector = SECTORS[sectorKey] || SECTORS.other;

    // === Ajustements ===
    const annualTraffic = annualAffiliatedTraffic(traffic);
    const aov = aovInput > 0 ? aovInput : sector.aov;
    let cvr = cvrInput > 0 ? cvrInput : sector.cvr;

    // Pondération leviers
    const selectedLevers = Array.from(form.querySelectorAll('input[name="levers"]:checked')).map(n => n.value);

    if (selectedLevers.includes("cashback")) cvr += 0.002;
    if (selectedLevers.includes("bonsplans")) cvr += 0.0015;
    if (selectedLevers.includes("retargeting")) cvr += 0.0025;
    if (selectedLevers.includes("css")) cvr += 0.001;
    if (selectedLevers.includes("display-networks")) cvr += 0.001;

    // Cap CVR
    cvr = Math.min(cvr, 0.03);

    // === Ventes potentielles ===
    let potentialOrders = annualTraffic * cvr;

    // === Capping budget ===
    const budgetAnnuel = budgetMensuel * 12;
    const maxOrdersBudget = budgetAnnuel / (cacInput > 0 ? cacInput : 1);
    const finalOrders = Math.min(potentialOrders, maxOrdersBudget);

    const revenue = finalOrders * aov;

    // === CAC projeté pondéré ===
    let cacProjete = 0;
    if (selectedLevers.length > 0) {
      let totalWeight = selectedLevers.reduce((sum, lv) => sum + (LEVER_SHARE[lv] || 0), 0);
      selectedLevers.forEach(lv => {
        cacProjete += (CAC_BASE[lv] || cacInput) * (LEVER_SHARE[lv] / totalWeight);
      });
    } else {
      cacProjete = cacInput;
    }

    // Ajustement si trop éloigné du CAC client
    if (cacProjete < cacInput * 0.8) {
      cacProjete = cacInput * 0.9;
    }

    // Hybrides
    if (hybrides) {
      cacProjete *= 1.3;
      potentialOrders *= 0.9;
    }

    // ROI
    const roi = revenue / budgetAnnuel;

    // === Analyse ===
    const insights = [];
    if (sectorKey !== "other") {
      if (aov > sector.aov * 1.1) {
        insights.push(`💳 Votre panier moyen (${format€(aov)}) est supérieur à la moyenne de votre secteur (${format€(sector.aov)}).`);
      } else if (aov < sector.aov * 0.9) {
        insights.push(`⚠️ Votre panier moyen (${format€(aov)}) est inférieur à la moyenne de votre secteur (${format€(sector.aov)}).`);
      } else {
        insights.push(`✅ Votre panier moyen (${format€(aov)}) est proche de la moyenne de votre secteur (${format€(sector.aov)}).`);
      }
    }

    insights.push(`📊 Taux de conversion simulé : ${(cvr * 100).toFixed(2)} %. `);
    insights.push(`💡 L'année 1 est une montée en puissance progressive de votre programme.`);
    insights.push(`💰 Le budget annuel saisi (${format€(budgetAnnuel)}) cappe potentiellement vos performances.`);

    showResults(revenue, finalOrders, budgetAnnuel, aov, cacProjete, roi, insights, selectedLevers);
  });
});

// === AFFICHAGE ===
function showResults(revenue, orders, budget, aov, cac, roi, insights, selectedLevers) {
  document.getElementById("results").style.display = "block";
  document.getElementById("kpi-revenue").textContent = format€(revenue);
  document.getElementById("kpi-orders").textContent = formatInt(orders);
  document.getElementById("kpi-budget").textContent = format€(budget);
  document.getElementById("kpi-aov").textContent = format€(aov);
  document.getElementById("kpi-cac").textContent = format€(cac);
  document.getElementById("kpi-roi").textContent = roi.toFixed(2) + "x";

  const insightsBox = document.getElementById("insights");
  insightsBox.innerHTML = `<h3>Analyse rapide</h3><ul>${insights.map(t => `<li>${t}</li>`).join("")}</ul>`;

  // Graphique
  const leverData = selectedLevers.map(lv => LEVER_SHARE[lv] || 0);
  const leverLabels = selectedLevers.map(lv => lv);

  const ctx = document.getElementById("chart-levers").getContext("2d");
  if (window.salesChart) window.salesChart.destroy();
  window.salesChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: leverLabels,
      datasets: [{
        data: leverData,
        backgroundColor: ["#3b82f6", "#f97316", "#22c55e", "#eab308", "#ef4444", "#8b5cf6", "#06b6d4", "#f43f5e"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "right", labels: { boxWidth: 15, font: { size: 12 } } },
        datalabels: { formatter: (value) => (value * 100).toFixed(1) + "%", color: "#fff" }
      }
    },
    plugins: [ChartDataLabels]
  });

  // CTA
  const ctaBox = document.getElementById("cta-link");
  ctaBox.innerHTML = "🚀 Prenez RDV gratuit pour booster vos performances en affiliation";
  ctaBox.style.display = "block";
}

// === HELPERS ===
function numberOf(v) { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? 0 : n; }
function format€(n) { return new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n); }
function formatInt(n) { return new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(Math.round(n)); }
