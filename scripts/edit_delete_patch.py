from pathlib import Path

p=Path('js/core/app.js')
s=p.read_text(encoding='utf-8')

def rep(old,new,label):
    global s
    if old not in s:
        raise SystemExit(f'Missing pattern: {label}')
    s=s.replace(old,new,1)

rep("function renderEmployees(){q('employeeCards').innerHTML=employees.length?employees.map(e=>{", "function renderEmployees(){let activeEmployees=employees.filter(e=>!e.archived);q('employeeCards').innerHTML=activeEmployees.length?activeEmployees.map(e=>{", 'employees active')
rep("<button class=\"infoBtn smallBtn\" onclick=\"goWorkForEmployee('${e.id}')\">Czas pracy</button></div></div>`}).join(''):'<div class=\"empty\">Brak pracowników.</div>'}", "<button class=\"infoBtn smallBtn\" onclick=\"goWorkForEmployee('${e.id}')\">Czas pracy</button><button class=\"danger smallBtn\" onclick=\"archiveRecord('employees','${e.id}')\">Do kosza</button></div></div>`}).join(''):'<div class=\"empty\">Brak pracowników.</div>'}", 'employee delete')

rep("list=worklogs.filter(w=>!emp||w.employeeId===emp)", "list=worklogs.filter(w=>!w.archived&&(!emp||w.employeeId===emp))", 'worklogs active list')
rep("${[...absences].sort((a,b)=>(b.from||'').localeCompare(a.from||'')).map(a=>", "${[...absences].filter(a=>!a.archived).sort((a,b)=>(b.from||'').localeCompare(a.from||'')).map(a=>", 'absences active')
rep("<button class=\"secondary smallBtn\" onclick=\"openAbsence('${a.id}')\">Edytuj</button></div>`", "<div class=\"toolbar\"><button class=\"secondary smallBtn\" onclick=\"openAbsence('${a.id}')\">Edytuj</button><button class=\"danger smallBtn\" onclick=\"archiveRecord('absences','${a.id}')\">Do kosza</button></div></div>`", 'absence delete')
rep("list=worklogs.filter(w=>(!emp||w.employeeId===emp)&&(w.date||'').startsWith(m))", "list=worklogs.filter(w=>!w.archived&&(!emp||w.employeeId===emp)&&(w.date||'').startsWith(m))", 'filtered worklogs active')
rep("<button class=\"secondary smallBtn\" onclick=\"openWork('${w.id}')\">Edytuj</button></div>`", "<div class=\"toolbar\"><button class=\"secondary smallBtn\" onclick=\"openWork('${w.id}')\">Edytuj</button><button class=\"danger smallBtn\" onclick=\"archiveRecord('worklogs','${w.id}')\">Do kosza</button></div></div>`", 'worklog delete')

rep("let list=[...protocols].sort((a,b)=>(b.date||'').localeCompare(a.date||''));", "let list=[...protocols].filter(p=>!p.archived).sort((a,b)=>(b.date||'').localeCompare(a.date||''));", 'protocols active')
rep("<button class=\"purpleBtn smallBtn\" onclick=\"openProtocolById('${p.id}')\">Otwórz protokół</button></div></div>`", "<button class=\"purpleBtn smallBtn\" onclick=\"openProtocolById('${p.id}')\">Otwórz protokół</button><button class=\"danger smallBtn\" onclick=\"archiveRecord('protocols','${p.id}')\">Do kosza</button></div></div>`", 'protocol delete')

rep("let list=[...photos].sort((a,b)=>(b.createdAt||b.date||'').localeCompare(a.createdAt||a.date||''));", "let list=[...photos].filter(p=>!p.archived).sort((a,b)=>(b.createdAt||b.date||'').localeCompare(a.createdAt||a.date||''));", 'photos active')
rep("<div class=\"photoCard\"><img src=\"${p.dataUrl}\" alt=\"Zdjęcie\"><b>${esc(cl?.name||'')}</b><div class=\"meta\">${esc(d?deviceLabel(d):'')}<br>${esc(p.caption||p.category||'')}</div></div>`", "<div class=\"photoCard\"><img src=\"${p.dataUrl}\" alt=\"Zdjęcie\"><b>${esc(cl?.name||'')}</b><div class=\"meta\">${esc(d?deviceLabel(d):'')}<br>${esc(p.caption||p.category||'')}</div><div class=\"toolbar\"><button class=\"danger smallBtn\" onclick=\"archiveRecord('photos','${p.id}')\">Do kosza</button></div></div>`", 'photo delete')

