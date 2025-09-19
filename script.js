console.log("script.js charge");

// ==== Donnees secteur ====
const SECTOR_DEFAULTS = {
  fashion: { aov: 66.67, cvr: 0.0155, label: "Mode & Beauté",
    shares: { cashback:12, bonsplans:24, comparateurs:2, emailing:12, retargeting:15, affinitaires:14, display:16, content:12 } },
  electronics: { aov: 110.93, cvr: 0.0171, label: "High Tech & Électroménager",
    shares: { comparateurs:20, css:18, retargeting:12, display:15, emailing:10 } },
  home: { aov: 112.69, cvr: 0.0160, label: "Maison & Décoration",
    shares: { cashback:22, bonsplans:19, display:15, emailing:10, content:8 } },
  food: { aov: 80.71, cvr: 0.0216, label: "Alimentaire & Drive",
    shares: { emailing:3, cashback:21, comparateurs:9, retargeting:20, bonsplans:41, display:3, content:1 } },
  sports: { aov: 79.21, cvr: 0.0107, label: "Sport & Loisirs",
    shares: { bonsplans:20, influence:15, display:14, emailing:10 } },
  travel: { aov: 171.80, cvr: 0.0125, label: "Voyage & Tourisme",
    shares: { cashback:21, comparateurs:27, content:4, bonsplans:5, affinitaires:11, emailing:14, "display-networks":18 } },
  luxury: { aov: 200.00, cvr: 0.0120, label: "Luxe & Bijoux",
    shares: { influence:22, content:18, emailing:12, display:10 } },
  auto: { aov: 85.59, cvr: 0.0169, label: "Automobile",
    shares: { cashback:13, bonsplans:30, comparateurs:11, emailing:12, retargeting:12, affinitaires:5, "display-networks":12, content:4 } },
  services: { aov: 60.24, cvr: 0.0184, label: "B2B / Finance / Assurance",
    shares: { content:20, emailing:19, ppc:15, display:12 } },
  other: { aov: 80, cvr: 0.015, label: "Autre",
    shares: { display:18, cashback:14, bonsplans:13 } }
};

const LEVER_WEIGHTS = {
  cashback: { orders: 1.10, aov: 0.95, note: "Le cashback stimule les volumes avec un impact leger sur le panier moyen." },
  bonsplans: { orders: 1.15, aov: 0.90, note: "Les bons plans accelerent la croissance mais sous pression sur le panier." },
  retargeting: { orders: 1.15, aov: 1.00, note: "Le retargeting améliore directement le taux de conversion." },
  css: { orders: 1.10, aov: 1.00, note: "Les CSS / comparateurs apportent une intention d achat forte et une conversion saine." },
  comparateurs: { orders: 1.10, aov: 1.00, note: "Les comparateurs apportent une intention d achat forte et un bon mix volume/ROAS." },
  display: { orders: 1.05, aov: 1.00, note: "Le display travaille la visibilite avec un uplift direct modere." },
  "display-networks": { orders: 1.05, aov: 1.00, note: "Les display networks renforcent la portee et la notoriete." },
  retention: { orders: 1.10, aov: 1.02, note: "La retention on-site ameliorent le panier et la LTV." },
  content: { orders: 1.08, aov: 1.02, note: "Le content commerce renforce la confiance et la valeur panier." },
  emailing: { orders: 1.10, aov: 1.01, note: "L emailing est tres ROIste si la base est saine et engagee." },
  ppc: { orders: 1.25, aov: 1.00, note: "Le PPC/SEA genere du volume; a piloter finement cote cout d acquisition." },
  affinitaires: { orders: 1.12, aov: 1.02, note: "Les affinitaires apportent une audience qualitative et de la valeur." },
  influence: { orders: 1.20, aov: 0.98, note: "L influence travaille la notoriete et des ventes incrementales." }
};

// ==== Règles trafic ====
function annualAffiliatedTraffic(trafficMonthly) {
  if (trafficMonthly < 10000)  return trafficMonthly * 0.20 * 6 + trafficMonthly * 0.30 * 6;
  if (trafficMonthly < 50000)  return trafficMonthly * 0.40 * 6 + trafficMonthly * 0.30 * 6;
  if (trafficMonthly < 500000) return trafficMonthly * 0.40 * 12;
  return trafficMonthly * 0.70 * 12;
}

