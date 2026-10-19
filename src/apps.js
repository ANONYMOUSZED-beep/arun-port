/**
 * Phone apps: Messages, Ask Arun and Snake II.
 * Each app is a pure reducer plus a screen description. Side effects (network,
 * clipboard, storage, navigation) are returned as `effect` and run by main.js.
 * A reducer returns undefined for keys it leaves to the global handlers.
 */
import { profile, sections } from "./content.js";
import { buildDocs, createIndex, search } from "./ask.js";
import { COLS, ROWS, createGame, step, turn } from "./snake.js";
import { createInput, deleteChar, isPending, pressDigit, toggleMode, typeChar } from "./t9.js";
import { LINES_PER_PAGE, wrapChars, wrapWords } from "./text.js";

const exit = (s) => ({ kind: "section", section: s.from.section, selected: s.from.selected });
const notice = (s, text) => ({ ...s, effect: { type: "notice", text } });
const move = (index, key, length) => (index + (key === "up" ? -1 : 1) + length) % length;

function edit(input, key, ctx) {
  if (key.startsWith("digit")) return pressDigit(input, Number(key.slice(5)), ctx.now);
  if (key === "motion") return toggleMode(input);
  if (key.startsWith("char:")) return typeChar(input, key.slice(5));
  return null;
}

function composeScreen(title, input, ctx, hints, footer) {
  const cursor = isPending(input, ctx.now) ? "" : "_";
  const lines = input.text ? wrapChars(input.text + cursor).slice(-LINES_PER_PAGE) : ["_", "", ...hints];
  return {
    title,
    page: input.mode === "123" ? "123" : "ABC",
    lines,
    footer,
    announce: `${title}. ${input.text ? `Typed: ${input.text}` : "Empty. Type with the keypad or keyboard"}. Navi: ${footer}. C: delete.`,
  };
}

const textScreen = (title, lines, footer) => ({ title, lines, footer });

