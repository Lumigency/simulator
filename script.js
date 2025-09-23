// === LUMIGENCY SIMULATEUR — V3 OPTIMISÉ ===

// ---- 1) Defaults secteur (baromètre CPA 2025) ----
const SECTOR_DEFAULTS = {
  fashion: { aov: 66.67, cvr: 0.0155, roi: 14.43, label: "Mode & Beauté" },
  electronics: { aov: 110.93, cvr: 0.0171, roi: 17.31, label: "High Tech & Électroménager" },
  home: { aov: 112.69, cvr: 0.0160, roi: 20.71, label: "Maison & Décoration" },
  food: { aov: 80.71, cvr: 0.0216, roi: 25.65, label: "Alimentaire & Drive" },
  sports: { aov: 79.21, cvr: 0.0107, roi: 11.08, label: "Sport & Loisirs" },
  travel: { aov: 171.80, cvr: 0.0125, roi: 24.03, label: "Voyage & Tourisme" },
  luxury: { aov: 200.0, cvr: 0.012, roi: 18.0, label: "Luxe & Bijoux" },
  auto: { aov: 85.59, cvr: 0.0169, roi: 13.02, label: "Automobile" },
  services: { aov: 60.24, cvr: 0.0184, roi: 12.73, label: "B2B / Finance / Assurance" },
  culture: { aov: 82.61, cvr: 0.0228, roi: 16.5, label: "Produits culturels & Loisirs" },
  other: { aov: 80, cvr: 0.015, roi: 15, label: "Autre" }
};

// ---- 2) Ajustement trafic annualisé ----
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

// ---- 3) Leviers pondérations ----
const LEVER_WEIGHTS = {
  cashback: { cvrBoost: 1.2 },
  bonsplans: { cvrBoost: 1.15 },
  retargeting: { cvrBoost: 1.1 },
  css: { cvrBoost: 1.05 },
  comparateurs: { cvrBoost: 1.05 },
  "display-networks": { cvrBoost: 1.02 },
  emailing: { cvrBoost: 1.0 },
  ppc: { cvrBoost: 1.1 },
  affinitaires: { cvrBoost: 1.05 },
  influence: { cvrBoost: 1.08 },
  retention: { cvrBoost: 1.05 },
  content: { cvrBoost: 1.02 }
};

// ---- 4) Gestion formulaire ----
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-simu");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Inputs utilisateur
    const trafficMonthly = numberOf(form.elements["traffic"]?.value);
    const aovInput = numberOf(form.elements["aov"]?.value);
    const cvrInputPct = numberOf(form.elements["cvr"]?.value);
    const budgetMensuel = numberOf(form.elements["budget"]?.value);
    const sectorKey = form.elements["sector"]?.value || "other";
    const sector = SECTOR_DEFAULTS[sectorKey] || SECTOR_DEFAULTS.other;

    // Valeurs par défaut si non renseignées
    const aov = aovInput > 0 ? aovInput : sector.aov;
    let cvr = (cvrInputPct > 0 ? cvrInputPct : sector.cvr * 100) / 100;

    // Trafic annualisé
    const affiliatedTrafficYear = annualAffiliatedTraffic(trafficMonthly);

    // Leviers sélectionnés
    const selectedLevers = Array.from(
      form.querySelectorAll('input[name="levers"]:checked')
    ).map((n) => n.value);

    // Ajustement CVR selon leviers
    selectedLevers.forEach((lv) => {
      if (LEVER_WEIGHTS[lv]) {
        cvr *= LEVER_WEIGHTS[lv].cvrBoost;
      }
    });

    // Commandes théoriques
    let baseOrders = affiliatedTrafficYear * cvr;

    // Budget annuel maximum
    const budgetAnnuel = budgetMensuel * 12;

    // Cap ventes selon budget dispo
    const maxOrdersByBudget = Math.floor(budgetAnnuel / (aov * 0.1)); // logique simplifiée
    const finalOrders = Math.min(baseOrders, maxOrdersByBudget);

    // CA
    const finalRevenue = finalOrders * aov;

    // ---- Insights personnalisés ----
    const insights = [];

    // Panier moyen (si secteur ≠ autre)
    if (sectorKey !== "other") {
      if (aov > sector.aov * 1.1) {
        insights.push(
          `Votre panier moyen (${format€(aov)}) est supérieur à la moyenne de votre secteur (${format€(
            sector.aov
          )}).`
        );
      } else if (aov < sector.aov * 0.9) {
        insights.push(
          `Votre panier moyen (${format€(aov)}) est inférieur à la moyenne de votre secteur (${format€(
            sector.aov
          )}).`
        );
      } else {
        insights.push(
          `Votre panier moyen (${format€(aov)}) est proche de la moyenne de votre secteur (${format€(
            sector.aov
          )}).`
        );
      }
    }

    // Taux de conversion simulé
    insights.push(
      `Votre taux de conversion simulé est de ${(cvr * 100).toFixed(
        2
      )}%.`
    );

    // Budget
    insights.push(
      `Votre budget annuel est de ${format€(
        budgetAnnuel
      )}, ce qui peut potentiellement plafonner vos performances.`
    );

    // Montée en puissance
    insights.push(
      `L'année 1 correspond à la montée en puissance de votre programme d'affiliation, les résultats peuvent encore croître sur le long terme.`
    );

    // ---- Affichage ----
    showResults(finalRevenue, finalOrders, budgetAnnuel, insights, selectedLevers);
  });
});

// ---- Helpers ----
function showResults(revenue, orders, budget, insights, levers) {
  document.getElementById("kpi-revenue").textContent = format€(revenue);
  document.getElementById("kpi-orders").textContent = formatInt(orders);
  document.getElementById("kpi-budget").textContent = format€(budget);

  const insightsBox = document.getElementById("insights");
  if (insightsBox) {
    insightsBox.innerHTML = `<h3>🔎 Analyse rapide</h3><ul>${insights
      .map((t) => `<li>${escapeHtml(t)}</li>`)
      .join("")}</ul>
      <div style="text-align:center; margin-top:20px;">
        <a href="https://www.lumigency.com/consultation-gratuite" class="cta">
          📅 Prenez RDV gratuit pour créer ou développer votre programme d’affiliation
        </a>
      </div>`;
  }

  // Graphique (si leviers cochés)
  if (levers.length) {
    const ctx = document.getElementById("chart-levers");
    if (ctx) {
      new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: levers,
          datasets: [
            {
              data: levers.map(() => Math.round(100 / levers.length)),
              backgroundColor: [
                "#4e79a7",
                "#f28e2b",
                "#e15759",
                "#76b7b2",
                "#59a14f",
                "#edc949",
                "#af7aa1",
                "#ff9da7"
              ]
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "right", labels: { boxWidth: 12, font: { size: 12 } } },
            datalabels: {
              color: "#fff",
              formatter: (value, ctx) => value + "%"
            }
          }
        },
        plugins: [ChartDataLabels]
      });
    }
  }

  document.getElementById("results").style.display = "block";
}

function numberOf(v) {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}
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
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (s) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[s]));
}
