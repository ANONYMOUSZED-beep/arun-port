import { config } from "./config.js";
import { createLcd, drawScreen } from "./lcd.js";
import { renderIcons } from "./icons.js";
import { acceptsText, entriesOf, features, fromHash, reduce, screenFor, toHash } from "./navigation.js";
import { speedMs } from "./snake.js";
import { MULTI_TAP_MS } from "./t9.js";

const $ = (selector) => document.querySelector(selector);
const lcd = createLcd($("#lcd"));
const liveRegion = $("#screen-reader");
const hint = $("#hint");
const navi = $(".navi");
const powerKey = $(".power");
const phone = $("#phone");
const soundButton = $("#sound");
const motionButton = $("#motion");
const zoomButton = $("#zoom");

const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
};

let muted = storage.get("3310-sound") !== "on";
let reducedMotion = storage.get("3310-motion") === "reduced" || matchMedia("(prefers-reduced-motion: reduce)").matches;
let zoomed = false;
let presses = 0;
let snakeHi = Number(storage.get("3310-snake-hi")) || 0;
let notice = null;
let noticeTimer;
let inputTimer;
let tickTimer = null;
let audio;

const context = () => ({ now: performance.now(), config, snakeHi, rng: Math.random });
let state = fromHash(location.hash, context());
if (storage.get("3310-used") === "yes") hint.classList.add("used");

function announcement(screen) {
  const selected = screen.selected !== undefined ? `Selected: ${screen.lines[screen.selected]}. ` : "";
  const keys = screen.footer ? `Navi: ${screen.footer}. C: back.` : "Press power to turn on.";
  const lines = screen.lines.filter(Boolean).map((line) => line.replace(/[.!?]$/, ""));
  return `${screen.title}. ${screen.page ? `${screen.page}. ` : ""}${selected}${lines.join(". ")}. ${keys}`;
}

function render(announce = true) {
  const screen = notice ? { title: notice.title, lines: [notice.text], footer: "OK" } : screenFor(state, context());
  drawScreen(lcd, screen, presses);
  const label = screen.footer || (state.kind === "off" ? "Phone is off" : "Select");
  navi.setAttribute("aria-label", label);
  navi.title = `${label} / Enter`;
  powerKey.setAttribute("aria-label", state.kind === "off" ? "Power on phone" : "Power off phone");
  if (announce && screen.announce !== null) liveRegion.textContent = screen.announce ?? announcement(screen);
}

function syncControls() {
  soundButton.setAttribute("aria-pressed", String(!muted));
  soundButton.setAttribute("aria-label", muted ? "Enable sound" : "Mute sound");
  soundButton.title = muted ? "Enable sound" : "Mute sound";
  soundButton.innerHTML = `<i data-lucide="${muted ? "volume-x" : "volume-2"}"></i>`;
  motionButton.setAttribute("aria-pressed", String(reducedMotion));
  motionButton.setAttribute("aria-label", reducedMotion ? "Use system motion preference" : "Reduce motion");
  document.documentElement.classList.toggle("reduced-motion", reducedMotion);
  zoomButton.setAttribute("aria-pressed", String(zoomed));
  zoomButton.setAttribute("aria-label", zoomed ? "Restore LCD size" : "Enlarge LCD");
  zoomButton.title = zoomed ? "Restore LCD size" : "Enlarge LCD";
  zoomButton.innerHTML = `<i data-lucide="${zoomed ? "zoom-out" : "zoom-in"}"></i>`;
  renderIcons();
}

function showNotice(text, title = "Note") {
  notice = { title, text };
  clearTimeout(noticeTimer);
  render();
  noticeTimer = setTimeout(() => {
    notice = null;
    render();
  }, 1100);
}

function beep(frequency = 880, duration = 0.045) {
  if (muted) return;
  try {
    audio ??= new AudioContext();
    audio.resume().catch(() => {});
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.025, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration + 0.005);
  } catch {
    muted = true;
    syncControls();
  }
}

async function sendMessage({ endpoint, body, from }) {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ email: from, message: body, _subject: "New message from your Nokia portfolio" }),
    });
    internal(response.ok ? "@sent" : "@failed");
  } catch {
    internal("@failed");
  }
}

/** Runs and clears a side effect requested by a reducer. */
function runEffect() {
  const { effect } = state;
  if (!effect) return;
  delete state.effect;
  switch (effect.type) {
    case "notice":
      showNotice(effect.text);
      break;
    case "navigate":
      state = fromHash(effect.hash, context());
      break;
    case "copy-open":
      navigator.clipboard?.writeText(effect.text).catch(() => {});
      window.open(effect.url, "_blank", "noopener,noreferrer");
      break;
    case "mailto":
      location.href = `mailto:${effect.to}?subject=${encodeURIComponent("Hello from your portfolio")}&body=${encodeURIComponent(effect.body)}`;
      break;
    case "send":
      sendMessage(effect);
      break;
    case "save-hi":
      snakeHi = effect.value;
      storage.set("3310-snake-hi", String(effect.value));
      break;
  }
}

const isPlaying = () => state.kind === "app" && state.app === "snake" && state.step === "play";

function syncTicker() {
  if (isPlaying() && tickTimer === null) {
    tickTimer = setTimeout(() => {
      tickTimer = null;
      internal("@tick");
      if (state.game?.ate) beep(1320, 0.06);
      syncTicker();
    }, speedMs(state.game));
  } else if (!isPlaying() && tickTimer !== null) {
    clearTimeout(tickTimer);
    tickTimer = null;
  }
}

