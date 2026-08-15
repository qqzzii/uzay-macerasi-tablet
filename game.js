// ===================== Uzay Macerası - Oyun Mantığı =====================

const STORAGE_KEY = 'uzaymacerasi_progress_v1';

// Her durak güneş sistemindeki bir gezegen. Zorluk arttıkça sayılar büyüyor
// ve her durakta hem toplama hem de çıkarma soruları birlikte, karışık çıkıyor.
// "resource" alanı o gezegene özel görev göstergesini (ilerleme barını) tanımlar.
// İlk gezegenlerde sayı aralığı 10'u geçmez (5-6 yaş için daha uygun); sonrasında
// yavaşça büyür. "penalizeMistakes" false olduğu sürece yanlış cevap ilerleme
// barını düşürmez, sadece tekrar denemeyi ister (özgüven için).
// "sunScale" arka plandaki güneşin göreli boyutunu, gezegenin gerçek güneş
// uzaklığına göre belirler (Merkür'de en büyük, Galaksi Kapısı'nda en küçük).
const LEVELS = [
  { id: 1,  title: 'Ay Üssü',        icon: '🌙', ops: ['+', '-'], min: 1, max: 5,  count: 6,  useObjects: true, penalizeMistakes: false, sunScale: 1.0,  resource: { icon: '⛽', label: 'Yakıt Deposu', anim: 'fuel' } },
  { id: 2,  title: 'Merkür',         icon: '🟤', ops: ['+', '-'], min: 1, max: 6,  count: 6,  useObjects: true, penalizeMistakes: false, sunScale: 1.5,  resource: { icon: '🔆', label: 'Isı Kalkanı', anim: 'heat' } },
  { id: 3,  title: 'Venüs',          icon: '🟡', ops: ['+', '-'], min: 1, max: 8,  count: 7,  useObjects: true, penalizeMistakes: false, sunScale: 1.2,  resource: { icon: '📡', label: 'Radar Sinyali', anim: 'radar' } },
  { id: 4,  title: 'Dünya',          icon: '🌍', ops: ['+', '-'], min: 2, max: 10, count: 7,  useObjects: true, penalizeMistakes: false, sunScale: 1.0,  resource: { icon: '🔋', label: 'Enerji Hücresi', anim: 'energy' } },
  { id: 5,  title: 'Mars',           icon: '🔴', ops: ['+', '-'], min: 2, max: 10, count: 7,  useObjects: true, penalizeMistakes: false, sunScale: 0.8,  resource: { icon: '🌪️', label: 'Toz Kalkanı', anim: 'dust' } },
  { id: 6,  title: 'Jüpiter',        icon: '🟠', ops: ['+', '-'], min: 2, max: 12, count: 8,  useObjects: true, penalizeMistakes: true,  sunScale: 0.55, resource: { icon: '⚡', label: 'Fırtına Kalkanı', anim: 'storm' } },
  { id: 7,  title: 'Satürn',         icon: '🪐', ops: ['+', '-'], min: 3, max: 14, count: 8,  useObjects: true, penalizeMistakes: true,  sunScale: 0.42, resource: { icon: '💫', label: 'Halka Enerjisi', anim: 'rings' } },
  { id: 8,  title: 'Uranüs',         icon: '🔵', ops: ['+', '-'], min: 3, max: 16, count: 8,  useObjects: true, penalizeMistakes: true,  sunScale: 0.32, resource: { icon: '❄️', label: 'Buz Kalkanı', anim: 'ice' } },
  { id: 9,  title: 'Neptün',         icon: '🟣', ops: ['+', '-'], min: 4, max: 18, count: 9,  useObjects: true, penalizeMistakes: true,  sunScale: 0.24, resource: { icon: '🌬️', label: 'Rüzgar Enerjisi', anim: 'wind' } },
  { id: 10, title: 'Galaksi Kapısı', icon: '🌌', ops: ['+', '-'], min: 4, max: 20, count: 10, useObjects: true, penalizeMistakes: true,  sunScale: 0.14, resource: { icon: '🔑', label: 'Galaksi Anahtarı', anim: 'key' } },
];

