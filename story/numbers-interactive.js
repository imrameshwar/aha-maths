// story/numbers-interactive.js
// "The Story of Numbers — Interactive Journey"
// A click-through story: ONE scene at a time, each a hands-on p5 visual you play
// with. Per-scene audio narration (Web Speech API, no audio files). Advance with
// Next. Website-only (kept out of visualizers/ so it never syncs to the Studio).
//
// Public API:  initJourney({ els })
//   els = { stage, sceneNum, sceneTitle, sceneKicker, narration, prompt, controls,
//           listenBtn, prevBtn, nextBtn, dots:[button], discoverBadge, complete }

import * as L from './draw-lib.js';
const { C, F, col, txt, glowShape, pebble, sheep, placeCells, makeStars, starfield,
        clamp, clamp01, lerp, smooth, eoc, eic, seg, segL, dist2, mulberry32, hexToRgba,
        eraBackdrop } = L;
import { CHARACTERS, BEATS } from './numbers-script.js';
import { charSVG } from './characters.js';
import { createAudio } from './audio-fx.js';
import { createVO } from './vo.js';
import { celebrate } from '../ui/celebrate.js';

// ── Bilingual layer ──────────────────────────────────────────────────────────
// Hindi (Devanagari) copy for the HTML text (title/kicker/narration/prompt +
// control labels). Rendered by the browser, which falls back to a system
// Devanagari font — so this is safe. ON-CANVAS labels stay English on purpose
// (Inter/JetBrains Mono don't ship Devanagari → tofu), which also matches the
// channel's "English on-screen labels, Hindi voice" identity.
const UI = {
  listen:   { en: 'Listen', hi: 'सुनिए' },
  stop:     { en: 'Stop',   hi: 'रोकें' },
  found:    { en: '✓ You found it', hi: '✓ आपने खोज लिया' },
  next:     { en: 'Next →', hi: 'आगे →' },
  back:     { en: '← Back', hi: '← पीछे' },
  finish:   { en: 'Finish ✦', hi: 'समाप्त ✦' },
  continue: { en: 'Continue ▶', hi: 'आगे ▶' },
  done:     { en: 'Done ✓', hi: 'हो गया ✓' },
  yourTurn: { en: '👆 Your turn — try it above', hi: '👆 आपकी बारी — ऊपर आज़माइए' },
  begin:    { en: '▶ Begin the story', hi: '▶ कहानी शुरू करें' },
  continueStory: { en: '▶ Continue', hi: '▶ जारी रखें' },
  startText: { en: 'Read, listen, and play your way through the invention of numbers.', hi: 'पढ़ते, सुनते और खेलते हुए संख्याओं के आविष्कार की सैर कीजिए।' },
  resumeText: { en: 'Welcome back! Pick up where you left off.', hi: 'वापसी पर स्वागत है! जहाँ छोड़ा था वहीं से जारी रखिए।' },
  startOver: { en: '↺ Start from the beginning', hi: '↺ शुरुआत से आरंभ करें' },
  bravo:    { en: '🦉 Shabaash! You made it to today.', hi: '🦉 शाबाश! आप आज तक पहुँच गए।' },
  replay:   { en: 'Replay this line', hi: 'यह पंक्ति दोबारा' },
};

// One collectible badge per scene (earned when its interaction is discovered).
const BADGES = {
  'first-question': '⭐', 'shepherd': '🐑', 'body': '✋', 'cities': '🏺',
  'symbols': '🏛️', 'place-value': '🔢', 'nothing': '0️⃣', 'zero-power': '⭕',
  'ten-symbols': '🔟', 'beyond': '➗', 'scales': '🌌', 'finale': '🏆',
};

