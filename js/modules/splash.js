// Serwisant PRO — ekran startowy po poprawnym logowaniu
window.SerwisantModules=window.SerwisantModules||{};

let active=false;

function ensureStyles(){
  if(document.getElementById('serwisantSplashStyle'))return;
  const s=document.createElement('style');
  s.id='serwisantSplashStyle';
  s.textContent=`
    #serwisantSplash{position:fixed;inset:0;z-index:2147483647;background:#fff;display:flex;align-items:center;justify-content:center;opacity:1;transition:opacity .35s ease}
    #serwisantSplash.hide{opacity:0;pointer-events:none}
    #serwisantSplash img{max-width:min(78vw,480px);max-height:60vh;object-fit:contain;filter:drop-shadow(0 8px 24px rgba(0,0,0,.10));animation:splashIn .45s ease both}
    @keyframes splashIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
  `;
  document.head.appendChild(s);
}

function showSplash(){
  if(active)return;
  active=true;
  ensureStyles();
  document.getElementById('serwisantSplash')?.remove();
  const overlay=document.createElement('div');
  overlay.id='serwisantSplash';
  overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML='<img src="./assets/logo.jpg" alt="Logo firmy">';
  document.body.appendChild(overlay);
  setTimeout(()=>{
    overlay.classList.add('hide');
    setTimeout(()=>{overlay.remove();active=false;},380);
  },2000);
}

// app.js definiuje window.login przed załadowaniem modułów.
// Owijamy istniejącą funkcję logowania i pokazujemy logo po udanym logowaniu.
const originalLogin=window.login;
if(typeof originalLogin==='function'){
  window.login=async function(){
    const result=await originalLogin.apply(this,arguments);
    // signInWithEmailAndPassword zakończył się powodzeniem, jeśli nie było wyjątku.
    showSplash();
    return result;
  };
}

window.showSerwisantSplash=showSplash;
window.SerwisantModules.splash={name:'Ekran startowy',version:'10.4',loaded:true,show:showSplash};
