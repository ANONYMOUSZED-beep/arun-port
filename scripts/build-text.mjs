/**
 * Generates text.html (the accessible, printable, search-friendly view)
 * from src/content.js so both views always match.
 *   node scripts/build-text.mjs          write text.html
 *   node scripts/build-text.mjs --check  fail if text.html is out of date
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { config } from "../src/config.js";
import { profile, sections } from "../src/content.js";

const escape = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const external = (href, label) => `<a href="${escape(href)}" target="_blank" rel="noopener noreferrer">${label}<span class="sr-only"> (opens in a new tab)</span></a>`;

const STYLE = `*{box-sizing:border-box}html{color-scheme:light}body{margin:0;background:#f5f6f3;color:#24332b;font:17px/1.7 Arial,Helvetica,sans-serif}main{max-width:800px;margin:auto;padding:42px 28px 80px}a{color:#275c49;text-underline-offset:4px;overflow-wrap:anywhere}a:focus-visible{outline:3px solid #275c49;outline-offset:5px}h1{font-size:42px;line-height:1.2;margin:36px 0 8px;font-weight:500}h2{font-size:26px;margin:0 0 25px}h3{font-size:19px;line-height:1.5;margin:30px 0 12px}p{margin:12px 0}header p{color:#5b675b}.status{display:inline-block;margin-top:6px;padding:4px 12px;border:1px solid #b9c6b5;border-radius:999px;font-size:14px;color:#275c49}.links{display:flex;flex-wrap:wrap;gap:8px 20px;margin-top:18px;font-size:15px}nav{display:flex;gap:8px 22px;flex-wrap:wrap;padding:26px 0}nav a,.links a{min-height:44px;display:inline-flex;align-items:center}nav a{font-size:14px}section{border-top:1px solid #cbd3c8;margin-top:28px;padding-top:30px}article{margin-bottom:32px}.back{display:inline-flex;align-items:center;min-height:44px;font-size:14px}.tools{font-size:14px;color:#4d5f50}footer{margin-top:50px;font-size:13px}li{margin-bottom:12px}[hidden]{display:none!important}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}@media(max-width:420px){main{padding:24px 22px 60px}h1{font-size:34px}}@media print{.back,nav,.links{display:none}body{background:white;font-size:11pt}main{padding:0}h1{font-size:28pt}article{break-inside:avoid}h2,h3{break-after:avoid}}`;

const CREDITS = `<section id="credits" aria-labelledby="title-credits"><h2 id="title-credits">Credits &amp; Sources</h2><p>An independent portfolio, not affiliated with or endorsed by Nokia. Nokia is a trademark of its respective owner.</p><h3>Handset Photograph</h3><p><a href="https://commons.wikimedia.org/wiki/File:Nokia_3310_Blue_R7309170_(retouch).png">Nokia 3310 Blue R7309170 (retouch)</a> by Rainer Knäpper (smial), retouched by Multicherry, used under the <a href="https://artlibre.org/licence/lal/en/">Free Art License 1.3</a>. Resized and converted to WebP, with a replacement LCD and interactive control overlays. The adapted handset visual is available under the same license. <a href="./assets/nokia-3310.webp" download>Download the adapted image</a>.</p><p>Pixel glyphs, synthesized key tones, and the Snake II and Ask Arun apps are original work. Lucide icons use the ISC license. No original Nokia ringtone or proprietary font is redistributed.</p><h3>Hardware References</h3><ul><li><a href="https://www.mobilephonemuseum.com/phone-detail/nokia-3310">Mobile Phone Museum: Nokia 3310</a> (2000 launch and model identification).</li><li><a href="https://www.gsmarena.com/nokia_3310-192.php">GSMArena: Nokia 3310</a> (113 x 48 x 22 mm; 133 g).</li><li><a href="https://www.techradar.com/news/phone-and-communications/mobile-phones/nokia-s-3310-the-greatest-phone-of-all-time-1287636">TechRadar: Nokia 3310 retrospective</a> (84 x 48 monochrome display).</li><li><a href="https://nokia-3310.helpdoc.net/en/1-your-phone/using-the-keys/navi-key/">Nokia manual transcription: Navi key</a> (one contextual action button).</li><li><a href="https://commons.wikimedia.org/wiki/File:Nokia_3310_grey_all_sides.jpg">Multicherry: all-sides reference</a> (CC BY-SA 4.0; reference only, not redistributed).</li></ul><p>Photographic perspective, regional key legends, and a slightly expanded LCD viewport are retained or adapted for usability. The rendered body is not a calibrated engineering model.</p></section>`;

function article(section, entry) {
  const parts = [`<article id="${section.id}-${entry.id}">`, `<h3>${escape(entry.title)}</h3>`];
  for (const paragraph of entry.paragraphs) parts.push(`<p>${escape(paragraph)}</p>`);
  if (entry.tools) parts.push(`<p class="tools"><strong>Tools:</strong> ${escape(entry.tools.join(", "))}</p>`);
  if (entry.url && section.id === "projects") parts.push(`<p>${external(entry.url, "View repository")}</p>`);
  parts.push("</article>");
  return parts.join("");
}

function contactSection(section) {
  const items = [
    `<li><a href="./index.html#app/message">Send a message from the phone</a> (Contact &gt; Write message).</li>`,
    `<li>LinkedIn: ${external(profile.links.linkedin, "Arunesh Waran")}</li>`,
    `<li>GitHub: ${external(profile.links.github, "ANONYMOUSZED-beep")}</li>`,
    ...(config.resumePath ? [`<li><a href="${escape(config.resumePath)}" download>Download resume (PDF)</a></li>`] : []),
  ];
  return `<section id="${section.id}" aria-labelledby="title-${section.id}"><h2 id="title-${section.id}">${section.title}</h2><ul>${items.join("")}</ul></section>`;
}

function extrasSection() {
  return `<section id="extras" aria-labelledby="title-extras"><h2 id="title-extras">On the phone</h2><article><h3>Ask Arun</h3><p>Ask a question about my work and get an answer from this portfolio. BM25 keyword retrieval runs in your browser; nothing you ask leaves the page. <a href="./index.html#app/ask">Open Ask Arun</a>.</p></article><article><h3>Snake II</h3><p>The classic, rebuilt for the 84 x 48 display. <a href="./index.html#app/snake">Play Snake II</a>.</p></article></section>`;
}

export function buildText() {
  const visible = sections.filter((s) => s.id !== "extras");
  const nav = [...visible, { id: "extras", title: "On the phone" }].map((s) => `<a href="#${s.id}">${s.title}</a>`).join("");
  const body = visible
    .map((section) =>
      section.id === "contact"
        ? contactSection(section)
        : `<section id="${section.id}" aria-labelledby="title-${section.id}"><h2 id="title-${section.id}">${section.title}</h2>${section.entries.map((e) => article(section, e)).join("")}</section>`,
    )
    .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(profile.name)} | Text Portfolio</title><meta name="description" content="${escape(`${profile.name}, ${profile.title} in Coimbatore, India. Projects, skills, education and contact details.`)}"><meta property="og:type" content="profile"><meta property="og:title" content="${escape(`${profile.name} | ${profile.title}`)}"><meta property="og:image" content="https://raw.githubusercontent.com/ANONYMOUSZED-beep/arun-port/main/og-image.png"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="./favicon.svg" type="image/svg+xml"><style>${STYLE}</style></head><body><main><a class="back" href="./index.html">&#8592; Return to the phone</a><header><h1>${escape(profile.name)}</h1><p>${escape(profile.title)}<br>${escape(profile.location)}</p><span class="status">${escape(profile.status)}</span><p class="links"><a href="./index.html#app/message">Message me</a>${external(profile.links.linkedin, "LinkedIn")}${external(profile.links.github, "GitHub")}${config.resumePath ? `<a href="${escape(config.resumePath)}" download>Resume (PDF)</a>` : ""}</p></header><nav aria-label="Portfolio sections">${nav}</nav>${body}${extrasSection()}${CREDITS}<footer>${escape(profile.name)} &middot; ${escape(profile.title)}</footer></main></body></html>\n`;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const target = fileURLToPath(new URL("../text.html", import.meta.url));
  const html = buildText();
  if (process.argv.includes("--check")) {
    if (readFileSync(target, "utf8") !== html) {
      console.error("text.html is out of date. Run: npm run build:text");
      process.exit(1);
    }
    console.log("text.html is up to date.");
  } else {
    writeFileSync(target, html);
    console.log("Wrote text.html");
  }
}
