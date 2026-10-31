import {getApps,getApp,initializeApp} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {getFirestore,collection,doc,getDoc,getDocs,addDoc,setDoc,query,where} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import {firebaseConfig} from "../../firebase-config.js";

const app=getApps().length?getApp():initializeApp(firebaseConfig);
const auth=getAuth(app),db=getFirestore(app);
let profile=null,companyId=null,buildings=[],currentBuildingId='';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmt=s=>s?new Date(s+'T12:00:00').toLocaleDateString('pl-PL'):'—';
const now=()=>new Date().toISOString();
const uid=()=>crypto?.randomUUID?.()||('f_'+Date.now()+'_'+Math.random().toString(36).slice(2,8));
function perm(a){return profile?.role==='admin'||profile?.permissions?.buildings?.[a]===true}
function current(){return buildings.find(x=>x.id===currentBuildingId)||null}

async function load(){
  if(!auth.currentUser)return;
  try{
    const ps=await getDoc(doc(db,'userProfiles',auth.currentUser.uid));
    profile=ps.data()||null; companyId=profile?.companyId||null;
    const denied=$('buildingsDenied'),content=$('buildingsContent');
    if(!companyId||!perm('view')){
      denied?.classList.remove('hidden');content?.classList.add('hidden');return;
    }
    denied?.classList.add('hidden');content?.classList.remove('hidden');
    const s=await getDocs(query(collection(db,'buildings'),where('companyId','==',companyId)));
    buildings=s.docs.map(d=>({id:d.id,...d.data()}));
    render();
    if(currentBuildingId&&!current())currentBuildingId='';
    if(currentBuildingId)renderDetail();
  }catch(e){console.error('Buildings module load error',e);const list=$('buildingList');if(list)list.innerHTML='<div class="empty">Nie udało się wczytać budów.</div>'}
}

function statusClass(s){return s==='Zakończona'?'ok':s==='Wstrzymana'?'warn':s==='W trakcie'?'info':''}
function render(){
  const list=$('buildingList'); if(!list)return;
  if($('addBuildingBtn'))$('addBuildingBtn').style.display=perm('add')?'':'none';
  const search=($('buildingSearch')?.value||'').toLowerCase().trim();
  const status=$('buildingStatusFilter')?.value||'';
  const active=buildings.filter(x=>!x.archived&&(!status||x.status===status)&&(!search||[x.name,x.client,x.address,x.scope].join(' ').toLowerCase().includes(search)));
  const allActive=buildings.filter(x=>!x.archived);
  const inProgress=allActive.filter(x=>x.status==='W trakcie').length;
  const planned=allActive.filter(x=>x.status==='Planowana').length;
  const folderCount=allActive.reduce((n,x)=>n+(x.folders||[]).length,0);
  if($('buildingKpis'))$('buildingKpis').innerHTML=`<div class="card"><div class="label">Aktywne budowy</div><div class="stat">${allActive.length}</div></div><div class="card"><div class="label">W trakcie</div><div class="stat">${inProgress}</div></div><div class="card"><div class="label">Planowane</div><div class="stat">${planned}</div></div><div class="card"><div class="label">Foldery</div><div class="stat">${folderCount}</div></div>`;
  list.innerHTML=active.length?active.sort((a,b)=>(b.updatedAt||b.createdAt||'').localeCompare(a.updatedAt||a.createdAt||'')).map(x=>`<div class="item ${statusClass(x.status)}"><div class="pageHeader"><div><h3>🏗️ ${esc(x.name||'Budowa')}</h3><div class="meta"><b>${esc(x.client||'')}</b>${x.address?` • ${esc(x.address)}`:''}<br>Status: <b>${esc(x.status||'Planowana')}</b> • Start: ${fmt(x.startDate)} • Koniec: ${fmt(x.endDate)}<br>${esc(x.scope||'')}</div></div><div class="stat">${(x.folders||[]).length} 📁</div></div><div class="toolbar"><button onclick="openBuildingDetail('${x.id}')">Otwórz projekt</button>${perm('edit')?`<button class="secondary smallBtn" onclick="openBuildingForm('${x.id}')">Edytuj</button>`:''}${perm('delete')?`<button class="danger smallBtn" onclick="archiveBuilding('${x.id}')">Do kosza</button>`:''}</div></div>`).join(''):'<div class="empty">Brak budów pasujących do filtra.</div>';
  renderArchive();
}

function renderArchive(){
  const c=$('buildingArchiveList');if(!c)return;
  const arr=buildings.filter(x=>x.archived).sort((a,b)=>(b.archivedAt||'').localeCompare(a.archivedAt||''));
  c.innerHTML=arr.length?arr.map(x=>`<div class="item"><b>${esc(x.name||'Budowa')}</b><div class="meta">${esc(x.client||'')} ${x.address?'• '+esc(x.address):''}</div>${perm('edit')?`<button class="secondary smallBtn" onclick="restoreBuilding('${x.id}')">Przywróć</button>`:''}</div>`).join(''):'<div class="empty">Archiwum jest puste.</div>';
}

