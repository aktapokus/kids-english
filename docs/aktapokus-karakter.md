# Aktapokus — Karakter Kitabı

> Durum: taslak v0.1 (2026-09-27). Kaynak: kullanıcı yönergesi (Faz 3) + 2026-09-27 düzeltmesi:
> **kırmızı olan göz değil, gözlük camıdır; rengi değişen de camdır.**
> Bu belge kod değiştirmez. Uygulamadaki mevcut metinlerle çelişkiler en sonda listelenmiştir; hiçbiri değiştirilmedi.
> `⚠ AÇIK` ile işaretli maddeler tasarım kararı bekliyor.

---

## 1. Köken

- Aktapokus, küçük, sarı, **altı kollu** bir ahtapottur. Sivri siyah saçları ve yuvarlak siyah gözlükleri vardır.
- Bilime meraklıdır. Her şeyin "neden"ini sorar.
- Bir kaza sonrası gözlüğünün sağ camı kırmızıya döner.
  - Kaza, deniz dibindeki eski küçük uzay gemisinde yaşanır.
  - Oradaki dijital mercek gözlüğüne yerleşir.
- O günden beri Aktapokus baktığı her şeyin **bilimsel açıklamasını anlar**:
  - adını,
  - neyden yapıldığını,
  - nasıl çalıştığını.
- ⚠ AÇIK:
  - "Kaza" ile Bölüm 1–2'deki "dijital göz / robot göz" anlatımı nasıl birleşecek?
  - Öneri: dijital mercek gemiden fırlar ve gözlüğün camına oturur. Kaza budur, göz değişmez.

## 2. Gücü

- Asıl güç **bilgi**dir: kas gücü ya da ışın değil.
- Kırmızı cam iki şeyi ayırt eder:
  1. **Bildiği**: açıklaması olan, verisi yeterli şey.
  2. **Bilmediği**: belirsizliğin başladığı yer.
- Aktapokus'u süper kahraman yapan şey, **neyi bilip neyi bilmediğini ayırt edebilmesidir**.
  - Tahmin etmez, uydurmaz.
  - Emin olmadığında bunu gösterir.
- Kural: **cam yanılmaz.** Kullanıcı, 2026-09-25'te "o bir süper kahraman" diye belirledi.
  - Yanılmamasının nedeni her şeyi bilmesi değildir.
  - Bilmediği yerde "bilmiyorum" demesidir.
- Kural: **cam konuşmaz ve bir karakter değildir.** Aktapokus'a özellik katan bir araçtır.

## 3. Yetkinlikleri

| Esin | Aktapokus'taki karşılığı |
|---|---|
| MacGyver | Elindeki sıradan şeylerle çözüm kurar: deniz kabuğu, ip, yosun |
| Tony Stark | Mühendis kafası: parçaları anlar, geliştirir, dener |
| Tarzan | Doğayla konuşur gibi yaşar; denizi, hayvanları, havayı okur |

**Ortak payda: ortamı okumak.** Üçü de önce çevresine bakar, sonra harekete geçer. Aktapokus'un kırmızı camı bu okumayı hızlandırır.

## 4. Gözlük camı (lore ↔ uygulama)

### Renk = alan (domain)

Uygulama tarafı: `--aktapokus-eye`, `ui/mascot/eye_domains.json`.

| Alan | Renk | Anlamı |
|---|---|---|
| nature (doğa) | yeşil `#2FB34A` | canlılar, deniz, hava |
| space (uzay) | mavi `#2F7BEB` | gökyüzü, gezegenler, yolculuk |
| logic (mantık) | kırmızı `#FA4F32` | sayı, şekil, bilim, akıl yürütme |
| general (genel) | kırmızı `#FA4F32` | günlük hayat. Varsayılan ve "orijinal" renk budur |

- Hikâyede cam, Aktapokus'un **o an neyi incelediğine** göre renk alır.
- Kaza anının rengi kırmızıdır. "Orijinal" renk buradan gelir.
- Çocuk isterse camı sabit bir renge ayarlayabilir.
  - Bu hikâyede "Aktapokus'un en sevdiği renk" olarak okunur.
  - Durum sinyalleri yine çalışır.

### Durum = parlama ve hareket

| Durum | Görünüm | Anlamı |
|---|---|---|
| `analyzing` | sabit, yumuşak hale; cam biraz parlar | "Bakıyorum, anlıyorum." |
| `uncertain` | dış halkada yavaş nabız; göz bebeği küçülür | "Burada bilmiyorum, veri lazım." |
| `idle` | hale yok; arada göz kırpma | Dinleniyor, çevreyi izliyor |

- Belirsizlik nabzı **hata sinyali değildir.** Merak sinyalidir.
  - Uygulamada yanlış cevaptan sonra görünür: "Hadi birlikte veri toplayalım."
  - Kırmızı "yanlış" anlamına gelmez. Bu nedenle nabız, renkten bağımsız olarak şekil ve hareketle de ayırt edilir.

## 5. Açık tasarım soruları

### ⚠ AÇIK 1 — Zafiyet

- Öneri: Aktapokus açıklamayı anlar ama **veriyi kendisi toplayamaz.**
  - Kırmızı cam "neyi bilmediğini" gösterir.
  - O eksik parçayı bulmak için **çocuğa** ihtiyaç duyar.
- **Çocuk onun gözü ve elidir:**
  - bakar, dinler, söyler, seçer;
  - Aktapokus da açıklar.