rep("${x.status!=='Załatwione'?`<button class=\"okBtn smallBtn\" onclick=\"finishCallback('${x.id}')\">Załatwione</button>`:''}</div></div>`", "${x.status!=='Załatwione'?`<button class=\"okBtn smallBtn\" onclick=\"finishCallback('${x.id}')\">Załatwione</button>`:''}<button class=\"danger smallBtn\" onclick=\"archiveRecord('callbacks','${x.id}')\">Do kosza</button></div></div>`", 'callback delete')
rep("<div class=\"toolbar\"><button class=\"secondary smallBtn\" onclick=\"openKnowledge('${x.id}')\">Edytuj</button></div></div>`", "<div class=\"toolbar\"><button class=\"secondary smallBtn\" onclick=\"openKnowledge('${x.id}')\">Edytuj</button><button class=\"danger smallBtn\" onclick=\"archiveRecord('knowledge','${x.id}')\">Do kosza</button></div></div>`", 'knowledge delete')

old_restore="window.restoreRecord=async(col,id)=>{let mod=COLLECTION_MODULE[col]||col;if(!requirePerm('trash','edit')||!requirePerm(mod,'edit'))return;await setDoc(doc(db,col,id),{archived:false,restoredAt:new Date().toISOString()},{merge:true});await loadAll()};"
new_restore="window.restoreRecord=async(col,id)=>{let mod=COLLECTION_MODULE[col]||col;if(!requirePerm('trash','edit')||!requirePerm(mod,'edit'))return;await setDoc(doc(db,col,id),{archived:false,restoredAt:new Date().toISOString()},{merge:true});await loadAll();window.SerwisantModules?.vehicles?.reload?.();window.SerwisantModules?.fuel?.reload?.()};"
rep(old_restore,new_restore,'restore reload modules')

old_trash="window.renderTrash=()=>{let c=q('trashList');if(!c)return;let groups=[['clients','Klient',clients],['devices','Urządzenie',devices],['orders','Zlecenie',orders],['inspections','Przegląd',inspections]];let rows=[];groups.forEach(([col,type,arr])=>arr.filter(x=>x.archived).forEach(x=>rows.push({col,type,x})));c.innerHTML=rows.length?rows.map(r=>{let name=r.col==='clients'?r.x.name:r.col==='devices'?deviceLabel(r.x):r.col==='orders'?r.x.title:r.x.type;return `<div class=\"item trashCard\"><h3>${esc(r.type)} — ${esc(name||'')}</h3><div class=\"meta\">Przeniesiono: ${esc((r.x.archivedAt||'').slice(0,16).replace('T',' '))}</div><button class=\"okBtn smallBtn\" onclick=\"restoreRecord('${r.col}','${r.x.id}')\">Przywróć</button></div>`}).join(''):'<div class=\"empty\">Kosz jest pusty.</div>'};"
new_trash="window.renderTrash=()=>{let c=q('trashList');if(!c)return;let groups=[['clients','Klient',clients],['devices','Urządzenie',devices],['orders','Zlecenie',orders],['inspections','Przegląd',inspections],['employees','Pracownik',employees],['worklogs','Czas pracy',worklogs],['absences','Nieobecność',absences],['photos','Zdjęcie',photos],['protocols','Protokół',protocols],['callbacks','Oddzwonienie',callbacks],['knowledge','Baza serwisowa',knowledge],['vehicles','Samochód',vehicles],['fuel','Tankowanie',fuel]];let rows=[];groups.forEach(([col,type,arr])=>arr.filter(x=>x.archived).forEach(x=>rows.push({col,type,x})));c.innerHTML=rows.length?rows.map(r=>{let name=r.col==='clients'?r.x.name:r.col==='devices'?deviceLabel(r.x):r.col==='orders'?r.x.title:r.col==='employees'?r.x.name:r.col==='worklogs'?`${fmt(r.x.date)} ${r.x.start||''}`:r.col==='absences'?`${r.x.type||''} ${fmt(r.x.from)}`:r.col==='photos'?(r.x.caption||r.x.category||'Zdjęcie'):r.col==='protocols'?`${fmt(r.x.date)} ${r.x.work||'Protokół'}`:r.col==='callbacks'?r.x.subject:r.col==='knowledge'?(r.x.title||r.x.code):r.col==='vehicles'?(r.x.name||r.x.reg):r.col==='fuel'?`${fmt(r.x.date)} ${money(r.x.cost)}`:r.x.type;return `<div class=\"item trashCard\"><h3>${esc(r.type)} — ${esc(name||'')}</h3><div class=\"meta\">Przeniesiono: ${esc((r.x.archivedAt||'').slice(0,16).replace('T',' '))}</div><button class=\"okBtn smallBtn\" onclick=\"restoreRecord('${r.col}','${r.x.id}')\">Przywróć</button></div>`}).join(''):'<div class=\"empty\">Kosz jest pusty.</div>'};"
rep(old_trash,new_trash,'expanded trash')

p.write_text(s,encoding='utf-8')
print('edit/delete patch applied')
