import * as ui from "../bindings/ui";
import { HandlerAction } from "../core/Action";
import { Disposable, disposeAll } from "../core/Disposable";
import { PointerClickEventArgs, PointerEventArgs, Node, SelectionChangedEventArgs, TextChangedEventArgs } from "../core/Node";
import { warn } from "../core/Logger";
import { Theme, activeTheme } from "../core/Theme";
import { FontFamily, FontStack, FontStyle, FontWeight } from "../core/Typography";
import {
  CursorStyle,
  NodeType,
  TextAlign,
  TextOverflow,
  TextVerticalAlign,
  Unit,
} from "../core/ffi";

export class TextProps {
  content: string = "";
  widthValue: f32 = 0.0;
  widthUnit: Unit = Unit.Pixel;
  hasWidth: bool = false;
  hasFillWidth: bool = false;
  fillWidthPercentValue: f32 = 0.0;
  hasFillWidthPercent: bool = false;
  heightValue: f32 = 0.0;
  heightUnit: Unit = Unit.Pixel;
  hasHeight: bool = false;
  hasFillHeight: bool = false;
  fillHeightPercentValue: f32 = 0.0;
  hasFillHeightPercent: bool = false;
  minWidthValue: f32 = 0.0;
  minWidthUnit: Unit = Unit.Auto;
  hasMinWidth: bool = false;
  maxWidthValue: f32 = 0.0;
  maxWidthUnit: Unit = Unit.Auto;
  hasMaxWidth: bool = false;
  minHeightValue: f32 = 0.0;
  minHeightUnit: Unit = Unit.Auto;
  hasMinHeight: bool = false;
  maxHeightValue: f32 = 0.0;
  maxHeightUnit: Unit = Unit.Auto;
  hasMaxHeight: bool = false;
  fontId: u32 = 0;
  fontSize: f32 = 0.0;
  hasFont: bool = false;
  fontFamilyValue: FontFamily | null = null;
  hasFontFamily: bool = false;
  fontWeightValue: FontWeight = FontWeight.Regular;
  hasFontWeight: bool = false;
  fontStyleValue: FontStyle = FontStyle.Normal;
  hasFontStyle: bool = false;
  lineHeightValue: f32 = 0.0;
  hasLineHeight: bool = false;
  color: u32 = 0;
  hasColor: bool = false;
  textAlignValue: TextAlign = TextAlign.Left;
  hasTextAlign: bool = false;
  verticalAlignValue: TextVerticalAlign = TextVerticalAlign.Top;
  hasVerticalAlign: bool = false;
  maxChars: i32 = 2147483647;
  maxLines: i32 = 0;
  hasLimits: bool = false;
  wrappingValue: bool = true;
  hasWrapping: bool = false;
  overflowValue: TextOverflow = TextOverflow.Clip;
  hasOverflow: bool = false;
  overflowFadeHorizontalValue: bool = false;
  overflowFadeVerticalValue: bool = false;
  hasOverflowFade: bool = false;
  obscuredValue: bool = false;
  hasObscured: bool = false;
  editableValue: bool = false;
  hasEditable: bool = false;
  caretColorValue: u32 = 0;
  hasCaretColor: bool = false;
  selectableValue: bool = false;
  selectionColor: u32 = 0;
  hasSelectable: bool = false;
}

function utf8CodeUnitByteLength(codeUnit: u32): u32 {
  if (codeUnit <= 0x7F) {
    return 1;
  }
  if (codeUnit <= 0x7FF) {
    return 2;
  }
  return 3;
}

function utf8CodePointByteLength(codePoint: u32): u32 {
  if (codePoint <= 0x7F) {
    return 1;
  }
  if (codePoint <= 0x7FF) {
    return 2;
  }
  if (codePoint <= 0xFFFF) {
    return 3;
  }
  return 4;
}

function readCodePoint(text: string, index: i32): u32 {
  const first = <u32>text.charCodeAt(index);
  if (first < 0xD800 || first > 0xDBFF || index + 1 >= text.length) {
    return first;
  }
  const second = <u32>text.charCodeAt(index + 1);
  if (second < 0xDC00 || second > 0xDFFF) {
    return first;
  }
  return 0x10000 + ((first - 0xD800) << 10) + (second - 0xDC00);
}

function codePointStringLength(codePoint: u32): i32 {
  return codePoint > 0xFFFF ? 2 : 1;
}

