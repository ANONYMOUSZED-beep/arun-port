import { test } from "node:test";
import assert from "node:assert/strict";
import { createInput, deleteChar, pressDigit, toggleMode, MULTI_TAP_MS } from "../src/t9.js";
import { COLS, createGame, step, turn } from "../src/snake.js";
import { stem, tokenize } from "../src/ask.js";
import { wrapChars, wrapWords } from "../src/text.js";

test("t9 cycles letters within the multi-tap window", () => {
  let input = createInput();
  for (const t of [0, 200, 400]) input = pressDigit(input, 2, t);
  assert.equal(input.text, "c");
  input = pressDigit(input, 2, 400 + MULTI_TAP_MS + 1);
  assert.equal(input.text, "ca");
  input = pressDigit(input, 0, 5000);
  assert.equal(input.text, "ca ");
  input = toggleMode(input);
  input = pressDigit(input, 7, 5001);
  input = pressDigit(input, 7, 5002);
  assert.equal(input.text, "ca 77");
  assert.equal(deleteChar(input).text, "ca 7");
});

test("t9 respects the maximum length", () => {
  let input = createInput(2);
  for (const t of [0, 2000, 4000]) input = pressDigit(input, 3, t);
  assert.equal(input.text, "dd");
});

test("snake moves, grows, wraps and refuses to reverse", () => {
  let game = createGame(() => 0);
  assert.equal(turn(game, "left"), game);
  game = { ...game, food: { x: 9, y: 6 } };
  game = step(game, () => 0);
  assert.equal(game.score, 1);
  assert.equal(game.snake.length, 5);
  let wrap = { ...createGame(() => 0), snake: [{ x: COLS - 1, y: 0 }], food: { x: 5, y: 5 } };
  wrap = step(wrap);
  assert.deepEqual(wrap.snake[0], { x: 0, y: 0 });
});

test("search tokenizer stems and drops stop words", () => {
  assert.equal(stem("testing"), "test");
  assert.equal(stem("certificates"), "certificate");
  assert.deepEqual(tokenize("What are your skills?"), ["skill"]);
});

test("LCD wrapping", () => {
  assert.deepEqual(wrapWords("one two three", 7, 1), [["one two"], ["three"]]);
  assert.deepEqual(wrapChars("abcdef", 4), ["abcd", "ef"]);
  assert.deepEqual(wrapChars(""), [""]);
  assert.deepEqual(wrapChars("Hi Arunesh! Loved the 3310."), ["Hi Arunesh! Loved", "the 3310."]);
  assert.deepEqual(wrapChars("ab "), ["ab "]);
});
