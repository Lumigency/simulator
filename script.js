// ========== script.js — Simulateur Lumigency (version complète) ==========

console.log("✅ script.js chargé");

// === Gestion du formulaire multi-étapes ===
const steps = document.querySelectorAll('.form-step');
const progress = document.querySelector('#progress');
let currentStep = 0;

function showStep(index) {
  steps.forEach((step, i) => step.classList.toggle('active', i === index));


   // ✅ Met automatiquement à jour le pourcentage
  let percent = Math.round((index / (steps.length - 1)) * 100);
  if (index === steps.length - 1) percent = 85; // limite à 85% avant soumission
  updateProgress(percent);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Navigation entre les étapes
document.getElementById('next-step-1')?.addEventListener('click', () => {
  const objectif = document.querySelector('[name="objectif"]');
  if (!objectif.value) {
    objectif.classList.add('is-invalid');
    setTimeout(() => objectif.classList.remove('is-invalid'), 1200);
    return;
  }
  currentStep = 1;
  showStep(currentStep);
});

document.getElementById('next-step-2')?.addEventListener('click', () => {
  currentStep = 2;
  showStep(currentStep);
});

document.getElementById('prev-step-2')?.addEventListener('click', () => {
  currentStep = 0;
  showStep(currentStep);
});

document.getElementById('prev-step-3')?.addEventListener('click', () => {
  currentStep = 1;
  showStep(currentStep);
});

// Initialisation
showStep(currentStep);
// ✅ Forcer la barre à 0 % au tout démarrage
updateProgress(0);

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
// AOV (euros) et CVR (decimale). PDV = parts de voix estimées par levier (non-exhaustif)
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

// ----------------- TRAFIC ANNUALISÉ (paliers finalisés) -----------------
// conservative uplifts agreed: returns number of visits counted for year
function annualAffiliatedTraffic(monthly) {
  if (monthly < 10000) {
    // <10k : 6 months at 5% + 6 months at 8%
    return monthly * (0.05 * 6 + 0.08 * 6);
  }
  if (monthly < 50000) {
    // 10k-50k : 6 months at 8% + 6 months at 10%
    return monthly * (0.08 * 6 + 0.10 * 6);
  }
  if (monthly < 100000) {
    // 50k-100k : 6 months at 12% + 6 months at 15%
    return monthly * (0.12 * 6 + 0.15 * 6);
  }
  if (monthly < 500000) {
    // 100k-500k : 6 months at 12% + 6 months at 17%
    return monthly * (0.12 * 6 + 0.17 * 6);
  }
  // >= 500k : 6 months at 15% + 6 months at 18%
  return monthly * (0.15 * 6 + 0.18 * 6);
}

// ----------------- AJUSTEMENTS AOV selon leviers -----------------
function adjustAOV(baseAov, levers) {
  let a = baseAov;
  if (levers.includes("cashback")) a *= 0.95;     // -5%
  if (levers.includes("bonsplans")) a *= 0.95;    // -5%
  if (levers.includes("comparateurs") || levers.includes("css")) a *= 0.98; // -2%
  if (levers.includes("affinitaires")) a *= 1.05; // +5%
  if (levers.includes("influence")) a *= 1.05;   // +5%
  return a;
}

// ----------------- AJUSTEMENTS CVR selon leviers -----------------
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

  // si tous les leviers (très rare) -> bonus
  const ALL_LEVERS = ["cashback","bonsplans","retargeting","css","comparateurs","display-networks","retention","content","emailing","ppc","affinitaires","influence"];
  if (ALL_LEVERS.every(l => levers.includes(l))) c += 0.015;

  // Si aucun levier "fin de tunnel" (cashback / bonsplans) sélectionné -> prudence (diviser par 2)
  if (!levers.includes("cashback") && !levers.includes("bonsplans")) c *= 0.5;

  // cap raisonnable pour éviter chiffres irréalistes
  return Math.min(c, 0.08);
}

