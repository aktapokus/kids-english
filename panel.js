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
  classroom_life:        { c: '#5C6BC0', dark: '#4756A8', tint: '#93A0E0' },
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
  math_numbers:           { c: '#3949AB', dark: '#2C3A94', tint: '#8E99E0' },
  math_shapes:            { c: '#00897B', dark: '#00695C', tint: '#4DB6AC' },
  math_operations:        { c: '#F4511E', dark: '#D84315', tint: '#FF8A65' },
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
  daily_life: '⏰', family_people: '👨‍👩‍👧', school_education: '📚', classroom_life: '🧑‍🏫',
  home: '🏠', food_drinks: '🍽️', nature_environment: '🌿',
  space_astronomy: '🚀', animals: '🐾', sports_exercise: '⚽',
  hobbies_free_time: '🎨', technology_computers: '💻', travel_transportation: '✈️',
  city_places: '🏙️', body_health: '❤️', weather_seasons: '⛅',
  emotions_personality: '😊', clothes_shopping: '👕', jobs_professions: '💼',
  science: '🔬', communication_internet: '💬',
  prepositions: '📦', question_words: '❓', get: '🔄', conversations: '💬', opposites: '↔️',
  math_numbers: '🔢', math_shapes: '🔷', math_operations: '➕',
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

// "10 dakikayı tamamladık daha fazlasını yapabiliriz" tarzı motivasyon
// mesajları için gün-bazlı süre - TimeTrack tüm-zamanlar toplamı,
// DailyGoal gibi gün değişince sıfırlanan AYRI bir sayaç lazımdı.
const TODAY_TIME_KEY = 'ke_today_time_v1';
function todayTimeKey() {
  const id = Profiles.active().id;
  return id === 'p1' ? TODAY_TIME_KEY : TODAY_TIME_KEY + '_' + id;
}
const TodayTime = {
  _load() {
    try {
      const raw = JSON.parse(window.localStorage.getItem(todayTimeKey()));
      if (raw && raw.day) return raw;
    } catch (e) { /* yok say */ }
    return { day: null, seconds: 0 };
  },
  _save(d) { try { window.localStorage.setItem(todayTimeKey(), JSON.stringify(d)); } catch (e) { /* yok say */ } idbPut(todayTimeKey(), d); },
  add(sec) {
    if (sec <= 0) return this.today();
    const d = this._load();
    const today = dayStr(Date.now());
    if (d.day !== today) { d.day = today; d.seconds = 0; }
    d.seconds += sec;
    this._save(d);
    return d.seconds;
  },
  today() {
    const d = this._load();
    return d.day === dayStr(Date.now()) ? d.seconds : 0;
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
  TodayTime.add(sec);
  _timeTrackStart = document.hidden ? null : Date.now();
  // Bir sınıfa katılmışsa (bkz. Classroom.join), her akış anında
  // öğretmenin gördüğü ilerlemeyi de tazeler - joined değilse sync()
  // zaten hemen dönüyor, maliyetsiz.
  syncClassroom(false);
}
function syncClassroom(force) {
  const stars = Progress.totalStars();
  return Classroom.sync(stars, Streak.get(), stars * 6, Math.round(TimeTrack.total() / 60), force);
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
  window.addEventListener('online', () => syncClassroom(true));
  setTimeout(() => syncClassroom(false), 4000);
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

// Bulut sıralama (Supabase) - sadece herkese açık/PUBLISHABLE anahtar
// client'a gömülü (bu servisin kendi tasarımı: bu anahtar tarayıcıda
// görünmek için var), gerçek koruma veritabanı tarafındaki RLS
// politikalarında (public select + public insert, update/delete YOK).
// Hiçbir veri OTOMATİK gönderilmiyor - sadece kullanıcı "Skor Gönder"e
// dokunursa, ve sadece profildeki takma isim + skor gidiyor (gerçek isim,
// cihaz bilgisi vb. yok).
const SUPABASE_URL = 'https://wtrkfzmmhabcpoipaccf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_87EZgr1ftB1SnIY5FoDaKA_xmxlD7kU';
// Kaba, en-iyi-çaba bir uygunsuz-kelime filtresi - sunucu tarafında
// gerçek bir denetim yok (RLS bunu yapamaz), bu sadece ilk savunma
// katmanı, kesin degil.
const NAME_BLOCKLIST = ['fuck', 'shit', 'bitch', 'asshole', 'amk', 'aq', 'siktir', 'orospu', 'piç', 'yarrak', 'göt'];
function isNameAllowed(name) {
  const low = name.toLowerCase();
  return !NAME_BLOCKLIST.some((w) => low.includes(w));
}
const Leaderboard = {
  async submit(name, score, game) {
    game = game || 'river';
    const cleanName = String(name || '').trim().slice(0, 14) || 'Friend';
    if (!isNameAllowed(cleanName)) throw new Error('name-not-allowed');
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify([{ name: cleanName, score: Math.max(0, Math.min(99999, Math.floor(score))), game }]),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  },
  async top(game, limit) {
    game = game || 'river';
    limit = limit || 20;
    const url = `${SUPABASE_URL}/rest/v1/leaderboard?game=eq.${encodeURIComponent(game)}&select=name,score&order=score.desc&limit=${limit}`;
    const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
};

// "MEB'de ve sınıflarda kullanılabilmesi için öğretmen girişi
// oluşması lazım, her öğrencinin durumu kontrol edilebilmeli" -
// öğrenci tarafı: bir sınıf koduyla katılma + periyodik ilerleme
// senkronu. Öğretmen SADECE kendi sınıfını görebiliyor (bkz.
// classroom_schema.sql RLS politikaları) - bu genel skor tablosundan
// FARKLI bir gizlilik modeli, herkese açık değil, sadece o sınıfın
// öğretmenine.
const CLASSROOM_KEY = 'ke_classroom_v1';
function classroomKey() {
  const id = Profiles.active().id;
  return id === 'p1' ? CLASSROOM_KEY : CLASSROOM_KEY + '_' + id;
}
const Classroom = {
  _load() {
    try {
      const raw = JSON.parse(window.localStorage.getItem(classroomKey()));
      if (raw && raw.deviceId) return raw;
    } catch (e) { /* yok say */ }
    return { deviceId: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`), className: null, code: null };
  },
  _save(d) { try { window.localStorage.setItem(classroomKey(), JSON.stringify(d)); } catch (e) { /* yok say */ } idbPut(classroomKey(), d); },
  get() { return this._load(); },
  async join(code, name) {
    const d = this._load();
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/join_class`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ p_code: code.trim().toUpperCase(), p_device_id: d.deviceId, p_name: String(name || '').trim().slice(0, 20) || 'Friend' }),
    });
    if (!res.ok) throw new Error(res.status === 404 || res.status === 400 ? 'class-not-found' : `HTTP ${res.status}`);
    const rows = await res.json();
    d.className = rows[0] && rows[0].class_name;
    d.code = code.trim().toUpperCase();
    this._save(d);
    return d.className;
  },
  leave() {
    const d = this._load();
    d.className = null; d.code = null;
    this._save(d);
  },
  // Senkron: her 20 sn'de bir (flushTimeTrack) + uygulama açılışında +
  // internet geri gelince + "Şimdi eşitle" butonu. Aynı yük 5 dk içinde
  // tekrar gönderilmez (okul ağında 30 cihaz x 3/dk gereksiz istek olurdu).
  // v2: toplamların yanında hangi kategoride hangi bölümlerin bittiği ve
  // en çok zorlanılan kelimeler de gider (öğretmen paneli ayrıntısı).
  // Veritabanına v2 henüz kurulmadıysa (sync_v2_schema.sql çalıştırılmadı)
  // PostgREST 404 döner - o oturum için sessizce eski fonksiyona düşülür.
  // İstek başarısız olursa "pending" işaretlenir, internet gelince tekrar
  // denenir. keepalive: uygulama arka plana alınırken başlayan istek sayfa
  // dondurulsa da tamamlansın.
  _lastSent: '',
  _lastSentAt: 0,
  _v2: true,
  details() {
    const data = Progress._load();
    const cats = {};
    const hard = [];
    Object.keys(data).forEach((cid) => {
      const c = data[cid];
      if (!c) return;
      if (c.completed && c.completed.length) cats[cid] = c.completed.slice().sort((a, b) => a - b);
      Object.keys(c.missed || {}).forEach((w) => hard.push([cid, w, (c.missed[w] && c.missed[w].count) || 1]));
    });
    hard.sort((a, b) => b[2] - a[2]);
    // Atlama sinaviyla gecilen gezegenler (ogretmen portalinda sinif
    // basamagi hesabi icin) - sadece id listesi.
    let skipped = [];
    try { skipped = Journey._load().skipped.slice(0, 80); } catch (e) { /* yok say */ }
    return { v: 1, cats, hard: hard.slice(0, 12), skipped };
  },
  async sync(stars, streakDays, wordsLearned, minutesTotal, force) {
    const d = this._load();
    if (!d.code) return { skipped: true };
    const base = { p_device_id: d.deviceId, p_stars: stars, p_streak_days: streakDays, p_words_learned: wordsLearned, p_minutes_total: minutesTotal };
    const progress = this.details();
    const key = JSON.stringify([base, progress]);
    if (!force && key === this._lastSent && Date.now() - this._lastSentAt < 5 * 60 * 1000) return { skipped: true };
    const post = (fn, body) => fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify(body),
    });
    try {
      let res = null;
      if (this._v2) {
        res = await post('sync_progress_v2', Object.assign({}, base, { p_progress: progress }));
        if (res.status === 404) this._v2 = false;
      }
      if (!this._v2) res = await post('sync_progress', base);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this._lastSent = key;
      this._lastSentAt = Date.now();
      const d2 = this._load();
      d2.lastSyncAt = Date.now();
      d2.pending = false;
      this._save(d2);
      return { ok: true };
    } catch (e) {
      const d2 = this._load();
      d2.pending = true;
      this._save(d2);
      return { ok: false };
    }
  },
};

