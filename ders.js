// Ders oynatici (2026-09-29): gunluk ders planini akilli tahtada kendi kendine
// yurutur. Uc gorunum, ayni veri (data/lessons.json):
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

async function loadData() {
  const r = await fetch('data/lessons.json');
  if (!r.ok) throw new Error('lessons.json ' + r.status);
  return r.json();
}
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
const SB_URL = 'https://wtrkfzmmhabcpoipaccf.supabase.co';
const SB_KEY = 'sb_publishable_87EZgr1ftB1SnIY5FoDaKA_xmxlD7kU';
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
// Her adim: tur, dakika, tahtada ne olacagi, ogretmene Turkce not.
function buildSteps(data, lesson) {
  const prev = data.lessons[lesson.index - 2];
  const steps = [];
  steps.push({ kind: 'warm', min: 5, name: 'Isınma' });
  if (prev && prev.cards.length) steps.push({ kind: 'review', min: 4, name: 'Hatırla', items: prev.cards.slice(0, 6) });
  if (!lesson.review_only) steps.push({ kind: 'new', min: 6, name: 'Yeni', items: [...lesson.cards, ...lesson.phrases.map((p) => ({ phrase: true, word: p.en, tr: p.tr }))] });
  else steps.push({ kind: 'new', min: 6, name: 'Kalıplar', items: lesson.phrases.map((p) => ({ phrase: true, word: p.en, tr: p.tr })) });
  steps.push({ kind: 'quiz', min: 7, name: 'Takım oyunu', items: lesson.cards });
  steps.push({ kind: 'active', min: lesson.active.minutes, name: 'Etkin öğrenme' });
  steps.push({ kind: 'exit', min: 2, name: 'Kapanış', items: lesson.cards.slice(0, 6) });
  return steps;
}

