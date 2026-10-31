from pathlib import Path
import re

app = Path('js/core/app.js')
s = app.read_text(encoding='utf-8')

if 'function hasPerm(module,action=' in s:
    print('Permissions patch already installed')
else:
    anchor = 'const migrateCompanyDataFn=httpsCallable(functions,"migrateCompanyData");\n'
    helper = '''const CORE_MODULES={clients:'clients',devices:'devices',orders:'orders',inspections:'inspections'};\nconst COLLECTION_MODULE={clients:'clients',devices:'devices',orders:'orders',inspections:'inspections'};\nfunction hasPerm(module,action='view'){if(userProfile?.role==='admin')return true;return userProfile?.permissions?.[module]?.[action]===true}\nfunction requirePerm(module,action='view'){if(hasPerm(module,action))return true;alert(`Brak uprawnienia: ${module} / ${action}`);return false}\nfunction applyUiPermissions(){for(const [page,module] of Object.entries(CORE_MODULES)){const allowed=hasPerm(module,'view');document.querySelectorAll(`[onclick*=\\"go('${page}'\\"]`).forEach(el=>el.style.display=allowed?'':'none');const p=q(page);if(p&&!allowed&&p.classList.contains('active'))window.go('dashboard')}}\n'''
    if anchor not in s: raise SystemExit('permissions helper anchor not found')
    s = s.replace(anchor, anchor + helper, 1)

    old_go = "window.go=(id,btn)=>{document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));let p=q(id);if(!p)return;p.classList.add('active');document.body.dataset.page=id;document.querySelectorAll('nav button').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');window.scrollTo({top:0,behavior:'smooth'});renderAll()};"
    new_go = "window.go=(id,btn)=>{let mod=CORE_MODULES[id];if(mod&&!requirePerm(mod,'view'))return;document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));let p=q(id);if(!p)return;p.classList.add('active');document.body.dataset.page=id;document.querySelectorAll('nav button').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');window.scrollTo({top:0,behavior:'smooth'});renderAll()};"
    if old_go not in s: raise SystemExit('window.go pattern not found')
    s = s.replace(old_go,new_go,1)

    old_load = "async function loadCol(name){if(!companyId)return[];try{let s=await getDocs(query(collection(db,name),where('companyId','==',companyId)));return s.docs.map(d=>({id:d.id,...d.data()}))}catch(e){console.error('Firestore load error',name,e);throw new Error(`${name}: ${e.code||e.message||'unknown-error'}`)}}"
    new_load = "async function loadCol(name){if(!companyId)return[];let mod=COLLECTION_MODULE[name];if(mod&&!hasPerm(mod,'view'))return[];try{let s=await getDocs(query(collection(db,name),where('companyId','==',companyId)));return s.docs.map(d=>({id:d.id,...d.data()}))}catch(e){console.error('Firestore load error',name,e);throw new Error(`${name}: ${e.code||e.message||'unknown-error'}`)}}"
    if old_load not in s: raise SystemExit('loadCol pattern not found')
    s = s.replace(old_load,new_load,1)

    old_auth = "companyOwnerUid=ctx.data?.ownerUid||userProfile?.ownerUid||u.uid;if(userProfile?.role==='admin'){await migrateCompanyDataFn({});}await loadAll()"
    new_auth = "companyOwnerUid=ctx.data?.ownerUid||userProfile?.ownerUid||u.uid;applyUiPermissions();if(userProfile?.role==='admin'){await migrateCompanyDataFn({});}await loadAll();applyUiPermissions()"
    if old_auth not in s: raise SystemExit('auth context pattern not found')
    s = s.replace(old_auth,new_auth,1)

    replacements = {
      "window.openClient=id=>{":"window.openClient=id=>{if(!requirePerm('clients',id?'edit':'add'))return;",
      "window.openClientCard=id=>{":"window.openClientCard=id=>{if(!requirePerm('clients','view'))return;",
      "window.openDevice=(id='',clientId='')=>{":"window.openDevice=(id='',clientId='')=>{if(!requirePerm('devices',id?'edit':'add'))return;",
      "window.openDeviceHistory=id=>{":"window.openDeviceHistory=id=>{if(!requirePerm('devices','view'))return;",
      "window.saveClient=async()=>{let id=q('cId').value,data=":"window.saveClient=async()=>{let id=q('cId').value;if(!requirePerm('clients',id?'edit':'add'))return;let data=",
      "window.saveDevice=async()=>{let id=q('dId').value,data=":"window.saveDevice=async()=>{let id=q('dId').value;if(!requirePerm('devices',id?'edit':'add'))return;let data="
    }
    for old,new in replacements.items():
        if old in s: s=s.replace(old,new,1)
        else: print('warning pattern not found:',old[:40])

    # Generic guards for orders and inspections regardless of exact argument lists.
    for fn,module in [('openOrder','orders'),('openInspection','inspections')]:
        pat = rf"window\\.{fn}=\\(([^)]*)\\)=>\\{{"
        m = re.search(pat,s)
        if m:
            args=m.group(1)
            first=(args.split(',')[0].strip() or 'id')
            repl=f"window.{fn}=({args})=>{{if(!requirePerm('{module}',{first}?'edit':'add'))return;"
            s=s[:m.start()]+repl+s[m.end():]
        else:
            # also support single argument without parentheses
            pat2=rf"window\\.{fn}=([A-Za-z_$][\\w$]*)=>\\{{"
            m2=re.search(pat2,s)
            if m2:
                a=m2.group(1); repl=f"window.{fn}={a}=>{{if(!requirePerm('{module}',{a}?'edit':'add'))return;"; s=s[:m2.start()]+repl+s[m2.end():]
            else: print('warning no open guard for',fn)

    for fn,module,idexpr in [('saveOrder','orders',"q('oId')?.value"),('saveInspection','inspections',"q('iId')?.value")]:
        marker=f"window.{fn}=async()=>{{"
        if marker in s:
            s=s.replace(marker,marker+f"let __pid={idexpr};if(!requirePerm('{module}',__pid?'edit':'add'))return;",1)
        else: print('warning no save guard for',fn)

    app.write_text(s,encoding='utf-8')
    print('Installed UI/core permission enforcement')

