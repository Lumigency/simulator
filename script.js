// ========== script.js — Simulateur Lumigency (version complète) ==========

console.log("✅ script.js chargé");

// === Gestion du formulaire multi-étapes ===
const steps = document.querySelectorAll('.form-step');
let currentStep = 0;
// TEMP CSS work: start on Step 3 directly
currentStep = 2;
const FORCE_STEP4_PREVIEW = true;

// ✅ message de maturité personnalisé
let maturityMessage = "";

function showStep(index) {
  steps.forEach((step, i) => step.classList.toggle('active', i === index));
  updateProgress(index);
  syncLeftAsideForStep(index);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function syncLeftAsideForStep(stepIndex) {
  const defaultAside = document.getElementById("leftAsideDefault");
  const step2Aside = document.getElementById("leftAsideStep2");
  const step3Aside = document.getElementById("leftAsideStep3");
  if (!defaultAside || !step2Aside || !step3Aside) return;
  const safeStep = Number(stepIndex) || 0;
  const isStep2 = safeStep === 1;
  const isStep3 = safeStep === 2;
  defaultAside.hidden = isStep2 || isStep3;
  step2Aside.hidden = !isStep2;
  step3Aside.hidden = !isStep3;
}

// ----------------- HELPERS -----------------
function numberOf(v){ const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? 0 : n; }
function fmtCurrency(n){ return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n); }
function fmtNumber(n){ return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n)); }
function clamp(value, min, max){ return Math.min(max, Math.max(min, value)); }
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
  beauty: {
  label: "Beauté & Cosmétique", aov: 72, cvr: 0.0168,
    pdv: normalize({ cashback: 0.22, bonsplans: 0.17, influence: 0.18, affinitaires: 0.15, comparateurs: 0.10, "display-networks": 0.08, emailing: 0.05,content: 0.05 })
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
    { name: "Delupe", logo: "assets/delupe-logo.png" },
    { name: "Shopforward", logo: "assets/shopforward-logos.png" },
    { name: "Velkashopping", logo: "assets/logo-velkashopping.jpg" }
  ],
  comparateurs: [
    { name: "Idealo", logo: "assets/logo-idealo.png" },
    { name: "Kelkoo", logo: "assets/kelkoo-logo.png" },
    { name: "Le parisien", logo: "assets/leparisien-logo.png" }
    
  ],
  retargeting: [
    { name: "Criteo", logo: "assets/logo-criteo.jpg" },
    { name: "Uzerly", logo: "assets/logo-uzerly.jpeg" }
  ],
  display: [
    { name: "Sirdata", logo: "assets/logo-sirdata.png" },
    { name: "Digidip", logo: "assets/logo-digidip.png" },
    { name: "Skimlinks", logo: "assets/logo-skimlinks.png" }
  ],
  content: [
    { name: "Reworld Media", logo: "assets/logo-reworld-media.png" },
     { name: "Ouest France", logo: "assets/ouest-france-logo.png" },
     { name: "Keleops", logo: "assets/keleops-logo.png" },
    { name: "DCE", logo: "assets/digital_content_expert_logo.jpg" }
  ],
  emailing: [
    { name: "Emailing Networks", logo: "assets/emailing-networks-logo.jpg" },
      { name: "Power-space", logo: "assets/power-space-logo.png" },
      { name: "Welcoming", logo: "assets/welcoming_logos.png" }
  ],
  sea: [
    { name: "JVWEB", logo: "assets/logo-jvweb.png" },
    { name: "Google", logo: "assets/logo-google.png" },
    { name: "Ad's up", logo: "assets/adsup.png" }
  ],
  retention: [
    { name: "Beyable", logo: "assets/logo-beyable.png" },
     { name: "Sale-cycle", logo: "assets/sale-cycle-logo.png" }
  ]
};

