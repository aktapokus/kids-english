// Sunucu adresi tek yerde: server-config.js
const SUPABASE_URL = (window.KE_SERVER && window.KE_SERVER.url) || 'https://wtrkfzmmhabcpoipaccf.supabase.co';
const SUPABASE_KEY = (window.KE_SERVER && window.KE_SERVER.key) || 'sb_publishable_87EZgr1ftB1SnIY5FoDaKA_xmxlD7kU';
const SESSION_KEY = 'ke_teacher_session_v1';

function saveSession(s) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) {} }
function loadSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; } }
function clearSession() { try { localStorage.removeItem(SESSION_KEY); } catch (e) {} }

// Giris oturumu (access_token) 1 saatte doluyor. Eskiden yenilenmiyordu:
// sekmeyi acik birakan ogretmen "JWT expired" hatasi alip tekrar giris
// yapmak zorunda kaliyordu. Artik 401'de refresh_token ile bir kez
// yenileyip istegi tekrarliyoruz.
async function refreshSession() {
  const session = loadSession();
  if (!session || !session.refresh_token) return false;
  const res = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!res.ok) return false;
  saveSession(await res.json());
  return true;
}

async function authFetch(path, opts, retried) {
  opts = opts || {};
  const session = loadSession();
  const headers = Object.assign({
    'Content-Type': 'application/json',
    apikey: SUPABASE_KEY,
    Authorization: 'Bearer ' + (session ? session.access_token : SUPABASE_KEY),
  }, opts.headers || {});
  const res = await fetch(SUPABASE_URL + path, Object.assign({}, opts, { headers }));
  if (res.status === 401 && session && !retried && !path.startsWith('/auth/')) {
    if (await refreshSession()) return authFetch(path, opts, true);
    clearSession();
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('authCard').classList.remove('hidden');
    setMsg(document.getElementById('authMsg'), 'Oturumun sona erdi, lütfen tekrar giriş yap.', 'err');
    throw new Error('Oturum sona erdi');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error_description || body.msg || body.message || ('HTTP ' + res.status));
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function setMsg(el, text, kind) {
  el.textContent = text || '';
  el.className = 'msg' + (kind ? ' ' + kind : '');
}

async function signIn() {
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPass').value;
  const msgEl = document.getElementById('authMsg');
  setMsg(msgEl, 'Giriş yapılıyor...');
  try {
    const data = await authFetch('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) });
    saveSession(data);
    showDashboard();
  } catch (e) { setMsg(msgEl, e.message, 'err'); }
}

async function sendRecoveryEmail() {
  const email = document.getElementById('recoverEmail').value.trim();
  const msgEl = document.getElementById('recoverMsg');
  if (!email) return;
  setMsg(msgEl, 'Gönderiliyor...');
  try {
    const redirectTo = location.origin + location.pathname;
    await fetch(SUPABASE_URL + '/auth/v1/recover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY },
      body: JSON.stringify({ email, options: { redirect_to: redirectTo } }),
    });
    // Supabase, hesap var mi yok mu sizmasin diye burada hep basariliymis
    // gibi davranir - gercekte kayitli bir e-postaysa link gider.
    setMsg(msgEl, 'E-postan kayıtlıysa bir sıfırlama linki gönderildi. Gelen kutunu kontrol et.', 'ok');
  } catch (e) { setMsg(msgEl, 'Bağlanılamadı, internetini kontrol et.', 'err'); }
}

async function setNewPassword(recoveryToken) {
  const pass = document.getElementById('newPassword').value;
  const msgEl = document.getElementById('newPasswordMsg');
  if (pass.length < 6) { setMsg(msgEl, 'Şifre en az 6 karakter olmalı.', 'err'); return; }
  setMsg(msgEl, 'Kaydediliyor...');
  try {
    const res = await fetch(SUPABASE_URL + '/auth/v1/user', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: 'Bearer ' + recoveryToken },
      body: JSON.stringify({ password: pass }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).msg || 'HTTP ' + res.status);
    setMsg(msgEl, 'Şifren güncellendi! Şimdi giriş yapabilirsin.', 'ok');
    setTimeout(() => {
      history.replaceState(null, '', location.pathname);
      document.getElementById('newPasswordForm').classList.add('hidden');
      document.getElementById('loginForm').classList.remove('hidden');
    }, 1500);
  } catch (e) { setMsg(msgEl, e.message, 'err'); }
}