// Her gezegen durağı için hikaye metinleri: göreve başlarken, hedef ve tamamlanınca.
// Her gezegenin kendine özgü, ayrı bir görevi vardır (yakıt doldurma, radar tarama, kalkan onarma vb.).
const STORY = {
  1: {
    intro: 'Kaptan Doruk roketiyle büyük uzay yolculuğuna çıkıyor! İlk durak Ay Üssü 🌙. Roketin yakıt deposunu doldurmak için görevleri tamamlamalısın.',
    goal: 'Görev: Yakıt deposunu doldurmak için 6 doğru cevap ver!',
    success: 'Yakıt deposu dolduruldu! 🌙 Roket bir sonraki durağa, Merkür\'e doğru yola çıkıyor...',
  },
  2: {
    intro: 'Güneşe en yakın gezegen Merkür çok sıcak! Kaptan Doruk\'un roketi burada erimemek için bir ısı kalkanına ihtiyaç duyuyor.',
    goal: 'Görev: Isı kalkanını güçlendirmek için 6 doğru cevap ver!',
    success: 'Isı kalkanı tamamlandı! 🟤 Roket şimdi Venüs\'e doğru ilerliyor...',
  },
  3: {
    intro: 'Venüs yoğun bulutlarla kaplı gizemli bir gezegen. Kaptan Doruk bulutların arasından güvenle geçmek için radar sinyaline ihtiyaç duyuyor.',
    goal: 'Görev: Radar sinyalini taramak için 7 doğru cevap ver!',
    success: 'Radar sinyali tamamlandı! 🟡 Sırada yuvamız Dünya var...',
  },
  4: {
    intro: 'İşte yuvamız, mavi gezegen Dünya! Kaptan Doruk roketi için enerji hücrelerini doldurmak istiyor.',
    goal: 'Görev: Enerji hücrelerini doldurmak için 7 doğru cevap ver!',
    success: 'Enerji hücreleri dolduruldu! 🌍 Roket kızıl gezegen Mars\'a gidiyor...',
  },
  5: {
    intro: 'Kızıl gezegen Mars\'ta güçlü kum fırtınaları var! Kaptan Doruk roketi korumak için bir toz kalkanı kurmalı.',
    goal: 'Görev: Toz kalkanını kurmak için 7 doğru cevap ver!',
    success: 'Toz kalkanı tamamlandı! 🔴 Sırada dev gezegen Jüpiter var...',
  },
  6: {
    intro: 'Jüpiter, güneş sisteminin en büyük gezegeni! Devasa fırtınalardan kaçmak için güçlü bir fırtına kalkanı gerekiyor.',
    goal: 'Görev: Fırtına kalkanını doldurmak için 8 doğru cevap ver!',
    success: 'Fırtına kalkanı tamamlandı! 🟠 Roket Satürn\'ün halkalarına yaklaşıyor...',
  },
  7: {
    intro: 'Satürn\'ün muhteşem halkaları arasında roketi güvenle yönlendirmek için halka enerjisi toplamak gerekiyor.',
    goal: 'Görev: Halka enerjisini toplamak için 8 doğru cevap ver!',
    success: 'Halka enerjisi tamamlandı! 🪐 Sırada buzlu gezegen Uranüs var...',
  },
  8: {
    intro: 'Uranüs çok soğuk bir buz gezegeni! Kaptan Doruk üşümemek için bir buz kalkanı oluşturmalı.',
    goal: 'Görev: Buz kalkanını oluşturmak için 8 doğru cevap ver!',
    success: 'Buz kalkanı tamamlandı! 🔵 Roket güneş sisteminin son gezegeni Neptün\'e gidiyor...',
  },
  9: {
    intro: 'Neptün, güneşten en uzak gezegen ve rüzgârları çok güçlü! Roketin rüzgar enerjisini toplamak gerekiyor.',
    goal: 'Görev: Rüzgar enerjisini toplamak için 9 doğru cevap ver!',
    success: 'Rüzgar enerjisi tamamlandı! 🟣 Artık güneş sistemini tamamladın, sırada Galaksi Kapısı var!',
  },
  10: {
    intro: 'Son durak: Galaksi Kapısı! Kaptan Doruk yıldızlararası yolculuğa çıkmak için galaksi anahtarını tamamlamalı.',
    goal: 'Görev: Galaksi anahtarını tamamlamak için 10 doğru cevap ver!',
    success: 'Tebrikler Kaptan! 🌌 Galaksi anahtarını tamamladın ve güneş sistemi macerasını bitirdin! 🎉',
  },
};

const CONFETTI_COLORS = ['#ff8a3d', '#ffd166', '#4f9bff', '#4cd471', '#ff5c8a', '#a06bff'];

// ===================== İlerleme (localStorage) =====================

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { unlockedLevel: 1, stars: {} };
    const parsed = JSON.parse(raw);
    return {
      unlockedLevel: parsed.unlockedLevel || 1,
      stars: parsed.stars || {},
    };
  } catch (e) {
    return { unlockedLevel: 1, stars: {} };
  }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

let progress = loadProgress();

// ===================== Yardımcı Fonksiyonlar =====================

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showScreen(name) {
  document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
}

function setMascotMessage(text, mood) {
  const msgEl = document.getElementById('mascot-message');
  const avatarEl = document.getElementById('mascot-avatar');
  if (msgEl) msgEl.textContent = text;
  if (avatarEl) {
    avatarEl.classList.remove('happy', 'sad');
    if (mood) {
      void avatarEl.offsetWidth; // reflow ile animasyonu yeniden tetikle
      avatarEl.classList.add(mood);
    }
  }
}

