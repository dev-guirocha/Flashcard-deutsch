// build_seed.mjs
import fs from "fs/promises";

const WIKI_API = "https://en.wiktionary.org/w/api.php";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params) {
  const url = new URL(WIKI_API);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}
async function apiWithRetry(params, { tries = 6 } = {}) {
  let wait = 500;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await api(params);
      return res;
    } catch (e) {
      const msg = String(e?.message || e);
      if (!msg.includes("HTTP 429")) throw e;
      await sleep(wait);
      wait = Math.min(wait * 2, 8000);
    }
  }
  throw new Error("HTTP 429 persistente após retries");
}

// Para páginas de lista (subtitles), precisamos do HTML renderizado
async function getRenderedHtml(title) {
  const data = await api({
    action: "parse",
    format: "json",
    formatversion: "2",
    page: title,
    prop: "text",
    redirects: "1",
    origin: "*",
  });
  return data?.parse?.text || null;
}

// Para verbetes (Haus, sein etc), wikitext do revision é ok
async function getWikitext(title) {
  const data = await api({
    action: "query",
    format: "json",
    formatversion: "2",
    prop: "revisions",
    rvprop: "content",
    rvslots: "main",
    titles: title,
    redirects: "1",
    origin: "*",
  });

  const page = data?.query?.pages?.[0];
  const content = page?.revisions?.[0]?.slots?.main?.content;
  return content || null;
}
async function getWikitextBatch(titles) {
  // titles: array de strings (até 50)
  const data = await apiWithRetry({
    action: "query",
    format: "json",
    formatversion: "2",
    prop: "revisions",
    rvprop: "content",
    rvslots: "main",
    titles: titles.join("|"),
    redirects: "1",
    origin: "*",
  });

  const pages = data?.query?.pages || [];
  const map = new Map();

  for (const p of pages) {
    const title = p?.title;
    const content = p?.revisions?.[0]?.slots?.main?.content || null;
    if (title) map.set(title, content);
  }

  return map; // Map<title, wikitext|null>
}

/**
 * Parser robusto:
 * - pega HTML renderizado
 * - remove tags
 * - colapsa whitespace
 * - extrai padrões:
 *   "1002. Habe 94 habe Habe haben Habe"
 *   rank. surface occurrences forms... lemma
 *
 * A heurística: lemma = ÚLTIMO "token de palavra" do trecho.
 */
