// Sunucu ayari (tek yer, 2026-09-30). Uygulama, ogretmen paneli ve ders plani
// buradan okur. Okullarin kendi sunucusu icin hazirlik: ileride okul kodu / QR
// ile gelen adres 'ke_server_v1' anahtarina yazilir ve varsayilanin yerine
// gecer. Yalniz yayimlanabilir (publishable) anahtar; gizli anahtar ASLA.
(function () {
  var DEFAULT = {
    url: 'https://wtrkfzmmhabcpoipaccf.supabase.co',
    key: 'sb_publishable_87EZgr1ftB1SnIY5FoDaKA_xmxlD7kU',
  };
  var cfg = DEFAULT;
  try {
    var o = JSON.parse(window.localStorage.getItem('ke_server_v1') || 'null');
    if (o && typeof o.url === 'string' && /^https:\/\//.test(o.url) && typeof o.key === 'string') cfg = { url: o.url.replace(/\/+$/, ''), key: o.key };
  } catch (e) { /* varsayilan */ }
  window.KE_SERVER = cfg;
})();