// Sayfa, Supabase'in gonderdigi sifirlama linkinden #access_token=...&type=recovery
// ile acildiysa - normal giris formu yerine "yeni sifre belirle" formunu goster.
function checkRecoveryLink() {
  const hash = new URLSearchParams(location.hash.slice(1));
  if (hash.get('type') !== 'recovery' || !hash.get('access_token')) return false;
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('recoverForm').classList.add('hidden');
  document.getElementById('newPasswordForm').classList.remove('hidden');
  document.getElementById('setNewPasswordBtn').addEventListener('click', () => setNewPassword(hash.get('access_token')));
  return true;
}

async function signUp() {
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPass').value;
  const msgEl = document.getElementById('authMsg');
  if (password.length < 6) { setMsg(msgEl, 'Şifre en az 6 karakter olmalı.', 'err'); return; }
  setMsg(msgEl, 'Hesap oluşturuluyor...');
  try {
    const data = await authFetch('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (data.access_token) { saveSession(data); showDashboard(); }
    else setMsg(msgEl, 'Hesap oluşturuldu. E-postanı onayladıktan sonra giriş yap.', 'ok');
  } catch (e) { setMsg(msgEl, e.message, 'err'); }
}

let _classNames = {};
let _classAssign = {};
let _hasAssign = false;
async function loadClasses() {
  const listEl = document.getElementById('classList');
  listEl.innerHTML = '<p class="empty">Yükleniyor...</p>';
  let classes;
  try { classes = await authFetch('/rest/v1/classes?select=id,name,code,assignment&order=created_at.desc'); _hasAssign = true; }
  catch (e0) {
    try { classes = await authFetch('/rest/v1/classes?select=id,name,code&order=created_at.desc'); _hasAssign = false; }
    catch (e) { listEl.innerHTML = '<p class="empty">Sınıflar yüklenemedi: ' + e.message + '</p>'; return; }
  }
  _classAssign = Object.fromEntries(classes.map((c) => [c.id, c.assignment || null]));
  if (!classes.length) { listEl.innerHTML = '<p class="empty">Henüz bir sınıfın yok. Yukarıdan bir tane oluştur.</p>'; return; }
  listEl.innerHTML = '';
  _classNames = Object.fromEntries(classes.map((c) => [c.id, c.name]));
  classes.forEach((c) => {
    const div = document.createElement('div');
    div.className = 'class-item';
    div.innerHTML = `
      <div class="class-head" data-id="${c.id}">
        <span class="class-name">${escapeHtml(c.name)}</span>
        <span class="class-code">${escapeHtml(c.code)}</span>
      </div>
      <div class="roster hidden" id="roster-${c.id}"><p class="empty">Yükleniyor...</p></div>
    `;
    div.querySelector('.class-head').addEventListener('click', () => toggleRoster(c.id));
    listEl.appendChild(div);
  });
}

// Uygulamanin kendi icerik dosyasi (ayni sitede) - kategori adlari ve her
// bolumun kelime sayisi. Boylece "Kelime" tahmini degil, bitirilen
// bolumlerin gercek kelime toplami olarak hesaplanabiliyor.
let _catalog = null;
async function loadCatalog() {
  if (_catalog) return _catalog;
  try {
    const d = await (await fetch('data/episodes.json')).json();
    _catalog = {};
    d.categories.forEach((c) => {
      _catalog[c.id] = {
        title: String(c.title).split('–').pop().trim(),
        sizes: c.episodes.map((e) => (e.objects || e.conversation || []).length || 0),
        total: c.episode_count,
      };
    });
  } catch (e) { _catalog = {}; }
  return _catalog;
}

function timeAgo(iso) {
  if (!iso) return '—';
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 2) return 'şimdi';
  if (min < 60) return min + ' dk önce';
  if (min < 60 * 24) return Math.round(min / 60) + ' sa önce';
  return Math.round(min / 1440) + ' gün önce';
}

function studentDetail(s, catalog) {
  const p = s.progress;
  if (!p || !p.cats) return '<p class="empty">Ayrıntılı ilerleme henüz gelmedi (öğrencinin uygulamayı güncel sürümle bir kez açması gerekiyor).</p>';
  const rows = Object.keys(p.cats).map((cid) => {
    const info = catalog[cid] || (cid === 'math_challenge' ? { title: 'Math Challenge (seviye)', total: 6 } : cid.startsWith('story_') ? { title: 'Macera Kitabı: ' + cid.slice(6), total: 1 } : { title: cid, total: '?' });
    return `<li><b>${escapeHtml(info.title)}</b> — ${p.cats[cid].length}/${info.total} bölüm</li>`;
  }).join('');
  const hard = (p.hard || []).map((h) => `<span class="chip">${escapeHtml(h[1])} <small>×${h[2]}</small></span>`).join(' ');
  const les = Array.isArray(p.lessons) ? p.lessons.length : 0;
  return `<div class="detail"><div><b>Günlük dersler</b><p>📘 ${les ? les + ' ders bitirdi' : 'Henüz ders yapmadı'}</p><b>Bitirilen bölümler</b><ul>${rows || '<li>Henüz yok</li>'}</ul></div>
    <div><b>Zorlandığı kelimeler</b><div class="chips">${hard || '<span class="empty">Henüz yok 👍</span>'}</div></div></div>`;
}