// Tüm ekranların arkasındaki sabit yıldız katmanı; sadece bir kez oluşturulur.
function renderBackgroundStars() {
  const layer = document.getElementById('bg-stars');
  if (!layer) return;
  for (let i = 0; i < 70; i++) {
    const star = document.createElement('div');
    star.className = 'bg-star';
    const size = 1 + Math.random() * 2;
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    star.style.animationDelay = (Math.random() * 3) + 's';
    layer.appendChild(star);
  }
}
renderBackgroundStars();

function spawnConfetti(count) {
  const layer = document.getElementById('confetti-layer');
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = CONFETTI_COLORS[randInt(0, CONFETTI_COLORS.length - 1)];
    const duration = 2 + Math.random() * 1.5;
    piece.style.animationDuration = duration + 's';
    piece.style.animationDelay = (Math.random() * 0.4) + 's';
    layer.appendChild(piece);
    setTimeout(() => piece.remove(), (duration + 0.5) * 1000);
  }
}

// ===================== Ses ve Seslendirme =====================

let audioCtx = null;

function getAudioCtx() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioCtx) audioCtx = new AudioCtor();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(freq, duration, type, startTime, volume) {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    const t0 = ctx.currentTime + (startTime || 0);
    gain.gain.setValueAtTime(volume || 0.25, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  } catch (e) { /* ses desteklenmiyorsa sessizce yoksay */ }
}

function playSuccessSound() {
  playTone(880, 0.15, 'sine', 0, 0.25);
  playTone(1174, 0.22, 'sine', 0.12, 0.25);
}

function playErrorSound() {
  playTone(220, 0.28, 'sawtooth', 0, 0.18);
  playTone(160, 0.3, 'sawtooth', 0.05, 0.14);
}

function createNoiseBuffer(ctx, duration) {
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function playRocketSound(duration) {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime;

    // Gürültü tabanlı motor kükremesi (roket itici sesi)
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, duration + 0.2);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.Q.value = 0.7;
    noiseFilter.frequency.setValueAtTime(2200, t0);
    noiseFilter.frequency.linearRampToValueAtTime(500, t0 + duration);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, t0);
    noiseGain.gain.linearRampToValueAtTime(0.35, t0 + 0.15);
    noiseGain.gain.linearRampToValueAtTime(0.18, t0 + duration * 0.6);
    noiseGain.gain.linearRampToValueAtTime(0.0001, t0 + duration);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t0);
    noise.stop(t0 + duration + 0.1);

    // Alçak frekanslı itki gürültüsü (bas roket motoru)
    const rumble = ctx.createOscillator();
    const rumbleGain = ctx.createGain();
    rumble.type = 'sawtooth';
    rumble.frequency.setValueAtTime(90, t0);
    rumble.frequency.linearRampToValueAtTime(40, t0 + duration);
    rumbleGain.gain.setValueAtTime(0.0001, t0);
    rumbleGain.gain.linearRampToValueAtTime(0.22, t0 + 0.2);
    rumbleGain.gain.linearRampToValueAtTime(0.0001, t0 + duration);
    rumble.connect(rumbleGain);
    rumbleGain.connect(ctx.destination);
    rumble.start(t0);
    rumble.stop(t0 + duration + 0.1);

    // Motor titreşimi hissi veren hafif tremolo (gürültü kazancını modüle eder)
    const tremolo = ctx.createOscillator();
    const tremoloGain = ctx.createGain();
    tremolo.type = 'sine';
    tremolo.frequency.value = 18;
    tremoloGain.gain.value = 0.08;
    tremolo.connect(tremoloGain);
    tremoloGain.connect(noiseGain.gain);
    tremolo.start(t0);
    tremolo.stop(t0 + duration + 0.1);
  } catch (e) { /* ses desteklenmiyorsa sessizce yoksay */ }
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    if (!ttsVoice) pickBestVoice(); // sesler henüz yüklenmemiş olabilir, tekrar dene
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'tr-TR';
    utter.rate = 0.95;
    utter.pitch = 1.05;
    if (ttsVoice) utter.voice = ttsVoice;
    window.speechSynthesis.speak(utter);
  } catch (e) { /* TTS desteklenmiyorsa sessizce yoksay */ }
}

function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

// Görev seslendirmesi için önce kullanıcının kendi kaydettiği ses dosyasını dener
// (audio/gorev-<id>.mp3), dosya yoksa veya çalınamazsa tarayıcı TTS'ine döner.
// Not: Oyun file:// ile (index.html'e çift tıklayarak) açıldığında bazı tarayıcılar
// <audio> etiketiyle doğrudan yerel dosya oynatmayı reddediyor ("Format error").
// Bunu aşmak için dosyayı fetch ile bayt olarak indirip bir Blob URL üzerinden çalıyoruz.
let missionVoiceAudio = null;
let missionVoiceObjectUrl = null;
let missionVoiceToken = 0;

