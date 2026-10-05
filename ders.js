// Ders oynatici (2026-09-29): gunluk ders planini akilli tahtada yurutur.
// 2026-10-05: gecisler TAMAMEN ogretmende ("kendi kendine gecis var; ogretmen
// inisiyatifine birakmamiz lazim" - aile testi). Aktapokus karti soyler ve
// bekler; ogretmen -> / >> / ogretmen ekranindaki Sonraki ile ilerletir. Uc gorunum, ayni veri (data/lessons.json):
//  - tahta  (ders-tahta.html):   cocuklarin gordugu ekran; dersi SAHIBI budur
//    (adimlar, zamanlayicilar, ses). Tek basina da calisir (tek ekran).
//  - ogretmen (ders-ogretmen.html): Turkce adim adim yonerge, cevaplar, puan,
//    kumanda. Tahtaya BroadcastChannel ile baglanir (ayni bilgisayar, ikinci
//    ekran; internet gerekmez). Tahtaya asla yansimaz.
//  - kart   (ders-kart.html):   basili ders karti (tek ekran / internetsiz).
// Amac: Ingilizce brans ogretmeni olmayan bir ogretmen de dersi yurutebilsin -
// Ingilizce olan her seyi Aktapokus soyler, ogretmene Turkce yonerge duser.
'use strict';

const CH = 'ke-ders';
const DONE_KEY = 'ke_lessons_done_v1';
const $ = (s, r = document) => r.querySelector(s);
const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Sinif duzeyi (2026-09-30: 3. sinif eklendi): ders kimliginden (g3-...),
// ?grade= parametresinden ya da ogretmenin son seciminden.
const GRADES = [2, 3, 4, 5, 6];
const GRADE_KEY = 'ke_ders_grade_v1';
function currentGrade() {
  const m = /^g(\d)-/.exec(query('id') || '');
  let g = Number(query('grade') || (m && m[1]) || 0);
  if (!g) { try { g = Number(localStorage.getItem(GRADE_KEY)) || 2; } catch (e) { g = 2; } }
  return GRADES.includes(g) ? g : 2;
}
async function loadData() {
  const g = currentGrade();
  const file = g === 2 ? 'data/lessons.json' : `data/lessons_${g}.json`;
  const r = await fetch(file);
  if (!r.ok) throw new Error(file + ' ' + r.status);
  const d = await r.json(); d.grade = d.grade || g; return d;
}
// Yil basi (0) ve yil sonu (9) bolumleri tema degildir (2026-09-30)
function themeLabel(data, t) { const th = data.themes[t] || {}; return (t === 0 || t === 9) ? th.tr : `Tema ${t}: ${th.tr}`; }
function themeLen(data, t) { return (data.theme_lessons && data.theme_lessons[t]) || 11; }
function doneMap() { try { return JSON.parse(localStorage.getItem(DONE_KEY) || '{}'); } catch (e) { return {}; } }
function markDone(id) {
  const m = doneMap(); m[id] = new Date().toISOString().slice(0, 10);
  try { localStorage.setItem(DONE_KEY, JSON.stringify(m)); } catch (e) { /* yok say */ }
}
function nextLesson(data) {
  const m = doneMap();
  return data.lessons.find((l) => !m[l.id]) || data.lessons[data.lessons.length - 1];
}
// ---- sinif eslemesi (lessons_schema.sql) ----
// Ogretmen paneline bu cihazda giris yapilmissa "Islendi" secili sinifa da
// yazilir (classes.lessons_done). Internet yoksa bekletilir, baglanti gelince
// gonderilir. Giris yoksa yalniz bu cihaza kaydedilir (tek ekran / internetsiz).
const SB_URL = (window.KE_SERVER && window.KE_SERVER.url) || 'https://wtrkfzmmhabcpoipaccf.supabase.co';
const SB_KEY = (window.KE_SERVER && window.KE_SERVER.key) || 'sb_publishable_87EZgr1ftB1SnIY5FoDaKA_xmxlD7kU';
const T_SESSION = 'ke_teacher_session_v1';
const PENDING_KEY = 'ke_lessons_pending_v1';
const CLASS_KEY = 'ke_ders_class_v1';
const lsGet = (k, def) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; } catch (e) { return def; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* yok say */ } };
async function sbFetch(path, opts, retried) {
  const ses = lsGet(T_SESSION, null);
  if (!ses || !ses.access_token) throw new Error('no-session');
  const res = await fetch(SB_URL + path, Object.assign({}, opts, { headers: Object.assign({ 'Content-Type': 'application/json', apikey: SB_KEY, Authorization: 'Bearer ' + ses.access_token }, (opts && opts.headers) || {}) }));
  if (res.status === 401 && !retried && ses.refresh_token) {
    const rr = await fetch(SB_URL + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SB_KEY }, body: JSON.stringify({ refresh_token: ses.refresh_token }) });
    if (rr.ok) { lsSet(T_SESSION, await rr.json()); return sbFetch(path, opts, true); }
  }
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const t = await res.text(); return t ? JSON.parse(t) : null;
}
const ClassSync = {
  classes: null, error: '',
  hasSession() { const s = lsGet(T_SESSION, null); return !!(s && s.access_token); },
  selected() { return lsGet(CLASS_KEY, null); },
  select(id) { lsSet(CLASS_KEY, id); },
  async load() {
    if (!this.hasSession()) return;
    try { this.classes = await sbFetch('/rest/v1/classes?select=id,name,lessons_done&order=created_at.desc'); this.error = ''; }
    catch (e) { this.error = /HTTP 400/.test(e.message) ? 'schema' : (navigator.onLine === false || e instanceof TypeError) ? 'offline' : 'err'; }
  },
  doneFor(id) { const c = (this.classes || []).find((x) => x.id === id); return (c && c.lessons_done) || {}; },
  queue(classId, lessonId, day) { const q = lsGet(PENDING_KEY, []); q.push({ classId, lessonId, day }); lsSet(PENDING_KEY, q); },
  async flush() {
    const q = lsGet(PENDING_KEY, []);
    if (!q.length || !this.hasSession()) return 0;
    const byClass = {}; q.forEach((x) => { (byClass[x.classId] = byClass[x.classId] || {})[x.lessonId] = x.day; });
    let sent = 0; const rest = [];
    for (const cid of Object.keys(byClass)) {
      try {
        const rows = await sbFetch(`/rest/v1/classes?id=eq.${cid}&select=lessons_done`);
        const merged = Object.assign({}, (rows && rows[0] && rows[0].lessons_done) || {}, byClass[cid]);
        await sbFetch(`/rest/v1/classes?id=eq.${cid}`, { method: 'PATCH', body: JSON.stringify({ lessons_done: merged }) });
        const c = (this.classes || []).find((x) => String(x.id) === String(cid)); if (c) c.lessons_done = merged;
        sent += Object.keys(byClass[cid]).length;
      } catch (e) { q.filter((x) => String(x.classId) === String(cid)).forEach((x) => rest.push(x)); }
    }
    lsSet(PENDING_KEY, rest); return sent;
  },
};

function lessonById(data, id) { return data.lessons.find((l) => l.id === id) || data.lessons[0]; }
function query(name) { return new URLSearchParams(location.search).get(name); }

// ---- ses (Ingiliz Ingilizcesi tercih) ----
let _voice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return null;
  const vs = speechSynthesis.getVoices();
  _voice = vs.find((v) => /en[-_]GB/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
  return _voice;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function speak(text, rate = 0.85) {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window) || !text) { resolve(); return; }
    const u = new SpeechSynthesisUtterance(text);
    if (_voice || pickVoice()) u.voice = _voice;
    u.lang = (_voice && _voice.lang) || 'en-GB'; u.rate = rate;
    let done = false; const fin = () => { if (!done) { done = true; resolve(); } };
    u.onend = fin; u.onerror = fin;
    setTimeout(fin, 1500 + text.length * 140); // bazi motorlar onend atmaz
    speechSynthesis.speak(u);
  });
}
function stopSpeech() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }

