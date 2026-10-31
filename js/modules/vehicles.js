import {getApps,getApp,initializeApp} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {getFirestore,collection,doc,getDoc,getDocs,addDoc,setDoc,query,where} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import {firebaseConfig} from "../../firebase-config.js";

const app=getApps().length?getApp():initializeApp(firebaseConfig);
const auth=getAuth(app);
const db=getFirestore(app);
let profile=null,companyId=null,vehicles=[],fuel=[];
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const money=n=>Number(n||0).toFixed(2).replace('.',',')+' zł';
const fmt=s=>s?new Date(s+'T12:00:00').toLocaleDateString('pl-PL'):'—';
const days=s=>s?Math.ceil((new Date(s+'T12:00:00')-new Date(new Date().toISOString().slice(0,10)+'T12:00:00'))/86400000):99999;

function perm(a){return profile?.role==='admin'||profile?.permissions?.vehicles?.[a]===true}
function fuelPerm(a){return profile?.role==='admin'||profile?.permissions?.fuel?.[a]===true}

async function load(){
  if(!auth.currentUser)return;
  try{
    const p=await getDoc(doc(db,'userProfiles',auth.currentUser.uid));
    profile=p.data()||null;
    companyId=profile?.companyId||null;
    if(!companyId||!perm('view')){render();return;}
    const v=await getDocs(query(collection(db,'vehicles'),where('companyId','==',companyId)));
    vehicles=v.docs.map(d=>({id:d.id,...d.data()}));
    fuel=[];
    if(fuelPerm('view')){
      try{
        const f=await getDocs(query(collection(db,'fuel'),where('companyId','==',companyId)));
        fuel=f.docs.map(d=>({id:d.id,...d.data()}));
      }catch(e){console.warn('Paliwo niedostępne w module Samochody:',e);}
    }
    render();
  }catch(e){
    console.error('Błąd modułu Samochody:',e);
    const list=$('vehicleList');
    if(list)list.innerHTML='<div class="v8Alert red">Nie udało się wczytać danych samochodów.</div>';
  }
}

function repairTotal(v){return (v.repairs||[]).reduce((s,r)=>s+Number(r.cost||0),0)}
function fuelTotal(id){return fuel.filter(x=>x.vehicleId===id).reduce((s,x)=>s+Number(x.cost||0),0)}

function render(){
  const list=$('vehicleList');
  if(!list)return;
  if(!perm('view')){
    list.innerHTML='<div class="empty">Brak uprawnienia do modułu Samochody.</div>';
    return;
  }
  const search=($('vehicleSearch')?.value||'').toLowerCase();
  const arr=vehicles.filter(v=>!v.archived&&[v.name,v.brand,v.model,v.reg,v.vin].join(' ').toLowerCase().includes(search));
  const costs=arr.reduce((s,v)=>s+repairTotal(v)+fuelTotal(v.id),0);
  if($('vehicleKpis'))$('vehicleKpis').innerHTML=`<div class="card"><div class="label">Pojazdy</div><div class="stat">${arr.length}</div></div><div class="card"><div class="label">Łączny przebieg</div><div class="stat">${arr.reduce((s,v)=>s+Number(v.mileage||0),0).toLocaleString('pl-PL')} km</div></div><div class="card"><div class="label">Koszty floty</div><div class="stat money">${money(costs)}</div></div>`;
  const alerts=[];
  arr.forEach(v=>{
    const a=days(v.inspectionUntil),b=days(v.insuranceUntil);
    if(a<=30)alerts.push(`${v.name||v.reg}: przegląd ${a<0?'po terminie':`za ${a} dni`} (${fmt(v.inspectionUntil)})`);
    if(b<=30)alerts.push(`${v.name||v.reg}: OC ${b<0?'po terminie':`za ${b} dni`} (${fmt(v.insuranceUntil)})`);
  });
  if($('vehicleAlerts'))$('vehicleAlerts').innerHTML=alerts.map(x=>`<div class="v8Alert red">⚠ ${esc(x)}</div>`).join('');
  list.innerHTML=arr.length?arr.map(v=>`<div class="card"><div class="pageHeader"><div><h3>${esc(v.name||[v.brand,v.model].filter(Boolean).join(' ')||'Pojazd')}</h3><div class="meta">${esc([v.brand,v.model,v.reg].filter(Boolean).join(' • '))}<br>Przebieg: <b>${Number(v.mileage||0).toLocaleString('pl-PL')} km</b> • Przegląd: ${fmt(v.inspectionUntil)} • OC: ${fmt(v.insuranceUntil)}</div></div><div class="stat money">${money(repairTotal(v)+fuelTotal(v.id))}</div></div><div class="toolbar">${perm('edit')?`<button class="secondary smallBtn" onclick="openVehicleForm('${v.id}')">Edytuj</button>`:''}${fuelPerm('view')?`<button class="infoBtn smallBtn" onclick="go('fuelPage');setTimeout(()=>{const f=document.getElementById('fuelVehicleFilter');if(f){f.value='${v.id}';window.renderFuelModule?.()}},100)">Tankowania</button>`:''}</div>${(v.repairs||[]).length?`<h4>Ostatni serwis</h4><div class="meta">${esc((v.repairs||[]).slice(-1)[0].type||'')} • ${fmt((v.repairs||[]).slice(-1)[0].date)} • ${money((v.repairs||[]).slice(-1)[0].cost)}</div>`:''}</div>`).join(''):'<div class="empty">Brak pojazdów.</div>';
}