function stopMissionVoice() {
  missionVoiceToken++; // bu andan sonra gelen eski fetch/play sonuçlarını geçersiz kılar
  if (missionVoiceAudio) {
    missionVoiceAudio.pause();
    missionVoiceAudio.currentTime = 0;
    missionVoiceAudio = null;
  }
  if (missionVoiceObjectUrl) {
    URL.revokeObjectURL(missionVoiceObjectUrl);
    missionVoiceObjectUrl = null;
  }
  stopSpeaking();
}

function playMissionVoice(levelId, fallbackText) {
  stopMissionVoice();
  const token = missionVoiceToken;
  const src = `audio/gorev-${levelId}.mp3`;

  // fetch() bazı tarayıcı/platformlarda yerel dosyalarda engellenebilir;
  // bu durumda dosyayı doğrudan <audio> ile yüklemeyi dener, o da olmazsa TTS'e döner.
  const tryDirectFile = (reason) => {
    if (token !== missionVoiceToken) return;
    console.warn('Görev sesi (fetch) çalınamadı, doğrudan dosya deneniyor:', reason);
    const audio = new Audio(src);
    audio.addEventListener('error', () => {
      if (token !== missionVoiceToken) return;
      console.warn('Görev sesi doğrudan dosyadan da çalınamadı, TTS kullanılıyor.');
      speak(fallbackText);
    });
    missionVoiceAudio = audio;
    audio.play().catch((err) => {
      if (token !== missionVoiceToken) return;
      console.warn('Görev sesi (doğrudan dosya) play() reddedildi, TTS kullanılıyor:', err);
      speak(fallbackText);
    });
  };

  fetch(src)
    .then((res) => {
      if (!res.ok) throw new Error('Ses dosyası bulunamadı: ' + res.status);
      return res.blob();
    })
    .then((blob) => {
      if (token !== missionVoiceToken) return;
      const url = URL.createObjectURL(blob);
      missionVoiceObjectUrl = url;
      const audio = new Audio(url);
      audio.addEventListener('error', () => tryDirectFile('blob audio hatası'));
      missionVoiceAudio = audio;
      audio.play().catch((err) => tryDirectFile('blob play() reddedildi: ' + err));
    })
    .catch((err) => tryDirectFile('fetch hatası: ' + err));
}

// Tarayıcının sunduğu sesler arasından Türkçe olanı seçer; mümkünse en doğal
// (çevrimiçi / nöral) sesi tercih eder. Edge gibi tarayıcılar "Online (Natural)"
// etiketli Microsoft nöral seslerini sunar; bunlar varsayılan robotik sesten
// belirgin şekilde daha kaliteli çıkar. Türkçe ses bulunamazsa yanlış dilde bir
// sesi zorla atamıyoruz; tarayıcı utter.lang'e göre kendi varsayılanını kullanır.
let ttsVoice = null;

function pickBestVoice() {
  if (!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;

  const turkishVoices = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('tr'));
  if (!turkishVoices.length) return;

  const natural = turkishVoices.find((v) => /online|natural|neural/i.test(v.name));
  ttsVoice = natural || turkishVoices[0];
}

if ('speechSynthesis' in window) {
  pickBestVoice();
  window.speechSynthesis.onvoiceschanged = pickBestVoice;
}

// ===================== Roket Uçuş Geçişi =====================

function playRocketFlight(fromLevel, toLevel, onDone) {
  const overlay = document.getElementById('overlay-rocketflight');
  document.getElementById('flight-planet-from').textContent = fromLevel.icon;
  document.getElementById('flight-planet-to').textContent = toLevel.icon;

  const starsLayer = document.getElementById('flight-stars');
  starsLayer.innerHTML = '';
  for (let i = 0; i < 30; i++) {
    const star = document.createElement('div');
    star.className = 'flight-star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.animationDelay = (Math.random() * 1.4) + 's';
    starsLayer.appendChild(star);
  }

  const rocket = document.getElementById('flight-rocket');
  rocket.style.animation = 'none';
  void rocket.offsetWidth; // reflow ile animasyonu baştan tetikle
  rocket.style.animation = '';

  overlay.classList.remove('hidden');
  playRocketSound(1.8);

  setTimeout(() => {
    overlay.classList.add('hidden');
    onDone();
  }, 1900);
}

// ===================== Soru Üretimi =====================