const HI = {
  'first-question': {
    title: 'पहला सवाल', kicker: 'यहीं से शुरुआत हुई',
    narration: 'साम्राज्यों से पहले, लिखाई से पहले, घड़ी और सिक्कों से पहले — एक ऐसी दुनिया थी जहाँ संख्याएँ नहीं थीं। न एक, न दस, न हज़ार। फिर भी इंसान बार-बार यही सवाल पूछता रहा: कितने?',
    prompt: 'अँधेरे आसमान पर टैप करके कुछ तारे लगाइए। फिर सोचिए — <b>बिना किसी संख्या-शब्द के, आप “कितने” कैसे बताएँगे?</b>',
  },
  'shepherd': {
    title: 'गड़रिये की मुश्किल', kicker: 'एक भेड़, एक पत्थर',
    narration: 'एक गड़रिया सुबह अपनी भेड़ें चराने ले जाता है। वह “उन्नीस” या “बीस” लिख नहीं सकता, इसलिए वह एक तरकीब निकालता है: हर भेड़ के बाहर जाने पर थैली में एक पत्थर डालता है। शाम को हर लौटी भेड़ के लिए एक पत्थर निकालता है। अगर कोई पत्थर बच जाए, तो कोई भेड़ खो गई। यही एक-से-एक मिलान इंसान का संख्या की ओर पहला कदम था।',
    prompt: 'सुबह: <b>हर भेड़ पर क्लिक</b> करके उसे चरागाह भेजिए — हर भेड़ के लिए एक पत्थर गिरेगा। फिर उन्हें वापस बुलाइए… और देखिए पत्थर क्या बताते हैं।',
  },
  'body': {
    title: 'शरीर से गिनती', kicker: 'निशान, उँगलियाँ, गाँठें',
    narration: 'कागज़ से बहुत पहले, संख्याएँ शरीर में रहती थीं — उँगलियों पर, हड्डियों पर, रस्सी की गाँठों में। शिकारी हर हिरण के लिए एक निशान खींचता था। एक चतुराई देखिए: निशान पाँच-पाँच के गुच्छों में बँध जाते हैं, ताकि एक नज़र में पढ़े जा सकें। ये आज जैसी संख्याएँ नहीं थीं। ये याददाश्त थी, जिसे दिखने लायक बना दिया गया।',
    prompt: 'कहीं भी क्लिक करके <b>एक निशान खींचिए</b>। हर पाँचवाँ निशान गुच्छे को काट देता है — इतिहास का पहला शॉर्टकट।',
    controls: { reset: 'निशान मिटाएँ' },
  },
  'cities': {
    title: 'जब गाँव शहर बने', kicker: 'गिनती गंभीर हो गई',
    narration: 'जैसे-जैसे गाँव शहरों में बदले, लोगों को अनाज, तेल, ज़मीन, कर और सैनिक गिनने पड़े। मेसोपोटामिया के लिपिक गीली मिट्टी पर निशान दबाते थे। पर एक-एक निशान से बड़ी गिनती करना धीमा और भारी था। सभ्यता को सिर्फ़ गिनना ही नहीं, तेज़ और सही गिनना ज़रूरी हो गया।',
    prompt: 'राजा के लिए <b>12 बकरियाँ</b> दर्ज करने को मिट्टी में निशान दबाइए। थकान महसूस कीजिए — फिर छह हज़ार सैनिकों को इसी तरह गिनने की कल्पना कीजिए।',
    controls: { reset: 'मिट्टी साफ़ करें' },
  },
  'symbols': {
    title: 'प्रतीकों का जन्म', kicker: 'भव्य, पर भारी',
    narration: 'अलग-अलग सभ्यताओं ने अलग प्रतीक बनाए। रोमनों ने दिए I, V, X, L, C, D, M — साफ़ और भव्य। पर इनसे गणना करके देखिए। बड़े रोमन अंक लंबे और बेढंगे हो जाते हैं, और उन्हें गुणा करना तो सिरदर्द है। इंसान के पास प्रतीक थे, पर रफ़्तार नहीं। वह महान रहस्य अब भी बाकी था।',
    prompt: 'स्लाइडर खिसकाइए। देखिए कैसे <b>1944</b> जैसा साफ़ नंबर रोमन में <b>MCMXLIV</b> राक्षस बन जाता है — अब दो को गुणा करने की सोचिए।',
    controls: { n: 'संख्या' },
  },
  'place-value': {
    title: 'स्थान का रहस्य', kicker: 'वह महान रहस्य',
    narration: 'फिर आई एक क्रांति: किसी प्रतीक का मान उसकी जगह पर निर्भर कर सकता है। वही अंक “दो” इकाई की जगह पर दो है, दहाई में बीस, और सैकड़े में दो सौ। थोड़े से प्रतीक अब असीम रूप से बड़े विचार कह सकते थे। यही है स्थानीय मान।',
    prompt: 'चमकते अंक को पकड़िए और <b>बाईं ओर खानों में खींचिए</b>। वही अंक — पर हर कदम पर उसका मान दस गुना बढ़ता है। (स्लाइडर से अंक भी बदलिए।)',
    controls: { digit: 'अंक', 'move-left': 'अंक बाईं ओर खिसकाएँ →' },
  },
  'nothing': {
    title: 'शून्य का रहस्य', kicker: 'खालीपन को आकार दो',
    narration: 'पर एक अड़चन बाकी थी। जब कोई जगह खाली हो तो संख्या कैसे लिखें? क्या “एक, खाली, पाँच” पंद्रह है या एक सौ पाँच? प्राचीन भारत में इसका जवाब मिला: शून्य — कुछ न होने का एक प्रतीक, जो फिर भी अपनी जगह रोके रखता है। ना-कुछ का चिह्न, और हर चीज़ का औज़ार।',
    prompt: 'पहले अनुमान लगाइए कि <b>1 _ 5</b> का क्या मतलब है। उलझन हुई न? अब <b>शून्य को खींचकर</b> खाली जगह में रखिए और देखिए संख्या पक्की हो जाती है।',
    controls: { g15: 'क्या यह 15 है?', g105: 'क्या यह 105 है?', 'drop-zero': 'शून्य को उसकी जगह पर रखें' },
  },
  'zero-power': {
    title: 'जब शून्य ने दुनिया बदली', kicker: 'कुछ नहीं, फिर भी सब कुछ',
    narration: 'शून्य सिर्फ़ जगह भरने वाला नहीं था। इसके बिना स्थानीय मान ढह जाता है। एक सौ पाँच और एक हज़ार पाँच — दोनों टूटकर पंद्रह बन जाते हैं। शून्य के साथ हर संख्या अपना सही आकार बनाए रखती है। खालीपन को गणित बना देना — यही असली प्रतिभा है।',
    prompt: 'स्विच दबाकर <b>शून्य हटाइए</b>। देखिए 105 और 1005 दोनों टूटकर 15 बन जाते हैं — पूरी अफ़रा-तफ़री। वापस दबाकर व्यवस्था लौटाइए।',
    controls: { strip: 'शून्य हटाएँ' },
  },
  'ten-symbols': {
    title: 'दस प्रतीक, असीम शक्ति', kicker: 'भारत से दुनिया तक',
    narration: 'सिर्फ़ दस प्रतीकों — शून्य से नौ — से आप कोई भी संख्या लिख सकते हैं: गेहूँ का दाम, तारे की दूरी, ग्रहों की चाल। ये अंक भारत में बने, अरब विद्वानों ने इन्हें सँवारा और आगे पहुँचाया, और पूरी दुनिया ने अपनाया। हम इन्हें हिन्दू-अरबी अंक कहते हैं, क्योंकि महान विचार अनेक हाथों से होकर सफ़र करते हैं।',
    prompt: 'हर पहिये के <b>ऊपर या नीचे</b> टैप करके अंक घुमाइए। सिर्फ़ दस प्रतीकों से कोई भी संख्या बनाइए — लाखों तक भी।',
    controls: { rand: '🎲 बेतरतीब', max: 'बहुत बड़ा करें' },
  },
  'beyond': {
    title: 'गिनती से आगे', kicker: 'नए सवाल, नई संख्याएँ',
    narration: 'पहले संख्याएँ भेड़ और अनाज गिनती थीं। फिर ज़िंदगी ने कठिन सवाल पूछे। मुझ पर कमाई से ज़्यादा कर्ज़ है — तो आईं ऋण संख्याएँ। एक रोटी को चार में बाँटो — भिन्न। और सटीक नापो — दशमलव। ऐसी लंबाई जो किसी सरल भिन्न में न आए — अपरिमेय, जैसे मूल दो। और जिसका वर्ग ऋणात्मक हो — काल्पनिक संख्याएँ। हक़ीक़त ने पूछा, और संख्याओं ने जवाब दिया।',
    prompt: 'हर बटन किसी का पूछा हुआ सवाल है। <b>पाँचों पर टैप कीजिए</b> और संख्या-रेखा को बिलकुल नई तरह की संख्याओं में बढ़ते देखिए।',
    controls: { neg: '“कुछ नहीं से भी कम?”', frac: '“रोटी बाँटें?”', dec: '“और सटीक?”', irr: '“कोई भिन्न फिट नहीं?”', imag: '“−1 का वर्गमूल?”' },
  },
  'scales': {
    title: 'कंकड़ से ग्रहों तक', kicker: 'हर पैमाने पर संख्याएँ',
    narration: 'जो गड़रिये की मुट्ठी में कंकड़ों से शुरू हुआ, वह विज्ञान की भाषा बन गया। वही दस प्रतीक मुट्ठी भर भेड़ें भी गिनते हैं, एक देश के लोग भी, और किसी आकाशगंगा की दूरी भी — पच्चीस लाख प्रकाश-वर्ष दूर। गुफ़ा की दीवारों से कंप्यूटर कोड तक, संख्याएँ आधुनिक दुनिया का अदृश्य ढाँचा बन गईं।',
    prompt: 'स्लाइडर खींचकर <b>ज़ूम आउट</b> कीजिए — एक अकेले कंकड़ से लेकर पूरी आकाशगंगा तक। वही अंक हर चीज़ पर फिट बैठते हैं।',
    controls: { zoom: 'ज़ूम आउट' },
  },
  'finale': {
    title: 'संख्याएँ किसने बनाईं?', kicker: 'अनेक मन, अनेक देश',
    narration: 'तो संख्याएँ किसने बनाईं? न कोई एक व्यक्ति, न कोई एक देश। भेड़ें गिनने वाले गड़रिये, सामान का हिसाब रखने वाले व्यापारी, कर लिखने वाले लिपिक, शून्य गढ़ने वाले विद्वान, तारे नापने वाले खगोलशास्त्री, और गिनती सीखते बच्चे। संख्याओं की कहानी असल में इंसानी सोच की कहानी है, जो दुनिया को थामना सीख रही थी। और यह सब एक सरल सवाल से शुरू हुआ: कितने?',
    prompt: 'कहानी में हर व्यक्ति के योगदान को सम्मान देने के लिए उस पर टैप कीजिए। छहों को जगमगाइए और आज तक पहुँचिए — जहाँ संख्याएँ हर स्क्रीन, घड़ी और मशीन में बसी हैं।',
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// Narrator — chunked Web-Speech TTS with a play/stop state callback.
// ═════════════════════════════════════════════════════════════════════════════
function makeNarrator(onChange) {
  const synth = window.speechSynthesis;
  let playing = false, token = 0, keepalive = null;
  function setPlaying(v) {
    playing = v; onChange(v);
    clearInterval(keepalive);
    if (v) keepalive = setInterval(() => { try { synth.resume(); } catch {} }, 4000);
  }
  function stop() { token++; if (synth) synth.cancel(); setPlaying(false); }
  function speak(text, lang = 'en') {
    if (!synth || !text) return;
    stop();
    const my = ++token;
    const voices = synth.getVoices() || [];
    const bcp = lang === 'hi' ? 'hi-IN' : 'en-US';
    const pref = lang === 'hi' ? /^hi/i : /en[-_]US/i;
    const voice = voices.find(v => pref.test(v.lang)) || voices.find(v => new RegExp('^' + (lang === 'hi' ? 'hi' : 'en'), 'i').test(v.lang));
    // Hindi (Devanagari) has no ! ? split issues, but "|" (danda) is common — split on both.
    const parts = text.match(/[^.!?।]+[.!?।]*/g) || [text];
    setPlaying(true);
    parts.forEach((part, i) => {
      const u = new SpeechSynthesisUtterance(part.trim());
      u.lang = bcp; u.rate = 0.92; u.pitch = 1.0; if (voice) u.voice = voice;
      if (i === parts.length - 1) u.onend = () => { if (my === token) setPlaying(false); };
      u.onerror = () => { if (my === token) setPlaying(false); };
      synth.speak(u);
    });
  }
  return { speak, toggle(t, lang) { playing ? stop() : speak(t, lang); }, stop, get playing() { return playing; }, supported: !!synth };
}

// ═════════════════════════════════════════════════════════════════════════════
// Per-scene p5 mount. Scenes are resolution-independent (state is logical /
// normalized; pixel layout is computed from ctx.W/H each frame) so resize is free.
// ═════════════════════════════════════════════════════════════════════════════
function mountScene(stageEl, scene, { onDiscover, sfx, playerName, lang }) {
  let p5inst = null, ctx = null, discovered = false;
  const aspect = scene.aspect || 0.6; // height / width

  p5inst = new window.p5((p) => {
    const dt = () => Math.min(p.deltaTime / 1000, 0.05);
    const send = (type) => { if (scene.pointer) scene.pointer(ctx, { type, x: p.mouseX, y: p.mouseY }); };

    // Cap stage height so the canvas AND the dialogue bubble stay visible together
    // (scenes are resolution-independent, so a shorter/wider canvas just re-frames).
    const sizeFor = (w) => Math.min(Math.round(w * aspect), Math.round((window.innerHeight || 800) * 0.54));

    p.setup = () => {
      const w = stageEl.clientWidth || 820;
      const h = sizeFor(w);
      p.createCanvas(w, h).parent(stageEl);
      p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
      p.frameRate(60);
      ctx = {
        p, W: w, H: h, S: Math.min(w, h), cx: w / 2, cy: h / 2,
        t: 0, mouse: { x: 0, y: 0, down: false }, state: {},
        sfx: sfx || null, playerName: playerName || null, lang: lang || 'en',
        discover() { if (!discovered) { discovered = true; onDiscover && onDiscover(); } },
        get discovered() { return discovered; },
      };
      // S6: bilingual on-canvas caption — auto-picks the Devanagari font for हिं.
      ctx.cap = (en, hi, x, y, size, hex, o = {}) => {
        const isHi = ctx.lang === 'hi';
        txt(p, isHi ? hi : en, x, y, size, hex, { ...o, font: isHi ? F.deva : (o.font || F.sans) });
      };
      scene.setup && scene.setup(ctx);

      const within = () => p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height;
      p.mousePressed  = () => { if (within()) { ctx.mouse.down = true; send('down'); } };
      p.mouseDragged  = () => { if (ctx.mouse.down) send('move'); };
      p.mouseReleased = () => { if (ctx.mouse.down) { ctx.mouse.down = false; send('up'); } };
      p.touchStarted  = () => { if (within()) { ctx.mouse.down = true; send('down'); return false; } };
      p.touchMoved    = () => { if (ctx.mouse.down) { send('move'); return false; } };
      p.touchEnded    = () => { if (ctx.mouse.down) { ctx.mouse.down = false; send('up'); } };
    };

    p.draw = () => {
      if (!ctx) return;
      ctx.t += dt();
      ctx.mouse.x = p.mouseX; ctx.mouse.y = p.mouseY;
      eraBackdrop(p, ctx, scene.era || 'night');   // S1: living-scene set dressing
      scene.update && scene.update(ctx, dt());
      scene.draw(ctx);
    };

    p.windowResized = () => {
      const w = stageEl.clientWidth, h = sizeFor(w);
      if (!w || (w === p.width && h === p.height)) return;
      p.resizeCanvas(w, h);
      ctx.W = w; ctx.H = h; ctx.S = Math.min(w, h); ctx.cx = w / 2; ctx.cy = h / 2;
      scene.onResize && scene.onResize(ctx);
    };
  });

  return { remove() { if (p5inst) { p5inst.remove(); p5inst = null; } }, getCtx() { return ctx; } };
}

// helper: nearest place column x-positions for a 3-cell row centred in the stage
function toRoman(n) {
  const m = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  let s = ''; for (const [v, sym] of m) while (n >= v) { s += sym; n -= v; } return s || '—';
}

// ═════════════════════════════════════════════════════════════════════════════
// THE 12 SCENES
// ═════════════════════════════════════════════════════════════════════════════
const SCENES = [

// ── 1 · The First Question ──────────────────────────────────────────────────────
{
  id: 'first-question', era: 'night', title: 'The First Question', kicker: 'Where it all begins',
  narration: 'Before empires, before writing, before clocks and coins, there was a world without numbers. No one, no ten, no thousand. And yet humans kept facing the same question, again and again: how many?',
  prompt: 'Tap the dark sky to place a few stars. Then ask yourself — <b>without a single number word, how would you say how many?</b>',
  aspect: 0.6,
  setup(ctx) { ctx.state.stars = makeStars(120, 3); ctx.state.dots = []; },
  pointer(ctx, e) {
    if (e.type !== 'down') return;
    ctx.state.dots.push({ x: e.x / ctx.W, y: e.y / ctx.H, born: ctx.t });
    ctx.sfx && ctx.sfx.pop();
    if (ctx.state.dots.length >= 6) ctx.discover();
  },
  draw(ctx) {
    const { p, W, H, cx, cy, S, state } = ctx;
    starfield(p, state.stars, ctx.t, 0.7, W, H);
    // once discovered, the player's own stars remember them — join into a constellation
    if (ctx.discovered && state.dots.length >= 2) {
      const a = 150 * smooth(segL(ctx.t, state.dots[state.dots.length - 1].born, state.dots[state.dots.length - 1].born + 1.2));
      p.stroke(col(p, C.primary, a)); p.strokeWeight(1.2);
      p.drawingContext.shadowBlur = 8; p.drawingContext.shadowColor = hexToRgba(C.primary, 0.4);
      for (let i = 1; i < state.dots.length; i++)
        p.line(state.dots[i - 1].x * W, state.dots[i - 1].y * H, state.dots[i].x * W, state.dots[i].y * H);
      p.drawingContext.shadowBlur = 0;
    }
    for (const d of state.dots) {
      const age = ctx.t - d.born;
      const pop = 1 + 0.5 * Math.max(0, 1 - age / 0.4) * Math.sin(clamp01(age / 0.4) * Math.PI);
      pebble(p, d.x * W, d.y * H, S * 0.02 * pop, C.primary, 255, 20);
    }
    const n = state.dots.length;
    if (n > 0) txt(p, String(n), cx, H * 0.16, S * 0.13, C.textHi, { font: F.mono, bold: true, glow: 14 });
    if (n === 0) ctx.cap('tap to place stars', 'तारे लगाने के लिए टैप करें', cx, cy, S * 0.045, C.textLo);
    if (n >= 4) ctx.cap('How many?', 'कितने?', cx, H * 0.86, S * 0.09, C.secondary,
      { bold: true, italic: true, glow: 24, a: 255 * smooth(segL(n, 4, 7)) });
  },
},

// ── 2 · The Shepherd's Problem ──────────────────────────────────────────────────
{
  id: 'shepherd', era: 'dawn', title: "The Shepherd's Problem", kicker: 'One sheep, one stone',
  narration: "A shepherd leads his flock out at dawn. He cannot write nineteen or twenty, so he invents a trick: for every sheep that leaves, he drops one stone in a pouch. In the evening, he takes one stone out for every sheep that returns. If a stone is left over, a sheep is missing. This one-to-one matching is one of humanity's first steps toward number.",
  prompt: 'Morning: <b>click each sheep</b> to send it to the pasture — a stone drops for each. Then bring them home… and see what the stones reveal.',
  aspect: 0.62,
  setup(ctx) {
    const N = 6;
    ctx.state.N = N;
    ctx.state.phase = 'out'; // out → back
    ctx.state.sheep = Array.from({ length: N }, (_, i) => ({
      place: 'fold', lost: i === 3, slot: i, shake: 0,
      // normalized animated position, starts in the fold (left)
      nx: 0.12 + (i % 2) * 0.05, ny: 0.42 + Math.floor(i / 2) * 0.16,
    }));
  },
  _target(s, st) {
    // returns [nx, ny] target by place
    if (s.place === 'pasture') return [0.42 + (s.slot % 3) * 0.14, 0.44 + Math.floor(s.slot / 3) * 0.2];
    return [0.12 + (s.slot % 2) * 0.05, 0.40 + Math.floor(s.slot / 2) * 0.15]; // fold / home
  },
  update(ctx) {
    for (const s of ctx.state.sheep) {
      const [tx, ty] = this._target(s, ctx.state);
      s.nx = lerp(s.nx, tx, 0.14); s.ny = lerp(s.ny, ty, 0.14);
      if (s.shake > 0) s.shake -= 0.06;
    }
  },
  pointer(ctx, e) {
    if (e.type !== 'down') return;
    const { W, H, S, state } = ctx;
    const r = S * 0.075;
    let hit = null, best = r * r;
    state.sheep.forEach((s) => {
      const d = dist2(e.x, e.y, s.nx * W, s.ny * H);
      if (d < best) { best = d; hit = s; }
    });
    if (!hit) return;
    if (state.phase === 'out') {
      if (hit.place === 'fold') { hit.place = 'pasture'; ctx.sfx && ctx.sfx.stoneDrop(); }
      if (state.sheep.every(s => s.place !== 'fold')) state.phase = 'back';
    } else {
      if (hit.place === 'pasture') {
        if (hit.lost) { hit.shake = 1; ctx.sfx && ctx.sfx.tick(); }   // the wanderer won't come back
        else { hit.place = 'home'; ctx.sfx && ctx.sfx.pop(); }
        // all returnable sheep home → the leftover stone tells the story
        if (state.sheep.filter(s => !s.lost).every(s => s.place === 'home')) ctx.discover();
      }
    }
  },
  draw(ctx) {
    const { p, W, H, cx, cy, S, state } = ctx;
    // dawn sky
    const g = p.drawingContext.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, C.bg); g.addColorStop(0.7, '#17233A'); g.addColorStop(1, '#33261C');
    p.drawingContext.fillStyle = g; p.drawingContext.fillRect(0, 0, W, H);
    glowShape(p, C.dawn, 60, 0.6, () => { p.noStroke(); p.fill(col(p, C.dawn, 220)); p.circle(W * 0.85, H * 0.2, S * 0.1); });
    p.noStroke(); p.fill(col(p, '#0E1526', 255)); p.rect(0, H * 0.78, W, H * 0.22);

    // the fold (pen) on the left
    p.push(); p.rectMode(p.CENTER); p.noFill();
    p.stroke(col(p, C.grid, 220)); p.strokeWeight(2);
    p.rect(W * 0.15, H * 0.5, S * 0.34, S * 0.5, 12); p.pop();
    ctx.cap('the fold', 'बाड़ा', W * 0.15, H * 0.5 - S * 0.28, Math.max(11, S * 0.03), C.textLo);
    ctx.cap('pasture', 'चरागाह', W * 0.55, H * 0.16, Math.max(11, S * 0.03), C.textLo);

    // pouch bottom-right
    const bx = W * 0.86, by = H * 0.62;
    p.push(); p.rectMode(p.CENTER); p.fill(col(p, C.surface, 235)); p.stroke(col(p, C.grid, 220)); p.strokeWeight(2);
    p.rect(bx, by, S * 0.17, S * 0.24, 14); p.pop();
    ctx.cap('the pouch', 'थैली', bx, by - S * 0.17, Math.max(11, S * 0.03), C.textLo);

    // stones = number of sheep currently out (in pasture)
    const out = state.sheep.filter(s => s.place === 'pasture').length;
    for (let i = 0; i < out; i++) {
      const px = bx - S * 0.045 + (i % 2) * S * 0.045;
      const py = by + S * 0.08 - Math.floor(i / 2) * S * 0.045;
      const lastLeft = state.phase === 'back' && out === 1;
      pebble(p, px, py, S * 0.02, lastLeft ? C.danger : C.secondary, 255, lastLeft ? 24 : 8);
    }

    // sheep
    for (const s of state.sheep) {
      const jx = s.shake > 0 ? Math.sin(ctx.t * 40) * S * 0.02 * s.shake : 0;
      const near = dist2(ctx.mouse.x, ctx.mouse.y, s.nx * W, s.ny * H) < (S * 0.08) ** 2;
      const clickable = (state.phase === 'out' && s.place === 'fold') || (state.phase === 'back' && s.place === 'pasture' && !s.lost);
      sheep(p, s.nx * W + jx, s.ny * H, S * 0.06, s.lost && state.phase === 'back' ? 150 : 255, near && clickable);
    }

    // headline / readout
    const back = state.phase === 'back';
    if (back) ctx.cap('Evening — bring them home', 'शाम — उन्हें घर लाइए', cx, H * 0.08, Math.max(13, S * 0.038), C.dawn, { bold: true });
    else ctx.cap('Morning — let them out', 'सुबह — उन्हें बाहर छोड़िए', cx, H * 0.08, Math.max(13, S * 0.038), C.primary, { bold: true });
    const outLabel = ctx.lang === 'hi' ? `भेड़ें: ${out}    ·    पत्थर: ${out}` : `sheep out: ${out}    ·    stones: ${out}`;
    txt(p, outLabel, cx, H * 0.94, Math.max(12, S * 0.032), C.textLo, { font: ctx.lang === 'hi' ? F.deva : F.mono });
    if (ctx.discovered) ctx.cap('A stone is left over — one sheep is missing!', 'एक पत्थर बच गया — एक भेड़ खो गई!', cx, H * 0.87, Math.max(13, S * 0.036), C.danger, { bold: true, glow: 16 });
  },
},

// ── 3 · Counting With the Body ──────────────────────────────────────────────────
{
  id: 'body', era: 'bone', title: 'Counting With the Body', kicker: 'Marks, fingers, knots',
  narration: 'Long before paper, numbers lived in the body — on fingers, on bones, on rope tied into knots. A hunter scratched a mark for each deer. Notice a clever habit: the marks bundle into fives, so you can read them at a glance. These were not numbers as we know them. They were memory, made visible.',
  prompt: 'Click anywhere to <b>carve a tally mark</b>. Watch every fifth mark strike through the bundle — the first shortcut in history.',
  aspect: 0.58,
  controls: [{ type: 'button', id: 'reset', label: 'Clear marks' }],
  setup(ctx) { ctx.state.count = 0; ctx.state.last = -1; },
  onControl(ctx, id) { if (id === 'reset') { ctx.state.count = 0; ctx.state.last = ctx.t; } },
  pointer(ctx, e) {
    if (e.type !== 'down') return;
    if (ctx.state.count < 24) { ctx.state.count++; ctx.state.last = ctx.t; ctx.sfx && ctx.sfx.tick(); }
    if (ctx.state.count >= 6) ctx.discover();
  },
  draw(ctx) {
    const { p, W, H, cx, cy, S, state } = ctx;
    const n = state.count;
    ctx.cap('tally on bone', 'हड्डी पर निशान', cx, H * 0.16, Math.max(12, S * 0.032), C.textLo);
    const groups = Math.max(1, Math.ceil(n / 5));
    const gW = S * 0.17, gap = S * 0.05;
    const perRow = Math.max(1, Math.floor((W * 0.86) / (gW + gap)));
    const rows = Math.ceil(groups / perRow);
    const startY = cy - (rows - 1) * S * 0.14 * 0.5;
    for (let g = 0; g < groups; g++) {
      const rr = Math.floor(g / perRow), cc = g % perRow;
      const rowGroups = Math.min(perRow, groups - rr * perRow);
      const rowW = rowGroups * gW + (rowGroups - 1) * gap;
      const gx = cx - rowW / 2 + cc * (gW + gap);
      const gy = startY + rr * S * 0.16;
      for (let k = 0; k < 5; k++) {
        const idx = g * 5 + k; if (idx >= n) break;
        const fresh = idx === n - 1 ? smooth(clamp01((ctx.t - state.last) / 0.25)) : 1;
        p.stroke(col(p, k === 4 ? C.secondary : C.primary, 240));
        p.strokeWeight(S * 0.009);
        p.drawingContext.shadowBlur = 10; p.drawingContext.shadowColor = hexToRgba(k === 4 ? C.secondary : C.primary, 0.4);
        if (k < 4) { const lx = gx + k * (gW / 5.2); p.line(lx, gy - S * 0.07 * fresh, lx, gy + S * 0.07 * fresh); }
        else p.line(gx - gW * 0.02, gy + S * 0.08, gx + gW * 0.78, gy - S * 0.08);
        p.drawingContext.shadowBlur = 0;
      }
    }
    txt(p, String(n), cx, H * 0.86, S * 0.08, C.textHi, { font: F.mono, bold: true, glow: 12 });
    if (n === 0) ctx.cap('click to carve a mark', 'निशान बनाने के लिए क्लिक करें', cx, cy, S * 0.04, C.textLo);
  },
},

// ── 4 · Villages Became Cities ──────────────────────────────────────────────────
{
  id: 'cities', era: 'clay', title: 'When Villages Became Cities', kicker: 'Counting gets serious',
  narration: 'As villages grew into cities, people had to track grain, oil, land, taxes, soldiers. Scribes in Mesopotamia pressed marks into wet clay. But recording big amounts one wedge at a time was slow and heavy. Civilization needed not just to count — but to count fast, and accurately.',
  prompt: 'Press wedges into the clay to record <b>12 goats</b> for the king. Feel the tedium — then imagine tallying six thousand soldiers this way.',
  aspect: 0.6,
  controls: [{ type: 'button', id: 'reset', label: 'Smooth the clay' }],
  setup(ctx) { ctx.state.count = 0; ctx.state.target = 12; },
  onControl(ctx, id) { if (id === 'reset') ctx.state.count = 0; },
  pointer(ctx, e) {
    if (e.type !== 'down') return;
    if (ctx.state.count < ctx.state.target) { ctx.state.count++; ctx.sfx && ctx.sfx.tick(); }
    if (ctx.state.count >= ctx.state.target) ctx.discover();
  },
  draw(ctx) {
    const { p, W, H, cx, cy, S, state } = ctx;
    p.push(); p.rectMode(p.CENTER); p.noStroke();
    p.fill(col(p, '#6B5A44', 255)); p.rect(cx, cy, W * 0.7, H * 0.62, 18);
    p.fill(col(p, '#7A6750', 255)); p.rect(cx, cy, W * 0.64, H * 0.54, 14);
    p.pop();
    // wedges in rows
    const n = state.count, cols = 6;
    const x0 = cx - S * 0.24, y0 = cy - S * 0.1;
    for (let i = 0; i < n; i++) {
      const wx = x0 + (i % cols) * S * 0.088, wy = y0 + Math.floor(i / cols) * S * 0.11;
      p.push(); p.translate(wx, wy); p.rotate(-0.2); p.noStroke(); p.fill(col(p, '#33291F', 255));
      p.triangle(0, -S * 0.02, S * 0.05, -S * 0.005, 0, S * 0.03); p.pop();
    }
    const goatsLabel = ctx.lang === 'hi' ? `${n} / ${state.target} बकरियाँ` : `${n} / ${state.target} goats`;
    txt(p, goatsLabel, cx, cy + H * 0.22, Math.max(13, S * 0.04),
        n >= state.target ? C.success : C.secondary, { font: ctx.lang === 'hi' ? F.deva : F.mono, bold: true });
    if (n >= state.target) ctx.cap("Now imagine the king's 6,000 soldiers…", 'अब राजा के 6,000 सैनिकों की कल्पना कीजिए…', cx, H * 0.1, Math.max(12, S * 0.034), C.textLo, { italic: true });
    else ctx.cap('press the clay', 'मिट्टी दबाइए', cx, H * 0.1, Math.max(12, S * 0.032), C.textLo);
  },
},

// ── 5 · Symbols Are Born ────────────────────────────────────────────────────────
{
  id: 'symbols', era: 'marble', title: 'Symbols Are Born', kicker: 'Noble, but heavy',
  narration: 'Different peoples built different symbols. The Romans gave us I, V, X, L, C, D, M — clear and noble. But try calculating with them. Big Roman numerals grow long and clumsy, and multiplying them is a nightmare. Humanity had symbols. It still lacked speed. It still lacked the great secret.',
  prompt: 'Drag the slider. Watch a tidy number like <b>1944</b> become the monster <b>MCMXLIV</b> in Roman — now imagine multiplying two of those.',
  aspect: 0.55,
  controls: [{ type: 'slider', id: 'n', min: 1, max: 1999, step: 1, value: 8, label: 'Number' }],
  setup(ctx) { ctx.state.n = 8; },
  onControl(ctx, id, v) { if (id === 'n') { ctx.state.n = Math.round(v); if (toRoman(ctx.state.n).length >= 7) ctx.discover(); } },
  draw(ctx) {
    const { p, W, H, cx, cy, S, state } = ctx;
    const n = state.n, roman = toRoman(n);
    ctx.cap('our numerals', 'हमारे अंक', cx, H * 0.2, Math.max(12, S * 0.03), C.textLo);
    txt(p, String(n), cx, H * 0.36, S * 0.14, C.primary, { font: F.mono, bold: true, glow: 16 });
    ctx.cap('Roman numerals', 'रोमन अंक', cx, H * 0.6, Math.max(12, S * 0.03), C.textLo);
    // size Roman down as it gets long so it always fits
    const rSize = Math.min(S * 0.1, (W * 0.9) / Math.max(roman.length, 1) * 1.25);
    txt(p, roman, cx, H * 0.74, rSize, roman.length >= 7 ? C.danger : C.secondary, { bold: true, glow: 12 });
    const symLabel = ctx.lang === 'hi' ? `${n} लिखने में ${roman.length} प्रतीक` : `${roman.length} symbols to write ${n}`;
    txt(p, symLabel, cx, H * 0.92, Math.max(11, S * 0.03), C.textLo, { font: ctx.lang === 'hi' ? F.deva : F.mono });
  },
},

// ── 6 · The Secret of Position ──────────────────────────────────────────────────
{
  id: 'place-value', era: 'ink', title: 'The Secret of Position', kicker: 'The great secret',
  narration: 'Then came the breakthrough: the value of a symbol can depend on its position. The same digit two means two in the ones place, twenty in the tens place, two hundred in the hundreds place. A few symbols could now express infinitely large ideas. This is place value.',
  prompt: 'Grab the glowing digit and <b>drag it left across the columns</b>. Same digit — but its <i>place</i> multiplies its power by ten each step. (Change the digit with the slider too.)',
  aspect: 0.6,
  controls: [
    { type: 'slider', id: 'digit', min: 1, max: 9, step: 1, value: 2, label: 'Digit' },
    { type: 'button', id: 'move-left', label: 'Move digit left →' }, // keyboard alternative to the drag
  ],
  setup(ctx) { ctx.state.digit = 2; ctx.state.place = 0; ctx.state.dragX = null; ctx.state.dragging = false; },
  onControl(ctx, id, v) {
    if (id === 'digit') ctx.state.digit = Math.round(v);
    if (id === 'move-left') {
      ctx.state.place = Math.min(2, ctx.state.place + 1);
      if (ctx.state.place === 2) ctx.discover();
    }
  },
  _cols(ctx) {
    const { W, H, S } = ctx; const cw = S * 0.17, gap = cw * 0.3;
    const totalW = 3 * cw + 2 * gap, x0 = W / 2 - totalW / 2;
    return [0, 1, 2].map(i => x0 + (2 - i) * (cw + gap) + cw / 2); // index by place: 0=ones(right)…2=hundreds(left)
  },
  pointer(ctx, e) {
    const { state } = ctx; const cols = this._cols(ctx); const rowY = ctx.H * 0.5; const r = ctx.S * 0.11;
    const dx = cols[state.place];
    if (e.type === 'down' && dist2(e.x, e.y, dx, rowY) < r * r) { state.dragging = true; state.dragX = e.x; }
    else if (e.type === 'move' && state.dragging) {
      state.dragX = clamp(e.x, cols[2], cols[0]);
      // nearest column → place
      let best = 1e9, bi = state.place;
      cols.forEach((cx2, i) => { const d = Math.abs(e.x - cx2); if (d < best) { best = d; bi = i; } });
      state.place = bi;
      if (bi === 2) ctx.discover();
    } else if (e.type === 'up') { state.dragging = false; state.dragX = null; }
  },
  draw(ctx) {
    const { p, W, H, cx, S, state } = ctx;
    const rowY = H * 0.5, cw = S * 0.17, ch = S * 0.24;
    const cols = this._cols(ctx);
    const occ = [state.place >= 2, state.place >= 1, true]; // [H,T,O]
    const isHi = ctx.lang === 'hi';
    placeCells(p, cx, rowY, cw, ch, isHi ? ['सैकड़े', 'दहाई', 'इकाई'] : ['Hundreds', 'Tens', 'Ones'], occ, 2 - state.place, isHi ? F.deva : F.sans);
    // zeros holding lower places
    if (state.place >= 1) txt(p, '0', cols[0], rowY, ch * 0.55, C.secondary, { font: F.mono, bold: true, glow: 12 });
    if (state.place >= 2) txt(p, '0', cols[1], rowY, ch * 0.55, C.secondary, { font: F.mono, bold: true, glow: 12 });
    // the draggable digit
    const dx = state.dragging && state.dragX != null ? state.dragX : cols[state.place];
    const grabbed = dist2(ctx.mouse.x, ctx.mouse.y, dx, rowY) < (S * 0.11) ** 2;
    txt(p, String(state.digit), dx, rowY, ch * 0.6, C.primary, { font: F.mono, bold: true, glow: grabbed || state.dragging ? 30 : 20 });
    // value readout
    const val = state.digit * Math.pow(10, state.place);
    txt(p, val.toLocaleString(), cx, H * 0.2, S * 0.11, C.textHi, { font: F.mono, bold: true, glow: 16 });
    if (state.place === 2) ctx.cap('Same digit — one hundred times bigger!', 'वही अंक — सौ गुना बड़ा!', cx, H * 0.88, Math.max(12, S * 0.034), C.success, { bold: true });
    else ctx.cap('drag the digit left →', 'अंक को बाईं ओर खींचिए →', cx, H * 0.88, Math.max(12, S * 0.034), C.textLo);
  },
},

// ── 7 · The Mystery of Nothing ──────────────────────────────────────────────────
{
  id: 'nothing', era: 'ink', title: 'The Mystery of Nothing', kicker: 'Give shape to emptiness',
  narration: 'But a shadow remained. How do you write a number when a place is empty? Is one, blank, five the number fifteen, or one hundred and five? In ancient India came the answer: a symbol for nothing that still holds its place. Zero. A mark for nothing — and a tool for everything.',
  prompt: 'First guess what <b>1 _ 5</b> means. Confusing, right? Now <b>drag the zero</b> into the empty place and watch the number become certain.',
  aspect: 0.6,
  controls: [
    { type: 'button', id: 'g15', label: 'Is it 15?' },
    { type: 'button', id: 'g105', label: 'Is it 105?' },
    { type: 'button', id: 'drop-zero', label: 'Drop zero into place' }, // keyboard alternative to the drag
  ],
  setup(ctx) { ctx.state.filled = false; ctx.state.guessed = false; ctx.state.dragging = false; ctx.state.zx = null; ctx.state.zy = null; ctx.state.dropT = 0; },
  onControl(ctx, id) {
    if (id === 'drop-zero') { if (!ctx.state.filled) { ctx.state.filled = true; ctx.state.dropT = ctx.t; ctx.discover(); } return; }
    ctx.state.guessed = true;
  },
  _cols(ctx) {
    const { W, S } = ctx; const cw = S * 0.17, gap = cw * 0.3, totalW = 3 * cw + 2 * gap, x0 = W / 2 - totalW / 2;
    return [0, 1, 2].map(i => x0 + i * (cw + gap) + cw / 2); // left→right: [1][gap][5]
  },
  _zeroHome(ctx) { return [ctx.W / 2, ctx.H * 0.82]; },
  pointer(ctx, e) {
    const { state } = ctx; if (state.filled) return;
    const [hx, hy] = this._zeroHome(ctx); const zx = state.zx ?? hx, zy = state.zy ?? hy; const r = ctx.S * 0.09;
    if (e.type === 'down' && dist2(e.x, e.y, zx, zy) < r * r) { state.dragging = true; state.zx = e.x; state.zy = e.y; }
    else if (e.type === 'move' && state.dragging) { state.zx = e.x; state.zy = e.y; }
    else if (e.type === 'up' && state.dragging) {
      state.dragging = false;
      const gap = this._cols(ctx)[1], rowY = ctx.H * 0.45;
      if (dist2(e.x, e.y, gap, rowY) < (ctx.S * 0.12) ** 2) { state.filled = true; state.dropT = ctx.t; ctx.discover(); }
      else { state.zx = null; state.zy = null; }
    }
  },
  draw(ctx) {
    const { p, W, H, cx, S, state } = ctx;
    const rowY = H * 0.45, cw = S * 0.17, ch = S * 0.24, cols = this._cols(ctx);
    const occ = [true, state.filled, true];
    const isHi = ctx.lang === 'hi';
    placeCells(p, cx, rowY, cw, ch, isHi ? ['सैकड़े', 'दहाई', 'इकाई'] : ['Hundreds', 'Tens', 'Ones'], occ, state.filled ? -1 : 1, isHi ? F.deva : F.sans);
    txt(p, '1', cols[0], rowY, ch * 0.6, C.primary, { font: F.mono, bold: true, glow: 14 });
    txt(p, '5', cols[2], rowY, ch * 0.6, C.primary, { font: F.mono, bold: true, glow: 14 });

    if (!state.filled) {
      const q = 0.4 + 0.6 * Math.abs(Math.sin(ctx.t * 3));
      txt(p, '?', cols[1], rowY, ch * 0.6, C.danger, { bold: true, a: 255 * q });
      if (state.guessed) ctx.cap('Could be 15 OR 105 — nobody can tell!', 'यह 15 भी हो सकता है, 105 भी — कोई नहीं बता सकता!', cx, H * 0.2, Math.max(12, S * 0.034), C.danger, { bold: true });
      else txt(p, isHi ? 'यह 15 है या 105 ?' : 'is this  15  or  105 ?', cx, H * 0.2, Math.max(13, S * 0.04), C.textLo, { font: isHi ? F.deva : F.mono });
      // the draggable zero tile
      const [hx, hy] = this._zeroHome(ctx); const zx = state.zx ?? hx, zy = state.zy ?? hy;
      const grab = dist2(ctx.mouse.x, ctx.mouse.y, zx, zy) < (S * 0.09) ** 2;
      p.push(); p.rectMode(p.CENTER);
      p.drawingContext.shadowBlur = grab || state.dragging ? 26 : 14; p.drawingContext.shadowColor = hexToRgba(C.secondary, 0.6);
      p.fill(col(p, C.surface, 240)); p.stroke(col(p, C.secondary, 240)); p.strokeWeight(2.5);
      p.rect(zx, zy, S * 0.12, S * 0.14, 10); p.drawingContext.shadowBlur = 0; p.pop();
      txt(p, '0', zx, zy, S * 0.08, C.secondary, { font: F.mono, bold: true });
      if (!state.dragging) ctx.cap('drag me into the empty place ↑', 'मुझे खाली जगह में खींचिए ↑', zx, zy + S * 0.11, Math.max(11, S * 0.028), C.textLo);
    } else {
      const drop = seg(ctx.t, state.dropT, state.dropT + 0.5);
      txt(p, '0', cols[1], rowY, ch * 0.6, C.secondary, { font: F.mono, bold: true, glow: 28 });
      txt(p, '1 0 5', cx, H * 0.2, S * 0.08, C.textHi, { font: F.mono, bold: true, glow: 16, a: 255 * drop });
      ctx.cap('Zero holds the empty place. Now it is certain.', 'शून्य खाली जगह रोके रखता है। अब यह पक्का है।', cx, H * 0.85, Math.max(12, S * 0.034), C.secondary, { a: 255 * drop });
    }
  },
},

// ── 8 · When Zero Changed the World ─────────────────────────────────────────────
{
  id: 'zero-power', era: 'ink', title: 'When Zero Changed the World', kicker: 'Nothing means everything',
  narration: 'Zero was more than a placeholder. Without it, place value collapses. A hundred and five and a thousand and five both crumble into fifteen. With zero, every number keeps its exact shape. To turn emptiness into mathematics — that is genius.',
  prompt: 'Flip the switch to <b>yank the zeros out</b>. Watch 105 and 1005 both crumble into 15 — pure chaos. Flip it back to restore order.',
  aspect: 0.58,
  controls: [{ type: 'button', id: 'strip', label: 'Remove the zeros' }],
  setup(ctx) { ctx.state.strip = false; },
  onControl(ctx, id) { if (id === 'strip') { ctx.state.strip = !ctx.state.strip; ctx.discover(); } },
  controlState(ctx, id) { return id === 'strip' ? ctx.state.strip : false; },
  draw(ctx) {
    const { p, W, H, cx, S, state } = ctx;
    const nums = ['105', '1005'];
    const ys = [H * 0.4, H * 0.66];
    nums.forEach((num, r) => {
      const shown = state.strip ? num.replace(/0/g, '') : num;
      const chars = state.strip ? shown : num;
      p.textFont(F.mono); p.textStyle(p.BOLD); p.textSize(S * 0.13); p.textAlign(p.LEFT, p.CENTER);
      const tw = p.textWidth(chars);
      let x = cx - tw / 2;
      for (const chr of chars) {
        const isZero = chr === '0';
        const hex = isZero ? C.secondary : C.textHi;
        p.drawingContext.shadowBlur = isZero ? 26 : 12; p.drawingContext.shadowColor = hexToRgba(hex, 0.6);
        p.noStroke(); p.fill(col(p, hex, 255));
        p.text(chr, x, ys[r]); x += p.textWidth(chr);
      }
      p.drawingContext.shadowBlur = 0;
    });
    if (state.strip) ctx.cap('Both became 15 — the numbers collapsed!', 'दोनों 15 बन गए — संख्याएँ ढह गईं!', cx, H * 0.9, Math.max(13, S * 0.036), C.danger, { bold: true, glow: 14 });
    else ctx.cap('Zeros keep 105 and 1005 apart.', 'शून्य 105 और 1005 को अलग रखते हैं।', cx, H * 0.9, Math.max(12, S * 0.034), C.success);
    if (state.strip) ctx.cap('without zero', 'शून्य के बिना', cx, H * 0.16, Math.max(12, S * 0.034), C.textLo);
    else ctx.cap('with zero', 'शून्य के साथ', cx, H * 0.16, Math.max(12, S * 0.034), C.textLo);
  },
},

// ── 9 · Ten Symbols, Endless Power ──────────────────────────────────────────────
{
  id: 'ten-symbols', era: 'saffron', title: 'Ten Symbols, Endless Power', kicker: 'From India to the world',
  narration: 'With just ten symbols — zero through nine — you can write any number that exists: the price of wheat, the distance to a star, the movement of planets. These numerals took shape in India, were refined and carried by Arab scholars, and adopted across the world. We call them the Hindu-Arabic numerals, because great ideas travel through many hands.',
  prompt: 'Tap the <b>top or bottom</b> of each wheel to spin the digits. With only ten symbols, build any number you like — even into the millions.',
  aspect: 0.6,
  controls: [{ type: 'button', id: 'rand', label: '🎲 Randomize' }, { type: 'button', id: 'max', label: 'Make it huge' }],
  setup(ctx) { ctx.state.digits = [0, 0, 4, 2]; },
  onControl(ctx, id) {
    if (id === 'rand') ctx.state.digits = ctx.state.digits.map(() => Math.floor(Math.random() * 10));
    if (id === 'max') ctx.state.digits = [9, 9, 9, 9];
    if (ctx.state.digits.some((d, i) => i < 2 && d > 0)) ctx.discover();
  },
  _cols(ctx) { const { W, S } = ctx; const n = 4, sp = S * 0.2, x0 = W / 2 - (n - 1) * sp / 2; return ctx.state.digits.map((_, i) => x0 + i * sp); },
  pointer(ctx, e) {
    if (e.type !== 'down') return;
    const cols = this._cols(ctx), rowY = ctx.H * 0.5, half = ctx.S * 0.13;
    cols.forEach((x, i) => {
      if (Math.abs(e.x - x) < ctx.S * 0.09 && Math.abs(e.y - rowY) < half) {
        ctx.state.digits[i] = (ctx.state.digits[i] + (e.y < rowY ? 1 : 9)) % 10;
        ctx.sfx && ctx.sfx.pop();
      }
    });
    if (ctx.state.digits.some((d, i) => i < 2 && d > 0)) ctx.discover();
  },
  draw(ctx) {
    const { p, W, H, cx, S, state } = ctx;
    const cols = this._cols(ctx), rowY = H * 0.5;
    const val = parseInt(state.digits.join(''), 10);
    txt(p, val.toLocaleString(), cx, H * 0.18, S * 0.1, C.textHi, { font: F.mono, bold: true, glow: 16 });
    cols.forEach((x, i) => {
      const grab = Math.abs(ctx.mouse.x - x) < S * 0.09 && Math.abs(ctx.mouse.y - rowY) < S * 0.13;
      p.push(); p.rectMode(p.CENTER); p.noFill();
      p.stroke(col(p, grab ? C.primary : C.grid, grab ? 235 : 160)); p.strokeWeight(grab ? 2.5 : 1.5);
      p.rect(x, rowY, S * 0.15, S * 0.24, 10); p.pop();
      txt(p, '▲', x, rowY - S * 0.15, S * 0.035, C.textLo);
      txt(p, '▼', x, rowY + S * 0.15, S * 0.035, C.textLo);
      txt(p, String(state.digits[i]), x, rowY, S * 0.12, C.primary, { font: F.mono, bold: true, glow: 14 });
    });
    ctx.cap('just ten symbols  →  every number', 'सिर्फ़ दस प्रतीक  →  हर संख्या', cx, H * 0.88, Math.max(12, S * 0.034), C.textLo);
    // ambient journey dots
    const stops = [[0.7, 'India'], [0.5, 'Arab world'], [0.3, 'Europe']];
    stops.forEach(([fx, label], i) => {
      const on = (Math.floor(ctx.t) % 3) === i;
      p.noStroke(); p.fill(col(p, C.secondary, on ? 230 : 90));
      p.circle(fx * W, H * 0.97, S * 0.012);
    });
  },
},

// ── 10 · More Than Counting ─────────────────────────────────────────────────────
{
  id: 'beyond', era: 'cosmic', title: 'More Than Counting', kicker: 'New questions, new numbers',
  narration: 'At first numbers counted sheep and grain. Then life asked harder questions. I owe more than I own — so came negative numbers. Split one loaf among four — fractions. Measure precisely — decimals. A length that is no simple fraction — irrationals like root two. What squares to a negative — imaginary numbers. Reality asked, and numbers answered.',
  prompt: 'Each button is a question someone once asked. <b>Tap all five</b> to grow the number line into whole new kinds of number.',
  aspect: 0.55,
  controls: [
    { type: 'button', id: 'neg',  label: '“less than nothing?”' },
    { type: 'button', id: 'frac', label: '“split the loaf?”' },
    { type: 'button', id: 'dec',  label: '“more precise?”' },
    { type: 'button', id: 'irr',  label: '“no fraction fits?”' },
    { type: 'button', id: 'imag', label: '“square root of −1?”' },
  ],
  setup(ctx) { ctx.state.on = {}; ctx.state.tOn = {}; },
  controlState(ctx, id) { return !!ctx.state.on[id]; },
  onControl(ctx, id) {
    ctx.state.on[id] = !ctx.state.on[id];
    ctx.state.tOn[id] = ctx.t;
    if (['neg', 'frac', 'dec', 'irr', 'imag'].every(k => ctx.state.on[k])) ctx.discover();
  },
  draw(ctx) {
    const { p, W, H, cx, cy, S, state } = ctx;
    const axisY = cy + S * 0.06, unit = S * 0.13, X = (v) => cx + v * unit;
    p.stroke(col(p, C.grid, 220)); p.strokeWeight(2); p.line(W * 0.06, axisY, W * 0.94, axisY);
    // positives 0..3 always
    for (let v = 0; v <= 3; v++) {
      p.stroke(col(p, v === 0 ? C.secondary : C.primary, 220)); p.strokeWeight(2);
      p.line(X(v), axisY - S * 0.02, X(v), axisY + S * 0.02);
      txt(p, String(v), X(v), axisY + S * 0.06, Math.max(12, S * 0.032), v === 0 ? C.secondary : C.textLo, { font: F.mono, bold: v === 0 });
    }
    const A = (id) => 255 * smooth(segL(ctx.t, state.tOn[id] || 0, (state.tOn[id] || 0) + 0.6)) * (state.on[id] ? 1 : 0);
    if (state.on.neg) for (let v = 1; v <= 3; v++) {
      const a = A('neg'); p.stroke(col(p, C.danger, a)); p.strokeWeight(2);
      p.line(X(-v), axisY - S * 0.02, X(-v), axisY + S * 0.02);
      txt(p, '-' + v, X(-v), axisY + S * 0.06, Math.max(12, S * 0.032), C.danger, { font: F.mono, a });
    }
    if (state.on.frac) { const a = A('frac'); p.noStroke(); p.fill(col(p, C.success, a)); p.circle(X(0.5), axisY, S * 0.016);
      txt(p, '1/2', X(0.5), axisY - S * 0.055, Math.max(12, S * 0.032), C.success, { font: F.mono, bold: true, a }); }
    if (state.on.dec) { const a = A('dec'); p.noStroke(); p.fill(col(p, C.primary, a)); p.circle(X(2.4), axisY, S * 0.015);
      txt(p, '2.4', X(2.4), axisY - S * 0.055, Math.max(12, S * 0.032), C.primary, { font: F.mono, bold: true, a }); }
    if (state.on.irr) { const a = A('irr'); p.noStroke(); p.fill(col(p, C.secondary, a)); p.circle(X(1.414), axisY, S * 0.015);
      txt(p, '√2', X(1.414), axisY - S * 0.055, Math.max(12, S * 0.032), C.secondary, { bold: true, a }); }
    if (state.on.imag) { const a = A('imag'); p.stroke(col(p, C.accent2, a)); p.strokeWeight(2);
      p.line(X(0), axisY, X(0), axisY - S * 0.2); p.noStroke(); p.fill(col(p, C.accent2, a));
      glowShape(p, C.accent2, 16, 0.6 * a / 255, () => p.circle(X(0), axisY - S * 0.2, S * 0.016));
      txt(p, 'i', X(0) + S * 0.03, axisY - S * 0.2, S * 0.04, C.accent2, { bold: true, italic: true, a }); }
    const count = ['neg','frac','dec','irr','imag'].filter(k => state.on[k]).length;
    const kindsLabel = ctx.lang === 'hi' ? `${count} / 5 तरह की संख्याएँ मिलीं` : `${count} / 5 kinds of number discovered`;
    txt(p, kindsLabel, cx, H * 0.12, Math.max(12, S * 0.034),
        count === 5 ? C.success : C.textLo, { bold: count === 5, font: ctx.lang === 'hi' ? F.deva : F.sans });
  },
},

// ── 11 · From Pebbles to Planets ────────────────────────────────────────────────
{
  id: 'scales', era: 'cosmic', title: 'From Pebbles to Planets', kicker: 'Numbers at every scale',
  narration: 'What began with pebbles in a shepherd\'s hand grew into the language of science. The same ten symbols count a handful of sheep, the people of a nation, and the distance to a galaxy — two and a half million light-years away. From cave walls to computer code, numbers became the invisible architecture of the modern world.',
  prompt: 'Drag the slider to <b>zoom out</b> — from a single pebble all the way to a galaxy. The same numerals scale to anything.',
  aspect: 0.58,
  controls: [{ type: 'slider', id: 'zoom', min: 0, max: 6, step: 1, value: 0, label: 'Zoom out' }],
  setup(ctx) { ctx.state.z = 0; },
  onControl(ctx, id, v) { if (id === 'zoom') { ctx.state.z = Math.round(v); if (ctx.state.z >= 6) ctx.discover(); } },
  draw(ctx) {
    const { p, W, H, cx, cy, S, state } = ctx;
    const steps = [
      { n: 1,          label: 'one pebble',            hi: 'एक कंकड़',            c: C.secondary },
      { n: 12,         label: 'a flock of sheep',      hi: 'भेड़ों का झुंड',       c: C.primary },
      { n: 300,        label: 'a busy market',         hi: 'भरा हुआ बाज़ार',       c: C.primary },
      { n: 50000,      label: 'a whole city',          hi: 'पूरा शहर',            c: C.primary },
      { n: 1400000000, label: 'a nation of people',    hi: 'एक देश के लोग',        c: C.success },
      { n: 8000000000, label: 'everyone on Earth',     hi: 'धरती के सब लोग',       c: C.success },
      { n: 2500000,    label: '2.5M light-yrs → galaxy', hi: '25 लाख प्रकाश-वर्ष → आकाशगंगा', c: C.accent2 },
    ];
    const s = steps[state.z];
    // a cloud of dots whose count/spread suggests the scale
    const rnd = mulberry32(1 + state.z);
    const count = Math.min(220, 6 + state.z * 36);
    const spread = lerp(0.05, 0.44, state.z / 6);
    for (let i = 0; i < count; i++) {
      const ang = rnd() * Math.PI * 2, rad = Math.pow(rnd(), 0.6) * spread * S * 2;
      const x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad * 0.7;
      const tw = 0.5 + 0.5 * Math.sin(ctx.t * 2 + i);
      p.noStroke(); p.fill(col(p, s.c, 150 * tw));
      p.circle(x, y, state.z === 6 ? 2 : S * 0.012);
    }
    if (state.z === 0) pebble(p, cx, cy, S * 0.05, C.secondary, 255, 30);
    txt(p, s.n.toLocaleString(), cx, H * 0.2, S * 0.1, C.textHi, { font: F.mono, bold: true, glow: 16 });
    ctx.cap(s.label, s.hi, cx, H * 0.86, Math.max(13, S * 0.04), s.c, { bold: true });
    // scale ticks
    for (let i = 0; i <= 6; i++) { p.noStroke(); p.fill(col(p, i <= state.z ? C.primary : C.grid, 220)); p.circle(cx - S * 0.18 + i * S * 0.06, H * 0.94, S * 0.012); }
  },
},

// ── 12 · Who Invented Numbers? ──────────────────────────────────────────────────
{
  id: 'finale', era: 'cosmic', title: 'Who Invented Numbers?', kicker: 'Many minds, many lands',
  narration: 'So who invented numbers? Not one person, not one nation. Shepherds who counted flocks, traders who tracked goods, scribes who recorded taxes, scholars who invented zero, astronomers who mapped the stars, and children learning to count. The story of numbers is the story of human thought learning to hold the world. And it all began with a simple question: how many?',
  prompt: 'Tap each person to honour their part in the story. Light up all six to reach the present day — where numbers live in every screen, clock, and machine.',
  aspect: 0.62,
  setup(ctx) {
    ctx.state.roles = [
      { key: 'shepherd', label: 'Shepherd', labelHi: 'गड़रिया',  note: 'first matched sheep to stones', noteHi: 'भेड़ों को पत्थरों से मिलाया' },
      { key: 'hunter',   label: 'Hunter',   labelHi: 'शिकारी',   note: 'tallied marks on bone',         noteHi: 'हड्डी पर निशान गिने' },
      { key: 'scribe',   label: 'Scribe',   labelHi: 'लिपिक',    note: 'recorded grain in clay',        noteHi: 'मिट्टी में अनाज दर्ज किया' },
      { key: 'scholar',  label: 'Scholar',  labelHi: 'विद्वान',  note: 'invented zero in India',        noteHi: 'भारत में शून्य गढ़ा' },
      { key: 'trader',   label: 'Trader',   labelHi: 'सौदागर',   note: 'carried numerals across lands', noteHi: 'अंकों को देश-देश पहुँचाया' },
      { key: 'child',    label: 'Child',    labelHi: 'बच्चा',    note: 'still asks: how many?',         noteHi: 'आज भी पूछता है: कितने?' },
    ];
    ctx.state.lit = new Set();
    ctx.state.allT = -1;   // time all six were lit (for the "You" reveal)
  },
  _nodes(ctx) {
    const { W, H, S, state } = ctx;
    return state.roles.map((r, i) => {
      const ang = (i / state.roles.length) * Math.PI * 2 - Math.PI / 2;
      return { r, x: W / 2 + Math.cos(ang) * S * 0.34, y: H * 0.5 + Math.sin(ang) * S * 0.3, i };
    });
  },
  pointer(ctx, e) {
    if (e.type !== 'down') return;
    for (const nd of this._nodes(ctx)) {
      if (dist2(e.x, e.y, nd.x, nd.y) < (ctx.S * 0.09) ** 2) {
        ctx.state.lit.add(nd.i);
        if (ctx.state.lit.size === ctx.state.roles.length && ctx.state.allT < 0) { ctx.state.allT = ctx.t; ctx.discover(); }
        break;
      }
    }
  },
  draw(ctx) {
    const { p, W, H, cx, cy, S, state } = ctx;
    const all = state.lit.size === state.roles.length;
    for (const nd of this._nodes(ctx)) {
      const lit = state.lit.has(nd.i);
      const near = dist2(ctx.mouse.x, ctx.mouse.y, nd.x, nd.y) < (S * 0.09) ** 2;
      p.push();
      if (lit) { p.drawingContext.shadowBlur = 20; p.drawingContext.shadowColor = hexToRgba(C.primary, 0.5); }
      p.stroke(col(p, lit ? C.primary : near ? C.textLo : C.grid, 235)); p.strokeWeight(lit ? 2.5 : 1.5);
      p.fill(col(p, C.surface, lit ? 220 : 130)); p.circle(nd.x, nd.y, S * 0.13); p.pop();
      ctx.cap(nd.r.label, nd.r.labelHi, nd.x, nd.y - S * 0.005, Math.max(11, S * 0.026), lit ? C.textHi : C.textLo, { bold: true });
      if (lit) ctx.cap(nd.r.note, nd.r.noteHi, nd.x, nd.y + S * 0.035, Math.max(9, S * 0.019), C.primary);
    }
    if (all) {
      // The 7th figure: YOU. Fades in at the centre once all six are lit.
      const you = (ctx.playerName || 'You');
      const rev = smooth(segL(ctx.t, state.allT, state.allT + 1.0));
      // connect every contributor to the centre — the chain that reaches you
      p.stroke(col(p, C.primary, 90 * rev)); p.strokeWeight(1.2);
      for (const nd of this._nodes(ctx)) p.line(nd.x, nd.y, cx, cy);
      p.push();
      p.drawingContext.shadowBlur = 26 * rev; p.drawingContext.shadowColor = hexToRgba(C.secondary, 0.6);
      p.stroke(col(p, C.secondary, 240 * rev)); p.strokeWeight(2.5);
      p.fill(col(p, C.surface, 220 * rev)); p.circle(cx, cy, S * 0.15 * (0.6 + 0.4 * rev));
      p.pop();
      txt(p, you, cx, cy - S * 0.008, Math.max(13, S * 0.036), C.secondary, { bold: true, glow: 16, a: 255 * rev, font: ctx.lang === 'hi' ? F.deva : F.sans });
      ctx.cap('the newest link', 'सबसे नई कड़ी', cx, cy + S * 0.035, Math.max(9, S * 0.02), C.textHi, { a: 220 * rev });
      ctx.cap('Ten thousand years led to you.', 'दस हज़ार साल आप तक पहुँचे।', cx, H * 0.9, Math.max(12, S * 0.032), C.textHi, { a: 255 * rev });
    } else {
      const honoured = ctx.lang === 'hi' ? `${state.lit.size} / 6 को सम्मान` : `${state.lit.size} / 6 honoured`;
      txt(p, honoured, cx, cy, Math.max(13, S * 0.036), C.textLo, { font: ctx.lang === 'hi' ? F.deva : F.mono });
    }
    if (all) ctx.cap('…and the question still echoes today.', '…और वह सवाल आज भी गूँजता है।', cx, H * 0.94, Math.max(12, S * 0.032), C.textLo);
    else ctx.cap('tap each person', 'हर व्यक्ति पर टैप करें', cx, H * 0.94, Math.max(12, S * 0.032), C.textLo);
  },
},
];

// ═════════════════════════════════════════════════════════════════════════════
// Orchestrator
// ═════════════════════════════════════════════════════════════════════════════
export function initJourney({ els, lang: initialLang, onScene, onBegin } = {}) {
  let idx = 0, beatIdx = 0, mount = null, ctx = null;
  let lang = initialLang || (typeof localStorage !== 'undefined' && localStorage.getItem('am-lang') === 'hi' ? 'hi' : 'en');
  let started = false;   // becomes true on the "Begin" gesture (also unlocks audio)
  let soundOn = typeof localStorage === 'undefined' || localStorage.getItem('am-sound') !== 'off';
  const narrator = makeNarrator(() => {});
  const audio = createAudio();   // procedural SFX + ambient (unlocked on Begin)
  const vo = createVO();         // recorded/neural VO per beat (falls back to TTS)

  // ── progress + badges (localStorage) ──
  const PROGRESS_KEY = 'am-story:numbers';
  let progress = (() => { try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; } catch { return {}; } })();
  progress.furthest = progress.furthest || 0;
  progress.badges = Array.isArray(progress.badges) ? progress.badges : [];
  const saveProgress = () => { try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); } catch {} };
  const awardBadge = (id) => { if (!progress.badges.includes(id)) { progress.badges.push(id); saveProgress(); } };

  // Translation lookups: fall back to the scene's English field / label.
  const T  = (scene, field) => (lang === 'hi' && HI[scene.id] && HI[scene.id][field]) || scene[field];
  const CL = (sceneId, c) => (lang === 'hi' && HI[sceneId] && HI[sceneId].controls && HI[sceneId].controls[c.id]) || c.label;
  const ui = (k) => UI[k][lang] || UI[k].en;

  // A scene's ordered dialogue beats (falls back to a single interact beat).
  const beatsFor = (scene) => BEATS[scene.id] || [{ who: 'narrator', text: { en: scene.prompt, hi: (HI[scene.id] && HI[scene.id].prompt) || scene.prompt }, cue: 'interact' }];
  // Player name (S4): beats can use {name}; falls back to a warm generic vocative.
  const playerName = () => (progress.name && progress.name.trim())
    || (lang === 'hi' ? 'दोस्त' : 'friend');
  const line = (beat) => (beat.text[lang] || beat.text.en).replace(/\{name\}/g, playerName());

  // Toggle visibility with an INLINE style as well as [hidden]: inline styles beat
  // any (even stale-cached) stylesheet rule, so a hidden-by-default overlay can
  // never get stuck open if its CSS lags behind.
  const setShown = (el, show) => { if (!el) return; el.hidden = !show; el.style.display = show ? '' : 'none'; };

  // ── Sound toggle (voice narration now; SFX + music hook in via P2) ──
  function updateSoundBtn() {
    if (!els.soundBtn) return;
    els.soundBtn.textContent = soundOn ? '🔊' : '🔇';
    els.soundBtn.setAttribute('aria-label', soundOn ? 'Sound on' : 'Sound off');
    els.soundBtn.classList.toggle('is-off', !soundOn);
  }
  function toggleSound() {
    soundOn = !soundOn;
    try { localStorage.setItem('am-sound', soundOn ? 'on' : 'off'); } catch {}
    if (!soundOn) { narrator.stop(); vo.stop(); }
    audio.setEnabled(soundOn);
    if (soundOn && started) { audio.ambientOn(SCENES[idx].era || 'night'); }
    updateSoundBtn();
  }
  // Speak a beat: prefer a recorded/neural VO clip; fall back to browser TTS.
  const speakLine = async (beat) => {
    if (!(started && soundOn)) return;
    narrator.stop(); vo.stop();
    const ok = await vo.play(SCENES[idx].id, beatIdx, lang);
    if (!ok && started && soundOn) narrator.speak(line(beat), lang);
  };

  function setDiscovered(v) {
    if (v) els.discoverBadge.textContent = ui('found');
    setShown(els.discoverBadge, v);
    els.nextBtn.classList.toggle('is-ready', v);
  }

  function renderControls(scene) {
    els.controls.innerHTML = '';
    const list = (typeof scene.controls === 'function' ? scene.controls(ctx) : scene.controls) || [];
    setShown(els.controls, list.length > 0);
    const btns = [];
    for (const c of list) {
      if (c.type === 'slider') {
        const wrap = document.createElement('label'); wrap.className = 'jc-slider';
        const head = document.createElement('span'); head.className = 'jc-slider-head';
        const name = document.createElement('span'); name.textContent = CL(scene.id, c);
        const val  = document.createElement('span'); val.className = 'jc-slider-val'; val.textContent = c.value;
        head.append(name, val);
        const input = document.createElement('input');
        input.type = 'range'; input.min = c.min; input.max = c.max; input.step = c.step; input.value = c.value;
        input.addEventListener('input', () => { val.textContent = (+input.value).toLocaleString(); scene.onControl && scene.onControl(ctx, c.id, parseFloat(input.value)); });
        wrap.append(head, input); els.controls.append(wrap);
      } else {
        const b = document.createElement('button'); b.className = 'jc-btn'; b.textContent = CL(scene.id, c); b.dataset.id = c.id;
        b.addEventListener('click', () => { scene.onControl && scene.onControl(ctx, c.id); syncControlStates(scene, btns); });
        els.controls.append(b); btns.push(b);
      }
    }
    syncControlStates(scene, btns);
  }
  function syncControlStates(scene, btns) {
    if (!scene.controlState) return;
    btns.forEach(b => b.classList.toggle('is-on', !!scene.controlState(ctx, b.dataset.id)));
  }

  // Chrome text (scene number, title, nav labels, controls) — no dialogue here.
  function renderText() {
    const scene = SCENES[idx];
    els.sceneNum.textContent = `${String(idx + 1).padStart(2, '0')} / ${SCENES.length}`;
    els.sceneTitle.textContent = T(scene, 'title');
    els.sceneKicker.textContent = T(scene, 'kicker');
    els.prevBtn.textContent = ui('back');
    els.nextBtn.textContent = idx === SCENES.length - 1 ? ui('finish') : ui('next');
    els.discoverBadge.textContent = ui('found');
    renderControls(scene);
  }

  // ── Beat runner: renders one dialogue beat as a character speech bubble ──
  function renderBeat(doSpeak = true) {
    const scene = SCENES[idx];
    const beats = beatsFor(scene);
    beatIdx = clamp(beatIdx, 0, beats.length - 1);
    const beat = beats[beatIdx];
    const ch = CHARACTERS[beat.who] || CHARACTERS.narrator;
    const isInteract = beat.cue === 'interact';
    const isLast = beatIdx === beats.length - 1;
    const gated = isInteract && !(ctx && ctx.discovered);

    // S2: bring the speaking character ONTO the stage (bottom-left presence).
    // They lean in + glow when it's the player's turn to interact.
    let cast = els.stage.querySelector('.jc-stage-cast');
    if (!cast) { cast = document.createElement('div'); cast.className = 'jc-stage-cast'; cast.setAttribute('aria-hidden', 'true'); els.stage.appendChild(cast); }
    cast.style.setProperty('--ch', ch.color);
    cast.classList.toggle('is-cue', gated);
    cast.innerHTML = `<div class="jc-stage-portrait">${charSVG(beat.who, { talking: true })}</div>
                      <span class="jc-stage-name">${ch.name[lang] || ch.name.en}</span>`;

    els.dialogue.innerHTML =
      `<div class="jc-bubble" style="--ch:${ch.color}">
         <div class="jc-avatar" aria-hidden="true">${charSVG(beat.who, { talking: true })}</div>
         <div class="jc-bubble-body">
           <div class="jc-speaker">${ch.name[lang] || ch.name.en}</div>
           <p class="jc-line">${line(beat)}</p>
         </div>
         <button class="jc-replay" type="button" aria-label="${ui('replay')}" title="${ui('replay')}">🔊</button>
       </div>
       <div class="jc-beat-row">
         <div class="jc-beatdots" aria-hidden="true">${beats.map((_, i) => `<span class="${i === beatIdx ? 'on' : i < beatIdx ? 'seen' : ''}"></span>`).join('')}</div>
         <button class="jc-continue" type="button"></button>
       </div>`;

    els.dialogue.querySelector('.jc-replay').addEventListener('click', () => { started = true; speakLine(beat); });
    const cont = els.dialogue.querySelector('.jc-continue');
    if (gated) {
      cont.textContent = ui('yourTurn'); cont.disabled = true; cont.classList.add('is-waiting');
    } else {
      cont.textContent = isLast ? ui('done') : ui('continue'); cont.classList.add('is-ready');
    }
    cont.addEventListener('click', advanceBeat);

    if (beat.action) beat.action(ctx);
    if (doSpeak) speakLine(beat);
  }

  function advanceBeat() {
    if (soundOn) audio.click();
    const beats = beatsFor(SCENES[idx]);
    if (beatIdx < beats.length - 1) { beatIdx++; renderBeat(); }
    else if (idx < SCENES.length - 1) show(idx + 1);   // last beat → flow into next scene
    else finish();                                     // last beat of last scene → completion
  }

  // Called by the p5 scene when the hands-on interaction succeeds.
  function onSceneDiscover() {
    setDiscovered(true);
    awardBadge(SCENES[idx].id);
    if (soundOn) audio.chime();
    // shared "aha payoff" — confetti + haptic (sound handled by chime above)
    celebrate({ colors: ['var(--primary)', 'var(--secondary)'], sound: false });
    const beats = beatsFor(SCENES[idx]);
    const beat = beats[beatIdx];
    if (beat && beat.cue === 'interact') {           // unlock Continue on the interact beat
      const cont = els.dialogue.querySelector('.jc-continue');
      if (cont) {
        cont.disabled = false; cont.classList.remove('is-waiting'); cont.classList.add('is-ready', 'pulse');
        cont.textContent = beatIdx === beats.length - 1 ? ui('done') : ui('continue');
      }
    }
  }

  function show(i) {
    narrator.stop(); vo.stop();
    if (started && soundOn && mount) audio.whoosh();   // scene-change swoosh
    if (mount) { mount.remove(); mount = null; }
    idx = clamp(i, 0, SCENES.length - 1);
    beatIdx = 0;
    if (idx > progress.furthest) { progress.furthest = idx; saveProgress(); }
    const scene = SCENES[idx];
    setDiscovered(false);
    if (started && soundOn) audio.setAmbienceEra(scene.era || 'night');   // era sound bed
    mount = mountScene(els.stage, scene, { onDiscover: onSceneDiscover, sfx: audio, playerName: progress.name, lang });
    ctx = mount.getCtx();
    renderText();
    renderBeat();     // narrates beat 0 only if the story has been "begun"
    // scene-change transition: fade/slide the stage + a light sweep (CSS handles reduced-motion)
    if (els.stage) { els.stage.classList.remove('jc-anim'); void els.stage.offsetWidth; els.stage.classList.add('jc-anim'); }
    // S5 match-cut: the pebble streaks across, carrying the story between eras
    if (started && els.stage) {
      const peb = document.createElement('div');
      peb.className = 'jc-pebble-fly'; peb.setAttribute('aria-hidden', 'true');
      els.stage.appendChild(peb);
      setTimeout(() => peb.remove(), 700);
    }
    els.prevBtn.disabled = idx === 0;
    els.dots.forEach((d, k) => { d.classList.toggle('is-active', k === idx); d.classList.toggle('is-seen', k < idx); });
    setShown(els.complete, false);
    onScene && onScene(idx, scene, SCENES.length);
  }

  function begin() {
    if (started) return;
    // S4: capture the (optional) player name so characters can address them.
    if (els.nameInput) {
      const v = (els.nameInput.value || '').trim().slice(0, 16);
      if (v) { progress.name = v; saveProgress(); }
    }
    started = true;
    audio.ensure();                              // unlock WebAudio inside the gesture
    if (soundOn) audio.ambientOn(SCENES[idx].era || 'night');
    setShown(els.startOverlay, false);
    onBegin && onBegin();                         // page enters "theater mode"
    // re-render the current beat so any {name} templating shows immediately
    renderBeat(false);
    speakLine(beatsFor(SCENES[idx])[beatIdx]);   // now that audio is user-unlocked
  }

  function startOver() { show(0); begin(); }     // watch again from scene 1 (badges kept)

  // Start overlay copy reflects whether there's saved progress to resume.
  function updateStart() {
    const resuming = progress.furthest > 0;
    if (els.startText) els.startText.textContent = resuming ? ui('resumeText') : ui('startText');
    if (els.startBtn)  els.startBtn.textContent  = resuming ? ui('continueStory') : ui('begin');
    if (els.startOver) { els.startOver.textContent = ui('startOver'); setShown(els.startOver, resuming); }
  }

  function setLang(l) {
    lang = l === 'hi' ? 'hi' : 'en';
    try { localStorage.setItem('am-lang', lang); } catch {}
    narrator.stop(); vo.stop();
    if (ctx) { ctx.lang = lang; renderText(); renderBeat(false); }   // live-switch canvas labels + beat, no remount
    updateStart();
    return lang;
  }

  // S5: the badge shelf becomes a night-sky constellation — the 12 scene badges
  // are stars laid out on a lemniscate, so the earned ones connect into an ∞.
  function badgeConstellation() {
    const N = SCENES.length, W = 360, H = 150, pad = 26;
    const raw = SCENES.map((s, i) => {
      const t = ((i + 0.5) / N) * Math.PI * 2;      // avoids the origin crossing
      const d = 1 + Math.sin(t) ** 2;
      return { s, earned: progress.badges.includes(s.id),
               x: Math.cos(t) / d, y: (Math.sin(t) * Math.cos(t)) / d };
    });
    const xs = raw.map(p => p.x), ys = raw.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const sc = Math.min((W - 2 * pad) / (maxX - minX), (H - 2 * pad) / (maxY - minY));
    const offX = (W - (maxX - minX) * sc) / 2, offY = (H - (maxY - minY) * sc) / 2;
    const pts = raw.map(p => ({ ...p, px: offX + (p.x - minX) * sc, py: offY + (p.y - minY) * sc }));
    // path following the figure-8 (closed) — segment lit when both ends earned
    const lines = pts.map((p, i) => {
      const q = pts[(i + 1) % N];
      const lit = p.earned && q.earned;
      return `<line x1="${p.px.toFixed(1)}" y1="${p.py.toFixed(1)}" x2="${q.px.toFixed(1)}" y2="${q.py.toFixed(1)}" class="cc-cline ${lit ? 'lit' : ''}"/>`;
    }).join('');
    const stars = pts.map((p, i) => {
      const cls = p.earned ? 'earned' : '';
      return `<g class="cc-star ${cls}" style="--i:${i}"><title>${T(p.s, 'title')}</title>` +
             `<circle cx="${p.px.toFixed(1)}" cy="${p.py.toFixed(1)}" r="${p.earned ? 6 : 3.2}"/></g>`;
    }).join('');
    const earnedCount = pts.filter(p => p.earned).length;
    return `<svg class="cc-constellation" viewBox="0 0 ${W} ${H}" role="img" aria-label="${earnedCount} of ${N} scenes complete">
      ${lines}${stars}</svg>`;
  }

  function finish() {
    if (els.badges) els.badges.innerHTML = badgeConstellation();
    if (els.ccMascot) els.ccMascot.textContent = ui('bravo');
    if (started && soundOn) audio.chime();
    celebrate({ colors: ['var(--secondary)', 'var(--primary)'], sound: false });
    setShown(els.complete, true);
  }

  els.prevBtn.addEventListener('click', () => show(idx - 1));
  els.nextBtn.addEventListener('click', () => { if (idx < SCENES.length - 1) show(idx + 1); else finish(); });
  els.dots.forEach((d, k) => d.addEventListener('click', () => show(k)));
  if (els.soundBtn) els.soundBtn.addEventListener('click', toggleSound);
  if (els.startBtn) els.startBtn.addEventListener('click', begin);
  if (els.startOver) els.startOver.addEventListener('click', startOver);
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    if (e.key === 'ArrowRight') { if (idx < SCENES.length - 1) show(idx + 1); }
    else if (e.key === 'ArrowLeft') show(idx - 1);
  });

  updateSoundBtn();
  show(clamp(progress.furthest, 0, SCENES.length - 1));   // resume at furthest scene
  updateStart();
  return {
    show, restart: () => show(0), setLang, begin, get index() { return idx; }, get lang() { return lang; }, total: SCENES.length,
    get name() { return (progress.name && progress.name.trim()) || ''; },
    get badgeCount() { return progress.badges.length; },
    // debug hooks (only wired to window on localhost by the page)
    _ctx: () => ctx, _scene: () => SCENES[idx], _beat: () => beatIdx,
    _point: (type, x, y) => { const s = SCENES[idx]; s.pointer && s.pointer(ctx, { type, x, y }); },
    _control: (id, v) => { const s = SCENES[idx]; s.onControl && s.onControl(ctx, id, v); },
    _continue: () => advanceBeat(),
  };
}

export { SCENES };
