// Serwisant PRO — Polski / Українська
// Bezpieczny przełącznik języka bez MutationObserver.
window.SerwisantModules = window.SerwisantModules || {};

const STORAGE_KEY='serwisantLanguage';
let currentLang=localStorage.getItem(STORAGE_KEY)||'pl';
const originalText=new WeakMap();
const originalAttrs=new WeakMap();

const UA=new Map(Object.entries({
  'System obsługi serwisu i zleceń':'Система обслуговування сервісу та замовлень',
  'Logowanie':'Вхід','Łączenie z Firebase...':'Підключення до Firebase...','Zaloguj':'Увійти','Utwórz konto':'Створити обліковий запис',
  'E-mail':'Електронна пошта','Hasło':'Пароль','Wyloguj':'Вийти','Strona główna':'Головна сторінка','← Strona główna':'← Головна сторінка',
  'Zamknij':'Закрити','Zapisz':'Зберегти','Anuluj':'Скасувати','Edytuj':'Редагувати','Usuń':'Видалити','Do kosza':'У кошик',
  'Dodaj':'Додати','+ Dodaj':'+ Додати','Odśwież':'Оновити','Szukaj':'Пошук','Wszystkie':'Усі','Wszystko':'Усе',
  'Pracownik':'Працівник','Pracownicy':'Працівники','Wszyscy pracownicy':'Усі працівники','Klient':'Клієнт','Klienci':'Клієнти',
  'Urządzenie':'Пристрій','Urządzenia':'Пристрої','Zlecenia':'Замовлення','Zlecenie':'Замовлення','Przeglądy':'Огляди','Przegląd':'Огляд',
  'Serwis':'Сервіс','Czas pracy':'Робочий час','Użytkownicy':'Користувачі','Samochody':'Автомобілі','Paliwo':'Пальне',
  'Budowy':'Об’єкти','Finanse':'Фінанси','Uprawnienia':'Допуски','Certyfikaty':'Сертифікати','BHP':'Охорона праці',
  'BHP pracowników':'Охорона праці працівників','Pierwsza pomoc':'Перша допомога','Notatki':'Нотатки','Linki':'Посилання',
  'Powiadomienia':'Сповіщення','Powiadomienia i alerty':'Сповіщення та попередження','Pogoda':'Погода',
  'Po terminie':'Прострочено','Do 7 dni':'До 7 днів','Do 30 dni':'До 30 днів','Ważne':'Дійсні','Łącznie':'Разом',
  'Nowy wpis BHP':'Новий запис з охорони праці','+ Dodaj wpis BHP':'+ Додати запис з охорони праці','Rodzaj':'Тип',
  'Data wykonania':'Дата виконання','Ważne do':'Дійсне до','Uwagi':'Примітки','Dokument':'Документ','Otwórz':'Відкрити',
  'Szkolenie wstępne BHP':'Вступне навчання з охорони праці','Szkolenie okresowe BHP':'Періодичне навчання з охорони праці',
  'Badania lekarskie':'Медичний огляд','Instruktaż stanowiskowy':'Інструктаж на робочому місці','Ocena ryzyka zawodowego':'Оцінка професійного ризику',
  'Inne':'Інше','Brak wpisów BHP.':'Немає записів з охорони праці.','Wybierz pracownika.':'Виберіть працівника.',
  'Nazwa':'Назва','Imię i nazwisko':'Ім’я та прізвище','Telefon':'Телефон','Adres':'Адреса','Data':'Дата','Status':'Статус','Opis':'Опис',
  'Numer seryjny':'Серійний номер','Typ urządzenia':'Тип пристрою','Producent':'Виробник','Model':'Модель','Zdjęcia':'Фото',
  'Tak':'Так','Nie':'Ні','Aktywny':'Активний','Nieaktywny':'Неактивний','Administrator':'Адміністратор','Biuro':'Офіс',
  'Podgląd':'Перегляд','Dodawanie':'Додавання','Edycja':'Редагування','Usuwanie':'Видалення','Ustawienia':'Налаштування'
}));

const replacements=[
  [/\bza (\d+) dni\b/g,'через $1 дн.'],
  [/(\d+) dni po terminie/g,'прострочено на $1 дн.'],
  [/Zostało (\d+) dni/g,'Залишилось $1 дн.'],
  [/Po terminie o (\d+) dni/g,'Прострочено на $1 дн.'],
  [/Termin:\s*/g,'Термін: '],
  [/Wykonano:\s*/g,'Виконано: '],
  [/Ważne do:\s*/g,'Дійсне до: ']
];

function translateString(value){
  if(currentLang!=='ua'||!value)return value;
  const trimmed=value.trim();
  if(UA.has(trimmed)){
    const lead=value.match(/^\s*/)?.[0]||'';
    const trail=value.match(/\s*$/)?.[0]||'';
    return lead+UA.get(trimmed)+trail;
  }
  let out=value;
  for(const [rx,to] of replacements)out=out.replace(rx,to);
  return out;
}

function shouldSkip(node){
  const p=node?.parentElement;
  return !p||!!p.closest('script,style,code,pre,[data-no-i18n]');
}

function translateTextNode(node){
  if(shouldSkip(node))return;
  if(!originalText.has(node))originalText.set(node,node.nodeValue);
  const base=originalText.get(node);
  const next=currentLang==='ua'?translateString(base):base;
  if(node.nodeValue!==next)node.nodeValue=next;
}

function translateElementAttrs(el){
  if(!(el instanceof Element)||el.closest('[data-no-i18n]'))return;
  const attrs=['placeholder','title','aria-label'];
  if(el.tagName==='INPUT'&&['button','submit','reset'].includes((el.type||'').toLowerCase()))attrs.push('value');
  if(!originalAttrs.has(el))originalAttrs.set(el,{});
  const saved=originalAttrs.get(el);
  for(const a of attrs){
    if(!el.hasAttribute(a))continue;
    if(saved[a]===undefined)saved[a]=el.getAttribute(a);
    const next=currentLang==='ua'?translateString(saved[a]):saved[a];
    if(el.getAttribute(a)!==next)el.setAttribute(a,next);
  }
}

function applyLanguage(root=document.body){
  if(!root)return;
  document.documentElement.lang=currentLang==='ua'?'uk':'pl';
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let n;
  while((n=walker.nextNode()))translateTextNode(n);
  root.querySelectorAll?.('*').forEach(translateElementAttrs);
  const btn=document.getElementById('languageToggle');
  if(btn){
    btn.textContent=currentLang==='ua'?'🇺🇦 UA':'🇵🇱 PL';
    btn.title=currentLang==='ua'?'Змінити мову на польську':'Zmień język na ukraiński';
  }
}

function installToggle(){
  if(document.getElementById('languageToggle'))return;
  const header=document.querySelector('header');
  if(!header)return;
  const btn=document.createElement('button');
  btn.id='languageToggle';
  btn.type='button';
  btn.className='secondary';
  btn.setAttribute('data-no-i18n','');
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

installToggle();
applyLanguage(document.body);

window.SerwisantModules['i18n']={
  name:'Polski / Українська',version:'10.3',loaded:true,
  setLanguage,getLanguage:()=>currentLang,reload:()=>applyLanguage(document.body)
};