function generateQuestion(level) {
  const availableOps = level.ops.length > 1 ? level.ops.filter((o) => o !== lastOp) : level.ops;
  const op = availableOps[randInt(0, availableOps.length - 1)];
  lastOp = op;
  let a, b, answer;
  if (op === '+') {
    const total = randInt(Math.max(2, level.min + 1), level.max);
    a = randInt(1, total - 1);
    b = total - a;
    answer = total;
  } else {
    a = randInt(Math.max(2, level.min), level.max);
    b = randInt(1, a - 1);
    answer = a - b;
  }
  const visualCount = op === '+' ? a + b : a;
  const useObjects = level.useObjects && visualCount <= 24;
  return { op, a, b, answer, useObjects };
}

function generateTileOptions(answer, level) {
  const options = new Set([answer]);
  const upper = level.max + 3;
  while (options.size < 4) {
    const candidate = randInt(0, upper);
    options.add(candidate);
  }
  return shuffle(Array.from(options));
}

// ===================== Bölüm Haritası =====================

function renderMap() {
  const container = document.getElementById('map-path');
  container.innerHTML = '';
  LEVELS.forEach((level) => {
    const locked = level.id > progress.unlockedLevel;
    const stars = progress.stars[level.id] || 0;

    const node = document.createElement('button');
    node.className = 'level-node' + (locked ? ' locked' : '');
    node.innerHTML = `
      <span class="lvl-num">${level.id}</span>
      ${locked ? '<span class="lvl-lock">🔒</span>' : `<span>${level.icon}</span>`}
      ${locked ? '' : `<span class="lvl-stars">${'⭐'.repeat(stars) + '☆'.repeat(3 - stars)}</span>`}
    `;
    if (!locked) {
      node.addEventListener('click', () => openLevelIntro(level.id));
    }
    container.appendChild(node);
  });
}

// ===================== Görev Hikayesi (Giriş Ekranı) =====================

function openLevelIntro(levelId) {
  const level = LEVELS.find((l) => l.id === levelId);
  const story = STORY[levelId];
  document.getElementById('intro-planet-icon').textContent = level.icon;
  document.getElementById('intro-planet-title').textContent = level.title;
  document.getElementById('intro-story-text').textContent = story.intro;
  document.getElementById('intro-goal-text').textContent = story.goal;
  const overlay = document.getElementById('overlay-levelintro');
  overlay.dataset.levelId = levelId;
  overlay.classList.remove('hidden');
  playMissionVoice(levelId, `${level.title}. ${story.goal}`);
}

// ===================== Uzay Sahnesi (Arka Plan) =====================

// Bulunduğumuz gezegenden Güneş'e bakışı canlandırır: Güneş sol üstte, geçilen
// gezegenler ve şu anki gezegenimiz sol üstten sağ alta uzanan bir çapraz üzerinde,
// bize yaklaştıkça büyüyerek dizilir. Şu anki gezegende küçük bir roket bizi işaret eder.
// Ay Üssü (id 1) kendine özgü bir sahneye sahip olduğundan sonraki güneş sistemi
// sahnelerinde hiç görünmez.
function renderSpaceScene(levelId) {
  const scene = document.getElementById('space-scene');
  scene.innerHTML = '';

  const starsLayer = document.createElement('div');
  starsLayer.className = 'space-stars';
  for (let i = 0; i < 50; i++) {
    const star = document.createElement('div');
    star.className = 'space-star';
    const size = 1 + Math.random() * 2;
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 70 + '%';
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    star.style.animationDelay = (Math.random() * 3) + 's';
    starsLayer.appendChild(star);
  }
  scene.appendChild(starsLayer);

  if (levelId === 1) {
    renderMoonBaseScene(scene);
    return;
  }

  const level = LEVELS.find((l) => l.id === levelId);
  const sun = document.createElement('div');
  sun.className = 'space-sun';
  const sunSize = Math.round(110 * level.sunScale);
  sun.style.width = sunSize + 'px';
  sun.style.height = sunSize + 'px';
  scene.appendChild(sun);

  const path = document.createElement('div');
  path.className = 'space-path';

  const passedLevels = LEVELS.filter((l) => l.id < levelId && l.id !== 1);
  const stops = [...passedLevels, level];
  const startX = 16, startY = 12;   // Güneş'e yakın uç (%)
  const endX = 97, endY = 97;       // Bizim bulunduğumuz uç: köşeden taşıp sadece çeyreği görünsün
  const startSize = 34, endSize = 260; // px

  stops.forEach((lvl, idx) => {
    const t = stops.length <= 1 ? 1 : idx / (stops.length - 1);
    const size = startSize + t * (endSize - startSize);
    const isCurrent = idx === stops.length - 1;

    const stop = document.createElement('div');
    stop.className = 'space-planet-stop' + (isCurrent ? ' current' : '');
    stop.style.width = size + 'px';
    stop.style.height = size + 'px';
    stop.style.left = (startX + t * (endX - startX)) + '%';
    stop.style.top = (startY + t * (endY - startY)) + '%';
    stop.style.opacity = 0.55 + t * 0.45;

    if (isCurrent && lvl.id === 10) {
      // Galaksi Kapısı bir emoji ikonu yerine arka planla kaynaşan bir nebula/portal olarak çizilir.
      const gate = document.createElement('div');
      gate.className = 'space-galaxy-gate';
      stop.appendChild(gate);
    } else {
      const iconEl = document.createElement('span');
      iconEl.className = 'space-planet-icon space-seq-glow';
      iconEl.textContent = lvl.icon;
      iconEl.style.fontSize = Math.round(size * 0.5) + 'px';
      iconEl.style.animationDelay = (idx * 0.2) + 's';
      stop.appendChild(iconEl);
    }

    if (isCurrent) {
      const rocket = document.createElement('span');
      rocket.className = 'space-rocket-marker';
      rocket.textContent = '🚀';
      stop.appendChild(rocket);
    }

    path.appendChild(stop);
  });

  scene.appendChild(path);
}

