importScripts("https://www.gstatic.com/firebasejs/12.4.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging-compat.js");

// UWAGA: te same dane co w firebase-config.js.
// Service worker nie może importować modułu ES w prostym trybie, dlatego config jest tu powtórzony.
firebase.initializeApp({
  apiKey: "WKLEJ_API_KEY",
  authDomain: "WKLEJ_PROJECT.firebaseapp.com",
  projectId: "WKLEJ_PROJECT_ID",
  storageBucket: "WKLEJ_PROJECT.firebasestorage.app",
  messagingSenderId: "WKLEJ_SENDER_ID",
  appId: "WKLEJ_APP_ID"
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage(payload => {
  const title = payload.notification?.title || "Serwisant PRO";
  const options = {
    body: payload.notification?.body || "Masz nowe przypomnienie serwisowe.",
    icon: "./icon-192.png",
    data: payload.data || {}
  };
  self.registration.showNotification(title, options);
});
