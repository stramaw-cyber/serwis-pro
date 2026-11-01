import {getApps,getApp,initializeApp} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {getFirestore,collection,doc,getDoc,getDocs,addDoc,setDoc,query,where} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import {getStorage,ref,uploadBytes,getDownloadURL} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";
import {firebaseConfig} from "../../firebase-config.js";

const app=getApps().length?getApp():initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),storage=getStorage(app);
let profile=null,companyId=null,employees=[],records=[];

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const now=()=>new Date().toISOString();
const today=()=>new Date().toISOString().slice(0,10);

function perm(a){return profile?.role==='admin'||profile?.permissions?.bhp?.[a]===true}
function employeeName(id){const e=employees.find(x=>x.id===id);return e?.name||e?.fullName||e?.email||'Pracownik'}
function daysLeft(r){if(!r.validTo)return null;return Math.ceil((new Date(r.validTo+'T12:00:00')-new Date(today()+'T12:00:00'))/86400000)}
function state(r){const d=daysLeft(r);if(d===null)return'valid';return d<0?'expired':d<=30?'soon':'valid'}
function fmt(s){return s?new Date(s+'T12:00:00').toLocaleDateString('pl-PL'):'—'}
function expiryText(r){const d=daysLeft(r);if(d===null)return'Bez terminu ważności';if(d<0)return`Po terminie o ${Math.abs(d)} ${Math.abs(d)===1?'dzień':'dni'}`;if(d===0)return'Termin upływa dzisiaj';if(d===1)return'Został 1 dzień';return`Zostało ${d} dni`}
function statusBadge(r){const s=state(r);const label=s==='expired'?'PO TERMINIE':s==='soon'?'KOŃCZY SIĘ':'WAŻNE';return `<span class="badge ${s==='expired'?'danger':s==='soon'?'warn':'ok'}">${label}</span>`}

async function loadEmployees(){
  if(!companyId)return;
  try{
    const es=await getDocs(query(collection(db,'employees'),where('companyId','==',companyId)));
    employees=es.docs.map(d=>({id:d.id,...d.data()}));
    fill();
  }catch(e){
    console.error('BHP employees load error',e);employees=[];fill();
    const root=$('bhpList');if(root)root.innerHTML='<div class="empty">Nie udało się pobrać listy pracowników. Sprawdź reguły Firestore.</div>';
  }
}

async function loadRecords(){
  if(!companyId||!perm('view'))return;
  try{
    const rs=await getDocs(query(collection(db,'bhpRecords'),where('companyId','==',companyId)));
    records=rs.docs.map(d=>({id:d.id,...d.data()}));render();
  }catch(e){
    console.error('BHP records load error',e);records=[];render();
    const root=$('bhpList');if(root&&!root.innerHTML.includes('Brak uprawnienia'))root.insertAdjacentHTML('afterbegin','<div class="alertBox">Nie udało się pobrać wpisów BHP. Sprawdź wdrożenie reguł Firestore.</div>');
  }
}

async function load(){
  if(!auth.currentUser)return;
  try{
    const ps=await getDoc(doc(db,'userProfiles',auth.currentUser.uid));
    profile=ps.data()||null;companyId=profile?.companyId||null;
    if(!companyId)return;
    await loadEmployees();
    if(!perm('view')){const root=$('bhpList');if(root)root.innerHTML='<div class="empty">Brak uprawnienia do podglądu BHP.</div>';return}
    await loadRecords();
  }catch(e){console.error(e)}
}

function fill(){
  for(const id of ['bhpEmployeeFilter','bhpEmployee']){
    const el=$(id);if(!el)continue;
    const val=el.value;
    el.innerHTML=(id==='bhpEmployeeFilter'?'<option value="">Wszyscy pracownicy</option>':'<option value="">— wybierz —</option>')+employees.filter(x=>!x.archived).map(e=>`<option value="${e.id}">${esc(e.name||e.fullName||e.email||e.id)}</option>`).join('');
    el.value=employees.some(e=>e.id===val)?val:'';
  }
}

