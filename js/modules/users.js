const MODULES = [
  ["clients","Klienci"],["devices","Urządzenia"],["orders","Zlecenia"],
  ["inspections","Przeglądy"],["service","Serwisy"],["photos","Zdjęcia"],
  ["worktime","Czas pracy"],["vehicles","Samochody"],["fuel","Paliwo"],
  ["reports","Raporty"],["protocols","Protokoły"],["materials","Części / Materiały"],
  ["callbacks","Do oddzwonienia"],["knowledge","Baza serwisowa"],
  ["trash","Kosz"],["settings","Ustawienia"]
];

function q(id){ return document.getElementById(id); }

function defaultPermissions(){
  const out={};
  for(const [id] of MODULES) out[id]={view:true,add:true,edit:true,delete:false};
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
        <label><input type="checkbox" data-perm="${id}" data-k="add" ${p.add!==false?"checked":""}> Dodaj</label>
        <label><input type="checkbox" data-perm="${id}" data-k="edit" ${p.edit!==false?"checked":""}> Edytuj</label>
        <label><input type="checkbox" data-perm="${id}" data-k="delete" ${p.delete===true?"checked":""}> Usuń</label>
      </div>
    </div>`;
  }).join("");
}

function showUserForm(){
  document.querySelectorAll("#modal .form").forEach(x=>x.classList.add("hidden"));
  const form=q("userPermissionsForm");
  const modal=q("modal");
  if(!form || !modal){
    alert("Nie znaleziono formularza użytkownika. Sprawdź plik partials/modal.html.");
    return false;
  }
  form.classList.remove("hidden");
  modal.classList.add("show");
  return true;
}

window.openUserPermissions=(profile={})=>{
  if(!showUserForm()) return;
  q("uProfileId").value=profile.id||"";
  q("uProfileName").value=profile.name||"";
  q("uProfileEmail").value=profile.email||"";
  q("uProfileRole").value=profile.role||"worker";
  renderPermissionEditor(profile.permissions||defaultPermissions());
  q("deleteUserProfileBtn").classList.toggle("hidden",!profile.id);
};

window.saveUserPermissions=()=>{
  alert("Formularz działa. W następnym kroku podłączymy zapisywanie użytkowników do Firebase i wspólnej firmy.");
};

window.deleteUserProfile=()=>{
  alert("Usuwanie profilu uruchomimy razem z zapisem użytkowników w Firebase.");
};

window.SerwisantUsers={MODULES,defaultPermissions,renderPermissionEditor};