const form = document.getElementById('form-simu');
form.addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(form);
  const payload = {
    traffic: Number(fd.get('traffic')) || 0,
    budget: Number(fd.get('budget')) || 0,
    aov: Number(fd.get('aov')) || 0,
    cvr: Number(fd.get('cvr')) || 0,
    levers: fd.getAll('levers'),
    sector: fd.get('sector'),
    objective: fd.get('objective'),
    hybrid: fd.get('hybrid'),
    email: fd.get('email')
  };

  const res = await fetch('/api/simulate', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
  const data = await res.json();

  // Affichage résultats
  document.getElementById('results').style.display = 'block';
  document.getElementById('kpi-revenue').textContent =
    new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(data.revenue);
  document.getElementById('kpi-orders').textContent = Math.round(data.orders);
  document.getElementById('kpi-cost').textContent =
    new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(data.cost);
  document.getElementById('kpi-cac').textContent =
    new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(data.cac);

  // Analyse dynamique simplifiée
  let analysis = "";
  if (payload.traffic < 10000) {
    analysis = "🌱 Avec un trafic limité, les résultats seront modestes mais l’affiliation peut rester un test intéressant.";
  } else if (payload.traffic > 50000 && payload.levers.includes("cashback")) {
    analysis = "🚀 Votre potentiel est élevé ! Les leviers de masse peuvent générer un volume significatif.";
  } else if (!payload.levers.includes("cashback") && !payload.levers.includes("bonsplans")) {
    analysis = "⚡ Sans leviers de volume (cashback, bons plans), vos conversions risquent de rester limitées.";
  } else {
    analysis = "🎯 Vos résultats montrent un potentiel intéressant, à adapter selon vos objectifs.";
  }
  document.getElementById('analysis').textContent = analysis;

  // Recos
  const recoList = document.getElementById('reco-list');
  recoList.innerHTML = '';
  (data.recommendations || []).forEach(r=>{
    let li=document.createElement('li');
    li.textContent=r;
    recoList.appendChild(li);
  });
});