function parseFrequencyListFromHtml(html) {
  // 1) remove scripts/styles
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  // 2) remove tags -> espaço (não \n), pra não quebrar padrões
  text = text.replace(/<[^>]+>/g, " ");

  // 3) entidades comuns
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");

  // 4) colapsa whitespace
  text = text.replace(/\s+/g, " ").trim();

  const items = [];
  // Regex global:
  // (rank). (surface) (occurrences) (rest...) até antes do próximo rank.
  // O "rest" vai conter forms + lemma forms.
  const re = /(?:^|\s)(\d{1,4})\.\s+([^\s]+)\s+(\d+)\s+(.+?)(?=(?:\s\d{1,4}\.\s)|$)/g;

  let m;
  while ((m = re.exec(text)) !== null) {
    const rank = parseInt(m[1], 10);
    if (rank < 1 || rank > 2000) continue;

    const surface = m[2].trim();
    const rest = m[4].trim();

    // Heurística do lemma:
    // pega o último token que parece "palavra" (inclui letras, ß, äöü, hífen)
    const tokens = rest.split(" ").filter(Boolean);

    // pega o último token "limpo"
    let lemma = surface;
    for (let i = tokens.length - 1; i >= 0; i--) {
      const t = tokens[i].replace(/[^\p{L}ßäöüÄÖÜ\-']/gu, "");
      if (t && /[\p{L}]/u.test(t)) {
        lemma = t;
        break;
      }
    }

    items.push({ rank, word: surface, lemma });
  }

  // dedup por rank
  const byRank = new Map();
  for (const it of items) if (!byRank.has(it.rank)) byRank.set(it.rank, it);

  return [...byRank.values()].sort((a, b) => a.rank - b.rank);
}

function sliceGermanSection(wt) {
  const start = wt.indexOf("==German==");
  if (start === -1) return null;
  const rest = wt.slice(start + "==German==".length);
  const end = rest.search(/\n==[^=]/);
  return end === -1 ? rest : rest.slice(0, end);
}

function detectPos(germanSection) {
  const headings = [...germanSection.matchAll(/\n===\s*([^=\n]+?)\s*===\s*\n/g)].map(
    (m) => m[1].trim()
  );
  const h = headings.find(Boolean);
  if (!h) return "OTHER";

  const x = h.toLowerCase();
  if (x.includes("noun")) return "NOUN";
  if (x.includes("verb")) return "VERB";
  if (x.includes("adjective")) return "ADJ";
  if (x.includes("adverb")) return "ADV";
  if (x.includes("pronoun")) return "PRON";
  if (x.includes("determiner") || x.includes("article")) return "DET";
  if (x.includes("preposition") || x.includes("postposition")) return "ADP";
  if (x.includes("conjunction")) return "CONJ";
  if (x.includes("numeral")) return "NUM";
  if (x.includes("particle")) return "PART";
  if (x.includes("interjection")) return "INTJ";
  return "OTHER";
}

function extractGender(germanSection) {
  const m = germanSection.match(/{{\s*de-noun\s*\|\s*([mfn])\s*[\|}]/i);
  if (m) return m[1].toLowerCase();

  const m2 = germanSection.match(/gender\s*=\s*([mfn])/i);
  if (m2) return m2[1].toLowerCase();

  return null;
}

function extractTranslations(germanSection, lang) {
  const found = [];
  const re = new RegExp(`{{\\s*t\\+?\\s*\\|\\s*${lang}\\s*\\|\\s*([^|\\}]+)(?:\\|[^}]*)?}}`, "gi");
  let m;
  while ((m = re.exec(germanSection)) !== null) {
    const term = m[1].trim();
    if (term && !found.includes(term)) found.push(term);
    if (found.length >= 5) break;
  }
  return found;
}

function extractDefinitionGloss(germanSection) {
  const lines = germanSection.split("\n");
  for (const line of lines) {
    if (!line.startsWith("#")) continue;
    if (line.startsWith("#:") || line.startsWith("#*") || line.startsWith("#;")) continue;
    let s = line.replace(/^#\s*/, "");
    // remove templates
    s = s.replace(/{{[^}]+}}/g, " ");
    // replace wiki links
    s = s.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2");
    s = s.replace(/\[\[([^\]]+)\]\]/g, "$1");
    // remove bold/italic markup
    s = s.replace(/''+/g, "");
    // collapse whitespace
    s = s.replace(/\s+/g, " ").trim();
    if (s) return s;
  }
  return "";
}

function cleanWikiText(s) {
  return (s || "")
    .replace(/{{[^}]+}}/g, " ")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/''+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractExample(germanSection) {
  const m = germanSection.match(/{{\s*uxi?\s*\|\s*de\s*\|[\s\S]*?}}/i);
  if (!m) return { exampleDe: "", exampleGloss: "" };
  const inner = m[0].replace(/^\{\{|\}\}$/g, "").trim();
  const parts = inner.split("|");
  const deRaw = parts[2] || "";
  let glossRaw = "";
  for (const p of parts) {
    if (p.startsWith("t=")) {
      glossRaw = p.slice(2);
      break;
    }
    if (p.startsWith("translation=")) {
      glossRaw = p.slice("translation=".length);
      break;
    }
  }
  return {
    exampleDe: cleanWikiText(deRaw),
    exampleGloss: cleanWikiText(glossRaw),
  };
}

function genderToArticle(g) {
  if (g === "m") return "der";
  if (g === "f") return "die";
  if (g === "n") return "das";
  return null;
}

async function enrichOne({ surface, lemma, rank }) {
  const wt = await getWikitext(lemma);
  if (!wt) return { ok: false, reason: "no_wikitext" };

  const deSec = sliceGermanSection(wt);
  if (!deSec) return { ok: false, reason: "no_german_section" };

  const pos = detectPos(deSec);
  const gender = pos === "NOUN" ? extractGender(deSec) : null;
  const article = pos === "NOUN" ? genderToArticle(gender) : null;
  const pt = extractTranslations(deSec, "pt");

  // Você quer “com artigo” (alemão). Então:
  // - surface mantém conversa (ist/bin/sind etc)
  // - lemma guarda forma base
  // - para NOUN, usamos artigo + lemma (mais estável do que article + surface)
  const deWithArticle = article ? `${article} ${lemma}` : undefined;

  return {
    ok: true,
    word: {
      id: rank,
      de: surface, // conversação
      lemma,
      pt: pt[0] || "",
      pos,
      rank,
      gender: gender || undefined,
      article: article || undefined,
      deWithArticle,
      aliasesPt: pt.slice(1),
      aliasesDe: [],
      tags: [],
    },
  };
}

async function run() {
  const list1Title = "Wiktionary:Frequency lists/German_subtitles_1000";
  const list2Title = "Wiktionary:Frequency lists/German_subtitles_1001-2000";

  console.log("Baixando HTML renderizado das listas...");
  const html1 = await getRenderedHtml(list1Title);
  const html2 = await getRenderedHtml(list2Title);

  if (!html1 || !html2) {
    throw new Error("Não consegui baixar HTML renderizado das listas.");
  }

  // Debug opcional: descomenta se continuar 0
  // await fs.writeFile("debug_list1.html", html1, "utf-8");
  // await fs.writeFile("debug_list2.html", html2, "utf-8");

  const a = parseFrequencyListFromHtml(html1);
  const b = parseFrequencyListFromHtml(html2);

  const base = [...a, ...b]
    .filter((x) => x.rank >= 1 && x.rank <= 2000)
    .sort((x, y) => x.rank - y.rank)
    .map((x) => ({
      rank: x.rank,
      surface: x.word || x.lemma,
      lemma: x.lemma || x.word,
    }));

  const byRank = new Map();
  for (const it of base) if (!byRank.has(it.rank)) byRank.set(it.rank, it);
  const list = [...byRank.values()].sort((x, y) => x.rank - y.rank);

  console.log(`Lista base: ${list.length} itens`);

  await fs.writeFile("words_base_2000.json", JSON.stringify(list, null, 2), "utf-8");

  if (list.length === 0) {
    throw new Error(
      "Parser não encontrou itens. Descomente o debug_list*.html e me mande 5 linhas do HTML com ranks."
    );
  }

  console.log("Enriquecendo (POS + PT → fallback EN) em batch...");
  const out = [];
  const missing = [];

  // Dedup de lemmas pra reduzir chamadas (muitos ranks repetem o mesmo lemma: sein, haben, etc.)
  const lemmaSet = new Set(list.map((x) => x.lemma));
  const uniqueLemmas = [...lemmaSet];

  // Baixa wikitext de lemmas em lotes de 50
  const lemmaToWikitext = new Map();
  for (let i = 0; i < uniqueLemmas.length; i += 50) {
    const chunk = uniqueLemmas.slice(i, i + 50);
    const m = await getWikitextBatch(chunk);
    for (const [k, v] of m.entries()) lemmaToWikitext.set(k, v);
    await sleep(200); // bem leve, só pra não irritar o servidor
  }

  // Agora monta os 2000 itens usando o wikitext do lemma
  for (const { rank, lemma, surface } of list) {
    const wt = lemmaToWikitext.get(lemma) || null;
    if (!wt) {
      missing.push({ rank, surface, lemma, reason: "no_wikitext" });
      continue;
    }

    const deSec = sliceGermanSection(wt);
    if (!deSec) {
      missing.push({ rank, surface, lemma, reason: "no_german_section" });
      continue;
    }

    const pos = detectPos(deSec);
    const gender = pos === "NOUN" ? extractGender(deSec) : null;
    const article = pos === "NOUN" ? genderToArticle(gender) : null;

    // PT primeiro, se não tiver PT pega EN
    const ptList = extractTranslations(deSec, "pt");
    const enList = ptList.length ? [] : extractTranslations(deSec, "en");
    let gloss = ptList[0] || enList[0] || "";
    if (!gloss) gloss = extractDefinitionGloss(deSec);
    const { exampleDe, exampleGloss } = extractExample(deSec);

    out.push({
      id: rank,
      de: surface, // mantém ist/bin/sind etc
      lemma,
      pt: ptList[0] || "",
      en: enList[0] || "",
      gloss,
      exampleDe: exampleDe || undefined,
      exampleGloss: exampleGloss || undefined,
      pos,
      rank,
      gender: gender || undefined,
      article: article || undefined,
      deWithArticle: article ? `${article} ${lemma}` : undefined,
      aliasesPt: ptList.slice(1),
      aliasesEn: enList.slice(1),
      aliasesDe: [],
      tags: [],
    });
  }

  out.sort((a, b) => a.rank - b.rank);

  await fs.writeFile("words_v1.json", JSON.stringify(out, null, 2), "utf-8");
  await fs.writeFile("missing_report.json", JSON.stringify(missing, null, 2), "utf-8");

  console.log("✅ Gerado: words_v1.json");
  console.log("⚠️ Report: missing_report.json");
  console.log(`OK: ${out.length} | Missing: ${missing.length}`);
}

run().catch((e) => {
  console.error("ERRO:", e);
  process.exit(1);
});
