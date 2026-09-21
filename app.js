import { mount } from './panel.js';
window.KE_STATIC = true;

const data = await (await fetch('data/episodes.json')).json();
const byId = new Map(data.categories.map((c) => [c.id, c]));
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
    return json({ detail: 'not found' }, 404);
  },
};

mount(document.getElementById('app'), api, 'kids_english');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
