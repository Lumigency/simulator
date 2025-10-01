// ========== script.js — Simulateur Lumigency (version complète) ==========

console.log("✅ script.js chargé");

// ----------------- HELPERS -----------------
function numberOf(v){ const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? 0 : n; }
function fmtCurrency(n){ return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n); }
function fmtNumber(n){ return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n)); }
function normalize(map){
  const vals = Object.values(map);
  const s = vals.reduce((a,b)=>a+b,0) || 1;
  const out = {};
  for(const k in map) out[k] = map[k] / s;
  return out;
}

// ----------------- DONNÉES SECTEURS (baromètre 2025 résumé) -----------------
const SECTORS = {
  fashion: {
    label: "Mode & Beauté", aov: 67, cvr: 0.0155,
    pdv: normalize({ cashback:0.23, bonsplans:0.18, retargeting:0.14, css:0.12, comparateurs:0.11, "display-networks":0.10, retention:0.06, content:0.04, emailing:0.02 })
  },
  electronics: {
    label: "High-tech & Électroménager", aov: 111, cvr: 0.0171,
    pdv: normalize({ comparateurs:0.25, cashback:0.20, css:0.15, bonsplans:0.12, retargeting:0.12, "display-networks":0.08, emailing:0.03, content:0.03 })
  },
  home: {
    label: "Maison & Décoration", aov: 113, cvr: 0.0160,
    pdv: normalize({ cashback:0.20, bonsplans:0.16, css:0.12, comparateurs:0.10, retargeting:0.13, "display-networks":0.10, emailing:0.03, content:0.06, retention:0.10 })
  },
  food: {
    label: "Alimentaire & Drive", aov: 81, cvr: 0.0216,
    pdv: normalize({ cashback:0.18, bonsplans:0.20, comparateurs:0.12, retargeting:0.12, "display-networks":0.10, emailing:0.05, content:0.05, retention:0.08 })
  },
  sports: {
    label: "Sport & Loisirs", aov: 79, cvr: 0.0107,
    pdv: normalize({ cashback:0.25, bonsplans:0.18, comparateurs:0.11, retargeting:0.14, "display-networks":0.09, emailing:0.02, content:0.04 })
  },
  travel: {
    label: "Voyage & Tourisme", aov: 172, cvr: 0.0125,
    pdv: normalize({ affinitaires:0.25, comparateurs:0.20, cashback:0.15, retargeting:0.18, "display-networks":0.15, emailing:0.04 })
  },
  luxury: {
    label: "Luxe & Bijoux", aov: 200, cvr: 0.0120,
    pdv: normalize({ affinitaires:0.30, influence:0.20, cashback:0.20, "display-networks":0.10, comparateurs:0.10, emailing:0.05 })
  },
  auto: {
    label: "Automobile", aov: 86, cvr: 0.0169,
    pdv: normalize({ comparateurs:0.25, bonsplans:0.25, cashback:0.20, css:0.11, "display-networks":0.06, retargeting:0.08 })
  },
  culture: {
    label: "Produits culturels", aov: 83, cvr: 0.0228,
    pdv: normalize({ bonsplans:0.35, cashback:0.30, comparateurs:0.15, retargeting:0.07, "display-networks":0.05, emailing:0.03 })
  },
  other: {
    label: "Autre", aov: 80, cvr: 0.0150,
    pdv: normalize({ cashback:0.23, bonsplans:0.18, retargeting:0.14, css:0.12, comparateurs:0.11, "display-networks":0.10, content:0.04, emailing:0.02 })
  }
};

// ----------------- CAC par levier (valeur en euros estimée) -----------------
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
  emailing: 14,
  content: 14,
  ppc: 14
};