window.renderBuildingsModule=render;
window.openBuildingForm=id=>{
  if(!(id?perm('edit'):perm('add')))return alert('Brak uprawnienia.');
  const x=buildings.find(v=>v.id===id)||{};
  $('bId').value=x.id||'';$('bName').value=x.name||'';$('bClient').value=x.client||'';$('bAddress').value=x.address||'';$('bStatus').value=x.status||'Planowana';$('bStart').value=x.startDate||'';$('bEnd').value=x.endDate||'';$('bScope').value=x.scope||'';$('bNotes').value=x.notes||'';
  $('buildingFormTitle').textContent=id?'Edytuj budowę':'Nowa budowa';$('buildingEditor').classList.remove('hidden');$('buildingEditor').scrollIntoView({behavior:'smooth',block:'start'});
};
window.closeBuildingForm=()=>$('buildingEditor')?.classList.add('hidden');
window.saveBuildingRecord=async()=>{
  const id=$('bId').value;if(!(id?perm('edit'):perm('add')))return alert('Brak uprawnienia.');
  const data={companyId,ownerUid:profile?.ownerUid||auth.currentUser.uid,name:$('bName').value.trim(),client:$('bClient').value.trim(),address:$('bAddress').value.trim(),status:$('bStatus').value,startDate:$('bStart').value,endDate:$('bEnd').value,scope:$('bScope').value.trim(),notes:$('bNotes').value.trim(),updatedAt:now()};
  if(!data.name)return alert('Podaj nazwę budowy / projektu.');
  if(id)await setDoc(doc(db,'buildings',id),data,{merge:true});else await addDoc(collection(db,'buildings'),{...data,folders:[],createdAt:now(),archived:false});
  closeBuildingForm();await load();
};

window.openBuildingDetail=id=>{if(!perm('view'))return;currentBuildingId=id;$('buildingDetail').classList.remove('hidden');$('buildingEditor').classList.add('hidden');renderDetail();$('buildingDetail').scrollIntoView({behavior:'smooth',block:'start'})};
window.closeBuildingDetail=()=>{currentBuildingId='';$('buildingDetail')?.classList.add('hidden');$('folderEditor')?.classList.add('hidden')};
window.editCurrentBuilding=()=>{const x=current();if(x)openBuildingForm(x.id)};
window.archiveCurrentBuilding=()=>{const x=current();if(x)archiveBuilding(x.id)};

function renderDetail(){
  const x=current();if(!x)return;
  $('buildingDetailTitle').textContent=x.name||'Budowa';
  $('buildingDetailMeta').innerHTML=`${esc(x.client||'')}${x.address?' • '+esc(x.address):''}<br>Status: <b>${esc(x.status||'')}</b> • ${fmt(x.startDate)} – ${fmt(x.endDate)}${x.scope?'<br>'+esc(x.scope):''}${x.notes?'<br>Uwagi: '+esc(x.notes):''}`;
  if($('editCurrentBuildingBtn'))$('editCurrentBuildingBtn').style.display=perm('edit')?'':'none';
  if($('archiveCurrentBuildingBtn'))$('archiveCurrentBuildingBtn').style.display=perm('delete')?'':'none';
  if($('addRootFolderBtn'))$('addRootFolderBtn').style.display=perm('edit')?'':'none';
  const folders=x.folders||[],subs=folders.filter(f=>f.parentId).length;
  $('buildingFolderCount').textContent=folders.length;$('buildingSubfolderCount').textContent=subs;
  const roots=folders.filter(f=>!f.parentId).sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  $('buildingFolderTree').innerHTML=`<div class="toolbar">${perm('edit')?`<button class="secondary smallBtn" onclick="addStandardBuildingFolders()">⚡ Dodaj standardowy zestaw instalacyjny</button>`:''}</div>`+(roots.length?roots.map(f=>folderHtml(f,0)).join(''):'<div class="empty">Brak folderów. Dodaj pierwszy folder albo użyj standardowego zestawu.</div>');
}

function folderHtml(f,level){
  const x=current(),children=(x?.folders||[]).filter(v=>v.parentId===f.id).sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  const pad=Math.min(level,6)*22;
  return `<div style="margin-left:${pad}px" class="item"><div class="pageHeader"><div><h3>📁 ${esc(f.name)}</h3><div class="meta">${esc(f.type||'Ogólny')}${f.notes?'<br>'+esc(f.notes):''}</div></div></div><div class="toolbar">${perm('edit')?`<button class="smallBtn" onclick="openFolderForm('${f.id}')">+ Podfolder</button><button class="secondary smallBtn" onclick="editBuildingFolder('${f.id}')">Edytuj</button>`:''}${perm('delete')?`<button class="danger smallBtn" onclick="deleteBuildingFolder('${f.id}')">Usuń folder</button>`:''}</div></div>${children.map(c=>folderHtml(c,level+1)).join('')}`;
}