// ----------------- CAC projeté pondéré (version smart 2025) -----------------
function projectedCAC(sectorKey, levers, cacClient) {
  const sector = SECTORS[sectorKey] || SECTORS.other;
  const pdv = sector.pdv || {};

  // 1️⃣ Sélection PDV pour les leviers cochés
  let sel = {};
  if (levers.length) {
    levers.forEach(lv => sel[lv] = pdv[lv] ?? 1);
  } else {
    sel = Object.fromEntries(Object.entries(pdv).sort((a,b)=>b[1]-a[1]).slice(0,5));
  }
  sel = normalize(sel);

  // 2️⃣ Moyenne pondérée du CAC de base
  let cac = 0;
  for (const lv in sel) {
    const base = LEVER_CAC[lv] ?? cacClient ?? 0;
    cac += sel[lv] * base;
  }

  // 3️⃣ Déterminer le profil du mix
  const premiumLevers = ["affinitaires", "influence", "content", "emailing"];
  const massLevers = ["cashback", "bonsplans", "retargeting", "comparateurs", "css"];
  const nbPremium = levers.filter(l => premiumLevers.includes(l)).length;
  const nbMass = levers.filter(l => massLevers.includes(l)).length;

  // 4️⃣ Mix factor = effet stabilisateur selon le nombre total de leviers
  const diversityFactor = 1 - Math.min(levers.length / 10, 0.3); // max -30% si >10 leviers
  cac *= diversityFactor;

  // 5️⃣ Ajustement premium/mass
  if (nbPremium && !nbMass) cac *= 1.25; // que des premium
  else if (nbMass && !nbPremium) cac *= 0.9; // que des mass
  else if (nbPremium && nbMass) cac *= 1.05; // mix équilibré

  // 6️⃣ Ajustement progressif selon CAC client
  if (cacClient > 0) {
    const diffRatio = cac / cacClient;
    if (diffRatio < 0.7) cac = (cac + cacClient * 0.8) / 2; // lisse vers client
    else if (diffRatio > 1.4) cac = (cac + cacClient * 1.2) / 2; // plafonne la hausse excessive
  }

  // 7️⃣ Sécurité : floor minimum
  if (cac <= 0) cac = cacClient || 10;

  return cac;
}

// ----------------- MAPPING ÉDITEURS (logos en local /assets) -----------------
const EDITORS = {
  cashback: [
    { name: "iGraal", logo: "assets/logo-igraal-png.png" },
    { name: "Poulpeo", logo: "assets/logo-poulpeo.png" },
    { name: "Joko", logo: "assets/joko-logo.png" }
  ],
  bonsplans: [
    { name: "Ma Reduc", logo: "assets/ma-reduc-png.png" },
    { name: "Dealabs", logo: "assets/dealabs-logo-png.png" }
  ],
  css: [
    { name: "Redbrain", logo: "assets/redbrain-logo.png" },
    { name: "Velkashopping", logo: "assets/logo-velkashopping.jpg" }
  ],
  comparateurs: [
    { name: "Idealo", logo: "assets/logo-idealo.png" }
  ],
  retargeting: [
    { name: "Criteo", logo: "assets/logo-criteo.jpg" },
    { name: "Uzerly", logo: "assets/logo-uzerly.jpeg" }
  ],
  display: [
    { name: "Digidip", logo: "assets/logo-digidip.png" },
    { name: "Skimlinks", logo: "assets/logo-skimlinks.png" }
  ],
  content: [
    { name: "Reworld Media", logo: "assets/logo-reworld-media.png" },
    { name: "DCE", logo: "assets/digital_content_expert_logo.jpg" }
  ],
  emailing: [
    { name: "Emailing Networks", logo: "assets/emailing-networks-logo.jpg" }
  ],
  affinitaires: [
    { name: "FR Android", logo: "assets/frandroid-logo.png" },
    { name: "Les Bons Plans de Naïma", logo: "assets/bonsplans-naima-logo.jpg" }
  ],
  sea: [
    { name: "JVWEB", logo: "assets/logo-jvweb.png" },
    { name: "Ad's up", logo: "assets/adsup.png" }
  ],
  retention: [
    { name: "Beyable", logo: "assets/logo-beyable.png" }
  ]
};

// ----------------- AFFICHAGE ÉDITEURS -----------------
function afficherEditeurs(leviers) {
  const container = document.querySelector(".editor-grid");
  if (!container) return;
  container.innerHTML = "";

  let suggestions = [];
  leviers.forEach(l => {
    if (EDITORS[l]) {
      // On ajoute le levier comme champ supplémentaire
      suggestions = suggestions.concat(
        EDITORS[l].map(e => ({ ...e, levier: l }))
      );
    }
  });

  // Mélanger et limiter à 8 max
  suggestions = suggestions.sort(() => 0.5 - Math.random()).slice(0, 8);

  // Injecter dans le DOM
  suggestions.forEach(e => {
    const card = document.createElement("div");
    card.className = "editor-card";
    card.innerHTML = `
      <img src="${e.logo}" alt="${e.name}">
      <span>${e.levier.charAt(0).toUpperCase() + e.levier.slice(1)}</span>
    `;
    container.appendChild(card);
  });
}

