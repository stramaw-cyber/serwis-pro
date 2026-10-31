from pathlib import Path
import re

p = Path('js/core/app.js')
s = p.read_text(encoding='utf-8')

if 'getMyCompanyContextFn' in s:
    print('app.js already patched for companyId')
    raise SystemExit(0)

old_import = 'import { getMessaging,getToken } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging.js";\n'
new_import = old_import + 'import { getFunctions,httpsCallable } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-functions.js";\n'
if old_import not in s:
    raise SystemExit('Expected messaging import not found')
s = s.replace(old_import, new_import, 1)

old_init = 'const appFb=initializeApp(firebaseConfig),auth=getAuth(appFb),db=getFirestore(appFb),messaging=getMessaging(appFb),q=id=>document.getElementById(id);'
new_init = 'const appFb=initializeApp(firebaseConfig),auth=getAuth(appFb),db=getFirestore(appFb),messaging=getMessaging(appFb),functions=getFunctions(appFb,"europe-west1"),q=id=>document.getElementById(id);'
if old_init not in s:
    raise SystemExit('Expected Firebase init line not found')
s = s.replace(old_init, new_init, 1)

old_state = 'let user=null,clients=[],devices=[],orders=[],employees=[],worklogs=[],absences=[],inspections=[],photos=[],protocols=[],vehicles=[],trips=[],fuel=[],callbacks=[],knowledge=[];let currentMaterials=[];let currentProtocol=null;let currentWorkTab=\'today\';'
new_state = 'let user=null,userProfile=null,companyId=null,companyOwnerUid=null,clients=[],devices=[],orders=[],employees=[],worklogs=[],absences=[],inspections=[],photos=[],protocols=[],vehicles=[],trips=[],fuel=[],callbacks=[],knowledge=[];let currentMaterials=[];let currentProtocol=null;let currentWorkTab=\'today\';\nconst getMyCompanyContextFn=httpsCallable(functions,"getMyCompanyContext");\nconst migrateCompanyDataFn=httpsCallable(functions,"migrateCompanyData");'
if old_state not in s:
    raise SystemExit('Expected state line not found')
s = s.replace(old_state, new_state, 1)

old_load = "async function loadCol(name){let s=await getDocs(query(collection(db,name),where('ownerUid','==',user.uid)));return s.docs.map(d=>({id:d.id,...d.data()}))}"
new_load = "async function loadCol(name){if(!companyId)return[];let s=await getDocs(query(collection(db,name),where('companyId','==',companyId)));return s.docs.map(d=>({id:d.id,...d.data()}))}"
if old_load not in s:
    raise SystemExit('Expected loadCol not found')
s = s.replace(old_load, new_load, 1)

old_auth = "onAuthStateChanged(auth,async u=>{user=u;if(u){q('loginPage').classList.add('hidden');q('app').classList.remove('hidden');q('nav').classList.remove('hidden');q('logoutBtn').classList.remove('hidden');q('uidBox').textContent=u.uid;q('configState').textContent='Firebase połączony.';await loadAll()}else{q('loginPage').classList.remove('hidden');q('app').classList.add('hidden');q('nav').classList.add('hidden');q('logoutBtn').classList.add('hidden')}});"
new_auth = "onAuthStateChanged(auth,async u=>{user=u;if(u){q('loginPage').classList.add('hidden');q('app').classList.remove('hidden');q('nav').classList.remove('hidden');q('logoutBtn').classList.remove('hidden');q('uidBox').textContent=u.uid;q('configState').textContent='Firebase połączony.';try{let ctx=await getMyCompanyContextFn({});userProfile=ctx.data?.profile||null;companyId=ctx.data?.companyId||userProfile?.companyId||null;companyOwnerUid=ctx.data?.ownerUid||userProfile?.ownerUid||u.uid;if(userProfile?.role==='admin'){await migrateCompanyDataFn({});}await loadAll()}catch(e){console.error(e);alert('Błąd inicjalizacji wspólnej bazy firmy.')}}else{userProfile=null;companyId=null;companyOwnerUid=null;q('loginPage').classList.remove('hidden');q('app').classList.add('hidden');q('nav').classList.add('hidden');q('logoutBtn').classList.add('hidden')}});"
if old_auth not in s:
    raise SystemExit('Expected auth state block not found')
s = s.replace(old_auth, new_auth, 1)

# Every newly saved company record keeps the original company owner and receives companyId.
s, count = re.subn(r'ownerUid\s*:\s*user\.uid', 'ownerUid:companyOwnerUid||user.uid,companyId:companyId', s)
print(f'Updated ownerUid save fields: {count}')

p.write_text(s, encoding='utf-8')
print('Patched js/core/app.js for shared companyId database')