// Ay Üssü görevine özel sahne: Dünya büyük ve yakında, Ay küçük ve roketimiz onun üzerinde.
function renderMoonBaseScene(scene) {
  const earth = document.createElement('div');
  earth.className = 'space-planet-stop';
  earth.style.left = '50%';
  earth.style.top = '50%';
  earth.style.width = '320px';
  earth.style.height = '320px';
  const earthIcon = document.createElement('span');
  earthIcon.className = 'space-planet-icon';
  earthIcon.textContent = '🌍';
  earthIcon.style.fontSize = '185px';
  earth.appendChild(earthIcon);
  scene.appendChild(earth);

  // Ay, Dünya'nın etrafında sürekli dönen bir yörüngede: dış katman döner,
  // Ay'ın kendisi ters yönde aynı hızda döner ki küre hep dik dursun.
  const orbit = document.createElement('div');
  orbit.className = 'space-moon-orbit';
  orbit.style.left = '50%';
  orbit.style.top = '50%';

  const spin = document.createElement('div');
  spin.className = 'space-moon-orbit-spin';

  const moon = document.createElement('div');
  moon.className = 'space-planet-stop current space-moon-riding';
  moon.style.width = '120px';
  moon.style.height = '120px';
  const moonSphere = document.createElement('div');
  moonSphere.className = 'space-moon-sphere';
  moon.appendChild(moonSphere);
  const rocket = document.createElement('span');
  rocket.className = 'space-rocket-marker on-moon';
  rocket.textContent = '🚀';
  moon.appendChild(rocket);

  spin.appendChild(moon);
  orbit.appendChild(spin);
  scene.appendChild(orbit);
}

// ===================== Oyun Durumu =====================

let currentLevel = null;
let currentQuestion = null;
let missionProgress = 0;
let missionTarget = 0;
let mistakesThisLevel = 0;
let streak = 0;
let lastOp = null;

function startLevel(levelId) {
  currentLevel = LEVELS.find((l) => l.id === levelId);
  missionTarget = currentLevel.count;
  missionProgress = 0;
  mistakesThisLevel = 0;
  streak = 0;
  lastOp = null;
  updateStreakBadge();
  document.getElementById('game-level-title').textContent = `${currentLevel.icon} ${currentLevel.title}`;
  const missionIconEl = document.getElementById('mission-icon');
  missionIconEl.textContent = currentLevel.resource.icon;
  missionIconEl.className = 'mission-icon mission-icon-' + currentLevel.resource.anim;
  document.getElementById('mission-label').textContent = currentLevel.resource.label;
  renderMissionNotches(missionTarget);
  renderSpaceScene(levelId);
  showScreen('game');
  setMascotMessage('Haydi başlayalım! Sen yaparsın!');
  currentQuestion = generateQuestion(currentLevel);
  renderQuestion();
}

function renderMissionNotches(target) {
  const container = document.getElementById('mission-bar-notches');
  container.innerHTML = '';
  for (let i = 1; i < target; i++) {
    const notch = document.createElement('div');
    notch.className = 'mission-bar-notch';
    notch.style.left = (i / target * 100) + '%';
    container.appendChild(notch);
  }
}

function updateProgressText() {
  document.getElementById('game-progress').textContent = `İlerleme ${missionProgress}/${missionTarget}`;
  updateMissionBar();
}

function updateMissionBar() {
  const pct = Math.round((missionProgress / missionTarget) * 100);
  document.getElementById('mission-bar-fill').style.width = Math.max(0, Math.min(100, pct)) + '%';
}

// Ardışık doğru cevap sayısını rozet olarak gösterir; 2'den az iken gizli kalır.
const STREAK_MESSAGES = {
  2: 'Süper gidiyorsun! 🌟',
  3: 'Harikasın! Seri devam ediyor! 🚀',
  5: 'İnanılmazsın! Tam bir uzay kaşifi! 🔥',
};

