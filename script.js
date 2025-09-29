/* ========= LUMIGENCY SIMULATOR — JS COMPLET ========= */

console.log("script.js chargé");

// === CONFIG SECTEURS (extrait simplifié, à compléter avec ton baromètre CPA 2025) ===
const SECTORS = {
  fashion: { aov: 67, cvr: 0.0155, label: "Mode & Beauté" },
  electronics: { aov: 113, cvr: 0.016, label: "High-tech & Électronique" },
  home: { aov: 106, cvr: 0.017, label: "Maison & Décoration" },
  food: { aov: 30, cvr: 0.016, label: "Alimentation & Drive" },
  sports: { aov: 80, cvr: 0.021, label: "Sport & Loisirs" },
  travel: { aov: 200, cvr: 0.010, label: "Voyage & Tourisme" },
  luxury: { aov: 450, cvr: 0.008, label: "Luxe & Bijoux" },
  auto: { aov: 150, cvr: 0.012, label: "Pièces Auto" },
  services: { aov: 95, cvr: 0.014, label: "Services divers" },
  other: { aov: 100, cvr: 0.015, label: "Autres" }
};

// === CONFIG LEVIERS : CAC ajustés par rapport au CAC client ===
const CAC_BY_LEVER = {
  cashback: 0.67, // ex : 10€ si CAC client = 15€
  bonsplans: 0.40,
  css: 0.87,
  comparateurs: 0.87,
  "display-networks": 0.80,
  retargeting: 0.80,
  affinitaires: 1.0,
  influence: 1.0,
  retention: 0.27,
  emailing: null, // nécessite hybrides
  content: null,  // nécessite hybrides
  ppc: null       // nécessite hybrides
};

// === TRAFIC ANNUALISÉ (paliers) ===
function getTrafficUplift(traffic) {
  if (traffic < 10000) return { mois1_6: 0.05, mois7_12: 0.08 };
  if (traffic < 50000) return { mois1_6: 0.08, mois7_12: 0.10 };
  if (traffic < 100000) return { mois1_6: 0.12, mois7_12: 0.15 };
  if (traffic < 500000) return { mois1_6: 0.12, mois7_12: 0.17 };
  return { mois1_6: 0.15, mois7_12: 0.18 };
}

// === AJUSTEMENTS AOV ===
function adjustAOV(baseAOV, levers) {
  let aov = baseAOV;
  if (levers.includes("cashback")) aov *= 0.95;
  if (levers.includes("bonsplans")) aov *= 0.95;
  if (levers.includes("comparateurs")) aov *= 0.98;
  if (levers.includes("affinitaires") || levers.includes("influence")) aov *= 1.05;
  return aov;
}

// === AJUSTEMENTS CVR ===
function adjustCVR(baseCVR, levers) {
  let cvr = baseCVR;
  if (levers.includes("emailing")) cvr += 0.001;
  if (levers.includes("ppc")) cvr += 0.002;
  if (levers.length >= 8) cvr += 0.015;
  return cvr;
}

// === MAIN ===
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-simu");
  if (!form) return;

  // Gérer la case "pas de budget défini"
  const budgetInput = form.elements["budget"];
  const noBudgetCheckbox = document.getElementById("noBudget");

  if (budgetInput && noBudgetCheckbox) {
    noBudgetCheckbox.addEventListener("change", () => {
      if (noBudgetCheckbox.checked) {
        budgetInput.disabled = true;
        budgetInput.value = "";
      } else {
        budgetInput.disabled = false;
      }
    });
  }

  // Soumission formulaire
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const traffic = Number(form.elements["traffic"].value);
    const aovUser = Number(form.elements["aov"].value);
    const cvrUser = Number(form.elements["cvr"].value) / 100;
    const cacClient = Number(form.elements["cac"].value);

    let budgetMensuel = 0;
    if (noBudgetCheckbox && noBudgetCheckbox.checked) {
      budgetMensuel = Infinity;
    } else {
      budgetMensuel = Number(form.elements["budget"].value) || 0;
    }

    const sectorKey = form.elements["sector"].value || "other";
    const sectorData = SECTORS[sectorKey] || SECTORS["other"];

    const levers = Array.from(form.querySelectorAll("input[name='levers']:checked")).map(el => el.value);

    // Ajustements AOV + CR
    const adjustedAOV = adjustAOV(aovUser, levers);
    const adjustedCVR = adjustCVR(cvrUser || sectorData.cvr, levers);

    // Trafic annualisé
    const uplift = getTrafficUplift(traffic);
    const annualTraffic = (traffic * 6 * (1 + uplift.mois1_6)) + (traffic * 6 * (1 + uplift.mois7_12));

    // Volume potentiel
    const potentialOrders = annualTraffic * adjustedCVR;
    const maxOrders = budgetMensuel === Infinity ? potentialOrders : Math.min(potentialOrders, (budgetMensuel * 12) / cacClient);
    const revenue = maxOrders * adjustedAOV;

    // CAC projeté
    const cacProjete = (budgetMensuel === Infinity) ? cacClient : (budgetMensuel * 12) / maxOrders;

    // ROI
    const roi = (budgetMensuel === Infinity) ? (revenue / (cacClient * maxOrders)) : revenue / (budgetMensuel * 12);

    // Injection résultats
    document.getElementById("results").style.display = "block";
    document.getElementById("kpi-revenue").textContent = revenue.toLocaleString("fr-FR") + " €";
    document.getElementById("kpi-orders").textContent = Math.round(maxOrders).toLocaleString("fr-FR");
    document.getElementById("kpi-budget").textContent = (budgetMensuel === Infinity ? "Budget illimité" : (budgetMensuel * 12).toLocaleString("fr-FR") + " €");
    document.getElementById("kpi-aov").textContent = adjustedAOV.toFixed(0) + " €";
    document.getElementById("kpi-cac").textContent = cacProjete.toFixed(2) + " €";
    document.getElementById("kpi-roi").textContent = roi.toFixed(2) + "x";

    // Insights rapides
    const insights = document.getElementById("insights");
    insights.innerHTML = `
      <ul>
        <li>💳 Votre panier moyen (${adjustedAOV.toFixed(0)} €) comparé au secteur (${sectorData.aov} €).</li>
        <li>📊 Taux de conversion simulé : ${(adjustedCVR * 100).toFixed(2)} %.</li>
        <li>💡 L'année 1 est une montée en puissance progressive.</li>
        ${budgetMensuel !== Infinity ? `<li>💰 Le budget saisi (${(budgetMensuel * 12).toLocaleString("fr-FR")} €) peut limiter vos performances.</li>` : `<li>💰 Budget illimité : simulation au plein potentiel.</li>`}
      </ul>
    `;

    // Graph camembert
    const ctx = document.getElementById("chart-levers").getContext("2d");
    if (window.leversChart) window.leversChart.destroy();
    window.leversChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: levers,
        datasets: [{
          data: levers.map(() => 100 / levers.length),
          backgroundColor: ["#4285F4", "#FBBC05", "#34A853", "#EA4335", "#46BDC6", "#9C27B0", "#FF7043", "#7E57C2", "#66BB6A", "#FFA726", "#8D6E63", "#26C6DA"]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "right" },
          datalabels: {
            color: "#fff",
            formatter: (value) => value.toFixed(1) + "%"
          }
        }
      },
      plugins: [ChartDataLabels]
    });

    // CTA dynamique
    document.getElementById("cta-link").textContent = "🚀 Prenez RDV gratuit pour booster vos performances en affiliation";
  });
});