// ==== Soumission ====
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-simu");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const trafficMonthly = num(form.elements["traffic"]?.value);
    const aovInput       = num(form.elements["aov"]?.value);
    const cvrInputPct    = num(form.elements["cvr"]?.value);
    const cacTarget      = num(form.elements["cac"]?.value);
    const budgetMensuel  = num(form.elements["budget"]?.value);
    const sectorKey      = form.elements["sector"]?.value || "other";

    const sector = SECTOR_DEFAULTS[sectorKey] || SECTOR_DEFAULTS.other;
    const aov = aovInput > 0 ? aovInput : sector.aov;
    const cvr = (cvrInputPct > 0 ? cvrInputPct : sector.cvr * 100) / 100;

    const trafficYear = annualAffiliatedTraffic(trafficMonthly);
    let baseOrders = trafficYear * cvr;

    let ordersFactor = 1, aovFactor = 1;
    const selectedLevers = Array.from(form.querySelectorAll('input[name="levers"]:checked')).map(n => n.value);
    selectedLevers.forEach(lv => {
      const w = LEVER_WEIGHTS[lv];
      if (w) { ordersFactor *= w.orders; aovFactor *= w.aov; }
    });

    const orders  = Math.max(0, Math.round(baseOrders * ordersFactor));
    const aovAdj  = aov * aovFactor;
    const revenue = Math.round(orders * aovAdj);

    // Budget affiliation annuel = CAC cible * ventes, cap a budget client * 12
    const capClient = budgetMensuel > 0 ? budgetMensuel * 12 : Infinity;
    let budgetAff   = (cacTarget > 0 ? cacTarget * orders : 0);
    if (isFinite(capClient)) budgetAff = Math.min(budgetAff, capClient);

    // KPIs
    setText("results-title", "Analyse de vos potentielles futures performances en affiliation");
    setText("kpi-revenue", eur(revenue));
    setText("kpi-orders",  int(orders));
    setText("kpi-budget",  eur(budgetAff));

    // Analyse narrative
    const narrativeHtml = buildNarrative({
      sector, aov, sectorAov: sector.aov, cvr, sectorCvr: sector.cvr, selectedLevers
    });

    // Leviers sectoriels
    const leverHtml = buildLeverSectorBlock({
      sectorShares: sector.shares || {}, selectedLevers
    });

    // CTA
    const ctaHtml = `
      <button class="cta" onclick="window.location.href='https://www.lumigency.com/consultation-gratuite'">
        Prenez RDV pour aller plus loin dans l analyse ou creer votre programme d affiliation
      </button>
      <p><em>Ces chiffres sont des estimations indicatives et non des valeurs garanties. Estimations projetées sur 12 mois.</em></p>
    `;

    const insightsBox = document.getElementById("insights");
    insightsBox.innerHTML = `${narrativeHtml}${leverHtml}${ctaHtml}`;

    document.getElementById("results").style.display = "block";
  });
});

// ==== Génération de contenu ====
function buildNarrative({ sector, aov, sectorAov, cvr, sectorCvr, selectedLevers }) {
  const parts = [];
  if (aov > sectorAov * 1.1) {
    parts.push(`<p>Votre panier moyen (<strong>${eur(aov)}</strong>) est superieur a la moyenne de votre secteur (${eur(sectorAov)}). C est un bon signal de valorisation client.</p>`);
  } else if (aov < sectorAov * 0.9) {
    parts.push(`<p>Votre panier moyen (<strong>${eur(aov)}</strong>) est inferieur a la moyenne sectorielle (${eur(sectorAov)}). Il existe un potentiel d amelioration sur la valeur des commandes.</p>`);
  } else {
    parts.push(`<p>Votre panier moyen (<strong>${eur(aov)}</strong>) est coherent avec la moyenne de votre secteur (${eur(sectorAov)}).</p>`);
  }

  const cvrPct = (cvr * 100).toFixed(2);
  const secPct = (sectorCvr * 100).toFixed(2);
  if (cvr > sectorCvr * 1.1) {
    parts.push(`<p>Votre taux de conversion (<strong>${cvrPct}%</strong>) est au-dessus de la moyenne (${secPct}%). Continuez a capitaliser sur ce point fort.</p>`);
  } else if (cvr < sectorCvr * 0.9) {
    parts.push(`<p>Votre taux de conversion (<strong>${cvrPct}%</strong>) est en dessous de la moyenne (${secPct}%). Travailler l experience d achat et la reassurance peut rapidement ameliorer vos volumes.</p>`);
  } else {
    parts.push(`<p>Votre taux de conversion (<strong>${cvrPct}%</strong>) est proche de la moyenne (${secPct}%). Les leviers de conversion peuvent aider a passer un cap.</p>`);
  }

  if (selectedLevers.length) {
    const phrases = selectedLevers.map(lv => LEVER_WEIGHTS[lv]?.note).filter(Boolean);
    if (phrases.length) parts.push(`<p>${phrases.join(" ")}</p>`);
  }

  return `<h3>Analyse rapide</h3>${parts.join("\n")}`;
}

function buildLeverSectorBlock({ sectorShares, selectedLevers }) {
  const major = [];
  Object.entries(sectorShares).forEach(([lever, share]) => {
    if (share >= 15) {
      const pct = Math.round(share);
      if (selectedLevers.includes(lever)) {
        major.push(`<p>✅ Vous avez activé <strong>${labelLever(lever)}</strong>, qui represente environ <strong>${pct}%</strong> des ventes dans votre secteur.</p>`);
      } else {
        major.push(`<p>⚠️ <strong>${labelLever(lever)}</strong> pese environ <strong>${pct}%</strong> des ventes dans votre secteur, mais vous ne l avez pas active.</p>`);
      }
    }
  });
  if (!major.length) return "";
  return `<h3>Leviers cles dans votre secteur</h3>${major.join("\n")}`;
}

// ==== Helpers ====
function num(v){ const n=parseFloat(String(v).replace(",", ".")); return isNaN(n)?0:n; }
function eur(n){ return new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n); }
function int(n){ return new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(Math.round(n)); }
function setText(id, txt){ const el=document.getElementById(id); if(el) el.textContent = txt; }
function labelLever(key){
  const map = { cashback:"Cashback", bonsplans:"Bons plans", retargeting:"Retargeting", css:"CSS",
    comparateurs:"Comparateurs", display:"Display", "display-networks":"Display networks", retention:"Rétention on-site",
    content:"Content commerce", emailing:"Emailing / NL", ppc:"PPC / SEA", affinitaires:"Affinitaires", influence:"Influence" };
  return map[key] || key;
}
