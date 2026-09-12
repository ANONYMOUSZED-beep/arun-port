import './style.css';
import { createIcons, VolumeX, Volume2, Accessibility, CircleHelp, AlignLeft, ZoomIn, ZoomOut } from 'lucide';
import { sections } from './content';
import { draw, type Display } from './lcd';
import { reduce, fromHash, toHash, entryPages, projectTopics, safeUrl, type Screen, type Action } from './model';

const canvas = document.querySelector<HTMLCanvasElement>('#lcd')!;
const announcement = document.querySelector<HTMLElement>('#screen-reader')!;
const hint = document.querySelector<HTMLElement>('#hint')!;
const navi = document.querySelector<HTMLButtonElement>('.navi')!;
const soundButton = document.querySelector<HTMLButtonElement>('#sound')!;
const motionButton = document.querySelector<HTMLButtonElement>('#motion')!;
const powerButton = document.querySelector<HTMLButtonElement>('.power')!;
const zoomButton = document.querySelector<HTMLButtonElement>('#zoom')!;
let zoomed = false;
function readPreference(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function savePreference(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* Preferences remain usable without storage. */ }
}
let state: Screen = fromHash(location.hash);
let muted = readPreference('3310-sound') !== 'on';
let reduced = readPreference('3310-motion') === 'reduced' || matchMedia('(prefers-reduced-motion: reduce)').matches;
let progress = 0;
let audio: AudioContext | undefined;
let toast = '';
let toastTimer: ReturnType<typeof setTimeout>;
if (readPreference('3310-used') === 'yes') hint.classList.add('used');

