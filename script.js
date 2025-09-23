console.log("🔥 script.js chargé");

// === 1) Pondérations CAC par levier (% du CAC global saisi par l'utilisateur) ===
const LEVER_CAC_PERC = {
  cashback: 0.40,          // 40% du CAC global
  bonsplans: 0.20,         // 20%
  retargeting: 0.30,       // 30%
  "display-networks": 0.30,
  comparateurs: 0.65,
  css: 0.65,
  retention: 0.15,
  affinitaires: 1.00,
  content: 0.80,
  emailing: 0.50,
  ppc: 0.70,
  influence: 1.20,
  display: 0.60
};

// === 2) Ajustement du trafic annualisé (version pessimiste revue) ===
function annualAffiliatedTraffic(trafficMonthly) {
  if (trafficMonthly < 10000) {
    return trafficMonthly * 0.10 * 6 + trafficMonthly * 0.15 * 6;
  }
  if (trafficMonthly < 50000) {
    return trafficMonthly * 0.15 * 6 + trafficMonthly * 0.16 * 6;
  }
  if (trafficMonthly < 500000) {
    return trafficMonthly * 0.25 * 12;
  }
  return trafficMonthly * 0.30 * 12;
}

// === 3) Fonction principale ===
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-simu");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // --- Inputs utilisateur
    const trafficMonthly = numberOf(form.elements["traffic"]?.value);
    const aovInput       = numberOf(form.elements["aov"]?.value);
    const cvrInput       = numberOf(form.elements["cvr"]?.value) / 100;
    const budgetMonthly  = numberOf(form.elements["budget"]?.value);
    const cacGlobal      = numberOf(form.elements["cac"]?.value);

    // --- Leviers sélectionnés
    const selectedLevers = Array.from(
      form.querySelectorAll('input[name="levers"]:checked')
    ).map(n => n.value);

    // --- Trafic annualisé
    const affiliatedTrafficYear = annualAffiliatedTraffic(trafficMonthly);

    // --- Conversion Rate ajusté
    let cvr = cvrInput || 0.01; // défaut 1%
    if (selectedLevers.includes("cashback") && selectedLevers.includes("bonsplans")) {
      cvr *= 1.2; // +20% si bons plans + cashback
    } else if (!selectedLevers.includes("cashback") && !selectedLevers.includes("bonsplans")) {
      cvr *= 0.5; // divisé par 2 si aucun des deux
    } else {
      cvr *= 1.05; // léger bonus si au moins un
    }

    // --- CAC moyen pondéré par levier
    let avgCAC = 0;
    selectedLevers.forEach(lv => {
      if (LEVER_CAC_PERC[lv]) {
        avgCAC += cacGlobal * LEVER_CAC_PERC[lv];
      }
    });
    avgCAC = selectedLevers.length > 0 ? avgCAC / selectedLevers.length : cacGlobal;

    // --- Commandes max théoriques
    let baseOrders = affiliatedTrafficYear * cvr;

    // --- Commandes limitées par budget
    const budgetAnnual = budgetMonthly * 12;
    let maxOrdersByBudget = budgetAnnual / avgCAC;
    let finalOrders = Math.min(baseOrders, maxOrdersByBudget);

    // --- Revenus
    const aov = aovInput > 0 ? aovInput : 50;
    const finalRevenue = finalOrders * aov;

    // --- Insights rapides
    const insights = [];
    insights.push("Projection prudente sur 12 mois.");
    insights.push(
      `Panier moyen simulé : ${format€(aov)}`
    );
    insights.push(
      `Taux de conversion ajusté : ${(cvr * 100).toFixed(2)} %`
    );
    insights.push(
      `CAC moyen pondéré estimé : ${format€(avgCAC)}`
    );
    insights.push(
      `Le budget annuel disponible est de ${format€(budgetAnnual)}`
    );

    // --- Affichage
    showResults(finalRevenue, finalOrders, budgetAnnual, insights);

    // --- Graphique des leviers
    showLeversChart(selectedLevers, finalOrders);
  });
});

// === 4) Helpers ===
function showResults(revenue, orders, budget, insights) {
  document.getElementById("kpi-revenue").textContent = format€(revenue);
  document.getElementById("kpi-orders").textContent  = formatInt(orders);
  document.getElementById("kpi-budget").textContent  = format€(budget);

  const insightsBox = document.getElementById("insights");
  if (insightsBox) {
    insightsBox.innerHTML = `
      <h3>Analyse rapide</h3>
      <ul>${insights.map(t => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
    `;
  }
}

function showLeversChart(selectedLevers, orders) {
  const ctx = document.getElementById("leversChart");
  if (!ctx) return;

  const data = {
    labels: selectedLevers.length ? selectedLevers : ["Aucun levier"],
    datasets: [{
      label: "Répartition estimée des ventes",
      data: selectedLevers.map(() => Math.round(orders / selectedLevers.length)),
      backgroundColor: ["#36a2eb", "#ff6384", "#ffcd56", "#4bc0c0", "#9966ff", "#ff9f40"]
    }]
  };

  new Chart(ctx, {
    type: "pie",
    data: data
  });
}

function numberOf(v) { 
  const n = parseFloat(String(v).replace(",", ".")); 
  return isNaN(n) ? 0 : n; 
}
function format€(n) { 
  return new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n); 
}
function formatInt(n) { 
  return new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(Math.round(n)); 
}
function escapeHtml(str) { 
  return String(str).replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[s])); 
}
