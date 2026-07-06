// story/vo.js — recorded / neural voice-over playback for the Story of Numbers (S3).
//
// The engine asks for a per-beat clip; if the file exists it plays and we return
// true, otherwise we return false and the caller falls back to the browser TTS
// narrator. So VO can land INCREMENTALLY — drop an mp3 at the expected path and
// it starts playing, no code change. Files are named by scene + beat + language:
//   assets/vo/numbers/<sceneId>-<beatIdx>-<lang>.mp3
//
// (Neural-TTS generation of these files needs the account's API key/budget — the
// pipeline is ready, the audio bytes are the only missing piece.)

export function createVO(base = 'assets/vo/numbers') {
  const missing = new Set();   // remember 404s so we don't refetch them
  let cur = null;

  const key = (id, i, lang) => `${id}-${i}-${lang}`;
  const url = (id, i, lang) => `${base}/${key(id, i, lang)}.mp3`;

  function stop() {
    if (cur) { try { cur.pause(); cur.src = ''; } catch {} cur = null; }
  }

  // Returns a Promise<boolean>: true if a clip played, false → caller uses TTS.
  function play(id, i, lang, { onEnd } = {}) {
    stop();
    const k = key(id, i, lang);
    if (missing.has(k)) return Promise.resolve(false);
    return new Promise((resolve) => {
      const a = new Audio();
      cur = a;
      let settled = false;
      const done = (ok) => { if (!settled) { settled = true; resolve(ok); } };
      a.preload = 'auto';
      a.oncanplaythrough = () => { a.play().then(() => done(true)).catch(() => { done(false); }); };
      a.onended = () => { if (cur === a) cur = null; onEnd && onEnd(); };
      a.onerror = () => { missing.add(k); if (cur === a) cur = null; done(false); };
      a.src = url(id, i, lang);
      a.load();
      // Safety: if neither event fires quickly, treat as missing (fall back to TTS).
      setTimeout(() => done(false), 1500);
    });
  }

  return { play, stop, get playing() { return !!cur; } };
}