// Uygulamadaki Uzay Macerasi basamaklari (panel.js JOURNEY_SECTORS ile
// ayni sira - MEB Maarif programi: 2. sinif = A1.1 ...). Iki yerde
// tutuluyor; panel.js'te sira degisirse burasi da guncellenmeli.
const GRADE_STEPS = [
  ['2. Sınıf · A1.1', ['school_education', 'expressions', 'classroom_life', 'days_week', 'conv_social_manners', 'conv_school', 'math_numbers', 'family_people', 'conv_family_home', 'body_health', 'animals', 'food_drinks', 'conv_food_drinks', 'home', 'clothes_shopping', 'weather_seasons', 'conv_weather_seasons']],
  ['3. Sınıf · A1.2', ['daily_life', 'conv_daily_routine', 'months_time', 'months_seasons', 'emotions_personality', 'conv_feelings_preferences', 'hobbies_free_time', 'sports_exercise', 'conv_hobbies_sports', 'nature_environment', 'conv_animals_nature', 'question_words', 'prepositions', 'math_shapes']],
  ['4. Sınıf · A1.3', ['jobs_professions', 'conv_jobs_safety', 'city_places', 'conv_city_transport', 'travel_transportation', 'countries', 'conv_travel', 'conv_shopping_clothes', 'conv_health', 'opposites', 'math_operations', 'conv_celebrations', 'telling_time', 'irregular_verbs', 'time_machine', 'conv_past', 'conv_plans', 'get']],
  ['Bonus · A1+', ['technology_computers', 'conv_technology', 'communication_internet', 'science', 'space_astronomy', 'conv_space']],
  ['5. Sınıf · A2.1', ['daily_life', 'family_people', 'school_education', 'classroom_life', 'body_health', 'clothes_shopping', 'food_drinks', 'animals', 'nature_environment', 'city_places', 'hobbies_free_time', 'irregular_verbs', 'have_to'].map((x) => x + '_a2')],
  ['6. Sınıf · A2.2', ['home', 'jobs_professions', 'travel_transportation', 'emotions_personality', 'weather_seasons', 'sports_exercise', 'technology_computers', 'science', 'communication_internet', 'space_astronomy', 'made_of'].map((x) => x + '_a2')],
  ['7. Sınıf+ · B1', ['travel_transportation_b1']],
];
// MEB Ingilizce Ogretim Programi (Maarif, 2025) tema tablolari (s.30-34)
// x uygulama kategorileri. Ogretmen "gezegen" degil "unite" diliyle
// dusunur (2026-09-27 ogretmen degerlendirmesi). Eslesme en yakin
// kategoriye gore YAKLASIKTIR - panelde de oyle yazar.
const MEB_UNITS = {
  2: [
    ['School Life', 'Okul Hayatı (günler)', ['school_education', 'days_week', 'expressions', 'conv_social_manners', 'conv_school']],
    ['Classroom Life', 'Sınıf Hayatı', ['classroom_life', 'math_numbers']],
    ['Personal Life', 'Kişisel Hayat (günler, yaş, doğum günü, hava)', ['body_health', 'clothes_shopping', 'days_week', 'weather_seasons', 'conv_weather_seasons']],
    ['Family Life', 'Aile Hayatı', ['family_people', 'conv_family_home']],
    ['Homes & Houses & Neighbourhoods', 'Evler ve Mahalle', ['home', 'animals']],
    ['Life in the City & the World', 'Şehirde ve Dünyada Hayat', ['food_drinks', 'conv_food_drinks']],
  ],
  3: [
    ['School Life', 'Okul Hayatı (aylar)', ['school_education', 'months_seasons', 'months_time', 'conv_school']],
    ['Classroom Life', 'Sınıf Hayatı (dersler, mevsimler)', ['classroom_life', 'months_seasons', 'question_words', 'prepositions', 'math_shapes']],
    ['Personal Life', 'Kişisel Hayat', ['body_health', 'emotions_personality', 'conv_feelings_preferences', 'weather_seasons', 'clothes_shopping']],
    ['Family Life', 'Aile Hayatı', ['family_people', 'daily_life', 'conv_daily_routine', 'hobbies_free_time', 'sports_exercise', 'conv_hobbies_sports']],
    ['Homes & Houses & Neighbourhoods', 'Evler ve Mahalle (kır, çiftlik)', ['nature_environment', 'animals', 'conv_animals_nature']],
    ['Life in the City & the World', 'Şehirde ve Dünyada Hayat', ['food_drinks', 'conv_food_drinks']],
  ],
  4: [
    ['School Life', 'Okul Hayatı', ['daily_life', 'school_education', 'time_machine']],
    ['Classroom Life', 'Sınıf Hayatı (şimdi ve geçmişte, saat)', ['telling_time', 'irregular_verbs', 'time_machine', 'conv_past', 'months_time', 'math_operations']],
    ['Personal Life', 'Kişisel Hayat (karşılaştırmalar)', ['opposites', 'hobbies_free_time', 'weather_seasons', 'clothes_shopping']],
    ['Family Life', 'Aile Hayatı (meslekler, hizmet yerleri)', ['jobs_professions', 'conv_jobs_safety', 'city_places', 'conv_city_transport', 'get']],
    ['Homes & Houses & the Neighbourhood', 'Evler ve Mahalle (deniz kıyısı)', ['animals', 'nature_environment']],
    ['Life in the City & the World', 'Şehirde ve Dünyada Hayat (ülkeler, tatil)', ['food_drinks', 'countries', 'travel_transportation', 'conv_travel', 'conv_plans', 'conv_health', 'conv_celebrations']],
  ],
  5: [
    ['School Life', 'Okul Hayatı (kurallar, kulüpler)', ['school_education_a2', 'have_to_a2', 'countries']],
    ['Classroom Life', 'Sınıf Hayatı (kurallar, ders programı)', ['classroom_life_a2', 'have_to_a2', 'daily_life_a2']],
    ['Personal Life', 'Kişisel Hayat', ['body_health_a2', 'clothes_shopping_a2', 'daily_life_a2']],
    ['Family Life', 'Aile Hayatı (rutinler, hobiler)', ['family_people_a2', 'hobbies_free_time_a2', 'irregular_verbs_a2']],
    ['Life in the Neighbourhood & City', 'Mahallede ve Şehirde Hayat', ['city_places_a2']],
    ['Life in the World', 'Dünyada Hayat (yemek)', ['food_drinks_a2']],
    ['Life in Nature', 'Doğada Hayat', ['animals_a2', 'nature_environment_a2']],
    ['Life in the Universe & Future', 'Evren ve Gelecek (tatil planları)', ['nature_environment_a2', 'conv_plans']],
  ],
  6: [
    ['School Life', 'Okul Hayatı', ['school_education_a2', 'daily_life_a2']],
    ['Classroom Life', 'Sınıf Hayatı', ['classroom_life_a2']],
    ['Personal Life', 'Kişisel Hayat (görünüş, kişilik)', ['emotions_personality_a2', 'clothes_shopping_a2']],
    ['Family Life', 'Aile Hayatı (meslekler, evler)', ['jobs_professions_a2', 'home_a2']],
    ['Life in the Neighbourhood & City', 'Mahallede ve Şehirde Hayat (ulaşım)', ['travel_transportation_a2', 'conv_city_transport']],
    ['Life in the World & Culture', 'Dünyada Hayat ve Kültür', ['countries', 'conv_travel', 'made_of_a2']],
    ['Life in Nature & Global Problems', 'Doğa ve Küresel Sorunlar', ['nature_environment_a2', 'weather_seasons_a2', 'science_a2']],
    ['Life in the Universe & Future', 'Evren ve Gelecek', ['space_astronomy_a2', 'technology_computers_a2', 'communication_internet_a2']],
  ],
};

