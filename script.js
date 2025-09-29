/* ========= LUMIGENCY SIMULATOR — JS COMPLET ========= */

console.log("script.js chargé");

// ---------- Helpers ----------
function numberOf(v){ const n=parseFloat(String(v).replace(",", ".")); return isNaN(n)?0:n; }
function formatEuro(n){ return new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n); }
function formatInt(n){ return new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(Math.round(n)); }
function normalize(map){
  const s = Object.values(map).reduce((a,b)=>a+b,0) || 1;
  const out={}; for(const k in map){ out[k]=map[k]/s; } return out;
}

// ---------- Données secteurs (AOV, CVR, PDV leviers) ----------
const SECTORS={
  fashion:{label:"Mode & Beauté", aov:87, cvr:0.0226, pdv:normalize({
    cashback:0.25, bonsplans:0.22, comparateurs:0.12, css:0.08,
    retargeting:0.10, "display-networks":0.08, affinitaires:0.08,
    influence:0.04, emailing:0.02, content:0.01, ppc:0.00, retention:0.00
  })},
  electronics:{label:"Électronique & High-tech", aov:111, cvr:0.0171, pdv:normalize({
    comparateurs:0.25, css:0.15, cashback:0.20, bonsplans:0.15,
    retargeting:0.08, "display-networks":0.07, emailing:0.04,
    affinitaires:0.03, content:0.02, influence:0.01, ppc:0.00, retention:0.00
  })},
  home:{label:"Maison & Décoration", aov:113, cvr:0.0160, pdv:normalize({
    cashback:0.25, bonsplans:0.27, comparateurs:0.15, content:0.11,
    affinitaires:0.13, "display-networks":0.04, emailing:0.03, retargeting:0.02,
    css:0.00, influence:0.00, ppc:0.00, retention:0.00
  })},
  food:{label:"Alimentaire & Boissons", aov:81, cvr:0.0216, pdv:normalize({
    cashback:0.21, bonsplans:0.41, comparateurs:0.09, affinitaires:0.20,
    emailing:0.03, "display-networks":0.03, retargeting:0.02, css:0.01,
    content:0.00, influence:0.00, ppc:0.00, retention:0.00
  })},
  sports:{label:"Sport & Loisirs", aov:79, cvr:0.0107, pdv:normalize({
    cashback:0.22, comparateurs:0.18, bonsplans:0.20, retargeting:0.12,
    "display-networks":0.10, affinitaires:0.10, emailing:0.04, css:0.02,
    content:0.02, influence:0.00, ppc:0.00, retention:0.00
  })},
  travel:{label:"Voyage & Tourisme", aov:172, cvr:0.0125, pdv:normalize({
    affinitaires:0.25, influence:0.15, comparateurs:0.20, cashback:0.15,
    bonsplans:0.08, "display-networks":0.08, emailing:0.04, retargeting:0.03,
    css:0.02, content:0.00, ppc:0.00, retention:0.00
  })},
  luxury:{label:"Luxe & Bijoux", aov:200, cvr:0.0120, pdv:normalize({
    affinitaires:0.30, influence:0.20, cashback:0.20, bonsplans:0.10,
    comparateurs:0.10, "display-networks":0.06, emailing:0.02, retargeting:0.02,
    css:0.00, content:0.00, ppc:0.00, retention:0.00
  })},
  auto:{label:"Automobile", aov:86, cvr:0.0169, pdv:normalize({
    cashback:0.20, bonsplans:0.25, comparateurs:0.25, css:0.10,
    retargeting:0.08, "display-networks":0.06, emailing:0.03,
    affinitaires:0.02, content:0.01, influence:0.00, ppc:0.00, retention:0.00
  })},
  culture:{label:"Produits culturels", aov:83, cvr:0.0228, pdv:normalize({
    bonsplans:0.35, cashback:0.30, comparateurs:0.15, retargeting:0.07,
    "display-networks":0.05, emailing:0.03, content:0.03, css:0.02,
    affinitaires:0.00, influence:0.00, ppc:0.00, retention:0.00
  })},
  other:{label:"Autre", aov:80, cvr:0.0150, pdv:normalize({
    cashback:0.23, bonsplans:0.18, retargeting:0.14, css:0.12,
    comparateurs:0.11, "display-networks":0.10, affinitaires:0.06,
    content:0.04, emailing:0.02, ppc:0.00, influence:0.00, retention:0.00
  })}
};

// ---------- Barème CAC projeté par levier (en euros) ----------
const LEVER_CAC={
  cashback:10, bonsplans:6, css:13, comparateurs:13,
  "display-networks":12, retargeting:12,
  affinitaires:15, influence:15,
  retention:4, emailing:14, content:14, ppc:14
};

