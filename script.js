console.log("script.js charge");

// ------------ SECTEURS (repères par défaut) ------------
const SECTORS = {
  fashion:     { aov: 67,  cvr: 0.0155, label: "Mode & Beauté" },
  electronics: { aov: 111, cvr: 0.0171, label: "Électronique & High-tech" },
  home:        { aov: 113, cvr: 0.0160, label: "Maison & Décoration" },
  food:        { aov: 81,  cvr: 0.0216, label: "Alimentaire & Drive" },
  sports:      { aov: 79,  cvr: 0.0107, label: "Sport & Loisirs" },
  travel:      { aov: 172, cvr: 0.0125, label: "Voyage & Tourisme" },
  luxury:      { aov: 200, cvr: 0.0120, label: "Luxe & Bijoux" },
  auto:        { aov: 86,  cvr: 0.0169, label: "Automobile" },
  services:    { aov: 60,  cvr: 0.0184, label: "Services / B2B / SaaS" },
  culture:     { aov: 83,  cvr: 0.0228, label: "Produits culturels" },
  other:       { aov: 80,  cvr: 0.0150, label: "Autre" }
};

// ------------ Part de voix (ventes) par levier (normalisée à ~100%) ------------
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
  ppc: 0.0,
  affinitaires: 0.0,
  influence: 0.0
};

// ------------ Multiplicateurs de CAC par levier (sur le CAC saisi) ------------
const CAC_MULT = {
  cashback: 0.40,          // ex: 10 EUR -> 4
  bonsplans: 0.20,
  retargeting: 0.30,
  css: 0.65,
  comparateurs: 0.65,
  "display-networks": 0.50,
  retention: 0.15,
  content: 0.80,
  emailing: 0.25,
  ppc: 1.20,
  affinitaires: 1.00,
  influence: 1.00
};

// ------------ Multiplicateurs AOV par levier ------------
const AOV_MULT = {
  cashback: 0.96,
  bonsplans: 0.95,
  retargeting: 1.00,
  css: 1.02,
  comparateurs: 1.02,
  "display-networks": 1.00,
  retention: 1.03,
  content: 1.02,
  emailing: 1.01,
  ppc: 0.98,
  affinitaires: 1.04,
  influence: 1.04
};

// ------------ Trafic affilié annualisé (paliers mis à jour) ------------
function annualAffiliatedTraffic(m) {
  if (m < 10000)         return m * 0.10 * 6 + m * 0.12 * 6;
  if (m < 50000)         return m * 0.12 * 6 + m * 0.14 * 6;
  if (m < 100000)        return m * 0.12 * 6 + m * 0.15 * 6; // <100k: 12% puis 15%
  if (m < 500000)        return m * 0.15 * 12;
  return                       m * 0.18 * 12;
}

// ------------ Helpers ------------
function numberOf(v){ const n=parseFloat(String(v).replace(",", ".")); return isNaN(n)?0:n; }
function formatEUR(n){ return new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n); }
function formatInt(n){ return new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(Math.round(n)); }