// ----------------- Préparer données camembert (labels + values) -----------------
function chartDataFor(sectorKey, levers) {
  const sector = SECTORS[sectorKey] || SECTORS.other;
  let pdv = { ...sector.pdv };
  // if levers selected, filter to them (if some not present, keep them with small share)
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

// === Vérification des leviers hybrides avant simulation ===
function checkHybridWarning() {
  const hybridRadio = document.querySelector('input[name="hybrides"]:checked');
  const selectedLevers = Array.from(document.querySelectorAll('input[name="levers"]:checked')).map(el => el.value);
  const riskyLevers = ["affinitaires", "content", "influence", "emailing", "ppc"];
  const alertZone = document.getElementById("hybrid-alert");

  if (!alertZone) return;

  const hasRiskyLever = selectedLevers.some(l => riskyLevers.includes(l));
  const saidNoToHybrid = hybridRadio && hybridRadio.value === "non";

  if (hasRiskyLever && saidNoToHybrid) {
    alertZone.innerHTML = `
      ⚠️ <strong>Attention :</strong> Vous cochez des leviers qui nécessitent souvent des
      <strong>modèles hybrides (CPC, CPM ou fixes)</strong>.
      <br><br>
      ➜ Pour obtenir des volumes réalistes, pensez à autoriser une part de modèle fixe,
      ou attendez-vous à des projections plus limitées.
    `;
    alertZone.style.display = "block";
  } else {
    alertZone.style.display = "none";
  }
}
// Lance une vérification initiale au chargement
checkHybridWarning();

// ----------------- MAIN (DOM) -----------------
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-simu");
  if (!form) {
    console.warn("form-simu introuvable");
    return;
  }

  // Budget checkbox
  const unlimitedCheckbox = document.getElementById("unlimited-budget") || document.getElementById("noBudget");
  const budgetInput = form.elements["budget"];

  if (unlimitedCheckbox && budgetInput) {
    unlimitedCheckbox.addEventListener("change", () => {
      budgetInput.disabled = unlimitedCheckbox.checked;
      if (unlimitedCheckbox.checked) {
        budgetInput.value = "";
      }
    });
  }

  // ✅ Gestion de la case "J’autorise tous les leviers"
  const allLeversCheckbox = document.getElementById("allLevers");
  const leverCheckboxes = form.querySelectorAll('input[name="levers"]');

  if (allLeversCheckbox && leverCheckboxes.length > 0) {
    allLeversCheckbox.addEventListener("change", () => {
      leverCheckboxes.forEach(cb => {
        cb.checked = allLeversCheckbox.checked;
      });
    });

    leverCheckboxes.forEach(cb => {
      cb.addEventListener("change", () => {
        if (!cb.checked) {
          allLeversCheckbox.checked = false;
        }
      });
    });
  }
  
 // === Synchronisation curseur <-> champ numérique ===
const trafficRange = document.getElementById('trafficRange');
const trafficInput = document.getElementById('trafficInput');

if (trafficRange && trafficInput) {
  // formatteur FR (espaces entre les milliers)
  const format = (n) => new Intl.NumberFormat("fr-FR").format(n);

  // quand on bouge le curseur → met à jour la case
  trafficRange.addEventListener("input", (e) => {
    const val = parseInt(e.target.value, 10) || 0;
    trafficInput.value = val;
  });

  // quand on tape manuellement → met à jour le curseur
  trafficInput.addEventListener("input", (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) val = 0;
    if (val < 0) val = 0;
    if (val > 1000000) val = 1000000;
    trafficRange.value = val;
  });

  // initialisation
  trafficInput.value = parseInt(trafficRange.value, 10);
}

  // Vérifie à chaque changement de levier ou de choix "hybride"
form.querySelectorAll('input[name="levers"], input[name="hybrides"]').forEach(el => {
  el.addEventListener("change", checkHybridWarning);
});


