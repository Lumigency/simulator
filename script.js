const form=document.getElementById('form-simu');
form.addEventListener('submit',async e=>{
 e.preventDefault();
 const fd=new FormData(form);
 const payload={
  traffic:Number(fd.get('traffic'))||0,
  budget:Number(fd.get('budget'))||0,
  aov:Number(fd.get('aov'))||0,
  cvr:Number(fd.get('cvr'))||0,
  levers:fd.getAll('levers')
 };
 const res=await fetch('/api/simulate',{
   method:'POST',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify(payload)
 });
 const data=await res.json();
 document.getElementById('results').style.display='block';
 document.getElementById('kpi-revenue').textContent=new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(data.revenue);
 document.getElementById('kpi-orders').textContent=Math.round(data.orders);
 document.getElementById('kpi-cost').textContent=new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(data.cost);
 document.getElementById('kpi-cac').textContent=new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(data.cac);
 const recoList=document.getElementById('reco-list');
 recoList.innerHTML='';
 (data.recommendations||[]).forEach(r=>{
   let li=document.createElement('li');
   li.textContent=r;
   recoList.appendChild(li);
 });
});
