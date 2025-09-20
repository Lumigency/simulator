console.log("script.js charge");

// ====== Données secteurs (moyennes baromètre, simplifiées) ======
const SECTOR_DEFAULTS = {
  fashion:     { aov: 66.67,  cvr: 0.0155, roi: 14.43, label: "Mode & Beauté" },
  electronics: { aov: 110.93, cvr: 0.0171, roi: 17.31, label: "High Tech & Électroménager" },
  home:        { aov: 112.69, cvr: 0.0160, roi: 20.71, label: "Maison & Décoration" },
  food:        { aov: 80.71,  cvr: 0.0216, roi: 25.65, label: "Alimentaire & Drive" },
  sports:      { aov: 79.21,  cvr: 0.0107, roi: 11.08, label: "Sport & Loisirs" },
  travel:      { aov: 171.80, cvr: 0.0125, roi: 24.03, label: "Voyage & Tourisme" },
  luxury:      { aov: 200.00, cvr: 0.0120, roi: 18.00, label: "Luxe & Bijoux" },
  auto:        { aov: 85.59,  cvr: 0.0169, roi: 13.02, label: "Automobile" },
  services:    { aov: 60.24,  cvr: 0.0184, roi: 12.73, label: "B2B / Finance / Assurance" },
  culture:     { aov: 82.61,  cvr: 0.0228, roi: 16.50, label: "Produits culturels & Loisirs" },
  other:       { aov: 80.00,  cvr: 0.0150, roi: 15.00, label: "Autre" }
};

// ====== Impact leviers (très bridé côté volume) ======
const LEVER_WEIGHTS = {
  cashback:         { orders: 1.06, aov: 0.95 },
  bonsplans:        { orders: 1.07, aov: 0.93 },
  retargeting:      { orders: 1.05, aov: 1.00 },
  css:              { orders: 1.04, aov: 1.00 },
  comparateurs:     { orders: 1.04, aov: 1.00 },
  display:          { orders: 1.02, aov: 1.00 },
  "display-networks": { orders: 1.02, aov: 1.00 },
  retention:        { orders: 1.03, aov: 1.02 },
  content:          { orders: 1.02, aov: 1.02 },
  emailing:         { orders: 1.03, aov: 1.01 },
  ppc:              { orders: 1.08, aov: 1.00 },
  affinitaires:     { orders: 1.03, aov: 1.02 },
  influence:        { orders: 1.04, aov: 0.98 }
};

// ====== 1) Trafic affilié annualisé — version conservatrice ======
function annualAffiliatedTraffic(trafficMonthly) {
  if (trafficMonthly < 10000) {
    // 10% * 6 mois + 15% * 6 mois
    return trafficMonthly * 0.10 * 6 + trafficMonthly * 0.15 * 6;
  }
  if (trafficMonthly < 50000) {
    // 15% * 6 mois + 16% * 6 mois
    return trafficMonthly * 0.15 * 6 + trafficMonthly * 0.16 * 6;
  }
  if (trafficMonthly < 500000) {
    // 25% * 12 mois
    return trafficMonthly * 0.25 * 12;
  }
  // >= 500k : 30% * 12 mois
  return trafficMonthly * 0.30 * 12;
}

// ====== 2) CVR ajusté par leviers — logique prudente ======
function adjustedCVR(baseCvr, selectedLevers) {
  // pénalité "affiliation" : on considère que le trafic affilié convertit moins bien que la moyenne du site
  let cvr = baseCvr * 0.5; // -50% de base

  const hasCashback   = selectedLevers.includes("cashback");
  const hasBonsPlans  = selectedLevers.includes("bonsplans");
  const hasRetarget   = selectedLevers.includes("retargeting");

  // Cashback / Bons plans
  if (!hasCashback && !hasBonsPlans) {
    cvr *= 0.8; // pas de levier volume -> encore -20%
  } else if (hasCashback && hasBonsPlans) {
    cvr *= 1.2;   // combo volume
    cvr += 0.001; // +0.1 pt
  } // sinon, au moins un présent -> on garde la pénalité de base

  // Retargeting : petit bonus absolu
  if (hasRetarget) cvr += 0.001; // +0.1 pt

  // Tous leviers : petit plafond
  const allLevers = Object.keys(LEVER_WEIGHTS);
  if (selectedLevers.length === allLevers.length) {
    cvr += 0.02; // +2 points (ABSOLU)
  }

  // bornes strictes
  cvr = clamp(cvr, 0.002, 0.03); // 0.2% à 3%
  return cvr;
}

