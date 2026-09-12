import { sections, type Entry } from './content';
export type Screen =
  | { kind: 'home' } | { kind: 'off' }
  | { kind: 'menu'; selected: number }
  | { kind: 'section'; section: number; selected: number }
  | { kind: 'project'; section: number; entry: number; selected: number }
  | { kind: 'detail'; section: number; entry: number; page: number; topic?: number }
  | { kind: 'confirm'; section: number; entry: number; page: number; topic?: number };
export type Action = 'up' | 'down' | 'select' | 'back' | 'home' | 'power' | `digit${number}`;
export function paginate(text: string, width = 19, rows = 4): string[][] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[] = [];
  let line = '';
  for (let word of words) {
    if (line && line.length + word.length + 1 > width) { lines.push(line); line = ''; }
    while (word.length > width) { lines.push(word.slice(0, width)); word = word.slice(width); }
    if (!word) continue;
    line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += rows) pages.push(lines.slice(i, i + rows));
  return pages.length ? pages : [['']];
}
export function projectTopics(entry: Entry): { title: string; paragraphs: string[]; link?: boolean }[] {
  return [...(entry.topics ?? []),
    ...(entry.tools ? [{ title: 'Tools', paragraphs: [entry.tools.join(', ')] }] : []),
    { title: 'Full details', paragraphs: [entry.title, ...entry.paragraphs] },
    ...(safeUrl(entry.url) ? [{ title: 'View source', paragraphs: [], link: true }] : [])];
}
export function entryPages(entry: Entry, topic?: number): string[][] {
  if (topic !== undefined && entry.topics) return projectTopics(entry)[topic].paragraphs.flatMap(text => paginate(text));
  return [entry.title, ...entry.paragraphs, ...(entry.tools ? [`Tools: ${entry.tools.join(', ')}`] : [])].flatMap(text => paginate(text));
}
export function safeUrl(value: string | undefined): string | null {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function reduce(state: Screen, action: Action): Screen {
  if (action === 'power') return state.kind === 'off' ? { kind: 'home' } : { kind: 'off' };
  if (state.kind === 'off') return state;
  if (action === 'home' || action === 'digit0') return { kind: 'home' };
  if (action.startsWith('digit')) {
    const n = Number(action.slice(5));
    if (n >= 1 && n <= sections.length) return { kind: 'section', section: n - 1, selected: 0 };
    if (n === 8 || n === 9) return { kind: 'detail', section: 6, entry: n - 8, page: 0 };
    return state;
  }
  if (action === 'back') {
    switch (state.kind) {
      case 'home': return state;
      case 'menu': return { kind: 'home' };
      case 'section': return { kind: 'menu', selected: state.section };
      case 'project': return { kind: 'section', section: state.section, selected: state.entry };
      case 'detail': return state.topic !== undefined ? { kind: 'project', section: state.section, entry: state.entry, selected: state.topic } : { kind: 'section', section: state.section, selected: state.entry };
      case 'confirm': return state.topic !== undefined ? { kind: 'project', section: state.section, entry: state.entry, selected: state.topic } : { ...state, kind: 'detail' };
    }
  }
  const direction = action === 'up' ? -1 : 1;
  switch (state.kind) {
    case 'home': return { kind: 'menu', selected: action === 'up' ? sections.length - 1 : 0 };
    case 'menu': return action === 'select'
      ? { kind: 'section', section: state.selected, selected: 0 }
      : { ...state, selected: (state.selected + direction + sections.length) % sections.length };
    case 'section': return action === 'select'
      ? sections[state.section].entries[state.selected].topics
        ? { kind: 'project', section: state.section, entry: state.selected, selected: 0 }
        : { kind: 'detail', section: state.section, entry: state.selected, page: 0 }
      : { ...state, selected: (state.selected + direction + sections[state.section].entries.length) % sections[state.section].entries.length };
    case 'project': {
      const topics = projectTopics(sections[state.section].entries[state.entry]);
      if (action === 'select') return { kind: topics[state.selected].link ? 'confirm' : 'detail', section: state.section, entry: state.entry, page: 0, topic: state.selected };
      return { ...state, selected: (state.selected + direction + topics.length) % topics.length };
    }
    case 'detail': {
      const entry = sections[state.section].entries[state.entry];
      const last = entryPages(entry, state.topic).length - 1;
      if (action === 'select' && state.page === last) return state.topic === undefined && safeUrl(entry.url) ? { ...state, kind: 'confirm' } : reduce(state, 'back');
      return { ...state, page: Math.max(0, Math.min(last, state.page + direction)) };
    }
    case 'confirm': return state;
  }
}
export function toHash(state: Screen): string {
  if (state.kind === 'home' || state.kind === 'off') return `#${state.kind}`;
  if (state.kind === 'menu') return `#menu/${state.selected}`;
  const section = sections[state.section];
  if (state.kind === 'section') return `#${section.id}/${state.selected}`;
  if (state.kind === 'project') return `#${section.id}/${section.entries[state.entry].id}/topics/${state.selected}`;
  return `#${section.id}/${section.entries[state.entry].id}/${state.page}${state.topic !== undefined ? `/topic-${state.topic}` : ''}${state.kind === 'confirm' ? '/confirm' : ''}`;
}
export function fromHash(hash: string): Screen {
  const [id, entry, page, segment, last] = hash.replace(/^#/, '').split('/');
  if (id === 'off') return { kind: 'off' };
  if (id === 'menu') return { kind: 'menu', selected: clampNumber(entry, sections.length - 1) };
  const si = sections.findIndex(section => section.id === id);
  if (si < 0) return { kind: 'home' };
  const ei = sections[si].entries.findIndex(item => item.id === entry);
  if (ei < 0) return { kind: 'section', section: si, selected: clampNumber(entry, sections[si].entries.length - 1) };
  const item = sections[si].entries[ei];
  const topics = projectTopics(item);
  if (page === 'topics' && item.topics) return { kind: 'project', section: si, entry: ei, selected: clampNumber(segment, topics.length - 1) };
  const topic = segment?.startsWith('topic-') && item.topics ? clampNumber(segment.slice(6), topics.length - 1) : undefined;
  const confirm = segment === 'confirm' || last === 'confirm';
  if (topic !== undefined && topics[topic].link) return { kind: 'confirm', section: si, entry: ei, page: 0, topic };
  return { kind: confirm && safeUrl(item.url) ? 'confirm' : 'detail', section: si, entry: ei, page: clampNumber(page, entryPages(item, topic).length - 1), ...(topic !== undefined ? { topic } : {}) };
}
function clampNumber(value: string | undefined, max: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(0, Math.floor(n))) : 0;
}
