/**
 * Turn long model summaries into list / paragraphs for readable UI.
 * Handles newlines, " - " / " – " clause separators, and sentence chunking.
 */
export function splitLongInsightText(text) {
  const raw = String(text ?? "").trim();
  if (!raw) return { kind: "empty", items: [] };

  if (/\r?\n/.test(raw)) {
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const bulletPrefix = /^[-•*]\s+/;
    const bulletLike = lines.filter((l) => bulletPrefix.test(l)).length;
    if (lines.length >= 2 && bulletLike >= lines.length * 0.6) {
      return {
        kind: "bullets",
        items: lines.map((l) => l.replace(bulletPrefix, "").trim()).filter(Boolean),
      };
    }
    return { kind: "paragraphs", items: lines };
  }

  const singleLine = raw.replace(/\s+/g, " ").trim();

  const dashParts = singleLine.split(/\s[-–]\s/).map((s) => s.trim()).filter(Boolean);
  const dashOk =
    dashParts.length >= 3 &&
    dashParts.length <= 16 &&
    dashParts.every((p) => p.length >= 12 && p.length <= 420);

  if (dashOk) {
    return { kind: "bullets", items: dashParts };
  }

  const semiParts = singleLine.split(/\s*;\s+/).map((s) => s.trim()).filter(Boolean);
  const semiOk =
    semiParts.length >= 3 &&
    semiParts.length <= 18 &&
    semiParts.every((p) => p.length >= 14 && p.length <= 450);
  if (semiOk) {
    return { kind: "bullets", items: semiParts };
  }

  const sentences = singleLine.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean);
  if (sentences.length >= 5) {
    const chunkSize = sentences.length > 14 ? 2 : 3;
    const chunks = [];
    for (let i = 0; i < sentences.length; i += chunkSize) {
      chunks.push(sentences.slice(i, i + chunkSize).join(" "));
    }
    return { kind: "paragraphs", items: chunks };
  }

  if (sentences.length >= 2) {
    return { kind: "paragraphs", items: sentences };
  }

  return { kind: "plain", items: [singleLine] };
}
