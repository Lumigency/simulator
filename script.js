console.log("🔥 script.js chargé sans erreurs");

// === 1) Defaults secteur (baromètre CPA 2025, simplifié) ===
const SECTOR_DEFAULTS = {
  fashion:     { aov: 66.67, cvr: 0.0155, roi: 14.43, label: "Mode & Beauté" },
  electronics: { aov: 110.93, cvr: 0.0171, roi: 17.31, label: "High Tech & Électroménager" },
  home:        { aov: 112.69, cvr: 0.0160, roi: 20.71, label: "Maison & Décoration" },
  food:        { aov: 80.71, cvr: 0.0216, roi: 25.65, label: "Alimentaire & Boissons" },
  sports:      { aov: 79.21, cvr: 0.0107, roi: 11.08, label: "Sport & Loisirs" },
  travel:      { aov: 171.80, cvr: 0.0125, roi: 24.03, label: "Voyage & Tourisme" },
  luxury:      { aov: 200.00, cvr: 0.0120, roi: 18.00, label: "Luxe & Bijoux" },
  auto:        { aov: 85.59, cvr: 0.0169, roi: 13.02, label: "Automobile" },
  services:    { aov: 60.24, cvr: 0.0184, roi: 12.73, label: "B2B / Finance / Assurance" },
  culture:     { aov: 82.61, cvr: 0.0228, roi: 16.50, label: "Produits culturels & Loisirs" },
  other:       { aov: 80, cvr: 0.015, roi: 15, label: "Autre" }
};

// === 2) Pondérations leviers (impact sur AOV et commandes) ===
const LEVER_WEIGHTS = {
  cashback:        { orders: 1.10, aov: 0.95 },
  bonsplans:       { orders: 1.15, aov: 0.90 },
  retargeting:     { orders: 1.15, aov: 1.00 },
  css:             { orders: 1.10, aov: 1.00 },
  comparateurs:    { orders: 1.10, aov: 1.00 },
  display:         { orders: 1.05, aov: 1.00 },
  "display-networks": { orders: 1.05, aov: 1.00 },
  retention:       { orders: 1.10, aov: 1.02 },
  content:         { orders: 1.08, aov: 1.02 },
  emailing:        { orders: 1.10, aov: 1.01 },
  ppc:             { orders: 1.25, aov: 1.00 },
  affinitaires:    { orders: 1.12, aov: 1.02 },
  influence:       { orders: 1.20, aov: 0.98 }
};

// === 3) Ajustement du trafic annualisé ===
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

// === 4) Ajustement du CVR en fonction des leviers ===
function adjustedCVR(baseCvr, selectedLevers) {
  let cvr = baseCvr;

  const hasCashback = selectedLevers.includes("cashback");
  const hasBonsplans = selectedLevers.includes("bonsplans");

  if (selectedLevers.length === Object.keys(LEVER_WEIGHTS).length) {
    cvr += 0.02; // +2 points
  }

  if (!hasCashback || !hasBonsplans) {
    cvr /= 2; // divisé par 2 si l’un manque
  } else {
    cvr += 0.002; // +0.2 points si présents
  }

  return cvr;
}

// === 5) Helpers ===
function numberOf(v) {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}
function formatEur(n) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(n);
}
function formatInt(n) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0
  }).format(Math.round(n));
}