// ----------------- MAPPING AFFINITAIRE PAR SECTEUR -----------------
const EDITORS_AFFINITAIRE = {
  // 👗 MODE
  fashion: [
    { name: "Grazia", logo: "assets/grazia-logo.png" },
    { name: "Marie Claire", logo: "assets/marie-claire-logo.png" },
    { name: "Stylight", logo: "assets/sytlight-logo.png" },
    { name: "Unidays", logo: "assets/unidays-logo.png" }
  ],
  
// 💅 BEAUTÉ, SANTÉ & HYGIÈNE
  beauty: [
  { name: "Grazia", logo: "assets/grazia-logo.png" },
    { name: "Marie Claire", logo: "assets/marie-claire-logo.png" },
     { name: "Beauté-test", logo: "assets/beauté-test-logo.png" },
    { name: "Stylight", logo: "assets/sytlight-logo.png" }
  ],

  // 🎭 PRODUITS CULTURELS & LOISIRS
  culture: [
    { name: "Konbini", logo: "assets/konbini-logo.png" },
    { name: "Ouest France", logo: "assets/ouest-france-logo.png" },
    { name: "Topito", logo: "assets/topito-logo.png" },
    { name: "Geo", logo: "assets/geo-logo.png" }
  ],

  // 💻 HIGH-TECH & ÉLECTROMÉNAGER
  electronics: [
    { name: "Les Numériques", logo: "assets/lesnumeriques-logo.png" },
    { name: "Journal du Geek", logo: "assets/journaldugeek-logo.png" },
    { name: "01.net", logo: "assets//01net.logo.png" },
    { name: "FrAndroid", logo: "assets/frandroid-logo.png" }
  ],

  // 🏡 MAISON & DÉCORATION
  home: [
    { name: "Maison Travaux", logo: "assets/maisontavaux-logo.png" },
    { name: "Modesettravaux", logo: "assets/modesettravaux-logo.png" },
    { name: "Maison Travaux", logo: "assets/maisontavaux-logo.png" },
    { name: "Listy", logo: "assets/listy-logo_0.png" },
    { name: "Potoroze", logo: "assets/potoroze-logo.png" }
  ],

  // 🥗 ALIMENTATION & DRIVE
  food: [
    { name: "Marmiton", logo: "assets/marmiton-logo.png" },
    { name: "Cuisine Actuelle", logo: "assets/cuisineactuelle-logo.png" },
    { name: "Marie Claire", logo: "assets/marie-claire-logo.png" }
  ],

  // 🏋️ SPORT
  sports: [
    { name: "Top Santé", logo: "assets/topsante-logo.jpg" },
    { name: "Daily-sport", logo: "assets/daily-sport-fr-logo.jpeg" },
    { name: "Sportfr", logo: "assets/sportfr-logo.png" }
  ],

  // ✈️ VOYAGE & TOURISME
  travel: [
    { name: "Lonely Planet", logo: "assets/lonelyplanet-logo.png" },
    { name: "Geo", logo: "assets/geo-logo.png" },
    { name: "Globe-trotting", logo: "assets/globe-trotting_logos.png" }
  ],

  // 💎 LUXE & BIJOUX
  luxury: [
    { name: "Marie Claire", logo: "assets/marie-claire-logo.png" },
    { name: "Grazia", logo: "assets/grazia-logo.png" },
    { name: "Stylight", logo: "assets/stylight-logo.png" }
  ],

  // 🚗 PIÈCES AUTOMOBILES
  auto: [
    { name: "Auto Moto", logo: "assets/automoto-logo.png" },
    { name: "Leblog-auto", logo: "assets/leblog-auto-logo.png" },
    { name: "Actu-automobile", logo: "assets/actu-automobile-logo.png" }
  ],

  // 🧸 JEUX & JOUETS
  games: [
    { name: "Konbini", logo: "assets/konbini-logo.png" },
     { name: "Listy", logo: "assets/listy-logo_0.png" }
  ],

  // 🌿 MAISON & JARDIN
  garden: [
    { name: "Maison Travaux", logo: "assets/maisontravaux-logo.png" },
    { name: "Monjardin-ma-maison", logo: "assets/monjardin-ma-maison-logo.png" },
    { name: "Modesettravaux", logo: "assets/modesettravaux-logo.png" }
  ],

  // 📱 TÉLÉCOM
  telecom: [
    { name: "Les Numériques", logo: "assets/lesnumeriques-logo.png" },
    { name: "Presse-citron", logo: "assets/presse-citron-logo.jpeg" },
    { name: "Clubic", logo: "assets/logo-clubic.jpeg" },
    { name: "FrAndroid", logo: "assets/frandroid-logo.png" }
  ],

  // 🌀 AUTRE (fallback)
  other: [
    { name: "Konbini", logo: "assets/konbini-logo.png" },
     { name: "Taboola", logo: "assets/taboola-logo.png" }
  ],
};