// ✅ Début du submit handler (tout le calcul DOIT être dedans)
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();

    // --- Read inputs safely ---
    const trafficMonthly = numberOf(form.elements["traffic"]?.value);
    const aovUser = numberOf(form.elements["aov"]?.value);
    const cvrUserInput = numberOf(form.elements["cvr"]?.value) / 100;
    const cacClient = numberOf(form.elements["cac"]?.value);
    const sectorKey = form.elements["sector"]?.value || "other";

    // levers checked
    const levers = Array.from(form.querySelectorAll('input[name="levers"]:checked')).map(i => i.value);

    // budget handling (defensive)
    let budgetMonthly = 0;
    if (unlimitedCheckbox && unlimitedCheckbox.checked) budgetMonthly = Infinity;
    else budgetMonthly = numberOf(form.elements["budget"]?.value) || 0;
    const budgetAnnual = (budgetMonthly === Infinity) ? Infinity : budgetMonthly * 12;

    // --- Base values & adjustments ---
    const sector = SECTORS[sectorKey] || SECTORS.other;
    const baseAov = (aovUser > 0) ? aovUser : sector.aov;
    const baseCvr = (cvrUserInput > 0) ? cvrUserInput : sector.cvr;

   let adjustedAov = adjustAOV(baseAov, levers);
   let adjustedCvr = adjustCVR(baseCvr, levers);

    // ✅ Détection du choix sur les hybrides
const hybridChoice = form.querySelector('input[name="hybrides"]:checked')?.value || "non";
const saidNoToHybrid = hybridChoice === "non";
const hybridLevers = ["affinitaires", "influence", "emailing", "content", "ppc"];

// ⚠️ Si refus des modèles hybrides + leviers hybrides cochés → baisse automatique
if (saidNoToHybrid && levers.some(l => hybridLevers.includes(l))) {
  console.log("⚠️ Refus des modèles hybrides — ajustement automatique des performances");
  adjustedCvr *= 0.7; // -30% sur le taux de conversion
  adjustedAov *= 0.9; // -10% sur le panier moyen
}

    // annualized affiliated traffic (visits) using agreed conservative rules
    const affiliatedTrafficYear = annualAffiliatedTraffic(trafficMonthly);

    // potential orders before budget cap
    const potentialOrders = affiliatedTrafficYear * adjustedCvr;

    // projected CAC (weighted by PDV / fallback to client cac)
    const cacProjected = projectedCAC(sectorKey, levers, cacClient || 0);

    // cap by budget (if budget provided)
    const maxOrdersByBudget = (budgetAnnual === Infinity || cacProjected === 0) ? potentialOrders : (budgetAnnual / cacProjected);
    const finalOrders = Math.min(potentialOrders, maxOrdersByBudget);

    // revenue
    const revenue = finalOrders * adjustedAov;

    // computed budget consumed (prefer showing budgetAnnual or theoretical)
    const budgetConsumed = (budgetAnnual === Infinity) ? finalOrders * cacProjected : Math.min(budgetAnnual, finalOrders * cacProjected);

    // ROI (revenue / budgetConsumed) guard
    const roi = (budgetConsumed > 0) ? (revenue / budgetConsumed) : (budgetAnnual === Infinity ? (revenue / (finalOrders * cacClient || 1)) : 0);

   // --- Display results (safe DOM queries) ---
const results = document.getElementById("results");
const formContainer = document.querySelector(".right-column"); // container du formulaire

// Cacher le formulaire
if (formContainer) formContainer.style.display = "none";

// Afficher les résultats
if (results) results.style.display = "block";

// ✅ Ajout UX : active la classe show-results pour la mise en page CSS
const splitLayout = document.querySelector(".split-layout");
if (splitLayout) splitLayout.classList.add("show-results");

