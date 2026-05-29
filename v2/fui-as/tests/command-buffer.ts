export function decodeFloat32(word: number): number {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setUint32(0, word >>> 0, true);
  return view.getFloat32(0, true);
}

export interface GlyphRunSnapshot {
  readonly handle: bigint;
  readonly fontId: number;
  readonly glyphCount: number;
  readonly xPositions: readonly number[];
  readonly yPositions: readonly number[];
}

export interface BoundsSnapshot {
  readonly handle: bigint;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface HighlightSnapshot {
  readonly handle: bigint;
  readonly color: number;
  readonly rectCount: number;
}

export interface CaretSnapshot {
  readonly handle: bigint;
  readonly x: number;
  readonly y: number;
  readonly height: number;
  readonly color: number;
  readonly lastInteractionMs: number;
}

export function parseGlyphRuns(words: readonly number[]): GlyphRunSnapshot[] {
  const runs: GlyphRunSnapshot[] = [];
  for (let index = 0; index < words.length;) {
    const opcode = words[index];
    if (opcode === 40) {
      const glyphCount = words[index + 6] ?? 0;
      const low = BigInt(words[index + 1] ?? 0);
      const high = BigInt(words[index + 2] ?? 0);
      const xPositions: number[] = [];
      const yPositions: number[] = [];
      for (let glyphIndex = 0; glyphIndex < glyphCount; glyphIndex += 1) {
        const base = index + 7 + (glyphIndex * 4);
        xPositions.push(decodeFloat32(words[base + 1] ?? 0));
        yPositions.push(decodeFloat32(words[base + 2] ?? 0));
      }
      runs.push({
        handle: (high << 32n) | low,
        fontId: words[index + 3] ?? 0,
        glyphCount,
        xPositions,
        yPositions,
      });
      index += 7 + (glyphCount * 4);
      continue;
    }

    if (opcode === 1 || opcode === 2) {
      index += 3;
      continue;
    }
    if (opcode === 10) {
      index += 16;
      continue;
    }
    if (opcode === 20) {
      index += 13;
      continue;
    }
    if (opcode === 30 || opcode === 33) {
      index += 5;
      continue;
    }
    if (opcode === 31) {
      index += 8;
      continue;
    }
    if (opcode === 41) {
      index += 4;
      continue;
    }
    if (opcode === 42) {
      index += 8;
      continue;
    }
    if (opcode === 43) {
      index += 5 + ((words[index + 4] ?? 0) * 4);
      continue;
    }
    if (opcode === 98) {
      index += 2 + ((words[index + 1] ?? 0) * 2);
      continue;
    }
    if (opcode === 99) {
      index += 2 + ((words[index + 1] ?? 0) * 3);
      continue;
    }

    break;
  }

  return runs;
}

export function parseBounds(words: readonly number[]): BoundsSnapshot[] {
  const bounds: BoundsSnapshot[] = [];

  for (let index = 0; index < words.length;) {
    const opcode = words[index];
    if (opcode === 10) {
      const low = BigInt(words[index + 1] ?? 0);
      const high = BigInt(words[index + 2] ?? 0);
      bounds.push({
        handle: (high << 32n) | low,
        x: decodeFloat32(words[index + 3] ?? 0),
        y: decodeFloat32(words[index + 4] ?? 0),
        width: decodeFloat32(words[index + 5] ?? 0),
        height: decodeFloat32(words[index + 6] ?? 0),
      });
      index += 16;
      continue;
    }

    if (opcode === 1 || opcode === 2) {
      index += 3;
      continue;
    }
    if (opcode === 20) {
      index += 13;
      continue;
    }
    if (opcode === 30 || opcode === 33) {
      index += 5;
      continue;
    }
    if (opcode === 31) {
      index += 8;
      continue;
    }
    if (opcode === 40) {
      index += 7 + ((words[index + 6] ?? 0) * 4);
      continue;
    }
    if (opcode === 41) {
      index += 4;
      continue;
    }
    if (opcode === 42) {
      index += 8;
      continue;
    }
    if (opcode === 43) {
      index += 5 + ((words[index + 4] ?? 0) * 4);
      continue;
    }
    if (opcode === 98) {
      index += 2 + ((words[index + 1] ?? 0) * 2);
      continue;
    }
    if (opcode === 99) {
      index += 2 + ((words[index + 1] ?? 0) * 3);
      continue;
    }

    break;
  }

  return bounds;
}

export function parseHighlights(words: readonly number[]): HighlightSnapshot[] {
  const highlights: HighlightSnapshot[] = [];

  for (let index = 0; index < words.length;) {
    const opcode = words[index];
    if (opcode === 43) {
      const low = BigInt(words[index + 1] ?? 0);
      const high = BigInt(words[index + 2] ?? 0);
      const rectCount = words[index + 4] ?? 0;
      highlights.push({
        handle: (high << 32n) | low,
        color: words[index + 3] ?? 0,
        rectCount,
      });
      index += 5 + (rectCount * 4);
      continue;
    }

    if (opcode === 1 || opcode === 2) {
      index += 3;
      continue;
    }
    if (opcode === 10) {
      index += 16;
      continue;
    }
    if (opcode === 20) {
      index += 13;
      continue;
    }
    if (opcode === 30 || opcode === 33) {
      index += 5;
      continue;
    }
    if (opcode === 31) {
      index += 8;
      continue;
    }
    if (opcode === 40) {
      index += 7 + ((words[index + 6] ?? 0) * 4);
      continue;
    }
    if (opcode === 41) {
      index += 4;
      continue;
    }
    if (opcode === 42) {
      index += 8;
      continue;
    }
    if (opcode === 98) {
      index += 2 + ((words[index + 1] ?? 0) * 2);
      continue;
    }
    if (opcode === 99) {
      index += 2 + ((words[index + 1] ?? 0) * 3);
      continue;
    }

    break;
  }

  return highlights;
}

export function parseCarets(words: readonly number[]): CaretSnapshot[] {
  const carets: CaretSnapshot[] = [];

  for (let index = 0; index < words.length;) {
    const opcode = words[index];
    if (opcode === 42) {
      const low = BigInt(words[index + 1] ?? 0);
      const high = BigInt(words[index + 2] ?? 0);
      carets.push({
        handle: (high << 32n) | low,
        x: decodeFloat32(words[index + 3] ?? 0),
        y: decodeFloat32(words[index + 4] ?? 0),
        height: decodeFloat32(words[index + 5] ?? 0),
        color: words[index + 6] ?? 0,
        lastInteractionMs: words[index + 7] ?? 0,
      });
      index += 8;
      continue;
    }

    if (opcode === 1 || opcode === 2) {
      index += 3;
      continue;
    }
    if (opcode === 10) {
      index += 16;
      continue;
    }
    if (opcode === 20) {
      index += 13;
      continue;
    }
    if (opcode === 30 || opcode === 33) {
      index += 5;
      continue;
    }
    if (opcode === 31) {
      index += 8;
      continue;
    }
    if (opcode === 40) {
      index += 7 + ((words[index + 6] ?? 0) * 4);
      continue;
    }
    if (opcode === 41) {
      index += 4;
      continue;
    }
    if (opcode === 43) {
      index += 5 + ((words[index + 4] ?? 0) * 4);
      continue;
    }
    if (opcode === 98) {
      index += 2 + ((words[index + 1] ?? 0) * 2);
      continue;
    }
    if (opcode === 99) {
      index += 2 + ((words[index + 1] ?? 0) * 3);
      continue;
    }

    break;
  }

  return carets;
}
