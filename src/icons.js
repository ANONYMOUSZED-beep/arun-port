/** Minimal Lucide icon set (ISC license), rendered from <i data-lucide="name">. */
const ICONS = {
  "volume-x": [
    ["path", { d: "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" }],
    ["line", { x1: "22", x2: "16", y1: "9", y2: "15" }],
    ["line", { x1: "16", x2: "22", y1: "9", y2: "15" }],
  ],
  "volume-2": [
    ["path", { d: "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" }],
    ["path", { d: "M16 9a5 5 0 0 1 0 6" }],
    ["path", { d: "M19.364 18.364a9 9 0 0 0 0-12.728" }],
  ],
  accessibility: [
    ["circle", { cx: "16", cy: "4", r: "1" }],
    ["path", { d: "m18 19 1-7-6 1" }],
    ["path", { d: "m5 8 3-3 5.5 3-2.36 3.5" }],
    ["path", { d: "M4.24 14.5a5 5 0 0 0 6.88 6" }],
    ["path", { d: "M13.76 17.5a5 5 0 0 0-6.88-6" }],
  ],
  "circle-help": [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }],
    ["path", { d: "M12 17h.01" }],
  ],
  "align-left": [
    ["path", { d: "M15 12H3" }],
    ["path", { d: "M17 18H3" }],
    ["path", { d: "M21 6H3" }],
  ],
  "zoom-in": [
    ["circle", { cx: "11", cy: "11", r: "8" }],
    ["line", { x1: "21", x2: "16.65", y1: "21", y2: "16.65" }],
    ["line", { x1: "11", x2: "11", y1: "8", y2: "14" }],
    ["line", { x1: "8", x2: "14", y1: "11", y2: "11" }],
  ],
  "zoom-out": [
    ["circle", { cx: "11", cy: "11", r: "8" }],
    ["line", { x1: "21", x2: "16.65", y1: "21", y2: "16.65" }],
    ["line", { x1: "8", x2: "14", y1: "11", y2: "11" }],
  ],
  "message-square": [["path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }]],
  "file-text": [
    ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
    ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
    ["path", { d: "M10 9H8" }],
    ["path", { d: "M16 13H8" }],
    ["path", { d: "M16 17H8" }],
  ],
  "arrow-up-right": [
    ["path", { d: "M7 7h10v10" }],
    ["path", { d: "M7 17 17 7" }],
  ],
};

const SVG = "http://www.w3.org/2000/svg";

export function renderIcons(root = document) {
  for (const placeholder of root.querySelectorAll("i[data-lucide]")) {
    const name = placeholder.dataset.lucide;
    const nodes = ICONS[name];
    if (!nodes) continue;
    const svg = document.createElementNS(SVG, "svg");
    const attrs = { xmlns: SVG, width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", class: `lucide lucide-${name}` };
    for (const [key, value] of Object.entries(attrs)) svg.setAttribute(key, String(value));
    for (const [tag, nodeAttrs] of nodes) {
      const node = document.createElementNS(SVG, tag);
      for (const [key, value] of Object.entries(nodeAttrs)) node.setAttribute(key, value);
      svg.appendChild(node);
    }
    placeholder.replaceWith(svg);
  }
}