rules = Path('firestore.rules')
r = rules.read_text(encoding='utf-8')
if 'function hasPermission(module, action)' not in r:
    insert = '''\n    function isAdmin() {\n      return activeMember() && myProfile().data.role == 'admin';\n    }\n\n    function hasPermission(module, action) {\n      return activeMember() && (\n        isAdmin() ||\n        (module in myProfile().data.permissions &&\n         action in myProfile().data.permissions[module] &&\n         myProfile().data.permissions[module][action] == true)\n      );\n    }\n'''
    r = r.replace("    function sameCompany(companyId) {\n", insert+"\n    function sameCompany(companyId) {\n",1)

    def replace_match(text,name,module):
        pat = rf"    match /{name}/\\{{id\\}} \\{{.*?    \\}}\n"
        block = f"    match /{name}/{{id}} {{\n      allow read: if canReadCompanyDoc() && hasPermission('{module}', 'view');\n      allow create: if canCreateCompanyDoc() && hasPermission('{module}', 'add');\n      allow update: if canUpdateCompanyDoc() && hasPermission('{module}', 'edit');\n      allow delete: if canReadCompanyDoc() && hasPermission('{module}', 'delete');\n    }}\n"
        new,n = re.subn(pat,block,text,count=1,flags=re.S)
        if n!=1: raise SystemExit(f'Firestore match not found for {name}')
        return new
    for name,module in [('clients','clients'),('devices','devices'),('orders','orders'),('inspections','inspections')]:
        r=replace_match(r,name,module)
    rules.write_text(r,encoding='utf-8')
    print('Installed Firestore permission enforcement')
else:
    print('Firestore permission enforcement already installed')