// Sinif adindaki ilk rakam (ör. "3-A") -> varsayilan sinif duzeyi
function gradeFromClassName(name) {
  const m = String(name || '').match(/[2-6]/);
  return m ? Number(m[0]) : 2;
}

// Bir kategori icin sinif durumu: bitiren / baslayan / toplam ogrenci
function unitCategoryStats(cid, students, catalog) {
  const info = catalog[cid];
  let done = 0, started = 0;
  students.forEach((s) => {
    const p = s.progress; if (!p || !p.cats) return;
    const skipped = new Set(p.skipped || []);
    const n = (p.cats[cid] || []).length;
    if (skipped.has(cid) || (info && n >= info.total)) done++;
    else if (n > 0) started++;
  });
  return { done, started, total: students.length };
}

function unitsHTML(grade, students, catalog) {
  const themes = MEB_UNITS[grade] || [];
  return themes.map(([en, tr, ids], i) => {
    const chips = ids.filter((id) => catalog[id]).map((id) => {
      const st = unitCategoryStats(id, students, catalog);
      const label = (id.startsWith('conv_') ? '💬 ' : '') + catalog[id].title + (id.endsWith('_a2') ? ' · A2' : '');
      return `<span class="chip" title="${escapeHtml(id)}">${escapeHtml(label)} <small>✓${st.done} · ▶${st.started} / ${st.total}</small></span>`;
    }).join(' ');
    return `<div class="unit"><div class="unit-head"><b>${i + 1}. ${escapeHtml(en)}</b> <span>${escapeHtml(tr)}</span></div><div class="chips">${chips || '<span class="empty">—</span>'}</div></div>`;
  }).join('');
}

