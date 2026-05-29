import { activeTheme } from "../core/Theme";
import { warn } from "../core/Logger";
import { FontFamily, FontStack, FontStyle, FontWeight } from "../core/Typography";
import { Text } from "./Text";

export class RichTextSpan {
  private static readonly DECORATION_UNDERLINE: u32 = 1;
  private static readonly DECORATION_STRIKETHROUGH: u32 = 2;

  private readonly value: string;
  private hasColorValue: bool = false;
  private colorValue: u32 = 0;
  private hasBackgroundColorValue: bool = false;
  private backgroundColorValue: u32 = 0;
  private decorationFlags: u32 = 0;
  private hasFontFamilyValue: bool = false;
  private fontFamilyValue: FontFamily | null = null;
  private hasFontSizeValue: bool = false;
  private fontSizeValue: f32 = 0.0;
  private hasFontWeightValue: bool = false;
  private fontWeightValue: FontWeight = FontWeight.Regular;
  private hasFontStyleValue: bool = false;
  private fontStyleValue: FontStyle = FontStyle.Normal;

  constructor(text: string) {
    this.value = text;
  }

  get text(): string {
    return this.value;
  }

  color(color: u32): this {
    this.hasColorValue = true;
    this.colorValue = color;
    return this;
  }

  bgColor(color: u32): this {
    this.hasBackgroundColorValue = true;
    this.backgroundColorValue = color;
    return this;
  }

  underline(): this {
    this.decorationFlags |= RichTextSpan.DECORATION_UNDERLINE;
    return this;
  }

  strikethrough(): this {
    this.decorationFlags |= RichTextSpan.DECORATION_STRIKETHROUGH;
    return this;
  }

  fontFamily(family: FontFamily): this {
    this.hasFontFamilyValue = true;
    this.fontFamilyValue = family;
    return this;
  }

  fontSize(size: f32): this {
    this.hasFontSizeValue = true;
    this.fontSizeValue = size;
    return this;
  }

  fontWeight(weight: FontWeight): this {
    this.hasFontWeightValue = true;
    this.fontWeightValue = weight;
    return this;
  }

  fontStyle(style: FontStyle): this {
    this.hasFontStyleValue = true;
    this.fontStyleValue = style;
    return this;
  }

  bold(): this {
    return this.fontWeight(FontWeight.Bold);
  }

  italic(): this {
    return this.fontStyle(FontStyle.Italic);
  }

  _hasColor(): bool {
    return this.hasColorValue;
  }

  _colorOr(defaultColor: u32): u32 {
    return this.hasColorValue ? this.colorValue : defaultColor;
  }

  _resolvedFontSize(defaultSize: f32): f32 {
    return this.hasFontSizeValue ? this.fontSizeValue : defaultSize;
  }

  _hasBackgroundColor(): bool {
    return this.hasBackgroundColorValue;
  }

  _backgroundColorOr(defaultColor: u32): u32 {
    return this.hasBackgroundColorValue ? this.backgroundColorValue : defaultColor;
  }

  _decorationFlags(): u32 {
    return this.decorationFlags;
  }

  _hasFontFamily(): bool {
    return this.hasFontFamilyValue;
  }

  _hasFontWeight(): bool {
    return this.hasFontWeightValue;
  }

  _hasFontStyle(): bool {
    return this.hasFontStyleValue;
  }

  _fontFamilyOr(defaultFamily: FontFamily): FontFamily {
    return this.hasFontFamilyValue && this.fontFamilyValue !== null
      ? changetype<FontFamily>(this.fontFamilyValue)
      : defaultFamily;
  }

  _fontWeightOr(defaultWeight: FontWeight): FontWeight {
    return this.hasFontWeightValue ? this.fontWeightValue : defaultWeight;
  }

  _fontStyleOr(defaultStyle: FontStyle): FontStyle {
    return this.hasFontStyleValue ? this.fontStyleValue : defaultStyle;
  }
}

export class Span extends RichTextSpan {
  constructor(text: string) {
    super(text);
  }
}

export function span(text: string): RichTextSpan {
  return new Span(text);
}

const STYLE_RUN_WORD_STRIDE: i32 = 7;

export class RichText extends Text {
  private hasBaseFontValue: bool = false;
  private baseUsesDirectFontId: bool = false;
  private baseFontIdValue: u32 = 0;
  private baseFontFamilyValue: FontFamily | null = null;
  private hasBaseFontSizeValue: bool = false;
  private baseFontSizeValue: f32 = 0.0;
  private hasBaseFontWeightValue: bool = false;
  private baseFontWeightValue: FontWeight = FontWeight.Regular;
  private hasBaseFontStyleValue: bool = false;
  private baseFontStyleValue: FontStyle = FontStyle.Normal;
  private hasBaseColorValue: bool = false;
  private baseColorValue: u32 = 0;
  private fragments: Array<RichTextSpan> = new Array<RichTextSpan>();

  constructor(fragments: Array<RichTextSpan> = new Array<RichTextSpan>()) {
    super("");
    this.fragmentsValue(fragments);
  }

