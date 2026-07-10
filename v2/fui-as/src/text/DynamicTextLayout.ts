import * as ui from "../bindings/ui";
import { TextOverflow } from "../core/ffi";
import { FontFamily, FontStack, FontStyle, FontWeight } from "../core/Typography";
import { TextAlign, TextVerticalAlign, Unit } from "../core/ffi";
import { TextLayout, TextLayoutReadyEventArgs, TextLayoutReadyHandler } from "./TextLayout";

export enum DynamicTextOverflow {
  Reject = 0,
  FallbackShape = 1,
}

export type DynamicTextLayoutReadyHandler<Owner> = TextLayoutReadyHandler<Owner>;

/**
 * Short, single-style text resource for labels that change frequently.
 *
 * Stage 4 keeps the public API and validation contract separate from the
 * retained text node backing used by `TextLayout`. A later core resource pass
 * can replace the backing without changing call sites.
 */
export class DynamicTextLayout extends TextLayout {
  private charsetValue: string = "";
  private overflowValue: DynamicTextOverflow = DynamicTextOverflow.FallbackShape;
  private currentTextValue: string = "";
  private numericMode: bool = false;
  private numericPrecisionValue: i32 = -1;
  private numericPrefixValue: string = "";
  private numericSuffixValue: string = "";
  private hasNumericValue: bool = false;
  private numericValue: f64 = 0.0;

  constructor(charset: string = "") {
    super("");
    this.charsetValue = charset;
  }

  static fixedCharset(charset: string): DynamicTextLayout {
    return new DynamicTextLayout(charset);
  }

  static numeric(): DynamicTextLayout {
    const layout = new DynamicTextLayout("0123456789.-");
    layout.numericMode = true;
    return layout;
  }

  get currentText(): string {
    return this.currentTextValue;
  }

  /** @internal */
  _prepareNow(): void {
    ui.setDynamicTextCharset(this._drawNode().builtHandle, this.charsetValue);
    super._prepareNow();
  }

  setText(value: string): bool {
    if (!this.supportsText(value)) {
      if (this.overflowValue == DynamicTextOverflow.Reject) {
        return false;
      }
    }
    const wasReady = this.isReady;
    this.currentTextValue = value;
    super.text(value);
    if (wasReady) {
      this._prepareNow();
    }
    return true;
  }

  overflow(mode: DynamicTextOverflow): this {
    this.overflowValue = mode;
    return this;
  }

  precision(digits: i32): this {
    this.numericMode = true;
    this.numericPrecisionValue = digits < 0 ? 0 : digits;
    this.refreshNumericText();
    return this;
  }

  prefix(value: string): this {
    this.numericMode = true;
    this.numericPrefixValue = value;
    this.includeInCharset(value);
    this.refreshNumericText();
    return this;
  }

  suffix(value: string): this {
    this.numericMode = true;
    this.numericSuffixValue = value;
    this.includeInCharset(value);
    this.refreshNumericText();
    return this;
  }

  setValue(value: f64): bool {
    this.numericMode = true;
    this.hasNumericValue = true;
    this.numericValue = value;
    return this.setText(this.composeNumericText(value));
  }

  textOverflow(mode: TextOverflow): this {
    super.overflow(mode);
    return this;
  }

  onReady(callback: (event: TextLayoutReadyEventArgs) => void): this {
    super.onReady(callback);
    return this;
  }

  onReadyWith<Owner>(owner: Owner, handler: TextLayoutReadyHandler<Owner>): this {
    super.onReadyWith<Owner>(owner, handler);
    return this;
  }

  width(value: f32, unit: Unit = Unit.Pixel): this {
    super.width(value, unit);
    return this;
  }

  height(value: f32, unit: Unit = Unit.Pixel): this {
    super.height(value, unit);
    return this;
  }

  fontStack(stack: FontStack, size: f32): this {
    super.fontStack(stack, size);
    return this;
  }

  fontFamily(family: FontFamily): this {
    super.fontFamily(family);
    return this;
  }

  fontWeight(weight: FontWeight): this {
    super.fontWeight(weight);
    return this;
  }

  fontStyle(style: FontStyle): this {
    super.fontStyle(style);
    return this;
  }

  fontSize(size: f32): this {
    super.fontSize(size);
    return this;
  }

  lineHeight(px: f32): this {
    super.lineHeight(px);
    return this;
  }

  color(color: u32): this {
    super.color(color);
    return this;
  }

  textColor(color: u32): this {
    super.textColor(color);
    return this;
  }

  textAlign(align: TextAlign): this {
    super.textAlign(align);
    return this;
  }

  verticalAlign(align: TextVerticalAlign): this {
    super.verticalAlign(align);
    return this;
  }

  maxLines(lines: i32): this {
    super.maxLines(lines);
    return this;
  }

  textLimits(maxChars: i32, maxLines: i32): this {
    super.textLimits(maxChars, maxLines);
    return this;
  }

  wrap(flag: bool = true): this {
    super.wrap(flag);
    return this;
  }

  wrapping(flag: bool = true): this {
    super.wrapping(flag);
    return this;
  }

  private supportsText(value: string): bool {
    if (this.charsetValue.length == 0) {
      return true;
    }
    for (let i = 0; i < value.length; i++) {
      if (!this.charsetContains(value.charCodeAt(i))) {
        return false;
      }
    }
    return true;
  }

  private charsetContains(code: i32): bool {
    for (let i = 0; i < this.charsetValue.length; i++) {
      if (this.charsetValue.charCodeAt(i) == code) {
        return true;
      }
    }
    return false;
  }

  private includeInCharset(value: string): void {
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      if (!this.charsetContains(code)) {
        this.charsetValue += value.charAt(i);
      }
    }
  }

  private refreshNumericText(): void {
    if (!this.numericMode || !this.hasNumericValue) {
      return;
    }
    this.setText(this.composeNumericText(this.numericValue));
  }

  private composeNumericText(value: f64): string {
    this.includeInCharset(this.numericPrefixValue);
    this.includeInCharset(this.numericSuffixValue);
    return this.numericPrefixValue + this.formatNumericValue(value) + this.numericSuffixValue;
  }

  private formatNumericValue(value: f64): string {
    if (value != value || !isFinite(value) || this.numericPrecisionValue < 0) {
      return value.toString();
    }

    let scale: i64 = 1;
    for (let i = 0; i < this.numericPrecisionValue; i++) {
      scale *= 10;
    }

    const negative = value < 0.0;
    const absValue = negative ? -value : value;
    const scaled = <i64>Math.round(absValue * <f64>scale);
    const whole = scaled / scale;
    const fraction = scaled % scale;

    let text = whole.toString();
    if (this.numericPrecisionValue > 0) {
      let fractionText = fraction.toString();
      while (fractionText.length < this.numericPrecisionValue) {
        fractionText = "0" + fractionText;
      }
      text += "." + fractionText;
    }

    if (negative) {
      text = "-" + text;
    }
    return text;
  }
}
