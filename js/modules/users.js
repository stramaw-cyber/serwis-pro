import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-functions.js";
import { firebaseConfig } from "../../firebase-config.js";

const appFb = getApps()[0] || initializeApp(firebaseConfig);
const auth = getAuth(appFb);
const db = getFirestore(appFb);
const functions = getFunctions(appFb, "europe-west1");

const ensureCompanyAdminFn = httpsCallable(functions, "ensureCompanyAdmin");
const createCompanyUserFn = httpsCallable(functions, "createCompanyUser");
const updateCompanyUserFn = httpsCallable(functions, "updateCompanyUser");
const disableCompanyUserFn = httpsCallable(functions, "disableCompanyUser");

const MODULES = [
  ["clients","Klienci"],["devices","Urządzenia"],["orders","Zlecenia"],
  ["inspections","Przeglądy"],["service","Serwisy"],["photos","Zdjęcia"],
  ["worktime","Czas pracy"],["vehicles","Samochody"],["fuel","Paliwo"],
  ["buildings","Budowy / Projekty"],
  ["reports","Raporty"],["protocols","Protokoły"],["materials","Części / Materiały"],
  ["callbacks","Do oddzwonienia"],["knowledge","Baza serwisowa"],
  ["trash","Kosz"],["settings","Ustawienia"]
];

let currentAdminProfile = null;
let companyUsers = [];

function q(id){ return document.getElementById(id); }
function esc(s){ return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])); }

function defaultPermissions(role="worker"){
  const out={};
  for(const [id] of MODULES){
    out[id]={
      view:true,
      add: role!=="worker" || !["settings","trash"].includes(id),
      edit: role!=="worker" || !["settings","trash"].includes(id),
      delete:false
    };
  }
  if(role==="admin"){
    for(const id of Object.keys(out)) out[id]={view:true,add:true,edit:true,delete:true};
  }
  return out;
}

function renderPermissionEditor(perms={}){
  const root=q("permissionsGrid");
  if(!root)return;
  root.innerHTML=MODULES.map(([id,label])=>{
    const p=perms[id]||{};
    return `<div class="permission-card">
      <h4>${label}</h4>
      <div class="permission-row">
        <label><input type="checkbox" data-perm="${id}" data-k="view" ${p.view!==false?"checked":""}> Podgląd</label>
        <label><input type="checkbox" data-perm="${id}" data-k="add" ${p.add===true?"checked":""}> Dodaj</label>
        <label><input type="checkbox" data-perm="${id}" data-k="edit" ${p.edit===true?"checked":""}> Edytuj</label>
        <label><input type="checkbox" data-perm="${id}" data-k="delete" ${p.delete===true?"checked":""}> Usuń</label>
      </div>
    </div>`;
  }).join("");
}

function collectPermissions(){
  const p={};
  for(const [id] of MODULES) p[id]={view:false,add:false,edit:false,delete:false};
  document.querySelectorAll("[data-perm]").forEach(el=>{
    p[el.dataset.perm][el.dataset.k]=el.checked;
  });
  return p;
}

function showUserForm(){
  document.querySelectorAll("#modal .form").forEach(x=>x.classList.add("hidden"));
  const form=q("userPermissionsForm"), modal=q("modal");
  if(!form||!modal){ alert("Brak formularza użytkownika."); return false; }
  if(!q("uProfilePassword")){
    const email=q("uProfileEmail");
    if(email){
      email.insertAdjacentHTML("afterend", `<div id="newPasswordWrap"><label>Hasło tymczasowe</label><input id="uProfilePassword" type="password" minlength="6" placeholder="minimum 6 znaków"><div class="hint">Administrator przekazuje to hasło pracownikowi.</div></div>`);
    }
  }
  form.classList.remove("hidden");
  modal.classList.add("show");
  return true;
}

window.openUserPermissions=(profile={})=>{
  if(!currentAdminProfile || currentAdminProfile.role!=="admin"){
    return alert("Tylko administrator może zarządzać użytkownikami.");
  }
  if(!showUserForm())return;
  q("uProfileId").value=profile.id||"";
  q("uProfileName").value=profile.name||"";
  q("uProfileEmail").value=profile.email||"";
  q("uProfileEmail").disabled=!!profile.id;
  q("uProfilePassword").value="";
  q("newPasswordWrap").classList.toggle("hidden",!!profile.id);
  q("uProfileRole").value=profile.role||"worker";
  renderPermissionEditor(profile.permissions||defaultPermissions(profile.role||"worker"));
  q("deleteUserProfileBtn").classList.toggle("hidden",!profile.id || profile.id===auth.currentUser?.uid);
};

