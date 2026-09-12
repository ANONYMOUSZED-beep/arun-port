// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

const listeners: { type: string; listener: EventListenerOrEventListenerObject }[] = [];
beforeEach(async () => {
  const originalAdd = window.addEventListener.bind(window);
  vi.spyOn(window, 'addEventListener').mockImplementation((type, listener, options) => {
    if (listener) listeners.push({ type, listener });
    originalAdd(type, listener, options);
  });
  vi.resetModules();
  vi.useFakeTimers();
  document.documentElement.innerHTML = readFileSync('index.html', 'utf8');
  localStorage.clear();
  history.replaceState(null, '', '/');
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn() })));
  const ctx = { fillStyle: '', fillRect: vi.fn() };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
  await import('../src/main');
});
afterEach(() => { for (const { type, listener } of listeners.splice(0)) window.removeEventListener(type, listener); vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const click = (selector: string) => document.querySelector<HTMLButtonElement>(selector)!.click();
const status = () => document.querySelector('#screen-reader')!.textContent;

describe('phone integration', () => {
  it('announces screens, synchronizes Navi labels, and opens every physical shortcut', () => {
    expect(status()).toContain('Arunesh Waran');
    expect(document.querySelector('.navi')?.getAttribute('aria-label')).toBe('Menu');
    click('.navi'); expect(status()).toContain('Portfolio');
    click('.down'); expect(status()).toContain('Selected: 2 Projects');
    click('.navi'); expect(status()).toContain('AI Assistant');
    click('.clear'); expect(status()).toContain('Portfolio');
    for (let i = 1; i <= 9; i++) {
      click(`[data-key="digit${i}"]`);
      expect(location.hash).not.toBe('#home');
      expect(status()!.length).toBeGreaterThan(15);
    }
    click('[data-key="digit0"]'); expect(location.hash).toBe('#home');
    click('.power'); expect(status()).toContain('Phone off');
    click('.power'); expect(status()).toContain('Arunesh Waran');
  });
  it('muted default creates no audio, and preference changes persist', () => {
    expect(document.querySelector('#sound')?.getAttribute('aria-pressed')).toBe('false');
    click('[data-key="motion"]');
    expect(localStorage.getItem('3310-motion')).toBe('reduced');
    expect(document.documentElement.classList.contains('reduced-motion')).toBe(true);
    expect(status()).toContain('Motion reduced');
    click('[data-key="motion"]');
    expect(localStorage.getItem('3310-motion')).toBe('system');
    click('[data-key="sound"]');
    // jsdom has no AudioContext: the guarded audio path must fail quietly and re-mute.
    expect(document.querySelector('#sound')?.getAttribute('aria-pressed')).toBe('false');
  });
  it('requires explicit confirmation before opening a public profile', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    history.replaceState(null, '', '#contact/linkedin/0');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    click('.navi');
    click('.navi');
    expect(status()).toContain('Open link?');
    expect(open).not.toHaveBeenCalled();
    click('.navi');
    expect(open).toHaveBeenCalledWith('https://www.linkedin.com/in/arunesh-waran-2a6846300/', '_blank', 'noopener,noreferrer');
    expect(status()).not.toContain('Open link?');
  });
  it('Enter selects after a numeric shortcut and Escape returns to its parent', () => {
    const key = document.querySelector<HTMLButtonElement>('[data-key="digit2"]')!;
    key.click(); key.focus();
    key.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(status()).toContain('Overview');
    key.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(status()).toContain('An AI assistant');
    key.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(status()).toContain('Selected: Overview');
  });
  it('zooms the existing LCD without changing the current screen', () => {
    click('[data-key="digit2"]');
    const original = status();
    click('#zoom');
    expect(document.querySelector('#phone')?.classList.contains('lcd-zoomed')).toBe(true);
    expect(document.querySelector('#zoom')?.getAttribute('aria-pressed')).toBe('true');
    expect(status()).toBe(original);
    click('#zoom');
    expect(document.querySelector('#phone')?.classList.contains('lcd-zoomed')).toBe(false);
  });
  it('confirms the selected project repository without opening on selection', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    history.replaceState(null, '', '#projects/replayguard/topics/5');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    click('.navi');
    expect(status()).toContain('GitHub repository');
    expect(open).not.toHaveBeenCalled();
    click('.navi');
    expect(open).toHaveBeenCalledWith('https://github.com/ANONYMOUSZED-beep/ReplayGuard', '_blank', 'noopener,noreferrer');
    expect(status()).toContain('Selected: View source');
  });
  it('provides names on all buttons and static text alternative', () => {
    for (const button of document.querySelectorAll('button')) expect(button.getAttribute('aria-label')).toBeTruthy();
    expect(document.querySelector('a[href="./text.html"]')).toBeTruthy();
    expect(document.querySelector('[role="status"]')?.getAttribute('aria-live')).toBe('polite');
  });
});
