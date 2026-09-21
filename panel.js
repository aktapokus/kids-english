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
  prepositions: '📦', question_words: '❓',
};

// Kalıcı, gizlilik-dostu ilerleme: sadece bu cihazın tarayıcısında
// (localStorage), sunucuya/buluta hiç gönderilmeden. Ebeveyn tarayıcı
// verisini temizleyerek sıfırlayabilir — ayrı bir "ilerlemeyi sıfırla"
// UI'ı şimdilik yok, kapsam dışı bırakıldı. Yapı:
// { [categoryId]: { completed: [episodeIndex,...], missed: { word: {count, obj} } } }
const PROGRESS_KEY = 'ke_progress_v1';
const PROFILES_KEY = 'ke_profiles_v1';
function progressKey() {
  const id = Profiles.active().id;
  return id === 'p1' ? PROGRESS_KEY : PROGRESS_KEY + '_' + id;
}

const Progress = {
  _load() {
    try {
      const raw = window.localStorage.getItem(progressKey());
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  },
  _save(data) {
    try { window.localStorage.setItem(progressKey(), JSON.stringify(data)); } catch (e) { /* quota/gizli mod — sessizce yok say */ }
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
    if (entry) entry.count++;
    else cat.missed[obj.word] = { count: 1, obj };
    this._save(data);
  },
  // Kelime ilk denemede doğru bilinince — "artık biliyor" kabul edip
  // tekrar kuyruğundan çıkarıyoruz.
  clearMistakes(categoryId, words) {
    const data = this._load();
    const cat = this._cat(data, categoryId);
    words.forEach((w) => { delete cat.missed[w]; });
    this._save(data);
  },
  totalStars() {
    const data = this._load();
    return Object.values(data).reduce((n, c) => n + ((c && c.completed) ? c.completed.length : 0), 0);
  },
  topMissed(categoryId, limit) {
    const cat = this.getCategory(categoryId);
    return Object.values(cat.missed)
      .sort((a, b) => b.count - a.count)
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
    box-shadow:
      inset 0 0 0 6px rgba(47,25,12,.45),
      inset 0 0 18px rgba(0,0,0,.28),
      0 14px 32px rgba(0,0,0,.38);
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
    min-height: 640px;
  }
  .ke-shell *{ box-sizing: border-box; }
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
  .ke-shell.ke-fs .ke-fullscreen-btn{ position: fixed; top: 18px; left: 18px; }
  .ke-shell.ke-fs .ke-back-btn{ position: fixed; top: 18px; right: 18px; }

  /* Duolingo tarzı "3D bas" düğme dili — üstteki yüzey + altında koyu bir
     "gölge kaide", basınca yüzey o kaidenin içine gömülür. */
  .ke-shell button{
    font-family:'Fredoka','Baloo 2','Nunito',sans-serif; font-weight:700; font-size:15px; letter-spacing:.2px;
    padding:14px 24px; border-radius:16px; border:none; cursor:pointer;
    position:relative; top:0;
    box-shadow: 0 4px 0 var(--btn-shadow, #c7cfd9);
    transition: top .08s ease, box-shadow .08s ease, opacity .15s ease;
  }
  .ke-shell button:active:not(:disabled){ top:4px; box-shadow:0 0 0 var(--btn-shadow, #c7cfd9); }
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
    box-shadow: 2px 3px 0 rgba(0,0,0,.22); --btn-shadow: transparent;
    transform: rotate(-.4deg); text-shadow: 0 0 5px rgba(110,200,255,.55);
  }
  .ke-btn-primary:hover:not(:disabled){ background: rgba(110,200,255,.2); }
  .ke-btn-secondary{
    background: rgba(245,240,223,.08); color: var(--kb-chalk-dim);
    border: 2px dashed rgba(245,240,223,.5); border-radius: 11px 13px 10px 14px;
    box-shadow: 2px 3px 0 rgba(0,0,0,.18); --btn-shadow: transparent;
    transform: rotate(.3deg);
  }
  .ke-btn-secondary:hover:not(:disabled){ background: rgba(245,240,223,.15); }
  .ke-btn-primary:disabled{ opacity:.4; cursor:not-allowed; top:0 !important; box-shadow:2px 3px 0 rgba(0,0,0,.22) !important; }

  .ke-fullscreen-btn{
    position: absolute; top: 16px; left: 16px; z-index: 10;
    display: flex; align-items: center; gap: 7px;
    padding: 10px 18px !important; border-radius: 999px !important;
    background: var(--ke-blue); --btn-shadow:var(--ke-blue-dark);
    color: #fff; font-size: 13px;
  }
  .ke-back-btn{
    position: absolute; top: 16px; right: 16px; z-index: 10;
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
    font-size:15px; font-weight:800; border:none; box-shadow: 0 4px 0 #7FA8D6;
    background:var(--ke-surface-2); color:var(--ke-ink-soft); flex-shrink:0; cursor:pointer;
    transition: transform .1s ease;
  }
  .ke-map .ke-dot:active{ transform:translateY(3px); box-shadow:0 1px 0 #7FA8D6; }
  .ke-map .ke-dot.current{ background:var(--ke-yellow); color:var(--ke-ink); box-shadow:0 4px 0 var(--ke-yellow-dark); animation:ke-node-bounce 1.4s ease-in-out infinite; }
  .ke-map .ke-dot.done{ background:var(--ke-green); color:#fff; box-shadow:0 4px 0 var(--ke-green-dark); }
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
    text-shadow:
      0 0 2px rgba(255,255,255,.5),
      1px 1px 0 rgba(255,255,255,.16),
      -1px -1px 0 rgba(255,255,255,.1),
      2px 4px 10px rgba(0,0,0,.4);
  }
  .ke-title .ke-tword:first-child{ color: var(--kb-discover); }
  .ke-subtitle{ text-align:center; margin:0 0 20px; color:var(--kb-chalk-dim); font-size:14.5px; font-weight:700; text-shadow:0 0 1px rgba(255,255,255,.4); }

  /* Kategoriye özgü zemin: renderEpisodeScene, --cc-tint/--cc-c inline
     değişkenlerini CATEGORY_THEME'den enjekte ediyor — böylece her
     kategorinin oyun sahnesi kendi konu rengini taşıyor, hepsi aynı
     soğuk mavi zemin yerine. */
  .ke-scene-wrap{
    position:relative; border-radius:28px; overflow:hidden;
    background: linear-gradient(180deg, var(--cc-tint, #8FCBFA) 0%, var(--cc-c, #1CB0F6) 100%);
    border:3px solid #ffffff;
    box-shadow:0 16px 40px color-mix(in srgb, var(--cc-c, #1CB0F6) 22%, transparent), 0 0 0 3px var(--ke-border);
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
    opacity:.65; box-shadow:0 0 0 12px rgba(124,77,255,.18);
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
    box-shadow: 80px 18px 0 -6px rgba(255,255,255,.75), 145px -8px 0 -10px rgba(255,255,255,.65);
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
  .ke-bubble{ position:absolute; top:16px; left:50%; transform:translateX(-50%); background:#ffffff; color:var(--ke-ink); padding:11px 20px; border-radius:18px; font-size:14.5px; font-weight:700; text-align:center; max-width:86%; border:2px solid var(--ke-border); box-shadow:0 4px 0 var(--ke-border); z-index:5; }
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
    box-shadow:1px 2px 0 rgba(0,0,0,.25); text-shadow:0 0 4px rgba(255,215,90,.5);
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
    box-shadow: 0 0 0 2px rgba(245,240,223,.35), 0 5px 10px rgba(0,0,0,.3);
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
  .ke-icon-hex-inner .ke-letter-badge-text{ font-size:13px; font-weight:800; color:#fff; text-align:center; line-height:1.15; text-shadow:0 1px 3px rgba(0,0,0,.45); }

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
  .ke-word-popup{ position:absolute; right:auto; left:50%; bottom:auto; top:16%; transform:translateX(-50%) translateY(-8px) scale(.85); background:var(--ke-yellow); color:var(--ke-ink); padding:11px 28px; border-radius:20px; font-family:'Chewy','Fredoka',sans-serif; font-size:26px; font-weight:400; opacity:0; pointer-events:none; transition:opacity .25s ease, transform .25s ease; z-index:6; box-shadow:0 5px 0 var(--ke-yellow-dark); max-width:80%; text-align:center; }
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
  /* TAM TEBEŞİR (v2): sert siyah drop-shadow yumuşatıldı — maskot artık
     "tahtaya yapıştırılmış bir sticker" gibi, ana tebeşir yazı alanıyla
     kontrast için yarışmıyor. Altına küçük, soluk bir elips gölge
     (::after, tebeşir tozu/raf hissi) eklendi — yeni görsel dosya yok. */
  .ke-mascot-img{ display:block; width:100%; height:auto; filter:drop-shadow(0 5px 6px rgba(0,0,0,.22)); user-select:none; -webkit-user-drag:none; animation:ke-bob 2.6s ease-in-out infinite; position:relative; z-index:1; }
  .ke-mascot-wrap::after{
    content:''; position:absolute; left:50%; bottom:-4px; transform:translateX(-50%);
    width:60%; height:10px; border-radius:50%;
    background:radial-gradient(ellipse, rgba(245,240,223,.28), transparent 72%);
    z-index:0;
  }
  .ke-mascot-wrap.ke-mascot-compact::after, .ke-mascot-wrap.ke-mascot-narrow::after{ display:none; }
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
  .ke-jump-btn{ font-size:11.5px !important; font-weight:700 !important; padding:6px 13px !important; border-radius:8px 12px 9px 11px !important; background:rgba(245,240,223,.06) !important; color:var(--kb-chalk-dim) !important; border:1.5px dashed rgba(245,240,223,.4) !important; --btn-shadow:transparent !important; box-shadow:1px 2px 0 rgba(0,0,0,.2) !important; }
  .ke-jump-btn:active{ top:2px !important; box-shadow:0 0 0 transparent !important; }

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
  .ke-quiz{ position:absolute; top:10px; left:3%; right:3%; bottom:10px; overflow-y:auto; max-width:620px; margin:0 auto; display:none; flex-direction:column; align-items:center; gap:16px; padding:52px 20px 26px; z-index:40; background:radial-gradient(ellipse 640px 260px at 50% 0%, #263229 0%, #1a231d 55%, #10160f 100%); border:5px solid #6b4226; border-radius:22px; box-shadow:inset 0 0 40px rgba(0,0,0,.5); }
  .ke-quiz.ke-show{ display:flex; }
  .ke-quiz-bubble{ position:static; transform:none; margin:0; }
  .ke-quiz-progress{ background:rgba(110,200,255,.1); border:2px dashed var(--kb-action); color:var(--kb-action); border-radius:10px 14px 10px 14px; padding:6px 16px; font-size:12.5px; font-weight:800; box-shadow:1px 2px 0 rgba(0,0,0,.2); text-shadow:0 0 4px rgba(110,200,255,.5); }
  .ke-quiz-word{ font-family:'Fredericka the Great','Chewy','Fredoka',sans-serif; font-weight:400; font-size:26px; color:#F5F3EE; text-shadow:0 0 2px rgba(255,255,255,.25), 0 2px 6px rgba(0,0,0,.5); }
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
    aspect-ratio:1/1; position:relative; top:0; box-shadow:0 5px 0 var(--ke-border);
  }
  .ke-quiz-card .ke-icon-hex{ width:100%; height:100%; box-shadow:none; background:transparent; }
  .ke-quiz-card .ke-icon-hex-inner{ width:100%; height:100%; }
  .ke-quiz-card .ke-icon-hex .ke-emoji-icon{ font-size:52px; }
  .ke-quiz-card .ke-icon-hex .ke-letter-badge-text{ font-size:13px; }
  .ke-quiz-card:hover{ border-color:var(--ke-blue); }
  .ke-quiz-card:active:not(:disabled){ top:5px; box-shadow:0 0 0 var(--ke-border); }
  .ke-quiz-card:disabled{ cursor:not-allowed; }
  .ke-quiz-card:disabled:hover{ border-color:var(--ke-border); }
  .ke-quiz-card.ke-correct{ border-color:var(--kb-correct); background:#EFFCE5; box-shadow:0 5px 0 var(--kb-correct); animation:ke-pop .35s ease; }
  .ke-quiz-card.ke-wrong{ border-color:var(--kb-wrong); background:#FFEDED; opacity:.65; box-shadow:0 5px 0 var(--kb-wrong); animation:ke-shake-x .35s ease; }
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

  .ke-speak{ position:absolute; top:10px; left:3%; right:3%; bottom:10px; overflow-y:auto; max-width:480px; margin:0 auto; display:none; flex-direction:column; align-items:center; gap:14px; padding:52px 20px 26px; z-index:40; background:radial-gradient(ellipse 640px 260px at 50% 0%, #263229 0%, #1a231d 55%, #10160f 100%); border:5px solid #6b4226; border-radius:22px; box-shadow:inset 0 0 40px rgba(0,0,0,.5); }
  .ke-speak.ke-show{ display:flex; }
  .ke-speak-progress{ background:rgba(110,200,255,.1); border:2px dashed var(--kb-action); color:var(--kb-action); border-radius:10px 14px 10px 14px; padding:6px 16px; font-size:12.5px; font-weight:800; box-shadow:1px 2px 0 rgba(0,0,0,.2); text-shadow:0 0 4px rgba(110,200,255,.5); }
  .ke-speak-card{ background:#ffffff; border:3px solid var(--ke-border); border-radius:24px; padding:18px 34px; display:flex; flex-direction:column; align-items:center; gap:8px; box-shadow:0 5px 0 var(--ke-border); }
  .ke-speak-card .ke-icon-hex{ width:170px; height:170px; }
  .ke-speak-card .ke-icon-hex .ke-emoji-icon{ font-size:66px; }
  /* DİKKAT: bu metin .ke-speak-card'ın (BEYAZ kart) İÇİNDE — tahtanın
     üzerinde değil. Tebeşir-beyazı renk burada kart üstünde neredeyse
     görünmez olurdu; "tebeşir hissi" fontun şekli üzerinden korunuyor,
     renk okunaklılık için koyu tahta rengine çekildi. */
  .ke-speak-word{ font-family:'Fredericka the Great','Chewy','Fredoka',sans-serif; font-size:30px; font-weight:400; color:var(--kb-board); letter-spacing:.5px; text-align:center; }
  .ke-speak-feedback{ min-height:20px; font-size:13.5px; font-weight:700; text-align:center; max-width:90%; color:#F3EEFF; text-shadow:0 1px 3px rgba(0,0,0,.4); }
  .ke-speak-mic{ display:inline-flex; align-items:center; gap:8px; background:var(--ke-blue); color:#fff; --btn-shadow:var(--ke-blue-dark); }
  /* Dinleme durumu kasıtlı olarak KIRMIZI değil — kırmızı bu uygulamada
     sadece "hata/yanlış" anlamına geliyor (bkz. ke-quiz-card.ke-wrong),
     dinlerken kırmızı görmek çocuğa yanlış yaptığı hissini veriyordu.
     Mor/mavi "ses" rolüne ayrılmış (bkz. STYLE üstündeki renk notu). */
  .ke-speak-mic.ke-listening{ background:var(--kb-voice); color:#1A1030; --btn-shadow:#9576D6; animation:ke-pulse 1s ease-in-out infinite; }
  @keyframes ke-pulse{ 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.06); } }

  .ke-sentence{ position:absolute; top:10px; left:3%; right:3%; bottom:10px; overflow-y:auto; max-width:620px; margin:0 auto; display:none; flex-direction:column; align-items:center; gap:16px; padding:48px 16px 26px; z-index:40; background:radial-gradient(ellipse 640px 260px at 50% 0%, #263229 0%, #1a231d 55%, #10160f 100%); border:5px solid #6b4226; border-radius:22px; box-shadow:inset 0 0 40px rgba(0,0,0,.5); }
  .ke-sentence.ke-show{ display:flex; }
  .ke-sentence-bubble{ position:static; transform:none; margin:0; }
  .ke-sentence-progress{ background:rgba(110,200,255,.1); border:2px dashed var(--kb-action); color:var(--kb-action); border-radius:10px 14px 10px 14px; padding:6px 16px; font-size:12.5px; font-weight:800; box-shadow:1px 2px 0 rgba(0,0,0,.2); text-shadow:0 0 4px rgba(110,200,255,.5); }
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
  .ke-slot{ min-width:48px; height:44px; border-bottom:3px dashed rgba(245,240,223,.55); display:flex; align-items:center; justify-content:center; padding:0 6px; font-weight:400; font-family:'Fredericka the Great','Chewy',sans-serif; color:var(--kb-chalk); text-shadow:0 0 2px rgba(255,255,255,.25), 0 1px 3px rgba(0,0,0,.45); font-size:19px; }
  .ke-slot.ke-filled{ cursor:pointer; border-bottom-style:solid; }
  .ke-slot.ke-reveal{ color:var(--kb-correct); border-bottom-style:solid; }
  .ke-tile, .ke-slot{ touch-action:none; user-select:none; -webkit-user-select:none; }
  .ke-drag-ghost{ position:fixed !important; z-index:99999; transform:translate(-50%,-60%); pointer-events:none; opacity:.92; box-shadow:0 8px 18px rgba(0,0,0,.45); }
  .ke-slot.ke-shake{ border-bottom-color:var(--kb-wrong); animation:ke-shake-x .35s ease; }
  .ke-sentence-bank{ display:flex; flex-wrap:wrap; gap:10px; justify-content:center; max-width:560px; }
  .ke-tile{
    background:#ffffff; border:3px solid var(--ke-border); border-radius:14px; padding:10px 18px;
    font-weight:800; font-size:15px; color:var(--ke-ink); cursor:pointer;
    position:relative; top:0; box-shadow:0 4px 0 var(--ke-border);
  }
  .ke-tile:hover{ border-color:var(--ke-blue); }
  .ke-tile:active{ top:4px; box-shadow:0 0 0 var(--ke-border); }
  .ke-tile.ke-used{ visibility:hidden; }
  .ke-tile.ke-shake{ animation:ke-shake-x .3s ease; border-color:var(--kb-wrong); }

  .ke-score{ font-size:17px; font-weight:800; color:var(--kb-action); text-shadow:0 0 4px rgba(110,200,255,.5); margin-bottom:8px; }
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
  .ke-celebration h2{ font-family:'Fredoka','Baloo 2',sans-serif; color:var(--kb-correct); font-size:clamp(24px,5vw,34px); font-weight:600; margin:6px 0 4px; text-shadow:0 0 6px rgba(133,217,138,.5); }
  .ke-celebration p{ color:var(--kb-chalk-dim); margin:0 0 18px; font-size:15px; font-weight:600; }
  .ke-reward-chip{
    display:inline-flex; align-items:center; gap:8px;
    background: rgba(255,215,90,.12); color: var(--kb-discover);
    font-family:'Fredoka','Baloo 2',sans-serif; font-weight:600; font-size:16px;
    padding:13px 24px; border-radius:14px 18px 15px 17px; border:2px dashed var(--kb-discover);
    box-shadow:2px 3px 0 rgba(0,0,0,.25); text-shadow:0 0 5px rgba(255,215,90,.5);
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
    filter:drop-shadow(0 8px 10px rgba(0,0,0,.35)); pointer-events:none;
    z-index:1; animation:ke-bob 2.6s ease-in-out infinite;
  }

  /* Avatar: sapka overlay'i maskot görseliyle aynı animasyonu paylaşır */
  .ke-mascot-hat{ position:absolute; z-index:2; pointer-events:none; height:auto; animation:ke-bob 2.6s ease-in-out infinite; filter:drop-shadow(0 3px 4px rgba(0,0,0,.25)); }
  .ke-mascot-wrap.ke-celebrate .ke-mascot-hat{ animation:ke-mascot-jump .6s ease; }
  .ke-mascot-wrap.ke-mascot-narrow .ke-mascot-hat{ animation:none; }
  .ke-landing-mascot img{ display:block; width:100%; height:auto; }
  .ke-landing-mascot .ke-mascot-hat{ animation:none; }
  .ke-profile-chip{ display:inline-flex; align-items:center; gap:8px; margin:0 0 10px; padding:4px 14px 4px 6px !important; border-radius:999px !important; font-size:13px !important; }
  .ke-profile-chip .ke-avatar-mini{ position:relative; width:34px; height:34px; flex:none; }
  .ke-avatar-mini img.ke-av-body{ width:100%; height:100%; object-fit:cover; object-position:50% 12%; border-radius:50%; background:rgba(255,255,255,.15); }
  .ke-profile-screen{ max-width:640px; margin:0 auto; text-align:center; position:relative; z-index:1; }
  .ke-avatar-stage{ position:relative; width:min(170px,24vh); margin:30px auto 4px; }
  .ke-avatar-stage img.ke-av-body{ display:block; width:100%; height:auto; filter:drop-shadow(0 6px 8px rgba(0,0,0,.3)); }
  .ke-avatar-stage .ke-mascot-hat{ animation:none; }
  .ke-pick-row{ display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin:6px 0 10px; }
  .ke-pick{ min-width:52px; min-height:44px; padding:6px 10px !important; border-radius:14px !important; font-size:13px !important; position:relative; }
  .ke-pick.ke-sel{ outline:3px solid #FFD84D; outline-offset:2px; }
  .ke-pick.ke-lock{ opacity:.55; }
  .ke-pick .ke-sw{ display:inline-block; width:22px; height:22px; border-radius:50%; border:2px solid rgba(255,255,255,.8); vertical-align:middle; }
  .ke-profile-name{ font-family:inherit; font-size:18px; font-weight:800; text-align:center; padding:8px 12px; border-radius:12px; border:2px dashed var(--kb-chalk-dim, #ccc); background:rgba(255,255,255,.08); color:var(--kb-chalk, #fff); width:min(240px,80%); }
  .ke-pl-label{ font-size:12px; font-weight:800; color:var(--kb-chalk-dim, #ccc); margin-top:6px; }
.ke-shell .ke-landing-header .ke-subtitle{ font-size:16px !important; margin-bottom:12px; }
  .ke-avatar-stage::before, .ke-landing-mascot::before, .ke-mascot-wrap::before{
    content:''; position:absolute; left:50%; top:46%; width:104%; aspect-ratio:1/1; transform:translate(-50%,-50%);
    border-radius:50%; z-index:0; pointer-events:none;
    background:radial-gradient(circle, rgba(255,248,226,.97) 0%, rgba(255,240,200,.9) 55%, rgba(255,235,190,.55) 68%, rgba(255,235,190,0) 74%);
  }
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
    box-shadow:0 2px 0 rgba(0,0,0,.15);
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
    border-radius:999px; box-shadow:0 3px 0 var(--ke-purple-dark);
    transition: top .08s ease, box-shadow .08s ease;
  }
  .ke-review-chip:active{ top:13px; box-shadow:0 0 0 var(--ke-purple-dark); }

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
    box-shadow: 0 0 0 5px rgba(9,18,13,.55);
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
  { id: 'pink', label: L('Pembe', 'Pink'), need: 8, swatch: '#E63AA0' },
  { id: 'purple', label: L('Mor', 'Purple'), need: 12, swatch: '#8A3FE0' },
];
const avatarHats = () => [
  { id: 'none', label: L('Yok', 'None'), need: 0, emoji: '🚫' },
  { id: 'cap', label: L('Kep', 'Cap'), need: 1, emoji: '🧢' },
  { id: 'party', label: L('Parti', 'Party'), need: 3, emoji: '🎉' },
  { id: 'crown', label: L('Taç', 'Crown'), need: 6, emoji: '👑' },
  { id: 'wizard', label: L('Büyücü', 'Wizard'), need: 10, emoji: '🧙' },
];

const Profiles = {
  _load() {
    try {
      const d = JSON.parse(window.localStorage.getItem(PROFILES_KEY));
      if (d && Array.isArray(d.list) && d.list.length) return d;
    } catch (e) { /* yok say */ }
    return null;
  },
  _save(d) { try { window.localStorage.setItem(PROFILES_KEY, JSON.stringify(d)); } catch (e) { /* yok say */ } },
  exists() { return !!this._load(); },
  all() { const d = this._load(); return d ? d.list : []; },
  active() {
    const d = this._load();
    if (!d) return { id: 'p1', name: '', color: 'yellow', hat: 'none' };
    const p = d.list.find((x) => x.id === d.active) || d.list[0];
    return {
      id: String(p.id || 'p1').replace(/[^a-z0-9]/gi, '').slice(0, 12) || 'p1',
      name: String(p.name || '').slice(0, 12),
      color: ['yellow', 'blue', 'green', 'pink', 'purple'].includes(p.color) ? p.color : 'yellow',
      hat: ['none', 'cap', 'party', 'crown', 'wizard'].includes(p.hat) ? p.hat : 'none',
    };
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

function avatarBodySrc(pose, color) {
  const rel = (!color || color === 'yellow') ? `mascot/mascot_${pose}.png` : `mascot/avatar/${pose}_${color}.png`;
  return new URL(rel, ASSET_BASE_URL).href;
}
function avatarHatStyle(pose) {
  const a = AVATAR_ANCHORS[pose] || AVATAR_ANCHORS.idle;
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
  ['pointerdown', 'click', 'touchstart'].forEach((t) => container.addEventListener(t, swallow, true));
  const fresh = (n) => n.nodeType === 1 && (n.matches('.ke-quiz-card, .ke-category-card, .ke-profile-screen, .ke-landing-header, .ke-shell-inner') || n.querySelector('.ke-quiz-card, .ke-category-card, .ke-profile-screen, .ke-landing-header'));
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
  container.innerHTML = STYLE + `
    <div class="ke-shell">
      <button class="ke-fullscreen-btn" id="keFullscreenBtn" title="${L('Tam ekran', 'Full screen')}" aria-label="${L('Tam ekran', 'Full screen')}">${ICON_EXPAND}<span id="keFullscreenLabel">${L('Tam Ekran', 'Full screen')}</span></button>
      <div class="ke-screen-host" id="keScreenHost"></div>
    </div>
  `;

  if (window.KE_STATIC) container.querySelector('.ke-shell').classList.add('ke-fs');
  installTransitionGuard(container);
  setupFullscreen(container);
  primeMicrophonePermission();
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => { _voiceLookupDone = false; };
  }

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
const SECTIONS = [
  { id: 'words', title: 'Words', sub: 'Themed word categories', subTr: 'Temalı kelime kategorileri', titleTr: 'Kelimeler', motif: '📚',
    theme: { c: '#FFA000', dark: '#DB8A00', tint: '#FFCF66' },
    pick: (c) => !GRAMMAR_CATEGORY_IDS.includes(c.id) && !QA_CATEGORY_IDS.includes(c.id) },
  { id: 'grammar', title: 'Grammar', sub: 'Prepositions: in, on, at, under…', subTr: 'Edatlar: in, on, at, under…', titleTr: 'Gramer', motif: '🧩',
    theme: { c: '#00ACC1', dark: '#008BA0', tint: '#5DD6E6' },
    pick: (c) => GRAMMAR_CATEGORY_IDS.includes(c.id) },
  { id: 'qa', title: 'Questions', sub: 'Who, What, Where, When, Why, Which', subTr: 'Kim, Ne, Nerede, Ne zaman, Neden, Hangi', titleTr: 'Soru-Cevap', motif: '❓',
    theme: { c: '#FF7043', dark: '#E5562B', tint: '#FFA383' },
    pick: (c) => QA_CATEGORY_IDS.includes(c.id) },
  { id: 'a2', title: 'A2 Level', sub: 'New words & sentences (coming soon)', subTr: 'Yeni kelimeler ve cümleler (yakında)', titleTr: 'A2 Seviyesi', motif: '🚀', locked: true,
    theme: { c: '#78909C', dark: '#5F7480', tint: '#A8BBC5' },
    pick: () => false },
  { id: 'get', title: 'Get', sub: 'get up, get in, get on… (coming soon)', subTr: 'get up, get in, get on… (yakında)', titleTr: 'Get', motif: '🔄', locked: true,
    theme: { c: '#78909C', dark: '#5F7480', tint: '#A8BBC5' },
    pick: () => false },
];
let _currentSection = null;

function showSectionMenu(container, api, toolId, categories) {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  _currentSection = null;
  const host = container.querySelector('#keScreenHost');
  const waveSrc = new URL('mascot/mascot_wave.png', ASSET_BASE_URL).href;
  host.innerHTML = `
    ${avatarLandingHTML('wave')}
    <div class="ke-landing-header">
      <button type="button" class="ke-profile-chip" id="keProfileBtn"><span class="ke-avatar-mini"><img class="ke-av-body" src="${avatarBodySrc('wave', Profiles.active().color)}" alt="" draggable="false" /></span>${escapeProfileText(Profiles.active().name || L('Ben', 'Me'))} · ${Progress.totalStars()} ⭐ · ${L("Aktapokus'um", 'My Aktapokus')} ✏️</button>
      <h1 class="ke-title">${bubbleTitleHTML(L("Aktapokus'un Kelime Safarisi", "Aktapokus Word Safari"))}</h1>
      <p class="ke-subtitle">${L('Ne öğrenmek istiyorsun? Bir bölüm seç!', 'What do you want to learn? Pick a section!')}</p>
    </div>
    <div style="text-align:center;margin:0 0 12px;">
      <button type="button" id="keSoundTest" style="font-size:12px !important;padding:6px 14px !important;">🔊 ${L('Ses testi', 'Sound test')}</button>
      <button type="button" id="keLangBtn" style="font-size:12px !important;padding:6px 14px !important;margin-left:6px;">🌐 ${_lang === 'tr' ? 'English' : 'Türkçe'}</button>
      <div id="keSoundInfo" style="margin-top:6px;font-size:11.5px;color:var(--kb-chalk-dim);font-weight:700;"></div>
      ${window.KE_STATIC ? `<div style="margin-top:8px;font-size:13px;font-weight:700;"><a href="privacy.html" style="color:var(--kb-chalk-dim);">${L('Gizlilik', 'Privacy')}</a> · <a href="https://github.com/aktapokus/kids-english/issues" target="_blank" rel="noopener noreferrer" style="color:var(--kb-chalk-dim);">${L('Sorun bildir', 'Report a problem')}</a></div>` : ''}
    </div>
    <div class="ke-category-grid" id="keSectionGrid"></div>
  `;
  host.querySelector('#keSoundTest').addEventListener('click', () => runSoundTest(host.querySelector('#keSoundInfo')));
  host.querySelector('#keLangBtn').addEventListener('click', () => { setLang(_lang === 'tr' ? 'en' : 'tr'); showSectionMenu(container, api, toolId, categories); });
  host.querySelector('#keProfileBtn').addEventListener('click', () => showProfileScreen(container, api, toolId, categories, {}));
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
  let msg = '';

  function draw() {
    const profiles = Profiles.all();
    const colorBtns = avatarColors().map((c) => {
      const lock = stars < c.need;
      return `<button type="button" class="ke-pick${draft.color === c.id ? ' ke-sel' : ''}${lock ? ' ke-lock' : ''}" data-color="${c.id}" aria-label="${c.label}"><span class="ke-sw" style="background:${c.swatch}"></span>${lock ? ` 🔒${c.need}⭐` : ''}</button>`;
    }).join('');
    const hatBtns = avatarHats().map((h) => {
      const lock = stars < h.need;
      return `<button type="button" class="ke-pick${draft.hat === h.id ? ' ke-sel' : ''}${lock ? ' ke-lock' : ''}" data-hat="${h.id}" aria-label="${h.label}">${h.emoji}${lock ? ` 🔒${h.need}⭐` : ''}</button>`;
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
        <div class="ke-pl-label" id="keProfileMsg">${msg || L(`Kazandığın yıldız: ${stars} ⭐ — bölüm bitirdikçe yeni renk ve şapkalar açılır!`, `Stars earned: ${stars} ⭐ — finish episodes to unlock new colors and hats!`)}</div>
        <div style="margin-top:8px;"><button type="button" id="keProfileSave">${first ? L('Başla! 🚀', "Let's go! 🚀") : L('Kaydet ✓', 'Save ✓')}</button></div>
        ${switcher}
      </div>`;
    const nameEl = host.querySelector('#keProfileName');
    nameEl.addEventListener('input', () => { draft.name = nameEl.value; });
    host.querySelectorAll('[data-color]').forEach((b) => b.addEventListener('click', () => {
      const c = avatarColors().find((x) => x.id === b.dataset.color);
      if (stars < c.need) { msg = L(`🔒 ${c.label} rengi için ${c.need} ⭐ gerekli (şu an ${stars})`, `🔒 ${c.label} needs ${c.need} ⭐ (you have ${stars})`); draw(); return; }
      draft.color = c.id; msg = ''; draw();
    }));
    host.querySelectorAll('[data-hat]').forEach((b) => b.addEventListener('click', () => {
      const h = avatarHats().find((x) => x.id === b.dataset.hat);
      if (stars < h.need) { msg = L(`🔒 ${h.label} için ${h.need} ⭐ gerekli (şu an ${stars})`, `🔒 ${h.label} needs ${h.need} ⭐ (you have ${stars})`); draw(); return; }
      draft.hat = h.id; msg = ''; draw();
    }));
    host.querySelector('#keProfileSave').addEventListener('click', () => {
      draft.name = (draft.name || '').trim() || L('Arkadaşım', 'Friend');
      Profiles.save(draft);
      showSectionMenu(container, api, toolId, categories);
    });
    const back = host.querySelector('#keProfileBack');
    if (back) back.addEventListener('click', () => showSectionMenu(container, api, toolId, categories));
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
    const theme = CATEGORY_THEME[c.id] || { c: '#4A90E2', dark: '#3A78C2', tint: '#E9F1FC' };
    card.style.setProperty('--cc-tint', theme.tint);
    card.style.setProperty('--cc-dark', theme.dark);
    card.setAttribute('data-initial', initial);

    const prog = Progress.getCategory(c.id);
    const doneCount = prog.completed.length;
    const missedCount = Object.keys(prog.missed).length;
    const inProgress = doneCount > 0 && doneCount < c.episode_count;
    const metaText = doneCount > 0
      ? L(`${doneCount} / ${c.episode_count} bölüm tamamlandı ⭐`, `${doneCount} / ${c.episode_count} episodes done ⭐`)
      : L(`${c.word_count} kelime · ${c.episode_count} bölüm`, `${c.word_count} words · ${c.episode_count} episodes`);
    const pct = c.episode_count ? Math.round((doneCount / c.episode_count) * 100) : 0;
    const nextEp = Progress.nextIncompleteEpisode(c.id, c.episode_count);
    const motif = CATEGORY_MOTIF[c.id] || '⭐';

    card.innerHTML = `
      <div class="ke-category-icon" style="color:${theme.c}">${initial}<span class="ke-cat-motif-badge">${motif}</span></div>
      <div class="ke-category-text">
        <div class="ke-category-title">${titleTr}</div>
        <div class="ke-category-meta">${metaText}</div>
        ${doneCount > 0 ? `<div class="ke-cat-progress-track"><div class="ke-cat-progress-fill" style="width:${pct}%"></div></div>` : ''}
        ${inProgress ? `<div class="ke-cat-next-ep">${L('Sıradaki: Bölüm', 'Next: Episode')} ${nextEp + 1}</div>` : ''}
      </div>
      ${missedCount >= 3 ? `<div class="ke-review-chip" data-review-cat="${c.id}" role="button" tabindex="0" title="${L('Zorlandığın kelimeleri tekrar et', 'Review the words you missed')}">🔁 ${missedCount}</div>` : ''}
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
  const host = container.querySelector('#keScreenHost');
  const titleTr = catLabel({ title: episode.category_title });
  const theme = CATEGORY_THEME[episode.category_id] || { c: '#4A90E2', dark: '#3A78C2', tint: '#E9F1FC' };
  const motif = SCENE_MOTIF[episode.category_id];

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

  host.querySelector('#keBackBtn').addEventListener('click', () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (container._keActiveRecognition) {
      try { container._keActiveRecognition.abort(); } catch (e) { /* no-op */ }
      container._keActiveRecognition = null;
    }
    showCategoryGrid(container, api, toolId, categories);
  });

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
let _cachedMaleVoice = null;
let _voiceLookupDone = false;

function pickMaleVoice() {
  if (_voiceLookupDone) return _cachedMaleVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null; // henüz yüklenmedi, bir sonraki çağrıda tekrar denenir
  const enVoices = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
  // İngilizce ses YOKSA voices[0]'a düşmüyoruz: Android'de bu genelde
  // Türkçe/başka dilde bir ses oluyor ve utter.lang ile çelişince cihaz
  // SESSİZ kalıyordu.
  _cachedMaleVoice = enVoices.find((v) => MALE_VOICE_HINTS.some((hint) => v.name.includes(hint)))
    || enVoices[0] || null;
  _voiceLookupDone = true;
  return _cachedMaleVoice;
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
function pickDistractorWord(tokens, wordList, currentWord) {
  const clean = (s) => s.toLowerCase().replace(/[.,!?]/g, '');
  const tokenSet = new Set(tokens.map(clean));
  const pool = wordList
    .map((o) => o.word)
    .filter((w) => clean(w) !== clean(currentWord) && !tokenSet.has(clean(w)));
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
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
        showCelebration(host, container, episode, wordList, score, onDone);
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
      showCelebration(host, container, episode, wordList, score, onDone);
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

function showCelebration(host, container, episode, wordList, score, onDone) {
  if (episode.isReview) {
    Progress.clearMistakes(episode.category_id, wordList.map((o) => o.word));
  } else {
    Progress.markComplete(episode.category_id, episode.episode_index);
  }
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

export function unmount(container) {
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
