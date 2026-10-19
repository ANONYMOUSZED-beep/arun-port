import { test } from "node:test";
import assert from "node:assert/strict";
import { sections } from "../src/content.js";
import { acceptsText, entriesOf, features, fromHash, reduce, screenFor, toHash } from "../src/navigation.js";

const run = (keys, state = { kind: "home" }, ctx = {}) => keys.reduce((s, key) => reduce(s, key, ctx), state);
const sectionIndex = (id) => sections.findIndex((s) => s.id === id);

test("home opens the menu and digits jump to sections", () => {
  assert.deepEqual(run(["down"]), { kind: "menu", selected: 0 });
  assert.deepEqual(run(["digit2"]), { kind: "section", section: sectionIndex("projects"), selected: 0 });
});

test("project topics, details and back navigation", () => {
  const topic = run(["digit2", "select", "down", "select"]);
  assert.equal(topic.kind, "detail");
  assert.equal(topic.topic, 1);
  assert.equal(screenFor(topic).title, "Architecture");
  assert.equal(run(["back"], topic).kind, "project");
  assert.equal(run(["back", "back", "back", "back"], topic).kind, "home");
});

test("View source asks for confirmation", () => {
  const project = run(["digit2", "select"]);
  const topics = screenFor(project).page.split("/")[1];
  const confirm = run(["up", "select"], project);
  assert.equal(Number(topics) > 0, true);
  assert.equal(confirm.kind, "confirm");
  assert.equal(screenFor(confirm).lines[0], "GitHub repository");
});

test("8 and 9 open Help and Phone info", () => {
  const extras = sectionIndex("extras");
  assert.equal(entriesOf(extras)[run(["digit8"]).entry].id, "help");
  assert.equal(entriesOf(extras)[run(["digit9"]).entry].id, "info");
});

test("every reachable state survives a hash round trip", () => {
  const seen = new Set();
  const queue = [{ kind: "home" }];
  const keys = ["up", "down", "select", "back"];
  while (queue.length && seen.size < 600) {
    const state = queue.shift();
    const hash = toHash(state);
    if (seen.has(hash)) continue;
    seen.add(hash);
    if (state.kind !== "app") assert.deepEqual(toHash(fromHash(hash)), hash, `round trip ${hash}`);
    if (state.kind !== "app") for (const key of keys) queue.push(reduce(state, key));
  }
  assert.ok(seen.size > 40);
});

test("apps open from their menu entries and from the hash", () => {
  const contact = sectionIndex("contact");
  const message = run(["select"], { kind: "section", section: contact, selected: 0 });
  assert.equal(message.app, "message");
  assert.equal(acceptsText(message), true);
  assert.equal(fromHash("#app/snake").app, "snake");
  assert.equal(fromHash("#app/ask").app, "ask");
  assert.equal(fromHash("#app/unknown").kind, "home");
  assert.deepEqual(reduce(message, "escape"), { kind: "section", section: contact, selected: 0 });
});

test("resume entry only appears when the file exists", () => {
  const contact = sectionIndex("contact");
  assert.equal(entriesOf(contact).some((e) => e.id === "resume"), false);
  features.resume = true;
  assert.equal(entriesOf(contact).some((e) => e.id === "resume"), true);
  features.resume = false;
});

test("LCD text uses only supported glyphs", () => {
  const supported = /^[A-Za-z0-9 .,:;\/\-+&()?!'%#><=_*|@]*$/;
  for (const section of sections)
    for (const entry of section.entries) {
      for (const text of [entry.shortTitle, ...entry.paragraphs, ...(entry.topics ?? []).flatMap((t) => [t.title, ...t.paragraphs])])
        assert.match(text, supported, `${section.id}/${entry.id}: ${text}`);
    }
});