// Récupération des éléments à mettre à jour
const elRevenue = document.getElementById("kpi-revenue");
const elOrders = document.getElementById("kpi-orders");
const elBudget = document.getElementById("kpi-budget");
const elAov = document.getElementById("kpi-aov");
const elCac = document.getElementById("kpi-cac");
const elRoi = document.getElementById("kpi-roi");
const insightsBox = document.getElementById("insights");

    if (elRevenue) elRevenue.textContent = fmtCurrency(revenue);
    if (elOrders) elOrders.textContent = fmtNumber(finalOrders);
    if (elBudget) elBudget.textContent = (budgetAnnual === Infinity) ? "Illimité" : fmtCurrency(budgetAnnual);
    if (elAov) elAov.textContent = fmtCurrency(adjustedAov);
    if (elCac) elCac.textContent = fmtCurrency(cacProjected);
    if (elRoi) elRoi.textContent = (roi > 0 ? roi.toFixed(2) + "x" : "—");

    // analysis: only AOV vs sector as requested + one-line CR mention + budget cap note
    const analysis = [];
    if (sectorKey !== "other") {
      if (adjustedAov > sector.aov * 1.1) analysis.push(`Votre panier moyen estimé (${fmtCurrency(adjustedAov)}) est supérieur à la moyenne du secteur.`);
      else if (adjustedAov < sector.aov * 0.9) analysis.push(`Votre panier moyen estimé (${fmtCurrency(adjustedAov)}) est inférieur à la moyenne du secteur.`);
      else analysis.push(`Votre panier moyen estimé (${fmtCurrency(adjustedAov)}) est proche de la moyenne du secteur.`);
    }
    analysis.push(`Taux de conversion simulé : ${(adjustedCvr * 100).toFixed(2)}% (montée en puissance sur l'année 1).`);
    if (budgetAnnual !== Infinity) analysis.push(`Note : votre budget annuel saisi (${fmtCurrency(budgetAnnual)}) peut limiter le volume de ventes affiché.`);

    if (insightsBox) insightsBox.innerHTML = `<h3>Analyse rapide</h3><ul>${analysis.map(t=>`<li>${t}</li>`).join("")}</ul>`;

    // --- Chart (doughnut) : build from sector PDV filtered by levers ---
    const canvas = document.getElementById("chart-levers");
    if (canvas && window.Chart) {
      const { labels, data } = chartDataFor(sectorKey, levers);
      // convert data to percentages for display plugin
      const dataPct = data.map(v => +(v*100).toFixed(2));

      if (window.salesChart) window.salesChart.destroy();
      window.salesChart = new Chart(canvas.getContext("2d"), {
        type: "doughnut",
        data: {
          labels: labels.map(l => l.replace(/-/g, " ")),
          datasets: [{
            data: dataPct,
            backgroundColor: [
              "#3b82f6","#f97316","#22c55e","#eab308","#ef4444","#8b5cf6","#06b6d4","#f43f5e","#10b981","#a855f7","#64748b","#f59e0b"
            ]
          }]
        },
        options: {
          responsive: true,
          cutout: "55%",
          plugins: {
            legend: { position: "right", labels: { boxWidth: 14, font: { size: 12 } } },
            tooltip: {
              callbacks: {
                label: function(ctx){
                  const v = ctx.parsed || 0;
                  return `${ctx.label}: ${v}%`;
                }
              }
            },
            datalabels: {
              display: false // hide labels on chart to avoid clutter; tooltip shows %
            }
          }
        },
        plugins: (window.ChartDataLabels ? [ChartDataLabels] : [])
      });
    }

    // CTA (single, short)
    const ctaWrap = document.getElementById("cta-link");
    if (ctaWrap) {
      ctaWrap.innerHTML = `<a class="cta" href="https://www.lumigency.com/consultation-gratuite">🚀 Prenez RDV gratuit</a>`;
      ctaWrap.style.display = "block";
    }

    // --- Editors suggestions ---
afficherEditeurs(levers);

    console.log("Simulation — trafic:", trafficMonthly, "orders:", finalOrders, "rev:", revenue, "cacProj:", cacProjected, "budgetAnnuel:", budgetAnnual);
  });
});

// === Slider Témoignages ===
document.addEventListener("DOMContentLoaded", () => {
  const slider = document.getElementById('slider');
  const slides = document.querySelectorAll('.review');
  if (!slider || slides.length === 0) return;

  let index = 0;

  function slideTestimonials() {
    index = (index + 1) % slides.length;
    slider.style.transform = `translateX(-${index * 33.33}%)`;
  }

  setInterval(slideTestimonials, 4000);
});

// === Bouton "Faire une nouvelle simulation" ===
const restartBtn = document.getElementById("restart-btn");
if (restartBtn) {
  restartBtn.addEventListener("click", () => {
    // Cache la section résultats
    const results = document.getElementById("results");
    if (results) results.style.display = "none";

    // Réaffiche le formulaire
    const formContainer = document.querySelector(".right-column");
    if (formContainer) formContainer.style.display = "block";

    // Retire la classe show-results pour réinitialiser la mise en page
    const splitLayout = document.querySelector(".split-layout");
    if (splitLayout) splitLayout.classList.remove("show-results");

    // 🔁 Réinitialise le formulaire et la progression
    const form = document.getElementById("form-simu");
    if (form) form.reset();

    // 🔁 Revient à la toute première étape
    currentStep = 0;
    showStep(currentStep);

    // 🔁 Réinitialise la barre de progression
    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");
    if (progressBar && progressText) {
      progressBar.style.width = "0%";
      progressText.textContent = "0%";
    }

    // Retourne en haut de page
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}


function updateProgress(percent) {
  const bar = document.getElementById('progress-bar');
  const text = document.getElementById('progress-text');
  
  bar.style.width = percent + '%';
  text.textContent = percent + '%';
}















