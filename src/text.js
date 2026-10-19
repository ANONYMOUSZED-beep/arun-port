/** Text layout helpers for the 84 x 48 LCD (19 characters per line, 4 lines per page). */
export const LINE_CHARS = 19;
export const LINES_PER_PAGE = 4;

/** Word-wraps text into pages of lines. */
export function wrapWords(text, width = LINE_CHARS, perPage = LINES_PER_PAGE) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines = [];
  let line = "";
  for (let word of words) {
    if (line && line.length + word.length + 1 > width) {
      lines.push(line);
      line = "";
    }
    while (word.length > width) {
      lines.push(word.slice(0, width));
      word = word.slice(width);
    }
    if (word) line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  const pages = [];
  for (let i = 0; i < lines.length; i += perPage) pages.push(lines.slice(i, i + perPage));
  return pages.length ? pages : [[""]];
}

/** Wraps text while it is being typed: breaks at the last space, keeps trailing spaces. */
export function wrapChars(text, width = LINE_CHARS) {
  const lines = [];
  let line = "";
  for (const char of text) {
    line += char;
    if (line.length <= width) continue;
    const cut = line.lastIndexOf(" ", width);
    if (cut > 0) {
      lines.push(line.slice(0, cut));
      line = line.slice(cut + 1);
    } else {
      lines.push(line.slice(0, width));
      line = line.slice(width);
    }
  }
  lines.push(line);
  return lines;
}
