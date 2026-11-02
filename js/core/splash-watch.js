(()=>{
  const LOGO='./assets/logo_fumanka_animated.gif?v=1';
  let lastLoggedIn=false;
  let splashVisible=false;

  function ensureStyle(){
    if(document.getElementById('serwisantSplashWatchStyle')) return;
    const s=document.createElement('style');
    s.id='serwisantSplashWatchStyle';
    s.textContent=`
      #serwisantSplashWatch{position:fixed;inset:0;z-index:2147483647;background:#fff;display:flex;align-items:center;justify-content:center;opacity:1;transition:opacity .35s ease}
      #serwisantSplashWatch.hide{opacity:0;pointer-events:none}
      #serwisantSplashWatch img{max-width:min(78vw,460px);max-height:58vh;object-fit:contain}
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
    const img=document.createElement('img');
    img.src=`${LOGO}&t=${Date.now()}`;
    img.alt='Logo firmy';
    el.appendChild(img);
    document.body.appendChild(el);
    setTimeout(()=>{
      el.classList.add('hide');
      setTimeout(()=>{
        el.remove();
        splashVisible=false;
      },380);
    },2000);
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
