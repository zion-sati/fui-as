import * as ui from "../../bindings/ui";
import { HandlerAction } from "../../core/Action";
import { Callback1, Handler1 } from "../../core/BoundCallback";
import { Disposable, disposeAll } from "../../core/Disposable";
import { FocusAdornerManager } from "../../core/FocusAdornerManager";
import { keyboardFocusVisible } from "../../core/FocusVisibility";
import { FocusChangedEventArgs, Node, SelectionChangedEventArgs, TextChangedEventArgs } from "../../core/Node";
import {
  CursorStyle,
  HandleValue,
  KeyEventType,
  KeyModifier,
  PointerEventType,
  SemanticRole,
  TextVerticalAlign,
  Unit,
} from "../../core/ffi";
import { Theme, activeTheme } from "../../core/Theme";
import { FontFamily } from "../../core/Typography";
import { PersistedStringCodec, PersistedValueState } from "../../core/PersistedState";
import { FlexBox, ScrollBarVisibility, ScrollBox, TextCore } from "../../nodes";
import { bind1 } from "../../core/bind";
import { ScrollState } from "../../nodes/ScrollState";
import { ScrollView } from "../../nodes/ScrollView";
import { getControlTemplates } from "../ControlTemplateSet";
import { TextInputColors } from "../TextInputColors";
import {
  defaultTextInputTemplate,
  TextInputPresenter,
  TextInputTemplate,
  TextInputVisualState,
} from "./TextInputPresenter";

const UNLIMITED_TEXT_LENGTH: i32 = 2147483647;

function clampSelection(position: u32, textLength: i32): u32 {
  const limit = textLength <= 0 ? <u32>0 : <u32>textLength;
  return position > limit ? limit : position;
}