window.renderBhpModule=render;
function render(){
  const root=$('bhpList');if(!root)return;
  if($('addBhpBtn'))$('addBhpBtn').style.display=perm('add')?'':'none';
  const ef=$('bhpEmployeeFilter')?.value||'',sf=$('bhpStatusFilter')?.value||'';
  const allActive=records.filter(r=>!r.archived);
  const active=allActive.filter(r=>(!ef||r.employeeId===ef)&&(!sf||state(r)===sf)).sort((a,b)=>(a.validTo||'9999').localeCompare(b.validTo||'9999'));
  const expired=allActive.filter(r=>state(r)==='expired').length,soon=allActive.filter(r=>state(r)==='soon').length,valid=allActive.filter(r=>state(r)==='valid').length;

  if($('bhpKpis'))$('bhpKpis').innerHTML=`<div class="card"><div class="label">Po terminie</div><div class="stat">${expired}</div></div><div class="card"><div class="label">Do 30 dni</div><div class="stat">${soon}</div></div><div class="card"><div class="label">Ważne</div><div class="stat">${valid}</div></div>`;

  const attention=allActive.filter(r=>['expired','soon'].includes(state(r))).sort((a,b)=>(a.validTo||'9999').localeCompare(b.validTo||'9999')).slice(0,5);
  if($('bhpAlerts'))$('bhpAlerts').innerHTML=attention.length?`<div class="card warn"><b>⚠ Najbliższe terminy BHP</b><div style="margin-top:8px">${attention.map(r=>`<div style="padding:5px 0;border-bottom:1px solid rgba(0,0,0,.08)"><b>${esc(employeeName(r.employeeId))}</b> — ${esc(r.type||'BHP')}<br><span class="meta">${fmt(r.validTo)} • ${esc(expiryText(r))}</span></div>`).join('')}</div></div>`:'';

  root.innerHTML=active.length?active.map(r=>{
    const s=state(r),cls=s==='expired'?'danger':s==='soon'?'warn':'ok';
    return `<div class="item ${cls}"><div class="toolbar" style="justify-content:space-between;align-items:flex-start"><h3 style="margin:0">${esc(r.type||'BHP')} — ${esc(employeeName(r.employeeId))}</h3>${statusBadge(r)}</div><div class="meta" style="margin-top:8px">Wykonano: ${fmt(r.date)} • Ważne do: <b>${fmt(r.validTo)}</b><br><b>${esc(expiryText(r))}</b>${r.notes?'<br>'+esc(r.notes):''}</div><div class="toolbar" style="margin-top:10px">${r.fileUrl?`<a class="button secondary" target="_blank" rel="noopener" href="${r.fileUrl}">📎 ${esc(r.fileName||'Dokument')}</a>`:''}${perm('edit')?`<button class="secondary smallBtn" onclick="openBhpForm('${r.id}')">Edytuj</button>`:''}${perm('delete')?`<button class="danger smallBtn" onclick="archiveBhpRecord('${r.id}')">Do kosza</button>`:''}</div></div>`;
  }).join(''):'<div class="empty">Brak wpisów BHP.</div>';
}

window.openBhpForm=id=>{
  if(!(id?perm('edit'):perm('add')))return alert('Brak uprawnienia.');
  const r=records.find(x=>x.id===id)||{};fill();
  $('bhpId').value=r.id||'';$('bhpEmployee').value=r.employeeId||'';$('bhpType').value=r.type||'Szkolenie wstępne BHP';$('bhpDate').value=r.date||today();$('bhpValidTo').value=r.validTo||'';$('bhpNotes').value=r.notes||'';$('bhpFile').value='';
  $('bhpFormTitle').textContent=id?'Edytuj wpis BHP':'Nowy wpis BHP';$('bhpEditor').classList.remove('hidden');$('bhpEditor').scrollIntoView({behavior:'smooth',block:'start'});
};
window.closeBhpForm=()=>$('bhpEditor')?.classList.add('hidden');

window.saveBhpRecord=async()=>{
  const id=$('bhpId').value;if(!(id?perm('edit'):perm('add')))return alert('Brak uprawnienia.');
  const employeeId=$('bhpEmployee').value;if(!employeeId)return alert('Wybierz pracownika.');
  const date=$('bhpDate').value,validTo=$('bhpValidTo').value;
  if(date&&validTo&&validTo<date&&!confirm('Data ważności jest wcześniejsza niż data wykonania. Zapisać mimo to?'))return;
  const old=records.find(x=>x.id===id)||{};
  let fileUrl=old.fileUrl||'',filePath=old.filePath||'',fileName=old.fileName||'',fileSize=old.fileSize||0,fileType=old.fileType||'';
  const file=$('bhpFile').files?.[0];
  try{
    if(file){
      if(file.size>25*1024*1024)return alert('Maksymalny rozmiar pliku to 25 MB.');
      fileName=file.name;fileSize=file.size;fileType=file.type||'';
      filePath=`company/${companyId}/hr/bhp/${employeeId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
      const sr=ref(storage,filePath);await uploadBytes(sr,file);fileUrl=await getDownloadURL(sr);
    }
    const data={companyId,ownerUid:profile?.ownerUid||auth.currentUser.uid,employeeId,type:$('bhpType').value,date,validTo,notes:$('bhpNotes').value.trim(),fileUrl,filePath,fileName,fileSize,fileType,updatedAt:now(),archived:false};
    if(id)await setDoc(doc(db,'bhpRecords',id),data,{merge:true});else await addDoc(collection(db,'bhpRecords'),{...data,createdAt:now()});
    closeBhpForm();await load();
  }catch(e){
    console.error('BHP save error',e);alert('Nie udało się zapisać wpisu BHP lub załącznika. Sprawdź połączenie i reguły Firebase.');
  }
};

window.archiveBhpRecord=async id=>{if(!perm('delete'))return;if(!confirm('Przenieść wpis BHP do kosza?'))return;await setDoc(doc(db,'bhpRecords',id),{archived:true,archivedAt:now()},{merge:true});await load()};

onAuthStateChanged(auth,u=>{if(u)setTimeout(load,300);else{profile=null;companyId=null;employees=[];records=[]}});
window.SerwisantModules=window.SerwisantModules||{};
window.SerwisantModules.bhp={name:'BHP',version:'10.15',loaded:true,reload:load};