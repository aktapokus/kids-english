/*
 * tools/kids_english/ui/panel.js
 *
 * AGENTS.md Madde 4 sözleşmesi: core, bu tool'un içeriğini hiç bilmez —
 * mount(container, api, toolId) TÜM sayfayı burada render eder. core'un
 * "istek/klasör/analiz et" jenerik akışı bu tool için hiç kullanılmıyor
 * (bkz. web.py'deki gerekçe) — bunun yerine api.apiFetch ile kendi
 * router'ımıza (/api/tools/kids_english/*) gidiyoruz.
 *
 * Yapı: kategori seçim ekranı -> seçilen kategorinin mini-bölümleri
 * (her biri: Kelime Keşfi -> Sorular -> Konuşma -> Kutlama). 20 kategori,
 * ~1000 kelime data/episodes.json'dan geliyor (bkz. web.py). Görsel
 * katman kasıtlı olarak oyun mantığından ayrı tutuluyor
 * (renderObjectIcon, mascotSvg) — ileride emoji/harf rozeti yerine
 * gerçek illüstrasyonlara geçmek sadece bu iki fonksiyonu değiştirmeyi
 * gerektirir, backend/manifest/oyun akışına dokunmadan.
 */

const ICON_EXPAND = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>`;
const ICON_COMPRESS = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>`;
const ICON_SPEAKER = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>`;
const ICON_BACK = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>`;

const CATEGORY_COLORS = [
  '#FFC20E', '#FF4D4D', '#2ECC71', '#4A90E2', '#8D6E63',
];

// Her kategori kartı kendi konusuna özgü bir renk/ton taşısın diye —
// tek tip beyaz kart yerine, her biri kendi "kimliğine" sahip.
// Soluk pastel tonlar yerine DOYGUN, canlı renkler — "hiçbir şey soluk
// olmasın, çocuklar için renkler canlı olmalı" geri bildirimi üzerine
// (referans: Minika Çocuk gibi doygun/parlak renkli çocuk sitelerinin
// tonu). `tint` artık neredeyse beyaza yakın pastel değil, kategori
// renginin kendisinin açık ama belirgin şekilde doygun bir hali.
const CATEGORY_THEME = {
  daily_life:            { c: '#FFA000', dark: '#DB8A00', tint: '#FFCF66' },
  family_people:         { c: '#FF6B9D', dark: '#E5507F', tint: '#FF9EC0' },
  school_education:      { c: '#2ECC71', dark: '#25A85C', tint: '#6BE49A' },
  home:                  { c: '#FF9142', dark: '#E67A2E', tint: '#FFB877' },
  food_drinks:           { c: '#FF6347', dark: '#E24E33', tint: '#FF9782' },
  nature_environment:    { c: '#4CAF50', dark: '#3D9140', tint: '#7ED282' },
  space_astronomy:       { c: '#7C4DFF', dark: '#6435E0', tint: '#B39BFF' },
  animals:               { c: '#43A047', dark: '#357F38', tint: '#78CE7C' },
  sports_exercise:       { c: '#FF5252', dark: '#E23F3F', tint: '#FF8F8F' },
  hobbies_free_time:     { c: '#AB47BC', dark: '#8E38A0', tint: '#D584E4' },
  technology_computers:  { c: '#3F51B5', dark: '#32409A', tint: '#8993D6' },
  travel_transportation: { c: '#29B6F6', dark: '#1D9AD4', tint: '#7DD6FB' },
  city_places:           { c: '#607D8B', dark: '#4C646F', tint: '#9BB3BE' },
  body_health:           { c: '#EF5350', dark: '#D53E3B', tint: '#F58C8A' },
  weather_seasons:       { c: '#42A5F5', dark: '#2E8CDB', tint: '#8FCBFA' },
  emotions_personality:  { c: '#FFCA28', dark: '#E0AC00', tint: '#FFE071' },
  clothes_shopping:      { c: '#EC407A', dark: '#D22C63', tint: '#F587AC' },
  jobs_professions:      { c: '#8D6E63', dark: '#715650', tint: '#B69A8F' },
  science:               { c: '#7E57C2', dark: '#6641A8', tint: '#B597E0' },
  communication_internet:{ c: '#26C6DA', dark: '#1BA9BC', tint: '#78E1EE' },
  prepositions:          { c: '#00ACC1', dark: '#008BA0', tint: '#5DD6E6' },
  question_words:        { c: '#FF7043', dark: '#E5562B', tint: '#FFA383' },
  get:                    { c: '#26A69A', dark: '#1C8079', tint: '#7FD4CB' },
  tourist:                { c: '#8E44AD', dark: '#712E8C', tint: '#C990E0' },
  conversations:          { c: '#EF6C9C', dark: '#D14F80', tint: '#F7A9C6' },
  opposites:              { c: '#7E57C2', dark: '#6641A8', tint: '#B597E0' },
  // "conversation kisminda hepsi tek bir listede yer aliyor bunlari
  // ayirmak lazim" geri bildirimi - tek 'conversations' kategorisi 17
  // konuya bolundu (bkz. scripts/split_conversations.py), her biri kendi
  // rengini tasiyor.
  conv_social_manners:      { c: '#EF6C9C', dark: '#D14F80', tint: '#F7A9C6' },
  conv_family_home:         { c: '#FF9142', dark: '#E67A2E', tint: '#FFB877' },
  conv_daily_routine:       { c: '#FFA000', dark: '#DB8A00', tint: '#FFCF66' },
  conv_school:              { c: '#2ECC71', dark: '#25A85C', tint: '#6BE49A' },
  conv_hobbies_sports:      { c: '#AB47BC', dark: '#8E38A0', tint: '#D584E4' },
  conv_animals_nature:      { c: '#43A047', dark: '#357F38', tint: '#78CE7C' },
  conv_food_drinks:         { c: '#FF6347', dark: '#E24E33', tint: '#FF9782' },
  conv_shopping_clothes:    { c: '#EC407A', dark: '#D22C63', tint: '#F587AC' },
  conv_weather_seasons:     { c: '#42A5F5', dark: '#2E8CDB', tint: '#8FCBFA' },
  conv_city_transport:      { c: '#607D8B', dark: '#4C646F', tint: '#9BB3BE' },
  conv_travel:              { c: '#29B6F6', dark: '#1D9AD4', tint: '#7DD6FB' },
  conv_health:              { c: '#EF5350', dark: '#D53E3B', tint: '#F58C8A' },
  conv_celebrations:        { c: '#FFCA28', dark: '#E0AC00', tint: '#FFE071' },
  conv_feelings_preferences:{ c: '#FFCA28', dark: '#E0AC00', tint: '#FFE071' },
  conv_technology:          { c: '#3F51B5', dark: '#32409A', tint: '#8993D6' },
  conv_space:               { c: '#7C4DFF', dark: '#6435E0', tint: '#B39BFF' },
  conv_jobs_safety:         { c: '#8D6E63', dark: '#715650', tint: '#B69A8F' },
};

// Bazı kategoriler için oyun sahnesine hafif saydam bir "dekor" katmanı
// (bkz. .ke-motif-* kuralları) — "uzay için uzay, doğa için doğa gibi
// olmalı" geri bildirimi üzerine. Diğer kategoriler zaten kendi renk
// tonuyla boyanmış nokta desenini (.ke-stars) kullanmaya devam ediyor.
const SCENE_MOTIF = {
  space_astronomy: 'space',
  nature_environment: 'nature',
  animals: 'nature',
  weather_seasons: 'sky',
  travel_transportation: 'sky',
  city_places: 'water',
};

// Kategori kartlarına "öğrenme dünyası" kimliği katan küçük rozet —
// büyük baş harf zemin deseninin (data-initial) yanında, kartın rengiyle
// birlikte konuyu anında anlatan tek bir emoji. Salt Unicode karakter —
// yeni bir görsel varlık/ağ isteği gerektirmiyor (bkz. görsel varlıklara
// dokunmama kısıtı).
const CATEGORY_MOTIF = {
  daily_life: '⏰', family_people: '👨‍👩‍👧', school_education: '📚',
  home: '🏠', food_drinks: '🍽️', nature_environment: '🌿',
  space_astronomy: '🚀', animals: '🐾', sports_exercise: '⚽',
  hobbies_free_time: '🎨', technology_computers: '💻', travel_transportation: '✈️',
  city_places: '🏙️', body_health: '❤️', weather_seasons: '⛅',
  emotions_personality: '😊', clothes_shopping: '👕', jobs_professions: '💼',
  science: '🔬', communication_internet: '💬',
  prepositions: '📦', question_words: '❓', get: '🔄', conversations: '💬', opposites: '↔️',
  conv_social_manners: '👋', conv_family_home: '🏠', conv_daily_routine: '⏰',
  conv_school: '📚', conv_hobbies_sports: '⚽', conv_animals_nature: '🐾',
  conv_food_drinks: '🍽️', conv_shopping_clothes: '👕', conv_weather_seasons: '⛅',
  conv_city_transport: '🚌', conv_travel: '✈️', conv_health: '❤️',
  conv_celebrations: '🎂', conv_feelings_preferences: '😊', conv_technology: '💻',
  conv_space: '🚀', conv_jobs_safety: '🚨',
};

// A2 kategorileri ('{kategori}_a2') A1'deki ayni temayi/motifi paylasir -
// CEFR denetiminde A2 olarak isaretlenip A1'den tasinan kelimeler, GORSEL
// KIMLIK olarak hala ayni kategoriye ait (ör. daily_life_a2, daily_life
// ile ayni renk/motifi kullanir). Ayri bir renk seti tanimlamiyoruz.
function baseCatId(id) { return id.endsWith('_a2') ? id.slice(0, -3) : id; }

// Kalıcı, gizlilik-dostu ilerleme: sadece bu cihazın tarayıcısında
// (localStorage), sunucuya/buluta hiç gönderilmeden. Ebeveyn tarayıcı
// verisini temizleyerek sıfırlayabilir — ayrı bir "ilerlemeyi sıfırla"
// UI'ı şimdilik yok, kapsam dışı bırakıldı. Yapı:
// { [categoryId]: { completed: [episodeIndex,...], missed: { word: {count, obj} } } }
// --- IndexedDB: localStorage'in arkasinda dayanikli yedek katman + olay
// gunlugu. Neden SQLite/Room degil: bu bir Trusted Web Activity - yani
// gercek bir web sitesini saran Chrome kabugu, native Kotlin/Java kodu
// CALISTIRAMIYOR. IndexedDB, web platformunun kendi yerel/on-device
// veritabani API'si - ayni "sifir bulut, cihazda kalir" ilkesini web
// icin doğru sekilde karsiliyor. --- kv deposu = localStorage'daki HER
// seyin aynasi (profiles, progress_*, streak_*, daily_*) - localStorage
// temizlenirse/tarayici verisi silinirse acilista buradan geri yuklenir.
// events deposu = cevap dogru/yanlis gunlugu, SADECE burada tutulur,
// istatistik ekrani buradan hesaplar.
const IDB_NAME = 'ke_db_v1';
const IDB_VERSION = 1;
let _idbReadyPromise = null;
function openIDB() {
  if (_idbReadyPromise) return _idbReadyPromise;
  _idbReadyPromise = new Promise((resolve) => {
    if (!('indexedDB' in window)) { resolve(null); return; }
    try {
      const req = indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv', { keyPath: 'k' });
        if (!db.objectStoreNames.contains('events')) {
          const es = db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
          es.createIndex('by_profile', 'profileId');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch (e) { resolve(null); }
  });
  return _idbReadyPromise;
}
// Fire-and-forget yazma - hicbir cagiran await etmek zorunda degil,
// IndexedDB yoksa/basarisiz olursa sessizce yok sayilir (localStorage
// zaten birincil, senkron kaynak olmaya devam ediyor).
function idbPut(key, value) {
  openIDB().then((db) => {
    if (!db) return;
    try { db.transaction('kv', 'readwrite').objectStore('kv').put({ k: key, v: value }); } catch (e) { /* yok say */ }
  });
}
function idbLogEvent(evt) {
  openIDB().then((db) => {
    if (!db) return;
    try { db.transaction('events', 'readwrite').objectStore('events').add(evt); } catch (e) { /* yok say */ }
  });
}
function idbGetAllKV() {
  return openIDB().then((db) => {
    if (!db) return {};
    return new Promise((resolve) => {
      try {
        const req = db.transaction('kv', 'readonly').objectStore('kv').getAll();
        req.onsuccess = () => { const out = {}; (req.result || []).forEach((r) => { out[r.k] = r.v; }); resolve(out); };
        req.onerror = () => resolve({});
      } catch (e) { resolve({}); }
    });
  });
}
function idbGetEvents(profileId) {
  return openIDB().then((db) => {
    if (!db) return [];
    return new Promise((resolve) => {
      try {
        const idx = db.transaction('events', 'readonly').objectStore('events').index('by_profile');
        const req = idx.getAll(IDBKeyRange.only(profileId));
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (e) { resolve([]); }
    });
  });
}
// Acilista bir kere: IndexedDB'de olup localStorage'da OLMAYAN her
// anahtari geri yukler (localStorage temizlenmis/tarayici verisi
// silinmis ama uygulama hala kurulu senaryosu). Var olan localStorage
// verisinin USTUNE YAZMAZ - sadece eksikleri tamamlar.
function logAnswerEvent(categoryId, word, isCorrect) {
  try {
    idbLogEvent({
      profileId: Profiles.active().id,
      timestamp: Date.now(),
      categoryId,
      word,
      isCorrect: !!isCorrect,
    });
  } catch (e) { /* yok say */ }
}
async function hydrateFromIDB() {
  try {
    const kv = await idbGetAllKV();
    Object.keys(kv).forEach((k) => {
      if (window.localStorage.getItem(k) === null) {
        try { window.localStorage.setItem(k, JSON.stringify(kv[k])); } catch (e) { /* yok say */ }
      }
    });
  } catch (e) { /* yok say */ }
}

const PROGRESS_KEY = 'ke_progress_v1';
const PROFILES_KEY = 'ke_profiles_v1';
function progressKey() {
  const id = Profiles.active().id;
  return id === 'p1' ? PROGRESS_KEY : PROGRESS_KEY + '_' + id;
}

function dayStr(t) { return new Date(t).toISOString().slice(0, 10); }

const STREAK_KEY = 'ke_streak_v1';
function streakKey() {
  const id = Profiles.active().id;
  return id === 'p1' ? STREAK_KEY : STREAK_KEY + '_' + id;
}
// Art arda gun serisi: bir gunde EN AZ bir bolum tamamlanirsa sayilir
// (Progress.markComplete cagirir) - sadece uygulamayi acmak degil.
const Streak = {
  _load() {
    try {
      const raw = JSON.parse(window.localStorage.getItem(streakKey()));
      if (raw && typeof raw.days === 'number') return raw;
    } catch (e) { /* yok say */ }
    return { days: 0, last: null };
  },
  _save(d) { try { window.localStorage.setItem(streakKey(), JSON.stringify(d)); } catch (e) { /* yok say */ } idbPut(streakKey(), d); },
  get() { return this._load().days; },
  touch() {
    const s = this._load();
    const today = dayStr(Date.now());
    if (s.last === today) return s.days;
    const yesterday = dayStr(Date.now() - 86400000);
    s.days = (s.last === yesterday) ? s.days + 1 : 1;
    s.last = today;
    this._save(s);
    return s.days;
  },
};

const DAILY_KEY = 'ke_daily_v1';
function dailyKey() {
  const id = Profiles.active().id;
  return id === 'p1' ? DAILY_KEY : DAILY_KEY + '_' + id;
}
// "Bugunun hedefi": her tamamlanan bolum/tur, kendi kelime sayisi kadar
// bu sayaca ekleniyor (showCelebration'dan cagrilir). Gun degisince
// otomatik sifirlanir.
const DailyGoal = {
  TARGET: 5,
  _load() {
    try {
      const raw = JSON.parse(window.localStorage.getItem(dailyKey()));
      if (raw && raw.day) return raw;
    } catch (e) { /* yok say */ }
    return { day: null, count: 0 };
  },
  _save(d) { try { window.localStorage.setItem(dailyKey(), JSON.stringify(d)); } catch (e) { /* yok say */ } idbPut(dailyKey(), d); },
  add(n) {
    const d = this._load();
    const today = dayStr(Date.now());
    if (d.day !== today) { d.day = today; d.count = 0; }
    d.count += n;
    this._save(d);
    return d.count;
  },
  today() {
    const d = this._load();
    return d.day === dayStr(Date.now()) ? d.count : 0;
  },
};

const TIME_KEY = 'ke_time_v1';
function timeKey() {
  const id = Profiles.active().id;
  return id === 'p1' ? TIME_KEY : TIME_KEY + '_' + id;
}
// Uygulamada gecirilen sure: sekme/pencere gorunur oldugu surece sayar,
// gizlenince (visibilitychange) biriktirdigini kaydedip durur - PWA'da
// native onResume/onPause karsiligi budur.
const TimeTrack = {
  _load() {
    try {
      const raw = JSON.parse(window.localStorage.getItem(timeKey()));
      if (raw && typeof raw.seconds === 'number') return raw;
    } catch (e) { /* yok say */ }
    return { seconds: 0 };
  },
  _save(d) {
    try { window.localStorage.setItem(timeKey(), JSON.stringify(d)); } catch (e) { /* yok say */ }
    idbPut(timeKey(), d);
  },
  add(sec) {
    if (sec <= 0) return this._load().seconds;
    const d = this._load();
    d.seconds += sec;
    this._save(d);
    return d.seconds;
  },
  total() { return this._load().seconds; },
};
let _timeTrackStart = null;
let _timeTrackStarted = false;
function flushTimeTrack() {
  if (_timeTrackStart == null) return;
  const sec = Math.round((Date.now() - _timeTrackStart) / 1000);
  TimeTrack.add(sec);
  _timeTrackStart = document.hidden ? null : Date.now();
}
function startTimeTracking() {
  if (_timeTrackStarted) return;
  _timeTrackStarted = true;
  _timeTrackStart = Date.now();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) flushTimeTrack();
    else _timeTrackStart = Date.now();
  });
  window.addEventListener('beforeunload', flushTimeTrack);
  setInterval(flushTimeTrack, 20000);
}

// "15 dakika kesintisiz ders -> 1 oyun hakki": TimeTrack toplam suredir,
// bu AYRI bir sayac - sekme gizlenince (uygulamadan cikilinca) SIFIRLANIR,
// TimeTrack gibi biriktirmez. "Kesintisiz" tam olarak bunu ifade ediyor.
const GAME_TOKENS_KEY = 'ke_game_tokens_v1';
function gameTokensKey() {
  const id = Profiles.active().id;
  return id === 'p1' ? GAME_TOKENS_KEY : GAME_TOKENS_KEY + '_' + id;
}
const GameTokens = {
  _load() {
    try {
      const raw = JSON.parse(window.localStorage.getItem(gameTokensKey()));
      if (raw && typeof raw.count === 'number') return raw;
    } catch (e) { /* yok say */ }
    return { count: 0 };
  },
  _save(d) {
    try { window.localStorage.setItem(gameTokensKey(), JSON.stringify(d)); } catch (e) { /* yok say */ }
    idbPut(gameTokensKey(), d);
  },
  add(n) { const d = this._load(); d.count += n; this._save(d); return d.count; },
  spend() { const d = this._load(); if (d.count <= 0) return false; d.count -= 1; this._save(d); return true; },
  get() { return this._load().count; },
};

const RIVER_HIGHSCORE_KEY = 'ke_river_highscore_v1';
function riverHighScoreKey() {
  const id = Profiles.active().id;
  return id === 'p1' ? RIVER_HIGHSCORE_KEY : RIVER_HIGHSCORE_KEY + '_' + id;
}
const RiverHighScore = {
  get() {
    try {
      const raw = JSON.parse(window.localStorage.getItem(riverHighScoreKey()));
      if (raw && typeof raw.best === 'number') return raw.best;
    } catch (e) { /* yok say */ }
    return 0;
  },
  submit(score) {
    const best = this.get();
    if (score <= best) return false;
    try { window.localStorage.setItem(riverHighScoreKey(), JSON.stringify({ best: score })); } catch (e) { /* yok say */ }
    idbPut(riverHighScoreKey(), { best: score });
    return true;
  },
};

const CONTINUOUS_STUDY_SECONDS = 15 * 60;
let _continuousStart = null;
let _continuousGranted = 0; // bu "kesintisiz kosu" icinde simdiye kadar kac esik gecildi
let _onQuizUnlocked = null; // UI'nin dinleyebilecegi kanca - dogrudan hak vermiyor, kucuk bir sinav ACIYOR
// "15 dakika calis -> oyun hakki" dogrudan zamana degil, zamanin SONUNDA
// kucuk bir hatirlatma sinavini GECMEYE bagli - "ogrenmeye tesvik edelim"
// geri bildirimi. Esik gecilince direkt GameTokens.add YAPILMAZ, bunun
// yerine bir "bekleyen sinav" biriktirilir (PendingQuiz), kullanici
// sinavi cozunce grantGameToken() cagrilir.
function startContinuousStudyTracking(onUnlocked) {
  _onQuizUnlocked = onUnlocked || null;
  _continuousStart = Date.now();
  _continuousGranted = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      _continuousStart = null; // uygulamadan cikildi - kesinti, sayac sifirlanir
      _continuousGranted = 0;
    } else if (_continuousStart == null) {
      _continuousStart = Date.now();
      _continuousGranted = 0;
    }
  });
  setInterval(() => {
    if (_continuousStart == null) return;
    const elapsed = (Date.now() - _continuousStart) / 1000;
    const shouldHaveGranted = Math.floor(elapsed / CONTINUOUS_STUDY_SECONDS);
    if (shouldHaveGranted > _continuousGranted) {
      const newQuizzes = shouldHaveGranted - _continuousGranted;
      _continuousGranted = shouldHaveGranted;
      PendingQuiz.add(newQuizzes);
      if (_onQuizUnlocked) _onQuizUnlocked(newQuizzes);
    }
  }, 10000);
}

// Bekleyen bonus-sinav hakki: 15dk esigi gecilince burada birikir, kucuk
// sinavi GECMEDEN GameTokens'a donusmez. Kapatilan toast/erteleme
// yuzunden kaybolmasin diye kalici (localStorage) - profil degistirince
// ya da uygulama yeniden acilinca da bekliyor olarak kalir.
const PENDING_QUIZ_KEY = 'ke_pending_quiz_v1';
function pendingQuizKey() {
  const id = Profiles.active().id;
  return id === 'p1' ? PENDING_QUIZ_KEY : PENDING_QUIZ_KEY + '_' + id;
}
const PendingQuiz = {
  _load() {
    try {
      const raw = JSON.parse(window.localStorage.getItem(pendingQuizKey()));
      if (raw && typeof raw.count === 'number') return raw;
    } catch (e) { /* yok say */ }
    return { count: 0 };
  },
  _save(d) {
    try { window.localStorage.setItem(pendingQuizKey(), JSON.stringify(d)); } catch (e) { /* yok say */ }
    idbPut(pendingQuizKey(), d);
  },
  add(n) { const d = this._load(); d.count += n; this._save(d); return d.count; },
  consume() { const d = this._load(); if (d.count <= 0) return false; d.count -= 1; this._save(d); return true; },
  get() { return this._load().count; },
};

