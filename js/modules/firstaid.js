const cards=[
  {title:'Brak oddechu / nagłe zatrzymanie krążenia',tags:['112','rko','aed','uraz'],urgent:true,steps:[
    'Sprawdź bezpieczeństwo miejsca zdarzenia.',
    'Sprawdź reakcję. Udrożnij drogi oddechowe i oceń oddech maksymalnie przez 10 sekund.',
    'Jeśli brak prawidłowego oddechu: zadzwoń 112 lub poproś kogoś o wezwanie pomocy i przyniesienie AED.',
    'Rozpocznij RKO: 30 uciśnięć klatki piersiowej i 2 oddechy. Tempo 100–120/min, głębokość 5–6 cm u dorosłego.',
    'Włącz AED jak najszybciej i wykonuj jego polecenia. Kontynuuj RKO do przyjazdu służb lub powrotu prawidłowego oddechu.'
  ]},
  {title:'Silne krwawienie',tags:['112','krwotok','uraz'],urgent:true,steps:[
    'Załóż rękawiczki, jeśli są dostępne.',
    'Uciskaj ranę bezpośrednio jałowym materiałem lub czystą tkaniną.',
    'Przy masywnym krwotoku wezwij 112. Nie wyciągaj wbitych przedmiotów.',
    'Jeśli opatrunek przesiąka, dołóż kolejną warstwę i dalej uciskaj. Nie odrywaj pierwszej warstwy.'
  ]},
  {title:'Porażenie prądem',tags:['112','instalacje','prąd','uraz'],urgent:true,steps:[
    'Nie dotykaj poszkodowanego, dopóki źródło prądu nie zostanie bezpiecznie odłączone.',
    'Wyłącz zasilanie główne lub odsuń przewód wyłącznie w sposób bezpieczny i nieprzewodzący.',
    'Wezwij 112. Oceń przytomność i oddech.',
    'Przy braku prawidłowego oddechu rozpocznij RKO i użyj AED, jeśli jest dostępne.',
    'Oparzenia po porażeniu potraktuj jak oparzenia termiczne; nie przykładaj lodu.'
  ]},
  {title:'Oparzenie termiczne',tags:['oparzenie','uraz','instalacje'],urgent:false,steps:[
    'Usuń źródło ciepła i zabezpiecz miejsce zdarzenia.',
    'Chłodź oparzenie chłodną bieżącą wodą przez około 20 minut.',
    'Zdejmij biżuterię i luźną odzież, ale nie odrywaj niczego przyklejonego do skóry.',
    'Nie używaj lodu, tłuszczu, past ani maści.',
    'Rozległe, głębokie, elektryczne lub chemiczne oparzenia wymagają pilnej oceny medycznej.'
  ]},
  {title:'Oparzenie chemiczne / kontakt z chemią',tags:['112','chemia','instalacje','oparzenie'],urgent:true,steps:[
    'Zadbaj o własne bezpieczeństwo i użyj rękawic ochronnych.',
    'Usuń skażoną odzież. Suche substancje najpierw ostrożnie usuń ze skóry.',
    'Płucz miejsce dużą ilością chłodnej lub letniej bieżącej wody. Nie próbuj neutralizować środka inną chemią.',
    'Przy kontakcie z oczami płucz nieprzerwanie i pilnie zorganizuj pomoc medyczną.',
    'Przy poważnym kontakcie, oparzeniu chemicznym lub objawach ogólnych dzwoń 112.'
  ]},
  {title:'Podejrzenie zatrucia gazem / tlenkiem węgla',tags:['112','gaz','instalacje','czad'],urgent:true,steps:[
    'Nie wchodź do strefy zagrożenia, jeśli nie jest bezpieczna. Nie ryzykuj własnego zatrucia.',
    'Jeśli można to zrobić bezpiecznie, przerwij źródło gazu i przewietrz pomieszczenie.',
    'Wyprowadź poszkodowanego na świeże powietrze tylko wtedy, gdy jest to bezpieczne.',
    'Dzwoń 112. Oceń oddech. Przy braku prawidłowego oddechu rozpocznij RKO.'
  ]},
  {title:'Upadek z wysokości',tags:['112','uraz','instalacje'],urgent:true,steps:[
    'Nie przemieszczaj poszkodowanego bez konieczności, zwłaszcza przy podejrzeniu urazu kręgosłupa.',
    'Wezwij 112.',
    'Kontroluj oddech i stan świadomości. Zabezpiecz poszkodowanego przed wychłodzeniem.',
    'Jeśli przestanie prawidłowo oddychać, rozpocznij RKO.'
  ]},
  {title:'Uraz oka / ciało obce',tags:['oko','chemia','uraz','instalacje'],urgent:false,steps:[
    'Nie pocieraj oka.',
    'Przy pyle lub drobnym zanieczyszczeniu płucz oko czystą wodą.',
    'Przy substancji chemicznej rozpocznij natychmiast intensywne płukanie i zorganizuj pilną pomoc medyczną.',
    'Nie wyciągaj wbitego przedmiotu i nie uciskaj gałki ocznej.'
  ]},
  {title:'Zadławienie u przytomnego dorosłego',tags:['112','zadławienie','uraz'],urgent:true,steps:[
    'Jeżeli poszkodowany kaszle skutecznie, zachęcaj do kaszlu i obserwuj.',
    'Przy ciężkim zadławieniu wykonaj do 5 uderzeń między łopatki.',
    'Jeśli nieskuteczne, wykonaj do 5 uciśnięć nadbrzusza. Powtarzaj naprzemiennie.',
    'Przy utracie przytomności wezwij 112 i rozpocznij RKO.'
  ]},
  {title:'Omdlenie / nagłe osłabienie',tags:['uraz','112'],urgent:false,steps:[
    'Zadbaj o bezpieczeństwo i połóż osobę, jeśli to możliwe.',
    'Sprawdź oddech i stan świadomości.',
    'Jeśli szybko odzyskuje świadomość, pozostaw w spoczynku i obserwuj.',
    'Brak poprawy, ból w klatce piersiowej, duszność, drgawki lub zaburzenia świadomości są wskazaniem do pilnej pomocy — dzwoń 112.'
  ]}
];

