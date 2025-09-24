console.log("✅ script.js chargé");

// === CONFIG SECTEURS (baromètre) ===
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

// === TRAFIC ANNUALISÉ (nouvelle logique) ===
function annualAffiliatedTraffic(trafficMonthly) {
  if (trafficMonthly < 10000) {
    return trafficMonthly * 0.10 * 6 + trafficMonthly * 0.15 * 6;
  }
  if (trafficMonthly < 50000) {
    return trafficMonthly * 0.12 * 6 + trafficMonthly * 0.15 * 6;
  }
  if (trafficMonthly < 100000) {
    return trafficMonthly * 0.12 * 6 + trafficMonthly * 0.15 * 6;
  }
  if (trafficMonthly < 500000) {
    return trafficMonthly * 0.20 * 12;
  }
  return trafficMonthly * 0.25 * 12;
}

// === CAC AJUSTÉ PAR LEVIER ===
function adjustedCAC(baseCAC, levers, hybrides) {
  let cac = baseCAC;

  levers.forEach(lv => {
    switch (lv) {
      case "cashback": cac = Math.min(cac, baseCAC - 5); break;
      case "bonsplans": cac = Math.min(cac, baseCAC - 9); break;
      case "css":
      case "comparateurs": cac = Math.min(cac, baseCAC - 2); break;
      case "display-networks":
      case "retargeting": cac = Math.min(cac, baseCAC - 3); break;
      case "retention": cac = Math.min(cac, baseCAC - 11); break;
      // Affinitaires/media : pas de réduction
      case "emailing":
      case "content":
      case "ppc":
        if (!hybrides) {
          cac = cac; // pas d’impact direct, avertissement affiché
        }
        break;
    }
  });

  // ⚖️ Correctif : éviter un CAC trop bas
  if (cac < baseCAC * 0.7) {
    cac = baseCAC * 0.8;
  }

  // Impact hybrides
  if (hybrides) {
    cac *= 1.3;
  }

  return cac;
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

    // === Données de base ===
    const annualTraffic = annualAffiliatedTraffic(traffic);
    const aov = aovInput > 0 ? aovInput : sector.aov;
    let cvr = cvrInput > 0 ? cvrInput : sector.cvr;

    const selectedLevers = Array.from(form.querySelectorAll('input[name="levers"]:checked')).map(n => n.value);

    // Ajustements CR leviers
    if (selectedLevers.includes("cashback")) cvr += 0.002;
    if (selectedLevers.includes("bonsplans")) cvr += 0.0015;
    if (selectedLevers.includes("retargeting")) cvr += 0.0025;
    if (selectedLevers.includes("css")) cvr += 0.001;
    if (selectedLevers.includes("display-networks")) cvr += 0.001;

    // Ventes potentielles
    let potentialOrders = annualTraffic * cvr;

    // Budget
    const budgetAnnuel = budgetMensuel * 12;

    // CAC ajusté
    const cacFinal = adjustedCAC(cacInput, selectedLevers, hybrides);

    // Capping ventes
    const maxOrdersBudget = budgetAnnuel / cacFinal;
    const finalOrders = Math.min(potentialOrders, maxOrdersBudget);

    // CA & ROI
    const revenue = finalOrders * aov;
    const roi = budgetAnnuel > 0 ? revenue / budgetAnnuel : 0;

    // === Analyse ===
    const insights = [];
    if (sectorKey !== "other") {
      if (aov > sector.aov * 1.1) {
        insights.push(`Votre panier moyen (${format€(aov)}) est supérieur à celui de votre secteur (${format€(sector.aov)}).`);
      } else if (aov < sector.aov * 0.9) {
        insights.push(`Votre panier moyen (${format€(aov)}) est inférieur à celui de votre secteur (${format€(sector.aov)}).`);
      } else {
        insights.push(`Votre panier moyen (${format€(aov)}) est proche de la moyenne de votre secteur (${format€(sector.aov)}).`);
      }
    }

    insights.push(`Taux de conversion simulé : ${(cvr * 100).toFixed(2)} %.`);
    insights.push(`💡 La première année correspond à une montée en puissance progressive de votre programme.`);
    insights.push(`Le budget annuel saisi (${format€(budgetAnnuel)}) cappe potentiellement vos performances.`);

    if (selectedLevers.some(lv => ["emailing", "content", "ppc"].includes(lv)) && !hybrides) {
      insights.push(`⚠️ Pour activer certains leviers (Emailing, Content, SEA), il faut être ouvert aux modèles hybrides.`);
    }

    showResults(revenue, finalOrders, budgetAnnuel, aov, cacFinal, roi, insights, selectedLevers);
  });
});

// === AFFICHAGE ===
function showResults(revenue, orders, budget, aov, cac, roi, insights, selectedLevers) {
  document.getElementById("results").style.display = "block";
  document.getElementById("kpi-revenue").textContent = format€(revenue);
  document.getElementById("kpi-orders").textContent = formatInt(orders);
  document.getElementById("kpi-budget").textContent = format€(budget);

  // Ajouter KPIs avancés
  document.getElementById("insights").innerHTML = `
    <h3>Analyse rapide</h3>
    <ul>
      <li>Panier moyen estimé : ${format€(aov)}</li>
      <li>CAC projeté : ${format€(cac)}</li>
      <li>ROI estimé : ${(roi * 100).toFixed(1)} %</li>
      ${insights.map(t => `<li>${t}</li>`).join("")}
    </ul>
  `;

  // Graphique parts de ventes
  const leverLabels = selectedLevers;
  const leverData = leverLabels.map(lv => 1 / leverLabels.length); // répartition simple si cochés

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
          formatter: (value, ctx) => (value * 100).toFixed(1) + "%",
          color: "#fff",
          font: { weight: "bold", size: 11 }
        },
        tooltip: {
          callbacks: {
            label: (context) => context.label + ": " + (context.raw * 100).toFixed(1) + "%"
          }
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
function format€(n) { return new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n); }
function formatInt(n) { return new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(Math.round(n)); }