function classSyncLabel(cls) {
  if (cls.pending) return `⏳ ${L('Bekleyen ilerleme var, internet gelince gönderilecek', 'Progress waiting — will send when online')}`;
  if (!cls.lastSyncAt) return L('Henüz eşitlenmedi', 'Not synced yet');
  const min = Math.round((Date.now() - cls.lastSyncAt) / 60000);
  const ago = min < 1 ? L('az önce', 'just now') : min < 60 ? L(`${min} dk önce`, `${min} min ago`) : L(`${Math.round(min / 60)} sa önce`, `${Math.round(min / 60)} h ago`);
  return `✅ ${L('Son eşitleme', 'Last sync')}: ${ago}`;
}

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
    /* Onceki ahşap (turuncu/kahverengi degrade) çerçeve kaldırıldı -
       "uygulamanın etrafında kahverengi bir çerçeve var, kaldırır mısın"
       geri bildirimi. */
    background-origin: border-box;
    border: none;
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
    /* html,body'deki overscroll-behavior:none bu KENDI ic kaydirmasina
       (overflow-y:auto) miras gecmiyor - .ke-shell kendi scroll container'i.
       Bunsuz, telefonda alt/ust sinira gelince Android'in overscroll
       "glow" efekti (yesil kavisli seffaf sinir - "altinda yesil bir
       kisim var" geri bildirimi) tetikleniyor VE bazen bu jest tarayicinin
       kendi geri/ileri navigasyon jestiyle karisip ekrandan disari
       atiyor ("bir sonraki bolume gecemiyorum" / oyun ortasinda ana
       menuye donme bildirimleri) - masaustunde fare ile hic gorulmuyor. */
    overscroll-behavior: contain;
    min-height: 640px;
  }
  .ke-shell, .ke-shell *{ box-sizing: border-box; }
  .ke-fullscreen-btn, .ke-back-btn, .ke-screen-host{ position:relative; z-index:1; }
  .ke-shell.ke-fs{
    width: 100vw; height: 100vh; height: 100dvh; max-width: none;
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
  .ke-shell.ke-fs .ke-scene{ height: 70vh; height: 70dvh; }
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
  /* "bu fontların sadece sentence'ta sürükle bırak kısmında kalmasını
     istemiştim, diğer başlıkların hepsi değişecek" - chalk fontu
     (Fredericka the Great) artık HİÇBİR yerde kalmıyor: ne başlıklarda
     (.ke-title - kategori/bölüm/"My Aktapokus" vb.) ne de cümle kurma/
     harf turundaki kelime ve boşluklarda (.ke-quiz-word/.ke-speak-word/
     .ke-slot, önceki turda zaten Baloo 2'ye geçmişti) - hepsi tutarlı
     şekilde Baloo 2. */
  .ke-title{
    text-align:center; font-family:'Baloo 2','Fredoka',sans-serif; font-size:clamp(28px,5.6vw,44px);
    font-weight:700; margin:0 0 10px; letter-spacing:0; line-height:1.3;
    color: var(--kb-chalk);
    -webkit-text-stroke: 0;
    text-shadow: 0 2px 0 rgba(0,0,0,.3);
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

  /* "logoyu direkt kullanır mısın" - CSS'le çizilen bubble başlık yerine
     kullanıcının kendi ürettiği gerçek "Aktapokus Kids English" logosu
     (bkz. ui/mascot/aktapokus_kids_english_logo.png - arka planı flood-fill
     ile şeffaflaştırıldı, orijinali düz beyaz zeminliydi). */
  .ke-carnival-logo{
    display:block; margin:0 auto 6px; width:min(100%, 520px); height:auto;
    filter: drop-shadow(0 6px 0 rgba(0,0,0,.25));
  }
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
  .ke-mascot-btn > .ke-av-circle{ position:absolute; inset:0; width:100%; height:100%; }
  .ke-mascot-edit{
    position:absolute; bottom:-2px; right:-2px; z-index:3; width:30px; height:30px; border-radius:50%;
    background:#fff; display:flex; align-items:center; justify-content:center; font-size:14px;
    box-shadow:0 2px 0 rgba(0,0,0,.25);
  }
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
  /* Maskota dokununca acilan kompakt hizli-menu karti - "renkli
     kategorilerle progress, reward game, sound test, turkish ve avatar
     gelmeli" istegi. showGamePicker ile ayni kart-overlay deseni. */
  .ke-quickmenu-who{ display:flex; align-items:center; justify-content:center; gap:8px; font-weight:800; font-size:14.5px; color:var(--ke-ink); margin-bottom:4px; }
  .ke-quickmenu-avatar{ width:44px; height:44px; }
  .ke-quickmenu-grid{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:14px; }
  .ke-quickmenu-tile{
    display:flex; flex-direction:column; align-items:center; gap:5px;
    padding:14px 8px !important; border-radius:16px !important; color:#fff !important;
    font-size:12.5px !important; font-weight:800 !important; box-shadow:none !important; top:0 !important;
  }
  .ke-quickmenu-tile .qm-ico{ font-size:24px; }
  .ke-quickmenu-tile.qm-avatar{ grid-column:1 / -1; flex-direction:row; justify-content:center; padding:12px !important; background:var(--ke-yellow) !important; color:var(--ke-yellow-text) !important; --btn-shadow:var(--ke-yellow-dark); }
  .ke-quickmenu-tile.qm-avatar .qm-ico{ font-size:19px; }
  .ke-quickmenu-tile.qm-progress{ background:var(--ke-blue) !important; --btn-shadow:var(--ke-blue-dark); }
  .ke-quickmenu-tile.qm-game{ background:var(--ke-red) !important; --btn-shadow:var(--ke-red-dark); }
  .ke-quickmenu-tile.qm-sound{ background:var(--ke-green) !important; --btn-shadow:var(--ke-green-dark); }
  .ke-quickmenu-tile.qm-lang{ background:var(--ke-purple) !important; --btn-shadow:var(--ke-purple-dark); }
  .ke-quickmenu-tile.qm-rank{ background:#B08718 !important; --btn-shadow:#8C6A10; color:#fff !important; }
  .ke-quickmenu-tile.qm-guide{ background:#546E7A !important; --btn-shadow:#3E4F58; color:#fff !important; }
  .ke-quickmenu-tile:disabled{ opacity:.4; }

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
  /* Koyu tahta (soru/konuşma/cümle) açıkken bu 8px, tahtanın altında
     .ke-scene-wrap'ın kategori renkli degradesini şerit olarak
     gösteriyordu ("tahtanın arkasında hâlâ arka plan görünüyor" -
     Family & Home'da turuncu, Animals & Nature'da yeşil). */
  .ke-scene-narrow:has(.ke-quiz.ke-show, .ke-speak.ke-show, .ke-sentence.ke-show){ padding-bottom:0; }
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
  .ke-icon-hex-inner .ke-photo-img{ width:100%; height:100%; object-fit:cover; object-position:50% 18%; display:block; }
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
  @media (display-mode: standalone), (display-mode: fullscreen){ .ke-shell.ke-fs .ke-fullscreen-btn{ display:none !important; } }
  .ke-help-btn{ display:none; }
  @media (max-width:640px){
    .ke-shell .ke-help-btn{ display:flex; align-items:center; justify-content:center; position:absolute; top:8px; left:8px; z-index:8; width:36px; height:36px; padding:0 !important; border-radius:50% !important; font-size:18px !important; }
    /* .ke-jump-row burada bilerek YOK: telefonda sadece etiketsiz küçük
       ⓘ ile açılınca görünüyordu, "sonraki aşamalara (harf/cümle) geçiş
       butonu görünmüyor" geri bildirimi. Zaten kapalı bir <details>, tek
       satır yer kaplıyor. */
    .ke-shell:not(.ke-show-help) .ke-hint{ display:none; }
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
  .ke-quiz{ position:absolute; top:10px; left:3%; right:3%; bottom:10px; overflow-y:auto; max-width:620px; margin:0 auto; display:none; flex-direction:column; align-items:center; gap:16px; padding:52px 20px 26px; z-index:40; background:radial-gradient(ellipse 640px 260px at 50% 0%, #263229 0%, #1a231d 55%, #10160f 100%); border-radius:22px; box-shadow:none; }
  .ke-quiz.ke-show{ display:flex; }
  .ke-quiz-bubble{ position:static; transform:none; margin:0; }
  .ke-quiz-progress{ background:rgba(110,200,255,.1); border:2px dashed var(--kb-action); color:var(--kb-action); border-radius:10px 14px 10px 14px; padding:6px 16px; font-size:12.5px; font-weight:800; box-shadow:none; text-shadow:none; }
  .ke-quiz-word{ font-family:'Baloo 2','Fredoka',sans-serif; font-weight:700; font-size:26px; color:#F5F3EE; text-shadow:none; }
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

  .ke-speak{ position:absolute; top:10px; left:3%; right:3%; bottom:10px; overflow-y:auto; max-width:480px; margin:0 auto; display:none; flex-direction:column; align-items:center; gap:14px; padding:52px 20px 26px; z-index:40; background:radial-gradient(ellipse 640px 260px at 50% 0%, #263229 0%, #1a231d 55%, #10160f 100%); border-radius:22px; box-shadow:none; }
  .ke-speak.ke-show{ display:flex; }
  .ke-speak-progress{ background:rgba(110,200,255,.1); border:2px dashed var(--kb-action); color:var(--kb-action); border-radius:10px 14px 10px 14px; padding:6px 16px; font-size:12.5px; font-weight:800; box-shadow:none; text-shadow:none; }
  .ke-speak-card{ background:#ffffff; border:3px solid var(--ke-border); border-radius:24px; padding:18px 34px; display:flex; flex-direction:column; align-items:center; gap:8px; box-shadow:none; }
  .ke-speak-card .ke-icon-hex{ width:170px; height:170px; }
  .ke-speak-card .ke-icon-hex .ke-emoji-icon{ font-size:66px; }
  /* DİKKAT: bu metin .ke-speak-card'ın (BEYAZ kart) İÇİNDE — tahtanın
     üzerinde değil. Tebeşir-beyazı renk burada kart üstünde neredeyse
     görünmez olurdu; "tebeşir hissi" fontun şekli üzerinden korunuyor,
     renk okunaklılık için koyu tahta rengine çekildi. */
  .ke-speak-word{ font-family:'Baloo 2','Fredoka',sans-serif; font-size:30px; font-weight:700; color:var(--kb-board); letter-spacing:.5px; text-align:center; }
  .ke-speak-feedback{ min-height:20px; font-size:13.5px; font-weight:700; text-align:center; max-width:90%; color:#F3EEFF; text-shadow:none; }
  .ke-speak-mic{ display:inline-flex; align-items:center; gap:8px; background:var(--ke-blue); color:#fff; --btn-shadow:var(--ke-blue-dark); }
  /* Dinleme durumu kasıtlı olarak KIRMIZI değil — kırmızı bu uygulamada
     sadece "hata/yanlış" anlamına geliyor (bkz. ke-quiz-card.ke-wrong),
     dinlerken kırmızı görmek çocuğa yanlış yaptığı hissini veriyordu.
     Mor/mavi "ses" rolüne ayrılmış (bkz. STYLE üstündeki renk notu). */
  .ke-speak-mic.ke-listening{ background:var(--kb-voice); color:#1A1030; --btn-shadow:#9576D6; animation:ke-pulse 1s ease-in-out infinite; }
  @keyframes ke-pulse{ 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.06); } }

  .ke-sentence{ position:absolute; top:10px; left:3%; right:3%; bottom:10px; overflow-y:auto; max-width:620px; margin:0 auto; display:none; flex-direction:column; align-items:center; gap:16px; padding:48px 16px 26px; z-index:40; background:radial-gradient(ellipse 640px 260px at 50% 0%, #263229 0%, #1a231d 55%, #10160f 100%); border-radius:22px; box-shadow:none; }
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
  .ke-slot{ min-width:48px; height:44px; border-bottom:3px dashed rgba(245,240,223,.55); display:flex; align-items:center; justify-content:center; padding:0 6px; font-weight:700; font-family:'Baloo 2','Fredoka',sans-serif; color:var(--kb-chalk); text-shadow:none; font-size:19px; }
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
  .ke-lb-card{ max-width:360px; width:100%; }
  .ke-lb-list{ max-height:44vh; overflow-y:auto; display:flex; flex-direction:column; gap:6px; margin-top:4px; }
  .ke-lb-row{ display:flex; align-items:center; gap:10px; background:#fff; border:2px solid var(--ke-border); border-radius:12px; padding:8px 12px; }
  .ke-lb-rank{ font-size:15px; font-weight:800; width:26px; flex:none; text-align:center; }
  .ke-lb-name{ flex:1; text-align:left; font-weight:700; font-size:14px; color:var(--ke-ink); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .ke-lb-score{ font-weight:800; font-size:14px; color:#B08718; flex:none; }
  .ke-lb-loading, .ke-lb-empty{ padding:20px 10px; font-size:13.5px; font-weight:700; color:#8a7a55; text-align:center; }
  .ke-lb-submit-row{ display:flex; align-items:center; gap:8px; justify-content:center; margin-top:10px; }
  .ke-lb-submit-row input{ font-family:inherit; font-size:13px; font-weight:700; text-align:center; padding:8px 10px; border-radius:10px; border:2px dashed var(--ke-border); width:110px; }
  .ke-puzzle-game{ position:absolute; inset:0; z-index:100; background:#243b55; border-radius:inherit; overflow:hidden; display:flex; flex-direction:column; }
  .ke-puzzle-hud{ display:flex; align-items:center; justify-content:space-between; padding:calc(10px + env(safe-area-inset-top, 0px)) calc(14px + env(safe-area-inset-right, 0px)) 10px calc(14px + env(safe-area-inset-left, 0px)); z-index:2; }
  .ke-puzzle-moves{ background:rgba(0,0,0,.35); color:#FFD75A; font-weight:800; padding:6px 14px; border-radius:999px; font-size:14px; }
  .ke-puzzle-board-wrap{ flex:1; display:flex; align-items:center; justify-content:center; padding:16px; min-height:0; }
  .ke-puzzle-board{ position:relative; border-radius:12px; overflow:hidden; box-shadow:none; border:3px solid rgba(255,255,255,.4); background:rgba(0,0,0,.25); }
  /* touch-action:none sart - yoksa parmakla bir parcayi surukleme
     hareketi tarayici tarafindan SAYFA KAYDIRMA jesti sanilip
     ".ke-shell"i (overflow-y:auto) yukari/asagi kaydiriyordu ("ekran
     surekli yukari asagi kayiyor" geri bildirimi). */
  .ke-puzzle-tile{ position:absolute !important; display:block !important; top:0 !important; left:0 !important; margin:0; background-repeat:no-repeat; border:1px solid rgba(0,0,0,.35); box-shadow:none !important; padding:0 !important; border-radius:0 !important; transition:transform .16s ease; cursor:pointer; touch-action:none; }
  .ke-puzzle-tile:active{ filter:brightness(1.08); }

  /* --- Ödül oyunları v2: butonlar, paneller, HUD --- */
  .ke-shell .ke-game-btn{
    font-size:17px; font-weight:800; padding:12px 26px; border-radius:16px; border:none; transform:none; text-shadow:none;
    background:linear-gradient(180deg,#FFC94D,#FF9F1C); color:#3B2A1A; box-shadow:0 5px 0 #C46A00, 0 8px 18px rgba(0,0,0,.25);
  }
  .ke-shell .ke-game-btn:active:not(:disabled){ top:4px; box-shadow:0 1px 0 #C46A00; }
  .ke-shell .ke-game-btn:disabled{ opacity:.5; cursor:not-allowed; }
  .ke-shell .ke-game-btn-ghost{ background:#fff; color:#495057; box-shadow:0 5px 0 #CED4DA, 0 8px 18px rgba(0,0,0,.15); }
  .ke-shell .ke-game-btn-ghost:active:not(:disabled){ box-shadow:0 1px 0 #CED4DA; }
  .ke-shell .ke-game-btn-small{ font-size:14px; padding:9px 18px; }
  .ke-game-panel{
    background:linear-gradient(180deg,#FFFDF7,#F5EEDC); color:#3B2A1A; border-radius:24px; padding:22px 20px 20px;
    width:min(380px,100%); max-height:100%; overflow-y:auto; text-align:center; border:3px solid #E9D8A6;
    box-shadow:0 20px 50px rgba(0,0,0,.45), inset 0 0 0 3px rgba(255,255,255,.7);
    animation:ke-panel-in .35s cubic-bezier(.2,1.4,.4,1);
  }
  @keyframes ke-panel-in{ from{ transform:scale(.85) translateY(10px); opacity:0; } to{ transform:none; opacity:1; } }
  .ke-shell .ke-game-panel b, .ke-shell .ke-game-panel strong{ color:inherit; }
  .ke-panel-title{ font-family:'Fredoka','Baloo 2',sans-serif; font-weight:700; font-size:24px; margin:0 0 6px; }
  .ke-panel-sub{ margin:0 0 12px; font-size:14px; font-weight:700; color:#8A6A2A; }
  .ke-panel-tip{ margin:12px 0 14px; font-size:12.5px; font-weight:600; color:#6B5237; line-height:1.45; }
  .ke-panel-note{ margin:10px 0 14px; font-size:13px; font-weight:700; color:#8A6A2A; min-height:1em; }
  .ke-panel-actions{ display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-top:12px; }
  .ke-kbd-hint{ display:none; }
  @media (hover:hover) and (pointer:fine){ .ke-kbd-hint{ display:inline; } }
  .ke-howto{ display:flex; flex-direction:column; gap:8px; text-align:left; margin:10px 0 4px; }
  .ke-howto-row{ display:flex; align-items:center; gap:10px; background:#fff; border-radius:12px; padding:8px 10px; font-size:13.5px; font-weight:600; box-shadow:0 1px 0 #E9D8A6; }
  .ke-howto-ico{ font-size:20px; width:28px; text-align:center; flex:none; }
  .ke-gstars{ display:flex; justify-content:center; gap:6px; margin:4px 0 6px; }
  .ke-gstar{ font-size:40px; color:#DEE2E6; line-height:1; }
  .ke-gstar.on{ color:#FFC107; text-shadow:0 2px 0 #E0A800, 0 0 14px rgba(255,193,7,.6); animation:ke-star-pop .5s cubic-bezier(.2,1.6,.4,1) both; }
  @keyframes ke-star-pop{ from{ transform:scale(0) rotate(-40deg); } to{ transform:none; } }
  .ke-big-score{ font-family:'Fredoka','Baloo 2',sans-serif; font-weight:700; font-size:44px; line-height:1; color:#E67700; margin:2px 0 8px; }
  .ke-gstat-row{ display:flex; gap:8px; justify-content:center; margin:6px 0; }
  .ke-gstat{ flex:1; max-width:100px; background:#fff; border-radius:12px; padding:8px 4px; box-shadow:0 1px 0 #E9D8A6; display:flex; flex-direction:column; }
  .ke-gstat b{ font-size:18px; }
  .ke-gstat span{ font-size:11px; font-weight:700; color:#8A6A2A; text-transform:uppercase; letter-spacing:.04em; }
  .ke-word-chips{ display:flex; flex-wrap:wrap; gap:6px; justify-content:center; margin:8px 0 2px; }
  .ke-word-chip{ background:#E7F5FF; color:#1864AB; border-radius:999px; padding:4px 10px; font-size:13px; font-weight:800; }
  .ke-submit-status{ min-height:18px; font-size:12px; font-weight:800; margin-top:4px; }

  .ke-game-hud{
    position:absolute; top:0; left:0; right:0; z-index:3; display:flex; align-items:center; justify-content:space-between; gap:8px; pointer-events:none;
    padding:calc(8px + env(safe-area-inset-top, 0px)) calc(10px + env(safe-area-inset-right, 0px)) 8px calc(10px + env(safe-area-inset-left, 0px));
  }
  .ke-puzzle-game .ke-game-hud{ position:relative; }
  .ke-hud-group{ display:flex; align-items:center; gap:6px; pointer-events:auto; }
  .ke-hud-pill{ background:rgba(15,25,40,.62); color:#fff; font-weight:800; font-size:14px; padding:6px 12px; border-radius:999px; border:1.5px solid rgba(255,255,255,.18); white-space:nowrap; }
  .ke-hud-score{ color:#FFE066; }
  .ke-hud-hearts{ font-size:13px; letter-spacing:-2px; }
  .ke-hud-hearts .ke-lost{ filter:grayscale(1); opacity:.35; }
  .ke-shell .ke-hud-btn{ width:38px; height:38px; padding:0; border-radius:50%; background:rgba(15,25,40,.62); color:#fff; font-size:16px; border:1.5px solid rgba(255,255,255,.18); display:flex; align-items:center; justify-content:center; }
  .ke-shell .ke-hud-btn.ke-on{ background:#FFC94D; color:#3B2A1A; }
  .ke-hud-fuel{ flex:1; max-width:200px; display:flex; align-items:center; gap:6px; background:rgba(15,25,40,.62); padding:6px 10px; border-radius:999px; border:1.5px solid rgba(255,255,255,.18); pointer-events:auto; }
  .ke-hud-fuel-track{ flex:1; height:10px; border-radius:999px; background:rgba(255,255,255,.18); overflow:hidden; }
  .ke-hud-fuel-bar{ height:100%; width:100%; border-radius:999px; background:linear-gradient(90deg,#4DABF7,#74C0FC); transition:width .15s linear; }
  .ke-hud-fuel.ke-low .ke-hud-fuel-bar{ background:linear-gradient(90deg,#FA5252,#FF8787); }
  .ke-hud-fuel.ke-low{ animation:ke-fuel-blink .6s ease-in-out infinite; }
  @keyframes ke-fuel-blink{ 50%{ border-color:#FF8787; } }
  @media (max-width:420px){
    .ke-hud-pill{ font-size:12.5px; padding:5px 9px; }
    .ke-shell .ke-hud-btn{ width:34px; height:34px; font-size:14px; }
    .ke-hud-fuel{ max-width:110px; padding:5px 8px; }
  }

  /* Nehir: hedef kelime pankartı + geri sayım */
  .ke-river-target{
    position:absolute; left:50%; top:calc(58px + env(safe-area-inset-top, 0px)); transform:translateX(-50%); z-index:3;
    display:flex; align-items:center; gap:8px; background:rgba(255,255,255,.95); color:#3B2A1A; border-radius:999px; padding:6px 8px 6px 14px;
    box-shadow:0 6px 18px rgba(0,0,0,.3); border:3px solid #FFC94D; white-space:nowrap;
  }
  .ke-river-target[hidden]{ display:none; }
  .ke-river-target.ke-bump{ animation:ke-target-bump .45s cubic-bezier(.2,1.6,.4,1); }
  .ke-river-target.ke-ok{ animation:ke-target-ok .5s ease; }
  .ke-river-target.ke-bad{ animation:ke-target-bad .4s ease; }
  @keyframes ke-target-bump{ from{ transform:translateX(-50%) scale(.6); } to{ transform:translateX(-50%) scale(1); } }
  @keyframes ke-target-ok{ 40%{ border-color:#40C057; transform:translateX(-50%) scale(1.12); } }
  @keyframes ke-target-bad{ 20%,60%{ transform:translateX(calc(-50% - 6px)); border-color:#FA5252; } 40%,80%{ transform:translateX(calc(-50% + 6px)); } }
  .ke-target-label{ font-size:16px; }
  .ke-target-emoji{ font-size:30px; line-height:1; }
  .ke-target-word{ font-family:'Fredoka','Baloo 2',sans-serif; font-weight:700; font-size:18px; max-width:0; overflow:hidden; opacity:0; transition:max-width .3s ease, opacity .3s ease; }
  .ke-target-word.ke-show{ max-width:120px; opacity:1; }
  .ke-shell .ke-target-say{ width:36px; height:36px; padding:0; border-radius:50%; background:#E7F5FF; font-size:16px; }
  .ke-target-combo{ font-family:'Fredoka','Baloo 2',sans-serif; font-weight:700; font-size:16px; color:#fff; background:#F76707; border-radius:999px; padding:0; max-width:0; overflow:hidden; transition:all .25s ease; }
  .ke-target-combo.ke-show{ padding:3px 9px; max-width:60px; }
  .ke-river-countdown{
    position:absolute; inset:0; z-index:4; display:flex; align-items:center; justify-content:center; pointer-events:none; opacity:0;
    font-family:'Fredoka','Baloo 2',sans-serif; font-weight:700; font-size:96px; color:#fff; text-shadow:0 6px 0 rgba(0,0,0,.25), 0 0 30px rgba(0,0,0,.35);
  }
  .ke-river-countdown.ke-show{ animation:ke-count .6s cubic-bezier(.2,1.4,.4,1) forwards; }
  @keyframes ke-count{ 0%{ transform:scale(2.2); opacity:0; } 35%{ transform:scale(1); opacity:1; } 80%{ opacity:1; } 100%{ transform:scale(.9); opacity:0; } }

  /* Oyun seçici */
  .ke-picker-panel{ width:min(440px,100%); }
  .ke-picker-grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:6px 0 16px; }
  @media (max-width:380px){ .ke-picker-grid{ grid-template-columns:1fr; } }
  .ke-shell .ke-game-card{
    display:flex; flex-direction:column; align-items:center; gap:4px; padding:16px 10px 12px; border-radius:20px; color:#fff; text-align:center;
    box-shadow:0 6px 0 rgba(0,0,0,.18), 0 10px 22px rgba(0,0,0,.2); transition:transform .15s ease;
  }
  .ke-shell .ke-game-card:hover{ transform:translateY(-3px); }
  .ke-shell .ke-game-card:active:not(:disabled){ top:4px; box-shadow:0 2px 0 rgba(0,0,0,.18); }
  .ke-shell .ke-game-card-river{ background:linear-gradient(160deg,#4DABF7,#1971C2); }
  .ke-shell .ke-game-card-puzzle{ background:linear-gradient(160deg,#B197FC,#7048E8); }
  .ke-game-card-art{ font-size:48px; line-height:1.1; filter:drop-shadow(0 4px 4px rgba(0,0,0,.25)); }
  .ke-game-card-name{ font-family:'Fredoka','Baloo 2',sans-serif; font-size:17px; font-weight:700; }
  .ke-game-card-desc{ font-size:12px; font-weight:600; opacity:.92; line-height:1.3; }
  .ke-game-card-best{ margin-top:4px; font-size:12.5px; font-weight:800; background:rgba(0,0,0,.2); border-radius:999px; padding:3px 10px; color:#FFE066; }

  /* Yap-boz */
  .ke-puzzle-game{ background:radial-gradient(ellipse at 50% 30%, #3B5BDB, #1C2E6B 70%); }
  .ke-puzzle-board{ border-radius:14px; border:none; background:rgba(0,0,0,.35); box-shadow:0 14px 30px rgba(0,0,0,.45), inset 0 0 0 3px rgba(255,255,255,.15); }
  .ke-shell .ke-puzzle-tile{
    border:none; color:#fff; border-radius:8px !important;
    box-shadow:inset 0 0 0 2px rgba(255,255,255,.35), 0 3px 6px rgba(0,0,0,.35) !important;
    transition:transform .14s ease, border-radius .4s ease, box-shadow .4s ease;
  }
  .ke-shell .ke-puzzle-tile.ke-nope{ animation:ke-tile-nope .3s ease; }
  @keyframes ke-tile-nope{ 25%{ filter:brightness(.75); } }
  .ke-tile-num{ position:absolute; top:4px; left:5px; min-width:20px; height:20px; border-radius:10px; background:rgba(0,0,0,.55); color:#fff; font-size:11px; font-weight:800; line-height:20px; text-align:center; display:none; }
  .ke-show-nums .ke-tile-num{ display:block; }
  .ke-puzzle-full{ position:absolute; inset:0; z-index:5; background-size:cover; background-position:center; opacity:0; transition:opacity .25s ease; pointer-events:none; }
  .ke-puzzle-full.ke-show{ opacity:1; }
  .ke-puzzle-board.ke-solved .ke-puzzle-tile{ border-radius:0 !important; box-shadow:none !important; }
  .ke-puzzle-board.ke-solved .ke-tile-num{ display:none; }
  .ke-puzzle-board.ke-solved .ke-puzzle-full{ opacity:1; transition:opacity .6s ease .35s; }
  .ke-puzzle-board.ke-solved::after{
    content:''; position:absolute; inset:0; z-index:6; pointer-events:none; transform:translateX(-120%);
    background:linear-gradient(110deg, transparent 30%, rgba(255,255,255,.65) 50%, transparent 70%);
    animation:ke-shine .9s ease .6s forwards;
  }
  @keyframes ke-shine{ to{ transform:translateX(120%); } }
  .ke-puzzle-thumbs{ display:flex; gap:8px; justify-content:center; flex-wrap:wrap; }
  .ke-shell .ke-puzzle-thumb{ width:56px; height:56px; padding:0; border-radius:12px; background-size:cover; background-position:center; border:3px solid transparent; box-shadow:0 2px 6px rgba(0,0,0,.2); }
  .ke-shell .ke-puzzle-thumb.ke-sel{ border-color:#FF9F1C; transform:scale(1.08); }
  .ke-seg{ display:inline-flex; background:#EFE4CA; border-radius:999px; padding:4px; margin-top:12px; gap:4px; }
  .ke-shell .ke-seg-btn{ padding:7px 14px; border-radius:999px; font-size:13.5px; background:transparent; color:#6B5237; }
  .ke-shell .ke-seg-btn.ke-sel{ background:#fff; color:#3B2A1A; box-shadow:0 2px 4px rgba(0,0,0,.15); }
  .ke-shell .ke-seg-btn:active:not(:disabled){ top:0; }
  @keyframes ke-chip-pulse{ 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.06); } }
  .ke-game-chip-pulse{ animation:ke-chip-pulse 1.1s ease-in-out infinite; background:rgba(255,215,90,.22) !important; border-color:var(--kb-discover) !important; }
  .ke-bonus-quiz{ position:absolute; inset:0; z-index:150; background:rgba(10,20,30,.78); display:flex; align-items:center; justify-content:center; padding:20px; opacity:0; transition:opacity .25s ease; border-radius:inherit; }
  .ke-bonus-quiz.ke-show{ opacity:1; }
  .ke-bonus-quiz.ke-jr-skip{ position:fixed; }
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
  .ke-phasebar{ display:flex; justify-content:center; gap:4px; margin:0 auto 8px; max-width:520px; position:relative; z-index:2; }
  .ke-shell .ke-phase{
    flex:1; min-width:0; display:flex; flex-direction:column; align-items:center; gap:0; min-height:46px; padding:3px 2px !important;
    border-radius:12px !important; font-size:10.5px !important; font-weight:800 !important; top:0 !important; box-shadow:none !important;
    background:rgba(255,255,255,.08) !important; color:var(--kb-chalk-dim,#bbb) !important; border:2px solid rgba(255,255,255,.15) !important;
  }
  .ke-phase span{ font-size:17px; line-height:1.15; }
  .ke-shell .ke-phase.done{ background:rgba(76,175,80,.25) !important; color:#fff !important; border-color:rgba(120,210,120,.6) !important; cursor:pointer; }
  .ke-shell .ke-phase.cur{ background:#FFD84D !important; color:#3a2a00 !important; border-color:#FFD84D !important; opacity:1; }
  .ke-shell .ke-phase:disabled:not(.cur){ opacity:.45; }
  /* ---- UX paketi: alt gezinme, karsilama, ebeveyn, tepki, sohbet ---- */
  .ke-bnav{
    position:sticky; bottom:0; z-index:40; display:grid; grid-template-columns:repeat(4,1fr); gap:4px;
    margin:18px -16px 0; padding:6px 8px calc(6px + env(safe-area-inset-bottom,0px));
    background:rgba(18,26,22,.94); border-top:2px solid rgba(255,255,255,.14); backdrop-filter:blur(6px);
  }
  .ke-shell .ke-bnav-btn{
    display:flex; flex-direction:column; align-items:center; gap:1px; min-height:52px; padding:4px 2px !important;
    background:transparent !important; box-shadow:none !important; border:none !important; top:0 !important;
    color:var(--kb-chalk-dim,#ccc) !important; font-size:11.5px !important; font-weight:800 !important; border-radius:14px !important;
  }
  .ke-bnav-btn span{ font-size:21px; line-height:1.1; }
  .ke-shell .ke-bnav-btn.ke-sel{ color:#3a2a00 !important; background:#FFD84D !important; }
  .ke-shell .ke-say-btn{
    display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; min-width:34px; margin-left:6px;
    padding:0 !important; border-radius:50% !important; font-size:16px !important; vertical-align:middle;
    background:rgba(0,0,0,.08) !important; box-shadow:none !important; border:none !important; top:0 !important;
  }
  .ke-welcome{ max-width:460px; margin:0 auto; text-align:center; display:flex; flex-direction:column; align-items:center; gap:10px; padding-top:44px; position:relative; z-index:1; }
  .ke-welcome-lang{ display:flex; gap:8px; }
  .ke-welcome-bubble{ position:relative; background:#FFFDF4; color:#233; border-radius:22px; padding:12px 16px; text-align:left; font-weight:700; font-size:15.5px; line-height:1.4; box-shadow:0 5px 0 rgba(0,0,0,.25); }
  .ke-welcome-bubble p{ margin:0 0 6px; } .ke-welcome-bubble p:first-child{ font-size:19px; font-weight:800; }
  .ke-welcome-bubble::before{ content:''; position:absolute; top:-12px; left:50%; margin-left:-12px; border:12px solid transparent; border-top:0; border-bottom-color:#FFFDF4; }
  .ke-welcome-steps{ display:flex; gap:6px; } .ke-welcome-steps i{ width:28px; height:6px; border-radius:3px; background:rgba(255,255,255,.25); } .ke-welcome-steps i.on{ background:#FFD84D; }
  .ke-shell .ke-welcome-go{ width:min(320px,100%); min-height:58px; font-size:20px !important; font-weight:800 !important; border-radius:18px !important; background:#FFD84D !important; color:#3a2a00 !important; border:none !important; box-shadow:0 6px 0 #C99A12 !important; }
  .ke-parent-gate{ max-width:320px; text-align:center; }
  .ke-parent-q{ font-size:34px; font-weight:800; margin:8px 0; }
  .ke-parent-card{ margin-bottom:12px; }
  .ke-parent-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin:8px 0; text-align:center; }
  .ke-parent-grid b{ display:block; font-size:22px; color:var(--kb-chalk,#fff); } .ke-parent-grid span{ font-size:11px; font-weight:700; color:var(--kb-chalk-dim,#ccc); }
  .ke-parent-p{ font-size:14px; font-weight:600; color:var(--kb-chalk,#fff); margin:6px 0; line-height:1.45; }
  .ke-parent-note{ font-size:11.5px; font-weight:600; color:var(--kb-chalk-dim,#ccc); margin:4px 0 0; }
  .ke-parent-hard{ list-style:none; padding:0; margin:6px 0 0; display:grid; gap:4px; }
  .ke-parent-hard li{ font-size:13.5px; color:var(--kb-chalk,#fff); } .ke-parent-hard span{ opacity:.8; } .ke-parent-hard small{ opacity:.6; }
  .ke-quickmenu-tile.qm-parent{ background:#6D4C9E !important; --btn-shadow:#533a7a; }
  .ke-react{
    position:absolute; right:10px; top:10px; z-index:30; display:flex; align-items:center; gap:6px; pointer-events:none;
    background:#fff; color:#233; border-radius:999px; padding:4px 12px 4px 4px; font-weight:800; font-size:15px;
    box-shadow:0 4px 0 rgba(0,0,0,.2); animation:ke-react-in .35s cubic-bezier(.3,1.6,.5,1);
  }
  .ke-react.good{ border:3px solid #4CAF50; } .ke-react.bad{ border:3px solid #FFB020; }
  .ke-react.out{ opacity:0; transform:translateY(-8px); transition:all .35s; }
  .ke-react-av{ width:34px; height:34px; }
  @keyframes ke-react-in{ from{ transform:scale(.5); opacity:0; } to{ transform:none; opacity:1; } }
  .ke-chat{ display:flex; flex-direction:column; gap:6px; width:100%; max-width:460px; margin:6px auto; max-height:210px; overflow:auto; }
  .ke-chat-row{ display:flex; align-items:flex-end; gap:6px; }
  .ke-chat-row.me{ justify-content:flex-end; }
  .ke-chat-who{ width:34px; height:34px; flex:none; border-radius:50%; background:#FFD84D; display:flex; align-items:center; justify-content:center; font-size:19px; }
  .ke-chat-av{ width:34px; height:34px; }
  .ke-chat-b{ max-width:78%; padding:8px 12px; border-radius:18px; font-weight:700; font-size:15px; line-height:1.3; text-align:left; }
  .ke-chat-row.bot .ke-chat-b{ background:#fff; color:#233; border-bottom-left-radius:6px; }
  .ke-chat-row.me .ke-chat-b{ background:#DDF5D0; color:#1f4a17; border-bottom-right-radius:6px; }
  .ke-shell .ke-chat-mic{ margin:4px auto; font-size:14px !important; }
  .ke-jr-story{ display:flex; align-items:center; gap:10px; margin:0 auto 18px; max-width:300px; text-align:left; padding:8px 12px !important; border-radius:16px !important; background:linear-gradient(135deg,#8D6E63,#5D4037) !important; color:#fff !important; border:2px solid rgba(255,255,255,.5) !important; box-shadow:0 4px 0 rgba(0,0,0,.3) !important; top:0 !important; position:relative; }
  .ke-jr-story.locked{ opacity:.55; }
  .ke-jr-story-ic{ font-size:26px; } .ke-jr-story b{ display:block; font-size:13px; } .ke-jr-story small{ font-size:12px; font-weight:700; opacity:.9; }
  .ke-jr-grade-head{ position:relative; display:inline-flex; align-items:center; gap:8px; margin:14px auto 10px; padding:6px 16px; border-radius:99px; background:rgba(255,255,255,.14); border:2px solid rgba(255,255,255,.35); color:#fff; font-weight:800; font-size:15px; }
  .ke-jr-grade-head span{ font-size:20px; }
  .ke-shell .ke-jr-gradeskip{ position:relative; display:block; margin:-10px auto 22px; padding:10px 16px !important; min-height:44px; border-radius:14px !important; background:#FFD84D !important; color:#3a2a00 !important; font-weight:800 !important; font-size:13.5px !important; box-shadow:0 4px 0 #C99A12 !important; border:none !important; top:0 !important; }
  /* ---- Uzay Yolculugu ---- */
  .ke-journey{ max-width:560px; margin:0 auto; text-align:center; position:relative; z-index:1; }
  .ke-jr-hint{ font-size:12.5px; font-weight:700; color:var(--kb-chalk-dim,#ccc); margin:0 auto 10px; max-width:420px; line-height:1.4; }
  .ke-jr-path{
    position:relative; padding:18px 8px 40px; border-radius:26px; overflow:hidden;
    background:
      radial-gradient(1.5px 1.5px at 12% 8%, #fff 60%, transparent), radial-gradient(1px 1px at 72% 14%, #fff 60%, transparent),
      radial-gradient(1.5px 1.5px at 40% 30%, #cfe6ff 60%, transparent), radial-gradient(1px 1px at 88% 46%, #fff 60%, transparent),
      radial-gradient(1.5px 1.5px at 20% 62%, #fff 60%, transparent), radial-gradient(1px 1px at 60% 78%, #ffe9a8 60%, transparent),
      radial-gradient(1px 1px at 8% 92%, #fff 60%, transparent),
      radial-gradient(ellipse at 30% 0%, rgba(122,92,255,.35), transparent 60%),
      radial-gradient(ellipse at 80% 60%, rgba(255,90,170,.18), transparent 55%),
      linear-gradient(180deg, #0f1440 0%, #1a1256 45%, #0a0d2e 100%);
    background-size: 220px 260px, 220px 260px, 220px 260px, 220px 260px, 220px 260px, 220px 260px, 220px 260px, 100% 100%, 100% 100%, 100% 100%;
    border:3px solid rgba(255,255,255,.14);
  }
  .ke-jr-trail{ position:absolute; left:0; top:0; pointer-events:none; overflow:visible; }
  .ke-jr-trail path{ fill:none; stroke-linecap:round; }
  .ke-jr-trail-ahead{ stroke:rgba(255,255,255,.28); stroke-width:4; stroke-dasharray:2 11; }
  .ke-jr-trail-done{ stroke:#FFD84D; stroke-width:5; stroke-dasharray:10 8; filter:drop-shadow(0 0 4px rgba(255,216,77,.6)); }
  .ke-jr-start{ position:relative; color:#cfe6ff; font-weight:800; font-size:13px; margin-bottom:6px; }
  .ke-jr-row{ position:relative; display:flex; flex-direction:column; align-items:center; margin:6px 0 16px; }
  .ke-jr-row[data-zig="0"]{ transform:translateX(-22%); } .ke-jr-row[data-zig="2"]{ transform:translateX(22%); }
  .ke-shell .ke-jr-planet{
    position:relative; width:78px; height:78px; padding:5px !important; border-radius:50% !important; top:0 !important;
    background:conic-gradient(#FFD84D var(--ring), rgba(255,255,255,.18) 0) !important; box-shadow:0 6px 0 rgba(0,0,0,.35) !important;
    border:none !important;
  }
  .ke-jr-orb{
    display:flex; width:100%; height:100%; border-radius:50%; align-items:center; justify-content:center; font-size:32px;
    background:radial-gradient(circle at 32% 28%, var(--pt) 0%, var(--pc) 58%, rgba(0,0,0,.55) 130%);
    box-shadow:inset -6px -8px 0 rgba(0,0,0,.18);
  }
  .ke-jr-badge{ position:absolute; right:-4px; top:-4px; min-width:26px; height:26px; border-radius:13px; background:#fff; color:#2a7a2a; font-size:14px; font-weight:900; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 0 rgba(0,0,0,.3); }
  .ke-jr-locked .ke-jr-orb{ filter:grayscale(.85) brightness(.6); }
  .ke-jr-locked .ke-jr-badge{ color:#666; }
  .ke-shell .ke-jr-current .ke-jr-planet{ animation:ke-jr-pulse 1.8s ease-in-out infinite; }
  @keyframes ke-jr-pulse{ 0%,100%{ box-shadow:0 6px 0 rgba(0,0,0,.35), 0 0 0 0 rgba(255,216,77,.55); } 50%{ box-shadow:0 6px 0 rgba(0,0,0,.35), 0 0 0 14px rgba(255,216,77,0); } }
  .ke-jr-ship{ position:absolute; left:-58px; top:6px; display:flex; align-items:center; animation:ke-bob 2.4s ease-in-out infinite; pointer-events:none; }
  .ke-jr-avatar{ width:46px; height:46px; border:3px solid #fff; }
  .ke-jr-rocket{ font-size:20px; margin-left:-10px; margin-top:28px; }
  .ke-jr-label{ margin-top:6px; display:flex; flex-direction:column; color:#fff; line-height:1.2; max-width:170px; }
  .ke-jr-label b{ font-size:13.5px; font-weight:800; }
  .ke-jr-label span{ font-size:11px; font-weight:700; color:rgba(255,255,255,.7); }
  .ke-jr-locked .ke-jr-label{ opacity:.6; }
  .ke-jr-station{
    position:relative; display:flex; align-items:center; gap:10px; margin:10px auto 22px; max-width:320px; text-align:left;
    padding:10px 14px; border-radius:18px; background:rgba(255,255,255,.08); border:2px dashed rgba(255,255,255,.3); color:#fff;
  }
  .ke-jr-station div{ flex:1; display:flex; flex-direction:column; }
  .ke-jr-station b{ font-size:14.5px; } .ke-jr-station span{ font-size:11.5px; font-weight:700; color:rgba(255,255,255,.75); }
  .ke-jr-st-emoji{ font-size:34px; }
  .ke-jr-st-medal{ font-size:22px; }
  .ke-jr-station.ke-jr-reached{ background:linear-gradient(135deg, rgba(255,216,77,.3), rgba(255,154,31,.2)); border:2px solid #FFD84D; }
  .ke-jr-toast{ position:fixed; left:50%; top:70px; transform:translate(-50%,-20px); opacity:0; z-index:96; background:#FFD84D; color:#3a2a00; font-weight:800; font-size:14px; padding:10px 16px; border-radius:16px; box-shadow:0 4px 0 rgba(0,0,0,.25); transition:all .35s; max-width:90%; text-align:center; }
  .ke-jr-toast.ke-show{ opacity:1; transform:translate(-50%,0); }
  .ke-jr-cp-card{ position:relative; overflow:hidden; text-align:center; max-width:360px; }
  .ke-jr-cp-emoji{ font-size:64px; animation:ke-bob 1.6s ease-in-out infinite; }
  .ke-jr-cp-gift{ font-weight:800; }
  .ke-jr-sheet{ align-items:flex-end !important; }
  .ke-jr-sheet-card{ position:relative; width:min(520px,100%); max-height:82%; overflow:auto; text-align:left; border-top:6px solid var(--pc); }
  .ke-shell .ke-jr-sheet-x{ position:absolute; right:10px; top:10px !important; width:40px; height:40px; padding:0 !important; border-radius:50% !important; font-size:16px !important; background:rgba(0,0,0,.08) !important; box-shadow:none !important; color:inherit !important; }
  .ke-jr-sheet-head{ display:flex; align-items:center; gap:12px; margin-bottom:8px; padding-right:40px; }
  .ke-jr-sheet-head h2{ margin:2px 0 0; font-size:20px; }
  .ke-jr-sheet-orb{ width:52px; height:52px; border-radius:50%; flex:none; display:flex; align-items:center; justify-content:center; font-size:26px; background:radial-gradient(circle at 32% 28%, #fff 0%, var(--pc) 60%); }
  .ke-jr-sheet-lead{ font-weight:700; font-size:14px; margin:6px 0 10px; }
  .ke-jr-moons{ display:grid; grid-template-columns:repeat(auto-fill,minmax(56px,1fr)); gap:8px; }
  .ke-shell .ke-jr-moon{ display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:56px; padding:4px !important; border-radius:16px !important; font-size:18px !important; background:#EEF1FA !important; color:#233 !important; box-shadow:0 3px 0 rgba(0,0,0,.12) !important; top:0 !important; }
  .ke-jr-moon small{ font-size:11px; font-weight:800; }
  .ke-shell .ke-jr-moon.done{ background:#FFF3C4 !important; }
  .ke-shell .ke-jr-moon.locked{ opacity:.5; }
  .ke-jr-moon.ke-shake, .ke-dot.ke-shake{ animation:ke-shake-x .35s ease; }
  .ke-map .ke-dot.locked{ opacity:.55; }
  .ke-jr-way{ display:flex; flex-direction:column; gap:6px; padding:12px; border-radius:16px; background:#F3F5FB; margin-bottom:10px; }
  .ke-jr-way span{ font-size:13px; font-weight:600; }
  .ke-jr-q{ font-weight:800; margin:0 0 10px; }
  .ke-jr-listen{ margin-bottom:12px; }
  .ke-jr-pics{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
  .ke-shell .ke-jr-pic{ padding:6px !important; border-radius:16px !important; background:#fff !important; border:3px solid var(--ke-border,#ddd) !important; box-shadow:none !important; top:0 !important; display:flex; justify-content:center; }
  .ke-jr-pic .ke-icon-hex{ width:72px; height:72px; }
  .ke-shell .ke-jr-pic.ke-bonus-right{ border-color:var(--kb-correct,#4CAF50) !important; background:#EFFCE5 !important; }
  .ke-shell .ke-jr-pic.ke-bonus-wrong{ border-color:#E5484D !important; opacity:.7; }
  .ke-jr-missed span{ display:inline-block; background:#FFF3C4; border-radius:10px; padding:2px 8px; margin:2px; font-weight:800; }
  .ke-jr-medals{ display:grid; grid-template-columns:repeat(6,1fr); gap:6px; margin-top:8px; }
  .ke-jr-medal{ display:flex; flex-direction:column; align-items:center; padding:6px 2px; border-radius:12px; background:rgba(255,255,255,.06); opacity:.6; }
  .ke-jr-medal.got{ background:rgba(255,216,77,.2); opacity:1; }
  .ke-jr-medal span{ font-size:22px; } .ke-jr-medal small{ font-size:10px; font-weight:800; color:var(--kb-chalk,#fff); }
  /* Ana ekran: yolculuk karti (bugunun gorevi) + tekrar cipi + kutuphane */
  .ke-jhome{
    max-width:560px; margin:4px auto 12px; padding:14px 16px; border-radius:24px; text-align:left; color:#fff; position:relative; z-index:1;
    background:radial-gradient(1.5px 1.5px at 85% 20%, #fff 60%, transparent), radial-gradient(1px 1px at 60% 70%, #fff 60%, transparent), linear-gradient(135deg,#2B2A8C 0%,#5B2BB5 60%,#9C2FA8 100%);
    border:3px solid rgba(255,255,255,.35); box-shadow:0 6px 0 rgba(0,0,0,.3);
  }
  .ke-jhome-top{ display:flex; align-items:center; gap:12px; }
  .ke-jhome-planet{ width:58px; height:58px; flex:none; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:28px; background:radial-gradient(circle at 32% 28%, #fff 0%, var(--pc) 60%, rgba(0,0,0,.4) 130%); }
  .ke-jhome-text{ min-width:0; }
  .ke-jhome-kicker{ font-size:11.5px; font-weight:800; opacity:.85; letter-spacing:.02em; }
  .ke-jhome-title{ font-family:'Fredoka','Baloo 2',sans-serif; font-size:21px; font-weight:700; line-height:1.15; }
  .ke-jhome-sub{ font-size:12.5px; font-weight:700; opacity:.9; }
  .ke-jhome-bar{ height:10px; border-radius:99px; background:rgba(255,255,255,.2); overflow:hidden; margin:12px 0 3px; }
  .ke-jhome-bar i{ display:block; height:100%; border-radius:99px; background:linear-gradient(90deg,#FFD84D,#FF9A1F); }
  .ke-jhome-meta{ font-size:11.5px; font-weight:800; opacity:.85; }
  .ke-jhome-actions{ display:flex; gap:8px; margin-top:10px; }
  .ke-shell .ke-jhome-go{ flex:1; font-size:18px !important; padding:13px 16px !important; background:#FFD84D !important; color:#3a2a00 !important; border:none !important; border-radius:16px !important; box-shadow:0 5px 0 #C99A12 !important; font-weight:800 !important; }
  .ke-shell .ke-jhome-map{ font-size:14px !important; padding:12px 14px !important; background:rgba(255,255,255,.16) !important; color:#fff !important; border:2px solid rgba(255,255,255,.45) !important; border-radius:16px !important; box-shadow:none !important; font-weight:800 !important; }
  .ke-shell .ke-due-chip{
    display:flex; align-items:center; justify-content:space-between; gap:8px; width:min(560px,100%); margin:0 auto 14px; min-height:48px;
    padding:10px 16px !important; border-radius:16px !important; background:#FFF3C4 !important; color:#5a3f00 !important;
    font-size:15px !important; font-weight:800 !important; box-shadow:0 4px 0 #E0B84A !important; position:relative; z-index:1;
  }
  .ke-lib-head{ max-width:980px; margin:8px auto 10px; color:var(--kb-chalk,#fff); font-size:18px; text-align:left; position:relative; z-index:1; }
  .ke-lib-head span{ display:block; font-size:12px; font-weight:700; color:var(--kb-chalk-dim,#ccc); }
  .ke-shell .ke-lib-grid{ gap:10px; }
  @media (max-width:560px){
    .ke-shell .ke-lib-grid{ grid-template-columns:repeat(2,minmax(0,1fr)); }
    .ke-lib-grid .ke-category-card{ flex-direction:column; align-items:flex-start; gap:6px; padding:12px; border-radius:18px; }
    .ke-lib-grid .ke-category-icon{ width:42px; height:42px; font-size:20px; }
    .ke-lib-grid .ke-category-title{ font-size:15.5px; }
    .ke-lib-grid .ke-category-meta{ font-size:11.5px; }
    .ke-lib-grid .ke-category-meta:first-of-type{ display:none; }
  }
  .ke-profile-screen{ max-width:760px; margin:0 auto; text-align:center; position:relative; z-index:1; }
  /* ---- Avatar v2 ----
     .ke-av = govde gorselinin kendi 2:3 kutusu; tum katmanlar (sapka,
     esya, dost) bu kutuya gore cqw ile konumlaniyor, boylece her boyutta
     ayni yere oturuyor. */
  .ke-av{ position:relative; width:100%; aspect-ratio:2/3; container-type:inline-size; }
  .ke-av > img.ke-av-body{ display:block; width:100%; height:100%; object-fit:contain; user-select:none; -webkit-user-drag:none; transition:opacity .15s; }
  .ke-av > img.ke-av-pending{ opacity:0; }
  .ke-av > .ke-mascot-hat{ animation:none; }
  .ke-av-layer{
    position:absolute; z-index:2; line-height:1; pointer-events:none; user-select:none;
    font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;
    filter:drop-shadow(0 0 .02em #fff) drop-shadow(0 .03em .03em rgba(0,0,0,.3));
  }
  .ke-av-pet{ z-index:3; }
  .ke-av.ke-av-pop{ animation:ke-av-pop .45s cubic-bezier(.3,1.6,.5,1); }
  @keyframes ke-av-pop{ 0%{ transform:scale(.92); } 60%{ transform:scale(1.05); } 100%{ transform:none; } }
  /* Yuvarlak rozet: bas-omuz kadraji. Sapka varsa kadraj biraz asagi
     kayiyor ki sapka kesilmesin. */
  .ke-av-circle{ position:relative; display:inline-block; flex:none; border-radius:50%; overflow:hidden; vertical-align:middle; box-shadow:inset 0 -3px 0 rgba(0,0,0,.12); }
  .ke-av-circle > .ke-av{ position:absolute; width:135%; left:-17.5%; top:-2%; }
  .ke-av-circle > .ke-av.ke-av-hashat{ width:118%; left:-9%; top:14%; }
  .ke-avatar-stage{
    position:relative; width:min(250px,62vw); aspect-ratio:5/6; margin:14px auto 4px; border-radius:26px;
    overflow:hidden; border:4px solid rgba(255,255,255,.85); box-shadow:0 6px 0 rgba(0,0,0,.25);
  }
  .ke-avatar-stage > .ke-av{ position:absolute; width:60%; left:20%; bottom:-1%; transition:left .25s; }
  .ke-avatar-stage.ke-has-pet > .ke-av{ left:11%; }
  .ke-av-deco{ position:absolute; font-size:clamp(18px,6vw,28px); opacity:.85; pointer-events:none; animation:ke-bob 3.4s ease-in-out infinite; }
  .ke-av-deco.d0{ top:8%; left:8%; } .ke-av-deco.d1{ top:14%; right:9%; animation-delay:-1.2s; } .ke-av-deco.d2{ top:46%; left:5%; animation-delay:-2.1s; }
  .ke-av-preview{ position:relative; }
  .ke-shell .ke-av-dice{
    position:absolute; top:22px; right:calc(50% - min(125px,31vw) + 8px); z-index:4;
    width:44px; height:44px; padding:0 !important; border-radius:50% !important; font-size:22px !important;
    background:#fff !important; box-shadow:0 3px 0 rgba(0,0,0,.25) !important;
  }
  .ke-av-studio{ display:flex; flex-direction:column; align-items:center; gap:6px; }
  .ke-av-controls{ width:100%; display:flex; flex-direction:column; align-items:center; gap:8px; }
  .ke-av-tabs{ display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:5px; width:100%; max-width:440px; padding:4px 0 6px; }
  .ke-shell .ke-av-tab{
    display:flex; flex-direction:column; align-items:center; gap:1px; min-width:0; min-height:48px;
    padding:6px 2px !important; border-radius:14px !important; font-size:11.5px !important; font-weight:800 !important;
    background:rgba(255,255,255,.1) !important; color:var(--kb-chalk,#fff) !important; box-shadow:none !important; top:0 !important;
    border:2px solid rgba(255,255,255,.18) !important;
  }
  .ke-av-tab span{ font-size:19px; }
  .ke-shell .ke-av-tab.ke-sel{ background:#FFD84D !important; color:#3a2a00 !important; border-color:#FFD84D !important; }
  .ke-av-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(74px,1fr)); gap:8px; width:100%; max-width:440px; }
  .ke-shell .ke-pick-tile{
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; min-height:74px;
    padding:6px 4px !important; background:rgba(255,255,255,.1) !important; color:var(--kb-chalk,#fff) !important;
    border:2px solid rgba(255,255,255,.18) !important; box-shadow:none !important; top:0 !important;
  }
  .ke-pick-emo{ font-size:28px; line-height:1; }
  .ke-pick-name{ font-size:10.5px; font-weight:800; line-height:1.15; }
  .ke-pick-tile .ke-sw{ width:30px; height:30px; }
  .ke-pick-tile .ke-sw-shirt{ border-radius:8px; background-image:repeating-linear-gradient(180deg, transparent 0 5px, rgba(255,255,255,.9) 5px 9px) !important; }
  .ke-pick-tile .ke-sw-scene{ width:40px; height:30px; border-radius:8px; display:inline-flex; align-items:center; justify-content:center; font-size:16px; }
  .ke-shell .ke-pick-tile.ke-sel{ background:rgba(255,216,77,.22) !important; border-color:#FFD84D !important; outline:none; }
  /* Kilitli parca rengini/seklini gosteriyor (hedef gorunsun), sadece soluk */
  .ke-shell .ke-pick-tile.ke-lock{ opacity:.62; border-style:dashed !important; }
  .ke-av-unlock{ width:100%; max-width:440px; font-size:12px; font-weight:800; color:var(--kb-chalk-dim,#ccc); line-height:1.5; }
  .ke-av-unlock-bar{ height:8px; border-radius:99px; background:rgba(255,255,255,.12); overflow:hidden; margin-bottom:4px; }
  .ke-av-unlock-bar i{ display:block; height:100%; background:linear-gradient(90deg,#FFD84D,#FF9A1F); border-radius:99px; }
  @media (min-width:700px){
    .ke-av-studio{ flex-direction:row; align-items:flex-start; justify-content:center; gap:22px; }
    .ke-av-preview{ flex:none; }
    .ke-avatar-stage{ width:260px; margin-top:6px; }
    .ke-shell .ke-av-dice{ top:14px; right:10px; }
    .ke-av-controls{ max-width:440px; }
  }
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
    .ke-shell .ke-scene.ke-scene-narrow .ke-obj .ke-icon-hex{ max-width:min(190px, calc((100vh - 335px) / 3)); max-width:min(190px, calc((100dvh - 335px) / 3)); }
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

  /* Story Time (StoryBook ppt'sinden adapte edilen okuma bölümü) —
     kategori kartlarından bilinçli olarak ayrı bir görünüm: quiz yok,
     sayfa sayfa resim+metin. Kart görselleri kaynakta düşük çözünürlük
     (~190x190px) geldiği için büyük gösterilmiyor, kart içinde küçük
     kapak/önizleme olarak kullanılıyor. */
  .ke-story-list{ display:flex; flex-direction:column; gap:14px; max-width:560px; margin:0 auto; position:relative; z-index:1; }
  .ke-story-card{
    display:flex; align-items:center; gap:14px; text-align:left; cursor:pointer;
    background:linear-gradient(135deg,#8D6E63,#6d5450); border:3px solid rgba(255,255,255,.5);
    border-radius:22px; padding:12px 16px;
    transition: transform .12s ease;
  }
  .ke-story-card:hover{ transform:translateY(-2px); }
  .ke-story-card:active{ transform:translateY(1px); }
  .ke-story-cover{ width:56px; height:56px; border-radius:14px; object-fit:cover; flex-shrink:0; background:#fff; }
  .ke-story-info{ min-width:0; flex:1; }
  .ke-story-eyebrow{ font-size:11.5px; font-weight:800; color:rgba(255,255,255,.75); text-transform:uppercase; letter-spacing:.04em; }
  .ke-story-title{ font-family:'Fredoka','Baloo 2',sans-serif; font-weight:700; font-size:18px; color:#fff; margin:2px 0; }
  .ke-story-meta{ font-size:12.5px; color:rgba(255,255,255,.85); font-weight:600; line-height:1.35; }
  .ke-story-reader{ display:flex; flex-direction:column; align-items:center; gap:10px; max-width:480px; margin:0 auto; position:relative; z-index:1; text-align:center; }
  .ke-story-cover-page{ gap:14px; }
  .ke-story-cover-big{ width:min(240px,70vw); border-radius:18px; box-shadow:0 10px 24px rgba(0,0,0,.35); }
  .ke-story-page-img{ width:190px; height:190px; object-fit:contain; border-radius:18px; background:#fff; box-shadow:0 6px 16px rgba(0,0,0,.3); }
  .ke-story-card-title{ font-family:'Fredoka','Baloo 2',sans-serif; font-weight:700; font-size:20px; color:var(--kb-chalk); margin:0; }
  .ke-story-text{ font-size:16.5px; font-weight:600; color:var(--kb-chalk); line-height:1.5; }
  .ke-story-text p{ margin:0 0 6px; }
  .ke-story-word{ border-radius:5px; padding:1px 2px; transition:background-color .1s ease, color .1s ease; }
  .ke-story-word-active{ background:var(--kb-discover); color:var(--ke-ink); }

  /* Uygulama içi kullanım kılavuzu - akordeon liste, her madde gerçek
     bileşenlerin inert küçük örneklerini gösteriyor (bkz. showGuide). */
  .ke-guide-list{ display:flex; flex-direction:column; gap:10px; max-width:560px; margin:0 auto; position:relative; z-index:1; }
  .ke-guide-item{ background:rgba(255,255,255,.05); border:2px solid rgba(255,255,255,.15); border-radius:16px; overflow:hidden; }
  .ke-guide-summary{
    list-style:none; cursor:pointer; display:flex; align-items:center; gap:10px;
    padding:14px 16px; font-family:'Fredoka','Baloo 2',sans-serif; font-weight:700; font-size:15.5px; color:var(--kb-chalk);
  }
  .ke-guide-summary::-webkit-details-marker{ display:none; }
  .ke-guide-summary::after{ content:'▾'; margin-left:auto; transition:transform .15s ease; }
  .ke-guide-item[open] .ke-guide-summary::after{ transform:rotate(180deg); }
  .ke-guide-ico{ font-size:20px; flex-shrink:0; }
  .ke-guide-body{ padding:0 16px 16px; }
  .ke-guide-body p{ margin:0 0 12px; font-size:14px; font-weight:600; color:var(--kb-chalk-dim); line-height:1.5; }
  .ke-guide-demo{ background:rgba(0,0,0,.2); border-radius:14px; padding:14px; display:flex; justify-content:center; }
  .ke-story-glossary{ display:grid; grid-template-columns:repeat(auto-fill, minmax(150px,1fr)); gap:10px; width:100%; }
  .ke-story-glossary-item{
    display:flex; flex-direction:column; gap:2px; background:rgba(255,255,255,.08);
    border:2px solid rgba(255,255,255,.25); border-radius:14px; padding:10px 12px; text-align:left;
  }
  .ke-story-glossary-item b{ font-size:15px; color:#fff; }
  .ke-story-glossary-item span{ font-size:13px; color:var(--kb-chalk-dim); }
  .ke-story-record-bar{ width:100%; margin-top:10px; }
  .ke-story-record-bar .ke-recording{ background:var(--kb-wrong); color:#fff; animation:ke-rec-pulse 1s ease-in-out infinite; }
  @keyframes ke-rec-pulse{ 0%,100%{ opacity:1; } 50%{ opacity:.7; } }
  .ke-story-record-bar audio{ border-radius:999px; }

  /* --- Kitap görünümü (Story Time okuyucu) --- */
  .ke-book-stage{
    --paper:#FBF3E1; --ink:#3B2A1A; --ink-soft:#6B5237;
    --edge-a:#E9DCC0; --edge-b:#F6ECD5;
    --paper-img:radial-gradient(ellipse at 30% 0%, rgba(255,255,255,.55), transparent 60%), repeating-linear-gradient(0deg, rgba(120,90,40,.05) 0 1px, transparent 1px 4px);
    position:relative; z-index:1; max-width:880px; margin:52px auto 0; padding:0 6px 10px;
    touch-action:pan-y; user-select:none; -webkit-user-select:none;
  }
  .ke-book{ position:relative; margin:0 auto; }
  .ke-page{ position:relative; background-color:var(--paper); background-image:var(--paper-img); color:var(--ink); }
  /* Telefonda iki yarı tek kağıt: kağıt dokusu kitabın kendisinde, yoksa
     ikinci yarının üst parlaklığı ortada bir dikiş çizgisi gibi görünüyordu. */
  .ke-book-spread{ background-color:var(--paper); background-image:var(--paper-img); }
  .ke-book-spread > .ke-page{ background:none; }
  .ke-book-spread, .ke-book-single{
    border-radius:4px 14px 14px 4px;
    box-shadow:1px 1px 0 var(--edge-a), 2px 2px 0 var(--edge-b), 3px 3px 0 var(--edge-a), 4px 4px 0 var(--edge-b), 5px 5px 0 var(--edge-a), 0 18px 34px rgba(0,0,0,.5);
  }
  .ke-book-spread > .ke-page:first-child, .ke-book-single > .ke-page{ border-radius:4px 0 0 4px; }
  .ke-book-spread > .ke-page:last-child, .ke-book-single > .ke-page{ border-top-right-radius:14px; border-bottom-right-radius:14px; }
  /* Telefonda tek sayfa: resim üstte, metin altta, sol kenarda cilt gölgesi */
  .ke-book-spread{ display:flex; flex-direction:column; max-width:460px; }
  .ke-book-spread > .ke-page-left{ border-radius:4px 14px 0 0; padding:22px 20px 6px 30px; }
  .ke-book-spread > .ke-page-right{ border-radius:0 0 14px 4px; padding:4px 20px 44px 30px; }
  .ke-book-spread::before, .ke-book-single::before{
    content:''; position:absolute; top:0; bottom:0; left:0; width:26px; z-index:2; pointer-events:none;
    background:linear-gradient(90deg, rgba(60,40,10,.30), rgba(90,60,20,.10) 55%, transparent);
    border-radius:4px 0 0 4px;
  }
  .ke-page-illo{ display:flex; justify-content:center; }
  .ke-page-illo img{
    width:min(240px, 62vw); aspect-ratio:1; object-fit:cover; background:#fff;
    border:6px solid #fff; border-radius:4px; box-shadow:0 2px 8px rgba(60,40,10,.35);
    transform:rotate(-1.5deg);
  }
  .ke-page-inner{ text-align:center; }
  .ke-chapter-orn{ color:#B08718; font-size:18px; line-height:1; margin:10px 0 2px; }
  .ke-book .ke-story-card-title{ color:var(--ink); font-size:21px; margin:0 0 10px; text-shadow:none; }
  .ke-book .ke-story-text{ color:var(--ink); font-size:18px; font-weight:600; line-height:1.65; }
  .ke-book .ke-story-text p{ margin:0 0 4px; }
  .ke-book .ke-story-word-active{ background:#FFE066; color:var(--ink); box-shadow:0 0 0 2px #FFE066; }
  .ke-page-num{ position:absolute; left:0; right:0; bottom:14px; text-align:center; font-size:13px; font-weight:700; color:var(--ink-soft); letter-spacing:.06em; }
  /* Sağ alt kıvrık köşe - dokununca sonraki sayfa */
  /* .ke-shell button tabanı position:relative veriyor (daha yüksek
     özgüllük) - köşe sol alta kayıyordu, bu yüzden !important. */
  .ke-shell .ke-page-curl{
    position:absolute !important; left:auto !important; top:auto !important; right:0 !important; bottom:0 !important;
    width:46px; height:46px; padding:0 !important; border:none !important; margin:0 !important;
    border-radius:0 0 14px 0 !important; cursor:pointer; box-shadow:none !important; --btn-shadow:transparent !important;
    background:linear-gradient(315deg, #14231A 0 50%, #D9C59C 50%, #F3E7CC 76%, #E6D6B3 100%) !important;
    filter:drop-shadow(-2px -2px 2px rgba(60,40,10,.25));
    transition:width .15s ease, height .15s ease;
  }
  .ke-shell .ke-page-curl:hover, .ke-shell .ke-page-curl:focus-visible{ width:56px; height:56px; }
  .ke-page-curl:focus-visible{ outline:2px solid var(--kb-action); outline-offset:2px; }

  /* Kapak */
  .ke-book-cover{
    width:min(300px, 76vw); aspect-ratio:3/4.1; cursor:pointer;
    border-radius:6px 16px 16px 6px; padding:18px 18px 18px 34px;
    display:flex; flex-direction:column; align-items:center; gap:12px;
    background:
      linear-gradient(90deg, rgba(0,0,0,.35) 0 18px, rgba(255,255,255,.08) 18px 21px, transparent 21px),
      radial-gradient(ellipse at 40% 20%, #9C7A6B, #6D4C41 60%, #4E342E);
    box-shadow:3px 3px 0 #E9DCC0, 5px 5px 0 #F6ECD5, 6px 6px 0 #E9DCC0, 0 20px 36px rgba(0,0,0,.55);
  }
  .ke-book-cover:focus-visible{ outline:3px solid var(--kb-action); outline-offset:4px; }
  .ke-cover-frame{ flex:1; min-height:0; width:100%; border:4px solid #D4AF37; border-radius:6px; overflow:hidden; box-shadow:0 0 0 3px rgba(0,0,0,.25), inset 0 0 12px rgba(0,0,0,.4); background:#000; }
  .ke-cover-frame img{ width:100%; height:100%; object-fit:cover; display:block; }
  .ke-cover-plate{
    width:100%; text-align:center; padding:8px 10px; border-radius:6px;
    background:linear-gradient(#FBF3E1, #EFE1C0); border:2px solid #D4AF37; color:#3B2A1A;
    display:flex; flex-direction:column; gap:1px;
  }
  .ke-cover-ep{ font-size:11px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:#8A6A2A; }
  .ke-cover-title{ font-family:'Fredoka','Baloo 2',sans-serif; font-weight:700; font-size:20px; line-height:1.15; }
  .ke-cover-author{ font-size:10.5px; font-weight:700; color:#8A6A2A; }
  .ke-book-intro{ text-align:center; max-width:420px; margin:18px auto 0; color:var(--kb-chalk-dim); font-size:14.5px; font-weight:700; position:relative; z-index:1; }

  /* Son sayfa: kelime listesi */
  .ke-book-single{ max-width:520px; }
  .ke-book-single > .ke-page{ padding:10px 22px 26px 34px; }
  .ke-gloss-sub{ margin:0 0 12px; font-size:14px; font-weight:700; color:var(--ink-soft); }
  .ke-book .ke-story-glossary{ grid-template-columns:repeat(2, 1fr); gap:6px 14px; text-align:left; }
  .ke-book .ke-story-glossary-item{ background:transparent; border:none; border-bottom:1.5px dotted rgba(107,82,55,.45); border-radius:0; padding:5px 2px; flex-direction:row; justify-content:space-between; align-items:baseline; gap:8px; }
  .ke-book .ke-story-glossary-item b{ color:var(--ink); font-size:15px; }
  .ke-book .ke-story-glossary-item span{ color:var(--ink-soft); font-size:13px; text-align:right; }
  .ke-book-end{ margin-top:18px; font-family:'Fredoka','Baloo 2',sans-serif; font-weight:700; font-size:17px; color:#B08718; letter-spacing:.08em; }

  /* Kontroller (kitabın dışında, tahtada) */
  .ke-book-controls{ position:relative; z-index:1; display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:10px; max-width:560px; margin:16px auto 0; }
  .ke-book-controls-center{ display:flex; justify-content:center; }
  .ke-book-actions{ display:flex; flex-wrap:wrap; justify-content:center; gap:8px; }
  .ke-book-actions .ke-recording{ background:var(--kb-wrong) !important; color:#fff !important; animation:ke-rec-pulse 1s ease-in-out infinite; }
  .ke-book-nav{
    width:48px; height:48px; padding:0 !important; border-radius:50% !important; font-size:18px !important;
    background:var(--kb-chalk) !important; color:#3B2A1A !important;
  }
  .ke-book-nav:disabled{ opacity:.35; }
  .ke-book-nav-spacer{ width:48px; }

  /* Sayfa çevirme: eski sayfanın kopyası ciltten dönerek kalkar */
  .ke-flip{ position:absolute !important; margin:0 !important; z-index:5; pointer-events:none; backface-visibility:hidden; -webkit-backface-visibility:hidden; will-change:transform; max-width:none !important; }
  .ke-flip-next{ transform-origin:left center; animation:ke-page-next .7s cubic-bezier(.45,.05,.35,1) forwards; }
  .ke-flip-prev{ transform-origin:right center; animation:ke-page-prev .7s cubic-bezier(.45,.05,.35,1) forwards; }
  @keyframes ke-page-next{ from{ transform:perspective(1800px) rotateY(0); filter:brightness(1); } to{ transform:perspective(1800px) rotateY(-180deg); filter:brightness(.65); } }
  @keyframes ke-page-prev{ from{ transform:perspective(1800px) rotateY(0); filter:brightness(1); } to{ transform:perspective(1800px) rotateY(180deg); filter:brightness(.65); } }

  /* Genişte iki sayfalık açılım: solda resim, sağda metin, ortada cilt */
  @media (min-width:700px){
    .ke-book-spread{ flex-direction:row; max-width:860px; min-height:430px; }
    .ke-book-spread > .ke-page{ flex:1 1 50%; display:flex; flex-direction:column; justify-content:center; background-color:var(--paper); background-image:var(--paper-img); }
    .ke-book-spread > .ke-page-left{ border-radius:14px 0 0 14px; padding:30px 26px; }
    .ke-book-spread > .ke-page-right{ border-radius:0 14px 14px 0; padding:30px 34px 52px; }
    .ke-book-spread{ border-radius:14px; }
    .ke-book-spread::before{
      left:50%; width:70px; transform:translateX(-50%); border-radius:0;
      background:linear-gradient(90deg, transparent, rgba(90,60,20,.14) 40%, rgba(50,30,5,.34) 50%, rgba(90,60,20,.14) 60%, transparent);
    }
    .ke-page-illo img{ width:min(300px, 100%); }
    .ke-book .ke-story-text{ font-size:20px; }
    .ke-book-cover{ width:320px; }
  }
  @media (prefers-reduced-motion: reduce){ .ke-flip{ display:none; } }

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
// lang ozelligi CSS text-transform:uppercase'in Turkce i->İ kuralini
// uygulamasi icin gerekli ("SEVIYE" yerine "SEVİYE").
function setLang(l) {
  _lang = l === 'tr' ? 'tr' : 'en';
  try { window.localStorage.setItem(LANG_KEY, _lang); } catch (e) { /* yok say */ }
  document.querySelectorAll('.ke-shell').forEach((el) => el.setAttribute('lang', _lang));
}
function catLabel(c) {
  const parts = c.title.split('–');
  return _lang === 'tr' && parts[1] ? parts[1].trim() : parts[0].trim();
}
// Veride iki dil karışık (179 bölüm "… Yıldızı Kazandın!", 236 bölüm
// "… Star Earned!") - eskiden sadece TR→EN çevriliyordu, Türkçe modda
// İngilizce etiketler olduğu gibi görünüyordu. Artık iki yönde de.
function rewardLabel(t) {
  const s = String(t);
  if (_lang === 'tr') return s.replace(/ Star Earned!$/, ' Yıldızı Kazandın!').replace('Review Champion!', 'Tekrar Şampiyonu!');
  return s.replace(/ Yıldızı Kazandın!$/, ' Star Earned!').replace('Tekrar Şampiyonu!', 'Review Champion!');
}

const AVATAR_ANCHORS = {"idle": {"x": 0.4521, "y": 0.2078, "w": 0.5858}, "wave": {"x": 0.5, "y": 0.2302, "w": 0.585}, "think": {"x": 0.4531, "y": 0.2015, "w": 0.5516}, "wink": {"x": 0.4751, "y": 0.224, "w": 0.5722}, "point": {"x": 0.5556, "y": 0.2447, "w": 0.5222}, "read": {"x": 0.4765, "y": 0.3211, "w": 0.5962}, "write": {"x": 0.5351, "y": 0.3379, "w": 0.6}, "kick": {"x": 0.4912, "y": 0.2424, "w": 0.5628}, "celebrate": {"x": 0.4561, "y": 0.0842, "w": 0.5444}};
// Avatar v2 ("daha güzel customize edebilmeli" geri bildirimi): 5 renk +
// 4 şapkadan; deri rengi, tişört, şapka, elde eşya, evcil dost ve sahne
// eksenlerine çıktı. Renk/tişört tarayıcıda tek taban görselden canvas ile
// boyanıyor (AvatarPaint) - kombinasyon başına PNG gerekmiyor. Kilitler
// bilerek 0-35 yıldız ve 3-10 gün seriye yayıldı: her birkaç bölümde bir
// yeni şey açılsın.
const avatarColors = () => [
  { id: 'yellow', label: L('Sarı', 'Yellow'), need: 0, swatch: '#FFC800', hue: 0 },
  { id: 'orange', label: L('Turuncu', 'Orange'), need: 1, swatch: '#FF9A1F', hue: -16 },
  { id: 'blue', label: L('Mavi', 'Blue'), need: 2, swatch: '#3B8BEB', hue: 165 },
  { id: 'green', label: L('Yeşil', 'Green'), need: 4, swatch: '#3ED04A', hue: 90 },
  { id: 'pink', label: L('Pembe', 'Pink'), need: 0, needStreak: 3, swatch: '#E63AA0', hue: 290 },
  { id: 'teal', label: L('Turkuaz', 'Teal'), need: 6, swatch: '#1CC6B8', hue: 125 },
  { id: 'red', label: L('Kırmızı', 'Red'), need: 9, swatch: '#E8453C', hue: -40 },
  { id: 'purple', label: L('Mor', 'Purple'), need: 12, swatch: '#8A3FE0', hue: 235 },
  { id: 'silver', label: L('Gümüş', 'Silver'), need: 20, swatch: '#B8C2CC', sat: 0.08 },
];
const avatarShirts = () => [
  { id: 'red', label: L('Kırmızı', 'Red'), need: 0, swatch: '#E23B3B' },
  { id: 'blue', label: L('Mavi', 'Blue'), need: 0, swatch: '#2F6FE0', hue: 220 },
  { id: 'green', label: L('Yeşil', 'Green'), need: 2, swatch: '#2FB34A', hue: 130 },
  { id: 'purple', label: L('Mor', 'Purple'), need: 5, swatch: '#8A3FE0', hue: 275 },
  { id: 'orange', label: L('Turuncu', 'Orange'), need: 7, swatch: '#FF8A1F', hue: 28 },
  { id: 'pink', label: L('Pembe', 'Pink'), need: 10, swatch: '#FF5FB0', hue: 325 },
  { id: 'black', label: L('Siyah', 'Black'), need: 15, swatch: '#2B2B33', dark: true },
];
// img: eski PIL çizimi PNG şapka (emoji karşılığı olmayanlar); diğerleri
// sistem emojisi. s = genişliğe oranla boyut, dx/dy = kafa çapasından kayma.
const avatarHats = () => [
  { id: 'none', label: L('Yok', 'None'), need: 0, emoji: '🚫' },
  { id: 'cap', label: L('Kep', 'Cap'), need: 1, emoji: '🧢', s: 0.5, dy: 0.03 },
  { id: 'party', label: L('Parti', 'Party'), need: 3, emoji: '🎉', img: 'party' },
  { id: 'bow', label: L('Fiyonk', 'Bow'), need: 4, emoji: '🎀', s: 0.26, dx: 0.19, dy: 0.04, rot: 18 },
  { id: 'crown', label: L('Taç', 'Crown'), need: 0, needStreak: 5, emoji: '👑', s: 0.4, dy: 0.01 },
  { id: 'flower', label: L('Çiçek', 'Flower'), need: 6, emoji: '🌸', s: 0.22, dx: -0.19, dy: 0.05 },
  { id: 'grad', label: L('Mezuniyet', 'Graduate'), need: 8, emoji: '🎓', s: 0.52, dy: 0.02 },
  { id: 'wizard', label: L('Büyücü', 'Wizard'), need: 10, emoji: '🧙', img: 'wizard' },
  { id: 'sunhat', label: L('Hasır Şapka', 'Sun hat'), need: 11, emoji: '👒', s: 0.6, dy: 0.03 },
  { id: 'tophat', label: L('Silindir', 'Top hat'), need: 14, emoji: '🎩', s: 0.5 },
];
const avatarItems = () => [
  { id: 'none', label: L('Yok', 'None'), need: 0, emoji: '🚫' },
  { id: 'balloon', label: L('Balon', 'Balloon'), need: 2, emoji: '🎈', y: 0.18 },
  { id: 'ball', label: L('Top', 'Ball'), need: 3, emoji: '⚽' },
  { id: 'book', label: L('Kitap', 'Books'), need: 5, emoji: '📚' },
  { id: 'icecream', label: L('Dondurma', 'Ice cream'), need: 7, emoji: '🍦' },
  { id: 'wand', label: L('Sihirli Değnek', 'Magic wand'), need: 9, emoji: '🪄' },
  { id: 'lolly', label: L('Lolipop', 'Lollipop'), need: 12, emoji: '🍭' },
  { id: 'star', label: L('Yıldız', 'Star'), need: 0, needStreak: 10, emoji: '🌟' },
  { id: 'trophy', label: L('Kupa', 'Trophy'), need: 25, emoji: '🏆' },
];
const avatarPets = () => [
  { id: 'none', label: L('Yok', 'None'), need: 0, emoji: '🚫' },
  { id: 'dog', label: L('Köpek', 'Dog'), need: 3, emoji: '🐕' },
  { id: 'cat', label: L('Kedi', 'Cat'), need: 5, emoji: '🐈' },
  { id: 'bunny', label: L('Tavşan', 'Bunny'), need: 8, emoji: '🐇' },
  { id: 'turtle', label: L('Kaplumbağa', 'Turtle'), need: 11, emoji: '🐢' },
  { id: 'parrot', label: L('Papağan', 'Parrot'), need: 14, emoji: '🦜' },
  { id: 'penguin', label: L('Penguen', 'Penguin'), need: 18, emoji: '🐧' },
  { id: 'unicorn', label: L('Tek Boynuzlu At', 'Unicorn'), need: 24, emoji: '🦄' },
  { id: 'dragon', label: L('Ejderha', 'Dragon'), need: 35, emoji: '🐉' },
];
const avatarScenes = () => [
  { id: 'sky', label: L('Gökyüzü', 'Sky'), need: 0, emoji: '☁️', bg: 'radial-gradient(circle at 50% 35%, #F2FBFF 0%, #A9DDFF 62%, #5DB2EE 100%)', deco: ['☁️', '☀️'] },
  { id: 'sun', label: L('Güneş', 'Sunny'), need: 0, emoji: '☀️', bg: 'radial-gradient(circle at 50% 40%, #FFE97A 0%, #FFC20E 70%, #E0A500 100%)', deco: [] },
  { id: 'ocean', label: L('Okyanus', 'Ocean'), need: 2, emoji: '🌊', bg: 'radial-gradient(circle at 50% 35%, #9BE7FF 0%, #2FA7E0 60%, #1167A8 100%)', deco: ['🫧', '🐠', '🫧'] },
  { id: 'jungle', label: L('Orman', 'Jungle'), need: 6, emoji: '🌴', bg: 'radial-gradient(circle at 50% 35%, #C4F59A 0%, #3FAE4A 62%, #1F6E2E 100%)', deco: ['🌿', '🦋', '🌴'] },
  { id: 'space', label: L('Uzay', 'Space'), need: 10, emoji: '🚀', bg: 'radial-gradient(circle at 50% 35%, #7666E0 0%, #2A1F6B 60%, #0E0A2E 100%)', deco: ['✨', '🪐', '⭐'] },
  { id: 'candy', label: L('Şeker Diyarı', 'Candy Land'), need: 0, needStreak: 7, emoji: '🍬', bg: 'radial-gradient(circle at 50% 35%, #FFE0F0 0%, #FF8CC6 62%, #D94C97 100%)', deco: ['🍬', '🧁', '🍭'] },
  { id: 'sunset', label: L('Gün Batımı', 'Sunset'), need: 15, emoji: '🌅', bg: 'linear-gradient(180deg, #FFC27A 0%, #FF6F91 55%, #7A4BC2 100%)', deco: ['☁️', '🐦', '☁️'] },
  { id: 'snow', label: L('Kar', 'Snow'), need: 20, emoji: '❄️', bg: 'radial-gradient(circle at 50% 35%, #FFFFFF 0%, #CFE8FF 60%, #8DB8E8 100%)', deco: ['❄️', '⛄', '❄️'] },
];
// Özelleştirme sekmeleri: profil alanı + katalog + sekme başlığı
const AVATAR_SLOTS = () => [
  { key: 'color', list: avatarColors(), label: L('Renk', 'Color'), icon: '🎨' },
  { key: 'shirt', list: avatarShirts(), label: L('Tişört', 'Shirt'), icon: '👕' },
  { key: 'hat', list: avatarHats(), label: L('Şapka', 'Hat'), icon: '🎩' },
  { key: 'item', list: avatarItems(), label: L('Eşya', 'Item'), icon: '🎈' },
  { key: 'pet', list: avatarPets(), label: L('Dost', 'Pet'), icon: '🐶' },
  { key: 'scene', list: avatarScenes(), label: L('Sahne', 'Scene'), icon: '🌈' },
];
const AVATAR_DEFAULTS = { color: 'yellow', shirt: 'red', hat: 'none', item: 'none', pet: 'none', scene: 'sky' };
function avatarPart(list, id) { return list.find((x) => x.id === id) || list[0]; }

// localStorage tarayicidan/devtools'tan elle degistirilebilir ya da
// bozulabilir - guvenilmeyen girdi sayiyoruz. Profil listesini OKUMA
// noktasinda (once _load burada) sanitize ediyoruz ki asagidaki her
// fonksiyon (all/active/save/remove...) zaten temiz veriyle calissin;
// tek bir yerde yalnizca active() icin temizlemek, all()'un dondurdugu
// diger profillerin (ornegin profil degistirici listesindeki data-profile
// attribute'una) ham/kacissiz gitmesine yol aciyordu.
function _sanitizeProfile(p) {
  p = p || {};
  const out = {
    id: String(p.id || 'p1').replace(/[^a-z0-9]/gi, '').slice(0, 12) || 'p1',
    name: String(p.name || '').slice(0, 12),
  };
  AVATAR_SLOTS().forEach((slot) => {
    out[slot.key] = slot.list.some((x) => x.id === p[slot.key]) ? p[slot.key] : AVATAR_DEFAULTS[slot.key];
  });
  return out;
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
    if (!d) return Object.assign({ id: 'p1', name: '' }, AVATAR_DEFAULTS);
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
//
// Avatar v2 boyama: avatar/idle_base.png (sari, 600x900) + idle_mask.png
// (R = deri, G = tisort kirmizisi; scripts/generate_avatar_masks.py).
// Istenen renk/tisort kombinasyonu bir kez canvas'ta boyanip blob URL
// olarak onbellege aliniyor. Eski 5 renk + kirmizi tisort icin hazir
// PNG'ler var; onlar aninda gorunur, boyama beklemez.
const LEGACY_AVATAR_COLORS = ['yellow', 'blue', 'green', 'pink', 'purple'];
function _rgb2hsv(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6; if (h < 0) h += 1;
  }
  return [h, mx ? d / mx : 0, mx / 255];
}
function _hsv2rgb(h, s, v, out, j) {
  const i = Math.floor(h * 6), f = h * 6 - i;
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  let r, g, b;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    default: r = v; g = p; b = q;
  }
  out[j] = r * 255; out[j + 1] = g * 255; out[j + 2] = b * 255;
}
const AvatarPaint = {
  cache: new Map(),
  pending: new Map(),
  _src: null,
  key(p) { return (p.color || 'yellow') + '-' + (p.shirt || 'red'); },
  isLegacy(p) { return (p.shirt || 'red') === 'red' && LEGACY_AVATAR_COLORS.includes(p.color || 'yellow'); },
  legacySrc(p) {
    const c = p.color || 'yellow';
    return new URL(c === 'yellow' ? 'mascot/mascot_idle.png' : `mascot/avatar/idle_${c}.png`, ASSET_BASE_URL).href;
  },
  src(p) { return this.isLegacy(p) ? this.legacySrc(p) : (this.cache.get(this.key(p)) || null); },
  _load() {
    if (this._src) return this._src;
    const get = (rel) => new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i); i.onerror = rej;
      i.src = new URL(rel, ASSET_BASE_URL).href;
    });
    this._src = Promise.all([get('mascot/avatar/idle_base.png'), get('mascot/avatar/idle_mask.png')]).then(([b, m]) => {
      const w = b.naturalWidth, h = b.naturalHeight;
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(m, 0, 0, w, h);
      const mask = ctx.getImageData(0, 0, w, h).data;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(b, 0, 0);
      return { w, h, base: ctx.getImageData(0, 0, w, h), mask };
    });
    this._src.catch(() => { this._src = null; });
    return this._src;
  },
  ensure(p) {
    const k = this.key(p);
    if (this.isLegacy(p)) return Promise.resolve(this.legacySrc(p));
    if (this.cache.has(k)) return Promise.resolve(this.cache.get(k));
    if (this.pending.has(k)) return this.pending.get(k);
    const color = avatarPart(avatarColors(), p.color);
    const shirt = avatarPart(avatarShirts(), p.shirt);
    const job = this._load().then((s) => {
      const d = new Uint8ClampedArray(s.base.data);
      const m = s.mask;
      const skinShift = (color.hue || 0) / 360;
      for (let j = 0; j < d.length; j += 4) {
        if (!d[j + 3]) continue;
        if (m[j] > 127 && color.id !== 'yellow') {
          const hsv = _rgb2hsv(d[j], d[j + 1], d[j + 2]);
          if (color.sat != null) _hsv2rgb(0.58, hsv[1] * color.sat, hsv[2] * 0.86, d, j);
          else _hsv2rgb((hsv[0] + skinShift + 1) % 1, hsv[1], hsv[2], d, j);
        } else if (m[j + 1] > 127 && shirt.id !== 'red') {
          const hsv = _rgb2hsv(d[j], d[j + 1], d[j + 2]);
          if (shirt.dark) _hsv2rgb(hsv[0], hsv[1] * 0.12, hsv[2] * 0.3, d, j);
          else _hsv2rgb(shirt.hue / 360, hsv[1], hsv[2], d, j);
        }
      }
      const c = document.createElement('canvas'); c.width = s.w; c.height = s.h;
      c.getContext('2d').putImageData(new ImageData(d, s.w, s.h), 0, 0);
      // data: URL (blob: degil) - telefonda onbellekteki eski index.html'in
      // CSP'si blob: resme izin vermiyordu, avatar "kayboluyordu".
      return c.toDataURL('image/png');
    }).then((url) => { this.cache.set(k, url); this.pending.delete(k); return url; },
      () => { this.pending.delete(k); return this.legacySrc({ color: LEGACY_AVATAR_COLORS.includes(p.color) ? p.color : 'yellow' }); });
    this.pending.set(k, job);
    return job;
  },
  // Sayfadaki bu kombinasyonu bekleyen tum govde gorsellerini guncelle
  apply(k, url) {
    document.querySelectorAll(`.ke-av[data-avk="${k}"] > img.ke-av-body`).forEach((img) => {
      img.src = url; img.classList.remove('ke-av-pending');
    });
  },
};

// Tum katmanlar .ke-av kutusuna (gorselin kendi 2:3 kutusu) gore yuzde/cqw
// ile konumlaniyor - eskiden sapka yuvarlak butonun kutusuna gore
// konumlandigi icin ana ekranda kafadan kayiyordu ("maskottaki croplar").
function avatarLayerHTML(item, cx, cy, size, extra) {
  const rot = item.rot ? ` rotate(${item.rot}deg)` : '';
  return `<span class="ke-av-layer ${extra || ''}" aria-hidden="true" style="left:${(cx * 100).toFixed(1)}cqw;top:${(cy * 100).toFixed(1)}cqw;font-size:${(size * 100).toFixed(1)}cqw;transform:translate(-50%,-50%)${rot}">${item.emoji}</span>`;
}
function avatarHatStyle() {
  const a = AVATAR_ANCHORS.idle;
  return `left:${((a.x - a.w / 2) * 100).toFixed(2)}%;width:${(a.w * 100).toFixed(2)}%;bottom:${((1 - a.y) * 100).toFixed(2)}%`;
}
function avatarHatHTML(pose, profile) {
  const p = profile || Profiles.active();
  const hat = avatarPart(avatarHats(), p.hat);
  if (hat.id === 'none') return '';
  if (hat.img) {
    const src = new URL(`mascot/avatar/hat_${hat.img}.png`, ASSET_BASE_URL).href;
    return `<img class="ke-mascot-hat" src="${src}" alt="" draggable="false" style="${avatarHatStyle()}" />`;
  }
  // Emoji sapkanin alt kenari alnin ust cizgisine (~0.27 genislik; kas
  // 0.27-0.30, gozluk 0.33+) oturuyor - glifin gorunur alti merkezin
  // ~0.42em altinda.
  const a = AVATAR_ANCHORS.idle;
  return avatarLayerHTML(hat, a.x + (hat.dx || 0), 0.27 - hat.s * 0.42 + (hat.dy || 0), hat.s, 'ke-av-hatemoji');
}
// opts.head: yuvarlak cercevede bas-omuz kadraji (esya/dost gizli)
function avatarFigureHTML(p, opts) {
  p = p || Profiles.active();
  opts = opts || {};
  const k = AvatarPaint.key(p);
  const ready = AvatarPaint.src(p);
  if (!ready) AvatarPaint.ensure(p).then((url) => AvatarPaint.apply(k, url));
  const src = ready || new URL('mascot/avatar/idle_base.png', ASSET_BASE_URL).href;
  let layers = avatarHatHTML('idle', p);
  if (!opts.head) {
    const item = avatarPart(avatarItems(), p.item);
    if (item.id !== 'none') layers += avatarLayerHTML(item, 0.88, item.y != null ? item.y : 0.36, 0.3, 'ke-av-item');
    // Sahnede dost karakterin yaninda (sahne kutusunda yer var); ders
    // sahnesinde ise figurun kendi kutusundan tasmasin diye bacak onunde.
    const pet = avatarPart(avatarPets(), p.pet);
    if (pet.id !== 'none') layers += opts.stage ? avatarLayerHTML(pet, 1.12, 1.3, 0.4, 'ke-av-pet') : avatarLayerHTML(pet, 0.84, 1.3, 0.32, 'ke-av-pet');
  }
  return `<div class="ke-av${opts.cls ? ' ' + opts.cls : ''}${p.hat && p.hat !== 'none' ? ' ke-av-hashat' : ''}" data-avk="${k}"><img class="ke-av-body${ready ? '' : ' ke-av-pending'}" src="${src}" alt="Aktapokus" draggable="false" />${layers}</div>`;
}
// Yuvarlak rozet: sahne arka plani + bas-omuz kadraji
function avatarCircleHTML(p, cls) {
  p = p || Profiles.active();
  const scene = avatarPart(avatarScenes(), p.scene);
  return `<span class="ke-av-circle${cls ? ' ' + cls : ''}" style="background:${scene.bg}">${avatarFigureHTML(p, { head: true })}</span>`;
}
// Genis sahne (profil ekrani): sahne + susler + tam boy avatar
function avatarStageHTML(p) {
  const scene = avatarPart(avatarScenes(), p.scene);
  const deco = scene.deco.map((e, i) => `<span class="ke-av-deco d${i}" aria-hidden="true">${e}</span>`).join('');
  return `<div class="ke-avatar-stage${p.pet && p.pet !== 'none' ? ' ke-has-pet' : ''}" style="background:${scene.bg}">${deco}${avatarFigureHTML(p, { stage: true })}</div>`;
}

function mascotSvg() {
  return avatarFigureHTML(Profiles.active(), { cls: 'ke-mascot-img' });
}

function avatarLandingHTML(pose) {
  return `<div class="ke-landing-mascot">${avatarFigureHTML(Profiles.active())}</div>`;
}

// Pozlar artik tek idle render'ini kullaniyor (bkz. yukarisi) - cagri
// noktalari bozulmasin diye fonksiyon duruyor.
function setMascotPose() { /* no-op */ }

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
let _fullscreenExitAt = 0;
const FULLSCREEN_POPSTATE_IGNORE_MS = 500;
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
    <div class="ke-shell notranslate" translate="no" lang="${_lang}">
      <button class="ke-fullscreen-btn" id="keFullscreenBtn" title="${L('Tam ekran', 'Full screen')}" aria-label="${L('Tam ekran', 'Full screen')}">${ICON_EXPAND}<span id="keFullscreenLabel">${L('Tam Ekran', 'Full screen')}</span></button>
      <div class="ke-screen-host" id="keScreenHost"></div>
    </div>
  `;
  // window.KE_STATIC sadece statik PWA build'inde (app.js) set edilir -
  // core icine gomulu surumde tanimsiz/falsy, bu satir zararsizca atlanir.
  // Onceden bu satir build_pwa.py'de KIRILGAN bir string-replace ile
  // enjekte ediliyordu (installTransitionGuard+setupFullscreen'in YANINA
  // eklenmis olmasina bagliydi) - guard'i ilk render'dan SONRAYA tasiyinca
  // o replace hedefi bozuldu ve build assert'i patlattı. Artik doğrudan
  // kaynakta, hicbir build-time surgery'e bagli degil.
  if (window.KE_STATIC) container.querySelector('.ke-shell').classList.add('ke-fs');

  setupFullscreen(container);
  _backHandler = null;
  _popstateHandler = () => {
    // Tam ekrandan az once cikildiysa (bkz. _fullscreenExitAt), bu
    // popstate gercek bir "geri" niyeti degil, cikisin yan etkisi
    // olabilir - yut, ve tukettigimiz history girdisini geri koy ki
    // gercek geri tusu hala calissin.
    if (performance.now() - _fullscreenExitAt < FULLSCREEN_POPSTATE_IGNORE_MS) {
      if (_backHandler) { try { history.pushState({ keNav: true }, ''); } catch (e) { /* no-op */ } }
      return;
    }
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

  if (Profiles.exists()) resumeLastScreen(container, api, toolId, categories);
  else showWelcome(container, api, toolId, categories);
  // Guard, ILK render'DAN SONRA kuruluyor - once .ke-carnival-hero/
  // .ke-profile-screen'in kendisi "yeni bir ekrana gecis" sanilip
  // 350ms'lik dokunma-yutma penceresi aciliyordu, TAM DA kullanicinin
  // uygulamayi ilk gordugu anda - "iOS'ta ilk acildiginda tusa
  // basilmiyor" geri bildiriminin en olasi nedeni. Guard'in amaci
  // EKRANLAR ARASI gecisleri korumak, ilk boyamayi degil.
  installTransitionGuard(container);
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
// İngilizce ilkokul matematiği pilotu (bkz. scripts/build_math_pilot.py)
const MATH_CATEGORY_PREFIX = 'math_';
const SECTIONS = [
  { id: 'words', title: 'Words', sub: 'Themed word categories', subTr: 'Temalı kelime kategorileri', titleTr: 'Kelimeler', motif: '📚',
    theme: { c: '#FFA000', dark: '#DB8A00', tint: '#FFCF66' },
    pick: (c) => !GRAMMAR_CATEGORY_IDS.includes(c.id) && !QA_CATEGORY_IDS.includes(c.id) && !GET_CATEGORY_IDS.includes(c.id) && !CONVERSATION_CATEGORY_IDS.includes(c.id) && !OPPOSITE_CATEGORY_IDS.includes(c.id) && !c.id.endsWith(A2_CATEGORY_SUFFIX) && !c.id.startsWith(MATH_CATEGORY_PREFIX) },
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
  // "İlkokul matematiğini İngilizce olarak koyabiliriz - MEB'de olmayan bir
  // ekstra" - pilot: sayılar, şekiller, toplama/çıkarma. Normal kelime
  // kategorisi biçiminde, tüm bölüm akışını (keşif/soru/konuşma/cümle/harf) aynen kullanıyor.
  { id: 'math', title: 'Math in English', sub: 'Numbers, shapes, adding & taking away', subTr: 'Sayılar, şekiller, toplama ve çıkarma', titleTr: 'İngilizce Matematik', motif: '🧮',
    theme: { c: '#3949AB', dark: '#2C3A94', tint: '#8E99E0' },
    pick: (c) => c.id.startsWith(MATH_CATEGORY_PREFIX) },
  // "StoryBook altındaki ppt'yi sisteme adapte edelim" - kelime
  // kategorilerinden TAMAMEN AYRI bir veri kaynağı (data/stories.json,
  // /stories API'si) kullandığı için categories dizisinde hiç yok;
  // pick() hep false döner, tıklama showCategoryGrid yerine
  // showStoryList'e özel olarak yönlendiriliyor (bkz. showSectionMenu).
  { id: 'stories', title: 'Story Time', sub: 'Read along with Aktapokus', subTr: 'Aktapokus ile birlikte oku', titleTr: 'Hikaye Zamanı', motif: '📖',
    theme: { c: '#8D6E63', dark: '#715650', tint: '#C7A998' },
    special: 'stories',
    pick: () => false },
];
let _currentSection = null;

// "Uygulamada bir yere girip çıkınca başa dönüyor, kaldığı yerden devam
// etmiyor" - Android arka plana alınan TWA/sekmeyi bellek için sık sık
// öldürüp baştan yüklüyor ve her yükleme bölüm menüsünden başlıyordu. Son
// ekranı kaydedip açılışta oraya dönüyoruz. Bölüm içindeki aşama (keşif/
// soru/konuşma) değil bölümün başı geri yükleniyor - yarım kalmış bir soru
// durumunu yeniden kurmak kırılgan olurdu, bölüm zaten kısa.
const RESUME_KEY = 'ke_resume_v1';
const RESUME_MAX_AGE_MS = 12 * 60 * 60 * 1000;
const Resume = {
  save(state) {
    try { window.localStorage.setItem(RESUME_KEY, JSON.stringify({ ...state, profile: Profiles.active().id, ts: Date.now() })); } catch (e) { /* yok say */ }
  },
  load() {
    try {
      const s = JSON.parse(window.localStorage.getItem(RESUME_KEY));
      if (!s || s.profile !== Profiles.active().id || Date.now() - s.ts > RESUME_MAX_AGE_MS) return null;
      return s;
    } catch (e) { return null; }
  },
};

function resumeLastScreen(container, api, toolId, categories) {
  const s = Resume.load();
  if (s && s.screen === 'grid' && s.sectionId) { showCategoryGrid(container, api, toolId, categories, s.sectionId); return; }
  if (s && s.screen === 'journey') { showJourney(container, api, toolId, categories); return; }
  const cat = s && s.screen === 'episode' && s.categoryId ? categories.find((c) => c.id === s.categoryId) : null;
  if (cat) {
    const sec = SECTIONS.find((x) => x.id === s.sectionId) || SECTIONS.find((x) => x.pick(cat));
    _currentSection = sec ? sec.id : null;
    _journeyMode = !!s.journey;
    enterCategory(container, api, toolId, categories, s.categoryId, s.episodeIndex || 0);
    return;
  }
  if (s && s.screen === 'stories') { showStoryList(container, api, toolId, categories); return; }
  if (s && s.screen === 'story' && s.storyId) { showStoryReader(container, api, toolId, categories, s.storyId, s.page); return; }
  showSectionMenu(container, api, toolId, categories);
}

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

// "arada uygulama açıldığı zaman kullanıcıyı motive edecek raporlar
// vermeli, örneğin '10 dakikayı tamamladık daha fazlasını yapabiliriz'
// gibi" - giriş ekranına her dönüşte DEĞİL, oturum başına bir kere,
// gerçek yerel veriden (TodayTime/DailyGoal/Streak) kısa bir teşvik
// mesajı gösteriyor. Veri yoksa (yeni kullanıcı/ilk açılış) hiç
// göstermiyor - boş övgü yerine gerçek bir başarıya dayanıyor.
let _motivationShownThisSession = false;
function maybeShowMotivationToast(container) {
  if (_motivationShownThisSession) return;
  const minutes = Math.floor(TodayTime.today() / 60);
  const wordsToday = DailyGoal.today();
  const streakDays = Streak.get();
  let msg = null;
  if (minutes >= 10) {
    msg = L(`🎉 Bugün ${minutes} dakika çalıştın! Harikasın, biraz daha yapalım mı?`, `🎉 You studied ${minutes} minutes today! Amazing — want to do a bit more?`);
  } else if (wordsToday > 0 && wordsToday < DailyGoal.TARGET) {
    msg = L(`👍 Bugün ${wordsToday} kelime öğrendin! Hedefe (${DailyGoal.TARGET}) az kaldı.`, `👍 You learned ${wordsToday} words today! Close to today's goal (${DailyGoal.TARGET}).`);
  } else if (streakDays >= 2) {
    msg = L(`🔥 ${streakDays} günlük serin devam ediyor! Bugün de devam edelim mi?`, `🔥 Your ${streakDays}-day streak is going! Keep it up today?`);
  }
  if (!msg) return;
  _motivationShownThisSession = true;
  const el = document.createElement('div');
  el.className = 'ke-game-toast ke-motivation-toast';
  el.textContent = msg;
  container.querySelector('.ke-shell')?.appendChild(el);
  setTimeout(() => {
    requestAnimationFrame(() => el.classList.add('ke-show'));
    setTimeout(() => { el.classList.remove('ke-show'); setTimeout(() => el.remove(), 400); }, 6500);
  }, 700);
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

// "butonla karaktere tıkladığımda renkli kategorilerle progress, reward
// game, sound test, turkish ve avatar gelmeli avatara tıklayınca avatar
// customize açılmalı" - maskota dokununca artık doğrudan tam profil
// düzenleme ekranına gitmiyor, önce kompakt bir hızlı-menü açılıyor
// (showGamePicker ile aynı hafif kart-overlay deseni - yeni bir ekrana
// geçiş değil, mevcut ekranın üzerine bindirilen bir kart). Sadece
// "Avatar" karosu showProfileScreen'i (renk/şapka özelleştirme) açıyor.
function showQuickMenu(container, api, toolId, categories) {
  const shell = container.querySelector('.ke-shell');
  const overlay = document.createElement('div');
  overlay.className = 'ke-river-overlay-msg ke-quickmenu';
  overlay.style.position = 'absolute'; overlay.style.zIndex = '90';
  const p = Profiles.active();
  const hasReward = GameTokens.get() > 0 || PendingQuiz.get() > 0;
  overlay.innerHTML = `
    <div class="ke-river-msg-card ke-quickmenu-card">
      <div class="ke-quickmenu-who">
        ${avatarCircleHTML(p, 'ke-quickmenu-avatar')}
        <span>${escapeProfileText(p.name || L('Ben', 'Me'))}</span>
      </div>
      <div class="ke-quickmenu-grid">
        <button type="button" class="ke-quickmenu-tile qm-avatar" id="keQmAvatar"><span class="qm-ico">🎨</span>${L('Avatar', 'Avatar')}</button>
        <button type="button" class="ke-quickmenu-tile qm-progress" id="keQmProgress"><span class="qm-ico">📊</span>${L('İlerleme', 'Progress')}</button>
        <button type="button" class="ke-quickmenu-tile qm-game" id="keQmGame" ${hasReward ? '' : 'disabled'}><span class="qm-ico">🎮</span>${L('Ödül Oyunu', 'Reward Game')}</button>
        <button type="button" class="ke-quickmenu-tile qm-sound" id="keQmSound"><span class="qm-ico">🔊</span>${L('Ses Testi', 'Sound Test')}</button>
        <button type="button" class="ke-quickmenu-tile qm-lang" id="keQmLang"><span class="qm-ico">🌐</span>${_lang === 'tr' ? 'English' : 'Türkçe'}</button>
        <button type="button" class="ke-quickmenu-tile qm-rank" id="keQmRank"><span class="qm-ico">🏆</span>${L('Sıralama', 'Leaderboard')}</button>
        <button type="button" class="ke-quickmenu-tile qm-guide" id="keQmGuide"><span class="qm-ico">📖</span>${L('Kılavuz', 'Guide')}</button>
        <button type="button" class="ke-quickmenu-tile qm-parent" id="keQmParent"><span class="qm-ico">👪</span>${L('Ebeveyn', 'Parent')}</button>
      </div>
      <div id="keQmSoundInfo" style="margin-top:2px;font-size:11.5px;color:var(--kb-chalk-dim);font-weight:700;"></div>
      ${window.KE_STATIC ? `<div style="margin-top:10px;font-size:12.5px;font-weight:700;"><a href="privacy.html" style="color:var(--kb-chalk-dim);">${L('Gizlilik', 'Privacy')}</a> · <a href="${reportProblemHref()}" style="color:var(--kb-chalk-dim);">${L('Sorun bildir', 'Report a problem')}</a> · <a href="teacher.html" target="_blank" rel="noopener noreferrer" style="color:var(--kb-chalk-dim);">${L('Öğretmen Paneli', 'Teacher Portal')}</a></div>` : ''}
      <button type="button" class="ke-btn-secondary" id="keQmClose" style="margin-top:14px;">${L('Kapat', 'Close')}</button>
      <button type="button" id="keQmTestKey" style="margin-top:10px;font-size:11px !important;padding:4px 10px !important;opacity:.4;" title="test">🔑</button>
    </div>
  `;
  shell.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('ke-show'));
  const close = () => { overlay.classList.remove('ke-show'); setTimeout(() => overlay.remove(), 250); };
  overlay.querySelector('#keQmAvatar').addEventListener('click', () => { close(); showProfileScreen(container, api, toolId, categories, {}); });
  overlay.querySelector('#keQmProgress').addEventListener('click', () => { close(); showStatsScreen(container, api, toolId, categories); });
  overlay.querySelector('#keQmParent').addEventListener('click', () => { close(); showParentGate(container, api, toolId, categories); });
  overlay.querySelector('#keQmGame').addEventListener('click', () => {
    if (PendingQuiz.get() > 0) {
      close();
      showBonusQuiz(container, api, toolId, categories, () => refreshGameBadge(container));
    } else if (GameTokens.get() > 0) {
      close();
      showGamePicker(container, () => showSectionMenu(container, api, toolId, categories));
    }
  });
  overlay.querySelector('#keQmSound').addEventListener('click', () => runSoundTest(overlay.querySelector('#keQmSoundInfo')));
  // Dil değişince arkadaki bölüm ekranı da yeniden çizilmeli - eskiden
  // sadece bu menü yenileniyordu, arka ekran eski dilde kalıyordu.
  overlay.querySelector('#keQmLang').addEventListener('click', () => {
    setLang(_lang === 'tr' ? 'en' : 'tr');
    overlay.remove();
    showSectionMenu(container, api, toolId, categories);
    showQuickMenu(container, api, toolId, categories);
  });
  overlay.querySelector('#keQmRank').addEventListener('click', () => { close(); showLeaderboard(container); });
  overlay.querySelector('#keQmGuide').addEventListener('click', () => { close(); showGuide(container, api, toolId, categories); });
  overlay.querySelector('#keQmClose').addEventListener('click', close);
  overlay.querySelector('#keQmTestKey').addEventListener('click', () => {
    const code = window.prompt(L('Test şifresi', 'Test code'));
    if (code === '181078') { GameTokens.add(1); refreshGameBadge(container); }
  });
}

// Uygulama içi kullanım kılavuzu - "bu kılavuzu da mutlaka uygulamaya
// ekleyelim" isteği üzerine. Statik ekran görüntüsü YOK: her madde,
// uygulamanın GERÇEK bileşenlerinin (kategori kartı, quiz seçeneği,
// cümle yuvası, mikrofon, hikaye sayfası vb.) inert (tıklanamaz) küçük
// birer örneğini kullanıyor - böylece kılavuz her zaman gerçek
// görünümle senkron kalıyor, ayrı ekran görüntüsü bakımı gerekmiyor.
function showGuide(container, api, toolId, categories) {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  const host = container.querySelector('#keScreenHost');
  const back = () => showSectionMenu(container, api, toolId, categories);
  const topics = [
    {
      icon: '🧩', title: L('Bölümler', 'Sections'),
      body: L('Ana ekrandaki renkli kartlara dokun: Kelimeler, Dilbilgisi, Sorular, Zıt Anlamlılar, Hikaye Zamanı ve daha fazlası. Her kart kendi kategori listesini açar.', 'Tap a colored card on the home screen: Words, Grammar, Questions, Opposites, Story Time and more. Each card opens its own list of categories.'),
      demo: `<div class="ke-category-card" style="--cc-c:#FF7A45;--cc-dark:#D65E2E;--cc-tint:#FFC9A8;background:#FF7A45;pointer-events:none;max-width:240px;">
        <div class="ke-category-icon" style="color:#FF7A45">W<span class="ke-cat-motif-badge">🐾</span></div>
        <div class="ke-category-text">
          <div class="ke-category-title">${L('Kelimeler', 'Words')}</div>
          <div class="ke-category-meta">${L('21 kategori · 856 kelime', '21 categories · 856 words')}</div>
        </div>
      </div>`,
    },
    {
      icon: '❓', title: L('Kelime Sorusu', 'Word Quiz'),
      body: L('Bir bölümde önce kelime tanıtılır, sonra 4 seçenekten doğru olanına dokunulur. Doğru cevap yeşil yanıp söner, yanlışta doğrusu gösterilir.', 'In an episode a word is introduced first, then you tap the right one out of 4 choices. A correct answer flashes green; a wrong one reveals the right answer.'),
      demo: `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;max-width:220px;pointer-events:none;">
        <div class="ke-quiz-card ke-correct" style="padding:8px;"><div class="ke-icon-hex"><div class="ke-icon-hex-inner" style="background:#FFE9B3"><div class="ke-emoji-icon" style="font-size:30px;">🐶</div></div></div></div>
        <div class="ke-quiz-card" style="padding:8px;"><div class="ke-icon-hex"><div class="ke-icon-hex-inner" style="background:#D9E8FF"><div class="ke-emoji-icon" style="font-size:30px;">🐱</div></div></div></div>
      </div>`,
    },
    {
      icon: '🎤', title: L('Şimdi Sen Söyle', 'Now You Say It'),
      body: L('Konuşma turunda mikrofona dokun ve kelimeyi İngilizce söyle. Uygulama söylediğini dinler ve doğru telaffuz ettiysen seni onaylar.', 'In the speak round, tap the microphone and say the word in English. The app listens and confirms it if you pronounced it correctly.'),
      demo: `<div style="text-align:center;pointer-events:none;">
        <div class="ke-speak-word">dog</div>
        <div style="margin-top:8px;font-size:34px;">🎙️</div>
      </div>`,
    },
    {
      icon: '🧱', title: L('Cümle Kur', 'Build a Sentence'),
      body: L('Alttaki kelime parçacıklarını yukarıdaki boşluklara sürükleyerek doğru cümleyi oluştur.', 'Drag the word tiles at the bottom into the blanks above to build the correct sentence.'),
      demo: `<div style="pointer-events:none;">
        <div style="display:flex;gap:6px;justify-content:center;margin-bottom:10px;">
          <span class="ke-slot ke-filled">I</span><span class="ke-slot ke-filled">like</span><span class="ke-slot">____</span>
        </div>
        <div style="display:flex;gap:6px;justify-content:center;">
          <span class="ke-tile" style="background:#fff;border-radius:10px;padding:6px 12px;font-weight:700;color:var(--ke-ink);">dogs</span>
          <span class="ke-tile" style="background:#fff;border-radius:10px;padding:6px 12px;font-weight:700;color:var(--ke-ink);">cats</span>
        </div>
      </div>`,
    },
    {
      icon: '📖', title: L('Hikaye Zamanı', 'Story Time'),
      body: L('Sesli okunan bir hikayeyi sayfa sayfa takip et — okunan kelime altın renkte vurgulanır. İstersen kendi sesinle de okuyup kaydedebilir, kaydı telefonundan öğretmenine/velisine gönderebilirsin (kayıt hiçbir yere yüklenmez, sadece cihazda kalır).', 'Follow a read-along story page by page — the word being read is highlighted in gold. You can also record yourself reading and share the clip from your phone with a teacher or parent (nothing is uploaded, it stays on the device).'),
      demo: `<div style="text-align:center;pointer-events:none;font-size:14px;font-weight:700;color:var(--kb-chalk);">He is <span class="ke-story-word ke-story-word-active">yellow</span> and very cute.</div>`,
    },
    {
      icon: '⭐', title: L('İlerleme ve Ödüller', 'Progress & Rewards'),
      body: L('Her doğru cevap yıldız kazandırır. Günlük hedefini tamamlayınca serin uzar, biriken yıldızlarla ödül oyunlarının kilidi açılır. Aktapokus\'a dokununca ilerlemeni, ödül oyununu ve daha fazlasını gösteren hızlı menü açılır.', 'Every correct answer earns a star. Hitting your daily goal extends your streak, and enough stars unlock reward games. Tap Aktapokus to open a quick menu with your progress, the reward game, and more.'),
      demo: `<div style="display:flex;gap:10px;align-items:center;justify-content:center;pointer-events:none;font-weight:700;color:var(--kb-chalk);font-size:15px;"><span>⭐ 42</span><span>🔥 5 ${L('gün', 'days')}</span></div>`,
    },
    {
      icon: '🏫', title: L('Sınıf (Öğretmenler için)', 'Classroom (for teachers)'),
      body: L('Öğretmenin sana bir sınıf kodu verirse, hızlı menüdeki Avatar ekranından bu kodu girerek sınıfa katılabilirsin — böylece öğretmenin ilerlemeni takip edebilir. Öğretmenler kendi panellerine ayrı bir bağlantıdan giriş yapar.', 'If your teacher gives you a class code, enter it on the Avatar screen (from the quick menu) to join the class — then your teacher can see your progress. Teachers sign in to their own portal from a separate link.'),
    },
    {
      icon: '⛶', title: L('Tam Ekran', 'Full Screen'),
      body: L('Sol üstteki tam ekran düğmesiyle adres çubuğunu gizleyip daha büyük bir oyun alanı elde edebilirsin.', 'Use the full-screen button in the top-left corner to hide the address bar and get a bigger play area.'),
    },
  ];
  host.innerHTML = `
    <button class="ke-back-btn" id="keGuideBack">${ICON_BACK} ${L('Kapat', 'Close')}</button>
    <div class="ke-landing-header">
      <h1 class="ke-title">${bubbleTitleHTML(L('Nasıl Kullanılır?', 'How to Use'))}</h1>
      <p class="ke-subtitle">${L('Uygulamayı tanıyalım', "Let's get to know the app")}</p>
    </div>
    <div class="ke-guide-list">
      ${topics.map((t, i) => `
        <details class="ke-guide-item"${i === 0 ? ' open' : ''}>
          <summary class="ke-guide-summary"><span class="ke-guide-ico">${t.icon}</span>${t.title}</summary>
          <div class="ke-guide-body">
            <p>${t.body}</p>
            ${t.demo ? `<div class="ke-guide-demo">${t.demo}</div>` : ''}
          </div>
        </details>
      `).join('')}
    </div>
  `;
  host.querySelector('#keGuideBack').addEventListener('click', back);
  pushBackState(back);
}

function showSectionMenu(container, api, toolId, categories) {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  _currentSection = null;
  _journeyMode = false;
  // Tekrar kuyrugu eskiden sadece kategori kartindaki kucuk 🔁 cipindeydi
  // ("tekrar sistemi var ama gizli") - vadesi gelen tum kelimeler ana
  // ekranda tek satir; dokununca en cok kelime bekleyen kategori.
  const dueByCat = categories.map((c) => [c, Progress.dueMissed(c.id).length]).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]);
  const dueTotal = dueByCat.reduce((n, x) => n + x[1], 0);
  Resume.save({ screen: 'menu' });
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
      <img class="ke-carnival-logo" src="${new URL('mascot/aktapokus_kids_english_logo.png', ASSET_BASE_URL).href}" alt="Aktapokus Kids English" draggable="false" />
      <button type="button" class="ke-mascot-btn" id="keMascotBtn" aria-label="${L("Aktapokus'um ve ayarlar", 'My Aktapokus & settings')}" title="${L("Aktapokus'um", 'My Aktapokus')}">
        ${avatarCircleHTML(Profiles.active())}
        <span class="ke-mascot-edit" aria-hidden="true">✏️</span>
        <span class="ke-mascot-badge" id="keMascotBadge" ${hasBadge ? '' : 'hidden'}></span>
      </button>
    </div>
    ${journeyHomeCardHTML(categories)}
    ${dueTotal ? `<button type="button" class="ke-due-chip" id="keDueChip">🔁 ${L(`Bugün ${dueTotal} kelime tekrar`, `${dueTotal} words to review today`)} <span>→</span></button>` : ''}
    <h2 class="ke-lib-head">📚 ${L('Kütüphane', 'Library')} <span>${L('serbest çalışma — istediğin konuyu seç', 'free practice — pick any topic')}</span></h2>
    <div class="ke-category-grid ke-lib-grid" id="keSectionGrid"></div>
    ${bottomNavHTML('home')}
  `;
  wireBottomNav(host, container, api, toolId, categories);
  wireJourneyHomeCard(host, container, api, toolId, categories);
  const dueChip = host.querySelector('#keDueChip');
  if (dueChip) dueChip.addEventListener('click', () => { const c = dueByCat[0][0]; startReviewSession(container, api, toolId, categories, c.id, c.title); });
  host.querySelector('#keMascotBtn').addEventListener('click', () => showQuickMenu(container, api, toolId, categories));
  refreshGameBadge(container);
  maybeShowMotivationToast(container);
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
      : sec.special === 'stories'
        ? L('Sesli okuma hikayesi', 'A read-along story')
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
      card.addEventListener('click', () => {
        if (sec.special === 'stories') showStoryList(container, api, toolId, categories);
        else showCategoryGrid(container, api, toolId, categories, sec.id);
      });
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
    journey: pid === 'p1' ? 'ke_journey_v1' : 'ke_journey_v1_' + pid,
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

// ============================================================
// UZAY YOLCULUGU - "kullanici ilerlemesini takip edebilecek bir path;
// uzayda yolculuk yapar gibi, ulastigi yerlerde seviyesine uygun
// checkpoint; gecmise donuk tekrar oynayabilme; ileri gecmek icin ya
// atlama quiz'i ya da tum bolumleri tek tek oynama" istegi.
// Kararlar (kullanici onayi): yolculuk kilitli, Kutuphane (eski bolum
// menusu) serbest - ama kutuphanede bitirilen bolumler de yolculuga
// sayiliyor (ayni Progress). Gezegen icindeki bolumler de sirayla aciliyor.
// Her gezegen bir kategori; istasyonlar (checkpoint) seviye duraklari.
// Siralama: somut/gunluk -> soyut, her kelime gezegeninden sonra ayni
// konunun konusma gezegeni; A1 bitince A2 tekrari ayni konular uzerinden.
// ============================================================
// Siralama MEB Maarif programina gore (2025, s.30-34; bkz.
// meb_research/uyum_raporu_2026-09-25.html): A1 · 1 = 2. sinif (A1.1)
// temalari, A1 · 2 = 3. sinif (A1.2), A1 · 3 = 4. sinif (A1.3); A2 · 1/2 =
// 5./6. sinif. Kategoriler alt-tema bazinda bolunmedigi icin eslesme
// "en yakin sinif"a gore - kesin degil. Seviye etiketleri uygulama ici
// duraklardir, resmi CEFR sonucu degildir.
const A2_JOURNEY_IDS = {
  y5: ['daily_life', 'family_people', 'school_education', 'classroom_life', 'body_health', 'clothes_shopping', 'food_drinks', 'animals', 'nature_environment', 'city_places', 'hobbies_free_time'].map((id) => id + '_a2'),
  y6: ['home', 'jobs_professions', 'travel_transportation', 'emotions_personality', 'weather_seasons', 'sports_exercise', 'technology_computers', 'science', 'communication_internet', 'space_astronomy'].map((id) => id + '_a2'),
};
const JOURNEY_SECTORS = [
  { id: 'moon', emoji: '🌙', tr: 'Ay İstasyonu', en: 'Moon Station', grade: 2, get level() { return L('2. Sınıf', 'Grade 2') + ' · A1.1'; },
    planets: ['conv_social_manners', 'school_education', 'classroom_life', 'conv_school', 'body_health', 'clothes_shopping', 'weather_seasons', 'conv_weather_seasons', 'family_people', 'conv_family_home', 'home', 'animals', 'food_drinks', 'conv_food_drinks', 'math_numbers'] },
  { id: 'mars', emoji: '🔴', tr: 'Mars Üssü', en: 'Mars Base', grade: 3, get level() { return L('3. Sınıf', 'Grade 3') + ' · A1.2'; },
    planets: ['daily_life', 'conv_daily_routine', 'emotions_personality', 'conv_feelings_preferences', 'hobbies_free_time', 'sports_exercise', 'conv_hobbies_sports', 'nature_environment', 'conv_animals_nature', 'question_words', 'prepositions', 'math_shapes'] },
  { id: 'jupiter', emoji: '🟠', tr: 'Jüpiter İstasyonu', en: 'Jupiter Station', grade: 4, get level() { return L('4. Sınıf', 'Grade 4') + ' · A1.3'; },
    planets: ['jobs_professions', 'conv_jobs_safety', 'city_places', 'conv_city_transport', 'travel_transportation', 'conv_travel', 'conv_shopping_clothes', 'conv_health', 'opposites', 'math_operations', 'conv_celebrations', 'get'] },
  { id: 'saturn', emoji: '🪐', tr: 'Satürn Halkaları', en: 'Saturn Rings', grade: 0, get level() { return L('Bonus', 'Bonus') + ' · A1+'; },
    planets: ['technology_computers', 'conv_technology', 'communication_internet', 'science', 'space_astronomy', 'conv_space'] },
  { id: 'neptune', emoji: '🔵', tr: 'Neptün Kapısı', en: 'Neptune Gate', grade: 5, get level() { return L('5. Sınıf', 'Grade 5') + ' · A2.1'; }, planets: A2_JOURNEY_IDS.y5 },
  { id: 'galaxy', emoji: '🌌', tr: 'Galaksi Merkezi', en: 'Galaxy Core', grade: 6, get level() { return L('6. Sınıf', 'Grade 6') + ' · A2.2'; }, planets: A2_JOURNEY_IDS.y6 },
];
const SKIP_PASS_RATIO = 0.8;
let _journeyMode = false;

function journeyKey() {
  const pid = Profiles.active().id;
  return pid === 'p1' ? 'ke_journey_v1' : 'ke_journey_v1_' + pid;
}
const Journey = {
  _load() {
    try {
      const d = JSON.parse(window.localStorage.getItem(journeyKey())) || {};
      return { skipped: Array.isArray(d.skipped) ? d.skipped : [], cps: Array.isArray(d.cps) ? d.cps : [], at: Number(d.at) || 0 };
    } catch (e) { return { skipped: [], cps: [], at: 0 }; }
  },
  _save(d) {
    try { window.localStorage.setItem(journeyKey(), JSON.stringify(d)); } catch (e) { /* yok say */ }
    idbPut(journeyKey(), d);
  },
  // Duz gezegen listesi + her birinin durumu. Veride olmayan id atlanir.
  state(categories) {
    const store = this._load();
    const byId = new Map(categories.map((c) => [c.id, c]));
    const list = [];
    JOURNEY_SECTORS.forEach((sec, si) => {
      sec.planets.forEach((id) => {
        const cat = byId.get(id);
        if (!cat) return;
        const done = Progress.getCategory(id).completed.filter((i) => i < cat.episode_count).length;
        const full = done >= cat.episode_count;
        const skipped = !full && store.skipped.includes(id);
        list.push({ cat, id, sector: sec, si, done, full, skipped, cleared: full || skipped });
      });
    });
    list.forEach((p, i) => {
      p.index = i;
      p.unlocked = i === 0 || list[i - 1].cleared || p.done > 0;
    });
    const cur = list.find((p) => p.unlocked && !p.cleared);
    const current = cur ? cur.index : list.length - 1;
    const sectors = JOURNEY_SECTORS.map((sec, si) => {
      const ps = list.filter((p) => p.si === si);
      return { sec, si, planets: ps, cleared: ps.length > 0 && ps.every((p) => p.cleared), celebrated: store.cps.includes(sec.id) };
    });
    return { list, current, sectors, store, cleared: list.filter((p) => p.cleared).length };
  },
  // Gezegen icindeki bolum sirayla: ilk bolum, bitmis bolum, bir oncekinin
  // bittigi bolum ya da gezegen tamamen gecilmis (atlama sinaviyla) ise acik.
  episodeOpen(p, i) {
    if (p.cleared || i === 0) return true;
    const done = Progress.getCategory(p.id).completed;
    return done.includes(i) || done.includes(i - 1);
  },
  markSkipped(ids) {
    const d = this._load();
    ids.forEach((id) => { if (!d.skipped.includes(id)) d.skipped.push(id); });
    this._save(d);
  },
  markCelebrated(secId, at) {
    const d = this._load();
    if (secId && !d.cps.includes(secId)) d.cps.push(secId);
    if (at != null) d.at = at;
    this._save(d);
  },
};

function planetMotif(id) {
  return CATEGORY_MOTIF[baseCatId(id)] || (id.startsWith('conv_') ? '💬' : '⭐');
}
function planetTheme(id) {
  return CATEGORY_THEME[baseCatId(id)] || { c: '#4A90E2', dark: '#3A78C2', tint: '#9CC6F5' };
}
function planetName(p) {
  const name = catLabel(p.cat);
  if (p.id.startsWith('conv_')) return `💬 ${name}`;
  if (p.id.endsWith(A2_CATEGORY_SUFFIX)) return `${name} · A2`;
  return name;
}

// Ana ekrandaki yolculuk karti (Bugunun gorevi) - bkz. showSectionMenu
function journeyHomeCardHTML(categories) {
  const st = Journey.state(categories);
  const p = st.list[st.current];
  if (!p) return '';
  const sec = p.sector;
  const pct = Math.round(st.cleared / st.list.length * 100);
  const nextEp = Progress.nextIncompleteEpisode(p.id, p.cat.episode_count);
  return `
    <div class="ke-jhome">
      <div class="ke-jhome-top">
        <span class="ke-jhome-planet" style="--pc:${planetTheme(p.id).c}">${planetMotif(p.id)}</span>
        <div class="ke-jhome-text">
          <div class="ke-jhome-kicker">🚀 ${L('Uzay Macerası', 'Space Adventure')} · ${sec.level}</div>
          <div class="ke-jhome-title">${planetName(p)}</div>
          <div class="ke-jhome-sub">${p.full ? L('Tüm gezegenleri gezdin! 🎉', 'You visited every planet! 🎉') : L(`Bölüm ${nextEp + 1} / ${p.cat.episode_count} · Sıradaki durak: ${sec.emoji} ${sec.tr}`, `Episode ${nextEp + 1} / ${p.cat.episode_count} · Next stop: ${sec.emoji} ${sec.en}`)}</div>
        </div>
      </div>
      <div class="ke-jhome-bar" aria-label="${pct}%"><i style="width:${Math.max(3, pct)}%"></i></div>
      <div class="ke-jhome-meta">${L(`${st.cleared}/${st.list.length} gezegen`, `${st.cleared}/${st.list.length} planets`)}</div>
      <div class="ke-jhome-actions">
        <button type="button" class="ke-btn-primary ke-jhome-go" id="keJourneyGo">▶ ${L('Devam et', 'Continue')}</button>
        <button type="button" class="ke-btn-secondary ke-jhome-map" id="keJourneyMap">🚀 ${L('Macera', 'Adventure')}</button>
      </div>
    </div>`;
}
function wireJourneyHomeCard(host, container, api, toolId, categories) {
  const go = host.querySelector('#keJourneyGo');
  if (go) go.addEventListener('click', () => {
    const st = Journey.state(categories);
    const p = st.list[st.current];
    playJourneyEpisode(container, api, toolId, categories, p, Progress.nextIncompleteEpisode(p.id, p.cat.episode_count));
  });
  const map = host.querySelector('#keJourneyMap');
  if (map) map.addEventListener('click', () => showJourney(container, api, toolId, categories));
}

function playJourneyEpisode(container, api, toolId, categories, p, epIndex) {
  _journeyMode = true;
  _currentSection = null;
  enterCategory(container, api, toolId, categories, p.id, epIndex);
}

// Bolum ekranlarindan "geri"/"son bolum bitti": yolculuktan gelindiyse
// haritaya, kutuphaneden gelindiyse kategori listesine.
function leaveEpisodeList(container, api, toolId, categories) {
  if (_journeyMode) showJourney(container, api, toolId, categories);
  else showCategoryGrid(container, api, toolId, categories);
}

function showJourney(container, api, toolId, categories) {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  _journeyMode = true;
  _currentSection = null;
  Resume.save({ screen: 'journey' });
  const host = container.querySelector('#keScreenHost');
  const st = Journey.state(categories);
  const prof = Profiles.active();
  const cur = st.list[st.current];
  const nodes = [];
  st.sectors.forEach((sx) => {
    if (!sx.planets.length) return;
    nodes.push(`<div class="ke-jr-grade-head"><span>${sx.sec.emoji}</span>${sx.sec.level}</div>`);
    sx.planets.forEach((p) => {
      const th = planetTheme(p.id);
      const ring = Math.round(p.done / p.cat.episode_count * 360);
      const state = p.index === st.current && !p.cleared ? 'current' : p.cleared ? 'cleared' : p.unlocked ? 'open' : 'locked';
      const badge = state === 'cleared' ? (p.skipped ? '⏭' : '✓') : state === 'locked' ? '🔒' : '';
      nodes.push(`
        <div class="ke-jr-row ke-jr-${state}" data-zig="${p.index % 4}">
          <button type="button" class="ke-jr-planet" data-planet="${p.index}" style="--pc:${th.c};--pt:${th.tint};--ring:${ring}deg" aria-label="${planetName(p)}">
            <span class="ke-jr-orb">${planetMotif(p.id)}</span>
            ${badge ? `<span class="ke-jr-badge">${badge}</span>` : ''}
            ${state === 'current' ? `<span class="ke-jr-ship">${avatarCircleHTML(prof, 'ke-jr-avatar')}<span class="ke-jr-rocket">🚀</span></span>` : ''}
          </button>
          <div class="ke-jr-label"><b>${planetName(p)}</b><span>${p.done}/${p.cat.episode_count}${p.skipped ? ' · ' + L('sınavla geçildi', 'passed by test') : ''}</span></div>
        </div>`);
    });
    const reached = sx.cleared;
    // "Sinif atlamak icin quiz" - bu sinifin gecilmemis gezegenlerinden
    // atlama sinavi; gecince sonraki sinifin ilk gezegeni acilir.
    const nextSec = st.sectors[sx.si + 1];
    const nextFirst = nextSec && nextSec.planets[0];
    const curSi = st.list[st.current] ? st.list[st.current].si : -1;
    const canSkipGrade = !reached && nextFirst && !nextFirst.unlocked && sx.si === curSi;
    nodes.push(`
      <div class="ke-jr-station${reached ? ' ke-jr-reached' : ''}">
        <span class="ke-jr-st-emoji">${sx.sec.emoji}</span>
        <div><b>${L(sx.sec.tr, sx.sec.en)}</b><span>${reached ? L(`${sx.sec.level} tamamlandı! 🏅`, `${sx.sec.level} complete! 🏅`) : L(`Sınıf durağı · ${sx.sec.level}`, `Grade stop · ${sx.sec.level}`)}</span></div>
        <span class="ke-jr-st-medal">${reached ? '🏅' : '🔒'}</span>
      </div>
      ${canSkipGrade ? `<button type="button" class="ke-jr-gradeskip" data-grade-skip="${nextFirst.index}">⏭ ${L(`Sınıf atlama sınavı → ${nextSec.sec.level}`, `Grade jump test → ${nextSec.sec.level}`)}</button>` : ''}
      <div class="ke-jr-story-slot" data-story-slot="${sx.si + 1}"></div>`);
  });
  host.innerHTML = `
    <button class="ke-back-btn" id="keJourneyBack">${ICON_BACK} ${L('Ana Ekran', 'Home')}</button>
    <div class="ke-journey">
      <h1 class="ke-title">${bubbleTitleHTML(L('Uzay Macerası', 'Space Adventure'))}</h1>
      <p class="ke-subtitle">${L(`${st.cleared}/${st.list.length} gezegen · ${st.sectors.filter((s) => s.cleared).length}/${st.sectors.length} istasyon`, `${st.cleared}/${st.list.length} planets · ${st.sectors.filter((s) => s.cleared).length}/${st.sectors.length} stations`)}</p>
      <p class="ke-jr-hint">${L('Geçtiğin gezegenlere dokunup tekrar oynayabilirsin. Kilitli bir gezegene atlamak için atlama sınavını geçebilirsin.', 'Tap any planet you have visited to play it again. To jump to a locked planet, pass the jump test.')}</p>
      <div class="ke-jr-path" id="keJrPath">
        <svg class="ke-jr-trail" id="keJrTrail" aria-hidden="true"></svg>
        <div class="ke-jr-start">🌊 ${L('Kalkış: Aktapokus’un okyanustaki evi', 'Launch: Aktapokus’s home in the ocean')}</div>
        <div class="ke-jr-story-slot" data-story-slot="0"></div>
        ${nodes.join('')}
      </div>
    </div>
    ${bottomNavHTML('map')}`;
  wireBottomNav(host, container, api, toolId, categories);
  host.querySelector('#keJourneyBack').addEventListener('click', () => { _journeyMode = false; showSectionMenu(container, api, toolId, categories); });
  pushBackState(() => { _journeyMode = false; showSectionMenu(container, api, toolId, categories); });

  host.querySelectorAll('[data-grade-skip]').forEach((b) => b.addEventListener('click', () => {
    startSkipTest(container, api, toolId, categories, st.list[Number(b.dataset.gradeSkip)], st);
  }));
  host.querySelectorAll('[data-planet]').forEach((b) => b.addEventListener('click', () => {
    const p = st.list[Number(b.dataset.planet)];
    showPlanetSheet(container, api, toolId, categories, p, st);
  }));

  // Macera Kitabi: k. hikaye bolumu k. istasyondan sonra acilir (0 = kalkis).
  // Hikayeler ayri veri kaynagindan geldigi icin sonradan yerlestiriliyor.
  api.apiFetch(`/api/tools/${toolId}/stories`).then((r) => (r.ok ? r.json() : [])).then((stories) => {
    (stories || []).forEach((sto, k) => {
      const slot = host.querySelector(`[data-story-slot="${k}"]`);
      if (!slot) return;
      const open = k === 0 || (st.sectors[k - 1] && st.sectors[k - 1].cleared);
      const read = Progress.getCategory('story_' + sto.id).completed.length > 0;
      slot.innerHTML = `<button type="button" class="ke-jr-story${open ? '' : ' locked'}" data-story="${sto.id}">
        <span class="ke-jr-story-ic">${open ? '📖' : '🔒'}</span>
        <span><b>${L('Macera Kitabı', 'Adventure Book')} · ${escapeProfileText(sto.episode_label || '')}${read ? ' ⭐' : ''}</b><small>${escapeProfileText(_lang === 'tr' ? (sto.title_tr || sto.title) : sto.title)}</small></span></button>`;
      slot.querySelector('button').addEventListener('click', () => {
        if (!open) { showJourneyToast(container, L('Bu bölüm bir önceki istasyona ulaşınca açılır 🔒', 'This chapter opens when you reach the previous station 🔒')); return; }
        _journeyMode = true;
        showStoryReader(container, api, toolId, categories, sto.id);
      });
    });
    drawTrail();
  }).catch(() => { /* hikaye yoksa harita aynen calisir */ });
  const pathEl = host.querySelector('#keJrPath');
  const drawTrail = () => {
    const svg = host.querySelector('#keJrTrail');
    if (!svg || !pathEl.isConnected) return;
    const base = pathEl.getBoundingClientRect();
    const pts = [...pathEl.querySelectorAll('.ke-jr-planet, .ke-jr-st-emoji')].map((el) => {
      const r = el.getBoundingClientRect();
      return [r.left + r.width / 2 - base.left, r.top + r.height / 2 - base.top, el.closest('.ke-jr-row') ? el.closest('.ke-jr-row').className : ''];
    });
    svg.setAttribute('width', base.width); svg.setAttribute('height', pathEl.scrollHeight);
    let travelled = '';
    let ahead = '';
    const curIdx = st.current;
    pts.forEach((pt, i) => {
      if (!i) return;
      const [x0, y0] = pts[i - 1], [x1, y1] = pt;
      const my = (y0 + y1) / 2;
      const seg = `M${x0},${y0} C${x0},${my} ${x1},${my} ${x1},${y1} `;
      if (pt[2].includes('ke-jr-cleared') || pt[2].includes('ke-jr-current')) travelled += seg; else ahead += seg;
    });
    svg.innerHTML = `<path d="${ahead}" class="ke-jr-trail-ahead"/><path d="${travelled}" class="ke-jr-trail-done"/>`;
    void curIdx;
  };
  requestAnimationFrame(() => {
    drawTrail();
    const curEl = pathEl.querySelector('.ke-jr-current') || pathEl.querySelector('.ke-jr-row');
    if (curEl) curEl.scrollIntoView({ block: 'center', behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
  });
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => drawTrail()) : null;
  if (ro) ro.observe(pathEl);

  // Yeni istasyona ulasildiysa kutlama (bir kez); yeni gezegen acildiysa haber
  const fresh = st.sectors.find((s) => s.cleared && !s.celebrated);
  if (fresh) {
    Journey.markCelebrated(fresh.sec.id, st.current);
    showCheckpointCelebration(container, fresh.sec);
  } else if (st.current > st.store.at) {
    Journey.markCelebrated(null, st.current);
    if (st.store.at > 0 || st.current > 0) showJourneyToast(container, L(`🚀 Yeni gezegen açıldı: ${planetName(cur)}!`, `🚀 New planet unlocked: ${planetName(cur)}!`));
  }
}

function showJourneyToast(container, text) {
  const shell = container.querySelector('.ke-shell');
  const t = document.createElement('div');
  t.className = 'ke-jr-toast';
  t.textContent = text;
  shell.appendChild(t);
  setTimeout(() => t.classList.add('ke-show'), 30);
  setTimeout(() => { t.classList.remove('ke-show'); setTimeout(() => t.remove(), 400); }, 3200);
}

function showCheckpointCelebration(container, sec) {
  GameTokens.add(1);
  const shell = container.querySelector('.ke-shell');
  const ov = document.createElement('div');
  ov.className = 'ke-river-overlay-msg ke-jr-cp';
  ov.style.position = 'fixed'; ov.style.zIndex = '95';
  ov.innerHTML = `
    <div class="ke-river-msg-card ke-jr-cp-card">
      <div id="keCpConfetti" style="position:absolute;inset:0;pointer-events:none;overflow:hidden;"></div>
      <div class="ke-jr-cp-emoji">${sec.emoji}</div>
      <h2>${L(`${sec.tr}'na ulaştın!`, `You reached ${sec.en}!`)}</h2>
      <p>${L(`${sec.level} seviye durağını tamamladın. Harika bir yolculuk! 🏅`, `You completed the ${sec.level} level stop. What a journey! 🏅`)}</p>
      <p class="ke-jr-cp-gift">🎁 ${L('Ödül: 1 oyun hakkı 🎮', 'Reward: 1 game token 🎮')}</p>
      <button type="button" class="ke-btn-primary" id="keCpOk">${L('Maceraya devam! 🚀', 'Keep flying! 🚀')}</button>
    </div>`;
  shell.appendChild(ov);
  try { launchConfetti(ov.querySelector('#keCpConfetti')); } catch (e) { /* yok say */ }
  try { GameSfx.win(); } catch (e) { /* yok say */ }
  ov.querySelector('#keCpOk').addEventListener('click', () => { ov.remove(); refreshGameBadge(container); });
}

function showPlanetSheet(container, api, toolId, categories, p, st) {
  const shell = container.querySelector('.ke-shell');
  const ov = document.createElement('div');
  ov.className = 'ke-river-overlay-msg ke-jr-sheet';
  ov.style.position = 'fixed'; ov.style.zIndex = '90';
  const close = () => ov.remove();
  const th = planetTheme(p.id);
  let body;
  if (!p.unlocked) {
    const cur = st.list[st.current];
    const between = st.list.filter((x) => x.index >= st.current && x.index < p.index && !x.cleared);
    const left = between.reduce((n, x) => n + (x.cat.episode_count - x.done), 0);
    body = `
      <p class="ke-jr-sheet-lead">🔒 ${L('Bu gezegen henüz kilitli. İki yolun var:', 'This planet is still locked. You have two ways:')}</p>
      <div class="ke-jr-way">
        <b>1. ${L('Sırayla uç', 'Fly in order')}</b>
        <span>${L(`Aradaki ${between.length} gezegeni bitir (${left} bölüm).`, `Finish the ${between.length} planets in between (${left} episodes).`)}</span>
        <button type="button" class="ke-btn-secondary" id="keSheetGoCur">▶ ${planetName(cur)}</button>
      </div>
      <div class="ke-jr-way">
        <b>2. ${L('Atlama sınavı', 'Jump test')} 🚀</b>
        <span>${L(`Aradaki gezegenlerden sorular. %${Math.round(SKIP_PASS_RATIO * 100)} doğru yaparsan buraya kadar atlarsın.`, `Questions from the planets in between. Get ${Math.round(SKIP_PASS_RATIO * 100)}% right to jump here.`)}</span>
        <button type="button" class="ke-btn-primary" id="keSheetSkip">${L('Sınava başla', 'Start the test')}</button>
      </div>`;
  } else {
    const eps = [];
    for (let i = 0; i < p.cat.episode_count; i++) {
      const doneSet = Progress.getCategory(p.id).completed;
      const done = doneSet.includes(i);
      const open = Journey.episodeOpen(p, i);
      eps.push(`<button type="button" class="ke-jr-moon${done ? ' done' : ''}${open ? '' : ' locked'}" data-ep="${i}" ${open ? '' : 'aria-disabled="true"'}>${done ? '⭐' : open ? '▶' : '🔒'}<small>${i + 1}</small></button>`);
    }
    const next = Progress.nextIncompleteEpisode(p.id, p.cat.episode_count);
    const due = Progress.dueMissed(p.id).length;
    body = `
      <p class="ke-jr-sheet-lead">${L(`${p.cat.word_count} kelime · ${p.done}/${p.cat.episode_count} bölüm`, `${p.cat.word_count} words · ${p.done}/${p.cat.episode_count} episodes`)}</p>
      <div class="ke-jr-moons">${eps.join('')}</div>
      <div class="ke-btn-row" style="margin-top:12px;">
        ${due ? `<button type="button" class="ke-btn-secondary" id="keSheetReview">🔁 ${L('Tekrar', 'Review')} (${due})</button>` : ''}
        <button type="button" class="ke-btn-primary" id="keSheetPlay">▶ ${p.full ? L('Baştan oyna', 'Play again') : L(`Bölüm ${next + 1}`, `Episode ${next + 1}`)}</button>
      </div>`;
  }
  ov.innerHTML = `
    <div class="ke-river-msg-card ke-jr-sheet-card" style="--pc:${th.c}">
      <button type="button" class="ke-jr-sheet-x" id="keSheetClose" aria-label="${L('Kapat', 'Close')}">✕</button>
      <div class="ke-jr-sheet-head"><span class="ke-jr-sheet-orb">${planetMotif(p.id)}</span><div><div class="ke-jhome-kicker">${p.sector.emoji} ${L(p.sector.tr, p.sector.en)} · ${p.sector.level}</div><h2>${planetName(p)}</h2></div></div>
      ${body}
    </div>`;
  shell.appendChild(ov);
  ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
  ov.querySelector('#keSheetClose').addEventListener('click', close);
  ov.querySelectorAll('[data-ep]').forEach((b) => b.addEventListener('click', () => {
    if (b.classList.contains('locked')) { b.classList.add('ke-shake'); setTimeout(() => b.classList.remove('ke-shake'), 400); return; }
    close();
    playJourneyEpisode(container, api, toolId, categories, p, Number(b.dataset.ep));
  }));
  const play = ov.querySelector('#keSheetPlay');
  if (play) play.addEventListener('click', () => { close(); playJourneyEpisode(container, api, toolId, categories, p, p.full ? 0 : Progress.nextIncompleteEpisode(p.id, p.cat.episode_count)); });
  const rev = ov.querySelector('#keSheetReview');
  if (rev) rev.addEventListener('click', () => { close(); _journeyMode = true; startReviewSession(container, api, toolId, categories, p.id, p.cat.title); });
  const goCur = ov.querySelector('#keSheetGoCur');
  if (goCur) goCur.addEventListener('click', () => { close(); const c = st.list[st.current]; playJourneyEpisode(container, api, toolId, categories, c, Progress.nextIncompleteEpisode(c.id, c.cat.episode_count)); });
  const skip = ov.querySelector('#keSheetSkip');
  if (skip) skip.addEventListener('click', () => { close(); startSkipTest(container, api, toolId, categories, p, st); });
}

// Atlama sinavi: hedefe kadar aradaki (gecilmemis) gezegenlerden sorular.
// Konusma gezegenlerinde resimli kelime yok - onlar yerine araliktaki
// (yoksa daha onceki) kelime gezegenleri kullaniliyor. Iki soru tipi
// donusumlu: resme bak -> Ingilizce kelimeyi sec (okuma), kelimeyi dinle ->
// resmi sec (dinleme). Gecince aradaki gezegenler "sinavla gecildi"
// isaretleniyor (yildiz verilmiyor - istedigi zaman oynayip kazanabilir).
async function startSkipTest(container, api, toolId, categories, target, st) {
  const shell = container.querySelector('.ke-shell');
  const between = st.list.filter((x) => x.index >= st.current && x.index < target.index && !x.cleared);
  let sources = between.filter((x) => !x.id.startsWith('conv_'));
  if (!sources.length) sources = st.list.filter((x) => x.index < target.index && !x.id.startsWith('conv_')).slice(-3);
  const ov = document.createElement('div');
  ov.className = 'ke-bonus-quiz ke-jr-skip';
  ov.innerHTML = `<div class="ke-bonus-card"><div class="ke-bonus-progress" id="keSkipProg">🚀 ${L('Atlama sınavı hazırlanıyor…', 'Preparing the jump test…')}</div><div id="keSkipBody"><div class="ke-bonus-loading">🛸</div></div></div>`;
  shell.appendChild(ov);
  requestAnimationFrame(() => ov.classList.add('ke-show'));
  const close = () => { ov.classList.remove('ke-show'); setTimeout(() => ov.remove(), 300); };
  const bodyEl = ov.querySelector('#keSkipBody');
  const progEl = ov.querySelector('#keSkipProg');

  const nQ = Math.min(12, Math.max(8, sources.length * 2));
  const picked = shuffle(sources.slice()).slice(0, 8);
  let pools = [];
  try {
    // Az kaynak gezegen varsa (ornegin arada tek kelime gezegeni) her
    // birinden birden fazla bolum cekiliyor ki soru sayisi dolsun.
    const perSource = Math.min(3, Math.ceil(nQ / (picked.length * 5)));
    pools = await Promise.all(picked.map(async (x) => {
      const eps = shuffle([...Array(x.cat.episode_count).keys()]).slice(0, perSource);
      const lists = await Promise.all(eps.map(async (ep) => {
        const r = await api.apiFetch(`/api/tools/${toolId}/categories/${x.id}/episodes/${ep}`);
        if (!r.ok) return [];
        const d = await r.json();
        return (d.objects || []).filter((o) => o.word);
      }));
      return shuffle([...new Map(lists.flat().map((o) => [o.word.toLowerCase(), o])).values()]);
    }));
  } catch (e) { pools = []; }
  const qs = [];
  const all = pools.flat();
  for (let round = 0; qs.length < nQ && round < 10; round++) {
    pools.forEach((pool) => { if (qs.length < nQ && pool[round]) qs.push(pool[round]); });
  }
  if (qs.length < 5) {
    bodyEl.innerHTML = `<p>${L('Şu an sınav hazırlanamadı. İnternetini kontrol edip tekrar dene.', 'Could not prepare the test. Check your internet and try again.')}</p><button type="button" class="ke-btn-secondary" id="keSkipClose">${L('Kapat', 'Close')}</button>`;
    bodyEl.querySelector('#keSkipClose').addEventListener('click', close);
    return;
  }
  const dummyMascot = document.createElement('div');
  let qi = 0, correct = 0;
  const missed = [];
  function ask() {
    if (qi >= qs.length) { finish(); return; }
    const target_ = qs[qi];
    const others = shuffle(all.filter((o) => o.word.toLowerCase() !== target_.word.toLowerCase())).slice(0, 2);
    const choices = shuffle([target_, ...others]);
    const listen = qi % 2 === 1;
    progEl.textContent = `🚀 ${L('Soru', 'Question')} ${qi + 1} / ${qs.length} · ✅ ${correct}`;
    bodyEl.innerHTML = listen
      ? `<p class="ke-jr-q">${L('Dinle ve doğru resmi seç', 'Listen and pick the right picture')}</p>
         <button type="button" class="ke-btn-secondary ke-jr-listen" id="keSkipSay">${ICON_SPEAKER} ${L('Tekrar dinle', 'Listen again')}</button>
         <div class="ke-jr-pics">${choices.map((c, i) => `<button type="button" class="ke-jr-pic" data-i="${i}">${renderObjectIcon(c)}</button>`).join('')}</div>`
      : `<p class="ke-jr-q">${L('Bu ne? Doğru kelimeyi seç', 'What is it? Pick the right word')}</p>
         <div class="ke-bonus-icon">${renderObjectIcon(target_)}</div>
         <div class="ke-bonus-choices">${choices.map((c, i) => `<button type="button" class="ke-bonus-choice" data-i="${i}">${c.word}</button>`).join('')}</div>`;
    if (listen) {
      const say = () => speakWord(target_.word, dummyMascot);
      say();
      bodyEl.querySelector('#keSkipSay').addEventListener('click', say);
    }
    let answered = false;
    bodyEl.querySelectorAll('[data-i]').forEach((btn) => btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      const ok = choices[Number(btn.dataset.i)] === target_;
      if (ok) { correct++; btn.classList.add('ke-bonus-right'); try { GameSfx.good(); } catch (e) { /* yok say */ } }
      else {
        missed.push(target_);
        btn.classList.add('ke-bonus-wrong');
        bodyEl.querySelectorAll('[data-i]').forEach((b) => { if (choices[Number(b.dataset.i)] === target_) b.classList.add('ke-bonus-right'); });
      }
      setTimeout(() => { qi++; ask(); }, ok ? 700 : 1400);
    }));
  }
  function finish() {
    const need = Math.ceil(qs.length * SKIP_PASS_RATIO);
    if (correct >= need) {
      Journey.markSkipped(between.map((x) => x.id));
      progEl.textContent = L('Sonuç', 'Result');
      bodyEl.innerHTML = `
        <div class="ke-bonus-icon" style="font-size:54px;">🚀</div>
        <p><b>${L(`${correct}/${qs.length} doğru — atlama başarılı!`, `${correct}/${qs.length} correct — jump successful!`)}</b></p>
        <p>${L(`${planetName(target)} gezegenine uçtun. Geçtiğin gezegenleri istediğin zaman oynayıp yıldız toplayabilirsin.`, `You flew to ${planetName(target)}. You can still play the planets you skipped to collect stars.`)}</p>
        <button type="button" class="ke-btn-primary" id="keSkipDone">${L('Maceraya dön', 'Back to the adventure')}</button>`;
      bodyEl.querySelector('#keSkipDone').addEventListener('click', () => { close(); showJourney(container, api, toolId, categories); });
    } else {
      progEl.textContent = L('Sonuç', 'Result');
      const ms = [...new Map(missed.map((m) => [m.word, m])).values()].slice(0, 8);
      bodyEl.innerHTML = `
        <div class="ke-bonus-icon" style="font-size:48px;">💪</div>
        <p><b>${L(`${correct}/${qs.length} doğru. Atlamak için ${need} gerekiyordu.`, `${correct}/${qs.length} correct. You needed ${need} to jump.`)}</b></p>
        ${ms.length ? `<p class="ke-jr-missed">${L('Çalışman gereken kelimeler:', 'Words to practise:')} ${ms.map((m) => `<span>${m.word}</span>`).join(' ')}</p>` : ''}
        <div class="ke-btn-row">
          <button type="button" class="ke-btn-secondary" id="keSkipLater">${L('Sırayla oynayacağım', "I'll play in order")}</button>
          <button type="button" class="ke-btn-primary" id="keSkipRetry">${L('Tekrar dene', 'Try again')}</button>
        </div>`;
      bodyEl.querySelector('#keSkipLater').addEventListener('click', close);
      bodyEl.querySelector('#keSkipRetry').addEventListener('click', () => { close(); startSkipTest(container, api, toolId, categories, target, st); });
    }
  }
  ask();
}


// ---- UX: alt gezinme cubugu (basparmak bolgesi) ----
// Ekranin kendi HTML'inin sonuna ekleniyor (position:sticky) - boylece
// bolum/oyun/hikaye gibi tam ekran akislara gecince kendiliginden kayboluyor.
function bottomNavHTML(active) {
  const items = [
    ['home', '🏠', L('Ana', 'Home')],
    ['map', '🚀', L('Macera', 'Adventure')],
    ['avatar', '🎨', L('Avatar', 'Avatar')],
    ['stats', '📊', L('İlerleme', 'Progress')],
  ];
  return `<nav class="ke-bnav" aria-label="${L('Gezinme', 'Navigation')}">${items.map(([k, ic, lb]) => `<button type="button" class="ke-bnav-btn${k === active ? ' ke-sel' : ''}" data-nav="${k}" ${k === active ? 'aria-current="page"' : ''}><span>${ic}</span>${lb}</button>`).join('')}</nav>`;
}
function wireBottomNav(host, container, api, toolId, categories) {
  host.querySelectorAll('[data-nav]').forEach((b) => b.addEventListener('click', () => {
    if (b.classList.contains('ke-sel')) return;
    const k = b.dataset.nav;
    if (k === 'home') showSectionMenu(container, api, toolId, categories);
    else if (k === 'map') showJourney(container, api, toolId, categories);
    else if (k === 'avatar') showProfileScreen(container, api, toolId, categories, {});
    else if (k === 'stats') showStatsScreen(container, api, toolId, categories);
  }));
}

// Turkce/Ingilizce yonergeyi sesli okur (madde 3: "yonergeler sesli").
function speakUI(text) {
  if (!('speechSynthesis' in window) || !text) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(String(text).replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, ''));
  u.lang = _lang === 'tr' ? 'tr-TR' : 'en-US';
  const v = synth.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith(_lang === 'tr' ? 'tr' : 'en'));
  if (v) u.voice = v;
  u.rate = 0.95;
  synth.speak(u);
}
// Bir konusma balonuna kucuk 🔊 dugmesi ekler; metin degisse de guncel
// metni okur.
function addSpeakButton(el) {
  if (!el || el.querySelector('.ke-say-btn')) return;
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'ke-say-btn'; b.textContent = '🔊';
  b.setAttribute('aria-label', L('Sesli oku', 'Read aloud'));
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    const t = [...el.childNodes].filter((n) => n !== b).map((n) => n.textContent).join(' ');
    speakUI(t);
  });
  el.appendChild(b);
  // textContent ile metin degistirilince dugme silinir - geri ekle
  new MutationObserver(() => { if (!el.contains(b)) el.appendChild(b); }).observe(el, { childList: true });
}

// ---- UX madde 1 + 10: ilk 5 saniye - karsilama ve hikaye ----
// Aktapokus okyanustaki evinde yasayan bir ahtapot; Kelime Yildizlari
// uzaya sacilmis, onlari toplamak icin bir kasif ariyor. Macera Kitabi
// (Story Time) bu yolculugun hikayesini anlatiyor.
function showWelcome(container, api, toolId, categories) {
  const host = container.querySelector('#keScreenHost');
  const demo = Object.assign({ id: 'p0', name: '' }, AVATAR_DEFAULTS, { scene: 'space', item: 'star' });
  const lines = () => [
    L('Merhaba! Ben Aktapokus 🐙', "Hi! I'm Aktapokus 🐙"),
    L('Kelime Yıldızları uzaya dağıldı! Onları toplamak için bir kâşif arıyorum.', 'The Word Stars are scattered across space! I need an explorer to collect them.'),
    L('Her gezegende yeni İngilizce kelimeler var. Benimle gelir misin?', 'Every planet has new English words. Will you come with me?'),
  ];
  host.innerHTML = `
    <div class="ke-welcome">
      <div class="ke-welcome-lang">
        <button type="button" class="ke-pick${_lang === 'tr' ? ' ke-sel' : ''}" data-lang="tr">🇹🇷 Türkçe</button>
        <button type="button" class="ke-pick${_lang === 'en' ? ' ke-sel' : ''}" data-lang="en">🇬🇧 English</button>
      </div>
      ${avatarStageHTML(demo)}
      <div class="ke-welcome-bubble" id="keWelcomeBubble">${lines().map((t) => `<p>${t}</p>`).join('')}</div>
      <div class="ke-welcome-steps" aria-hidden="true"><i class="on"></i><i></i><i></i></div>
      <button type="button" class="ke-welcome-go" id="keWelcomeGo">${L('Evet, gidelim! 🚀', "Yes, let's go! 🚀")}</button>
    </div>`;
  addSpeakButton(host.querySelector('#keWelcomeBubble'));
  host.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => { setLang(b.dataset.lang); showWelcome(container, api, toolId, categories); }));
  host.querySelector('#keWelcomeGo').addEventListener('click', () => showProfileScreen(container, api, toolId, categories, { first: true }));
}

// ---- UX madde 9: ebeveyn alani ----
function showParentGate(container, api, toolId, categories) {
  const a = 3 + Math.floor(Math.random() * 7), b = 4 + Math.floor(Math.random() * 6);
  const shell = container.querySelector('.ke-shell');
  const ov = document.createElement('div');
  ov.className = 'ke-river-overlay-msg ke-jr-sheet';
  ov.style.position = 'fixed'; ov.style.zIndex = '95';
  ov.innerHTML = `
    <div class="ke-river-msg-card ke-parent-gate">
      <h2>👪 ${L('Ebeveyn Alanı', 'Parent Area')}</h2>
      <p>${L('Devam etmek için soruyu cevaplayın:', 'Answer to continue:')}</p>
      <div class="ke-parent-q">${a} × ${b} = ?</div>
      <input id="keGateIn" class="ke-profile-name" inputmode="numeric" maxlength="3" autocomplete="off" style="color:#233;border-color:#bbb;background:#fff;" />
      <div id="keGateMsg" style="min-height:18px;font-size:12.5px;font-weight:700;color:#c33;"></div>
      <div class="ke-btn-row">
        <button type="button" class="ke-btn-secondary" id="keGateNo">${L('Vazgeç', 'Cancel')}</button>
        <button type="button" class="ke-btn-primary" id="keGateOk">${L('Aç', 'Open')}</button>
      </div>
    </div>`;
  shell.appendChild(ov);
  const inp = ov.querySelector('#keGateIn');
  inp.focus();
  const ok = () => {
    if (Number(inp.value) === a * b) { ov.remove(); showParentArea(container, api, toolId, categories); }
    else { ov.querySelector('#keGateMsg').textContent = L('Yanlış cevap', 'Wrong answer'); inp.value = ''; }
  };
  ov.querySelector('#keGateOk').addEventListener('click', ok);
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') ok(); });
  ov.querySelector('#keGateNo').addEventListener('click', () => ov.remove());
}

async function showParentArea(container, api, toolId, categories) {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  const host = container.querySelector('#keScreenHost');
  const back = () => showSectionMenu(container, api, toolId, categories);
  host.innerHTML = `
    <button class="ke-back-btn" id="keParentBack">${ICON_BACK} ${L('Ana Ekran', 'Home')}</button>
    <div class="ke-profile-screen ke-parent" style="max-width:640px;">
      <h1 class="ke-title">${bubbleTitleHTML(L('Ebeveyn Alanı', 'Parent Area'))}</h1>
      <div id="keParentBody">${L('Yükleniyor…', 'Loading…')}</div>
    </div>`;
  host.querySelector('#keParentBack').addEventListener('click', back);
  pushBackState(back);
  const p = Profiles.active();
  const kpi = await computeKPIs(p.id);
  const st = Journey.state(categories);
  const cur = st.list[st.current];
  const mins = Math.floor(kpi.timeSeconds / 60);
  let today = 0;
  try { today = Math.floor((TodayTime.get ? TodayTime.get() : 0) / 60); } catch (e) { today = 0; }
  // En cok zorlanilan kelimeler: tum kategorilerde yanlis sayisina gore
  const hard = [];
  categories.forEach((c) => {
    const m = Progress.getCategory(c.id).missed || {};
    Object.values(m).forEach((e) => { if (e && e.obj) hard.push({ word: e.obj.word, tr: e.obj.tr, n: e.count, cat: catLabel(c) }); });
  });
  hard.sort((x, y) => y.n - x.n);
  const cls = Classroom.get();
  const dayLetters = L('PSÇPCCP', 'MTWTFSS').split('');
  const body = host.querySelector('#keParentBody');
  body.innerHTML = `
    <div class="ke-week-card ke-parent-card">
      <div class="ke-kpi-lbl">${L('Bu hafta', 'This week')} · ${escapeProfileText(p.name || '')}</div>
      <div class="ke-parent-grid">
        <div><b>${kpi.thisWeek}</b><span>${L('cevap', 'answers')}</span></div>
        <div><b>${kpi.accuracy === null ? '—' : kpi.accuracy + '%'}</b><span>${L('doğruluk', 'accuracy')}</span></div>
        <div><b>${kpi.streak}</b><span>${L('gün seri', 'day streak')}</span></div>
        <div><b>${mins}</b><span>${L('dk toplam', 'min total')}</span></div>
      </div>
      <div class="ke-spark-row">${kpi.last7.map((n, i) => `<div class="ke-spark-col"><div class="ke-spark-bar${i === 6 ? ' ke-spark-today' : ''}" style="height:${Math.max(6, Math.round(n / Math.max(1, ...kpi.last7) * 44))}px" title="${n}"></div><div class="ke-spark-day">${dayLetters[i]}</div></div>`).join('')}</div>
    </div>
    <div class="ke-week-card ke-parent-card">
      <div class="ke-kpi-lbl">🚀 ${L('Seviye ve konum', 'Level and position')}</div>
      <p class="ke-parent-p">${cur ? L(`Şu an <b>${planetName(cur)}</b> gezegeninde (${cur.sector.level} · ${cur.sector.tr} yolunda). ${st.cleared}/${st.list.length} gezegen tamamlandı; ${kpi.puzzlesCompleted} bölüm bitirildi.`, `Currently on <b>${planetName(cur)}</b> (${cur.sector.level}, on the way to ${cur.sector.en}). ${st.cleared}/${st.list.length} planets done; ${kpi.puzzlesCompleted} episodes finished.`) : ''}</p>
      <p class="ke-parent-note">${L('Seviye etiketleri (A1 · 1 gibi) uygulama içi duraklardır; resmi bir CEFR sınav sonucu değildir.', 'Level tags (e.g. A1 · 1) are in-app stops, not an official CEFR test result.')}</p>
    </div>
    <div class="ke-week-card ke-parent-card">
      <div class="ke-kpi-lbl">🔁 ${L('En çok zorlandığı kelimeler', 'Hardest words')}</div>
      ${hard.length ? `<ul class="ke-parent-hard">${hard.slice(0, 12).map((h) => `<li><b>${escapeProfileText(h.word)}</b> <span>${escapeProfileText(h.tr || '')}</span> <small>×${h.n} · ${escapeProfileText(h.cat)}</small></li>`).join('')}</ul>` : `<p class="ke-parent-p">${L('Henüz zorlandığı kelime yok 👍', 'No difficult words yet 👍')}</p>`}
    </div>
    <div class="ke-week-card ke-parent-card">
      <div class="ke-kpi-lbl">🏫 ${L('Öğretmen sınıfı', 'Teacher class')}</div>
      <p class="ke-parent-p">${cls.code ? `${escapeProfileText(cls.className || cls.code)} · ${classSyncLabel(cls)}` : L('Bir sınıfa katılmamış. Öğretmeniniz sınıf kodu verdiyse Avatar ekranının altından katılabilirsiniz.', 'Not in a class. If the teacher gave a class code, join from the bottom of the Avatar screen.')}</p>
    </div>
    <div class="ke-week-card ke-parent-card">
      <div class="ke-kpi-lbl">💾 ${L('Yedekleme', 'Backup')}</div>
      <div class="ke-pick-row" style="justify-content:flex-start;">
        <button type="button" class="ke-pick" id="keParentExport">${L('Yedek indir', 'Download backup')}</button>
        <label class="ke-pick" for="keParentImport" style="cursor:pointer;">${L('Yedek yükle', 'Restore backup')}</label>
        <input type="file" id="keParentImport" accept="application/json" style="display:none;" />
      </div>
      <p class="ke-parent-note">${L('İlerleme bu cihazda saklanır; sınıfa katıldıysanız yalnızca özet ilerleme öğretmene gider.', 'Progress is stored on this device; if in a class, only a progress summary goes to the teacher.')}</p>
    </div>`;
  void today;
  host.querySelector('#keParentExport').addEventListener('click', exportBackup);
  host.querySelector('#keParentImport').addEventListener('change', (e) => importBackup(e.target.files[0]));
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
    ${bottomNavHTML('stats')}
  `;
  wireBottomNav(host, container, api, toolId, categories);
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

  const jst = Journey.state(categories);
  const journeyHTML = `
    <div class="ke-week-card ke-jr-summary">
      <div class="ke-kpi-lbl">🚀 ${L('Uzay Macerası', 'Space Adventure')}</div>
      <div class="ke-kpi-val">${jst.cleared}<span style="font-size:15px;font-weight:700;"> / ${jst.list.length} ${L('gezegen', 'planets')}</span></div>
      <div class="ke-jr-medals">${jst.sectors.map((sx) => `<div class="ke-jr-medal${sx.cleared ? ' got' : ''}" title="${L(sx.sec.tr, sx.sec.en)}"><span>${sx.cleared ? sx.sec.emoji : '🔒'}</span><small>${sx.sec.level}</small></div>`).join('')}</div>
      <button type="button" class="ke-btn-primary" id="keStatsJourney" style="margin-top:10px;">🚀 ${L('Macerayı aç — geçmiş gezegenleri tekrar oyna', 'Open the adventure — replay past planets')}</button>
    </div>`;
  const body = host.querySelector('#keStatsBody');
  if (body) {
    body.innerHTML = `
      ${journeyHTML}
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
    host.querySelector('#keStatsJourney').addEventListener('click', () => showJourney(container, api, toolId, categories));
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
    ? Object.assign({ id: Profiles.newId(), name: '' }, AVATAR_DEFAULTS)
    : Object.assign({}, Profiles.active());
  const stars = creating ? 0 : Progress.totalStars();
  const streakDays = creating ? 0 : Streak.get();
  let msg = '';
  let tab = 'color';

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

  // Siradaki acilacak parca: yildiz ve seri icin ayri ayri en yakini
  function nextUnlockMsg() {
    const all = [];
    AVATAR_SLOTS().forEach((slot) => slot.list.forEach((it) => { if (isLocked(it)) all.push(it); }));
    const byStar = all.filter((i) => !i.needStreak).sort((a, b) => a.need - b.need)[0];
    const byStreak = all.filter((i) => i.needStreak).sort((a, b) => a.needStreak - b.needStreak)[0];
    const parts = [];
    if (byStar) parts.push(L(`${byStar.emoji || '🎨'} ${byStar.label}: ${byStar.need - stars} ⭐ kaldı`, `${byStar.emoji || '🎨'} ${byStar.label}: ${byStar.need - stars} ⭐ to go`));
    if (byStreak) parts.push(L(`${byStreak.emoji || '🎨'} ${byStreak.label}: ${byStreak.needStreak} gün seri`, `${byStreak.emoji || '🎨'} ${byStreak.label}: ${byStreak.needStreak}-day streak`));
    const opened = AVATAR_SLOTS().reduce((n, slot) => n + slot.list.filter((it) => !isLocked(it)).length, 0);
    const total = AVATAR_SLOTS().reduce((n, slot) => n + slot.list.length, 0);
    return { opened, total, text: parts.length ? L('Sıradaki: ', 'Next: ') + parts.join(' · ') : L('Hepsini açtın! 🎉', 'You unlocked everything! 🎉') };
  }
  function pickHTML(slot, it) {
    const lock = isLocked(it);
    const sel = draft[slot.key] === it.id;
    const face = slot.key === 'color' || slot.key === 'shirt'
      ? `<span class="ke-sw${slot.key === 'shirt' ? ' ke-sw-shirt' : ''}" style="background:${it.swatch}"></span>`
      : slot.key === 'scene'
        ? `<span class="ke-sw ke-sw-scene" style="background:${it.bg}">${it.emoji}</span>`
        : `<span class="ke-pick-emo">${it.emoji}</span>`;
    return `<button type="button" class="ke-pick ke-pick-tile${sel ? ' ke-sel' : ''}${lock ? ' ke-lock' : ''}" data-slot="${slot.key}" data-id="${it.id}" aria-pressed="${sel}" aria-label="${it.label}${lock ? ' 🔒' : ''}">${face}<span class="ke-pick-name">${lock ? lockLabel(it) : it.label}</span></button>`;
  }

  function draw() {
    const profiles = Profiles.all();
    const slots = AVATAR_SLOTS();
    const cur = slots.find((x) => x.key === tab) || slots[0];
    const nu = nextUnlockMsg();
    const tabs = slots.map((x) => `<button type="button" class="ke-av-tab${x.key === cur.key ? ' ke-sel' : ''}" data-tab="${x.key}" aria-pressed="${x.key === cur.key}"><span>${x.icon}</span>${x.label}</button>`).join('');
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
        <div class="ke-av-studio">
          <div class="ke-av-preview">
            ${avatarStageHTML(draft)}
            <button type="button" class="ke-av-dice" id="keAvRandom" aria-label="${L('Rastgele', 'Random')}" title="${L('Rastgele', 'Random')}">🎲</button>
          </div>
          <div class="ke-av-controls">
            <div><input id="keProfileName" class="ke-profile-name" maxlength="12" placeholder="${L('Adın ne?', 'Your name?')}" value="${escapeProfileText(draft.name)}" autocomplete="off" /></div>
            <div class="ke-av-tabs" role="toolbar">${tabs}</div>
            <div class="ke-av-grid">${cur.list.map((it) => pickHTML(cur, it)).join('')}</div>
            <div class="ke-av-unlock">
              <div class="ke-av-unlock-bar"><i style="width:${Math.round(nu.opened / nu.total * 100)}%"></i></div>
              <div id="keProfileMsg">${msg || `${L(`${nu.opened}/${nu.total} parça açık`, `${nu.opened}/${nu.total} pieces unlocked`)} · ⭐ ${stars} · 🔥 ${streakDays}<br>${nu.text}`}</div>
            </div>
          </div>
        </div>
        <div style="margin-top:8px;"><button type="button" class="ke-btn-primary" id="keProfileSave" style="font-size:17px !important;padding:14px 26px !important;">${first ? L('Başla! 🚀', "Let's go! 🚀") : L('Kaydet ✓', 'Save ✓')}</button></div>
        ${switcher}
        ${creating ? '' : (() => {
          const cls = Classroom.get();
          return cls.code
            ? `<div class="ke-pl-label" style="margin-top:16px;">${L('Sınıf', 'Class')}</div>
               <p style="font-size:13.5px;font-weight:800;color:var(--kb-chalk);margin:2px 0 4px;">🏫 ${escapeProfileText(cls.className || cls.code)}</p>
               <div id="keClassSyncInfo" style="font-size:11.5px;font-weight:700;color:var(--kb-chalk-dim);margin-bottom:8px;">${classSyncLabel(cls)}</div>
               <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">
                 <button type="button" class="ke-btn-primary" id="keClassSync" style="font-size:12px !important;padding:8px 14px !important;">🔄 ${L('Şimdi Eşitle', 'Sync Now')}</button>
                 <button type="button" class="ke-btn-secondary" id="keClassLeave" style="font-size:12px !important;padding:8px 14px !important;">${L('Sınıftan Ayrıl', 'Leave Class')}</button>
               </div>`
            : `<div class="ke-pl-label" style="margin-top:16px;">${L('Sınıf (öğretmenin varsa)', "Class (if your teacher has one)")}</div>
               <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:4px;">
                 <input id="keClassCode" class="ke-profile-name" style="width:140px;font-size:14px;padding:8px 10px;" maxlength="9" placeholder="${L('SINIF KODU', 'CLASS CODE')}" autocomplete="off" />
                 <button type="button" class="ke-btn-primary" id="keClassJoin" style="font-size:13px !important;padding:9px 16px !important;">${L('Katıl', 'Join')}</button>
               </div>
               <div id="keClassMsg" style="min-height:16px;font-size:11.5px;font-weight:700;color:var(--kb-chalk-dim);margin-top:4px;"></div>`;
        })()}
      </div>
      ${first || creating ? '' : bottomNavHTML('avatar')}`;
    wireBottomNav(host, container, api, toolId, categories);
    const nameEl = host.querySelector('#keProfileName');
    nameEl.addEventListener('input', () => { draft.name = nameEl.value; });
    host.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; msg = ''; draw(); }));
    host.querySelectorAll('[data-slot]').forEach((b) => b.addEventListener('click', () => {
      const slot = AVATAR_SLOTS().find((x) => x.key === b.dataset.slot);
      const it = avatarPart(slot.list, b.dataset.id);
      if (isLocked(it)) { msg = lockMsg(it.label, it); draw(); return; }
      draft[slot.key] = it.id; msg = ''; draw();
      const fig = host.querySelector('.ke-avatar-stage .ke-av');
      if (fig) fig.classList.add('ke-av-pop');
    }));
    host.querySelector('#keAvRandom').addEventListener('click', () => {
      AVATAR_SLOTS().forEach((slot) => {
        const open = slot.list.filter((it) => !isLocked(it));
        draft[slot.key] = open[Math.floor(Math.random() * open.length)].id;
      });
      msg = ''; draw();
      const fig = host.querySelector('.ke-avatar-stage .ke-av');
      if (fig) fig.classList.add('ke-av-pop');
    });
    host.querySelector('#keProfileSave').addEventListener('click', () => {
      draft.name = (draft.name || '').trim() || L('Arkadaşım', 'Friend');
      Profiles.save(draft);
      if (first) {
        const p0 = Journey.state(categories).list[0];
        if (p0) { playJourneyEpisode(container, api, toolId, categories, p0, 0); return; }
      }
      showSectionMenu(container, api, toolId, categories);
    });
    const back = host.querySelector('#keProfileBack');
    if (back) back.addEventListener('click', () => showSectionMenu(container, api, toolId, categories));
    const classJoinBtn = host.querySelector('#keClassJoin');
    if (classJoinBtn) classJoinBtn.addEventListener('click', async () => {
      const codeEl = host.querySelector('#keClassCode');
      const msgEl = host.querySelector('#keClassMsg');
      const code = (codeEl.value || '').trim();
      if (!code) return;
      classJoinBtn.disabled = true;
      msgEl.textContent = L('Katılıyor...', 'Joining...');
      try {
        await Classroom.join(code, draft.name || Profiles.active().name);
        await syncClassroom(true);
        draw();
      } catch (e) {
        classJoinBtn.disabled = false;
        msgEl.textContent = e.message === 'class-not-found'
          ? L('Bu kod bulunamadı, kontrol eder misin?', "That code wasn't found, can you check it?")
          : L('Bağlanılamadı, internetini kontrol et.', "Couldn't connect, check your internet.");
      }
    });
    const classSyncBtn = host.querySelector('#keClassSync');
    if (classSyncBtn) classSyncBtn.addEventListener('click', async () => {
      const info = host.querySelector('#keClassSyncInfo');
      classSyncBtn.disabled = true;
      info.textContent = L('Eşitleniyor...', 'Syncing...');
      const r = await syncClassroom(true);
      info.textContent = r && r.ok ? `✅ ${L('Öğretmenine gönderildi', 'Sent to your teacher')}` : `⚠️ ${L('Gönderilemedi, internet gelince tekrar denenecek', "Couldn't send — will retry when you're online")}`;
      classSyncBtn.disabled = false;
    });
    const classLeaveBtn = host.querySelector('#keClassLeave');
    if (classLeaveBtn) classLeaveBtn.addEventListener('click', () => { Classroom.leave(); draw(); });
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
  _journeyMode = false;
  Resume.save({ screen: 'grid', sectionId: section.id });
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
    ${bottomNavHTML(null)}
  `;
  wireBottomNav(host, container, api, toolId, categories);
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

// "StoryBook altındaki ppt'yi sisteme adapte edelim" - sesli okuma
// hikayesi. Kelime kategorilerinden bilinçli olarak ayrı: quiz/sınav
// yok, sadece sayfa sayfa resim + metin + sesli okuma, sonda küçük bir
// sözlük. Tamamlanınca Progress'e 'story_<id>' sahte-kategorisi olarak
// tek bir yıldız işleniyor (rozet/seri sistemiyle tutarlı kalsın diye).
async function showStoryList(container, api, toolId, categories) {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  _journeyMode = false;
  Resume.save({ screen: 'stories' });
  const host = container.querySelector('#keScreenHost');
  host.innerHTML = `
    <button class="ke-back-btn" id="keSectionsBack">${ICON_BACK} ${L('Bölümler', 'Sections')}</button>
    <div class="ke-landing-header">
      <h1 class="ke-title">${bubbleTitleHTML(L('Hikaye Zamanı', 'Story Time'))}</h1>
      <p class="ke-subtitle">${L('Aktapokus ile birlikte oku!', 'Read along with Aktapokus!')}</p>
    </div>
    <div class="ke-story-list" id="keStoryList"><div style="padding:40px;text-align:center;color:rgba(245,247,250,.6);">${L('Yükleniyor...', 'Loading...')}</div></div>
  `;
  host.querySelector('#keSectionsBack').addEventListener('click', () => showSectionMenu(container, api, toolId, categories));
  let stories;
  try {
    const r = await api.apiFetch(`/api/tools/${toolId}/stories`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    stories = await r.json();
  } catch (e) {
    host.querySelector('#keStoryList').innerHTML = `<div style="padding:40px;text-align:center;color:#FF4D4D;">${L('Hikayeler yüklenemedi', 'Could not load stories')}: ${e.message}</div>`;
    return;
  }
  const listEl = host.querySelector('#keStoryList');
  listEl.innerHTML = '';
  stories.forEach((s) => {
    const done = Progress.getCategory('story_' + s.id).completed.length > 0;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'ke-story-card';
    card.innerHTML = `
      <img class="ke-story-cover" src="${new URL(s.cover, ASSET_BASE_URL).href}" alt="" draggable="false" />
      <div class="ke-story-info">
        <div class="ke-story-eyebrow">${s.episode_label}${done ? ' · ⭐' : ''}</div>
        <div class="ke-story-title">${escapeProfileText(_lang === 'tr' ? s.title_tr : s.title)}</div>
        <div class="ke-story-meta">${_lang === 'tr' ? s.intro : s.intro}</div>
        <div class="ke-story-meta">${s.card_count} ${L('sayfa', 'pages')}</div>
      </div>
    `;
    card.addEventListener('click', () => showStoryReader(container, api, toolId, categories, s.id));
    listEl.appendChild(card);
  });
  pushBackState(() => showSectionMenu(container, api, toolId, categories));
}

async function showStoryReader(container, api, toolId, categories, storyId, initialPage) {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  const host = container.querySelector('#keScreenHost');
  host.innerHTML = `<div style="padding:60px;text-align:center;color:rgba(245,247,250,.6);">${L('Yükleniyor...', 'Loading...')}</div>`;
  let story;
  try {
    const r = await api.apiFetch(`/api/tools/${toolId}/stories/${storyId}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    story = await r.json();
  } catch (e) {
    host.innerHTML = `<div style="padding:40px;text-align:center;color:#FF4D4D;">${L('Hikaye yüklenemedi', 'Could not load story')}: ${e.message}</div>`;
    return;
  }

  const lastPage = story.cards.length;
  let page = Number.isInteger(initialPage) && initialPage >= -1 && initialPage <= lastPage ? initialPage : -1; // -1 = kapak/giriş, 0..N-1 = kartlar, N = sözlük

  // Kendi sesini kaydetme: BULUTA YÜKLEME YOK, bilinçli tercih (çocuk
  // sesi kaydı - KVKK/veli izni riski). Kayıt sadece tarayıcı belleğinde
  // tutulur, öğretmene ulaştırmak telefonun kendi paylaşım menüsü
  // (WhatsApp/e-posta/vb.) veya indirme üzerinden, elle yapılır.
  let mediaRecorder = null;
  let recordedChunks = [];
  let recording = false;
  let recordedBlobUrl = null;
  let recordingStream = null;

  function stopRecordingStream() {
    if (recordingStream) { recordingStream.getTracks().forEach((t) => t.stop()); recordingStream = null; }
  }

  async function toggleRecording() {
    if (recording) { mediaRecorder.stop(); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      alert(L('Bu cihazda ses kaydı desteklenmiyor.', 'Voice recording is not supported on this device.'));
      return;
    }
    try {
      recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      alert(L('Kayıt için mikrofon izni gerekiyor.', 'Microphone permission is needed to record.'));
      return;
    }
    recordedChunks = [];
    if (recordedBlobUrl) { URL.revokeObjectURL(recordedBlobUrl); recordedBlobUrl = null; }
    const mimeType = ['audio/mp4', 'audio/webm'].find((t) => MediaRecorder.isTypeSupported(t)) || '';
    mediaRecorder = mimeType ? new MediaRecorder(recordingStream, { mimeType }) : new MediaRecorder(recordingStream);
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = () => {
      stopRecordingStream();
      const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
      recordedBlobUrl = URL.createObjectURL(blob);
      recording = false;
      render();
    };
    mediaRecorder.start();
    recording = true;
    render();
  }

  async function shareRecording() {
    if (!recordedBlobUrl) return;
    const blob = await (await fetch(recordedBlobUrl)).blob();
    const ext = blob.type.includes('mp4') ? 'm4a' : 'webm';
    const file = new File([blob], `${story.id}_${(_lang === 'tr' ? story.title_tr : story.title).replace(/\s+/g, '_')}.${ext}`, { type: blob.type });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: story.title }); return; } catch (e) { /* kullanıcı iptal etti ya da desteklenmiyor - asagida indirmeye dus */ }
    }
    const a = document.createElement('a');
    a.href = recordedBlobUrl; a.download = file.name;
    document.body.appendChild(a); a.click(); a.remove();
  }

  const exit = () => {
    if (recording && mediaRecorder) { try { mediaRecorder.stop(); } catch (e) { /* no-op */ } }
    stopRecordingStream();
    if (recordedBlobUrl) { URL.revokeObjectURL(recordedBlobUrl); recordedBlobUrl = null; }
    if (_journeyMode) showJourney(container, api, toolId, categories);
    else showStoryList(container, api, toolId, categories);
  };

  // "Story kısmında kitap gibi yapabilir misin, tam bir kitap hissi yok" -
  // kapak (deri ciltli, sırtlı), krem kağıt sayfalar, genişte iki sayfalık
  // açılım (solda resim, sağda metin, ortada cilt gölgesi), telefonda tek
  // sayfa. Sayfa çevirme: eski sayfanın bir kopyası yeni sayfanın üstüne
  // konup ciltten dönerek kalkıyor, altından yeni sayfa görünüyor. Kaydırma
  // (swipe) ve sağ alttaki kıvrık köşe ile de çevrilir.
  let turning = false;
  const isWideBook = () => window.matchMedia('(min-width: 700px)').matches;

  function goTo(newPage) {
    if (turning || newPage === page || newPage < -1 || newPage > lastPage) return;
    const dir = newPage > page ? 1 : -1;
    const oldStage = container.querySelector('#keScreenHost .ke-book-stage');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let snap = null;
    if (oldStage && !reduce) {
      const book = oldStage.querySelector('.ke-book');
      const spread = isWideBook() && book.classList.contains('ke-book-spread');
      const src = spread ? book.querySelector(dir > 0 ? '.ke-page-right' : '.ke-page-left') : book;
      if (src) {
        const sr = oldStage.getBoundingClientRect();
        const r = src.getBoundingClientRect();
        const cs = getComputedStyle(src);
        snap = {
          el: src.cloneNode(true), left: r.left - sr.left, top: r.top - sr.top, w: r.width, h: r.height,
          style: { padding: cs.padding, borderRadius: cs.borderRadius, display: cs.display, flexDirection: cs.flexDirection, justifyContent: cs.justifyContent },
        };
      }
    }
    page = newPage;
    render();
    const stage = container.querySelector('#keScreenHost .ke-book-stage');
    if (!snap || !stage) return;
    const flip = snap.el;
    flip.removeAttribute('id');
    flip.querySelectorAll('[id]').forEach((e) => e.removeAttribute('id'));
    flip.classList.add('ke-flip', dir > 0 ? 'ke-flip-next' : 'ke-flip-prev');
    Object.assign(flip.style, snap.style, { left: `${snap.left}px`, top: `${snap.top}px`, width: `${snap.w}px`, height: `${snap.h}px` });
    stage.appendChild(flip);
    turning = true;
    const done = () => { if (flip.isConnected) flip.remove(); turning = false; };
    flip.addEventListener('animationend', done, { once: true });
    setTimeout(done, 1000);
  }

  function wireSwipe(stage) {
    let sx = null;
    let sy = null;
    stage.addEventListener('dragstart', (e) => e.preventDefault());
    stage.addEventListener('pointerdown', (e) => {
      sx = e.clientX;
      sy = e.clientY;
      if (e.pointerType === 'mouse' && !e.target.closest('button')) { try { stage.setPointerCapture(e.pointerId); } catch (err) { /* no-op */ } }
    });
    stage.addEventListener('pointerup', (e) => {
      if (sx === null) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      sx = null;
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      goTo(dx < 0 ? page + 1 : page - 1);
    });
    stage.addEventListener('pointercancel', () => { sx = null; });
  }

  const backBtnHTML = `<button class="ke-back-btn" id="keStoryExit">${ICON_BACK} ${L('Hikayeler', 'Stories')}</button>`;
  const navBtn = (id, dirLabel, arrow, disabled) => `<button type="button" class="ke-book-nav" id="${id}" aria-label="${dirLabel}" ${disabled ? 'disabled' : ''}>${arrow}</button>`;

  function render() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    Resume.save({ screen: 'story', storyId, page });
    const host2 = container.querySelector('#keScreenHost');
    const storyTitle = escapeProfileText(_lang === 'tr' ? story.title_tr : story.title);

    if (page === -1) {
      host2.innerHTML = `
        ${backBtnHTML}
        <div class="ke-book-stage">
          <div class="ke-book ke-book-cover" id="keBook" role="button" tabindex="0" aria-label="${L('Kitabı aç', 'Open the book')}">
            <div class="ke-cover-frame"><img src="${new URL(story.cover, ASSET_BASE_URL).href}" alt="" draggable="false" /></div>
            <div class="ke-cover-plate">
              <span class="ke-cover-ep">${escapeProfileText(story.episode_label)}</span>
              <span class="ke-cover-title">${storyTitle}</span>
              <span class="ke-cover-author">Aktapokus Kids English</span>
            </div>
          </div>
        </div>
        <p class="ke-book-intro">${escapeProfileText(story.intro)}</p>
        <div class="ke-book-controls ke-book-controls-center">
          <button type="button" class="ke-btn-primary" id="keStoryStart">📖 ${L('Kitabı Aç', 'Open the Book')}</button>
        </div>
      `;
      host2.querySelector('#keStoryExit').addEventListener('click', exit);
      host2.querySelector('#keStoryStart').addEventListener('click', () => goTo(0));
      const cover = host2.querySelector('#keBook');
      cover.addEventListener('click', () => goTo(0));
      cover.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo(0); } });
      wireSwipe(host2.querySelector('.ke-book-stage'));
      return;
    }

    if (page === lastPage) {
      host2.innerHTML = `
        ${backBtnHTML}
        <div id="keConfettiHost"></div>
        <div class="ke-book-stage">
          <div class="ke-book ke-book-single" id="keBook">
            <div class="ke-page">
              <div class="ke-page-inner">
                <div class="ke-chapter-orn">❦</div>
                <h2 class="ke-story-card-title">${L('Yeni Kelimeler', 'New Words')}</h2>
                <p class="ke-gloss-sub">${L('Bu hikayede öğrendiğin kelimeler:', 'Words you learned in this story:')}</p>
                <div class="ke-story-glossary">
                  ${story.glossary.map((g) => `<div class="ke-story-glossary-item"><b>${escapeProfileText(g.word)}</b><span>${escapeProfileText(g.tr)}</span></div>`).join('')}
                </div>
                <div class="ke-book-end">✦ ${L('Son', 'The End')} ✦</div>
              </div>
            </div>
          </div>
        </div>
        <div class="ke-book-controls">
          ${navBtn('keStoryPrev', L('Önceki sayfa', 'Previous page'), '◀', false)}
          <div class="ke-book-actions">
            <button type="button" class="ke-btn-primary" id="keStoryFinish">${L('Bitir', 'Finish')} ⭐</button>
          </div>
          <span class="ke-book-nav-spacer"></span>
        </div>
      `;
      host2.querySelector('#keStoryExit').addEventListener('click', exit);
      host2.querySelector('#keStoryPrev').addEventListener('click', () => goTo(page - 1));
      host2.querySelector('#keStoryFinish').addEventListener('click', () => {
        Progress.markComplete('story_' + story.id, 0);
        launchConfetti(host2);
        setTimeout(exit, 900);
      });
      wireSwipe(host2.querySelector('.ke-book-stage'));
      return;
    }

    const card = story.cards[page];
    host2.innerHTML = `
      ${backBtnHTML}
      <div class="ke-book-stage">
        <div class="ke-book ke-book-spread" id="keBook">
          <div class="ke-page ke-page-left">
            <div class="ke-page-illo"><img src="${new URL(card.image, ASSET_BASE_URL).href}" alt="" draggable="false" /></div>
          </div>
          <div class="ke-page ke-page-right">
            <div class="ke-page-inner">
              <div class="ke-chapter-orn">❦</div>
              <h2 class="ke-story-card-title">${escapeProfileText(card.title)}</h2>
              <div class="ke-story-text" id="keStoryText">${buildStoryLineHTML(card.text).html}</div>
            </div>
            <div class="ke-page-num">${page + 1} / ${story.cards.length}</div>
            <button type="button" class="ke-page-curl" id="keStoryCurl" aria-label="${L('Sonraki sayfa', 'Next page')}"></button>
          </div>
        </div>
      </div>
      <div class="ke-book-controls">
        ${navBtn('keStoryPrev', L('Önceki sayfa', 'Previous page'), '◀', false)}
        <div class="ke-book-actions">
          <button type="button" class="ke-btn-secondary" id="keStorySpeak">${ICON_SPEAKER} ${L('Sesli Oku', 'Read Aloud')}</button>
          <button type="button" class="ke-btn-secondary${recording ? ' ke-recording' : ''}" id="keStoryRecordBtn">${recording ? '⏹ ' + L('Kaydı Durdur', 'Stop Recording') : '🎙️ ' + L('Kendi Sesinle Oku', 'Record Yourself')}</button>
        </div>
        ${navBtn('keStoryNext', L('Sonraki sayfa', 'Next page'), '▶', false)}
      </div>
      ${recordedBlobUrl ? `
        <div class="ke-story-record-bar">
          <audio controls src="${recordedBlobUrl}" style="width:100%;"></audio>
          <button type="button" class="ke-btn-secondary" id="keStoryRecordShare" style="margin-top:8px;">📤 ${L('Paylaş / İndir', 'Share / Download')}</button>
          <p class="ke-story-meta" style="margin-top:4px;">${L('Kayıt sadece bu cihazda — hiçbir yere yüklenmiyor.', 'Recording stays on this device only — nothing is uploaded.')}</p>
        </div>
      ` : ''}
    `;
    host2.querySelector('#keStoryExit').addEventListener('click', exit);
    host2.querySelector('#keStoryPrev').addEventListener('click', () => goTo(page - 1));
    host2.querySelector('#keStoryNext').addEventListener('click', () => goTo(page + 1));
    host2.querySelector('#keStoryCurl').addEventListener('click', () => goTo(page + 1));
    host2.querySelector('#keStorySpeak').addEventListener('click', (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      speakStoryText(card.text, host2, () => { btn.disabled = false; });
    });
    host2.querySelector('#keStoryRecordBtn').addEventListener('click', toggleRecording);
    const shareBtn = host2.querySelector('#keStoryRecordShare');
    if (shareBtn) shareBtn.addEventListener('click', shareRecording);
    wireSwipe(host2.querySelector('.ke-book-stage'));
  }

  render();
  pushBackState(exit);
}

async function enterCategory(container, api, toolId, categories, categoryId, episodeIndex) {
  Resume.save({ screen: 'episode', sectionId: _currentSection, categoryId, episodeIndex, journey: _journeyMode });
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
    <button class="ke-back-btn" id="keBackBtn">${ICON_BACK} ${_journeyMode ? '🚀 ' + L('Macera', 'Adventure') : L('Kategoriler', 'Categories')}</button>
    <details class="ke-map-details" id="keMapDetails"${isNarrowLayout() ? '' : ' open'}>
      <summary class="ke-map-summary">🗺️ ${L('Bölüm', 'Episode')} <span id="keMapSummaryNum">${episode.episode_index + 1}</span> / <span id="keMapSummaryTotal">${episode.episode_count}</span></summary>
      <div class="ke-map" id="keMap"></div>
    </details>
    <h1 class="ke-title">${bubbleTitleHTML(L('Aktapokus ile ', 'Aktapokus: ') + titleTr)}</h1>
    <p class="ke-subtitle" id="keSubtitle">${L('Bölüm', 'Episode')} ${episode.episode_index + 1} / ${episode.episode_count} — ${L('Kelime Keşfi', 'Word Discovery')}</p>
    ${episode.isReview ? '' : phaseBarHTML()}

    <div class="ke-scene-wrap" style="--cc-tint:${theme.tint};--cc-c:${theme.c}">
      <div class="ke-scene" id="keScene">
        <div class="ke-stars"></div>
        ${motif ? `<div class="ke-scene-motif ke-motif-${motif}"></div>` : ''}
        <div class="ke-bubble" id="keBubble">${L('👆 Resimlere dokun, dinle!', '👆 Tap a picture and listen!')}</div>
        <button type="button" class="ke-help-btn" id="keHelpBtn" aria-label="${L('Yardım', 'Help')}">ⓘ</button>
        <div class="ke-progress-chip" id="keProgress">0 / 0 ${L("kelime", "words")}</div>
        <div class="ke-word-popup" id="keWordPopup"></div>
        <div id="keObjects"></div>
        <div class="ke-mascot-wrap" id="keMascot">${mascotSvg()}</div>
        <div class="ke-quiz" id="keQuiz">
          <button class="ke-quiz-replay" id="keQuizReplay" title="${L('Tekrar dinle', 'Listen again')}" aria-label="${L('Tekrar dinle', 'Listen again')}">${ICON_SPEAKER}</button>
          <div class="ke-bubble ke-quiz-bubble" id="keQuizBubble">${L('Şimdi öğrendiklerini deneyelim!', "Let's try what you learned!")}</div>
          <div class="ke-quiz-progress" id="keQuizProgress">${L('Soru 1 / 5', 'Question 1 / 5')}</div>
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
          <div class="ke-bubble ke-sentence-bubble" id="keSentenceBubble">${L('🧩 Kelimeleri sırayla diz!', '🧩 Put the words in order!')}</div>
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
      <p class="ke-hint">👆🔊 ${L('Dokun → dinle. Tekrar dokun → tekrar dinle.', 'Tap → listen. Tap again → listen again.')}</p>
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
  renderMap(host, episode.episode_index, episode.episode_count, jumpToEpisode, completedSet, journeyEpisodeGate(categories, episode));
  ['#keBubble', '#keQuizBubble', '#keSentenceBubble'].forEach((sel) => addSpeakButton(host.querySelector(sel)));
  wirePhaseBar(host);

  const leaveEpisode = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (container._keActiveRecognition) {
      try { container._keActiveRecognition.abort(); } catch (e) { /* no-op */ }
      container._keActiveRecognition = null;
    }
    leaveEpisodeList(container, api, toolId, categories);
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
    bubbleEl.textContent = message || L('👆 Resimlere dokun, dinle!', '👆 Tap a picture and listen!');
  }

  function goToNextEpisode() {
    const nextIndex = episode.episode_index + 1;
    if (nextIndex < episode.episode_count) {
      enterCategory(container, api, toolId, categories, episode.category_id, nextIndex);
    } else {
      leaveEpisodeList(container, api, toolId, categories);
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
    progressEl.textContent = `${total} / ${total} ${L('kelime', 'words')}`;
  }

  host.querySelector('#keJumpDiscovery').addEventListener('click', () => {
    hideAllOverlays();
    resetDiscovery();
    setEpisodePhase(host, 'discover');
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
    <button class="ke-back-btn" id="keBackBtn">${ICON_BACK} ${_journeyMode ? '🚀 ' + L('Macera', 'Adventure') : L('Kategoriler', 'Categories')}</button>
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
  renderMap(host, episode.episode_index, episode.episode_count, jumpToEpisode, completedSet, journeyEpisodeGate(categories, episode));
  ['#keBubble', '#keQuizBubble', '#keSentenceBubble'].forEach((sel) => addSpeakButton(host.querySelector(sel)));
  wirePhaseBar(host);

  const leaveEpisode = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    leaveEpisodeList(container, api, toolId, categories);
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
      leaveEpisodeList(container, api, toolId, categories);
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
    // Android Chrome'da tam ekrandan CIKMAK (butonla degil, kategori
    // gecisi/OS UI kaynakli olsun) bazen kendiliginden bir popstate'i
    // TETIKLIYOR - "word secerken kendi kendine ilk ekrana donuyor,
    // sanki full screenden cikip basa donuyor" geri bildirimi tam
    // olarak bu. O sahte popstate'i asagida _popstateHandler'da
    // ELIYORUZ - gercek kullanici "geri" niyeti degil, tam ekrandan
    // cikisin bir yan etkisi.
    if (!isFs) _fullscreenExitAt = performance.now();
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
// Yolculuk modunda gezegen ici bolumler sirayla - kutuphanede (ya da
// tekrar turunda) kapi yok, null donuyor.
function journeyEpisodeGate(categories, episode) {
  if (!_journeyMode || episode.isReview) return null;
  const p = Journey.state(categories).list.find((x) => x.id === episode.category_id);
  return p ? (i) => Journey.episodeOpen(p, i) : null;
}

function renderMap(host, currentIndex, count, onJump, completedSet, isOpen) {
  const mapRow = host.querySelector('#keMap');
  mapRow.innerHTML = '';
  const done = completedSet || new Set();
  for (let i = 0; i < count; i++) {
    const node = document.createElement('div');
    node.className = 'ke-node';
    const dot = document.createElement('button');
    const isDone = i !== currentIndex && done.has(i);
    const locked = isOpen && i !== currentIndex && !isOpen(i);
    let cls = 'ke-dot';
    if (i === currentIndex) cls += ' current';
    else if (isDone) cls += ' done';
    else if (locked) cls += ' locked';
    dot.className = cls;
    dot.type = 'button';
    dot.title = locked ? L('Önce önceki bölümü bitir', 'Finish the previous episode first') : L(`Bölüm ${i + 1}'e git`, `Go to episode ${i + 1}`);
    dot.textContent = i === currentIndex ? '★' : (isDone ? '✓' : locked ? '🔒' : String(i + 1));
    dot.addEventListener('click', () => {
      if (locked) { dot.classList.add('ke-shake'); setTimeout(() => dot.classList.remove('ke-shake'), 400); return; }
      onJump(i);
    });
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
// Telefonda soru turlarinda maskot gizleniyor (yer darligi) - tepki
// bu yuzden maskotun ustunde degil, sahnenin kosesinde kucuk bir avatar
// balonu olarak cikiyor; her ekran boyutunda gorunur.
function mascotReact(mascotEl, good) {
  const scene = mascotEl && mascotEl.closest ? mascotEl.closest('.ke-scene') : null;
  if (!scene) return;
  const old = scene.querySelector('.ke-react');
  if (old) old.remove();
  const goods = _lang === 'tr' ? ['Harika! 🎉', 'Süper! ⭐', 'Aferin! 👏', 'Çok iyi! 😄'] : ['Great! 🎉', 'Super! ⭐', 'Well done! 👏', 'Awesome! 😄'];
  const bads = _lang === 'tr' ? ['Neredeyse! 💛', 'Olsun, devam! 💪', 'Birlikte öğreniyoruz 🙂'] : ['Almost! 💛', 'Keep going! 💪', "We're learning together 🙂"];
  const list = good ? goods : bads;
  const el = document.createElement('div');
  el.className = 'ke-react' + (good ? ' good' : ' bad');
  el.innerHTML = `${avatarCircleHTML(Profiles.active(), 'ke-react-av')}<span>${list[Math.floor(Math.random() * list.length)]}</span>`;
  scene.appendChild(el);
  setTimeout(() => el.classList.add('out'), 1100);
  setTimeout(() => el.remove(), 1500);
}

// "Quiz kismina gectim, geri donebilmek icin bir tus olmali" - bolum
// icindeki asamalar gorunur bir cubukta; ulasilan onceki bir asamaya
// dokununca oraya donuluyor (ileri atlama yok - ileri gitmek oynayarak).
const EPISODE_PHASES = [
  ['discover', '👀', () => L('Keşif', 'Discover'), '#keJumpDiscovery'],
  ['quiz', '❓', () => L('Soru', 'Quiz'), '#keJumpQuiz'],
  ['speak', '🎤', () => L('Konuş', 'Speak'), '#keJumpSpeak'],
  ['sentence', '🧩', () => L('Cümle', 'Sentence'), '#keJumpSentence'],
  ['letters', '🔤', () => L('Harf', 'Letters'), '#keJumpLetters'],
];
function phaseBarHTML() {
  return `<div class="ke-phasebar" id="kePhaseBar" data-max="0" role="navigation" aria-label="${L('Bölüm aşamaları', 'Episode steps')}">${EPISODE_PHASES.map(([id, ic, lb], i) => `<button type="button" class="ke-phase${i === 0 ? ' cur' : ''}" data-phase="${id}" data-i="${i}" ${i === 0 ? '' : 'disabled'}><span>${ic}</span>${lb()}</button>`).join('')}</div>`;
}
function setEpisodePhase(host, id) {
  const bar = host && host.querySelector('#kePhaseBar');
  if (!bar) return;
  const i = EPISODE_PHASES.findIndex((x) => x[0] === id);
  if (i < 0) return;
  const max = Math.max(Number(bar.dataset.max) || 0, i);
  bar.dataset.max = String(max);
  bar.querySelectorAll('.ke-phase').forEach((b) => {
    const bi = Number(b.dataset.i);
    b.classList.toggle('cur', bi === i);
    b.classList.toggle('done', bi < i || (bi <= max && bi !== i));
    b.disabled = bi > max || bi === i;
  });
}
function wirePhaseBar(host) {
  const bar = host.querySelector('#kePhaseBar');
  if (!bar) return;
  bar.querySelectorAll('.ke-phase').forEach((b) => b.addEventListener('click', () => {
    const ph = EPISODE_PHASES.find((x) => x[0] === b.dataset.phase);
    const jump = ph && host.querySelector(ph[3]);
    if (jump) jump.click();
  }));
}

function celebrateBounce(mascotEl) {
  mascotReact(mascotEl, true);
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

// Story sayfasının her satırı <p>, her kelimesi <span data-local> (satır
// içi karakter ofseti). speakStoryText her satırı AYRI bir konuşma olarak
// okuyor; onboundary'nin charIndex'i o satırın metnine göre geldiği için
// data-local ile birebir eşleşiyor.
function buildStoryLineHTML(lines) {
  const html = lines.map((line) => {
    let offset = 0;
    const lineHtml = line.split(/(\s+)/).map((tok) => {
      if (tok === '') return '';
      if (/^\s+$/.test(tok)) { offset += tok.length; return tok; }
      const start = offset;
      offset += tok.length;
      return `<span class="ke-story-word" data-local="${start}">${escapeProfileText(tok)}</span>`;
    }).join('');
    return `<p>${lineHtml}</p>`;
  }).join('');
  return { html };
}

// Hikaye sayfasını sesli okurken kelime kelime vurgulama (karaoke tarzı).
// onboundary masaüstünde güvenilir ama Android Chrome'da (APK/TWA dahil)
// HİÇ tetiklenmiyor. Tüm sayfayı tek seferde okuyup tahmini zamanlamayla
// vurgulamak sayfa boyunca kayma biriktiriyordu ("kitapta highlight
// senkronizasyonu" geri bildirimi). Şimdi her satır ayrı bir konuşma:
// her satırın onstart'ı vurguyu o satırın İLK kelimesine yeniden
// hizalıyor, tahmin sadece kısa bir satır içinde yürüyor - kayma satır
// başında sıfırlanıyor. Gerçek boundary olayı gelirse tahmin susuyor.
const STORY_MS_PER_CHAR = 80;
const STORY_WORD_GAP_MS = 110;
// Cihazın TTS sesi tahminden hızlı/yavaş olabilir - her satır bitince
// gerçek süre / tahmini süre oranıyla tempo katsayısını düzeltiyoruz ve
// sonraki sayfalar için saklıyoruz (masaüstü testte ilk tahmin ~%30 hızlıydı).
const STORY_PACE_KEY = 'ke_tts_pace_v1';
const StoryPace = {
  get() { try { const v = parseFloat(window.localStorage.getItem(STORY_PACE_KEY)); return v > 0.5 && v < 2.5 ? v : 1.25; } catch (e) { return 1.25; } },
  learn(ratio) {
    const next = Math.max(0.6, Math.min(2.2, this.get() * 0.5 + this.get() * ratio * 0.5));
    try { window.localStorage.setItem(STORY_PACE_KEY, String(next)); } catch (e) { /* yok say */ }
  },
};
function storyWordMs(w) {
  let ms = w.length * STORY_MS_PER_CHAR + STORY_WORD_GAP_MS;
  if (/[.!?]["”']?$/.test(w)) ms += 300;
  else if (/[,;:]$/.test(w)) ms += 160;
  return ms;
}
function speakStoryText(lines, host, onDone) {
  if (!('speechSynthesis' in window)) { notifySoundProblem(L('bu tarayıcı sesli okumayı desteklemiyor', 'this browser cannot read aloud')); if (onDone) onDone(); return; }
  const synth = window.speechSynthesis;
  const paras = [...host.querySelectorAll('.ke-story-text p')]
    .map((p) => [...p.querySelectorAll('.ke-story-word')].map((el) => ({ el, start: Number(el.dataset.local) })));
  let current = null;
  let done = false;
  let gotBoundary = false;
  let fallbackTimer = null;
  let lineIdx = -1;
  const pace = StoryPace.get();
  const clearHighlight = () => { if (current) { current.el.classList.remove('ke-story-word-active'); current = null; } };
  const highlight = (s) => { if (s && s !== current) { clearHighlight(); s.el.classList.add('ke-story-word-active'); current = s; } };
  const stopFallback = () => { if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; } };
  const startFallback = (words) => {
    stopFallback();
    if (gotBoundary || done) return;
    let i = 0;
    const step = () => {
      fallbackTimer = null;
      if (done || gotBoundary || i >= words.length) return;
      const s = words[i++];
      highlight(s);
      fallbackTimer = setTimeout(step, storyWordMs(s.el.textContent) * pace);
    };
    step();
  };
  const finish = () => {
    if (done) return;
    done = true;
    stopFallback();
    clearHighlight();
    if (onDone) onDone();
  };
  const speakLine = (i) => {
    if (done) return;
    if (i >= lines.length) { finish(); return; }
    lineIdx = i;
    const words = paras[i] || [];
    let started = false;
    const utter = new SpeechSynthesisUtterance(lines[i]);
    utter.lang = 'en-US';
    utter.rate = 0.78;
    utter.pitch = 0.85;
    utter.volume = 1;
    const voice = pickMaleVoice();
    if (voice && voice.lang && voice.lang.toLowerCase().startsWith('en')) utter.voice = voice;
    window._keLastUtter = utter;
    let startedAt = 0;
    utter.onstart = () => { started = true; startedAt = performance.now(); startFallback(words); };
    utter.onboundary = (e) => {
      if (e.name && e.name !== 'word') return;
      gotBoundary = true;
      stopFallback();
      let match = null;
      for (const s of words) { if (s.start <= e.charIndex) match = s; else break; }
      highlight(match);
    };
    utter.onend = () => {
      if (lineIdx !== i) return;
      if (!gotBoundary && startedAt && words.length >= 3) {
        const est = words.reduce((sum, s) => sum + storyWordMs(s.el.textContent), 0);
        const actual = performance.now() - startedAt;
        if (est > 0 && actual > 300) StoryPace.learn(actual / (est * pace));
      }
      stopFallback();
      speakLine(i + 1);
    };
    utter.onerror = (e) => {
      const err = e && e.error;
      if (err && err !== 'canceled' && err !== 'interrupted') notifySoundProblem(err);
      finish();
    };
    synth.speak(utter);
    // Bazı Android TTS motorlarında onstart gecikiyor/gelmiyor - yedek.
    setTimeout(() => { if (!started && lineIdx === i && !done) startFallback(words); }, 700);
  };
  if (synth.speaking || synth.pending) { synth.cancel(); setTimeout(() => speakLine(0), 90); } else { speakLine(0); }
  const totalWords = lines.join(' ').split(/\s+/).length;
  setTimeout(finish, Math.max(8000, totalWords * 900 + lines.length * 1500));
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
  setEpisodePhase(host, 'quiz');
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
    quizProgressEl.textContent = L(`Soru ${qIndex + 1} / ${order.length}`, `Question ${qIndex + 1} / ${order.length}`);
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
      mascotReact(mascotEl, false);
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
  setEpisodePhase(host, 'speak');
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
  setEpisodePhase(host, 'letters');
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
        mascotReact(mascotEl, false);
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
  setEpisodePhase(host, 'sentence');
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
        mascotReact(mascotEl, false);
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

  // Rol yapma: karsilikli konusma balonlari (solda Aktapokus, sagda cocuk).
  // Cevap kelime kartlariyla ya da (tarayici destekliyorsa) sesle verilir.
  const me = Profiles.active();
  const chat = document.createElement('div');
  chat.className = 'ke-chat';
  bubbleEl.parentNode.insertBefore(chat, bubbleEl.nextSibling);
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = document.createElement('button');
  micBtn.type = 'button';
  micBtn.className = 'ke-btn-secondary ke-chat-mic';
  micBtn.textContent = `🎤 ${L('Söyleyerek cevapla', 'Answer by speaking')}`;
  if (SR) chat.parentNode.insertBefore(micBtn, chat.nextSibling);
  function addLine(who, text) {
    const row = document.createElement('div');
    row.className = 'ke-chat-row ' + who;
    row.innerHTML = who === 'bot'
      ? `<span class="ke-chat-who">🐙</span><div class="ke-chat-b">${escapeProfileText(text)}</div>`
      : `<div class="ke-chat-b">${escapeProfileText(text)}</div>${avatarCircleHTML(me, 'ke-chat-av')}`;
    if (who === 'bot') {
      const say = document.createElement('button');
      say.type = 'button'; say.className = 'ke-say-btn'; say.textContent = '🔊';
      say.addEventListener('click', () => speakWord(text, mascotEl));
      row.querySelector('.ke-chat-b').appendChild(say);
    }
    chat.appendChild(row);
    while (chat.children.length > 4) chat.firstChild.remove();
    chat.scrollTop = chat.scrollHeight;
  }
  const norm = (t) => String(t).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);

  function renderTurn() {
    if (idx >= turns.length) {
      mascotEl.classList.remove('ke-mascot-compact');
      setMascotPose(host, 'idle');
      chat.remove(); micBtn.remove();
      onFinished({ correct: correctFirstTry, total: turns.length });
      return;
    }
    const turn = turns[idx];
    const tokens = turn.a.split(' ');
    let firstTry = true;
    progressEl.textContent = `${L('Konuşma', 'Conversation')} ${idx + 1} / ${turns.length}`;
    bubbleEl.textContent = L('Sıra sende! Cevabı diz ya da söyle 👇', 'Your turn! Build or say the answer 👇');
    addLine('bot', turn.q);
    speakWord(turn.q, mascotEl);
    micBtn.disabled = false;
    micBtn.onclick = () => {
      let rec;
      try { rec = new SR(); } catch (e) { return; }
      rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 3;
      micBtn.disabled = true;
      micBtn.textContent = `🎙️ ${L('Dinliyorum…', 'Listening…')}`;
      container._keActiveRecognition = rec;
      const done = () => { micBtn.disabled = false; micBtn.textContent = `🎤 ${L('Söyleyerek cevapla', 'Answer by speaking')}`; };
      rec.onresult = (e) => {
        const target = norm(turn.a);
        let best = 0;
        for (let k = 0; k < e.results[0].length; k++) {
          const heard = new Set(norm(e.results[0][k].transcript));
          best = Math.max(best, target.filter((w) => heard.has(w)).length / target.length);
        }
        if (best >= 0.7) {
          // Kartlari dogru sirayla doldurup ayni "dogru" akisini calistir
          slotEls0().forEach((sl, i) => { sl.textContent = tokens[i]; sl.dataset.origIndex = String(i); sl.classList.add('ke-filled'); });
          checkBtn.disabled = false;
          checkBtn.onclick();
        } else {
          bubbleEl.textContent = L(`Tam anlayamadım 🙂 Tekrar söyle ya da kartları diz.`, `I didn't quite catch that 🙂 Say it again or use the cards.`);
          mascotReact(mascotEl, false);
        }
      };
      rec.onerror = done; rec.onend = done;
      try { rec.start(); } catch (e) { done(); }
    };

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
        addLine('me', turn.a);
        micBtn.disabled = true;
        celebrateBounce(mascotEl);
        speakWord(turn.a, mascotEl);
        setTimeout(() => { idx++; renderTurn(); }, 1300);
      } else if (++wrongAttempts >= 2) {
        firstTry = false;
        checkBtn.disabled = true;
        slotEls.forEach((sl, i) => { sl.textContent = tokens[i]; sl.classList.remove('ke-filled'); sl.classList.add('ke-reveal'); });
        bubbleEl.textContent = L(`Doğru cevap: ${turn.a} 💡`, `The correct answer: ${turn.a} 💡`);
        addLine('me', turn.a);
        micBtn.disabled = true;
        mascotReact(mascotEl, false);
        speakWord(turn.a, mascotEl);
        setTimeout(() => { idx++; renderTurn(); }, 3200);
      } else {
        firstTry = false;
        bubbleEl.textContent = L('Bu değil, tekrar dene! 🔄', 'Not quite — try again! 🔄');
        checkBtn.disabled = true;
        slotEls.forEach((s) => s.classList.add('ke-shake'));
        setTimeout(() => {
          slotEls.forEach((s) => s.classList.remove('ke-shake'));
          bubbleEl.textContent = L('Sıra sende! Cevabı diz ya da söyle 👇', 'Your turn! Build or say the answer 👇');
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
// ============================================================
// ÖDÜL OYUNLARI (v2) - "oyunları düzelt, çok amatör oldu, profesyonel ve
// ilgi çekici hale getir" geri bildirimi üzerine baştan yazıldı.
// Ortak altyapı: HiDPI canvas (telefonda bulanık değil), WebAudio ile
// kod-içi üretilen ses efektleri (dosya/ağ yok), sessize alma, duraklatma,
// uygulama arka plana gidince otomatik duraklama.
// ============================================================
const GAME_MUTE_KEY = 'ke_game_muted_v1';
const GameSfx = {
  ctx: null,
  muted: (() => { try { return window.localStorage.getItem(GAME_MUTE_KEY) === '1'; } catch (e) { return false; } })(),
  ensure() {
    if (this.muted) return null;
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) { return null; }
    return this.ctx;
  },
  setMuted(m) {
    this.muted = m;
    try { window.localStorage.setItem(GAME_MUTE_KEY, m ? '1' : '0'); } catch (e) { /* yok say */ }
    if (m && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  },
  tone(freq, dur, opts) {
    const { type = 'sine', vol = 0.16, slide = 0, delay = 0 } = opts || {};
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.03);
  },
  noise(dur, vol) {
    const ctx = this.ensure();
    if (!ctx) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ctx.createBufferSource();
    s.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(ctx.destination);
    s.start();
  },
  shoot() { this.tone(760, 0.09, { type: 'triangle', vol: 0.07, slide: -420 }); },
  pop() { this.tone(480, 0.12, { type: 'triangle', vol: 0.14, slide: 520 }); },
  good() { this.tone(660, 0.1, { vol: 0.15 }); this.tone(990, 0.18, { vol: 0.15, delay: 0.09 }); },
  bad() { this.tone(240, 0.22, { type: 'sawtooth', vol: 0.06, slide: -100 }); },
  pickup() { this.tone(560, 0.07, { type: 'triangle', vol: 0.12 }); this.tone(840, 0.1, { type: 'triangle', vol: 0.12, delay: 0.06 }); },
  crash() { this.noise(0.35, 0.3); this.tone(130, 0.3, { type: 'sawtooth', vol: 0.08, slide: -70 }); },
  slide() { this.tone(320, 0.06, { type: 'triangle', vol: 0.08, slide: 90 }); },
  countdown(final) { this.tone(final ? 880 : 440, final ? 0.32 : 0.14, { type: 'square', vol: 0.06 }); },
  win() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.24, { type: 'triangle', vol: 0.14, delay: i * 0.11 })); },
  lose() { [392, 330, 262].forEach((f, i) => this.tone(f, 0.26, { type: 'triangle', vol: 0.12, delay: i * 0.16 })); },
};

function gameStarsHTML(n) {
  return [1, 2, 3].map((i) => `<span class="ke-gstar${i <= n ? ' on' : ''}" style="animation-delay:${0.15 * i}s">★</span>`).join('');
}
function fmtGameTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function wireMuteButton(btn) {
  const paint = () => {
    btn.textContent = GameSfx.muted ? '🔇' : '🔊';
    btn.setAttribute('aria-label', GameSfx.muted ? L('Sesi aç', 'Unmute') : L('Sesi kapat', 'Mute'));
  };
  paint();
  btn.addEventListener('click', () => { GameSfx.setMuted(!GameSfx.muted); paint(); if (!GameSfx.muted) GameSfx.pickup(); });
}

const PUZZLE_BEST_KEY = 'ke_puzzle_best_v1';
const PuzzleBest = {
  key() { return `${PUZZLE_BEST_KEY}_${Profiles.active().id}`; },
  get() { try { return JSON.parse(window.localStorage.getItem(this.key())) || {}; } catch (e) { return {}; } },
  submit(level, stars, moves, secs) {
    const d = this.get();
    const cur = d[level];
    const better = !cur || stars > cur.stars || (stars === cur.stars && moves < cur.moves);
    if (better) {
      d[level] = { stars, moves, secs };
      try { window.localStorage.setItem(this.key(), JSON.stringify(d)); } catch (e) { /* yok say */ }
    }
    return better;
  },
};

function showGamePicker(container, onExit) {
  const shell = container.querySelector('.ke-shell');
  const overlay = document.createElement('div');
  overlay.className = 'ke-river-overlay-msg ke-game-picker';
  overlay.style.position = 'absolute';
  overlay.style.zIndex = '90';
  const pb = PuzzleBest.get();
  const puzzleStars = Math.max(pb.easy ? pb.easy.stars : 0, pb.hard ? pb.hard.stars : 0);
  overlay.innerHTML = `
    <div class="ke-game-panel ke-picker-panel">
      <div class="ke-panel-title">🎮 ${L('Ödül Oyunu Seç', 'Pick a Reward Game')}</div>
      <p class="ke-panel-sub">🎟️ ${L(`${GameTokens.get()} oyun hakkın var`, `You have ${GameTokens.get()} game ticket${GameTokens.get() === 1 ? '' : 's'}`)}</p>
      <div class="ke-picker-grid">
        <button type="button" class="ke-game-card ke-game-card-river" id="kePickRiver">
          <span class="ke-game-card-art">🚤</span>
          <span class="ke-game-card-name">${L('Nehir Macerası', 'River Adventure')}</span>
          <span class="ke-game-card-desc">${L('Kelimeyi duy, doğru balonu vur!', 'Hear the word, pop the right balloon!')}</span>
          <span class="ke-game-card-best">🏆 ${RiverHighScore.get()}</span>
        </button>
        <button type="button" class="ke-game-card ke-game-card-puzzle" id="kePickPuzzle">
          <span class="ke-game-card-art">🧩</span>
          <span class="ke-game-card-name">${L('Resimli Yap-Boz', 'Picture Puzzle')}</span>
          <span class="ke-game-card-desc">${L('Parçaları kaydır, resmi tamamla!', 'Slide the pieces, finish the picture!')}</span>
          <span class="ke-game-card-best">${puzzleStars ? '★'.repeat(puzzleStars) + '☆'.repeat(3 - puzzleStars) : L('Yeni!', 'New!')}</span>
        </button>
      </div>
      <button type="button" class="ke-game-btn ke-game-btn-ghost" id="kePickCancel">${L('Vazgeç', 'Cancel')}</button>
    </div>
  `;
  shell.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('ke-show'));
  const close = () => { overlay.classList.remove('ke-show'); setTimeout(() => overlay.remove(), 250); };
  overlay.querySelector('#kePickRiver').addEventListener('click', () => { close(); startRiverGame(container, onExit); });
  overlay.querySelector('#kePickPuzzle').addEventListener('click', () => { close(); startSlidePuzzle(container, onExit); });
  overlay.querySelector('#kePickCancel').addEventListener('click', close);
}

// "Github'ta ranking sayfasi yapalim... kullanicilar isterse buraya kendi
// skorlarini gondersin" - Supabase'e (bkz. Leaderboard nesnesi) baglı,
// sadece River Adventure skoru icin, herkese acik bir siralama. Hicbir
// otomatik gonderim yok - sadece oyun bitince "Skoru Gonder" butonuna
// basarsa profildeki isim + skoru gonderiyor.
function showLeaderboard(container, onExit) {
  const shell = container.querySelector('.ke-shell');
  const overlay = document.createElement('div');
  overlay.className = 'ke-river-overlay-msg ke-leaderboard';
  overlay.style.position = 'absolute'; overlay.style.zIndex = '90';
  overlay.innerHTML = `
    <div class="ke-river-msg-card ke-lb-card">
      <h2>🏆 ${L('Sıralama', 'Leaderboard')}</h2>
      <p style="margin:-4px 0 10px;font-size:12.5px;color:#8a7a55;font-weight:700;">${L('Nehir Macerası — en iyi skorlar', 'River Adventure — top scores')}</p>
      <div class="ke-lb-list" id="keLbList"><div class="ke-lb-loading">⏳ ${L('Yükleniyor...', 'Loading...')}</div></div>
      <button type="button" class="ke-btn-secondary" id="keLbClose" style="margin-top:14px;">${L('Kapat', 'Close')}</button>
    </div>
  `;
  shell.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('ke-show'));
  const close = () => { overlay.classList.remove('ke-show'); setTimeout(() => overlay.remove(), 250); if (onExit) onExit(); };
  overlay.querySelector('#keLbClose').addEventListener('click', close);
  const listEl = overlay.querySelector('#keLbList');
  Leaderboard.top('river', 20).then((rows) => {
    if (!rows.length) { listEl.innerHTML = `<div class="ke-lb-empty">${L('Henüz skor yok. İlk sen ol! 🚀', 'No scores yet. Be the first! 🚀')}</div>`; return; }
    const medals = ['🥇', '🥈', '🥉'];
    listEl.innerHTML = rows.map((r, i) => `
      <div class="ke-lb-row">
        <span class="ke-lb-rank">${medals[i] || (i + 1)}</span>
        <span class="ke-lb-name">${escapeProfileText(r.name)}</span>
        <span class="ke-lb-score">${r.score} ⭐</span>
      </div>`).join('');
  }).catch(() => {
    listEl.innerHTML = `<div class="ke-lb-empty">${L('Sıralama yüklenemedi. İnternetini kontrol et.', "Couldn't load the leaderboard. Check your connection.")}</div>`;
  });
}

// Resimli kayan yap-boz: resim ve zorluk (3x3 / 4x4) seçimi, süre + hamle,
// "bak" (👁 basılı tut) ile tam resmi görme, parça numarası ipucu, çözülünce
// parçalar birleşip resim parlıyor, hamle sayısına göre 1-3 yıldız.
const SLIDE_PUZZLE_IMAGES = [
  'mascot/mascot_idle.png',
  'photos/dog__animals_pixabay7.jpg',
  'photos/cat__animals_pixabay7.jpg',
  'photos/lion__animals_manual.jpg',
  'photos/butterfly__animals_pixabay7.jpg',
];
const PUZZLE_LEVELS = {
  easy: { n: 3, gap: 4, shuffle: 120, star3: 45, star2: 90 },
  hard: { n: 4, gap: 3, shuffle: 260, star3: 150, star2: 280 },
};
function startSlidePuzzle(container, onExit) {
  if (!GameTokens.spend()) { onExit(); return; }
  refreshGameBadge(container);

  const shell = container.querySelector('.ke-shell');
  const overlay = document.createElement('div');
  overlay.className = 'ke-puzzle-game';
  const thumbs = SLIDE_PUZZLE_IMAGES.map((src, i) => `<button type="button" class="ke-puzzle-thumb${i === 0 ? ' ke-sel' : ''}" data-i="${i}" style="background-image:url('${new URL(src, ASSET_BASE_URL).href}')" aria-label="${L('Resim', 'Picture')} ${i + 1}"></button>`).join('');
  overlay.innerHTML = `
    <div class="ke-game-hud">
      <div class="ke-hud-group">
        <div class="ke-hud-pill">🔢 <span id="kePuzzleMoves">0</span></div>
        <div class="ke-hud-pill">⏱ <span id="kePuzzleTime">0:00</span></div>
      </div>
      <div class="ke-hud-group">
        <button type="button" class="ke-hud-btn" id="kePuzzleNums" aria-label="${L('Numaraları göster', 'Show numbers')}">#</button>
        <button type="button" class="ke-hud-btn" id="kePuzzlePeek" aria-label="${L('Resmin tamamına bak (basılı tut)', 'Peek at the picture (hold)')}">👁</button>
        <button type="button" class="ke-hud-btn" id="kePuzzleMute"></button>
        <button type="button" class="ke-hud-btn" id="kePuzzleClose" aria-label="${L('Kapat', 'Close')}">✕</button>
      </div>
    </div>
    <div class="ke-puzzle-board-wrap"><div class="ke-puzzle-board" id="kePuzzleBoard"></div></div>
    <div class="ke-river-overlay-msg" id="kePuzzleStartMsg">
      <div class="ke-game-panel">
        <div class="ke-panel-title">🧩 ${L('Resimli Yap-Boz', 'Picture Puzzle')}</div>
        <p class="ke-panel-sub">${L('Bir resim seç', 'Pick a picture')}</p>
        <div class="ke-puzzle-thumbs" id="kePuzzleThumbs">${thumbs}</div>
        <div class="ke-seg" id="kePuzzleLevel">
          <button type="button" class="ke-seg-btn ke-sel" data-level="easy">${L('Kolay', 'Easy')} · 3×3</button>
          <button type="button" class="ke-seg-btn" data-level="hard">${L('Zor', 'Hard')} · 4×4</button>
        </div>
        <p class="ke-panel-tip">${L('Boşluğun yanındaki parçaya dokun ya da kaydır. Takılırsan 👁 düğmesini basılı tutup resmin tamamına bak.', 'Tap or drag a piece next to the gap. Stuck? Hold 👁 to peek at the whole picture.')}</p>
        <button type="button" class="ke-game-btn" id="kePuzzleStartBtn">${L('Başla', 'Start')} ▶</button>
      </div>
    </div>
    <div class="ke-river-overlay-msg" id="kePuzzleWinMsg" style="display:none;">
      <div id="keConfettiHost"></div>
      <div class="ke-game-panel">
        <div class="ke-panel-title">🎉 ${L('Harika! Tamamladın!', 'Amazing! You solved it!')}</div>
        <div class="ke-gstars" id="kePuzzleStars"></div>
        <div class="ke-gstat-row">
          <div class="ke-gstat"><b id="kePuzzleFinalMoves">0</b><span>${L('hamle', 'moves')}</span></div>
          <div class="ke-gstat"><b id="kePuzzleFinalTime">0:00</b><span>${L('süre', 'time')}</span></div>
        </div>
        <p class="ke-panel-note" id="kePuzzleBestNote"></p>
        <div class="ke-panel-actions">
          <button type="button" class="ke-game-btn ke-game-btn-ghost" id="kePuzzleExitBtn">${L('Çık', 'Exit')}</button>
          <button type="button" class="ke-game-btn" id="kePuzzleAgainBtn">${L('Yeni Oyun', 'Play Again')} 🧩</button>
        </div>
      </div>
    </div>
  `;
  shell.appendChild(overlay);
  const $ = (id) => overlay.querySelector(`#${id}`);

  const boardWrap = overlay.querySelector('.ke-puzzle-board-wrap');
  const boardEl = $('kePuzzleBoard');
  let level = 'easy';
  let imgIndex = 0;
  let N = 3;
  let gap = 4;
  let boardSize = 0;
  let tileSize = 0;
  let moves = 0;
  let solved = true;
  let cells = [];
  let tileEls = [];
  let blankIndex = 0;
  let fullEl = null;
  let startedAt = 0;
  let elapsedBefore = 0;
  let timerId = null;
  let dragState = null;

  function elapsed() { return elapsedBefore + (startedAt ? (performance.now() - startedAt) / 1000 : 0); }
  function startTimer() {
    if (startedAt || solved) return;
    startedAt = performance.now();
    if (!timerId) timerId = setInterval(() => { $('kePuzzleTime').textContent = fmtGameTime(elapsed()); }, 250);
  }
  function stopTimer() {
    if (startedAt) { elapsedBefore += (performance.now() - startedAt) / 1000; startedAt = 0; }
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  function resize() {
    if (!tileEls.length) return;
    // İçerik kutusu (padding hariç) - yoksa tahta kabından taşıp sağ sütunu
    // kesiyor, kare de olmuyordu.
    const r = boardWrap.getBoundingClientRect();
    const cs = getComputedStyle(boardWrap);
    const w = r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const h = r.height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    boardSize = Math.floor(Math.min(w, h, 560));
    tileSize = boardSize / N;
    boardEl.style.width = `${boardSize}px`;
    boardEl.style.height = `${boardSize}px`;
    sizeTiles();
    tileEls.forEach((el, orig) => { if (el) layoutTile(orig); });
  }
  window.addEventListener('resize', resize);

  function origRowCol(orig) { return { r: Math.floor(orig / N), c: orig % N }; }
  function cellIndexOf(orig) { return cells.indexOf(orig); }
  function layoutTile(orig, offX, offY) {
    const el = tileEls[orig];
    if (!el) return;
    const idx = cellIndexOf(orig);
    const row = Math.floor(idx / N);
    const col = idx % N;
    el.style.transform = `translate(${col * tileSize + gap / 2 + (offX || 0)}px, ${row * tileSize + gap / 2 + (offY || 0)}px)`;
  }
  function sizeTiles() {
    tileEls.forEach((el, orig) => {
      if (!el) return;
      const { r, c } = origRowCol(orig);
      el.style.width = `${tileSize - gap}px`;
      el.style.height = `${tileSize - gap}px`;
      el.style.backgroundSize = `${boardSize}px ${boardSize}px`;
      el.style.backgroundPosition = `-${c * tileSize + gap / 2}px -${r * tileSize + gap / 2}px`;
    });
  }

  function buildBoard() {
    const cfg = PUZZLE_LEVELS[level];
    N = cfg.n;
    gap = cfg.gap;
    const src = new URL(SLIDE_PUZZLE_IMAGES[imgIndex], ASSET_BASE_URL).href;
    boardEl.innerHTML = `<div class="ke-puzzle-full" style="background-image:url('${src}')"></div>`;
    boardEl.classList.remove('ke-solved');
    fullEl = boardEl.querySelector('.ke-puzzle-full');
    cells = Array.from({ length: N * N }, (_, i) => i);
    blankIndex = N * N - 1;
    tileEls = [];
    for (let orig = 0; orig < N * N - 1; orig++) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'ke-puzzle-tile';
      el.style.backgroundImage = `url('${src}')`;
      el.innerHTML = `<span class="ke-tile-num">${orig + 1}</span>`;
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); beginDrag(e, orig); });
      el.addEventListener('pointermove', onDragMove);
      el.addEventListener('pointerup', endDrag);
      el.addEventListener('pointercancel', endDrag);
      boardEl.appendChild(el);
      tileEls.push(el);
    }
    tileEls.push(null);
    resize();
    shuffleBoard(cfg.shuffle);
  }

  function neighborsOfBlank() {
    const br = Math.floor(blankIndex / N);
    const bc = blankIndex % N;
    const out = [];
    if (br > 0) out.push(blankIndex - N);
    if (br < N - 1) out.push(blankIndex + N);
    if (bc > 0) out.push(blankIndex - 1);
    if (bc < N - 1) out.push(blankIndex + 1);
    return out;
  }
  function swapCells(a, b) { const t = cells[a]; cells[a] = cells[b]; cells[b] = t; }
  function isSolved() { return cells.every((v, i) => v === i); }
  // Rastgele yürüyüş, bir önceki hamleyi geri almadan - her karışım
  // çözülebilir kalıyor ve gerçekten dağılıyor.
  function shuffleBoard(steps) {
    let prev = -1;
    do {
      for (let i = 0; i < steps; i++) {
        const opts = neighborsOfBlank().filter((x) => x !== prev);
        const pick = opts[Math.floor(Math.random() * opts.length)];
        prev = blankIndex;
        swapCells(pick, blankIndex);
        blankIndex = pick;
      }
    } while (isSolved());
    tileEls.forEach((el, orig) => { if (el) layoutTile(orig); });
    moves = 0;
    solved = false;
    elapsedBefore = 0;
    startedAt = 0;
    $('kePuzzleMoves').textContent = '0';
    $('kePuzzleTime').textContent = '0:00';
  }

  function beginDrag(e, orig) {
    if (solved) return;
    const idx = cellIndexOf(orig);
    if (!neighborsOfBlank().includes(idx)) {
      tileEls[orig].classList.remove('ke-nope');
      void tileEls[orig].offsetWidth;
      tileEls[orig].classList.add('ke-nope');
      return;
    }
    const br = Math.floor(blankIndex / N);
    const bc = blankIndex % N;
    const tr = Math.floor(idx / N);
    const tc = idx % N;
    const axis = tr === br ? 'x' : 'y';
    const dir = axis === 'x' ? (bc > tc ? 1 : -1) : (br > tr ? 1 : -1);
    dragState = { orig, axis, dir, startX: e.clientX, startY: e.clientY, totalMoved: 0, maxAlong: 0 };
    try { tileEls[orig].setPointerCapture(e.pointerId); } catch (err) { /* yok say */ }
  }
  function onDragMove(e) {
    if (!dragState) return;
    const el = tileEls[dragState.orig];
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    const along = Math.max(0, Math.min(tileSize, (dragState.axis === 'x' ? dx : dy) * dragState.dir));
    dragState.totalMoved = Math.max(dragState.totalMoved, Math.hypot(dx, dy));
    dragState.maxAlong = Math.max(dragState.maxAlong, along);
    el.style.transition = 'none';
    layoutTile(dragState.orig, dragState.axis === 'x' ? along * dragState.dir : 0, dragState.axis === 'y' ? along * dragState.dir : 0);
  }
  function endDrag() {
    if (!dragState) return;
    const { orig, totalMoved, maxAlong } = dragState;
    tileEls[orig].style.transition = '';
    dragState = null;
    if (totalMoved < 8 || maxAlong > tileSize * 0.35) tryMove(orig);
    else layoutTile(orig);
  }

  function tryMove(orig) {
    if (solved) return;
    const idx = cellIndexOf(orig);
    if (!neighborsOfBlank().includes(idx)) return;
    startTimer();
    swapCells(idx, blankIndex);
    blankIndex = idx;
    moves++;
    $('kePuzzleMoves').textContent = moves;
    layoutTile(orig);
    GameSfx.slide();
    if (isSolved()) { solved = true; stopTimer(); setTimeout(onSolved, 220); }
  }

  function onSolved() {
    const cfg = PUZZLE_LEVELS[level];
    const secs = elapsed();
    const stars = moves <= cfg.star3 ? 3 : moves <= cfg.star2 ? 2 : 1;
    // Parçalar arasındaki boşluk kapanıp tek resim olarak birleşiyor.
    gap = 0;
    sizeTiles();
    tileEls.forEach((el, orig) => { if (el) layoutTile(orig); });
    boardEl.classList.add('ke-solved');
    GameSfx.win();
    const isBest = PuzzleBest.submit(level, stars, moves, secs);
    setTimeout(() => {
      $('kePuzzleStars').innerHTML = gameStarsHTML(stars);
      $('kePuzzleFinalMoves').textContent = moves;
      $('kePuzzleFinalTime').textContent = fmtGameTime(secs);
      $('kePuzzleBestNote').textContent = isBest
        ? `🏆 ${L('Bu seviyede yeni rekorun!', 'New personal best for this level!')}`
        : (stars < 3 ? L(`3 yıldız için ${cfg.star3} hamleden az dene!`, `Try under ${cfg.star3} moves for 3 stars!`) : '');
      $('kePuzzleAgainBtn').style.display = GameTokens.get() > 0 ? '' : 'none';
      $('kePuzzleWinMsg').style.display = 'flex';
      launchConfetti(overlay);
    }, 1100);
  }

  function showSetup() {
    $('kePuzzleWinMsg').style.display = 'none';
    $('kePuzzleStartMsg').style.display = 'flex';
  }
  function startRun() {
    $('kePuzzleStartMsg').style.display = 'none';
    $('kePuzzleWinMsg').style.display = 'none';
    stopTimer();
    buildBoard();
  }

  overlay.querySelector('#kePuzzleThumbs').addEventListener('click', (e) => {
    const b = e.target.closest('.ke-puzzle-thumb');
    if (!b) return;
    imgIndex = Number(b.dataset.i);
    overlay.querySelectorAll('.ke-puzzle-thumb').forEach((x) => x.classList.toggle('ke-sel', x === b));
    GameSfx.pickup();
  });
  overlay.querySelector('#kePuzzleLevel').addEventListener('click', (e) => {
    const b = e.target.closest('.ke-seg-btn');
    if (!b) return;
    level = b.dataset.level;
    overlay.querySelectorAll('.ke-seg-btn').forEach((x) => x.classList.toggle('ke-sel', x === b));
  });
  const numsBtn = $('kePuzzleNums');
  numsBtn.addEventListener('click', () => {
    const on = boardEl.classList.toggle('ke-show-nums');
    numsBtn.classList.toggle('ke-on', on);
  });
  const peekBtn = $('kePuzzlePeek');
  const peek = (on) => { if (fullEl && !solved) fullEl.classList.toggle('ke-show', on); };
  peekBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); peek(true); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => peekBtn.addEventListener(t, () => peek(false)));
  wireMuteButton($('kePuzzleMute'));

  const onVis = () => { if (document.hidden) stopTimer(); };
  document.addEventListener('visibilitychange', onVis);
  function cleanup() {
    stopTimer();
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVis);
    overlay.remove();
  }
  $('kePuzzleStartBtn').addEventListener('click', startRun);
  $('kePuzzleClose').addEventListener('click', () => { cleanup(); onExit(); });
  $('kePuzzleExitBtn').addEventListener('click', () => { cleanup(); onExit(); });
  $('kePuzzleAgainBtn').addEventListener('click', () => {
    if (!GameTokens.spend()) return;
    refreshGameBadge(container);
    showSetup();
  });
}

// Nehir Macerası: Aktapokus teknesiyle nehirde ilerliyor. Oyunun kalbi bir
// İNGİLİZCE KELİME GÖREVİ: üstte bir resim (🍎) çıkıyor ve kelime sesli
// okunuyor; çocuk balonların üzerindeki yazılardan doğru kelimeyi bulup
// mürekkeple (ahtapot!) vuruyor. Arka arkaya doğrular kombo çarpanı
// veriyor. Kayalar can götürüyor (3 can), yakıt sürekli azalıyor.
const RIVER_WORDS = [
  ['apple', '🍎'], ['banana', '🍌'], ['cat', '🐱'], ['dog', '🐶'], ['fish', '🐟'], ['bird', '🐦'],
  ['sun', '☀️'], ['moon', '🌙'], ['star', '⭐'], ['tree', '🌳'], ['flower', '🌸'], ['car', '🚗'],
  ['bus', '🚌'], ['ball', '⚽'], ['book', '📖'], ['house', '🏠'], ['cake', '🎂'], ['milk', '🥛'],
  ['egg', '🥚'], ['hat', '🎩'], ['frog', '🐸'], ['duck', '🦆'], ['lion', '🦁'], ['bear', '🐻'],
  ['pig', '🐷'], ['cow', '🐮'], ['boat', '⛵'], ['key', '🔑'], ['bread', '🍞'], ['pizza', '🍕'],
];
const BALLOON_COLORS = ['#FF6B6B', '#FFA94D', '#4DABF7', '#9775FA', '#38D9A9', '#F783AC'];
const RIVER_MAX_HEARTS = 3;

function startRiverGame(container, onExit) {
  if (!GameTokens.spend()) { onExit(); return; }
  refreshGameBadge(container);

  const shell = container.querySelector('.ke-shell');
  const overlay = document.createElement('div');
  overlay.className = 'ke-river-game';
  const best = RiverHighScore.get();
  overlay.innerHTML = `
    <canvas id="keRiverCanvas"></canvas>
    <div class="ke-game-hud ke-river-hud2">
      <div class="ke-hud-group">
        <div class="ke-hud-pill ke-hud-score">⭐ <span id="keRiverScoreEl">0</span></div>
        <div class="ke-hud-pill ke-hud-hearts" id="keRiverHearts"></div>
      </div>
      <div class="ke-hud-fuel" id="keRiverFuel"><span>⛽</span><div class="ke-hud-fuel-track"><div class="ke-hud-fuel-bar" id="keRiverFuelBar"></div></div></div>
      <div class="ke-hud-group">
        <button type="button" class="ke-hud-btn" id="keRiverMute"></button>
        <button type="button" class="ke-hud-btn" id="keRiverPause" aria-label="${L('Duraklat', 'Pause')}">⏸</button>
        <button type="button" class="ke-hud-btn" id="keRiverClose" aria-label="${L('Kapat', 'Close')}">✕</button>
      </div>
    </div>
    <div class="ke-river-target" id="keRiverTarget" hidden>
      <span class="ke-target-label">🎯</span>
      <span class="ke-target-emoji" id="keRiverTargetEmoji"></span>
      <span class="ke-target-word" id="keRiverTargetWord"></span>
      <button type="button" class="ke-target-say" id="keRiverSay" aria-label="${L('Kelimeyi dinle', 'Hear the word')}">🔊</button>
      <span class="ke-target-combo" id="keRiverCombo"></span>
    </div>
    <div class="ke-river-countdown" id="keRiverCountdown"></div>
    <div class="ke-river-touch-zones">
      <div class="ke-river-zone ke-river-zone-steer" id="keRiverSteerZone"><span class="ke-river-zone-hint">👆 ${L('SÜRÜKLE', 'DRAG')} ↔</span></div>
      <div class="ke-river-zone ke-river-zone-fire" id="keRiverFireZone"><span class="ke-river-zone-hint">💧 ${L('DOKUN: ATEŞ', 'TAP: SHOOT')}</span></div>
    </div>
    <div class="ke-river-overlay-msg" id="keRiverStartMsg">
      <div class="ke-game-panel">
        <div class="ke-panel-title">🚤 ${L('Nehir Macerası', 'River Adventure')}</div>
        <div class="ke-howto">
          <div class="ke-howto-row"><span class="ke-howto-ico">🎯</span><span>${L('Üstteki resmin <b>İngilizcesini</b> balonlarda bul ve vur!', 'Find the <b>English word</b> for the picture on the balloons and pop it!')}</span></div>
          <div class="ke-howto-row"><span class="ke-howto-ico">👆</span><span>${L('Sol yarıda sürükle: tekneyi yönet', 'Drag on the left half: steer')}</span></div>
          <div class="ke-howto-row"><span class="ke-howto-ico">💧</span><span>${L('Sağ yarıya dokun: mürekkep fırlat', 'Tap the right half: shoot ink')}</span></div>
          <div class="ke-howto-row"><span class="ke-howto-ico">⛽</span><span>${L('Yakıt topla, kayalara çarpma — 3 canın var', 'Grab fuel, dodge rocks — you have 3 lives')}</span></div>
        </div>
        <p class="ke-panel-note">${best > 0 ? `🏆 ${L('Rekorun', 'Your best')}: <b>${best}</b>` : ''}<span class="ke-kbd-hint"> · ${L('Klavye: ← → ve Boşluk', 'Keyboard: ← → and Space')}</span></p>
        <button type="button" class="ke-game-btn" id="keRiverStartBtn">${L('Başla', 'Start')} ▶</button>
      </div>
    </div>
    <div class="ke-river-overlay-msg" id="keRiverPauseMsg" style="display:none;">
      <div class="ke-game-panel">
        <div class="ke-panel-title">⏸ ${L('Duraklatıldı', 'Paused')}</div>
        <div class="ke-panel-actions">
          <button type="button" class="ke-game-btn ke-game-btn-ghost" id="keRiverQuitBtn">${L('Çık', 'Quit')}</button>
          <button type="button" class="ke-game-btn" id="keRiverResumeBtn">${L('Devam', 'Resume')} ▶</button>
        </div>
      </div>
    </div>
    <div class="ke-river-overlay-msg" id="keRiverOverMsg" style="display:none;">
      <div id="keConfettiHost"></div>
      <div class="ke-game-panel">
        <div class="ke-panel-title" id="keRiverOverTitle"></div>
        <div class="ke-gstars" id="keRiverStars"></div>
        <div class="ke-big-score" id="keRiverFinalScore">0</div>
        <div class="ke-gstat-row">
          <div class="ke-gstat"><b id="keRiverStatWords">0</b><span>${L('kelime', 'words')}</span></div>
          <div class="ke-gstat"><b id="keRiverStatDist">0</b><span>${L('mesafe', 'distance')}</span></div>
          <div class="ke-gstat"><b id="keRiverStatCoins">0</b><span>${L('altın', 'coins')}</span></div>
        </div>
        <div class="ke-word-chips" id="keRiverWordChips"></div>
        <div class="ke-lb-submit-row">
          <button type="button" class="ke-game-btn ke-game-btn-small" id="keRiverSubmitBtn">🏆 ${L('Sıralamaya Gönder', 'Submit to Leaderboard')}</button>
        </div>
        <div class="ke-submit-status" id="keRiverSubmitStatus"></div>
        <div class="ke-panel-actions">
          <button type="button" class="ke-game-btn ke-game-btn-ghost" id="keRiverExitBtn">${L('Çık', 'Exit')}</button>
          <button type="button" class="ke-game-btn" id="keRiverAgainBtn">${L('Tekrar Oyna', 'Play Again')} 🎮</button>
        </div>
      </div>
    </div>
  `;
  shell.appendChild(overlay);
  const $ = (id) => overlay.querySelector(`#${id}`);

  const canvas = $('keRiverCanvas');
  const ctx = canvas.getContext('2d');
  const CHECK_GAP = 40;

  // --- durum ---
  let W = 1;
  let H = 1;
  const keys = { left: false, right: false };
  let player = { x: 0, y: 0, r: 18, angle: 0, prevX: 0 };
  let terrain = [];
  let items = [];
  let bullets = [];
  let particles = [];
  let floaters = [];
  let decor = [];
  let score = 0;
  let fuel = 100;
  let hearts = RIVER_MAX_HEARTS;
  let invuln = 0;
  let scrollSpeed = 125;
  let spawnAcc = 0;
  let shootCooldown = 0;
  let shakeTime = 0;
  let waterPhase = 0;
  let scrollTotal = 0;
  let distance = 0;
  let coinsGot = 0;
  let running = false;
  let paused = false;
  let lastTime = null;
  let rafId = null;
  let target = null;
  let lastTargetWord = null;
  let wrongOnTarget = 0;
  let targetSince = 0;
  let combo = 1;
  let balloonsSinceTarget = 0;
  let wordsHit = [];
  let lastFinalScore = 0;
  let driftMode = 'drift';
  let driftLeft = 0;
  let driftDir = 1;
  let driftPhase = 0;
  let countdownTimer = null;

  const boatImg = new Image();
  let boatImgReady = false;
  boatImg.onload = () => { boatImgReady = true; if (!running) draw(); };
  boatImg.src = new URL('mascot/mascot_idle.png', ASSET_BASE_URL).href;

  const grassPattern = (() => {
    const c = document.createElement('canvas');
    c.width = 96; c.height = 96;
    const g = c.getContext('2d');
    g.fillStyle = '#4f9a52';
    g.fillRect(0, 0, 96, 96);
    for (let i = 0; i < 300; i++) {
      g.fillStyle = Math.random() < 0.5 ? 'rgba(28,84,40,.32)' : 'rgba(150,210,110,.28)';
      g.fillRect(Math.random() * 96, Math.random() * 96, 2, 3 + Math.random() * 4);
    }
    return ctx.createPattern(c, 'repeat');
  })();

  function resize() {
    const r = overlay.getBoundingClientRect();
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!running) draw();
  }

  function nextTerrainStep(prevCx, prevHalf) {
    if (driftLeft <= 0) {
      const roll = Math.random();
      if (roll < 0.35) { driftMode = 'drift'; driftLeft = 6 + Math.floor(Math.random() * 8); }
      else if (roll < 0.6) { driftMode = 'curve'; driftLeft = 10 + Math.floor(Math.random() * 10); driftDir = Math.random() < 0.5 ? -1 : 1; driftPhase = 0; }
      else if (roll < 0.8) { driftMode = 'narrow'; driftLeft = 8 + Math.floor(Math.random() * 8); }
      else { driftMode = 'wide'; driftLeft = 8 + Math.floor(Math.random() * 8); }
    }
    driftLeft--;
    let cx = prevCx;
    const maxHalf = Math.min(165, W * 0.36);
    let targetHalf = maxHalf;
    if (driftMode === 'drift') cx += (Math.random() - 0.5) * 40;
    else if (driftMode === 'curve') { driftPhase += 0.35; cx += driftDir * (14 + Math.sin(driftPhase) * 9); }
    else if (driftMode === 'narrow') { targetHalf = Math.max(80, maxHalf * 0.62); cx += (Math.random() - 0.5) * 22; }
    else cx += (Math.random() - 0.5) * 28;
    const half = Math.max(80, Math.min(maxHalf, prevHalf + (targetHalf - prevHalf) * 0.15));
    cx = Math.max(half + 24, Math.min(W - half - 24, cx));
    return { cx, half };
  }
  function makeDecor(x, y) {
    const r = Math.random();
    const kind = r < 0.45 ? 'tree' : r < 0.75 ? 'bush' : r < 0.9 ? 'flowers' : 'stone';
    return { x, y, kind, s: 0.75 + Math.random() * 0.55, v: Math.random() };
  }
  function addDecorAt(y, cx, half) {
    const leftW = cx - half - 18;
    const rightX = cx + half + 18;
    if (leftW > 24 && Math.random() < 0.6) decor.push(makeDecor(6 + Math.random() * (leftW - 12), y));
    if (W - rightX > 24 && Math.random() < 0.6) decor.push(makeDecor(rightX + 6 + Math.random() * (W - rightX - 12), y));
  }
  function rockVerts() {
    const n = 8;
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const k = 0.78 + Math.random() * 0.3;
      return [Math.cos(a) * k, Math.sin(a) * k];
    });
  }

  function resetGame() {
    player = { x: W / 2, y: H - 110, r: 18, angle: 0, prevX: W / 2 };
    terrain = [];
    decor = [];
    driftMode = 'drift'; driftLeft = 0; driftDir = 1; driftPhase = 0;
    let cx = W / 2;
    let half = Math.min(165, W * 0.36);
    for (let y = -CHECK_GAP * 3; y < H + CHECK_GAP * 3; y += CHECK_GAP) {
      const step = nextTerrainStep(cx, half);
      cx = step.cx; half = step.half;
      terrain.push({ y, cx, half });
      addDecorAt(y, cx, half);
    }
    // İlk ekranda nehir teknenin altında ortalı olsun.
    terrain.forEach((t) => { t.cx = Math.max(t.half + 24, Math.min(W - t.half - 24, t.cx * 0.3 + (W / 2) * 0.7)); });
    items = []; bullets = []; particles = []; floaters = [];
    score = 0; fuel = 100; hearts = RIVER_MAX_HEARTS; invuln = 0;
    scrollSpeed = 125; spawnAcc = 0; shootCooldown = 0; shakeTime = 0;
    scrollTotal = 0; distance = 0; coinsGot = 0;
    target = null; lastTargetWord = null; combo = 1; wordsHit = [];
    renderHearts();
    updateCombo();
    updateHud();
  }

  function channelAt(y) {
    let a = terrain[0];
    let b = terrain[terrain.length - 1];
    for (let i = 0; i < terrain.length - 1; i++) {
      if (terrain[i].y <= y && terrain[i + 1].y >= y) { a = terrain[i]; b = terrain[i + 1]; break; }
    }
    const t = b.y === a.y ? 0 : (y - a.y) / (b.y - a.y);
    return { cx: a.cx + (b.cx - a.cx) * t, half: a.half + (b.half - a.half) * t };
  }

  // --- kelime görevi ---
  function sayTarget() {
    if (!target || GameSfx.muted) return;
    speakWord(target[0], { classList: { add() {}, remove() {} } });
  }
  function setTarget() {
    let w;
    do { w = RIVER_WORDS[Math.floor(Math.random() * RIVER_WORDS.length)]; } while (w[0] === lastTargetWord);
    target = w;
    lastTargetWord = w[0];
    wrongOnTarget = 0;
    targetSince = 0;
    balloonsSinceTarget = 2;
    $('keRiverTargetEmoji').textContent = w[1];
    const wordEl = $('keRiverTargetWord');
    wordEl.textContent = w[0];
    wordEl.classList.remove('ke-show');
    const box = $('keRiverTarget');
    box.hidden = false;
    box.classList.remove('ke-bump');
    void box.offsetWidth;
    box.classList.add('ke-bump');
    sayTarget();
  }
  function flashTarget(kind) {
    const box = $('keRiverTarget');
    box.classList.remove('ke-ok', 'ke-bad');
    void box.offsetWidth;
    box.classList.add(kind === 'ok' ? 'ke-ok' : 'ke-bad');
  }
  function updateCombo() {
    const el = $('keRiverCombo');
    el.textContent = combo > 1 ? `x${combo}` : '';
    el.classList.toggle('ke-show', combo > 1);
  }
  function renderHearts() {
    $('keRiverHearts').innerHTML = Array.from({ length: RIVER_MAX_HEARTS }, (_, i) => `<span class="${i < hearts ? '' : 'ke-lost'}">❤️</span>`).join('');
  }
  function updateHud() {
    $('keRiverScoreEl').textContent = Math.floor(score);
    const bar = $('keRiverFuelBar');
    bar.style.width = `${Math.max(0, fuel)}%`;
    $('keRiverFuel').classList.toggle('ke-low', fuel < 25);
  }

  // --- nesneler ---
  function spawnBalloon(x, y) {
    let word;
    if (target && (balloonsSinceTarget >= 3 || Math.random() < 0.42)) { word = target; balloonsSinceTarget = 0; }
    else {
      do { word = RIVER_WORDS[Math.floor(Math.random() * RIVER_WORDS.length)]; } while (target && word[0] === target[0]);
      balloonsSinceTarget++;
    }
    ctx.font = '800 15px Fredoka, "Baloo 2", sans-serif';
    const r = Math.max(25, ctx.measureText(word[0]).width / 2 + 12);
    const ch = channelAt(y);
    const bx = Math.max(ch.cx - ch.half + r + 6, Math.min(ch.cx + ch.half - r - 6, x));
    items.push({ type: 'balloon', x: bx, y, word, r, color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)], bob: Math.random() * 6, alive: true });
  }
  function spawnItem() {
    const y = -36;
    const ch = channelAt(y);
    const x = ch.cx + (Math.random() - 0.5) * 2 * Math.max(8, ch.half - 28);
    const roll = Math.random();
    if (roll < 0.4) spawnBalloon(x, y);
    else if (roll < 0.66) items.push({ type: 'rock', x, y, r: 15 + Math.random() * 6, verts: rockVerts(), alive: true });
    else if (roll < 0.8) items.push({ type: 'fuel', x, y, r: 16, alive: true });
    else items.push({ type: 'coin', x, y, r: 12, alive: true, phase: Math.random() * 6 });
  }
  function burst(x, y, color, n) {
    const count = n || 12;
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const sp = 70 + Math.random() * 90;
      particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 120, life: 0.6, max: 0.6, r: 2 + Math.random() * 3, color });
    }
  }
  function addFloater(x, y, text, color, size) {
    floaters.push({ x, y, text, color, life: 1, max: 1, size: size || 18 });
  }
  function addScore(pts, x, y, color, text) {
    score += pts;
    addFloater(x, y, text || `+${pts}`, color);
  }

  function shoot() {
    if (!running || shootCooldown > 0) return;
    shootCooldown = 0.22;
    bullets.push({ x: player.x, y: player.y - 34, vy: -560 });
    GameSfx.shoot();
  }
  function popBalloon(it) {
    it.alive = false;
    burst(it.x, it.y, it.color, 16);
    if (target && it.word[0] === target[0]) {
      const pts = 50 * combo;
      addScore(pts, it.x, it.y - 24, '#FFE066', `+${pts}  ${it.word[1]} ${it.word[0]}!`);
      wordsHit.push(it.word);
      combo = Math.min(5, combo + 1);
      GameSfx.good();
      flashTarget('ok');
      setTarget();
    } else {
      combo = 1;
      wrongOnTarget++;
      if (wrongOnTarget >= 2) $('keRiverTargetWord').classList.add('ke-show');
      addFloater(it.x, it.y - 12, L('Olmadı!', 'Oops!'), '#FFFFFF', 17);
      GameSfx.bad();
      flashTarget('bad');
    }
    updateCombo();
  }
  function loseHeart() {
    hearts--;
    invuln = 1.6;
    shakeTime = 0.35;
    combo = 1;
    updateCombo();
    renderHearts();
    GameSfx.crash();
    if (hearts <= 0) finishRun();
  }

  // --- döngü ---
  function update(dt) {
    const t01 = Math.min(1, distance / 5000);
    scrollSpeed = 125 + t01 * 110;
    const scroll = scrollSpeed * dt;
    scrollTotal += scroll;
    distance += scroll;
    waterPhase += dt;

    terrain.forEach((t) => { t.y += scroll; });
    while (terrain[0].y > -CHECK_GAP) {
      const first = terrain[0];
      const step = nextTerrainStep(first.cx, first.half);
      const y = first.y - CHECK_GAP;
      terrain.unshift({ y, cx: step.cx, half: step.half });
      addDecorAt(y, step.cx, step.half);
    }
    terrain = terrain.filter((t) => t.y < H + CHECK_GAP * 3);
    decor.forEach((d) => { d.y += scroll; });
    decor = decor.filter((d) => d.y < H + 60);
    items.forEach((it) => { it.y += scroll; if (it.type === 'balloon') it.bob += dt * 2.2; if (it.type === 'coin') it.phase += dt * 5; });
    items = items.filter((it) => it.alive && it.y < H + 60);
    spawnAcc += scroll;
    if (spawnAcc > 100 - t01 * 30) { spawnAcc = 0; spawnItem(); }

    bullets.forEach((b) => { b.y += b.vy * dt; });
    particles.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; p.life -= dt; });
    particles = particles.filter((p) => p.life > 0);
    floaters.forEach((f) => { f.y -= 46 * dt; f.life -= dt; });
    floaters = floaters.filter((f) => f.life > 0);
    if (shakeTime > 0) shakeTime -= dt;
    if (invuln > 0) invuln -= dt;
    if (shootCooldown > 0) shootCooldown -= dt;
    targetSince += dt;
    if (target && targetSince > 8) $('keRiverTargetWord').classList.add('ke-show');

    const moveSpeed = 290;
    let vx = 0;
    if (keys.left) vx -= moveSpeed;
    if (keys.right) vx += moveSpeed;
    player.x = Math.max(20, Math.min(W - 20, player.x + vx * dt));
    const dx = player.x - player.prevX;
    player.prevX = player.x;
    player.angle += (Math.max(-0.4, Math.min(0.4, (dx / Math.max(dt, 0.001)) / 700)) - player.angle) * Math.min(1, dt * 10);

    const ch = channelAt(player.y);
    if (player.x - player.r < ch.cx - ch.half || player.x + player.r > ch.cx + ch.half) {
      fuel -= 28 * dt;
      shakeTime = Math.max(shakeTime, 0.1);
      player.x += (ch.cx - player.x) * Math.min(1, dt * 2.5);
      if (Math.random() < 0.6) particles.push({ x: player.x + (player.x < ch.cx ? -player.r : player.r), y: player.y + 6, vx: (Math.random() - 0.5) * 90, vy: -70 - Math.random() * 60, g: 280, life: 0.45, max: 0.45, r: 2.5, color: '#E0C98F' });
    }

    for (const b of bullets) {
      if (b.dead) continue;
      for (const it of items) {
        if (!it.alive || it.type !== 'balloon') continue;
        const by = it.y + Math.sin(it.bob) * 3;
        if (Math.hypot(b.x - it.x, b.y - by) < it.r + 6) { b.dead = true; popBalloon(it); break; }
      }
    }
    bullets = bullets.filter((b) => !b.dead && b.y > -30);

    for (const it of items) {
      if (!it.alive) continue;
      if (Math.hypot(player.x - it.x, player.y - 8 - it.y) > player.r + it.r - 4) continue;
      if (it.type === 'fuel') { it.alive = false; fuel = Math.min(100, fuel + 26); addScore(5, it.x, it.y - 16, '#74C0FC', '+⛽'); burst(it.x, it.y, '#74C0FC'); GameSfx.pickup(); }
      else if (it.type === 'coin') { it.alive = false; coinsGot++; addScore(10, it.x, it.y - 16, '#FFE066'); burst(it.x, it.y, '#FFD43B', 8); GameSfx.pickup(); }
      else if (it.type === 'rock') { if (invuln <= 0) { it.alive = false; burst(it.x, it.y, '#8D7B68', 14); loseHeart(); if (!running) return; } }
      else if (it.type === 'balloon') { it.alive = false; burst(it.x, it.y, it.color, 10); GameSfx.pop(); }
    }
    items = items.filter((it) => it.alive);

    fuel -= (2.3 + t01 * 1.2) * dt;
    score += dt * 3;
    if (fuel <= 0) { fuel = 0; updateHud(); finishRun(); return; }
    updateHud();
  }

  function riverPath() {
    ctx.beginPath();
    ctx.moveTo(terrain[0].cx - terrain[0].half, terrain[0].y);
    terrain.forEach((t) => ctx.lineTo(t.cx - t.half, t.y));
    for (let i = terrain.length - 1; i >= 0; i--) ctx.lineTo(terrain[i].cx + terrain[i].half, terrain[i].y);
    ctx.closePath();
  }
  function drawDecor(d) {
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.scale(d.s, d.s);
    if (d.kind === 'tree') {
      ctx.fillStyle = 'rgba(0,0,0,.2)';
      ctx.beginPath(); ctx.ellipse(6, 8, 20, 12, 0, 0, Math.PI * 2); ctx.fill();
      const tones = d.v < 0.5 ? ['#2B7A3D', '#3C9A4E', '#63C06F'] : ['#2F6B34', '#3F8A44', '#7CC46B'];
      ctx.fillStyle = tones[0];
      ctx.beginPath(); ctx.arc(-7, 2, 12, 0, Math.PI * 2); ctx.arc(8, 3, 12, 0, Math.PI * 2); ctx.arc(0, -8, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = tones[1];
      ctx.beginPath(); ctx.arc(-4, -3, 10, 0, Math.PI * 2); ctx.arc(6, -5, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = tones[2];
      ctx.beginPath(); ctx.arc(-3, -10, 5, 0, Math.PI * 2); ctx.fill();
    } else if (d.kind === 'bush') {
      ctx.fillStyle = 'rgba(0,0,0,.16)';
      ctx.beginPath(); ctx.ellipse(3, 5, 13, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4FA35A';
      ctx.beginPath(); ctx.arc(-6, 0, 7, 0, Math.PI * 2); ctx.arc(5, 0, 7, 0, Math.PI * 2); ctx.arc(0, -5, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#86D07A';
      ctx.beginPath(); ctx.arc(-2, -7, 3, 0, Math.PI * 2); ctx.fill();
    } else if (d.kind === 'flowers') {
      const cols = ['#FF8FAB', '#FFD43B', '#FFFFFF'];
      for (let i = 0; i < 4; i++) {
        const fx = (i - 1.5) * 7;
        const fy = (i % 2) * 5 - 2;
        ctx.fillStyle = cols[(i + Math.floor(d.v * 3)) % 3];
        ctx.beginPath(); ctx.arc(fx, fy, 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#F59F00';
        ctx.beginPath(); ctx.arc(fx, fy, 1.2, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ctx.beginPath(); ctx.ellipse(2, 4, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9AA0A6';
      ctx.beginPath(); ctx.ellipse(0, 0, 9, 6, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#C4C9CE';
      ctx.beginPath(); ctx.ellipse(-2, -2, 4, 2.5, 0.3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  function drawItem(it) {
    ctx.save();
    if (it.type === 'rock') {
      ctx.translate(it.x, it.y);
      const rip = 1 + (Math.sin(waterPhase * 3 + it.x) + 1) * 0.08;
      ctx.strokeStyle = 'rgba(255,255,255,.35)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 4, it.r * 1.35 * rip, it.r * 0.7 * rip, 0, 0, Math.PI * 2); ctx.stroke();
      const g = ctx.createRadialGradient(-it.r * 0.35, -it.r * 0.4, 2, 0, 0, it.r * 1.1);
      g.addColorStop(0, '#B5A48F'); g.addColorStop(1, '#6A5A47');
      ctx.fillStyle = g;
      ctx.beginPath();
      it.verts.forEach(([vx, vy], i) => (i ? ctx.lineTo(vx * it.r, vy * it.r) : ctx.moveTo(vx * it.r, vy * it.r)));
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(40,30,20,.35)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = 'rgba(90,150,70,.7)';
      ctx.beginPath(); ctx.ellipse(it.r * 0.25, -it.r * 0.35, it.r * 0.35, it.r * 0.2, 0.4, 0, Math.PI * 2); ctx.fill();
    } else if (it.type === 'fuel') {
      ctx.translate(it.x, it.y);
      const glow = 0.3 + (Math.sin(waterPhase * 5 + it.x) + 1) * 0.12;
      ctx.fillStyle = `rgba(116,192,252,${glow})`;
      ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.fill();
      const cg = ctx.createLinearGradient(-11, 0, 11, 0);
      cg.addColorStop(0, '#E03131'); cg.addColorStop(0.5, '#FF6B6B'); cg.addColorStop(1, '#C92A2A');
      ctx.fillStyle = cg;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-11, -13, 22, 28, 5); else ctx.rect(-11, -13, 22, 28);
      ctx.fill();
      ctx.fillStyle = '#343A40';
      ctx.fillRect(-4, -19, 8, 6);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.quadraticCurveTo(6, 3, 0, 8); ctx.quadraticCurveTo(-6, 3, 0, -6); ctx.fill();
    } else if (it.type === 'coin') {
      ctx.translate(it.x, it.y);
      ctx.scale(Math.max(0.15, Math.abs(Math.cos(it.phase))), 1);
      ctx.fillStyle = '#E8A500';
      ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFD43B';
      ctx.beginPath(); ctx.arc(0, 0, 9.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFF3BF';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        ctx.lineTo(Math.cos(a) * 5.5, Math.sin(a) * 5.5);
        ctx.lineTo(Math.cos(a + Math.PI / 5) * 2.4, Math.sin(a + Math.PI / 5) * 2.4);
      }
      ctx.closePath(); ctx.fill();
    } else if (it.type === 'balloon') {
      const by = it.y + Math.sin(it.bob) * 3;
      ctx.translate(it.x, by);
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, it.r * 1.1); ctx.quadraticCurveTo(5, it.r * 1.1 + 10, 0, it.r * 1.1 + 20); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ctx.beginPath(); ctx.ellipse(4, it.r * 0.25 + 6, it.r, it.r * 1.1, 0, 0, Math.PI * 2); ctx.fill();
      const g = ctx.createRadialGradient(-it.r * 0.35, -it.r * 0.45, 2, 0, 0, it.r * 1.2);
      g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.25, it.color); g.addColorStop(1, it.color);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(0, 0, it.r, it.r * 1.1, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = it.color;
      ctx.beginPath(); ctx.moveTo(-4, it.r * 1.1 - 1); ctx.lineTo(4, it.r * 1.1 - 1); ctx.lineTo(0, it.r * 1.1 + 5); ctx.closePath(); ctx.fill();
      ctx.font = '800 15px Fredoka, "Baloo 2", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.35)';
      ctx.strokeText(it.word[0], 0, 1);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(it.word[0], 0, 1);
    }
    ctx.restore();
  }
  function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    // köpük izi (V dalga)
    const wob = Math.sin(waterPhase * 12) * 2;
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-10, 14); ctx.lineTo(-26 + wob, 58); ctx.moveTo(10, 14); ctx.lineTo(26 - wob, 58); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(0, 22); ctx.lineTo(0, 64); ctx.stroke();
    ctx.rotate(player.angle);
    if (invuln > 0 && Math.floor(invuln * 12) % 2 === 0) ctx.globalAlpha = 0.35;
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.beginPath(); ctx.ellipse(3, 8, 20, 26, 0, 0, Math.PI * 2); ctx.fill();
    const hull = ctx.createLinearGradient(-18, 0, 18, 0);
    hull.addColorStop(0, '#7B4A22'); hull.addColorStop(0.5, '#A8672F'); hull.addColorStop(1, '#6A3E1B');
    ctx.fillStyle = hull;
    ctx.beginPath();
    ctx.moveTo(0, -30); ctx.quadraticCurveTo(20, -14, 18, 12); ctx.quadraticCurveTo(16, 24, 0, 26); ctx.quadraticCurveTo(-16, 24, -18, 12); ctx.quadraticCurveTo(-20, -14, 0, -30);
    ctx.fill();
    ctx.strokeStyle = '#F8F0E3'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-17, 8); ctx.quadraticCurveTo(0, 12, 17, 8); ctx.stroke();
    ctx.fillStyle = '#5A3417';
    ctx.beginPath(); ctx.ellipse(0, 2, 11, 15, 0, 0, Math.PI * 2); ctx.fill();
    if (boatImgReady) ctx.drawImage(boatImg, -21, -44, 42, 63);
    ctx.restore();
  }
  function draw() {
    if (!terrain.length) return;
    ctx.save();
    if (shakeTime > 0) {
      const k = Math.min(1, shakeTime / 0.35);
      ctx.translate((Math.random() - 0.5) * 12 * k, (Math.random() - 0.5) * 12 * k);
    }
    ctx.save();
    ctx.translate(0, scrollTotal % 96);
    ctx.fillStyle = grassPattern;
    ctx.fillRect(-10, -106, W + 20, H + 212);
    ctx.restore();

    ctx.lineJoin = 'round';
    riverPath(); ctx.strokeStyle = '#B89B5E'; ctx.lineWidth = 30; ctx.stroke();
    riverPath(); ctx.strokeStyle = '#E8D5A0'; ctx.lineWidth = 22; ctx.stroke();

    ctx.save();
    riverPath(); ctx.clip();
    const wg = ctx.createLinearGradient(0, 0, 0, H);
    wg.addColorStop(0, '#2F9BD6'); wg.addColorStop(1, '#17659E');
    ctx.fillStyle = wg;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 2;
    const period = H + 80;
    for (let row = 0; row * 40 < period; row++) {
      const y = (((row * 40 + scrollTotal) % period) + period) % period - 40;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.045 + waterPhase * 2 + row) * 4);
      ctx.stroke();
    }
    for (let i = 0; i < 18; i++) {
      const a = Math.sin(waterPhase * 2.4 + i * 1.7);
      if (a < 0.55) continue;
      const sx = (i * 137.5) % W;
      const sy = (((i * 91 + scrollTotal * 0.6) % period) + period) % period - 40;
      ctx.fillStyle = `rgba(255,255,255,${(a - 0.55) * 1.6})`;
      ctx.fillRect(sx - 1, sy - 4, 2, 8);
      ctx.fillRect(sx - 4, sy - 1, 8, 2);
    }
    ctx.restore();

    riverPath();
    ctx.setLineDash([12, 9]);
    ctx.lineDashOffset = -scrollTotal;
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);

    decor.forEach(drawDecor);
    items.forEach(drawItem);

    bullets.forEach((b) => {
      ctx.fillStyle = 'rgba(111,66,193,.35)';
      ctx.beginPath(); ctx.arc(b.x, b.y + 12, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5F3DC4';
      ctx.beginPath(); ctx.arc(b.x, b.y, 6.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      ctx.beginPath(); ctx.arc(b.x - 2, b.y - 2, 2, 0, Math.PI * 2); ctx.fill();
    });

    drawPlayer();

    particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    floaters.forEach((f) => {
      ctx.globalAlpha = Math.max(0, Math.min(1, f.life / f.max * 1.5));
      ctx.font = `800 ${f.size}px Fredoka, "Baloo 2", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;
    ctx.restore();

    if (running && fuel < 25) {
      const a = 0.18 + Math.sin(waterPhase * 8) * 0.1;
      const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(255,0,0,0)'); vg.addColorStop(1, `rgba(255,40,40,${a})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function loop(ts) {
    if (!running) return;
    if (lastTime == null) lastTime = ts;
    const dt = Math.min(0.05, (ts - lastTime) / 1000);
    lastTime = ts;
    update(dt);
    draw();
    if (running) rafId = requestAnimationFrame(loop);
  }

  function beginRunning() {
    running = true;
    paused = false;
    lastTime = null;
    rafId = requestAnimationFrame(loop);
  }
  function runCountdown(done) {
    const el = $('keRiverCountdown');
    const steps = ['3', '2', '1', L('BAŞLA!', 'GO!')];
    let i = 0;
    const tick = () => {
      if (i >= steps.length) { el.className = 'ke-river-countdown'; el.textContent = ''; done(); return; }
      el.textContent = steps[i];
      el.className = 'ke-river-countdown';
      void el.offsetWidth;
      el.className = 'ke-river-countdown ke-show';
      GameSfx.countdown(i === steps.length - 1);
      i++;
      countdownTimer = setTimeout(tick, i === steps.length ? 500 : 650);
    };
    tick();
  }
  function startRun() {
    resetGame();
    $('keRiverStartMsg').style.display = 'none';
    $('keRiverOverMsg').style.display = 'none';
    $('keRiverTarget').hidden = true;
    draw();
    runCountdown(() => { setTarget(); beginRunning(); });
  }
  function pauseGame() {
    if (!running) return;
    running = false;
    paused = true;
    if (rafId) cancelAnimationFrame(rafId);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    $('keRiverPauseMsg').style.display = 'flex';
  }
  function resumeGame() {
    if (!paused) return;
    $('keRiverPauseMsg').style.display = 'none';
    beginRunning();
  }
  function finishRun() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    const finalScore = Math.floor(score);
    lastFinalScore = finalScore;
    const isNewBest = RiverHighScore.submit(finalScore);
    if (isNewBest) GameSfx.win(); else GameSfx.lose();
    draw();
    setTimeout(() => {
      const stars = finalScore >= 900 ? 3 : finalScore >= 400 ? 2 : 1;
      $('keRiverOverTitle').textContent = isNewBest ? `🏆 ${L('Yeni Rekor!', 'New Record!')}` : (hearts <= 0 ? `💥 ${L('Tekne battı!', 'Boat sank!')}` : `⛽ ${L('Yakıt bitti!', 'Out of fuel!')}`);
      $('keRiverStars').innerHTML = gameStarsHTML(stars);
      $('keRiverFinalScore').textContent = finalScore;
      $('keRiverStatWords').textContent = wordsHit.length;
      $('keRiverStatDist').textContent = `${Math.floor(distance / 12)} m`;
      $('keRiverStatCoins').textContent = coinsGot;
      const seen = new Set();
      $('keRiverWordChips').innerHTML = wordsHit.filter((w) => !seen.has(w[0]) && seen.add(w[0])).map((w) => `<span class="ke-word-chip">${w[1]} ${w[0]}</span>`).join('');
      const submitBtn = $('keRiverSubmitBtn');
      submitBtn.disabled = finalScore <= 0;
      submitBtn.style.display = '';
      $('keRiverSubmitStatus').textContent = '';
      $('keRiverAgainBtn').style.display = GameTokens.get() > 0 ? '' : 'none';
      $('keRiverOverMsg').style.display = 'flex';
      if (isNewBest) launchConfetti(overlay);
    }, 650);
  }

  // --- kontroller ---
  function onKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
    if (e.key === ' ') { e.preventDefault(); shoot(); }
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { if (running) pauseGame(); else resumeGame(); }
  }
  function onKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
  }
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  // Sol yarı: parmak sürüklendiği kadar tekne kayar (göreli delta, pointer
  // capture ile parmak bölgeden taşsa da takip kesilmez). Sağ yarı: dokun-ateş.
  const steerZone = $('keRiverSteerZone');
  const fireZone = $('keRiverFireZone');
  let steerPointerId = null;
  let steerStartClientX = 0;
  let steerStartPlayerX = 0;
  steerZone.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    steerPointerId = e.pointerId;
    steerStartClientX = e.clientX;
    steerStartPlayerX = player.x;
    try { steerZone.setPointerCapture(e.pointerId); } catch (err) { /* yok say */ }
  });
  steerZone.addEventListener('pointermove', (e) => {
    if (steerPointerId !== e.pointerId || !running) return;
    player.x = Math.max(20, Math.min(W - 20, steerStartPlayerX + (e.clientX - steerStartClientX) * 1.6));
    keys.left = false; keys.right = false;
  });
  const endSteer = (e) => { if (steerPointerId === e.pointerId) steerPointerId = null; };
  steerZone.addEventListener('pointerup', endSteer);
  steerZone.addEventListener('pointercancel', endSteer);
  fireZone.addEventListener('pointerdown', (e) => { e.preventDefault(); shoot(); });

  const onVis = () => { if (document.hidden) pauseGame(); };
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('resize', resize);

  function cleanup() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    if (countdownTimer) clearTimeout(countdownTimer);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('resize', resize);
    overlay.remove();
  }

  wireMuteButton($('keRiverMute'));
  $('keRiverSay').addEventListener('click', () => { if (target) speakWord(target[0], { classList: { add() {}, remove() {} } }); });
  $('keRiverPause').addEventListener('click', () => { if (running) pauseGame(); else resumeGame(); });
  $('keRiverResumeBtn').addEventListener('click', resumeGame);
  $('keRiverQuitBtn').addEventListener('click', () => { cleanup(); onExit(); });
  $('keRiverStartBtn').addEventListener('click', startRun);
  $('keRiverClose').addEventListener('click', () => { cleanup(); onExit(); });
  $('keRiverExitBtn').addEventListener('click', () => { cleanup(); onExit(); });
  $('keRiverAgainBtn').addEventListener('click', () => {
    if (!GameTokens.spend()) return;
    refreshGameBadge(container);
    startRun();
  });
  // Bu buton önceden hiçbir şeye bağlı değildi (tıklayınca hiçbir şey olmuyordu).
  $('keRiverSubmitBtn').addEventListener('click', async () => {
    const btn = $('keRiverSubmitBtn');
    const status = $('keRiverSubmitStatus');
    btn.disabled = true;
    status.textContent = `⏳ ${L('Gönderiliyor...', 'Sending...')}`;
    try {
      await Leaderboard.submit(Profiles.active().name || 'Friend', lastFinalScore, 'river');
      status.textContent = `✅ ${L('Sıralamaya eklendi!', 'Added to the leaderboard!')}`;
      btn.style.display = 'none';
    } catch (e) {
      status.textContent = e && e.message === 'name-not-allowed'
        ? `⚠️ ${L('Bu isim kullanılamıyor, profilden değiştir.', "This name can't be used — change it in your profile.")}`
        : `⚠️ ${L('Gönderilemedi, internetini kontrol et.', "Couldn't send — check your connection.")}`;
      btn.disabled = false;
    }
  });

  resize();
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