function displayFor(screen: Screen): Display {
  if (toast) return { title: 'Settings', lines: [toast], footer: 'OK' };
  if (screen.kind === 'off') return { title: 'Phone off', lines: [], footer: '', off: true };
  if (screen.kind === 'home') return { title: 'Arunesh Waran', lines: ['AI, ML & Web Application Developer'], footer: 'Menu', home: true };
  if (screen.kind === 'menu' || screen.kind === 'section') {
    const items = screen.kind === 'menu' ? sections.map((s, i) => `${i + 1} ${s.title}`) : sections[screen.section].entries.map(e => e.shortTitle);
    const start = Math.max(0, Math.min(screen.selected - 1, items.length - 4));
    return { title: screen.kind === 'menu' ? 'Portfolio' : sections[screen.section].title, lines: items.slice(start, start + 4), selected: screen.selected - start, footer: 'Select', page: `${screen.selected + 1}/${items.length}` };
  }
  const entry = sections[screen.section].entries[screen.entry];
  if (screen.kind === 'project') {
    const topics = projectTopics(entry);
    const start = Math.max(0, Math.min(screen.selected - 1, topics.length - 4));
    return { title: entry.shortTitle, lines: topics.slice(start, start + 4).map(t => t.title), selected: screen.selected - start, footer: 'Select', page: `${screen.selected + 1}/${topics.length}` };
  }
  if (screen.kind === 'confirm') return { title: 'Open link?', lines: [entry.topics ? 'GitHub repository' : 'Public profile', 'in a new tab?', entry.shortTitle, 'C to cancel'], footer: 'Open' };
  const pages = entryPages(entry, screen.topic);
  const title = screen.topic !== undefined ? projectTopics(entry)[screen.topic].title : entry.shortTitle;
  return { title: title.slice(0, 12), lines: pages[screen.page], footer: screen.page < pages.length - 1 ? 'Next' : screen.topic === undefined && safeUrl(entry.url) ? 'Visit' : 'Done', page: `${screen.page + 1}/${pages.length}` };
}
function render(announce = true): void {
  const display = displayFor(state);
  draw(canvas, display, progress);
  navi.setAttribute('aria-label', display.footer || 'Phone is off');
  navi.title = `${display.footer || 'Phone is off'} / Enter`;
  powerButton.setAttribute('aria-label', state.kind === 'off' ? 'Power on phone' : 'Power off phone');
  if (announce) {
    const selected = display.selected !== undefined ? `Selected: ${display.lines[display.selected]}. ` : '';
    announcement.textContent = `${display.title}. ${display.page ? `${display.page}. ` : ''}${selected}${display.lines.join('. ')}. ${display.footer ? `Navi: ${display.footer}. C: back.` : 'Press power to turn on.'}`;
  }
}
function preferences(): void {
  soundButton.setAttribute('aria-pressed', String(!muted));
  soundButton.setAttribute('aria-label', muted ? 'Enable sound' : 'Mute sound');
  soundButton.title = muted ? 'Enable sound' : 'Mute sound';
  soundButton.innerHTML = `<i data-lucide="${muted ? 'volume-x' : 'volume-2'}"></i>`;
  motionButton.setAttribute('aria-pressed', String(reduced));
  motionButton.setAttribute('aria-label', reduced ? 'Use system motion preference' : 'Reduce motion');
  document.documentElement.classList.toggle('reduced-motion', reduced);
  zoomButton.setAttribute('aria-pressed', String(zoomed));
  zoomButton.setAttribute('aria-label', zoomed ? 'Restore LCD size' : 'Enlarge LCD');
  zoomButton.title = zoomed ? 'Restore LCD size' : 'Enlarge LCD';
  zoomButton.innerHTML = `<i data-lucide="${zoomed ? 'zoom-out' : 'zoom-in'}"></i>`;
  createIcons({ icons: { VolumeX, Volume2, Accessibility, CircleHelp, AlignLeft, ZoomIn, ZoomOut } });
}
function notify(message: string): void {
  toast = message;
  clearTimeout(toastTimer);
  render();
  toastTimer = setTimeout(() => { toast = ''; render(); }, 1100);
}
function tone(): void {
  if (muted) return;
  try {
    audio ??= new AudioContext();
    void audio.resume().catch(() => undefined);
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.025, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.045);
    oscillator.connect(gain); gain.connect(audio.destination);
    oscillator.start(); oscillator.stop(audio.currentTime + 0.05);
  } catch { muted = true; preferences(); }
}
function dispatch(key: string): void {
  if (key === 'zoom') {
    zoomed = !zoomed;
    document.querySelector('#phone')!.classList.toggle('lcd-zoomed', zoomed);
    preferences();
    return;
  }
  if (key === 'sound') {
    muted = !muted; savePreference('3310-sound', muted ? 'off' : 'on'); preferences();
    tone(); notify(muted ? 'Sound off' : 'Sound on'); return;
  }
  if (key === 'motion') {
    reduced = !reduced; savePreference('3310-motion', reduced ? 'reduced' : 'system'); preferences();
    notify(reduced ? 'Motion reduced' : 'System motion'); return;
  }
  toast = ''; clearTimeout(toastTimer); tone();
  if (state.kind === 'confirm' && key === 'select') {
    const url = safeUrl(sections[state.section].entries[state.entry].url);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    state = reduce(state, 'back');
  } else state = reduce(state, key as Action);
  const hash = toHash(state);
  if (hash !== location.hash) {
    if (key === 'up' || key === 'down') history.replaceState(null, '', hash);
    else history.pushState(null, '', hash);
  }
  progress++;
  hint.classList.add('used'); savePreference('3310-used', 'yes');
  render();
}
function press(key: string): void {
  const button = document.querySelector<HTMLButtonElement>(`[data-key="${key}"]`);
  const face = document.querySelector<HTMLImageElement>('.handset')!;
  if (button && key !== 'power') {
    const bounds = button.getBoundingClientRect();
    const image = face.getBoundingClientRect();
    button.style.backgroundImage = `url(${face.src})`;
    button.style.backgroundSize = `${image.width}px ${image.height}px`;
    button.style.backgroundPosition = `${image.left - bounds.left}px ${image.top - bounds.top}px`;
  }
  button?.classList.add('pressed');
  setTimeout(() => { button?.classList.remove('pressed'); if (button) button.style.backgroundImage = ''; }, 120);
  dispatch(key);
}
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-key]')) button.addEventListener('click', () => press(button.dataset.key!));
zoomButton.addEventListener('click', () => dispatch('zoom'));
soundButton.addEventListener('click', () => dispatch('sound'));
motionButton.addEventListener('click', () => dispatch('motion'));
document.querySelector('#help')!.addEventListener('click', () => dispatch('digit8'));
window.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const target = event.target as HTMLElement;
  if (target.closest('input,textarea,select,[contenteditable=true]')) return;
  // Enter selects the LCD item even after clicking a numeric shortcut; Space activates the focused key.
  if (event.key === 'Enter' && target.closest('[data-key]')) { event.preventDefault(); press('select'); return; }
  if ((event.key === 'Enter' || event.key === ' ') && target.closest('button,a')) return;
  const keys: Record<string, string> = { ArrowUp: 'up', ArrowDown: 'down', Enter: 'select', Escape: 'back', Backspace: 'back', Home: 'home', '*': 'sound', '#': 'motion' };
  const key = keys[event.key] || (/^[0-9]$/.test(event.key) ? `digit${event.key}` : undefined);
  if (key) { event.preventDefault(); press(key); }
});
window.addEventListener('hashchange', () => { toast = ''; state = fromHash(location.hash); render(); });
window.addEventListener('popstate', () => { toast = ''; state = fromHash(location.hash); render(); });
setInterval(() => { if (state.kind === 'home') render(false); }, 30000);
preferences(); render();
