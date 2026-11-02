(()=>{
  const LOGO='./assets/logo.jpg';
  let lastLoggedIn=false;
  let splashVisible=false;

  function ensureStyle(){
    if(document.getElementById('serwisantSplashWatchStyle')) return;
    const s=document.createElement('style');
    s.id='serwisantSplashWatchStyle';
    s.textContent=`
      #serwisantSplashWatch{position:fixed;inset:0;z-index:2147483647;background:#fff;display:flex;align-items:center;justify-content:center;opacity:1;transition:opacity .45s ease;overflow:hidden}
      #serwisantSplashWatch.hide{opacity:0;pointer-events:none}
      #serwisantSplashWatch .logoWrap{position:relative;display:flex;align-items:center;justify-content:center;width:min(82vw,520px);height:min(64vh,520px)}
      #serwisantSplashWatch img{max-width:100%;max-height:100%;object-fit:contain;animation:serwisantLogoIntro 5s ease-in-out both;filter:drop-shadow(0 8px 24px rgba(0,0,0,.10))}
      #serwisantSplashWatch .shine{position:absolute;inset:-30%;background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,0) 43%,rgba(255,255,255,.72) 50%,rgba(255,255,255,0) 57%,transparent 65%);transform:translateX(-120%);animation:serwisantShine 5s ease-in-out both;pointer-events:none;mix-blend-mode:screen}
      @keyframes serwisantLogoIntro{
        0%{opacity:0;transform:scale(.84)}
        14%{opacity:1;transform:scale(1.04)}
        28%{transform:scale(1)}
        74%{transform:scale(1)}
        92%{opacity:1;transform:scale(1.02)}
        100%{opacity:1;transform:scale(1)}
      }
      @keyframes serwisantShine{
        0%,28%{transform:translateX(-120%)}
        56%{transform:translateX(120%)}
        100%{transform:translateX(120%)}
      }
    `;
    document.head.appendChild(s);
  }

  function showSplash(){
    if(splashVisible) return;
    splashVisible=true;
    ensureStyle();
    document.getElementById('serwisantSplashWatch')?.remove();
    const el=document.createElement('div');
    el.id='serwisantSplashWatch';
    el.innerHTML=`<div class="logoWrap"><img src="${LOGO}?v=10.9" alt="Logo firmy"><div class="shine"></div></div>`;
    document.body.appendChild(el);
    setTimeout(()=>{
      el.classList.add('hide');
      setTimeout(()=>{
        el.remove();
        splashVisible=false;
      },460);
    },5000);
  }

  function check(){
    const login=document.getElementById('loginPage');
    const app=document.getElementById('app');
    if(!login||!app) return;
    const loggedIn=login.classList.contains('hidden') && !app.classList.contains('hidden');
    if(loggedIn && !lastLoggedIn) showSplash();
    lastLoggedIn=loggedIn;
  }

  setInterval(check,100);
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) check(); });
})();
