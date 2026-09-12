# QA Results

Date: 2026-09-06. Environment: Windows, Node 24.16.0, Vite 7.3.6, Vitest 3.2.7, ZCode in-app Chromium browser.

## Automated checks

- `npm run build`: PASS, including strict TypeScript checking and generation of static `text.html`.
- `npm run lint`: PASS.
- `npm test`: PASS, 12 tests across navigation/content and jsdom interface suites.
- `npm install` audit: 0 known dependency vulnerabilities reported.
- Local `/text.html`: HTTP 200 with HTML content type.

Tests cover every content entry and page, section shortcuts, wrapping lists, bounded detail pagination, power/home/help, malformed deep links, state round trips, unusually long strings, HTTPS-only URL validation, missing fields, content privacy, static accessible content, accessible button names, Navi-label synchronization, setting persistence, and external-link confirmation.

Initial test-fixture file loading failed because Vitest's transformed module URL was not a file URL. Replaced it with workspace-relative fixture loading and reran successfully. Initial Vite typing needed Node type definitions, now installed. npm emits warnings for three pre-existing user-config settings (`strict-peer-dependencies`, `auto-install-peers`, `resolution-mode`); these do not fail checks and were not changed.

## Browser Evidence

Screenshots captured and visually inspected:

- `qa/desktop-1440x900.png`: full handset and archival composition visible.
- `qa/laptop-1366x768.png`: full handset visible; slight document scrolling remains available.
- `qa/mobile-390x844.png`: whole handset, identity and footer visible.
- `qa/mobile-360x800.png`: whole handset and all essential controls visible; compact identity remains readable.

Visual checks found and corrected joined name text on mobile, reduced-motion/footer target sizing, rocker hit placement, and LCD title/page-counter spacing. Desktop screenshot predates these mobile/header-internal corrections; the overall desktop composition is unchanged.

Live browser observations confirmed:

- Handset photo, active nonblank LCD, and Lucide icons load.
- Physical number-2 control opens Projects with AI Assistant selected.
- Keyboard number shortcut opens Projects.
- Reload retains the selected project section.
- Browser Back returns to home.
- Accessible text link opens the static portfolio with all public professional content and source credits.
- Semantic snapshots expose named buttons and a live status region.
- Screenshots show no horizontal overflow or overlapping visible page text at the four captured sizes.

A Playwright click timed out despite a visible control; the DOM-based click path succeeded. One browser screenshot activity capture failed; later captures succeeded. Focused Enter testing did not reliably advance the observed screen in this automation session, so full real-browser keyboard-only coverage is NOT claimed; Enter on a focused numeric key intentionally reactivates that key under native button behavior. Selection behavior is covered by DOM integration tests.

## Remaining Validation Limits

- No physical mobile/touch device, NVDA, JAWS, VoiceOver, or TalkBack session was run.
- No throttled-network, offline-cache, or Lighthouse run. Initial assets are all local with no remote runtime requests.
- No browser console-log collection API was used; no-console-errors certification is not claimed.
- External destinations were preserved from PDF annotations and validated structurally; availability or account ownership was not independently confirmed. The Free Art License endpoint returned HTTP 403 to the research fetcher.
- Hit areas use 44px minimum dimensions but follow closely packed historical controls. Native-device edge taps and 200% browser zoom deserve further usability review.
- The glyph system favors hardware authenticity over large text. The full-size static text route is the reading alternative.
- No long-press gestures, game, startup sequence, private resume download, or fabricated project imagery was included.

## Release Status

Implemented and locally runnable; production build ready as `dist/`. Not publicly deployed. Retain attribution and complete physical-device/accessibility validation before labeling the site fully audited.