function utf8ByteLength(text: string): u32 {
  const bytes = Uint8Array.wrap(String.UTF8.encode(text, false));
  return <u32>bytes.length;
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

function codePointCount(text: string): u32 {
  let count: u32 = 0;
  let cursor = 0;
  while (cursor < text.length) {
    const codePoint = readCodePoint(text, cursor);
    cursor += codePointStringLength(codePoint);
    count += 1;
  }
  return count;
}

function utf8ByteOffsetFromCodePointIndex(text: string, index: u32): u32 {
  const countLimit = codePointCount(text);
  const clampedIndex = index > countLimit ? countLimit : index;
  let byteOffset: u32 = 0;
  let cursor = 0;
  let count: u32 = 0;
  while (cursor < text.length && count < clampedIndex) {
    const codePoint = readCodePoint(text, cursor);
    byteOffset += utf8CodePointByteLength(codePoint);
    cursor += codePointStringLength(codePoint);
    count += 1;
  }
  return byteOffset;
}

function stringOffsetFromCodePointIndex(text: string, index: u32): i32 {
  const countLimit = codePointCount(text);
  const clampedIndex = index > countLimit ? countLimit : index;
  let cursor = 0;
  let count: u32 = 0;
  while (cursor < text.length && count < clampedIndex) {
    const codePoint = readCodePoint(text, cursor);
    cursor += codePointStringLength(codePoint);
    count += 1;
  }
  return cursor;
}

function codePointIndexFromUtf8ByteOffset(text: string, byteOffset: u32): u32 {
  const length = utf8ByteLength(text);
  const clampedOffset = byteOffset > length ? length : byteOffset;
  let bytes: u32 = 0;
  let cursor = 0;
  let count: u32 = 0;
  while (cursor < text.length) {
    const codePoint = readCodePoint(text, cursor);
    const byteLength = utf8CodePointByteLength(codePoint);
    if (bytes + byteLength > clampedOffset) {
      break;
    }
    bytes += byteLength;
    cursor += codePointStringLength(codePoint);
    count += 1;
  }
  return count;
}

export class TextInputProfile {
  constructor(
    readonly maxLines: i32,
    readonly multiline: bool,
    readonly wrapsByDefault: bool,
    readonly defaultSemanticLabel: string,
  ) {}
}

export const singleLineTextInputProfile = new TextInputProfile(1, false, false, "Text input");
export const multilineTextAreaProfile = new TextInputProfile(0, true, true, "Text area");
const TEXT_INPUT_PERSISTED_CODEC = new PersistedStringCodec();

class PersistedTextInputState extends PersistedValueState<TextInputCore, string> {
  constructor() {
    super("text-input-value", TEXT_INPUT_PERSISTED_CODEC, 1);
  }

  protected shouldCaptureValue(node: TextInputCore): bool {
    return !node.isPassword;
  }

  protected captureValue(node: TextInputCore): string {
    return node.value;
  }

  protected restoreValue(node: TextInputCore, value: string): void {
    if (node.isPassword) {
      return;
    }
    node._applyPersistedText(value);
  }
}

const TEXT_INPUT_PERSISTED_STATE = new PersistedTextInputState();

class TextInputEditorText extends TextCore {
  private readonly owner: TextInputCore;

  constructor(owner: TextInputCore, text: string) {
    super(text);
    this.owner = owner;
    this.semanticRole(SemanticRole.Textbox);
    this.focusable(true);
    this.reflectSemanticDisabledFromEnabled();
    this.selectable();
    this.editable();
  }

  _handleFocusChanged(focused: bool): void {
    super._handleFocusChanged(focused);
    this.owner.handleEditorFocusChanged(focused);
  }
  _handleTextChanged(text: string): void {
    super._handleTextChanged(text);
    this.owner.handleEditorTextChanged(text);
  }

  _handleTextReplaced(start: u32, end: u32, text: string): void {
    super._handleTextReplaced(start, end, text);
    this.owner.handleEditorTextChanged(this.content);
  }

  _handleSelectionChanged(start: u32, end: u32): void {
    super._handleSelectionChanged(start, end);
    this.owner.handleEditorSelectionChanged(start, end);
  }

  _handleKeyEvent(eventType: KeyEventType, key: string, modifiers: u32): bool {
    if (super._handleKeyEvent(eventType, key, modifiers)) {
      return true;
    }
    if (eventType == KeyEventType.Down && this.owner.handleEditorKeyDown(key, modifiers)) {
      return true;
    }
    return false;
  }
}

class TextInputPlaceholderHost extends FlexBox {
  private readonly owner: TextInputCore;

  constructor(owner: TextInputCore, placeholderText: TextCore) {
    super();
    this.owner = owner;
    this.positionAbsolute();
    this.clipToBounds(false);
    this.child(placeholderText);
    this.requireInteractive();
  }

  _handlePointerEvent(eventType: PointerEventType, x: f32, y: f32, modifiers: u32 = 0): void {
    super._handlePointerEvent(eventType, x, y, modifiers);
    if (eventType != PointerEventType.Down) {
      return;
    }
    this.owner.handleShellPointerDown();
  }
}

class TextInputEditorViewport extends ScrollView {
  private readonly owner: TextInputCore;

  constructor(owner: TextInputCore) {
    super();
    this.owner = owner;
  }

  _handlePointerEvent(eventType: PointerEventType, x: f32, y: f32, modifiers: u32 = 0): void {
    super._handlePointerEvent(eventType, x, y, modifiers);
    if (eventType == PointerEventType.Down) {
      this.owner.handleViewportPointerDown();
    }
  }
}

export class TextInputCore extends FlexBox {
  protected editorText: TextCore = changetype<TextCore>(0);

  private readonly profile: TextInputProfile;
  private presenter: TextInputPresenter = changetype<TextInputPresenter>(0);
  private editorScrollBox: ScrollBox | null = null;
  private placeholderHost: FlexBox = changetype<FlexBox>(0);
  private placeholderText: TextCore = changetype<TextCore>(0);
  private readonly disposables: Array<Disposable> = new Array<Disposable>();
  private disposed: bool = false;
  private placeholderAttached: bool = false;
  private textValue: string;
  private placeholderValue: string = "";
  private selectionStartValue: u32 = 0;
  private selectionEndValue: u32 = 0;
  private selectionStartByteValue: u32 = 0;
  private selectionEndByteValue: u32 = 0;
  private focusedState: bool = false;
  private readOnlyValue: bool = false;
  private passwordValue: bool = false;
  private acceptsTabValue: bool = false;
  private hostAutofillHintValue: string | null = null;
  private maxCharsValue: i32 = UNLIMITED_TEXT_LENGTH;
  private wrappingValue: bool;
  private verticalScrollbarVisibilityValue: ScrollBarVisibility = ScrollBarVisibility.Auto;
  private horizontalScrollbarVisibilityValue: ScrollBarVisibility = ScrollBarVisibility.Auto;
  private fontFamilyOverride: FontFamily | null = null;
  private fontSizeOverride: f32 = 0.0;
  private hasFontSizeOverride: bool = false;
  private changedCb: ((event: TextChangedEventArgs) => void) | null = null;
  private changedBinding: Callback1<TextChangedEventArgs> | null = null;
  private selectionChangedCb: ((event: SelectionChangedEventArgs) => void) | null = null;
  private selectionChangedBinding: Callback1<SelectionChangedEventArgs> | null = null;
  private focusChangedListener: ((event: FocusChangedEventArgs) => void) | null = null;
  private textInputFocusChangedBinding: Callback1<FocusChangedEventArgs> | null = null;
  private templateValue: TextInputTemplate | null = null;
  private colorsValue: TextInputColors | null = null;

  constructor(profile: TextInputProfile, text: string = "") {
    super();
    this.profile = profile;
    this.textValue = text;
    const initialCaret = codePointCount(text);
    const initialCaretByte = utf8ByteLength(text);
    this.selectionStartValue = initialCaret;
    this.selectionEndValue = initialCaret;
    this.selectionStartByteValue = initialCaretByte;
    this.selectionEndByteValue = initialCaretByte;
    this.wrappingValue = profile.wrapsByDefault;
    this.editorText = new TextInputEditorText(this, text);
    this.placeholderText = new TextCore("");
    this.placeholderHost = new TextInputPlaceholderHost(this, this.placeholderText);
    if (profile.multiline) {
      const scrollBox = new ScrollBox(new ScrollState(), new TextInputEditorViewport(this))
        .fillSize()
        .child(this.editorText) as ScrollBox;
      this.editorScrollBox = scrollBox;
      this.child(scrollBox);
    } else {
      this.child(this.editorText);
    }
    this.presenter = this.createPresenter(null);
    this.presenter.bind(this, this.editorHostNode(), this.placeholderHost);

    this.track(activeTheme.addAction(new HandlerAction<TextInputCore, Theme>(this, (control: TextInputCore, theme: Theme): void => {
      control.handleThemeChanged(theme);
    })));
    this.track(keyboardFocusVisible.addAction(new HandlerAction<TextInputCore, bool>(this, (control: TextInputCore, _visible: bool): void => {
      control.syncFocusChrome(activeTheme.value);
    })));

    this.requireInteractive();
    this.syncSemanticLabel();
    this.syncEditorLimits();
    this.syncEditorEditability();
    this.syncBrowserInputMetadata();
    this.syncThemeState(activeTheme.value);
    this.syncPlaceholderVisibility();
    this.persistState(TEXT_INPUT_PERSISTED_STATE);
  }

  get isSelectionBarrier(): bool {
    return true;
  }

  get value(): string {
    return this.textValue;
  }

  get selectionStart(): u32 {
    return this.selectionStartValue;
  }

  get selectionEnd(): u32 {
    return this.selectionEndValue;
  }

  get selectionStartByteOffset(): u32 {
    return this.selectionStartByteValue;
  }

  get selectionEndByteOffset(): u32 {
    return this.selectionEndByteValue;
  }

  get isFocused(): bool {
    return this.focusedState;
  }

  get isReadOnly(): bool {
    return this.readOnlyValue;
  }

  get isPassword(): bool {
    return this.passwordValue;
  }

  get editorNode(): TextCore {
    return this.editorText;
  }

  template(template: TextInputTemplate | null): this {
    this.templateValue = template;
    this.presenter = this.createPresenter(template);
    this.presenter.bind(this, this.editorHostNode(), this.placeholderHost);
    this.syncThemeState(activeTheme.value);
    return this;
  }

  colors(colors: TextInputColors | null): this {
    this.colorsValue = colors;
    this.syncThemeState(activeTheme.value);
    return this;
  }

  text(value: string): this {
    this.textValue = value;
    this.editorText.text(value);
    this.caretStringIndex(codePointCount(value));
    this.syncSemanticLabel();
    this.syncPlaceholderVisibility();
    return this;
  }

  selectionRange(start: u32, end: u32): this {
    const length = codePointCount(this.textValue);
    const clampedStart = clampSelection(start, <i32>length);
    const clampedEnd = clampSelection(end, <i32>length);
    const clampedStartByte = utf8ByteOffsetFromCodePointIndex(this.textValue, clampedStart);
    const clampedEndByte = utf8ByteOffsetFromCodePointIndex(this.textValue, clampedEnd);
    this.selectionStartValue = clampedStart;
    this.selectionEndValue = clampedEnd;
    this.selectionStartByteValue = clampedStartByte;
    this.selectionEndByteValue = clampedEndByte;
    const handle = this.editorText.builtHandle;
    if (handle != <u64>HandleValue.Invalid) {
      ui.setTextSelectionRange(handle, clampedStartByte, clampedEndByte);
    }
    return this;
  }

  caret(position: u32): this {
    return this.caretStringIndex(position);
  }

  caretToEnd(): this {
    const end = codePointCount(this.textValue);
    return this.caretStringIndex(end);
  }

  private caretStringIndex(position: u32): this {
    return this.selectionRange(position, position);
  }

  placeholder(value: string): this {
    this.placeholderValue = value;
    this.placeholderText.text(value);
    this.syncSemanticLabel();
    this.syncPlaceholderVisibility();
    return this;
  }

  maxChars(limit: i32): this {
    this.maxCharsValue = limit < 0 ? UNLIMITED_TEXT_LENGTH : limit;
    this.syncEditorLimits();
    return this;
  }

  readOnly(flag: bool = true): this {
    this.readOnlyValue = flag;
    this.syncEditorEditability();
    return this;
  }

  acceptsTab(flag: bool = true): this {
    this.acceptsTabValue = flag;
    this.editorText._editorAcceptsTab(flag);
    return this;
  }

  password(flag: bool = true): this {
    this.passwordValue = flag;
    this.editorText.obscured(flag);
    this.syncBrowserInputMetadata();
    this.syncSemanticLabel();
    return this;
  }

  hostAutofill(hint: string | null = null): this {
    this.hostAutofillHintValue = hint !== null && hint.length > 0 ? hint : null;
    this.syncBrowserInputMetadata();
    return this;
  }

  onChanged(cb: (event: TextChangedEventArgs) => void): this {
    this.changedCb = cb;
    this.changedBinding = null;
    return this;
  }

  bindChanged<Owner>(owner: Owner, handler: Handler1<Owner, TextChangedEventArgs>): this {
    this.changedCb = null;
    this.changedBinding = bind1<Owner, TextChangedEventArgs>(owner, handler);
    return this;
  }

  onChangedWith<Owner>(owner: Owner, handler: Handler1<Owner, TextChangedEventArgs>): this {
    this.bindChanged(owner, handler);
    return this;
  }

  onTextChanged(cb: (event: TextChangedEventArgs) => void): this {
    this.onChanged(cb);
    return this;
  }

  onSelectionChanged(cb: (event: SelectionChangedEventArgs) => void): this {
    this.selectionChangedCb = cb;
    this.selectionChangedBinding = null;
    return this;
  }

  bindSelectionChanged<Owner>(owner: Owner, handler: Handler1<Owner, SelectionChangedEventArgs>): this {
    this.selectionChangedCb = null;
    this.selectionChangedBinding = bind1<Owner, SelectionChangedEventArgs>(owner, handler);
    return this;
  }

  onSelectionChangedWith<Owner>(owner: Owner, handler: Handler1<Owner, SelectionChangedEventArgs>): this {
    this.bindSelectionChanged(owner, handler);
    return this;
  }

  onFocusChanged(cb: (event: FocusChangedEventArgs) => void): this {
    this.focusChangedListener = cb;
    this.textInputFocusChangedBinding = null;
    return this;
  }

  bindFocusChanged<Owner>(owner: Owner, handler: Handler1<Owner, FocusChangedEventArgs>): this {
    this.focusChangedListener = null;
    this.textInputFocusChangedBinding = bind1<Owner, FocusChangedEventArgs>(owner, handler);
    return this;
  }

  onFocusChangedWith<Owner>(owner: Owner, handler: Handler1<Owner, FocusChangedEventArgs>): this {
    this.bindFocusChanged(owner, handler);
    return this;
  }

  semanticLabel(label: string): this {
    this.editorText.semanticLabel(label);
    return this;
  }

  fontFamily(family: FontFamily | null): this {
    this.fontFamilyOverride = family;
    this.syncThemeState(activeTheme.value);
    return this;
  }

  fontSize(size: f32): this {
    this.fontSizeOverride = size;
    this.hasFontSizeOverride = size > 0.0;
    this.syncThemeState(activeTheme.value);
    return this;
  }

  lineHeight(px: f32): this {
    this.editorText.lineHeight(px);
    this.placeholderText.lineHeight(px);
    return this;
  }

  focusNow(): this {
    this.focusEditor();
    this.selectionByteRange(this.selectionStartByteValue, this.selectionEndByteValue);
    return this;
  }

  wrapping(flag: bool = true): this {
    if (this.wrappingValue == flag) {
      return this;
    }
    this.wrappingValue = flag;
    this.syncEditorWrapping();
    this.syncScrollChromeState();
    this.syncThemeState(activeTheme.value);
    return this;
  }

  verticalScrollbarVisibility(mode: ScrollBarVisibility): this {
    this.verticalScrollbarVisibilityValue = mode;
    this.syncScrollChromeState();
    return this;
  }

  horizontalScrollbarVisibility(mode: ScrollBarVisibility): this {
    this.horizontalScrollbarVisibilityValue = mode;
    this.syncScrollChromeState();
    return this;
  }

  protected get isMultilineProfile(): bool {
    return this.profile.multiline;
  }

  protected get scrollBoxNode(): ScrollBox | null {
    return this.editorScrollBox;
  }

  build(): u64 {
    if (this.builtHandle != <u64>HandleValue.Invalid) {
      return this.builtHandle;
    }
    const intendedSelectionStartByte = this.selectionStartByteValue;
    const intendedSelectionEndByte = this.selectionEndByteValue;
    const handle = super.build();
    ui.setSelectionAreaBarrier(handle, true);
    this.syncBrowserInputMetadata();
    this.selectionByteRange(intendedSelectionStartByte, intendedSelectionEndByte);
    return handle;
  }

  dispose(): void {
    this.disposeControl();
    if (!this.placeholderAttached) {
      this.placeholderHost.dispose();
    }
    super.dispose();
  }

  _handlePointerEvent(eventType: PointerEventType, x: f32, y: f32, modifiers: u32 = 0): void {
    super._handlePointerEvent(eventType, x, y, modifiers);
    if (eventType != PointerEventType.Down || !this.isEnabled) {
      return;
    }
    this.handleShellPointerDown();
  }

  protected _onEffectiveEnabledChanged(_isEnabled: bool): void {
    this.syncEditorEditability();
    this.syncThemeState(activeTheme.value);
    this.syncPlaceholderVisibility();
  }

  _applyPersistedText(value: string): void {
    if (this.textValue == value) {
      return;
    }
    this.text(value);
    this.emitTextChanged(value);
  }

  private handleThemeChanged(theme: Theme): void {
    if (this.disposed) {
      return;
    }
    this.syncThemeState(theme);
  }

  private syncThemeState(theme: Theme): void {
    const resolvedFontFamily = this.fontFamilyOverride !== null
      ? changetype<FontFamily>(this.fontFamilyOverride)
      : theme.fonts.bodyFamily;
    const resolvedFontSize = this.hasFontSizeOverride ? this.fontSizeOverride : theme.fonts.sizeBody;
    const lineHeight = resolvedFontSize + theme.spacing.sm;
    const editableCursor = this.isEnabled ? CursorStyle.Text : CursorStyle.Default;
    this.presenter.apply(theme, this.createVisualState(), this.colorsValue);

    const textVerticalAlign = this.profile.multiline ? TextVerticalAlign.Top : TextVerticalAlign.Center;

    const colors = this.colorsValue;
    let resolvedTextColor: u32;
    if (this.isEnabled) {
      if (colors !== null && colors.hasTextPrimary) {
        resolvedTextColor = colors.textPrimaryColor;
      } else {
        resolvedTextColor = theme.colors.textPrimary;
      }
    } else {
      if (colors !== null && colors.hasTextMuted) {
        resolvedTextColor = colors.textMutedColor;
      } else {
        resolvedTextColor = theme.colors.textMuted;
      }
    }
    const resolvedCaretColor = colors !== null && colors.hasCaret ? colors.caretColor : theme.colors.accent;

    this.editorText
      .width(this.shouldEditorTrackViewportWidth() ? 100.0 : 0.0, this.shouldEditorTrackViewportWidth() ? Unit.Percent : Unit.Auto)
      .height(this.profile.multiline ? 0.0 : lineHeight, this.profile.multiline ? Unit.Auto : Unit.Pixel)
      .fontFamily(resolvedFontFamily)
      .fontSize(resolvedFontSize)
      .verticalAlign(textVerticalAlign)
      .textColor(resolvedTextColor)
      .caretColor(resolvedCaretColor);
    this.syncEditorWrapping();

    this.placeholderHost
      .width(100.0, Unit.Percent)
      .height(this.profile.multiline ? 0.0 : lineHeight, this.profile.multiline ? Unit.Auto : Unit.Pixel)
      .cursor(editableCursor);
    const resolvedPlaceholderColor = colors !== null && colors.hasPlaceholder ? colors.placeholderColor : theme.colors.textMuted;
    this.placeholderText
      .width(100.0, Unit.Percent)
      .height(this.profile.multiline ? 0.0 : lineHeight, this.profile.multiline ? Unit.Auto : Unit.Pixel)
      .fontFamily(resolvedFontFamily)
      .fontSize(resolvedFontSize)
      .verticalAlign(textVerticalAlign)
      .textColor(resolvedPlaceholderColor);
    const scrollBox = this.editorScrollBox;
    if (scrollBox !== null) {
      scrollBox.cursor(CursorStyle.Default);
      scrollBox.viewport.cursor(editableCursor);
      scrollBox.fillSize();
      this.syncScrollChromeState();
    }

    if (colors !== null && colors.hasBackground) {
      this.bgColor(colors.backgroundColor);
    }
    if (colors !== null && colors.hasBorder) {
      this.border(1.0, colors.borderColor);
    }

    this.syncFocusChrome(theme);
  }

  handleEditorFocusChanged(focused: bool): void {
    if (this.focusedState == focused) {
      return;
    }
    this.focusedState = focused;
    this.syncFocusChrome(activeTheme.value);
    this.syncPlaceholderVisibility();
    const event = new FocusChangedEventArgs(focused);
    const callback = this.focusChangedListener;
    if (callback !== null) {
      callback(event);
    }
    const binding = this.textInputFocusChangedBinding;
    if (binding !== null) {
      binding.invoke(event);
    }
  }

  handleEditorTextChanged(value: string): void {
    if (this.textValue == value) {
      return;
    }
    this.textValue = value;
    this.clampSelectionToText();
    this.syncSemanticLabel();
    this.syncPlaceholderVisibility();
    this.emitTextChanged(value);
  }

  handleEditorKeyDown(key: string, modifiers: u32): bool {
    if (!this.isEnabled) {
      return false;
    }
    const nonShiftModifiers = modifiers & (<u32>KeyModifier.Ctrl | <u32>KeyModifier.Alt | <u32>KeyModifier.Meta);
    if (
      nonShiftModifiers == 0 &&
      (
        key == "ArrowLeft" ||
        key == "ArrowRight" ||
        key == "ArrowUp" ||
        key == "ArrowDown" ||
        key == "Home" ||
        key == "End" ||
        key == "PageUp" ||
        key == "PageDown"
      )
    ) {
      return true;
    }
    if (this.acceptsTabValue && key == "Tab" && modifiers == 0 && !this.readOnlyValue) {
      this.replaceSelectionWithText("\t");
      return true;
    }
    return false;
  }

  private replaceSelectionWithText(inserted: string): void {
    const text = this.textValue;
    const start = this.selectionStartValue < this.selectionEndValue ? this.selectionStartValue : this.selectionEndValue;
    const end = this.selectionStartValue > this.selectionEndValue ? this.selectionStartValue : this.selectionEndValue;
    const currentLength = codePointCount(text);
    const insertedLength = codePointCount(inserted);
    const replacementLength = end - start;
    if (currentLength - replacementLength + insertedLength > <u32>this.maxCharsValue) {
      return;
    }
    const startOffset = stringOffsetFromCodePointIndex(text, start);
    const endOffset = stringOffsetFromCodePointIndex(text, end);
    const value = text.substring(0, startOffset) + inserted + text.substring(endOffset);
    const caret = start + insertedLength;
    this.textValue = value;
    const handle = this.editorText.builtHandle;
    if (handle != 0) {
      const startByte = utf8ByteOffsetFromCodePointIndex(text, start);
      const endByte = utf8ByteOffsetFromCodePointIndex(text, end);
      const caretByte = utf8ByteOffsetFromCodePointIndex(value, caret);
      ui.replaceTextRange(handle, startByte, endByte, inserted, caretByte);
      this.selectionStartValue = caret;
      this.selectionEndValue = caret;
      this.selectionStartByteValue = caretByte;
      this.selectionEndByteValue = caretByte;
    } else {
      this.editorText.text(value);
      this.selectionRange(caret, caret);
    }
    this.syncSemanticLabel();
    this.syncPlaceholderVisibility();
    this.emitTextChanged(value);
    this.emitSelectionChanged();
  }

  private emitTextChanged(value: string): void {
    const event = new TextChangedEventArgs(value);
    const callback = this.changedCb;
    if (callback !== null) {
      callback(event);
    }
    const binding = this.changedBinding;
    if (binding !== null) {
      binding.invoke(event);
    }
  }

  handleEditorSelectionChanged(start: u32, end: u32): void {
    this.selectionStartByteValue = start;
    this.selectionEndByteValue = end;
    this.selectionStartValue = codePointIndexFromUtf8ByteOffset(this.textValue, start);
    this.selectionEndValue = codePointIndexFromUtf8ByteOffset(this.textValue, end);
    this.emitSelectionChanged();
  }

  private emitSelectionChanged(): void {
    const event = new SelectionChangedEventArgs(this.selectionStartValue, this.selectionEndValue);
    const callback = this.selectionChangedCb;
    if (callback !== null) {
      callback(event);
    }
    const binding = this.selectionChangedBinding;
    if (binding !== null) {
      binding.invoke(event);
    }
  }

  private syncEditorLimits(): void {
    this.editorText.textLimits(this.maxCharsValue, this.profile.maxLines);
  }

  private syncEditorEditability(): void {
    this.editorText.selectable(this.isEnabled);
    this.editorText.editable(!this.readOnlyValue && this.isEnabled);
  }

  private syncBrowserInputMetadata(): void {
    const handle = this.editorText.builtHandle;
    if (handle == <u64>HandleValue.Invalid) {
      return;
    }
    ui.registerTextInputMetadata(handle, this.passwordValue, this.hostAutofillHintValue);
  }

  private syncSemanticLabel(): void {
    if (this.placeholderValue.length > 0) {
      this.editorText._defaultSemanticLabel(this.placeholderValue);
      return;
    }
    if (this.readOnlyValue && this.textValue.length > 0) {
      this.editorText._defaultSemanticLabel(this.textValue);
      return;
    }
    this.editorText._defaultSemanticLabel(this.passwordValue ? "Password input" : this.profile.defaultSemanticLabel);
  }

  private syncPlaceholderVisibility(): void {
    const shouldShow = this.textValue.length == 0 && this.placeholderValue.length > 0;
    this.placeholderText.text(shouldShow ? this.placeholderValue : "");
    if (shouldShow) {
      if (!this.placeholderAttached) {
        this.placeholderAttached = true;
        this.child(this.placeholderHost);
      }
      return;
    }
    if (!this.placeholderAttached) {
      return;
    }
    this.placeholderAttached = false;
    this.removeChildNode(this.placeholderHost);
  }

  private clampSelectionToText(): void {
    const length = codePointCount(this.textValue);
    this.selectionStartValue = clampSelection(this.selectionStartValue, <i32>length);
    this.selectionEndValue = clampSelection(this.selectionEndValue, <i32>length);
    this.selectionStartByteValue = utf8ByteOffsetFromCodePointIndex(this.textValue, this.selectionStartValue);
    this.selectionEndByteValue = utf8ByteOffsetFromCodePointIndex(this.textValue, this.selectionEndValue);
  }

  private selectionByteRange(start: u32, end: u32): this {
    const length = utf8ByteLength(this.textValue);
    const clampedStart = clampSelection(start, <i32>length);
    const clampedEnd = clampSelection(end, <i32>length);
    this.selectionStartByteValue = clampedStart;
    this.selectionEndByteValue = clampedEnd;
    this.selectionStartValue = codePointIndexFromUtf8ByteOffset(this.textValue, clampedStart);
    this.selectionEndValue = codePointIndexFromUtf8ByteOffset(this.textValue, clampedEnd);
    const handle = this.editorText.builtHandle;
    if (handle != <u64>HandleValue.Invalid) {
      ui.setTextSelectionRange(handle, clampedStart, clampedEnd);
    }
    return this;
  }

  focusEditor(): void {
    if (!this.isEnabled) {
      return;
    }
    this.editorText.focusNow();
  }

  handleShellPointerDown(): void {
    if (!this.isEnabled) {
      return;
    }
    if (!this.profile.multiline) {
      if (this.focusedState) {
        this.focusEditor();
      } else {
        this.focusNow();
      }
      return;
    }
    this.handleViewportPointerDown();
  }

  handleViewportPointerDown(): void {
    if (!this.isEnabled) {
      return;
    }
    if (this.focusedState) {
      this.focusEditor();
      return;
    }
    this.focusNow();
  }

  private syncEditorWrapping(): void {
    this.editorText.wrapping(this.wrappingValue);
    this.placeholderText.wrapping(this.wrappingValue);
    if (this.profile.multiline) {
      this.editorText.width(this.shouldEditorTrackViewportWidth() ? 100.0 : 0.0, this.shouldEditorTrackViewportWidth() ? Unit.Percent : Unit.Auto);
    }
  }

  private syncScrollChromeState(): void {
    const scrollBox = this.editorScrollBox;
    if (scrollBox === null) {
      return;
    }
    const allowHorizontalScroll = !this.wrappingValue;
    scrollBox.scrollEnabledX(allowHorizontalScroll);
    scrollBox.scrollEnabledY(true);
    scrollBox.verticalScrollbarVisibility(this.verticalScrollbarVisibilityValue);
    scrollBox.horizontalScrollbarVisibility(
      allowHorizontalScroll
        ? this.horizontalScrollbarVisibilityValue
        : ScrollBarVisibility.Never,
    );
  }

  private shouldEditorTrackViewportWidth(): bool {
    return !this.profile.multiline || this.wrappingValue;
  }

  private track(disposable: Disposable): void {
    this.disposables.push(disposable);
  }

  private disposeControl(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    disposeAll(this.disposables);
    FocusAdornerManager.hideOwner(this);
  }

  private syncFocusChrome(theme: Theme): void {
    if (this.focusedState && this.isEnabled && keyboardFocusVisible.value) {
      FocusAdornerManager.showStandard(this, theme.spacing.sm);
      return;
    }
    FocusAdornerManager.hideOwner(this);
  }

  private createPresenter(template: TextInputTemplate | null): TextInputPresenter {
    if (template !== null) {
      return template.create();
    }
    const templateSet = getControlTemplates();
    const appTemplate = templateSet !== null
      ? (this.profile.multiline ? templateSet.textArea : templateSet.textInput)
      : null;
    return (appTemplate === null ? defaultTextInputTemplate : appTemplate).create();
  }

  private editorHostNode(): Node {
    const scrollBox = this.editorScrollBox;
    return scrollBox === null ? this.editorText : scrollBox;
  }

  private createVisualState(): TextInputVisualState {
    return new TextInputVisualState(
      this.profile.multiline,
      this.isEnabled,
      this.wrappingValue,
    );
  }
}
