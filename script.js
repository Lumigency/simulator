console.log("script.js charge");

// ===== Secteurs (fallback si AOV/CR vides) =====
const SECTOR_DEFAULTS = {
  fashion: { aov: 67, cvr: 0.0155, label: "Mode & Beauté" },
  electronics: { aov: 111, cvr: 0.017, label: "Électronique & High-tech" },
  home: { aov: 113, cvr: 0.016, label: "Maison & Décoration" },
  food: { aov: 81, cvr: 0.022, label: "Alimentaire & Boissons" },
  sports: { aov: 79, cvr: 0.011, label: "Sport & Loisirs" },
  travel: { aov: 172, cvr: 0.013, label: "Voyage & Tourisme" },
  luxury: { aov: 200, cvr: 0.012, label: "Luxe & Bijoux" },
  auto: { aov: 86, cvr: 0.017, label: "Automobile" },
  services: { aov: 60, cvr: 0.018, label: "Services / B2B / SaaS" },
  other: { aov: 80, cvr: 0.015, label: "Autre" }
};

// ===== Règles leviers (impact CR en points, AOV en %, CAC en % du CAC global) =====
const LEVER_RULES = {
  cashback:          { crPt: 0.20, aovPct: -0.05, cacMul: 0.40 },
  bonsplans:         { crPt: 0.30, aovPct: -0.10, cacMul: 0.20 },
  retargeting:       { crPt: 0.15, aovPct:  0.00, cacMul: 0.30 },
  css:               { crPt: 0.10, aovPct:  0.00, cacMul: 0.65 },
  comparateurs:      { crPt: 0.00, aovPct:  0.00, cacMul: 0.65 },
  "display-networks":{ crPt: 0.00, aovPct:  0.00, cacMul: 0.30 },
  display:           { crPt: 0.00, aovPct:  0.00, cacMul: 0.60 },
  retention:         { crPt: 0.05, aovPct:  0.05, cacMul: 0.15 },
  content:           { crPt: 0.05, aovPct:  0.03, cacMul: 1.00 },
  emailing:          { crPt: 0.10, aovPct:  0.02, cacMul: 0.50 },
  ppc:               { crPt: 0.25, aovPct:  0.00, cacMul: 1.00 },
  affinitaires:      { crPt: 0.05, aovPct:  0.05, cacMul: 0.90 },
  influence:         { crPt: 0.10, aovPct:  0.05, cacMul: 1.20 }
};

// ===== Part de voix ventes par levier (normalisées sur les leviers cochés) =====
const LEVER_SOV = {
  cashback: 25, bonsplans: 20, retargeting: 15, comparateurs: 15, css: 10,
  "display-networks": 8, display: 6, emailing: 7, influence: 7,
  retention: 4, content: 3, affinitaires: 4, ppc: 6
};

// ===== Trafic annualisé (tes nouveaux paliers) =====
function annualAffiliatedTraffic(m) {
  if (m < 10000)   return m * (0.10 * 6 + 0.12 * 6);  // <10k
  if (m < 50000)   return m * (0.12 * 6 + 0.14 * 6);  // <50k
  if (m < 100000)  return m * 0.15 * 12;              // 50–100k
  if (m < 500000)  return m * 0.18 * 12;              // 100–500k
  return m * 0.20 * 12;                                // ≥500k
}

// ===== Helpers =====
function num(v){const n=parseFloat(String(v).replace(",","."));return isNaN(n)?0:n;}
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
function fmtEUR(n){return new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n);}
function fmtInt(n){return new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(Math.round(n));}

