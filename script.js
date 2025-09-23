// === LUMIGENCY SIMULATEUR — V4 (réaliste + baromètre) ===

// 1) Baromètre sectoriel : AOV, CVR, parts de voix par levier
const SECTORS = {
  fashion: {
    label: "Mode & Beauté",
    aov: 66.67,
    cvr: 0.0155,
    share: { cashback: 0.24, bonsplans: 0.20, retargeting: 0.15, css: 0.12, comparateurs: 0.10, "display-networks": 0.16, emailing: 0.08, ppc: 0.06, affinitaires: 0.05, influence: 0.05, retention: 0.06, content: 0.05 }
  },
  electronics: {
    label: "High Tech & Électroménager",
    aov: 110.93,
    cvr: 0.0171,
    share: { cashback: 0.22, bonsplans: 0.18, retargeting: 0.16, css: 0.10, comparateurs: 0.12, "display-networks": 0.16, emailing: 0.08, ppc: 0.08, affinitaires: 0.04, influence: 0.04, retention: 0.06, content: 0.05 }
  },
  home: {
    label: "Maison & Décoration",
    aov: 112.69,
    cvr: 0.0160,
    share: { cashback: 0.18, bonsplans: 0.16, retargeting: 0.16, css: 0.12, comparateurs: 0.12, "display-networks": 0.14, emailing: 0.08, ppc: 0.06, affinitaires: 0.06, influence: 0.04, retention: 0.06, content: 0.06 }
  },
  food: {
    label: "Alimentaire & Boissons",
    aov: 80.71,
    cvr: 0.0216,
    share: { cashback: 0.20, bonsplans: 0.20, retargeting: 0.15, css: 0.08, comparateurs: 0.10, "display-networks": 0.12, emailing: 0.10, ppc: 0.06, affinitaires: 0.04, influence: 0.04, retention: 0.08, content: 0.05 }
  },
  sports: {
    label: "Sport & Loisirs",
    aov: 79.21,
    cvr: 0.0107,
    share: { cashback: 0.22, bonsplans: 0.18, retargeting: 0.15, css: 0.10, comparateurs: 0.12, "display-networks": 0.16, emailing: 0.07, ppc: 0.08, affinitaires: 0.04, influence: 0.05, retention: 0.05, content: 0.05 }
  },
  travel: {
    label: "Voyage & Tourisme",
    aov: 171.8,
    cvr: 0.0125,
    share: { cashback: 0.18, bonsplans: 0.12, retargeting: 0.20, css: 0.10, comparateurs: 0.10, "display-networks": 0.16, emailing: 0.06, ppc: 0.10, affinitaires: 0.05, influence: 0.05, retention: 0.04, content: 0.04 }
  },
  luxury: {
    label: "Luxe & Bijoux",
    aov: 200,
    cvr: 0.012,
    share: { cashback: 0.12, bonsplans: 0.10, retargeting: 0.18, css: 0.12, comparateurs: 0.12, "display-networks": 0.16, emailing: 0.06, ppc: 0.06, affinitaires: 0.08, influence: 0.08, retention: 0.04, content: 0.04 }
  },
  auto: {
    label: "Automobile",
    aov: 85.59,
    cvr: 0.0169,
    share: { cashback: 0.16, bonsplans: 0.14, retargeting: 0.18, css: 0.10, comparateurs: 0.12, "display-networks": 0.14, emailing: 0.07, ppc: 0.10, affinitaires: 0.06, influence: 0.05, retention: 0.05, content: 0.03 }
  },
  services: {
    label: "B2B / Finance / Assurance",
    aov: 60.24,
    cvr: 0.0184,
    share: { cashback: 0.10, bonsplans: 0.10, retargeting: 0.20, css: 0.12, comparateurs: 0.12, "display-networks": 0.14, emailing: 0.08, ppc: 0.10, affinitaires: 0.08, influence: 0.06, retention: 0.06, content: 0.04 }
  },
  culture: {
    label: "Produits culturels & Loisirs",
    aov: 82.61,
    cvr: 0.0228,
    share: { cashback: 0.20, bonsplans: 0.18, retargeting: 0.14, css: 0.12, comparateurs: 0.12, "display-networks": 0.12, emailing: 0.08, ppc: 0.06, affinitaires: 0.06, influence: 0.05, retention: 0.06, content: 0.05 }
  },
  other: {
    label: "Autre",
    aov: 80,
    cvr: 0.015,
    share: { cashback: 0.20, bonsplans: 0.18, retargeting: 0.16, css: 0.10, comparateurs: 0.12, "display-networks": 0.14, emailing: 0.08, ppc: 0.08, affinitaires: 0.05, influence: 0.05, retention: 0.06, content: 0.05 }
  }
};