function teacherNote(step, lesson, paper) {
  switch (step.kind) {
    case 'warm':
      return lesson.warm.type === 'says'
        ? 'Çocukları ayağa kaldırın. Aktapokus bir hareket söyleyecek. Komutun başında "Aktapokus says" varsa çocuklar hareketi yapar; yoksa kıpırdamaz. Siz de hareketleri yapın; kıpırdayan çocuğu gülerek oturtun, ceza yok.'
        : 'Aktapokus önceki kelimeleri söyleyip sınıfa tekrar ettirecek. Siz yalnızca koro hâlinde söylemeye teşvik edin. (Planın notu: ' + lesson.warm.tr + ')';
    case 'review': return 'Dünkü dersin kelimeleri. Aktapokus söyler, sınıf tekrar eder. Resmi parmağınızla gösterin; sessiz kalan çocuğu gülümseyerek koroya katın.';
    case 'new': return 'Yeni kelimeler. Aktapokus her kelimeyi söyleyip sınıfa tekrar ettirecek, sonra örnek cümleyi okuyacak. Sizin İngilizce konuşmanız gerekmez.' + (paper ? ' Türkçeleri aşağıdaki tabloda.' : ' Türkçesi aşağıda yalnızca sizin için.');
    case 'quiz': return 'Takım yarışması. Sınıfı ikiye bölün. Sırası gelen takımdan bir çocuk cevabı söyler ya da tahtada dokunur. Tahta doğruyu gösterir ve puanı kendisi verir' + (paper ? '.' : '; gerekirse buradan düzeltin.');
    case 'active': return lesson.active.tr.replace(/[.!]?$/, '.') + ' Tahtada ' + lesson.active.minutes + ' dakikalık sayaç var; bitince Aktapokus "Time\'s up!" der.';
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
  const app = $('#board');

  function post() { if (bc) bc.postMessage({ type: 'state', state: S, stepName: steps[S.step] && steps[S.step].name }); }
  function dots() { return steps.map((s, i) => `<span class="dot${i === S.step ? ' on' : i < S.step ? ' past' : ''}" title="${esc(s.name)}"></span>`).join(''); }
  function frame(inner, label) {
    app.innerHTML = `<header><div class="t">${esc(lesson.title)}</div><div class="dots">${dots()}</div><div class="timer" id="bTimer"></div></header>
      <main>${label ? `<div class="lbl">${esc(label)}</div>` : ''}${inner}</main>
      <footer><button id="bPrev" aria-label="Geri">◀</button><button id="bPause" aria-label="Duraklat">${S.paused ? '▶' : '⏸'}</button><button id="bNext" aria-label="Devam">▶▶</button></footer>`;
    $('#bPrev').onclick = () => go(S.step - 1); $('#bNext').onclick = () => go(S.step + 1); $('#bPause').onclick = togglePause;
    renderTimer();
  }
  function renderTimer() { const t = $('#bTimer'); if (t) t.textContent = S.timerLeft > 0 ? `${Math.floor(S.timerLeft / 60)}:${String(S.timerLeft % 60).padStart(2, '0')}` : ''; }
  function teamsHtml() { return `<span class="${S.turn === 'A' ? 'on' : ''}">🔴 A: ${S.scores.A}</span><span class="${S.turn === 'B' ? 'on' : ''}">🔵 B: ${S.scores.B}</span>`; }
  function refreshTeams() { const t = document.querySelector('.teams'); if (t) t.innerHTML = teamsHtml(); const l = document.querySelector('.lbl'); if (l && steps[S.step] && steps[S.step].kind === 'quiz') l.textContent = 'Team ' + S.turn; }
  function mascot(name = 'mascot_wave') { return `<img class="masc" src="mascot/${name}.png" alt="">`; }
  function pic(c) {
    if (c.phrase) return `<div class="bigpic phrase">${mascot('mascot_point')}</div>`;
    if (c.icon_type === 'emoji') return `<div class="bigpic emo">${esc(c.icon)}</div>`;
    return `<div class="bigpic"><img src="${esc(c.icon)}" alt=""></div>`;
  }
  async function waitWhilePaused(my) { while (S.paused && my === token) await sleep(200); }
  async function hold(ms, my) { const end = Date.now() + ms; while (Date.now() < end && my === token) { await waitWhilePaused(my); await sleep(100); } }

  function titleScreen() {
    S.step = -1; post();
    app.innerHTML = `<div class="start">${mascot('mascot_wave')}<h1>${esc(lesson.title)}</h1>
      <p>Tema ${lesson.theme} · Ders ${lesson.n} / 11</p><button id="bStart" class="go">▶ Start</button>
      <p class="hint">Boşluk: duraklat · → sonraki · ← önceki · S: tekrar söyle</p></div>`;
    $('#bStart').onclick = () => go(0);
  }

  async function go(i) {
    stopSpeech(); token++;
    if (i < 0) { titleScreen(); return; }
    if (i >= steps.length) { endScreen(); return; }
    S.step = i; S.item = 0; S.paused = false; S.answer = null; S.timerLeft = 0; post();
    const my = token; const st = steps[i];
    try {
      if (st.kind === 'warm') await (lesson.warm.type === 'says' ? runSays(my) : runChorus(my, (data.lessons[lesson.index - 2] || lesson).cards.slice(0, 6), 'Warm-up'));
      else if (st.kind === 'review') await runChorus(my, st.items, 'Remember');
      else if (st.kind === 'new') await runChorus(my, st.items, 'New words', true);
      else if (st.kind === 'quiz') await runQuiz(my, st.items);
      else if (st.kind === 'active') await runActive(my, st.min);
      else if (st.kind === 'exit') await runExit(my, st.items);
    } catch (e) { /* adim degisti */ }
    if (my === token) go(i + 1);
  }

  async function runSays(my) {
    const cmds = shuffle(data.says).slice(0, 8);
    frame(`<div class="says">${mascot('mascot_point')}<div class="saytxt" id="sTxt">Aktapokus says…</div><div class="emo big" id="sEmo"></div></div>`, 'Aktapokus Says');
    await speak("Let's play Aktapokus Says! Listen and do!"); await hold(800, my);
    for (let k = 0; k < cmds.length && my === token; k++) {
      await waitWhilePaused(my);
      const [cmd, emo] = cmds[k]; const says = k === 0 || Math.random() < 0.7;
      S.item = k; S.answer = { says, cmd }; post();
      $('#sEmo').textContent = ''; $('#sTxt').textContent = '…';
      await speak((says ? 'Aktapokus says: ' : '') + cmd + '!');
      await hold(2500, my); if (my !== token) return;
      $('#sEmo').textContent = says ? emo : '🙅';
      $('#sTxt').textContent = says ? 'Aktapokus says: ' + cmd + '!' : cmd + '! (No "Aktapokus says" — don\'t move!)';
      await hold(2200, my);
    }
    await speak('Well done! Sit down, please.');
  }

  async function runChorus(my, items, label, withSentence) {
    if (!items.length) return;
    for (let k = 0; k < items.length && my === token; k++) {
      await waitWhilePaused(my);
      const c = items[k]; S.item = k; S.answer = { word: c.word, tr: c.tr }; post();
      frame(`<div class="card">${pic(c)}<div class="word">${esc(c.word)}</div>${withSentence && c.sentence ? `<div class="sent" id="cSent"></div>` : ''}<div class="cnt">${k + 1} / ${items.length}</div></div>`, label);
      await speak(c.word); await hold(500, my); if (my !== token) return;
      await speak('Everybody, say: ' + c.word); await hold(3000, my); if (my !== token) return;
      if (withSentence && c.sentence) { const el = $('#cSent'); if (el) el.textContent = c.sentence; await speak(c.sentence); await hold(1500, my); }
    }
  }

  async function runQuiz(my, pool) {
    const cards = pool.filter((c) => !c.phrase);
    if (cards.length < 3) return;
    const qs = shuffle(cards).slice(0, Math.min(8, cards.length));
    await speak("Team game! Team A and Team B. Ready?");
    for (let k = 0; k < qs.length && my === token; k++) {
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
            await speak('Yes! ' + c.word + '!'); resolve();
          } else {
            btn.classList.add('bad'); btn.disabled = true; tries++;
            S.turn = S.turn === 'A' ? 'B' : 'A'; post(); refreshTeams();
            await speak('Try again, Team ' + S.turn + '!');
            if (tries >= 2) { solved = true; const okb = [...document.querySelectorAll('.opt')].find((b) => b.dataset.w === c.word); if (okb) okb.classList.add('ok'); await speak('It is ' + c.word + '.'); resolve(); }
          }
        };
        document.querySelectorAll('.opt').forEach((b) => { b.onclick = () => pick(b.dataset.w, b); });
        board.quizKey = (n) => { const b = document.querySelectorAll('.opt')[n - 1]; if (b && !b.disabled) pick(b.dataset.w, b); };
        board.quizPick = (w) => { const b = [...document.querySelectorAll('.opt')].find((x) => x.dataset.w === w); if (b) pick(w, b); };
      });
      await speak('What is it?');
      await Promise.race([answered, (async () => { while (!solved && my === token) await sleep(150); })()]);
      board.quizKey = null; board.quizPick = null;
      if (my !== token) return;
      S.turn = S.turn === 'A' ? 'B' : 'A'; post();
      await hold(1500, my);
    }
    frame(`<div class="start">${mascot('mascot_celebrate')}<h1>🔴 A: ${S.scores.A} · 🔵 B: ${S.scores.B}</h1></div>`, 'Well done!');
    await speak('Well done, everybody!'); await hold(2500, my);
  }

  async function runActive(my, minutes) {
    frame(`<div class="active">${mascot('mascot_point')}<div class="inst">${esc(lesson.active.en)}</div></div>`, "Let's do it!");
    await speak(lesson.active.en); await hold(600, my); await speak(lesson.active.en);
    S.timerLeft = minutes * 60; post(); renderTimer();
    while (S.timerLeft > 0 && my === token) {
      await sleep(1000); await waitWhilePaused(my);
      if (my !== token) return;
      S.timerLeft--; renderTimer(); if (S.timerLeft % 5 === 0) post();
    }
    if (my === token) { await speak("Time's up! Well done! Sit down, please."); await hold(1000, my); }
  }

  async function runExit(my, items) {
    frame(`<div class="grid">${items.map((c) => `<div class="mini">${pic(c)}<b>${esc(c.word)}</b></div>`).join('')}</div>`, 'Bye bye!');
    await speak('Say it with me!');
    for (const c of items) { if (my !== token) return; await waitWhilePaused(my); await speak(c.word); await hold(1800, my); }
    await speak('Goodbye, everybody! See you next time!');
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
    else if (e.key === 'ArrowRight') go(S.step + 1);
    else if (e.key === 'ArrowLeft') go(S.step - 1);
    else if (e.key === 's' || e.key === 'S') repeat();
    else if (/^[1-3]$/.test(e.key) && board.quizKey) board.quizKey(Number(e.key));
  });
  if (bc) bc.onmessage = (ev) => {
    const m = ev.data || {};
    if (m.type === 'hello') post();
    else if (m.type === 'cmd') {
      if (m.cmd === 'start') go(Math.max(0, S.step));
      else if (m.cmd === 'next') go(S.step + 1);
      else if (m.cmd === 'prev') go(S.step - 1);
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
function mountTeacher(data) {
  let lesson = lessonById(data, query('id') || nextLesson(data).id);
  const bc = 'BroadcastChannel' in window ? new BroadcastChannel(CH) : null;
  let st = null; let lastSeen = 0;
  const app = $('#teacher');
  const send = (cmd, extra) => bc && bc.postMessage({ type: 'cmd', cmd, ...extra });

  function listHtml() {
    const cls = ClassSync.selected();
    const m = Object.assign({}, doneMap(), cls != null ? ClassSync.doneFor(cls) : {}); let theme = 0;
    return data.lessons.map((l) => {
      const head = l.theme !== theme ? `<h3>Tema ${l.theme}: ${esc(data.themes[l.theme].name)} · ${esc(data.themes[l.theme].tr)}</h3>` : '';
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
      <aside><h2>2. sınıf ders planı</h2>${listHtml()}</aside>
      <section>
        <div class="head"><div><div class="meta">Hafta ${lesson.week} · Ders ${lesson.index} / ${data.lessons.length} · ${esc(lesson.outcomes)}</div><h1>${esc(lesson.title)}</h1>
          <div class="target"><b>Hedef dil:</b> ${esc(lesson.target)} · <i>${esc(lesson.chunk)}</i></div></div>
          <div class="acts"><button id="tOpen" class="pri">🖥️ Tahtayı aç</button><a class="btn" href="ders-kart.html?id=${lesson.id}" target="_blank" rel="noopener">🖨️ Ders kartı</a></div></div>
        ${classBarHtml()}
        <div class="link ${linked ? 'ok' : ''}">${linked ? '🟢 Tahta bağlı' : '⚪ Tahta bağlı değil. "Tahtayı aç"a basın ve açılan pencereyi akıllı tahtaya (ikinci ekrana) sürükleyin. Tek ekranınız varsa tahta kendi başına ilerler; notları basılı ders kartından takip edin.'}</div>
        <div class="ctrl"><button data-c="prev">◀ Geri</button><button data-c="start" class="pri">▶ Başlat / Devam</button><button data-c="pause">⏸ Duraklat</button><button data-c="next">Sonraki adım ▶▶</button><button data-c="repeat">🔊 Tekrar söylet</button></div>
        ${ans ? `<div class="answer">${ans.word ? `Tahtadaki: <b>${esc(ans.word)}</b>${ans.tr ? ' = ' + esc(ans.tr) : ''}` : ''}${ans.cmd ? `Komut: <b>${esc(ans.cmd)}</b> · ${ans.says ? '✅ "Aktapokus says" dedi: hareket yapılır' : '🙅 "Aktapokus says" demedi: kıpırdamak yok'}` : ''}</div>` : ''}
        ${st && st.lessonId === lesson.id && st.step >= 0 ? `<div class="score">🔴 Takım A: <b>${st.scores.A}</b> <button data-s="A:1">+1</button><button data-s="A:-1">−1</button> &nbsp; 🔵 Takım B: <b>${st.scores.B}</b> <button data-s="B:1">+1</button><button data-s="B:-1">−1</button>${st.timerLeft > 0 ? ` &nbsp; ⏱️ ${Math.floor(st.timerLeft / 60)}:${String(st.timerLeft % 60).padStart(2, '0')}` : ''}</div>` : ''}
        <ol class="steps">${steps.map((s, i) => `<li class="${i === cur ? 'now' : i < cur ? 'past' : ''}"><div class="sh"><b>${i + 1}. ${esc(s.name)}</b> <span>${s.min} dk</span> <button data-g="${i}">buraya git</button></div><p>${esc(teacherNote(s, lesson))}</p>
          ${s.kind === 'new' ? `<table>${s.items.map((c) => `<tr><td>${esc(c.word)}</td><td>${esc(c.tr)}</td></tr>`).join('')}</table>` : ''}</li>`).join('')}</ol>
        <div class="done"><button id="tDone" class="pri">✅ İşlendi</button> <span>Ders bittiğinde basın. Öğrencilerin uygulamasında aynı ders "Bugünün dersi" olarak açılacak.</span></div>
      </section>`;
    app.querySelectorAll('.li').forEach((b) => { b.onclick = () => { lesson = lessonById(data, b.dataset.id); history.replaceState(null, '', '?id=' + lesson.id); render(); }; });
    app.querySelectorAll('[data-c]').forEach((b) => { b.onclick = () => send(b.dataset.c); });
    app.querySelectorAll('[data-g]').forEach((b) => { b.onclick = () => send('goto', { step: Number(b.dataset.g) }); });
    app.querySelectorAll('[data-s]').forEach((b) => { b.onclick = () => { const [team, d] = b.dataset.s.split(':'); send('score', { team, delta: Number(d) }); }; });
    $('#tOpen').onclick = () => { window.open('ders-tahta.html?id=' + lesson.id, 'ke-tahta', 'popup,width=1280,height=800'); };
  };
  function classBarHtml() {
    const pend = lsGet(PENDING_KEY, []).length;
    if (!ClassSync.hasSession()) return `<div class="link">🏫 İsteğe bağlı: Öğretmen paneline bu cihazda giriş yaparsanız "İşlendi" sınıfınıza da kaydedilir ve öğrencileriniz aynı dersi uygulamada "Bugünün dersi" olarak görür. Giriş yapmadan da ders planı çalışır.</div>`;
    if (ClassSync.error === 'schema') return `<div class="link">🏫 Sınıf eşitlemesi için veritabanı güncellemesi gerekiyor (lessons_schema.sql bir kez çalıştırılmalı). Şimdilik "İşlendi" yalnızca bu cihaza kaydediliyor.</div>`;
    if (!ClassSync.classes) return `<div class="link">🏫 ${ClassSync.error === 'offline' ? 'İnternet yok: sınıf listesi alınamadı. "İşlendi" bu cihazda bekletilir, internet gelince sınıfa gönderilir.' : ClassSync.error ? 'Sınıf listesi alınamadı; giriş süresi dolmuş olabilir. Öğretmen paneline yeniden giriş yapın. Şimdilik "İşlendi" bu cihaza kaydediliyor.' : 'Sınıflar yükleniyor…'}${pend ? ` · ⏳ Bekleyen ${pend} kayıt` : ''}</div>`;
    const sel = ClassSync.selected();
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
function mountCard(data) {
  const list = query('all') ? data.lessons : [lessonById(data, query('id') || nextLesson(data).id)];
  $('#card').innerHTML = list.map((lesson) => {
    const steps = buildSteps(data, lesson);
    return `<article><div class="meta">2. sınıf · Hafta ${lesson.week} · Ders ${lesson.index} / ${data.lessons.length} · Tema ${lesson.theme}: ${esc(data.themes[lesson.theme].tr)} · ${esc(lesson.outcomes)}</div>
      <h1>${esc(lesson.title)}</h1><p><b>Hedef dil:</b> ${esc(lesson.target)} — <i>${esc(lesson.chunk)}</i></p>
      <ol>${steps.map((s, i) => `<li><b>Adım ${i + 1}/${steps.length}: ${esc(s.name)} (${s.min} dk).</b> ${esc(teacherNote(s, lesson, true))}</li>`).join('')}</ol>
      ${lesson.cards.length && !lesson.review_only ? `<table><tr><th>Kelime</th><th>Türkçesi</th><th>Örnek cümle</th></tr>${lesson.cards.map((c) => `<tr><td>${esc(c.word)}</td><td>${esc(c.tr)}</td><td>${esc(c.sentence)}</td></tr>`).join('')}</table>` : ''}
      ${lesson.phrases.length ? `<p><b>Kalıplar:</b> ${lesson.phrases.map((p) => `${esc(p.en)} (${esc(p.tr)})`).join(' · ')}</p>` : ''}
      <p class="small">Tahta her adımı kendisi yürütür; adım numaraları tahtadaki noktalarla aynıdır. Boşluk tuşu: duraklat · →: sonraki adım · S: tekrar söylet.</p></article>`;
  }).join('');
  $('#pPrint').onclick = () => window.print();
}

loadData().then((data) => {
  const mode = document.body.dataset.mode;
  if (mode === 'board') mountBoard(data);
  else if (mode === 'teacher') mountTeacher(data);
  else if (mode === 'card') mountCard(data);
}).catch((e) => { document.body.insertAdjacentHTML('beforeend', `<p style="padding:24px">Ders verisi yüklenemedi: ${esc(e.message)}</p>`); });
