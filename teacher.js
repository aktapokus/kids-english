const SUPABASE_URL = 'https://wtrkfzmmhabcpoipaccf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_87EZgr1ftB1SnIY5FoDaKA_xmxlD7kU';
const SESSION_KEY = 'ke_teacher_session_v1';

function saveSession(s) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) {} }
function loadSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; } }
function clearSession() { try { localStorage.removeItem(SESSION_KEY); } catch (e) {} }

async function authFetch(path, opts) {
  opts = opts || {};
  const session = loadSession();
  const headers = Object.assign({
    'Content-Type': 'application/json',
    apikey: SUPABASE_KEY,
    Authorization: 'Bearer ' + (session ? session.access_token : SUPABASE_KEY),
  }, opts.headers || {});
  const res = await fetch(SUPABASE_URL + path, Object.assign({}, opts, { headers }));
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error_description || body.msg || body.message || ('HTTP ' + res.status));
  }
  return res.status === 204 ? null : res.json();
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

async function toggleRoster(classId) {
  const el = document.getElementById('roster-' + classId);
  const wasHidden = el.classList.contains('hidden');
  el.classList.toggle('hidden');
  if (!wasHidden) return;
  try {
    const students = await authFetch(`/rest/v1/students?class_id=eq.${classId}&select=name,stars,streak_days,words_learned,minutes_total,updated_at&order=stars.desc`);
    if (!students.length) { el.innerHTML = '<p class="empty">Henüz bu sınıfa katılan öğrenci yok. Sınıf kodunu öğrencilerinle paylaş.</p>'; return; }
    el.innerHTML = `<table><thead><tr><th>Öğrenci</th><th>⭐</th><th>🔥</th><th>Kelime</th><th>Dakika</th></tr></thead><tbody>
      ${students.map((s) => `<tr><td>${escapeHtml(s.name)}</td><td>${s.stars}</td><td>${s.streak_days}</td><td>${s.words_learned}</td><td>${s.minutes_total}</td></tr>`).join('')}
    </tbody></table>`;
  } catch (e) { el.innerHTML = '<p class="empty">Yüklenemedi: ' + e.message + '</p>'; }
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

if (!checkRecoveryLink() && loadSession()) showDashboard();
