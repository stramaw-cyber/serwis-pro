importScripts("https://www.gstatic.com/firebasejs/12.4.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAm5PrX7rfGUQgtgq2mZ2nhSjjnL5VP8OA",
  authDomain: "serwis-pro-ecd90.firebaseapp.com",
  projectId: "serwis-pro-ecd90",
  storageBucket: "serwis-pro-ecd90.firebasestorage.app",
  messagingSenderId: "442263267918",
  appId: "1:442263267918:web:61127c949fa41c8f87f11f"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || "Serwisant PRO";
  const options = {
    body: payload.notification?.body || payload.data?.body || "Masz nowe przypomnienie serwisowe.",
    icon: "./assets/logo.jpg",
    badge: "./assets/logo.jpg",
    data: payload.data || {},
    tag: payload.data?.tag || "serwisant-pro-alerts",
    renotify: true
  };
  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const raw = event.notification?.data?.url || "?page=alertsPage";
  const target = new URL(raw, self.registration.scope).href;
  event.waitUntil((async()=>{
    const list = await clients.matchAll({type:"window",includeUncontrolled:true});
    for(const c of list){
      if("focus" in c){await c.focus(); if("navigate" in c) await c.navigate(target); return;}
    }
    if(clients.openWindow) await clients.openWindow(target);
  })());
});
