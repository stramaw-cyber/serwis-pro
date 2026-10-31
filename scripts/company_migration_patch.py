from pathlib import Path

p = Path('js/core/app.js')
s = p.read_text(encoding='utf-8')

old_load = "async function loadCol(name){if(!companyId)return[];let s=await getDocs(query(collection(db,name),where('companyId','==',companyId)));return s.docs.map(d=>({id:d.id,...d.data()}))}"
new_load = "async function loadCol(name){if(!companyId)return[];try{let s=await getDocs(query(collection(db,name),where('companyId','==',companyId)));return s.docs.map(d=>({id:d.id,...d.data()}))}catch(e){console.error('Firestore load error',name,e);throw new Error(`${name}: ${e.code||e.message||'unknown-error'}`)}}"

if old_load not in s:
    if "Firestore load error" in s:
        print('Diagnostic loadCol already installed')
        raise SystemExit(0)
    raise SystemExit('Expected companyId loadCol not found')

s = s.replace(old_load, new_load, 1)
old_alert = "alert('Błąd odczytu danych. Sprawdź reguły Firestore dla v9.')"
new_alert = "alert('Błąd Firestore: '+(e?.message||e))"
if old_alert in s:
    s = s.replace(old_alert, new_alert, 1)

p.write_text(s, encoding='utf-8')
print('Installed detailed Firestore collection diagnostics')
