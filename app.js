import { mount } from './panel.js';
window.KE_STATIC = true;

const data = await (await fetch('data/episodes.json')).json();
const storiesData = await (await fetch('data/stories.json')).json();
const byId = new Map(data.categories.map((c) => [c.id, c]));
const storyById = new Map(storiesData.stories.map((s) => [s.id, s]));
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

const api = {
  async apiFetch(url) {
    if (/\/categories$/.test(url)) {
      return json(data.categories.map((c) => ({ id: c.id, title: c.title, episode_count: c.episode_count, word_count: c.word_count })));
    }
    const m = url.match(/\/categories\/([^/]+)\/episodes\/(\d+)$/);
    if (m) {
      const cat = byId.get(m[1]); const i = Number(m[2]);
      if (!cat || !cat.episodes[i]) return json({ detail: 'not found' }, 404);
      return json({ ...cat.episodes[i], category_id: cat.id, category_title: cat.title, episode_index: i, episode_count: cat.episode_count });
    }
    if (/\/stories$/.test(url)) {
      return json(storiesData.stories.map((s) => ({ id: s.id, title: s.title, title_tr: s.title_tr, episode_label: s.episode_label, intro: s.intro, cover: s.cover, card_count: s.cards.length })));
    }
    const sm = url.match(/\/stories\/([^/]+)$/);
    if (sm) {
      const story = storyById.get(sm[1]);
      if (!story) return json({ detail: 'not found' }, 404);
      return json(story);
    }
    return json({ detail: 'not found' }, 404);
  },
};

mount(document.getElementById('app'), api, 'kids_english');

if ('serviceWorker' in navigator) {
  // "her guncellemede kullanici elle onbellek temizlemek zorunda kalmasin,
  // otomatik olmali - kullanici site verisini kendi eliyle temizlemeyecek"
  // (kullanicinin kendi geri bildirimi). Iki parca:
  //
  // (1) sw.js'i her build'de degisen bir ?v= sorgu dizgesiyle kaydediyoruz
  // (asagida 834f699f09 yer tutucusu, build_pwa.py build hash'iyle
  // degistiriyor) - GitHub Pages TUM dosyalari CDN'de 10 dakika
  // onbelleklediginden (Cache-Control: max-age=600, updateViaCache:'none'
  // SADECE tarayicinin KENDI HTTP onbellegini atlar, GitHub'in CDN edge
  // onbellegini DEGIL), URL'nin KENDISI her deploy'da degismezse yeni bir
  // surum CDN'in 10 dakikalik penceresi doluncaya kadar fark edilmeyebilir.
  //
  // (2) YENI SW devreye girince sayfayi OTOMATIK yeniliyoruz - ama iki
  // guvenlik kemeriyle, cunku ilk denemede (kosulsuz reload) bu GERCEK BIR
  // REGRESYONA yol acmisti ("oyun oynarken bir sure sonra kendiliginden
  // ana ekrana donuyor, her yer refresh yapiyor gibi" - canli raporlandi):
  //   (a) SADECE sayfa ILK ACILDIGINDA ZATEN AKTIF bir SW varsa dinliyoruz
  //       (hadControllerAtLoad). Ilk kurulumda controller null'dan worker'a
  //       gectiginde de controllerchange ateslenir ama bu GERCEK bir
  //       guncelleme degil - o yuklemenin kendisi zaten agdan taze geldi,
  //       reload'a gerek yok, gereksiz yere tetiklenirse zincirleme
  //       reload'un ilk halkasi olabiliyordu.
  //   (b) HER SURUM ICIN EN FAZLA BIR KEZ yeniliyoruz (localStorage'da
  //       hangi surume zaten yenilendigimizi tutuyoruz). CDN edge
  //       tutarsizligi (deploy hemen sonrasi farkli node'lar farkli icerik
  //       donebiliyor) controllerchange'i tekrar tetiklese bile bu guard
  //       SONSUZ DONGUYU imkansiz kilar - ayni surum icin ikinci bir
  //       reload asla olmaz.
  // Boylece kullanici HICBIR SEY yapmadan (site verisi temizlemeden) bir
  // sonraki dogal ac/kapa VEYA arka plandan on plana gelisinde guncel
  // surume geciyor - ama bu tek reload asla tekrarlanmiyor.
  navigator.serviceWorker.register('sw.js?v=834f699f09', { updateViaCache: 'none' }).then((reg) => {
    reg.update().catch(() => {});
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reg.update().catch(() => {});
    });
  }).catch(() => {});
  const hadControllerAtLoad = !!navigator.serviceWorker.controller;
  if (hadControllerAtLoad) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      const target = '834f699f09';
      let already = '';
      try { already = window.localStorage.getItem('ke_sw_reloaded_for') || ''; } catch (e) { /* yok say */ }
      if (already === target) return;
      // "Oyun oynarken kendi kendine kapanip basa donuyor" - yeni surum
      // arka plandan donuste aktiflesince sayfa ANINDA yenileniyordu (oyun,
      // bolum ortasi, atlama sinavi kayboluyordu). Artik yenileme sadece
      // GUVENLI bir ekrandayken (ana ekran / harita / kategori listesi,
      // acik panel yok) yapiliyor; degilse o ana kadar bekleniyor.
      const safe = () => !!document.querySelector('.ke-carnival-hero, .ke-journey, #keCategoryGrid')
        && !document.querySelector('.ke-river-overlay-msg, .ke-bonus-quiz, .ke-game-panel, canvas');
      const go = () => {
        try { window.localStorage.setItem('ke_sw_reloaded_for', target); } catch (e) { /* yok say */ }
        window.location.reload();
      };
      if (safe()) { go(); return; }
      const timer = setInterval(() => { if (safe()) { clearInterval(timer); go(); } }, 3000);
    });
  }
}