/* ---------- Messages ---------- */
const message = {
  init: (from) => ({ kind: "app", app: "message", from, step: "compose", input: createInput(280) }),
  acceptsText: (s) => s.step === "compose" || s.step === "email",
  reduce(s, key, ctx) {
    const config = ctx.config ?? {};
    if (key === "escape") return exit(s);
    if (message.acceptsText(s)) {
      const input = edit(s.input, key, ctx);
      if (input) return { ...s, input };
      if (key === "back") {
        if (s.input.text) return { ...s, input: deleteChar(s.input) };
        return s.step === "email" ? { ...s, step: "compose", input: s.draft } : exit(s);
      }
      if (key === "up" || key === "down" || key === "left" || key === "right") return s;
      if (key !== "select") return undefined;
      const text = s.input.text.trim();
      if (s.step === "compose") {
        if (!text) return notice(s, "Type a message");
        if (config.formEndpoint) return { ...s, step: "email", draft: s.input, body: text, input: createInput(80) };
        if (config.email) return { ...s, step: "mailed", body: text, effect: { type: "mailto", to: config.email, body: text } };
        return { ...s, step: "copied", draft: s.input, effect: { type: "copy-open", text, url: profile.links.linkedin } };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return notice(s, "Check email");
      return { ...s, step: "sending", effect: { type: "send", endpoint: config.formEndpoint, body: s.body, from: text } };
    }
    if (key === "@sent") return { ...s, step: "sent" };
    if (key === "@failed") return { ...s, step: "failed" };
    if (s.step === "sending") return key === "back" ? exit(s) : s;
    if (key === "select" && s.step === "failed") return { ...s, step: "compose", input: s.draft };
    if (key === "select" || key === "back") return exit(s);
    return key.startsWith("@") ? s : undefined;
  },
  screen(s, ctx) {
    const config = ctx.config ?? {};
    switch (s.step) {
      case "compose":
        return composeScreen("To Arunesh", s.input, ctx, ["Keypad types abc", "0 space  C delete"], config.formEndpoint ? "Next" : "Send");
      case "email":
        return composeScreen("Your email", s.input, ctx, ["So I can reply.", "1 key has @ and ."], "Send");
      case "sending":
        return textScreen("Messages", ["", "Sending...", "", ""], "");
      case "sent":
        return textScreen("Messages", ["Message sent.", "Thank you! I will", "reply by email.", ""], "OK");
      case "failed":
        return textScreen("Messages", ["Not sent.", "Check connection", "or use LinkedIn.", ""], "Retry");
      case "mailed":
        return textScreen("Messages", ["Opening your", "mail app with", "the message.", ""], "OK");
      default:
        return textScreen("Messages", ["Message copied.", "Paste it into the", "LinkedIn tab that", "just opened."], "OK");
    }
  },
};

/* ---------- Ask Arun ---------- */
export const SUGGESTIONS = [
  "Best project?",
  "Tech stack?",
  "RAG experience?",
  "Testing approach?",
  "Computer vision?",
  "Education?",
  "Certificates?",
  "How to contact?",
];
let index;
const askIndex = () => (index ??= createIndex(buildDocs(sections)));

export function answer(query) {
  const [best] = search(askIndex(), query, 1);
  if (!best) return { pages: [["No match yet.", "Try: projects,", "skills, RAG or", "education."]], hash: null };
  return { pages: [...wrapWords(best.doc.text), ["From:", ...wrapWords(best.doc.title, 19, 3)[0]]], hash: best.doc.hash, source: best.doc.title };
}

const ask = {
  init: (from) => ({ kind: "app", app: "ask", from, step: "menu", selected: 0 }),
  acceptsText: (s) => s.step === "compose",
  reduce(s, key, ctx) {
    if (key === "escape") return exit(s);
    const toAnswer = (query) => ({ ...s, step: "answer", query, page: 0, ...answer(query) });
    if (s.step === "menu") {
      const length = SUGGESTIONS.length + 1;
      if (key === "up" || key === "down") return { ...s, selected: move(s.selected, key, length) };
      if (key === "select") return s.selected === 0 ? { ...s, step: "compose", input: createInput(80) } : toAnswer(SUGGESTIONS[s.selected - 1]);
      if (key === "back") return exit(s);
      return undefined;
    }
    if (s.step === "compose") {
      const input = edit(s.input, key, ctx);
      if (input) return { ...s, input };
      if (key === "back") return s.input.text ? { ...s, input: deleteChar(s.input) } : { ...s, step: "menu" };
      if (key === "select") return s.input.text.trim() ? toAnswer(s.input.text) : notice(s, "Type a question");
      if (key === "up" || key === "down" || key === "left" || key === "right") return s;
      return undefined;
    }
    // answer
    const last = s.pages.length - 1;
    if (key === "up") return { ...s, page: Math.max(0, s.page - 1) };
    if (key === "down") return { ...s, page: Math.min(last, s.page + 1) };
    if (key === "select") {
      if (s.page < last) return { ...s, page: s.page + 1 };
      return s.hash ? { ...s, effect: { type: "navigate", hash: s.hash } } : { ...s, step: "menu" };
    }
    if (key === "back") return { ...s, step: "menu" };
    return undefined;
  },
  screen(s, ctx) {
    if (s.step === "compose") return composeScreen("Ask Arun", s.input, ctx, ["Type a question,", "then press Navi."], "Ask");
    if (s.step === "answer") {
      const last = s.page === s.pages.length - 1;
      return {
        title: "Answer",
        page: `${s.page + 1}/${s.pages.length}`,
        lines: s.pages[s.page],
        footer: last ? (s.hash ? "Open" : "Done") : "Next",
        announce: `Answer to ${s.query}. ${s.pages.map((p) => p.join(" ")).join(" ")}. ${s.hash ? "Navi on the last page opens the source." : ""}`,
      };
    }
    const items = ["Type a question", ...SUGGESTIONS];
    const start = Math.max(0, Math.min(s.selected - 1, items.length - LINES_PER_PAGE));
    return {
      title: "Ask Arun",
      page: `${s.selected + 1}/${items.length}`,
      lines: items.slice(start, start + LINES_PER_PAGE),
      selected: s.selected - start,
      footer: "Select",
    };
  },
};

/* ---------- Snake II ---------- */
const DIRECTIONS = { up: "up", down: "down", left: "left", right: "right", digit2: "up", digit8: "down", digit4: "left", digit6: "right" };
const CELL = 3;
const ORIGIN = { x: 1.5, y: 10.2 };

const snake = {
  init: (from, ctx = {}) => ({ kind: "app", app: "snake", from, step: "ready", game: null, hi: ctx.snakeHi ?? 0 }),
  acceptsText: () => false,
  reduce(s, key, ctx) {
    const dir = DIRECTIONS[key];
    const start = () => ({ ...s, step: "play", game: createGame(ctx.rng), newHi: false });
    if (key === "escape") return exit(s);
    if (s.step === "play") {
      if (dir) return { ...s, game: turn(s.game, dir) };
      if (key === "@tick") {
        const game = step(s.game, ctx.rng);
        if (game.alive) return { ...s, game };
        const newHi = game.score > s.hi;
        return { ...s, game, step: "over", newHi, hi: Math.max(s.hi, game.score), effect: newHi ? { type: "save-hi", value: game.score } : undefined };
      }
      if (key === "@pause" || key === "select" || key === "digit5" || key === "back") return { ...s, step: "paused" };
      return s;
    }
    if (key.startsWith("@")) return s;
    if (s.step === "paused") {
      if (key === "select" || key === "digit5" || dir) return { ...s, step: "play", game: dir ? turn(s.game, dir) : s.game };
      if (key === "back") return exit(s);
      return undefined;
    }
    if (key === "select" || key === "digit5") return start();
    if (key === "back") return exit(s);
    if (key === "up" || key === "down" || key === "left" || key === "right") return s;
    return undefined;
  },
  screen(s) {
    if (s.step === "ready")
      return { title: "Snake II", page: `TOP ${s.hi}`, lines: ["Eat, grow, and", "do not bite your", "own tail.", "2 4 6 8 to steer"], footer: "Start" };
    if (s.step === "paused") return { title: "Paused", page: String(s.game.score), lines: ["Navi: resume", "C: quit", "", ""], footer: "Resume" };
    if (s.step === "over")
      return {
        title: "Game over",
        lines: [`Score ${s.game.score}`, `Top score ${s.hi}`, s.newHi ? "New top score!" : "", "C: quit"],
        footer: "Again",
        announce: `Game over. Score ${s.game.score}. Top score ${s.hi}. Navi: play again. C: quit.`,
      };
    const { game } = s;
    return {
      announce: null,
      draw(lcd) {
        lcd.text(String(game.score).padStart(4, "0"), 2, 1);
        const top = `TOP ${Math.max(s.hi, game.score)}`;
        lcd.text(top, 83 - top.length * 4, 1);
        lcd.rect(0, 9, 84, 0.5);
        lcd.rect(0, 46.7, 84, 0.5);
        lcd.rect(0, 9, 0.5, 38.2);
        lcd.rect(83.5, 9, 0.5, 38.2);
        for (const part of game.snake) lcd.rect(ORIGIN.x + part.x * CELL, ORIGIN.y + part.y * CELL, CELL - 0.4, CELL - 0.4);
        if (game.food) {
          const fx = ORIGIN.x + game.food.x * CELL;
          const fy = ORIGIN.y + game.food.y * CELL;
          lcd.rect(fx + 1, fy, 1, CELL);
          lcd.rect(fx, fy + 1, CELL, 1);
        }
      },
    };
  },
};

export const GRID = { COLS, ROWS };
export const apps = { message, ask, snake };
