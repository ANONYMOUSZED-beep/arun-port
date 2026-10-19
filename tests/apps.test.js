import { test } from "node:test";
import assert from "node:assert/strict";
import { apps, answer, SUGGESTIONS } from "../src/apps.js";

const from = { section: 5, selected: 0 };
const ctx = (now = 0, config = {}) => ({ now, config, rng: () => 0 });

test("message: multi-tap typing, delete and copy fallback", () => {
  let s = apps.message.init(from);
  s = apps.message.reduce(s, "digit4", ctx(0));
  s = apps.message.reduce(s, "digit4", ctx(100));
  s = apps.message.reduce(s, "digit4", ctx(5000));
  s = apps.message.reduce(s, "digit4", ctx(5100));
  s = apps.message.reduce(s, "digit4", ctx(5200));
  assert.equal(s.input.text, "hi");
  s = apps.message.reduce(s, "back", ctx(9000));
  assert.equal(s.input.text, "h");
  s = apps.message.reduce(s, "char:i", ctx(9000));
  s = apps.message.reduce(s, "select", ctx(9000));
  assert.equal(s.step, "copied");
  assert.equal(s.effect.type, "copy-open");
  assert.equal(s.effect.text, "hi");
});

test("message: form endpoint asks for an email, validates, then sends", () => {
  const config = { formEndpoint: "https://formspree.io/f/test" };
  let s = apps.message.init(from);
  s = apps.message.reduce(s, "char:H", ctx(0, config));
  s = apps.message.reduce(s, "select", ctx(0, config));
  assert.equal(s.step, "email");
  for (const c of "bad") s = apps.message.reduce(s, `char:${c}`, ctx(0, config));
  assert.equal(apps.message.reduce(s, "select", ctx(0, config)).effect.type, "notice");
  for (const c of "@x.io") s = apps.message.reduce(s, `char:${c}`, ctx(0, config));
  s = apps.message.reduce(s, "select", ctx(0, config));
  assert.equal(s.step, "sending");
  assert.deepEqual(s.effect, { type: "send", endpoint: config.formEndpoint, body: "H", from: "bad@x.io" });
  assert.equal(apps.message.reduce(s, "@sent", ctx()).step, "sent");
});

test("message: C on an empty draft leaves the app", () => {
  const s = apps.message.reduce(apps.message.init(from), "back", ctx());
  assert.deepEqual(s, { kind: "section", ...from });
});

test("ask: every suggestion finds an answer that links to its source", () => {
  for (const question of SUGGESTIONS) {
    const result = answer(question);
    assert.ok(result.hash, `no answer for ${question}`);
  }
});

test("ask: answers come from the right place", () => {
  assert.match(answer("Best project?").source, /AI Assistant/);
  assert.match(answer("Tech stack?").source, /Skills|Tools/);
  assert.match(answer("Testing approach?").source, /ReplayGuard > Testing/);
  assert.match(answer("Computer vision?").source, /Traffic Vision/);
  assert.match(answer("What is your CGPA?").source, /B.Tech/);
  assert.equal(answer("How to contact?").hash, "#app/message");
  assert.equal(answer("Certificates?").hash, "#certificates/0");
  assert.equal(answer("zzqx blorp").hash, null);
});

test("ask: answer screen ends with an Open action", () => {
  let s = apps.ask.init(from);
  s = apps.ask.reduce(s, "down", ctx());
  s = apps.ask.reduce(s, "select", ctx());
  assert.equal(s.step, "answer");
  while (s.page < s.pages.length - 1) s = apps.ask.reduce(s, "select", ctx());
  assert.equal(apps.ask.screen(s, ctx()).footer, "Open");
  assert.equal(apps.ask.reduce(s, "select", ctx()).effect.type, "navigate");
});

test("snake: start, steer, pause and game over", () => {
  let s = apps.snake.init(from, { snakeHi: 3 });
  s = apps.snake.reduce(s, "select", ctx());
  assert.equal(s.step, "play");
  s = apps.snake.reduce(s, "digit2", ctx());
  s = apps.snake.reduce(s, "@tick", ctx());
  assert.equal(s.game.dir, "up");
  assert.equal(apps.snake.reduce(s, "back", ctx()).step, "paused");
  assert.equal(apps.snake.reduce(s, "digit7", ctx()), s, "digits are consumed while playing");
  const over = apps.snake.reduce({ ...s, game: { ...s.game, alive: true, snake: [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 1, y: 2 }, { x: 0, y: 2 }], dir: "down", queue: [], score: 5 } }, "@tick", ctx());
  assert.equal(over.step, "over");
  assert.equal(over.hi, 5);
  assert.deepEqual(over.effect, { type: "save-hi", value: 5 });
});

test("ask: education and location questions", () => {
  assert.match(answer("Education?").source, /B.Tech/);
  assert.match(answer("Where are you based?").source, /Profile/);
});
