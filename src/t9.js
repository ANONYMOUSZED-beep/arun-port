/** Nokia-style multi-tap text entry. Pure functions; time is passed in. */
export const KEYPAD = {
  1: ".,?!'@-:1",
  2: "abc2",
  3: "def3",
  4: "ghi4",
  5: "jkl5",
  6: "mno6",
  7: "pqrs7",
  8: "tuv8",
  9: "wxyz9",
  0: " 0",
};
export const MULTI_TAP_MS = 1000;

export function createInput(maxLength = 280) {
  return { text: "", mode: "abc", lastKey: null, at: 0, maxLength };
}

export function isPending(input, now) {
  return input.lastKey !== null && now - input.at < MULTI_TAP_MS;
}

export function pressDigit(input, digit, now) {
  const full = input.text.length >= input.maxLength;
  if (input.mode === "123") return full ? input : { ...input, text: input.text + digit, lastKey: null };
  const letters = KEYPAD[digit];
  if (!letters) return input;
  if (input.lastKey === digit && isPending(input, now) && input.text) {
    const current = letters.indexOf(input.text.at(-1));
    const next = letters[(current + 1) % letters.length];
    return { ...input, text: input.text.slice(0, -1) + next, at: now };
  }
  if (full) return input;
  return { ...input, text: input.text + letters[0], lastKey: digit, at: now };
}

export function typeChar(input, char) {
  if (input.text.length >= input.maxLength) return input;
  return { ...input, text: input.text + char, lastKey: null };
}

export function deleteChar(input) {
  return { ...input, text: input.text.slice(0, -1), lastKey: null };
}

export function toggleMode(input) {
  return { ...input, mode: input.mode === "abc" ? "123" : "abc", lastKey: null };
}
