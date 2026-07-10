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
const loadedFontIds: Array<u32> = new Array<u32>();

function absI32(value: i32): i32 {
  return value < 0 ? -value : value;
}

function allocateDynamicFontId(): u32 {
  const allocated = nextDynamicFontId;
  nextDynamicFontId += 1;
  return allocated;
}

export class FontFaceLoadedEventArgs {
  readonly font: FontFace;
  readonly fontId: u32;

  constructor(fontId: u32) {
    this.fontId = fontId;
    this.font = FontFace._fromId(fontId);
  }
}

export class FontsLoadedEventArgs {
  readonly fontIds: Array<u32>;

  constructor(fontIds: Array<u32>) {
    this.fontIds = fontIds;
  }
}

export class FontStackLoadedEventArgs {
  readonly stack: FontStack;
  readonly fontIds: Array<u32>;

  constructor(stack: FontStack, fontIds: Array<u32>) {
    this.stack = stack;
    this.fontIds = fontIds;
  }
}

export type FontLoadedHandler<Owner> = (owner: Owner, event: FontFaceLoadedEventArgs) => void;
export type FontReadyHandler<Owner> = (owner: Owner, event: FontsLoadedEventArgs) => void;
export type FontStackLoadedHandler<Owner> = (owner: Owner, event: FontStackLoadedEventArgs) => void;

abstract class FontLoadedRegistration {
  abstract invoke(fontId: u32): void;
}

abstract class FontReadyRegistration {
  abstract invoke(): void;
}

// Callback wrappers — AS can't nest function types in generics
class FontLoadedCallback extends FontLoadedRegistration {
  constructor(
    readonly fontId: u32,
    readonly cb: (event: FontFaceLoadedEventArgs) => void,
  ) {
    super();
  }

  invoke(_fontId: u32): void {
    this.cb(new FontFaceLoadedEventArgs(this.fontId));
  }
}

class FontReadyCallback extends FontReadyRegistration {
  constructor(
    private readonly fontIds: Array<u32>,
    readonly cb: (event: FontsLoadedEventArgs) => void,
  ) {
    super();
  }

  invoke(): void {
    this.cb(new FontsLoadedEventArgs(this.fontIds));
  }
}

class FontReadyHandlerRegistration<Owner> extends FontReadyRegistration {
  constructor(
    private readonly fontIds: Array<u32>,
    private readonly owner: Owner,
    private readonly handler: FontReadyHandler<Owner>,
  ) {
    super();
  }

  invoke(): void {
    this.handler(this.owner, new FontsLoadedEventArgs(this.fontIds));
  }
}

class FontLoadedHandlerRegistration<Owner> extends FontLoadedRegistration {
  constructor(
    private readonly fontId: u32,
    private readonly owner: Owner,
    private readonly handler: FontLoadedHandler<Owner>,
  ) {
    super();
  }

  invoke(_fontId: u32): void {
    this.handler(this.owner, new FontFaceLoadedEventArgs(this.fontId));
  }
}

class FontStackLoadedCallback extends FontReadyRegistration {
  constructor(
    private readonly stack: FontStack,
    private readonly cb: (event: FontStackLoadedEventArgs) => void,
  ) {
    super();
  }

  invoke(): void {
    this.cb(new FontStackLoadedEventArgs(this.stack, this.stack.requiredFontIds()));
  }
}

class FontStackLoadedHandlerRegistration<Owner> extends FontReadyRegistration {
  constructor(
    private readonly stack: FontStack,
    private readonly owner: Owner,
    private readonly handler: FontStackLoadedHandler<Owner>,
  ) {
    super();
  }

  invoke(): void {
    this.handler(this.owner, new FontStackLoadedEventArgs(this.stack, this.stack.requiredFontIds()));
  }
}

class FontLoadBarrierCallback extends FontLoadedRegistration {
  constructor(private readonly barrier: FontLoadBarrier) {
    super();
  }

  invoke(_fontId: u32): void {
    this.barrier.notify();
  }
}

class FontLoadBarrier {
  private done: bool = false;

  constructor(
    private readonly fontIds: Array<u32>,
    private readonly callback: FontReadyRegistration,
  ) {}

  notify(): void {
    if (this.done) {
      return;
    }
    if (!areFontIdsLoaded(this.fontIds)) {
      return;
    }
    this.done = true;
    this.callback.invoke();
  }
}

function isPreloadedBuiltInFont(fontId: u32): bool {
  return fontId >= 1 && fontId <= 6;
}

function pushUniqueFontId(fontIds: Array<u32>, fontId: u32): void {
  if (fontId == 0) {
    return;
  }
  for (let index = 0; index < fontIds.length; ++index) {
    if (unchecked(fontIds[index]) == fontId) {
      return;
    }
  }
  fontIds.push(fontId);
}

function markFontLoaded(fontId: u32): void {
  pushUniqueFontId(loadedFontIds, fontId);
}

function normalizeFontIds(fontIds: Array<u32>): Array<u32> {
  const unique = new Array<u32>();
  for (let index = 0; index < fontIds.length; ++index) {
    pushUniqueFontId(unique, unchecked(fontIds[index]));
  }
  return unique;
}

