from pathlib import Path

app = Path('js/core/app.js')
s = app.read_text(encoding='utf-8')

old_core="const CORE_MODULES={clients:'clients',devices:'devices',orders:'orders',inspections:'inspections'};"
new_core="const CORE_MODULES={clients:'clients',devices:'devices',orders:'orders',inspections:'inspections',employees:'worktime',worktime:'worktime',reports:'reports',protocolsPage:'protocols',photosPage:'photos',callbacksPage:'callbacks',knowledgePage:'knowledge',trashPage:'trash',settings:'settings'};"
if old_core in s:
    s=s.replace(old_core,new_core,1)
elif new_core not in s:
    raise SystemExit('CORE_MODULES pattern not found')

old_coll="const COLLECTION_MODULE={clients:'clients',devices:'devices',orders:'orders',inspections:'inspections'};"
new_coll="const COLLECTION_MODULE={clients:'clients',devices:'devices',orders:'orders',employees:'worktime',worklogs:'worktime',absences:'worktime',inspections:'inspections',photos:'photos',protocols:'protocols',vehicles:'vehicles',trips:'vehicles',fuel:'fuel',callbacks:'callbacks',knowledge:'knowledge'};"
if old_coll in s:
    s=s.replace(old_coll,new_coll,1)
elif new_coll not in s:
    raise SystemExit('COLLECTION_MODULE pattern not found')

pairs=[
 ("window.openWork=id=>{","window.openWork=id=>{if(!requirePerm('worktime',id?'edit':'add'))return;"),
 ("window.saveWork=async()=>{let id=q('wId').value,data=","window.saveWork=async()=>{let id=q('wId').value;if(!requirePerm('worktime',id?'edit':'add'))return;let data="),
 ("window.openAbsence=id=>{","window.openAbsence=id=>{if(!requirePerm('worktime',id?'edit':'add'))return;"),
 ("window.saveAbsence=async()=>{let id=q('aId').value,data=","window.saveAbsence=async()=>{let id=q('aId').value;if(!requirePerm('worktime',id?'edit':'add'))return;let data="),
 ("window.quickStart=async employeeId=>{","window.quickStart=async employeeId=>{if(!requirePerm('worktime','add'))return;"),
 ("window.quickStop=async employeeId=>{","window.quickStop=async employeeId=>{if(!requirePerm('worktime','edit'))return;"),
 ("window.openPhoto=(clientId='',deviceId='',orderId='')=>{","window.openPhoto=(clientId='',deviceId='',orderId='')=>{if(!requirePerm('photos','add'))return;"),
 ("window.savePhoto=async()=>{","window.savePhoto=async()=>{if(!requirePerm('photos','add'))return;"),
 ("window.openProtocol=(id='',orderId='')=>{","window.openProtocol=(id='',orderId='')=>{if(!requirePerm('protocols',id?'edit':'add'))return;"),
 ("window.saveProtocol=async()=>{","window.saveProtocol=async()=>{let __pid=q('prId').value;if(!requirePerm('protocols',__pid?'edit':'add'))return;"),
 ("window.openCallback=id=>{","window.openCallback=id=>{if(!requirePerm('callbacks',id?'edit':'add'))return;"),
 ("window.saveCallback=async()=>{let id=q('cbId').value,data=","window.saveCallback=async()=>{let id=q('cbId').value;if(!requirePerm('callbacks',id?'edit':'add'))return;let data="),
 ("window.finishCallback=async id=>{","window.finishCallback=async id=>{if(!requirePerm('callbacks','edit'))return;"),
 ("window.openKnowledge=id=>{","window.openKnowledge=id=>{if(!requirePerm('knowledge',id?'edit':'add'))return;"),
 ("window.saveKnowledge=async()=>{let id=q('kbId').value,data=","window.saveKnowledge=async()=>{let id=q('kbId').value;if(!requirePerm('knowledge',id?'edit':'add'))return;let data="),
]
for old,new in pairs:
    if new in s:
        continue
    if old not in s:
        raise SystemExit('app pattern not found: '+old[:70])
    s=s.replace(old,new,1)

old_archive="window.archiveRecord=async(col,id)=>{if(!confirm('Przenieść ten rekord do Kosza? Dane nie zostaną skasowane.'))return;"
new_archive="window.archiveRecord=async(col,id)=>{let mod=COLLECTION_MODULE[col]||col;if(!requirePerm(mod,'delete'))return;if(!confirm('Przenieść ten rekord do Kosza? Dane nie zostaną skasowane.'))return;"
if new_archive not in s:
    if old_archive not in s: raise SystemExit('archiveRecord pattern not found')
    s=s.replace(old_archive,new_archive,1)

old_restore="window.restoreRecord=async(col,id)=>{await setDoc(doc(db,col,id),{archived:false,restoredAt:new Date().toISOString()},{merge:true});"
new_restore="window.restoreRecord=async(col,id)=>{let mod=COLLECTION_MODULE[col]||col;if(!requirePerm('trash','edit')||!requirePerm(mod,'edit'))return;await setDoc(doc(db,col,id),{archived:false,restoredAt:new Date().toISOString()},{merge:true});"
if new_restore not in s:
    if old_restore not in s: raise SystemExit('restoreRecord pattern not found')
    s=s.replace(old_restore,new_restore,1)

app.write_text(s,encoding='utf-8')
print('Expanded UI permissions to remaining modules')

rules=Path('firestore.rules')
r=rules.read_text(encoding='utf-8')
blocks=[
 ('employees','worktime'),('worklogs','worktime'),('absences','worktime'),
 ('photos','photos'),('protocols','protocols'),('vehicles','vehicles'),('trips','vehicles'),
 ('fuel','fuel'),('callbacks','callbacks'),('knowledge','knowledge')
]
for name,module in blocks:
    old=f"""    match /{name}/{{id}} {{\n      allow read: if canReadCompanyDoc();\n      allow create: if canCreateCompanyDoc();\n      allow update: if canUpdateCompanyDoc();\n      allow delete: if canReadCompanyDoc();\n    }}\n"""
    new=f"""    match /{name}/{{id}} {{\n      allow read: if canReadCompanyDoc() && hasPermission('{module}', 'view');\n      allow create: if canCreateCompanyDoc() && hasPermission('{module}', 'add');\n      allow update: if canUpdateCompanyDoc() && (hasPermission('{module}', 'edit') || hasPermission('{module}', 'delete'));\n      allow delete: if canReadCompanyDoc() && hasPermission('{module}', 'delete');\n    }}\n"""
    if new in r:
        continue
    if old not in r:
        raise SystemExit('rules block not found: '+name)
    r=r.replace(old,new,1)

# Core modules: archiving is an update, so permit update when user has delete permission as well.
for name,module in [('clients','clients'),('devices','devices'),('orders','orders'),('inspections','inspections')]:
    old=f"allow update: if canUpdateCompanyDoc() && hasPermission('{module}', 'edit');"
    new=f"allow update: if canUpdateCompanyDoc() && (hasPermission('{module}', 'edit') || hasPermission('{module}', 'delete'));"
    if old in r:
        r=r.replace(old,new,1)

rules.write_text(r,encoding='utf-8')
print('Expanded Firestore permissions to remaining collections')