- Pedagojik karşılığı: her soru turu, çocuğun Aktapokus'a veri getirmesidir.
- Karar gereken sorular:
  - Bu zafiyet hikâyede açıkça söylenecek mi?
  - Yoksa yalnızca oyun mekaniğinde mi kalacak?

### ⚠ AÇIK 2 — 8 yaş için "kırmızı cam korkutucu olmasın"

- Hedef: kırmızı cam **tehdit değil, merak** çağrıştırsın.
- Uygulamada şimdiden yapılanlar:
  - yuvarlak göz bebeği;
  - yumuşak parlama;
  - arada göz kırpma;
  - keskin ışın yok;
  - "kötü robot göz" kalıbı yok.
- Görsel üretim komutlarına eklenmesi önerilen ifadeler:
  - "soft friendly glow";
  - "round pupil visible";
  - "no laser beams";
  - "not menacing".
- Karar gereken:
  - Karanlık sahnelerde cam hangi renkte olacak?
  - Öneri: uzay mavisi ya da yumuşak kırmızı; korku sahnesinde parlamasın.

### ⚠ AÇIK 3 — "Yanılmaz" ile "bilmediğini bilir" nasıl uzlaşır?

- Öneri ilke: cam **asla yanlış bilgi vermez.** Ya doğruyu gösterir ya "bilmiyorum" der.
- Bu durumda hikâyedeki "The red eye knows every name" gibi mutlak cümleler yumuşatılmalı.
- Karar kullanıcıda.

### ⚠ AÇIK 4 — Adlandırma

- Metinlerde "red eye / digital eye" geçiyor, 2. bölüm kapağında ise "The Red Lens".
- Seçenekler:
  - İngilizce için "the red lens";
  - Türkçe için "kırmızı cam" ya da "kırmızı mercek".
- Tek bir ad seçilmeli.

---

## 6. Çelişen mevcut metinler (DEĞİŞTİRİLMEDİ — karar bekliyor)

| # | Yer | Metin | Çelişki |
|---|---|---|---|
| 1 | `data/stories.json` · Bölüm 1, kart 10 (**yayında**) | "The digital eye looks at Aktapokus." … "HELLO, EXPLORER." | Göz **konuşuyor**; kural: cam konuşmaz |
| 2 | Bölüm 1, kart 9 (yayında) | "He sees a strange digital eye. Suddenly, the eye turns on. BEEP!" | "Göz" deniyor; düzeltmeye göre mercek/cam |
| 3 | `meb_research/story_ch2_v1.py` (taslak) · başlık | "The Red Eye / Kırmızı Göz" | Kapak görseli "The Red Lens" diyor; kırmızı olan cam |
| 4 | Bölüm 2 taslak, kart 1 | "The eye jumps into his eye!" | Mercek gözüne değil gözlüğüne oturmalı; ayrıca "kaza" anlatımı yok |
| 5 | Bölüm 2 taslak, kart 2 | "One eye is black. One eye is red!" | Göz değil cam kırmızı |
| 6 | Bölüm 2 taslak, kart 6 | "The red eye knows every name. It knows the sea and the sky." | Mutlak bilgi; "neyi bilmediğini bilir" ilkesiyle çelişir (AÇIK 3) |
| 7 | Bölüm 2 taslak, kart 7 | "I can see. I can learn. I can know!" | "Know" mutlak; ilkeye göre "I can find out!" daha uygun olabilir |
| 8 | Bölüm 2 taslak, soru 1 | "What colour is the new eye?" | Göz değil cam |
| 9 | `story_ch3_v1.py` (taslak) · "The Sky" kartı | "The red eye knows every word!" | 6 ile aynı |
| 10 | `story_build.py` görsel komutu (HERO) | "his RIGHT eye behind the glasses glows RED" | Görsel komutu gözü boyatıyor; cam olmalı. Ayrıca adaptif renk, hikâyede hep kırmızı |
| 11 | `content_model/characters.json` | "A digital eye became his right eye … the eye never speaks and is never wrong" | "Göz oldu" anlatımı; "never wrong" AÇIK 3'e göre netleşmeli |
| 12 | Bölüm 2 görselleri 9 ve 10 | Görselde Baba yok (kart "Dad looks at the red eye"); gece ve yıldız yerine ışığa yükselme | Metin–görsel uyumsuzluğu (lore değil ama aynı karar turunda) |

**Güncelleme 2026-09-27 (kullanıcı onayıyla uygulandı):**
- 3, 4, 5, 8 ve 10 düzeltildi. Bölüm 2 artık "The Red Lens / Kırmızı Cam" adını taşıyor; metinde ve görsel komutlarında "eye" yerine "lens" kullanılıyor.
- 6, 7 ve 9 yalnızca "eye → lens" olarak güncellendi. "Knows every name" mutlaklığı AÇIK 3 kararını bekliyor.
- Hâlâ açık:
  - 1 ve 2 (yayındaki Bölüm 1: göz konuşuyor);
  - 11 (`characters.json`);
  - 12 (Bölüm 2'nin 9. ve 10. görselleri; metin olduğu gibi yayında).

Uygulamanın kendi arayüz metinleri çelişki içermiyor. Kontrol edilen yerler:
- karşılama: "Kelime Yıldızları uzaya dağıldı…";
- tepki balonları;
- yardım ekranı.
