console.log("script.js chargé ✅");

// ==========================
// 1. Définition SECTEURS
// ==========================
window.SECTORS = window.SECTORS || {
  fashion: { aov: 67, cvr: 1.55 },
  electronics: { aov: 120, cvr: 1.3 },
  home: { aov: 80, cvr: 1.2 },
  food: { aov: 40, cvr: 1.0 },
  sports: { aov: 70, cvr: 1.1 },
  travel: { aov: 300, cvr: 2.0 },
  luxury: { aov: 500, cvr: 1.8 },
  auto: { aov: 250, cvr: 1.4 },
  services: { aov: 150, cvr: 1.2 },
  other: { aov: 100, cvr: 1.0 }
};

// ==========================
// 2. Définition LEVIERS
// ==========================
window.LEVERS = window.LEVERS || {
  cashback: { weight: 0.25, cac: 4 },
  bonsplans: { weight: 0.20, cac: 2 },
  retargeting: { weight: 0.15, cac: 3 },
  css: { weight: 0.15, cac: 6.5 },
  comparateurs: { weight: 0.12, cac: 6.5 },
  "display-networks": { weight: 0.10, cac: 3 },
  retention: { weight: 0.05, cac: 1.5 },
  content: { weight: 0.08, cac: 8 },
  emailing: { weight: 0.07, cac: 2.5 },
  ppc: { weight: 0.10, cac: 7 },
  affinitaires: { weight: 0.06, cac: 10 },
  influence: { weight: 0.05, cac: 12 }
};

// ==========================
// 3. Calcul TRAFIC AFFILIÉ
// ==========================
function getAnnualAffTraffic(monthlyTraffic) {
  if (monthlyTraffic < 10000) {
    return monthlyTraffic * 12 * ((0.10 * 6 + 0.12 * 6) / 12);
  } else if (monthlyTraffic < 50000) {
    return monthlyTraffic * 12 * ((0.12 * 6 + 0.14 * 6) / 12);
  } else if (monthlyTraffic < 100000) {
    return monthlyTraffic * 12 * 0.15;
  } else if (monthlyTraffic < 500000) {
    return monthlyTraffic * 12 * 0.20;
  } else {
    return monthlyTraffic * 12 * 0.22; // cap pour très gros sites
  }
}

// ==========================
// 4. Calcul des performances
// ==========================
function simulatePerf(inputs) {
  const { traffic, aov, cvr, budget, levers, sector } = inputs;
  const sectorData = SECTORS[sector] || SECTORS["other"];

  // Trafic annualisé affilié
  let annualTraffic = getAnnualAffTraffic(traffic);

  // Ajustement CVR
  let adjustedCvr = cvr / 100;
  if (levers.includes("cashback")) adjustedCvr += 0.002;
  if (levers.includes("bonsplans")) adjustedCvr += 0.002;
  if (levers.includes("retargeting")) adjustedCvr += 0.003;
  if (levers.length <= 2) adjustedCvr *= 0.5;

  // Ventes théoriques
  let theoreticalOrders = annualTraffic * adjustedCvr;

  // CAC pondéré
  let weightedCAC = 0;
  levers.forEach(l => {
    if (LEVERS[l]) weightedCAC += LEVERS[l].cac * LEVERS[l].weight;
  });
  if (levers.length > 0) weightedCAC /= levers.length;

  // Ventes limitées par budget
  let maxOrders = Math.floor((budget * 12) / weightedCAC);
  let finalOrders = Math.min(theoreticalOrders, maxOrders);

  // CA
  let revenue = finalOrders * aov;

  return {
    revenue,
    orders: finalOrders,
    budgetAnnual: budget * 12,
    aov,
    adjustedCvr: adjustedCvr * 100,
    sectorData,
    levers
  };
}

// ==========================
// 5. Analyse textuelle
// ==========================
function buildInsights(result) {
  let insights = `
    <h3>Analyse rapide</h3>
    <ul>
      <li>Votre panier moyen est ${result.aov > result.sectorData.aov ? "supérieur" : "inférieur"} à celui de votre secteur (${result.aov}€ vs ${result.sectorData.aov}€).</li>
      <li>Taux de conversion simulé : ${result.adjustedCvr.toFixed(2)}% (année 1 avec montée en puissance du programme).</li>
      <li>Le budget annuel saisi (${result.budgetAnnual.toLocaleString("fr-FR")} €) cappe potentiellement vos performances.</li>
    </ul>
    <div style="margin-top:15px;">
      <a href="https://lumigency.com/consultation" class="cta" target="_blank">📅 Réservez votre consultation gratuite</a>
    </div>
  `;
  return insights;
}

// ==========================
// 6. Affichage Chart.js
// ==========================
function showLeversChart(levers, orders) {
  const ctx = document.getElementById("chart-levers").getContext("2d");

  const labels = levers.map(l => l);
  const values = levers.map(l => Math.round(orders * (LEVERS[l]?.weight || 0)));

  if (window.leverChart) window.leverChart.destroy();

  window.leverChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: ["#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "right",
          labels: { boxWidth: 12, font: { size: 12 } }
        },
        datalabels: {
          color: "#fff",
          formatter: (value, ctx) => {
            let total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            return ((value / total) * 100).toFixed(1) + "%";
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

// ==========================
// 7. Event Listener Formulaire
// ==========================
document.getElementById("form-simu").addEventListener("submit", e => {
  e.preventDefault();
  const fd = new FormData(e.target);

  const inputs = {
    traffic: Number(fd.get("traffic")),
    aov: Number(fd.get("aov")),
    cvr: Number(fd.get("cvr")),
    budget: Number(fd.get("budget")),
    levers: fd.getAll("levers"),
    sector: fd.get("sector")
  };

  const result = simulatePerf(inputs);

  // Affichage KPI
  document.getElementById("results").style.display = "block";
  document.getElementById("kpi-revenue").textContent = result.revenue.toLocaleString("fr-FR") + " €";
  document.getElementById("kpi-orders").textContent = Math.round(result.orders).toLocaleString("fr-FR");
  document.getElementById("kpi-budget").textContent = result.budgetAnnual.toLocaleString("fr-FR") + " €";

  // Analyse
  document.getElementById("insights").innerHTML = buildInsights(result);

  // Graphique
  if (result.levers.length > 0) {
    showLeversChart(result.levers, result.orders);
  }
});
