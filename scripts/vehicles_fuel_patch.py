from pathlib import Path
import json

# --- pages.json ---
pages_path=Path('js/core/pages.json')
pages=json.loads(pages_path.read_text(encoding='utf-8'))
existing={p['id'] for p in pages}
insert_at=next((i for i,p in enumerate(pages) if p['id']=='reports'),len(pages))
new=[]
if 'vehiclesPage' not in existing:new.append({'id':'vehiclesPage','file':'./partials/pages/vehiclesPage.html'})
if 'fuelPage' not in existing:new.append({'id':'fuelPage','file':'./partials/pages/fuelPage.html'})
pages[insert_at:insert_at]=new
pages_path.write_text(json.dumps(pages,ensure_ascii=False,indent=2)+"\n",encoding='utf-8')

# --- dashboard tiles ---
dash=Path('partials/pages/dashboard.html')
s=dash.read_text(encoding='utf-8')
anchor='<button class="moduleTile" onclick="go(\'reports\')">'
if "go('vehiclesPage')" not in s:
    tiles='''<button class="moduleTile" onclick="go('vehiclesPage')"><span class="moduleIcon greenI">🚐</span><span class="moduleText"><b>Samochody</b><small>Pojazdy, przebieg, przeglądy, OC i serwis</small></span></button>\n<button class="moduleTile" onclick="go('fuelPage')"><span class="moduleIcon goldI">⛽</span><span class="moduleText"><b>Paliwo</b><small>Tankowania, spalanie i koszty paliwa</small></span></button>\n'''
    if anchor not in s: raise SystemExit('dashboard anchor missing')
    s=s.replace(anchor,tiles+anchor,1)
dash.write_text(s,encoding='utf-8')

# --- core permission page mapping ---
app=Path('js/core/app.js')
s=app.read_text(encoding='utf-8')
old="trashPage:'trash',settings:'settings'};"
new="trashPage:'trash',settings:'settings',vehiclesPage:'vehicles',fuelPage:'fuel'};"
if new not in s:
    if old not in s: raise SystemExit('CORE_MODULES anchor missing')
    s=s.replace(old,new,1)
app.write_text(s,encoding='utf-8')

# --- vehicles page ---
Path('partials/pages/vehiclesPage.html').write_text('''<section class="page" id="vehiclesPage">
<div class="pageHomeBar"><button class="secondary" onclick="go('dashboard')">← Strona główna</button></div>
<div class="pageHeader"><div><h2>🚐 Samochody</h2><div class="meta">Flota firmy, terminy, przebieg, serwis i koszty.</div></div><button onclick="openVehicleForm()">+ Dodaj pojazd</button></div>
<div id="vehicleAlerts"></div>
<div class="grid homeKpis" id="vehicleKpis"></div>
<div class="card"><input id="vehicleSearch" placeholder="Szukaj po nazwie, rejestracji, VIN..." oninput="renderVehiclesModule()"></div>
<div id="vehicleList"></div>
<div class="card hidden" id="vehicleFormCard">
<h3 id="vehicleFormTitle">Pojazd</h3><input type="hidden" id="vId">
<div class="grid3"><div><label>Nazwa</label><input id="vName" placeholder="np. Ducato"></div><div><label>Marka</label><input id="vBrand" placeholder="Fiat"></div><div><label>Model</label><input id="vModel"></div></div>
<div class="grid3"><div><label>Nr rejestracyjny</label><input id="vReg"></div><div><label>VIN</label><input id="vVin"></div><div><label>Rok</label><input id="vYear" type="number"></div></div>
<div class="grid3"><div><label>Przebieg [km]</label><input id="vMileage" type="number"></div><div><label>Przegląd techniczny do</label><input id="vInspection" type="date"></div><div><label>OC do</label><input id="vInsurance" type="date"></div></div>
<div class="grid3"><div><label>AC do</label><input id="vAc" type="date"></div><div><label>Nr polisy</label><input id="vPolicy"></div><div><label>Status</label><select id="vStatus"><option>Aktywny</option><option>Serwis</option><option>Wyłączony</option></select></div></div>
<label>Linki do dokumentów / zdjęć — jeden w linii</label><textarea id="vDocs" placeholder="Dowód rejestracyjny: https://...&#10;Zdjęcie auta: https://..."></textarea>
<label>Notatki</label><textarea id="vNotes"></textarea>
<h3>Serwis / naprawy</h3><div id="repairRows"></div><button class="secondary smallBtn" onclick="addVehicleRepairRow()">+ Dodaj wpis serwisowy</button>
<div class="toolbar"><button onclick="saveVehicleRecord()">Zapisz</button><button class="secondary" onclick="closeVehicleForm()">Anuluj</button></div>
</div>
</section>''',encoding='utf-8')

