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
  const title = payload.notification?.title || "Serwisant PRO";

  const options = {
    body: payload.notification?.body || "Masz nowe przypomnienie serwisowe.",
    data: payload.data || {}
  };

  self.registration.showNotification(title, options);
});