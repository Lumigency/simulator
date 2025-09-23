console.log("script.js charge");

// ---------- 1) CAC pondéré par levier (en % du CAC global saisi) ----------
const LEVER_CAC_PERC = {
  cashback: 0.40,
  bonsplans: 0.20,
  retargeting: 0.30,
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

// ---------- 2) Trafic annualisé (version prudente) ----------
function annualAffiliatedTraffic(trafficMonthly) {
  if (trafficMonthly < 10000)  return trafficMonthly * (0.10 * 6 + 0.15 * 6);
  if (trafficMonthly < 50000)  return trafficMonthly * (0.15 * 6 + 0.16 * 6);
  if (trafficMonthly < 500000) return trafficMonthly * 0.25 * 12;
  return trafficMonthly * 0.30 * 12;
}

// ---------- 3) Ajustement du taux de conversion selon leviers ----------
function adjustCR(baseCRpct, levers) {
  // baseCRpct = valeur en pourcentage (ex 1.2 pour 1,2%)
  let cr = baseCRpct;

  // Cashback + Bons plans
  if (levers.includes("cashback") && levers.includes("bonsplans")) {
    cr *= 1.20;             // +20% si les deux
  } else if (!levers.includes("cashback") && !levers.includes("bonsplans")) {
    cr *= 0.50;             // -50% si aucun des deux
  } else {
    cr *= 1.05;             // petit bonus si au moins l'un des deux
  }

  // Retargeting, Rétention : boost légers
  if (levers.includes("retargeting")) cr += 0.30; // +0,30 point
  if (levers.includes("retention"))   cr += 0.20; // +0,20 point

  // Plafond sécurité (éviter des CR irréalistes)
  if (cr > 5) cr = 5;
  if (cr < 0.05) cr = 0.05;

  return cr / 100; // retourne en ratio (ex 0.012)
}

// ---------- 4) Helpers format ----------
function numberOf(v) {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}
function formatEUR(n) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency", currency: "EUR", maximumFractionDigits: 0
  }).format(n);
}
function formatInt(n) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 })
    .format(Math.round(n));
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[s]));
}

// ---------- 5) Graphe (Chart.js) ----------
let leversChart = null;
function showLeversChart(labels, values) {
  const el = document.getElementById("chart-levers");
  if (!el) return;
  const ctx = el.getContext("2d");
  if (leversChart) { leversChart.destroy(); leversChart = null; }

  leversChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [
          "#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f",
          "#edc949", "#af7aa1", "#ff9da7", "#9c755f", "#bab0ac",
          "#7f7f7f", "#5f9ea0"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        tooltip: { callbacks: {
          label: (ctx) => `${ctx.label}: ${formatInt(ctx.raw)} ventes`
        }}
      }
    }
  });
}

// ---------- 6) Logique principale ----------
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-simu");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Entrées
    const trafficMonthly = numberOf(form.elements["traffic"]?.value);
    const aov            = numberOf(form.elements["aov"]?.value) || 50;
    const cvrPct         = numberOf(form.elements["cvr"]?.value) || 1;  // en %
    const cacGlobal      = numberOf(form.elements["cac"]?.value) || 10; // €
    const budgetMonthly  = numberOf(form.elements["budget"]?.value) || 0;

    const selectedLevers = Array.from(
      form.querySelectorAll('input[name="levers"]:checked')
    ).map(n => n.value);

    // Trafic annuel affilié
    const trafficYear = annualAffiliatedTraffic(trafficMonthly);

    // CR ajusté (ratio)
    const cvr = adjustCR(cvrPct, selectedLevers);

    // Commandes potentielles (hors budget)
    const potentialOrders = trafficYear * cvr;

    // CAC moyen pondéré (selon % du CAC global)
    let cacSum = 0;
    selectedLevers.forEach(lv => {
      if (LEVER_CAC_PERC[lv] != null) {
        cacSum += cacGlobal * LEVER_CAC_PERC[lv];
      }
    });
    const avgCAC = selectedLevers.length ? (cacSum / selectedLevers.length) : cacGlobal;

    // Cap budget
    const budgetAnnual = budgetMonthly * 12;
    const ordersCapByBudget = avgCAC > 0 ? (budgetAnnual / avgCAC) : potentialOrders;
    const finalOrders = Math.min(potentialOrders, ordersCapByBudget);

    // CA final (avec cap budget)
    const finalRevenue = finalOrders * aov;

    // KPIs
    document.getElementById("kpi-revenue").textContent = formatEUR(finalRevenue);
    document.getElementById("kpi-orders").textContent  = formatInt(finalOrders);
    document.getElementById("kpi-budget").textContent  = formatEUR(budgetAnnual);

    // Analyse (courte)
    const insights = [
      `Projection prudente sur 12 mois.`,
      `Panier moyen considéré : ${formatEUR(aov)}.`,
      `Taux de conversion ajusté : ${(cvr * 100).toFixed(2)} %.`,
      `CAC moyen pondéré estimé : ${formatEUR(avgCAC)}.`,
      `Budget annuel saisi : ${formatEUR(budgetAnnual)}.`
    ];
    const insightsBox = document.getElementById("insights");
    insightsBox.innerHTML = `<h3>Analyse rapide</h3><ul>${
      insights.map(t => `<li>${escapeHtml(t)}</li>`).join("")
    }</ul>`;

    // Répartition (vendues) par levier — ici simple : parts égales entre leviers cochés
    const labels = selectedLevers.length ? selectedLevers : ["Aucun levier"];
    const values = selectedLevers.length
      ? selectedLevers.map(() => Math.round(finalOrders / selectedLevers.length))
      : [Math.round(finalOrders)];
    showLeversChart(labels, values);

    // Affiche la carte
    document.getElementById("results").style.display = "block";
  });
});
