console.log("🔥 script.js chargé");

// === Grille CAC par levier (valeurs fixes que tu m’as données) ===
const LEVER_CAC = {
  cashback: 4,
  bonsplans: 2,
  retargeting: 3,
  "display-networks": 3,
  comparateurs: 6.5,
  css: 6.5,
  retention: 1.5,
  affinitaires: 10,
  content: 8,
  emailing: 5,
  ppc: 7,
  influence: 12,
  display: 6
};

// === Facteurs d’ajustement sur CR en fonction des leviers ===
function adjustCR(baseCR, levers) {
  let cr = baseCR;

  // Cashback + bons plans pas activés => pénalité
  if (!levers.includes("cashback") && !levers.includes("bonsplans")) {
    cr = cr / 2;
  }

  // Cashback activé => léger boost
  if (levers.includes("cashback")) cr += 0.2;

  // Bons plans activé => léger boost
  if (levers.includes("bonsplans")) cr += 0.2;

  // Retargeting booste la conversion
  if (levers.includes("retargeting")) cr += 0.3;

  // Rétention booste un peu
  if (levers.includes("retention")) cr += 0.2;

  return cr;
}

// === Trafic annualisé (règles revues) ===
function annualAffiliatedTraffic(monthlyTraffic) {
  if (monthlyTraffic < 10000) {
    return monthlyTraffic * (0.10 * 6 + 0.15 * 6);
  }
  if (monthlyTraffic < 50000) {
    return monthlyTraffic * (0.15 * 6 + 0.16 * 6);
  }
  if (monthlyTraffic < 500000) {
    return monthlyTraffic * (0.25 * 12);
  }
  return monthlyTraffic * (0.30 * 12);
}

// === Fonction principale ===
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-simu");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // --- Inputs utilisateur ---
    const trafficMonthly = parseFloat(form.elements["traffic"].value) || 0;
    const aov = parseFloat(form.elements["aov"].value) || 50;
    const baseCR = parseFloat(form.elements["cvr"].value) || 1;
    const budgetMensuel = parseFloat(form.elements["budget"].value) || 0;
    const budgetAnnuelMax = budgetMensuel * 12;

    const selectedLevers = Array.from(
      form.querySelectorAll('input[name="levers"]:checked')
    ).map((n) => n.value);

    // --- Trafic annualisé ---
    const affiliatedTrafficYear = annualAffiliatedTraffic(trafficMonthly);

    // --- Conversion ajustée ---
    const cr = adjustCR(baseCR, selectedLevers) / 100;

    // --- Ventes potentielles (sans contrainte budget) ---
    const potentialOrders = affiliatedTrafficYear * cr;

    // --- CAC mix pondéré ---
    let totalCAC = 0;
    selectedLevers.forEach((lv) => {
      if (LEVER_CAC[lv]) totalCAC += LEVER_CAC[lv];
    });
    const avgCAC = selectedLevers.length > 0 ? totalCAC / selectedLevers.length : 10;

    // --- Ventes capées par budget ---
    const maxOrdersByBudget = budgetAnnuelMax / avgCAC;
    const finalOrders = Math.min(potentialOrders, maxOrdersByBudget);

    // --- Résultats ---
    const finalRevenue = finalOrders * aov;
    const budgetUsed = finalOrders * avgCAC;

    // --- Affichage KPI ---
    document.getElementById("kpi-revenue").textContent = format€(finalRevenue);
    document.getElementById("kpi-orders").textContent = formatInt(finalOrders);
    document.getElementById("kpi-budget").textContent = format€(budgetUsed);

    // --- Analyse simple ---
    const insightsBox = document.getElementById("insights");
    insightsBox.innerHTML = `
      <h3>Analyse rapide</h3>
      <ul>
        <li>Projection prudente sur 12 mois.</li>
        <li>Panier moyen : ${format€(aov)}.</li>
        <li>Taux de conversion simulé : ${(cr * 100).toFixed(2)} %.</li>
        <li>Budget consommé : ${format€(budgetUsed)} (plafond : ${format€(budgetAnnuelMax)}).</li>
      </ul>
      <h3>Répartition estimée des ventes par levier</h3>
      <canvas id="leversChart"></canvas>
    `;

    // --- Graphique (Chart.js) ---
    if (selectedLevers.length > 0) {
      const ctx = document.getElementById("leversChart").getContext("2d");
      new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: selectedLevers,
          datasets: [
            {
              data: selectedLevers.map(() => Math.round(finalOrders / selectedLevers.length)),
              backgroundColor: [
                "#FF6384",
                "#36A2EB",
                "#FFCE56",
                "#4BC0C0",
                "#9966FF",
                "#FF9F40"
              ]
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "bottom" }
          }
        }
      });
    }
  });
});

// === Helpers ===
function format€(n) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(n);
}
function formatInt(n) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(
    Math.round(n)
  );
}