function renderUsers(){
  const root=q("usersList");
  if(!root)return;
  if(!companyUsers.length){
    root.innerHTML='<div class="empty">Brak dodatkowych użytkowników.</div>';
    return;
  }
  root.innerHTML=companyUsers.map(u=>`
    <div class="item" onclick='openUserPermissions(${JSON.stringify(u).replace(/'/g,"&#39;")})'>
      <h3>${esc(u.name||u.email)}</h3>
      <div class="meta">
        ${esc(u.email||"")}<br>
        Rola: <b>${u.role==="admin"?"Administrator":u.role==="office"?"Biuro":"Pracownik"}</b>
        ${u.active===false?'<br><b>KONTO NIEAKTYWNE</b>':''}
      </div>
    </div>`).join("");
}

async function loadCompanyUsers(){
  if(!currentAdminProfile?.companyId)return;
  const s=await getDocs(query(collection(db,"userProfiles"),where("companyId","==",currentAdminProfile.companyId)));
  companyUsers=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.name||"").localeCompare(b.name||""));
  renderUsers();
}

async function initializeCompanyUsers(){
  const status=q("companyStatus");
  try{
    if(!auth.currentUser)return;
    await ensureCompanyAdminFn({});
    const pSnap=await getDoc(doc(db,"userProfiles",auth.currentUser.uid));
    currentAdminProfile=pSnap.exists()?{id:pSnap.id,...pSnap.data()}:null;

    if(currentAdminProfile?.role==="admin"){
      if(status)status.textContent=`Firma aktywna • Administrator: ${currentAdminProfile.name||auth.currentUser.email}`;
      if(q("addCompanyUserBtn"))q("addCompanyUserBtn").classList.remove("hidden");
      await loadCompanyUsers();
    }else{
      if(status)status.textContent="Nie masz uprawnień administratora.";
      if(q("addCompanyUserBtn"))q("addCompanyUserBtn").classList.add("hidden");
    }
  }catch(e){
    console.error(e);
    if(status)status.textContent="Nie można połączyć modułu użytkowników z Firebase Functions.";
  }
}

window.saveUserPermissions=async()=>{
  try{
    if(!currentAdminProfile || currentAdminProfile.role!=="admin") return alert("Brak uprawnień administratora.");
    const id=q("uProfileId").value;
    const name=q("uProfileName").value.trim();
    const email=q("uProfileEmail").value.trim();
    const role=q("uProfileRole").value;
    const permissions=collectPermissions();
    if(!name)return alert("Podaj imię i nazwisko.");

    if(!id){
      const password=q("uProfilePassword").value;
      if(!email)return alert("Podaj e-mail.");
      if(password.length<6)return alert("Hasło musi mieć minimum 6 znaków.");
      await createCompanyUserFn({name,email,password,role,permissions});
      alert("Konto pracownika zostało utworzone.");
    }else{
      await updateCompanyUserFn({uid:id,name,role,permissions});
      alert("Profil i uprawnienia zostały zapisane.");
    }
    if(typeof closeModal==="function")closeModal();
    await loadCompanyUsers();
  }catch(e){
    console.error(e);
    alert(e?.message||"Nie udało się zapisać użytkownika.");
  }
};

window.disableUserProfile=async()=>{
  const uid=q("uProfileId").value;
  if(!uid)return;
  if(!confirm("Dezaktywować konto tego użytkownika? Nie będzie mógł się zalogować."))return;
  try{
    await disableCompanyUserFn({uid,disabled:true});
    if(typeof closeModal==="function")closeModal();
    await loadCompanyUsers();
  }catch(e){
    console.error(e);
    alert(e?.message||"Nie udało się dezaktywować konta.");
  }
};

window.deleteUserProfile=()=>window.disableUserProfile();

window.SerwisantUsers={MODULES,defaultPermissions,loadCompanyUsers};

const timer=setInterval(()=>{
  if(q("users") && auth.currentUser){
    clearInterval(timer);
    initializeCompanyUsers();
  }
},400);
setTimeout(()=>clearInterval(timer),15000);