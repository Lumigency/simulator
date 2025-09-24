console.log("script.js chargé ✅");

/* ======================
   CONFIG SECTEURS
====================== */
const SECTORS = {
  fashion:     { aov: 66.67, cvr: 0.0155, label: "Mode & Beauté" },
  electronics: { aov: 110.93, cvr: 0.0171, label: "Électronique & High-tech" },
  home:        { aov: 112.69, cvr: 0.0160, label: "Maison & Décoration" },
  food:        { aov: 80.71,  cvr: 0.0216, label: "Alimentaire & Drive" },
  sports:      { aov: 79.21,  cvr: 0.0107, label: "Sport & Loisirs" },
  travel:      { aov: 171.80, cvr: 0.0125, label: "Voyage & Tourisme" },
  luxury:      { aov: 200.00, cvr: 0.0120, label: "Luxe & Bijoux" },
  auto:        { aov: 85.59,  cvr: 0.0169, label: "Automobile" },
  services:    { aov: 60.24,  cvr: 0.0184, label: "Services / B2B / SaaS" },
  culture:     { aov: 82.61,  cvr: 0.0228, label: "Produits culturels" },
  other:       { aov: 80.00,  cvr: 0.0150, label: "Autre" }
};

/* =======================================
   PARTS DE VENTES & CAC PAR LEVIER (base)
======================================= */
const LEVER_SHARE_BASE = {
  cashback: 0.23,
  bonsplans: 0.18,
  retargeting: 0.14,
  css: 0.12,
  comparateurs: 0.11,
  "display-networks": 0.10,
  retention: 0.06,
  content: 0.04,
  emailing: 0.02,
  ppc: 0.06,
  affinitaires: 0.05,
  influence: 0.05
};

// CAC moyen “brut” par levier (en €)
const CAC_BASE = {
  cashback: 4,
  bonsplans: 2,
  retargeting: 3,
  css: 6.5,
  comparateurs: 6.5,
  "display-networks": 3,
  retention: 1.5,
  content: 8,
  emailing: 2,
  ppc: 10,
  affinitaires: 10,
  influence: 12
};

// Ajustements AOV par levier (multiplicatif)
const AOV_MULT = {
  cashback: 0.95,
  bonsplans: 0.93,
  content: 1.03,
  affinitaires: 1.02,
  retention: 1.02,
  influence: 0.98,
  comparateurs: 1.00,
  css: 1.00,
  retargeting: 1.00,
  "display-networks": 1.00,
  emailing: 1.01,
  ppc: 1.00
};

// Ajustements CVR par levier (additif en points de % converti en taux)
const CVR_ADD = {
  cashback: 0.0020,          // +0,20 pt
  bonsplans: 0.0015,         // +0,15 pt
  retargeting: 0.0025,       // +0,25 pt
  css: 0.0010,               // +0,10 pt
  comparateurs: 0.0010,      // +0,10 pt (léger)
  "display-networks": 0.0010,// +0,10 pt
  emailing: 0.0005,          // +0,05 pt
  ppc: 0.0005,               // +0,05 pt
  affinitaires: 0.0005,      // +0,05 pt
  influence: 0.0005,         // +0,05 pt
  retention: 0.0008,         // +0,08 pt
  content: 0.0005            // +0,05 pt
};

const CVR_MIN = 0.003; // 0,3 %
const CVR_MAX = 0.025; // 2,5 %
const CAC_MIN = 2;
const CAC_MAX = 30;

/* ===========================
   TRAFIC ANNUALISÉ (5 paliers)
=========================== */
function annualAffiliatedTraffic(trafficMonthly) {
  if (trafficMonthly < 10000) {
    // <10k : 10% × 6 mois + 12% × 6 mois
    return (trafficMonthly * 0.10 * 6) + (trafficMonthly * 0.12 * 6);
  }
  if (trafficMonthly < 50000) {
    // 10k–50k : 12% × 6 mois + 14% × 6 mois
    return (trafficMonthly * 0.12 * 6) + (trafficMonthly * 0.14 * 6);
  }
  if (trafficMonthly < 100000) {
    // 50k–100k : 12% × 6 mois + 15% × 6 mois
    return (trafficMonthly * 0.12 * 6) + (trafficMonthly * 0.15 * 6);
  }
  if (trafficMonthly < 500000) {
    // 100k–500k : 18% × 12 mois
    return trafficMonthly * 0.18 * 12;
  }
  // ≥500k : 22% × 12 mois
  return trafficMonthly * 0.22 * 12;
}

/* =================
   HELPERS formats
================= */
function numberOf(v) {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}
function formatEUR(n) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}
function formatInt(n) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n));
}

/* ==================================
   Normalisation des parts de leviers
================================== */
function normalizedShares(baseShares, selected) {
  if (!selected.length) return {};
  let slice = {};
  let sum = 0;
  selected.forEach(k => {
    const v = baseShares[k] ?? 0;
    slice[k] = v;
    sum += v;
  });
  if (sum <= 0) {
    const eq = 1 / selected.length;
    selected.forEach(k => slice[k] = eq);
    return slice;
  }
  Object.keys(slice).forEach(k => { slice[k] = slice[k] / sum; });
  return slice;
}

/* ================
   CHART helpers
================ */
let leversChart = null;
function percentTooltipCallback(context) {
  const dataset = context.dataset;
  const currentValue = dataset.data[context.dataIndex];
  const total = dataset.data.reduce((a, b) => a + b, 0);
  const pct = total > 0 ? (currentValue / total) * 100 : 0;
  return `${context.label}: ${pct.toFixed(1)}%`;
}

