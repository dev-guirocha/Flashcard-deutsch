export function normalizePt(input: string) {
  const s = (input || "")
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:()"'“”‘’]/g, " ")
    .replace(/\s+/g, " ");

  // remove leading PT articles
  return s.replace(/^(o|a|os|as|um|uma|uns|umas)\s+/i, "").trim();
}

export function normalizeDe(input: string) {
  const s = (input || "")
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:()"'“”‘’]/g, " ")
    .replace(/\s+/g, " ");

  // accept ß == ss
  return s.replace(/ß/g, "ss").trim();
}