// === 6) Gestion du formulaire ===
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-simu");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // --- Inputs
    const trafficMonthly = numberOf(form.elements["traffic"]?.value);
    const aovInput = numberOf(form.elements["aov"]?.value);
    const cvrInputPct = numberOf(form.elements["cvr"]?.value);
    const budgetMonthly = numberOf(form.elements["budget"]?.value);
    const sectorKey = form.elements["sector"]?.value || "other";
    const sector = SECTOR_DEFAULTS[sectorKey] || SECTOR_DEFAULTS.other;

    // --- Valeurs de référence secteur
    const aov = aovInput > 0 ? aovInput : sector.aov;
    const baseCvr = (cvrInputPct > 0 ? cvrInputPct / 100 : sector.cvr);

    // --- Trafic et CVR ajustés
    const affiliatedTrafficYear = annualAffiliatedTraffic(trafficMonthly);
    const selectedLevers = Array.from(form.querySelectorAll('input[name="levers"]:checked')).map(n => n.value);
    const cvr = adjustedCVR(baseCvr, selectedLevers);

    // --- Ventes de base
    let baseOrders = affiliatedTrafficYear * cvr;

    // --- Pondérations leviers
    let ordersFactor = 1, aovFactor = 1;
    selectedLevers.forEach(lv => {
      const w = LEVER_WEIGHTS[lv];
      if (w) { ordersFactor *= w.orders; aovFactor *= w.aov; }
    });

    const finalOrders = Math.round(baseOrders * ordersFactor);
    const adjAOV = aov * aovFactor;
    const finalRevenue = Math.round(finalOrders * adjAOV);

    // --- Budget affiliation (CAC * ventes) mais capé
    const budgetTheoretical = finalOrders * (adjAOV / 10); // approximation CAC basé sur panier
    const budgetCap = budgetMonthly * 12;
    const finalBudget = Math.min(budgetTheoretical, budgetCap);

    // --- Analyse pro
    const insights = [];
    insights.push("📊 Vous voilà avec vos potentielles futures performances. Voici quelques éléments clés :");

    // Panier
    if (aov > sector.aov * 1.1) {
      insights.push(`Votre panier moyen (${formatEur(aov)}) est supérieur à la moyenne du secteur (${formatEur(sector.aov)}).`);
    } else if (aov < sector.aov * 0.9) {
      insights.push(`Votre panier moyen (${formatEur(aov)}) est inférieur à la moyenne du secteur (${formatEur(sector.aov)}).`);
    } else {
      insights.push(`Votre panier moyen (${formatEur(aov)}) est proche de la moyenne du secteur (${formatEur(sector.aov)}).`);
    }

    // Conversion
    if (cvr > sector.cvr * 1.1) {
      insights.push(`Votre taux de conversion (${(cvr*100).toFixed(2)}%) est au-dessus de la moyenne (${(sector.cvr*100).toFixed(2)}%).`);
    } else if (cvr < sector.cvr * 0.9) {
      insights.push(`Votre taux de conversion (${(cvr*100).toFixed(2)}%) est en dessous de la moyenne (${(sector.cvr*100).toFixed(2)}%).`);
    } else {
      insights.push(`Votre taux de conversion (${(cvr*100).toFixed(2)}%) est cohérent avec la moyenne (${(sector.cvr*100).toFixed(2)}%).`);
    }

    // Leviers
    if (selectedLevers.length) {
      insights.push("Leviers activés : " + selectedLevers.join(", "));
    } else {
      insights.push("Aucun levier activé pour l’instant.");
    }

    // CTA dynamique
    let ctaText = "";
    if (finalRevenue > 0 && finalBudget > 0) {
      ctaText = "📅 Découvrez comment créer ou optimiser votre programme d’affiliation → Prenez RDV gratuit";
    } else {
      ctaText = "⚡ Passez à l’action pour débloquer tout votre potentiel → Prenez RDV gratuit";
    }

    // --- Affichage
    document.getElementById("kpi-revenue").textContent = formatEur(finalRevenue);
    document.getElementById("kpi-orders").textContent = formatInt(finalOrders);
    document.getElementById("kpi-budget").textContent = formatEur(finalBudget);

    const insightsBox = document.getElementById("insights");
    insightsBox.innerHTML = `<h3>Analyse rapide</h3><ul>${insights.map(t => `<li>${t}</li>`).join("")}</ul>`;

    const ctaLink = document.getElementById("cta-link");
    if (ctaLink) {
      ctaLink.style.display = "block";
      ctaLink.textContent = ctaText;
      ctaLink.onclick = () => window.location.href = "https://www.lumigency.com/consultation-gratuite";
    }

    document.getElementById("results").style.display = "block";
  });
});