// ====== 3) AOV ajusté — bandes serrées ======
function adjustedAOV(baseAov, selectedLevers) {
  let aov = baseAov;
  const hasCashback  = selectedLevers.includes("cashback");
  const hasBonsPlans = selectedLevers.includes("bonsplans");
  const hasContent   = selectedLevers.includes("content");
  const hasAffin     = selectedLevers.includes("affinitaires");
  const hasInfl      = selectedLevers.includes("influence");

  if (hasCashback)  aov *= 0.95; // -5%
  if (hasBonsPlans) aov *= 0.95; // -5%
  if (hasContent)   aov *= 1.02; // +2%
  if (hasAffin)     aov *= 1.02; // +2%
  if (hasInfl)      aov *= 0.98; // -2%

  // clamp : -10% / +10% max vs base
  aov = clamp(aov, baseAov * 0.90, baseAov * 1.10);
  return aov;
}

// ====== 4) Facteur volume levier (cap général) ======
function ordersFactorFromLevers(selectedLevers) {
  let factor = 1;
  selectedLevers.forEach(lv => {
    const w = LEVER_WEIGHTS[lv];
    if (w) factor *= w.orders;
  });
  // cap volume : +15% max cumulé
  return Math.min(factor, 1.15);
}

// ====== 5) RAMP-UP (année 1) ======
const RAMP_FACTOR = 0.65; // on considère qu'on n'exploite ~65% du potentiel la 1ère année

// ====== 6) Calcul principal ======
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-simu");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // inputs
    const trafficMonthly = num(form.elements["traffic"]?.value);
    const aovInput       = num(form.elements["aov"]?.value);
    const cvrInputPct    = num(form.elements["cvr"]?.value);
    const cacMax         = Math.max(0, num(form.elements["cac"]?.value));     // cible CAC
    const budgetMonthly  = Math.max(0, num(form.elements["budget"]?.value));  // budget client
    const sectorKey      = form.elements["sector"]?.value || "other";

    const sector = SECTOR_DEFAULTS[sectorKey] || SECTOR_DEFAULTS.other;

    const baseAov = aovInput > 0 ? aovInput : sector.aov;
    const baseCvr = (cvrInputPct > 0 ? cvrInputPct : sector.cvr * 100) / 100;

    const selectedLevers = Array.from(form.querySelectorAll('input[name="levers"]:checked')).map(n => n.value);

    // 1) trafic affilié annuel
    const affTrafficYear = annualAffiliatedTraffic(trafficMonthly);

    // 2) CVR & AOV ajustés
    const cvr = adjustedCVR(baseCvr, selectedLevers);
    const aov = adjustedAOV(baseAov, selectedLevers);

    // 3) volume brut (avec ramp-up et levier volume capé)
    const ordersFactor = ordersFactorFromLevers(selectedLevers);
    let rawOrders = affTrafficYear * cvr * ordersFactor * RAMP_FACTOR;

    // 4) garde-fous :
    //    - taux de conversion effectif sur l'année <= 2% du trafic affilié
    const capTrafficOrders = Math.floor(affTrafficYear * 0.02);
    rawOrders = Math.min(rawOrders, capTrafficOrders);

    // 5) capping budget (priorité budget)
    const budgetAnnualMax = budgetMonthly * 12;
    const maxOrdersByBudget = cacMax > 0 ? Math.floor(budgetAnnualMax / cacMax) : Math.floor(rawOrders);
    let finalOrders = Math.min(Math.floor(rawOrders), maxOrdersByBudget);

    // 6) CA (pessimiste) + budget utilisé (capé)
    let revenue = Math.round(finalOrders * aov);
    let budgetUsed = Math.min(finalOrders * cacMax, budgetAnnualMax);

    // 7) contrainte ROI prudente vs secteur (si ROI simulé dépasse 90% du ROI sectoriel, on réduit)
    const roiSimu = budgetUsed > 0 ? revenue / budgetUsed : 0;
    const roiCap  = sector.roi * 0.9;
    if (roiSimu > roiCap && budgetUsed > 0) {
      const maxOrdersByRoi = Math.floor((budgetUsed * roiCap) / aov);
      finalOrders = Math.min(finalOrders, maxOrdersByRoi);
      revenue     = Math.round(finalOrders * aov);
      budgetUsed  = Math.min(finalOrders * cacMax, budgetAnnualMax);
    }

    // 8) Analyse sobre
    const insights = buildInsights({
      sector, baseAov, aov, baseCvr, cvr, budgetUsed, budgetAnnualMax, selectedLevers
    });

    // 9) CTA
    const ctaText = (cvr >= sector.cvr && aov >= sector.aov)
      ? "Vous êtes bien positionné. Passez à l’action : réservez un rendez-vous gratuit."
      : "Potentiel d’amélioration identifié. Obtenez une recommandation sur-mesure : réservez un rendez-vous gratuit.";

    // affichage
    showResults(revenue, finalOrders, budgetUsed, insights, ctaText);
  });
});