// 2) CAC moyens par levier (base); bornes appliquées ensuite
const CAC_BASE = {
  cashback: 4,
  bonsplans: 2,
  retargeting: 3,
  css: 6.5,
  comparateurs: 6.5,
  "display-networks": 3,
  emailing: 3.5,
  ppc: 4,
  affinitaires: 10,
  influence: 10,
  retention: 1.5,
  content: 8
};
const CAC_MIN = 2;
const CAC_MAX = 30;

// 3) Ajustement CVR par levier (multiplicatif doux) + bornes
const CVR_LEVER_MULT = {
  cashback: 1.10,
  bonsplans: 1.08,
  retargeting: 1.10,
  css: 1.05,
  comparateurs: 1.05,
  "display-networks": 1.03,
  emailing: 1.02,
  ppc: 1.04,
  affinitaires: 1.03,
  influence: 1.03,
  retention: 1.04,
  content: 1.02
};
const CVR_MIN = 0.003; // 0.3%
const CVR_MAX = 0.025; // 2.5%

// 4) Trafic annualisé réaliste (paliers validés)
function annualAffiliatedTraffic(monthly) {
  if (monthly < 10000) {
    return monthly * 0.10 * 6 + monthly * 0.15 * 6; // 10% puis 15%
  }
  if (monthly < 50000) {
    return monthly * 0.12 * 6 + monthly * 0.14 * 6; // 12% puis 14%
  }
  if (monthly < 100000) {
    return monthly * 0.15 * 12; // 15% à l'année
  }
  if (monthly < 500000) {
    return monthly * 0.25 * 12; // 25% à l'année
  }
  return monthly * 0.30 * 12;   // 30% à l'année
}

// 5) Helpers formats
function numberOf(v) {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}
function formatEur(n) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}
function formatInt(n) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n));
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[s]));
}

// 6) Coeff parts de voix normalisées sur les leviers cochés
function normalizedShares(sectorShare, selected) {
  const slice = {};
  let sum = 0;
  selected.forEach(k => { const v = sectorShare[k] ?? 0; slice[k] = v; sum += v; });
  if (sum <= 0) {
    // fallback: répartition égale si aucune donnée
    const eq = 1 / Math.max(selected.length, 1);
    selected.forEach(k => slice[k] = eq);
    return slice;
  }
  Object.keys(slice).forEach(k => slice[k] = slice[k] / sum);
  return slice;
}

