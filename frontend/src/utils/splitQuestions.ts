// The digit-based alternatives require a non-digit after the delimiter so a
// decimal number like "0.75" or "10.5" sitting alone on its own line (a very
// common shape for numeric MCQ options) is never mistaken for a "1." style
// question marker.
const QUESTION_START = /(?:^|\n)\s*(?:question\s*\d*[:.)]|q\.?\d+[:.)](?!\d)|\d+[:.)](?!\d))/gi;
const Q_NUMBER_PREFIX = /^q\.?\d+[:.)]\s*/i;
// Uppercase-only and on purpose: physics/math content is often a single
// lowercase letter (e.g. "a" for acceleration), which must never be mistaken
// for an option marker. Real option markers in this app are always A-D.
const BARE_OPTION_LETTER_LINE = /^[A-D]$/;

function splitByMarkers(text: string): string[] {
  const matches = [...text.matchAll(QUESTION_START)];
  if (matches.length === 0) return [text];

  const blocks: string[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index ?? 0;
    const end = i + 1 < matches.length ? (matches[i + 1].index as number) : text.length;
    const block = text.slice(start, end).trim().replace(Q_NUMBER_PREFIX, "");
    if (block) blocks.push(block);
  }
  return blocks;
}

// For input with no explicit question markers at all: each question repeats every
// option letter A-D once before its content and once again right after it (e.g. a
// line "D" opens option D, then its text, then a lone "D" line closes it). The second
// "D" line closes out the whole question — everything after it starts the next one.
function splitByRepeatedOptionLetters(text: string): string[] {
  const lines = text.split("\n");
  const blocks: string[] = [];
  let start = 0;
  let dCount = 0;

  for (let i = 0; i < lines.length; i++) {
    if (BARE_OPTION_LETTER_LINE.test(lines[i].trim()) && lines[i].trim().toUpperCase() === "D") {
      dCount++;
      if (dCount === 2) {
        const block = lines.slice(start, i + 1).join("\n").trim();
        if (block) blocks.push(block);
        start = i + 1;
        dCount = 0;
      }
    }
  }

  const remainder = lines.slice(start).join("\n").trim();
  if (remainder) blocks.push(remainder);

  return blocks;
}

export function splitQuestions(raw: string): string[] {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const markerBlocks = splitByMarkers(text);
  if (markerBlocks.length > 1) return markerBlocks;

  const autoBlocks = splitByRepeatedOptionLetters(text);
  if (autoBlocks.length > 1) return autoBlocks;

  return markerBlocks;
}