// ---- adimlar ----
const GAME_NAMES = { quiz: 'Takım oyunu', missing: 'Ne eksik?', reveal: 'Gizli resim', listen: 'Dinle ve dokun', odd: 'Farklı olanı bul' };
// Her adim: tur, dakika, tahtada ne olacagi, ogretmene Turkce not.
function buildSteps(data, lesson) {
  const prev = data.lessons[lesson.index - 2];
  const steps = [];
  steps.push({ kind: 'warm', min: 4, name: 'Isınma' });
  if (lesson.sound && lesson.sound.words && lesson.sound.words.length) steps.push({ kind: 'sound', min: 2, name: 'Günün sesi' });
  if (prev && prev.cards.length && !['revision', 'assess', 'school'].includes(lesson.kind)) steps.push({ kind: 'review', min: 3, name: 'Hatırla', items: prev.cards.slice(0, 6) });
  // Tekrar / degerlendirme / okul temelli derslerde kartlar yeni degil (2026-09-30)
  const isReview = ['revision', 'assess', 'school'].includes(lesson.kind);
  const storyStep = lesson.story ? { kind: 'story', min: 5, name: 'Dinle ve anla' } : null;
  if (isReview) steps.push({ kind: 'review', min: 6, name: 'Tekrar', items: [...lesson.cards, ...lesson.phrases.map((p) => ({ phrase: true, word: p.en, tr: p.tr }))] });
  else if (!lesson.review_only) steps.push({ kind: 'new', min: 6, name: 'Yeni', items: [...lesson.cards, ...lesson.phrases.map((p) => ({ phrase: true, word: p.en, tr: p.tr }))] });
  else steps.push({ kind: 'new', min: 6, name: 'Kalıplar', items: lesson.phrases.map((p) => ({ phrase: true, word: p.en, tr: p.tr })) });
  if (storyStep) steps.push(storyStep);
  // Donusumlu oyun (2026-09-30): her derste ayni takim sorusu tekrar
  // etmesin; ders sirasina gore bes oyun doner, kart yetmezse takim oyunu.
  const cards = (lesson.game_cards || lesson.cards).filter((c) => c.icon);
  const GAMES = ['quiz', 'missing', 'reveal', 'listen', 'odd'];
  let game = lesson.kind === 'assess' ? 'quiz' : GAMES[(lesson.index - 1) % GAMES.length];
  if ((game === 'missing' || game === 'odd' || game === 'listen') && cards.length < 4) game = 'quiz';
  if (cards.length >= 3) {
    const st = { kind: game, min: 7, name: GAME_NAMES[game], items: cards };
    if (game === 'odd') st.intruders = shuffle(data.lessons.filter((l) => l.theme !== lesson.theme).flatMap((l) => l.cards).filter((c) => c.icon && !cards.some((x) => x.word === c.word))).slice(0, 6);
    steps.push(st);
  }
  steps.push({ kind: 'active', min: lesson.active.minutes, name: 'Etkin öğrenme' });
  if (lesson.cando) steps.push({ kind: 'cando', min: 3, name: 'Ne öğrendim?' });
  steps.push({ kind: 'exit', min: 2, name: 'Kapanış', items: lesson.cards.slice(0, 6) });
  return steps;
}

function teacherNote(step, lesson, paper) {
  switch (step.kind) {
    case 'warm':
      return lesson.warm.type === 'says'
        ? 'Çocukları ayağa kaldırın. Aktapokus bir hareket söyleyecek. Komutun başında "Aktapokus says" varsa çocuklar hareketi yapar; yoksa kıpırdamaz. Siz de hareketleri yapın; kıpırdayan çocuğu gülerek oturtun, ceza yok.'
        : 'Aktapokus önceki kelimeleri söyleyip sınıfa tekrar ettirecek. Siz yalnızca koro hâlinde söylemeye teşvik edin. (Planın notu: ' + lesson.warm.tr + ')';
    case 'sound': return `Günün sesi: "${(lesson.sound.letter || '').toUpperCase()}". Aktapokus harfi ve o sesle başlayan kelimeleri söyleyecek (${lesson.sound.words.map((w) => w.word + ' = ' + w.tr).join(', ')}). Sınıf her kelimeyi tekrar eder; ilk sesi vurgulamaları için elinizle havada harfi çizdirin.`;
    case 'missing': return 'Ne eksik? Tahtada birkaç resim görünür; çocuklar bakar. Sonra "Close your eyes!" der, bir resim kaybolur. Sırası gelen takım hangisinin eksik olduğunu söyler ya da seçer. Puanı tahta verir.';
    case 'reveal': return 'Gizli resim. Resim önce çok bulanık gelir, yavaş yavaş netleşir. Takımlar erken tahmin etmeye çalışır; sırası gelen takım bir seçenek seçer. Puanı tahta verir.';
    case 'listen': return 'Dinle ve dokun. Tahtada yazısız resimler var. Aktapokus bir kelime söyler; sırası gelen takımdan bir çocuk tahtaya gelip doğru resme dokunur. Puanı tahta verir.';
    case 'odd': return 'Farklı olanı bul. Dört resimden biri bu dersin konusuna uymuyor. Sırası gelen takım farklı olanı seçer. Doğru cevaptan sonra "neden?" diye Türkçe sorabilirsiniz.';
    case 'cando': return 'Tema sonu öz değerlendirme. Aktapokus "I can…" cümlelerini tek tek söyler; çocuklar yapabiliyorsa başparmağını yukarı, emin değilse yana kaldırır. Siz sınıfa bakıp basılı kontrol listesine not alın (Ders kartı sayfasının sonunda). Cümleler: ' + lesson.cando.map((c) => c.tr).join(' · ');
    case 'story': return `Dinle ve anla: Aktapokus "${lesson.story.title}" metnini cümle cümle okur (Türkçesi aşağıda). Sonra takımlara 3 doğru/yanlış sorusu gelir. Cevaplar: ${lesson.story.qs.map((q, i) => (i + 1) + ') ' + (q.ok ? 'Doğru' : 'Yanlış')).join(', ')}.`;
    case 'review': if (step.name === 'Tekrar') return 'Tekrar kelimeleri: Aktapokus söyler, sınıf tekrar eder. Hatırlanmayan kelimeleri not alın; oyun adımında onlara dönün.';
      return 'Dünkü dersin kelimeleri. Aktapokus söyler, sınıf tekrar eder. Resmi parmağınızla gösterin; sessiz kalan çocuğu gülümseyerek koroya katın.';
    case 'new': return 'Yeni kelimeler. Aktapokus her kelimeyi söyleyip sınıfa tekrar ettirecek, sonra örnek cümleyi okuyacak. Sizin İngilizce konuşmanız gerekmez.' + (paper ? ' Türkçeleri aşağıdaki tabloda.' : ' Türkçesi aşağıda yalnızca sizin için.');
    case 'quiz': return 'Takım yarışması. Sınıfı ikiye bölün. Sırası gelen takımdan bir çocuk cevabı söyler ya da tahtada dokunur. Tahta doğruyu gösterir ve puanı kendisi verir' + (paper ? '.' : '; gerekirse buradan düzeltin.');
    case 'active': return lesson.active.tr.replace(/[.!]?$/, '.') + ' Tahtada ' + lesson.active.minutes + ' dakikalık sayaç var; bitince Aktapokus "Time\'s up!" der. Erken bitirmek için → tuşuna basın.';
    case 'exit': return 'Kapanış. Aktapokus bugünün kelimelerini söyletecek. Ev görevi: ' + lesson.home_tr + '' + (paper ? '' : ' Ders bitince aşağıdaki "İşlendi" düğmesine basın.');
    default: return '';
  }
}