function areFontIdsLoaded(fontIds: Array<u32>): bool {
  for (let index = 0; index < fontIds.length; ++index) {
    if (!FontFace.isLoaded(unchecked(fontIds[index]))) {
      return false;
    }
  }
  return true;
}

export class FontFace {
  private static readonly registrations: Array<FontLoadedRegistration> = new Array();
  private static readonly regFontIds: Array<u32> = new Array();

  constructor(readonly id: u32) {}

  /** @internal */
  static _fromId(id: u32): FontFace {
    return new FontFace(id);
  }

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

  onLoaded(callback: (event: FontFaceLoadedEventArgs) => void): this {
    if (FontFace.isLoaded(this.id)) {
      callback(new FontFaceLoadedEventArgs(this.id));
      return this;
    }
    FontFace.registrations.push(new FontLoadedCallback(this.id, callback));
    FontFace.regFontIds.push(this.id);
    return this;
  }

  onLoadedWith<Owner>(owner: Owner, handler: FontLoadedHandler<Owner>): this {
    FontFace.whenLoadedWith<Owner>(this.id, owner, handler);
    return this;
  }

  isLoaded(): bool {
    return FontFace.isLoaded(this.id);
  }

  static isLoaded(fontId: u32): bool {
    if (fontId == 0 || isPreloadedBuiltInFont(fontId)) {
      return true;
    }
    for (let index = 0; index < loadedFontIds.length; ++index) {
      if (unchecked(loadedFontIds[index]) == fontId) {
        return true;
      }
    }
    return false;
  }

  static whenLoaded(fontId: u32, callback: (event: FontFaceLoadedEventArgs) => void): void {
    if (FontFace.isLoaded(fontId)) {
      callback(new FontFaceLoadedEventArgs(fontId));
      return;
    }
    FontFace.registrations.push(new FontLoadedCallback(fontId, callback));
    FontFace.regFontIds.push(fontId);
  }

  static whenLoadedWith<Owner>(fontId: u32, owner: Owner, handler: FontLoadedHandler<Owner>): void {
    if (FontFace.isLoaded(fontId)) {
      handler(owner, new FontFaceLoadedEventArgs(fontId));
      return;
    }
    FontFace.registrations.push(new FontLoadedHandlerRegistration<Owner>(fontId, owner, handler));
    FontFace.regFontIds.push(fontId);
  }

  static whenFontsLoaded(fontIds: Array<u32>, callback: (event: FontsLoadedEventArgs) => void): void {
    const uniqueFontIds = normalizeFontIds(fontIds);
    FontFace.whenFontsLoadedWithRegistration(uniqueFontIds, new FontReadyCallback(uniqueFontIds, callback));
  }

  static whenFontsLoadedWith<Owner>(fontIds: Array<u32>, owner: Owner, callback: FontReadyHandler<Owner>): void {
    const uniqueFontIds = normalizeFontIds(fontIds);
    FontFace.whenFontsLoadedWithRegistration(uniqueFontIds, new FontReadyHandlerRegistration<Owner>(uniqueFontIds, owner, callback));
  }

  static whenFontsLoadedFor<Owner>(fontIds: Array<u32>, owner: Owner, callback: FontReadyHandler<Owner>): void {
    FontFace.whenFontsLoadedWith<Owner>(fontIds, owner, callback);
  }

  private static whenFontsLoadedWithRegistration(fontIds: Array<u32>, callback: FontReadyRegistration): void {
    const uniqueFontIds = fontIds;
    if (areFontIdsLoaded(uniqueFontIds)) {
      callback.invoke();
      return;
    }
    const barrier = new FontLoadBarrier(uniqueFontIds, callback);
    for (let index = 0; index < uniqueFontIds.length; ++index) {
      const fontId = unchecked(uniqueFontIds[index]);
      if (FontFace.isLoaded(fontId)) {
        continue;
      }
      FontFace.registrations.push(new FontLoadBarrierCallback(barrier));
      FontFace.regFontIds.push(fontId);
    }
  }

  /** @internal */
  static _dispatchFontLoaded(fontId: u32): void {
    markFontLoaded(fontId);
    for (let i = 0; i < FontFace.regFontIds.length; i++) {
      if (unchecked(FontFace.regFontIds[i]) == fontId) {
        unchecked(FontFace.registrations[i]).invoke(fontId);
      }
    }
  }
}

export class FontStack {
  readonly id: u32;
  private readonly fallbackIds: Array<u32> = new Array<u32>();

  constructor(readonly face: FontFace) {
    this.id = face.id;
  }

  /** @internal */
  static _fromId(id: u32): FontStack {
    return new FontStack(FontFace._fromId(id));
  }

  static load(url: string, id: u32 = allocateDynamicFontId()): FontStack {
    return new FontStack(FontFace.load(url, id));
  }

  load(url: string): this {
    if (url.length == 0) {
      warn("Typography", "FontStack.load() received an empty font URL.");
    }
    ui.loadFont(this.id, url);
    return this;
  }

