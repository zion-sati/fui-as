import * as ui from "../bindings/ui";
import { LoadedEventArgs, onLoadedWith } from "../core/FrameScheduler";
import { error } from "../core/Logger";
import { Node } from "../core/Node";
import { FontFace, FontFamily, FontStack, FontStyle, FontWeight, FontsLoadedEventArgs } from "../core/Typography";
import { TextAlign, TextOverflow, TextVerticalAlign, Unit } from "../core/ffi";
import { RichText, RichTextSpan } from "../nodes/RichText";
import { Text } from "../nodes/Text";

export class TextLayoutReadyEventArgs {
  readonly layout: TextLayout;

  constructor(layout: TextLayout) {
    this.layout = layout;
  }
}

export type TextLayoutReadyHandler<Owner> = (owner: Owner, event: TextLayoutReadyEventArgs) => void;

export class TextMetrics {
  constructor(
    readonly width: f32 = 0.0,
    readonly height: f32 = 0.0,
    readonly baseline: f32 = 0.0,
    readonly lineCount: i32 = 0,
    readonly maxLineWidth: f32 = 0.0,
  ) {}
}

class TextLayoutReadyCallback {
  constructor(
    private readonly layout: TextLayout,
    private readonly callback: (event: TextLayoutReadyEventArgs) => void,
  ) {}

  handleReady(): void {
    onLoadedWith<TextLayoutReadyCallback>(this, handleTextLayoutLoaded);
  }

  handleLoaded(): void {
    this.layout._ensureBuiltForReady();
    FontFace.whenFontsLoadedWith<TextLayoutReadyCallback>(
      this.layout._requiredFontIdsForReady(),
      this,
      handleTextLayoutFontsReady,
    );
  }

  handleFontsReady(): void {
    this.layout._prepareNow();
    this.callback(new TextLayoutReadyEventArgs(this.layout));
  }
}

class TextLayoutReadyHandlerAction<Owner> {
  constructor(
    private readonly layout: TextLayout,
    private readonly owner: Owner,
    private readonly handler: TextLayoutReadyHandler<Owner>,
  ) {}

  handleReady(): void {
    onLoadedWith<TextLayoutReadyHandlerAction<Owner>>(
      this,
      (action: TextLayoutReadyHandlerAction<Owner>, _event: LoadedEventArgs): void => {
        action.handleLoaded();
      },
    );
  }

  handleLoaded(): void {
    this.layout._ensureBuiltForReady();
    FontFace.whenFontsLoadedWith<TextLayoutReadyHandlerAction<Owner>>(
      this.layout._requiredFontIdsForReady(),
      this,
      (action: TextLayoutReadyHandlerAction<Owner>, _event: FontsLoadedEventArgs): void => {
        action.handleFontsReady();
      },
    );
  }

  handleFontsReady(): void {
    this.layout._prepareNow();
    this.handler(this.owner, new TextLayoutReadyEventArgs(this.layout));
  }
}

function handleTextLayoutReady(callback: TextLayoutReadyCallback): void {
  callback.handleReady();
}

function handleTextLayoutLoaded(callback: TextLayoutReadyCallback, _event: LoadedEventArgs): void {
  callback.handleLoaded();
}

function handleTextLayoutFontsReady(callback: TextLayoutReadyCallback, _event: FontsLoadedEventArgs): void {
  callback.handleFontsReady();
}

/**
 * Immediate-mode formatted text resource.
 *
 * Stage 3 backs this with the existing retained text preparation pipeline so it
 * shares HarfBuzz shaping, fallback fonts, RichText style runs, and core glyph
 * rendering with `Text`/`RichText`.
 */
export class TextLayout {
  private readonly nodeValue: Text;
  private readyValue: bool = false;
  private metricsValue: TextMetrics = new TextMetrics();

  constructor(text: string = "", node: Text | null = null) {
    this.nodeValue = node === null ? new Text(text) : changetype<Text>(node);
  }

  static text(text: string): TextLayout {
    return new TextLayout(text);
  }

  static rich(fragments: Array<RichTextSpan>): TextLayout {
    return new TextLayout("", new RichText(fragments));
  }

  get isReady(): bool {
    return this.readyValue;
  }

  /** @internal */
  _drawNode(): Node {
    this.ensureBuilt();
    return this.nodeValue;
  }