# --- fuel page ---
Path('partials/pages/fuelPage.html').write_text('''<section class="page" id="fuelPage">
<div class="pageHomeBar"><button class="secondary" onclick="go('dashboard')">← Strona główna</button></div>
<div class="pageHeader"><div><h2>⛽ Paliwo</h2><div class="meta">Tankowania, koszt paliwa i średnie spalanie.</div></div><button onclick="openFuelForm()">+ Dodaj tankowanie</button></div>
<div class="grid homeKpis" id="fuelKpis"></div>
<div class="card"><div class="row"><div><label>Pojazd</label><select id="fuelVehicleFilter" onchange="renderFuelModule()"><option value="">Wszystkie</option></select></div><div><label>Miesiąc</label><input id="fuelMonthFilter" type="month" onchange="renderFuelModule()"></div></div></div>
<div id="fuelList"></div>
<div class="card hidden" id="fuelFormCard"><h3>Tankowanie</h3><input type="hidden" id="fId"><div class="grid3"><div><label>Pojazd</label><select id="fVehicle"></select></div><div><label>Data</label><input id="fDate" type="date"></div><div><label>Przebieg [km]</label><input id="fMileage" type="number"></div></div><div class="grid3"><div><label>Litry</label><input id="fLiters" type="number" step="0.01"></div><div><label>Cena / l [zł]</label><input id="fPrice" type="number" step="0.01"></div><div><label>Koszt [zł]</label><input id="fCost" type="number" step="0.01"></div></div><label style="display:flex;gap:8px;align-items:center"><input id="fFull" type="checkbox" style="width:auto"> Tankowanie do pełna</label><label>Stacja / uwagi</label><input id="fNotes"><div class="toolbar"><button onclick="saveFuelRecord()">Zapisz</button><button class="secondary" onclick="closeFuelForm()">Anuluj</button></div></div>
</section>''',encoding='utf-8')