// ===== Chart (donut compact, légende droite, % dans les parts) =====
let leversChart=null;
function renderChart(labels, values){
  const el=document.getElementById("chart-levers");
  if(!el) return;
  const ctx=el.getContext("2d");
  if (leversChart){leversChart.destroy(); leversChart=null;}

  // calc % pour datalabels
  const total=values.reduce((a,b)=>a+b,0)||1;
  // Enregistre le plugin datalabels si présent
  if (window.ChartDataLabels) { Chart.register(window.ChartDataLabels); }

  leversChart=new Chart(ctx,{
    type:"doughnut",
    data:{
      labels,
      datasets:[{
        data: values,
        backgroundColor:["#4e79a7","#f28e2b","#e15759","#76b7b2","#59a14f","#edc949",
                         "#af7aa1","#ff9da7","#9c755f","#bab0ac","#7f7f7f","#5f9ea0"]
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      cutout:"70%", // anneau plus fin
      plugins:{
        legend:{ position:"right", labels:{ boxWidth:12, font:{ size:12 } } },
        tooltip:{ callbacks:{
          label:(ctx)=>`${ctx.label}: ${fmtInt(ctx.raw)} ventes (${((ctx.raw/total)*100).toFixed(1)}%)`
        }},
        datalabels: window.ChartDataLabels ? {
          color:"#333",
          font:{ size:11 },
          formatter:(v)=> `${((v/total)*100).toFixed(0)}%`
        } : undefined
      }
    }
  });
}

// ===== Calcul principal =====
document.addEventListener("DOMContentLoaded",()=>{
  const form=document.getElementById("form-simu");
  if(!form) return;

  form.addEventListener("submit",(e)=>{
    e.preventDefault();

    // Inputs
    const trafficMonthly=num(form.elements["traffic"]?.value);
    const aovInput=num(form.elements["aov"]?.value);
    const cvrPct=num(form.elements["cvr"]?.value);
    const cacGlobal=num(form.elements["cac"]?.value);
    const budgetMonthly=num(form.elements["budget"]?.value);
    const sectorKey=form.elements["sector"]?.value||"other";
    const sector=SECTOR_DEFAULTS[sectorKey]||SECTOR_DEFAULTS.other;

    const selectedLevers=Array.from(form.querySelectorAll('input[name="levers"]:checked')).map(n=>n.value);

    // Base AOV / CVR
    const baseAOV = aovInput>0 ? aovInput : sector.aov;
    const baseCVR = (cvrPct>0 ? cvrPct : sector.cvr*100)/100; // ratio

    // Montée en charge (année 1 prudente)
    const RAMP=0.60;

    // Trafic affilié annuel
    const clicksYear=annualAffiliatedTraffic(trafficMonthly);

    // CR ajusté (additif en points, plafonné par couverture leviers)
    let crBoostPts=0;
    selectedLevers.forEach(lv=>{ if(LEVER_RULES[lv]) crBoostPts+=LEVER_RULES[lv].crPt; });
    const n=selectedLevers.length;
    const cap = n<=3 ? 0.4 : n<=6 ? 0.8 : n<=9 ? 1.2 : 1.5; // cap en points
    crBoostPts=Math.min(crBoostPts,cap);
    const cvr = clamp(baseCVR + crBoostPts/100, 0.0015, 0.03); // 0.15%–3%

    // AOV par levier (on appliquera par levier, pas global)
    // CAC par levier = cacGlobal * mul, avec garde-fou
    const minCAC = cacGlobal*0.8, maxCAC = cacGlobal*1.5;

    // Répartition SOV ventes entre leviers sélectionnés
    const active = selectedLevers.filter(lv=>LEVER_SOV[lv]!=null);
    const sovSum = active.reduce((s,lv)=>s+(LEVER_SOV[lv]||0),0) || 1;

    // Ventes potentielles globales (avant budget)
    const potentialOrders = clicksYear * cvr * RAMP;

    // Construire les ventes / coûts / CA par levier
    let rows=[];
    active.forEach(lv=>{
      const share = (LEVER_SOV[lv]||0)/sovSum;          // part %
      const ordersPot = potentialOrders * share;        // ventes potentielles pour ce levier
      const rule = LEVER_RULES[lv] || {aovPct:0, cacMul:1};
      const aovLv = baseAOV * (1 + (rule.aovPct||0));   // AOV spécifique
      let cacLv = cacGlobal * (rule.cacMul||1);
      cacLv = clamp(cacLv, minCAC, maxCAC);             // garde-fou CAC
      const costPot = ordersPot * cacLv;                // coût potentiel
      const revPot  = ordersPot * aovLv;

      rows.push({ lv, share, ordersPot, aovLv, cacLv, costPot, revPot });
    });

    // Si aucun levier coché -> tout en "Autres"
    if (rows.length===0){
      const aovLv=baseAOV, cacLv=clamp(cacGlobal, minCAC, maxCAC);
      rows=[{lv:"Autres", share:1, ordersPot:potentialOrders, aovLv, cacLv,
             costPot:potentialOrders*cacLv, revPot:potentialOrders*aovLv}];
    }

    // Cap par budget : scale down uniforme pour tenir dans le budget annuel
    const budgetYear=budgetMonthly*12;
    const totalCostPot=rows.reduce((s,r)=>s+r.costPot,0);
    const scale = totalCostPot>0 ? Math.min(1, budgetYear/totalCostPot) : 1;

    rows = rows.map(r=>{
      const orders = r.ordersPot * scale;
      const cost   = r.costPot * scale;
      const rev    = r.revPot  * scale;
      return {...r, orders, cost, rev};
    });

    // Totaux
    const finalOrders = rows.reduce((s,r)=>s+r.orders,0);
    const budgetUsed  = rows.reduce((s,r)=>s+r.cost,0);
    const finalRevenue= rows.reduce((s,r)=>s+r.rev,0);

    // KPIs
    document.getElementById("kpi-revenue").textContent = fmtEUR(finalRevenue);
    document.getElementById("kpi-orders").textContent  = fmtInt(finalOrders);
    document.getElementById("kpi-budget").textContent  = fmtEUR(budgetYear);

    // Analyse sobre (une info clé : panier)
    const insightPanier =
      baseAOV > sector.aov*1.1 ? `Panier moyen supérieur au repère secteur (${fmtEUR(baseAOV)} vs ${fmtEUR(sector.aov)}).`
      : baseAOV < sector.aov*0.9 ? `Panier moyen inférieur au repère secteur (${fmtEUR(baseAOV)} vs ${fmtEUR(sector.aov)}).`
      : `Panier moyen cohérent avec votre secteur (${fmtEUR(baseAOV)} vs ${fmtEUR(sector.aov)}).`;

    document.getElementById("insights").innerHTML =
      `<h3>Analyse rapide</h3><ul>
         <li>${insightPanier}</li>
         <li>Taux de conversion simulé : ${(cvr*100).toFixed(2)} % (année 1 avec montée en charge).</li>
         <li>Le budget annuel saisi (${fmtEUR(budgetYear)}) borne automatiquement les volumes.</li>
       </ul>`;

    // Chart : % par levier (sur les ventes finales)
    const labels = rows.map(r=>labelPretty(r.lv));
    const vals   = rows.map(r=>r.orders);
    renderChart(labels, vals);

    document.getElementById("results").style.display="block";
  });
});

// ===== util =====
function labelPretty(k){
  const map={
    cashback:"Cashback", bonsplans:"Bons plans", retargeting:"Retargeting",
    css:"CSS", comparateurs:"Comparateurs", "display-networks":"Display networks",
    display:"Display", retention:"Rétention on-site", content:"Content commerce",
    emailing:"Emailing / NL", ppc:"PPC / SEA", affinitaires:"Affinitaires", influence:"Influence", "Autres":"Autres"
  };
  return map[k]||k;
}
