import * as ui from "../bindings/ui";
import { warn } from "./Logger";

export enum FontStyle {
  Normal = 0,
  Italic = 1,
}

export enum FontWeight {
  Regular = 400,
  Medium = 500,
  Semibold = 600,
  Bold = 700,
}

const STYLE_MISMATCH_PENALTY: i32 = 1000;
const MAX_FONT_SCORE: i32 = 0x7fffffff;
const FIRST_DYNAMIC_FONT_ID: u32 = 1024;

let nextDynamicFontId: u32 = FIRST_DYNAMIC_FONT_ID;

function absI32(value: i32): i32 {
  return value < 0 ? -value : value;
}

function allocateDynamicFontId(): u32 {
  const allocated = nextDynamicFontId;
  nextDynamicFontId += 1;
  return allocated;
}

export class FontFace {
  constructor(readonly id: u32) {}

  static load(url: string, id: u32 = allocateDynamicFontId()): FontFace {
    return new FontFace(id).load(url);
  }

  load(url: string): this {
    if (url.length == 0) {
      warn("Typography", "FontFace.load() received an empty font URL.");
    }
    ui.loadFont(this.id, url);
    return this;
  }
}

export class FontStack {
  private readonly fallbackIds: Array<u32> = new Array<u32>();

  constructor(readonly id: u32) {}

  static load(url: string, id: u32 = allocateDynamicFontId()): FontStack {
    return new FontStack(id).load(url);
  }

  load(url: string): this {
    if (url.length == 0) {
      warn("Typography", "FontStack.load() received an empty font URL.");
    }
    ui.loadFont(this.id, url);
    return this;
  }

  fallback(fontId: u32): this {
    if (fontId == 0 || fontId == this.id) {
      warn(
        "Typography",
        "FontStack.fallback() ignored font id " + fontId.toString() + " for stack " + this.id.toString() + ".",
      );
      return this;
    }
    for (let index = 0; index < this.fallbackIds.length; ++index) {
      if (unchecked(this.fallbackIds[index]) == fontId) {
        return this;
      }
    }
    ui.registerFontFallback(this.id, fontId);
    this.fallbackIds.push(fontId);
    return this;
  }

  fallbackFace(face: FontFace): this {
    return this.fallback(face.id);
  }

  fallbackStack(stack: FontStack): this {
    return this.fallback(stack.id);
  }

  fallbackLoaded(url: string, fontId: u32 = allocateDynamicFontId()): this {
    if (url.length == 0) {
      warn("Typography", "FontStack.fallbackLoaded() received an empty font URL.");
    }
    ui.loadFont(fontId, url);
    return this.fallback(fontId);
  }
}

export class FontFamily {
  constructor(
    readonly regular: u32,
    readonly bold: u32 = 0,
    readonly italic: u32 = 0,
    readonly boldItalic: u32 = 0,
    readonly medium: u32 = 0,
    readonly mediumItalic: u32 = 0,
    readonly semibold: u32 = 0,
    readonly semiboldItalic: u32 = 0,
  ) {}

  static withRegular(regular: u32): FontFamily {
    return new FontFamily(regular);
  }

  static withRegularStack(regular: FontStack): FontFamily {
    return new FontFamily(regular.id);
  }

  static withRegularFace(regular: FontFace): FontFamily {
    return new FontFamily(regular.id);
  }

  static regularBold(regular: u32, bold: u32): FontFamily {
    return new FontFamily(regular, bold);
  }

  static regularBoldStacks(regular: FontStack, bold: FontStack): FontFamily {
    return new FontFamily(regular.id, bold.id);
  }

  resolve(weight: FontWeight = FontWeight.Regular, style: FontStyle = FontStyle.Normal): u32 {
    const targetWeight = <i32>weight;
    let bestId: u32 = 0;
    let bestScore: i32 = MAX_FONT_SCORE;
    let score = this.scoreCandidate(this.regular, FontWeight.Regular, FontStyle.Normal, targetWeight, style);
    if (score < bestScore) {
      bestScore = score;
      bestId = this.regular;
    }
    score = this.scoreCandidate(this.bold, FontWeight.Bold, FontStyle.Normal, targetWeight, style);
    if (score < bestScore) {
      bestScore = score;
      bestId = this.bold;
    }
    score = this.scoreCandidate(this.italic, FontWeight.Regular, FontStyle.Italic, targetWeight, style);
    if (score < bestScore) {
      bestScore = score;
      bestId = this.italic;
    }
    score = this.scoreCandidate(this.boldItalic, FontWeight.Bold, FontStyle.Italic, targetWeight, style);
    if (score < bestScore) {
      bestScore = score;
      bestId = this.boldItalic;
    }
    score = this.scoreCandidate(this.medium, FontWeight.Medium, FontStyle.Normal, targetWeight, style);
    if (score < bestScore) {
      bestScore = score;
      bestId = this.medium;
    }
    score = this.scoreCandidate(this.mediumItalic, FontWeight.Medium, FontStyle.Italic, targetWeight, style);
    if (score < bestScore) {
      bestScore = score;
      bestId = this.mediumItalic;
    }
    score = this.scoreCandidate(this.semibold, FontWeight.Semibold, FontStyle.Normal, targetWeight, style);
    if (score < bestScore) {
      bestScore = score;
      bestId = this.semibold;
    }
    score = this.scoreCandidate(this.semiboldItalic, FontWeight.Semibold, FontStyle.Italic, targetWeight, style);
    if (score < bestScore) {
      bestId = this.semiboldItalic;
    }
    if (bestId == 0) {
      warn(
        "Typography",
        "FontFamily.resolve() could not resolve a font face for weight " +
          (<i32>weight).toString() +
          " and style " +
          (<u32>style).toString() +
          "; the text will use font id 0.",
      );
    }
    return bestId;
  }

  private scoreCandidate(
    fontId: u32,
    weight: FontWeight,
    style: FontStyle,
    targetWeight: i32,
    targetStyle: FontStyle,
  ): i32 {
    if (fontId == 0) {
      return MAX_FONT_SCORE;
    }
    let score = absI32(<i32>weight - targetWeight);
    if (style != targetStyle) {
      score += STYLE_MISMATCH_PENALTY;
    }
    return score;
  }
}