# --- vehicles module ---
Path('js/modules/vehicles.js').write_text(r'''import {getApps,getApp,initializeApp} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {getFirestore,collection,doc,getDoc,getDocs,addDoc,setDoc,query,where} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import {firebaseConfig} from "../../firebase-config.js";
const app=getApps().length?getApp():initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
let profile=null,companyId=null,vehicles=[],fuel=[],repairs=[];
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const money=n=>Number(n||0).toFixed(2).replace('.',',')+' zł',fmt=s=>s?new Date(s+'T12:00:00').toLocaleDateString('pl-PL'):'—';
const days=s=>s?Math.ceil((new Date(s+'T12:00:00')-new Date(new Date().toISOString().slice(0,10)+'T12:00:00'))/86400000):99999;
function perm(a){return profile?.role==='admin'||profile?.permissions?.vehicles?.[a]===true}
async function load(){if(!auth.currentUser)return;let p=await getDoc(doc(db,'userProfiles',auth.currentUser.uid));profile=p.data()||null;companyId=profile?.companyId||null;if(!companyId||!perm('view'))return;let [v,f]=await Promise.all([getDocs(query(collection(db,'vehicles'),where('companyId','==',companyId))),getDocs(query(collection(db,'fuel'),where('companyId','==',companyId)))]);vehicles=v.docs.map(d=>({id:d.id,...d.data()}));fuel=f.docs.map(d=>({id:d.id,...d.data()}));render();}
function repairTotal(v){return (v.repairs||[]).reduce((s,r)=>s+Number(r.cost||0),0)}
function fuelTotal(id){return fuel.filter(x=>x.vehicleId===id).reduce((s,x)=>s+Number(x.cost||0),0)}
function render(){let list=$('vehicleList');if(!list)return;let search=($('vehicleSearch')?.value||'').toLowerCase();let arr=vehicles.filter(v=>!v.archived&&[v.name,v.brand,v.model,v.reg,v.vin].join(' ').toLowerCase().includes(search));let costs=arr.reduce((s,v)=>s+repairTotal(v)+fuelTotal(v.id),0);$('vehicleKpis').innerHTML=`<div class="card"><div class="label">Pojazdy</div><div class="stat">${arr.length}</div></div><div class="card"><div class="label">Łączny przebieg</div><div class="stat">${arr.reduce((s,v)=>s+Number(v.mileage||0),0).toLocaleString('pl-PL')} km</div></div><div class="card"><div class="label">Koszty floty</div><div class="stat money">${money(costs)}</div></div>`;let alerts=[];arr.forEach(v=>{let a=days(v.inspectionUntil),b=days(v.insuranceUntil);if(a<=30)alerts.push(`${v.name||v.reg}: przegląd ${a<0?'po terminie':`za ${a} dni`} (${fmt(v.inspectionUntil)})`);if(b<=30)alerts.push(`${v.name||v.reg}: OC ${b<0?'po terminie':`za ${b} dni`} (${fmt(v.insuranceUntil)})`)});$('vehicleAlerts').innerHTML=alerts.map(x=>`<div class="v8Alert red">⚠ ${esc(x)}</div>`).join('');list.innerHTML=arr.length?arr.map(v=>`<div class="card"><div class="pageHeader"><div><h3>${esc(v.name||[v.brand,v.model].filter(Boolean).join(' ')||'Pojazd')}</h3><div class="meta">${esc([v.brand,v.model,v.reg].filter(Boolean).join(' • '))}<br>Przebieg: <b>${Number(v.mileage||0).toLocaleString('pl-PL')} km</b> • Przegląd: ${fmt(v.inspectionUntil)} • OC: ${fmt(v.insuranceUntil)}</div></div><div class="stat money">${money(repairTotal(v)+fuelTotal(v.id))}</div></div><div class="toolbar">${perm('edit')?`<button class="secondary smallBtn" onclick="openVehicleForm('${v.id}')">Edytuj</button>`:''}<button class="infoBtn smallBtn" onclick="go('fuelPage');setTimeout(()=>{document.getElementById('fuelVehicleFilter').value='${v.id}';renderFuelModule()},100)">Tankowania</button></div>${(v.repairs||[]).length?`<h4>Ostatni serwis</h4><div class="meta">${esc((v.repairs||[]).slice(-1)[0].type||'')} • ${fmt((v.repairs||[]).slice(-1)[0].date)} • ${money((v.repairs||[]).slice(-1)[0].cost)}</div>`:''}</div>`).join(''):'<div class="empty">Brak pojazdów.</div>'}
window.renderVehiclesModule=render;
window.openVehicleForm=id=>{if(!(id?perm('edit'):perm('add')))return alert('Brak uprawnienia.');let v=vehicles.find(x=>x.id===id)||{};$('vId').value=v.id||'';$('vName').value=v.name||'';$('vBrand').value=v.brand||'';$('vModel').value=v.model||'';$('vReg').value=v.reg||'';$('vVin').value=v.vin||'';$('vYear').value=v.year||'';$('vMileage').value=v.mileage||'';$('vInspection').value=v.inspectionUntil||'';$('vInsurance').value=v.insuranceUntil||'';$('vAc').value=v.acUntil||'';$('vPolicy').value=v.policy||'';$('vStatus').value=v.status||'Aktywny';$('vDocs').value=(v.docs||[]).join('\n');$('vNotes').value=v.notes||'';window._vehicleRepairs=(v.repairs||[]).map(x=>({...x}));renderRepairRows();$('vehicleFormCard').classList.remove('hidden');$('vehicleFormCard').scrollIntoView({behavior:'smooth'})};
window.closeVehicleForm=()=>$('vehicleFormCard')?.classList.add('hidden');window.addVehicleRepairRow=()=>{window._vehicleRepairs=window._vehicleRepairs||[];window._vehicleRepairs.push({date:new Date().toISOString().slice(0,10),type:'Serwis',mileage:'',cost:'',notes:''});renderRepairRows()};window.removeVehicleRepairRow=i=>{window._vehicleRepairs.splice(i,1);renderRepairRows()};window.setVehicleRepair=(i,k,v)=>window._vehicleRepairs[i][k]=v;
function renderRepairRows(){let c=$('repairRows');if(!c)return;c.innerHTML=(window._vehicleRepairs||[]).map((r,i)=>`<div class="materialRow"><input type="date" value="${esc(r.date||'')}" onchange="setVehicleRepair(${i},'date',this.value)"><input placeholder="Serwis / naprawa" value="${esc(r.type||'')}" oninput="setVehicleRepair(${i},'type',this.value)"><input type="number" placeholder="km" value="${esc(r.mileage||'')}" oninput="setVehicleRepair(${i},'mileage',this.value)"><input type="number" step="0.01" placeholder="koszt" value="${esc(r.cost||'')}" oninput="setVehicleRepair(${i},'cost',this.value)"><input placeholder="uwagi" value="${esc(r.notes||'')}" oninput="setVehicleRepair(${i},'notes',this.value)"><button class="danger smallBtn" onclick="removeVehicleRepairRow(${i})">×</button></div>`).join('')||'<div class="meta">Brak wpisów serwisowych.</div>'}
window.saveVehicleRecord=async()=>{let id=$('vId').value;if(!(id?perm('edit'):perm('add')))return alert('Brak uprawnienia.');let data={companyId,ownerUid:profile?.ownerUid||auth.currentUser.uid,name:$('vName').value.trim(),brand:$('vBrand').value.trim(),model:$('vModel').value.trim(),reg:$('vReg').value.trim(),vin:$('vVin').value.trim(),year:Number($('vYear').value||0),mileage:Number($('vMileage').value||0),inspectionUntil:$('vInspection').value,insuranceUntil:$('vInsurance').value,acUntil:$('vAc').value,policy:$('vPolicy').value.trim(),status:$('vStatus').value,docs:$('vDocs').value.split(/\n/).map(x=>x.trim()).filter(Boolean),notes:$('vNotes').value.trim(),repairs:(window._vehicleRepairs||[]).map(r=>({...r,mileage:Number(r.mileage||0),cost:Number(r.cost||0)})),updatedAt:new Date().toISOString()};if(!data.name&&!data.reg)return alert('Podaj nazwę lub numer rejestracyjny.');if(id)await setDoc(doc(db,'vehicles',id),data,{merge:true});else await addDoc(collection(db,'vehicles'),{...data,createdAt:new Date().toISOString()});closeVehicleForm();await load()};
onAuthStateChanged(auth,u=>{if(u)setTimeout(load,150);else{profile=null;companyId=null;vehicles=[]}});window.SerwisantModules=window.SerwisantModules||{};window.SerwisantModules.vehicles={name:'Samochody',version:'10.8',loaded:true,reload:load};''',encoding='utf-8')

