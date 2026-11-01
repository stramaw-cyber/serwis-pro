// Serwisant PRO — Polski / Українська
// Globalny przełącznik języka interfejsu z zapamiętywaniem wyboru.
window.SerwisantModules = window.SerwisantModules || {};

const STORAGE_KEY = 'serwisantLanguage';
let currentLang = localStorage.getItem(STORAGE_KEY) || 'pl';
const originalText = new WeakMap();
const originalAttrs = new WeakMap();
let observer = null;
let translating = false;

const UA = new Map(Object.entries({
  'System obsługi serwisu i zleceń':'Система обслуговування сервісу та замовлень',
  'Wyloguj':'Вийти',
  'Zaloguj':'Увійти',
  'Zaloguj się':'Увійти',
  'E-mail':'Електронна пошта',
  'Hasło':'Пароль',
  'Strona główna':'Головна сторінка',
  '← Strona główna':'← Головна сторінка',
  'Zamknij':'Закрити',
  'Zapisz':'Зберегти',
  'Anuluj':'Скасувати',
  'Edytuj':'Редагувати',
  'Usuń':'Видалити',
  'Do kosza':'У кошик',
  'Dodaj':'Додати',
  '+ Dodaj':'+ Додати',
  'Odśwież':'Оновити',
  'Szukaj':'Пошук',
  'Wszystkie':'Усі',
  'Wszystko':'Усе',
  'Wszyscy pracownicy':'Усі працівники',
  'Pracownik':'Працівник',
  'Pracownicy':'Працівники',
  'Klient':'Клієнт',
  'Klienci':'Клієнти',
  'Urządzenie':'Пристрій',
  'Urządzenia':'Пристрої',
  'Zlecenia':'Замовлення',
  'Zlecenie':'Замовлення',
  'Przeglądy':'Огляди',
  'Przegląd':'Огляд',
  'Serwis':'Сервіс',
  'Czas pracy':'Робочий час',
  'Użytkownicy':'Користувачі',
  'Samochody':'Автомобілі',
  'Paliwo':'Пальне',
  'Budowy':'Об’єкти',
  'Finanse':'Фінанси',
  'Uprawnienia':'Допуски',
  'Certyfikaty':'Сертифікати',
  'BHP':'Охорона праці',
  'BHP pracowników':'Охорона праці працівників',
  'Pierwsza pomoc':'Перша допомога',
  'Notatki':'Нотатки',
  'Linki':'Посилання',
  'Powiadomienia':'Сповіщення',
  'Powiadomienia i alerty':'Сповіщення та попередження',
  'Pogoda':'Погода',
  'Centrum alertów':'Центр попереджень',
  '🔔 Centrum alertów':'🔔 Центр попереджень',
  '📲 Powiadomienia push':'📲 Push-сповіщення',
  'Włącz push na tym urządzeniu':'Увімкнути push на цьому пристрої',
  'Wyłącz push':'Вимкнути push',
  'Wyślij test':'Надіслати тест',
  'Push aktywny':'Push активний',
  'Push nieaktywny':'Push неактивний',
  'Po terminie':'Прострочено',
  'Do 7 dni':'До 7 днів',
  'Do 30 dni':'До 30 днів',
  'Ważne':'Дійсні',
  'Łącznie':'Разом',
  'Wszystkie typy':'Усі типи',
  'Uprawnienie':'Допуск',
  'Samochód':'Автомобіль',
  'Budowa':'Об’єкт',
  'Oddzwonienie':'Передзвонити',
  'Brak alertów dla wybranego filtra.':'Немає попереджень для вибраного фільтра.',
  'Otwórz':'Відкрити',
  'Nowy wpis BHP':'Новий запис з охорони праці',
  '+ Dodaj wpis BHP':'+ Додати запис з охорони праці',
  'Rodzaj':'Тип',
  'Data wykonania':'Дата виконання',
  'Ważne do':'Дійсне до',
  'Uwagi':'Примітки',
  'Dokument':'Документ',
  'Szkolenie wstępne BHP':'Вступне навчання з охорони праці',
  'Szkolenie okresowe BHP':'Періодичне навчання з охорони праці',
  'Badania lekarskie':'Медичний огляд',
  'Instruktaż stanowiskowy':'Інструктаж на робочому місці',
  'Ocena ryzyka zawodowego':'Оцінка професійного ризику',
  'Potwierdzenie zapoznania z BHP':'Підтвердження ознайомлення з охороною праці',
  'Inne':'Інше',
  'Brak wpisów BHP.':'Немає записів з охорони праці.',
  'Brak uprawnienia.':'Немає дозволу.',
  'Brak uprawnienia do podglądu BHP.':'Немає дозволу на перегляд охорони праці.',
  'Wybierz pracownika.':'Виберіть працівника.',
  'Maksymalny rozmiar pliku to 25 MB.':'Максимальний розмір файлу — 25 МБ.',
  'Przenieść wpis BHP do kosza?':'Перемістити запис з охорони праці до кошика?',
  'Wymagają uwagi:':'Потребують уваги:',
  'Najbliższe terminy BHP':'Найближчі терміни з охорони праці',
  'Termin upływa dzisiaj':'Термін закінчується сьогодні',
  'WAŻNE':'ДІЙСНЕ',
  'KOŃCZY SIĘ':'ЗАКІНЧУЄТЬСЯ',
  'PO TERMINIE':'ПРОСТРОЧЕНО',
  'Nowy wpis':'Новий запис',
  'Nazwa':'Назва',
  'Imię i nazwisko':'Ім’я та прізвище',
  'Telefon':'Телефон',
  'Adres':'Адреса',
  'Data':'Дата',
  'Status':'Статус',
  'Opis':'Опис',
  'Numer seryjny':'Серійний номер',
  'Typ urządzenia':'Тип пристрою',
  'Producent':'Виробник',
  'Model':'Модель',
  'Zdjęcia':'Фото',
  'Dodaj zdjęcie':'Додати фото',
  'Brak danych':'Немає даних',
  'Brak wpisów.':'Немає записів.',
  'Tak':'Так',
  'Nie':'Ні',
  'Aktywny':'Активний',
  'Nieaktywny':'Неактивний',
  'Administrator':'Адміністратор',
  'Biuro':'Офіс',
  'Pracownik terenowy':'Польовий працівник',
  'Podgląd':'Перегляд',
  'Dodawanie':'Додавання',
  'Edycja':'Редагування',
  'Usuwanie':'Видалення',
  'Ustawienia':'Налаштування',
  'Język':'Мова',
  'Polski':'Польська',
  'Ukraiński':'Українська'
}));