function renderUnits(box, grade, students, catalog) {
  box.innerHTML = `
    <div class="units-tabs">${[2, 3, 4, 5, 6].map((g) => `<button type="button" class="secondary units-tab${g === grade ? ' on' : ''}" data-g="${g}">${g}. sınıf</button>`).join('')}</div>
    <p class="note">Programın tema tablosu × uygulamadaki en yakın kategoriler (yaklaşık eşleşme). ✓ bitiren · ▶ başlayan / sınıftaki öğrenci.</p>
    ${unitsHTML(grade, students, catalog)}`;
  box.querySelectorAll('.units-tab').forEach((b) => b.addEventListener('click', () => renderUnits(box, Number(b.dataset.g), students, catalog)));
}

// ---- Haftanin gorevi (2026-09-27) ----
// Ogretmen sinifina kategori(ler) + istege bagli "zorlandigin kelimeleri
// tekrar et" + kisa not + son gun verir; ogrenci ana ekranda gorur.
// Veri: classes.assignment (meb_research/assignment_schema.sql).
const TASK_MAX_ITEMS = 6;
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return isNaN(d) ? '' : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}
// Baslangic sinifi (2026-09-28): ogrenci cihazinda Macera bu istasyondan
// baslar (panel.js applyTeacherStart). Gorev alaninda saklanir.
const START_SECTORS = [['', 'Varsayılan: 2. sınıf (Ay)'], ['mars', '3. Sınıf · Mars'], ['jupiter', '4. Sınıf · Jüpiter'], ['neptune', '5. Sınıf · Neptün (A2)'], ['galaxy', '6. Sınıf · Galaksi (A2)'], ['nebula', '7. Sınıf+ · Nebula (B1)']];
const startLabel = (id) => (START_SECTORS.find((x) => x[0] === id) || [null, ''])[1];
function taskSummaryHTML(a, students, catalog) {
  const items = (a.items || []).filter((id) => catalog[id]).map((id) => {
    const st = unitCategoryStats(id, students, catalog);
    return `<li><b>${escapeHtml(catalog[id].title)}${id.endsWith('_a2') ? ' · A2' : ''}</b> <small>✓${st.done} · ▶${st.started} / ${st.total}</small></li>`;
  }).join('');
  return `${a.start_sector ? `<p class="note">🎯 Başlangıç sınıfı: <b>${escapeHtml(startLabel(a.start_sector))}</b></p>` : ''}<ul class="task-list">${items}${a.review ? '<li>🔁 Zorlandığı kelimeleri tekrar</li>' : ''}</ul>
    ${a.note ? `<p class="note">📝 ${escapeHtml(a.note)}</p>` : ''}${a.due ? `<p class="note">📅 Son gün: ${escapeHtml(fmtDate(a.due))}</p>` : ''}${a.session_len ? `<p class="note">⏱️ Oturum: ${Number(a.session_len)} bölüm</p>` : ''}`;
}
async function saveTask(classId, assignment) {
  const rows = await authFetch(`/rest/v1/classes?id=eq.${classId}`, {
    method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ assignment }),
  });
  if (Array.isArray(rows) && !rows.length) throw new Error('Kaydetme izni yok.');
  _classAssign[classId] = assignment;
}
function renderTask(box, classId, grade, students, catalog) {
  if (!_hasAssign) {
    box.innerHTML = '<p class="note">Bu özellik için veritabanı güncellemesi gerekiyor (assignment_schema.sql bir kez çalıştırılmalı).</p>';
    return;
  }
  const a = _classAssign[classId];
  if (a && ((a.items || []).length || a.review || a.start_sector)) {
    box.innerHTML = `${taskSummaryHTML(a, students, catalog)}
      <div class="row"><button type="button" class="secondary" data-act="edit">Değiştir</button><button type="button" class="secondary" data-act="clear">Kaldır</button></div>`;
    box.querySelector('[data-act="edit"]').addEventListener('click', () => renderTaskEditor(box, classId, grade, students, catalog));
    box.querySelector('[data-act="clear"]').addEventListener('click', async () => {
      if (!window.confirm('Görev kaldırılsın mı? (Başlangıç sınıfı korunur.)')) return;
      try { await saveTask(classId, a.start_sector ? { v: 1, items: [], review: false, start_sector: a.start_sector } : null); renderTask(box, classId, grade, students, catalog); } catch (e) { window.alert('Kaldırılamadı: ' + e.message); }
    });
    return;
  }
  box.innerHTML = '<p class="note">Henüz görev yok. Öğrenciler görevi uygulamanın ana ekranında görür.</p><button type="button" class="secondary" data-act="edit">Görev ver</button>';
  box.querySelector('[data-act="edit"]').addEventListener('click', () => renderTaskEditor(box, classId, grade, students, catalog));
}
function renderTaskEditor(box, classId, grade, students, catalog, draft) {
  const cur = _classAssign[classId] || {};
  const chosen = draft || new Set(cur.items || []);
  const syncPicks = () => box.querySelectorAll('input[type=checkbox][value]').forEach((c) => { if (c.checked) chosen.add(c.value); else chosen.delete(c.value); });
  const themes = MEB_UNITS[grade] || [];
  box.innerHTML = `
    <div class="units-tabs">${[2, 3, 4, 5, 6].map((g) => `<button type="button" class="secondary units-tab${g === grade ? ' on' : ''}" data-g="${g}">${g}. sınıf</button>`).join('')}</div>
    <p class="note">En fazla ${TASK_MAX_ITEMS} kategori seç.</p>
    ${themes.map(([en, tr, ids]) => `<div class="unit"><div class="unit-head"><b>${escapeHtml(en)}</b> <span>${escapeHtml(tr)}</span></div>
      <div class="chips">${ids.filter((id) => catalog[id]).map((id) => `<label class="pick"><input type="checkbox" value="${id}"${chosen.has(id) ? ' checked' : ''}> ${(id.startsWith('conv_') ? '💬 ' : '') + escapeHtml(catalog[id].title)}${id.endsWith('_a2') ? ' · A2' : ''}</label>`).join('')}</div></div>`).join('')}
    <label class="pick"><input type="checkbox" id="tReview"${cur.review ? ' checked' : ''}> 🔁 Zorlandığı kelimeleri tekrar etsin</label>
    <label for="tNote">Not (isteğe bağlı)</label><input id="tNote" maxlength="200" value="${escapeHtml(cur.note || '')}" placeholder="ör. Cuma günü sınıfta bu kelimelerle oyun oynayacağız!">
    <label for="tStart">Başlangıç sınıfı (öğrencilerin Macera'sı bu sınıftan başlar; önceki istasyonlar "geçildi" sayılır)</label>
    <select id="tStart">${START_SECTORS.map(([v, l]) => `<option value="${v}"${String(cur.start_sector || '') === v ? ' selected' : ''}>${l}</option>`).join('')}</select>
    <label for="tSess">Oturum uzunluğu (bu kadar bölümden sonra "devam mı, yarın mı?" sorulur)</label>
    <select id="tSess">${[['', 'Varsayılan (2 bölüm)'], ['1', '1 bölüm'], ['2', '2 bölüm'], ['3', '3 bölüm']].map(([v, l]) => `<option value="${v}"${String(cur.session_len || '') === v ? ' selected' : ''}>${l}</option>`).join('')}</select>
    <label for="tDue">Son gün (isteğe bağlı)</label><input id="tDue" type="date" value="${escapeHtml(cur.due || '')}">
    <div class="row"><button type="button" data-act="save">Kaydet</button><button type="button" class="secondary" data-act="cancel">Vazgeç</button></div>
    <div class="msg" id="tMsg-${classId}"></div>`;
  box.querySelectorAll('.units-tab').forEach((b) => b.addEventListener('click', () => { syncPicks(); renderTaskEditor(box, classId, Number(b.dataset.g), students, catalog, chosen); }));
  box.querySelector('[data-act="cancel"]').addEventListener('click', () => renderTask(box, classId, grade, students, catalog));
  box.querySelector('[data-act="save"]').addEventListener('click', async () => {
    const msg = box.querySelector(`#tMsg-${classId}`);
    // diger sinif sekmelerinde secilmis olanlar da korunur
    syncPicks();
    const items = [...chosen].slice(0, TASK_MAX_ITEMS);
    const review = box.querySelector('#tReview').checked;
    const start = box.querySelector('#tStart').value || null;
    if (!items.length && !review && !start) { setMsg(msg, 'En az bir kategori, tekrar ya da başlangıç sınıfı seç.', 'err'); return; }
    const assignment = { v: 1, items, review, note: box.querySelector('#tNote').value.trim().slice(0, 200), due: box.querySelector('#tDue').value || null, session_len: Number(box.querySelector('#tSess').value) || null, start_sector: start, set_at: new Date().toISOString() };
    setMsg(msg, 'Kaydediliyor...');
    try { await saveTask(classId, assignment); renderTask(box, classId, grade, students, catalog); }
    catch (e) { setMsg(msg, 'Kaydedilemedi: ' + e.message, 'err'); }
  });
}

