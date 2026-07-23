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

// For input with no explicit question markers at all: each question has its
// options marked by bare A/B/C/D letter lines, in that order. Some pastes
// repeat the letter after the option's content (open + close, e.g.
// "A\ntext\nA"), others only mark it once ("A\ntext"). Whichever shape it is,
// option D is always followed by exactly one content line (every real
// example seen has single-line option content). So as soon as D's marker is
// seen, the cut point for "everything after this belongs to the NEXT
// question" is known immediately: right after that one content line (pushed
// one further if a closing "D" duplicate follows it). Crucially, this cut
// point is recorded THEN, not when the next "A" eventually turns up -
// otherwise the next question's stem (which appears BEFORE its own "A"
// marker) ends up trapped at the tail of the previous block instead of at
// the head of its own.
const OPTION_SEQUENCE = ["A", "B", "C", "D"];

function splitByOptionSequence(text: string): string[] {
  const lines = text.split("\n");
  const blocks: string[] = [];
  let start = 0;
  let expectedIndex = 0;
  let lastLabel: string | null = null;
  let sawFirstA = false;
  let pendingCut: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!BARE_OPTION_LETTER_LINE.test(trimmed)) continue;

    if (trimmed === lastLabel) {
      // Closing repeat of the option marker just opened.
      if (trimmed === "D" && pendingCut === i) {
        pendingCut = i + 1;
      }
      continue;
    }

    if (trimmed === OPTION_SEQUENCE[expectedIndex]) {
      if (trimmed === "A" && sawFirstA) {
        const cutAt = pendingCut ?? i;
        const block = lines.slice(start, cutAt).join("\n").trim();
        if (block) blocks.push(block);
        start = cutAt;
      }
      if (trimmed === "A") sawFirstA = true;
      if (trimmed === "D") {
        pendingCut = i + 2; // the "D" line itself, plus its one content line
      }
      lastLabel = trimmed;
      expectedIndex = (expectedIndex + 1) % OPTION_SEQUENCE.length;
    }
    // A bare letter that doesn't fit the expected sequence is just content
    // (e.g. a stray "C" before "B" has appeared) - leave it alone.
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

  const autoBlocks = splitByOptionSequence(text);
  if (autoBlocks.length > 1) return autoBlocks;

  return markerBlocks;
}
