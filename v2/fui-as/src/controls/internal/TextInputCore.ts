import * as ui from "../../bindings/ui";
import { HandlerAction } from "../../core/Action";
import { Callback1, Callback2, Handler1, Handler2 } from "../../core/BoundCallback";
import { Disposable, disposeAll } from "../../core/Disposable";
import { FocusAdornerManager } from "../../core/FocusAdornerManager";
import { keyboardFocusVisible } from "../../core/FocusVisibility";
import { Node } from "../../core/Node";
import {
  BorderStyle,
  CursorStyle,
  HandleValue,
  PointerEventType,
  SemanticRole,
  TextVerticalAlign,
  Unit,
} from "../../core/ffi";
import { Theme, activeTheme } from "../../core/Theme";
import { FontFamily } from "../../core/Typography";
import { PersistedStringCodec, PersistedValueState } from "../../core/PersistedState";
import { FlexBox, ScrollBarVisibility, ScrollBox, TextCore } from "../../nodes";
import { bind1, bind2 } from "../../core/bind";
import { ScrollState } from "../../nodes/ScrollState";
import { ScrollView } from "../../nodes/ScrollView";
import { getControlTemplates } from "../ControlTemplateSet";
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
  private focusedState: bool = false;
  private readOnlyValue: bool = false;
  private passwordValue: bool = false;
  private maxCharsValue: i32 = UNLIMITED_TEXT_LENGTH;
  private wrappingValue: bool;
  private verticalScrollbarVisibilityValue: ScrollBarVisibility = ScrollBarVisibility.Auto;
  private horizontalScrollbarVisibilityValue: ScrollBarVisibility = ScrollBarVisibility.Auto;
  private fontFamilyOverride: FontFamily | null = null;
  private fontSizeOverride: f32 = 0.0;
  private hasFontSizeOverride: bool = false;
  private changedCb: ((text: string) => void) | null = null;
  private changedBinding: Callback1<string> | null = null;
  private selectionChangedCb: ((start: u32, end: u32) => void) | null = null;
  private selectionChangedBinding: Callback2<u32, u32> | null = null;
  private focusChangedListener: ((focused: bool) => void) | null = null;
  private textInputFocusChangedBinding: Callback1<bool> | null = null;
  private templateValue: TextInputTemplate | null = null;

  constructor(profile: TextInputProfile, text: string = "") {
    super();
    this.profile = profile;
    this.textValue = text;
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

  text(value: string): this {
    this.textValue = value;
    this.clampSelectionToText();
    this.editorText.text(value);
    this.syncSemanticLabel();
    this.syncPlaceholderVisibility();
    return this;
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

  password(flag: bool = true): this {
    this.passwordValue = flag;
    this.editorText.obscured(flag);
    this.syncSemanticLabel();
    return this;
  }

  onChanged(cb: (text: string) => void): this {
    this.changedCb = cb;
    this.changedBinding = null;
    return this;
  }

  bindChanged<Owner>(owner: Owner, handler: Handler1<Owner, string>): this {
    this.changedCb = null;
    this.changedBinding = bind1<Owner, string>(owner, handler);
    return this;
  }

  onChangedWith<Owner>(owner: Owner, handler: Handler1<Owner, string>): this {
    this.bindChanged(owner, handler);
    return this;
  }

  onTextChanged(cb: (text: string) => void): this {
    this.onChanged(cb);
    return this;
  }

  onSelectionChanged(cb: (start: u32, end: u32) => void): this {
    this.selectionChangedCb = cb;
    this.selectionChangedBinding = null;
    return this;
  }

  bindSelectionChanged<Owner>(owner: Owner, handler: Handler2<Owner, u32, u32>): this {
    this.selectionChangedCb = null;
    this.selectionChangedBinding = bind2<Owner, u32, u32>(owner, handler);
    return this;
  }

  onSelectionChangedWith<Owner>(owner: Owner, handler: Handler2<Owner, u32, u32>): this {
    this.bindSelectionChanged(owner, handler);
    return this;
  }

  onFocusChanged(cb: (focused: bool) => void): this {
    this.focusChangedListener = cb;
    this.textInputFocusChangedBinding = null;
    return this;
  }

  bindFocusChanged<Owner>(owner: Owner, handler: Handler1<Owner, bool>): this {
    this.focusChangedListener = null;
    this.textInputFocusChangedBinding = bind1<Owner, bool>(owner, handler);
    return this;
  }

  onFocusChangedWith<Owner>(owner: Owner, handler: Handler1<Owner, bool>): this {
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
    const handle = super.build();
    ui.setSelectionAreaBarrier(handle, true);
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
    this.presenter.apply(theme, this.createVisualState());

    const textVerticalAlign = this.profile.multiline ? TextVerticalAlign.Top : TextVerticalAlign.Center;
    this.editorText
      .width(this.shouldEditorTrackViewportWidth() ? 100.0 : 0.0, this.shouldEditorTrackViewportWidth() ? Unit.Percent : Unit.Auto)
      .height(this.profile.multiline ? 0.0 : lineHeight, this.profile.multiline ? Unit.Auto : Unit.Pixel)
      .fontFamily(resolvedFontFamily)
      .fontSize(resolvedFontSize)
      .verticalAlign(textVerticalAlign)
      .textColor(this.isEnabled ? theme.colors.textPrimary : theme.colors.textMuted)
      .caretColor(theme.colors.accent);
    this.syncEditorWrapping();

    this.placeholderHost
      .width(100.0, Unit.Percent)
      .height(this.profile.multiline ? 0.0 : lineHeight, this.profile.multiline ? Unit.Auto : Unit.Pixel)
      .cursor(editableCursor);
    this.placeholderText
      .width(100.0, Unit.Percent)
      .height(this.profile.multiline ? 0.0 : lineHeight, this.profile.multiline ? Unit.Auto : Unit.Pixel)
      .fontFamily(resolvedFontFamily)
      .fontSize(resolvedFontSize)
      .verticalAlign(textVerticalAlign)
      .textColor(theme.colors.textMuted);
    const scrollBox = this.editorScrollBox;
    if (scrollBox !== null) {
      scrollBox.cursor(CursorStyle.Default);
      scrollBox.viewport.cursor(editableCursor);
      scrollBox.fillSize();
      this.syncScrollChromeState();
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
    const callback = this.focusChangedListener;
    if (callback !== null) {
      callback(focused);
    }
    const binding = this.textInputFocusChangedBinding;
    if (binding !== null) {
      binding.invoke(focused);
    }
  }

  handleEditorTextChanged(value: string): void {
    this.textValue = value;
    this.clampSelectionToText();
    this.syncSemanticLabel();
    this.syncPlaceholderVisibility();
    this.emitTextChanged(value);
  }

  private emitTextChanged(value: string): void {
    const callback = this.changedCb;
    if (callback !== null) {
      callback(value);
    }
    const binding = this.changedBinding;
    if (binding !== null) {
      binding.invoke(value);
    }
  }

  handleEditorSelectionChanged(start: u32, end: u32): void {
    this.selectionStartValue = start;
    this.selectionEndValue = end;
    const callback = this.selectionChangedCb;
    if (callback !== null) {
      callback(start, end);
    }
    const binding = this.selectionChangedBinding;
    if (binding !== null) {
      binding.invoke(start, end);
    }
  }

  private syncEditorLimits(): void {
    this.editorText.textLimits(this.maxCharsValue, this.profile.maxLines);
  }

  private syncEditorEditability(): void {
    this.editorText.selectable(this.isEnabled);
    this.editorText.editable(!this.readOnlyValue && this.isEnabled);
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
    const length = this.textValue.length;
    this.selectionStartValue = clampSelection(this.selectionStartValue, length);
    this.selectionEndValue = clampSelection(this.selectionEndValue, length);
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
      this.focusEditor();
      return;
    }
    this.handleViewportPointerDown();
  }

  handleViewportPointerDown(): void {
    if (!this.isEnabled) {
      return;
    }
    const handle = this.editorText.builtHandle;
    if (handle == <u64>HandleValue.Invalid) {
      this.focusEditor();
      return;
    }
    const documentEnd = utf8ByteLength(this.textValue);
    ui.setTextSelectionRange(handle, documentEnd, documentEnd);
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