// ------------ Main ------------
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-simu");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Inputs
    const traffic = numberOf(form.elements["traffic"].value);
    const aovInput = numberOf(form.elements["aov"].value);
    const cvrInput = numberOf(form.elements["cvr"].value) / 100;
    const cacBase  = Math.max(numberOf(form.elements["cac"].value), 0.01);
    const budgetM  = numberOf(form.elements["budget"].value);
    const sectorKey = form.elements["sector"].value || "other";
    const sector = SECTORS[sectorKey] || SECTORS.other;

    // Valeurs de base
    const annualTraffic = annualAffiliatedTraffic(traffic);
    let cvr = cvrInput > 0 ? cvrInput : sector.cvr;
    let aov = aovInput > 0 ? aovInput : sector.aov;

    // Leviers sélectionnés
    const levers = Array.from(form.querySelectorAll('input[name="levers"]:checked')).map(n=>n.value);

    // Ajustement CVR (boost) simple
    if (levers.includes("cashback")) cvr += 0.002;
    if (levers.includes("bonsplans")) cvr += 0.0015;
    if (levers.includes("retargeting")) cvr += 0.0025;
    if (levers.includes("css")) cvr += 0.001;
    if (levers.includes("display-networks")) cvr += 0.001;

    // Pénalité si peu de leviers
    if (levers.length <= 2) cvr *= 0.9;
    // Si aucun levier fin de tunnel (cashback/bonsplans/css/comparateurs) -> petite pénalité
    const hasLowFunnel = ["cashback","bonsplans","css","comparateurs"].some(l=>levers.includes(l));
    if (!hasLowFunnel) cvr *= 0.8;

    // AOV estimé via multiplicateurs
    let aovMult = 1;
    levers.forEach(lv => { aovMult *= (AOV_MULT[lv] || 1); });
    const aovEst = aov * aovMult;

    // CAC moyen pondéré par levier (si aucun levier sélectionné -> CAC de base)
    let wSum = 0, cacWeightedSum = 0;
    if (levers.length>0) {
      levers.forEach(lv => {
        const w = LEVER_SHARE[lv] || 0;
        const mult = CAC_MULT[lv] ?? 1;
        wSum += w;
        cacWeightedSum += w * cacBase * mult;
      });
    }
    const cacEff = levers.length>0 && wSum>0 ? (cacWeightedSum / wSum) : cacBase;

    // Ventes potentielles (conversion) + capping budget
    const potentialOrders = annualTraffic * cvr;
    const budgetA = budgetM * 12;
    const maxOrdersBudget = budgetA / cacEff;
    const orders = Math.min(potentialOrders, maxOrdersBudget);

    // Chiffre d'affaires et ROI
    const revenue = orders * aovEst;
    const roi = budgetA > 0 ? (revenue / budgetA) : 0;

    // Analyse
    const insights = [];
    if (sectorKey !== "other") {
      if (aovInput > 0) {
        if (aovInput > sector.aov * 1.1) insights.push(`Votre panier moyen (${formatEUR(aovInput)}) est supérieur à la moyenne de votre secteur (${formatEUR(sector.aov)}).`);
        else if (aovInput < sector.aov * 0.9) insights.push(`Votre panier moyen (${formatEUR(aovInput)}) est inférieur à la moyenne de votre secteur (${formatEUR(sector.aov)}).`);
        else insights.push(`Votre panier moyen (${formatEUR(aovInput)}) est proche de la moyenne de votre secteur (${formatEUR(sector.aov)}).`);
      }
    }
    insights.push(`Taux de conversion simulé : ${(cvr*100).toFixed(2)} %.`);
    insights.push(`Année 1 : montée en puissance progressive de votre programme.`);
    insights.push(`Le budget annuel saisi (${formatEUR(budgetA)}) peut plafonner les volumes.`);

    // Affichage
    showResults({
      revenue, orders, budgetA, roi, aovEst, cacEff,
      levers
    });

    showInsights(insights);
    showLeversChart(levers, orders);
  });
});

// ------------ UI ------------
function showResults({revenue, orders, budgetA, roi, aovEst, cacEff}) {
  document.getElementById("results").style.display = "block";
  setText("kpi-revenue", formatEUR(revenue));
  setText("kpi-orders",  formatInt(orders));
  setText("kpi-budget",  formatEUR(budgetA));
  setText("kpi-aov",     formatEUR(aovEst));
  setText("kpi-cac",     formatEUR(cacEff));
  setText("kpi-roi",     roi.toFixed(2) + "x");
}

function showInsights(list){
  const box = document.getElementById("insights");
  box.innerHTML = `<h3>Analyse rapide</h3><ul>${list.map(t=>`<li>${escapeHtml(t)}</li>`).join("")}</ul>`;
}

function showLeversChart(levers, orders){
  const ctx = document.getElementById("chart-levers").getContext("2d");
  // normalise les parts uniquement sur les leviers cochés
  let labels = [], parts = [];
  let sum = 0;
  levers.forEach(lv => sum += (LEVER_SHARE[lv] || 0));
  if (sum === 0) {
    labels = ["Sans levier"]; parts = [1];
  } else {
    levers.forEach(lv => {
      labels.push(lv.replace("-", " "));
      parts.push((LEVER_SHARE[lv] || 0)/sum);
    });
  }

  if (window.salesChart) window.salesChart.destroy();
  window.salesChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: parts.map(p => p*100), // % pour l'affichage
        backgroundColor: ["#3b82f6","#f97316","#22c55e","#eab308","#ef4444","#8b5cf6","#06b6d4","#f43f5e","#10b981","#64748b"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "right", labels: { boxWidth: 14, font: { size: 12 } } },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.parsed.toFixed(1)} %`
          }
        },
        datalabels: { display: false } // % au survol uniquement
      },
      cutout: "60%"
    },
    plugins: typeof ChartDataLabels !== "undefined" ? [ChartDataLabels] : []
  });
}

function setText(id, v){ const el=document.getElementById(id); if(el) el.textContent = v; }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