// ======================= TAHTA =======================
function mountBoard(data) {
  const lesson = lessonById(data, query('id') || nextLesson(data).id);
  const steps = buildSteps(data, lesson);
  const bc = 'BroadcastChannel' in window ? new BroadcastChannel(CH) : null;
  const S = { lessonId: lesson.id, step: -1, item: 0, paused: false, scores: { A: 0, B: 0 }, turn: 'A', timerLeft: 0, answer: null, ended: false };
  let token = 0; // her adim degisiminde artar; eski dongu kendini durdurur
  // Kart duzeyinde ileri/geri (2026-09-30: "ileri geri tum bolumu atliyor,
  // bir onceki slayta donemiyorum"). Adimin icinde kart varsa once kartlar
  // arasinda gezer, uca gelince adim degisir.
  let nav = 0, cur = null;
  function stepNav(d) {
    if (S.step >= 0 && cur && (d > 0 ? cur.k < cur.n - 1 : cur.k > 0)) { nav = d; stopSpeech(); return; }
    go(S.step + d);
  }
  const say = (t) => (nav ? Promise.resolve() : speak(t));
  async function eachItem(n, my, body) {
    let k = 0;
    while (k < n && my === token) {
      cur = { k, n }; nav = 0; S.item = k; post();
      await waitWhilePaused(my);
      await body(k);
      if (my !== token) return;
      if (!nav) await waitTeacher(my);
      if (my !== token) return;
      k = nav < 0 ? Math.max(0, k - 1) : k + 1;
    }
    nav = 0; cur = null;
  }
  const app = $('#board');

  function post() { if (bc) bc.postMessage({ type: 'state', state: S, stepName: steps[S.step] && steps[S.step].name }); }
  function dots() { return steps.map((s, i) => `<span class="dot${i === S.step ? ' on' : i < S.step ? ' past' : ''}" title="${esc(s.name)}"></span>`).join(''); }
  function frame(inner, label) {
    app.innerHTML = `<header><div class="t">${esc(lesson.title)}</div><div class="dots">${dots()}</div><div class="timer" id="bTimer"></div><button id="bFs" class="fsbtn" title="Tam ekran">⛶</button></header>
      <main>${label ? `<div class="lbl">${esc(label)}</div>` : ''}${inner}</main>
      <footer><button id="bPrev" aria-label="Geri">◀</button><button id="bPause" aria-label="Duraklat">${S.paused ? '▶' : '⏸'}</button><button id="bNext" aria-label="Devam">▶▶</button></footer>`;
    $('#bFs').onclick = toggleFs;
    $('#bPrev').onclick = () => stepNav(-1); $('#bNext').onclick = () => stepNav(1); $('#bPause').onclick = togglePause;
    renderTimer();
  }
  function renderTimer() { const t = $('#bTimer'); if (t) t.textContent = S.timerLeft > 0 ? `${Math.floor(S.timerLeft / 60)}:${String(S.timerLeft % 60).padStart(2, '0')}` : ''; }
  function teamsHtml() { return `<span class="${S.turn === 'A' ? 'on' : ''}">🔴 A: ${S.scores.A}</span><span class="${S.turn === 'B' ? 'on' : ''}">🔵 B: ${S.scores.B}</span>`; }
  function refreshTeams() { const t = document.querySelector('.teams'); if (t) t.innerHTML = teamsHtml(); const l = document.querySelector('.lbl'); if (l && steps[S.step] && steps[S.step].kind === 'quiz') l.textContent = 'Team ' + S.turn; }
  // Poz dosyalarinda (point/wave/celebrate) gozluk cami yeri bos birakilmis
  // (uygulama cami ustune renkli katman ciziyor) ve ayak golgesi var; tahtada
  // katman olmadigindan delikli gorunuyordu. Tahtada temiz tam resim.
  function mascot() { return `<div class="mascwrap"><img class="masc" src="mascot/mascot_idle.png" alt=""></div>`; }
  function pic(c) {
    if (c.phrase) return `<div class="bigpic phrase">${mascot('mascot_point')}</div>`;
    if (c.icon_type === 'emoji') return `<div class="bigpic emo">${esc(c.icon)}</div>`;
    return `<div class="bigpic"><img src="${esc(c.icon)}" alt=""></div>`;
  }
  function toggleFs() { const d = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else if (d.requestFullscreen) d.requestFullscreen().catch(() => {}); }
  async function waitWhilePaused(my) { while (S.paused && my === token) await sleep(200); }
  // Ogretmen ilerletene kadar bekle; >> dugmesi yanip soner, ogretmen ekranina
  // "tahta sizi bekliyor" gider. Adim sonunda (cur yok) -> dogrudan go(adim+1) yapar.
  async function waitTeacher(my) {
    S.waiting = true; post(); const b = $('#bNext'); if (b) b.classList.add('wait');
    while (!nav && my === token) await sleep(120);
    S.waiting = false; const b2 = $('#bNext'); if (b2) b2.classList.remove('wait');
  }
  async function hold(ms, my) { const end = Date.now() + ms; while (Date.now() < end && my === token && !nav) { await waitWhilePaused(my); await sleep(100); } }

  function titleScreen() {
    S.step = -1; post();
    app.innerHTML = `<div class="start">${mascot('mascot_wave')}<h1>${esc(lesson.title)}</h1>
      <p>${esc(themeLabel(data, lesson.theme))} · Ders ${lesson.n} / ${themeLen(data, lesson.theme)}</p><button id="bStart" class="go">▶ Start</button>
      <button id="bFs0" class="fsbtn big">⛶ Tam ekran</button>
      <p class="hint">Boşluk: duraklat · → sonraki · ← önceki · S: tekrar söyle</p></div>`;
    $('#bStart').onclick = () => go(0);
    $('#bFs0').onclick = toggleFs;
  }

  async function go(i) {
    stopSpeech(); token++; nav = 0; cur = null;
    if (i < 0) { titleScreen(); return; }
    if (i >= steps.length) { endScreen(); return; }
    S.step = i; S.item = 0; S.paused = false; S.answer = null; S.timerLeft = 0; S.waiting = false; post();
    const my = token; const st = steps[i];
    try {
      if (st.kind === 'warm') await (lesson.warm.type === 'says' ? runSays(my) : runChorus(my, (data.lessons[lesson.index - 2] || lesson).cards.slice(0, 6), 'Warm-up'));
      else if (st.kind === 'review') await runChorus(my, st.items, 'Remember');
      else if (st.kind === 'new') await runChorus(my, st.items, 'New words', true);
      else if (st.kind === 'quiz') await runQuiz(my, st.items);
      else if (st.kind === 'sound') await runSound(my);
      else if (st.kind === 'cando') await runCando(my);
      else if (st.kind === 'story') await runStory(my);
      else if (st.kind === 'missing') await runMissing(my, st.items);
      else if (st.kind === 'reveal') await runReveal(my, st.items);
      else if (st.kind === 'listen') await runListen(my, st.items);
      else if (st.kind === 'odd') await runOdd(my, st.items, st.intruders || []);
      else if (st.kind === 'active') await runActive(my, st.min);
      else if (st.kind === 'exit') await runExit(my, st.items);
    } catch (e) { /* adim degisti */ }
    // Adim bitti: sonraki adima ogretmen gecer (-> / >> / Sonraki).
    if (my === token) { cur = null; await waitTeacher(my); }
  }

  // Maarif "Target Social Language in Use" (2. sinif, tema basina). Oyunlarda
  // Aktapokus bunlari sirayla kullanir; {T} = sirasi gelen takim (2026-09-30).
  const SOCIAL = {
    1: { start: ["Let's start!", 'Welcome! Ready?'], good: ['Well done!', "That's great!", 'Hurray!', 'Nice!'], turn: ["That's OK! Try again, Team {T}!", "That's OK! Team {T}, your turn!"], end: ['Well done, everybody!', 'Hurray! Well done!'] },
    2: { start: ['Good luck!', 'Good luck, everybody!'], good: ["You're right!", 'Of course!', 'Well done!'], turn: ["It's your turn, Team {T}!", "I see! It's your turn, Team {T}!"], end: ["Well done! What's next?"] },
    3: { start: ["Let's play together!", 'Wow! A game!'], good: ['Wow!', 'Great!', 'That sounds great!'], turn: ["It's your turn, Team {T}!", "Cheer up! It's your turn, Team {T}!"], end: ['Great! Cheer up, everybody!', 'That looks great!'] },
    4: { start: ["Look! Let's play!", 'All right! Ready?'], good: ['All right!', 'Well done!', "That's fine!"], turn: ["That's all right! Try again, Team {T}!", "It's all right! Team {T}, your turn!"], end: ['Well done, everybody!'] },
    5: { start: ["Come on! Let's look!", 'Come and see!'], good: ['That looks great!', 'Really? Yes!', 'Well done!'], turn: ['Hold on! Try again, Team {T}!', 'Come on, Team {T}!'], end: ['That looks great! Well done!'] },
    6: { start: ["Let's go!", 'Come on! Ready?'], good: ['Yummy! Well done!', "That's great!", 'Well done!'], turn: ['Try again, Team {T}!', "It's your turn, Team {T}!"], end: ['Yummy! Well done, everybody!'] },
  };
  const socN = {};
  function soc(kind) {
    const L = (SOCIAL[lesson.theme] || SOCIAL[1])[kind]; socN[kind] = ((socN[kind] || 0) + 1) % L.length;
    return L[socN[kind]].replace('{T}', S.turn);
  }

  async function runSays(my) {
    const cmds = shuffle(data.says).slice(0, 8);
    frame(`<div class="says">${mascot('mascot_point')}<div class="saytxt" id="sTxt">Listen and do!</div><div class="emo big" id="sEmo"></div><div class="sayres" id="sRes"></div></div>`, 'Aktapokus Says');
    await say("Let's play Aktapokus Says! Listen and do!"); await hold(800, my);
    await eachItem(cmds.length, my, async (k) => {
      await waitWhilePaused(my);
      const [cmd, emo] = cmds[k]; const says = k === 0 || Math.random() < 0.7;
      S.item = k; S.answer = { says, cmd }; post();
      const txt = $('#sTxt'), em = $('#sEmo'), res = $('#sRes');
      if (!txt) return;
      // Komut hemen yazili gorunur; "Aktapokus says" dedi mi, sonra acilir.
      // Telefonda ses gec bitse/hic cikmasa da beklemez (2026-09-30).
      txt.textContent = cmd.charAt(0).toUpperCase() + cmd.slice(1) + '!'; em.textContent = emo;
      res.textContent = '👂 Did you hear "Aktapokus says"?'; res.className = 'sayres';
      await Promise.race([say((says ? 'Aktapokus says: ' : '') + cmd + '!'), sleep(4000)]);
      await hold(2500, my); if (my !== token) return;
      res.textContent = says ? '✅ Aktapokus says: ' + cmd + '! Do it!' : '🙅 No "Aktapokus says": don\'t move!';
      res.className = 'sayres ' + (says ? 'ok' : 'no');
      await hold(2400, my);
    });
    if (my === token) await say('Well done! Sit down, please.');
  }

  async function runChorus(my, items, label, withSentence) {
    if (!items.length) return;
    await eachItem(items.length, my, async (k) => {
      await waitWhilePaused(my);
      const c = items[k]; S.item = k; S.answer = { word: c.alt ? c.word + ' / ' + c.alt : c.word, tr: c.tr }; post();
      frame(`<div class="card">${pic(c)}<div class="word">${esc(c.word)}${c.alt ? ` <span class="alt">· ${esc(c.alt)}</span>` : ''}</div>${withSentence && c.sentence ? `<div class="sent" id="cSent"></div>` : ''}<div class="cnt">${k + 1} / ${items.length}</div></div>`, label);
      await say(c.word); await hold(500, my); if (my !== token) return;
      await say('Everybody, say: ' + c.word); await hold(3000, my); if (my !== token) return;
      if (c.alt) { await say('You can also say: ' + c.alt + '!'); await hold(2200, my); if (my !== token) return; }
      if (withSentence && c.sentence) { const el = $('#cSent'); if (el) el.textContent = c.sentence; await say(c.sentence); await hold(1500, my); }
    });
  }

  async function runQuiz(my, pool) {
    const cards = pool.filter((c) => !c.phrase);
    if (cards.length < 3) return;
    const qs = shuffle(cards).slice(0, Math.min(8, cards.length));
    await say(soc('start') + ' Team game! Team A and Team B.');
    await eachItem(qs.length, my, async (k) => {
      await waitWhilePaused(my);
      const c = qs[k]; const opts = shuffle([c, ...shuffle(cards.filter((x) => x.word !== c.word)).slice(0, 2)]);
      S.item = k; S.answer = { word: c.word, tr: c.tr }; post();
      let solved = false, tries = 0;
      const render = () => frame(`<div class="quiz">${pic(c)}<div class="teams">${teamsHtml()}</div>
        <div class="opts">${opts.map((o, j) => `<button class="opt" data-w="${esc(o.word)}"><b>${j + 1}</b> ${esc(o.word)}</button>`).join('')}</div></div>`, `Team ${S.turn}`);
      render();
      const answered = new Promise((resolve) => {
        const pick = async (w, btn) => {
          if (solved) return;
          if (w === c.word) {
            solved = true; S.scores[S.turn]++; btn.classList.add('ok'); post(); refreshTeams();
            await say(soc('good') + ' ' + c.word + '!'); resolve();
          } else {
            btn.classList.add('bad'); btn.disabled = true; tries++;
            S.turn = S.turn === 'A' ? 'B' : 'A'; post(); refreshTeams();
            if (tries < 2) await say(soc('turn'));
            if (tries >= 2) { solved = true; const okb = [...document.querySelectorAll('.opt')].find((b) => b.dataset.w === c.word); if (okb) okb.classList.add('ok'); await say('It is ' + c.word + '.'); resolve(); }
          }
        };
        document.querySelectorAll('.opt').forEach((b) => { b.onclick = () => pick(b.dataset.w, b); });
        board.quizKey = (n) => { const b = document.querySelectorAll('.opt')[n - 1]; if (b && !b.disabled) pick(b.dataset.w, b); };
        board.quizPick = (w) => { const b = [...document.querySelectorAll('.opt')].find((x) => x.dataset.w === w); if (b) pick(w, b); };
      });
      await say('What is it?');
      await Promise.race([answered, (async () => { while (!solved && my === token && !nav) await sleep(150); })()]);
      board.quizKey = null; board.quizPick = null;
      if (my !== token) return;
      S.turn = S.turn === 'A' ? 'B' : 'A'; post();
      await hold(1500, my);
    });
    if (my !== token) return;
    frame(`<div class="start">${mascot('mascot_celebrate')}<h1>🔴 A: ${S.scores.A} · 🔵 B: ${S.scores.B}</h1></div>`, 'Well done!');
    await say(soc('end')); await hold(2500, my);
  }

  // Ortak takim sorusu: soru alanini ciz, secenekleri goster, dogru/yanlis ve
  // sira degisimi runQuiz ile ayni kurallar (ilk yanlista sira oburune, iki
  // yanlista dogru gosterilir).
  function askTeams(my, label, promptHtml, options, correct, question) {
    return new Promise((resolve) => {
      let solved = false, tries = 0;
      frame(`<div class="quiz">${promptHtml}<div class="teams">${teamsHtml()}</div>
        <div class="opts">${options.map((o, j) => `<button class="opt${o.pic ? ' picopt' : ''}" data-w="${esc(o.word)}"><b>${j + 1}</b> ${o.pic || esc(o.word)}</button>`).join('')}</div></div>`, label + ' · Team ' + S.turn);
      const pick = async (w, btn) => {
        if (solved || my !== token) return;
        if (w === correct) {
          solved = true; S.scores[S.turn]++; btn.classList.add('ok'); post(); refreshTeams();
          await say(soc('good') + ' ' + correct + '!'); resolve(true);
        } else {
          btn.classList.add('bad'); btn.disabled = true; tries++;
          S.turn = S.turn === 'A' ? 'B' : 'A'; post(); refreshTeams();
          const l = document.querySelector('.lbl'); if (l) l.textContent = label + ' · Team ' + S.turn;
          if (tries >= 2) { solved = true; const okb = [...document.querySelectorAll('.opt')].find((b) => b.dataset.w === correct); if (okb) okb.classList.add('ok'); await say('It is ' + correct + '.'); resolve(false); }
          else await say(soc('turn'));
        }
      };
      document.querySelectorAll('.opt').forEach((b) => { b.onclick = () => pick(b.dataset.w, b); });
      board.quizKey = (n) => { const b = document.querySelectorAll('.opt')[n - 1]; if (b && !b.disabled) pick(b.dataset.w, b); };
      board.quizPick = (w) => { const b = [...document.querySelectorAll('.opt')].find((x) => x.dataset.w === w); if (b) pick(w, b); };
      if (question) say(question);
      (async () => { while (!solved && my === token && !nav) await sleep(200); resolve(null); })();
    });
  }
  async function afterAsk(my) { board.quizKey = null; board.quizPick = null; if (my !== token) return false; S.turn = S.turn === 'A' ? 'B' : 'A'; post(); await hold(1500, my); return my === token; }
  async function gameEnd(my) {
    if (my !== token) return; // adim atlandiysa eski oyun yeni ekrani ezmesin
    frame(`<div class="start">${mascot()}<h1>🔴 A: ${S.scores.A} · 🔵 B: ${S.scores.B}</h1></div>`, 'Well done!');
    await say(soc('end')); await hold(2500, my);
  }
  function thumb(c) { return c.icon_type === 'emoji' ? `<span class="thumbemo">${esc(c.icon)}</span>` : `<img class="thumb" src="${esc(c.icon)}" alt="">`; }

  // Dinle ve anla (2026-09-30): kisa metin cumle cumle, sonra dogru/yanlis
  async function runStory(my) {
    const st = lesson.story;
    frame(`<div class="story"><h2>${esc(st.title)}</h2><div class="slines" id="sLines"></div></div>`, 'Listen and read');
    await say('Listen to the story: ' + st.title + '!'); await hold(500, my);
    await eachItem(st.lines.length, my, async (k) => {
      const box = $('#sLines'); if (!box) return;
      box.innerHTML = st.lines.slice(0, k + 1).map((l, i) => `<p class="${i === k ? 'now' : ''}">${esc(l.en)}</p>`).join('');
      S.answer = { word: st.lines[k].en, tr: st.lines[k].tr }; post();
      await say(st.lines[k].en); await hold(1400, my);
    });
    if (my !== token) return;
    await say('True or false?');
    await eachItem(st.qs.length, my, async (k) => {
      const q = st.qs[k]; S.answer = { word: q.en + ' → ' + (q.ok ? 'True' : 'False'), tr: q.tr }; post();
      await askTeams(my, 'True or false?', `<div class="tfq">${esc(q.en)}</div>`, [{ word: 'True', pic: '✅ True' }, { word: 'False', pic: '❌ False' }], q.ok ? 'True' : 'False', q.en);
      await afterAsk(my);
    });
    await gameEnd(my);
  }
  async function runCando(my) {
    await say('What can you do now? Show me your thumbs!');
    await eachItem(lesson.cando.length, my, async (k) => { const c = lesson.cando[k];
      if (my !== token) return; await waitWhilePaused(my);
      S.answer = { word: c.en, tr: c.tr }; post();
      frame(`<div class="start">${mascot()}<h1>${esc(c.en)}</h1><p class="thumbs">👍 Yes! &nbsp;&nbsp; 👉 A little</p></div>`, 'Can you do it?');
      await say(c.en); await hold(4500, my);
    });
    if (my === token) await say('Well done! You learned a lot!');
  }
  async function runSound(my) {
    const snd = lesson.sound; const L = snd.letter;
    frame(`<div class="sound"><div class="bigletter">${esc(L.toUpperCase())}${esc(L)}</div><div class="grid" id="sndGrid"></div></div>`, 'Sound of the day');
    await say("Today's sound is: " + L.toUpperCase() + '!'); await hold(700, my);
    await eachItem(snd.words.length, my, async (k) => { const w = snd.words[k];
      if (my !== token) return; await waitWhilePaused(my);
      const g = $('#sndGrid'); if (g) g.insertAdjacentHTML('beforeend', `<div class="mini">${pic(w)}<b><span class="hl">${esc(w.word.charAt(0))}</span>${esc(w.word.slice(1))}</b></div>`);
      S.answer = { word: w.word, tr: w.tr }; post();
      await say(L.toUpperCase() + ' is for ' + w.word + '!'); await hold(600, my);
      await say('Everybody, say: ' + w.word); await hold(2400, my);
    });
  }
  async function runMissing(my, cards) {
    await say(soc('start') + ' ' + "What's missing? Look and remember!");
    await eachItem(3, my, async (k) => { const r = k;
      await waitWhilePaused(my);
      const set = shuffle(cards).slice(0, Math.min(5, cards.length)); const gone = set[Math.floor(Math.random() * set.length)];
      S.answer = { word: gone.word, tr: gone.tr }; post();
      frame(`<div class="grid">${set.map((c) => `<div class="mini">${pic(c)}<b>${esc(c.word)}</b></div>`).join('')}</div>`, "Look! · What's missing?");
      await hold(6000, my); if (my !== token) return;
      frame(`<div class="start">${mascot()}<h1>Close your eyes! 🙈</h1></div>`, "What's missing?");
      await say('Close your eyes!'); await hold(2500, my); if (my !== token) return;
      const rest = set.filter((c) => c !== gone);
      const opts = shuffle([gone, ...shuffle(rest).slice(0, 2)]).map((c) => ({ word: c.word }));
      await say('Open your eyes!');
      await askTeams(my, "What's missing?", `<div class="grid small">${shuffle(rest).map((c) => `<div class="mini">${pic(c)}</div>`).join('')}<div class="mini q">❓</div></div>`, opts, gone.word, "What's missing?");
      if (!(await afterAsk(my))) return;
    });
    await gameEnd(my);
  }
  async function runReveal(my, cards) {
    await say(soc('start') + ' ' + 'Mystery picture! What is it?');
    const qs = shuffle(cards).slice(0, Math.min(5, cards.length));
    await eachItem(qs.length, my, async (k) => { const c = qs[k];
      if (my !== token) return; await waitWhilePaused(my);
      S.answer = { word: c.word, tr: c.tr }; post();
      const opts = shuffle([c, ...shuffle(cards.filter((x) => x.word !== c.word)).slice(0, 2)]).map((x) => ({ word: x.word }));
      const p = askTeams(my, 'Mystery picture', `<div class="bigpic reveal" id="rvPic" style="--blur:26px">${c.icon_type === 'emoji' ? `<span class="rvemo">${esc(c.icon)}</span>` : `<img src="${esc(c.icon)}" alt="">`}</div>`, opts, c.word, 'What is it?');
      (async () => { for (let b = 26; b >= 0 && my === token; b -= 2) { const el = $('#rvPic'); if (el) el.style.setProperty('--blur', b + 'px'); await sleep(700); } })();
      await p; const el = $('#rvPic'); if (el) el.style.setProperty('--blur', '0px');
      if (!(await afterAsk(my))) return;
    });
    await gameEnd(my);
  }
  async function runListen(my, cards) {
    const set = shuffle(cards).slice(0, Math.min(6, cards.length));
    await say(soc('start') + ' ' + 'Listen and touch the picture!');
    const lq = shuffle(set).slice(0, 5);
    await eachItem(lq.length, my, async (k) => { const c = lq[k];
      if (my !== token) return; await waitWhilePaused(my);
      S.answer = { word: c.word, tr: c.tr }; post();
      await askTeams(my, 'Listen and touch', '', set.map((x) => ({ word: x.word, pic: thumb(x) })), c.word, 'Touch the ' + c.word + '!');
      if (!(await afterAsk(my))) return;
    });
    await gameEnd(my);
  }
  async function runOdd(my, cards, intruders) {
    await say(soc('start') + ' ' + 'Which one is different?');
    await eachItem(Math.min(4, intruders.length), my, async (k) => { const r = k;
      await waitWhilePaused(my);
      const odd = intruders[r]; const set = shuffle([odd, ...shuffle(cards).slice(0, 3)]);
      S.answer = { word: odd.word, tr: odd.tr }; post();
      await askTeams(my, 'Odd one out', '', set.map((x) => ({ word: x.word, pic: thumb(x) + `<span class="cap">${esc(x.word)}</span>` })), odd.word, 'Which one is different?');
      if (!(await afterAsk(my))) return;
    });
    await gameEnd(my);
  }

  async function runActive(my, minutes) {
    frame(`<div class="active">${mascot('mascot_point')}<div class="inst">${esc(lesson.active.en)}</div></div>`, "Let's do it!");
    await say(lesson.active.en);
    S.timerLeft = minutes * 60; post(); renderTimer();
    while (S.timerLeft > 0 && my === token) {
      await sleep(1000); await waitWhilePaused(my);
      if (my !== token) return;
      S.timerLeft--; renderTimer(); if (S.timerLeft % 5 === 0) post();
    }
    if (my === token) { await say("Time's up! Well done! Sit down, please."); await hold(1000, my); }
  }

  async function runExit(my, items) {
    frame(`<div class="grid">${items.map((c) => `<div class="mini">${pic(c)}<b>${esc(c.word)}</b></div>`).join('')}</div>`, 'Bye bye!');
    await say('Say it with me!');
    await eachItem(items.length, my, async (k) => { const c = items[k]; await say(c.word); await hold(1800, my); });
    await say('Goodbye, everybody! See you next time!');
  }

  function endScreen() {
    S.step = steps.length; S.ended = true; post();
    app.innerHTML = `<div class="start">${mascot('mascot_celebrate')}<h1>Goodbye! 👋</h1><p>🔴 A: ${S.scores.A} · 🔵 B: ${S.scores.B}</p></div>`;
  }
  function togglePause() { S.paused = !S.paused; if (S.paused) stopSpeech(); post(); const b = $('#bPause'); if (b) b.textContent = S.paused ? '▶' : '⏸'; }
  function repeat() { const a = S.answer; if (a && a.word) speak(a.word); else if (steps[S.step] && steps[S.step].kind === 'active') speak(lesson.active.en); }

  const board = { quizKey: null, quizPick: null };
  document.addEventListener('keydown', (e) => {
    if (e.key === ' ') { e.preventDefault(); if (S.step < 0) go(0); else togglePause(); }
    else if (e.key === 'ArrowRight') stepNav(1);
    else if (e.key === 'ArrowLeft') stepNav(-1);
    else if (e.key === 's' || e.key === 'S') repeat();
    else if (/^[1-3]$/.test(e.key) && board.quizKey) board.quizKey(Number(e.key));
  });
  if (bc) bc.onmessage = (ev) => {
    const m = ev.data || {};
    if (m.type === 'hello') post();
    else if (m.type === 'cmd') {
      if (m.cmd === 'start') go(Math.max(0, S.step));
      else if (m.cmd === 'next') stepNav(1);
      else if (m.cmd === 'prev') stepNav(-1);
      else if (m.cmd === 'goto') go(m.step);
      else if (m.cmd === 'pause') togglePause();
      else if (m.cmd === 'repeat') repeat();
      else if (m.cmd === 'score') { S.scores[m.team] = Math.max(0, S.scores[m.team] + m.delta); post(); refreshTeams(); }
      else if (m.cmd === 'pick' && board.quizPick) board.quizPick(m.word);
    }
  };
  titleScreen();
}

