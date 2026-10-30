const MODULES = [
  ["clients","Klienci"],
  ["devices","Urządzenia"],
  ["orders","Zlecenia"],
  ["inspections","Przeglądy"],
  ["service","Serwisy"],
  ["photos","Zdjęcia"],
  ["worktime","Czas pracy"],
  ["vehicles","Samochody"],
  ["fuel","Paliwo"],
  ["reports","Raporty"],
  ["protocols","Protokoły"],
  ["materials","Części / Materiały"],
  ["callbacks","Do oddzwonienia"],
  ["knowledge","Baza serwisowa"],
  ["trash","Kosz"],
  ["settings","Ustawienia"]
];

const defaultPermissions = ()=>{
  const out={};
  for(const [id] of MODULES){
    out[id]={view:true,add:true,edit:true,delete:false};
  }
  return out;
};

function q(id){ return document.getElementById(id); }

function renderPermissionEditor(perms={}){
  const root=q("permissionsGrid");
  if(!root)return;
  root.innerHTML=MODULES.map(([id,label])=>{
    const p=perms[id]||{};
    return `<div class="permission-card">
      <h4>${label}</h4>
      <div class="permission-row">
        <label><input type="checkbox" data-perm="${id}" data-k="view" ${p.view!==false?"checked":""}> Podgląd</label>
        <label><input type="checkbox" data-perm="${id}" data-k="add" ${p.add!==false?"checked":""}> Dodaj</label>
        <label><input type="checkbox" data-perm="${id}" data-k="edit" ${p.edit!==false?"checked":""}> Edytuj</label>
        <label><input type="checkbox" data-perm="${id}" data-k="delete" ${p.delete===true?"checked":""}> Usuń</label>
      </div>
    </div>`;
  }).join("");
}

function collectPermissions(){
  const perms={};
  for(const [id] of MODULES){
    perms[id]={view:false,add:false,edit:false,delete:false};
  }
  document.querySelectorAll("[data-perm]").forEach(el=>{
    perms[el.dataset.perm][el.dataset.k]=el.checked;
  });
  return perms;
}

window.openUserPermissions=(profile={})=>{
  q("uProfileId").value=profile.id||"";
  q("uProfileName").value=profile.name||"";
  q("uProfileEmail").value=profile.email||"";
  q("uProfileRole").value=profile.role||"worker";
  renderPermissionEditor(profile.permissions||defaultPermissions());
  q("deleteUserProfileBtn").classList.toggle("hidden",!profile.id);
  if(typeof openForm==="function") openForm("userPermissionsForm");
};

window.SerwisantUsers = {
  MODULES,
  defaultPermissions,
  renderPermissionEditor,
  collectPermissions
};

// Integracja z obecnym silnikiem aplikacji.
// Jeśli app.js wystawia firebase/db/user globalnie, moduł wykorzysta je.
// Jeśli nie, funkcje pokażą czytelny komunikat zamiast psuć aplikację.
async function getCtx(){
  const db=window.db||window.firebaseDb||null;
  const user=window.user||window.currentUser||null;
  return {db,user};
}

window.saveUserPermissions=async()=>{
  const {db,user}=await getCtx();
  if(!db||!user){
    return alert("Moduł użytkowników wymaga podłączenia do wspólnego kontekstu Firebase. To zrobimy w następnym kroku integracji.");
  }
};

window.deleteUserProfile=async()=>{
  alert("Usuwanie profilu użytkownika zostanie aktywowane po podłączeniu wspólnego kontekstu Firebase.");
};

window.renderUsersAdmin=()=>{};