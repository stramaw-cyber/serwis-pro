const cards=[
['Brak oddechu','Sprawdź bezpieczeństwo. Oceń reakcję i oddech maks. 10 s. Zadzwoń 112. Rozpocznij RKO 30 uciśnięć : 2 oddechy, tempo 100–120/min, głębokość ok. 5–6 cm u dorosłego. Użyj AED, gdy jest dostępne.'],
['Silne krwawienie','Załóż rękawiczki jeśli są. Mocno uciskaj ranę jałowym materiałem. Jeśli krwawienie jest masywne i nie ustępuje, wezwij 112. Nie wyciągaj wbitych przedmiotów.'],
['Porażenie prądem','Najpierw odłącz zasilanie lub odsuń poszkodowanego od źródła tylko bezpiecznym, nieprzewodzącym sposobem. Nie dotykaj go, dopóki obwód jest pod napięciem. Wezwij 112, oceń oddech i rozpocznij RKO/AED jeśli trzeba.'],
['Oparzenie','Usuń źródło ciepła. Chłodź oparzenie chłodną bieżącą wodą przez około 20 min. Zdejmij biżuterię i luźną odzież, ale nie odrywaj przyklejonej. Nie smaruj tłuszczem ani maściami.'],
['Upadek z wysokości','Nie przemieszczaj poszkodowanego bez konieczności, szczególnie przy podejrzeniu urazu kręgosłupa. Wezwij 112. Kontroluj oddech i zabezpiecz przed wychłodzeniem.'],
['Uraz oka','Nie pocieraj oka. Przy opiłku/chemii płucz dużą ilością czystej wody. Przy wbitym przedmiocie nie wyciągaj go i nie uciskaj oka. Pilna pomoc medyczna.'],
['Zadławienie','Jeśli kaszel jest skuteczny — zachęcaj do kaszlu. Przy ciężkim zadławieniu u przytomnego dorosłego: 5 uderzeń między łopatki, następnie 5 uciśnięć nadbrzusza, naprzemiennie. Przy utracie przytomności wezwij 112 i rozpocznij RKO.'],
['Kontakt z chemikaliami','Przerwij narażenie i zdejmij skażoną odzież. Skórę/oczy płucz dużą ilością wody. Nie neutralizuj chemikaliów „domowymi” środkami. Skontaktuj się z 112 lub ośrodkiem toksykologicznym zgodnie z sytuacją.']
];
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function render(){const r=document.getElementById('firstAidCards');if(!r)return;r.innerHTML=cards.map(([t,d])=>`<div class="card"><h3>${esc(t)}</h3><div class="meta" style="font-size:1rem;line-height:1.5">${esc(d)}</div></div>`).join('')}
const timer=setInterval(()=>{if(document.getElementById('firstAidPage')){clearInterval(timer);render()}},250);setTimeout(()=>clearInterval(timer),10000);
window.SerwisantModules=window.SerwisantModules||{};window.SerwisantModules.firstaid={name:'Pierwsza pomoc',version:'10.13',loaded:true,render};