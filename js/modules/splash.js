import {getApps,getApp,initializeApp} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {firebaseConfig} from "../../firebase-config.js";

const app=getApps().length?getApp():initializeApp(firebaseConfig);
const auth=getAuth(app);
let shown=false;

function ensureStyles(){
  if(document.getElementById('serwisantSplashStyle'))return;
  const s=document.createElement('style');
  s.id='serwisantSplashStyle';
  s.textContent=`
    #serwisantSplash{position:fixed;inset:0;z-index:99999;background:#fff;display:flex;align-items:center;justify-content:center;opacity:1;transition:opacity .35s ease}
    #serwisantSplash.hide{opacity:0;pointer-events:none}
    #serwisantSplash img{max-width:min(72vw,420px);max-height:55vh;object-fit:contain;filter:drop-shadow(0 8px 24px rgba(0,0,0,.10));animation:splashIn .45s ease both}
    @keyframes splashIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
  `;
  document.head.appendChild(s);
}

function showSplash(){
  if(shown)return;
  shown=true;
  ensureStyles();
  const overlay=document.createElement('div');
  overlay.id='serwisantSplash';
  overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML='<img src="./assets/logo.jpg" alt="Logo firmy">';
  document.body.appendChild(overlay);
  setTimeout(()=>{
    overlay.classList.add('hide');
    setTimeout(()=>overlay.remove(),380);
  },2000);
}

onAuthStateChanged(auth,u=>{if(u)showSplash()});

window.SerwisantModules=window.SerwisantModules||{};
window.SerwisantModules.splash={name:'Ekran startowy',version:'10.1',loaded:true};