// ======================= OGRETMEN =======================
const SINGLE_SCREEN_NOTE = '<div class="link warn">🖥️ Bu bilgisayarda tek ekran görünüyor. Projektör ekranı <b>yansıtıyorsa</b> bu sayfa da tahtaya yansır ve Türkçe notları çocuklar görür. Öneri: <b>Tahtayı aç</b>, tahta penceresinde <b>⛶ Tam ekran</b> deyin ve dersi tahtanın kendi düğmeleriyle (ya da klavyeyle) yönetin; notlar için <b>Ders kartı</b>nı yazdırın ya da telefonda açın. İki ayrı ekran için Windows\'ta <b>Win + P → Genişlet</b>.</div>';
function mountTeacher(data) {
  let lesson = lessonById(data, query('id') || nextLesson(data).id);
  const bc = 'BroadcastChannel' in window ? new BroadcastChannel(CH) : null;
  let st = null; let lastSeen = 0;
  const app = $('#teacher');
  const send = (cmd, extra) => bc && bc.postMessage({ type: 'cmd', cmd, ...extra });

  function listHtml() {
    const cls = ClassSync.selected();
    const m = Object.assign({}, doneMap(), cls != null ? ClassSync.doneFor(cls) : {}); let theme = -1;
    return data.lessons.map((l) => {
      const head = l.theme !== theme ? `<h3>${esc(themeLabel(data, l.theme))} · ${esc(data.themes[l.theme].name)}</h3>` : '';
      theme = l.theme;
      return head + `<button class="li${l.id === lesson.id ? ' cur' : ''}" data-id="${l.id}"><span>${l.index}.</span> ${esc(l.title)} <small>Hafta ${l.week}</small>${m[l.id] ? ' <em>✓ ' + esc(m[l.id]) + '</em>' : ''}</button>`;
    }).join('');
  }
  let render = function () {
    const steps = buildSteps(data, lesson);
    const cur = st && st.lessonId === lesson.id ? st.step : -1;
    const linked = Date.now() - lastSeen < 4000;
    const ans = st && st.lessonId === lesson.id && st.answer;
    app.innerHTML = `
      <aside><div class="gtabs">${GRADES.map((g) => `<button type="button" class="gtab${g === data.grade ? ' on' : ''}" data-grade="${g}">${g}. sınıf</button>`).join('')}</div><h2>${data.grade}. sınıf ders planı</h2>${listHtml()}</aside>
      <section>
        <div class="head"><div><div class="meta">Hafta ${lesson.week} · Ders ${lesson.index} / ${data.lessons.length} · ${esc(lesson.outcomes)}</div><h1>${esc(lesson.title)}</h1>
          <div class="target"><b>Hedef dil:</b> ${esc(lesson.target)} · <i>${esc(lesson.chunk)}</i></div></div>
          <div class="acts"><button id="tOpen" class="pri">🖥️ Tahtayı aç</button><a class="btn" href="ders-kart.html?id=${lesson.id}" target="_blank" rel="noopener">🖨️ Ders kartı</a></div></div>
        ${classBarHtml()}
        <div class="link ${linked ? 'ok' : ''}">${linked ? '🟢 Tahta bağlı: dersi aşağıdaki düğmelerle yönetebilirsiniz.' : '⚪ Tahta bağlı değil. <b>Tahtayı aç</b>\'a basın. Aşağıdaki düğmeler yalnızca tahta <b>bu bilgisayarda</b> açıkken çalışır (telefondan kumanda henüz yok).'}</div>
        ${!linked && window.screen && window.screen.isExtended === false ? SINGLE_SCREEN_NOTE : ''}
        <div class="ctrl${linked ? '' : ' off'}"><button data-c="prev">◀ Geri</button><button data-c="start" class="pri">▶ Başlat / Devam</button><button data-c="pause">⏸ Duraklat</button><button data-c="next"${st && st.waiting ? ' class="pri wait"' : ''}>Sonraki ▶▶</button><button data-c="repeat">🔊 Tekrar söylet</button></div>
        ${linked && st && st.waiting ? '<div class="waitnote">⏳ Tahta sizi bekliyor. Sınıf hazır olunca <b>Sonraki ▶▶</b> düğmesine basın.</div>' : ''}
        ${ans ? `<div class="answer">${ans.word ? `Tahtadaki: <b>${esc(ans.word)}</b>${ans.tr ? ' = ' + esc(ans.tr) : ''}` : ''}${ans.cmd ? `Komut: <b>${esc(ans.cmd)}</b> · ${ans.says ? '✅ "Aktapokus says" dedi: hareket yapılır' : '🙅 "Aktapokus says" demedi: kıpırdamak yok'}` : ''}</div>` : ''}
        ${st && st.lessonId === lesson.id && st.step >= 0 ? `<div class="score">🔴 Takım A: <b>${st.scores.A}</b> <button data-s="A:1">+1</button><button data-s="A:-1">−1</button> &nbsp; 🔵 Takım B: <b>${st.scores.B}</b> <button data-s="B:1">+1</button><button data-s="B:-1">−1</button>${st.timerLeft > 0 ? ` &nbsp; ⏱️ ${Math.floor(st.timerLeft / 60)}:${String(st.timerLeft % 60).padStart(2, '0')}` : ''}</div>` : ''}
        <ol class="steps">${steps.map((s, i) => `<li class="${i === cur ? 'now' : i < cur ? 'past' : ''}"><div class="sh"><b>${i + 1}. ${esc(s.name)}</b> <span>${s.min} dk</span> <button data-g="${i}">buraya git</button></div><p>${esc(teacherNote(s, lesson))}</p>
          ${s.kind === 'new' ? `<table>${s.items.map((c) => `<tr><td>${esc(c.word)}</td><td>${esc(c.tr)}</td></tr>`).join('')}</table>` : ''}</li>`).join('')}</ol>
        ${extrasHtml(data, lesson)}
        ${lesson.diff ? `<div class="diffbox"><b>🧩 Farklılaştırma</b><p><b>Destek:</b> ${esc(lesson.diff.support)}</p><p><b>Hızlı bitirenler:</b> ${esc(lesson.diff.extend)}</p></div>` : ''}
        <div class="done"><button id="tDone" class="pri">✅ İşlendi</button> <span>Ders bittiğinde basın. Öğrencilerin uygulamasında aynı ders "Bugünün dersi" olarak açılacak.</span></div>
      </section>`;
    app.querySelectorAll('.gtab').forEach((b) => { b.onclick = () => { try { localStorage.setItem(GRADE_KEY, b.dataset.grade); } catch (e) { /* yok say */ } location.href = 'ders-ogretmen.html?grade=' + b.dataset.grade; }; });
    app.querySelectorAll('.li').forEach((b) => { b.onclick = () => { lesson = lessonById(data, b.dataset.id); history.replaceState(null, '', '?id=' + lesson.id); render(); }; });
    app.querySelectorAll('[data-c]').forEach((b) => { b.disabled = !linked; b.onclick = () => send(b.dataset.c); });
    app.querySelectorAll('[data-g]').forEach((b) => { b.onclick = () => send('goto', { step: Number(b.dataset.g) }); });
    app.querySelectorAll('[data-s]').forEach((b) => { b.onclick = () => { const [team, d] = b.dataset.s.split(':'); send('score', { team, delta: Number(d) }); }; });
    $('#tOpen').onclick = async () => {
      const url = 'ders-tahta.html?id=' + lesson.id;
      // Ikinci ekran varsa (Chrome/Edge; bir kez izin sorar) tahta dogrudan orada acilir.
      try {
        if (window.screen.isExtended && 'getScreenDetails' in window) {
          const sd = await window.getScreenDetails();
          const other = sd.screens.find((x) => x !== sd.currentScreen);
          if (other) { window.open(url, 'ke-tahta', `popup,left=${other.availLeft},top=${other.availTop},width=${other.availWidth},height=${other.availHeight}`); return; }
        }
      } catch (e) { /* izin verilmedi: normal pencere */ }
      window.open(url, 'ke-tahta', 'popup,width=1280,height=800');
    };
  };
  function classBarHtml() {
    const pend = lsGet(PENDING_KEY, []).length;
    if (!ClassSync.hasSession()) return `<div class="link">🏫 İsteğe bağlı: Öğretmen paneline bu cihazda giriş yaparsanız "İşlendi" sınıfınıza da kaydedilir ve öğrencileriniz aynı dersi uygulamada "Bugünün dersi" olarak görür. Giriş yapmadan da ders planı çalışır.</div>`;
    if (ClassSync.error === 'schema') return `<div class="link">🏫 Sınıf eşitlemesi için veritabanı güncellemesi gerekiyor (lessons_schema.sql bir kez çalıştırılmalı). Şimdilik "İşlendi" yalnızca bu cihaza kaydediliyor.</div>`;
    if (!ClassSync.classes) return `<div class="link">🏫 ${ClassSync.error === 'offline' ? 'İnternet yok: sınıf listesi alınamadı. "İşlendi" bu cihazda bekletilir, internet gelince sınıfa gönderilir.' : ClassSync.error ? 'Sınıf listesi alınamadı; giriş süresi dolmuş olabilir. Öğretmen paneline yeniden giriş yapın. Şimdilik "İşlendi" bu cihaza kaydediliyor.' : 'Sınıflar yükleniyor…'}${pend ? ` · ⏳ Bekleyen ${pend} kayıt` : ''}</div>`;
    const sel = ClassSync.selected();
    if (sel == null) return `<div class="link warn">⚠️ <b>Sınıf seçilmedi:</b> "İşlendi" yalnızca bu bilgisayara kaydedilir, öğrencilere gitmez. Sınıfınızı seçin: <select id="tClass"><option value="" selected>— sınıf seçin —</option>${ClassSync.classes.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>${pend ? ` · ⏳ Bekleyen ${pend} kayıt` : ''}</div>`;
    return `<div class="link ok">🏫 Bu dersi işlediğim sınıf: <select id="tClass"><option value="">— yalnızca bu cihaz —</option>${ClassSync.classes.map((c) => `<option value="${c.id}"${String(c.id) === String(sel) ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select>${pend ? ` · ⏳ Bekleyen ${pend} kayıt (internet gelince gönderilir)` : ''}</div>`;
  }
  const _render = render;
  render = function () {
    _render();
    const s = $('#tClass'); if (s) s.onchange = () => { ClassSync.select(s.value ? Number(s.value) : null); render(); };
    $('#tDone').onclick = async () => {
      markDone(lesson.id);
      const cls = ClassSync.selected(); const day = new Date().toISOString().slice(0, 10);
      if (cls != null && ClassSync.hasSession()) { ClassSync.queue(cls, lesson.id, day); await ClassSync.flush(); }
      const nx = nextLesson(data); render();
      const pend = lsGet(PENDING_KEY, []).length;
      $('#tDone').textContent = (cls != null ? (pend ? '⏳ Kaydedildi, internet gelince sınıfa gönderilecek' : '✅ Sınıfa kaydedildi') : '✅ Bu cihaza kaydedildi') + ' · sıradaki: ' + nx.title;
    };
  };
  ClassSync.load().then(() => ClassSync.flush()).then(() => render());
  window.addEventListener('online', () => ClassSync.load().then(() => ClassSync.flush()).then(() => render()));
  if (bc) {
    bc.onmessage = (ev) => { const m = ev.data || {}; if (m.type === 'state') { st = m.state; lastSeen = Date.now(); if (st.lessonId !== lesson.id) lesson = lessonById(data, st.lessonId); render(); } };
    setInterval(() => { bc.postMessage({ type: 'hello' }); if (Date.now() - lastSeen > 4500 && lastSeen) { lastSeen = 0; render(); } }, 3000);
    bc.postMessage({ type: 'hello' });
  }
  render();
}

// ======================= BASILI DERS KARTI =======================
// Okuma-yazma (Maarif R/W): resim + kopyalama satiri + kelime havuzu.
function worksheetHtml(lesson) {
  // 2. sinifta yazma = kopyalama: tek kelimelik kartlar once (uzun ifadeler zor)
  const src = (lesson.review_only ? lesson.game_cards || lesson.cards : lesson.cards).filter((c) => c.icon);
  const cs = [...src.filter((c) => !/\s/.test(c.word)), ...src.filter((c) => /\s/.test(c.word))].slice(0, 6);
  if (!cs.length) return '';
  const img = (c) => c.icon_type === 'emoji' ? `<span class="wsemo">${esc(c.icon)}</span>` : `<img src="${esc(c.icon)}" alt="">`;
  return `<section class="ws"><h2>Çalışma kâğıdı · Worksheet</h2><p>Name: ____________________ &nbsp; Date: __________</p>
    <p><b>Read and write.</b> Word bank: ${shuffle(cs).map((c) => `<span class="bank">${esc(c.word)}</span>`).join(' ')}</p>
    <div class="wsgrid">${cs.map((c) => `<div class="wscell">${img(c)}<div class="wline"></div></div>`).join('')}</div></section>`;
}
// Tema sonu kontrol listesi (ogretmen gozlemi).
function checklistHtml(lesson) {
  if (!lesson.cando) return '';
  return `<section class="ws"><h2>Tema ${lesson.theme} kontrol listesi</h2><p class="small">✓ yapabiliyor · ~ kısmen · – henüz değil</p>
    <table class="chk"><tr><th>Öğrenci</th>${lesson.cando.map((c) => `<th>${esc(c.tr)}</th>`).join('')}</tr>${'<tr><td>&nbsp;</td>' + lesson.cando.map(() => '<td></td>').join('') + '</tr>'.repeat(1)}${Array.from({ length: 24 }, () => '<tr><td>&nbsp;</td>' + lesson.cando.map(() => '<td></td>').join('') + '</tr>').join('')}</table></section>`;
}
// Metin, sarki, yazma gorevi, rubrik ve ornek diyalog (ogretmen ekrani + basili kart)
function rubricTable(rows, title) {
  return `<table class="rubric"><tr><th>${esc(title)}</th><th>3 · İyi</th><th>2 · Gelişiyor</th><th>1 · Destek gerekiyor</th></tr>${rows.map((r) => `<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td></tr>`).join('')}</table>`;
}
function extrasHtml(data, lesson, paper) {
  let h = '';
  if (lesson.song) h += `<div class="xbox"><b>🎵 Tema şarkısı önerisi:</b> ${esc(lesson.song.title)}${paper ? ` (YouTube'da arayın: "${esc(lesson.song.q)}")` : ` · <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(lesson.song.q)}" target="_blank" rel="noopener">YouTube'da ara</a>`} <span class="small">Şarkıyı sınıfta YouTube'dan açın; uygulama şarkı kaydı içermez.</span></div>`;
  if (lesson.story) h += `<div class="xbox"><b>📖 Dinle ve anla: ${esc(lesson.story.title)}</b><ol>${lesson.story.lines.map((l) => `<li>${esc(l.en)} <span class="tr">${esc(l.tr)}</span></li>`).join('')}</ol><p><b>Doğru mu, yanlış mı?</b> ${lesson.story.qs.map((q, i) => `${i + 1}) ${esc(q.en)} <span class="tr">(${q.ok ? 'Doğru' : 'Yanlış'})</span>`).join(' · ')}</p></div>`;
  if (lesson.dialog) h += `<div class="xbox"><b>💬 Örnek diyalog</b> <span class="small">(etkinlik öncesi tahtaya yazın, iki çocukla canlandırın)</span><ul>${lesson.dialog.map((d) => `<li>${esc(d.en)} <span class="tr">${esc(d.tr)}</span></li>`).join('')}</ul></div>`;
  if (lesson.writing) h += `<div class="xbox"><b>✍️ Yazma görevi</b> (${esc(lesson.writing.words)} kelime): ${esc(lesson.writing.tr)}<p><b>Örnek:</b> <i>${esc(lesson.writing.model)}</i></p>${paper ? '<div class="wlines"></div>' : ''}${data.rubrics ? rubricTable(data.rubrics.writing, 'Yazma rubriği') : ''}</div>`;
  if (lesson.rubric && data.rubrics) h += `<div class="xbox"><b>📋 Değerlendirme</b>: Tahtadaki takım sınavından sonra her çocuk (ya da grup) son iki temanın yazma görevini ya da tema projesini sunar. Aşağıdaki ölçütle 1–3 arası puan verin.${rubricTable(data.rubrics.task, 'Performans rubriği')}${rubricTable(data.rubrics.writing, 'Yazma rubriği')}</div>`;
  return h;
}
function mountCard(data) {
  const list = query('all') ? data.lessons : [lessonById(data, query('id') || nextLesson(data).id)];
  $('#card').innerHTML = list.map((lesson) => {
    const steps = buildSteps(data, lesson);
    return `<article><div class="meta">${data.grade}. sınıf · Hafta ${lesson.week} · Ders ${lesson.index} / ${data.lessons.length} · ${esc(themeLabel(data, lesson.theme))} · ${esc(lesson.outcomes)}</div>
      <h1>${esc(lesson.title)}</h1><p><b>Hedef dil:</b> ${esc(lesson.target)} — <i>${esc(lesson.chunk)}</i></p>
      <ol>${steps.map((s, i) => `<li><b>Adım ${i + 1}/${steps.length}: ${esc(s.name)} (${s.min} dk).</b> ${esc(teacherNote(s, lesson, true))}</li>`).join('')}</ol>
      ${lesson.cards.length && !lesson.review_only ? `<table><tr><th>Kelime</th><th>Türkçesi</th><th>Örnek cümle</th></tr>${lesson.cards.map((c) => `<tr><td>${esc(c.word)}</td><td>${esc(c.tr)}</td><td>${esc(c.sentence)}</td></tr>`).join('')}</table>` : ''}
      ${lesson.phrases.length ? `<p><b>Kalıplar:</b> ${lesson.phrases.map((p) => `${esc(p.en)} (${esc(p.tr)})`).join(' · ')}</p>` : ''}
      ${lesson.diff ? `<p><b>Destek:</b> ${esc(lesson.diff.support)}<br><b>Hızlı bitirenler:</b> ${esc(lesson.diff.extend)}</p>` : ''}
      ${extrasHtml(data, lesson, true)}
      ${worksheetHtml(lesson)}${checklistHtml(lesson)}
      <p class="small">Aktapokus her kartı söyler ve bekler; siz → tuşuyla (ya da ▶▶ düğmesiyle) ilerletirsiniz. Adım numaraları tahtadaki noktalarla aynıdır. Boşluk: duraklat · →: sonraki · ←: önceki · S: tekrar söylet.</p></article>`;
  }).join('');
  $('#pPrint').onclick = () => window.print();
}

loadData().then((data) => {
  const mode = document.body.dataset.mode;
  if (mode === 'board') mountBoard(data);
  else if (mode === 'teacher') mountTeacher(data);
  else if (mode === 'card') mountCard(data);
}).catch((e) => { document.body.insertAdjacentHTML('beforeend', `<p style="padding:24px">Ders verisi yüklenemedi: ${esc(e.message)}</p>`); });
