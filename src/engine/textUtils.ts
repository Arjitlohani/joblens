/** Small text helpers shared by the engine modules. */

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

export function wordCount(text: string): number {
  const t = text.trim();
  return t === '' ? 0 : t.split(/\s+/).length;
}

/** Split a posting into lines, treating bullet markers as line starts. */
export function toLines(text: string): string[] {
  return text
    .split(/\r?\n|(?=\s[•▪‣·-]\s)/)
    .map((l) => l.replace(/^\s*[•▪‣·*-]+\s*/, '').trim())
    .filter((l) => l.length > 0);
}

/**
 * Whole-word/phrase test against normalized text. Escapes the needle, so it
 * is safe for phrases containing regex metacharacters (e.g. "c++").
 */
export function containsPhrase(normalizedText: string, phrase: string): boolean {
  const escaped = phrase.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i');
  return re.test(normalizedText);
}

/** First phrase from the list found in the text, for use as evidence. */
export function firstPhraseFound(
  normalizedText: string,
  phrases: string[],
): string | undefined {
  return phrases.find((p) => containsPhrase(normalizedText, p));
}