// ----------------- MAPPING ÉDITEURS -----------------
const EDITORS = {
  cashback: [
    { name: "iGraal", logo: "https://logo.clearbit.com/igraal.com" },
    { name: "Poulpeo", logo: "https://logo.clearbit.com/poulpeo.com" },
    { name: "Joko", logo: "https://logo.clearbit.com/joko.io" },
    { name: "Widilo", logo: "https://logo.clearbit.com/widilo.fr" }
  ],
  bonsplans: [
    { name: "Ma Reduc", logo: "https://logo.clearbit.com/mareduc.com" },
    { name: "Dealabs", logo: "https://logo.clearbit.com/dealabs.com" },
    { name: "Radins", logo: "https://logo.clearbit.com/radins.com" },
    { name: "Wanted", logo: "https://via.placeholder.com/80x40?text=Wanted" }
  ],
  css: [
    { name: "Redbrain", logo: "https://logo.clearbit.com/redbrain.com" },
    { name: "Velkashopping", logo: "https://via.placeholder.com/80x40?text=Velka" }
  ],
  comparateurs: [
    { name: "Idealo", logo: "https://logo.clearbit.com/idealo.fr" },
    { name: "Le Dénicheur", logo: "https://logo.clearbit.com/ledenicheur.fr" },
    { name: "Kelkoo", logo: "https://logo.clearbit.com/kelkoo.com" }
  ],
  retargeting: [
    { name: "Criteo", logo: "https://logo.clearbit.com/criteo.com" },
    { name: "Uzerly", logo: "https://via.placeholder.com/80x40?text=Uzerly" }
  ],
  "display-networks": [
    { name: "Audience Run", logo: "https://via.placeholder.com/80x40?text=AudienceRun" }
  ],
  content: [
    { name: "Reworld Media", logo: "https://logo.clearbit.com/reworldmedia.com" },
    { name: "DCE", logo: "https://via.placeholder.com/80x40?text=DCE" },
    { name: "Doctissimo", logo: "https://logo.clearbit.com/doctissimo.fr" }
  ],
  emailing: [
    { name: "Onssen", logo: "https://via.placeholder.com/80x40?text=Onssen" },
    { name: "Emailing Network", logo: "https://logo.clearbit.com/emailingnetwork.com" }
  ],
  affinitaires: [
    { name: "Les Bons Plans de Naïma", logo: "https://logo.clearbit.com/lesbonsplansdenaima.fr" },
    { name: "FR Android", logo: "https://logo.clearbit.com/frandroid.com" }
  ],
  ppc: [
    { name: "JVWEB", logo: "https://logo.clearbit.com/jvweb.fr" },
    { name: "Ad's Up", logo: "https://logo.clearbit.com/ads-up.fr" }
  ],
  influence: [
    { name: "Influence4You", logo: "https://logo.clearbit.com/influence4you.com" },
    { name: "Stellar", logo: "https://via.placeholder.com/80x40?text=Stellar" }
  ],
  retention: [
    { name: "Beyable", logo: "https://logo.clearbit.com/beyable.com" },
    { name: "Salecycle", logo: "https://logo.clearbit.com/salecycle.com" }
  ]
};


// ----------------- ANNUAL TRAFFIC -----------------
function annualAffiliatedTraffic(monthly) {
  if (monthly < 10000) return monthly * (0.05 * 6 + 0.08 * 6);
  if (monthly < 50000) return monthly * (0.08 * 6 + 0.10 * 6);
  if (monthly < 100000) return monthly * (0.12 * 6 + 0.15 * 6);
  if (monthly < 500000) return monthly * (0.12 * 6 + 0.17 * 6);
  return monthly * (0.15 * 6 + 0.18 * 6);
}

// ----------------- AJUSTEMENTS -----------------
function adjustAOV(baseAov, levers) {
  let a = baseAov;
  if (levers.includes("cashback")) a *= 0.95;
  if (levers.includes("bonsplans")) a *= 0.95;
  if (levers.includes("comparateurs") || levers.includes("css")) a *= 0.98;
  if (levers.includes("affinitaires")) a *= 1.05;
  if (levers.includes("influence")) a *= 1.05;
  return a;
}
function adjustCVR(baseCvr, levers) {
  let c = baseCvr;
  if (levers.includes("emailing")) c += 0.001;
  if (levers.includes("ppc")) c += 0.002;
  if (levers.includes("retargeting")) c += 0.0025;
  if (levers.includes("cashback")) c += 0.002;
  if (levers.includes("bonsplans")) c += 0.0015;
  if (levers.includes("css")) c += 0.001;
  if (levers.includes("display-networks")) c += 0.001;
  if (levers.includes("comparateurs")) c += 0.001;
  if (levers.includes("influence")) c += 0.0015;
  if (levers.includes("affinitaires")) c += 0.001;
  if (levers.includes("retention")) c += 0.002;
  if (levers.includes("content")) c += 0.001;

  const ALL_LEVERS = ["cashback","bonsplans","retargeting","css","comparateurs","display-networks","retention","content","emailing","ppc","affinitaires","influence"];
  if (ALL_LEVERS.every(l => levers.includes(l))) c += 0.015;
  if (!levers.includes("cashback") && !levers.includes("bonsplans")) c *= 0.5;
  return Math.min(c, 0.08);
}