  /** @internal */
  _fallbackId(fontId: u32): this {
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

  fallback(face: FontFace): this {
    return this._fallbackId(face.id);
  }

  fallbackFace(face: FontFace): this {
    return this.fallback(face);
  }

  fallbackStack(stack: FontStack): this {
    return this._fallbackId(stack.id);
  }

  fallbackLoaded(url: string, fontId: u32 = allocateDynamicFontId()): this {
    if (url.length == 0) {
      warn("Typography", "FontStack.fallbackLoaded() received an empty font URL.");
    }
    ui.loadFont(fontId, url);
    return this._fallbackId(fontId);
  }

  requiredFontIds(): Array<u32> {
    const fontIds = new Array<u32>();
    pushUniqueFontId(fontIds, this.id);
    for (let index = 0; index < this.fallbackIds.length; ++index) {
      pushUniqueFontId(fontIds, unchecked(this.fallbackIds[index]));
    }
    return fontIds;
  }

  isLoaded(): bool {
    return areFontIdsLoaded(this.requiredFontIds());
  }

  onLoaded(callback: (event: FontStackLoadedEventArgs) => void): this {
    FontFace.whenFontsLoadedWithRegistration(this.requiredFontIds(), new FontStackLoadedCallback(this, callback));
    return this;
  }

  onLoadedWith<Owner>(owner: Owner, handler: FontStackLoadedHandler<Owner>): this {
    FontFace.whenFontsLoadedWithRegistration(this.requiredFontIds(), new FontStackLoadedHandlerRegistration<Owner>(this, owner, handler));
    return this;
  }
}

export class FontFamily {
  constructor(
    readonly regularStack: FontStack,
    readonly boldStack: FontStack | null = null,
    readonly italicStack: FontStack | null = null,
    readonly boldItalicStack: FontStack | null = null,
    readonly mediumStack: FontStack | null = null,
    readonly mediumItalicStack: FontStack | null = null,
    readonly semiboldStack: FontStack | null = null,
    readonly semiboldItalicStack: FontStack | null = null,
  ) {}

  get regular(): u32 {
    return this.regularStack.id;
  }

  get bold(): u32 {
    return this.boldStack !== null ? changetype<FontStack>(this.boldStack).id : 0;
  }

  get italic(): u32 {
    return this.italicStack !== null ? changetype<FontStack>(this.italicStack).id : 0;
  }

  get boldItalic(): u32 {
    return this.boldItalicStack !== null ? changetype<FontStack>(this.boldItalicStack).id : 0;
  }

  get medium(): u32 {
    return this.mediumStack !== null ? changetype<FontStack>(this.mediumStack).id : 0;
  }

  get mediumItalic(): u32 {
    return this.mediumItalicStack !== null ? changetype<FontStack>(this.mediumItalicStack).id : 0;
  }

  get semibold(): u32 {
    return this.semiboldStack !== null ? changetype<FontStack>(this.semiboldStack).id : 0;
  }

  get semiboldItalic(): u32 {
    return this.semiboldItalicStack !== null ? changetype<FontStack>(this.semiboldItalicStack).id : 0;
  }

  /** @internal */
  static _fromIds(
    regular: u32,
    bold: u32 = 0,
    italic: u32 = 0,
    boldItalic: u32 = 0,
    medium: u32 = 0,
    mediumItalic: u32 = 0,
    semibold: u32 = 0,
    semiboldItalic: u32 = 0,
  ): FontFamily {
    return new FontFamily(
      FontStack._fromId(regular),
      bold != 0 ? FontStack._fromId(bold) : null,
      italic != 0 ? FontStack._fromId(italic) : null,
      boldItalic != 0 ? FontStack._fromId(boldItalic) : null,
      medium != 0 ? FontStack._fromId(medium) : null,
      mediumItalic != 0 ? FontStack._fromId(mediumItalic) : null,
      semibold != 0 ? FontStack._fromId(semibold) : null,
      semiboldItalic != 0 ? FontStack._fromId(semiboldItalic) : null,
    );
  }

  static withRegular(regular: FontStack): FontFamily {
    return new FontFamily(regular);
  }

  static withRegularStack(regular: FontStack): FontFamily {
    return new FontFamily(regular);
  }

  static withRegularFace(regular: FontFace): FontFamily {
    return new FontFamily(new FontStack(regular));
  }

  static regularBold(regular: FontStack, bold: FontStack): FontFamily {
    return new FontFamily(regular, bold);
  }

  static regularBoldStacks(regular: FontStack, bold: FontStack): FontFamily {
    return new FontFamily(regular, bold);
  }

  requiredFontIds(): Array<u32> {
    const fontIds = new Array<u32>();
    pushUniqueFontId(fontIds, this.regular);
    pushUniqueFontId(fontIds, this.bold);
    pushUniqueFontId(fontIds, this.italic);
    pushUniqueFontId(fontIds, this.boldItalic);
    pushUniqueFontId(fontIds, this.medium);
    pushUniqueFontId(fontIds, this.mediumItalic);
    pushUniqueFontId(fontIds, this.semibold);
    pushUniqueFontId(fontIds, this.semiboldItalic);
    return fontIds;
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