/* =========================
   LOGIQUE PRINCIPALE
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-simu");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Inputs
    const trafficMonthly = numberOf(form.elements["traffic"].value);
    const aovInput       = numberOf(form.elements["aov"].value);
    const cvrInput       = numberOf(form.elements["cvr"].value) / 100;
    const cacUser        = numberOf(form.elements["cac"].value); // non utilisé directement, mais dispo si besoin
    const budgetMonthly  = numberOf(form.elements["budget"].value);
    const sectorKey      = form.elements["sector"].value || "other";
    const sector         = SECTORS[sectorKey] || SECTORS.other;

    // Trafic affilié annualisé
    const trafficYear = annualAffiliatedTraffic(trafficMonthly);

    // AOV estimé (impact leviers)
    const selectedLevers = Array.from(form.querySelectorAll('input[name="levers"]:checked')).map(n => n.value);
    let aov = aovInput > 0 ? aovInput : sector.aov;
    selectedLevers.forEach(lv => {
      const mult = AOV_MULT[lv];
      if (mult) aov *= mult;
    });

    // CVR ajusté (additif) + bornes
    let cvr = cvrInput > 0 ? cvrInput : sector.cvr;
    selectedLevers.forEach(lv => {
      const add = CVR_ADD[lv] || 0;
      cvr += add;
    });
    cvr = Math.min(Math.max(cvr, CVR_MIN), CVR_MAX);

    // Conversions potentielles (sans budget)
    const potentialOrders = trafficYear * cvr;

    // CAC pondéré par parts de voix des leviers cochés
    let cacEff = 10; // fallback
    if (selectedLevers.length) {
      const shares = normalizedShares(LEVER_SHARE_BASE, selectedLevers);
      let sum = 0;
      selectedLevers.forEach(lv => {
        const w = shares[lv] ?? 0;
        const base = CAC_BASE[lv] ?? 10;
        sum += w * base;
      });
      cacEff = Math.min(Math.max(sum, CAC_MIN), CAC_MAX);
    }

    // Budget & capping ventes
    const budgetYear = Math.max(budgetMonthly, 0) * 12;
    const ordersBudgetCap = cacEff > 0 ? (budgetYear / cacEff) : 0;
    const finalOrders = Math.min(potentialOrders, ordersBudgetCap);

    // KPI finaux
    const revenue = finalOrders * aov;
    const roi = budgetYear > 0 ? (revenue / budgetYear) : 0;
    const cacEstimated = finalOrders > 0 ? (budgetYear / finalOrders) : 0;

    // Affichage KPIs
    const resultsCard = document.getElementById("results");
    resultsCard.style.display = "block";
    document.getElementById("kpi-revenue").textContent = formatEUR(revenue);
    document.getElementById("kpi-orders").textContent  = formatInt(finalOrders);
    document.getElementById("kpi-budget").textContent  = formatEUR(budgetYear);

    document.getElementById("kpi-aov").textContent     = formatEUR(aov);
    document.getElementById("kpi-cac").textContent     = cacEstimated ? formatEUR(cacEstimated) : "—";
    document.getElementById("kpi-roi").textContent     = roi ? roi.toFixed(1) + "×" : "—";

    // Analyse courte et pro
    const insights = [];
    if (sectorKey !== "other") {
      if (aov > sector.aov * 1.1) {
        insights.push(`Votre panier moyen estimé est supérieur à la moyenne de votre secteur (${formatEUR(sector.aov)}).`);
      } else if (aov < sector.aov * 0.9) {
        insights.push(`Votre panier moyen estimé est inférieur à la moyenne de votre secteur (${formatEUR(sector.aov)}).`);
      } else {
        insights.push(`Votre panier moyen estimé est proche de la moyenne de votre secteur (${formatEUR(sector.aov)}).`);
      }
    }
    insights.push(`Taux de conversion simulé : ${(cvr * 100).toFixed(2)} %.`);
    insights.push(`Votre budget annuel saisi peut plafonner vos performances selon les leviers sélectionnés.`);
    insights.push(`Année 1 : montée progressive en puissance de votre programme.`);

    const insightsBox = document.getElementById("insights");
    insightsBox.innerHTML = `<h3>Analyse rapide</h3><ul>${insights.map(t => `<li>${t}</li>`).join("")}</ul>`;

    // Graphique donut — parts de voix normalisées sur les leviers cochés
    const ctx = document.getElementById("chart-levers").getContext("2d");
    let labels = [];
    let data = [];
    if (selectedLevers.length) {
      const shares = normalizedShares(LEVER_SHARE_BASE, selectedLevers);
      labels = Object.keys(shares);
      data = labels.map(k => shares[k]); // somme 1.0
    } else {
      labels = ["—"];
      data = [1];
    }

    if (leversChart) leversChart.destroy();
    leversChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: ["#3b82f6","#f97316","#22c55e","#eab308","#ef4444","#8b5cf6","#06b6d4","#f43f5e","#9ca3af","#16a34a"]
        }]
      },
      options: {
        responsive: true,
        cutout: "60%",
        plugins: {
          legend: { position: "right", labels: { boxWidth: 14, font: { size: 12 } } },
          tooltip: {
            callbacks: { label: percentTooltipCallback }
          }
        }
      }
    });

    // CTA final (après le camembert)
    const cta = document.getElementById("cta-link");
    cta.textContent = "🚀 Prenez RDV gratuit pour booster vos performances en affiliation";
    cta.style.display = "block";
  });
});
