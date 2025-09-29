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

// === PARTS DE VENTES PAR LEVIER (simplifié baromètre sectoriel) ===
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
  ppc: 0.02,
  affinitaires: 0.03,
  influence: 0.02
};

// === CAC PROJETÉ PAR LEVIER ===
const LEVER_CAC = {
  cashback: 10,
  bonsplans: 6,
  css: 13,
  comparateurs: 13,
  "display-networks": 12,
  retargeting: 12,
  affinitaires: 15,
  influence: 15,
  retention: 4,
  emailing: 8,
  content: 8,
  ppc: 12
};

// === TRAFIC ANNUALISÉ SELON PALIERS ===
function annualAffiliatedTraffic(trafficMonthly) {
  if (trafficMonthly < 10000) {
    return trafficMonthly * 0.08 * 6 + trafficMonthly * 0.10 * 6;
  }
  if (trafficMonthly < 50000) {
    return trafficMonthly * 0.10 * 6 + trafficMonthly * 0.12 * 6;
  }
  if (trafficMonthly < 100000) {
    return trafficMonthly * 0.12 * 6 + trafficMonthly * 0.15 * 6;
  }
  if (trafficMonthly < 500000) {
    return trafficMonthly * 0.12 * 6 + trafficMonthly * 0.17 * 6;
  }
  return trafficMonthly * 0.15 * 6 + trafficMonthly * 0.18 * 6;
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
    const unlimitedBudget = form.elements["unlimited-budget"].checked;
    const sectorKey = form.elements["sector"].value || "other";

    const sector = SECTORS[sectorKey] || SECTORS.other;

    // === Ajustements ===
    const annualTraffic = annualAffiliatedTraffic(traffic);
    let aov = aovInput > 0 ? aovInput : sector.aov;
    let cvr = cvrInput > 0 ? cvrInput : sector.cvr;

    // Pondération leviers
    const selectedLevers = Array.from(form.querySelectorAll('input[name="levers"]:checked')).map(n => n.value);

    // Impact AOV
    if (selectedLevers.includes("cashback")) aov *= 0.95;
    if (selectedLevers.includes("bonsplans")) aov *= 0.95;
    if (selectedLevers.includes("comparateurs")) aov *= 0.98;
    if (selectedLevers.includes("affinitaires")) aov *= 1.05;
    if (selectedLevers.includes("influence")) aov *= 1.05;

    // Impact CR
    if (selectedLevers.length === Object.keys(LEVER_SHARE).length) cvr += 0.015;
    if (selectedLevers.includes("emailing")) cvr += 0.001;
    if (selectedLevers.includes("ppc")) cvr += 0.002;
    if (selectedLevers.includes("retargeting")) cvr += 0.0025;
    if (selectedLevers.includes("cashback")) cvr += 0.002;
    if (selectedLevers.includes("bonsplans")) cvr += 0.0015;
    if (selectedLevers.includes("css")) cvr += 0.001;
    if (selectedLevers.includes("display-networks")) cvr += 0.001;

    // Cap CR max (ex : 8 %)
    cvr = Math.min(cvr, 0.08);

    // === Ventes potentielles (sans contrainte budget) ===
    let potentialOrders = annualTraffic * cvr;

    // === CAC pondéré par leviers ===
    let weightedCAC = 0;
    selectedLevers.forEach(lv => {
      weightedCAC += (LEVER_CAC[lv] || cacInput);
    });
    if (selectedLevers.length > 0) weightedCAC = weightedCAC / selectedLevers.length;
    else weightedCAC = cacInput;

    // Ajustement CAC si trop éloigné
    if (weightedCAC < cacInput * 0.8) {
      weightedCAC = (weightedCAC + cacInput) / 2;
    }

    // === Budget & capping ===
    const budgetAnnuel = unlimitedBudget ? potentialOrders * weightedCAC : budgetMensuel * 12;
    const maxOrdersBudget = budgetAnnuel / weightedCAC;
    const finalOrders = Math.min(potentialOrders, maxOrdersBudget);

    const revenue = finalOrders * aov;
    const roi = budgetAnnuel > 0 ? revenue / budgetAnnuel : 0;

    // === Analyse ===
    const insights = [];
    if (sectorKey !== "other") {
      if (aov > sector.aov * 1.1) {
        insights.push(`💳 Votre panier moyen (${formatEur(aov)}) est supérieur à la moyenne de votre secteur (${formatEur(sector.aov)}).`);
      } else if (aov < sector.aov * 0.9) {
        insights.push(`⚠️ Votre panier moyen (${formatEur(aov)}) est inférieur à la moyenne de votre secteur (${formatEur(sector.aov)}).`);
      } else {
        insights.push(`✅ Votre panier moyen (${formatEur(aov)}) est proche de la moyenne de votre secteur (${formatEur(sector.aov)}).`);
      }
    }

    insights.push(`📊 Taux de conversion simulé : ${(cvr * 100).toFixed(2)} %.`);
    insights.push(`💡 L'année 1 est une montée en puissance progressive de votre programme.`);
    insights.push(`💰 Le budget annuel saisi (${formatEur(budgetAnnuel)}) cappe potentiellement vos performances.`);
    insights.push(`📈 ROI estimé : ${(roi * 100).toFixed(1)} %.`);

    showResults(revenue, finalOrders, budgetAnnuel, weightedCAC, insights, selectedLevers);
  });
});

// === AFFICHAGE ===
function showResults(revenue, orders, budget, cac, insights, selectedLevers) {
  document.getElementById("results").style.display = "block";
  document.getElementById("kpi-revenue").textContent = formatEur(revenue);
  document.getElementById("kpi-orders").textContent = formatInt(orders);
  document.getElementById("kpi-budget").textContent = formatEur(budget);

  // Ajout du CAC projeté
  let cacBox = document.getElementById("kpi-cac");
  if (!cacBox) {
    const p = document.createElement("p");
    p.innerHTML = `<strong>CAC projeté :</strong> <span id="kpi-cac">${formatEur(cac)}</span>`;
    document.getElementById("results").appendChild(p);
  } else {
    cacBox.textContent = formatEur(cac);
  }

  const insightsBox = document.getElementById("insights");
  insightsBox.innerHTML = `<h3>Analyse rapide</h3><ul>${insights.map(t => `<li>${t}</li>`).join("")}</ul>`;

  // Graphique parts de ventes
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
        legend: {
          position: "right",
          labels: { boxWidth: 15, font: { size: 12 } }
        },
        datalabels: {
          formatter: (value) => (value * 100).toFixed(1) + "%",
          color: "#fff",
          font: { weight: "bold", size: 11 }
        }
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
function formatEur(n) { return new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n); }
function formatInt(n) { return new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(Math.round(n)); }