  fragmentsValue(fragments: Array<RichTextSpan>): this {
    this.fragments.length = 0;
    for (let i = 0; i < fragments.length; ++i) {
      this.fragments.push(unchecked(fragments[i]));
    }
    this.rebuildAttributedText();
    return this;
  }

  font(fontId: u32, size: f32): this {
    this.hasBaseFontValue = true;
    this.baseUsesDirectFontId = true;
    this.baseFontIdValue = fontId;
    this.baseFontFamilyValue = null;
    this.hasBaseFontSizeValue = true;
    this.baseFontSizeValue = size;
    if (fontId == 0) {
      warn("Typography", "RichText.font() received font id 0; the text will render with the default font fallback.");
    }
    this.rebuildAttributedText();
    return this;
  }

  fontStack(stack: FontStack, size: f32): this {
    return this.font(stack.id, size);
  }

  fontFamily(family: FontFamily): this {
    this.hasBaseFontValue = true;
    this.baseUsesDirectFontId = false;
    this.baseFontFamilyValue = family;
    this.rebuildAttributedText();
    return this;
  }

  fontWeight(weight: FontWeight): this {
    this.hasBaseFontValue = true;
    this.baseFontWeightValue = weight;
    this.hasBaseFontWeightValue = true;
    this.rebuildAttributedText();
    return this;
  }

  fontStyle(style: FontStyle): this {
    this.hasBaseFontValue = true;
    this.baseFontStyleValue = style;
    this.hasBaseFontStyleValue = true;
    this.rebuildAttributedText();
    return this;
  }

  fontSize(size: f32): this {
    this.hasBaseFontValue = true;
    this.baseFontSizeValue = size;
    this.hasBaseFontSizeValue = true;
    this.rebuildAttributedText();
    return this;
  }

  textColor(color: u32): this {
    this.baseColorValue = color;
    this.hasBaseColorValue = true;
    this.rebuildAttributedText();
    return this;
  }

  push(fragment: RichTextSpan): this {
    this.fragments.push(fragment);
    this.rebuildAttributedText();
    return this;
  }

  static fromText(text: string): RichText {
    return new RichText([span(text)]);
  }

  text(content: string): this {
    return this.fragmentsValue([span(content)]);
  }

  private rebuildAttributedText(): void {
    const fonts = activeTheme.value.fonts;
    const defaultFamily = this.baseFontFamilyValue !== null ? changetype<FontFamily>(this.baseFontFamilyValue) : fonts.bodyFamily;
    const defaultWeight = this.hasBaseFontWeightValue ? this.baseFontWeightValue : FontWeight.Regular;
    const defaultStyle = this.hasBaseFontStyleValue ? this.baseFontStyleValue : FontStyle.Normal;
    const defaultSize = this.hasBaseFontSizeValue ? this.baseFontSizeValue : fonts.sizeBody;
    const defaultColor = this.hasBaseColorValue ? this.baseColorValue : activeTheme.value.colors.textPrimary;
    if (this.hasBaseFontValue || this.fragments.length > 0) {
      if (this.baseUsesDirectFontId) {
        super.font(this.baseFontIdValue, defaultSize);
      } else {
        super.font(
          defaultFamily.resolve(defaultWeight, defaultStyle),
          defaultSize,
        );
      }
    }
    super.textColor(defaultColor);
    let merged = "";
    for (let i = 0; i < this.fragments.length; ++i) {
      merged += unchecked(this.fragments[i]).text;
    }
    super.text(merged);
    if (this.fragments.length === 0) {
      this.setTextStyleRunsWords(null);
      return;
    }
    const words = new Uint32Array(this.fragments.length * STYLE_RUN_WORD_STRIDE);
    let byteOffset: i32 = 0;
    for (let i = 0; i < this.fragments.length; ++i) {
      const piece = unchecked(this.fragments[i]);
      const pieceBytes = String.UTF8.encode(piece.text, false).byteLength;
      const start = byteOffset;
      const end = byteOffset + pieceBytes;
      const base = i * STYLE_RUN_WORD_STRIDE;
      const pieceFamily = piece._hasFontFamily() ? piece._fontFamilyOr(defaultFamily) : defaultFamily;
      const pieceWeight = piece._fontWeightOr(defaultWeight);
      const pieceStyle = piece._fontStyleOr(defaultStyle);
      const resolvedFontId = this.baseUsesDirectFontId && !piece._hasFontFamily()
       ? this.baseFontIdValue
       : pieceFamily.resolve(pieceWeight, pieceStyle);
      if (resolvedFontId == 0) {
       warn(
         "Typography",
         "RichText fragment resolved font id 0 for bytes " +
           start.toString() +
           ".." +
           end.toString() +
           "; check the configured FontFamily or font id.",
       );
      }
      words[base] = <u32>start;
      words[base + 1] = <u32>end;
      words[base + 2] = <u32>resolvedFontId;
      words[base + 3] = reinterpret<u32>(piece._resolvedFontSize(defaultSize));
      words[base + 4] = piece._colorOr(defaultColor);
      words[base + 5] = piece._backgroundColorOr(0);
      words[base + 6] = piece._decorationFlags();
      byteOffset = end;
    }
    this.setTextStyleRunsWords(words);
  }
}
