import {getApps,getApp,initializeApp} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {getFirestore,collection,doc,getDoc,getDocs,addDoc,setDoc,query,where} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import {firebaseConfig} from "../../firebase-config.js";
const app=getApps().length?getApp():initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
let profile=null,companyId=null,vehicles=[],rows=[];
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m])),money=n=>Number(n||0).toFixed(2).replace('.',',')+' zł',fmt=s=>s?new Date(s+'T12:00:00').toLocaleDateString('pl-PL'):'—',num=v=>Number(String(v??'').replace(',','.'))||0;
function perm(a){return profile?.role==='admin'||profile?.permissions?.fuel?.[a]===true}
function vname(id){let v=vehicles.find(x=>x.id===id);return v?.name||v?.reg||[v?.brand,v?.model].filter(Boolean).join(' ')||'Pojazd'}
async function load(){if(!auth.currentUser)return;try{let p=await getDoc(doc(db,'userProfiles',auth.currentUser.uid));profile=p.data()||null;companyId=profile?.companyId||null;if(!companyId||!perm('view'))return;let [vs,fs]=await Promise.all([getDocs(query(collection(db,'vehicles'),where('companyId','==',companyId))),getDocs(query(collection(db,'fuel'),where('companyId','==',companyId)))]);vehicles=vs.docs.map(d=>({id:d.id,...d.data()}));rows=fs.docs.map(d=>({id:d.id,...d.data()}));fill();render()}catch(e){console.error('Fuel module load error',e);let c=$('fuelList');if(c)c.innerHTML='<div class="empty">Nie udało się wczytać danych paliwa.</div>'}}
function fill(){for(const id of ['fuelVehicleFilter','fVehicle']){let e=$(id);if(!e)continue;let first=id==='fuelVehicleFilter'?'<option value="">Wszystkie</option>':'<option value="">— wybierz —</option>';let cur=e.value;e.innerHTML=first+vehicles.filter(v=>!v.archived).map(v=>`<option value="${v.id}">${esc(vname(v.id))}</option>`).join('');e.value=cur}if($('fuelMonthFilter')&&!$('fuelMonthFilter').value)$('fuelMonthFilter').value=new Date().toISOString().slice(0,7)}
function statsForVehicle(id,mon=''){
  const list=rows.filter(x=>!x.archived&&x.vehicleId===id&&num(x.mileage)>0).sort((a,b)=>num(a.mileage)-num(b.mileage));
  const full=list.filter(x=>x.full);
  if(full.length<2)return{consumption:null,cost100:null,km:null,cycles:0};
  let liters=0,cost=0,km=0,cycles=0;
  for(let i=1;i<full.length;i++){
    const prev=full[i-1],cur=full[i];
    if(mon&&!(cur.date||'').startsWith(mon))continue;
    const distance=num(cur.mileage)-num(prev.mileage);
    if(distance<=0)continue;
    const between=list.filter(x=>num(x.mileage)>num(prev.mileage)&&num(x.mileage)<=num(cur.mileage));
    const intervalLiters=between.reduce((s,x)=>s+num(x.liters),0);
    const intervalCost=between.reduce((s,x)=>s+num(x.cost),0);
    if(intervalLiters<=0)continue;
    km+=distance;liters+=intervalLiters;cost+=intervalCost;cycles++;
  }
  return{consumption:km?liters/km*100:null,cost100:km?cost/km*100:null,km:km||null,cycles};
}
function prevMileage(x){return rows.filter(r=>!r.archived&&r.vehicleId===x.vehicleId&&r.id!==x.id&&num(r.mileage)>0&&num(r.mileage)<num(x.mileage)).sort((a,b)=>num(b.mileage)-num(a.mileage))[0]?.mileage||null}
function render(){
  let c=$('fuelList');if(!c)return;
  let vid=$('fuelVehicleFilter')?.value||'',mon=$('fuelMonthFilter')?.value||'';
  let list=rows.filter(x=>!x.archived&&(!vid||x.vehicleId===vid)&&(!mon||(x.date||'').startsWith(mon))).sort((a,b)=>(b.date||'').localeCompare(a.date||'')||num(b.mileage)-num(a.mileage));
  let liters=list.reduce((s,x)=>s+num(x.liters),0),cost=list.reduce((s,x)=>s+num(x.cost),0);
  let st=vid?statsForVehicle(vid,mon):{consumption:null,cost100:null,km:null,cycles:0};
  let k=$('fuelKpis');if(k)k.innerHTML=`<div class="card"><div class="label">Litry w okresie</div><div class="stat">${liters.toFixed(1)} l</div></div><div class="card"><div class="label">Koszt w okresie</div><div class="stat money">${money(cost)}</div></div><div class="card"><div class="label">Śr. spalanie</div><div class="stat">${st.consumption!=null?st.consumption.toFixed(2)+' l/100 km':'—'}</div><div class="meta">${vid&&st.cycles?`${st.cycles} pełnych cykli • ${Number(st.km||0).toLocaleString('pl-PL')} km`:'wybierz pojazd i min. 2 tankowania do pełna'}</div></div><div class="card"><div class="label">Koszt / 100 km</div><div class="stat money">${st.cost100!=null?money(st.cost100):'—'}</div></div>`;
  c.innerHTML=list.length?list.map(x=>{let pm=prevMileage(x),d=pm?num(x.mileage)-num(pm):null;return `<div class="item"><h3>${esc(vname(x.vehicleId))} — ${fmt(x.date)}</h3><div class="meta">${num(x.liters).toFixed(2)} l • ${money(x.cost)} • ${num(x.mileage).toLocaleString('pl-PL')} km ${x.full?'• pełny bak':'• niepełny'}${d>0?` • od poprzedniego: ${d.toLocaleString('pl-PL')} km`:''}<br>${esc(x.notes||'')}</div><div class="toolbar">${perm('edit')?`<button class="secondary smallBtn" onclick="openFuelForm('${x.id}')">Edytuj</button>`:''}${perm('delete')?`<button class="danger smallBtn" onclick="archiveFuel('${x.id}')">Do kosza</button>`:''}</div></div>`}).join(''):'<div class="empty">Brak tankowań dla wybranego okresu.</div>';
}
window.renderFuelModule=render;
window.archiveFuel=async id=>{if(!perm('delete'))return alert('Brak uprawnienia.');if(!confirm('Przenieść tankowanie do Kosza?'))return;await setDoc(doc(db,'fuel',id),{archived:true,archivedAt:new Date().toISOString()},{merge:true});await load();window.SerwisantModules?.vehicles?.reload?.();window.renderTrash?.()};
window.calcFuelCost=()=>{let l=num($('fLiters')?.value),p=num($('fPrice')?.value);if($('fCost'))$('fCost').value=l>0&&p>0?(l*p).toFixed(2):''};
window.openFuelForm=id=>{if(!(id?perm('edit'):perm('add')))return alert('Brak uprawnienia.');let x=rows.find(r=>r.id===id)||{};$('fId').value=x.id||'';fill();$('fVehicle').value=x.vehicleId||$('fuelVehicleFilter')?.value||'';$('fDate').value=x.date||new Date().toISOString().slice(0,10);$('fMileage').value=x.mileage||'';$('fLiters').value=x.liters||'';$('fPrice').value=x.price||'';$('fCost').value=x.cost||'';$('fFull').checked=!!x.full;$('fNotes').value=x.notes||'';$('fuelFormTitle').textContent=id?'Edytuj tankowanie':'Nowe tankowanie';$('fuelFormCard').classList.remove('hidden');$('fuelFormCard').scrollIntoView({behavior:'smooth'})};
window.closeFuelForm=()=>$('fuelFormCard')?.classList.add('hidden');
window.saveFuelRecord=async()=>{let id=$('fId').value;if(!(id?perm('edit'):perm('add')))return alert('Brak uprawnienia.');let liters=num($('fLiters').value),price=num($('fPrice').value),cost=num($('fCost').value)||liters*price,mileage=num($('fMileage').value),vehicleId=$('fVehicle').value,date=$('fDate').value;if(!vehicleId||!date||liters<=0)return alert('Wybierz pojazd, datę i wpisz litry.');if(mileage<=0)return alert('Wpisz aktualny przebieg pojazdu.');let data={companyId,ownerUid:profile?.ownerUid||auth.currentUser.uid,vehicleId,date,mileage,liters,price,cost:Number(cost.toFixed(2)),full:$('fFull').checked,notes:$('fNotes').value.trim(),updatedAt:new Date().toISOString()};try{if(id)await setDoc(doc(db,'fuel',id),data,{merge:true});else await addDoc(collection(db,'fuel'),{...data,createdAt:new Date().toISOString()});closeFuelForm();await load();window.SerwisantModules?.vehicles?.reload?.()}catch(e){console.error('Fuel save error',e);alert('Nie udało się zapisać tankowania.')}};
onAuthStateChanged(auth,u=>{if(u)setTimeout(load,200);else{profile=null;companyId=null;rows=[]}});
window.SerwisantModules=window.SerwisantModules||{};window.SerwisantModules.fuel={name:'Paliwo',version:'10.10',loaded:true,reload:load};