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

    // Stabilny silnik odziedziczony z v9.
    await import("./app.js");

    // Moduły funkcjonalne — od tej wersji rozwijamy je osobno.
    const files = [
      "clients","devices","orders","inspections","service","employees","worktime",
      "vehicles","fuel","buildings","finance","certificates","bhp","firstaid",
      "notes","links","messages","i18n","weather"
    ];
    for(const f of files){
      await safeImport(new URL(`../modules/${f}.js`, import.meta.url).href);
    }
  }catch(e){
    console.error(e);
    document.body.innerHTML = `<div style="padding:24px;font-family:system-ui">
      <h2>Serwisant PRO — błąd uruchomienia</h2>
      <pre style="white-space:pre-wrap">${String(e)}</pre>
    </div>`;
  }
})();
