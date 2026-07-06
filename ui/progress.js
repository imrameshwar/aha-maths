// ui/progress.js — lesson progress stored in localStorage. No account needed.

const LS_KEY = 'am-progress';

function _load() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}

function _save(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

export function getProgress() { return _load(); }

export function markBeat(lessonId, beatIdx) {
  const p = _load();
  if (!p[lessonId]) p[lessonId] = {};
  p[lessonId].beat = Math.max(p[lessonId].beat ?? 0, beatIdx);
  p[lessonId].lastSeen = Date.now();
  _save(p);
  document.dispatchEvent(new CustomEvent('am:progress', { detail: { lessonId, beatIdx } }));
}

export function markComplete(lessonId) {
  const p = _load();
  if (!p[lessonId]) p[lessonId] = {};
  p[lessonId].completed = true;
  p[lessonId].beat = 4;
  p[lessonId].lastSeen = Date.now();
  _save(p);
  document.dispatchEvent(new CustomEvent('am:progress', { detail: { lessonId, completed: true } }));
}

export function isComplete(lessonId) { return !!_load()[lessonId]?.completed; }

export function getLastLesson() {
  const p = _load();
  const entries = Object.entries(p).filter(([, v]) => v.lastSeen);
  if (!entries.length) return null;
  return entries.sort(([, a], [, b]) => b.lastSeen - a.lastSeen)[0][0];
}

export function countCompleted(lessonIds) {
  const p = _load();
  return lessonIds.filter(id => p[id]?.completed).length;
}