let activeFilter='';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

window.setFirstAidFilter=f=>{activeFilter=f||'';const s=document.getElementById('firstAidSearch');if(s)s.value='';render()};
window.renderFirstAid=()=>render();

function render(){
  const root=document.getElementById('firstAidCards');
  if(!root)return;
  const priority=document.getElementById('firstAidPriority');
  const q=(document.getElementById('firstAidSearch')?.value||'').trim().toLowerCase();
  let list=cards.filter(c=>{
    const text=[c.title,...c.tags,...c.steps].join(' ').toLowerCase();
    if(q&&!text.includes(q))return false;
    if(activeFilter==='112'&&!c.urgent)return false;
    if(activeFilter&&activeFilter!=='112'&&!c.tags.includes(activeFilter))return false;
    return true;
  });
  if(priority){
    const urgent=list.filter(c=>c.urgent).length;
    priority.innerHTML=urgent?`<div class="v8Alert red"><b>⚠ ${urgent} procedur wymagających szybkiej oceny zagrożenia życia.</b> W razie wątpliwości dzwoń 112.</div>`:'';
  }
  root.innerHTML=list.length?list.map(c=>`<div class="card ${c.urgent?'dangerItem':''}">
    <div class="deviceHead"><div><h3 style="margin-top:0">${c.urgent?'🚨 ':'🩹 '}${esc(c.title)}</h3></div>${c.urgent?'<span class="badge red">112</span>':''}</div>
    <ol style="padding-left:1.25rem;line-height:1.55;margin-bottom:0">${c.steps.map(s=>`<li style="margin:.45rem 0">${esc(s)}</li>`).join('')}</ol>
  </div>`).join(''):'<div class="empty">Nie znaleziono procedury. W sytuacji zagrożenia życia dzwoń 112.</div>';
}

const timer=setInterval(()=>{if(document.getElementById('firstAidPage')){clearInterval(timer);render()}},250);
setTimeout(()=>clearInterval(timer),10000);
window.SerwisantModules=window.SerwisantModules||{};
window.SerwisantModules.firstaid={name:'Pierwsza pomoc',version:'10.16',loaded:true,render};