function stringOffsetFromUtf8ByteOffset(text: string, byteOffset: u32): i32 {
  let bytes: u32 = 0;
  let cursor = 0;
  while (cursor < text.length) {
    const codePoint = readCodePoint(text, cursor);
    const byteLength = codePoint > 0xFFFF
      ? utf8CodePointByteLength(codePoint)
      : utf8CodeUnitByteLength(codePoint);
    if (bytes + byteLength > byteOffset) {
      break;
    }
    bytes += byteLength;
    cursor += codePointStringLength(codePoint);
  }
  return cursor;
}

export class TextCore extends Node {
  private contentValue: string;
  private widthValue: f32 = 0.0;
  private widthUnit: Unit = Unit.Pixel;
  private hasWidth: bool = false;
  private hasFillWidth: bool = false;
  private fillWidthPercentValue: f32 = 0.0;
  private hasFillWidthPercent: bool = false;
  private heightValue: f32 = 0.0;
  private heightUnit: Unit = Unit.Pixel;
  private hasHeight: bool = false;
  private hasFillHeight: bool = false;
  private fillHeightPercentValue: f32 = 0.0;
  private hasFillHeightPercent: bool = false;
  private minWidthValue: f32 = 0.0;
  private minWidthUnit: Unit = Unit.Auto;
  private hasMinWidth: bool = false;
  private maxWidthValue: f32 = 0.0;
  private maxWidthUnit: Unit = Unit.Auto;
  private hasMaxWidth: bool = false;
  private minHeightValue: f32 = 0.0;
  private minHeightUnit: Unit = Unit.Auto;
  private hasMinHeight: bool = false;
  private maxHeightValue: f32 = 0.0;
  private maxHeightUnit: Unit = Unit.Auto;
  private hasMaxHeight: bool = false;
  private fontId: u32 = 0;
  private fontSizeValue: f32 = 0.0;
  private hasFont: bool = false;
  private fontFamilyValue: FontFamily | null = null;
  private fontWeightValue: FontWeight = FontWeight.Regular;
  private fontStyleValue: FontStyle = FontStyle.Normal;
  private usesDirectFontId: bool = false;
  private lineHeightValue: f32 = 0.0;
  private hasLineHeight: bool = false;
  private color: u32 = 0;
  private hasColor: bool = false;
  private textAlignValue: TextAlign = TextAlign.Left;
  private hasTextAlign: bool = false;
  private verticalAlignValue: TextVerticalAlign = TextVerticalAlign.Top;
  private hasVerticalAlign: bool = false;
  private maxChars: i32 = 2147483647;
  private maxLinesValue: i32 = 0;
  private hasLimits: bool = false;
  private wrappingValue: bool = true;
  private hasWrapping: bool = false;
  private overflowValue: TextOverflow = TextOverflow.Clip;
  private hasOverflow: bool = false;
  private overflowFadeHorizontalValue: bool = false;
  private overflowFadeVerticalValue: bool = false;
  private hasOverflowFade: bool = false;
  private obscuredValue: bool = false;
  private hasObscured: bool = false;
  private editableValue: bool = false;
  private hasEditable: bool = false;
  private editorCommandKeysValue: bool = false;
  private hasEditorCommandKeys: bool = false;
  private editorAcceptsTabValue: bool = false;
  private hasEditorAcceptsTab: bool = false;
  private caretColorValue: u32 = 0;
  private hasCaretColor: bool = false;
  private selectableValue: bool = false;
  private selectionColor: u32 = 0;
  private hasSelectable: bool = false;
  private textChangedCb: ((event: TextChangedEventArgs) => void) | null = null;
  private selectionChangedCb: ((event: SelectionChangedEventArgs) => void) | null = null;
  private selectionStartValue: u32 = 0;
  private selectionEndValue: u32 = 0;
  private readonly disposables: Array<Disposable> = new Array<Disposable>();
  private usesThemeSelectionColor: bool = false;
  private textStyleRunsWords: Uint32Array | null = null;

  constructor(content: string = "") {
    super();
    this.contentValue = content;
    this.track(activeTheme.addAction(new HandlerAction<TextCore, Theme>(this, (text: TextCore, theme: Theme): void => {
      text.handleThemeChanged(theme);
    })));
  }

  get usesDefaultSelectionBehavior(): bool {
    return !this.hasSelectable;
  }

  get content(): string {
    return this.contentValue;
  }

  get isEditableText(): bool {
    return this.editableValue;
  }

  get isSelectableText(): bool {
    return this.selectableValue;
  }

  get selectionStart(): u32 {
    return this.selectionStartValue;
  }