// Ogrencinin bulundugu basamak: tum gezegenleri bitmis/atlanmis ilk
// OLMAYAN basamak. Ilerleme verisi yoksa '—'.
function gradeStep(s, catalog) {
  const p = s.progress;
  if (!p || !p.cats) return { label: '—', pct: null };
  const skipped = new Set(p.skipped || []);
  const cleared = (id) => skipped.has(id) || (catalog[id] && (p.cats[id] || []).length >= catalog[id].total);
  for (const [label, ids] of GRADE_STEPS) {
    const known = ids.filter((id) => catalog[id]);
    const done = known.filter(cleared).length;
    if (done < known.length) return { label, pct: Math.round(done * 100 / Math.max(1, known.length)) };
  }
  return { label: 'Tamamlandı 🏅', pct: 100 };
}

function exactWords(s, catalog) {
  const p = s.progress;
  if (!p || !p.cats) return s.words_learned;
  let n = 0;
  Object.keys(p.cats).forEach((cid) => {
    const info = catalog[cid];
    if (info) p.cats[cid].forEach((i) => { n += info.sizes[i] || 0; });
  });
  return n;
}

async function toggleRoster(classId) {
  const el = document.getElementById('roster-' + classId);
  const wasHidden = el.classList.contains('hidden');
  el.classList.toggle('hidden');
  if (!wasHidden) return;
  renderRoster(classId);
}

