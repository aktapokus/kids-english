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
  // "her guncellemede kullanici elle onbellek temizlemek zorunda kalmasin"
  // - sw.js'i her build'de degisen bir ?v= sorgu dizgesiyle kaydediyoruz
  // (asagida a2fc6b86a8 yer tutucusu, build_pwa.py build hash'iyle
  // degistiriyor) - GitHub Pages TUM dosyalari CDN'de 10 dakika
  // onbelleklediginden (Cache-Control: max-age=600, updateViaCache:'none'
  // SADECE tarayicinin KENDI HTTP onbellegini atlar, GitHub'in CDN edge
  // onbellegini DEGIL), URL'nin KENDISI her deploy'da degismezse yeni bir
  // surum CDN'in 10 dakikalik penceresi doluncaya kadar fark edilmeyebilir.
  //
  // ONEMLI: burada KASITLI OLARAK otomatik window.location.reload() YOK.
  // Once vardi ("yeni SW devreye girince sayfayi kendiliginden yenile")
  // ama GERCEK BIR REGRESYONA yol acti - "oyun oynarken bir sure sonra
  // kendiliginden ana ekrana donuyor" seklinde bildirildi. Sebep: (1)
  // controllerchange, controller'i hic olmayan bir istemcide (ILK KURULUM)
  // bile null->worker gecisinde ateslenir, gercek bir "guncelleme" olmasa
  // bile; (2) her reload() YENI bir app.js calistirmasi baslatiyor, o da
  // kendi reg.update()'ini tetikliyor - CDN'in 10dk penceresi henuz her
  // edge node'a yayilmamissa (deploy'dan hemen sonra) farkli istekler
  // farkli icerik alabiliyor, bu da controllerchange'i TEKRAR tetikleyip
  // kendi kendini besleyen bir reload donguisune donusebiliyor - cocuk
  // bir bolumun ortasindayken beklenmedik sekilde ana ekrana atiliyordu.
  // Guncel surum zaten BIR SONRAKI dogal sayfa acilisinda (?v= sayesinde)
  // garantili yukleniyor - kullanicinin o an ortasinda oldugu bir oturumu
  // riske atan otomatik reload'a gerek yok.
  navigator.serviceWorker.register('sw.js?v=a2fc6b86a8', { updateViaCache: 'none' }).then((reg) => {
    reg.update().catch(() => {});
  }).catch(() => {});
}
