"use strict";

function numberOf(value) {
  const n = Number.parseFloat(String(value ?? "").replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
}

function normalize(map) {
  const values = Object.values(map);
  const sum = values.reduce((acc, current) => acc + current, 0) || 1;
  const out = {};
  for (const key of Object.keys(map)) out[key] = map[key] / sum;
  return out;
}

const SECTORS = {
  fashion: {
    label: "Mode & Beaute",
    aov: 67,
    cvr: 0.0155,
    pdv: normalize({
      cashback: 0.23,
      bonsplans: 0.18,
      retargeting: 0.14,
      css: 0.12,
      comparateurs: 0.11,
      "display-networks": 0.1,
      retention: 0.06,
      content: 0.04,
      emailing: 0.02
    })
  },
  beauty: {
    label: "Beaute & Cosmetique",
    aov: 72,
    cvr: 0.0168,
    pdv: normalize({
      cashback: 0.22,
      bonsplans: 0.17,
      influence: 0.18,
      affinitaires: 0.15,
      comparateurs: 0.1,
      "display-networks": 0.08,
      emailing: 0.05,
      content: 0.05
    })
  },
  electronics: {
    label: "High-tech & Electromenager",
    aov: 111,
    cvr: 0.0171,
    pdv: normalize({
      comparateurs: 0.25,
      cashback: 0.2,
      css: 0.15,
      bonsplans: 0.12,
      retargeting: 0.12,
      "display-networks": 0.08,
      emailing: 0.03,
      content: 0.03
    })
  },
  home: {
    label: "Maison & Decoration",
    aov: 113,
    cvr: 0.016,
    pdv: normalize({
      cashback: 0.2,
      bonsplans: 0.16,
      css: 0.12,
      comparateurs: 0.1,
      retargeting: 0.13,
      "display-networks": 0.1,
      emailing: 0.03,
      content: 0.06,
      retention: 0.1
    })
  },
  food: {
    label: "Alimentaire & Drive",
    aov: 81,
    cvr: 0.0216,
    pdv: normalize({
      cashback: 0.18,
      bonsplans: 0.2,
      comparateurs: 0.12,
      retargeting: 0.12,
      "display-networks": 0.1,
      emailing: 0.05,
      content: 0.05,
      retention: 0.08
    })
  },
  sports: {
    label: "Sport & Loisirs",
    aov: 79,
    cvr: 0.0107,
    pdv: normalize({
      cashback: 0.25,
      bonsplans: 0.18,
      comparateurs: 0.11,
      retargeting: 0.14,
      "display-networks": 0.09,
      emailing: 0.02,
      content: 0.04
    })
  },
  travel: {
    label: "Voyage & Tourisme",
    aov: 172,
    cvr: 0.0125,
    pdv: normalize({
      affinitaires: 0.25,
      comparateurs: 0.2,
      cashback: 0.15,
      retargeting: 0.18,
      "display-networks": 0.15,
      emailing: 0.04
    })
  },
  luxury: {
    label: "Luxe & Bijoux",
    aov: 200,
    cvr: 0.012,
    pdv: normalize({
      affinitaires: 0.3,
      influence: 0.2,
      cashback: 0.2,
      "display-networks": 0.1,
      comparateurs: 0.1,
      emailing: 0.05
    })
  },
  auto: {
    label: "Automobile",
    aov: 86,
    cvr: 0.0169,
    pdv: normalize({
      comparateurs: 0.25,
      bonsplans: 0.25,
      cashback: 0.2,
      css: 0.11,
      "display-networks": 0.06,
      retargeting: 0.08
    })
  },
  culture: {
    label: "Produits culturels",
    aov: 83,
    cvr: 0.0228,
    pdv: normalize({
      bonsplans: 0.35,
      cashback: 0.3,
      comparateurs: 0.15,
      retargeting: 0.07,
      "display-networks": 0.05,
      emailing: 0.03
    })
  },
  other: {
    label: "Autre",
    aov: 80,
    cvr: 0.015,
    pdv: normalize({
      cashback: 0.23,
      bonsplans: 0.18,
      retargeting: 0.14,
      css: 0.12,
      comparateurs: 0.11,
      "display-networks": 0.1,
      content: 0.04,
      emailing: 0.02
    })
  }
};

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

const HYBRID_LEVERS = ["affinitaires", "influence", "emailing", "content", "ppc"];

function annualAffiliatedTraffic(monthly) {
  if (monthly < 10000) return monthly * (0.05 * 6 + 0.08 * 6);
  if (monthly < 50000) return monthly * (0.08 * 6 + 0.1 * 6);
  if (monthly < 100000) return monthly * (0.12 * 6 + 0.15 * 6);
  if (monthly < 500000) return monthly * (0.12 * 6 + 0.17 * 6);
  return monthly * (0.15 * 6 + 0.18 * 6);
}

function adjustAOV(baseAov, levers) {
  let adjusted = baseAov;
  if (levers.includes("cashback")) adjusted *= 0.95;
  if (levers.includes("bonsplans")) adjusted *= 0.95;
  if (levers.includes("comparateurs") || levers.includes("css")) adjusted *= 0.98;
  if (levers.includes("affinitaires")) adjusted *= 1.05;
  if (levers.includes("influence")) adjusted *= 1.05;
  return adjusted;
}

function adjustCVR(baseCvr, levers) {
  let adjusted = baseCvr;
  if (levers.includes("emailing")) adjusted += 0.001;
  if (levers.includes("ppc")) adjusted += 0.002;
  if (levers.includes("retargeting")) adjusted += 0.0025;
  if (levers.includes("cashback")) adjusted += 0.002;
  if (levers.includes("bonsplans")) adjusted += 0.0015;
  if (levers.includes("css")) adjusted += 0.001;
  if (levers.includes("display-networks")) adjusted += 0.001;
  if (levers.includes("comparateurs")) adjusted += 0.001;
  if (levers.includes("influence")) adjusted += 0.0015;
  if (levers.includes("affinitaires")) adjusted += 0.001;
  if (levers.includes("retention")) adjusted += 0.002;
  if (levers.includes("content")) adjusted += 0.001;

  const allLevers = [
    "cashback",
    "bonsplans",
    "retargeting",
    "css",
    "comparateurs",
    "display-networks",
    "retention",
    "content",
    "emailing",
    "ppc",
    "affinitaires",
    "influence"
  ];
  if (allLevers.every((lever) => levers.includes(lever))) adjusted += 0.015;

  if (!levers.includes("cashback") && !levers.includes("bonsplans")) adjusted *= 0.5;
  return Math.min(adjusted, 0.08);
}

function projectedCAC(sectorKey, levers, cacClient) {
  const sector = SECTORS[sectorKey] || SECTORS.other;
  const pdv = sector.pdv || {};

  let selected = {};
  if (levers.length) {
    for (const lever of levers) selected[lever] = pdv[lever] ?? 1;
  } else {
    selected = Object.fromEntries(
      Object.entries(pdv)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    );
  }
  selected = normalize(selected);

  let cac = 0;
  for (const lever of Object.keys(selected)) {
    const base = LEVER_CAC[lever] ?? cacClient ?? 0;
    cac += selected[lever] * base;
  }

  const premiumLevers = ["affinitaires", "influence", "content", "emailing"];
  const massLevers = ["cashback", "bonsplans", "retargeting", "comparateurs", "css"];
  const premiumCount = levers.filter((lever) => premiumLevers.includes(lever)).length;
  const massCount = levers.filter((lever) => massLevers.includes(lever)).length;

  const diversityFactor = 1 - Math.min(levers.length / 10, 0.3);
  cac *= diversityFactor;

  if (premiumCount && !massCount) cac *= 1.25;
  else if (massCount && !premiumCount) cac *= 0.9;
  else if (premiumCount && massCount) cac *= 1.05;

  if (cacClient > 0) {
    const diffRatio = cac / cacClient;
    if (diffRatio < 0.7) cac = (cac + cacClient * 0.8) / 2;
    else if (diffRatio > 1.4) cac = (cac + cacClient * 1.2) / 2;
  }

  if (cac <= 0) cac = cacClient || 10;
  return cac;
}

function computeSimulation(input) {
  const trafficMonthly = numberOf(input.trafficMonthly);
  const aovUser = numberOf(input.aov);
  const cvrUserInput = numberOf(input.cvrPercent) / 100;
  const cacClient = numberOf(input.cacClient);
  const sectorKey = input.sectorKey || "other";
  const levers = Array.isArray(input.levers) ? input.levers.filter(Boolean) : [];
  const unlimitedBudget = Boolean(input.unlimitedBudget);

  let budgetMonthly = 0;
  if (unlimitedBudget) budgetMonthly = Number.POSITIVE_INFINITY;
  else budgetMonthly = numberOf(input.budgetMonthly) || 0;

  const budgetAnnual =
    budgetMonthly === Number.POSITIVE_INFINITY
      ? Number.POSITIVE_INFINITY
      : budgetMonthly * 12;

  const sector = SECTORS[sectorKey] || SECTORS.other;
  const baseAov = aovUser > 0 ? aovUser : sector.aov;
  const baseCvr = cvrUserInput > 0 ? cvrUserInput : sector.cvr;

  let adjustedAov = adjustAOV(baseAov, levers);
  let adjustedCvr = adjustCVR(baseCvr, levers);

  const hybridChoice = input.hybridChoice || "non";
  if (hybridChoice === "non" && levers.some((lever) => HYBRID_LEVERS.includes(lever))) {
    adjustedCvr *= 0.7;
    adjustedAov *= 0.9;
  }

  const affiliatedTrafficYear = annualAffiliatedTraffic(trafficMonthly);
  const potentialOrders = affiliatedTrafficYear * adjustedCvr;
  const cacProjected = projectedCAC(sectorKey, levers, cacClient || 0);

  const maxOrdersByBudget =
    budgetAnnual === Number.POSITIVE_INFINITY || cacProjected === 0
      ? potentialOrders
      : budgetAnnual / cacProjected;

  const finalOrders = Math.min(potentialOrders, maxOrdersByBudget);
  const revenue = finalOrders * adjustedAov;
  const budgetConsumed = budgetAnnual === Number.POSITIVE_INFINITY ? revenue : budgetAnnual;
  const budgetDisplayed = budgetConsumed < 5000 ? 10000 : budgetConsumed;
  const roi = budgetConsumed > 0 ? revenue / budgetConsumed : null;
  const cacEuro = finalOrders > 0 ? budgetConsumed / finalOrders : null;
  const costRatioPct = revenue > 0 ? (budgetConsumed / revenue) * 100 : null;

  return {
    trafficMonthly,
    budgetMonthly,
    budgetAnnual,
    sectorKey,
    levers,
    affiliatedTrafficYear,
    adjustedAov,
    adjustedCvr,
    potentialOrders,
    finalOrders,
    revenue,
    cacProjected,
    budgetConsumed,
    budgetDisplayed,
    roi,
    cacEuro,
    costRatioPct
  };
}

module.exports = {
  SECTORS,
  LEVER_CAC,
  annualAffiliatedTraffic,
  adjustAOV,
  adjustCVR,
  projectedCAC,
  computeSimulation
};