// ---------- Trafic annualisé (paliers validés) ----------
function annualAffiliatedTraffic(monthly){
  if (monthly < 10000)   return monthly*(0.06*6 + 0.10*6); // <10k
  if (monthly < 50000)   return monthly*(0.08*6 + 0.10*6); // 10–50k
  if (monthly < 100000)  return monthly*(0.12*6 + 0.15*6); // 50–100k
  if (monthly < 500000)  return monthly*(0.12*6 + 0.17*6); // 100–500k
  return monthly*(0.15*6 + 0.18*6);                        // >500k
}

// ---------- Ajustements AOV & CR ----------
function adjustAOV(base, levers){
  let a = base;
  if (levers.includes("cashback")) a*=0.95;
  if (levers.includes("bonsplans")) a*=0.95;
  if (levers.includes("comparateurs")) a*=0.98;
  if (levers.includes("affinitaires")) a*=1.05;
  if (levers.includes("influence")) a*=1.05;
  return a;
}
function adjustCR(base, levers){
  let cr=base;

  const ALL = ["cashback","bonsplans","retargeting","css","comparateurs","display-networks","retention","content","emailing","ppc","affinitaires","influence"];
  if (levers.length===ALL.length) cr += 0.015;

  if (levers.includes("emailing")) cr += 0.001;
  if (levers.includes("ppc")) cr += 0.002;
  if (levers.includes("retargeting")) cr += 0.0025;
  if (levers.includes("cashback")) cr += 0.002;
  if (levers.includes("bonsplans")) cr += 0.0015;
  if (levers.includes("css")) cr += 0.001;
  if (levers.includes("display-networks")) cr += 0.001;
  if (levers.includes("comparateurs")) cr += 0.001;
  if (levers.includes("influence")) cr += 0.0015;
  if (levers.includes("affinitaires")) cr += 0.001;
  if (levers.includes("retention")) cr += 0.002;
  if (levers.includes("content")) cr += 0.001;

  // si aucun levier "fin de tunnel" (cashback + bons plans) → prudence
  if (!levers.includes("cashback") && !levers.includes("bonsplans")) cr *= 0.5;

  // borne supérieure pour rester réaliste
  return Math.min(cr, 0.08);
}

// ---------- CAC projeté pondéré par PDV sectorielle ----------
function projectedCAC(sectorKey, levers, cacClient){
  const pdvAll = SECTORS[sectorKey]?.pdv || SECTORS.other.pdv;
  let pdvSel = {};

  if (levers.length){
    levers.forEach(lv=>{ if (pdvAll[lv]) pdvSel[lv]=pdvAll[lv]; });
    if (!Object.keys(pdvSel).length){
      // fallback égalitaire si aucun mapping PDV pour ces leviers
      levers.forEach(lv=> pdvSel[lv]=1/levers.length);
    }
  } else {
    // si aucun levier, prendre top PDV du secteur (5)
    pdvSel = Object.fromEntries(Object.entries(pdvAll).sort((a,b)=>b[1]-a[1]).slice(0,5));
  }

  pdvSel = normalize(pdvSel);

  let cac=0;
  for(const lv in pdvSel){
    const base = (lv in LEVER_CAC)? LEVER_CAC[lv] : cacClient;
    cac += pdvSel[lv]*base;
  }

  // rapprochement vers le CAC client si trop optimiste
  if (cac < cacClient*0.8) cac = (cac + cacClient)/2;

  return cac;
}

// ---------- Chart data (PDV sectorielle filtrée) ----------
function chartDataFor(sectorKey, levers){
  const pdv = {...(SECTORS[sectorKey]?.pdv || SECTORS.other.pdv)};
  let filtered={};
  if (levers.length){
    levers.forEach(lv=>{ if (pdv[lv]!=null) filtered[lv]=pdv[lv]; });
    if (!Object.keys(filtered).length) filtered=pdv;
  } else filtered=pdv;

  filtered=normalize(filtered);
  const labels=Object.keys(filtered);
  const data=labels.map(k=>filtered[k]);
  return {labels,data};
}