// ----------------- AFFICHAGE ÉDITEURS (priorité affinitaires + limite à 6) -----------------
function afficherEditeurs(leviers, sectorKey) {
  const container = document.querySelector(".editor-grid");
  if (!container) return;
  container.innerHTML = "";

  let suggestions = [];

  // 🔹 Étape 1 — Ajouter en priorité les affinitaires du secteur
  let affinitaires = [];
  if (sectorKey) {
    affinitaires = EDITORS_AFFINITAIRE[sectorKey] || EDITORS_AFFINITAIRE.other;
    affinitaires = affinitaires.map(e => ({ ...e, levier: "Affinitaires" }));
  }

  // 🔹 Étape 2 — Ajouter les éditeurs liés aux leviers cochés
  let autres = [];
  leviers.forEach(l => {
    if (EDITORS[l]) {
      autres = autres.concat(
        EDITORS[l].map(e => ({ ...e, levier: l }))
      );
    }
  });

  // 🔹 Étape 3 — Fusionner : affinitaires en premier, puis compléter avec autres
  const shuffledOthers = autres.sort(() => 0.5 - Math.random());
  suggestions = [...affinitaires, ...shuffledOthers].slice(0, 8); // max 8

  // 🔹 Étape 4 — Injecter dans le DOM
  suggestions.forEach(e => {
    const card = document.createElement("div");
    card.className = "editor-card";
    card.innerHTML = `
      <img src="${e.logo}" alt="${e.name}">
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

// Initialisation
showStep(currentStep);
// ✅ Forcer l'étape visuelle à 3 au tout démarrage
updateProgress(2);

if (FORCE_STEP4_PREVIEW) {
  const results = document.getElementById("results");
  const formContainer = document.querySelector(".right-column");
  const splitLayout = document.querySelector(".split-layout");
  if (formContainer) formContainer.style.display = "none";
  if (results) results.style.display = "block";
  if (splitLayout) splitLayout.classList.add("show-results");
}

  // Navigation entre les étapes
document.getElementById('next-step-1')?.addEventListener('click', () => {
  const objectifGroup = document.getElementById('objectif-group');
  const objectifValue = form.elements["objectif"]?.value;
  if (!objectifValue) {
    objectifGroup?.classList.add('is-invalid');
    setTimeout(() => objectifGroup?.classList.remove('is-invalid'), 1200);
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

  // Budget checkbox
  const unlimitedCheckbox = document.getElementById("unlimited-budget") || document.getElementById("noBudget");
  const budgetInput = form.elements["budget"];

  if (unlimitedCheckbox && budgetInput) {
    unlimitedCheckbox.addEventListener("change", () => {
      budgetInput.disabled = unlimitedCheckbox.checked;
      if (unlimitedCheckbox.checked) {
        budgetInput.value = "";
      }
      updateStep2AsidePreview();
    });
  }

  const asideStep2RoiValue = document.getElementById("asideStep2RoiValue");
  const asideStep2CacValue = document.getElementById("asideStep2CacValue");
  const asideStep2CacNote = document.getElementById("asideStep2CacNote");
  const asideStep2RoiBar = document.getElementById("asideStep2RoiBar");
  const asideStep2CacBar = document.getElementById("asideStep2CacBar");
  const asideStep2Point1 = document.getElementById("asideStep2Point1");
  const asideStep2Point2 = document.getElementById("asideStep2Point2");
  const asideStep2Point3 = document.getElementById("asideStep2Point3");

  const updateStep2AsidePreview = () => {
    if (!asideStep2RoiValue || !asideStep2CacValue || !asideStep2CacNote || !asideStep2RoiBar || !asideStep2CacBar) return;

    const trafficMonthly = numberOf(form.elements["traffic"]?.value);
    const aovUser = numberOf(form.elements["aov"]?.value);
    const cvrUserInput = numberOf(form.elements["cvr"]?.value) / 100;
    const cacClient = numberOf(form.elements["cac"]?.value);
    const budgetMonthly = numberOf(form.elements["budget"]?.value);
    const budgetAnnual = budgetMonthly > 0 ? budgetMonthly * 12 : 0;
    const sectorKey = form.elements["sector"]?.value || "other";
    const levers = Array.from(form.querySelectorAll('input[name="levers"]:checked')).map((input) => input.value);
    const sector = SECTORS[sectorKey] || SECTORS.other;

    const computeScenarioRoi = ({ baseAov, baseCvr, cac }) => {
      const yearlyTraffic = annualAffiliatedTraffic(trafficMonthly);
      const potentialOrders = yearlyTraffic * baseCvr;
      const maxOrdersByBudget = (budgetAnnual > 0 && cac > 0) ? (budgetAnnual / cac) : potentialOrders;
      const finalOrders = Math.min(potentialOrders, maxOrdersByBudget);
      const revenue = finalOrders * baseAov;
      const theoreticalCost = finalOrders * cac;
      const consumedBudget = budgetAnnual > 0 ? Math.min(budgetAnnual, theoreticalCost) : theoreticalCost;
      return consumedBudget > 0 ? revenue / consumedBudget : 0;
    };

    let adjustedAov = adjustAOV(aovUser > 0 ? aovUser : sector.aov, levers);
    let adjustedCvr = adjustCVR(cvrUserInput > 0 ? cvrUserInput : sector.cvr, levers);
    const hybridChoice = form.querySelector('input[name="hybrides"]:checked')?.value || "non";
    const hybridLevers = ["affinitaires", "influence", "emailing", "content", "ppc"];
    if (hybridChoice === "non" && levers.some((lever) => hybridLevers.includes(lever))) {
      adjustedAov *= 0.9;
      adjustedCvr *= 0.7;
    }

    const projectedUserCac = projectedCAC(sectorKey, levers, cacClient || 0);
    const referenceCac = projectedCAC(sectorKey, [], 0);

    const roiCurrent = computeScenarioRoi({
      baseAov: adjustedAov,
      baseCvr: adjustedCvr,
      cac: projectedUserCac
    });

    const roiReference = computeScenarioRoi({
      baseAov: sector.aov,
      baseCvr: sector.cvr,
      cac: referenceCac
    });

    const roiDelta = roiCurrent - roiReference;
    const comparedCac = cacClient > 0 ? cacClient : projectedUserCac;
    const cacDeltaPct = referenceCac > 0 ? ((referenceCac - comparedCac) / referenceCac) * 100 : 0;

    asideStep2RoiValue.textContent = `${roiDelta >= 0 ? "+" : ""}${roiDelta.toFixed(2)}`;
    asideStep2CacValue.textContent = `${Math.abs(Math.round(cacDeltaPct))}%`;
    asideStep2CacNote.textContent = cacDeltaPct >= 0
      ? "En dessous de la moyenne secteur"
      : "Au-dessus de la moyenne secteur";

    const roiBarWidth = clamp((roiDelta + 5) / 10, 0, 1) * 100;
    const cacBarWidth = clamp(Math.abs(cacDeltaPct) / 35, 0, 1) * 100;
    asideStep2RoiBar.style.width = `${Math.max(6, roiBarWidth)}%`;
    asideStep2CacBar.style.width = `${Math.max(6, cacBarWidth)}%`;

    if (asideStep2Point1) {
      asideStep2Point1.textContent = roiDelta >= 0
        ? "Potentiel de croissance intéressant en affiliation"
        : "Le potentiel peut progresser avec un mix mieux priorisé";
    }
    if (asideStep2Point2) {
      asideStep2Point2.textContent = cacDeltaPct >= 0
        ? "Mix optimisé par rapport au budget disponible"
        : "Le CAC peut être réduit en rééquilibrant les leviers";
    }
    if (asideStep2Point3) {
      asideStep2Point3.textContent = levers.length >= 3
        ? "Vos partenaires potentiels sont disponibles et qualifiés"
        : "Ajoutez des leviers pour élargir vos opportunités partenaires";
    }
  };

  // ✅ Gestion de la case "J’autorise tous les leviers"
  const allLeversCheckbox = document.getElementById("allLevers");
  const leverCheckboxes = form.querySelectorAll('input[name="levers"]');

  if (allLeversCheckbox && leverCheckboxes.length > 0) {
    allLeversCheckbox.addEventListener("change", () => {
      leverCheckboxes.forEach(cb => {
        cb.checked = allLeversCheckbox.checked;
      });
      updateStep2AsidePreview();
    });

    leverCheckboxes.forEach(cb => {
      cb.addEventListener("change", () => {
        if (!cb.checked) {
          allLeversCheckbox.checked = false;
        }
        updateStep2AsidePreview();
      });
    });
  }
  
 // === STEP 2 V2: Traffic slider + budget bands + leviers dropdown ===
const trafficRange = document.getElementById("trafficRange");
const trafficInput = document.getElementById("trafficInput");
const trafficRangeV2 = document.getElementById("trafficRangeV2");
const trafficValueDisplay = document.getElementById("trafficValueDisplay");

if (trafficRange && trafficInput && trafficRangeV2) {
  const fmtTraffic = (value) => new Intl.NumberFormat("fr-FR").format(value);

  const syncTraffic = () => {
    let val = Number(trafficRangeV2.value || 0);
    if (!Number.isFinite(val)) val = 0;
    val = Math.min(1000000, Math.max(0, val));
    trafficInput.value = val;
    trafficRange.value = val;
    if (trafficValueDisplay) trafficValueDisplay.textContent = fmtTraffic(val);
    updateStep2AsidePreview();
  };

  trafficRangeV2.addEventListener("input", syncTraffic);
  syncTraffic();
}

const budgetBandRadios = form.querySelectorAll('input[name="budget_band"]');
if (budgetBandRadios.length && budgetInput) {
  const syncBudgetFromBand = (radio) => {
    let mappedBudget = Number(radio.dataset.budget || 0);
    if (!Number.isFinite(mappedBudget)) mappedBudget = 0;
    budgetInput.value = mappedBudget;
    updateStep2AsidePreview();
  };

  budgetBandRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      syncBudgetFromBand(radio);
    });
  });

  const checkedBudgetBand = form.querySelector('input[name="budget_band"]:checked');
  if (checkedBudgetBand) {
    syncBudgetFromBand(checkedBudgetBand);
  }
}

const leverSelectTrigger = document.getElementById("leverSelectTrigger");
const leverSelectMenu = document.getElementById("leverSelectMenu");
const leverSelectValue = document.getElementById("leverSelectValue");
if (leverSelectTrigger && leverSelectMenu && leverSelectValue) {
  const leverInputs = leverSelectMenu.querySelectorAll('input[name="levers"]');
  const leverPlaceholder = leverSelectValue.dataset.placeholder || "Sélectionnez un ou plusieurs leviers";

  // Old label renderer kept for reference:
  // const refreshLeverLabel = () => {
  //   const selected = Array.from(leverInputs).filter((input) => input.checked).length;
  //   leverSelectTrigger.textContent = selected
  //     ? `${selected} levier${selected > 1 ? "s" : ""} sélectionné${selected > 1 ? "s" : ""}`
  //     : "Sélectionnez un ou plusieurs leviers";
  // };

  // Old tags renderer kept for reference:
  // const refreshLeverTags = () => {
  //   const selectedInputs = Array.from(leverInputs).filter((input) => input.checked);
  //   leverSelectValue.innerHTML = "";
  //   if (!selectedInputs.length) {
  //     leverSelectValue.classList.add("is-placeholder");
  //     leverSelectValue.textContent = leverPlaceholder;
  //     return;
  //   }
  //   leverSelectValue.classList.remove("is-placeholder");
  //   selectedInputs.forEach((input) => {
  //     const tag = document.createElement("span");
  //     tag.className = "lever-tag";
  //     tag.dataset.value = input.value;
  //     const remove = document.createElement("span");
  //     remove.className = "lever-tag-remove";
  //     remove.textContent = "×";
  //     const labelText = document.createElement("span");
  //     labelText.textContent = input.parentElement?.textContent?.trim() || input.value;
  //     tag.appendChild(remove);
  //     tag.appendChild(labelText);
  //     leverSelectValue.appendChild(tag);
  //   });
  // };

  const refreshLeverLabel = () => {
    const selectedInputs = Array.from(leverInputs).filter((input) => input.checked);

    // Old neutral-placeholder behavior kept for reference:
    // leverSelectValue.classList.add("is-placeholder");
    // leverSelectValue.textContent = leverPlaceholder;

    leverSelectValue.innerHTML = "";

    if (!selectedInputs.length) {
      leverSelectValue.classList.add("is-placeholder");
      leverSelectValue.textContent = leverPlaceholder;
      return;
    }

    leverSelectValue.classList.remove("is-placeholder");

    selectedInputs.forEach((input) => {
      const tag = document.createElement("span");
      tag.className = "lever-tag";
      tag.dataset.value = input.value;

      const remove = document.createElement("span");
      remove.className = "lever-tag-remove";
      const removeIcon = document.createElement("img");
      removeIcon.className = "lever-tag-remove-icon";
      removeIcon.src = "assets/svg/icon-x-circle.svg";
      removeIcon.alt = "";
      remove.setAttribute("aria-label", "Retirer ce levier");
      remove.appendChild(removeIcon);

      const labelText = document.createElement("span");
      labelText.textContent = input.parentElement?.textContent?.trim() || input.value;

      tag.appendChild(remove);
      tag.appendChild(labelText);
      leverSelectValue.appendChild(tag);
    });
  };

  leverSelectTrigger.addEventListener("click", () => {
    leverSelectMenu.hidden = !leverSelectMenu.hidden;
    leverSelectTrigger.classList.toggle("is-open", !leverSelectMenu.hidden);
  });

  leverInputs.forEach((input) => {
    input.addEventListener("change", () => {
      refreshLeverLabel();
      updateStep2AsidePreview();
    });
  });

  leverSelectValue.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const remove = target.closest(".lever-tag-remove");
    if (!remove) return;

    event.preventDefault();
    event.stopPropagation();

    const tag = remove.closest(".lever-tag");
    const value = tag?.getAttribute("data-value");
    if (!value) return;

    const input = leverSelectMenu.querySelector(`input[name="levers"][value="${value}"]`);
    if (input instanceof HTMLInputElement) {
      input.checked = false;
      refreshLeverLabel();
      checkHybridWarning();
      updateStep2AsidePreview();
    }
  });

  document.addEventListener("click", (event) => {
    if (leverSelectMenu.hidden) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (!leverSelectMenu.contains(target) && !leverSelectTrigger.contains(target)) {
      leverSelectMenu.hidden = true;
      leverSelectTrigger.classList.remove("is-open");
    }
  });

  refreshLeverLabel();
  updateStep2AsidePreview();
}

// === STEP 3 V2: sector dropdown + submit enable state ===
const sectorSelectTrigger = document.getElementById("sectorSelectTrigger");
const sectorSelectMenu = document.getElementById("sectorSelectMenu");
const sectorSelectValue = document.getElementById("sectorSelectValue");
const hiddenSector = form.elements["sector"];
const step3Submit = document.getElementById("step3Submit");
const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");

const refreshStep3SubmitState = () => {
  if (!step3Submit || !fullNameInput || !emailInput) return;
  const ready = Boolean(
    String(fullNameInput.value || "").trim() &&
    emailInput.checkValidity() &&
    String(hiddenSector?.value || "").trim()
  );
  step3Submit.disabled = !ready;
  step3Submit.classList.toggle("is-ready", ready);
};

if (sectorSelectTrigger && sectorSelectMenu && sectorSelectValue && hiddenSector) {
  const sectorItems = sectorSelectMenu.querySelectorAll("button[data-value]");

  sectorSelectTrigger.addEventListener("click", () => {
    sectorSelectMenu.hidden = !sectorSelectMenu.hidden;
    sectorSelectTrigger.classList.toggle("is-open", !sectorSelectMenu.hidden);
  });

  sectorItems.forEach((item) => {
    item.addEventListener("click", () => {
      const value = item.getAttribute("data-value") || "";
      hiddenSector.value = value;
      sectorSelectValue.textContent = item.textContent || "Sélectionnez votre secteur d’activité";
      sectorSelectMenu.hidden = true;
      sectorSelectTrigger.classList.remove("is-open");
      refreshStep3SubmitState();
      updateStep2AsidePreview();
    });
  });

  document.addEventListener("click", (event) => {
    if (sectorSelectMenu.hidden) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (!sectorSelectMenu.contains(target) && !sectorSelectTrigger.contains(target)) {
      sectorSelectMenu.hidden = true;
      sectorSelectTrigger.classList.remove("is-open");
    }
  });
}

fullNameInput?.addEventListener("input", refreshStep3SubmitState);
emailInput?.addEventListener("input", refreshStep3SubmitState);
refreshStep3SubmitState();

// Old Step 2 V2 KPI inputs logic kept for reference:
// const aovInputV2 = document.getElementById("aovInputV2");
// const cvrInputV2 = document.getElementById("cvrInputV2");
// const cacInputV2 = document.getElementById("cacInputV2");
// ...

// === STEP 2 V2: Editable KPI values + draggable CVR gauge ===
const aovValueDisplay = document.getElementById("aovValueDisplay");
const cvrValueDisplay = document.getElementById("cvrValueDisplay");
const cacValueDisplay = document.getElementById("cacValueDisplay");
const hiddenAov = form.elements["aov"];
const hiddenCvr = form.elements["cvr"];
const hiddenCac = form.elements["cac"];

const sanitizeEditableNumericText = (text) => {
  const base = String(text || "").replace(",", ".").replace(/[^\d.]/g, "");
  const firstDotIndex = base.indexOf(".");
  if (firstDotIndex === -1) return base;
  return `${base.slice(0, firstDotIndex + 1)}${base.slice(firstDotIndex + 1).replace(/\./g, "")}`;
};

const parseEditableNumber = (text) => {
  const cleaned = sanitizeEditableNumericText(text);
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const bindEditableCurrency = (editableEl, hiddenField) => {
  if (!editableEl || !hiddenField) return;

  const syncFromEditable = () => {
    const value = parseEditableNumber(editableEl.textContent);
    hiddenField.value = String(value);
    return value;
  };

  const formatEditable = () => {
    const value = syncFromEditable();
    editableEl.textContent = value.toFixed(2);
  };

  editableEl.addEventListener("beforeinput", (event) => {
    if (event.inputType !== "insertText") return;
    const insertedText = String(event.data || "");
    if (!/^[\d.,]+$/.test(insertedText)) event.preventDefault();
  });

  editableEl.addEventListener("input", () => {
    const sanitizedText = sanitizeEditableNumericText(editableEl.textContent);
    if (String(editableEl.textContent || "") !== sanitizedText) {
      editableEl.textContent = sanitizedText;
    }
    syncFromEditable();
  });

  editableEl.addEventListener("paste", (event) => {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData("text") || "";
    const sanitizedText = sanitizeEditableNumericText(pastedText);
    const inserted = document.execCommand && document.execCommand("insertText", false, sanitizedText);
    if (!inserted) {
      editableEl.textContent = sanitizeEditableNumericText(editableEl.textContent + sanitizedText);
    }
    syncFromEditable();
  });

  editableEl.addEventListener("drop", (event) => {
    event.preventDefault();
  });

  editableEl.addEventListener("blur", formatEditable);
  editableEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      editableEl.blur();
    }
  });

  formatEditable();
};

bindEditableCurrency(aovValueDisplay, hiddenAov);
bindEditableCurrency(cacValueDisplay, hiddenCac);
aovValueDisplay?.addEventListener("input", updateStep2AsidePreview);
aovValueDisplay?.addEventListener("blur", updateStep2AsidePreview);
cacValueDisplay?.addEventListener("input", updateStep2AsidePreview);
cacValueDisplay?.addEventListener("blur", updateStep2AsidePreview);

const cvrGauge = document.getElementById("cvrGauge");
const cvrGaugePath = document.getElementById("cvrGaugeProgress");
const cvrGaugeDot = document.getElementById("cvrGaugeDot");

if (cvrGauge && cvrGaugePath && cvrGaugeDot && hiddenCvr && cvrValueDisplay) {
  const min = Number(cvrGauge.dataset.min || 0);
  const max = Number(cvrGauge.dataset.max || 20);
  const visualLowStart = 0.12;
  const lowValueThreshold = 4;
  const lowThresholdRatio = clamp((lowValueThreshold - min) / (max - min || 1), 0, 1);
  const pathLength = cvrGaugePath.getTotalLength();
  cvrGaugePath.style.strokeDasharray = `${pathLength} ${pathLength}`;

  const toVisualRatio = (value) => {
    const normalized = clamp((value - min) / (max - min || 1), 0, 1);
    if (normalized <= lowThresholdRatio && lowThresholdRatio > visualLowStart) {
      const t = normalized / lowThresholdRatio;
      return visualLowStart + t * (lowThresholdRatio - visualLowStart);
    }
    return normalized;
  };

  const fromVisualRatio = (ratio) => {
    const safeRatio = clamp(ratio, 0, 1);
    let normalized = safeRatio;

    if (safeRatio <= visualLowStart) normalized = 0;
    else if (safeRatio <= lowThresholdRatio && lowThresholdRatio > visualLowStart) {
      const t = (safeRatio - visualLowStart) / (lowThresholdRatio - visualLowStart);
      normalized = t * lowThresholdRatio;
    }

    return min + normalized * (max - min);
  };

  const setCvr = (rawValue) => {
    const value = Math.max(min, Math.min(max, Number(rawValue) || 0));
    hiddenCvr.value = String(value);
    cvrValueDisplay.textContent = `${Number(value.toFixed(1))}%`;

    const visualRatio = toVisualRatio(value);
    cvrGaugePath.style.strokeDashoffset = String(pathLength * (1 - visualRatio));

    const point = cvrGaugePath.getPointAtLength(pathLength * visualRatio);
    cvrGaugeDot.style.left = `${point.x}px`;
    cvrGaugeDot.style.top = `${point.y}px`;
    updateStep2AsidePreview();
  };

  const pointerToValue = (event) => {
    const svg = cvrGauge.querySelector(".step2-gauge-svg");
    if (!svg) return min;

    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let bestLength = 0;
    let bestDistance = Infinity;
    const steps = 140;
    for (let i = 0; i <= steps; i += 1) {
      const len = (pathLength * i) / steps;
      const pt = cvrGaugePath.getPointAtLength(len);
      const d = (pt.x - x) ** 2 + (pt.y - y) ** 2;
      if (d < bestDistance) {
        bestDistance = d;
        bestLength = len;
      }
    }

    const visualRatio = bestLength / pathLength;
    return fromVisualRatio(visualRatio);
  };

  let dragging = false;

  const onPointerMove = (event) => {
    if (!dragging) return;
    setCvr(pointerToValue(event));
  };

  const onPointerUp = () => {
    dragging = false;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  };

  const startDragging = (event) => {
    event.preventDefault();
    dragging = true;
    setCvr(pointerToValue(event));
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  cvrGauge.addEventListener("pointerdown", startDragging);
  cvrGaugeDot.addEventListener("pointerdown", startDragging);

  setCvr(hiddenCvr.value || 1);
}

  // Vérifie à chaque changement de levier ou de choix "hybride"
form.querySelectorAll('input[name="levers"], input[name="hybrides"]').forEach(el => {
  el.addEventListener("change", () => {
    checkHybridWarning();
    updateStep2AsidePreview();
  });
});

  updateStep2AsidePreview();

// ✅ Début du submit handler (tout le calcul DOIT être dedans)
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();

      updateProgress(2); // ✅ reste sur l'étape 3 pendant l'affichage des résultats

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
const insightKeyBox = document.getElementById("kpi-insight-key");
const quickAnalysisList = document.getElementById("quickAnalysisList");
const leverSplitBars = document.getElementById("leverSplitBars");
const nextStepBtn = document.getElementById("nextStepBtn");

    const fmtCompactCurrency = (value) => {
      if (!Number.isFinite(value)) return "—";
      if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1).replace(".", ",")} M€`;
      return fmtCurrency(value);
    };
	
    if (elRevenue) elRevenue.textContent = fmtCompactCurrency(revenue);
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

    if (quickAnalysisList) {
      quickAnalysisList.innerHTML = analysis
        .slice(0, 3)
        .map((text) => `<li>${text}</li>`)
        .join("");
    }

    const leverLabels = {
      cashback: "Cashback",
      bonsplans: "Bons plans",
      comparateurs: "Comparateurs",
      css: "CSS",
      retargeting: "Retargeting",
      "display-networks": "Display networks",
      emailing: "Emailing / NL",
      content: "Content commerce",
      affinitaires: "Affinitaires",
      influence: "Influence",
      ppc: "SEA (PPC)",
      retention: "Retention"
    };

    const { labels, data } = chartDataFor(sectorKey, levers);
    const splitData = labels
      .map((label, index) => ({
        label: leverLabels[label] || label.replace(/-/g, " "),
        pct: Math.max(1, Math.round((data[index] || 0) * 100))
      }))
      .sort((a, b) => b.pct - a.pct);

    if (leverSplitBars) {
      leverSplitBars.innerHTML = splitData
        .map(
          (item) => `
            <div class="lever-split-row">
              <p class="lever-split-label">${item.label}</p>
              <p class="lever-split-pct">${item.pct}%</p>
              <div class="lever-split-track"><span class="lever-split-fill" style="width:${item.pct}%;"></span></div>
            </div>
          `
        )
        .join("");
    }

    // --- Chart (doughnut) : build from sector PDV filtered by levers ---
    const canvas = document.getElementById("chart-levers");
    if (canvas && window.Chart) {
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

 // ✅ Message personnalisé (objectif + budget)
const objectifValue = form.elements["objectif"]?.value;
const hasBudget = !(unlimitedCheckbox && unlimitedCheckbox.checked);

if (objectifValue === "lancer") {
    maturityMessage = hasBudget
      ? "🌱 Vous êtes au début d’un beau programme. Avec un budget dédié, vous pouvez poser une base saine et attirer les bons partenaires dès le départ."
      : "🌱 Vous souhaitez lancer un programme. Même sans budget défini, un démarrage progressif avec des partenaires sélectionnés peut vous permettre d’apprendre et d'avancer sereinement.";
}

if (objectifValue === "optimiser") {
    maturityMessage = "🧩 Vous avez déjà des fondations. Optimiser votre mix partenaires, votre tracking et votre pilotage peut débloquer un vrai palier de performance.";
}

if (objectifValue === "diversifier") {
    maturityMessage = "✨ Vous êtes prêt(e) à tester de nouveaux leviers. En élargissant votre mix partenaires progressivement, vous sécurisez votre acquisition tout en capturant de nouvelles audiences.";
}

if (objectifValue === "scaler") {
    maturityMessage = "🚀 Vous entrez en phase d’accélération. Capitaliser sur ce qui fonctionne déjà tout en apportant plus de granularité dans vos partenariats sera clé pour scaler efficacement.";
}

const summaryInsight = String(maturityMessage || "").replace(/^[^A-Za-zÀ-ÿ0-9]+/u, "").trim();
if (insightKeyBox) {
  if (summaryInsight) {
    const firstSentence = summaryInsight.split(".").map((part) => part.trim()).filter(Boolean)[0];
    insightKeyBox.textContent = firstSentence ? `${firstSentence}.` : summaryInsight;
  } else {
    insightKeyBox.textContent = analysis[0] || "Insight indisponible (en dur)";
  }
}

    // --- Editors suggestions ---
afficherEditeurs(levers, sectorKey);

    console.log("Simulation — trafic:", trafficMonthly, "orders:", finalOrders, "rev:", revenue, "cacProj:", cacProjected, "budgetAnnuel:", budgetAnnual);
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    // === Envoi email automatique vers API Vercel ===
// ======================================
// 📌 Capture des éditeurs réellement affichés (max 8)
// ======================================
const editeursAffiches = (function() {
  let liste = [];

  // 1️⃣ Affinitaires du secteur
  const affi = EDITORS_AFFINITAIRE[sectorKey] || EDITORS_AFFINITAIRE.other;
  affi.forEach(e => liste.push(e.name));

  // 2️⃣ Éditeurs selon les leviers cochés
  levers.forEach(l => {
    if (EDITORS[l]) {
      EDITORS[l].forEach(e => liste.push(e.name));
    }
  });

  // 3️⃣ On renvoie EXACTEMENT ceux affichés (max 8)
  return liste.slice(0, 8);
})();

(async () => {
  try {

    const formPayload = {
      // Étape 1
      objectif: form.elements["objectif"]?.value || "",
      hybrides: hybridChoice,

      // Étape 2
      sector: sectorKey,
      sectorLabel: SECTORS[sectorKey]?.label || "Autre",
      site: form.elements["site"]?.value || "",
      emailProspect: form.elements["email"]?.value || "",
      marge: form.elements["marge"]?.value || "",

      // 🔥 AJOUT IMPORTANT
      editeursAffiches: editeursAffiches,

      // Étape 3
      trafficMensuel: trafficMonthly,
      budgetMensuel: budgetMonthly === Infinity ? "Illimité" : budgetMonthly,
      budgetAnnuel: budgetAnnual === Infinity ? "Illimité" : budgetAnnual,
      aovSaisi: aovUser,
      cvrSaisi: cvrUserInput,
      cacClient: cacClient,
      leviersSelectionnes: levers,

      // Résultats
      traficAnnuelAffilie: affiliatedTrafficYear,
      paniersAjuste: adjustedAov,
      cvrAjuste: adjustedCvr,
      commandesPotentielles: Math.round(potentialOrders),
      commandesFinales: Math.round(finalOrders),
      chiffreAffaires: Math.round(revenue),
      cacProjete: Math.round(cacProjected),
      budgetConsomme: Math.round(budgetConsumed),
      roi: roi.toFixed(2),

      messageMaturite: maturityMessage
    };

    // === Envoi vers sendEmail ===
    const response = await fetch("/api/sendEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formPayload),
    });

    if (response.ok) {
      console.log("📩 Email envoyé avec succès !");
    } else {
      console.warn("⚠️ Erreur envoi email :", response.status);
    }

  } catch (err) {
    console.error("❌ Erreur API Email :", err);
  }
})();

 
    // ✅ CTA dynamique selon l'objectif
const objectif = form.elements["objectif"]?.value;
const ctaWrapper = document.getElementById("cta-dynamic");
const ctaBtn = document.getElementById("cta-button");

if (ctaWrapper && ctaBtn) {
  let ctaText = "";
  let ctaLink = "https://www.lumigency.com/consultation-gratuite";

  switch (objectif) {
    case "lancer":
      ctaText = "🚀 Bénéficier d’une consultation gratuite de lancement";
      break;
    case "optimiser":
      ctaText = "🧠 Obtenir un audit de votre stratégie d’affiliation";
      break;
    case "diversifier":
      ctaText = "🤝 Échanger sur les bons leviers à activer pour votre marques";
      break;
    case "scaler":
      ctaText = "📈 Planifier un call stratégique pour passer à l’échelle";
      break;
    default:
      ctaText = "💬 Parler à un expert Lumigency";
  }

  ctaBtn.textContent = ctaText;
  ctaBtn.href = ctaLink;
  ctaWrapper.style.display = "block";
  if (nextStepBtn) nextStepBtn.href = ctaLink;
}
  });
});

// === Slider Témoignages ===
(function() {
  const slider = document.getElementById('slider');
  const slides = document.querySelectorAll('.review');
  if (!slider || slides.length === 0) return;

  let index = 0;
  function slideTestimonials() {
    index = (index + 1) % slides.length;
    slider.style.transform = `translateX(-${index * 33.33}%)`;
  }
  setInterval(slideTestimonials, 4000);
})();


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

    // Retourne en haut de page
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function updateProgress(stepIndex) {
  const stepDots = document.querySelectorAll(".steps-mini .step-dot");
  if (!stepDots.length) return;

  const maxIndex = Math.max(0, stepDots.length - 1);
  const safeIndex = Math.max(0, Math.min(maxIndex, Number(stepIndex) || 0));

  stepDots.forEach((dot, index) => {
    const isReached = index <= safeIndex;
    const isCompleted = index < safeIndex;
    dot.classList.toggle("active", isReached);
    dot.classList.toggle("completed", isCompleted);
  });
}








































