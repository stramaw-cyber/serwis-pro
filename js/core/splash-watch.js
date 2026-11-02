(()=>{
  const LOGO='./assets/logo.gif';
  let lastLoggedIn=false;
  let splashVisible=false;

  function ensureStyle(){
    if(document.getElementById('serwisantSplashWatchStyle')) return;
    const s=document.createElement('style');
    s.id='serwisantSplashWatchStyle';
    s.textContent=`
      #serwisantSplashWatch{position:fixed;inset:0;z-index:2147483647;background:#fff;display:flex;align-items:center;justify-content:center;opacity:1;transition:opacity .35s ease}
      #serwisantSplashWatch.hide{opacity:0;pointer-events:none}
      #serwisantSplashWatch img{max-width:min(78vw,460px);max-height:58vh;object-fit:contain;animation:serwisantSplashIn .35s ease both}
      @keyframes serwisantSplashIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
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
    el.innerHTML=`<img src="${LOGO}" alt="Logo firmy">`;
    document.body.appendChild(el);
    setTimeout(()=>{
      el.classList.add('hide');
      setTimeout(()=>{
        el.remove();
        splashVisible=false;
      },380);
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