// ----------------- CAC PROJETÉ -----------------
function projectedCAC(sectorKey, levers, cacClient) {
  const sector = SECTORS[sectorKey] || SECTORS.other;
  const pdv = sector.pdv || {};
  let sel = {};
  if (levers.length) {
    levers.forEach(lv => { sel[lv] = pdv[lv] != null ? pdv[lv] : 1; });
  } else {
    sel = Object.fromEntries(Object.entries(pdv).sort((a,b)=>b[1]-a[1]).slice(0,5));
  }
  sel = normalize(sel);

  let cac = 0;
  for (const lv in sel) {
    const base = (LEVER_CAC[lv] != null) ? LEVER_CAC[lv] : cacClient || 0;
    cac += sel[lv] * base;
  }

  if (cacClient > 0 && cac < cacClient * 0.8) cac = (cac + cacClient) / 2;
  if (cac <= 0) cac = cacClient || 0;
  return cac;
}

// ----------------- DATA CAMEMBERT -----------------
function chartDataFor(sectorKey, levers) {
  const sector = SECTORS[sectorKey] || SECTORS.other;
  let pdv = { ...sector.pdv };
  if (levers.length) {
    const filtered = {};
    levers.forEach(lv => { filtered[lv] = pdv[lv] != null ? pdv[lv] : 0.01; });
    pdv = filtered;
  }
  const normalized = normalize(pdv);
  const labels = Object.keys(normalized);
  const data = labels.map(k => normalized[k]);
  return { labels, data };
}

// ----------------- AFFICHAGE ÉDITEURS -----------------
function afficherEditeurs(levers) {
  const container = document.querySelector(".editor-grid");
  if (!container) return;
  container.innerHTML = "";

  let suggestions = [];
  levers.forEach(l => { if (EDITORS[l]) suggestions = suggestions.concat(EDITORS[l]); });

  suggestions = suggestions.sort(() => 0.5 - Math.random());
  suggestions = suggestions.slice(0, 8);

  suggestions.forEach(e => {
    const card = document.createElement("div");
    card.className = "editor-card";
    card.innerHTML = `<img src="${e.logo}" alt="${e.name}"><span>${e.name}</span>`;
    container.appendChild(card);
  });
}