window.renderVehiclesModule=render;
window.openVehicleForm=id=>{
  if(!(id?perm('edit'):perm('add')))return alert('Brak uprawnienia do '+(id?'edycji':'dodawania')+' pojazdu.');
  const v=vehicles.find(x=>x.id===id)||{};
  const card=$('vehicleFormCard');
  if(!card)return alert('Nie znaleziono formularza pojazdu. Odśwież aplikację.');
  $('vId').value=v.id||'';
  $('vName').value=v.name||'';
  $('vBrand').value=v.brand||'';
  $('vModel').value=v.model||'';
  $('vReg').value=v.reg||'';
  $('vVin').value=v.vin||'';
  $('vYear').value=v.year||'';
  $('vMileage').value=v.mileage||'';
  $('vInspection').value=v.inspectionUntil||'';
  $('vInsurance').value=v.insuranceUntil||'';
  $('vAc').value=v.acUntil||'';
  $('vPolicy').value=v.policy||'';
  $('vStatus').value=v.status||'Aktywny';
  $('vDocs').value=(v.docs||[]).join('\n');
  $('vNotes').value=v.notes||'';
  window._vehicleRepairs=(v.repairs||[]).map(x=>({...x}));
  renderRepairRows();
  card.classList.remove('hidden');
  card.scrollIntoView({behavior:'smooth',block:'start'});
};
window.closeVehicleForm=()=>$('vehicleFormCard')?.classList.add('hidden');
window.addVehicleRepairRow=()=>{window._vehicleRepairs=window._vehicleRepairs||[];window._vehicleRepairs.push({date:new Date().toISOString().slice(0,10),type:'Serwis',mileage:'',cost:'',notes:''});renderRepairRows()};
window.removeVehicleRepairRow=i=>{window._vehicleRepairs.splice(i,1);renderRepairRows()};
window.setVehicleRepair=(i,k,v)=>window._vehicleRepairs[i][k]=v;

function renderRepairRows(){
  const c=$('repairRows');
  if(!c)return;
  c.innerHTML=(window._vehicleRepairs||[]).map((r,i)=>`<div class="materialRow"><input type="date" value="${esc(r.date||'')}" onchange="setVehicleRepair(${i},'date',this.value)"><input placeholder="Serwis / naprawa" value="${esc(r.type||'')}" oninput="setVehicleRepair(${i},'type',this.value)"><input type="number" placeholder="km" value="${esc(r.mileage||'')}" oninput="setVehicleRepair(${i},'mileage',this.value)"><input type="number" step="0.01" placeholder="koszt" value="${esc(r.cost||'')}" oninput="setVehicleRepair(${i},'cost',this.value)"><input placeholder="uwagi" value="${esc(r.notes||'')}" oninput="setVehicleRepair(${i},'notes',this.value)"><button class="danger smallBtn" onclick="removeVehicleRepairRow(${i})">×</button></div>`).join('')||'<div class="meta">Brak wpisów serwisowych.</div>';
}

window.saveVehicleRecord=async()=>{
  const id=$('vId').value;
  if(!(id?perm('edit'):perm('add')))return alert('Brak uprawnienia.');
  const data={companyId,ownerUid:profile?.ownerUid||auth.currentUser.uid,name:$('vName').value.trim(),brand:$('vBrand').value.trim(),model:$('vModel').value.trim(),reg:$('vReg').value.trim(),vin:$('vVin').value.trim(),year:Number($('vYear').value||0),mileage:Number($('vMileage').value||0),inspectionUntil:$('vInspection').value,insuranceUntil:$('vInsurance').value,acUntil:$('vAc').value,policy:$('vPolicy').value.trim(),status:$('vStatus').value,docs:$('vDocs').value.split(/\n/).map(x=>x.trim()).filter(Boolean),notes:$('vNotes').value.trim(),repairs:(window._vehicleRepairs||[]).map(r=>({...r,mileage:Number(r.mileage||0),cost:Number(r.cost||0)})),updatedAt:new Date().toISOString()};
  if(!data.name&&!data.reg)return alert('Podaj nazwę lub numer rejestracyjny.');
  if(id)await setDoc(doc(db,'vehicles',id),data,{merge:true});else await addDoc(collection(db,'vehicles'),{...data,createdAt:new Date().toISOString()});
  closeVehicleForm();
  await load();
};

onAuthStateChanged(auth,u=>{if(u)setTimeout(load,250);else{profile=null;companyId=null;vehicles=[];fuel=[]}});
window.SerwisantModules=window.SerwisantModules||{};
window.SerwisantModules.vehicles={name:'Samochody',version:'10.8.1',loaded:true,reload:load};