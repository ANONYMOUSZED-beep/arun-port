/**
 * Phone navigation as a pure state machine.
 * States: off, home, menu, section, project, detail, confirm, app.
 */
import { config } from "./config.js";
import { sections } from "./content.js";
import { apps } from "./apps.js";
import { wrapWords, LINES_PER_PAGE } from "./text.js";

export const features = { resume: Boolean(config.resumePath) };
const HOME = { kind: "home" };
const EXTRAS = sections.findIndex((s) => s.id === "extras");

export function entriesOf(section) {
  return sections[section].entries.filter((entry) => !entry.requires || features[entry.requires]);
}

export function safeUrl(url) {
  if (!url) return null;
  const base = globalThis.location?.href ?? "https://localhost/";
  try {
    const parsed = new URL(url, base);
    const sameOrigin = parsed.origin === new URL(base).origin;
    return (parsed.protocol === "https:" || sameOrigin) && !parsed.username && !parsed.password ? parsed.href : null;
  } catch {
    return null;
  }
}

export function projectTopics(entry) {
  return [
    ...(entry.topics ?? []),
    ...(entry.tools ? [{ title: "Tools", paragraphs: [entry.tools.join(", ")] }] : []),
    { title: "Full details", paragraphs: [entry.title, ...entry.paragraphs] },
    ...(safeUrl(entry.url) ? [{ title: "View source", paragraphs: [], link: true }] : []),
  ];
}

export function detailPages(entry, topic) {
  const paragraphs =
    topic !== undefined && entry.topics
      ? projectTopics(entry)[topic].paragraphs
      : [entry.title, ...entry.paragraphs, ...(entry.tools ? [`Tools: ${entry.tools.join(", ")}`] : [])];
  return paragraphs.flatMap((p) => wrapWords(p));
}

function appOrigin(name) {
  for (let section = 0; section < sections.length; section++) {
    const selected = entriesOf(section).findIndex((entry) => entry.app === name);
    if (selected >= 0) return { section, selected };
  }
  return { section: 0, selected: 0 };
}

export function openApp(name, ctx = {}, from = appOrigin(name)) {
  return apps[name] ? apps[name].init(from, ctx) : HOME;
}

export function acceptsText(state) {
  return state.kind === "app" && Boolean(apps[state.app].acceptsText(state));
}

function back(s) {
  switch (s.kind) {
    case "menu":
      return HOME;
    case "section":
      return { kind: "menu", selected: s.section };
    case "project":
      return { kind: "section", section: s.section, selected: s.entry };
    case "detail":
    case "confirm":
      if (s.topic !== undefined) return { kind: "project", section: s.section, entry: s.entry, selected: s.topic };
      return s.kind === "confirm" ? { ...s, kind: "detail" } : { kind: "section", section: s.section, selected: s.entry };
    case "app":
      return { kind: "section", section: s.from.section, selected: s.from.selected };
    default:
      return s;
  }
}

export function reduce(s, key, ctx = {}) {
  if (key === "power") return s.kind === "off" ? HOME : { kind: "off" };
  if (s.kind === "off") return s;
  if (s.kind === "app") {
    const next = apps[s.app].reduce(s, key, ctx);
    if (next !== undefined) return next;
  }
  if (key === "home" || key === "digit0") return HOME;
  if (key.startsWith("digit")) {
    const n = Number(key.slice(5));
    if (n >= 1 && n <= sections.length) return { kind: "section", section: n - 1, selected: 0 };
    if (n === 8 || n === 9) {
      const id = n === 8 ? "help" : "info";
      return { kind: "detail", section: EXTRAS, entry: entriesOf(EXTRAS).findIndex((e) => e.id === id), page: 0 };
    }
    return s;
  }
  if (key === "back" || key === "escape") return back(s);
  if (key !== "up" && key !== "down" && key !== "select") return s;

  const delta = key === "up" ? -1 : 1;
  const cycle = (index, length) => (index + delta + length) % length;
  switch (s.kind) {
    case "home":
      return { kind: "menu", selected: key === "up" ? sections.length - 1 : 0 };
    case "menu":
      return key === "select" ? { kind: "section", section: s.selected, selected: 0 } : { ...s, selected: cycle(s.selected, sections.length) };
    case "section": {
      const entries = entriesOf(s.section);
      if (key !== "select") return { ...s, selected: cycle(s.selected, entries.length) };
      const entry = entries[s.selected];
      if (entry.app) return openApp(entry.app, ctx, { section: s.section, selected: s.selected });
      if (entry.topics) return { kind: "project", section: s.section, entry: s.selected, selected: 0 };
      return { kind: "detail", section: s.section, entry: s.selected, page: 0 };
    }
    case "project": {
      const topics = projectTopics(entriesOf(s.section)[s.entry]);
      if (key !== "select") return { ...s, selected: cycle(s.selected, topics.length) };
      return { kind: topics[s.selected].link ? "confirm" : "detail", section: s.section, entry: s.entry, page: 0, topic: s.selected };
    }
    case "detail": {
      const entry = entriesOf(s.section)[s.entry];
      const last = detailPages(entry, s.topic).length - 1;
      if (key === "select" && s.page === last) return s.topic === undefined && safeUrl(entry.url) ? { ...s, kind: "confirm" } : back(s);
      return { ...s, page: Math.max(0, Math.min(last, s.page + delta)) };
    }
    default:
      return s;
  }
}

