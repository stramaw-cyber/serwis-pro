const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

const REGION = "europe-west1";
const COMPANY_COLLECTIONS = [
  "clients","devices","orders","employees","worklogs","absences",
  "inspections","photos","protocols","vehicles","trips","fuel",
  "callbacks","knowledge"
];

function requireAuth(request){
  if(!request.auth) throw new HttpsError("unauthenticated","Musisz być zalogowany.");
  return request.auth.uid;
}

async function getProfile(uid){
  const snap = await db.collection("userProfiles").doc(uid).get();
  return snap.exists ? {id:snap.id,...snap.data()} : null;
}

async function requireAdmin(request){
  const uid=requireAuth(request);
  const profile=await getProfile(uid);
  if(!profile || profile.role!=="admin" || profile.active===false){
    throw new HttpsError("permission-denied","Tylko administrator może wykonać tę operację.");
  }
  return profile;
}

exports.ensureCompanyAdmin = onCall({region:REGION}, async (request)=>{
  const uid=requireAuth(request);
  const profileRef=db.collection("userProfiles").doc(uid);
  const existing=await profileRef.get();
  if(existing.exists) return {ok:true,profile:{id:uid,...existing.data()}};

  const userRecord=await getAuth().getUser(uid);
  const companyRef=db.collection("companies").doc();
  const companyId=companyRef.id;
  const name=userRecord.displayName || userRecord.email || "Administrator";

  await db.runTransaction(async tx=>{
    tx.set(companyRef,{
      name:"Firma",
      ownerUid:uid,
      createdAt:FieldValue.serverTimestamp(),
      active:true
    });
    tx.set(profileRef,{
      uid,
      companyId,
      ownerUid:uid,
      name,
      email:userRecord.email||"",
      role:"admin",
      permissions:{},
      active:true,
      createdAt:FieldValue.serverTimestamp(),
      updatedAt:FieldValue.serverTimestamp()
    });
  });

  return {ok:true,companyId,role:"admin"};
});

exports.getMyCompanyContext = onCall({region:REGION}, async (request)=>{
  const uid=requireAuth(request);
  const profile=await getProfile(uid);
  if(!profile || profile.active===false){
    throw new HttpsError("permission-denied","Brak aktywnego profilu użytkownika.");
  }
  return {
    ok:true,
    profile,
    companyId:profile.companyId,
    ownerUid:profile.ownerUid||uid
  };
});

exports.migrateCompanyData = onCall({region:REGION, timeoutSeconds:540}, async (request)=>{
  const admin=await requireAdmin(request);
  const ownerUid=admin.ownerUid||request.auth.uid;
  const companyId=admin.companyId;
  if(!companyId) throw new HttpsError("failed-precondition","Brak companyId administratora.");

  const companyRef=db.collection("companies").doc(companyId);
  const companySnap=await companyRef.get();
  if(companySnap.exists && companySnap.data()?.companyMigrationV1Done===true){
    return {ok:true,alreadyDone:true,migrated:0};
  }

  let migrated=0;
  for(const name of COMPANY_COLLECTIONS){
    const snap=await db.collection(name).where("ownerUid","==",ownerUid).get();
    let batch=db.batch();
    let count=0;
    for(const d of snap.docs){
      if(d.data().companyId===companyId) continue;
      batch.set(d.ref,{companyId,ownerUid},{merge:true});
      migrated++;
      count++;
      if(count>=400){
        await batch.commit();
        batch=db.batch();
        count=0;
      }
    }
    if(count>0) await batch.commit();
  }

  await companyRef.set({
    companyMigrationV1Done:true,
    companyMigrationV1At:FieldValue.serverTimestamp(),
    companyMigrationV1Count:migrated
  },{merge:true});

  return {ok:true,migrated};
});

exports.createCompanyUser = onCall({region:REGION}, async (request)=>{
  const admin=await requireAdmin(request);
  const data=request.data||{};
  const name=String(data.name||"").trim();
  const email=String(data.email||"").trim().toLowerCase();
  const password=String(data.password||"");
  const role=["worker","office","admin"].includes(data.role)?data.role:"worker";
  const permissions=(data.permissions && typeof data.permissions==="object")?data.permissions:{};

  if(!name) throw new HttpsError("invalid-argument","Brak imienia i nazwiska.");
  if(!email) throw new HttpsError("invalid-argument","Brak adresu e-mail.");
  if(password.length<6) throw new HttpsError("invalid-argument","Hasło musi mieć minimum 6 znaków.");

  let record;
  try{
    record=await getAuth().createUser({
      email,
      password,
      displayName:name,
      disabled:false,
      emailVerified:false
    });
  }catch(e){
    if(e.code==="auth/email-already-exists")
      throw new HttpsError("already-exists","Konto z tym adresem e-mail już istnieje.");
    throw new HttpsError("internal",e.message||"Nie udało się utworzyć konta.");
  }

  await db.collection("userProfiles").doc(record.uid).set({
    uid:record.uid,
    companyId:admin.companyId,
    ownerUid:admin.ownerUid||admin.uid||request.auth.uid,
    name,
    email,
    role,
    permissions,
    active:true,
    createdBy:request.auth.uid,
    createdAt:FieldValue.serverTimestamp(),
    updatedAt:FieldValue.serverTimestamp()
  });

  return {ok:true,uid:record.uid};
});

exports.updateCompanyUser = onCall({region:REGION}, async (request)=>{
  const admin=await requireAdmin(request);
  const data=request.data||{};
  const uid=String(data.uid||"");
  if(!uid) throw new HttpsError("invalid-argument","Brak UID użytkownika.");

  const target=await getProfile(uid);
  if(!target || target.companyId!==admin.companyId)
    throw new HttpsError("not-found","Nie znaleziono użytkownika w tej firmie.");

  const name=String(data.name||target.name||"").trim();
  const role=["worker","office","admin"].includes(data.role)?data.role:target.role;
  const permissions=(data.permissions && typeof data.permissions==="object")?data.permissions:target.permissions||{};

  await getAuth().updateUser(uid,{displayName:name,disabled:target.active===false});
  await db.collection("userProfiles").doc(uid).update({
    name,role,permissions,updatedAt:FieldValue.serverTimestamp()
  });

  return {ok:true};
});

exports.disableCompanyUser = onCall({region:REGION}, async (request)=>{
  const admin=await requireAdmin(request);
  const uid=String(request.data?.uid||"");
  const disabled=request.data?.disabled!==false;

  if(!uid) throw new HttpsError("invalid-argument","Brak UID użytkownika.");
  if(uid===request.auth.uid) throw new HttpsError("failed-precondition","Nie możesz dezaktywować własnego konta administratora.");

  const target=await getProfile(uid);
  if(!target || target.companyId!==admin.companyId)
    throw new HttpsError("not-found","Nie znaleziono użytkownika w tej firmie.");

  await getAuth().updateUser(uid,{disabled});
  await db.collection("userProfiles").doc(uid).update({
    active:!disabled,
    updatedAt:FieldValue.serverTimestamp()
  });
  return {ok:true};
});