/** Events that do not come from a key press (timers, network results). */
function internal(event) {
  state = reduce(state, event, context());
  runEffect();
  render(event !== "@tick");
  syncTicker();
}

function press(key) {
  if (key === "zoom") {
    zoomed = !zoomed;
    phone.classList.toggle("lcd-zoomed", zoomed);
    syncControls();
    return;
  }
  if (key === "sound") {
    muted = !muted;
    storage.set("3310-sound", muted ? "off" : "on");
    syncControls();
    beep();
    showNotice(muted ? "Sound off" : "Sound on", "Settings");
    return;
  }
  if (key === "motion" && !acceptsText(state)) {
    reducedMotion = !reducedMotion;
    storage.set("3310-motion", reducedMotion ? "reduced" : "system");
    syncControls();
    showNotice(reducedMotion ? "Motion reduced" : "System motion", "Settings");
    return;
  }
  notice = null;
  clearTimeout(noticeTimer);
  beep();
  if (state.kind === "confirm" && key === "select") {
    const { url } = screenEntry();
    const href = url ? new URL(url, location.href).href : null;
    if (href) window.open(href, "_blank", "noopener,noreferrer");
    state = reduce(state, "back");
  } else {
    state = reduce(state, key, context());
  }
  runEffect();
  const hash = toHash(state);
  if (hash !== location.hash) {
    if (key === "up" || key === "down") history.replaceState(null, "", hash);
    else history.pushState(null, "", hash);
  }
  presses++;
  hint.classList.add("used");
  storage.set("3310-used", "yes");
  render(!isPlaying());
  syncTicker();
  if (acceptsText(state)) {
    clearTimeout(inputTimer);
    inputTimer = setTimeout(() => render(false), MULTI_TAP_MS + 30);
  }
}

/** Entry shown by the current section-based state, if any. */
function screenEntry() {
  return state.section !== undefined ? (entriesOf(state.section)[state.entry] ?? {}) : {};
}

function pressPhysical(key) {
  const button = document.querySelector(`[data-key="${key}"]`);
  const handset = document.querySelector(".handset");
  if (button && key !== "power") {
    const b = button.getBoundingClientRect();
    const h = handset.getBoundingClientRect();
    button.style.backgroundImage = `url(${handset.src})`;
    button.style.backgroundSize = `${h.width}px ${h.height}px`;
    button.style.backgroundPosition = `${h.left - b.left}px ${h.top - b.top}px`;
  }
  button?.classList.add("pressed");
  setTimeout(() => {
    button?.classList.remove("pressed");
    if (button) button.style.backgroundImage = "";
  }, 120);
  press(key);
}

for (const button of document.querySelectorAll("[data-key]")) button.addEventListener("click", () => pressPhysical(button.dataset.key));
zoomButton.addEventListener("click", () => press("zoom"));
soundButton.addEventListener("click", () => press("sound"));
motionButton.addEventListener("click", () => press("motion"));
$("#help").addEventListener("click", () => press("digit8"));

const KEYMAP = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  Enter: "select",
  Escape: "escape",
  Backspace: "back",
  Home: "home",
  "*": "sound",
  "#": "motion",
};

window.addEventListener("keydown", (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const target = event.target;
  if (target.closest("input,textarea,select,[contenteditable=true]")) return;
  if (event.key === "Enter" && target.closest("[data-key]")) {
    event.preventDefault();
    pressPhysical("select");
    return;
  }
  // While typing, printable keys (including space on a focused phone key) go to the text.
  if (acceptsText(state) && event.key.length === 1 && (!target.closest("button,a") || target.closest("[data-key]"))) {
    event.preventDefault();
    press(`char:${event.key}`);
    return;
  }
  if ((event.key === "Enter" || event.key === " ") && target.closest("button,a")) return;
  let key = KEYMAP[event.key] || (/^[0-9]$/.test(event.key) ? `digit${event.key}` : undefined);
  if ((key === "left" || key === "right") && state.kind !== "app") key = undefined;
  if (!key) return;
  event.preventDefault();
  pressPhysical(key);
});

// Space activates a focused button on keyup, so block that too while typing.
window.addEventListener("keyup", (event) => {
  if (event.key === " " && acceptsText(state) && event.target.closest("[data-key]")) event.preventDefault();
});

function syncFromLocation() {
  notice = null;
  state = fromHash(location.hash, context());
  render();
  syncTicker();
}
window.addEventListener("hashchange", syncFromLocation);
window.addEventListener("popstate", syncFromLocation);

document.addEventListener("visibilitychange", () => {
  if (document.hidden && isPlaying()) internal("@pause");
});

// Quick-view links drive the phone; on small screens bring it into view.
for (const link of document.querySelectorAll("[data-phone-link]"))
  link.addEventListener("click", () => {
    if (matchMedia("(max-width: 650px)").matches) phone.scrollIntoView({ block: "center", behavior: reducedMotion ? "auto" : "smooth" });
  });

// Resume links stay hidden until config.resumePath is set.
if (features.resume)
  for (const link of document.querySelectorAll("[data-resume]")) {
    link.href = config.resumePath;
    link.hidden = false;
  }

setInterval(() => {
  if (state.kind === "home") render(false);
}, 30000);

syncControls();
render();
syncTicker();