async function renderRoster(classId) {
  const el = document.getElementById('roster-' + classId);
  el.innerHTML = '<p class="empty">Yükleniyor...</p>';
  const cols = 'id,name,stars,streak_days,words_learned,minutes_total,updated_at';
  let students;
  let hasDetail = true;
  try {
    students = await authFetch(`/rest/v1/students?class_id=eq.${classId}&select=${cols},progress&order=stars.desc`);
  } catch (e) {
    // sync_v2_schema.sql henuz calistirilmadiysa progress sutunu yok
    try {
      students = await authFetch(`/rest/v1/students?class_id=eq.${classId}&select=${cols}&order=stars.desc`);
      hasDetail = false;
    } catch (e2) { el.innerHTML = '<p class="empty">Yüklenemedi: ' + e2.message + '</p>'; return; }
  }
  if (!students.length) { el.innerHTML = '<p class="empty">Henüz bu sınıfa katılan öğrenci yok. Sınıf kodunu öğrencilerinle paylaş.</p>'; return; }
  const catalog = await loadCatalog();
  el.innerHTML = `<table><thead><tr><th>Öğrenci</th><th>Basamak</th><th>⭐</th><th>🔥</th><th>Kelime</th><th>Dakika</th><th>Son görülme</th><th></th></tr></thead><tbody>
    ${students.map((s) => { const g = gradeStep(s, catalog); return `<tr class="srow" data-id="${s.id}"><td>${hasDetail ? '<span class="caret">▸</span> ' : ''}${escapeHtml(s.name)}</td><td>${escapeHtml(g.label)}${g.pct != null && g.pct < 100 ? ` <small>%${g.pct}</small>` : ''}</td><td>${s.stars}</td><td>${s.streak_days}</td><td>${exactWords(s, catalog)}</td><td>${s.minutes_total}</td><td>${timeAgo(s.updated_at)}</td>
      <td><button type="button" class="del" data-id="${s.id}" data-name="${escapeHtml(s.name)}" title="Öğrenciyi sil" aria-label="Öğrenciyi sil">🗑</button></td></tr>
      ${hasDetail ? `<tr class="drow hidden" id="d-${s.id}"><td colspan="8">${studentDetail(s, catalog)}</td></tr>` : ''}`; }).join('')}
  </tbody></table>`;
  if (hasDetail) {
    const box = document.createElement('div');
    box.className = 'units';
    el.appendChild(Object.assign(document.createElement('h4'), { textContent: '📚 MEB ünitelerine göre' }));
    el.appendChild(box);
    const cls = (_classNames || {})[classId];
    renderUnits(box, gradeFromClassName(cls), students, catalog);
    const tbox = document.createElement('div');
    tbox.className = 'task';
    el.appendChild(Object.assign(document.createElement('h4'), { textContent: '🎯 Haftanın görevi' }));
    el.appendChild(tbox);
    renderTask(tbox, classId, gradeFromClassName(cls), students, catalog);
  }
  el.querySelectorAll('.srow').forEach((r) => r.addEventListener('click', (e) => {
    if (e.target.closest('.del')) return;
    const d = document.getElementById('d-' + r.dataset.id);
    if (d) { d.classList.toggle('hidden'); r.classList.toggle('open'); }
  }));
  el.querySelectorAll('.del').forEach((b) => b.addEventListener('click', async () => {
    if (!window.confirm(`"${b.dataset.name}" sınıftan silinsin mi? Bu geri alınamaz.`)) return;
    try {
      const rows = await authFetch(`/rest/v1/students?id=eq.${b.dataset.id}`, { method: 'DELETE', headers: { Prefer: 'return=representation' } });
      if (Array.isArray(rows) && !rows.length) throw new Error('Silme izni yok — veritabanı güncellemesi (sync_v2_schema.sql) henüz yapılmamış olabilir.');
      renderRoster(classId);
    } catch (e) { window.alert('Silinemedi: ' + e.message); }
  }));
}

