export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { traffic, budget, aov, cvr, levers, sector } = req.body;

  // === KPI par secteur (simplifié, extrait du baromètre) ===
  const kpiParSecteur = {
    "Mode": { aov: 66.7, cvr: 1.55, commission: 8.57 },
    "Beauté, Santé & Hygiène": { aov: 72.6, cvr: 1.21, commission: 6.73 },
    "B2B": { aov: 87, cvr: 2.26, commission: 7.86 },
    // ... à compléter avec ton tableau
  };

  // === Part de voix des leviers par secteur (extrait du baromètre) ===
  const sectorWeights = {
    "Mode": { cashback: 0.25, bonsplans: 0.20, influence: 0.15, retargeting: 0.10, display: 0.10 },
    "Beauté, Santé & Hygiène": { cashback: 0.20, bonsplans: 0.25, influence: 0.20, retargeting: 0.10, display: 0.10 },
    "B2B": { comparateurs: 0.20, css: 0.15, emailing: 0.15, cashback: 0.10 },
    // ... idem
  };

  // === 1. Trafic ajusté ===
  let adjustedTraffic = traffic;
  if (sector && sectorWeights[sector]) {
    const weights = sectorWeights[sector];
    let boost = 0;
    levers.forEach(l => {
      if (weights[l]) boost += weights[l];
    });
    boost = Math.min(boost, 0.3); // cap à 30 %
    adjustedTraffic = Math.round(traffic * (1 + boost));
  }

  // === 2. Calcul commandes, CA, coût & CAC ===
  const orders = Math.round(adjustedTraffic * (cvr / 100));
  const revenue = orders * aov;
  const cost = budget;
  const cac = orders > 0 ? cost / orders : 0;

  // === 3. Analyse dynamique ===
  let recommendations = [];
  if (orders < 50) {
    recommendations.push("🌱 Avec ce niveau de trafic et de leviers, l’affiliation sera un test limité. Pensez à diversifier vos canaux.");
  }
  if (sector && kpiParSecteur[sector]) {
    const ref = kpiParSecteur[sector];
    if (aov < ref.aov) recommendations.push("💡 Votre panier moyen est inférieur à la moyenne du secteur.");
    if (cvr < ref.cvr) recommendations.push("📉 Votre taux de conversion est en dessous du standard.");
    if (cac > ref.aov * 0.2) recommendations.push("⚠️ Votre CAC est élevé par rapport aux benchmarks du marché.");
  }

  res.status(200).json({
    revenue,
    orders,
    cost,
    cac,
    recommendations,
    benchmark: sector && kpiParSecteur[sector] ? kpiParSecteur[sector] : null
  });
}