/* ---------- URL hash routing ---------- */
export function toHash(s) {
  if (s.kind === "home" || s.kind === "off") return `#${s.kind}`;
  if (s.kind === "menu") return `#menu/${s.selected}`;
  if (s.kind === "app") return `#app/${s.app}`;
  const section = sections[s.section];
  const entry = entriesOf(s.section)[s.entry];
  if (s.kind === "section") return `#${section.id}/${s.selected}`;
  if (s.kind === "project") return `#${section.id}/${entry.id}/topics/${s.selected}`;
  return `#${section.id}/${entry.id}/${s.page}${s.topic !== undefined ? `/topic-${s.topic}` : ""}${s.kind === "confirm" ? "/confirm" : ""}`;
}

function clampIndex(value, max) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(0, Math.floor(n))) : 0;
}

export function fromHash(hash, ctx = {}) {
  const [first, second, third, fourth, fifth] = hash.replace(/^#/, "").split("/");
  if (first === "off") return { kind: "off" };
  if (first === "menu") return { kind: "menu", selected: clampIndex(second, sections.length - 1) };
  if (first === "app") return openApp(second, ctx);
  const section = sections.findIndex((s) => s.id === first);
  if (section < 0) return HOME;
  const entries = entriesOf(section);
  const entryIndex = entries.findIndex((e) => e.id === second);
  if (entryIndex < 0) return { kind: "section", section, selected: clampIndex(second, entries.length - 1) };
  const entry = entries[entryIndex];
  if (entry.app) return openApp(entry.app, ctx, { section, selected: entryIndex });
  const topics = projectTopics(entry);
  if (third === "topics" && entry.topics) return { kind: "project", section, entry: entryIndex, selected: clampIndex(fourth, topics.length - 1) };
  const topic = fourth?.startsWith("topic-") && entry.topics ? clampIndex(fourth.slice(6), topics.length - 1) : undefined;
  const confirm = fourth === "confirm" || fifth === "confirm";
  if (topic !== undefined && topics[topic].link) return { kind: "confirm", section, entry: entryIndex, page: 0, topic };
  return {
    kind: confirm && safeUrl(entry.url) ? "confirm" : "detail",
    section,
    entry: entryIndex,
    page: clampIndex(third, detailPages(entry, topic).length - 1),
    ...(topic !== undefined ? { topic } : {}),
  };
}

/* ---------- Screens ---------- */
function listScreen(title, items, selected) {
  const start = Math.max(0, Math.min(selected - 1, items.length - LINES_PER_PAGE));
  return { title, lines: items.slice(start, start + LINES_PER_PAGE), selected: selected - start, footer: "Select", page: `${selected + 1}/${items.length}` };
}

export function screenFor(s, ctx = {}) {
  if (s.kind === "off") return { title: "Phone off", lines: [], off: true };
  if (s.kind === "home") return { title: "Arunesh Waran", lines: ["AI, ML & Web Application Developer"], footer: "Menu", home: true };
  if (s.kind === "app") return apps[s.app].screen(s, ctx);
  if (s.kind === "menu") return listScreen("Portfolio", sections.map((section, i) => `${i + 1} ${section.title}`), s.selected);
  if (s.kind === "section") return listScreen(sections[s.section].title, entriesOf(s.section).map((e) => e.shortTitle), s.selected);
  const entry = entriesOf(s.section)[s.entry];
  if (s.kind === "project") return { ...listScreen(entry.shortTitle, projectTopics(entry).map((t) => t.title), s.selected) };
  if (s.kind === "confirm")
    return { title: "Open link?", lines: [entry.linkLabel ?? (entry.topics ? "GitHub repository" : "Public profile"), "in a new tab?", entry.shortTitle, "C to cancel"], footer: "Open" };
  const pages = detailPages(entry, s.topic);
  return {
    title: (s.topic !== undefined ? projectTopics(entry)[s.topic].title : entry.shortTitle).slice(0, 12),
    lines: pages[s.page],
    footer: s.page < pages.length - 1 ? "Next" : s.topic === undefined && safeUrl(entry.url) ? "Visit" : "Done",
    page: `${s.page + 1}/${pages.length}`,
  };
}