async function createClass() {
  const nameEl = document.getElementById('newClassName');
  const msgEl = document.getElementById('createMsg');
  const name = nameEl.value.trim();
  if (!name) return;
  setMsg(msgEl, 'Oluşturuluyor...');
  try {
    const rows = await authFetch('/rest/v1/rpc/create_class', { method: 'POST', body: JSON.stringify({ p_name: name }) });
    const code = rows[0] && rows[0].code;
    setMsg(msgEl, `Oluşturuldu! Sınıf kodu: ${code} — bunu öğrencilerinle paylaş.`, 'ok');
    nameEl.value = '';
    loadClasses();
  } catch (e) { setMsg(msgEl, e.message, 'err'); }
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function showDashboard() {
  document.getElementById('authCard').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  const session = loadSession();
  document.getElementById('whoAmI').textContent = (session && session.user && session.user.email) || '';
  loadClasses();
}

document.getElementById('signInBtn').addEventListener('click', signIn);
document.getElementById('signUpBtn').addEventListener('click', signUp);
document.getElementById('createClassBtn').addEventListener('click', createClass);
document.getElementById('logoutBtn').addEventListener('click', () => {
  clearSession();
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('authCard').classList.remove('hidden');
});
document.getElementById('forgotToggle').addEventListener('click', () => {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('recoverForm').classList.remove('hidden');
});
document.getElementById('backToLoginToggle').addEventListener('click', () => {
  document.getElementById('recoverForm').classList.add('hidden');
  document.getElementById('loginForm').classList.remove('hidden');
});
document.getElementById('sendRecoverBtn').addEventListener('click', sendRecoveryEmail);

// input'lar artik gercek <form> icinde (tarayici/sifre yoneticisi
// otomatik doldurmasi bunu gerektiriyor - "otomatik doldur calismiyor"
// geri bildirimi). Enter'a basinca sayfa yeniden yuklenip state
// kaybolmasin diye submit'i engelliyoruz, ve Enter'i o formun asil
// eylemine bagliyoruz (giristeyse giris, sifirlamadaysa link gonder).
document.getElementById('loginForm').addEventListener('submit', (e) => { e.preventDefault(); signIn(); });
document.getElementById('recoverForm').addEventListener('submit', (e) => { e.preventDefault(); sendRecoveryEmail(); });
document.getElementById('newPasswordForm').addEventListener('submit', (e) => e.preventDefault());

if (!checkRecoveryLink() && loadSession()) showDashboard();