function updateStreakBadge() {
  const badge = document.getElementById('streak-badge');
  const countEl = document.getElementById('streak-count');
  if (!badge || !countEl) return;
  if (streak >= 2) {
    countEl.textContent = streak;
    badge.classList.remove('hidden');
    badge.classList.remove('pop');
    void badge.offsetWidth;
    badge.classList.add('pop');
  } else {
    badge.classList.add('hidden');
  }
}

function renderQuestion() {
  updateProgressText();
  renderAnswerPhase(currentQuestion);
}

function makeObjIcon(icon) {
  const el = document.createElement('div');
  el.className = 'obj-icon';
  el.textContent = icon;
  return el;
}

const VISUAL_OBJECT = '⭐';
const AID_GROUP_SIZE = 5;

// Nesneleri 5'li gruplar halinde diziyor (on çerçevesi mantığı) ki çocuk
// tek tek saymak yerine miktarı grup olarak algılayabilsin (subitizing).
// removedFrom verilirse bu global sıradan itibarenki simgeler önce vurgulanıp
// sonra üstü çizilerek çıkarma işleminin bir eylem olduğu görünür kılınır.
function renderIconGroups(count, removedFrom) {
  const container = document.createElement('div');
  container.className = 'icon-groups';
  let index = 0;
  while (index < count) {
    const groupSize = Math.min(AID_GROUP_SIZE, count - index);
    const group = document.createElement('div');
    group.className = 'icon-group';
    for (let i = 0; i < groupSize; i++) {
      const icon = makeObjIcon(VISUAL_OBJECT);
      if (removedFrom !== undefined && index >= removedFrom) icon.classList.add('subtract-target');
      group.appendChild(icon);
      index++;
    }
    container.appendChild(group);
  }
  return container;
}

function renderVisualAid(q) {
  const wrap = document.createElement('div');
  wrap.className = 'visual-aid';
  if (q.op === '+') {
    const groupA = renderIconGroups(q.a);
    groupA.classList.add('seq-pulse-a');
    wrap.appendChild(groupA);

    const plus = document.createElement('span');
    plus.className = 'visual-op seq-pulse-op';
    plus.textContent = '+';
    wrap.appendChild(plus);

    const groupB = renderIconGroups(q.b);
    groupB.classList.add('seq-pulse-b');
    wrap.appendChild(groupB);
  } else {
    const groupA = renderIconGroups(q.a, q.a - q.b);
    groupA.classList.add('seq-pulse-a');
    wrap.appendChild(groupA);
  }
  return wrap;
}

// Doğru cevaptan sonra aynı üçlüyle kurulan ters işlemi (parça-bütün ilişkisi) gösterir.
function renderFactFamily(q) {
  const el = document.createElement('div');
  el.className = 'fact-family';
  el.textContent = q.op === '+'
    ? `Demek ki: ${q.answer} - ${q.a} = ${q.b}`
    : `Demek ki: ${q.answer} + ${q.b} = ${q.a}`;
  return el;
}

function renderAnswerPhase(q) {
  const area = document.getElementById('game-area');
  area.innerHTML = '';

  setMascotMessage(q.op === '+' ? 'Doğru sayıya dokun!' : 'Kalan sayıya dokun!');

  if (q.useObjects) {
    area.appendChild(renderVisualAid(q));
  }

  const eqRow = document.createElement('div');
  eqRow.className = 'equation-row';

  const slot = document.createElement('div');
  slot.className = 'equation-slot';
  slot.textContent = '❔';

  // Sayılar ve işlem 5sn'de bir sırayla hafifçe şişer; bu, denklemin okunma
  // sırasını (a, işlem, b) görsel olarak vurgular.
  const aSpan = document.createElement('span');
  aSpan.className = 'seq-pulse-a';
  aSpan.textContent = q.a;

  const opSpan = document.createElement('span');
  opSpan.className = 'seq-pulse-op';
  opSpan.textContent = q.op;

  const bSpan = document.createElement('span');
  bSpan.className = 'seq-pulse-b';
  bSpan.textContent = q.b;

  const eqSign = document.createElement('span');
  eqSign.textContent = '=';

  eqRow.appendChild(aSpan);
  eqRow.appendChild(opSpan);
  eqRow.appendChild(bSpan);
  eqRow.appendChild(eqSign);
  eqRow.appendChild(slot);
  area.appendChild(eqRow);

  const tray = document.createElement('div');
  tray.className = 'tiles-tray';

  const options = generateTileOptions(q.answer, currentLevel);
  const tiles = [];

  options.forEach((val) => {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'num-tile';
    tile.textContent = val;
    tiles.push(tile);

    tile.addEventListener('click', () => handleAnswerClick(val, tile, slot, tiles));

    tray.appendChild(tile);
  });

  area.appendChild(tray);
}

