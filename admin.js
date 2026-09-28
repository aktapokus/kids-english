// Yonetim portali (2026-09-28). Giris: Supabase e-posta + sifre (ogretmen
// paneliyle ayni hesap). Veri tek bir fonksiyondan gelir: admin_overview().
// Yetki kontrolu VERITABANINDA yapilir (public.admins listesi); bu sayfa
// yalnizca gosterir. Bkz. meb_research/admin_schema.sql
const SUPABASE_URL = 'https://wtrkfzmmhabcpoipaccf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_87EZgr1ftB1SnIY5FoDaKA_xmxlD7kU';
const SESSION_KEY = 'ke_admin_session_v1';
const BACKUP_STALE_HOURS = 26; // gecelik yedek: 26 saatten eskiyse uyar

const $ = (id) => document.getElementById(id);
function saveSession(s) { try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) { /* yok say */ } }
function loadSession() { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch (e) { return null; } }
function clearSession() { try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* yok say */ } }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function msg(text, kind) { const el = $('loginMsg'); el.textContent = text || ''; el.className = 'msg' + (kind ? ' ' + kind : ''); }

async function api(path, opts, retried) {
  const s = loadSession();
  const res = await fetch(SUPABASE_URL + path, Object.assign({}, opts, {
    headers: Object.assign({ 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: 'Bearer ' + (s ? s.access_token : SUPABASE_KEY) }, (opts || {}).headers || {}),
  }));
  if (res.status === 401 && s && s.refresh_token && !retried && !path.startsWith('/auth/')) {
    const r = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY }, body: JSON.stringify({ refresh_token: s.refresh_token }),
    });
    if (r.ok) { saveSession(await r.json()); return api(path, opts, true); }
  }
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) { const e = new Error((body && (body.error_description || body.msg || body.message)) || 'HTTP ' + res.status); e.status = res.status; throw e; }
  return body;
}

