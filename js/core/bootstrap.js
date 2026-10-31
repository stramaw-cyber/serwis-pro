window.SerwisantModules = window.SerwisantModules || {};

async function fetchText(url, optional=false) {
  try {
    const r = await fetch(url, {cache:"no-cache"});
    if (!r.ok) throw new Error(`${r.status}`);
    return await r.text();
  } catch (e) {
    if (optional) return "";
    throw new Error(`Nie można wczytać ${url}: ${e.message || e}`);
  }
}

async function buildInterface() {
  const root = document.getElementById("app-root");
  const [header, login, nav, modal, appExtra, pages] = await Promise.all([
    fetchText("./partials/header.html"),
    fetchText("./partials/login.html"),
    fetchText("./partials/nav.html"),
    fetchText("./partials/modal.html"),
    fetchText("./partials/app-extra.html", true),
    fetch("./js/core/pages.json", {cache:"no-cache"}).then(r => {
      if (!r.ok) throw new Error("Nie można wczytać pages.json");
      return r.json();
    })
  ]);

  const pageHtml = [];
  for (const p of pages) pageHtml.push(await fetchText(p.file));

  root.innerHTML = `
    ${header}
    <div class="container">
      ${login}
      <section id="app" class="hidden">
        ${pageHtml.join("\n")}
        ${appExtra}
      </section>
    </div>
    ${nav}
    ${modal}
  `;
}

async function safeImport(url) {
  try { await import(url); }
  catch (e) { console.warn("Moduł opcjonalny:", url, e); }
}

(async()=>{
  try{
    await buildInterface();
    await import("./app.js");
    const files = [
      "clients","devices","orders","inspections","service","employees","worktime","users",
      "vehicles","fuel","buildings","finance","certificates","bhp","firstaid",
      "notes","links","messages","i18n","weather"
    ];
    const moduleVersions={buildings:"10.12"};
    for(const f of files){
      const base=new URL(`../modules/${f}.js`, import.meta.url).href;
      const url=moduleVersions[f]?`${base}?v=${moduleVersions[f]}`:base;
      await safeImport(url);
    }
  }catch(e){
    console.error(e);
    document.body.innerHTML = `<div style="padding:24px;font-family:system-ui">
      <h2>Serwisant PRO — błąd uruchomienia</h2>
      <pre style="white-space:pre-wrap">${String(e)}</pre>
    </div>`;
  }
})();
