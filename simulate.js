export const config = { runtime: 'edge' };

function compute(inputs){
 let {traffic=0,budget=0,aov=50,cvr=2,levers=[]}=inputs||{};
 let orders=traffic*0.15*(cvr/100);
 let revenue=orders*aov;
 let cost=revenue*0.1;
 let cac=orders>0?cost/orders:0;
 return {revenue,orders,cost,cac,recommendations:["Simulation simple active"]};
}

export default async function handler(req){
 if(req.method!=="POST"){
   return new Response(JSON.stringify({error:"Méthode non autorisée"}),{status:405});
 }
 const body=await req.json();
 const out=compute(body||{});
 return new Response(JSON.stringify(out),{
   status:200,
   headers:{"content-type":"application/json"}
 });
}