// 7) Script principal
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-simu");
  const resultsCard = document.getElementById("results");
  const ctxCanvas = document.getElementById("chart-levers");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Inputs
    const monthlyTraffic = numberOf(form.elements["traffic"]?.value);
    const aovInput = numberOf(form.elements["aov"]?.value);
    const cvrInputPct = numberOf(form.elements["cvr"]?.value);
    const budgetMonthly = numberOf(form.elements["budget"]?.value);
    const sectorKey = form.elements["sector"]?.value || "other";
    const sector = SECTORS[sectorKey] || SECTORS.other;

    // Normalisation minimale (filets de sécurité)
    const budgetMonthlySafe = Math.max(budgetMonthly, 500);
    const aov = aovInput > 0 ? aovInput : sector.aov;
    let cvr = (cvrInputPct > 0 ? cvrInputPct : sector.cvr * 100) / 100;
    cvr = Math.min(Math.max(cvr, CVR_MIN), CVR_MAX);

    // Trafic affilié annualisé (réaliste)
    const trafficYear = annualAffiliatedTraffic(monthlyTraffic);

    // Leviers cochés
    const selectedLevers = Array
      .from(form.querySelectorAll('input[name="levers"]:checked'))
      .map(n => n.value);

    // Ajustements CVR (doux) & caps
    selectedLevers.forEach(lv => { cvr *= (CVR_LEVER_MULT[lv] || 1); });
    cvr = Math.min(Math.max(cvr, CVR_MIN), CVR_MAX);

    // Conversions brutes
    const conversionsBrutes = trafficYear * cvr;

    // CAC effectif pondéré par parts de voix sectorielles des leviers cochés
    let cacEff = 10; // fallback
    if (selectedLevers.length) {
      const shares = normalizedShares(sector.share, selectedLevers);
      let sum = 0;
      selectedLevers.forEach(lv => {
        const w = shares[lv] ?? 0;
        const base = CAC_BASE[lv] ?? 10;
        sum += w * base;
      });
      cacEff = Math.min(Math.max(sum, CAC_MIN), CAC_MAX);
    }

    // Budget annuel & ventes possibles via budget
    const budgetYear = budgetMonthlySafe * 12;
    const ventesBudget = budgetYear / cacEff;

    // Ventes finales = min(Conversions brutes, Ventes permises par budget)
    let finalOrders = Math.min(conversionsBrutes, ventesBudget);

    // CA final
    let finalRevenue = finalOrders * aov;

    // Cap ROI pour cohérence (ex: 8x le budget annuel)
    const ROI_CAP = 8;
    const maxRevenue = budgetYear * ROI_CAP;
    if (finalRevenue > maxRevenue) {
      finalRevenue = maxRevenue;
      finalOrders = finalRevenue / aov;
    }

    // === Analyse rapide (3 phrases) + montée en puissance ===
    const insights = [];
    // Panier moyen vs secteur (pas si "Autre")
    if (sectorKey !== "other") {
      if (aov > sector.aov * 1.1) {
        insights.push(`Votre panier moyen (${formatEur(aov)}) est supérieur à la moyenne de votre secteur (${formatEur(sector.aov)}).`);
      } else if (aov < sector.aov * 0.9) {
        insights.push(`Votre panier moyen (${formatEur(aov)}) est inférieur à la moyenne de votre secteur (${formatEur(sector.aov)}).`);
      } else {
        insights.push(`Votre panier moyen (${formatEur(aov)}) est proche de la moyenne de votre secteur (${formatEur(sector.aov)}).`);
      }
    }
    // Taux de conversion simulé
    insights.push(`Votre taux de conversion simulé est de ${(cvr * 100).toFixed(2)} %.`);
    // Budget
    insights.push(`Votre budget annuel saisi (${formatEur(budgetYear)}) peut plafonner vos performances.`);
    // Montée en puissance
    insights.push(`La première année correspond à une montée progressive en puissance de votre programme d'affiliation.`);

    // === Affichage KPI
    document.getElementById("kpi-revenue").textContent = formatEur(finalRevenue);
    document.getElementById("kpi-orders").textContent = formatInt(finalOrders);
    document.getElementById("kpi-budget").textContent = formatEur(budgetYear);

    // Analyse + CTA
    const insightsBox = document.getElementById("insights");
    insightsBox.innerHTML = `
      <h3>Analyse rapide</h3>
      <ul>${insights.map(t => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
      <div style="text-align:center; margin-top:20px;">
        <a href="https://www.lumigency.com/consultation-gratuite" class="cta">
          📅 Prenez RDV gratuit pour créer ou développer votre programme d’affiliation
        </a>
      </div>
    `;

    // === Graphique parts de voix (on garde ton rendu)
    if (ctxCanvas) {
      // Détermination des parts sur les leviers cochés
      const shares = normalizedShares(sector.share, selectedLevers.length ? selectedLevers : Object.keys(sector.share));
      const labels = Object.keys(shares);
      const data = labels.map(k => Math.round(shares[k] * 100));

      // Nettoyage ancien chart si besoin
      if (window.__leversChart) {
        window.__leversChart.destroy();
      }
      window.__leversChart = new Chart(ctxCanvas, {
        type: "doughnut",
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: ["#4e79a7","#f28e2b","#e15759","#76b7b2","#59a14f","#edc949","#af7aa1","#ff9da7","#9c755f","#bab0ab","#86bc86","#5f9ed1"]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "right", labels: { boxWidth: 12, font: { size: 12 } } },
            datalabels: {
              color: "#fff",
              formatter: (value) => value + "%",
              font: { weight: "bold" }
            }
          },
          cutout: "60%"
        },
        plugins: (typeof ChartDataLabels !== "undefined" ? [ChartDataLabels] : [])
      });
    }

    // Show card
    resultsCard.style.display = "block";
  });
});