window.openFolderForm=parentId=>{if(!perm('edit'))return alert('Brak uprawnienia do edycji.');$('folderId').value='';$('folderParentId').value=parentId||'';$('folderName').value='';$('folderType').value='Ogólny';$('folderNotes').value='';$('folderFormTitle').textContent=parentId?'Nowy podfolder':'Nowy folder';$('folderEditor').classList.remove('hidden');$('folderEditor').scrollIntoView({behavior:'smooth',block:'start'})};
window.editBuildingFolder=id=>{if(!perm('edit'))return;const f=(current()?.folders||[]).find(x=>x.id===id);if(!f)return;$('folderId').value=f.id;$('folderParentId').value=f.parentId||'';$('folderName').value=f.name||'';$('folderType').value=f.type||'Ogólny';$('folderNotes').value=f.notes||'';$('folderFormTitle').textContent='Edytuj folder';$('folderEditor').classList.remove('hidden');$('folderEditor').scrollIntoView({behavior:'smooth',block:'start'})};
window.closeFolderForm=()=>$('folderEditor')?.classList.add('hidden');
window.saveBuildingFolder=async()=>{
  if(!perm('edit'))return alert('Brak uprawnienia.');const x=current();if(!x)return;
  const name=$('folderName').value.trim();if(!name)return alert('Podaj nazwę folderu.');
  const id=$('folderId').value,parentId=$('folderParentId').value;let folders=(x.folders||[]).map(v=>({...v}));
  if(id){const i=folders.findIndex(v=>v.id===id);if(i>=0)folders[i]={...folders[i],name,type:$('folderType').value,notes:$('folderNotes').value.trim(),updatedAt:now()};}
  else folders.push({id:uid(),parentId,name,type:$('folderType').value,notes:$('folderNotes').value.trim(),createdAt:now()});
  await setDoc(doc(db,'buildings',x.id),{folders,updatedAt:now()},{merge:true});closeFolderForm();await load();
};

function descendants(folders,id){const out=[];const walk=p=>folders.filter(x=>x.parentId===p).forEach(x=>{out.push(x.id);walk(x.id)});walk(id);return out}
window.deleteBuildingFolder=async id=>{if(!perm('delete'))return alert('Brak uprawnienia.');const x=current();if(!x)return;const folders=x.folders||[],f=folders.find(v=>v.id===id);if(!f)return;const ids=[id,...descendants(folders,id)];if(!confirm(`Usunąć folder „${f.name}”${ids.length>1?' wraz z podfolderami':''}?`))return;await setDoc(doc(db,'buildings',x.id),{folders:folders.filter(v=>!ids.includes(v.id)),updatedAt:now()},{merge:true});await load()};

window.addStandardBuildingFolders=async()=>{
  if(!perm('edit'))return alert('Brak uprawnienia.');const x=current();if(!x)return;
  let folders=(x.folders||[]).map(v=>({...v}));
  const existing=new Set(folders.filter(f=>!f.parentId).map(f=>(f.name||'').toLowerCase()));
  const roots=['Dokumentacja','Elektryka','Hydraulika','Wentylacja / Rekuperacja','Klimatyzacja','Pompa ciepła','Gaz','Zdjęcia','Materiały','Protokoły i odbiory'];
  const created={};
  for(const name of roots){if(!existing.has(name.toLowerCase())){const id=uid();created[name]=id;folders.push({id,parentId:'',name,type:name==='Zdjęcia'?'Zdjęcia':name==='Materiały'?'Materiały':name==='Dokumentacja'?'Dokumentacja':'Ogólny',notes:'',createdAt:now()})}}
  const docId=created['Dokumentacja']||folders.find(f=>!f.parentId&&f.name==='Dokumentacja')?.id;
  if(docId){const childNames=new Set(folders.filter(f=>f.parentId===docId).map(f=>f.name));for(const name of ['Umowy i uzgodnienia','Schematy i projekty','Instrukcje urządzeń','Odbiory / protokoły'])if(!childNames.has(name))folders.push({id:uid(),parentId:docId,name,type:'Dokumentacja',notes:'',createdAt:now()})}
  await setDoc(doc(db,'buildings',x.id),{folders,updatedAt:now()},{merge:true});await load();
};

window.archiveBuilding=async id=>{if(!perm('delete'))return alert('Brak uprawnienia do usuwania.');const x=buildings.find(v=>v.id===id);if(!x)return;if(!confirm(`Przenieść budowę „${x.name}” do kosza?`))return;await setDoc(doc(db,'buildings',id),{archived:true,archivedAt:now(),updatedAt:now()},{merge:true});if(currentBuildingId===id)closeBuildingDetail();await load()};
window.restoreBuilding=async id=>{if(!perm('edit'))return alert('Brak uprawnienia do przywracania.');await setDoc(doc(db,'buildings',id),{archived:false,restoredAt:now(),updatedAt:now()},{merge:true});await load()};

onAuthStateChanged(auth,u=>{if(u)setTimeout(load,250);else{profile=null;companyId=null;buildings=[];currentBuildingId=''}});
window.SerwisantModules=window.SerwisantModules||{};
window.SerwisantModules.buildings={name:'Budowy / Projekty',version:'10.11',loaded:true,reload:load};