const Progress = {
  _load() {
    try {
      const raw = window.localStorage.getItem(progressKey());
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  },
  _save(data) {
    try { window.localStorage.setItem(progressKey(), JSON.stringify(data)); } catch (e) { /* quota/gizli mod — sessizce yok say */ }
    idbPut(progressKey(), data);
  },
  _cat(data, categoryId) {
    if (!data[categoryId]) data[categoryId] = { completed: [], missed: {} };
    return data[categoryId];
  },
  getCategory(categoryId) {
    const data = this._load();
    return this._cat(data, categoryId);
  },
  markComplete(categoryId, episodeIndex) {
    const data = this._load();
    const cat = this._cat(data, categoryId);
    if (!cat.completed.includes(episodeIndex)) cat.completed.push(episodeIndex);
    this._save(data);
    try { Streak.touch(); } catch (e) { /* yok say */ }
  },
  // Bir bölümü tamamlamadan önce hangi bölüme devam edileceği — ilk
  // tamamlanmamış bölüm, hepsi bittiyse son bölüm (tekrar oynanabilir).
  nextIncompleteEpisode(categoryId, episodeCount) {
    const cat = this.getCategory(categoryId);
    for (let i = 0; i < episodeCount; i++) {
      if (!cat.completed.includes(i)) return i;
    }
    return Math.max(0, episodeCount - 1);
  },
  recordMistake(categoryId, obj) {
    const data = this._load();
    const cat = this._cat(data, categoryId);
    const entry = cat.missed[obj.word];
    // Leitner: her yanlis kutu 0'a (hemen tekrar) dusurur.
    if (entry) { entry.count++; entry.box = 0; entry.due = Date.now(); }
    else cat.missed[obj.word] = { count: 1, obj, box: 0, due: Date.now() };
    this._save(data);
    logAnswerEvent(categoryId, obj.word, false);
  },
  // Kelime dogru bilinince tamamen SILMEK yerine (eski davranis) bir
  // sonraki kutuya terfi ettirip erteliyoruz - gercek aralikli tekrar:
  // 1 gun -> 3 gun -> 7 gun sonra tekrar sorulur, 4. dogru cevapta
  // "ustalasildi" sayilip kuyruktan tamamen cikiyor.
  clearMistakes(categoryId, words) {
    const data = this._load();
    const cat = this._cat(data, categoryId);
    const intervalsDays = [1, 3, 7];
    words.forEach((w) => {
      const entry = cat.missed[w];
      if (!entry) return;
      const box = (entry.box || 0) + 1;
      if (box > intervalsDays.length) { delete cat.missed[w]; return; }
      entry.box = box;
      entry.due = Date.now() + intervalsDays[box - 1] * 86400000;
    });
    this._save(data);
    words.forEach((w) => logAnswerEvent(categoryId, w, true));
  },
  totalStars() {
    const data = this._load();
    return Object.values(data).reduce((n, c) => n + ((c && c.completed) ? c.completed.length : 0), 0);
  },
  // Sadece VADESI GELMIS (due <= simdi) kelimeler - henuz erteleme
  // suresi dolmamis kelimeler tekrar listesinde gorunmuyor.
  dueMissed(categoryId) {
    const cat = this.getCategory(categoryId);
    const now = Date.now();
    return Object.values(cat.missed).filter((e) => (e.due || 0) <= now);
  },
  topMissed(categoryId, limit) {
    return this.dueMissed(categoryId)
      .sort((a, b) => (a.due || 0) - (b.due || 0) || b.count - a.count)
      .slice(0, limit || 8)
      .map((e) => e.obj);
  },
};

// Nesneleri sabit bir konum listesi yerine bir ÇEMBER üzerine yerleştiriyoruz
// — kaç kelime olursa olsun (5, 6, 8...) düzgün, dağınık olmayan bir
// dizilim elde ediyoruz. "Aktapokus ve konuşma baloncuğu sahnenin sağında,
// nesneler solda çember" geri bildirimi üzerine — çember artık sahnenin
// ORTASINDA değil, SOL yarısında; maskot (bkz. .ke-mascot-wrap) sağda,
// dikey ortalanmış, ayrı duruyor. Bu sayede ikisi arasında hiç çakışma
// riski kalmıyor (sağ tarafta maskot için her zaman boş bir şerit var).
function getCircularPosition(index, total) {
  // +0.5 kaydırma: çemberin tam üst/alt ekseninde nokta oluşmasını
  // engelliyor, dizilim daha dengeli görünüyor.
  const angle = (2 * Math.PI * (index + 0.5)) / total - Math.PI / 2;
  const radiusX = 23;
  const radiusY = 30;
  const centerX = 28;
  const centerY = 50;
  const x = centerX + radiusX * Math.cos(angle);
  const y = centerY + radiusY * Math.sin(angle);
  return { left: `${x.toFixed(1)}%`, top: `${y.toFixed(1)}%` };
}

// panel.js ile aynı ui/ dizinindeki statik dosyalara (fonts/, icons/,
// photos/) import.meta.url ile göreli erişiyoruz — toolId'yi ayrıca
// taşımaya gerek kalmıyor, core zaten ui/ klasörünü statik mount ediyor.
const ASSET_BASE_URL = new URL('.', import.meta.url);

// Uygulama tamamen offline çalışmalı — bu yüzden Google Fonts CDN'ine
// runtime'da bağlanmak yerine, scripts/fetch_fonts.py ile bir kere
// indirilmiş yerel woff2 dosyalarını (ui/fonts/*.woff2) @font-face ile
// yüklüyoruz. Aşağıdaki liste scripts/fetch_fonts.py'nin ui/fonts/fonts.css
// çıktısının birebir kopyası — panel.js tek dosyada kalsın, ayrıca bir
// <link>/CSS import ile ek bir ağ isteğine gerek kalmasın diye buraya
// gömülü. Fredoka: başlıklar/butonlar için — çok daha yuvarlak, "kabarcık"
// harfli bir görünen bir çocuk/oyun fontu (Baloo 2, kullanıcının "hâlâ
// eski/eğlenceli değil" geri bildiriminden sonra Fredoka ile değiştirildi
// — Fredoka'nın gövdeleri belirgin şekilde daha yuvarlak/toparlak).
// Nunito: gövde metni (okunaklı, yuvarlak). Sadece latin+latin-ext
// altkümeleri tutuluyor — Türkçe karakterler (ç,ğ,ı,ö,ş,ü) için yeterli,
// gereksiz Kiril/Vietnamca/Hint altkümeleri atlanarak dosya boyutu küçük
// tutuluyor.
const FONT_FILES = [
  ['Fredoka', 500, 'Fredoka-500-1.woff2', 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'],
  ['Fredoka', 500, 'Fredoka-500-2.woff2', 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'],
  ['Fredoka', 600, 'Fredoka-600-4.woff2', 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'],
  ['Fredoka', 600, 'Fredoka-600-5.woff2', 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'],
  ['Fredoka', 700, 'Fredoka-700-7.woff2', 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'],
  ['Fredoka', 700, 'Fredoka-700-8.woff2', 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'],
  ['Baloo 2', 600, 'Baloo2-600-11.woff2', 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'],
  ['Baloo 2', 600, 'Baloo2-600-12.woff2', 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'],
  ['Baloo 2', 700, 'Baloo2-700-15.woff2', 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'],
  ['Baloo 2', 700, 'Baloo2-700-16.woff2', 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'],
  ['Nunito', 400, 'Nunito-400-20.woff2', 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'],
  ['Nunito', 400, 'Nunito-400-21.woff2', 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'],
  ['Nunito', 600, 'Nunito-600-25.woff2', 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'],
  ['Nunito', 600, 'Nunito-600-26.woff2', 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'],
  ['Nunito', 700, 'Nunito-700-30.woff2', 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'],
  ['Nunito', 700, 'Nunito-700-31.woff2', 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'],
  ['Nunito', 800, 'Nunito-800-35.woff2', 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'],
  ['Nunito', 800, 'Nunito-800-36.woff2', 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'],
  ['Nunito', 900, 'Nunito-900-40.woff2', 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'],
  ['Nunito', 900, 'Nunito-900-41.woff2', 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'],
  // Chewy: kullanıcının istediği "ChiquiFont/Sugarpunch" tarzı şekerleme
  // fontlarına en yakın ücretsiz alternatif. DİKKAT: Chewy'nin büyük
  // harf Ğ/Ş/İ/Ö/Ç/Ü glifleri YOK (test edildi — bu harfler yedek
  // fonta düşüyor) — bu yüzden Türkçe başlıklarda KULLANILMIYOR, sadece
  // Aktapokus'un söylediği/gösterdiği İNGİLİZCE kelime metinlerinde
  // (ke-word-popup, ke-speak-word) kullanılıyor; onlar hep İngilizce.
  ['Chewy', 400, 'Chewy-400-42.woff2', 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'],
  // "Karatahta + tebeşir yazısı" denemesi: gerçek bir tebeşir-el yazısı
  // hissi için — sadece quiz/konuşma/cümle panellerindeki İNGİLİZCE
  // kelime gösterimlerinde kullanılıyor (Chewy'nin kullanıldığı yerlerle
  // aynı kısıt: Türkçe karakter kapsamı yok, Türkçe metinde kullanılmaz).
  // Permanent Marker denendi ama kalın/düz bir "keçeli kalem" hissi
  // veriyordu, tebeşir değil ("kesinlikle tebeşir hissi yaratmıyor" geri
  // bildirimi) — Rock Salt'ın pürüzlü, düzensiz, "kaba yüzeye çizilmiş"
  // çizgi kalitesi tebeşire çok daha yakın.
  ['Rock Salt', 400, 'RockSalt-400-200.woff2', 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'],
  // Rock Salt kart/başlık için "çocuklar için okunaksız" geri bildirimi
  // aldı — Fredericka the Great denendi (dekoratif ama iri, net harf
  // formları olan bir "el yazısı tahta yazısı" fontu). Rock Salt'tan
  // FARKLI olarak latin-ext (Türkçe ç/ğ/ı/ö/ş/ü) desteği VAR (Google'dan
  // 2 ayrı unicode-range bloğu geldi, aşağıda ikisi de tutuluyor) —
  // bu yüzden Türkçe başlıkta güvenle kullanılabiliyor.
  ['Fredericka the Great', 400, 'FrederickaTheGreat-400-300.woff2', 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'],
  ['Fredericka the Great', 400, 'FrederickaTheGreat-400-301.woff2', 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'],
];

const FONT_FACES = FONT_FILES.map(([family, weight, file, range]) =>
  `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;src:url('${new URL('fonts/' + file, ASSET_BASE_URL).href}') format('woff2');unicode-range:${range};}`
).join('\n');

const STYLE = `
<style>
${FONT_FACES}
  .ke-shell{
    --ke-yellow: #FFC20E; --ke-yellow-dark: #E0A500; --ke-yellow-text: #A66D00;
    --ke-red: #FF4B4B; --ke-red-dark: #E23F3F;
    --ke-green: #58CC02; --ke-green-dark: #46A302;
    --ke-blue: #1CB0F6; --ke-blue-dark: #17A0DE;
    --ke-purple: #CE82FF; --ke-purple-dark: #B368E8;
    --ke-ink: #1A2233;
    --ke-ink-soft: rgba(26,34,51,.62);
    --ke-surface: #ffffff;
    --ke-surface-2: #BFDBFF;
    --ke-surface-3: #9CC8FF;
    --ke-border: #8FB8E0;
    /* Tam tebeşir-karatahta paleti (v2) — dış çerçeve/panel/kategori
       kartları hâlâ yukarıdaki --ke-* setini kullanıyor (kategori
       renkleri bilinçli olarak korunuyor); bu yeni --kb-* seti SADECE
       tahta yüzeyleri ve üzerindeki tebeşir metin/kontrollerinde. */
    --kb-board: #14231A; --kb-board-dark: #09120D;
    --kb-chalk: #F5F0DF; --kb-chalk-dim: #D9D4C2;
    --kb-action: #6EC8FF; --kb-discover: #FFD75A;
    --kb-correct: #85D98A; --kb-wrong: #FF8B82; --kb-voice: #C8A2FF;
    --kb-wood-dark: #5B351C; --kb-wood-light: #A86632;
    font-family: 'Fredoka', 'Baloo 2', 'Nunito', 'Segoe UI', system-ui, sans-serif;
    color: var(--kb-chalk);
    /* TAM TEBEŞİR-KARATAHTA (v2) — önceki mor/turuncu glow'lu "hafif
       dekoratif" zemin tamamen kaldırıldı. Düz siyaha yakın yerine hafif,
       performans dostu, HAREKETSİZ bir doku: iki noktasal "toz" katmanı +
       ince yatay çizgiler (tahta yüzeyinin dokusu) + köşegen ışık/gölge
       degrade'i. Doku metni bastırmayacak kadar soluk (rgba alfa'ları
       .01-.035 arası). */
    background-color: var(--kb-board);
    background-image:
      radial-gradient(circle at 18% 12%, rgba(255,255,255,.035) 0 1px, transparent 1.5px),
      radial-gradient(circle at 72% 66%, rgba(255,255,255,.025) 0 1px, transparent 1.5px),
      repeating-linear-gradient(
        0deg,
        rgba(255,255,255,.012) 0,
        rgba(255,255,255,.012) 1px,
        transparent 1px,
        transparent 5px
      ),
      linear-gradient(135deg, rgba(0,0,0,.18), transparent 42%, rgba(255,255,255,.025));
    background-size: 110px 95px, 170px 145px, auto, auto;
    /* Ahşap çerçeve — turuncu/kahverengi degrade + iç oyuk (inset gölge)
       hissi, "modern plastik panel" değil gerçek bir tahta rafı çerçevesi. */
    background-origin: border-box;
    border: 3px solid #E9C385;
    border-image: linear-gradient(90deg, var(--kb-wood-dark), var(--kb-wood-light) 14%, #6E4020 48%, #B8783D 78%, var(--kb-wood-dark)) 1;
    box-shadow:none;
    border-radius: 22px;
    padding: 18px 16px 32px;
    position: relative;
    /* Eskiden overflow:hidden idi (sadece köşe-yuvarlatılmış dekoratif
       dokuyu taşırmamak içindi) — ama .ke-shell'in yüksekliği ata
       (host) elemandan geliyor ve dar ekranlarda (mobil/APK) sarılan
       başlık + bölüm haritası + oyun paneli toplamı bu yükseklikten
       KOLAYCA taşabiliyor; overflow:hidden bu fazlalığı scroll'suz,
       SESSİZCE kesip görünmez yapıyordu (fark edilmesi zor bir veri
       kaybı). Dikeyde scroll'a izin veriyoruz, yatayda (dekoratif
       doku taşması için) hâlâ gizleniyor. */
    overflow-x: hidden;
    overflow-y: auto;
    /* iOS Safari'de position:fixed + overflow:auto kombinasyonu, bu ozellik
       olmadan dokunmatik kaydirmayi SESSIZCE calistirmiyor - icerik ekran
       disina tasinca (ozellikle .ke-fs ile position:fixed olunca) altta
       kalan butonlar (ör. ilk "Let's go!" butonu) kaydirilip ulasilamiyor. */
    -webkit-overflow-scrolling: touch;
    min-height: 640px;
  }
  .ke-shell, .ke-shell *{ box-sizing: border-box; }
  .ke-fullscreen-btn, .ke-back-btn, .ke-screen-host{ position:relative; z-index:1; }
  .ke-shell.ke-fs{
    width: 100vw; height: 100vh; max-width: none;
    /* justify-content:center + taşan içerik = üst kısmın kaydırılamayan,
       görünmez bir alana taşması ("üst taraf görünmez hale gelmiş" geri
       bildirimi) — içerik viewport'tan uzun olunca üstten normal akışla
       başlaması gerekiyor, ortalanmaması. */
    display: flex; flex-direction: column; justify-content: flex-start;
    padding: 14px 24px; overflow-y: auto;
  }
  /* Tam ekranda üst blok (harita+başlık) küçültülüp oyun alanına yer
     açılıyor — "oranti iyi olmamis, kullanim alanini buyutmek lazim"
     geri bildirimi üzerine. */
  /* Eskiden width:95vw idi - bu, .ke-shell'in KENDI 24px yatay
     padding'ini (bkz. .ke-shell.ke-fs{padding:14px 24px}) hesaba
     katmiyordu, 95vw bazen kullanilabilir alandan genis kaliyor,
     kutuyu sola yaslayip sag kenar bosluğunu yiyordu ("ortalı değil
     sola dayanmış" geri bildirimi, gerçek telefonda görüldü). width:100%
     zaten dolu-dolu ata elemanin (padding'i cikartilmis) icerik kutusunu
     kullaniyor, asla tasmiyor, margin:0 auto (bkz. base .ke-scene-wrap)
     onu guvenle ortaliyor. */
  .ke-shell.ke-fs .ke-scene-wrap{ width: 100%; max-width: none; }
  /* 84vh + üst blok + alt ipucu satırı 100vh'i aşıyordu, alt kısım
     ekrandan taşıp görünmez oluyordu ("tam ekranda alt taraf
     gözükmüyor") — sahneyi biraz küçültüp alttaki geliştirme amaçlı
     "Başlangıç noktası" atlama satırını tam ekranda tamamen gizliyoruz
     (çocuk kullanıcı için gerekli değil, sadece yer kaplıyordu). */
  .ke-shell.ke-fs .ke-scene{ height: 70vh; }
  /* Gercek telefonda (fullscreen = gercek Fullscreen API, sandbox'ta
     test edilemiyordu) bu sabit 220px, dar ekran icin olan
     @media(max-width:520px) .ke-mascot-wrap{width:130px} kuralini HER
     ZAMAN eziyordu (fullscreen selector specificity'si daha yuksek,
     ekran genisligine bakmiyordu) - "maskot kucuk ekranda kuculmemis"
     geri bildirimi. clamp ile ekran genisligine gore olcekleniyor artik. */
  .ke-shell.ke-fs .ke-mascot-wrap{ width: clamp(110px, 26vw, 220px); }
  /* Harita eskiden 2 satira sariyordu (9 bolum = 5+4), dikey alani
     bolum haritasi + baslik + alt-baslik yiyip oyun paneline az yer
     birakiyordu ("path cok buyuk, oyun ekranini verimsiz kullanmisiz"
     geri bildirimi) - artik TEK SATIR yatay kaydirmali, cok daha az
     dikey yer kapliyor. Aktif bolum otomatik gorunume kayiyor
     (bkz. renderMap). */
  .ke-shell.ke-fs .ke-map{
    margin-bottom: 10px; flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden;
    justify-content: flex-start; padding: 4px 6px; -webkit-overflow-scrolling: touch;
  }
  .ke-shell.ke-fs .ke-map .ke-dot{ width: 36px; height: 36px; font-size: 12px; flex-shrink: 0; }
  .ke-shell.ke-fs .ke-map .ke-line{ width: 10px; flex-shrink: 0; }
  .ke-shell.ke-fs .ke-title{ font-size: clamp(20px, 2.6vw, 28px); margin-bottom: 2px; }
  .ke-shell.ke-fs .ke-subtitle{ margin-bottom: 10px; font-size: 13px; }
  .ke-shell.ke-fs .ke-word-popup{ font-size: 34px; padding: 14px 32px; }
  .ke-shell.ke-fs .ke-screen-host{ margin-top: 40px; }
  .ke-shell.ke-fs .ke-footer-row{ margin-top: 8px; }
  /* Eskiden tam ekranda tamamen gizleniyordu (display:none) - "test icin
     bunlar lazim" geri bildirimi üzerine artık gizlenmiyor. Yer kaplama
     sorunu <details> kapalı başladığı için (bkz. aşağıdaki open
     kaldırıldı) zaten çözülmüş durumda - sadece tek satırlık özet
     görünür, tıklanınca açılıyor. */
  .ke-shell.ke-fs .ke-fullscreen-btn{ position: fixed; top: calc(18px + env(safe-area-inset-top, 0px)); left: calc(18px + env(safe-area-inset-left, 0px)); }
  .ke-shell.ke-fs .ke-back-btn{ position: fixed; top: calc(18px + env(safe-area-inset-top, 0px)); right: calc(18px + env(safe-area-inset-right, 0px)); }

  /* Duolingo tarzı "3D bas" düğme dili — üstteki yüzey + altında koyu bir
     "gölge kaide", basınca yüzey o kaidenin içine gömülür. */
  .ke-shell button{
    font-family:'Fredoka','Baloo 2','Nunito',sans-serif; font-weight:700; font-size:15px; letter-spacing:.2px;
    padding:14px 24px; border-radius:16px; border:none; cursor:pointer;
    position:relative; top:0;
    box-shadow:none;
    transition: top .08s ease, box-shadow .08s ease, opacity .15s ease;
  }
  .ke-shell button:active:not(:disabled){ top:4px; box-shadow:none; }
  /* Renk rolü: MAVİ = ana aksiyon/ilerleme (bu buton "Sorulara Geç",
     "Sonraki Bölüm", tam ekran gibi ilerletici eylemler için varsayılan
     birincil renk). SARI artık sadece keşif/ödül anlamı taşıyan yerlerde
     kalıyor (ödül çipi, keşif ilerleme çipi, haritada "şu an buradasın"
     düğümü, giriş pankartı) — bkz. bu bölümdeki diğer .ke-* kuralları.
     TAM TEBEŞİR (v2): düz plastik "pill" yüzey yerine tebeşirle çizilmiş
     bir etiket — şeffafa yakın zemin, kesik/düzensiz tebeşir kenarlığı,
     hafif eğik durur (her biri az farklı açıda). Sert 3D taban gölgesi
     (--btn-shadow) nötrlendi; basınca hâlâ "gömülme" hissi kalıyor (taban
     .ke-shell button:active kuralından geliyor) ama gölge kısa/soluk. */
  .ke-btn-primary{
    background: rgba(110,200,255,.12); color: var(--kb-action);
    border: 2px dashed var(--kb-action); border-radius: 10px 14px 11px 13px;
    box-shadow:none; --btn-shadow: transparent;
    transform: rotate(-.4deg); text-shadow:none;
  }
  .ke-btn-primary:hover:not(:disabled){ background: rgba(110,200,255,.2); }
  .ke-btn-secondary{
    background: rgba(245,240,223,.08); color: var(--kb-chalk-dim);
    border: 2px dashed rgba(245,240,223,.5); border-radius: 11px 13px 10px 14px;
    box-shadow:none; --btn-shadow: transparent;
    transform: rotate(.3deg);
  }
  .ke-btn-secondary:hover:not(:disabled){ background: rgba(245,240,223,.15); }
  .ke-btn-primary:disabled{ opacity:.4; cursor:not-allowed; top:0 !important; box-shadow:none; }

  .ke-fullscreen-btn{
    /* iOS'ta gercek Fullscreen API yok - bu yuzden burasi (position:
       absolute, normal mod) telefonlarda GERCEKTE kullanilan yol. Notch/
       durum cubugu altinda kalip iOS'un kendi sistem hareketlerine
       (Kontrol Merkezi vb.) tiklamayi kaptirmasin diye guvenli alan payi
       ekleniyor - "geri butonu tiklanmiyor, wifi ayarlarina gidiyor"
       geri bildirimi. */
    position: absolute; top: calc(16px + env(safe-area-inset-top, 0px)); left: calc(16px + env(safe-area-inset-left, 0px)); z-index: 10;
    display: flex; align-items: center; gap: 7px;
    padding: 10px 18px !important; border-radius: 999px !important;
    background: var(--ke-blue); --btn-shadow:var(--ke-blue-dark);
    color: #fff; font-size: 13px;
  }
  .ke-back-btn{
    position: absolute; top: calc(16px + env(safe-area-inset-top, 0px)); right: calc(16px + env(safe-area-inset-right, 0px)); z-index: 10;
    display: flex; align-items: center; gap: 6px;
    padding: 10px 16px !important; border-radius: 999px !important;
    background: var(--ke-surface-2); --btn-shadow:#7FA8D6;
    color: var(--ke-ink); font-size: 12.5px;
  }
  .ke-screen-host{ margin-top: 46px; }

  /* Harita artık <details> içinde, açılır/kapanır — "path her zaman
     açık, dikey alanı yiyor, tek sayfaya sığmıyoruz" geri bildirimi
     üzerine. Dar ekranda (bkz. isNarrowLayout, render sırasında open
     atributü eklenmiyor) varsayılan KAPALI başlıyor, sadece özet satırı
     ("Bölüm 1/9") görünüyor — dokununca açılıyor. Geniş ekranda
     varsayılan açık (davranış değişmiyor). */
  .ke-map-details{ margin-bottom:14px; text-align:center; }
  .ke-map-summary{
    display:inline-flex; align-items:center; gap:6px; cursor:pointer; list-style:none;
    font-family:'Fredoka','Baloo 2',sans-serif; font-weight:700; font-size:13.5px;
    color:var(--kb-chalk-dim); padding:7px 16px; border-radius:999px;
    border:2px dashed rgba(245,240,223,.35); background:rgba(255,255,255,.04);
    transition: background .1s ease;
  }
  .ke-map-summary::-webkit-details-marker{ display:none; }
  .ke-map-summary:hover{ background:rgba(255,255,255,.08); }
  .ke-map-summary:focus-visible{ outline:2px solid var(--kb-action); outline-offset:2px; }
  .ke-map-summary::after{ content:'▾'; font-size:11px; transition:transform .15s ease; }
  .ke-map-details[open] .ke-map-summary::after{ transform:rotate(180deg); }
  /* .ke-map zaten display:flex tanımlıyor - bu, <details> kapalıyken
     içeriği gizleyen tarayıcı varsayılanını EZER (author CSS UA
     stylesheet'ini her zaman geçersiz kılar) - elle tekrarlamak
     gerekiyor, yoksa kapalıyken de görünür kalır (bkz. .ke-jump-row
     için aynı desende alınan not). */
  .ke-map-details:not([open]) .ke-map{ display:none; }
  .ke-map-details[open] .ke-map{ margin-top:10px; }
  /* Harita: Duolingo'nun "path" hissi — büyük, renkli, sıradaki durak zıplar */
  .ke-map{ display:flex; align-items:center; justify-content:center; gap:6px; margin-bottom:22px; flex-wrap:wrap; }
  .ke-map .ke-node{ display:flex; align-items:center; gap:6px; }
  .ke-map .ke-dot{
    width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center;
    font-size:15px; font-weight:800; border:none; box-shadow:none;
    background:var(--ke-surface-2); color:var(--ke-ink-soft); flex-shrink:0; cursor:pointer;
    transition: transform .1s ease;
  }
  .ke-map .ke-dot:active{ transform:translateY(3px); box-shadow:none; }
  .ke-map .ke-dot.current{ background:var(--ke-yellow); color:var(--ke-ink); box-shadow:none; animation:ke-node-bounce 1.4s ease-in-out infinite; }
  .ke-map .ke-dot.done{ background:var(--ke-green); color:#fff; box-shadow:none; }
  @keyframes ke-node-bounce{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-5px); } }
  .ke-map .ke-line{ width:18px; height:5px; background:var(--ke-border); border-radius:3px; flex-shrink:0; }

  /* TAM TEBEŞİR (v2): önceki "gökkuşağı" 6 renkli kelime-kelime boyama
     kaldırıldı ("en fazla bir kelimede vurgu" isteği) — başlık artık
     ince beyaz tebeşir konturu + yumuşak tebeşir parıltısıyla, sanki
     tahtaya elle yazılmış gibi. Sadece İLK kelime (kategori adının
     "Aktapokus ile" kısmı) sarı tebeşir vurgusu taşıyor, gerisi düz
     tebeşir-beyazı — bkz. bubbleTitleHTML'in ürettiği .ke-tword'ler.
     TAM TEBEŞİR (v3): renk/kontur efekti zaten tebeşirdi ama font hâlâ
     Fredoka'ydı (yuvarlak "bubble" hissi) — "hiç chalk havası yok" geri
     bildirimi üzerine önce Rock Salt denendi, ama küçük boyutta
     "çocuklar için okunaksız" bulundu. TAM TEBEŞİR (v4): Fredericka
     the Great'e geçildi (iri, net harf gövdeleri olan bir tahta-yazısı
     fontu, tam Türkçe glif desteği var) VE büyütüldü — okunaklılık +
     tebeşir hissini birlikte hedefliyor. */
  .ke-title{
    text-align:center; font-family:'Fredericka the Great','Fredoka','Baloo 2',sans-serif; font-size:clamp(28px,5.6vw,44px);
    font-weight:400; margin:0 0 10px; letter-spacing:.5px; line-height:1.3;
    color: var(--kb-chalk);
    -webkit-text-stroke: 1px rgba(255,255,255,.4);
    paint-order: stroke fill;
    text-shadow:none;
  }
  .ke-title .ke-tword:first-child{ color: var(--kb-discover); }
  .ke-subtitle{ text-align:center; margin:0 0 20px; color:var(--kb-chalk-dim); font-size:14.5px; font-weight:700; text-shadow:none; }

  /* GİRİŞ SAYFASI = LUNAPARK GİRİŞİ (v3): "arka plan istemiyorum ayrica
     tebeşir yazı fontu istemiyorum, kocaman eğlenceli bir font" geri
     bildirimi - v2'deki mavi/yeşil şeritli panel kaldırıldı, başlık ve
     maskot doğrudan tahta zemininin üzerinde duruyor (sadece boşluk için
     bir kapsayıcı, görsel bir "kutu" değil). Font, el yazısı/tebeşir
     hissi veren Fredericka the Great yerine uygulamanın zaten yüklü
     olan KALIN yuvarlak "oyuncak tuğla" fontuna (Baloo 2/Fredoka 700)
     geçti - referans görseldeki "Aktapokus Kids English" logosunun
     kocaman, dolgun harf hissi. */
  .ke-carnival-hero{
    position:relative; max-width:640px; margin:10px auto 18px; padding:10px 20px 4px;
    text-align:center;
  }
  .ke-carnival-sparkle{
    position:absolute; color:#FFE97A; text-shadow:0 2px 0 rgba(0,0,0,.35);
    animation: ke-sparkle-twinkle 2.2s ease-in-out infinite;
    pointer-events:none; user-select:none;
  }
  .ke-carnival-sparkle.cs1{ top:2px; left:8px; font-size:22px; animation-delay:0s; }
  .ke-carnival-sparkle.cs2{ top:8px; right:14px; font-size:16px; animation-delay:.4s; color:#fff; }
  .ke-carnival-sparkle.cs3{ bottom:36px; left:4px; font-size:15px; animation-delay:.8s; color:#fff; }
  .ke-carnival-sparkle.cs4{ bottom:40px; right:8px; font-size:20px; animation-delay:1.2s; }
  .ke-carnival-sparkle.cs5{ top:40%; left:-6px; font-size:13px; animation-delay:1.6s; color:#fff; }
  @keyframes ke-sparkle-twinkle{ 0%,100%{ opacity:.35; transform:scale(.85) rotate(0deg); } 50%{ opacity:1; transform:scale(1.15) rotate(12deg); } }

  .ke-carnival-title{
    margin:0 0 6px; -webkit-text-stroke:0; text-shadow:none;
    font-family:'Baloo 2','Fredoka',sans-serif; font-weight:700;
    font-size:clamp(34px,8vw,56px); letter-spacing:0;
  }
  /* Kalın karnaval konturu: tek bir text-stroke yerine 8 yönlü koyu
     text-shadow yığını - "Çocuk Meclisi" referans görselindeki kalın,
     çizgi-film çıkartması hissini text-stroke'tan çok daha güvenilir
     veriyor (bazı tarayıcılarda stroke içeriği inceltir/kırpar). */
  .ke-carnival-title .ke-tword{
    display:inline-block; text-shadow:
      -3px -3px 0 #2A1B00, 3px -3px 0 #2A1B00, -3px 3px 0 #2A1B00, 3px 3px 0 #2A1B00,
      0 -3px 0 #2A1B00, 0 3px 0 #2A1B00, -3px 0 0 #2A1B00, 3px 0 0 #2A1B00,
      0 6px 0 rgba(0,0,0,.35);
    transform: rotate(-2deg);
  }
  .ke-carnival-title .ke-tword:nth-child(2n){ transform: rotate(2deg); }
  .ke-carnival-title .ke-tword:nth-child(1){ color: var(--ke-yellow); }
  .ke-carnival-title .ke-tword:nth-child(2){ color: #fff; }
  .ke-carnival-title .ke-tword:nth-child(3){ color: var(--ke-green); }
  .ke-carnival-subtitle{
    margin:0 auto 18px; max-width:420px; color:var(--kb-chalk); font-size:15px; font-weight:800;
    text-shadow:0 2px 0 rgba(0,0,0,.4);
  }
  .ke-mascot-btn{
    position:relative; display:inline-flex; align-items:center; justify-content:center;
    width:clamp(96px,24vw,132px); height:clamp(96px,24vw,132px); padding:0 !important;
    border-radius:50% !important; border:4px solid #fff !important;
    background: radial-gradient(circle at 50% 40%, #FFE97A 0%, #FFC20E 70%, #E0A500 100%) !important;
    box-shadow:none; top:0 !important; --btn-shadow:transparent;
    animation: ke-bob 2.6s ease-in-out infinite;
  }
  .ke-mascot-btn:active{ top:0 !important; filter:brightness(.96); }
  .ke-mascot-btn img.ke-av-body{ width:78%; height:78%; object-fit:contain; position:relative; z-index:1; }
  .ke-mascot-btn .ke-mascot-hat{ z-index:2; }
  .ke-mascot-badge{
    position:absolute; top:-4px; right:-4px; z-index:3;
    width:32px; height:32px; border-radius:50%; background:#fff;
    border:3px solid var(--ke-red); display:flex; align-items:center; justify-content:center;
    font-size:16px; box-shadow:0 3px 0 rgba(0,0,0,.2);
  }
  .ke-mascot-badge-pulse{ animation: ke-chip-pulse 1.1s ease-in-out infinite; }
  @media (max-width:480px){ .ke-carnival-hero{ padding:8px 14px 4px; } }

  /* Ayarlar/ayrıntılar artık maskota tıklayınca açılan hub sayfasında
     (showProfileScreen) - burada sade bir bağlantı satırı. */
  .ke-hub-links{ display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin:14px 0; }
  .ke-hub-link{ font-size:12.5px !important; padding:8px 14px !important; border-radius:999px !important; }
  #keHubProgress{ background:var(--ke-blue) !important; color:#fff !important; --btn-shadow:var(--ke-blue-dark); }
  #keHubGame{ background:var(--ke-red) !important; color:#fff !important; --btn-shadow:var(--ke-red-dark); }
  #keHubSound{ background:var(--ke-green) !important; color:#fff !important; --btn-shadow:var(--ke-green-dark); }
  #keHubLang{ background:var(--ke-purple) !important; color:#fff !important; --btn-shadow:var(--ke-purple-dark); }

  /* Kategoriye özgü zemin: renderEpisodeScene, --cc-tint/--cc-c inline
     değişkenlerini CATEGORY_THEME'den enjekte ediyor — böylece her
     kategorinin oyun sahnesi kendi konu rengini taşıyor, hepsi aynı
     soğuk mavi zemin yerine. */
  .ke-scene-wrap{
    position:relative; border-radius:28px; overflow:hidden;
    background: linear-gradient(180deg, var(--cc-tint, #8FCBFA) 0%, var(--cc-c, #1CB0F6) 100%);
    border:3px solid #ffffff;
    box-shadow:none;
    max-width:900px; margin:0 auto;
  }
  .ke-stars{
    position:absolute; inset:0; pointer-events:none; opacity:.8;
    background-image:
      radial-gradient(3px 3px at 30px 40px, color-mix(in srgb, var(--cc-c, #1CB0F6) 30%, transparent), transparent),
      radial-gradient(4px 4px at 160px 90px, rgba(255,194,14,.18), transparent),
      radial-gradient(2.5px 2.5px at 100px 180px, color-mix(in srgb, var(--cc-c, #58CC02) 26%, transparent), transparent),
      radial-gradient(3px 3px at 280px 50px, rgba(206,130,255,.16), transparent),
      radial-gradient(2.5px 2.5px at 340px 210px, color-mix(in srgb, var(--cc-c, #1CB0F6) 24%, transparent), transparent),
      radial-gradient(3.5px 3.5px at 400px 110px, rgba(255,75,75,.12), transparent),
      radial-gradient(2.5px 2.5px at 70px 240px, rgba(255,194,14,.14), transparent);
    background-repeat:repeat; background-size:420px 280px;
  }
  .ke-scene{ position:relative; height:540px; }

  /* Kategoriye özgü, hafif saydam dekor katmanı — "uzay için arka planda
     biraz saydam bir uzay olmalı, doğa ise doğa gibi" geri bildirimi
     üzerine. Sadece CSS şekilleri (gerçek illüstrasyon dosyası değil) —
     offline kalıyor, ek asset gerekmiyor. Nesnelerin/maskotun ALTINDA
     (z-index:0), tıklanamaz (pointer-events:none). */
  .ke-scene-motif{ position:absolute; inset:0; overflow:hidden; pointer-events:none; z-index:0; }
  .ke-motif-space{
    background-image:
      radial-gradient(2px 2px at 12% 20%, rgba(255,255,255,.9), transparent),
      radial-gradient(1.5px 1.5px at 24% 55%, rgba(255,255,255,.8), transparent),
      radial-gradient(2px 2px at 40% 15%, rgba(255,255,255,.7), transparent),
      radial-gradient(1.5px 1.5px at 65% 30%, rgba(255,255,255,.85), transparent),
      radial-gradient(2px 2px at 85% 60%, rgba(255,255,255,.7), transparent),
      radial-gradient(1.5px 1.5px at 55% 75%, rgba(255,255,255,.6), transparent),
      radial-gradient(1.5px 1.5px at 92% 22%, rgba(255,255,255,.8), transparent);
  }
  .ke-motif-space::before{
    content:''; position:absolute; top:6%; right:7%; width:100px; height:100px; border-radius:50%;
    background:radial-gradient(circle at 35% 32%, #DCC6FF, #7C4DFF 72%);
    opacity:.65; box-shadow:none;
  }
  .ke-motif-space::after{
    content:''; position:absolute; bottom:10%; left:5%; width:56px; height:56px; border-radius:50%;
    background:radial-gradient(circle at 35% 32%, #FFE9B0, #FFA000 72%); opacity:.6;
  }
  .ke-motif-nature::before{
    content:''; position:absolute; bottom:-15%; left:-8%; width:65%; height:140px; border-radius:50%;
    background:#4CAF50; opacity:.32;
  }
  .ke-motif-nature::after{
    content:''; position:absolute; bottom:-22%; right:-12%; width:75%; height:170px; border-radius:50%;
    background:#2ECC71; opacity:.28;
  }
  .ke-motif-sky::before{
    content:''; position:absolute; top:9%; left:8%; width:110px; height:36px; border-radius:40px;
    background:#ffffff; opacity:.8;
    box-shadow:none;
  }
  .ke-motif-sky::after{
    content:''; position:absolute; top:24%; right:10%; width:80px; height:28px; border-radius:40px;
    background:#ffffff; opacity:.65;
  }
  .ke-motif-water::before{
    content:''; position:absolute; bottom:0; left:0; right:0; height:70px;
    background:repeating-linear-gradient(90deg, rgba(41,182,246,.16) 0 40px, transparent 40px 80px);
    opacity:.6;
  }
  .ke-bubble{ position:absolute; top:16px; left:50%; transform:translateX(-50%); background:#ffffff; color:var(--ke-ink); padding:11px 20px; border-radius:18px; font-size:14.5px; font-weight:700; text-align:center; max-width:86%; border:2px solid var(--ke-border); box-shadow:none; z-index:5; }
  /* Diğer tebeşir-etiket dönüşümlerinden FARKLI: bu çip koyu tahtanın
     üzerinde değil, DOĞRUDAN parlak kategori sahnesinin üzerinde duruyor
     (bkz. .ke-scene-wrap kategori rengi). Tam şeffaf tebeşir etiketi
     yapılırsa açık kategori tonlarında (ör. sarı) okunaklılık düşer — bu
     yüzden yarı saydam KOYU bir destek zemin korunuyor, sadece tebeşir
     rengine/kesik kenarlığa çevrildi. */
  .ke-progress-chip{
    position:absolute; top:16px; right:16px;
    background: rgba(9,18,13,.5); border: 2px dashed var(--kb-discover);
    color: var(--kb-discover); border-radius: 10px 14px 10px 14px;
    padding:7px 16px; font-size:13px; font-weight:800; z-index:5;
    box-shadow:none; text-shadow:none;
  }
  .ke-obj{ position:absolute; z-index:5; cursor:pointer; transform-origin:center bottom; transition:transform .15s ease; animation:ke-floaty 3.4s ease-in-out infinite; }
  .ke-obj:hover, .ke-obj:focus-visible{ transform:scale(1.1) rotate(-3deg); }
  .ke-obj:focus-visible{ outline:3px solid var(--kb-discover); outline-offset:4px; border-radius:50%; }
  .ke-obj.ke-found{ opacity:.7; filter:none; cursor:default; }
  .ke-obj.ke-found:hover{ transform:none; }

  /* Dar ekranda (telefon) maskot çevresindeki daire yerine 2 sütunlu,
     rahat dokunulabilir bir GRID — "nesneler çakışmayacak, rahat
     dokunulabilir bir grid düzenine geçsin" isteği üzerine. Sahne sabit
     540px yüksekliği yerine içeriğe göre büyüyor (.ke-scene-wrap'ın
     overflow:hidden'ı, kutu İÇERİĞE göre büyüdüğü için hiçbir şeyi
     kesmiyor — sadece sabit boyutu aşan içerik kesilirdi). */
  .ke-scene-narrow{ height:auto !important; min-height:280px; padding-bottom:8px; }
  /* "hiç kaydırma olmamalı" — tek ekrana sığdırmak için koordineli bir
     alan bütçesi: 2 sütun yerine 3 sütun (6 kelimelik bölümlerde 3 satır
     yerine 2 satır - ~110px kazanç), ikonlar küçültüldü, üstteki
     balon+rozet için ayrılan boşluk (150px→112px) balon/rozet de
     küçültüldüğü için daralabiliyor (bkz. aşağıdaki .ke-bubble/
     .ke-progress-chip narrow override'ları). */
  .ke-scene-narrow #keObjects{
    position:relative; z-index:5; display:grid; grid-template-columns:repeat(3, 1fr);
    gap:8px; padding:112px 10px 76px; justify-items:center; align-items:center;
  }
  .ke-scene-narrow .ke-obj{ position:static; animation:none; }
  .ke-scene-narrow .ke-obj:hover{ transform:none; }
  .ke-scene-narrow .ke-icon-hex{ width:76px; height:76px; }
  .ke-scene-narrow .ke-icon-hex .ke-emoji-icon{ font-size:32px; }
  .ke-scene-narrow .ke-bubble{ font-size:12.5px; padding:8px 14px; top:8px; max-width:64%; }
  .ke-scene-narrow .ke-progress-chip{ font-size:11px; padding:5px 11px; top:8px; }
  /* Maskotun sağda-dikey-ortalanmış konumu, nesnelerin SOL yarıda bir
     çember içinde durduğu geniş-ekran varsayımına dayanıyordu ("iki
     taraf arasında çakışma riski yok" — ama dar ekranda nesneler tam
     genişlikte 2 sütunlu ızgaraya geçince bu varsayım çöküyor, maskot
     doğrudan ızgaranın/konuşma balonunun üzerine biniyordu ("maskot
     hala çalışmayı engelliyor" geri bildirimi, gerçek telefonda
     görüldü). Dar ekranda maskotu mutlak konumdan çıkarıp normal akışa
     alıyoruz — DOM'da #keObjects'ten SONRA geldiği için ızgaranın
     altında, kendi satırında, çakışmasız duruyor. */
  /* Maskot artık akışta değil, sağ alt köşede (kelime balonu alt satırdaki
     ikonların ALTINDA açılabilsin diye ızgaranın altında boşluk bırakıldı,
     bkz. #keObjects padding-bottom) - ilk sürümdeki gibi ızgarayla
     çakışmıyor, sadece balonla köşede kısmen üst üste gelebiliyor. */
  .ke-scene-narrow .ke-mascot-wrap{
    position:absolute; display:block; margin:0; transform:none;
    width:76px; right:8px; bottom:6px; left:auto; top:auto; z-index:1;
  }
  .ke-scene-narrow .ke-mascot-wrap::after{ display:none; }
  /* Keşfedilen kelime balonu eskiden sabit bir noktaya (top:16%/right:6%,
     masaüstünde maskotun yüzünü hedefliyordu) konumlanıyordu - dar
     ekranda maskot artık orada durmadığı için bu sabit konum doğrudan
     ızgaradaki bir resmin ÜZERİNE biniyordu ("resim üzerinde çıkıyor
     yazı" geri bildirimi). Yazı çocuklar için görsel+işitsel birlikte
     önemli olduğundan (gizlemek yerine) artık TIKLANAN NESNENİN TAM
     ÜSTÜNDE dinamik olarak konumlanıyor (bkz. JS'teki el.click
     handler'ı, requestAnimationFrame ile left/top hesaplanıyor) - hangi
     resme dokunulursa dokunulsun asla başka bir resmin üzerine binmez. */
  .ke-obj .ke-badge{ position:absolute; top:-6px; right:-6px; width:24px; height:24px; border-radius:50%; background:var(--kb-correct); border:3px solid var(--kb-chalk); display:none; align-items:center; justify-content:center; font-size:12px; color:#0E1A10; font-weight:800; z-index:2; }
  .ke-obj.ke-found .ke-badge{ display:flex; }
  /* TAM TEBEŞİR (v2): genlik 10px→4px — "sürekli güçlü floating
     animasyonu uygulama, hareket çok hafif olsun" isteği. */
  @keyframes ke-floaty{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-4px); } }

  /* Tüm ikon/foto/emoji/harf türleri TEK bir YUVARLAK kalıpta —
     böylece aynı sahnede bazısı fotoğraf bazısı ikon olsa bile görünüm
     tutarlı kalıyor. Önce altıgen ("arı peteği") denenmişti ama
     kullanıcı geri bildirimiyle ("amatörleştiriyor") yuvarlağa geri
     dönüldü; boyut da büyütüldü (132px). TAM TEBEŞİR (v2): parlak beyaz
     plastik çerçeve yerine açık-bej tebeşir halkası, hafif düzensiz
     kenar (asimetrik border-radius, "organik/elle çizilmiş" hissi). */
  .ke-icon-hex{
    width:132px; height:132px; background:var(--kb-chalk); border-radius:48% 52% 51% 49% / 52% 48% 53% 47%;
    display:flex; align-items:center; justify-content:center;
    box-shadow:none;
    flex-shrink:0;
  }
  .ke-icon-hex-inner{
    width:91%; height:91%; border-radius:50%;
    display:flex; align-items:center; justify-content:center; overflow:hidden;
  }
  .ke-icon-hex-inner:not(.ke-chip-photo){ padding:18px; }
  .ke-icon-hex-inner .ke-photo-img{ width:100%; height:100%; object-fit:cover; display:block; }
  .ke-icon-hex-inner .ke-icon-img{ width:100%; height:100%; object-fit:contain; }
  .ke-icon-hex-inner .ke-emoji-icon{ font-size:52px; line-height:1; }
  .ke-icon-hex-inner .ke-letter-badge-text{ font-size:13px; font-weight:800; color:#fff; text-align:center; line-height:1.15; text-shadow:none; }

  /* Aktapokus'un bunu SÖYLEDİĞİNİ göstermek için gerçek bir çizgi-roman
     konuşma balonu — kutunun altında maskotun başına doğru bir kuyruk
     (bkz. ::before/::after üçgenleri, kutunun 3D gölge diliyle uyumlu
     iki katman). */
  /* "Aktapokus ve konuşma baloncuğu sahnenin SAĞINDA, nesneler SOLDA
     çember" geri bildirimi üzerine — balon artık maskotun (sağda, dikey
     ortalanmış) hemen ÜSTÜNDE duruyor. Kuyruk balonun ORTASINDAN
     (right ile sabit bir ofset değil, %50+translateX) aşağı, maskotun
     yüzüne doğru iniyor — böylece kelime ne kadar kısa/uzun olursa
     olsun kuyruk her zaman maskotun (yaklaşık ortada duran) yüzünü
     hedefliyor, balonun kendi genişliğine bağlı kalmadan. */
  /* left/top artık JS'ten (el.click handler'ı) tıklanan nesnenin
     konumuna göre px cinsinden set ediliyor - burada sadece güvenli bir
     ilk değer + yatay ortalama (translateX(-50%), JS her zaman left'i
     nesnenin YATAY MERKEZİNE göre veriyor) tanımlı. */
  .ke-word-popup{ position:absolute; right:auto; left:50%; bottom:auto; top:16%; transform:translateX(-50%) translateY(-8px) scale(.85); background:var(--ke-yellow); color:var(--ke-ink); padding:11px 28px; border-radius:20px; font-family:'Chewy','Fredoka',sans-serif; font-size:26px; font-weight:400; opacity:0; pointer-events:none; transition:opacity .25s ease, transform .25s ease; z-index:6; box-shadow:none; max-width:80%; text-align:center; }
  .ke-word-popup::before{
    content:''; position:absolute; left:50%; bottom:-14px; transform:translateX(-50%);
    border-left:7px solid transparent; border-right:7px solid transparent;
    border-top:14px solid var(--ke-yellow-dark);
  }
  .ke-word-popup::after{
    content:''; position:absolute; left:50%; bottom:-9px; transform:translateX(-50%);
    border-left:6px solid transparent; border-right:6px solid transparent;
    border-top:11px solid var(--ke-yellow);
  }
  .ke-word-popup.ke-show{ opacity:1; transform:translateX(-50%) translateY(0) scale(1); }
  /* Alt satırdaki ikonlarda balon ikonun ALTINDA açılıyor - işaretçi
     üçgeni yukarı bakmalı (JS ke-below sınıfını ekliyor). */
  .ke-word-popup.ke-below::before{ bottom:auto; top:-14px; border-top:none; border-bottom:14px solid var(--ke-yellow-dark); }
  .ke-word-popup.ke-below::after{ bottom:auto; top:-9px; border-top:none; border-bottom:11px solid var(--ke-yellow); }
  .ke-shell .ke-scene.ke-scene-narrow .ke-word-popup{ font-size:22px; padding:7px 18px; }

  /* Maskot artık sahnenin ALTINDA-ORTADA değil, SAĞINDA dikey ortalanmış
     duruyor — nesne çemberi (bkz. getCircularPosition, centerX artık
     sol yarıda) onun etrafını sarmak yerine tamamen solda kalıyor, iki
     taraf arasında hiç çakışma riski olmuyor.
     ÖNEMLİ MİMARİ KURAL: .ke-mascot-wrap'ın transform'u SADECE
     KONUMLANDIRMA için (dikey ortalama) — hiçbir animasyon (ke-bob,
     ke-mascot-jump) wrapper'ın transform'unu ASLA animate etmemeli.
     Sebep: bir animasyon aynı elementin transform'unu hedef alırsa,
     keyframe'ler statik transform değerini TAMAMEN geçersiz kılar (ör.
     translateY(-50%) kaybolur) — "her tıklamada Aktapokus bir aşağı bir
     yukarı zıplıyor" hatası tam olarak buydu (ke-mascot-jump celebrate
     animasyonu, dikey ortalamayı her tetiklendiğinde anlık sıfırlıyordu).
     Çözüm: TÜM hareket animasyonları içerideki <img class="ke-mascot-img">
     üzerinde çalışıyor; wrapper'ın transform'u hiç değişmiyor. */
  .ke-mascot-wrap{ position:absolute; left:auto; right:5%; top:50%; bottom:auto; transform:translateY(-50%); width:170px; z-index:4; }
  /* Maskotun altinda/arkasinda hicbir eklenti golge/oval yok - PNG'nin
     kendi seffafligi dogrudan gosteriliyor ("golgeleme olmasin" kurali). */
  .ke-mascot-img{ display:block; width:100%; height:auto; user-select:none; -webkit-user-drag:none; animation:ke-bob 2.6s ease-in-out infinite; position:relative; z-index:1; }
  /* Quiz/konuşma/cümle modlarında balon üstte, maskot sahnenin dibinde
     kalıyordu — "konuşma balonu şimdi Aktapokus'tan çok uzakta" geri
     bildirimi. Bu modlarda maskotu küçültüp balonun yanına, üste
     taşıyoruz; z-index'i üst katmanın (z-index:40) üzerine çıkarıyoruz
     ki görünür kalsın. */
  .ke-mascot-wrap.ke-mascot-compact{
    width:100px; left:auto; right:16px; bottom:auto; top:60px; z-index:45; transform:none;
  }
  /* Dar ekranda keşif sahnesi daireden grid'e geçince maskot da aynı
     "küçük/köşede" yerleşime taşınıyor (quiz/konuşma modlarıyla aynı
     görsel dil) — böylece grid'deki nesnelerle asla çakışmıyor. */
  .ke-mascot-wrap.ke-mascot-narrow{
    width:90px; left:auto; right:14px; bottom:auto; top:14px; z-index:6; transform:none;
  }
  .ke-mascot-wrap.ke-mascot-narrow .ke-mascot-img{ animation:none; }
  @keyframes ke-bob{ 0%,100%{ transform:translateY(0) rotate(0deg); } 50%{ transform:translateY(-7px) rotate(-1deg); } }
  .ke-mascot-wrap.ke-celebrate .ke-mascot-img{ animation:ke-mascot-jump .6s ease; }
  @keyframes ke-mascot-jump{
    0%{ transform:translateY(0) scale(1) rotate(0deg); }
    30%{ transform:translateY(-26px) scale(1.1) rotate(-4deg); }
    55%{ transform:translateY(0) scale(.94) rotate(3deg); }
    75%{ transform:translateY(-10px) scale(1.04) rotate(-1deg); }
    100%{ transform:translateY(0) scale(1) rotate(0deg); }
  }
  .ke-tentacle{ animation:ke-wiggle 2.2s ease-in-out infinite; transform-origin:top center; }
  .ke-tentacle.t2{ animation-delay:.3s; } .ke-tentacle.t3{ animation-delay:.6s; } .ke-tentacle.t4{ animation-delay:.9s; }
  @keyframes ke-wiggle{ 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(6deg); } }
  .ke-mouth-open{ display:none; }
  .ke-mascot-wrap.ke-talking .ke-mouth-closed{ display:none; }
  .ke-mascot-wrap.ke-talking .ke-mouth-open{ display:block; }

  .ke-footer-row{ display:flex; justify-content:center; margin-top:18px; }
  .ke-shell.ke-fs .ke-fullscreen-btn{ display:none !important; }
  .ke-help-btn{ display:none; }
  @media (max-width:640px){
    .ke-shell .ke-help-btn{ display:flex; align-items:center; justify-content:center; position:absolute; top:8px; left:8px; z-index:8; width:36px; height:36px; padding:0 !important; border-radius:50% !important; font-size:18px !important; }
    .ke-shell:not(.ke-show-help) .ke-hint, .ke-shell:not(.ke-show-help) .ke-jump-row{ display:none; }
    .ke-shell .ke-scene-narrow ~ .ke-footer-row{ margin-top:6px; }
    .ke-shell.ke-fs .ke-subtitle{ display:none; }
    .ke-shell.ke-fs .ke-title{ font-size:clamp(22px,6vw,30px); margin:2px 0; }
  }
  .ke-hint{ font-size:12.5px; color:var(--kb-chalk-dim); text-align:center; font-weight:600; }
  /* "Başlangıç noktası" — çocuk deneyiminin parçası değil, geliştirici/
     ebeveyn için bir test kısayolu ("daha anlaşılır ve ikincil hale
     getir" isteği üzerine). Native <details>/<summary>: JS'siz aç/kapa,
     klavye ile Enter/Space ile çalışır, ekran okuyucu "collapsed/
     expanded" durumunu kendiliğinden anons eder. Kapalı haldeyken
     içindeki düğmeler DOM'da kalır (sadece görünmezdir) — bu, tekrar
     turu özelliğinin #keJumpQuiz'i .click() ile tetiklemesini bozmaz. */
  .ke-jump-row{ margin-top:14px; text-align:center; opacity:.6; }
  .ke-jump-row summary{
    display:inline-block; cursor:pointer; font-size:10.5px; color:rgba(255,255,255,.75);
    font-weight:600; list-style:none; padding:4px 10px; border-radius:999px;
  }
  .ke-jump-row summary::-webkit-details-marker{ display:none; }
  .ke-jump-row summary:focus-visible{ outline:2px solid var(--kb-action); outline-offset:2px; }
  /* display:none varsayılanı BİLİNÇLİ — details[open] olmadıkça gizli
     kalmalı. Tarayıcının kendi details:not([open])>* gizleme kuralı
     yeterli olurdu, ama bu blok display:flex atadığı için (author CSS
     UA stylesheet'ini her zaman ezer) o davranışı burada elle
     tekrarlamak gerekiyor — yoksa düğmeler kapalıyken de görünür kalır. */
  .ke-jump-buttons{ display:none; align-items:center; justify-content:center; gap:8px; flex-wrap:wrap; margin-top:8px; }
  .ke-jump-row[open] .ke-jump-buttons{ display:flex; }
  .ke-jump-btn{ font-size:11.5px !important; font-weight:700 !important; padding:6px 13px !important; border-radius:8px 12px 9px 11px !important; background:rgba(245,240,223,.06) !important; color:var(--kb-chalk-dim) !important; border:1.5px dashed rgba(245,240,223,.4) !important; --btn-shadow:transparent !important; box-shadow:none; }
  .ke-jump-btn:active{ top:2px !important; box-shadow:none; }

  /* GERÇEK karatahta denemesi (v2) — ilk deneme kategori rengiyle
     karışıp şeffaflaşan bir "mor-turuncu bulanıklık"a dönüşmüştü ("kara
     tahta değil ki bu" geri bildirimi, haklı). Bu sürüm: OPAK, koyu
     yeşilimsi-siyah bir tahta dolgusu (kategori rengiyle hiç
     karışmıyor, canlı sahneye asla bulaşmıyor), ahşap-kahverengi bir
     çerçeve ve sahnenin içine biraz payla yerleştirilmiş (left/right
     inset) — "sahneye asılmış gerçek bir tahta" hissi. Kelime metinleri
     'Fredericka the Great' fontuyla (bkz. FONT_FILES) tebeşir-el yazısı
     hissi veriyor — Rock Salt denendi ama "çocuklar için okunaksız"
     bulundu, bu daha iri/net harf gövdeleriyle değiştirildi. */
  /* bottom:10px + overflow-y:auto: bu panel .ke-scene-wrap'in icinde
     (o kutu dekoratif tasmayi gizlemek icin overflow:hidden) - panel
     icerigi sahnenin sabit yuksekliginden (ozellikle mobil fullscreen'de
     70vh) uzun olunca alt kisim (butonlar dahil "Kontrol Et") sessizce
     kirpiliyordu ("kontrol et yazisi gorunmuyor" geri bildirimi).
     bottom:10px vererek panelin kendisini sahneye sigdiriyoruz, tasan
     icerik KIRPILMIYOR, panelin kendi icinde kayiyor. */
  .ke-quiz{ position:absolute; top:10px; left:3%; right:3%; bottom:10px; overflow-y:auto; max-width:620px; margin:0 auto; display:none; flex-direction:column; align-items:center; gap:16px; padding:52px 20px 26px; z-index:40; background:radial-gradient(ellipse 640px 260px at 50% 0%, #263229 0%, #1a231d 55%, #10160f 100%); border:5px solid #6b4226; border-radius:22px; box-shadow:none; }
  .ke-quiz.ke-show{ display:flex; }
  .ke-quiz-bubble{ position:static; transform:none; margin:0; }
  .ke-quiz-progress{ background:rgba(110,200,255,.1); border:2px dashed var(--kb-action); color:var(--kb-action); border-radius:10px 14px 10px 14px; padding:6px 16px; font-size:12.5px; font-weight:800; box-shadow:none; text-shadow:none; }
  .ke-quiz-word{ font-family:'Fredericka the Great','Chewy','Fredoka',sans-serif; font-weight:400; font-size:26px; color:#F5F3EE; text-shadow:none; }
  .ke-quiz-replay{
    position:absolute; top:16px; right:16px; width:44px; height:44px; border-radius:50% !important;
    background:var(--ke-surface-2); --btn-shadow:#7FA8D6; color:var(--ke-ink);
    display:flex; align-items:center; justify-content:center; padding:0 !important;
  }
  /* Keşif ekranındaki YUVARLAK resim tarzı sadece keşif için — quiz
     kartları KÖŞELİ/KART şeklinde kalmalı, sadece büyütülmeli
     ("quiz kartları büyük ve kart şeklinde olmalı yuvarlak değil,
     eğitim kısmı yuvarlak olmalı" geri bildirimi). */
  .ke-quiz-cards{ display:grid; grid-template-columns:repeat(2, 1fr); gap:18px; width:100%; max-width:min(460px, 50vh); }
  .ke-quiz-card{
    background:#ffffff; border:4px solid var(--ke-border); border-radius:24px;
    padding:10px; cursor:pointer; display:flex; align-items:center; justify-content:center;
    transition: border-color .15s ease, background .15s ease, top .08s ease, box-shadow .08s ease;
    aspect-ratio:1/1; position:relative; top:0; box-shadow:none;
  }
  .ke-quiz-card .ke-icon-hex{ width:100%; height:100%; box-shadow:none; background:transparent; }
  .ke-quiz-card .ke-icon-hex-inner{ width:100%; height:100%; }
  .ke-quiz-card .ke-icon-hex .ke-emoji-icon{ font-size:52px; }
  .ke-quiz-card .ke-icon-hex .ke-letter-badge-text{ font-size:13px; }
  .ke-quiz-card:hover{ border-color:var(--ke-blue); }
  .ke-quiz-card:active:not(:disabled){ top:5px; box-shadow:none; }
  .ke-quiz-card:disabled{ cursor:not-allowed; }
  .ke-quiz-card:disabled:hover{ border-color:var(--ke-border); }
  .ke-quiz-card.ke-correct{ border-color:var(--kb-correct); background:#EFFCE5; box-shadow:none; animation:ke-pop .35s ease; }
  .ke-quiz-card.ke-wrong{ border-color:var(--kb-wrong); background:#FFEDED; opacity:.65; box-shadow:none; animation:ke-shake-x .35s ease; }
  /* Doğru/yanlış SADECE renkle değil — keşif ekranındaki ✓ rozetiyle
     aynı dilde bir simge de ekleniyor (renk körü/düşük görüşlü çocuklar
     için). */
  .ke-quiz-card.ke-correct::after, .ke-quiz-card.ke-wrong::after{
    content:''; position:absolute; top:-8px; right:-8px; width:26px; height:26px;
    border-radius:50%; border:3px solid #fff; background-size:14px 14px;
    background-repeat:no-repeat; background-position:center;
  }
  .ke-quiz-card.ke-correct::after{
    background-color:var(--kb-correct);
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E");
  }
  .ke-quiz-card.ke-wrong::after{
    background-color:var(--kb-wrong);
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='18' y1='6' x2='6' y2='18'/%3E%3Cline x1='6' y1='6' x2='18' y2='18'/%3E%3C/svg%3E");
  }
  @keyframes ke-pop{ 0%{ transform:scale(1); } 40%{ transform:scale(1.12); } 100%{ transform:scale(1); } }
  @keyframes ke-shake-x{ 0%,100%{ transform:translateX(0); } 25%{ transform:translateX(-6px); } 75%{ transform:translateX(6px); } }
  .ke-scene:not(.ke-scene-narrow) .ke-quiz{ overflow:hidden; padding:44px 20px 16px; gap:8px; }
  .ke-scene:not(.ke-scene-narrow) .ke-quiz .ke-quiz-cards{ flex:1 1 0; min-height:0; max-width:min(640px,100%); grid-template-rows:repeat(2, minmax(0,1fr)); gap:12px; }
  .ke-scene:not(.ke-scene-narrow) .ke-quiz .ke-quiz-card{ aspect-ratio:auto; height:100%; min-height:0; min-width:0; padding:6px; }
  .ke-quiz-card{ container-type:size; }
  .ke-scene:not(.ke-scene-narrow) .ke-quiz .ke-quiz-card .ke-icon-hex{ width:min(100cqw,100cqh); height:min(100cqw,100cqh); max-width:none; flex:none; }
  .ke-shell.ke-fs .ke-quiz-cards{ max-width:min(600px,100%); }

  .ke-speak{ position:absolute; top:10px; left:3%; right:3%; bottom:10px; overflow-y:auto; max-width:480px; margin:0 auto; display:none; flex-direction:column; align-items:center; gap:14px; padding:52px 20px 26px; z-index:40; background:radial-gradient(ellipse 640px 260px at 50% 0%, #263229 0%, #1a231d 55%, #10160f 100%); border:5px solid #6b4226; border-radius:22px; box-shadow:none; }
  .ke-speak.ke-show{ display:flex; }
  .ke-speak-progress{ background:rgba(110,200,255,.1); border:2px dashed var(--kb-action); color:var(--kb-action); border-radius:10px 14px 10px 14px; padding:6px 16px; font-size:12.5px; font-weight:800; box-shadow:none; text-shadow:none; }
  .ke-speak-card{ background:#ffffff; border:3px solid var(--ke-border); border-radius:24px; padding:18px 34px; display:flex; flex-direction:column; align-items:center; gap:8px; box-shadow:none; }
  .ke-speak-card .ke-icon-hex{ width:170px; height:170px; }
  .ke-speak-card .ke-icon-hex .ke-emoji-icon{ font-size:66px; }
  /* DİKKAT: bu metin .ke-speak-card'ın (BEYAZ kart) İÇİNDE — tahtanın
     üzerinde değil. Tebeşir-beyazı renk burada kart üstünde neredeyse
     görünmez olurdu; "tebeşir hissi" fontun şekli üzerinden korunuyor,
     renk okunaklılık için koyu tahta rengine çekildi. */
  .ke-speak-word{ font-family:'Fredericka the Great','Chewy','Fredoka',sans-serif; font-size:30px; font-weight:400; color:var(--kb-board); letter-spacing:.5px; text-align:center; }
  .ke-speak-feedback{ min-height:20px; font-size:13.5px; font-weight:700; text-align:center; max-width:90%; color:#F3EEFF; text-shadow:none; }
  .ke-speak-mic{ display:inline-flex; align-items:center; gap:8px; background:var(--ke-blue); color:#fff; --btn-shadow:var(--ke-blue-dark); }
  /* Dinleme durumu kasıtlı olarak KIRMIZI değil — kırmızı bu uygulamada
     sadece "hata/yanlış" anlamına geliyor (bkz. ke-quiz-card.ke-wrong),
     dinlerken kırmızı görmek çocuğa yanlış yaptığı hissini veriyordu.
     Mor/mavi "ses" rolüne ayrılmış (bkz. STYLE üstündeki renk notu). */
  .ke-speak-mic.ke-listening{ background:var(--kb-voice); color:#1A1030; --btn-shadow:#9576D6; animation:ke-pulse 1s ease-in-out infinite; }
  @keyframes ke-pulse{ 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.06); } }

  .ke-sentence{ position:absolute; top:10px; left:3%; right:3%; bottom:10px; overflow-y:auto; max-width:620px; margin:0 auto; display:none; flex-direction:column; align-items:center; gap:16px; padding:48px 16px 26px; z-index:40; background:radial-gradient(ellipse 640px 260px at 50% 0%, #263229 0%, #1a231d 55%, #10160f 100%); border:5px solid #6b4226; border-radius:22px; box-shadow:none; }
  .ke-sentence.ke-show{ display:flex; }
  .ke-sentence-bubble{ position:static; transform:none; margin:0; }
  .ke-sentence-progress{ background:rgba(110,200,255,.1); border:2px dashed var(--kb-action); color:var(--kb-action); border-radius:10px 14px 10px 14px; padding:6px 16px; font-size:12.5px; font-weight:800; box-shadow:none; text-shadow:none; }
  /* Çocuğun hangi kelimenin cümlesini kurduğunu göremediği, sadece
     tuzak kelimenin de anlamlı bir cümle kurduğu ("I see a cat" yerine
     "I see a dog" bekleniyordu ama hangisi hedef belli değildi) geri
     bildirimi üzerine eklendi — hedef görsel artık her cümlede gösteriliyor. */
  .ke-sentence-icon .ke-icon-hex{ width:110px; height:110px; }
  .ke-sentence-icon .ke-emoji-icon{ font-size:44px; }
  .ke-sentence-slots{ display:flex; flex-wrap:wrap; gap:8px; justify-content:center; min-height:40px; max-width:560px; }
  /* Tebeşirle çizilmiş alt çizgi + tebeşir-beyazı metin — koyu tahta
     zemininde önceki mavi-üstü-mavi (blue-dark metin + #7FA8D6 çizgi)
     kombinasyonu neredeyse görünmezdi ("mavi font görünmüyor" geri
     bildirimi). */
  .ke-slot{ min-width:48px; height:44px; border-bottom:3px dashed rgba(245,240,223,.55); display:flex; align-items:center; justify-content:center; padding:0 6px; font-weight:400; font-family:'Fredericka the Great','Chewy',sans-serif; color:var(--kb-chalk); text-shadow:none; font-size:19px; }
  .ke-slot.ke-filled{ cursor:pointer; border-bottom-style:solid; }
  .ke-slot.ke-reveal{ color:var(--kb-correct); border-bottom-style:solid; }
  .ke-tile, .ke-slot{ touch-action:none; user-select:none; -webkit-user-select:none; }
  .ke-letter-slot{ min-width:34px; width:34px; }
  .ke-slot-gap{ min-width:14px; width:14px; border-bottom:none; }
  .ke-letter-slot.ke-fixed, .ke-letter-slot.ke-hint{ color:var(--kb-discover); border-bottom-style:solid; }
  .ke-letter-tile{ min-width:44px; padding:10px 14px !important; font-size:20px !important; }
  .ke-drag-ghost{ position:fixed !important; z-index:99999; transform:translate(-50%,-60%); pointer-events:none; opacity:.92; box-shadow:none; }
  .ke-slot.ke-shake{ border-bottom-color:var(--kb-wrong); animation:ke-shake-x .35s ease; }
  .ke-sentence-bank{ display:flex; flex-wrap:wrap; gap:10px; justify-content:center; max-width:560px; }
  .ke-tile{
    background:#ffffff; border:3px solid var(--ke-border); border-radius:14px; padding:10px 18px;
    font-weight:800; font-size:15px; color:var(--ke-ink); cursor:pointer;
    position:relative; top:0; box-shadow:none;
  }
  .ke-tile:hover{ border-color:var(--ke-blue); }
  .ke-tile:active{ top:4px; box-shadow:none; }
  .ke-tile.ke-used{ visibility:hidden; }
  .ke-tile.ke-shake{ animation:ke-shake-x .3s ease; border-color:var(--kb-wrong); }

  .ke-score{ font-size:17px; font-weight:800; color:var(--kb-action); text-shadow:none; margin-bottom:8px; }
  /* TAM TEBEŞİR (v2): beyaz/açık-mavi modal kaldırıldı — kutlama artık
     koyu tahta zemini + sarı tebeşir "yıldızlar" (radial-gradient
     benekleri, yeni asset yok) + büyük yeşil tebeşir başarı mesajı. */
  .ke-celebration{
    position:absolute; inset:0; display:none; align-items:center; justify-content:center;
    flex-direction:column; z-index:50; text-align:center; padding:20px; border-radius:24px;
    background-color: var(--kb-board);
    background-image:
      radial-gradient(1.5px 1.5px at 12% 20%, rgba(255,215,90,.7), transparent),
      radial-gradient(1px 1px at 30% 70%, rgba(255,255,255,.6), transparent),
      radial-gradient(1.5px 1.5px at 55% 15%, rgba(255,215,90,.55), transparent),
      radial-gradient(1px 1px at 78% 55%, rgba(255,255,255,.5), transparent),
      radial-gradient(1.5px 1.5px at 88% 25%, rgba(255,215,90,.65), transparent),
      radial-gradient(1px 1px at 45% 85%, rgba(255,255,255,.5), transparent),
      radial-gradient(circle at 30% 0%, rgba(255,255,255,.05), transparent 60%);
    border: 3px solid var(--kb-wood-light);
  }
  .ke-celebration.ke-show{ display:flex; }
  .ke-celebration h2{ font-family:'Fredoka','Baloo 2',sans-serif; color:var(--kb-correct); font-size:clamp(24px,5vw,34px); font-weight:600; margin:6px 0 4px; text-shadow:none; }
  .ke-celebration p{ color:var(--kb-chalk-dim); margin:0 0 18px; font-size:15px; font-weight:600; }
  .ke-reward-chip{
    display:inline-flex; align-items:center; gap:8px;
    background: rgba(255,215,90,.12); color: var(--kb-discover);
    font-family:'Fredoka','Baloo 2',sans-serif; font-weight:600; font-size:16px;
    padding:13px 24px; border-radius:14px 18px 15px 17px; border:2px dashed var(--kb-discover);
    box-shadow:none; text-shadow:none;
    margin-bottom:22px;
  }
  .ke-btn-row{ display:flex; gap:12px; flex-wrap:wrap; justify-content:center; }

  .ke-confetti{ position:absolute; top:-20px; width:9px; height:15px; opacity:.95; animation:ke-fall linear forwards; border-radius:2px; }
  @keyframes ke-fall{ to{ transform:translateY(560px) rotate(360deg); opacity:.4; } }
  @media (max-width:520px){
    .ke-scene{ height:420px; } .ke-mascot-wrap{ width:130px; } .ke-icon-hex{ width:96px; height:96px; }
    .ke-word-popup{ font-size:19px; padding:9px 20px; }
  }

  /* Giriş ekranında karşılayan Aktapokus — "diğer görselleri hiç
     kullanmamışsın" geri bildirimi üzerine wave pozu burada. Başlık/
     alt yazı bloğuna sağdan boşluk verip (.ke-landing-header) maskotun
     üzerine binmesini engelliyoruz — "kalabalık" geri bildirimi. */
  .ke-landing-mascot{
    position:absolute; top:0; right:6px; width:86px; height:auto;
    pointer-events:none;
    z-index:1; animation:ke-bob 2.6s ease-in-out infinite;
  }

  /* Avatar: sapka overlay'i maskot görseliyle aynı animasyonu paylaşır */
  .ke-mascot-hat{ position:absolute; z-index:2; pointer-events:none; height:auto; animation:ke-bob 2.6s ease-in-out infinite; }
  .ke-mascot-wrap.ke-celebrate .ke-mascot-hat{ animation:ke-mascot-jump .6s ease; }
  .ke-mascot-wrap.ke-mascot-narrow .ke-mascot-hat{ animation:none; }
  .ke-landing-mascot img{ display:block; width:100%; height:auto; }
  .ke-landing-mascot .ke-mascot-hat{ animation:none; }
  .ke-profile-chip{ display:inline-flex; align-items:center; gap:8px; margin:0 0 10px; padding:4px 14px 4px 6px !important; border-radius:999px !important; font-size:13px !important; }
  .ke-stat-row{ font-size:16px; font-weight:700; margin:10px auto; text-align:left; max-width:340px; color:var(--kb-chalk); }
  .ke-week-card{ background:linear-gradient(155deg, rgba(255,255,255,.06), rgba(255,255,255,.02)); border:2px solid rgba(245,240,223,.18); border-radius:18px; padding:16px 18px; text-align:left; margin-top:8px; }
  .ke-week-top{ display:flex; align-items:flex-end; justify-content:space-between; gap:10px; flex-wrap:wrap; }
  .ke-week-time{ font-size:13px; font-weight:800; color:var(--kb-chalk-dim); }
  .ke-spark-row{ display:flex; justify-content:space-between; align-items:flex-end; gap:6px; height:60px; margin-top:14px; }
  .ke-spark-col{ display:flex; flex-direction:column; align-items:center; gap:6px; flex:1; }
  .ke-spark-bar{ width:100%; max-width:28px; border-radius:6px 6px 3px 3px; background:var(--kb-action); opacity:.55; }
  .ke-spark-today{ background:var(--kb-discover); opacity:1; }
  .ke-spark-day{ font-size:10.5px; font-weight:800; color:var(--kb-chalk-dim); }
  .ke-kpi-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin-top:14px; }
  .ke-kpi-card{ border-radius:16px; padding:16px; text-align:left; }
  .ke-kpi-val{ font-size:28px; font-weight:800; color:var(--kb-chalk); line-height:1.1; }
  .ke-kpi-lbl{ font-size:12.5px; font-weight:800; color:var(--kb-chalk-dim); text-transform:uppercase; letter-spacing:.03em; margin-top:4px; }
  .ke-kpi-gold{ background:rgba(255,215,90,.14); border:2px solid rgba(255,215,90,.4); }
  .ke-kpi-wood{ background:rgba(216,158,94,.14); border:2px solid rgba(216,158,94,.4); }
  .ke-kpi-teal{ background:rgba(110,200,255,.14); border:2px solid rgba(110,200,255,.4); }
  .ke-kpi-good{ background:rgba(133,217,138,.14); border:2px solid rgba(133,217,138,.4); }
  .ke-trophy-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(96px,1fr)); gap:12px; margin-top:10px; }
  .ke-trophy{ border-radius:14px; padding:12px 8px; text-align:center; background:rgba(245,240,223,.05); border:2px dashed rgba(245,240,223,.25); opacity:.55; }
  .ke-trophy-got{ opacity:1; background:rgba(255,215,90,.1); border-style:solid; border-color:var(--kb-discover); }
  .ke-trophy-badge{ width:40px; height:40px; border-radius:50%; margin:0 auto 8px; display:flex; align-items:center; justify-content:center; font-size:20px; background:rgba(245,240,223,.12); }
  .ke-trophy-name{ font-size:11.5px; font-weight:800; color:var(--kb-chalk); }
  .ke-trophy-need{ font-size:10px; font-weight:700; color:var(--kb-chalk-dim); margin-top:3px; }
  .ke-daily-goal{ display:inline-block; margin:0 0 10px 8px; padding:4px 12px; border-radius:999px; background:rgba(255,215,90,.12); border:1.5px dashed var(--kb-discover); color:var(--kb-discover); font-size:12px; font-weight:800; }
  .ke-game-chip{ padding:4px 14px !important; }
  .ke-game-chip:disabled{ opacity:.4; cursor:not-allowed; }
  .ke-game-toast{
    position:absolute; left:50%; top:14px; transform:translateX(-50%) translateY(-30px);
    background:#fff; color:var(--ke-ink); border:2px solid var(--ke-border); border-radius:16px;
    padding:10px 18px; font-size:13px; font-weight:700; text-align:center; z-index:200;
    opacity:0; transition:opacity .3s ease, transform .3s ease; box-shadow:none; max-width:88%;
  }
  .ke-game-toast.ke-show{ opacity:1; transform:translateX(-50%) translateY(0); }
  .ke-river-game{ position:absolute; inset:0; z-index:100; background:#1a3a5c; border-radius:inherit; overflow:hidden; }
  .ke-river-game canvas{ position:absolute; inset:0; width:100%; height:100%; display:block; touch-action:none; }
  .ke-river-hud{ position:absolute; top:0; left:0; right:0; display:flex; align-items:center; justify-content:space-between; padding:calc(10px + env(safe-area-inset-top, 0px)) calc(14px + env(safe-area-inset-right, 0px)) 10px calc(14px + env(safe-area-inset-left, 0px)); z-index:2; }
  .ke-river-score{ background:rgba(0,0,0,.4); color:#FFD75A; font-weight:800; padding:6px 14px; border-radius:999px; font-size:14px; display:flex; align-items:center; gap:8px; }
  .ke-river-best{ color:#FFF3C4; font-size:11.5px; font-weight:700; opacity:.85; }
  .ke-river-fuel-wrap{ flex:1; max-width:220px; height:14px; margin:0 12px; border-radius:999px; background:rgba(0,0,0,.4); overflow:hidden; border:2px solid rgba(255,255,255,.3); }
  .ke-river-fuel-bar{ height:100%; width:100%; background:#6EC8FF; transition:width .15s linear, background .2s ease; }
  .ke-river-close{ background:rgba(0,0,0,.45) !important; color:#fff !important; border:none !important; width:34px; height:34px; border-radius:50% !important; font-size:16px !important; padding:0 !important; top:0 !important; box-shadow:none !important; }
  /* Onceki 3-kucuk-yuvarlak-dugme semasi ("cok kullanissiz", "basili
     tutunca gitmiyor") kaldirildi - parmak, 64px'lik yuvarlak hedefin
     disina cok kolay tasiyordu (ozellikle iOS'ta), pointerleave hemen
     hareketi kesiyordu. Yerine TAM YUKSEKLIKTE iki buyuk dokunma
     bolgesi: sol yari = surukle-yonlendir (parmak nereye giderse
     tekne oraya gider, kacirma payi cok yuksek), sag yari = dokun-ates.
     "tek parmakla ucak yonlenmeli diger parmakla ates edilmeli" istegi. */
  .ke-river-touch-zones{ position:absolute; inset:0; display:flex; z-index:1; }
  .ke-river-zone{ flex:1; display:flex; align-items:flex-end; justify-content:center; padding-bottom:14px; touch-action:none; }
  .ke-river-zone-steer{ background:linear-gradient(180deg, transparent 70%, rgba(30,140,255,.14) 100%); }
  .ke-river-zone-fire{ background:linear-gradient(180deg, transparent 70%, rgba(255,90,90,.14) 100%); }
  .ke-river-zone-fire:active{ background:linear-gradient(180deg, transparent 55%, rgba(255,90,90,.28) 100%); }
  .ke-river-zone-hint{
    font-size:11px; font-weight:800; letter-spacing:.06em; color:rgba(255,255,255,.55);
    background:rgba(0,0,0,.25); padding:5px 12px; border-radius:999px; pointer-events:none; user-select:none;
  }
  .ke-river-shoot{ background:rgba(255,107,107,.5) !important; border-color:rgba(255,107,107,.9) !important; }
  .ke-river-overlay-msg{ position:absolute; inset:0; z-index:5; display:flex; align-items:center; justify-content:center; background:rgba(10,20,30,.72); padding:20px; }
  .ke-river-msg-card{ background:#F5F0DF; color:var(--ke-ink); border-radius:20px; padding:26px 24px; text-align:center; max-width:340px; }
  .ke-river-msg-card h2{ margin:0 0 8px; font-family:'Fredoka','Baloo 2',sans-serif; font-size:24px; }
  .ke-river-msg-card p{ margin:0 0 16px; font-size:14.5px; font-weight:600; }
  .ke-quiz-toast{ cursor:pointer; }
  .ke-picker-card{ max-width:380px; }
  .ke-picker-row{ display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }
  .ke-picker-btn{ display:flex; flex-direction:column; align-items:center; gap:8px; width:140px; padding:18px 10px !important; border-radius:18px !important; background:#fff !important; border:2px solid var(--ke-border) !important; box-shadow:none !important; top:0 !important; font-size:13.5px !important; font-weight:800 !important; color:var(--ke-ink) !important; }
  .ke-picker-btn:active{ background:#F5F0DF !important; }
  .ke-picker-emoji{ font-size:40px; }
  .ke-puzzle-game{ position:absolute; inset:0; z-index:100; background:#243b55; border-radius:inherit; overflow:hidden; display:flex; flex-direction:column; }
  .ke-puzzle-hud{ display:flex; align-items:center; justify-content:space-between; padding:calc(10px + env(safe-area-inset-top, 0px)) calc(14px + env(safe-area-inset-right, 0px)) 10px calc(14px + env(safe-area-inset-left, 0px)); z-index:2; }
  .ke-puzzle-moves{ background:rgba(0,0,0,.35); color:#FFD75A; font-weight:800; padding:6px 14px; border-radius:999px; font-size:14px; }
  .ke-puzzle-board-wrap{ flex:1; display:flex; align-items:center; justify-content:center; padding:16px; min-height:0; }
  .ke-puzzle-board{ position:relative; border-radius:12px; overflow:hidden; box-shadow:none; border:3px solid rgba(255,255,255,.4); background:rgba(0,0,0,.25); }
  .ke-puzzle-tile{ position:absolute !important; display:block !important; top:0 !important; left:0 !important; margin:0; background-repeat:no-repeat; border:1px solid rgba(0,0,0,.35); box-shadow:none !important; padding:0 !important; border-radius:0 !important; transition:transform .16s ease; cursor:pointer; }
  .ke-puzzle-tile:active{ filter:brightness(1.08); }
  @keyframes ke-chip-pulse{ 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.06); } }
  .ke-game-chip-pulse{ animation:ke-chip-pulse 1.1s ease-in-out infinite; background:rgba(255,215,90,.22) !important; border-color:var(--kb-discover) !important; }
  .ke-bonus-quiz{ position:absolute; inset:0; z-index:150; background:rgba(10,20,30,.78); display:flex; align-items:center; justify-content:center; padding:20px; opacity:0; transition:opacity .25s ease; border-radius:inherit; }
  .ke-bonus-quiz.ke-show{ opacity:1; }
  .ke-bonus-card{ background:#F5F0DF; color:var(--ke-ink); border-radius:22px; padding:22px; text-align:center; max-width:360px; width:100%; }
  .ke-bonus-progress{ font-size:12.5px; font-weight:800; color:#8a7a55; text-transform:uppercase; letter-spacing:.04em; margin-bottom:10px; }
  .ke-bonus-loading{ font-size:36px; animation:ke-bob 1.2s ease-in-out infinite; }
  .ke-bonus-icon{ display:flex; justify-content:center; margin-bottom:8px; }
  .ke-bonus-icon .ke-icon-hex{ width:84px; height:84px; }
  .ke-bonus-word{ font-family:'Fredoka','Baloo 2',sans-serif; font-size:24px; font-weight:600; margin-bottom:14px; }
  .ke-bonus-choices{ display:flex; flex-direction:column; gap:10px; }
  .ke-bonus-choice{ font-size:15px !important; font-weight:700 !important; padding:12px !important; border-radius:14px !important; background:#fff !important; border:2px solid var(--ke-border) !important; box-shadow:none !important; top:0 !important; }
  .ke-bonus-choice.ke-bonus-right{ background:#EFFCE5 !important; border-color:var(--kb-correct,#4CAF50) !important; }
  .ke-bonus-choice.ke-bonus-wrong{ background:#FFEDED !important; border-color:#E5484D !important; opacity:.7; }
  .ke-bonus-card p{ font-size:14.5px; font-weight:700; margin:0 0 14px; }
  .ke-profile-chip .ke-avatar-mini{ position:relative; width:34px; height:34px; flex:none; }
  .ke-avatar-mini img.ke-av-body{ width:100%; height:100%; object-fit:cover; object-position:50% 12%; border-radius:50%; background:rgba(255,255,255,.15); }
  .ke-profile-screen{ max-width:640px; margin:0 auto; text-align:center; position:relative; z-index:1; }
  .ke-avatar-stage{ position:relative; width:min(170px,24vh); margin:30px auto 4px; }
  .ke-avatar-stage img.ke-av-body{ display:block; width:100%; height:auto; }
  .ke-avatar-stage .ke-mascot-hat{ animation:none; }
  .ke-pick-row{ display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin:6px 0 10px; }
  .ke-pick{ min-width:52px; min-height:44px; padding:6px 10px !important; border-radius:14px !important; font-size:13px !important; position:relative; }
  .ke-pick.ke-sel{ outline:3px solid #FFD84D; outline-offset:2px; }
  .ke-pick.ke-lock{ opacity:.55; }
  .ke-pick .ke-sw{ display:inline-block; width:22px; height:22px; border-radius:50%; border:2px solid rgba(255,255,255,.8); vertical-align:middle; }
  .ke-profile-name{ font-family:inherit; font-size:18px; font-weight:800; text-align:center; padding:8px 12px; border-radius:12px; border:2px dashed var(--kb-chalk-dim, #ccc); background:rgba(255,255,255,.08); color:var(--kb-chalk, #fff); width:min(240px,80%); }
  .ke-pl-label{ font-size:12px; font-weight:800; color:var(--kb-chalk-dim, #ccc); margin-top:6px; }
.ke-shell .ke-landing-header .ke-subtitle{ font-size:16px !important; margin-bottom:12px; }
  /* Maskotun arkasinda hicbir eklenti arka plan/oval/spot isigi yok -
     PNG'nin kendi seffafligi dogrudan sahnenin (tahta) zeminini
     gosteriyor ("neden oval arka plan kullaniyorsun" geri bildirimi). */
  .ke-landing-mascot{ isolation:isolate; }
  .ke-landing-mascot img, .ke-avatar-stage img.ke-av-body{ position:relative; z-index:1; }
  .ke-landing-header{ padding-right:80px; }
  @media (max-width:480px){
    .ke-landing-mascot{ display:none; }
    .ke-landing-header{ padding-right:0; }
  }
  /* "hiç kaydırma olmamalı" - tek ekrana sığdırma bütçesinin bir
     parçası: harita özeti zaten "Bölüm X/9" gösterdiği için alt başlık
     aynı sayıyı tekrarlıyor, küçültülüp sıkıştırıldı (tamamen
     kaldırılmadı - "— Kelime Keşfi" gibi faz adı hâlâ tek buradan
     okunuyor). Başlık ve harita-özeti boşlukları da aynı bütçe için
     daraltıldı. isNarrowLayout() ile aynı 640px eşiği. */
  @media (max-width:640px){
    .ke-subtitle{ font-size:11px; margin:0 0 6px; }
    .ke-map-details{ margin-bottom:6px; }
    .ke-map-summary{ padding:4px 12px; font-size:12px; }
    .ke-title{ margin-bottom:4px; }
    .ke-scene-narrow .ke-mascot-wrap{ width:52px; }
  }
  /* "Yine kaydırma sorunu var, resimleri küçültelim" geri bildirimi:
     quiz/konuşma/cümle panelleri sahnenin İÇİNDE mutlak konumlu ve
     sahne yüksekliği keşif ızgarasına göre belirlendiği için panel
     kendi içinde kayıyordu (hatta üstteki balon kırpılıyordu). Dar
     ekranda panel artık normal akışta (sahne ona göre büyüyor), keşif
     ızgarası + maskot panel açıkken gizleniyor, quiz kartları ekran
     YÜKSEKLİĞİNE göre ölçekleniyor (34vh) - hiçbir telefonda taşmıyor.
     Özgüllük bilerek yüksek (.ke-shell .ke-scene.ke-scene-narrow):
     tam ekran kuralları (.ke-shell.ke-fs ...) aksi halde ezerdi. */
  .ke-shell .ke-scene.ke-scene-narrow:has(.ke-quiz.ke-show, .ke-speak.ke-show, .ke-sentence.ke-show) #keObjects{ display:none; }
  .ke-shell .ke-scene.ke-scene-narrow:has(.ke-quiz.ke-show, .ke-speak.ke-show, .ke-sentence.ke-show) .ke-mascot-wrap{ display:none; }
  .ke-shell .ke-scene.ke-scene-narrow .ke-quiz,
  .ke-shell .ke-scene.ke-scene-narrow .ke-speak,
  .ke-shell .ke-scene.ke-scene-narrow .ke-sentence{
    position:relative; top:auto; left:auto; right:auto; bottom:auto; overflow:visible;
    max-width:none; margin:0; padding:30px 12px 12px; gap:8px; border-width:4px; border-radius:18px;
  }
  /* Eski .ke-mascot-narrow kuralı (top:14px; right:14px; width:90px) aynı
     özgüllükte ve daha sonra tanımlı olduğu için maskotu sağ ÜST köşeye
     (rozet/balonun üstüne) çekiyordu - burada sağ alta sabitleniyor. */
  .ke-shell .ke-scene.ke-scene-narrow .ke-mascot-wrap{
    position:absolute; top:auto; left:auto; right:8px; bottom:6px; width:52px; margin:0; transform:none; z-index:1;
  }
  .ke-shell .ke-scene.ke-scene-narrow .ke-quiz .ke-bubble,
  .ke-shell .ke-scene.ke-scene-narrow .ke-speak .ke-bubble,
  .ke-shell .ke-scene.ke-scene-narrow .ke-sentence .ke-bubble{ max-width:100%; font-size:11.5px; padding:6px 12px; }
  @media (max-width:640px){
    .ke-shell:has(.ke-quiz.ke-show, .ke-speak.ke-show, .ke-sentence.ke-show) .ke-footer-row{ display:none; }
  }
  .ke-shell .ke-scene.ke-scene-narrow .ke-quiz-cards{ max-width:min(400px, 44vh); gap:12px; }
  .ke-shell .ke-scene.ke-scene-narrow .ke-quiz-card{ padding:6px; border-width:3px; border-radius:16px; }
  .ke-shell .ke-scene.ke-scene-narrow .ke-quiz-word{ font-size:22px; }
  .ke-shell .ke-scene.ke-scene-narrow .ke-speak-card{ padding:10px 20px; }
  .ke-shell .ke-scene.ke-scene-narrow .ke-speak-card .ke-icon-hex{ width:min(120px, 16vh); height:min(120px, 16vh); }
  .ke-shell .ke-scene.ke-scene-narrow .ke-sentence-icon .ke-icon-hex{ width:70px; height:70px; }
  .ke-shell .ke-scene.ke-scene-narrow{ min-height:min(60vh,620px); display:flex; flex-direction:column; justify-content:center; }
  .ke-shell .ke-scene.ke-scene-narrow #keObjects{ padding:66px 6px 74px; align-content:center; gap:14px 6px; grid-template-columns:repeat(3, minmax(0,1fr)); }
  .ke-shell .ke-scene.ke-scene-narrow .ke-obj{ width:100%; display:flex; justify-content:center; }
  .ke-shell .ke-scene.ke-scene-narrow .ke-obj .ke-icon-hex{ width:100%; height:auto; aspect-ratio:1/1; max-width:min(128px,19vh); }
  .ke-shell.ke-fs .ke-screen-host:has(.ke-scene-narrow){ display:flex; flex-direction:column; flex:1 1 auto; min-height:0; }
  .ke-shell.ke-fs .ke-scene-wrap:has(.ke-scene-narrow){ flex:1 1 auto; display:flex; flex-direction:column; min-height:0; }
  .ke-shell.ke-fs .ke-scene.ke-scene-narrow{ flex:1 1 auto; }
  .ke-shell .ke-scene.ke-scene-narrow #keObjects{ align-content:space-evenly; }
  @media (max-width:640px) and (orientation:portrait){
    .ke-shell .ke-scene.ke-scene-narrow #keObjects{ grid-template-columns:repeat(2, minmax(0,1fr)); padding:70px 6px 56px; gap:10px 6px; }
    .ke-shell .ke-scene.ke-scene-narrow .ke-obj .ke-icon-hex{ max-width:min(190px, calc((100vh - 335px) / 3)); }
    .ke-shell.ke-fs{ padding:10px 10px; }
    .ke-shell .ke-scene.ke-scene-narrow .ke-quiz.ke-show,
    .ke-shell .ke-scene.ke-scene-narrow .ke-speak.ke-show,
    .ke-shell .ke-scene.ke-scene-narrow .ke-sentence.ke-show{ flex:1 1 auto; min-height:0; padding:12px 8px 8px; gap:6px; }
    .ke-shell .ke-scene.ke-scene-narrow .ke-quiz .ke-quiz-cards{ flex:1 1 0; min-height:0; max-width:none; width:100%; grid-template-rows:repeat(2, minmax(0,1fr)); gap:8px; }
    .ke-shell .ke-scene.ke-scene-narrow .ke-quiz .ke-quiz-card{ aspect-ratio:auto; height:100%; min-height:0; min-width:0; }
    .ke-shell .ke-scene.ke-scene-narrow .ke-quiz .ke-quiz-card .ke-icon-hex{ width:min(100cqw,100cqh); height:min(100cqw,100cqh); max-width:none; flex:none; }
    .ke-shell .ke-scene.ke-scene-narrow .ke-quiz .ke-bubble,
    .ke-shell .ke-scene.ke-scene-narrow .ke-speak .ke-bubble,
    .ke-shell .ke-scene.ke-scene-narrow .ke-sentence .ke-bubble{ font-size:12px; padding:5px 10px; line-height:1.25; }
    .ke-shell .ke-scene.ke-scene-narrow .ke-quiz-word{ font-size:26px; }
    .ke-shell .ke-scene.ke-scene-narrow .ke-sentence-icon .ke-icon-hex{ width:min(34vw,18vh,150px); height:min(34vw,18vh,150px); }
    .ke-shell .ke-scene.ke-scene-narrow .ke-sentence.ke-show, .ke-shell .ke-scene.ke-scene-narrow .ke-speak.ke-show{ justify-content:space-evenly; }
    .ke-shell .ke-scene.ke-scene-narrow .ke-sentence-icon .ke-icon-hex{ width:min(38vw,20vh,170px); height:min(38vw,20vh,170px); }
    .ke-shell .ke-scene.ke-scene-narrow .ke-sentence-slots{ gap:10px; }
    .ke-shell .ke-scene.ke-scene-narrow .ke-sentence-bank{ gap:12px; }
    .ke-shell .ke-scene.ke-scene-narrow .ke-tile{ font-size:24px; padding:16px 20px; }
    .ke-shell .ke-scene.ke-scene-narrow .ke-slot{ height:56px; font-size:24px; min-width:52px; }
    .ke-shell .ke-scene.ke-scene-narrow .ke-speak-card .ke-icon-hex{ width:min(60vw,30vh,240px); height:min(60vw,30vh,240px); }
  }
  .ke-shell .ke-scene.ke-scene-narrow .ke-bubble{ font-size:13px; max-width:56%; }
  .ke-shell .ke-scene.ke-scene-narrow .ke-sentence-icon .ke-icon-hex{ width:min(26vw,15vh,110px); height:min(26vw,15vh,110px); }
  /* minmax(230px,1fr) sabit 230px alt sınırı, konteyner 230px'ten dar
     olduğunda (küçük telefon / APK dar görünüm) kartın konteynerden
     TAŞMASINA yol açıyordu — .ke-shell'in overflow-x:hidden'ı bu
     taşmayı sessizce kırpıp kart metninin sağ kenarını (ör. "50 kelime
     · 9 bölüm" son harfi) görünmez yapıyordu. min(230px,100%) alt
     sınırı konteynerin kendisiyle sınırlıyor, her zaman sığıyor. */
  .ke-category-grid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(min(230px,100%), 1fr)); gap:16px; max-width:980px; margin:0 auto; position:relative; z-index:1; }
  /* Soluk pastel kart yerine TAM DOYGUN renkli kart — "tamamen çizgi
     film konsepti, hiçbir şey soluk olmasın" geri bildirimi üzerine
     (referans: Minika Çocuk gibi doygun renkli çocuk siteleri). Kartın
     kendisi artık kategori renginin canlı degradesi; metin beyaz.
     TAM TEBEŞİR (v3) DENEMESİ GERİ ALINDI: kartlarda Rock Salt +
     kesikli kenarlık denendi ama "çocuklar için okunaksız oldu" geri
     bildirimi üzerine ESKİ Fredoka/düz-kenarlık/duolingo-gölge haline
     döndürüldü — tebeşir denemesi artık sadece BAŞLIKTA (bkz. .ke-title,
     Fredericka the Great). Kartlar okunaklı kalsın, tahta hissi zemin +
     başlıktan geliyor. */
  .ke-category-card{
    background: var(--cc-c);
    border:3px solid rgba(255,255,255,.55); border-radius:22px;
    padding:16px; text-align:left; cursor:pointer; display:flex; align-items:center; gap:14px;
    transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;
    box-shadow:none;
    position:relative; overflow:hidden;
  }
  .ke-category-card::after{
    content: attr(data-initial); position:absolute; right:-6px; bottom:-34px;
    font-family:'Fredoka','Baloo 2',sans-serif; font-weight:700;
    font-size:96px; line-height:1; color:#fff; opacity:0; pointer-events:none;
  }
  .ke-category-card:hover{ transform:translateY(-2px); }
  .ke-category-card:active{ transform:translateY(1px); }
  .ke-category-icon{
    width:60px; height:60px; border-radius:30% 70% 65% 35% / 45% 40% 60% 55%;
    flex-shrink:0; display:flex; align-items:center; justify-content:center;
    font-family:'Fredoka','Baloo 2',sans-serif; font-size:28px; font-weight:700;
    background:#ffffff; box-shadow:none; position:relative; z-index:1;
  }
  .ke-category-text{ min-width:0; flex:1; position:relative; z-index:1; }
  .ke-category-title{
    font-family:'Fredoka','Baloo 2',sans-serif; font-weight:700; font-size:19px; color:#fff;
    margin-bottom:3px; white-space:normal; overflow-wrap:break-word; line-height:1.2;
  }
  /* Açık kategori tonlarında (ör. daily_life'ın sarı tint'i) beyaz metin
     tek başına düşük kontrastta kalıyordu — koyu bir gölge ekleyip
     zemin renginden bağımsız okunaklı hale getiriyoruz. */
  /* white-space:normal gerekli — .ke-category-card bir <button> ve
     tarayıcının varsayılan buton stili beyaz-boşluğu nowrap yapıyor;
     override edilmezse dar kartlarda (mobil/APK) metin sarmıyor,
     konteynerden taşıp sağdan kırpılıyor (bkz. .ke-shell overflow-x). */
  .ke-category-meta{ font-size:14.5px; color:#fff; font-weight:700; white-space:normal; }
  .ke-cat-next-ep{ font-size:13.5px; color:#fff; font-weight:700; margin-top:2px; white-space:normal; }
  /* Kategori ikonu (baş harf) köşesine iliştirilmiş küçük konu rozeti —
     kartın kendisine değil ikona bağlı, böylece sağ üstteki tekrar
     çipiyle veya köşedeki dev baş harf deseniyle çakışmıyor. */
  .ke-cat-motif-badge{
    position:absolute; right:-6px; bottom:-6px; z-index:2;
    width:22px; height:22px; border-radius:50%; background:#fff;
    display:flex; align-items:center; justify-content:center; font-size:12px;
    box-shadow:none;
  }
  .ke-cat-progress-track{ margin-top:6px; height:6px; border-radius:999px; background:rgba(0,0,0,.2); overflow:hidden; }
  .ke-cat-progress-fill{ height:100%; background:#fff; border-radius:999px; }
  /* Kategori kartı zaten bir <button> — içine ikinci bir <button>
     koymak geçersiz HTML olurdu (tarayıcı iç içe düğmeleri sessizce
     bozar), bu yüzden bu bir <div role="button"> — kendi stilini
     .ke-shell button taban kuralından bağımsız taşıyor. */
  .ke-review-chip{
    position:absolute; top:10px; right:10px; z-index:2; cursor:pointer;
    font-family:'Fredoka','Baloo 2','Nunito',sans-serif;
    background:var(--ke-purple); color:#fff;
    font-size:11.5px; font-weight:800; padding:6px 11px; line-height:1.3;
    border-radius:999px; box-shadow:none;
    transition: top .08s ease, box-shadow .08s ease;
  }
  .ke-review-chip:active{ top:13px; box-shadow:none; }

  /* Eskiden burada "WELCOME panosu" tarzı renkli eğik bayrakçık başlık
     vardı (.ke-banner/.ke-flag) — parlak/candy-app hissi verip tebeşir
     temasıyla çelişiyordu ("hiç chalk havası yok" geri bildirimi
     üzerine kaldırıldı). Landing sayfası artık .ke-title ile AYNI
     tebeşir-konturlu başlığı kullanıyor (bkz. showCategoryGrid). */

  /* "Hareketi anlamlı geri bildirim için sakla" — sürekli/ambient
     animasyonlar (yüzen nesneler, maskot sallanması, nabız gibi atan
     mikrofon) prefers-reduced-motion isteyen kullanıcılar için
     kapatılıyor; doğru cevap zıplaması gibi TEK SEFERLİK geri bildirim
     animasyonları (ke-mascot-jump, ke-pop, ke-shake-x) kısa olduğundan
     ve gerçek bilgi taşıdığından kalıyor. TAM TEBEŞİR (v2): kapsam tek
     tek selector listelemek yerine TÜM .ke-shell alt ağacına genişletildi
     — daha sağlam, yeni eklenen hiçbir animasyon bu korumanın dışında
     kalmıyor. */
  @media (prefers-reduced-motion: reduce) {
    .ke-shell *,
    .ke-shell *::before,
    .ke-shell *::after {
      animation-duration: .01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: .01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* Klavye odağı: koyu tahta zemini, sahnenin canlı kategori rengi ve
     beyaz kartlar gibi çok farklı zeminlerin HEPSİNDE görünen tek bir
     odak halkası — açık mavi tebeşir iç çizgi + koyu dış halka, hangi
     zeminde olursa olsun kontrast sağlıyor. Sadece klavye/gerçek
     odaklanmada görünür (:focus-visible), fare tıklamasında görünmez. */
  .ke-shell button:focus-visible,
  .ke-category-card:focus-visible,
  .ke-review-chip:focus-visible,
  .ke-tile:focus-visible,
  .ke-quiz-card:focus-visible,
  .ke-map .ke-dot:focus-visible{
    outline: 3px solid var(--kb-action);
    outline-offset: 2px;
    box-shadow:none;
  }
</style>`;

// "WELCOME" panosundaki gibi her kelimeyi ayrı renkli/eğik bir
// bayrakçığa koyan başlık şeridi — sadece iniş (kategori seçim)
// ekranında kullanılıyor; bölüm içi başlıklar .ke-title'ın kalın
// kontur/3D "kabarcık" harf efektini kullanıyor (bkz. STYLE).
function bannerHTML(text) {
  return `<div class="ke-banner">${text.split(' ').map(w => `<span class="ke-flag">${w}</span>`).join('')}</div>`;
}

// .ke-title'ın kabarcık/kontur efektini korurken her kelimeyi ayrı
// renklendiren yardımcı (bkz. .ke-title .ke-tword:nth-child kuralları).
function bubbleTitleHTML(text) {
  return text.split(' ').map(w => `<span class="ke-tword">${w}</span>`).join(' ');
}

// Kullanıcının paylaştığı özel 3B render karakterle değiştirildi (bkz.
// scripts/process_mascot_images.py — arka planı şeffaflaştırılmış PNG'ler
// ui/mascot/ altında). Eski elle çizilmiş SVG'nin "konuşurken ağzını
// aç/kapat" detayı statik bir görselde birebir korunamıyor — zıplama/
// sallanma animasyonları (CSS, ke-bob/ke-celebrate) img üzerinde de
// aynen çalışıyor, sadece ağız animasyonu kaldırıldı.
const LANG_KEY = 'ke_lang';
let _lang = 'en';
try { _lang = window.localStorage.getItem(LANG_KEY) === 'tr' ? 'tr' : 'en'; } catch (e) { /* yok say */ }
function L(tr, en) { return _lang === 'tr' ? tr : en; }
function setLang(l) { _lang = l === 'tr' ? 'tr' : 'en'; try { window.localStorage.setItem(LANG_KEY, _lang); } catch (e) { /* yok say */ } }
function catLabel(c) {
  const parts = c.title.split('–');
  return _lang === 'tr' && parts[1] ? parts[1].trim() : parts[0].trim();
}
function rewardLabel(t) { return _lang === 'tr' ? t : String(t).replace(/ Yıldızı Kazandın!$/, ' Star Earned!').replace('Tekrar Şampiyonu!', 'Review Champion!'); }

const AVATAR_ANCHORS = {"idle": {"x": 0.4521, "y": 0.2078, "w": 0.5858}, "wave": {"x": 0.5, "y": 0.2302, "w": 0.585}, "think": {"x": 0.4531, "y": 0.2015, "w": 0.5516}, "wink": {"x": 0.4751, "y": 0.224, "w": 0.5722}, "point": {"x": 0.5556, "y": 0.2447, "w": 0.5222}, "read": {"x": 0.4765, "y": 0.3211, "w": 0.5962}, "write": {"x": 0.5351, "y": 0.3379, "w": 0.6}, "kick": {"x": 0.4912, "y": 0.2424, "w": 0.5628}, "celebrate": {"x": 0.4561, "y": 0.0842, "w": 0.5444}};
const avatarColors = () => [
  { id: 'yellow', label: L('Sarı', 'Yellow'), need: 0, swatch: '#FFC800' },
  { id: 'blue', label: L('Mavi', 'Blue'), need: 2, swatch: '#3B8BEB' },
  { id: 'green', label: L('Yeşil', 'Green'), need: 4, swatch: '#3ED04A' },
  { id: 'pink', label: L('Pembe', 'Pink'), need: 0, needStreak: 3, swatch: '#E63AA0' },
  { id: 'purple', label: L('Mor', 'Purple'), need: 12, swatch: '#8A3FE0' },
];
const avatarHats = () => [
  { id: 'none', label: L('Yok', 'None'), need: 0, emoji: '🚫' },
  { id: 'cap', label: L('Kep', 'Cap'), need: 1, emoji: '🧢' },
  { id: 'party', label: L('Parti', 'Party'), need: 3, emoji: '🎉' },
  { id: 'crown', label: L('Taç', 'Crown'), need: 0, needStreak: 5, emoji: '👑' },
  { id: 'wizard', label: L('Büyücü', 'Wizard'), need: 10, emoji: '🧙' },
];

// localStorage tarayicidan/devtools'tan elle degistirilebilir ya da
// bozulabilir - guvenilmeyen girdi sayiyoruz. Profil listesini OKUMA
// noktasinda (once _load burada) sanitize ediyoruz ki asagidaki her
// fonksiyon (all/active/save/remove...) zaten temiz veriyle calissin;
// tek bir yerde yalnizca active() icin temizlemek, all()'un dondurdugu
// diger profillerin (ornegin profil degistirici listesindeki data-profile
// attribute'una) ham/kacissiz gitmesine yol aciyordu.
function _sanitizeProfile(p) {
  p = p || {};
  return {
    id: String(p.id || 'p1').replace(/[^a-z0-9]/gi, '').slice(0, 12) || 'p1',
    name: String(p.name || '').slice(0, 12),
    color: ['yellow', 'blue', 'green', 'pink', 'purple'].includes(p.color) ? p.color : 'yellow',
    hat: ['none', 'cap', 'party', 'crown', 'wizard'].includes(p.hat) ? p.hat : 'none',
  };
}
const Profiles = {
  _load() {
    try {
      const raw = JSON.parse(window.localStorage.getItem(PROFILES_KEY));
      if (!raw || !Array.isArray(raw.list) || !raw.list.length) return null;
      const seen = new Set();
      const list = [];
      for (const p of raw.list) {
        const clean = _sanitizeProfile(p);
        if (seen.has(clean.id)) continue;
        seen.add(clean.id);
        list.push(clean);
      }
      if (!list.length) return null;
      const active = list.some((p) => p.id === raw.active) ? raw.active : list[0].id;
      return { active, list };
    } catch (e) { /* yok say */ }
    return null;
  },
  _save(d) { try { window.localStorage.setItem(PROFILES_KEY, JSON.stringify(d)); } catch (e) { /* yok say */ } idbPut(PROFILES_KEY, d); },
  exists() { return !!this._load(); },
  all() { const d = this._load(); return d ? d.list : []; },
  active() {
    const d = this._load();
    if (!d) return { id: 'p1', name: '', color: 'yellow', hat: 'none' };
    return d.list.find((x) => x.id === d.active) || d.list[0];
  },
  save(profile) {
    const d = this._load() || { active: profile.id, list: [] };
    const i = d.list.findIndex((p) => p.id === profile.id);
    if (i >= 0) d.list[i] = profile; else d.list.push(profile);
    d.active = profile.id;
    this._save(d);
  },
  setActive(id) { const d = this._load(); if (d) { d.active = id; this._save(d); } },
  newId() {
    const ids = new Set(this.all().map((p) => p.id));
    let n = 1; while (ids.has('p' + n)) n++;
    return 'p' + n;
  },
  remove(id) {
    const d = this._load(); if (!d || d.list.length < 2) return;
    d.list = d.list.filter((p) => p.id !== id);
    if (d.active === id) d.active = d.list[0].id;
    this._save(d);
    try { window.localStorage.removeItem(id === 'p1' ? PROGRESS_KEY : PROGRESS_KEY + '_' + id); } catch (e) { /* yok say */ }
  },
};

// Kullanici geri bildirimi: diger pozlarin kaynak gorseli (idle disinda)
// amator/kenar-hatali duruyordu - tutarlilik icin TUM maskot gorunumleri
// (poz farki fark etmeksizin) artik ayni temiz "idle" render'ini kullaniyor.
function avatarBodySrc(pose, color) {
  const rel = (!color || color === 'yellow') ? `mascot/mascot_idle.png` : `mascot/avatar/idle_${color}.png`;
  return new URL(rel, ASSET_BASE_URL).href;
}
function avatarHatStyle(pose) {
  const a = AVATAR_ANCHORS.idle;
  return `left:${((a.x - a.w / 2) * 100).toFixed(2)}%;width:${(a.w * 100).toFixed(2)}%;bottom:${((1 - a.y) * 100).toFixed(2)}%`;
}
function avatarHatHTML(pose, profile) {
  const p = profile || Profiles.active();
  if (!p.hat || p.hat === 'none') return '';
  const src = new URL(`mascot/avatar/hat_${p.hat}.png`, ASSET_BASE_URL).href;
  return `<img class="ke-mascot-hat" src="${src}" alt="" draggable="false" style="${avatarHatStyle(pose)}" />`;
}

function mascotSvg() {
  const p = Profiles.active();
  return `<img class="ke-mascot-img" src="${avatarBodySrc('idle', p.color)}" alt="Aktapokus" draggable="false" />${avatarHatHTML('idle', p)}`;
}

function avatarLandingHTML(pose) {
  const p = Profiles.active();
  return `<div class="ke-landing-mascot"><img src="${avatarBodySrc(pose, p.color)}" alt="Aktapokus" draggable="false" />${avatarHatHTML(pose, p)}</div>`;
}

// Kullanıcı geri bildirimi: "diğer Aktapokus görsellerini hiç
// kullanmamışsın" — poz seti (wave/point/think/wink/read/write/kick)
// anlamlı anlarda kullanılıyor; renk/şapka seçimi profilden geliyor.
function setMascotPose(host, poseName) {
  const img = host.querySelector('.ke-mascot-img');
  if (!img) return;
  const p = Profiles.active();
  img.src = avatarBodySrc(poseName, p.color);
  const hat = img.parentElement.querySelector('.ke-mascot-hat');
  if (hat) hat.setAttribute('style', avatarHatStyle(poseName));
}

// Görsel katman oyun mantığından bilerek ayrı: emoji varsa onu
// gösteriyoruz. Emoji bulunamayan (soyut) kelimelerde tek harf bir
// çocuğa hiçbir şey anlatmıyordu — onun yerine Türkçe çeviriyi yazıyoruz,
// en azından anlamı biliniyor olsun. İleride bunu gerçek
// illüstrasyonlarla değiştirmek sadece bu fonksiyonu değiştirmeyi
// gerektirir — episode verisi, quiz/speak mantığı hiç etkilenmez.
// icons/ klasörü panel.js ile aynı ui/ dizininde yaşıyor (bkz.
// scripts/fetch_icons.py) — core'un zaten var olan statik ui/ mount
// mekanizması bunu otomatik servis ediyor, backend'e hiç dokunmadan.
// import.meta.url ile göreli çözüyoruz (ASSET_BASE_URL, dosyanın başında
// tanımlı), toolId'yi ayrıca taşımaya gerek kalmıyor.

// Emoji/fotoğraf/SVG/harf rozeti — hangisi olursa olsun TEK bir "arı
// peteği" (altıgen) kalıbına oturuyor. Dış beyaz altıgen bir çerçeve,
// iç renkli altıgen asıl içeriği taşıyor. Bu, aynı sahnede bazı
// kelimelerin fotoğraf bazılarının ikon olmasından doğan "tutarsız,
// soğuk" görünümü çözüyor: hepsi aynı oyuncaklı çerçevede, büyütülmüş
// boyutta ("belirsiz/küçük" geri bildirimi üzerine).
function renderObjectIcon(obj) {
  const hue = (obj.word.charCodeAt(0) * 47) % CATEGORY_COLORS.length;
  const chipColor = CATEGORY_COLORS[hue];

  let inner;
  if (obj.icon_type === 'photo') {
    const src = new URL(obj.icon, ASSET_BASE_URL).href;
    inner = `<div class="ke-icon-hex-inner ke-chip-photo" style="background:${chipColor}"><img class="ke-photo-img" src="${src}" alt="${obj.word}" loading="lazy" /></div>`;
  } else if (obj.icon_type === 'svg') {
    const src = new URL(obj.icon, ASSET_BASE_URL).href;
    inner = `<div class="ke-icon-hex-inner" style="background:${chipColor}"><img class="ke-icon-img" src="${src}" alt="${obj.word}" loading="lazy" /></div>`;
  } else if (obj.icon_type === 'emoji') {
    inner = `<div class="ke-icon-hex-inner" style="background:${chipColor}"><div class="ke-emoji-icon">${obj.icon}</div></div>`;
  } else {
    inner = `<div class="ke-icon-hex-inner" style="background:${chipColor}"><div class="ke-letter-badge-text">${obj.tr}</div></div>`;
  }
  return `<div class="ke-icon-hex">${inner}</div>`;
}

let _speechTimer = null;
let _fullscreenChangeHandler = null;
let _narrowMQ = null;
let _narrowChangeHandler = null;

// Donanim/tarayici GERI tusu: gercek bir router yok (tek sayfa, hic URL
// degismiyor), bu yuzden geri tusunun donecek bir history kaydi hic
// olmuyordu ve TWA/Chrome dogrudan uygulamayi kapatiyordu. Cozum: her
// "ileri" ekran gecisinde sahte bir history girdisi push ediyoruz ve
// GERI tusu o girdiyi tuketince (popstate) _backHandler'i cagiriyoruz —
// _backHandler tam olarak ekrandaki gorunur "Geri" dugmesinin yaptigini
// yapiyor. Ana menude (ilk ekran) hic push edilmiyor, o yuzden oradan
// geri basmak normal sekilde uygulamadan cikariyor.
let _backHandler = null;
let _popstateHandler = null;
function pushBackState(handler) {
  _backHandler = handler;
  try { history.pushState({ keNav: true }, ''); } catch (e) { /* no-op */ }
}

// Geniş ekranda maskot etrafındaki dairesel keşif dizilimi korunuyor;
// dar ekranda (telefon) nesneler çakışmasın, rahat dokunulsun diye
// CSS grid'e geçiyoruz (bkz. .ke-scene-narrow kuralları). Eşik, mevcut
// `@media(max-width:520px)` küçültme kuralından biraz geniş tutuldu —
// tablet dikey/küçük pencere gibi ara genişliklerde de daireden önce
// grid'e geçmek için.
function isNarrowLayout() {
  return window.matchMedia('(max-width: 640px)').matches;
}

// Ekran/soru geçişlerinde yanlışlıkla ikinci dokunuşun yeni ekrandaki
// düğmeye gitmesini engelle: geçiş algılanınca kısa süre girişleri yut.
const GUARD_MS = 350;
let _guardUntil = 0;
let _guardObserver = null;
function installTransitionGuard(container) {
  const swallow = (e) => {
    if (performance.now() < _guardUntil) { e.stopPropagation(); e.preventDefault(); }
  };
  ['pointerdown', 'click'].forEach((t) => container.addEventListener(t, swallow, true));
  const fresh = (n) => n.nodeType === 1 && (n.matches('.ke-quiz-card, .ke-category-card, .ke-profile-screen, .ke-landing-header, .ke-carnival-hero, .ke-shell-inner') || n.querySelector('.ke-quiz-card, .ke-category-card, .ke-profile-screen, .ke-landing-header, .ke-carnival-hero'));
  if (_guardObserver) _guardObserver.disconnect();
  _guardObserver = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'attributes') {
        const t = m.target;
        if (t.matches && t.matches('.ke-quiz, .ke-speak, .ke-sentence, #keCelebration')) { _guardUntil = performance.now() + GUARD_MS; return; }
      } else if ([...m.addedNodes].some(fresh)) { _guardUntil = performance.now() + GUARD_MS; return; }
    }
  });
  _guardObserver.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
}

export async function mount(container, api, toolId) {
  await hydrateFromIDB();
  startTimeTracking();
  startContinuousStudyTracking((newQuizzes) => {
    refreshGameBadge(container);
    showQuizUnlockToast(container, () => {
      showBonusQuiz(container, api, toolId, categories, () => refreshGameBadge(container));
    });
  });
  container.innerHTML = STYLE + `
    <div class="ke-shell notranslate" translate="no">
      <button class="ke-fullscreen-btn" id="keFullscreenBtn" title="${L('Tam ekran', 'Full screen')}" aria-label="${L('Tam ekran', 'Full screen')}">${ICON_EXPAND}<span id="keFullscreenLabel">${L('Tam Ekran', 'Full screen')}</span></button>
      <div class="ke-screen-host" id="keScreenHost"></div>
    </div>
  `;

  if (window.KE_STATIC) container.querySelector('.ke-shell').classList.add('ke-fs');
  installTransitionGuard(container);
  setupFullscreen(container);
  _backHandler = null;
  _popstateHandler = () => {
    if (_backHandler) { const h = _backHandler; _backHandler = null; h(); }
  };
  window.addEventListener('popstate', _popstateHandler);
  primeMicrophonePermission();

  let categories;
  try {
    const r = await api.apiFetch(`/api/tools/${toolId}/categories`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    categories = await r.json();
  } catch (e) {
    container.querySelector('#keScreenHost').innerHTML =
      `<div style="padding:40px;text-align:center;color:#FF4D4D;">${L('Kategoriler yüklenemedi', 'Could not load categories')}: ${e.message}</div>`;
    return;
  }

  if (Profiles.exists()) showSectionMenu(container, api, toolId, categories);
  else showProfileScreen(container, api, toolId, categories, { first: true });
}

// İlk sayfa: bölüm seçimi ("kelimeler, gramer, soru-cevap, get gibi
// bölümler seçmeli olmalı, ilk sayfada" geri bildirimi). Her bölüm,
// kategori listesinin bir alt kümesini gösteriyor; kategoriler veriden
// (episodes.json) geliyor, bölüm ataması burada. "Get" henüz içerik
// hazır olmadığı için kilitli/"yakında".
const GRAMMAR_CATEGORY_IDS = ['prepositions'];
const QA_CATEGORY_IDS = ['question_words'];
const GET_CATEGORY_IDS = ['get'];
const CONVERSATION_CATEGORY_IDS = [
  'conversations', 'conv_social_manners', 'conv_family_home', 'conv_daily_routine',
  'conv_school', 'conv_hobbies_sports', 'conv_animals_nature', 'conv_food_drinks',
  'conv_shopping_clothes', 'conv_weather_seasons', 'conv_city_transport', 'conv_travel',
  'conv_health', 'conv_celebrations', 'conv_feelings_preferences', 'conv_technology',
  'conv_space', 'conv_jobs_safety',
];
const OPPOSITE_CATEGORY_IDS = ['opposites'];
const A2_CATEGORY_SUFFIX = '_a2';
const SECTIONS = [
  { id: 'words', title: 'Words', sub: 'Themed word categories', subTr: 'Temalı kelime kategorileri', titleTr: 'Kelimeler', motif: '📚',
    theme: { c: '#FFA000', dark: '#DB8A00', tint: '#FFCF66' },
    pick: (c) => !GRAMMAR_CATEGORY_IDS.includes(c.id) && !QA_CATEGORY_IDS.includes(c.id) && !GET_CATEGORY_IDS.includes(c.id) && !CONVERSATION_CATEGORY_IDS.includes(c.id) && !OPPOSITE_CATEGORY_IDS.includes(c.id) && !c.id.endsWith(A2_CATEGORY_SUFFIX) },
  { id: 'grammar', title: 'Grammar', sub: 'Prepositions: in, on, at, under…', subTr: 'Edatlar: in, on, at, under…', titleTr: 'Gramer', motif: '🧩',
    theme: { c: '#00ACC1', dark: '#008BA0', tint: '#5DD6E6' },
    pick: (c) => GRAMMAR_CATEGORY_IDS.includes(c.id) },
  { id: 'qa', title: 'Questions', sub: 'Who, What, Where, When, Why, Which', subTr: 'Kim, Ne, Nerede, Ne zaman, Neden, Hangi', titleTr: 'Soru-Cevap', motif: '❓',
    theme: { c: '#FF7043', dark: '#E5562B', tint: '#FFA383' },
    pick: (c) => QA_CATEGORY_IDS.includes(c.id) },
  { id: 'opposites', title: 'Opposites', sub: 'Big/small, fast/slow, happy/sad…', subTr: 'Büyük/küçük, hızlı/yavaş, mutlu/üzgün…', titleTr: 'Zıt Anlamlılar', motif: '↔️',
    theme: { c: '#7E57C2', dark: '#6641A8', tint: '#B597E0' },
    pick: (c) => OPPOSITE_CATEGORY_IDS.includes(c.id) },
  { id: 'a2', title: 'A2 Level', sub: 'New words & sentences', subTr: 'Yeni kelimeler ve cümleler', titleTr: 'A2 Seviyesi', motif: '🚀',
    theme: { c: '#78909C', dark: '#5F7480', tint: '#A8BBC5' },
    // CEFR denetiminde A2 olarak isaretlenip A1'den tasinan kelimeler -
    // bkz. scripts/migrate_a2_from_audit.py. Su an 228/600 hedef kelime.
    pick: (c) => c.id.endsWith(A2_CATEGORY_SUFFIX) },
  { id: 'get', title: 'Get', sub: 'get up, get in, get on…', subTr: 'get up, get in, get on…', titleTr: 'Get', motif: '🔄',
    theme: { c: '#26A69A', dark: '#1C8079', tint: '#7FD4CB' },
    pick: (c) => GET_CATEGORY_IDS.includes(c.id) },
  { id: 'conversations', title: 'Conversations', sub: 'Social chats, school, travel, and more', subTr: 'Sosyal sohbet, okul, seyahat ve daha fazlası', titleTr: 'Konuşmalar', motif: '💬',
    theme: { c: '#EF6C9C', dark: '#D14F80', tint: '#F7A9C6' },
    // "conversation kisminda hepsi tek bir listede yer aliyor bunlari
    // ayirmak lazim" geri bildirimi - tek 'conversations' kategorisi
    // (94 bolum) 17 konu-bazli alt kategoriye bolundu, bkz.
    // scripts/split_conversations.py. Eski 'conversations' id'si veride
    // artik yok ama CONVERSATION_CATEGORY_IDS'de geriye donuk uyumluluk
    // icin duruyor.
    pick: (c) => CONVERSATION_CATEGORY_IDS.includes(c.id) },
];
let _currentSection = null;

function showQuizUnlockToast(container, onClick) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'ke-game-toast ke-quiz-toast';
  el.innerHTML = `🎁 <b>${L('15 dakika kesintisiz çalıştın!', "You studied 15 minutes straight!")}</b><br>${L('Küçük bir sınavı geç, oyun hakkı kazan! (dokun)', 'Pass a quick quiz to earn a game token! (tap)')}`;
  el.addEventListener('click', () => { el.remove(); onClick(); });
  container.querySelector('.ke-shell')?.appendChild(el);
  requestAnimationFrame(() => el.classList.add('ke-show'));
  // Bu toast'un kaybolmasi hakki dusurmez - PendingQuiz kalici, rozetten
  // her zaman tekrar acilabilir; sadece 9sn sonra kucuk rozete cekiliyor.
  setTimeout(() => { el.classList.remove('ke-show'); setTimeout(() => el.remove(), 400); }, 9000);
}

// "orada aktapokus'un sadece maskotu olsun" geri bildirimi ile
// keGameBtn/keGameTokenBadge (ayri bir "Quiz" cipi) kaldirildi - odul
// bildirimi artik giris ekranindaki buyuk maskot dugmesinin uzerinde
// kucuk bir rozet (#keMascotBadge). Element her zaman DOM'da duruyor
// (baslangicta hidden), boylece token 0 -> pozitife gectiginde yeniden
// bulunabiliyor (querySelector kaybolmuyor).
function refreshGameBadge(container) {
  const badge = container.querySelector('#keMascotBadge');
  if (!badge) return;
  const pending = PendingQuiz.get();
  const tokens = GameTokens.get();
  if (pending > 0) {
    badge.textContent = '🎁';
    badge.title = L(`Sınav hazır! (${pending})`, `Quiz ready! (${pending})`);
    badge.hidden = false;
    badge.classList.add('ke-mascot-badge-pulse');
  } else if (tokens > 0) {
    badge.textContent = '🎮';
    badge.title = L(`${tokens} oyun hakkın var`, `${tokens} game token(s)`);
    badge.hidden = false;
    badge.classList.remove('ke-mascot-badge-pulse');
  } else {
    badge.hidden = true;
    badge.classList.remove('ke-mascot-badge-pulse');
  }
}

function showSectionMenu(container, api, toolId, categories) {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  _currentSection = null;
  const host = container.querySelector('#keScreenHost');
  const waveSrc = new URL('mascot/mascot_wave.png', ASSET_BASE_URL).href;
  const hasBadge = GameTokens.get() > 0 || PendingQuiz.get() > 0;
  host.innerHTML = `
    <div class="ke-carnival-hero">
      <span class="ke-carnival-sparkle cs1">✦</span>
      <span class="ke-carnival-sparkle cs2">★</span>
      <span class="ke-carnival-sparkle cs3">✧</span>
      <span class="ke-carnival-sparkle cs4">★</span>
      <span class="ke-carnival-sparkle cs5">✦</span>
      <h1 class="ke-title ke-carnival-title">${bubbleTitleHTML(L("Aktapokus'un Kelime Safarisi", "Aktapokus Word Safari"))}</h1>
      <p class="ke-carnival-subtitle">${L('Ne öğrenmek istiyorsun? Bir bölüm seç!', 'What do you want to learn? Pick a section!')}</p>
      <button type="button" class="ke-mascot-btn" id="keMascotBtn" aria-label="${L("Aktapokus'um ve ayarlar", 'My Aktapokus & settings')}" title="${L("Aktapokus'um", 'My Aktapokus')}">
        <img class="ke-av-body" src="${avatarBodySrc('wave', Profiles.active().color)}" alt="Aktapokus" draggable="false" />
        ${avatarHatHTML('wave', Profiles.active())}
        <span class="ke-mascot-badge" id="keMascotBadge" ${hasBadge ? '' : 'hidden'}></span>
      </button>
    </div>
    <div class="ke-category-grid" id="keSectionGrid"></div>
  `;
  host.querySelector('#keMascotBtn').addEventListener('click', () => showProfileScreen(container, api, toolId, categories, {}));
  refreshGameBadge(container);
  const grid = host.querySelector('#keSectionGrid');
  SECTIONS.forEach((sec) => {
    const cats = categories.filter(sec.pick);
    const card = document.createElement('button');
    card.className = 'ke-category-card';
    card.style.setProperty('--cc-tint', sec.theme.tint);
    card.style.setProperty('--cc-dark', sec.theme.dark);
    card.style.setProperty('--cc-c', sec.theme.c);
    card.setAttribute('data-initial', sec.title.charAt(0).toLocaleUpperCase('tr'));
    const words = cats.reduce((s, c) => s + c.word_count, 0);
    const meta = sec.locked
      ? L('Yakında 🔒', 'Coming soon 🔒')
      : L(`${cats.length} kategori · ${words} kelime`, `${cats.length} ${cats.length === 1 ? "category" : "categories"} · ${words} words`);
    if (sec.locked) { card.disabled = true; card.style.opacity = '.6'; card.style.cursor = 'not-allowed'; }
    card.innerHTML = `
      <div class="ke-category-icon" style="color:${sec.theme.c}">${sec.title.charAt(0).toLocaleUpperCase('tr')}<span class="ke-cat-motif-badge">${sec.motif}</span></div>
      <div class="ke-category-text">
        <div class="ke-category-title">${_lang === 'tr' ? sec.titleTr : sec.title}</div>
        <div class="ke-category-meta">${_lang === 'tr' ? sec.subTr : sec.sub}</div>
        <div class="ke-category-meta">${meta}</div>
      </div>
    `;
    if (!sec.locked) {
      card.addEventListener('click', () => showCategoryGrid(container, api, toolId, categories, sec.id));
    }
    grid.appendChild(card);
  });
}


// Olay gunlugunden (IndexedDB) KPI'lari hesaplar. Not: sadece Quiz turu
// VE her yanlis cevap tutarli sekilde olay yaziyor; Cumle/Harf turlarinin
// DOGRU cevaplari henuz ayri loglanmiyor (bilinen kapsam siniri) - yani
// dogruluk orani gercekte biraz daha yuksek olabilir.
async function computeKPIs(profileId) {
  const events = await idbGetEvents(profileId);
  const total = events.length;
  const correct = events.filter((e) => e.isCorrect).length;
  const accuracy = total ? Math.round((correct / total) * 100) : null;
  const learnedWords = new Set(events.filter((e) => e.isCorrect).map((e) => e.word)).size;
  // Son 7 gun icin gunluk cevap sayisi - GERCEK veri, uydurma sparkline degil.
  const days = [];
  for (let i = 6; i >= 0; i--) days.push(dayStr(Date.now() - i * 86400000));
  const last7 = days.map((d) => events.filter((e) => dayStr(e.timestamp) === d).length);
  const thisWeek = last7.reduce((a, b) => a + b, 0);
  return {
    total, correct, accuracy, learnedWords, last7, thisWeek,
    puzzlesCompleted: Progress.totalStars(),
    streak: Streak.get(),
    timeSeconds: TimeTrack.total(),
  };
}

function profileStorageKeys(pid) {
  return {
    progress: pid === 'p1' ? PROGRESS_KEY : PROGRESS_KEY + '_' + pid,
    streak: pid === 'p1' ? STREAK_KEY : STREAK_KEY + '_' + pid,
    daily: pid === 'p1' ? DAILY_KEY : DAILY_KEY + '_' + pid,
    time: pid === 'p1' ? TIME_KEY : TIME_KEY + '_' + pid,
  };
}

// Cihazlar arasi senkron YOK (sunucu/hesap yok) - kullanicinin kendi
// istegiyle indirip baska bir cihaza tasiyabilecegi tek JSON dosyasi.
function exportBackup() {
  const data = { version: 1, exportedAt: new Date().toISOString(), profiles: null, byProfile: {} };
  try { data.profiles = JSON.parse(window.localStorage.getItem(PROFILES_KEY)); } catch (e) { /* yok say */ }
  Profiles.all().forEach((p) => {
    const k = profileStorageKeys(p.id);
    const blob = {};
    Object.entries(k).forEach(([name, key]) => {
      try { blob[name] = JSON.parse(window.localStorage.getItem(key)); } catch (e) { blob[name] = null; }
    });
    data.byProfile[p.id] = blob;
  });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `aktapokus-yedek-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function importBackup(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (data.profiles) window.localStorage.setItem(PROFILES_KEY, JSON.stringify(data.profiles));
      Object.entries(data.byProfile || {}).forEach(([pid, blob]) => {
        const k = profileStorageKeys(pid);
        Object.entries(k).forEach(([name, key]) => {
          if (blob[name] != null) window.localStorage.setItem(key, JSON.stringify(blob[name]));
        });
      });
      window.alert(L('Yedek yüklendi! Sayfa yenileniyor.', 'Backup restored! Reloading.'));
      window.location.reload();
    } catch (e) {
      window.alert(L('Yedek dosyası okunamadı — dosya bozuk olabilir.', 'Could not read the backup file — it may be corrupted.'));
    }
  };
  reader.readAsText(file);
}

async function showStatsScreen(container, api, toolId, categories) {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  const host = container.querySelector('#keScreenHost');
  host.innerHTML = `
    <button class="ke-back-btn" id="keStatsBack">${ICON_BACK} ${L('Bölümler', 'Sections')}</button>
    <div class="ke-profile-screen" style="max-width:640px;">
      <h1 class="ke-title">${bubbleTitleHTML(L('Başarı Panom', 'My Achievements'))}</h1>
      <div id="keStatsBody">${L('Yükleniyor…', 'Loading…')}</div>
    </div>
  `;
  host.querySelector('#keStatsBack').addEventListener('click', () => showSectionMenu(container, api, toolId, categories));
  pushBackState(() => showSectionMenu(container, api, toolId, categories));

  const p = Profiles.active();
  const kpi = await computeKPIs(p.id);
  const mins = Math.floor(kpi.timeSeconds / 60);
  const maxBar = Math.max(1, ...kpi.last7);
  const dayLetters = L('PSÇPCCP', 'MTWTFSS').split('');
  const todayIdx = 6;
  const spark = kpi.last7.map((n, i) => `
    <div class="ke-spark-col">
      <div class="ke-spark-bar${i === todayIdx ? ' ke-spark-today' : ''}" style="height:${Math.max(6, Math.round((n / maxBar) * 44))}px" title="${n}"></div>
      <div class="ke-spark-day">${dayLetters[i]}</div>
    </div>`).join('');

  const cards = [
    { v: kpi.puzzlesCompleted, l: L('Tamamlanan Bölüm', 'Episodes Done'), c: 'gold' },
    { v: `${kpi.streak}`, l: L('Günlük Seri', 'Day Streak'), c: 'wood', suffix: L(' gün', ' days') },
    { v: kpi.learnedWords, l: L('Öğrenilen Kelime', 'Words Learned'), c: 'teal' },
    { v: kpi.accuracy === null ? '—' : `${kpi.accuracy}%`, l: L('Doğruluk', 'Accuracy'), c: 'good' },
  ].map((c) => `
    <div class="ke-kpi-card ke-kpi-${c.c}">
      <div class="ke-kpi-val">${c.v}${c.suffix || ''}</div>
      <div class="ke-kpi-lbl">${c.l}</div>
    </div>`).join('');

  const stars = kpi.puzzlesCompleted;
  const streakDays = kpi.streak;
  const trophies = [
    ...avatarColors().filter((c) => c.id !== 'yellow').map((c) => ({
      name: L(`${c.label} Aktapokus`, `${c.label} Aktapokus`),
      swatch: c.swatch,
      got: c.needStreak ? streakDays >= c.needStreak : stars >= c.need,
      need: c.needStreak ? L(`${c.needStreak} gün seri`, `${c.needStreak}-day streak`) : L(`${c.need} bölüm`, `${c.need} episode${c.need === 1 ? '' : 's'}`),
    })),
    ...avatarHats().filter((h) => h.id !== 'none').map((h) => ({
      name: h.label, emoji: h.emoji,
      got: h.needStreak ? streakDays >= h.needStreak : stars >= h.need,
      need: h.needStreak ? L(`${h.needStreak} gün seri`, `${h.needStreak}-day streak`) : L(`${h.need} bölüm`, `${h.need} episode${h.need === 1 ? '' : 's'}`),
    })),
  ];
  const trophyGrid = trophies.map((t) => `
    <div class="ke-trophy${t.got ? ' ke-trophy-got' : ''}">
      <div class="ke-trophy-badge" style="${t.swatch ? `background:${t.swatch}` : ''}">${t.emoji || ''}</div>
      <div class="ke-trophy-name">${t.name}</div>
      <div class="ke-trophy-need">${t.got ? L('Kazanıldı!', 'Earned!') : t.need}</div>
    </div>`).join('');

  const body = host.querySelector('#keStatsBody');
  if (body) {
    body.innerHTML = `
      <div class="ke-week-card">
        <div class="ke-week-top">
          <div>
            <div class="ke-kpi-lbl">${L('Bu hafta', 'This week')}</div>
            <div class="ke-kpi-val">${kpi.thisWeek} <span style="font-size:15px;font-weight:700;">${L('cevap', 'answers')}</span></div>
          </div>
          <div class="ke-week-time">⏱ ${mins} ${L('dk toplam', 'min total')}</div>
        </div>
        <div class="ke-spark-row">${spark}</div>
      </div>
      <div class="ke-kpi-grid">${cards}</div>
      <div class="ke-pl-label" style="margin-top:26px;">${L('Kupalar — Aktapokus’a kostüm', 'Trophies — costumes for Aktapokus')}</div>
      <div class="ke-trophy-grid">${trophyGrid}</div>
      <button type="button" class="ke-btn-primary" id="keGoCustomize" style="margin-top:14px;">${L('Aktapokus’u Özelleştir', 'Customize Aktapokus')} →</button>
      <div class="ke-pl-label" style="margin-top:26px;">${L('Yedekleme', 'Backup')}</div>
      <div class="ke-pick-row">
        <button type="button" class="ke-pick" id="keExportBtn">${L('Yedek indir', 'Download backup')}</button>
        <label class="ke-pick" for="keImportInput" style="cursor:pointer;">${L('Yedek yükle', 'Restore backup')}</label>
        <input type="file" id="keImportInput" accept="application/json" style="display:none;" />
      </div>
      <div class="ke-pl-label">${L('Veri hiçbir sunucuya gönderilmez — sadece bu cihazda tutulur.', 'Your data is never sent to a server — it stays on this device only.')}</div>
    `;
    host.querySelector('#keExportBtn').addEventListener('click', exportBackup);
    host.querySelector('#keImportInput').addEventListener('change', (e) => importBackup(e.target.files[0]));
    host.querySelector('#keGoCustomize').addEventListener('click', () => showProfileScreen(container, api, toolId, categories, {}));
  }
}

// "hata bildirim calismiyor" - eski link dogrudan GitHub Issues listesine
// aciliyordu; bir GitHub hesabi olmayan (buyuk cogunluk - ebeveyn/cocuk)
// bir kullanici icin orada hicbir sey YAPAMIYORDU, "calismiyor" gibi
// hissettiriyordu. mailto: hesap gerektirmiyor, her cihazda calisan bir
// posta uygulamasina dogrudan, konu/govde onceden doldurulmus sekilde
// aciliyor - gelistiriciye (bmenderes@gmail.com) direkt ulasiyor.
function reportProblemHref() {
  const subject = L('Aktapokus Kids English - Sorun Bildirimi', 'Aktapokus Kids English - Bug Report');
  const body = L(
    'Neredeydin (kategori/bölüm) ve ne oldu?\n\n\n---\nCihaz: ' + navigator.userAgent,
    'Where were you (category/episode) and what happened?\n\n\n---\nDevice: ' + navigator.userAgent
  );
  return `mailto:bmenderes@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function escapeProfileText(t) {
  return String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// "Aktapokus'um": profil (ad + renk + şapka). Renk/şapka açılışı kazanılan
// yıldız (tamamlanan bölüm) sayısına bağlı. Her profilin ilerlemesi ayrı.
function showProfileScreen(container, api, toolId, categories, opts) {
  opts = opts || {};
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  const host = container.querySelector('#keScreenHost');
  const first = !!opts.first;
  const creating = !!opts.newProfile;
  const draft = creating
    ? { id: Profiles.newId(), name: '', color: 'yellow', hat: 'none' }
    : Object.assign({}, Profiles.active());
  const stars = creating ? 0 : Progress.totalStars();
  const streakDays = creating ? 0 : Streak.get();
  let msg = '';

  // Bazi ust-seviye kilitler yildiza (tamamlanan bolum) degil, art arda
  // gun seriyene bagli ("her gun biraz oyna" tesvigi) - needStreak varsa
  // O gecerli, yoksa eski yildiz kurali.
  function isLocked(item) {
    if (item.needStreak) return streakDays < item.needStreak;
    return stars < item.need;
  }
  function lockLabel(item) {
    return item.needStreak ? `🔒${item.needStreak}🔥` : `🔒${item.need}⭐`;
  }
  function lockMsg(label, item) {
    return item.needStreak
      ? L(`🔒 ${label} için ${item.needStreak} gün art arda oynaman gerekli (şu an ${streakDays})`, `🔒 ${label} needs a ${item.needStreak}-day streak (you have ${streakDays})`)
      : L(`🔒 ${label} için ${item.need} ⭐ gerekli (şu an ${stars})`, `🔒 ${label} needs ${item.need} ⭐ (you have ${stars})`);
  }

  function draw() {
    const profiles = Profiles.all();
    const colorBtns = avatarColors().map((c) => {
      const lock = isLocked(c);
      return `<button type="button" class="ke-pick${draft.color === c.id ? ' ke-sel' : ''}${lock ? ' ke-lock' : ''}" data-color="${c.id}" aria-label="${c.label}"><span class="ke-sw" style="background:${c.swatch}"></span>${lock ? ` ${lockLabel(c)}` : ''}</button>`;
    }).join('');
    const hatBtns = avatarHats().map((h) => {
      const lock = isLocked(h);
      return `<button type="button" class="ke-pick${draft.hat === h.id ? ' ke-sel' : ''}${lock ? ' ke-lock' : ''}" data-hat="${h.id}" aria-label="${h.label}">${h.emoji}${lock ? ` ${lockLabel(h)}` : ''}</button>`;
    }).join('');
    const switcher = first || creating ? '' : `
      <div class="ke-pl-label">${L('Profiller', 'Profiles')}</div>
      <div class="ke-pick-row">
        ${profiles.map((pr) => `<button type="button" class="ke-pick${pr.id === draft.id ? ' ke-sel' : ''}" data-profile="${pr.id}">${escapeProfileText(pr.name || L('Ben', 'Me'))}</button>`).join('')}
        <button type="button" class="ke-pick" id="keNewProfile">＋ ${L('Yeni', 'New')}</button>
        ${profiles.length > 1 ? '<button type="button" class="ke-pick" id="keDelProfile">🗑️</button>' : ''}
      </div>`;
    host.innerHTML = `
      ${first ? '' : `<button class="ke-back-btn" id="keProfileBack">${ICON_BACK} ${L('Bölümler', 'Sections')}</button>`}
      <div class="ke-profile-screen">
        <h1 class="ke-title">${bubbleTitleHTML(first ? L('Merhaba! Ben Aktapokus', "Hi! I'm Aktapokus") : L("Aktapokus'um", 'My Aktapokus'))}</h1>
        <div class="ke-avatar-stage"><img class="ke-av-body" src="${avatarBodySrc('idle', draft.color)}" alt="Aktapokus" draggable="false" />${avatarHatHTML('idle', draft)}</div>
        <div><input id="keProfileName" class="ke-profile-name" maxlength="12" placeholder="${L('Adın ne?', 'Your name?')}" value="${escapeProfileText(draft.name)}" autocomplete="off" /></div>
        <div class="ke-pl-label">${L('Renk', 'Color')}</div><div class="ke-pick-row">${colorBtns}</div>
        <div class="ke-pl-label">${L('Şapka', 'Hat')}</div><div class="ke-pick-row">${hatBtns}</div>
        <div class="ke-pl-label" id="keProfileMsg">${msg || L(`Kazandığın yıldız: ${stars} ⭐ · Seri: ${streakDays} gün 🔥 — bölüm bitirdikçe ve art arda oynadıkça yeni renk/şapkalar açılır!`, `Stars: ${stars} ⭐ · Streak: ${streakDays} days 🔥 — finish episodes and keep your streak to unlock new colors/hats!`)}</div>
        <div style="margin-top:8px;"><button type="button" class="ke-btn-primary" id="keProfileSave" style="font-size:17px !important;padding:14px 26px !important;">${first ? L('Başla! 🚀', "Let's go! 🚀") : L('Kaydet ✓', 'Save ✓')}</button></div>
        ${switcher}
        ${creating ? '' : `
        <div class="ke-pl-label" style="margin-top:18px;">${L('Diğer', 'More')}</div>
        <div class="ke-hub-links">
          ${first ? '' : `<button type="button" class="ke-hub-link" id="keHubProgress">📊 ${L('İlerleme', 'Progress')}</button>
          <button type="button" class="ke-hub-link" id="keHubGame" ${(GameTokens.get() > 0 || PendingQuiz.get() > 0) ? '' : 'disabled'}>🎮 ${L('Ödül Oyunu', 'Reward Game')}</button>`}
          <button type="button" class="ke-hub-link" id="keHubSound">🔊 ${L('Ses testi', 'Sound test')}</button>
          <button type="button" class="ke-hub-link" id="keHubLang">🌐 ${_lang === 'tr' ? 'English' : 'Türkçe'}</button>
        </div>
        <div id="keSoundInfo" style="margin-top:2px;font-size:11.5px;color:var(--kb-chalk-dim);font-weight:700;"></div>
        ${window.KE_STATIC ? `<div style="margin-top:10px;font-size:13px;font-weight:700;"><a href="privacy.html" style="color:var(--kb-chalk-dim);">${L('Gizlilik', 'Privacy')}</a> · <a href="${reportProblemHref()}" style="color:var(--kb-chalk-dim);">${L('Sorun bildir', 'Report a problem')}</a></div>` : ''}
        <button type="button" id="keHubTestKey" style="margin-top:14px;font-size:11px !important;padding:4px 10px !important;opacity:.4;" title="test">🔑</button>
        `}
      </div>`;
    const nameEl = host.querySelector('#keProfileName');
    nameEl.addEventListener('input', () => { draft.name = nameEl.value; });
    host.querySelectorAll('[data-color]').forEach((b) => b.addEventListener('click', () => {
      const c = avatarColors().find((x) => x.id === b.dataset.color);
      if (isLocked(c)) { msg = lockMsg(c.label, c); draw(); return; }
      draft.color = c.id; msg = ''; draw();
    }));
    host.querySelectorAll('[data-hat]').forEach((b) => b.addEventListener('click', () => {
      const h = avatarHats().find((x) => x.id === b.dataset.hat);
      if (isLocked(h)) { msg = lockMsg(h.label, h); draw(); return; }
      draft.hat = h.id; msg = ''; draw();
    }));
    host.querySelector('#keProfileSave').addEventListener('click', () => {
      draft.name = (draft.name || '').trim() || L('Arkadaşım', 'Friend');
      Profiles.save(draft);
      showSectionMenu(container, api, toolId, categories);
    });
    const back = host.querySelector('#keProfileBack');
    if (back) back.addEventListener('click', () => showSectionMenu(container, api, toolId, categories));
    const hubProgress = host.querySelector('#keHubProgress');
    if (hubProgress) hubProgress.addEventListener('click', () => showStatsScreen(container, api, toolId, categories));
    const hubGame = host.querySelector('#keHubGame');
    if (hubGame) hubGame.addEventListener('click', () => {
      if (PendingQuiz.get() > 0) {
        showBonusQuiz(container, api, toolId, categories, () => refreshGameBadge(container));
      } else if (GameTokens.get() > 0) {
        showGamePicker(container, () => showProfileScreen(container, api, toolId, categories, {}));
      }
    });
    const hubSound = host.querySelector('#keHubSound');
    if (hubSound) hubSound.addEventListener('click', () => runSoundTest(host.querySelector('#keSoundInfo')));
    const hubLang = host.querySelector('#keHubLang');
    if (hubLang) hubLang.addEventListener('click', () => { setLang(_lang === 'tr' ? 'en' : 'tr'); draw(); });
    // Gecici test kisayolu: sifre girince kuyruk/sinav beklemeden 1 oyun
    // hakki verir - "benim test edebilmem icin" istegi, kalici bir ozellik
    // degil.
    const hubTestKey = host.querySelector('#keHubTestKey');
    if (hubTestKey) hubTestKey.addEventListener('click', () => {
      const code = window.prompt(L('Test şifresi', 'Test code'));
      if (code === '181078') { GameTokens.add(1); refreshGameBadge(container); }
    });
    host.querySelectorAll('[data-profile]').forEach((b) => b.addEventListener('click', () => {
      Profiles.setActive(b.dataset.profile);
      showProfileScreen(container, api, toolId, categories, {});
    }));
    const nb = host.querySelector('#keNewProfile');
    if (nb) nb.addEventListener('click', () => showProfileScreen(container, api, toolId, categories, { newProfile: true }));
    const db = host.querySelector('#keDelProfile');
    if (db) db.addEventListener('click', () => {
      if (window.confirm(L(`"${draft.name || 'Ben'}" profili ve ilerlemesi silinsin mi?`, `Delete profile "${draft.name || 'Me'}" and its progress?`))) {
        Profiles.remove(draft.id);
        showProfileScreen(container, api, toolId, categories, {});
      }
    });
  }
  draw();
  if (!first) pushBackState(() => showSectionMenu(container, api, toolId, categories));
}

function showCategoryGrid(container, api, toolId, categories, sectionId) {
  const section = SECTIONS.find((s) => s.id === (sectionId || _currentSection));
  if (!section || section.locked) { showSectionMenu(container, api, toolId, categories); return; }
  _currentSection = section.id;
  const shown = categories.filter(section.pick);
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  const host = container.querySelector('#keScreenHost');
  const waveSrc = new URL('mascot/mascot_wave.png', ASSET_BASE_URL).href;
  host.innerHTML = `
    <button class="ke-back-btn" id="keSectionsBack">${ICON_BACK} ${L('Bölümler', 'Sections')}</button>
    ${avatarLandingHTML('wave')}
    <div class="ke-landing-header">
      <h1 class="ke-title">${bubbleTitleHTML(_lang === 'tr' ? section.titleTr : section.title)}</h1>
      <p class="ke-subtitle">${L('Bir kategori seç, maceraya başla!', 'Pick a category and start the adventure!')} (${shown.length} ${L('kategori', 'categories')} · ${shown.reduce((s, c) => s + c.word_count, 0)} ${L('kelime', 'words')})</p>
    </div>
    <div class="ke-category-grid" id="keCategoryGrid"></div>
  `;
  host.querySelector('#keSectionsBack').addEventListener('click', () => showSectionMenu(container, api, toolId, categories));
  const grid = host.querySelector('#keCategoryGrid');
  shown.forEach((c) => {
    const card = document.createElement('button');
    card.className = 'ke-category-card';
    const titleTr = catLabel(c);
    const initial = titleTr.trim().charAt(0).toLocaleUpperCase('tr');
    const theme = CATEGORY_THEME[baseCatId(c.id)] || { c: '#4A90E2', dark: '#3A78C2', tint: '#E9F1FC' };
    card.style.setProperty('--cc-tint', theme.tint);
    card.style.setProperty('--cc-dark', theme.dark);
    card.setAttribute('data-initial', initial);

    const prog = Progress.getCategory(c.id);
    const doneCount = prog.completed.length;
    const missedCount = Progress.dueMissed(c.id).length;
    const inProgress = doneCount > 0 && doneCount < c.episode_count;
    const metaText = doneCount > 0
      ? L(`${doneCount} / ${c.episode_count} bölüm tamamlandı ⭐`, `${doneCount} / ${c.episode_count} episodes done ⭐`)
      : L(`${c.word_count} kelime · ${c.episode_count} bölüm`, `${c.word_count} words · ${c.episode_count} episodes`);
    const pct = c.episode_count ? Math.round((doneCount / c.episode_count) * 100) : 0;
    const nextEp = Progress.nextIncompleteEpisode(c.id, c.episode_count);
    const motif = CATEGORY_MOTIF[baseCatId(c.id)] || '⭐';

    card.innerHTML = `
      <div class="ke-category-icon" style="color:${theme.c}">${initial}<span class="ke-cat-motif-badge">${motif}</span></div>
      <div class="ke-category-text">
        <div class="ke-category-title">${titleTr}</div>
        <div class="ke-category-meta">${metaText}</div>
        ${doneCount > 0 ? `<div class="ke-cat-progress-track"><div class="ke-cat-progress-fill" style="width:${pct}%"></div></div>` : ''}
        ${inProgress ? `<div class="ke-cat-next-ep">${L('Sıradaki: Bölüm', 'Next: Episode')} ${nextEp + 1}</div>` : ''}
      </div>
      ${missedCount >= 1 ? `<div class="ke-review-chip" data-review-cat="${c.id}" role="button" tabindex="0" title="${L('Zorlandığın kelimeleri tekrar et', 'Review the words you missed')}">🔁 ${missedCount}</div>` : ''}
    `;
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-review-cat]')) return; // ayrı buton kendi handler'ında yönetiliyor
      const startIndex = Progress.nextIncompleteEpisode(c.id, c.episode_count);
      enterCategory(container, api, toolId, categories, c.id, startIndex);
    });
    const reviewBtn = card.querySelector('[data-review-cat]');
    if (reviewBtn) {
      reviewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startReviewSession(container, api, toolId, categories, c.id, c.title);
      });
      // reviewBtn native bir <button> değil (kart zaten bir <button>,
      // içine ikinci bir <button> koymak geçersiz HTML olurdu — bkz.
      // .ke-review-chip yorumu) — bu yüzden Enter/Space'in tıklama
      // tetiklemesi otomatik değil, elle ekliyoruz (klavye erişilebilirliği).
      reviewBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          reviewBtn.click();
        }
      });
    }
    grid.appendChild(card);
  });
  pushBackState(() => showSectionMenu(container, api, toolId, categories));
}

async function enterCategory(container, api, toolId, categories, categoryId, episodeIndex) {
  const host = container.querySelector('#keScreenHost');
  host.innerHTML = `<div style="padding:60px;text-align:center;color:rgba(245,247,250,.6);">${L('Yükleniyor...', 'Loading...')}</div>`;
  let episode;
  try {
    const r = await api.apiFetch(`/api/tools/${toolId}/categories/${categoryId}/episodes/${episodeIndex}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    episode = await r.json();
  } catch (e) {
    host.innerHTML = `<div style="padding:40px;text-align:center;color:#FF4D4D;">${L('Bölüm yüklenemedi', 'Could not load episode')}: ${e.message}</div>`;
    return;
  }
  renderEpisodeScene(container, api, toolId, categories, episode);
}

// Hafif tekrar kuyruğu: kalıcı ilerleme profilinden (Progress.topMissed)
// derlenen, en çok yanlış yapılan kelimeler üzerinden ekstra API isteği
// olmadan client-side bir "mini bölüm" kurup doğrudan sorular ekranına
// atlıyoruz — normal bölüm akışıyla aynı DOM/oyun mantığını (startQuiz vb.)
// yeniden kullanıyor, sadece giriş noktası farklı. episode.isReview
// bayrağı showCelebration/quiz'e "bunu tamamlanmış bölüm sayma, kelime
// ustalaşınca kuyruktan çıkar" demek için kullanılıyor.
function startReviewSession(container, api, toolId, categories, categoryId, categoryTitle) {
  const missed = Progress.topMissed(categoryId, 8);
  if (!missed.length) return;
  const reviewEpisode = {
    category_id: categoryId,
    category_title: categoryTitle,
    episode_index: 0,
    episode_count: 1,
    objects: missed,
    reward_label: L('Tekrar Şampiyonu! 🔁', 'Review Champion! 🔁'),
    isReview: true,
  };
  renderEpisodeScene(container, api, toolId, categories, reviewEpisode);
  const host = container.querySelector('#keScreenHost');
  const subtitle = host.querySelector('#keSubtitle');
  if (subtitle) subtitle.textContent = L(`Tekrar Turu — ${missed.length} kelime`, `Review Round — ${missed.length} words`);
  // Keşif adımını atlayıp doğrudan soru turuna geçiyoruz — "Sorulara Geç"
  // düğmesiyle aynı davranış, zaten var olan mantığı yeniden kullanıyoruz.
  const quizJumpBtn = host.querySelector('#keJumpQuiz');
  if (quizJumpBtn) quizJumpBtn.click();
}

function renderEpisodeScene(container, api, toolId, categories, episode) {
  if (episode.conversation) {
    renderConversationEpisodeScene(container, api, toolId, categories, episode);
    return;
  }
  const host = container.querySelector('#keScreenHost');
  const titleTr = catLabel({ title: episode.category_title });
  const theme = CATEGORY_THEME[baseCatId(episode.category_id)] || { c: '#4A90E2', dark: '#3A78C2', tint: '#E9F1FC' };
  const motif = SCENE_MOTIF[baseCatId(episode.category_id)];

  host.innerHTML = `
    <button class="ke-back-btn" id="keBackBtn">${ICON_BACK} ${L('Kategoriler', 'Categories')}</button>
    <details class="ke-map-details" id="keMapDetails"${isNarrowLayout() ? '' : ' open'}>
      <summary class="ke-map-summary">🗺️ ${L('Bölüm', 'Episode')} <span id="keMapSummaryNum">${episode.episode_index + 1}</span> / <span id="keMapSummaryTotal">${episode.episode_count}</span></summary>
      <div class="ke-map" id="keMap"></div>
    </details>
    <h1 class="ke-title">${bubbleTitleHTML(L('Aktapokus ile ', 'Aktapokus: ') + titleTr)}</h1>
    <p class="ke-subtitle" id="keSubtitle">${L('Bölüm', 'Episode')} ${episode.episode_index + 1} / ${episode.episode_count} — ${L('Kelime Keşfi', 'Word Discovery')}</p>

    <div class="ke-scene-wrap" style="--cc-tint:${theme.tint};--cc-c:${theme.c}">
      <div class="ke-scene" id="keScene">
        <div class="ke-stars"></div>
        ${motif ? `<div class="ke-scene-motif ke-motif-${motif}"></div>` : ''}
        <div class="ke-bubble" id="keBubble">${L('Nesnelere dokun, Aktapokus sana ne olduğunu söylesin! 👆', 'Tap the pictures and Aktapokus will tell you what they are! 👆')}</div>
        <button type="button" class="ke-help-btn" id="keHelpBtn" aria-label="Help">ⓘ</button>
        <div class="ke-progress-chip" id="keProgress">0 / 0 ${L("kelime", "words")}</div>
        <div class="ke-word-popup" id="keWordPopup"></div>
        <div id="keObjects"></div>
        <div class="ke-mascot-wrap" id="keMascot">${mascotSvg()}</div>
        <div class="ke-quiz" id="keQuiz">
          <button class="ke-quiz-replay" id="keQuizReplay" title="${L('Tekrar dinle', 'Listen again')}" aria-label="${L('Tekrar dinle', 'Listen again')}">${ICON_SPEAKER}</button>
          <div class="ke-bubble ke-quiz-bubble" id="keQuizBubble">${L('Şimdi öğrendiklerini deneyelim!', "Let's try what you learned!")}</div>
          <div class="ke-quiz-progress" id="keQuizProgress">Soru 1 / 5</div>
          <div class="ke-quiz-word" id="keQuizWord"></div>
          <div class="ke-quiz-cards" id="keQuizCards"></div>
        </div>
        <div class="ke-speak" id="keSpeak">
          <div class="ke-speak-progress" id="keSpeakProgress">${L('Kelime', 'Word')} 1 / 5</div>
          <div class="ke-speak-card">
            <div id="keSpeakIcon"></div>
            <div class="ke-speak-word" id="keSpeakWord"></div>
          </div>
          <div class="ke-speak-feedback" id="keSpeakFeedback"></div>
          <div class="ke-btn-row">
            <button class="ke-btn-secondary" id="keSpeakReplay" title="${L('Tekrar dinle', 'Listen again')}">${ICON_SPEAKER} ${L('Dinle', 'Listen')}</button>
            <button class="ke-btn-primary ke-speak-mic" id="keSpeakMic">🎤 ${L('Söyle', 'Say it')}</button>
            <button class="ke-btn-secondary" id="keSpeakNext" style="display:none;">${L('Devam Et', 'Next')} →</button>
          </div>
        </div>
        <div class="ke-sentence" id="keSentence">
          <div class="ke-bubble ke-sentence-bubble" id="keSentenceBubble">${L('Kelimeleri sırayla dokun, cümleyi tamamla! 🧩', 'Tap the words in order to finish the sentence! 🧩')}</div>
          <div class="ke-sentence-progress" id="keSentenceProgress">${L('Cümle', 'Sentence')} 1 / 6</div>
          <div class="ke-sentence-icon" id="keSentenceIcon"></div>
          <div class="ke-sentence-slots" id="keSentenceSlots"></div>
          <div class="ke-sentence-bank" id="keSentenceBank"></div>
          <div class="ke-btn-row" id="keSentenceActions" style="display:none;">
            <button class="ke-btn-secondary" id="keSentenceReset">${L('Baştan Başla', 'Start over')}</button>
            <button class="ke-btn-primary" id="keSentenceCheck">${L('Kontrol Et', 'Check')} ✓</button>
          </div>
        </div>
        <div class="ke-celebration" id="keCelebration">
          <div id="keConfettiHost"></div>
          <div style="font-size:52px;">🎉</div>
          <h2>${L('Harika iş çıkardın!', 'Great job!')}</h2>
          <p id="keCelebrationText"></p>
          <div class="ke-score" id="keScore" style="display:none;"></div>
          <div class="ke-reward-chip" id="keRewardChip"></div>
          <div class="ke-btn-row">
            <button class="ke-btn-secondary" id="keReplayBtn">${L('Tekrar Oyna', 'Play again')}</button>
            <button class="ke-btn-primary" id="keNextEpisodeBtn"></button>
          </div>
        </div>
      </div>
    </div>

    <div class="ke-footer-row" style="flex-direction:column; gap:10px;">
      <p class="ke-hint">${L('Sesi duymak için nesnelere tıkla. Aktapokus kelimeyi tekrar söylesin istersen tekrar dokunabilirsin.', 'Tap a picture to hear the word. Tap again to hear it once more.')}</p>
      <button class="ke-btn-primary" id="keGoToQuizBtn" style="display:none;">${L('Sorulara Geç', 'Go to questions')} → (<span id="keGoToQuizCount">0</span> ${L('kelimeyle', 'words')})</button>
    </div>
    <details class="ke-jump-row">
      <summary class="ke-jump-summary">⚙ ${L('Bölüm içinde atla (geliştirici)', 'Jump within episode (dev)')}</summary>
      <div class="ke-jump-buttons">
        <button class="ke-jump-btn" id="keJumpDiscovery">1. ${L('Kelime Keşfi', 'Discovery')}</button>
        <button class="ke-jump-btn" id="keJumpQuiz">2. ${L('Sorular', 'Quiz')}</button>
        <button class="ke-jump-btn" id="keJumpSpeak">3. ${L('Konuşma', 'Speak')}</button>
        <button class="ke-jump-btn" id="keJumpSentence">4. ${L('Cümle', 'Sentence')}</button>
        <button class="ke-jump-btn" id="keJumpLetters">5. ${L('Harfler', 'Letters')}</button>
      </div>
    </details>
  `;

  function jumpToEpisode(index) {
    if (index === episode.episode_index) return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (container._keActiveRecognition) {
      try { container._keActiveRecognition.abort(); } catch (e) { /* no-op */ }
      container._keActiveRecognition = null;
    }
    enterCategory(container, api, toolId, categories, episode.category_id, index);
  }

  const completedSet = new Set(Progress.getCategory(episode.category_id).completed);
  renderMap(host, episode.episode_index, episode.episode_count, jumpToEpisode, completedSet);

  const leaveEpisode = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (container._keActiveRecognition) {
      try { container._keActiveRecognition.abort(); } catch (e) { /* no-op */ }
      container._keActiveRecognition = null;
    }
    showCategoryGrid(container, api, toolId, categories);
  };
  host.querySelector('#keBackBtn').addEventListener('click', leaveEpisode);

  const objectsHost = host.querySelector('#keObjects');
  const total = episode.objects.length;
  let foundCount = 0;
  // Art arda hızlı tıklamalarda (ör. bir kelime yanlışlıkla iki kez,
  // sonra başka bir kelimeye tıklanınca) birden fazla requestAnimationFrame
  // sıraya girebilir; her biri KENDİ nesnesinin konumunu doğru hesaplasa
  // da, textContent SENKRON değiştiği için görsel/konum eşleşmesi
  // bozulabiliyordu ("Get up ve Free aynı yerde çıkıyor" geri
  // bildirimi). Her tıklamaya artan bir jeton veriyoruz — rAF çalıştığında
  // hâlâ EN SON tıklama oysa uygulanıyor, eskisi sessizce atlanıyor.
  let wordPopupClickToken = 0;
  // Çocuk (ya da sen) kaç kelime keşfettiyse quiz SADECE onları soruyor —
  // "5 kelimede geç de diyebilirim, 15'te de" isteğinin karşılığı: bölümü
  // bitirmek ZORUNLU değil, istediğin an "Sorulara Geç" ile duruyorsun,
  // Aktapokus o ana kadar öğrettiklerini hafızasında tutup onları soruyor.
  let discoveredWords = [];
  const progressEl = host.querySelector('#keProgress');
  const bubbleEl = host.querySelector('#keBubble');
  const wordPopup = host.querySelector('#keWordPopup');
  const mascotEl = host.querySelector('#keMascot');
  const helpBtn = host.querySelector('#keHelpBtn');
  if (helpBtn) helpBtn.addEventListener('click', () => container.querySelector('.ke-shell').classList.toggle('ke-show-help'));
  const goToQuizBtn = host.querySelector('#keGoToQuizBtn');
  const goToQuizCount = host.querySelector('#keGoToQuizCount');

  progressEl.textContent = `0 / ${total} ${L('kelime', 'words')}`;

  function resetDiscovery(message) {
    host.querySelector('#keCelebration').classList.remove('ke-show');
    host.querySelectorAll('.ke-obj').forEach((o) => o.classList.remove('ke-found'));
    wordPopup.classList.remove('ke-show');
    foundCount = 0;
    discoveredWords = [];
    progressEl.textContent = `0 / ${total} ${L('kelime', 'words')}`;
    goToQuizBtn.style.display = 'none';
    bubbleEl.textContent = message || L('Nesnelere dokun, Aktapokus sana ne olduğunu söylesin! 👆', 'Tap the pictures and Aktapokus will tell you what they are! 👆');
  }

  function goToNextEpisode() {
    const nextIndex = episode.episode_index + 1;
    if (nextIndex < episode.episode_count) {
      enterCategory(container, api, toolId, categories, episode.category_id, nextIndex);
    } else {
      showCategoryGrid(container, api, toolId, categories);
    }
  }

  function startQuizWithDiscovered() {
    goToQuizBtn.style.display = 'none';
    startQuiz(host, container, episode, discoveredWords.slice(), mascotEl, resetDiscovery, goToNextEpisode);
  }

  goToQuizBtn.addEventListener('click', startQuizWithDiscovered);

  // Sahnenin (id=keScene) ve maskotun dar/geniş sınıflarını, nesnelerin
  // konumunu tek yerden güncelleyen fonksiyon — hem ilk render'da hem de
  // ekran genişliği değişince (matchMedia listener, aşağıda) çağrılıyor.
  const sceneEl = host.querySelector('#keScene');
  function layoutObjects(narrow) {
    sceneEl.classList.toggle('ke-scene-narrow', narrow);
    mascotEl.classList.toggle('ke-mascot-narrow', narrow);
    const els = [...objectsHost.children];
    els.forEach((el, i) => {
      if (narrow) {
        el.style.left = '';
        el.style.top = '';
      } else {
        const pos = getCircularPosition(i, els.length);
        el.style.left = pos.left;
        el.style.top = pos.top;
      }
    });
  }

  episode.objects.forEach((obj, i) => {
    const el = document.createElement('div');
    el.className = 'ke-obj';
    el.dataset.word = obj.word;
    el.style.animationDelay = `${(i * 0.4).toFixed(1)}s`;
    el.innerHTML = `<span class="ke-badge">✓</span>${renderObjectIcon(obj)}`;
    // Klavye erişilebilirliği: div olduğu için varsayılan olarak
    // odaklanamaz/Enter'a tepki vermez — tabindex + rol + Enter/Space
    // dinleyicisiyle elle ekliyoruz (bkz. .ke-obj:focus-visible stili).
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', obj.word);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
    });
    el.addEventListener('click', () => {
      // Popup otomatik kapanmıyor — çocuk bir sonraki nesneye
      // tıklayana kadar (ya da bölüm yeniden başlayana kadar) ekranda
      // kalır, kelimeyi istediği kadar süre inceleyebilir.
      wordPopup.textContent = obj.word;
      wordPopup.classList.add('ke-show');
      // Konum artık SABİT değil, TIKLANAN NESNEYE göre hesaplanıyor —
      // eskiden sabit bir köşedeydi ve dar ekranda başka bir resmin
      // üzerine biniyordu ("resim üzerinde çıkıyor yazı" geri bildirimi).
      // rAF: popup'ın kendi boyutunu (getBoundingClientRect) ölçmeden
      // önce textContent/ke-show'un layout'a yansımasını bekliyoruz.
      const myToken = ++wordPopupClickToken;
      requestAnimationFrame(() => {
        if (myToken !== wordPopupClickToken) return; // bu arada başka bir nesneye tıklandı
        const sceneRect = sceneEl.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const popRect = wordPopup.getBoundingClientRect();
        const gap = 16; // balonun ucundaki üçgen işaretçi için pay
        let left = (elRect.left - sceneRect.left) + elRect.width / 2;
        let top;
        let below = false;
        if (sceneEl.classList.contains('ke-scene-narrow')) {
          // Dar ekran (ızgara): ÜST satır ikonu -> balon ÜSTTE (yönerge
          // balonunun bulunduğu boşlukta), ALT satır ikonu -> balon ALTTA
          // (ızgaranın altındaki boş şeritte). Eskiden hep ikonun üstüne
          // konuyordu; alt satırda bu, üstteki başka bir ikonu kapatıyordu,
          // üst satırda yer yoksa da aşağı inip alt ikonu kapatıyordu
          // ("balon başka ikonun üzerinde çıkıyor" geri bildirimi).
          const rects = [...objectsHost.children].map((o) => o.getBoundingClientRect());
          const gTop = Math.min(...rects.map((r) => r.top));
          const gBottom = Math.max(...rects.map((r) => r.bottom));
          const multiRow = (gBottom - gTop) > elRect.height * 1.5;
          below = multiRow && (elRect.top + elRect.height / 2) > (gTop + gBottom) / 2;
          // İlk dokunuştan sonra yönerge metni ("Nesnelere dokun...")
          // gereksiz; üst satır balonuna yer açmak için soluklaştırıyoruz.
          bubbleEl.style.transition = 'opacity .2s ease';
          bubbleEl.style.opacity = '0';
          top = below
            ? (elRect.bottom - sceneRect.top) + gap
            : Math.max(4, (elRect.top - sceneRect.top) - popRect.height - gap);
        } else {
          // Geniş ekran (daire düzeni): balon ikonun üstünde, konuşma
          // balonunun altına inmeden; yer yoksa ikonun altında.
          const bubbleRect = bubbleEl.getBoundingClientRect();
          const minTop = (bubbleRect.bottom - sceneRect.top) + 6;
          top = (elRect.top - sceneRect.top) - popRect.height - gap;
          if (top < minTop) { top = (elRect.bottom - sceneRect.top) + gap; below = true; }
        }
        wordPopup.classList.toggle('ke-below', below);
        const minLeft = popRect.width / 2 + 4;
        const maxLeft = sceneRect.width - popRect.width / 2 - 4;
        left = Math.max(minLeft, Math.min(maxLeft, left));
        wordPopup.style.left = `${left}px`;
        wordPopup.style.top = `${top}px`;
      });
      speakWord(obj.word, mascotEl);

      if (!el.classList.contains('ke-found')) {
        el.classList.add('ke-found');
        foundCount++;
        discoveredWords.push(obj);
        progressEl.textContent = `${foundCount} / ${total} ${L("kelime", "words")}`;
        celebrateBounce(mascotEl);
        if (foundCount === total) {
          bubbleEl.textContent = L('Bölümü tamamladın! Şimdi öğrendiklerini doğrulayalım. 🔍', 'Episode done! Now let us check what you learned. 🔍');
          setTimeout(startQuizWithDiscovered, 700);
        } else {
          goToQuizCount.textContent = String(foundCount);
          goToQuizBtn.style.display = 'inline-block';
        }
      }
    });
    objectsHost.appendChild(el);
  });

  layoutObjects(isNarrowLayout());
  // Önceki bölüm ekranından kalan listener'ı temizleyip yenisini
  // ekliyoruz (bkz. _fullscreenChangeHandler ile aynı temizlik deseni) —
  // her renderEpisodeScene çağrısı DOM'u sıfırdan kurduğu için eski
  // listener'ların birikmesini (sızıntı) önlüyor.
  if (_narrowMQ && _narrowChangeHandler) {
    try { _narrowMQ.removeEventListener('change', _narrowChangeHandler); } catch (e) { /* eski tarayıcı API farkı — no-op */ }
  }
  _narrowMQ = window.matchMedia('(max-width: 640px)');
  _narrowChangeHandler = (e) => layoutObjects(e.matches);
  try { _narrowMQ.addEventListener('change', _narrowChangeHandler); } catch (e) { /* Safari eski API fallback */ _narrowMQ.addListener(_narrowChangeHandler); }

  host.querySelector('#keReplayBtn').addEventListener('click', () => resetDiscovery());

  // Test/pratik kolaylığı: her seferinde baştan oynamak zorunda kalmadan
  // doğrudan istenen aşamaya atlanabilir. Çocuğa yönelik ilerleme
  // haritasından ayrı, bilinçli olarak sönük/göze batmayan bir kontrol —
  // gerçek ilerleme kilidini temsil etmiyor.
  function hideAllOverlays() {
    host.querySelector('#keQuiz').classList.remove('ke-show');
    host.querySelector('#keSpeak').classList.remove('ke-show');
    host.querySelector('#keSentence').classList.remove('ke-show');
    host.querySelector('#keCelebration').classList.remove('ke-show');
    progressEl.style.display = '';
    bubbleEl.style.display = '';
    goToQuizBtn.style.display = 'none';
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (container._keActiveRecognition) {
      try { container._keActiveRecognition.abort(); } catch (e) { /* no-op */ }
      container._keActiveRecognition = null;
    }
  }

  function markAllFound() {
    host.querySelectorAll('.ke-obj').forEach((o) => o.classList.add('ke-found'));
    foundCount = total;
    progressEl.textContent = `${total} / ${total} kelime`;
  }

  host.querySelector('#keJumpDiscovery').addEventListener('click', () => {
    hideAllOverlays();
    resetDiscovery();
  });
  host.querySelector('#keJumpQuiz').addEventListener('click', () => {
    hideAllOverlays();
    markAllFound();
    startQuiz(host, container, episode, episode.objects, mascotEl, resetDiscovery, goToNextEpisode);
  });
  host.querySelector('#keJumpSpeak').addEventListener('click', () => {
    hideAllOverlays();
    markAllFound();
    startSpeakRound(host, container, episode, episode.objects, mascotEl, null, goToNextEpisode);
  });
  host.querySelector('#keJumpSentence').addEventListener('click', () => {
    hideAllOverlays();
    markAllFound();
    startSentenceRound(host, container, episode, episode.objects, mascotEl, null, goToNextEpisode);
  });
  host.querySelector('#keJumpLetters').addEventListener('click', () => {
    hideAllOverlays();
    markAllFound();
    startLetterRound(host, container, episode, episode.objects, mascotEl, null, goToNextEpisode);
  });
  pushBackState(leaveEpisode);
}

// Konuşma bölümleri (episode.conversation) kelime-keşif/soru/konuşma/cümle
// akışını atlar — bunlar tek tek kelime-obje değil, Aktapokus'un sorduğu,
// öğrencinin kelime-taşlarıyla cevapladığı 5 turluk bir sohbet. "Aktapokus
// sorar, öğrenci cevaplar... konuşma şeklinde devam eden bir konsept"
// isteğinin karşılığı — bkz. startConversationRound.
function renderConversationEpisodeScene(container, api, toolId, categories, episode) {
  const host = container.querySelector('#keScreenHost');
  const titleTr = catLabel({ title: episode.category_title });
  const theme = CATEGORY_THEME[episode.category_id] || { c: '#EF6C9C', dark: '#D14F80', tint: '#F7A9C6' };
  const topicTitle = _lang === 'tr' ? (episode.title_tr || episode.title_en) : episode.title_en;

  host.innerHTML = `
    <button class="ke-back-btn" id="keBackBtn">${ICON_BACK} ${L('Kategoriler', 'Categories')}</button>
    <details class="ke-map-details" id="keMapDetails"${isNarrowLayout() ? '' : ' open'}>
      <summary class="ke-map-summary">🗺️ ${L('Konu', 'Topic')} <span id="keMapSummaryNum">${episode.episode_index + 1}</span> / <span id="keMapSummaryTotal">${episode.episode_count}</span></summary>
      <div class="ke-map" id="keMap"></div>
    </details>
    <h1 class="ke-title">${bubbleTitleHTML(L('Aktapokus ile ', 'Aktapokus: ') + titleTr)}</h1>
    <p class="ke-subtitle" id="keSubtitle">${L('Konu', 'Topic')} ${episode.episode_index + 1} / ${episode.episode_count} — ${topicTitle}</p>

    <div class="ke-scene-wrap" style="--cc-tint:${theme.tint};--cc-c:${theme.c}">
      <div class="ke-scene" id="keScene">
        <div class="ke-stars"></div>
        <div class="ke-mascot-wrap" id="keMascot">${mascotSvg()}</div>
        <div class="ke-sentence ke-show" id="keSentence">
          <div class="ke-bubble ke-sentence-bubble" id="keSentenceBubble"></div>
          <div class="ke-sentence-progress" id="keSentenceProgress"></div>
          <div class="ke-sentence-slots" id="keSentenceSlots"></div>
          <div class="ke-sentence-bank" id="keSentenceBank"></div>
          <div class="ke-btn-row" id="keSentenceActions" style="display:none;">
            <button class="ke-btn-secondary" id="keSentenceReset">${L('Baştan Başla', 'Start over')}</button>
            <button class="ke-btn-primary" id="keSentenceCheck">${L('Kontrol Et', 'Check')} ✓</button>
          </div>
        </div>
        <div class="ke-celebration" id="keCelebration">
          <div id="keConfettiHost"></div>
          <div style="font-size:52px;">🎉</div>
          <h2>${L('Harika iş çıkardın!', 'Great job!')}</h2>
          <p id="keCelebrationText"></p>
          <div class="ke-score" id="keScore" style="display:none;"></div>
          <div class="ke-reward-chip" id="keRewardChip"></div>
          <div class="ke-btn-row">
            <button class="ke-btn-secondary" id="keReplayBtn">${L('Tekrar Oyna', 'Play again')}</button>
            <button class="ke-btn-primary" id="keNextEpisodeBtn"></button>
          </div>
        </div>
      </div>
    </div>
    <div class="ke-footer-row" style="flex-direction:column; gap:10px;">
      <p class="ke-hint">${L('Aktapokus soruyor, sen cevabı kelimelerle kuruyorsun! 🧩', "Aktapokus asks, you build the answer with words! 🧩")}</p>
    </div>
  `;

  function jumpToEpisode(index) {
    if (index === episode.episode_index) return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    enterCategory(container, api, toolId, categories, episode.category_id, index);
  }
  const completedSet = new Set(Progress.getCategory(episode.category_id).completed);
  renderMap(host, episode.episode_index, episode.episode_count, jumpToEpisode, completedSet);

  const leaveEpisode = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    showCategoryGrid(container, api, toolId, categories);
  };
  host.querySelector('#keBackBtn').addEventListener('click', leaveEpisode);
  pushBackState(leaveEpisode);

  const mascotEl = host.querySelector('#keMascot');

  // Dar ekranda maskotu (küçük köşe hali - ke-mascot-compact) sorulan
  // İngilizce soru metniyle çakışmadan gizleyen kural (.ke-scene-narrow)
  // normal bölüm akışında burada uygulanıyordu ama bu konuşma sahnesi
  // hiç çağırmıyordu - maskot telefonlarda soru balonunun üzerine
  // biniyordu ("yazıyı kapatıyor maskot" geri bildirimi). Aynı sınıf
  // burada da uygulanmalı.
  const sceneEl = host.querySelector('#keScene');
  sceneEl.classList.toggle('ke-scene-narrow', isNarrowLayout());
  if (_narrowMQ && _narrowChangeHandler) {
    try { _narrowMQ.removeEventListener('change', _narrowChangeHandler); } catch (e) { /* eski tarayıcı API farkı */ }
  }
  _narrowMQ = window.matchMedia('(max-width: 640px)');
  _narrowChangeHandler = (e) => sceneEl.classList.toggle('ke-scene-narrow', e.matches);
  try { _narrowMQ.addEventListener('change', _narrowChangeHandler); } catch (e) { _narrowMQ.addListener(_narrowChangeHandler); }

  function goToNextEpisode() {
    const nextIndex = episode.episode_index + 1;
    if (nextIndex < episode.episode_count) {
      enterCategory(container, api, toolId, categories, episode.category_id, nextIndex);
    } else {
      showCategoryGrid(container, api, toolId, categories);
    }
  }

  host.querySelector('#keReplayBtn').addEventListener('click', () => {
    renderConversationEpisodeScene(container, api, toolId, categories, episode);
  });

  function onFinished(score) {
    Progress.markComplete(episode.category_id, episode.episode_index);
    try { DailyGoal.add(episode.conversation.length); } catch (e) { /* yok say */ }
    const overlay = host.querySelector('#keCelebration');
    host.querySelector('#keCelebrationText').textContent = L(`${episode.conversation.length} soruyu cevapladın!`, `You answered ${episode.conversation.length} questions!`)
      + (episode.episode_index + 1 < episode.episode_count
        ? L(' Bir sonraki konunun kilidi açıldı.', ' The next topic is unlocked.')
        : L(' Bu bölümü tamamladın!', ' You finished this section!'));
    const scoreEl = host.querySelector('#keScore');
    scoreEl.textContent = `${L('Skor', 'Score')}: ${score.correct} / ${score.total} ⭐`;
    scoreEl.style.display = 'block';
    host.querySelector('#keRewardChip').textContent = `⭐ ${rewardLabel(episode.reward_label)}`;
    const nextBtn = host.querySelector('#keNextEpisodeBtn');
    const hasNext = episode.episode_index + 1 < episode.episode_count;
    nextBtn.textContent = hasNext ? L('Sonraki Konu →', 'Next topic →') : L('Kategoriye Dön', 'Back to category');
    nextBtn.onclick = goToNextEpisode;
    overlay.classList.add('ke-show');
    launchConfetti(host);
    setMascotPose(host, 'celebrate');
  }

  startConversationRound(host, container, episode, mascotEl, onFinished);
}

function setupFullscreen(container) {
  const shell = container.querySelector('.ke-shell');
  const btn = container.querySelector('#keFullscreenBtn');
  if (!shell || !btn || !shell.requestFullscreen) {
    if (btn) btn.style.display = 'none'; // tarayıcı desteklemiyor — buton gizlenir, akış bozulmaz
    return;
  }

  btn.addEventListener('click', () => {
    if (document.fullscreenElement === shell) {
      document.exitFullscreen();
    } else {
      shell.requestFullscreen().catch((e) => {
        console.warn('[kids_english] Tam ekrana geçilemedi:', e.message);
      });
    }
  });

  _fullscreenChangeHandler = () => {
    const isFs = document.fullscreenElement === shell;
    btn.innerHTML = (isFs ? ICON_COMPRESS : ICON_EXPAND)
      + `<span id="keFullscreenLabel">${isFs ? L('Küçült', 'Exit') : L('Tam Ekran', 'Full screen')}</span>`;
    btn.title = isFs ? L('Tam ekrandan çık', 'Exit full screen') : L('Tam ekran', 'Full screen');
  };
  document.addEventListener('fullscreenchange', _fullscreenChangeHandler);
}

// "Şimdi Sen Söyle" aşamasına gelince mikrofon izni ilk kez istenirse
// tarayıcı bunu göstermek için otomatik olarak fullscreen'den ÇIKAR
// (izin diyaloğu tam ekran içinde gösterilemiyor — bir tarayıcı güvenlik
// davranışı, bizim kontrolümüzde değil). Bunu, kategori daha
// başlarken (fullscreen'e hiç girilmemişken) erkenden isteyerek
// çözüyoruz. Reddedilirse sessizce devam edilir.
function primeMicrophonePermission() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;
  try {
    const primer = new SR();
    primer.lang = 'en-US';
    primer.onstart = () => setTimeout(() => { try { primer.abort(); } catch (e) { /* no-op */ } }, 150);
    primer.onerror = () => { /* reddedildi/mikrofon yok — sorun değil */ };
    primer.start();
  } catch (e) { /* no-op */ }
}

// Harita noktaları tıklanabilir: çocuk (ya da test ederken sen) mevcut
// bölümü bitirmeyi beklemeden istediği bölüme atlayabilir, yeni
// kelimeler direkt yüklenir. Gerçek bir ilerleme kilidi değil — bilinçli
// bir esneklik, "Başlangıç noktası" satırındaki aşama-atlama ile aynı ruh.
function renderMap(host, currentIndex, count, onJump, completedSet) {
  const mapRow = host.querySelector('#keMap');
  mapRow.innerHTML = '';
  const done = completedSet || new Set();
  for (let i = 0; i < count; i++) {
    const node = document.createElement('div');
    node.className = 'ke-node';
    const dot = document.createElement('button');
    const isDone = i !== currentIndex && done.has(i);
    let cls = 'ke-dot';
    if (i === currentIndex) cls += ' current';
    else if (isDone) cls += ' done';
    dot.className = cls;
    dot.type = 'button';
    dot.title = L(`Bölüm ${i + 1}'e git`, `Go to episode ${i + 1}`);
    dot.textContent = i === currentIndex ? '★' : (isDone ? '✓' : String(i + 1));
    dot.addEventListener('click', () => onJump(i));
    node.appendChild(dot);
    if (i < count - 1) {
      const line = document.createElement('div');
      line.className = 'ke-line';
      node.appendChild(line);
    }
    mapRow.appendChild(node);
  }
  // Harita artik tam ekranda tek satir yatay kaydirmali (bkz. .ke-shell:
  // fullscreen .ke-map) - aktif bolum ekranin disinda kalabilir, gorunume
  // kaydiriyoruz. Kaydirilmayan (sarma) durumda no-op, zararsiz.
  const currentDot = mapRow.querySelector('.ke-dot.current');
  if (currentDot) currentDot.scrollIntoView({ block: 'nearest', inline: 'center' });
}

// Aktapokus erkek bir karakter — Web Speech API cinsiyet bilgisi
// vermiyor, bu yüzden bilinen erkek seslerin adlarını deniyoruz (OS'e
// göre hangisi mevcutsa o kullanılır). Hiçbiri yoksa tarayıcının
// varsayılan İngilizce sesine düşer — sessizce, hata vermeden.
const MALE_VOICE_HINTS = [
  'Google UK English Male', 'Microsoft David', 'Microsoft Guy',
  'Daniel', 'Alex', 'Fred', 'Male',
];
// ESKIDEN sonuc bir kere hesaplanip (_voiceLookupDone) oturum boyunca
// önbellekte tutulurdu - "bir anda dijital erkek sesine dönüyor" geri
// bildirimi: iOS'ta bellek baskısı altında yuksek kaliteli/gelismis ses
// motoru sessizce tahliye edilebiliyor, elde tutulan ESKİ voice nesnesi
// gecersiz kalinca Safari sessizce jenerik/robotik bir yedek sese
// düşüyor - ve önbellek asla yenilenmediği için bu durum kalıcı oluyordu.
// getVoices() ucuz bir cagri (motorun zaten yukledigi listeyi dondurur),
// bu yuzden her konusmada TAZE seciyoruz - kalici referans tutmuyoruz.
function pickMaleVoice() {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null; // henüz yüklenmedi, bir sonraki çağrıda tekrar denenir
  const enVoices = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
  // İngilizce ses YOKSA voices[0]'a düşmüyoruz: Android'de bu genelde
  // Türkçe/başka dilde bir ses oluyor ve utter.lang ile çelişince cihaz
  // SESSİZ kalıyordu.
  return enVoices.find((v) => MALE_VOICE_HINTS.some((hint) => v.name.includes(hint)))
    || enVoices[0] || null;
}

// Doğru cevap / kelime bulma / cümle tamamlama gibi olumlu anlarda
// maskotu kısaca zıplatıyoruz — Duolingo'nun karakterlerinin her doğru
// cevapta "yaşasın" hareketi yapması gibi, ekranı canlı hissettiriyor.
function celebrateBounce(mascotEl) {
  mascotEl.classList.remove('ke-celebrate');
  void mascotEl.offsetWidth; // reflow — animasyon üst üste tetiklenirse yeniden başlasın
  mascotEl.classList.add('ke-celebrate');
  setTimeout(() => mascotEl.classList.remove('ke-celebrate'), 600);
}

let _soundWarned = false;
function notifySoundProblem(reason) {
  if (_soundWarned) return;
  _soundWarned = true;
  const t = document.createElement('div');
  t.textContent = L('🔇 Ses çalınamadı (' + reason + '). Telefonun Ayarlar > Metin okuma (TTS) bölümünde İngilizce ses yüklü mü? Ana sayfadaki "Ses testi" düğmesini dene.', '🔇 Sound could not play (' + reason + '). Is an English voice installed under Settings > Text-to-speech? Try the "Sound test" button on the home page.');
  t.style.cssText = 'position:fixed;left:12px;right:12px;bottom:14px;z-index:99999;background:#FFEDED;color:#5a1a1a;border:3px solid #FF8B82;border-radius:14px;padding:10px 14px;font:700 13px/1.35 sans-serif;text-align:center;';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 9000);
}

// Android Chrome'da sesin sessizce kaybolmasının bilinen nedenleri:
// (1) cancel()'dan HEMEN sonra speak() çağrısı düşüyor, (2) motor "paused"
// takılı kalabiliyor, (3) utterance referansı tutulmazsa GC yiyor,
// (4) utter.voice dili utter.lang ile çelişirse sessiz kalıyor. Hepsi burada.
function speakWord(word, mascotEl, onDone) {
  if (!('speechSynthesis' in window)) { notifySoundProblem(L('bu tarayıcı sesli okumayı desteklemiyor', 'this browser cannot read aloud')); if (onDone) onDone(); return; }
  const synth = window.speechSynthesis;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    mascotEl.classList.remove('ke-talking');
    if (onDone) onDone();
  };
  const doSpeak = () => {
    if (synth.paused) synth.resume();
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = 'en-US';
    utter.rate = 0.78;
    utter.pitch = 0.85; // erkek karaktere daha yakın, kalın bir ton
    utter.volume = 1;
    const voice = pickMaleVoice();
    if (voice && voice.lang && voice.lang.toLowerCase().startsWith('en')) utter.voice = voice;
    window._keLastUtter = utter;
    utter.onend = finish;
    utter.onerror = (e) => {
      const err = e && e.error;
      if (err && err !== 'canceled' && err !== 'interrupted') notifySoundProblem(err);
      finish();
    };
    synth.speak(utter);
  };
  mascotEl.classList.add('ke-talking');
  if (synth.speaking || synth.pending) {
    synth.cancel();
    setTimeout(doSpeak, 90);
  } else {
    doSpeak();
  }
  setTimeout(finish, 3200);
}

// Telefonda "ses çalışmıyor" durumunda tanı koymak için ana sayfadaki
// "Ses testi" düğmesi: kaç ses/İngilizce ses var, güvenli bağlam mı,
// konuşma başladı mı/hata verdi mi — hepsini ekranda gösteriyor.
function runSoundTest(infoEl) {
  const lines = [];
  const show = () => { infoEl.textContent = lines.join(' • '); };
  if (!('speechSynthesis' in window)) { lines.push(L('❌ Bu tarayıcı sesli okumayı desteklemiyor', '❌ This browser does not support speech')); show(); return; }
  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  const en = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
  lines.push(L('Ses: ', 'Voices: ') + voices.length + L(', İngilizce: ', ', English: ') + en.length + (en[0] ? ' (' + en[0].name + ')' : ''));
  lines.push(L('Mikrofon için HTTPS/localhost: ', 'Mic needs HTTPS/localhost: ') + (window.isSecureContext ? L('evet', 'yes') : L('hayır (Konuşma turu bu bağlantıda çalışmaz)', 'no (Speak round will not work on this connection)')));
  show();
  if (synth.speaking || synth.pending) synth.cancel();
  setTimeout(() => {
    if (synth.paused) synth.resume();
    const u = new SpeechSynthesisUtterance('Hello, I am Aktapokus');
    u.lang = 'en-US';
    u.volume = 1;
    window._keLastUtter = u;
    u.onstart = () => { lines.push(L('▶ konuşma başladı', '▶ speech started')); show(); };
    u.onend = () => { lines.push(L('✅ bitti (duyduysan ses çalışıyor)', '✅ done (if you heard it, sound works)')); show(); };
    u.onerror = (e) => { lines.push('❌ hata: ' + (e && e.error)); show(); };
    synth.speak(u);
    setTimeout(() => { if (lines.every((l) => !l.startsWith('▶') && !l.startsWith('❌'))) { lines.push(L('⚠ 4 sn içinde hiçbir olay gelmedi: cihaz TTS motoru yanıt vermiyor', '⚠ No event in 4 s: the device text-to-speech engine is not responding')); show(); } }, 4000);
  }, 120);
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Faz 0'ın ikinci yarısı: üretim baskısı yok, sadece dinle-tanı (receptive
// recognition) — çocuk kelimeyi duyar, 4 resim arasından doğrusunu seçer.
// İlk yanlışta doğrudan cevap gösterilmez — ikinci bir deneme hakkı
// tanınır. Çocuk 2 FARKLI kelimede ilk denemesinde hata yaparsa, bölüm
// baştan başlatılır (henüz emin değil demektir).
function startQuiz(host, container, episode, wordList, mascotEl, restartEpisode, onDone) {
  const quizEl = host.querySelector('#keQuiz');
  const progressChip = host.querySelector('#keProgress');
  const mainBubbleEl = host.querySelector('#keBubble');
  const quizBubbleEl = host.querySelector('#keQuizBubble');
  const quizProgressEl = host.querySelector('#keQuizProgress');
  const quizWordEl = host.querySelector('#keQuizWord');
  const cardsHost = host.querySelector('#keQuizCards');
  const replayBtn = host.querySelector('#keQuizReplay');
  const askText = L('Şimdi öğrendiklerini deneyelim! Sesi dinle, doğru resmi seç. 🎧', 'Now let us try! Listen and pick the right picture. 🎧');

  progressChip.style.display = 'none';
  mainBubbleEl.style.display = 'none';
  mainBubbleEl.style.opacity = '1'; // keşifte soluklaştırılmış olabilir, sonradan geri gösterilince opak olsun
  host.querySelector('#keWordPopup').classList.remove('ke-show');
  quizBubbleEl.textContent = askText;
  quizEl.classList.add('ke-show');
  mascotEl.classList.add('ke-mascot-compact');
  setMascotPose(host, 'think');

  const order = shuffle(wordList.map((_, i) => i));
  let qIndex = 0;
  let currentCorrectWord = null;
  let currentCorrectObj = null;
  let attempts = 0;
  let correctFirstTry = 0;
  const mistakeWords = new Set();

  function endQuiz() {
    quizEl.classList.remove('ke-show');
    mascotEl.classList.remove('ke-mascot-compact');
    setMascotPose(host, 'idle');
    progressChip.style.display = '';
    mainBubbleEl.style.display = '';
  }

  function lockCards() {
    cardsHost.querySelectorAll('.ke-quiz-card').forEach((c) => { c.disabled = true; });
  }

  function renderQuestion() {
    if (qIndex >= order.length) {
      endQuiz();
      startSpeakRound(host, container, episode, wordList, mascotEl, { correct: correctFirstTry, total: order.length }, onDone);
      return;
    }
    attempts = 0;
    quizProgressEl.textContent = `Soru ${qIndex + 1} / ${order.length}`;
    const correctObj = wordList[order[qIndex]];
    currentCorrectWord = correctObj.word;
    currentCorrectObj = correctObj;
    // Sadece sese güvenmek yerine kelimenin YAZISI da gösteriliyor —
    // "sesle birlikte yazılar da olsun" geri bildirimi (hem dinleme hem
    // okuma pekiştirmesi, sesin çalışmadığı durumlarda da yedek).
    quizWordEl.textContent = currentCorrectWord;

    // Yanlış seçenekler tüm bölüm havuzundan gelebilir (çocuk sahnede
    // onları da gördü) — ama "doğru cevap" olarak sadece keşfettiği
    // kelimeler soruluyor.
    const others = episode.objects.filter((o) => o.word !== correctObj.word);
    const distractors = shuffle(others).slice(0, 3);
    const options = shuffle([correctObj, ...distractors]);

    cardsHost.innerHTML = '';
    options.forEach((opt) => {
      const card = document.createElement('button');
      card.className = 'ke-quiz-card';
      card.dataset.word = opt.word;
      card.innerHTML = renderObjectIcon(opt);
      card.addEventListener('click', () => onAnswer(card, opt));
      cardsHost.appendChild(card);
    });

    speakWord(correctObj.word, mascotEl);
  }

  function onAnswer(card, opt) {
    if (card.disabled) return;
    attempts++;
    const isCorrect = opt.word === currentCorrectWord;

    if (isCorrect) {
      card.classList.add('ke-correct');
      lockCards();
      celebrateBounce(mascotEl);
      if (attempts === 1) {
        correctFirstTry++;
        // İlk denemede doğru = artık biliyor demek — daha önce tekrar
        // kuyruğuna girmişse oradan çıkar.
        Progress.clearMistakes(episode.category_id, [currentCorrectObj.word]);
      }
      quizBubbleEl.textContent = attempts === 1 ? L('Harika, doğru! 🎉', 'Great, correct! 🎉') : L('Bu kez yakaladın! 🎉', 'You got it this time! 🎉');
      setTimeout(() => { quizBubbleEl.textContent = askText; qIndex++; renderQuestion(); }, 800);
      return;
    }

    card.classList.add('ke-wrong');
    card.disabled = true;

    if (attempts === 1) {
      mistakeWords.add(currentCorrectWord);
      Progress.recordMistake(episode.category_id, currentCorrectObj);
      if (mistakeWords.size >= 2) {
        quizBubbleEl.textContent = L('Bunları biraz daha tanıyalım, hep birlikte baştan başlıyoruz! 🔄', 'Let us get to know these better — starting over together! 🔄');
        lockCards();
        setTimeout(() => {
          endQuiz();
          restartEpisode(L('Hadi bu kelimeleri birlikte tekrar keşfedelim! 👆', 'Let us discover these words again together! 👆'));
        }, 1200);
        return;
      }
      quizBubbleEl.textContent = L('Tekrar dene! 💪', 'Try again! 💪');
      return;
    }

    const correctCard = [...cardsHost.children].find((c) => c.dataset.word === currentCorrectWord);
    if (correctCard) correctCard.classList.add('ke-correct');
    lockCards();
    quizBubbleEl.textContent = L(`Bu "${currentCorrectWord}" idi — bir dahakine yakalarsın! 💛`, `That was "${currentCorrectWord}" — you will get it next time! 💛`);
    setTimeout(() => { quizBubbleEl.textContent = askText; qIndex++; renderQuestion(); }, 1000);
  }

  replayBtn.onclick = () => {
    if (currentCorrectWord) speakWord(currentCorrectWord, mascotEl);
  };

  renderQuestion();
}

// Faz 0'ın üçüncü ve son adımı: üretim (production). Çocuk artık sadece
// dinlemiyor/tanımıyor, kelimeyi kendi sesiyle söylüyor. SpeechRecognition
// tarayıcıda yoksa (ör. Firefox) akış hiç kilitlenmiyor — çocuk kendi
// kendine yüksek sesle tekrar eder, "Devam Et" ile ilerler.
function startSpeakRound(host, container, episode, wordList, mascotEl, score, onDone) {
  const speakEl = host.querySelector('#keSpeak');
  const progressChip = host.querySelector('#keProgress');
  const mainBubbleEl = host.querySelector('#keBubble');
  const progressEl = host.querySelector('#keSpeakProgress');
  const iconHost = host.querySelector('#keSpeakIcon');
  const wordEl = host.querySelector('#keSpeakWord');
  const feedbackEl = host.querySelector('#keSpeakFeedback');
  const micBtn = host.querySelector('#keSpeakMic');
  const nextBtn = host.querySelector('#keSpeakNext');
  const replayBtn = host.querySelector('#keSpeakReplay');

  progressChip.style.display = 'none';
  mainBubbleEl.style.display = 'none';
  speakEl.classList.add('ke-show');
  mascotEl.classList.add('ke-mascot-compact');
  setMascotPose(host, 'point');

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SR ? new SR() : null;
  container._keActiveRecognition = recognition;
  if (recognition) {
    recognition.lang = 'en-US';
    // continuous:false — tek-seferlik, kanıtlanmış mod. continuous:true
    // denenmişti ama gerçek tarayıcılarda "hemen kapanıyor" şikayetini
    // çözmedi; aşağıdaki kendi retry mantığımız (onerror/onend + no-speech
    // kontrolü) zaten aynı toleransı daha öngörülebilir şekilde sağlıyor.
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
  }

  const order = wordList.map((_, i) => i);
  let idx = 0;
  let recognizing = false;

  function endSpeak() {
    speakEl.classList.remove('ke-show');
    mascotEl.classList.remove('ke-mascot-compact');
    setMascotPose(host, 'idle');
    progressChip.style.display = '';
    mainBubbleEl.style.display = '';
    if (recognition) { try { recognition.abort(); } catch (e) { /* zaten durmuş olabilir */ } }
    if (container._keActiveRecognition === recognition) container._keActiveRecognition = null;
  }

  function renderItem() {
    if (idx >= order.length) {
      endSpeak();
      startSentenceRound(host, container, episode, wordList, mascotEl, score, onDone);
      return;
    }
    const obj = wordList[order[idx]];
    progressEl.textContent = `${L('Kelime', 'Word')} ${idx + 1} / ${order.length}`;
    iconHost.innerHTML = renderObjectIcon(obj);
    wordEl.textContent = obj.word;
    feedbackEl.textContent = '';
    nextBtn.style.display = 'none';
    micBtn.disabled = false;
    micBtn.classList.remove('ke-listening');
    micBtn.textContent = L('🎤 Söyle', '🎤 Say it');
    if (recognition && window.isSecureContext) {
      micBtn.style.display = 'inline-flex';
    } else {
      micBtn.style.display = 'none';
      feedbackEl.textContent = recognition
        ? L('Mikrofon için güvenli (https) bağlantı gerekir — yüksek sesle söyle, sonra devam et! 🗣️', 'The microphone needs a secure (https) connection — say it out loud, then continue! 🗣️')
        : L('Mikrofon algılama bu tarayıcıda yok — yüksek sesle söyle, sonra devam et! 🗣️', 'No voice detection in this browser — say it out loud, then continue! 🗣️');
      nextBtn.style.display = 'inline-block';
    }
    speakWord(obj.word, mascotEl);
  }

  micBtn.onclick = () => {
    if (!recognition || recognizing) return;
    recognizing = true;
    micBtn.classList.add('ke-listening');
    micBtn.textContent = L('🎙️ Dinliyorum...', '🎙️ Listening...');
    feedbackEl.textContent = '';

    const target = wordList[order[idx]].word.toLowerCase();
    let handled = false;
    let restartsLeft = 2;
    const deadline = Date.now() + 7000;

    // errCode: gerçek tarayıcı hatası (varsa) — "no-speech" (çocuk henüz
    // konuşmamış, normal) dışındaki kodlar genelde İZİN/DONANIM sorunu
    // demektir ve tekrar denemekle çözülmez; bunu ekranda görünür kılmak
    // "hemen duyamadım diyor" şikayetinin gerçek nedenini (izin mi,
    // donanım mı, gerçekten sessizlik mi) ayırt etmemizi sağlıyor.
    const finishAttempt = (success, heard, errCode) => {
      if (handled) return;
      handled = true;
      recognizing = false;
      micBtn.classList.remove('ke-listening');
      micBtn.textContent = L('🎤 Söyle', '🎤 Say it');
      if (success) {
        feedbackEl.textContent = L('Harika telaffuz! 🎉', 'Great pronunciation! 🎉');
        celebrateBounce(mascotEl);
      } else if (errCode === 'not-allowed' || errCode === 'service-not-allowed' || errCode === 'permission-denied') {
        feedbackEl.textContent = L('Mikrofon izni verilmemiş — tarayıcının adres çubuğundaki 🔒 simgesine tıklayıp mikrofona izin ver, sonra tekrar dene. 🔒', 'Microphone is blocked — tap the 🔒 icon in the address bar, allow the microphone, then try again. 🔒');
      } else if (errCode === 'audio-capture') {
        feedbackEl.textContent = L('Mikrofon bulunamadı — cihazında bağlı bir mikrofon olduğundan emin ol. 🎙️', 'No microphone found — make sure your device has one. 🎙️');
      } else if (errCode === 'network') {
        feedbackEl.textContent = L('Bağlantı sorunu oldu, tekrar dener misin? 🌐', 'Connection problem — can you try again? 🌐');
      } else if (heard) {
        feedbackEl.textContent = L(`Sen "${heard}" dedin gibi — tekrar dener misin? 💪`, `It sounded like "${heard}" — try again? 💪`);
      } else {
        feedbackEl.textContent = L('Seni duyamadım, tekrar dener misin? 🎧', 'I could not hear you — try again? 🎧')
          + (errCode ? ` (${errCode})` : '');
      }
      nextBtn.style.display = 'inline-block';
    };

    // Web Speech API'nin bilinen bir tuhaflığı: recognition.start()'ı
    // onend/onerror içinde SENKRON çağırmak "InvalidStateError" fırlatır
    // — sessizce yakalanıp anında başarısız sonuca yol açıyordu. Kısa
    // bir setTimeout ile erteleyerek tarayıcıya nefes alacak zaman
    // veriyoruz.
    let restarting = false;
    const tryRestart = () => {
      if (restarting || restartsLeft <= 0 || Date.now() >= deadline) return false;
      restarting = true;
      restartsLeft--;
      setTimeout(() => {
        restarting = false;
        if (handled) return;
        try { recognition.start(); } catch (err) { finishAttempt(false, null); }
      }, 120);
      return true;
    };

    recognition.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      const heard = (last[0].transcript || '').toLowerCase().trim();
      finishAttempt(heard.includes(target), heard);
    };
    recognition.onerror = (e) => {
      if (e.error === 'no-speech' && tryRestart()) return;
      finishAttempt(false, null, e.error);
    };
    recognition.onend = () => {
      if (handled || restarting) return;
      if (tryRestart()) return;
      finishAttempt(false, null);
    };

    try {
      recognition.start();
    } catch (e) {
      finishAttempt(false, null);
    }

    setTimeout(() => {
      if (!handled) { try { recognition.stop(); } catch (e) { /* no-op */ } finishAttempt(false, null); }
    }, 7300);
  };

  replayBtn.onclick = () => {
    speakWord(wordList[order[idx]].word, mascotEl);
  };

  nextBtn.onclick = () => { idx++; renderItem(); };

  renderItem();
}

// Faz 1: basit cümle kurma. Her kelime için kategoriye uygun bir kalıpla
// üretilmiş basit bir cümle var (bkz. scripts/build_episodes.py). Çocuk
// kelime "taş"larına İSTEDİĞİ SIRADA dokunur — her dokunuş bir SONRAKİ
// boş kutuyu (doğru ya da yanlış farketmeksizin) doldurur, böylece
// hatalı bir dizilim de kurulabilir ("mutlaka doğruları seçmem
// gerekiyor" geri bildirimi üzerine — eski sürüm sadece sıradaki doğru
// kelimeyi kabul ediyordu, yanlış dokunuş hiçbir şey yapmıyordu). Tüm
// kutular dolunca "Kontrol Et" ile onaylanır: doğruysa kutlama, yanlışsa
// kutular titrer + "Tekrar dene" mesajı, taşlar bankaya geri döner.
// "Baştan Başla" her an kutuları sıfırlar. Ceza/restart yok (bu, quiz'in
// mastery-gate'inden farklı, daha düşük riskli bir alıştırma). Cümle
// tamamlanınca Aktapokus tüm cümleyi sesli okur.
// Baslarda bu fonksiyon baska bir kartin TUM "word" alanini tek bir
// yanilti karo olarak donduruyordu - GET/Travel Talk gibi "word" alani
// TAM CUMLE olan kategorilerde (ornek: "I get a new bike") bu, diger
// tum karolardan kat kat buyuk, garip gorunen tek bir dev karo
// yaratiyordu ("aşırı büyük yanıltıcı kutucuk" geri bildirimi). Duzeltme:
// diger kartlarin cumlelerini de KELIME KELIME boluyoruz ve havuzdan TEK
// bir kelime seciyoruz - boylece yanilti karo her zaman diger karolarla
// ayni boyut sinifinda kaliyor (tek-kelimelik kategorilerde davranis
// zaten aynen once oldugu gibi kaliyor, cunku "word" zaten tek kelime).
function pickDistractorWord(tokens, wordList, currentWord) {
  const clean = (s) => s.toLowerCase().replace(/[.,!?]/g, '');
  const tokenSet = new Set(tokens.map(clean));
  const pool = [];
  const seen = new Set();
  wordList.forEach((o) => {
    if (clean(o.word) === clean(currentWord)) return;
    String(o.word || '').split(' ').forEach((w) => {
      const c = clean(w);
      if (c && !tokenSet.has(c) && !seen.has(c)) { seen.add(c); pool.push(w); }
    });
  });
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Harf-kutucuklu kelime tamamlama: her kelimenin/kalibin ILK harfi ipucu
// olarak acik geliyor, geri kalan harfler karisik bir bankadan (dogru
// harfler + birkac yanilti harf) sirayla doldurulacak. "Kelime bankasindan
// tahmin etme" degil "hatirlama" testi - boslugu/noktalamayi tahmin
// ettirmiyoruz, sadece gercek harfleri. #keSentence overlay'ini
// (startSentenceRound ile AYNI DOM/CSS) yeniden kullanir.
function startLetterRound(host, container, episode, wordList, mascotEl, score, onDone) {
  const sEl = host.querySelector('#keSentence');
  const progressChip = host.querySelector('#keProgress');
  const mainBubbleEl = host.querySelector('#keBubble');
  const bubbleEl = host.querySelector('#keSentenceBubble');
  const progressEl = host.querySelector('#keSentenceProgress');
  const slotsEl = host.querySelector('#keSentenceSlots');
  const bankEl = host.querySelector('#keSentenceBank');
  const actionsEl = host.querySelector('#keSentenceActions');
  const checkBtn = host.querySelector('#keSentenceCheck');
  const resetBtn = host.querySelector('#keSentenceReset');
  const askText = L('İlk harfler hazır! Kalan harflere dokunup kelimeyi tamamla. ✏️', 'The first letters are ready! Tap the letters to finish the word. ✏️');

  progressChip.style.display = 'none';
  mainBubbleEl.style.display = 'none';
  bubbleEl.textContent = askText;
  sEl.classList.add('ke-show');
  mascotEl.classList.add('ke-mascot-compact');
  setMascotPose(host, 'think');

  const order = wordList.map((_, i) => i);
  let idx = 0;

  function endLetterRound() {
    sEl.classList.remove('ke-show');
    mascotEl.classList.remove('ke-mascot-compact');
    setMascotPose(host, 'idle');
    progressChip.style.display = '';
    mainBubbleEl.style.display = '';
  }

  function renderItem() {
    if (idx >= order.length) {
      endLetterRound();
      showCelebration(host, container, episode, wordList, score, onDone);
      return;
    }
    const obj = wordList[order[idx]];
    const target = obj.word;
    const isLetter = (c) => /[a-zA-Z]/.test(c);
    let firstOfWord = true;
    const plan = [...target].map((c) => {
      if (c === ' ') { firstOfWord = true; return { c, fixed: true, hint: false }; }
      if (!isLetter(c)) return { c, fixed: true, hint: false };
      const hint = firstOfWord; firstOfWord = false;
      return { c, fixed: false, hint };
    });

    progressEl.textContent = `${L('Kelime', 'Word')} ${idx + 1} / ${order.length}`;
    bubbleEl.textContent = askText;
    const iconEl = host.querySelector('#keSentenceIcon');
    if (iconEl) iconEl.innerHTML = renderObjectIcon(obj);
    speakWord(target, mascotEl);

    slotsEl.innerHTML = '';
    plan.forEach((p) => {
      const slot = document.createElement('div');
      slot.className = 'ke-slot ke-letter-slot';
      if (p.c === ' ') {
        slot.classList.add('ke-slot-gap');
      } else if (p.fixed) {
        slot.textContent = p.c; slot.classList.add('ke-filled', 'ke-fixed');
      } else if (p.hint) {
        slot.textContent = p.c.toUpperCase(); slot.classList.add('ke-filled', 'ke-hint');
      }
      slotsEl.appendChild(slot);
    });

    const blanks = plan.map((p, i) => ({ ...p, i })).filter((p) => !p.fixed && !p.hint);
    actionsEl.style.display = 'none';
    checkBtn.disabled = true;

    let wrongAttempts = 0;
    const filled = new Array(blanks.length).fill(null);

    function renderSlots() {
      blanks.forEach((b, bi) => {
        const slot = slotsEl.children[b.i];
        const it = filled[bi];
        if (it) { slot.textContent = it.ch.toUpperCase(); slot.classList.add('ke-filled'); }
        else { slot.textContent = ''; slot.classList.remove('ke-filled'); }
      });
      const cnt = filled.filter(Boolean).length;
      const full = cnt === blanks.length;
      actionsEl.style.display = cnt ? 'flex' : 'none';
      checkBtn.disabled = !full;
      checkBtn.style.display = full ? '' : 'none';
    }
    function freeAt(bi) {
      const it = filled[bi];
      if (it) { it.tile.classList.remove('ke-used'); filled[bi] = null; }
    }
    function resetSlots() { filled.forEach((_, bi) => freeAt(bi)); renderSlots(); }

    slotsEl.querySelectorAll('.ke-letter-slot:not(.ke-fixed):not(.ke-hint)').forEach((slot, bi) => {
      slot.addEventListener('click', () => { freeAt(bi); renderSlots(); });
    });

    const correctLetters = blanks.map((b) => b.c.toLowerCase());
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('').filter((c) => !correctLetters.includes(c));
    const decoyCount = Math.min(4, Math.max(2, Math.ceil(correctLetters.length * 0.4)));
    const decoys = shuffle(alphabet).slice(0, decoyCount);
    const bankItems = shuffle([...correctLetters, ...decoys]);

    bankEl.innerHTML = '';
    bankItems.forEach((ch) => {
      const tile = document.createElement('button');
      tile.className = 'ke-tile ke-letter-tile';
      tile.textContent = ch.toUpperCase();
      tile.addEventListener('click', () => {
        if (tile.classList.contains('ke-used')) return;
        const emptyMatch = filled.findIndex((f, i) => !f && blanks[i].c.toLowerCase() === ch);
        const target_i = emptyMatch >= 0 ? emptyMatch : filled.findIndex((f) => !f);
        if (target_i < 0) return;
        filled[target_i] = { tile, ch };
        tile.classList.add('ke-used');
        renderSlots();
      });
      bankEl.appendChild(tile);
    });

    resetBtn.onclick = resetSlots;

    checkBtn.onclick = () => {
      const isCorrect = filled.every((f, bi) => f && f.ch.toLowerCase() === blanks[bi].c.toLowerCase());
      if (isCorrect) {
        checkBtn.disabled = true;
        bubbleEl.textContent = L('Harika, doğru kelime! 🎉', 'Great, correct word! 🎉');
        celebrateBounce(mascotEl);
        speakWord(target, mascotEl);
        setTimeout(() => { idx++; renderItem(); }, 1300);
      } else if (++wrongAttempts >= 2) {
        checkBtn.disabled = true;
        blanks.forEach((b) => {
          const slot = slotsEl.children[b.i];
          slot.textContent = b.c.toUpperCase(); slot.classList.add('ke-reveal');
        });
        bubbleEl.textContent = L(`Doğru kelime: ${target} 💡`, `The correct word: ${target} 💡`);
        try { Progress.recordMistake(episode.category_id, obj); } catch (e) { /* yok say */ }
        speakWord(target, mascotEl);
        setTimeout(() => { idx++; renderItem(); }, 3200);
      } else {
        bubbleEl.textContent = L('Bu değil, tekrar dene! 🔄', 'Not quite — try again! 🔄');
        checkBtn.disabled = true;
        [...slotsEl.children].forEach((s) => s.classList.add('ke-shake'));
        setTimeout(() => {
          [...slotsEl.children].forEach((s) => s.classList.remove('ke-shake'));
          bubbleEl.textContent = askText;
          resetSlots();
        }, 800);
      }
    };
  }

  renderItem();
}

function startSentenceRound(host, container, episode, wordList, mascotEl, score, onDone) {
  const sEl = host.querySelector('#keSentence');
  const progressChip = host.querySelector('#keProgress');
  const mainBubbleEl = host.querySelector('#keBubble');
  const bubbleEl = host.querySelector('#keSentenceBubble');
  const progressEl = host.querySelector('#keSentenceProgress');
  const slotsEl = host.querySelector('#keSentenceSlots');
  const bankEl = host.querySelector('#keSentenceBank');
  const actionsEl = host.querySelector('#keSentenceActions');
  const checkBtn = host.querySelector('#keSentenceCheck');
  const resetBtn = host.querySelector('#keSentenceReset');
  const askText = L('Kelimelere dokun, cümleyi doldur, sonra Kontrol Et! Yanlış olanı silmek için kutuya dokun. 🧩', 'Tap the words to fill the sentence, then press Check! Tap a filled box to remove a word. 🧩');

  progressChip.style.display = 'none';
  mainBubbleEl.style.display = 'none';
  bubbleEl.textContent = askText;
  sEl.classList.add('ke-show');
  mascotEl.classList.add('ke-mascot-compact');
  setMascotPose(host, 'write');

  const order = wordList.map((_, i) => i);
  let idx = 0;

  function endSentenceRound() {
    sEl.classList.remove('ke-show');
    mascotEl.classList.remove('ke-mascot-compact');
    setMascotPose(host, 'idle');
    progressChip.style.display = '';
    mainBubbleEl.style.display = '';
  }

  function startDialogueRound() {
    const dl = episode.dialogues;
    let di = 0;
    function showDialogue() {
      if (di >= dl.length) {
        endSentenceRound();
        startLetterRound(host, container, episode, wordList, mascotEl, score, onDone);
        return;
      }
      const dlg = dl[di];
      let wrong = 0;
      let done = false;
      progressEl.textContent = `${L('Diyalog', 'Dialogue')} ${di + 1} / ${dl.length}`;
      bubbleEl.textContent = `🗣️ ${dlg.q}`;
      const iconEl = host.querySelector('#keSentenceIcon');
      if (iconEl) iconEl.innerHTML = renderObjectIcon({ icon_type: 'photo', icon: dlg.icon, word: dlg.q, tr: '' });
      slotsEl.innerHTML = '';
      const slot = document.createElement('div');
      slot.className = 'ke-slot';
      slot.style.minWidth = '220px';
      slotsEl.appendChild(slot);
      actionsEl.style.display = 'none';
      bankEl.innerHTML = '';
      speakWord(dlg.q, mascotEl);
      const next = (ms) => setTimeout(() => { di++; showDialogue(); }, ms);
      shuffle([dlg.answer, ...dlg.wrong]).forEach((text) => {
        const tile = document.createElement('button');
        tile.className = 'ke-tile';
        tile.textContent = text;
        tile.addEventListener('click', () => {
          if (done) return;
          if (text === dlg.answer) {
            done = true;
            slot.textContent = text; slot.classList.add('ke-reveal');
            bubbleEl.textContent = L('Harika cevap! 🎉', 'Great answer! 🎉');
            celebrateBounce(mascotEl);
            speakWord(text, mascotEl);
            next(1300);
          } else {
            wrong++;
            tile.disabled = true; tile.style.opacity = '.35';
            if (wrong >= 2) {
              done = true;
              slot.textContent = dlg.answer; slot.classList.add('ke-reveal');
              bubbleEl.textContent = L(`Doğru cevap: ${dlg.answer} 💡`, `The correct answer: ${dlg.answer} 💡`);
              speakWord(dlg.answer, mascotEl);
              next(3200);
            } else {
              bubbleEl.textContent = L('Bu değil, tekrar dene! 🔄', 'Not quite — try again! 🔄');
            }
          }
        });
        bankEl.appendChild(tile);
      });
    }
    showDialogue();
  }

  function renderItem() {
    if (idx >= order.length) {
      if (episode.dialogues && episode.dialogues.length) { startDialogueRound(); return; }
      endSentenceRound();
      startLetterRound(host, container, episode, wordList, mascotEl, score, onDone);
      return;
    }
    const obj = wordList[order[idx]];
    const tokens = (obj.sentence || `${obj.word}.`).split(' ');
    progressEl.textContent = `${L('Cümle', 'Sentence')} ${idx + 1} / ${order.length}`;
    bubbleEl.textContent = askText;
    const iconEl = host.querySelector('#keSentenceIcon');
    if (iconEl) iconEl.innerHTML = renderObjectIcon(obj);

    slotsEl.innerHTML = '';
    tokens.forEach(() => {
      const slot = document.createElement('div');
      slot.className = 'ke-slot';
      slotsEl.appendChild(slot);
    });
    actionsEl.style.display = 'none';
    checkBtn.disabled = true;

    // Doldurma sırası artık DOĞRU sıraya bağlı değil — her dokunuş,
    // hangi taşa basıldıysa (doğru ya da tuzak), bir sonraki BOŞ kutuyu
    // doldurur. Çocuk tamamen kendi sırasını kurabilir; doğruluk sadece
    // "Kontrol Et"e basılınca değerlendirilir.
    let wrongAttempts = 0;
    const slotItems = new Array(tokens.length).fill(null);
    const slotEls0 = () => [...slotsEl.children];

    function renderSlots() {
      slotEls0().forEach((slot, i) => {
        const it = slotItems[i];
        slot.textContent = it ? it.tok.text : '';
        if (it) slot.dataset.origIndex = String(it.tok.origIndex); else slot.removeAttribute('data-orig-index');
        slot.classList.toggle('ke-filled', !!it);
      });
      const cnt = slotItems.filter(Boolean).length;
      const full = cnt === tokens.length;
      actionsEl.style.display = cnt ? 'flex' : 'none';
      checkBtn.disabled = !full;
      checkBtn.style.display = full ? '' : 'none';
    }
    function freeItem(i) {
      const it = slotItems[i];
      if (it) { it.tile.classList.remove('ke-used'); slotItems[i] = null; }
    }
    function placeTile(tile, tok, i) {
      freeItem(i);
      slotItems[i] = { tile, tok };
      tile.classList.add('ke-used');
    }
    function resetSlots() {
      slotItems.forEach((_, i) => freeItem(i));
      renderSlots();
    }

    // Surukle-birak (dokunmatik + fare): kelime karti ya da dolu kutu
    // baska bir kutuya birakilabilir; tiklama/dokunma da calisir.
    function slotIndexAt(x, y) {
      const el = document.elementFromPoint(x, y);
      const slot = el && el.closest ? el.closest('.ke-slot') : null;
      return slot ? slotEls0().indexOf(slot) : -1;
    }
    function startDrag(ev, label, onDrop, onTap) {
      if (ev.button !== undefined && ev.button > 0) return;
      const sx = ev.clientX, sy = ev.clientY;
      let ghost = null, moved = false;
      const move = (e) => {
        if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) {
          moved = true;
          ghost = document.createElement('div');
          ghost.className = 'ke-tile ke-drag-ghost';
          ghost.textContent = label;
          document.body.appendChild(ghost);
        }
        if (ghost) { ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; e.preventDefault(); }
      };
      const up = (e) => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', up);
        if (ghost) ghost.remove();
        if (moved) onDrop(slotIndexAt(e.clientX, e.clientY)); else onTap();
      };
      document.addEventListener('pointermove', move, { passive: false });
      document.addEventListener('pointerup', up);
      document.addEventListener('pointercancel', up);
    }

    slotEls0().forEach((slot, i) => {
      slot.addEventListener('pointerdown', (ev) => {
        if (!slotItems[i]) return;
        ev.preventDefault();
        startDrag(ev, slotItems[i].tok.text,
          (j) => {
            if (j >= 0 && j !== i) { const t = slotItems[i]; slotItems[i] = slotItems[j]; slotItems[j] = t; }
            else if (j < 0) freeItem(i);
            renderSlots();
          },
          () => { freeItem(i); renderSlots(); });
      });
    });

    const bankItems = tokens.map((text, origIndex) => ({ text, origIndex }));
    const distractorWord = pickDistractorWord(tokens, wordList, obj.word);
    if (distractorWord) bankItems.push({ text: distractorWord, origIndex: -1 });
    const shuffled = shuffle(bankItems);
    bankEl.innerHTML = '';
    shuffled.forEach((tok) => {
      const tile = document.createElement('button');
      tile.className = 'ke-tile';
      tile.textContent = tok.text;
      tile.addEventListener('pointerdown', (ev) => {
        if (tile.classList.contains('ke-used')) return;
        startDrag(ev, tok.text,
          (j) => { if (j >= 0) { placeTile(tile, tok, j); renderSlots(); } },
          () => {
            const j = slotItems.indexOf(null);
            if (j >= 0) { placeTile(tile, tok, j); renderSlots(); }
          });
      });
      tile.addEventListener('click', (e) => e.preventDefault());
      bankEl.appendChild(tile);
    });

    resetBtn.onclick = resetSlots;

    checkBtn.onclick = () => {
      const slotEls = [...slotsEl.children];
      const isCorrect = slotEls.every((s, i) => Number(s.dataset.origIndex) === i);
      if (isCorrect) {
        checkBtn.disabled = true;
        bubbleEl.textContent = L('Harika cümle! 🎉', 'Great sentence! 🎉');
        celebrateBounce(mascotEl);
        speakWord(obj.sentence, mascotEl);
        setTimeout(() => { idx++; renderItem(); }, 1300);
      } else if (++wrongAttempts >= 2) {
        checkBtn.disabled = true;
        slotEls.forEach((sl, i) => { sl.textContent = tokens[i]; sl.classList.remove('ke-filled'); sl.classList.add('ke-reveal'); });
        bubbleEl.textContent = L(`Doğru cümle: ${obj.sentence} 💡`, `The correct sentence: ${obj.sentence} 💡`);
        try { Progress.recordMistake(episode.category_id, obj); } catch (e) { /* yok say */ }
        speakWord(obj.sentence, mascotEl);
        setTimeout(() => { idx++; renderItem(); }, 3200);
      } else {
        bubbleEl.textContent = L('Bu değil, tekrar dene! 🔄', 'Not quite — try again! 🔄');
        checkBtn.disabled = true;
        slotEls.forEach((s) => s.classList.add('ke-shake'));
        setTimeout(() => {
          slotEls.forEach((s) => s.classList.remove('ke-shake'));
          bubbleEl.textContent = askText;
          resetSlots();
        }, 800);
      }
    };
  }

  renderItem();
}

// Konuşma bölümü: Aktapokus episode.conversation'daki her soruyu sırayla
// sorar (TTS), öğrenci cevabı kelime-taşlarıyla kurar — mekanik
// startSentenceRound'un slot/tuzak-kelime/sürükle-bırak mantığının aynısı,
// ama tek bir cümle yerine art arda gelen bir soru-cevap ZİNCİRİ (gerçek
// bir konuşma hissi versin diye tek seferlik izole kartlar değil).
function startConversationRound(host, container, episode, mascotEl, onFinished) {
  const bubbleEl = host.querySelector('#keSentenceBubble');
  const progressEl = host.querySelector('#keSentenceProgress');
  const slotsEl = host.querySelector('#keSentenceSlots');
  const bankEl = host.querySelector('#keSentenceBank');
  const actionsEl = host.querySelector('#keSentenceActions');
  const checkBtn = host.querySelector('#keSentenceCheck');
  const resetBtn = host.querySelector('#keSentenceReset');

  mascotEl.classList.add('ke-mascot-compact');
  setMascotPose(host, 'write');

  const turns = episode.conversation;
  let idx = 0;
  let correctFirstTry = 0;

  function renderTurn() {
    if (idx >= turns.length) {
      mascotEl.classList.remove('ke-mascot-compact');
      setMascotPose(host, 'idle');
      onFinished({ correct: correctFirstTry, total: turns.length });
      return;
    }
    const turn = turns[idx];
    const tokens = turn.a.split(' ');
    let firstTry = true;
    progressEl.textContent = `${L('Konuşma', 'Conversation')} ${idx + 1} / ${turns.length}`;
    bubbleEl.textContent = `🗣️ ${turn.q}`;
    speakWord(turn.q, mascotEl);

    slotsEl.innerHTML = '';
    tokens.forEach(() => {
      const slot = document.createElement('div');
      slot.className = 'ke-slot';
      slotsEl.appendChild(slot);
    });
    actionsEl.style.display = 'none';
    checkBtn.disabled = true;

    let wrongAttempts = 0;
    const slotItems = new Array(tokens.length).fill(null);
    const slotEls0 = () => [...slotsEl.children];

    function renderSlots() {
      slotEls0().forEach((slot, i) => {
        const it = slotItems[i];
        slot.textContent = it ? it.tok.text : '';
        if (it) slot.dataset.origIndex = String(it.tok.origIndex); else slot.removeAttribute('data-orig-index');
        slot.classList.toggle('ke-filled', !!it);
      });
      const cnt = slotItems.filter(Boolean).length;
      const full = cnt === tokens.length;
      actionsEl.style.display = cnt ? 'flex' : 'none';
      checkBtn.disabled = !full;
      checkBtn.style.display = full ? '' : 'none';
    }
    function freeItem(i) {
      const it = slotItems[i];
      if (it) { it.tile.classList.remove('ke-used'); slotItems[i] = null; }
    }
    function placeTile(tile, tok, i) {
      freeItem(i);
      slotItems[i] = { tile, tok };
      tile.classList.add('ke-used');
    }
    function resetSlots() {
      slotItems.forEach((_, i) => freeItem(i));
      renderSlots();
    }

    function slotIndexAt(x, y) {
      const el = document.elementFromPoint(x, y);
      const slot = el && el.closest ? el.closest('.ke-slot') : null;
      return slot ? slotEls0().indexOf(slot) : -1;
    }
    function startDrag(ev, label, onDrop, onTap) {
      if (ev.button !== undefined && ev.button > 0) return;
      const sx = ev.clientX, sy = ev.clientY;
      let ghost = null, moved = false;
      const move = (e) => {
        if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) {
          moved = true;
          ghost = document.createElement('div');
          ghost.className = 'ke-tile ke-drag-ghost';
          ghost.textContent = label;
          document.body.appendChild(ghost);
        }
        if (ghost) { ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; e.preventDefault(); }
      };
      const up = (e) => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', up);
        if (ghost) ghost.remove();
        if (moved) onDrop(slotIndexAt(e.clientX, e.clientY)); else onTap();
      };
      document.addEventListener('pointermove', move, { passive: false });
      document.addEventListener('pointerup', up);
      document.addEventListener('pointercancel', up);
    }

    slotEls0().forEach((slot, i) => {
      slot.addEventListener('pointerdown', (ev) => {
        if (!slotItems[i]) return;
        ev.preventDefault();
        startDrag(ev, slotItems[i].tok.text,
          (j) => {
            if (j >= 0 && j !== i) { const t = slotItems[i]; slotItems[i] = slotItems[j]; slotItems[j] = t; }
            else if (j < 0) freeItem(i);
            renderSlots();
          },
          () => { freeItem(i); renderSlots(); });
      });
    });

    const bankItems = tokens.map((text, origIndex) => ({ text, origIndex }));
    const otherAnswers = turns.filter((_, i) => i !== idx).map((t) => ({ word: t.a }));
    const distractorWord = pickDistractorWord(tokens, otherAnswers, turn.a);
    if (distractorWord) bankItems.push({ text: distractorWord, origIndex: -1 });
    const shuffled = shuffle(bankItems);
    bankEl.innerHTML = '';
    shuffled.forEach((tok) => {
      const tile = document.createElement('button');
      tile.className = 'ke-tile';
      tile.textContent = tok.text;
      tile.addEventListener('pointerdown', (ev) => {
        if (tile.classList.contains('ke-used')) return;
        startDrag(ev, tok.text,
          (j) => { if (j >= 0) { placeTile(tile, tok, j); renderSlots(); } },
          () => {
            const j = slotItems.indexOf(null);
            if (j >= 0) { placeTile(tile, tok, j); renderSlots(); }
          });
      });
      tile.addEventListener('click', (e) => e.preventDefault());
      bankEl.appendChild(tile);
    });

    resetBtn.onclick = resetSlots;

    checkBtn.onclick = () => {
      const slotEls = [...slotsEl.children];
      const isCorrect = slotEls.every((s, i) => Number(s.dataset.origIndex) === i);
      if (isCorrect) {
        checkBtn.disabled = true;
        if (firstTry) correctFirstTry++;
        bubbleEl.textContent = L('Harika cevap! 🎉', 'Great answer! 🎉');
        celebrateBounce(mascotEl);
        speakWord(turn.a, mascotEl);
        setTimeout(() => { idx++; renderTurn(); }, 1300);
      } else if (++wrongAttempts >= 2) {
        firstTry = false;
        checkBtn.disabled = true;
        slotEls.forEach((sl, i) => { sl.textContent = tokens[i]; sl.classList.remove('ke-filled'); sl.classList.add('ke-reveal'); });
        bubbleEl.textContent = L(`Doğru cevap: ${turn.a} 💡`, `The correct answer: ${turn.a} 💡`);
        speakWord(turn.a, mascotEl);
        setTimeout(() => { idx++; renderTurn(); }, 3200);
      } else {
        firstTry = false;
        bubbleEl.textContent = L('Bu değil, tekrar dene! 🔄', 'Not quite — try again! 🔄');
        checkBtn.disabled = true;
        slotEls.forEach((s) => s.classList.add('ke-shake'));
        setTimeout(() => {
          slotEls.forEach((s) => s.classList.remove('ke-shake'));
          bubbleEl.textContent = `🗣️ ${turn.q}`;
          resetSlots();
        }, 800);
      }
    };
  }

  renderTurn();
}

function showCelebration(host, container, episode, wordList, score, onDone) {
  if (episode.isReview) {
    Progress.clearMistakes(episode.category_id, wordList.map((o) => o.word));
  } else {
    Progress.markComplete(episode.category_id, episode.episode_index);
  }
  try { DailyGoal.add(wordList.length); } catch (e) { /* yok say */ }
  const overlay = host.querySelector('#keCelebration');
  host.querySelector('#keCelebrationText').textContent = episode.isReview
    ? L(`${wordList.length} kelimeyi tekrar ettin — artık daha iyi biliyorsun! 💪`, `You reviewed ${wordList.length} words — you know them better now! 💪`)
    : L(`${wordList.length} yeni İngilizce kelime öğrendin.`, `You learned ${wordList.length} new English words.`)
      + (episode.episode_index + 1 < episode.episode_count
        ? L(' Bir sonraki bölümün kilidi açıldı.', ' The next episode is unlocked.')
        : L(' Bu kategoriyi tamamladın!', ' You finished this category!'));
  const scoreEl = host.querySelector('#keScore');
  if (score) {
    scoreEl.textContent = `${L('Skor', 'Score')}: ${score.correct} / ${score.total} ⭐`;
    scoreEl.style.display = 'block';
  } else {
    scoreEl.style.display = 'none';
  }
  host.querySelector('#keRewardChip').textContent = `⭐ ${rewardLabel(episode.reward_label)}`;

  const nextBtn = host.querySelector('#keNextEpisodeBtn');
  const hasNext = episode.episode_index + 1 < episode.episode_count;
  nextBtn.textContent = hasNext ? L('Sonraki Bölüm →', 'Next episode →') : L('Kategoriye Dön', 'Back to category');
  nextBtn.onclick = onDone;

  overlay.classList.add('ke-show');
  launchConfetti(host);

  // Büyük final kutlamasında Aktapokus'un "Excellent work!" pozunu
  // (6 kollu çift işaret) göster — küçük ke-celebrate zıplamalarında
  // (kelime keşfi, doğru cevap vb.) hâlâ normal duruş kullanılıyor,
  // sadece bölüm/kategori bitince bu özel poz devreye giriyor.
  setMascotPose(host, 'celebrate');
}

function launchConfetti(host) {
  const confHost = host.querySelector('#keConfettiHost');
  // Renkli tebeşir konfetisi — kutlama artık koyu tahta zemininde,
  // eski canlı plastik renkler yerine tebeşir tonları kullanılıyor.
  const colors = ['#F5F0DF', '#FFD75A', '#6EC8FF', '#85D98A', '#C8A2FF'];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'ke-confetti';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = (2.5 + Math.random() * 2) + 's';
    piece.style.animationDelay = (Math.random() * 0.6) + 's';
    confHost.appendChild(piece);
    setTimeout(() => piece.remove(), 5000);
  }
}

// Odul oyunu: "15 dakika kesintisiz ders -> 1 oyun hakki" (bkz.
// GameTokens/startContinuousStudyTracking). River Raid ilhamli, tekne
// nehir boyunca ilerliyor, kayalardan kaciyor, yakit topluyor, balonlari
// vurup puan kazaniyor. canvas 2D, disaridan kutuphane yok.
// "15 dakika kesintisiz calisma" esigi gecilince DOGRUDAN oyun hakki
// verilmez - once bu kucuk hatirlatma sinavini gecmek gerekir
// ("ogrenmeye tesvik edelim" geri bildirimi). Rastgele bir kategoriden
// 5 kelime cekilir, cocuk her biri icin dogru Turkce ceviriyi secer.
// En az 3/5 dogru -> 1 oyun hakki. Basarisizsa yeni bir kelime setiyle
// istedigi kadar tekrar deneyebilir (PendingQuiz kaybolmuyor).
async function showBonusQuiz(container, api, toolId, categories, onPass) {
  const shell = container.querySelector('.ke-shell');
  const overlay = document.createElement('div');
  overlay.className = 'ke-bonus-quiz';
  overlay.innerHTML = `
    <div class="ke-bonus-card">
      <div class="ke-bonus-progress" id="keBonusProgress">${L('Yükleniyor…', 'Loading…')}</div>
      <div class="ke-bonus-body" id="keBonusBody"></div>
    </div>
  `;
  shell.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('ke-show'));

  function close() {
    overlay.classList.remove('ke-show');
    setTimeout(() => overlay.remove(), 300);
  }

  async function loadWords() {
    const pool = categories.filter((c) => c.word_count > 0 && c.episode_count > 0);
    const cat = pool[Math.floor(Math.random() * pool.length)];
    const epIndex = Math.floor(Math.random() * cat.episode_count);
    const r = await api.apiFetch(`/api/tools/${toolId}/categories/${cat.id}/episodes/${epIndex}`);
    if (!r.ok) throw new Error('fetch failed');
    const ep = await r.json();
    const objs = (ep.objects || []).filter((o) => o.word && o.tr);
    return shuffle(objs).slice(0, Math.min(5, objs.length));
  }

  async function runRound() {
    const bodyEl = overlay.querySelector('#keBonusBody');
    const progEl = overlay.querySelector('#keBonusProgress');
    bodyEl.innerHTML = `<div class="ke-bonus-loading">🎁</div>`;
    let words;
    try { words = await loadWords(); } catch (e) { words = []; }
    if (words.length < 3) {
      bodyEl.innerHTML = `<p>${L('Şu an sınav hazırlanamadı, birazdan tekrar dene.', 'Could not prepare a quiz right now, try again soon.')}</p>
        <button type="button" class="ke-btn-secondary" id="keBonusClose">${L('Kapat', 'Close')}</button>`;
      bodyEl.querySelector('#keBonusClose').addEventListener('click', close);
      return;
    }
    let qi = 0, correct = 0;
    function showQuestion() {
      if (qi >= words.length) { finish(); return; }
      const target = words[qi];
      progEl.textContent = `${L('Soru', 'Question')} ${qi + 1} / ${words.length}`;
      const distractors = shuffle(words.filter((w) => w.word !== target.word)).slice(0, 2).map((w) => w.tr);
      while (distractors.length < 2) distractors.push('—');
      const choices = shuffle([target.tr, ...distractors]);
      let answered = false;
      bodyEl.innerHTML = `
        <div class="ke-bonus-icon">${renderObjectIcon(target)}</div>
        <div class="ke-bonus-word">${target.word}</div>
        <div class="ke-bonus-choices">
          ${choices.map((c, i) => `<button type="button" class="ke-bonus-choice" data-choice="${i}">${c}</button>`).join('')}
        </div>
      `;
      bodyEl.querySelectorAll('.ke-bonus-choice').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (answered) return;
          answered = true;
          const isRight = btn.textContent === target.tr;
          if (isRight) { correct++; btn.classList.add('ke-bonus-right'); }
          else {
            btn.classList.add('ke-bonus-wrong');
            bodyEl.querySelectorAll('.ke-bonus-choice').forEach((b) => { if (b.textContent === target.tr) b.classList.add('ke-bonus-right'); });
          }
          setTimeout(() => { qi++; showQuestion(); }, 900);
        });
      });
    }
    function finish() {
      const passed = correct >= Math.ceil(words.length * 0.6);
      progEl.textContent = L('Sonuç', 'Result');
      if (passed) {
        PendingQuiz.consume();
        GameTokens.add(1);
        bodyEl.innerHTML = `
          <div class="ke-bonus-icon">🏆</div>
          <p><b>${L(`${correct}/${words.length} doğru! Harika iş!`, `${correct}/${words.length} correct! Great job!`)}</b></p>
          <p>${L('1 oyun hakkı kazandın! 🎮', 'You earned 1 game token! 🎮')}</p>
          <button type="button" class="ke-btn-primary" id="keBonusDone">${L('Süper!', 'Awesome!')}</button>
        `;
        bodyEl.querySelector('#keBonusDone').addEventListener('click', () => { close(); onPass(); });
      } else {
        bodyEl.innerHTML = `
          <div class="ke-bonus-icon">💪</div>
          <p><b>${L(`${correct}/${words.length} doğru.`, `${correct}/${words.length} correct.`)}</b></p>
          <p>${L('Biraz daha yakın! Tekrar dene 🙂', 'So close! Try again 🙂')}</p>
          <div class="ke-btn-row">
            <button type="button" class="ke-btn-secondary" id="keBonusLater">${L('Sonra', 'Later')}</button>
            <button type="button" class="ke-btn-primary" id="keBonusRetry">${L('Tekrar Dene', 'Try Again')}</button>
          </div>
        `;
        bodyEl.querySelector('#keBonusLater').addEventListener('click', close);
        bodyEl.querySelector('#keBonusRetry').addEventListener('click', runRound);
      }
    }
    showQuestion();
  }

  runRound();
}

// Oyun hakki varsa, dogrudan Nehir Macerasi'na atlamak yerine kucuk bir
// secim ekrani gosteriyoruz - "cinsiyete gore ayri oyun" yerine HERKESE
// acik iki farkli TEMPO (aksiyon vs sakin/yapboz) sunuyoruz, hangisini
// oynayacagini cocuk kendi seciyor.
function showGamePicker(container, onExit) {
  const shell = container.querySelector('.ke-shell');
  const overlay = document.createElement('div');
  overlay.className = 'ke-river-overlay-msg ke-game-picker';
  overlay.style.position = 'absolute'; overlay.style.zIndex = '90';
  overlay.innerHTML = `
    <div class="ke-river-msg-card ke-picker-card">
      <h2>${L('Hangi Oyun?', 'Which Game?')}</h2>
      <div class="ke-picker-row">
        <button type="button" class="ke-picker-btn" id="kePickRiver">
          <span class="ke-picker-emoji">🚤</span>
          <span>${L('Nehir Macerası', 'River Adventure')}</span>
        </button>
        <button type="button" class="ke-picker-btn" id="kePickPuzzle">
          <span class="ke-picker-emoji">🧩</span>
          <span>${L('Resimli Yap-Boz', 'Picture Puzzle')}</span>
        </button>
      </div>
      <button type="button" class="ke-btn-secondary" id="kePickCancel" style="margin-top:14px;">${L('Vazgeç', 'Cancel')}</button>
    </div>
  `;
  shell.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('ke-show'));
  const close = () => { overlay.classList.remove('ke-show'); setTimeout(() => overlay.remove(), 250); };
  overlay.querySelector('#kePickRiver').addEventListener('click', () => { close(); startRiverGame(container, onExit); });
  overlay.querySelector('#kePickPuzzle').addEventListener('click', () => { close(); startSlidePuzzle(container, onExit); });
  overlay.querySelector('#kePickCancel').addEventListener('click', close);
}

// Resimli kayan yap-boz (klasik "15 puzzle"): 3x3, bir hucre bos, bosluga
// komsu bir parcaya dokunarak kaydiriyorsun. Resimler uygulamanin kendi
// (bugun tek tek gorsel olarak dogrulanmis) varliklarindan - Aktapokus'un
// kendisi + birkac sevimli hayvan fotografi - boylece "eglenceli resim"
// hissi garanti, rastgele/dusuk kaliteli bir gorsele bagli degil.
const SLIDE_PUZZLE_IMAGES = [
  'mascot/mascot_idle.png',
  'photos/dog__animals_pixabay7.jpg',
  'photos/cat__animals_pixabay7.jpg',
  'photos/lion__animals_manual.jpg',
  'photos/butterfly__animals_pixabay7.jpg',
];
function startSlidePuzzle(container, onExit) {
  if (!GameTokens.spend()) { onExit(); return; }
  refreshGameBadge(container);

  const shell = container.querySelector('.ke-shell');
  const overlay = document.createElement('div');
  overlay.className = 'ke-puzzle-game';
  overlay.innerHTML = `
    <div class="ke-puzzle-hud">
      <div class="ke-puzzle-moves">🔢 <span id="kePuzzleMoves">0</span></div>
      <button type="button" class="ke-river-close" id="kePuzzleClose" aria-label="${L('Kapat', 'Close')}">✕</button>
    </div>
    <div class="ke-puzzle-board-wrap"><div class="ke-puzzle-board" id="kePuzzleBoard"></div></div>
    <div class="ke-river-overlay-msg" id="kePuzzleStartMsg">
      <div class="ke-river-msg-card">
        <h2>${L('Resimli Yap-Boz', 'Picture Puzzle')}</h2>
        <p>${L('Boşluğun yanındaki bir parçaya dokun, kaydır! Resmi tamamla 🧩', "Tap a piece next to the empty space to slide it! Complete the picture 🧩")}</p>
        <button type="button" class="ke-btn-primary" id="kePuzzleStartBtn">${L('Başla', 'Start')} ▶</button>
      </div>
    </div>
    <div class="ke-river-overlay-msg" id="kePuzzleWinMsg" style="display:none;">
      <div id="keConfettiHost"></div>
      <div class="ke-river-msg-card">
        <h2>🎉 ${L('Tamamladın!', 'Solved it!')}</h2>
        <p id="kePuzzleFinalMoves"></p>
        <div class="ke-btn-row">
          <button type="button" class="ke-btn-secondary" id="kePuzzleExitBtn">${L('Çık', 'Exit')}</button>
          <button type="button" class="ke-btn-primary" id="kePuzzleAgainBtn" style="display:none;">${L('Yeni Resim', 'New Picture')} 🧩</button>
        </div>
      </div>
    </div>
  `;
  shell.appendChild(overlay);

  const boardWrap = overlay.querySelector('.ke-puzzle-board-wrap');
  const boardEl = overlay.querySelector('#kePuzzleBoard');
  const N = 3; // 3x3 - 10 yas grubu icin makul zorluk
  let boardSize = 0, tileSize = 0;
  let moves = 0;
  let solved = false;
  let cells = []; // cells[row*N+col] = orijinal parca indexi (0..7), 8 = bos
  let tileEls = []; // tileEls[origIndex] = DOM elementi (bos icin null)
  let blankIndex = N * N - 1;

  function resize() {
    const r = boardWrap.getBoundingClientRect();
    boardSize = Math.floor(Math.min(r.width, r.height) - 4);
    tileSize = Math.floor(boardSize / N);
    boardEl.style.width = boardSize + 'px';
    boardEl.style.height = boardSize + 'px';
    // BUG: sizeTiles() (parca genislik/yukseklik'ini gunceller) burada
    // eskiden cagrilmiyordu - sadece POZISYON (layoutTile) yeni tileSize
    // ile guncelleniyordu, parcalarin kendi width/height'i ESKI tileSize'da
    // kaliyordu. Ekran donunce/klavye acilinca (mobil resize event) yeni
    // konum + eski boyut cakisiyor, kareler dikdortgene donusuyordu
    // ("kareler ayni degil, bazilari dikdortgen" geri bildirimi).
    sizeTiles();
    tileEls.forEach((el, orig) => { if (el) layoutTile(orig); });
  }
  window.addEventListener('resize', resize);

  function origRowCol(orig) { return { r: Math.floor(orig / N), c: orig % N }; }
  function cellIndexOf(orig) { return cells.indexOf(orig); }
  function layoutTile(orig) {
    const el = tileEls[orig];
    if (!el) return;
    const idx = cellIndexOf(orig);
    const row = Math.floor(idx / N), col = idx % N;
    el.style.transform = `translate(${col * tileSize}px, ${row * tileSize}px)`;
  }

  function buildBoard(imgSrc) {
    boardEl.innerHTML = '';
    cells = Array.from({ length: N * N }, (_, i) => i);
    blankIndex = N * N - 1;
    tileEls = [];
    const src = new URL(imgSrc, ASSET_BASE_URL).href;
    for (let orig = 0; orig < N * N - 1; orig++) {
      const { r, c } = origRowCol(orig);
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'ke-puzzle-tile';
      el.style.backgroundImage = `url(${src})`;
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); beginDrag(e, orig); });
      el.addEventListener('pointermove', onDragMove);
      el.addEventListener('pointerup', endDrag);
      el.addEventListener('pointercancel', endDrag);
      boardEl.appendChild(el);
      tileEls.push(el);
    }
    tileEls.push(null); // bosluk icin yer tutucu (orig index N*N-1)
    resize();
    sizeTiles();
    tileEls.forEach((el, orig) => { if (el) layoutTile(orig); });
    shuffleBoard();
  }

  function sizeTiles() {
    tileEls.forEach((el, orig) => {
      if (!el) return;
      const { r, c } = origRowCol(orig);
      el.style.width = tileSize + 'px';
      el.style.height = tileSize + 'px';
      el.style.backgroundSize = `${boardSize}px ${boardSize}px`;
      el.style.backgroundPosition = `-${c * tileSize}px -${r * tileSize}px`;
    });
  }

  function neighborsOfBlank() {
    const br = Math.floor(blankIndex / N), bc = blankIndex % N;
    const out = [];
    if (br > 0) out.push(blankIndex - N);
    if (br < N - 1) out.push(blankIndex + N);
    if (bc > 0) out.push(blankIndex - 1);
    if (bc < N - 1) out.push(blankIndex + 1);
    return out;
  }
  function swapCells(idxA, idxB) {
    const t = cells[idxA]; cells[idxA] = cells[idxB]; cells[idxB] = t;
  }
  function shuffleBoard() {
    for (let i = 0; i < 140; i++) {
      const opts = neighborsOfBlank();
      const pick = opts[Math.floor(Math.random() * opts.length)];
      swapCells(pick, blankIndex);
      blankIndex = pick;
    }
    tileEls.forEach((el, orig) => { if (el) layoutTile(orig); });
    moves = 0;
    solved = false;
    overlay.querySelector('#kePuzzleMoves').textContent = moves;
  }

  // "istediğin yere sürüklenmiyor" - önceden bu sadece tıkla-kaydır'dı
  // (gerçek sürükleme hiç yoktu). Parça boşluğa bitişikse parmakla
  // gerçekten peşinden gelir; kısa bir dokunuş (hiç ya da çok az hareket)
  // hâlâ eskisi gibi tam bir kaydırma sayılır, %35'i geçen bir sürükleme
  // de tamamlanır, azı geri döner. setPointerCapture ile parmak parça
  // sınırının dışına taşsa da takip kesilmiyor (river oyunundaki aynı
  // iOS "basılı tutunca gitmiyor" sınıfı sorunun önlenmesi).
  let dragState = null; // {orig, idx, axis, dir, startX, startY, moved}
  function beginDrag(e, orig) {
    const idx = cellIndexOf(orig);
    if (!neighborsOfBlank().includes(idx)) return;
    const br = Math.floor(blankIndex / N), bc = blankIndex % N;
    const tr = Math.floor(idx / N), tc = idx % N;
    let axis, dir;
    if (tr === br) { axis = 'x'; dir = bc > tc ? 1 : -1; }
    else { axis = 'y'; dir = br > tr ? 1 : -1; }
    dragState = { orig, idx, axis, dir, startX: e.clientX, startY: e.clientY, totalMoved: 0, maxAlong: 0 };
    try { tileEls[orig].setPointerCapture(e.pointerId); } catch (err) { /* yok say */ }
  }
  function onDragMove(e) {
    if (!dragState) return;
    const el = tileEls[dragState.orig];
    const dx = e.clientX - dragState.startX, dy = e.clientY - dragState.startY;
    let along = (dragState.axis === 'x' ? dx : dy) * dragState.dir;
    along = Math.max(0, Math.min(tileSize, along));
    dragState.totalMoved = Math.max(dragState.totalMoved, Math.hypot(dx, dy));
    dragState.maxAlong = Math.max(dragState.maxAlong, along);
    const row = Math.floor(dragState.idx / N), col = dragState.idx % N;
    const offX = dragState.axis === 'x' ? along * dragState.dir : 0;
    const offY = dragState.axis === 'y' ? along * dragState.dir : 0;
    el.style.transition = 'none';
    el.style.transform = `translate(${col * tileSize + offX}px, ${row * tileSize + offY}px)`;
  }
  function endDrag(e) {
    if (!dragState) return;
    const { orig, totalMoved, maxAlong } = dragState;
    const el = tileEls[orig];
    el.style.transition = '';
    dragState = null;
    // Duz bir dokunus (parmak hemen hemen hic kaymadi) eskisi gibi tam bir
    // kaydirma sayilir; boslugun yonune dogru %35'i asan gercek bir
    // surukleme de tamamlanir; yanlis yone veya yetersiz surukleme geri doner.
    if (totalMoved < 8 || maxAlong > tileSize * 0.35) tryMove(orig);
    else layoutTile(orig);
  }

  function tryMove(orig) {
    if (solved) return;
    const idx = cellIndexOf(orig);
    if (!neighborsOfBlank().includes(idx)) return;
    swapCells(idx, blankIndex);
    blankIndex = idx;
    moves++;
    overlay.querySelector('#kePuzzleMoves').textContent = moves;
    layoutTile(orig);
    if (cells.every((v, i) => v === i)) { solved = true; setTimeout(onSolved, 260); }
  }

  function onSolved() {
    overlay.querySelector('#kePuzzleFinalMoves').textContent = L(`${moves} hamlede tamamladın! 🏆`, `Solved in ${moves} moves! 🏆`);
    const again = overlay.querySelector('#kePuzzleAgainBtn');
    again.style.display = GameTokens.get() > 0 ? '' : 'none';
    overlay.querySelector('#kePuzzleWinMsg').style.display = 'flex';
    launchConfetti(overlay);
  }

  function pickImage() {
    return SLIDE_PUZZLE_IMAGES[Math.floor(Math.random() * SLIDE_PUZZLE_IMAGES.length)];
  }

  function startRun() {
    overlay.querySelector('#kePuzzleStartMsg').style.display = 'none';
    overlay.querySelector('#kePuzzleWinMsg').style.display = 'none';
    buildBoard(pickImage());
  }

  function cleanup() {
    window.removeEventListener('resize', resize);
    overlay.remove();
  }
  overlay.querySelector('#kePuzzleStartBtn').addEventListener('click', startRun);
  overlay.querySelector('#kePuzzleClose').addEventListener('click', () => { cleanup(); onExit(); });
  overlay.querySelector('#kePuzzleExitBtn').addEventListener('click', () => { cleanup(); onExit(); });
  overlay.querySelector('#kePuzzleAgainBtn').addEventListener('click', () => {
    if (!GameTokens.spend()) return;
    refreshGameBadge(container);
    startRun();
  });
}

function startRiverGame(container, onExit) {
  if (!GameTokens.spend()) { onExit(); return; }
  refreshGameBadge(container);

  const shell = container.querySelector('.ke-shell');
  const overlay = document.createElement('div');
  overlay.className = 'ke-river-game';
  overlay.innerHTML = `
    <canvas id="keRiverCanvas"></canvas>
    <div class="ke-river-hud">
      <div class="ke-river-score">⭐ <span id="keRiverScoreEl">0</span> <span class="ke-river-best">🏆<span id="keRiverBestEl">${RiverHighScore.get()}</span></span></div>
      <div class="ke-river-fuel-wrap"><div class="ke-river-fuel-bar" id="keRiverFuelBar"></div></div>
      <button type="button" class="ke-river-close" id="keRiverClose" aria-label="${L('Kapat', 'Close')}">✕</button>
    </div>
    <div class="ke-river-touch-zones">
      <div class="ke-river-zone ke-river-zone-steer" id="keRiverSteerZone"><span class="ke-river-zone-hint">◀ ${L('SÜRÜKLE', 'DRAG')} ▶</span></div>
      <div class="ke-river-zone ke-river-zone-fire" id="keRiverFireZone"><span class="ke-river-zone-hint">● ${L('ATEŞ', 'FIRE')}</span></div>
    </div>
    <div class="ke-river-overlay-msg" id="keRiverStartMsg">
      <div class="ke-river-msg-card">
        <h2>${L('Nehir Macerası', 'River Adventure')}</h2>
        <p>${L('Kayalardan kaç, yakıt topla, balonları vur! Yakıtın sürekli azalır, istasyonları kaçırma! 🚤', "Dodge the rocks, collect fuel, pop the balloons! Fuel keeps dropping, don't miss the tanks! 🚤")}</p>
        ${RiverHighScore.get() > 0 ? `<p style="font-weight:800;color:#B08718;">🏆 ${L('Rekorun', 'Your best')}: ${RiverHighScore.get()}</p>` : ''}
        <button type="button" class="ke-btn-primary" id="keRiverStartBtn">${L('Başla', 'Start')} ▶</button>
      </div>
    </div>
    <div class="ke-river-overlay-msg" id="keRiverOverMsg" style="display:none;">
      <div class="ke-river-msg-card">
        <h2>${L('Oyun Bitti!', 'Game Over!')}</h2>
        <p id="keRiverFinalScore"></p>
        <div class="ke-btn-row">
          <button type="button" class="ke-btn-secondary" id="keRiverExitBtn">${L('Çık', 'Exit')}</button>
          <button type="button" class="ke-btn-primary" id="keRiverAgainBtn" style="display:none;">${L('Tekrar Oyna', 'Play Again')} 🎮</button>
        </div>
      </div>
    </div>
  `;
  shell.appendChild(overlay);

  const canvas = overlay.querySelector('#keRiverCanvas');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  function resize() {
    const r = overlay.getBoundingClientRect();
    W = canvas.width = Math.round(r.width);
    H = canvas.height = Math.round(r.height);
  }
  resize();
  window.addEventListener('resize', resize);

  // --- durum ---
  const keys = { left: false, right: false };
  let player = { x: 0, y: 0, r: 16, angle: 0 };
  let terrain = []; // {y, cx, half}
  let items = []; // {y, x, type: 'rock'|'fuel'|'balloon'|'star', alive}
  let bullets = []; // {y, x}
  let particles = []; // basit patlama efekti {x,y,vx,vy,life}
  let trail = []; // teknenin arkasindaki dalga izi {x,y,life}
  let waterPhase = 0; // suyun parildama animasyonu icin
  let shakeTime = 0;
  // Tekne olarak gercek Aktapokus gorseli - oyunu jenerik sekillerden
  // cikarip uygulamanin kendi kimligine baglayan, "gorseller cok basarili
  // olmali" geri bildirimine karsilik gelen ana dokunus.
  const boatImg = new Image();
  let boatImgReady = false;
  boatImg.onload = () => { boatImgReady = true; };
  boatImg.src = new URL('mascot/mascot_idle.png', ASSET_BASE_URL).href;
  let score = 0;
  let fuel = 100;
  let scrollSpeed = 120; // px/sn
  let running = false;
  let lastSpawnY = 0;
  let shootCooldown = 0;
  let hitFlash = 0;
  let lastTime = null;
  let rafId = null;
  let isNewBest = false;
  // Nehir "tek tip rastgele" hissetmesin diye - her checkpoint bagimsiz
  // zar atmak yerine, bir SURE boyunca ayni "mod"da devam ediyoruz
  // (duz surukleme, S-kivrimi, dar gecit, genis acik alan) - gercek
  // bir parkurun hissettirdigi gibi degisen boluler yaratiyor.
  let driftMode = 'drift';
  let driftLeft = 0;
  let driftDir = 1;
  let driftPhase = 0;

  const CHECK_GAP = 40;
  const FUEL_DRAIN_PER_SEC = 3.2; // "her seferinde ayni degil" - yakit surekli azalir, toplamak zorunlu
  function nextTerrainStep(prevCx, prevHalf, stepIndex) {
    if (driftLeft <= 0) {
      const roll = Math.random();
      if (roll < 0.35) { driftMode = 'drift'; driftLeft = 6 + Math.floor(Math.random() * 8); }
      else if (roll < 0.6) { driftMode = 'curve'; driftLeft = 10 + Math.floor(Math.random() * 10); driftDir = Math.random() < 0.5 ? -1 : 1; driftPhase = 0; }
      else if (roll < 0.8) { driftMode = 'narrow'; driftLeft = 8 + Math.floor(Math.random() * 8); }
      else { driftMode = 'wide'; driftLeft = 8 + Math.floor(Math.random() * 8); }
    }
    driftLeft--;
    let cx = prevCx;
    let targetHalf = Math.min(150, W * 0.34);
    if (driftMode === 'drift') {
      cx += (Math.random() - 0.5) * 46;
    } else if (driftMode === 'curve') {
      driftPhase += 0.35;
      cx += driftDir * (16 + Math.sin(driftPhase) * 10);
    } else if (driftMode === 'narrow') {
      targetHalf = Math.max(62, targetHalf * 0.55);
      cx += (Math.random() - 0.5) * 24;
    } else { // wide
      cx += (Math.random() - 0.5) * 30;
    }
    const half = prevHalf + (targetHalf - prevHalf) * 0.15;
    const clampedHalf = Math.max(62, Math.min(Math.min(150, W * 0.34), half));
    cx = Math.max(clampedHalf + 24, Math.min(W - clampedHalf - 24, cx));
    return { cx, half: clampedHalf };
  }
  function resetGame() {
    player = { x: W / 2, y: H - 90, r: 16 };
    terrain = [];
    driftMode = 'drift'; driftLeft = 0; driftDir = 1; driftPhase = 0;
    let cx = W / 2, half = Math.min(140, W * 0.32);
    let i = 0;
    for (let y = -CHECK_GAP * 3; y < H + CHECK_GAP * 2; y += CHECK_GAP) {
      const step = nextTerrainStep(cx, half, i++);
      cx = step.cx; half = step.half;
      terrain.push({ y, cx, half });
    }
    items = [];
    bullets = [];
    particles = [];
    trail = [];
    waterPhase = 0;
    shakeTime = 0;
    score = 0;
    fuel = 100;
    scrollSpeed = 120;
    lastSpawnY = 0;
    shootCooldown = 0;
    hitFlash = 0;
    isNewBest = false;
  }

  function channelAt(y) {
    let a = terrain[0], b = terrain[terrain.length - 1];
    for (let i = 0; i < terrain.length - 1; i++) {
      if (terrain[i].y <= y && terrain[i + 1].y >= y) { a = terrain[i]; b = terrain[i + 1]; break; }
    }
    const t = b.y === a.y ? 0 : (y - a.y) / (b.y - a.y);
    return { cx: a.cx + (b.cx - a.cx) * t, half: a.half + (b.half - a.half) * t };
  }

  function spawnItem() {
    const topY = terrain[0].y;
    const ch = channelAt(topY + 10);
    const margin = 22;
    const x = ch.cx + (Math.random() - 0.5) * 2 * Math.max(10, ch.half - margin);
    // Yakit her zaman aktif tuketildigi icin (bkz. FUEL_DRAIN_PER_SEC)
    // havuzun makul bir payi yakit olmali yoksa hayatta kalmak imkansiz
    // olur - ama %100 garanti degil, dikkatli navigasyon hala gerekli.
    const roll = Math.random();
    let type;
    if (roll < 0.38) type = 'rock';
    else if (roll < 0.66) type = 'fuel';
    else if (roll < 0.92) type = 'balloon';
    else type = 'star'; // nadir bonus - +50 puan
    items.push({ y: topY - 10, x, type, alive: true });
  }

  function burst(x, y, color) {
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI * 2 * i) / 10;
      particles.push({ x, y, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, life: 0.5, color });
    }
  }

  function shoot() {
    if (shootCooldown > 0) return;
    shootCooldown = 0.28;
    bullets.push({ x: player.x, y: player.y - player.r });
  }

  function endGame() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    const finalScore = Math.floor(score);
    isNewBest = RiverHighScore.submit(finalScore);
    const bestEl = overlay.querySelector('#keRiverBestEl');
    if (bestEl) bestEl.textContent = RiverHighScore.get();
    overlay.querySelector('#keRiverFinalScore').innerHTML = isNewBest
      ? L(`Skor: ${finalScore} ⭐<br><b>🏆 Yeni rekor!</b>`, `Score: ${finalScore} ⭐<br><b>🏆 New high score!</b>`)
      : L(`Skor: ${finalScore} ⭐<br>Rekor: ${RiverHighScore.get()} 🏆`, `Score: ${finalScore} ⭐<br>Best: ${RiverHighScore.get()} 🏆`);
    const again = overlay.querySelector('#keRiverAgainBtn');
    again.style.display = GameTokens.get() > 0 ? '' : 'none';
    overlay.querySelector('#keRiverOverMsg').style.display = 'flex';
  }

  function update(dt) {
    // guclesme: zamanla biraz hizlanir, ustten sinirli
    scrollSpeed = Math.min(230, scrollSpeed + dt * 2.2);
    const scroll = scrollSpeed * dt;

    // terrain kaydir + yenisini uret (cesitli modlarla - bkz. nextTerrainStep)
    terrain.forEach((t) => { t.y += scroll; });
    while (terrain[0].y > -CHECK_GAP) {
      const first = terrain[0];
      const step = nextTerrainStep(first.cx, first.half);
      terrain.unshift({ y: first.y - CHECK_GAP, cx: step.cx, half: step.half });
    }
    terrain = terrain.filter((t) => t.y < H + CHECK_GAP * 3);

    // oge kaydir
    items.forEach((it) => { it.y += scroll; });
    items = items.filter((it) => it.alive && it.y < H + 40);
    lastSpawnY += scroll;
    if (lastSpawnY > 90) { lastSpawnY = 0; spawnItem(); }

    // mermi
    bullets.forEach((b) => { b.y -= 420 * dt; });
    bullets = bullets.filter((b) => b.y > -20);

    // parcaciklar
    particles.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; });
    particles = particles.filter((p) => p.life > 0);

    // su parildamasi + tekne dalga izi
    waterPhase += dt * 1.6;
    trail.push({ x: player.x, y: player.y + 14, life: 0.45 });
    trail.forEach((t) => { t.life -= dt; t.y += scroll; });
    trail = trail.filter((t) => t.life > 0);
    if (shakeTime > 0) shakeTime -= dt;

    // oyuncu hareketi (yon acisi = hafif yatirma, "canli" bir his icin)
    const moveSpeed = 260;
    let vx = 0;
    if (keys.left) vx -= moveSpeed;
    if (keys.right) vx += moveSpeed;
    player.x += vx * dt;
    player.x = Math.max(18, Math.min(W - 18, player.x));
    player.angle += ((vx / moveSpeed) * 0.32 - player.angle) * Math.min(1, dt * 8);
    if (shootCooldown > 0) shootCooldown -= dt;
    if (hitFlash > 0) hitFlash -= dt;

    // kiyi carpismasi
    const ch = channelAt(player.y);
    if (player.x - player.r < ch.cx - ch.half || player.x + player.r > ch.cx + ch.half) {
      fuel -= 55 * dt; // kiyiya surtunme - hizli tukeniyor ama aninda oyun bitmiyor
      hitFlash = 0.15;
      shakeTime = 0.2;
    }

    // mermi-hedef carpismasi
    bullets.forEach((b) => {
      items.forEach((it) => {
        if (!it.alive || it.type !== 'balloon') return;
        if (Math.hypot(b.x - it.x, b.y - it.y) < 22) {
          it.alive = false; b.y = -999;
          score += 25;
          burst(it.x, it.y, '#FF6B6B');
        }
      });
    });
    bullets = bullets.filter((b) => b.y > -900);

    // oyuncu-oge carpismasi
    items.forEach((it) => {
      if (!it.alive) return;
      if (Math.hypot(player.x - it.x, player.y - it.y) < player.r + 16) {
        it.alive = false;
        if (it.type === 'fuel') { fuel = Math.min(100, fuel + 22); score += 10; burst(it.x, it.y, '#6EC8FF'); }
        else if (it.type === 'rock') { fuel -= 25; hitFlash = 0.2; shakeTime = 0.22; burst(it.x, it.y, '#B08968'); }
        else if (it.type === 'balloon') { fuel -= 12; hitFlash = 0.15; shakeTime = 0.15; burst(it.x, it.y, '#FF6B6B'); }
        else if (it.type === 'star') { score += 50; burst(it.x, it.y, '#FFD75A'); }
      }
    });
    items = items.filter((it) => it.alive);

    // Yakit gercek bir kaynak yonetimi olsun diye SUREKLI azalir - sadece
    // kayalardan kacmak yetmiyor, yakit istasyonlarini da aktif toplamak
    // gerekiyor (River Raid'in kendi cekirdek dongusu tam olarak bu).
    fuel -= FUEL_DRAIN_PER_SEC * dt;
    score += dt * 4; // hayatta kalma puani
    if (fuel <= 0) { fuel = 0; endGame(); return; }

    overlay.querySelector('#keRiverScoreEl').textContent = Math.floor(score);
    overlay.querySelector('#keRiverFuelBar').style.width = fuel + '%';
    overlay.querySelector('#keRiverFuelBar').style.background = fuel < 25 ? '#FF5252' : fuel < 55 ? '#FFB74D' : '#6EC8FF';
  }

  function riverPath() {
    ctx.beginPath();
    ctx.moveTo(terrain[0].cx - terrain[0].half, terrain[0].y);
    terrain.forEach((t) => ctx.lineTo(t.cx - t.half, t.y));
    for (let i = terrain.length - 1; i >= 0; i--) ctx.lineTo(terrain[i].cx + terrain[i].half, terrain[i].y);
    ctx.closePath();
  }

  function draw() {
    ctx.save();
    // carpma "screen shake" - kiyiya/engele carpinca ekran kisa sure titrer
    if (shakeTime > 0) {
      const k = shakeTime / 0.22;
      ctx.translate((Math.random() - 0.5) * 10 * k, (Math.random() - 0.5) * 10 * k);
    }

    // kiyilar: cim dokusu hissi veren dikey degrade
    const bankGrad = ctx.createLinearGradient(0, 0, 0, H);
    bankGrad.addColorStop(0, '#3a7050');
    bankGrad.addColorStop(1, '#254a34');
    ctx.fillStyle = bankGrad;
    ctx.fillRect(0, 0, W, H);

    // nehir: derinlik hissi veren mavi degrade + kiyi seridi (kum tonu)
    ctx.save();
    riverPath();
    ctx.clip();
    const waterGrad = ctx.createLinearGradient(0, 0, 0, H);
    waterGrad.addColorStop(0, '#3f8fc4');
    waterGrad.addColorStop(1, '#1c5a86');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 0, W, H);
    // parildayan su cizgileri - waterPhase ile yavasca kayar
    ctx.strokeStyle = 'rgba(255,255,255,.22)';
    ctx.lineWidth = 3;
    for (let row = -1; row * 34 < H + 40; row++) {
      const y = ((row * 34 + waterPhase * 60) % (H + 80)) - 40;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 14) ctx.lineTo(x, y + Math.sin(x * 0.05 + waterPhase * 2) * 4);
      ctx.stroke();
    }
    ctx.restore();
    // kiyi cizgisi - kum/tas seridi, nehrin kenarini belirginlestirir
    riverPath();
    ctx.strokeStyle = '#e8d9a8';
    ctx.lineWidth = 5;
    ctx.stroke();

    // teknenin arkasindaki dalga izi
    trail.forEach((t) => {
      ctx.globalAlpha = Math.max(0, t.life / 0.45) * 0.5;
      ctx.fillStyle = '#EAF6FF';
      ctx.beginPath(); ctx.ellipse(t.x, t.y, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // ogeler
    items.forEach((it) => {
      ctx.save();
      ctx.translate(it.x, it.y);
      if (it.type === 'rock') {
        const g = ctx.createRadialGradient(-5, -6, 2, 0, 0, 16);
        g.addColorStop(0, '#a98c6a'); g.addColorStop(1, '#6e563b');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1.5; ctx.stroke();
      } else if (it.type === 'fuel') {
        const pulse = 1 + Math.sin(waterPhase * 4 + it.x) * 0.06;
        ctx.scale(pulse, pulse);
        ctx.fillStyle = 'rgba(110,200,255,.35)';
        ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill(); // hafif parlama halkasi
        ctx.fillStyle = '#FFD75A';
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-10, -14, 20, 28, 4) : ctx.rect(-10, -14, 20, 28); ctx.fill();
        ctx.fillStyle = '#0b1e33'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('⛽', 0, 5);
      } else if (it.type === 'balloon') {
        ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(0, 26);
        ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#B03A3A'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.beginPath(); ctx.ellipse(-5, -6, 4, 6, -0.4, 0, Math.PI * 2); ctx.fill();
      } else { // star - nadir bonus, donen + nefes alan
        const spin = waterPhase * 2.2;
        const pulse = 1 + Math.sin(waterPhase * 5) * 0.12;
        ctx.rotate(spin);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = '#FFD75A';
        ctx.shadowColor = 'rgba(255,215,90,.8)'; ctx.shadowBlur = 12;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
          const a2 = a + Math.PI / 5;
          ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14);
          ctx.lineTo(Math.cos(a2) * 6, Math.sin(a2) * 6);
        }
        ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    });

    // mermiler - kucuk alev izi
    bullets.forEach((b) => {
      ctx.fillStyle = 'rgba(255,215,90,.4)';
      ctx.fillRect(b.x - 2, b.y + 4, 4, 10);
      ctx.fillStyle = '#FFD75A';
      ctx.fillRect(b.x - 3, b.y - 8, 6, 12);
    });

    // parcaciklar
    particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life / 0.5);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
      ctx.globalAlpha = 1;
    });

    // oyuncu: gercek Aktapokus + basit tekne govdesi, donuslerde hafif yatiyor
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    if (hitFlash > 0 && Math.floor(hitFlash * 30) % 2 === 0) ctx.globalAlpha = 0.4;
    // tekne govdesi
    ctx.fillStyle = '#C0392B';
    ctx.beginPath();
    ctx.moveTo(0, 20); ctx.lineTo(18, 10); ctx.lineTo(14, -4); ctx.lineTo(-14, -4); ctx.lineTo(-18, 10);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 1.5; ctx.stroke();
    // Aktapokus - yuklendiyse gercek gorsel, yuklenmediyse basit yedek sekil
    if (boatImgReady) {
      const bw = 34, bh = 51;
      ctx.drawImage(boatImg, -bw / 2, -bh - 6, bw, bh);
    } else {
      ctx.fillStyle = '#FFD75A';
      ctx.beginPath(); ctx.arc(0, -18, 13, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    ctx.restore();
  }

  function loop(ts) {
    if (!running) return;
    if (lastTime == null) lastTime = ts;
    const dt = Math.min(0.05, (ts - lastTime) / 1000);
    lastTime = ts;
    update(dt);
    if (running) { draw(); rafId = requestAnimationFrame(loop); }
  }

  function startRun() {
    resetGame();
    overlay.querySelector('#keRiverStartMsg').style.display = 'none';
    overlay.querySelector('#keRiverOverMsg').style.display = 'none';
    running = true;
    lastTime = null;
    rafId = requestAnimationFrame(loop);
  }

  // --- kontroller ---
  function onKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
    if (e.key === ' ') { e.preventDefault(); shoot(); }
  }
  function onKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
  }
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  // "tek parmakla ucak yonlenmeli diger parmakla ates edilmeli", "Apple
  // versiyonunda basili tutunca gitmiyor" - eski uc-kucuk-yuvarlak-dugme
  // semasi yerine tam yukseklikte iki gen dokunma bolgesi. Sol bolge:
  // parmak SURUKLENDIGI kadar tekne kayar (mutlak konum degil, GORECELI
  // delta - "parmagimin altinda" hissi verir, tek bir noktaya ziplama
  // yok). setPointerCapture SAYESINDE parmak bolgenin disina tasa bile
  // (kucuk dugmede oldugu gibi) hareket TAKIP EDILMEYE devam eder - eski
  // pointerleave-ile-durma hatasi boylece ortadan kalkiyor.
  const steerZone = overlay.querySelector('#keRiverSteerZone');
  const fireZone = overlay.querySelector('#keRiverFireZone');
  let steerPointerId = null;
  let steerStartClientX = 0;
  let steerStartPlayerX = 0;
  const STEER_SENSITIVITY = 1.6;
  steerZone.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    steerPointerId = e.pointerId;
    steerStartClientX = e.clientX;
    steerStartPlayerX = player.x;
    try { steerZone.setPointerCapture(e.pointerId); } catch (err) { /* yok say */ }
  });
  steerZone.addEventListener('pointermove', (e) => {
    if (steerPointerId !== e.pointerId) return;
    const delta = (e.clientX - steerStartClientX) * STEER_SENSITIVITY;
    player.x = Math.max(18, Math.min(W - 18, steerStartPlayerX + delta));
    keys.left = false; keys.right = false; // dogrudan konum sürüyoruz, klavye hizi devre disi
  });
  const endSteer = (e) => { if (steerPointerId === e.pointerId) steerPointerId = null; };
  steerZone.addEventListener('pointerup', endSteer);
  steerZone.addEventListener('pointercancel', endSteer);
  fireZone.addEventListener('pointerdown', (e) => { e.preventDefault(); shoot(); });

  function cleanup() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('resize', resize);
    overlay.remove();
  }

  overlay.querySelector('#keRiverStartBtn').addEventListener('click', startRun);
  overlay.querySelector('#keRiverClose').addEventListener('click', () => { cleanup(); onExit(); });
  overlay.querySelector('#keRiverExitBtn').addEventListener('click', () => { cleanup(); onExit(); });
  overlay.querySelector('#keRiverAgainBtn').addEventListener('click', () => {
    if (!GameTokens.spend()) return;
    refreshGameBadge(container);
    startRun();
  });

  resetGame();
  draw();
}

export function unmount(container) {
  if (_popstateHandler) { window.removeEventListener('popstate', _popstateHandler); _popstateHandler = null; }
  _backHandler = null;
  if (_guardObserver) { _guardObserver.disconnect(); _guardObserver = null; }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  if (_speechTimer) clearTimeout(_speechTimer);
  if (container._keActiveRecognition) {
    try { container._keActiveRecognition.abort(); } catch (e) { /* no-op */ }
    container._keActiveRecognition = null;
  }
  if (_fullscreenChangeHandler) {
    document.removeEventListener('fullscreenchange', _fullscreenChangeHandler);
    _fullscreenChangeHandler = null;
  }
  if (_narrowMQ && _narrowChangeHandler) {
    try { _narrowMQ.removeEventListener('change', _narrowChangeHandler); } catch (e) { try { _narrowMQ.removeListener(_narrowChangeHandler); } catch (e2) { /* no-op */ } }
    _narrowMQ = null;
    _narrowChangeHandler = null;
  }
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}
