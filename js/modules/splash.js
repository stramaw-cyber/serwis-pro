window.SerwisantModules=window.SerwisantModules||{};
let shown=false;
let wasAppVisible=false;

function ensureStyles(){
  if(document.getElementById('serwisantSplashStyle'))return;
  const s=document.createElement('style');
  s.id='serwisantSplashStyle';
  s.textContent=`
    #serwisantSplash{position:fixed;inset:0;z-index:999999;background:#fff;display:flex;align-items:center;justify-content:center;opacity:1;transition:opacity .35s ease}
    #serwisantSplash.hide{opacity:0;pointer-events:none}
    #serwisantSplash img{max-width:min(78vw,460px);max-height:58vh;object-fit:contain;filter:drop-shadow(0 8px 24px rgba(0,0,0,.10));animation:splashIn .45s ease both}
    @keyframes splashIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
  `;
  document.head.appendChild(s);
}

function showSplash(){
  if(shown)return;
  shown=true;
  ensureStyles();
  document.getElementById('serwisantSplash')?.remove();
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

function appVisible(){
  const app=document.getElementById('app');
  const login=document.getElementById('loginPage');
  return !!app && !app.classList.contains('hidden') && (!login || login.classList.contains('hidden'));
}

function checkLoginTransition(){
  const visible=appVisible();
  if(visible && !wasAppVisible)showSplash();
  wasAppVisible=visible;
}

wasAppVisible=appVisible();
if(wasAppVisible)showSplash();
const timer=setInterval(checkLoginTransition,120);
setTimeout(()=>clearInterval(timer),30000);

document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkLoginTransition()});
window.addEventListener('focus',checkLoginTransition);

window.SerwisantModules.splash={name:'Ekran startowy',version:'10.2',loaded:true,show:showSplash};