// ----------------- MAIN -----------------
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-simu");
  if (!form) {
    console.warn("form-simu introuvable");
    return;
  }

  const unlimitedCheckbox = document.getElementById("unlimited-budget") || document.getElementById("noBudget");
  const budgetInput = form.elements["budget"];
  if (unlimitedCheckbox && budgetInput) {
    unlimitedCheckbox.addEventListener("change", () => {
      budgetInput.disabled = unlimitedCheckbox.checked;
      if (unlimitedCheckbox.checked) budgetInput.value = "";
    });
  }

  const allLeversCheckbox = document.getElementById("allLevers");
  const leverCheckboxes = form.querySelectorAll('input[name="levers"]');
  if (allLeversCheckbox && leverCheckboxes.length > 0) {
    allLeversCheckbox.addEventListener("change", () => { leverCheckboxes.forEach(cb => cb.checked = allLeversCheckbox.checked); });
    leverCheckboxes.forEach(cb => { cb.addEventListener("change", () => { if (!cb.checked) allLeversCheckbox.checked = false; }); });
  }

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();

    const trafficMonthly = numberOf(form.elements["traffic"]?.value);
    const aovUser = numberOf(form.elements["aov"]?.value);
    const cvrUserInput = numberOf(form.elements["cvr"]?.value) / 100;
    const cacClient = numberOf(form.elements["cac"]?.value);
    const sectorKey = form.elements["sector"]?.value || "other";
    const levers = Array.from(form.querySelectorAll('input[name="levers"]:checked')).map(i => i.value);

    let budgetMonthly = 0;
    if (unlimitedCheckbox && unlimitedCheckbox.checked) budgetMonthly = Infinity;
    else budgetMonthly = numberOf(form.elements["budget"]?.value) || 0;
    const budgetAnnual = (budgetMonthly === Infinity) ? Infinity : budgetMonthly * 12;

    const sector = SECTORS[sectorKey] || SECTORS.other;
    const baseAov = (aovUser > 0) ? aovUser : sector.aov;
    const baseCvr = (cvrUserInput > 0) ? cvrUserInput : sector.cvr;

    const adjustedAov = adjustAOV(baseAov, levers);
    const adjustedCvr = adjustCVR(baseCvr, levers);

    const affiliatedTrafficYear = annualAffiliatedTraffic(trafficMonthly);
    const potentialOrders = affiliatedTrafficYear * adjustedCvr;
    const cacProjected = projectedCAC(sectorKey, levers, cacClient || 0);
    const maxOrdersByBudget = (budgetAnnual === Infinity || cacProjected === 0) ? potentialOrders : (budgetAnnual / cacProjected);
    const finalOrders = Math.min(potentialOrders, maxOrdersByBudget);

    const revenue = finalOrders * adjustedAov;
    const budgetConsumed = (budgetAnnual === Infinity) ? finalOrders * cacProjected : Math.min(budgetAnnual, finalOrders * cacProjected);
    const roi = (budgetConsumed > 0) ? (revenue / budgetConsumed) : (budgetAnnual === Infinity ? (revenue / (finalOrders * cacClient || 1)) : 0);

    const elRevenue = document.getElementById("kpi-revenue");
    const elOrders = document.getElementById("kpi-orders");
    const elBudget = document.getElementById("kpi-budget");
    const elAov = document.getElementById("kpi-aov");
    const elCac = document.getElementById("kpi-cac");
    const elRoi = document.getElementById("kpi-roi");
    if (elRevenue) elRevenue.textContent = fmtCurrency(revenue);
    if (elOrders) elOrders.textContent = fmtNumber(finalOrders);
    if (elBudget) elBudget.textContent = (budgetAnnual === Infinity) ? "Illimité" : fmtCurrency(budgetAnnual);
    if (elAov) elAov.textContent = fmtCurrency(adjustedAov);
    if (elCac) elCac.textContent = fmtCurrency(cacProjected);
    if (elRoi) elRoi.textContent = (roi > 0 ? roi.toFixed(2) + "x" : "—");

    const insightsBox = document.getElementById("insights");
    const analysis = [];
    if (sectorKey !== "other") {
      if (adjustedAov > sector.aov * 1.1) analysis.push(`Votre panier moyen estimé (${fmtCurrency(adjustedAov)}) est supérieur à la moyenne du secteur.`);
      else if (adjustedAov < sector.aov * 0.9) analysis.push(`Votre panier moyen estimé (${fmtCurrency(adjustedAov)}) est inférieur à la moyenne du secteur.`);
      else analysis.push(`Votre panier moyen estimé (${fmtCurrency(adjustedAov)}) est proche de la moyenne du secteur.`);
    }
    analysis.push(`Taux de conversion simulé : ${(adjustedCvr * 100).toFixed(2)}% (montée en puissance sur l'année 1).`);
    if (budgetAnnual !== Infinity) analysis.push(`Note : votre budget annuel saisi (${fmtCurrency(budgetAnnual)}) peut limiter le volume de ventes affiché.`);
    if (insightsBox) insightsBox.innerHTML = `<h3>Analyse rapide</h3><ul>${analysis.map(t=>`<li>${t}</li>`).join("")}</ul>`;

    const canvas = document.getElementById("chart-levers");
    if (canvas && window.Chart) {
      const { labels, data } = chartDataFor(sectorKey, levers);
      const dataPct = data.map(v => +(v*100).toFixed(2));
      if (window.salesChart) window.salesChart.destroy();
      window.salesChart = new Chart(canvas.getContext("2d"), {
        type: "doughnut",
        data: {
          labels: labels.map(l => l.replace(/-/g, " ")),
          datasets: [{ data: dataPct, backgroundColor: ["#3b82f6","#f97316","#22c55e","#eab308","#ef4444","#8b5cf6","#06b6d4","#f43f5e","#10b981","#a855f7","#64748b","#f59e0b"] }]
        },
        options: { responsive: true, cutout: "55%", plugins: { legend: { position: "right" } } }
      });
    }

    // ✅ Affichage éditeurs
    afficherEditeurs(levers);

    const ctaWrap = document.getElementById("cta-link");
    if (ctaWrap) {
      ctaWrap.innerHTML = `<a class="cta" href="https://www.lumigency.com/consultation-gratuite">🚀 Prenez RDV gratuit</a>`;
      ctaWrap.style.display = "block";
    }

    console.log("Simulation — trafic:", trafficMonthly, "orders:", finalOrders, "rev:", revenue, "cacProj:", cacProjected, "budgetAnnuel:", budgetAnnual);
  });
});

