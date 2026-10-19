/** 84 x 48 pixel LCD renderer with an original 3 x 5 pixel font. */
export const WIDTH = 84;
export const HEIGHT = 48;
const SCALE = 4;
export const INK = "#203019";
export const PAPER = "#a2b078";

// Each glyph is 3 columns x 5 rows, read left-to-right, top-to-bottom.
const GLYPHS = {
  A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110",
  E: "111100110100111", F: "111100110100100", G: "011100101101011", H: "101101111101101",
  I: "111010010010111", J: "001001001101010", K: "101101110101101", L: "100100100100111",
  M: "101111111101101", N: "101111111111101", O: "010101101101010", P: "110101110100100",
  Q: "010101101111011", R: "110101110101101", S: "011100010001110", T: "111010010010010",
  U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101",
  Y: "101101010010010", Z: "111001010100111",
  0: "111101101101111", 1: "010110010010111", 2: "110001010100111", 3: "110001010001110",
  4: "101101111001001", 5: "111100110001110", 6: "011100111101111", 7: "111001010010010",
  8: "111101111101111", 9: "111101111001110",
  ".": "000000000000010", ",": "000000000010100", ":": "000010000010000", ";": "000010000010100",
  "/": "001001010100100", "-": "000000111000000", "+": "000010111010000", "&": "010101010101011",
  "(": "001010010010001", ")": "100010010010100", "?": "110001010000010", "!": "010010010000010",
  "'": "010010000000000", "%": "101001010100101", "#": "101111101111101", ">": "100010001010100",
  "<": "001010100010001", "=": "000111000111000", _: "000000000000111", "*": "000101010101000",
  "|": "010010010010010", "@": "111101111100111",
};

export function createLcd(canvas) {
  const ctx = canvas.getContext("2d");
  const rect = (x, y, w, h, color = INK) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * SCALE, y * SCALE, w * SCALE, h * SCALE);
  };
  const text = (value, x, y, inverse = false) => {
    ctx.fillStyle = inverse ? PAPER : INK;
    [...String(value).toUpperCase()].forEach((char, i) => {
      const glyph = GLYPHS[char] ?? (char === " " ? "" : GLYPHS["?"]);
      for (let p = 0; p < glyph.length; p++)
        if (glyph[p] === "1") ctx.fillRect((x + i * 4 + (p % 3)) * SCALE, (y + Math.floor(p / 3)) * SCALE, 3.6, 3.6);
    });
  };
  const clear = () => rect(0, 0, WIDTH, HEIGHT, PAPER);
  return { rect, text, clear };
}

const clock = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

/**
 * Draws a screen description:
 *   { off } | { home } | { draw(lcd) } | { title, page, lines, selected, footer }
 * battery grows with interaction, a small reward for exploring.
 */
export function drawScreen(lcd, screen, battery = 0) {
  lcd.clear();
  if (screen.off) return;
  if (screen.draw) {
    screen.draw(lcd);
  } else if (screen.home) {
    for (let i = 0; i < 4; i++) lcd.rect(2 + i * 2, 7 - i * 2, 1, i * 2 + 1);
    lcd.text(clock(), 33, 2);
    lcd.rect(72, 2, 10, 5);
    lcd.rect(73, 3, 8, 3, PAPER);
    lcd.rect(82, 3, 1, 3);
    lcd.rect(74, 3, 2 + Math.min(5, battery), 3);
    lcd.text("ARUNESH", 28, 15);
    lcd.text("WARAN", 32, 22);
    lcd.text("AI / ML / WEB", 16, 33);
  } else {
    lcd.text(screen.title.slice(0, screen.page ? 13 : 19), 2, 1);
    if (screen.page) lcd.text(screen.page.slice(0, 5), 83 - screen.page.length * 4, 1);
    lcd.rect(1, 8, 82, 0.4);
    screen.lines.slice(0, 4).forEach((line, i) => {
      const y = 11 + i * 7;
      if (screen.selected === i) lcd.rect(1, y - 1, 79, 7);
      lcd.text(line.slice(0, 19), 3, y, screen.selected === i);
    });
  }
  if (screen.footer === undefined) return;
  lcd.rect(1, 40, 82, 0.4);
  lcd.text(screen.footer, Math.floor((WIDTH - screen.footer.length * 4) / 2), 42);
}
