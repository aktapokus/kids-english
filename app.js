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
  // - iki parca: (1) updateViaCache:'none' tarayiciya sw.js dosyasinin
  // KENDISINI asla HTTP onbelleginden degil, her zaman agdan almasini
  // soyler (spec geregi normalde bu kontrol max 24 saatte bir yapilir -
  // bu satir olmadan yeni bir surum gunler boyu fark edilmeyebiliyordu).
  // (2) yeni bir SW devreye girince (skipWaiting+clients.claim zaten
  // sw.js icinde) sayfayi KENDILIGINDEN bir kez yeniliyoruz - kullanici
  // hicbir sey yapmadan bir sonraki acilista guncel icerigi goruyor.
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => {
    reg.update().catch(() => {});
  }).catch(() => {});
  let keRefreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (keRefreshing) return;
    keRefreshing = true;
    window.location.reload();
  });
}
