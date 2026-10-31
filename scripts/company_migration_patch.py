from pathlib import Path

app = Path('js/core/app.js')
s = app.read_text(encoding='utf-8')

if 'function hasPerm(module,action=' not in s:
    anchor = 'const migrateCompanyDataFn=httpsCallable(functions,"migrateCompanyData");\n'
    helper = '''const CORE_MODULES={clients:'clients',devices:'devices',orders:'orders',inspections:'inspections'};\nconst COLLECTION_MODULE={clients:'clients',devices:'devices',orders:'orders',inspections:'inspections'};\nfunction hasPerm(module,action='view'){if(userProfile?.role==='admin')return true;return userProfile?.permissions?.[module]?.[action]===true}\nfunction requirePerm(module,action='view'){if(hasPerm(module,action))return true;alert(`Brak uprawnienia: ${module} / ${action}`);return false}\nfunction applyUiPermissions(){for(const [page,module] of Object.entries(CORE_MODULES)){const allowed=hasPerm(module,'view');document.querySelectorAll(`[onclick*=\\"go('${page}'\\"]`).forEach(el=>el.style.display=allowed?'':'none');const p=q(page);if(p&&!allowed&&p.classList.contains('active'))window.go('dashboard')}}\n'''
    if anchor not in s: raise SystemExit('permissions helper anchor not found')
    s=s.replace(anchor,anchor+helper,1)

    old_go="window.go=(id,btn)=>{document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));let p=q(id);if(!p)return;p.classList.add('active');document.body.dataset.page=id;document.querySelectorAll('nav button').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');window.scrollTo({top:0,behavior:'smooth'});renderAll()};"
    new_go="window.go=(id,btn)=>{let mod=CORE_MODULES[id];if(mod&&!requirePerm(mod,'view'))return;document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));let p=q(id);if(!p)return;p.classList.add('active');document.body.dataset.page=id;document.querySelectorAll('nav button').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');window.scrollTo({top:0,behavior:'smooth'});renderAll()};"
    if old_go not in s: raise SystemExit('window.go not found')
    s=s.replace(old_go,new_go,1)

    old_load="async function loadCol(name){if(!companyId)return[];try{let s=await getDocs(query(collection(db,name),where('companyId','==',companyId)));return s.docs.map(d=>({id:d.id,...d.data()}))}catch(e){console.error('Firestore load error',name,e);throw new Error(`${name}: ${e.code||e.message||'unknown-error'}`)}}"
    new_load="async function loadCol(name){if(!companyId)return[];let mod=COLLECTION_MODULE[name];if(mod&&!hasPerm(mod,'view'))return[];try{let s=await getDocs(query(collection(db,name),where('companyId','==',companyId)));return s.docs.map(d=>({id:d.id,...d.data()}))}catch(e){console.error('Firestore load error',name,e);throw new Error(`${name}: ${e.code||e.message||'unknown-error'}`)}}"
    if old_load not in s: raise SystemExit('loadCol not found')
    s=s.replace(old_load,new_load,1)

    old_auth="companyOwnerUid=ctx.data?.ownerUid||userProfile?.ownerUid||u.uid;if(userProfile?.role==='admin'){await migrateCompanyDataFn({});}await loadAll()"
    new_auth="companyOwnerUid=ctx.data?.ownerUid||userProfile?.ownerUid||u.uid;applyUiPermissions();if(userProfile?.role==='admin'){await migrateCompanyDataFn({});}await loadAll();applyUiPermissions()"
    if old_auth not in s: raise SystemExit('auth context not found')
    s=s.replace(old_auth,new_auth,1)

    pairs=[
      ("window.openClient=id=>{","window.openClient=id=>{if(!requirePerm('clients',id?'edit':'add'))return;"),
      ("window.openClientCard=id=>{","window.openClientCard=id=>{if(!requirePerm('clients','view'))return;"),
      ("window.saveClient=async()=>{let id=q('cId').value,data=","window.saveClient=async()=>{let id=q('cId').value;if(!requirePerm('clients',id?'edit':'add'))return;let data="),
      ("window.openDevice=(id='',clientId='')=>{","window.openDevice=(id='',clientId='')=>{if(!requirePerm('devices',id?'edit':'add'))return;"),
      ("window.openDeviceHistory=id=>{","window.openDeviceHistory=id=>{if(!requirePerm('devices','view'))return;"),
      ("window.saveDevice=async()=>{let id=q('dId').value,data=","window.saveDevice=async()=>{let id=q('dId').value;if(!requirePerm('devices',id?'edit':'add'))return;let data="),
      ("window.openOrder=(id='',clientId='',deviceId='')=>{","window.openOrder=(id='',clientId='',deviceId='')=>{if(!requirePerm('orders',id?'edit':'add'))return;"),
      ("window.saveOrder=async()=>{let id=q('oId').value,data=","window.saveOrder=async()=>{let id=q('oId').value;if(!requirePerm('orders',id?'edit':'add'))return;let data="),
      ("window.openInspection=(id='',clientId='',deviceId='')=>{","window.openInspection=(id='',clientId='',deviceId='')=>{if(!requirePerm('inspections',id?'edit':'add'))return;"),
      ("window.saveInspection=async()=>{let id=q('iId').value,old=","window.saveInspection=async()=>{let id=q('iId').value;if(!requirePerm('inspections',id?'edit':'add'))return;let old=")
    ]
    for old,new in pairs:
        if old not in s: raise SystemExit('app pattern not found: '+old[:55])
        s=s.replace(old,new,1)

    app.write_text(s,encoding='utf-8')
    print('Installed UI/core permission enforcement')
else:
    print('UI/core permissions already installed')

rules=Path('firestore.rules')
r=rules.read_text(encoding='utf-8')
if 'function hasPermission(module, action)' not in r:
    anchor="    function sameCompany(companyId) {\n"
    helper="""    function isAdmin() {\n      return activeMember() && myProfile().data.role == 'admin';\n    }\n\n    function hasPermission(module, action) {\n      return activeMember() && (\n        isAdmin() ||\n        (module in myProfile().data.permissions &&\n         action in myProfile().data.permissions[module] &&\n         myProfile().data.permissions[module][action] == true)\n      );\n    }\n\n"""
    if anchor not in r: raise SystemExit('rules helper anchor not found')
    r=r.replace(anchor,helper+anchor,1)

    for name,module in [('clients','clients'),('devices','devices'),('orders','orders'),('inspections','inspections')]:
        old=f"""    match /{name}/{{id}} {{\n      allow read: if canReadCompanyDoc();\n      allow create: if canCreateCompanyDoc();\n      allow update: if canUpdateCompanyDoc();\n      allow delete: if canReadCompanyDoc();\n    }}\n"""
        new=f"""    match /{name}/{{id}} {{\n      allow read: if canReadCompanyDoc() && hasPermission('{module}', 'view');\n      allow create: if canCreateCompanyDoc() && hasPermission('{module}', 'add');\n      allow update: if canUpdateCompanyDoc() && hasPermission('{module}', 'edit');\n      allow delete: if canReadCompanyDoc() && hasPermission('{module}', 'delete');\n    }}\n"""
        if old not in r: raise SystemExit('rules block not found: '+name)
        r=r.replace(old,new,1)
    rules.write_text(r,encoding='utf-8')
    print('Installed Firestore permission enforcement')
else:
    print('Firestore permissions already installed')