  /** @internal */
  _prepareNow(): void {
    this.ensureBuilt();
    const prepared = ui.prepareNode(this.nodeValue.builtHandle);
    if (prepared == 0) {
      this.readyValue = false;
      this.metricsValue = new TextMetrics();
      return;
    }
    const metrics = ui.tryGetTextMetrics(this.nodeValue.builtHandle);
    if (metrics === null) {
      this.metricsValue = new TextMetrics();
    } else {
      this.metricsValue = new TextMetrics(
        unchecked(metrics[0]),
        unchecked(metrics[1]),
        unchecked(metrics[2]),
        <i32>unchecked(metrics[3]),
        unchecked(metrics[4]),
      );
    }
    this.readyValue = true;
  }

  measure(): TextMetrics {
    if (!this.readyValue) {
      error("TextLayout", "TextLayout.measure() called before the TextLayout was ready; register onReady/onReadyWith and measure after the callback.");
      return new TextMetrics();
    }
    return this.metricsValue;
  }

  get measuredWidth(): f32 {
    return this.measure().width;
  }

  get measuredHeight(): f32 {
    return this.measure().height;
  }

  onReady(callback: (event: TextLayoutReadyEventArgs) => void): this {
    const ready = new TextLayoutReadyCallback(this, callback);
    handleTextLayoutReady(ready);
    return this;
  }

  onReadyWith<Owner>(owner: Owner, handler: TextLayoutReadyHandler<Owner>): this {
    const ready = new TextLayoutReadyHandlerAction<Owner>(this, owner, handler);
    ready.handleReady();
    return this;
  }

  text(value: string): this {
    this.nodeValue.text(value);
    this.markDirty();
    return this;
  }

  width(value: f32, unit: Unit = Unit.Pixel): this {
    this.nodeValue.width(value, unit);
    this.markDirty();
    return this;
  }

  height(value: f32, unit: Unit = Unit.Pixel): this {
    this.nodeValue.height(value, unit);
    this.markDirty();
    return this;
  }

  fontStack(stack: FontStack, size: f32): this {
    this.nodeValue.fontStack(stack, size);
    this.markDirty();
    return this;
  }

  fontFamily(family: FontFamily): this {
    this.nodeValue.fontFamily(family);
    this.markDirty();
    return this;
  }

  fontWeight(weight: FontWeight): this {
    this.nodeValue.fontWeight(weight);
    this.markDirty();
    return this;
  }

  fontStyle(style: FontStyle): this {
    this.nodeValue.fontStyle(style);
    this.markDirty();
    return this;
  }

  fontSize(size: f32): this {
    this.nodeValue.fontSize(size);
    this.markDirty();
    return this;
  }

  lineHeight(px: f32): this {
    this.nodeValue.lineHeight(px);
    this.markDirty();
    return this;
  }

  color(color: u32): this {
    this.nodeValue.textColor(color);
    this.markDirty();
    return this;
  }

  textColor(color: u32): this {
    return this.color(color);
  }

  textAlign(align: TextAlign): this {
    this.nodeValue.textAlign(align);
    this.markDirty();
    return this;
  }

  verticalAlign(align: TextVerticalAlign): this {
    this.nodeValue.verticalAlign(align);
    this.markDirty();
    return this;
  }

  maxLines(lines: i32): this {
    this.nodeValue.maxLines(lines);
    this.markDirty();
    return this;
  }

  textLimits(maxChars: i32, maxLines: i32): this {
    this.nodeValue.textLimits(maxChars, maxLines);
    this.markDirty();
    return this;
  }

  wrap(flag: bool = true): this {
    this.nodeValue.wrapping(flag);
    this.markDirty();
    return this;
  }

  wrapping(flag: bool = true): this {
    return this.wrap(flag);
  }

  overflow(mode: TextOverflow): this {
    this.nodeValue.overflow(mode);
    this.markDirty();
    return this;
  }

  private ensureBuilt(): void {
    this.nodeValue.build();
  }

  /** @internal */
  _ensureBuiltForReady(): void {
    this.ensureBuilt();
  }

  /** @internal */
  _requiredFontIdsForReady(): Array<u32> {
    return this.nodeValue._requiredFontIds();
  }

  private markDirty(): void {
    this.readyValue = false;
    this.metricsValue = new TextMetrics();
  }
}