const replacements = [
  [/\bza (\d+) dni\b/g, 'через $1 дн.'],
  [/(\d+) dni po terminie/g, 'прострочено на $1 дн.'],
  [/Zostało (\d+) dni/g, 'Залишилось $1 дн.'],
  [/Po terminie o (\d+) dni/g, 'Прострочено на $1 дн.'],
  [/Termin:\s*/g, 'Термін: '],
  [/Wykonano:\s*/g, 'Виконано: '],
  [/Ważne do:\s*/g, 'Дійсне до: '],
  [/Brak /g, 'Немає ']
];

function translateString(value){
  if(currentLang !== 'ua' || !value) return value;
  const trimmed = value.trim();
  if(UA.has(trimmed)){
    const lead=value.match(/^\s*/)?.[0]||'', trail=value.match(/\s*$/)?.[0]||'';
    return lead + UA.get(trimmed) + trail;
  }
  let out=value;
  for(const [rx,to] of replacements) out=out.replace(rx,to);
  return out;
}

function shouldSkip(node){
  const p=node?.parentElement;
  if(!p)return true;
  return !!p.closest('script,style,code,pre,[data-no-i18n]');
}

function translateTextNode(node){
  if(shouldSkip(node))return;
  if(!originalText.has(node)) originalText.set(node,node.nodeValue);
  const base=originalText.get(node);
  node.nodeValue=currentLang==='ua'?translateString(base):base;
}

function translateElementAttrs(el){
  if(!(el instanceof Element)||el.closest('[data-no-i18n]'))return;
  const attrs=['placeholder','title','aria-label'];
  if(el.tagName==='INPUT' && ['button','submit','reset'].includes((el.type||'').toLowerCase())) attrs.push('value');
  if(!originalAttrs.has(el)) originalAttrs.set(el,{});
  const saved=originalAttrs.get(el);
  for(const a of attrs){
    if(!el.hasAttribute(a))continue;
    if(saved[a]===undefined)saved[a]=el.getAttribute(a);
    el.setAttribute(a,currentLang==='ua'?translateString(saved[a]):saved[a]);
  }
}

function applyLanguage(root=document.body){
  if(!root)return;
  translating=true;
  document.documentElement.lang=currentLang==='ua'?'uk':'pl';
  if(root.nodeType===Node.TEXT_NODE) translateTextNode(root);
  else {
    if(root instanceof Element)translateElementAttrs(root);
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let n;while((n=walker.nextNode()))translateTextNode(n);
    if(root.querySelectorAll)root.querySelectorAll('*').forEach(translateElementAttrs);
  }
  const btn=document.getElementById('languageToggle');
  if(btn){btn.textContent=currentLang==='ua'?'🇺🇦 UA':'🇵🇱 PL';btn.title=currentLang==='ua'?'Змінити мову на польську':'Zmień język na ukraiński';}
  translating=false;
}

function installToggle(){
  if(document.getElementById('languageToggle'))return;
  const header=document.querySelector('header');if(!header)return;
  const btn=document.createElement('button');
  btn.id='languageToggle';btn.type='button';btn.className='secondary';btn.setAttribute('data-no-i18n','');
  btn.style.cssText='min-width:72px;font-weight:800;white-space:nowrap';
  btn.onclick=()=>setLanguage(currentLang==='ua'?'pl':'ua');
  const logout=document.getElementById('logoutBtn');
  if(logout)header.insertBefore(btn,logout);else header.appendChild(btn);
}

function setLanguage(lang){
  currentLang=lang==='ua'?'ua':'pl';
  localStorage.setItem(STORAGE_KEY,currentLang);
  applyLanguage(document.body);
  window.dispatchEvent(new CustomEvent('serwisant-language-changed',{detail:{language:currentLang}}));
}

window.setAppLanguage=setLanguage;
window.getAppLanguage=()=>currentLang;
window.toggleAppLanguage=()=>setLanguage(currentLang==='ua'?'pl':'ua');

function start(){
  installToggle();applyLanguage(document.body);
  observer=new MutationObserver(mutations=>{
    if(translating)return;
    for(const m of mutations){
      if(m.type==='characterData'){
        originalText.delete(m.target);translateTextNode(m.target);
      }
      for(const n of m.addedNodes){
        if(n.nodeType===Node.TEXT_NODE){originalText.delete(n);translateTextNode(n)}
        else if(n.nodeType===Node.ELEMENT_NODE)applyLanguage(n);
      }
    }
  });
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});
}

start();
window.SerwisantModules['i18n']={name:'Polski / Українська',version:'10.1',loaded:true,setLanguage,getLanguage:()=>currentLang,reload:()=>applyLanguage(document.body)};
