import { describe, expect, it } from 'vitest';
import { sections, missingInformation } from '../src/content';
import { reduce, paginate, entryPages, projectTopics, fromHash, toHash, safeUrl, type Screen } from '../src/model';
import { textPage } from '../src/text';

describe('portfolio navigation', () => {
  it('opens every major section in two controls and returns predictably', () => {
    sections.forEach((section, index) => {
      let state = reduce({ kind: 'home' }, `digit${index + 1}`);
      expect(state).toEqual({ kind: 'section', section: index, selected: 0 });
      state = reduce(state, 'select');
      expect(state).toEqual(section.entries[0].topics ? { kind: 'project', section: index, entry: 0, selected: 0 } : { kind: 'detail', section: index, entry: 0, page: 0 });
      expect(reduce(state, 'back')).toEqual({ kind: 'section', section: index, selected: 0 });
      section.entries.forEach((_entry, ei) => {
        const screen: Screen = { kind: 'detail', section: index, entry: ei, page: 0 };
        expect(fromHash(toHash(screen))).toEqual(screen);
      });
    });
  });
  it('wraps lists, clamps pages, and exposes every detail', () => {
    expect(reduce({ kind: 'menu', selected: 0 }, 'up')).toEqual({ kind: 'menu', selected: sections.length - 1 });
    sections.forEach((section, si) => section.entries.forEach((entry, ei) => {
      const pages = entryPages(entry);
      let state: Screen = { kind: 'detail', section: si, entry: ei, page: 0 };
      expect(reduce(state, 'up')).toEqual(state);
      for (let p = 1; p < pages.length; p++) {
        state = reduce(state, 'select');
        expect(state).toEqual({ kind: 'detail', section: si, entry: ei, page: p });
        expect(fromHash(toHash(state))).toEqual(state);
      }
      const next = reduce(state, 'select');
      expect(next.kind).toBe(entry.url ? 'confirm' : 'section');
      if (next.kind === 'confirm') expect(reduce(next, 'back')).toEqual(state);
    }));
  });
  it('supports home, help, credits and power without trapping navigation', () => {
    expect(reduce({ kind: 'home' }, 'digit8')).toEqual({ kind: 'detail', section: 6, entry: 0, page: 0 });
    expect(reduce({ kind: 'home' }, 'digit9')).toEqual({ kind: 'detail', section: 6, entry: 1, page: 0 });
    expect(reduce({ kind: 'menu', selected: 4 }, 'digit0')).toEqual({ kind: 'home' });
    const off = reduce({ kind: 'home' }, 'power');
    expect(off.kind).toBe('off');
    expect(reduce(off, 'select')).toEqual(off);
    expect(reduce(off, 'power')).toEqual({ kind: 'home' });
  });
  it('sanitizes malformed or out-of-range deep links', () => {
    expect(fromHash('#unknown')).toEqual({ kind: 'home' });
    expect(fromHash('#menu/999')).toEqual({ kind: 'menu', selected: 6 });
    expect(fromHash('#projects/ai-assistant/-20')).toEqual({ kind: 'detail', section: 1, entry: 0, page: 0 });
    expect(fromHash('#projects/ai-assistant/Infinity').kind).toBe('detail');
    expect(fromHash('#about/profile/0/confirm').kind).toBe('detail');
  });
});
describe('project topic navigation', () => {
  it('round trips all topics and returns to the selected topic', () => {
    sections[1].entries.forEach((entry, ei) => projectTopics(entry).forEach((topic, ti) => {
      const menu: Screen = { kind: 'project', section: 1, entry: ei, selected: ti };
      expect(fromHash(toHash(menu))).toEqual(menu);
      let state = reduce(menu, 'select');
      expect(state.kind).toBe(topic.link ? 'confirm' : 'detail');
      expect(fromHash(toHash(state))).toEqual(state);
      expect(reduce(state, 'back')).toEqual(menu);
      if (!topic.link) {
        const pages = entryPages(entry, ti);
        pages.flat().forEach(line => expect(line.length).toBeLessThanOrEqual(19));
        for (let page = 1; page < pages.length; page++) state = reduce(state, 'select');
        expect(reduce(state, 'select')).toEqual(menu);
      }
    }));
  });
  it('publishes only the three verified public repositories', () => {
    expect(sections[1].entries.map(e => safeUrl(e.url))).toEqual([
      'https://github.com/ANONYMOUSZED-beep/ai-dev-assistant',
      'https://github.com/ANONYMOUSZED-beep/ReplayGuard',
      'https://github.com/ANONYMOUSZED-beep/aerial-vehicle-detection'
    ]);
    const html = textPage();
    sections[1].entries.forEach(e => expect(html).toContain(e.url));
    expect(html).not.toContain('vercel.app');
  });
});
describe('LCD content and security', () => {
  it('fits all resume text within four 19-character rows', () => {
    sections.flatMap(s => s.entries).forEach(entry => entryPages(entry).forEach(page => {
      expect(page.length).toBeLessThanOrEqual(4);
      page.forEach(line => expect(line.length).toBeLessThanOrEqual(19));
    }));
  });
  it('preserves unusually long names and unbroken tokens', () => {
    const text = 'UnusuallyLongProjectName'.repeat(50);
    const pages = paginate(text);
    expect(pages.flat().join('')).toBe(text);
    pages.flat().forEach(line => expect(line.length).toBeLessThanOrEqual(19));
    expect(paginate('')).toEqual([['']]);
  });
  it('validates external URL protocols', () => {
    ['javascript:alert(1)', 'data:text/html,test', 'http://example.com', 'https://user:pass@example.com', '', undefined].forEach(url => expect(safeUrl(url)).toBeNull());
    expect(safeUrl('https://github.com/ANONYMOUSZED-beep')).toBe('https://github.com/ANONYMOUSZED-beep');
  });
  it('generates accessible content from the same facts without exposing private fields', () => {
    const html = textPage();
    sections.filter(s => s.id !== 'extras').forEach(s => expect(html).toContain(`id="${s.id}"`));
    expect(html).toContain('90%+ coverage');
    expect(html).not.toContain('@gmail.com');
    expect(html).not.toContain('mailto:');
    expect(html).not.toContain('tel:');
    expect(html).not.toContain('<script');
    expect(missingInformation.approvedPublicEmail).toBeNull();
    expect(html).not.toContain('undefined');
    expect(html).not.toContain('lorem ipsum');
  });
});
