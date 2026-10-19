/**
 * "Ask Arun": BM25 keyword retrieval over the portfolio content.
 * Runs entirely in the browser; no network calls.
 */
const STOPWORDS = new Set(
  "a an and are as at be been by can could do does did for from has have how i in is it its me my of on or our please show tell the their there this to was what when where which who why will with would you your any some based know".split(" "),
);

// Query-side expansion so natural questions reach the right section.
const SYNONYMS = {
  hire: ["contact", "message"],
  hiring: ["contact", "message"],
  email: ["contact", "message"],
  mail: ["contact", "message"],
  reach: ["contact", "message"],
  call: ["contact"],
  phone: ["contact"],
  talk: ["contact"],
  connect: ["contact", "linkedin"],
  college: ["education", "btech"],
  university: ["education", "btech"],
  degree: ["education", "btech"],
  study: ["education", "coursework"],
  studying: ["education", "coursework"],
  graduate: ["education", "graduation"],
  school: ["education", "secondary"],
  grade: ["cgpa", "percentage"],
  marks: ["percentage", "cgpa"],
  gpa: ["cgpa"],
  stack: ["tools", "skills"],
  tech: ["tools", "skills"],
  technology: ["tools", "skills"],
  technologies: ["tools", "skills"],
  framework: ["fastapi", "next"],
  best: ["featured"],
  top: ["featured"],
  favorite: ["featured"],
  proud: ["featured"],
  experience: ["projects", "built"],
  work: ["projects"],
  built: ["projects"],
  test: ["testing", "coverage"],
  quality: ["testing", "coverage"],
  reliable: ["reliability"],
  llm: ["rag", "langchain"],
  genai: ["generative", "llm"],
  chatbot: ["assistant", "rag"],
  vision: ["computer", "detection"],
  cv: ["vision", "detection"],
  image: ["vision"],
  video: ["footage", "vision"],
  cert: ["certificates"],
  certification: ["certificates"],
  certified: ["certificates"],
  course: ["certificates", "coursework"],
  courses: ["certificates", "coursework"],
  deploy: ["docker", "deployment"],
  cloud: ["docker", "deployment"],
  database: ["databases", "postgresql"],
  db: ["databases"],
  where: ["location", "coimbatore"],
  location: ["coimbatore"],
  based: ["coimbatore"],
  who: ["profile", "summary"],
  about: ["profile"],
};

export function stem(word) {
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 5 && word.endsWith("ing")) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith("ed")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

function words(text) {
  return text.toLowerCase().replace(/b\.tech/g, "btech").split(/[^a-z0-9+]+/).filter(Boolean);
}

export function tokenize(text) {
  return words(text)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w))
    .map(stem);
}

/** Returns weighted query terms: original words count fully, synonyms partially. */
export function expandQuery(query) {
  const weights = new Map();
  const add = (term, weight) => weights.set(term, Math.max(weights.get(term) ?? 0, weight));
  for (const word of words(query)) {
    for (const synonym of SYNONYMS[word] ?? []) for (const term of tokenize(synonym)) add(term, 0.6);
    if (word.length > 1 && !STOPWORDS.has(word)) add(stem(word), 1);
  }
  return weights;
}

/** Builds searchable documents from the portfolio sections. */
export function buildDocs(sections) {
  const docs = [];
  for (const section of sections) {
    if (section.id === "extras") continue;
    if (section.id === "certificates") {
      docs.push({
        title: "Certificates",
        text: `Certificates: ${section.entries.map((e) => `${e.issuer} - ${e.title}`).join("; ")}.`,
        keywords: "certificates certificate certification courses",
        hash: "#certificates/0",
      });
      continue;
    }
    if (section.id === "contact") {
      docs.push({
        title: "Contact",
        text: "Write me a message right here: Contact > Write message on this phone. You can also connect on LinkedIn or browse code on GitHub.",
        keywords: "contact message email hire reach linkedin github connect",
        hash: "#app/message",
      });
      continue;
    }
    section.entries.forEach((entry, index) => {
      if (entry.topics) {
        entry.topics.forEach((topic, t) => {
          docs.push({
            title: `${entry.shortTitle} > ${topic.title}`,
            text: topic.paragraphs.join(" "),
            keywords: `${entry.shortTitle} ${entry.title} ${topic.keywords ?? ""}`,
            hash: `#${section.id}/${entry.id}/0/topic-${t}`,
          });
        });
        docs.push({
          title: `${entry.shortTitle} > Tools`,
          text: `Tools: ${entry.tools.join(", ")}.`,
          keywords: `${entry.shortTitle} tools stack`,
          hash: `#${section.id}/${entry.id}/0/topic-${entry.topics.length}`,
        });
      } else {
        docs.push({
          title: `${section.title} > ${entry.shortTitle}`,
          text: entry.paragraphs.join(" "),
          keywords: `${section.title} ${entry.title} ${entry.keywords ?? ""}`,
          hash: `#${section.id}/${entry.id}/0`,
          boost: entry.boost,
        });
      }
    });
  }
  return docs;
}

export function createIndex(docs) {
  const rows = docs.map((doc) => {
    const terms = tokenize(`${doc.title} ${doc.text} ${doc.keywords ?? ""}`);
    const tf = new Map();
    for (const term of terms) tf.set(term, (tf.get(term) ?? 0) + 1);
    return { doc, tf, length: terms.length };
  });
  const df = new Map();
  for (const row of rows) for (const term of row.tf.keys()) df.set(term, (df.get(term) ?? 0) + 1);
  const avgLength = rows.reduce((sum, row) => sum + row.length, 0) / Math.max(1, rows.length);
  return { rows, df, avgLength };
}

export function search(index, query, limit = 3, { k1 = 1.2, b = 0.75, minScore = 0.8 } = {}) {
  const terms = expandQuery(query);
  const total = index.rows.length;
  return index.rows
    .map((row) => {
      let score = 0;
      for (const [term, weight] of terms) {
        const tf = row.tf.get(term);
        if (!tf) continue;
        const df = index.df.get(term);
        const idf = Math.log(1 + (total - df + 0.5) / (df + 0.5));
        score += weight * idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * row.length) / index.avgLength)));
      }
      return { doc: row.doc, score: score * (row.doc.boost ?? 1) };
    })
    .filter((result) => result.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