// ---------- MAIN ----------
document.addEventListener("DOMContentLoaded", ()=>{
  const form = document.getElementById("form-simu");
  if (!form) return;

  // budget illimité → désactive le champ
  const unlimited = document.getElementById("unlimited-budget");
  const budgetInput = form.elements["budget"];
  if (unlimited && budgetInput){
    unlimited.addEventListener("change", ()=>{
      if (unlimited.checked){ budgetInput.disabled=true; budgetInput.value=""; }
      else { budgetInput.disabled=false; }
    });
  }

  form.addEventListener("submit", (e)=>{
    e.preventDefault();

    // Inputs
    const traffic = numberOf(form.elements["traffic"].value);
    const aovUser = numberOf(form.elements["aov"].value);
    const cvrUser = numberOf(form.elements["cvr"].value)/100;
    const cacClient = numberOf(form.elements["cac"].value);
    const hasUnlimited = !!(unlimited && unlimited.checked);
    const budgetMensuel = hasUnlimited ? 0 : numberOf(form.elements["budget"].value);
    const sectorKey = form.elements["sector"].value || "other";

    // Leviers cochés
    const levers = Array.from(form.querySelectorAll('input[name="levers"]:checked')).map(n=>n.value);

    // Bases utilisateur (on n’utilise pas les valeurs secteur comme fallback, elles servent au contexte & PDV)
    let aov = adjustAOV(aovUser, levers);
    let cvr = adjustCR(cvrUser, levers);

    // Trafic annualisé
    const annualTraffic = annualAffiliatedTraffic(traffic);

    // Ventes potentielles
    const potentialOrders = annualTraffic * cvr;

    // CAC projeté (pondéré PDV du secteur)
    const cacProj = projectedCAC(sectorKey, levers, cacClient);

    // Budget annuel (si illimité: on ne cappe pas les ventes, mais on calcule un budget théorique pour ROI interne)
    const budgetAnnuel = hasUnlimited ? potentialOrders * cacProj : budgetMensuel * 12;

    // Capping sur ventes si budget défini
    const maxOrdersBudget = hasUnlimited ? potentialOrders : (budgetAnnuel / (cacProj>0?cacProj:1));
    const finalOrders = Math.min(potentialOrders, maxOrdersBudget);

    // CA
    const revenue = finalOrders * aov;

    // ====== Affichage KPI ======
    const results = document.getElementById("results");
    const revSpan = document.getElementById("kpi-revenue");
    const ordSpan = document.getElementById("kpi-orders");
    const budSpan = document.getElementById("kpi-budget");
    const insightsBox = document.getElementById("insights");

    if (results) results.style.display="block";
    if (revSpan) revSpan.textContent = formatEuro(revenue);
    if (ordSpan) ordSpan.textContent = formatInt(finalOrders);
    if (budSpan) budSpan.textContent = hasUnlimited ? "Illimité" : formatEuro(budgetAnnuel);

    // Analyse rapide (AOV vs secteur uniquement)
    const sector = SECTORS[sectorKey] || SECTORS.other;
    const insights=[];
    if (sectorKey!=="other"){
      if (aov > sector.aov*1.1) insights.push(`Votre panier moyen (${formatEuro(aov)}) est supérieur à la moyenne du secteur (${formatEuro(sector.aov)}).`);
      else if (aov < sector.aov*0.9) insights.push(`Votre panier moyen (${formatEuro(aov)}) est inférieur à la moyenne du secteur (${formatEuro(sector.aov)}).`);
      else insights.push(`Votre panier moyen (${formatEuro(aov)}) est cohérent avec la moyenne du secteur (${formatEuro(sector.aov)}).`);
    }
    // Mention montée en puissance + capping
    insights.push(`Année 1 : montée en puissance progressive de votre programme.`);
    if (!hasUnlimited) insights.push(`Votre budget annuel saisi peut plafonner vos performances.`);

    if (insightsBox){
      insightsBox.innerHTML = `<h3>Analyse rapide</h3><ul>${insights.map(t=>`<li>${t}</li>`).join("")}</ul>`;
    }

    // Donut parts de ventes (PDV secteur filtré par leviers cochés)
    const canvas = document.getElementById("chart-levers");
    if (canvas && window.Chart){
      const {labels,data} = chartDataFor(sectorKey, levers);
      if (window.salesChart) window.salesChart.destroy();
      window.salesChart = new Chart(canvas.getContext("2d"), {
        type:"doughnut",
        data:{ labels, datasets:[{ data, backgroundColor:[
          "#3b82f6","#f97316","#22c55e","#eab308","#ef4444","#8b5cf6",
          "#06b6d4","#f43f5e","#10b981","#a855f7","#64748b","#f59e0b"
        ]}]},
        options:{
          responsive:true,
          cutout:"55%",
          plugins:{
            legend:{ position:"right", labels:{ boxWidth:14, font:{ size:12 } } },
            tooltip:{ callbacks:{ label:(ctx)=> `${ctx.label}: ${(ctx.parsed*100).toFixed(1)}%` } },
            datalabels:{ formatter:(v)=> (v*100).toFixed(1)+"%", color:"#fff", font:{weight:"bold",size:11} }
          }
        },
        plugins: (window.ChartDataLabels ? [ChartDataLabels] : [])
      });
    }

    // CTA final
    const cta = document.getElementById("cta-link");
    if (cta){
      cta.innerHTML = `<a href="https://www.lumigency.com/consultation-gratuite" class="cta">🚀 Prenez RDV gratuit pour booster vos performances en affiliation</a>`;
      cta.style.display="block";
    }
  });
});
