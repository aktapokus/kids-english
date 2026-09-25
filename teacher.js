const SUPABASE_URL = 'https://wtrkfzmmhabcpoipaccf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_87EZgr1ftB1SnIY5FoDaKA_xmxlD7kU';
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

async function loadClasses() {
  const listEl = document.getElementById('classList');
  listEl.innerHTML = '<p class="empty">Yükleniyor...</p>';
  let classes;
  try { classes = await authFetch('/rest/v1/classes?select=id,name,code&order=created_at.desc'); }
  catch (e) { listEl.innerHTML = '<p class="empty">Sınıflar yüklenemedi: ' + e.message + '</p>'; return; }
  if (!classes.length) { listEl.innerHTML = '<p class="empty">Henüz bir sınıfın yok. Yukarıdan bir tane oluştur.</p>'; return; }
  listEl.innerHTML = '';
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
    const info = catalog[cid] || { title: cid, total: '?' };
    return `<li><b>${escapeHtml(info.title)}</b> — ${p.cats[cid].length}/${info.total} bölüm</li>`;
  }).join('');
  const hard = (p.hard || []).map((h) => `<span class="chip">${escapeHtml(h[1])} <small>×${h[2]}</small></span>`).join(' ');
  return `<div class="detail"><div><b>Bitirilen bölümler</b><ul>${rows || '<li>Henüz yok</li>'}</ul></div>
    <div><b>Zorlandığı kelimeler</b><div class="chips">${hard || '<span class="empty">Henüz yok 👍</span>'}</div></div></div>`;
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
  el.innerHTML = `<table><thead><tr><th>Öğrenci</th><th>⭐</th><th>🔥</th><th>Kelime</th><th>Dakika</th><th>Son görülme</th><th></th></tr></thead><tbody>
    ${students.map((s) => `<tr class="srow" data-id="${s.id}"><td>${hasDetail ? '<span class="caret">▸</span> ' : ''}${escapeHtml(s.name)}</td><td>${s.stars}</td><td>${s.streak_days}</td><td>${exactWords(s, catalog)}</td><td>${s.minutes_total}</td><td>${timeAgo(s.updated_at)}</td>
      <td><button type="button" class="del" data-id="${s.id}" data-name="${escapeHtml(s.name)}" title="Öğrenciyi sil" aria-label="Öğrenciyi sil">🗑</button></td></tr>
      ${hasDetail ? `<tr class="drow hidden" id="d-${s.id}"><td colspan="7">${studentDetail(s, catalog)}</td></tr>` : ''}`).join('')}
  </tbody></table>`;
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
