# Arunesh Waran: On the Line

## September 2026 Upgrade

All three projects now link to verified public repositories. Opening a project shows focused topic choices, Tools, Full details, and View source. Source links require confirmation. The magnifier enlarges the existing LCD without replacing the physical controls. Enter now always selects within the phone, including after a numeric-key click; Space activates the focused key. Key presses use a locally sampled handset image with restrained travel and shadow compression. No public demo is advertised because the discovered AI-assistant deployments require Vercel SSO.

The latest regression suite has 17 passing tests. See `docs/UPGRADES.md` for verification evidence and current limitations. Earlier navigation descriptions below describe the original release where noted.

An interactive portfolio inside a photographed original Nokia 3310. Built with TypeScript, Canvas 2D, Vite, and tree-shaken Lucide icons. No UI framework, remote font, analytics, backend, or WebGL dependency.

## Run

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

Local preview: http://127.0.0.1:5173
Accessible version: http://127.0.0.1:5173/text.html

Deploy only `dist/` to a static host (Netlify, Cloudflare Pages, GitHub Pages, or equivalent). Use `npm run build` and `dist` as the output directory. Relative assets support subdirectory hosting. No SPA rewrite is needed: phone screens use URL fragments. No secrets or environment variables are required. The site has not been published externally.

## Content

`src/content.ts` contains typed, public-safe content transcribed solely from the supplied resume. `missingInformation` records missing project dates, named roles, public demos, certificate dates/verification URLs, employment history, and approved direct contact details.

The private resume, personal email, and phone number are deliberately NOT included in the project or distribution. LinkedIn and GitHub URLs were extracted from the PDF's link annotations. The resume's malformed date-range glyphs were normalized to hyphens. The 2027 degree date is retained as supplied, not represented as an already completed degree. No unsupported jobs, awards, metrics, clients, or project screenshots were added.

## Controls

- Navi / Enter: Menu, Select, Next, Done, Visit, or Open according to the LCD label.
- Up/down: move selection or detail page.
- C / Escape / Backspace: parent screen. Home / 0: idle screen.
- 1 About; 2 Projects; 3 Skills; 4 Education; 5 Certificates; 6 Contact; 7 Extras.
- 8 Help; 9 Phone info; star sound; hash reduced motion.
- Top power button: on/off. No long press is required.
- Tab and Shift+Tab move through real HTML controls. Enter selects the LCD item when a phone key is focused; Space activates that focused key. Footer controls retain native Enter behavior.

The original 3310 has one Navi key, not two soft keys or separate call/end buttons. Those actions used its contextual Navi key. This portfolio follows the original hardware instead of adding historically incorrect controls. External links require a confirmation screen and open with `noopener,noreferrer`.

## Navigation Map

```text
Home -> Menu
  1 About -> Profile -> pages
  2 Projects -> AI Assistant / ReplayGuard / Traffic Vision -> topics -> pages or source confirmation
  3 Skills -> Languages / AI-ML / Web / Databases / Test-DevOps / Core -> pages
  4 Education -> B.Tech AI-ML / Class XII -> pages
  5 Certificates -> NVIDIA / Microsoft / DataCamp / Kaggle / Hugging Face -> pages
  6 Contact -> LinkedIn / GitHub -> pages -> confirmation -> external tab
  7 Extras -> Help / Phone Info -> pages
C: one level back. 0: Home. Power: Off <-> Home.
Text view: static, full-size version of the same professional content.
```

Example deep link: `/#projects/replayguard/0`. The state parser bounds-checks all URL segments. Browser back restores prior navigation; moving the selection replaces the current history entry. Refresh retains the section and page.

## Accessibility and Performance

The LCD is an 84 x 48 logical bitmap with original 3 x 5 glyphs. A polite live region announces the same text and selected item; the canvas itself is hidden from assistive technology. Buttons have explicit names, focus outlines, and touch-sized hit regions. Optional key tones default to muted and start only on interaction. Sound and reduced-motion preferences persist when local storage is available, with an in-memory fallback. The system reduced-motion preference always disables CSS transitions.

`text.html` is generated from the same typed data at build time and served directly during development. It remains useful without JavaScript, supports ordinary browser zoom and printing, and never forces reading through the small screen.

The transparent handset WebP is local and eagerly loaded as the primary visual. No external requests are needed for the initial experience. The JavaScript production bundle is about 20 kB (8 kB gzip); the exact build output is reported by Vite.

## License and Research

See `docs/RESEARCH.md` and the public text view's Credits section for source URLs, authorship, access date, visual adaptations, and trademark notice. The handset photograph and its visual adaptation use Free Art License 1.3, not a blanket license for all project code. Do not remove image attribution when deploying.

See `docs/QA.md` for executed tests, screenshots, and remaining limitations.