# --- fuel module ---
Path('js/modules/fuel.js').write_text(r'''import {getApps,getApp,initializeApp} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {getFirestore,collection,doc,getDoc,getDocs,addDoc,setDoc,query,where} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import {firebaseConfig} from "../../firebase-config.js";
const app=getApps().length?getApp():initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);let profile=null,companyId=null,vehicles=[],rows=[];const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])),money=n=>Number(n||0).toFixed(2).replace('.',',')+' zł',fmt=s=>s?new Date(s+'T12:00:00').toLocaleDateString('pl-PL'):'—';function perm(a){return profile?.role==='admin'||profile?.permissions?.fuel?.[a]===true}function vname(id){let v=vehicles.find(x=>x.id===id);return v?.name||v?.reg||[v?.brand,v?.model].filter(Boolean).join(' ')||'Pojazd'}
async function load(){if(!auth.currentUser)return;let p=await getDoc(doc(db,'userProfiles',auth.currentUser.uid));profile=p.data()||null;companyId=profile?.companyId||null;if(!companyId||!perm('view'))return;let [vs,fs]=await Promise.all([getDocs(query(collection(db,'vehicles'),where('companyId','==',companyId))),getDocs(query(collection(db,'fuel'),where('companyId','==',companyId)))]);vehicles=vs.docs.map(d=>({id:d.id,...d.data()}));rows=fs.docs.map(d=>({id:d.id,...d.data()}));fill();render()}
function fill(){for(const id of ['fuelVehicleFilter','fVehicle']){let e=$(id);if(!e)continue;let first=id==='fuelVehicleFilter'?'<option value="">Wszystkie</option>':'<option value="">— wybierz —</option>';let cur=e.value;e.innerHTML=first+vehicles.filter(v=>!v.archived).map(v=>`<option value="${v.id}">${esc(vname(v.id))}</option>`).join('');e.value=cur}if($('fuelMonthFilter')&&!$('fuelMonthFilter').value)$('fuelMonthFilter').value=new Date().toISOString().slice(0,7)}
function consumption(list){let full=[...list].filter(x=>x.full&&Number(x.mileage)>0).sort((a,b)=>Number(a.mileage)-Number(b.mileage));if(full.length<2)return null;let liters=0,km=0;for(let i=1;i<full.length;i++){let d=full[i].mileage-full[i-1].mileage;if(d>0){km+=d;liters+=Number(full[i].liters||0)}}return km>0?liters/km*100:null}
function render(){let c=$('fuelList');if(!c)return;let vid=$('fuelVehicleFilter')?.value||'',mon=$('fuelMonthFilter')?.value||'';let list=rows.filter(x=>(!vid||x.vehicleId===vid)&&(!mon||(x.date||'').startsWith(mon))).sort((a,b)=>(b.date||'').localeCompare(a.date||''));let liters=list.reduce((s,x)=>s+Number(x.liters||0),0),cost=list.reduce((s,x)=>s+Number(x.cost||0),0),avg=vid?consumption(rows.filter(x=>x.vehicleId===vid)):null;$('fuelKpis').innerHTML=`<div class="card"><div class="label">Litry</div><div class="stat">${liters.toFixed(1)} l</div></div><div class="card"><div class="label">Koszt</div><div class="stat money">${money(cost)}</div></div><div class="card"><div class="label">Śr. spalanie</div><div class="stat">${avg?avg.toFixed(2)+' l/100 km':'—'}</div></div>`;c.innerHTML=list.length?list.map(x=>`<div class="item"><h3>${esc(vname(x.vehicleId))} — ${fmt(x.date)}</h3><div class="meta">${Number(x.liters||0).toFixed(2)} l • ${money(x.cost)} • ${Number(x.mileage||0).toLocaleString('pl-PL')} km ${x.full?'• pełny bak':''}<br>${esc(x.notes||'')}</div>${perm('edit')?`<div class="toolbar"><button class="secondary smallBtn" onclick="openFuelForm('${x.id}')">Edytuj</button></div>`:''}</div>`).join(''):'<div class="empty">Brak tankowań dla wybranego okresu.</div>'}window.renderFuelModule=render;
window.openFuelForm=id=>{if(!(id?perm('edit'):perm('add')))return alert('Brak uprawnienia.');let x=rows.find(r=>r.id===id)||{};$('fId').value=x.id||'';fill();$('fVehicle').value=x.vehicleId||$('fuelVehicleFilter')?.value||'';$('fDate').value=x.date||new Date().toISOString().slice(0,10);$('fMileage').value=x.mileage||'';$('fLiters').value=x.liters||'';$('fPrice').value=x.price||'';$('fCost').value=x.cost||'';$('fFull').checked=!!x.full;$('fNotes').value=x.notes||'';$('fuelFormCard').classList.remove('hidden');$('fuelFormCard').scrollIntoView({behavior:'smooth'})};window.closeFuelForm=()=>$('fuelFormCard')?.classList.add('hidden');
window.saveFuelRecord=async()=>{let id=$('fId').value;if(!(id?perm('edit'):perm('add')))return alert('Brak uprawnienia.');let liters=Number($('fLiters').value||0),price=Number($('fPrice').value||0),cost=Number($('fCost').value||0)||liters*price,data={companyId,ownerUid:profile?.ownerUid||auth.currentUser.uid,vehicleId:$('fVehicle').value,date:$('fDate').value,mileage:Number($('fMileage').value||0),liters,price,cost:Number(cost.toFixed(2)),full:$('fFull').checked,notes:$('fNotes').value.trim(),updatedAt:new Date().toISOString()};if(!data.vehicleId||!data.date||!data.liters)return alert('Wybierz pojazd, datę i wpisz litry.');if(id)await setDoc(doc(db,'fuel',id),data,{merge:true});else await addDoc(collection(db,'fuel'),{...data,createdAt:new Date().toISOString()});closeFuelForm();await load();window.SerwisantModules?.vehicles?.reload?.()};onAuthStateChanged(auth,u=>{if(u)setTimeout(load,200);else{profile=null;companyId=null;rows=[]}});window.SerwisantModules=window.SerwisantModules||{};window.SerwisantModules.fuel={name:'Paliwo',version:'10.8',loaded:true,reload:load};''',encoding='utf-8')
print('v10.8 vehicles + fuel patch ready')