  get selectionEnd(): u32 {
    return this.selectionEndValue;
  }

  width(value: f32, unit: Unit = Unit.Pixel): this {
    this.widthValue = value;
    this.widthUnit = unit;
    this.hasWidth = true;
    this.hasFillWidth = false;
    this.hasFillWidthPercent = false;
    if (this.hasBuiltHandle()) {
      ui.setWidth(this.handle, value, <u32>unit);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  height(value: f32, unit: Unit = Unit.Pixel): this {
    this.heightValue = value;
    this.heightUnit = unit;
    this.hasHeight = true;
    this.hasFillHeight = false;
    this.hasFillHeightPercent = false;
    if (this.hasBuiltHandle()) {
      ui.setHeight(this.handle, value, <u32>unit);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  fillWidth(): this {
    this.hasWidth = false;
    this.hasFillWidth = true;
    this.hasFillWidthPercent = false;
    if (this.hasBuiltHandle()) {
      ui.setFillWidth(this.handle, true);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  fillHeight(): this {
    this.hasHeight = false;
    this.hasFillHeight = true;
    this.hasFillHeightPercent = false;
    if (this.hasBuiltHandle()) {
      ui.setFillHeight(this.handle, true);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  fillWidthPercent(percent: f32): this {
    this.hasWidth = false;
    this.hasFillWidth = false;
    this.hasFillWidthPercent = true;
    this.fillWidthPercentValue = percent;
    if (this.hasBuiltHandle()) {
      ui.setFillWidthPercent(this.handle, percent);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  fillHeightPercent(percent: f32): this {
    this.hasHeight = false;
    this.hasFillHeight = false;
    this.hasFillHeightPercent = true;
    this.fillHeightPercentValue = percent;
    if (this.hasBuiltHandle()) {
      ui.setFillHeightPercent(this.handle, percent);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  minWidth(value: f32, unit: Unit = Unit.Pixel): this {
    this.minWidthValue = value;
    this.minWidthUnit = unit;
    this.hasMinWidth = unit != Unit.Auto;
    if (this.hasBuiltHandle()) {
      ui.setMinWidth(this.handle, value, <u32>unit);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  maxWidth(value: f32, unit: Unit = Unit.Pixel): this {
    this.maxWidthValue = value;
    this.maxWidthUnit = unit;
    this.hasMaxWidth = unit != Unit.Auto;
    if (this.hasBuiltHandle()) {
      ui.setMaxWidth(this.handle, value, <u32>unit);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  minHeight(value: f32, unit: Unit = Unit.Pixel): this {
    this.minHeightValue = value;
    this.minHeightUnit = unit;
    this.hasMinHeight = unit != Unit.Auto;
    if (this.hasBuiltHandle()) {
      ui.setMinHeight(this.handle, value, <u32>unit);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  maxHeight(value: f32, unit: Unit = Unit.Pixel): this {
    this.maxHeightValue = value;
    this.maxHeightUnit = unit;
    this.hasMaxHeight = unit != Unit.Auto;
    if (this.hasBuiltHandle()) {
      ui.setMaxHeight(this.handle, value, <u32>unit);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  fillSize(): this {
    this.fillWidth();
    this.fillHeight();
    return this;
  }

  text(content: string): this {
    this.contentValue = content;
    if (this.hasBuiltHandle()) {
      ui.setText(this.handle, content);
      this.notifyRetainedMutation();
    }
    return this;
  }

  protected setTextStyleRunsWords(runsWords: Uint32Array | null): void {
    this.textStyleRunsWords = runsWords;
    if (this.hasBuiltHandle()) {
      if (runsWords === null) {
        ui.setTextStyleRuns(this.handle, new Uint32Array(0));
      } else {
        ui.setTextStyleRuns(this.handle, changetype<Uint32Array>(runsWords));
      }
      this.notifyRetainedMutation();
    }
  }

  _defaultSemanticLabel(label: string): this {
    this.setDefaultSemanticLabel(label);
    return this;
  }

  /** @internal */
  _fontId(fontId: u32, size: f32): this {
    this.usesDirectFontId = true;
    this.fontFamilyValue = null;
    this.fontId = fontId;
    this.fontSizeValue = size;
    this.hasFont = true;
    if (fontId == 0) {
      warn("Typography", "Text._fontId() received font id 0; the text will render with the default font fallback.");
    }
    if (this.hasBuiltHandle()) {
      this.applyResolvedFont();
    }
    return this;
  }

  fontStack(stack: FontStack, size: f32): this {
    this._fontId(stack.id, size);
    return this;
  }

  fontFamily(family: FontFamily): this {
    this.usesDirectFontId = false;
    this.fontFamilyValue = family;
    if (this.hasBuiltHandle() && this.hasFont) {
      this.applyResolvedFont();
    }
    return this;
  }

  fontWeight(weight: FontWeight): this {
    this.fontWeightValue = weight;
    if (this.hasBuiltHandle() && this.hasFont) {
      this.applyResolvedFont();
    }
    return this;
  }

  fontStyle(style: FontStyle): this {
    this.fontStyleValue = style;
    if (this.hasBuiltHandle() && this.hasFont) {
      this.applyResolvedFont();
    }
    return this;
  }

  fontSize(size: f32): this {
    this.fontSizeValue = size;
    this.hasFont = true;
    if (this.hasBuiltHandle()) {
      this.applyResolvedFont();
    }
    return this;
  }

  lineHeight(px: f32): this {
    this.lineHeightValue = px;
    this.hasLineHeight = true;
    if (this.hasBuiltHandle()) {
      ui.setLineHeight(this.handle, px);
      this.notifyRetainedMutation();
    }
    return this;
  }

  textColor(color: u32): this {
    this.color = color;
    this.hasColor = true;
    if (this.hasBuiltHandle()) {
      ui.setTextColor(this.handle, color);
      this.notifyRetainedMutation();
    }
    return this;
  }

  textAlign(align: TextAlign): this {
    this.textAlignValue = align;
    this.hasTextAlign = true;
    if (this.hasBuiltHandle()) {
      ui.setTextAlign(this.handle, <u32>align);
      this.notifyRetainedMutation();
    }
    return this;
  }

  verticalAlign(align: TextVerticalAlign): this {
    this.verticalAlignValue = align;
    this.hasVerticalAlign = true;
    if (this.hasBuiltHandle()) {
      ui.setTextVerticalAlign(this.handle, <u32>align);
      this.notifyRetainedMutation();
    }
    return this;
  }

  maxLines(lines: i32): this {
    this.maxChars = 2147483647;
    this.maxLinesValue = lines;
    this.hasLimits = true;
    if (this.hasBuiltHandle()) {
      ui.setTextLimits(this.handle, this.maxChars, this.maxLinesValue);
      this.notifyRetainedMutation();
    }
    return this;
  }

  textLimits(maxChars: i32, maxLines: i32): this {
    this.maxChars = maxChars;
    this.maxLinesValue = maxLines;
    this.hasLimits = true;
    if (this.hasBuiltHandle()) {
      ui.setTextLimits(this.handle, maxChars, maxLines);
      this.notifyRetainedMutation();
    }
    return this;
  }

  wrapping(flag: bool = true): this {
    this.wrappingValue = flag;
    this.hasWrapping = true;
    if (this.hasBuiltHandle()) {
      ui.setTextWrapping(this.handle, flag);
      this.notifyRetainedMutation();
    }
    return this;
  }

  overflow(mode: TextOverflow): this {
    this.overflowValue = mode;
    this.hasOverflow = true;
    if (this.hasBuiltHandle()) {
      ui.setTextOverflow(this.handle, <u32>mode);
      this.notifyRetainedMutation();
    }
    return this;
  }

  protected setOverflowFade(horizontal: bool, vertical: bool): void {
    this.overflowFadeHorizontalValue = horizontal;
    this.overflowFadeVerticalValue = vertical;
    this.hasOverflowFade = true;
    if (this.hasBuiltHandle()) {
      ui.setTextOverflowFade(this.handle, horizontal, vertical);
      this.notifyRetainedMutation();
    }
  }

  obscured(flag: bool): this {
    this.obscuredValue = flag;
    this.hasObscured = true;
    if (this.hasBuiltHandle()) {
      ui.setTextObscured(this.handle, flag);
      this.notifyRetainedMutation();
    }
    return this;
  }

  editable(flag: bool = true): this {
    this.editableValue = flag;
    this.hasEditable = true;
    if (flag && !this.hasSelectable) {
      this.selectable(true);
    }
    if (this.hasBuiltHandle()) {
      ui.setEditable(this.handle, flag);
      this.notifyRetainedMutation();
    }
    return this;
  }

  _editorCommandKeys(flag: bool = true): this {
    this.editorCommandKeysValue = flag;
    this.hasEditorCommandKeys = true;
    if (this.hasBuiltHandle()) {
      ui.setEditorCommandKeys(this.handle, flag);
      this.notifyRetainedMutation();
    }
    return this;
  }

  _editorAcceptsTab(flag: bool = true): this {
    this.editorAcceptsTabValue = flag;
    this.hasEditorAcceptsTab = true;
    if (this.hasBuiltHandle()) {
      ui.setEditorAcceptsTab(this.handle, flag);
      this.notifyRetainedMutation();
    }
    return this;
  }

  caretColor(color: u32): this {
    this.caretColorValue = color;
    this.hasCaretColor = true;
    if (this.hasBuiltHandle()) {
      ui.setCaretColor(this.handle, color);
      this.notifyRetainedMutation();
    }
    return this;
  }

  selectable(flag: bool = true, selectionColor: u32 = 0): this {
    this.selectableValue = flag;
    this.usesThemeSelectionColor = selectionColor == 0;
    this.selectionColor = this.usesThemeSelectionColor ? activeTheme.value.colors.selection : selectionColor;
    this.hasSelectable = true;
    if (flag) {
      this.cursor(CursorStyle.Text);
    } else if (this.cursorStyle == CursorStyle.Text) {
      this.cursor(CursorStyle.Default);
    }
    if (this.hasBuiltHandle()) {
      ui.setSelectable(this.handle, flag, this.selectionColor);
      this.notifyRetainedMutation();
    }
    return this;
  }

  onTextChanged(cb: (event: TextChangedEventArgs) => void): this {
    this.textChangedCb = cb;
    return this;
  }

  onSelectionChanged(cb: (event: SelectionChangedEventArgs) => void): this {
    this.selectionChangedCb = cb;
    return this;
  }

  onPointerClick(cb: (event: PointerClickEventArgs) => void): this {
    super.onPointerClick(cb);
    return this;
  }

  onPointerEnter(cb: (event: PointerEventArgs) => void): this {
    super.onPointerEnter(cb);
    return this;
  }

  onPointerLeave(cb: (event: PointerEventArgs) => void): this {
    super.onPointerLeave(cb);
    return this;
  }

  build(): u64 {
    if (this.hasBuiltHandle()) {
      return this.handle;
    }

    this.handle = ui.createNode(<u32>NodeType.Text);
    this.applyNodeMetadata();
    this.finishBuild();
    if (this.hasWidth) {
      ui.setWidth(this.handle, this.widthValue, <u32>this.widthUnit);
    }
    if (this.hasFillWidth) {
      ui.setFillWidth(this.handle, true);
    }
    if (this.hasFillWidthPercent) {
      ui.setFillWidthPercent(this.handle, this.fillWidthPercentValue);
    }
    if (this.hasHeight) {
      ui.setHeight(this.handle, this.heightValue, <u32>this.heightUnit);
    }
    if (this.hasFillHeight) {
      ui.setFillHeight(this.handle, true);
    }
    if (this.hasFillHeightPercent) {
      ui.setFillHeightPercent(this.handle, this.fillHeightPercentValue);
    }
    if (this.hasMinWidth) {
      ui.setMinWidth(this.handle, this.minWidthValue, <u32>this.minWidthUnit);
    }
    if (this.hasMaxWidth) {
      ui.setMaxWidth(this.handle, this.maxWidthValue, <u32>this.maxWidthUnit);
    }
    if (this.hasMinHeight) {
      ui.setMinHeight(this.handle, this.minHeightValue, <u32>this.minHeightUnit);
    }
    if (this.hasMaxHeight) {
      ui.setMaxHeight(this.handle, this.maxHeightValue, <u32>this.maxHeightUnit);
    }
    ui.setText(this.handle, this.contentValue);
    if (this.textStyleRunsWords !== null) {
      ui.setTextStyleRuns(this.handle, changetype<Uint32Array>(this.textStyleRunsWords));
    }
    if (this.hasFont) {
      ui.setFont(this.handle, this.resolveFontId(), this.fontSizeValue);
    }
    if (this.hasLineHeight) {
      ui.setLineHeight(this.handle, this.lineHeightValue);
    }
    ui.setTextColor(this.handle, this.hasColor ? this.color : activeTheme.value.colors.textPrimary);
    if (this.hasTextAlign) {
      ui.setTextAlign(this.handle, <u32>this.textAlignValue);
    }
    if (this.hasVerticalAlign) {
      ui.setTextVerticalAlign(this.handle, <u32>this.verticalAlignValue);
    }
    if (this.hasLimits) {
      ui.setTextLimits(this.handle, this.maxChars, this.maxLinesValue);
    }
    if (this.hasWrapping) {
      ui.setTextWrapping(this.handle, this.wrappingValue);
    }
    if (this.hasOverflow) {
      ui.setTextOverflow(this.handle, <u32>this.overflowValue);
    }
    if (this.hasOverflowFade) {
      ui.setTextOverflowFade(this.handle, this.overflowFadeHorizontalValue, this.overflowFadeVerticalValue);
    }
    if (this.hasObscured) {
      ui.setTextObscured(this.handle, this.obscuredValue);
    }
    if (this.hasEditable) {
      ui.setEditable(this.handle, this.editableValue);
    }
    if (this.hasEditorCommandKeys) {
      ui.setEditorCommandKeys(this.handle, this.editorCommandKeysValue);
    }
    if (this.hasEditorAcceptsTab) {
      ui.setEditorAcceptsTab(this.handle, this.editorAcceptsTabValue);
    }
    if (this.hasSelectable) {
      ui.setSelectable(this.handle, this.selectableValue, this.selectionColor);
    }
    if (this.hasCaretColor) {
      ui.setCaretColor(this.handle, this.caretColorValue);
    }
    return this.handle;
  }

  dispose(): void {
    disposeAll(this.disposables);
    this.disposeTree();
  }

  _debugMainAxisPercentValue(isHorizontal: bool): f32 {
    if (isHorizontal) {
      return this.hasWidth && this.widthUnit == Unit.Percent ? this.widthValue : -1.0;
    }
    return this.hasHeight && this.heightUnit == Unit.Percent ? this.heightValue : -1.0;
  }

  _requiredFontIds(): Array<u32> {
    const fontIds = new Array<u32>();
    const fontId = this.resolveFontId();
    if (fontId != 0) {
      fontIds.push(fontId);
    }
    return fontIds;
  }

  private handleThemeChanged(theme: Theme): void {
    if (this.hasBuiltHandle() && !this.hasColor) {
      ui.setTextColor(this.handle, theme.colors.textPrimary);
      this.notifyRetainedMutation();
    }
    if (this.hasBuiltHandle() && this.hasFont && !this.usesDirectFontId && this.fontFamilyValue === null) {
      this.applyResolvedFont();
    }
    if (this.hasSelectable && this.usesThemeSelectionColor) {
      this.selectionColor = theme.colors.selection;
      if (this.hasBuiltHandle()) {
        ui.setSelectable(this.handle, this.selectableValue, this.selectionColor);
        this.notifyRetainedMutation();
      }
    }
  }

  private resolveFontId(): u32 {
    if (this.usesDirectFontId) {
      return this.fontId;
    }
    const family = this.fontFamilyValue === null
      ? activeTheme.value.fonts.bodyFamily
      : changetype<FontFamily>(this.fontFamilyValue);
    this.fontId = family.resolve(this.fontWeightValue, this.fontStyleValue);
    return this.fontId;
  }

  private applyResolvedFont(): void {
    const resolvedFontId = this.resolveFontId();
    if (resolvedFontId == 0) {
      warn(
        "Typography",
        "Text node resolved font id 0 while applying font settings; check the configured FontFamily or font id.",
      );
    }
    ui.setFont(this.handle, resolvedFontId, this.fontSizeValue);
    this.notifyRetainedMutation();
  }

  _handleTextChanged(text: string): void {
    this.contentValue = text;
    const callback = this.textChangedCb;
    if (callback !== null) {
      callback(new TextChangedEventArgs(text));
    }
  }

  _handleTextReplaced(start: u32, end: u32, text: string): void {
    const startOffset = stringOffsetFromUtf8ByteOffset(this.contentValue, start);
    const endOffset = stringOffsetFromUtf8ByteOffset(this.contentValue, max<u32>(start, end));
    const prefix = this.contentValue.substring(0, startOffset);
    const suffix = this.contentValue.substring(endOffset);
    this.contentValue = prefix + text + suffix;
    const callback = this.textChangedCb;
    if (callback !== null) {
      callback(new TextChangedEventArgs(this.contentValue));
    }
  }

  _handleSelectionChanged(start: u32, end: u32): void {
    this.selectionStartValue = start;
    this.selectionEndValue = end;
    const callback = this.selectionChangedCb;
    if (callback !== null) {
      callback(new SelectionChangedEventArgs(start, end));
    }
  }

  private track(disposable: Disposable): void {
    this.disposables.push(disposable);
  }
}
