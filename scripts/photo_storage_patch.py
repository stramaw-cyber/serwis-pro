from pathlib import Path

app = Path('js/core/app.js')
s = app.read_text(encoding='utf-8')

old = 'import { getFunctions,httpsCallable } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-functions.js";'
new = old + '\nimport { getStorage,ref as storageRef,uploadBytes,getDownloadURL } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";'
if new not in s:
    if old not in s: raise SystemExit('functions import not found')
    s = s.replace(old, new, 1)

old = 'const appFb=initializeApp(firebaseConfig),auth=getAuth(appFb),db=getFirestore(appFb),messaging=getMessaging(appFb),functions=getFunctions(appFb,"europe-west1"),q=id=>document.getElementById(id);'
new = 'const appFb=initializeApp(firebaseConfig),auth=getAuth(appFb),db=getFirestore(appFb),storage=getStorage(appFb),messaging=getMessaging(appFb),functions=getFunctions(appFb,"europe-west1"),q=id=>document.getElementById(id);'
if new not in s:
    if old not in s: raise SystemExit('firebase init pattern not found')
    s = s.replace(old, new, 1)

marker = "function fill(sel,arr,val='',labelFn=x=>x.name||x.title){"
helper = "function photoSrc(p){return p?.storageUrl||p?.dataUrl||''}"
if helper not in s:
    if marker not in s: raise SystemExit('fill helper marker not found')
    s = s.replace(marker, helper + marker, 1)

# Keep old base64 photos visible while new photos use Storage URLs.
s = s.replace('src="${p.dataUrl}"', 'src="${photoSrc(p)}"')

start = "window.savePhoto=async()=>{if(!requirePerm('photos','add'))return;"
end = "function templateForDevice(d){"
i = s.find(start)
j = s.find(end, i)
if i == -1 or j == -1:
    raise SystemExit('savePhoto block not found')

new_save = r'''window.savePhoto=async()=>{if(!requirePerm('photos','add'))return;let f=q('pCamera')?.files?.[0]||q('pGallery')?.files?.[0];if(!f)return alert('Zrób zdjęcie albo wybierz je z galerii.');try{let dataUrl=await compressImage(f);let blob=await fetch(dataUrl).then(r=>r.blob());if(blob.size>8*1024*1024)return alert('Zdjęcie po kompresji jest za duże.');let photoDoc=doc(collection(db,'photos')),safeName=(f.name||'zdjecie.jpg').replace(/[^a-zA-Z0-9._-]+/g,'_'),path=`companies/${companyId}/photos/${photoDoc.id}/${Date.now()}_${safeName.replace(/\.[^.]+$/,'.jpg')}`,fileRef=storageRef(storage,path);await uploadBytes(fileRef,blob,{contentType:'image/jpeg',customMetadata:{companyId:String(companyId),photoId:photoDoc.id,uploaderUid:user.uid}});let storageUrl=await getDownloadURL(fileRef);await setDoc(photoDoc,{ownerUid:companyOwnerUid||user.uid,companyId:companyId,clientId:q('pClient').value,deviceId:q('pDevice').value,orderId:q('pOrder').value,category:q('pCategory').value,caption:q('pCaption').value.trim(),storageUrl,storagePath:path,originalName:f.name||'',contentType:'image/jpeg',size:blob.size,createdAt:new Date().toISOString()});closeModal();await loadAll()}catch(e){console.error(e);alert('Nie udało się zapisać zdjęcia w Firebase Storage: '+(e?.message||e))}};
'''
s = s[:i] + new_save + s[j:]

app.write_text(s, encoding='utf-8')
print('Photo storage patch applied to app.js')

rules = Path('storage.rules')
r = rules.read_text(encoding='utf-8')

building_fn = """    function hasBuildingPermission(action) {
      return activeMember() && (
        isAdmin() ||
        ('permissions' in profile().data &&
         'buildings' in profile().data.permissions &&
         action in profile().data.permissions.buildings &&
         profile().data.permissions.buildings[action] == true)
      );
    }
"""
photo_fn = """
    function hasPhotoPermission(action) {
      return activeMember() && (
        isAdmin() ||
        ('permissions' in profile().data &&
         'photos' in profile().data.permissions &&
         action in profile().data.permissions.photos &&
         profile().data.permissions.photos[action] == true)
      );
    }
"""
if 'function hasPhotoPermission(action)' not in r:
    if building_fn not in r: raise SystemExit('building permission function not found')
    r = r.replace(building_fn, building_fn + photo_fn, 1)

photo_rule = """
    match /companies/{companyId}/photos/{photoId}/{fileName} {
      allow read: if sameCompany(companyId) && hasPhotoPermission('view');
      allow create: if sameCompany(companyId) && hasPhotoPermission('add')
                    && request.resource.size < 10 * 1024 * 1024
                    && request.resource.contentType.matches('image/.*');
      allow update: if sameCompany(companyId) && hasPhotoPermission('edit')
                    && request.resource.size < 10 * 1024 * 1024
                    && request.resource.contentType.matches('image/.*');
      allow delete: if sameCompany(companyId) && hasPhotoPermission('delete');
    }
"""
if 'match /companies/{companyId}/photos/{photoId}/{fileName}' not in r:
    insert = '    match /companies/{companyId}/buildings/{buildingId}/{folderId}/{fileName} {'
    pos = r.find(insert)
    if pos == -1: raise SystemExit('building rule marker not found')
    r = r[:pos] + photo_rule + '\n' + r[pos:]

rules.write_text(r, encoding='utf-8')
print('Photo Storage rules added')