function fmt(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function ago(ts) {
  if (!ts) return '—';
  const m = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
  if (m < 60) return `${m} dk önce`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} saat önce`;
  return `${Math.round(h / 24)} gün önce`;
}
function table(cols, rows, empty) {
  if (!rows.length) return `<div class="empty">${empty}</div>`;
  return `<table><thead><tr>${cols.map((c) => `<th class="${c.cls || ''}">${c.h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${cols.map((c) => `<td class="${c.cls || ''}">${c.f(r)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
const REASONS = { image: 'Görsel', sentence: 'Cümle', translation: 'Türkçe anlam', audio: 'Ses', level: 'Seviye', other: 'Diğer' };

function render(d) {
  // Yedek durumu
  const last = d.last_ok_backup ? new Date(d.last_ok_backup) : null;
  const ageH = last ? (Date.now() - last.getTime()) / 3600000 : Infinity;
  const lastRun = (d.backups || [])[0];
  let cls = 'good', icon = '✅', title = 'Yedekler güncel', sub = `Son başarılı yedek: ${fmt(d.last_ok_backup)} (${ago(d.last_ok_backup)})`;
  if (!last) { cls = 'bad'; icon = '⛔'; title = 'Kayıtlı başarılı yedek yok'; sub = 'Gecelik görev henüz sonuç yazmadı. GitHub Actions sayfasını kontrol edin.'; }
  else if (ageH > BACKUP_STALE_HOURS) { cls = 'bad'; icon = '⛔'; title = `Son başarılı yedek ${Math.round(ageH)} saat önce`; sub = 'Gecelik yedek alınamıyor olabilir. GitHub Actions kaydına ve e-postanıza bakın.'; }
  else if (lastRun && !lastRun.ok) { cls = 'warn'; icon = '⚠️'; title = 'Son çalışma başarısız'; sub = `Son başarılı yedek ${ago(d.last_ok_backup)}. Başarısız çalışmanın kaydına bakın.`; }
  $('backupStatus').className = 'status ' + cls;
  $('backupStatus').innerHTML = `<span class="big">${icon}</span><div><b>${title}</b>${esc(sub)}</div>`;

  const c = d.counts || {};
  const k = (n, l) => `<div class="kpi"><div class="n">${n == null ? '—' : n}</div><div class="l">${l}</div></div>`;
  $('kpis').innerHTML = [
    k(c.teachers, 'Öğretmen hesabı'), k(c.classes, 'Sınıf'), k(c.students, 'Öğrenci'),
    k(c.students_active_24h, 'Aktif öğrenci (24 saat)'), k(c.students_active_7d, 'Aktif öğrenci (7 gün)'),
    k(c.reports_new, 'Yeni sorun bildirimi'), k(c.leaderboard, 'Sıralama kaydı'), k(esc(d.db_size), 'Veritabanı boyutu (ücretsiz sınır 500 MB)'),
  ].join('');

  $('backups').innerHTML = table([
    { h: 'Zaman', f: (r) => fmt(r.run_at) },
    { h: 'Sonuç', f: (r) => r.ok ? '<span class="pill good">Başarılı</span>' : '<span class="pill bad">Başarısız</span>' },
    { h: 'Klasör', f: (r) => esc(r.backup_day || '—') },
    { h: 'Satır sayıları', cls: 'wrap', f: (r) => esc(Object.entries(r.counts || {}).map(([t, n]) => `${t} ${n}`).join(' · ') || '—') },
    { h: 'Kayıt', f: (r) => r.run_url ? `<a href="${esc(r.run_url)}" target="_blank" rel="noopener">aç ↗</a>` : '—' },
  ], d.backups || [], 'Henüz kayıt yok. İlk kayıt bir sonraki yedek çalışmasında (her gece 03:30) oluşur.');

  $('teachers').innerHTML = table([
    { h: 'E-posta', f: (r) => esc(r.email) },
    { h: 'Durum', f: (r) => r.confirmed ? '<span class="pill good">Onaylı</span>' : '<span class="pill warn">E-posta onaysız</span>' },
    { h: 'Sınıf', cls: 'num', f: (r) => r.classes },
    { h: 'Kayıt', f: (r) => fmt(r.created_at) },
    { h: 'Son giriş', f: (r) => ago(r.last_sign_in_at) },
  ], d.teachers || [], 'Öğretmen yok.');

  $('classes').innerHTML = table([
    { h: 'Sınıf', f: (r) => esc(r.name) },
    { h: 'Kod', f: (r) => `<code>${esc(r.code)}</code>` },
    { h: 'Öğretmen', f: (r) => esc(r.teacher || '—') },
    { h: 'Öğrenci', cls: 'num', f: (r) => r.students },
    { h: 'Son hareket', f: (r) => ago(r.last_activity) },
    { h: 'Görev', f: (r) => r.has_task ? '<span class="pill good">Var</span>' : '<span class="pill dim">Yok</span>' },
    { h: 'Açıldı', f: (r) => fmt(r.created_at) },
  ], d.classes || [], 'Sınıf yok.');

  $('reports').innerHTML = table([
    { h: 'Zaman', f: (r) => fmt(r.created_at) },
    { h: 'Kelime', f: (r) => `<b>${esc(r.word)}</b>` },
    { h: 'Konu', f: (r) => esc(r.category_id) + (r.episode_id ? ` · ${esc(r.episode_id)}` : '') },
    { h: 'Neden', f: (r) => esc(REASONS[r.reason] || r.reason) },
    { h: 'Not', cls: 'wrap', f: (r) => esc(r.note || '') },
    { h: 'Durum', f: (r) => `<span class="pill ${r.status === 'new' ? 'warn' : 'dim'}">${esc(r.status)}</span>` },
  ], d.reports || [], 'Bildirim yok.');

  $('foot').textContent = `Veri zamanı: ${fmt(d.now)} · Veriler yalnızca yönetici hesabıyla, veritabanındaki admin_overview() fonksiyonundan okunur.`;
}

async function load() {
  $('refreshBtn').disabled = true;
  try {
    const d = await api('/rest/v1/rpc/admin_overview', { method: 'POST', body: '{}' });
    render(d);
  } catch (e) {
    if (/not_admin/.test(e.message)) { logout(); msg('Bu hesap yönetici listesinde değil.', 'err'); return; }
    if (e.status === 401) { logout(); msg('Oturum sona erdi, tekrar giriş yapın.', 'err'); return; }
    $('backupStatus').className = 'status bad';
    $('backupStatus').innerHTML = `<span class="big">⛔</span><div><b>Veri alınamadı</b>${esc(e.message)}</div>`;
  } finally { $('refreshBtn').disabled = false; }
}

function showDash() {
  const s = loadSession();
  $('who').textContent = (s && s.user && s.user.email) || '';
  $('loginCard').classList.add('hidden');
  $('dash').classList.remove('hidden');
  load();
}
function logout() {
  clearSession();
  $('dash').classList.add('hidden');
  $('loginCard').classList.remove('hidden');
}

async function login() {
  const email = $('email').value.trim();
  const password = $('pass').value;
  if (!email || !password) return;
  msg('Giriş yapılıyor…');
  try {
    const data = await api('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) });
    saveSession(data);
    $('pass').value = '';
    msg('');
    showDash();
  } catch (e) { msg(/invalid/i.test(e.message) ? 'E-posta ya da şifre hatalı.' : e.message, 'err'); }
}

$('loginBtn').addEventListener('click', login);
$('pass').addEventListener('keydown', (e) => { if (e.key === 'Enter') login(); });
$('refreshBtn').addEventListener('click', load);
$('logoutBtn').addEventListener('click', logout);
if (loadSession()) showDash();