// ====== Analyse courte et pro ======
function buildInsights({ sector, baseAov, aov, baseCvr, cvr, budgetUsed, budgetAnnualMax, selectedLevers }) {
  const out = [];

  // accroche simple
  out.push("Projection prudente sur 12 mois (année 1 avec montée en charge).");

  // panier
  if (aov > sector.aov * 1.1) {
    out.push(`Panier moyen simulé au-dessus de la tendance marché (${fmtEUR(aov)} vs ref ${fmtEUR(sector.aov)}).`);
  } else if (aov < sector.aov * 0.9) {
    out.push(`Panier moyen simulé en dessous de la tendance marché (${fmtEUR(aov)} vs ref ${fmtEUR(sector.aov)}).`);
  } else {
    out.push(`Panier moyen simulé proche de la tendance marché (${fmtEUR(aov)} vs ref ${fmtEUR(sector.aov)}).`);
  }

  // cvr
  if (cvr > sector.cvr * 1.1) {
    out.push(`Taux de conversion simulé supérieur aux repères (${pct(cvr)} vs ref ${pct(sector.cvr)}).`);
  } else if (cvr < sector.cvr * 0.9) {
    out.push(`Taux de conversion simulé inférieur aux repères (${pct(cvr)} vs ref ${pct(sector.cvr)}).`);
  } else {
    out.push(`Taux de conversion simulé cohérent avec les repères (${pct(cvr)} vs ref ${pct(sector.cvr)}).`);
  }

  // budget
  if (budgetUsed >= budgetAnnualMax * 0.99) {
    out.push("Le budget annuel est atteint. Les volumes sont volontairement plafonnés.");
  } else {
    out.push("Le budget annuel n’est pas totalement consommé dans cette projection prudente.");
  }

  // leviers : on reste vague (on évite d’offrir trop d’info gratuitement)
  if (selectedLevers.length === 0) {
    out.push("Aucun levier activé dans la simulation. Étudions ensemble la priorisation des leviers adaptés à votre secteur.");
  } else {
    out.push("Des leviers structurants sont activés. Une priorisation fine par palier peut améliorer la trajectoire.");
  }

  return out;
}

// ====== Affichage ======
function showResults(revenue, orders, budgetUsed, insights, ctaText) {
  elt("kpi-revenue").textContent = fmtEUR(revenue);
  elt("kpi-orders").textContent  = fmtInt(orders);
  elt("kpi-budget").textContent  = fmtEUR(budgetUsed);

  const insightsBox = elt("insights");
  if (insightsBox) {
    insightsBox.innerHTML = `<h3>Analyse rapide</h3><ul>${insights.map(t => `<li>${escapeHtml(t)}</li>`).join("")}</ul>`;
  }

  const cta = elt("cta-link");
  if (cta) {
    cta.textContent = ctaText;
    cta.onclick = () => window.location.href = "https://www.lumigency.com/consultation-gratuite";
    cta.style.display = "block";
  }

  elt("results").style.display = "block";
}

// ====== Utils ======
function elt(id) { return document.getElementById(id); }
function num(v)  { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? 0 : n; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function fmtEUR(n) { return new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n); }
function fmtInt(n) { return new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(Math.round(n)); }
function pct(x)   { return (x * 100).toFixed(2) + " %"; }
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#039;'}[m])); }