function handleAnswerClick(val, tileEl, slotEl, allTiles) {
  if (slotEl.classList.contains('filled')) return;

  if (val === currentQuestion.answer) {
    slotEl.textContent = val;
    slotEl.classList.add('filled');
    tileEl.classList.add('correct');
    allTiles.forEach((t) => t.classList.add('disabled'));
    streak++;
    updateStreakBadge();
    setMascotMessage(STREAK_MESSAGES[streak] || 'Aferin! Doğru cevap! 🎉', 'happy');
    playSuccessSound();
    missionProgress = Math.min(missionProgress + 1, missionTarget);
    updateProgressText();
    if (currentQuestion.useObjects) {
      document.getElementById('game-area').appendChild(renderFactFamily(currentQuestion));
    }
    setTimeout(() => {
      if (missionProgress >= missionTarget) {
        finishLevel();
      } else {
        currentQuestion = generateQuestion(currentLevel);
        renderQuestion();
      }
    }, 700);
  } else {
    mistakesThisLevel++;
    streak = 0;
    updateStreakBadge();
    tileEl.classList.add('shake');
    setMascotMessage('Tekrar dene, sen yapabilirsin! 💪', 'sad');
    playErrorSound();
    if (currentLevel.penalizeMistakes) {
      missionProgress = Math.max(missionProgress - 1, 0);
      updateProgressText();
    }
    setTimeout(() => tileEl.classList.remove('shake'), 400);
  }
}

function finishLevel() {
  const total = missionTarget;
  let stars;
  if (mistakesThisLevel === 0) stars = 3;
  else if (mistakesThisLevel <= Math.ceil(total / 2)) stars = 2;
  else stars = 1;

  const prevStars = progress.stars[currentLevel.id] || 0;
  progress.stars[currentLevel.id] = Math.max(prevStars, stars);

  if (currentLevel.id === progress.unlockedLevel && currentLevel.id < LEVELS.length) {
    progress.unlockedLevel = currentLevel.id + 1;
  }
  saveProgress(progress);

  showLevelComplete(stars);
}

function showLevelComplete(stars) {
  const overlay = document.getElementById('overlay-levelcomplete');
  document.getElementById('complete-story-text').textContent = STORY[currentLevel.id].success;
  overlay.classList.remove('hidden');
  const starEls = document.querySelectorAll('#stars-display .star');
  starEls.forEach((el, i) => {
    el.classList.remove('filled');
    el.textContent = '☆';
  });
  spawnConfetti(60);

  starEls.forEach((el, i) => {
    setTimeout(() => {
      if (i < stars) {
        el.textContent = '⭐';
        el.classList.add('filled');
      }
    }, 300 + i * 350);
  });

  const nextBtn = document.getElementById('btn-complete-next');
  const isLast = currentLevel.id >= LEVELS.length;
  nextBtn.style.display = isLast ? 'none' : 'inline-block';
}

// ===================== Olay Bağlamaları =====================

document.getElementById('btn-play').addEventListener('click', () => {
  renderMap();
  showScreen('map');
});

document.getElementById('btn-howto').addEventListener('click', () => showScreen('howto'));
document.getElementById('btn-howto-back').addEventListener('click', () => showScreen('start'));

document.getElementById('btn-reset').addEventListener('click', () => {
  if (confirm('İlerlemeyi sıfırlamak istediğine emin misin?')) {
    progress = { unlockedLevel: 1, stars: {} };
    saveProgress(progress);
    alert('İlerleme sıfırlandı!');
  }
});

document.getElementById('btn-map-home').addEventListener('click', () => showScreen('start'));
document.getElementById('btn-game-back').addEventListener('click', () => {
  renderMap();
  showScreen('map');
});

document.getElementById('btn-intro-start').addEventListener('click', () => {
  const overlay = document.getElementById('overlay-levelintro');
  const levelId = parseInt(overlay.dataset.levelId, 10);
  overlay.classList.add('hidden');
  stopMissionVoice();
  startLevel(levelId);
});

document.getElementById('btn-intro-back').addEventListener('click', () => {
  document.getElementById('overlay-levelintro').classList.add('hidden');
  stopMissionVoice();
});

document.getElementById('btn-complete-map').addEventListener('click', () => {
  document.getElementById('overlay-levelcomplete').classList.add('hidden');
  renderMap();
  showScreen('map');
});

document.getElementById('btn-complete-next').addEventListener('click', () => {
  document.getElementById('overlay-levelcomplete').classList.add('hidden');
  const finishedLevel = currentLevel;
  const nextId = currentLevel.id + 1;
  if (nextId <= LEVELS.length) {
    const nextLevel = LEVELS.find((l) => l.id === nextId);
    playRocketFlight(finishedLevel, nextLevel, () => {
      renderMap();
      showScreen('map');
      openLevelIntro(nextId);
    });
  } else {
    renderMap();
    showScreen('map');
  }
});
