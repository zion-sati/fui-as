import * as ui from "../bindings/ui";
import { HandlerAction } from "../core/Action";
import { Callback1, Handler1 } from "../core/BoundCallback";
import { Disposable, disposeAll } from "../core/Disposable";
import { EventRouter, GlobalKeyHandler } from "../core/EventRouter";
import { FocusAdornerManager } from "../core/FocusAdornerManager";
import { keyboardFocusVisible } from "../core/FocusVisibility";
import { afterNextCommitWith, markNeedsCommit } from "../core/FrameScheduler";
import {
  AlignItems,
  CursorStyle,
  FlexDirection,
  JustifyContent,
  KeyModifier,
  KeyEventType,
  PointerEventType,
  SemanticRole,
  Unit,
} from "../core/ffi";
import { warn } from "../core/Logger";
import { ComboBoxChangedEventArgs, Node, TextChangedEventArgs } from "../core/Node";
import { Theme, activeTheme } from "../core/Theme";
import { bind1, bind2 } from "../core/bind";
import { registerScrollHook } from "../core/ScrollHooks";
import { FlexBox, ScrollView } from "../nodes";
import { TextInput } from "./TextInput";
import { TextInputColors } from "./TextInputColors";
import { TextInputPresenter, TextInputTemplate, TextInputVisualState } from "./internal/TextInputPresenter";
import { DropdownSizing } from "./ControlSizing";
import { DropdownColors } from "./DropdownColors";
import {
  createDefaultDropdownChevronPresenter,
  DropdownChevronPresenter,
  DropdownChevronTemplate,
  DropdownChevronVisualState,
} from "./internal/DropdownChevronPresenter";
import { DropdownOptionRowTemplate } from "./internal/DropdownOptionRowPresenter";
import {
  SELECTABLE_POPUP_LIST_PANEL_PADDING,
  SelectablePopupList,
  SelectablePopupListOwner,
} from "./internal/SelectablePopupList";

const DEFAULT_PANEL_BACKGROUND_BLUR_SIGMA: f32 = 10.0;

function stringsEqualIgnoreCase(left: string, right: string): bool {
  return left.toLowerCase() == right.toLowerCase();
}

function stringContainsIgnoreCase(value: string, query: string): bool {
  return value.toLowerCase().includes(query.toLowerCase());
}

function stringStartsWithIgnoreCase(value: string, query: string): bool {
  return value.toLowerCase().startsWith(query.toLowerCase());
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

function createChevronPresenter(template: DropdownChevronTemplate | null, sizing: DropdownSizing | null = null): DropdownChevronPresenter {
  if (template !== null) {
    return template.create(sizing);
  }
  return createDefaultDropdownChevronPresenter(sizing);
}

function handleComboBoxDeferredBlurClose(comboBox: ComboBox): void {
  comboBox.fireDeferredBlurClose();
}

class ComboBoxEditorPresenter extends TextInputPresenter {
  apply(_theme: Theme, state: TextInputVisualState, _colors: TextInputColors | null = null): void {
    const editableCursor = state.enabled ? CursorStyle.Text : CursorStyle.Default;
    this.host
      .bgColor(0x00000000)
      .cornerRadius(0.0)
      .border(0.0, 0x00000000)
      .padding(0.0, 0.0, 0.0, 0.0)
      .alignItems(AlignItems.Center)
      .cursor(editableCursor);
    this.host.opacity(state.enabled ? 1.0 : 0.6);
    this.editorHost.cursor(editableCursor);
    this.placeholderHost
      .position(0.0, 0.0)
      .width(100.0, Unit.Percent)
      .cursor(editableCursor);
  }
}

class ComboBoxEditorTemplate extends TextInputTemplate {
  create(): TextInputPresenter {
    return new ComboBoxEditorPresenter();
  }
}

function resolveTextInputColors(colors: DropdownColors | null, theme: Theme): TextInputColors | null {
  if (colors === null) {
    return null;
  }
  const inputColors = new TextInputColors();
  if (colors.hasBackground) {
    inputColors.background(colors.backgroundColor);
  }
  if (colors.hasTextPrimary) {
    inputColors.textPrimary(colors.textPrimaryColor);
  }
  if (colors.hasPlaceholder) {
    inputColors.placeholder(colors.placeholderColor);
  }
  if (colors.hasBorder) {
    inputColors.border(colors.borderColor);
  }
  if (colors.hasAccent) {
    inputColors.accent(colors.accentColor).caret(colors.accentColor);
  } else {
    inputColors.caret(theme.colors.accent);
  }
  return inputColors;
}

export enum ComboBoxFilterMode {
  None = 0,
  StartsWith = 1,
  Contains = 2,
}

export enum ComboBoxCommitMode {
  KeepText = 0,
  RevertToSelection = 1,
  SelectExactMatch = 2,
}

export class ComboBoxItem {
  constructor(readonly value: string) {}
}

export class ComboBox extends FlexBox implements GlobalKeyHandler, SelectablePopupListOwner {
  private static activeInstance: ComboBox | null = null;
  private static scrollHookRegistered: bool = false;

  private editor: TextInput = changetype<TextInput>(0);
  private chevronHost: FlexBox = changetype<FlexBox>(0);
  private chevronPresenter: DropdownChevronPresenter = changetype<DropdownChevronPresenter>(0);
  private popupList: SelectablePopupList = changetype<SelectablePopupList>(0);
  private readonly itemsValue: Array<ComboBoxItem> = new Array<ComboBoxItem>();
  private readonly filteredIndices: Array<i32> = new Array<i32>();
  private readonly disposables: Array<Disposable> = new Array<Disposable>();
  private disposed: bool = false;
  private openState: bool = false;
  private popupPointerPressedState: bool = false;
  private pointerPressedState: bool = false;
  private hoveredState: bool = false;
  private focusedState: bool = false;
  private wrapperFocusedState: bool = false;
  private editorFocusedState: bool = false;
  private deferredBlurClosePendingState: bool = false;
  private allowCustomValue: bool = true;
  private autoCompleteValue: bool = false;
  private openOnFocusValue: bool = false;
  private staysOpenOnEditValue: bool = true;
  private filterModeValue: ComboBoxFilterMode = ComboBoxFilterMode.Contains;
  private commitModeValue: ComboBoxCommitMode = ComboBoxCommitMode.KeepText;
  private keyFilterToken: u32 = 0;
  private selectedIndexValue: i32 = -1;
  private committedSelectedIndexValue: i32 = -1;
  private highlightedIndexValue: i32 = -1;
  private textValue: string = "";
  private chevronTemplateValue: DropdownChevronTemplate | null = null;
  private sizingValue: DropdownSizing | null = null;
  private colorsValue: DropdownColors | null = null;
  private popupPanelColorValue: u32 = 0x00000000;
  private popupPanelBackgroundBlurSigmaValue: f32 = DEFAULT_PANEL_BACKGROUND_BLUR_SIGMA;
  private popupPanelColorOverridden: bool = false;
  private popupPanelBackgroundBlurOverridden: bool = false;
  private suppressEditorChanged: bool = false;
  private lastAutoCompleteTextValue: string = "";
  private changedCallback: ((event: ComboBoxChangedEventArgs<ComboBoxItem>) => void) | null = null;
  private changedBinding: Callback1<ComboBoxChangedEventArgs<ComboBoxItem>> | null = null;
  private textChangedCallback: ((event: TextChangedEventArgs) => void) | null = null;
  private textChangedBinding: Callback1<TextChangedEventArgs> | null = null;

  constructor(text: string = "") {
    super();
    ComboBox.ensureScrollHook();
    const editor = new TextInput(text);
    const chevronPresenter = createChevronPresenter(null, null);
    const chevronHost = new FlexBox()
      .width(32.0, Unit.Pixel)
      .height(100.0, Unit.Percent)
      .alignItems(AlignItems.Center)
      .justifyContent(JustifyContent.Center);
    const popupList = new SelectablePopupList(this);
    this.editor = editor;
    this.chevronPresenter = chevronPresenter;
    this.chevronHost = chevronHost;
    this.popupList = popupList;
    this.textValue = text;
    this.rebuildFilteredIndices();
    popupList.popupPresenter.overlayNode.onPointerClickWith(this, (comboBox, _event) => comboBox.close());
    editor
      .template(new ComboBoxEditorTemplate())
      .fillWidth();
    editor
      .onChangedWith(this, (comboBox, event): void => comboBox.handleEditorTextChanged(event.text))
      .onFocusChangedWith(this, (comboBox, event): void => comboBox.handleEditorFocusChanged(event.focused));
    editor.editorNode.onKeyDownWith(this, (comboBox, event): void => {
      if (comboBox.handleEditorKeyDown(event.key, event.modifiers)) {
        event.handled = true;
      }
    });
    editor.editorNode._editorCommandKeys();
    chevronHost.child(chevronPresenter.root);
    chevronHost
      .onPointerClickWith(this, (comboBox, _event): void => comboBox.toggleFromChevron())
      .onPointerEnterWith(this, (comboBox, _event): void => {
        comboBox.hoveredState = true;
        comboBox.handleThemeChanged();
      })
      .onPointerLeaveWith(this, (comboBox, _event): void => {
        comboBox.pointerPressedState = false;
        comboBox.hoveredState = false;
        comboBox.handleThemeChanged();
      })
      .onPointerDownWith(this, (comboBox, _event): void => {
        comboBox.pointerPressedState = true;
        comboBox.focusEditorFromChevron();
        comboBox.handleThemeChanged();
      })
      .onPointerUpWith(this, (comboBox, _event): void => {
        comboBox.pointerPressedState = false;
        comboBox.handleThemeChanged();
      });
    this.semanticRole(SemanticRole.ComboBox);
    this.focusable(true);
    this.requireInteractive();
    this.reflectSemanticDisabledFromEnabled();
    this.cursor(CursorStyle.Text);
    this.flexDirection(FlexDirection.Row);
    this.alignItems(AlignItems.Center);
    this.child(editor);
    this.child(chevronHost);
    this.child(this.popupList.root);
    this.track(activeTheme.addAction(new HandlerAction<ComboBox, Theme>(this, (comboBox: ComboBox, _theme: Theme): void => {
      comboBox.handleThemeChanged();
    })));
    this.track(keyboardFocusVisible.addAction(new HandlerAction<ComboBox, bool>(this, (comboBox: ComboBox, _visible: bool): void => {
      comboBox.syncFocusChrome(activeTheme.value);
    })));
    this.semanticExpanded(false);
    this.setDefaultSemanticLabel("Combo box");
    this.handleThemeChanged();
  }

  get selectedIndex(): i32 {
    return this.selectedIndexValue;
  }

  get value(): string {
    return this.textValue;
  }

  get filteredCount(): i32 {
    return this.filteredIndices.length;
  }

  get highlightedIndex(): i32 {
    return this.highlightedIndexValue;
  }

  get isOpen(): bool {
    return this.openState;
  }

  items(items: Array<string>): this {
    this.close();
    this.itemsValue.length = 0;
    for (let index = 0; index < items.length; ++index) {
      this.itemsValue.push(new ComboBoxItem(unchecked(items[index])));
    }
    this.syncSelectionFromText();
    this.rebuildFilteredIndices();
    this.popupList.refreshPanelLayout();
    this.syncOptionVisuals();
    this.syncSemanticLabel();
    return this;
  }

  text(text: string): this {
    return this.setText(text, false);
  }

  placeholder(value: string): this {
    this.editor.placeholder(value);
    this.syncSemanticLabel();
    return this;
  }

  allowCustom(flag: bool = true): this {
    this.allowCustomValue = flag;
    this.syncSelectionFromText();
    return this;
  }

  autoComplete(flag: bool = true): this {
    this.autoCompleteValue = flag;
    return this;
  }

  filterMode(mode: ComboBoxFilterMode): this {
    this.filterModeValue = mode;
    this.rebuildFilteredIndices();
    this.refreshPopupAfterFilter();
    this.syncOptionVisuals();
    return this;
  }

  commitMode(mode: ComboBoxCommitMode): this {
    this.commitModeValue = mode;
    return this;
  }

  openOnFocus(flag: bool = true): this {
    this.openOnFocusValue = flag;
    return this;
  }

  staysOpenOnEdit(flag: bool = true): this {
    this.staysOpenOnEditValue = flag;
    return this;
  }

  maxVisibleItems(count: i32): this {
    this.popupList.maxVisibleItems(count);
    return this;
  }

  popupWidth(value: f32): this {
    this.popupList.popupWidth(value);
    return this;
  }

  popupPanelColor(color: u32): this {
    this.popupPanelColorOverridden = true;
    this.popupPanelColorValue = color;
    this.popupList.panelNode.bgColor(color);
    return this;
  }

  popupPanelBackgroundBlur(sigma: f32): this {
    this.popupPanelBackgroundBlurOverridden = true;
    if (sigma < 0.0) {
      warn("Layout", "ComboBox.popupPanelBackgroundBlur() received " + sigma.toString() + "; clamping to 0.0.");
    }
    this.popupPanelBackgroundBlurSigmaValue = sigma >= 0.0 ? sigma : 0.0;
    this.popupList.panelNode.backgroundBlur(this.popupPanelBackgroundBlurSigmaValue);
    return this;
  }

  sizing(sizing: DropdownSizing | null): this {
    this.sizingValue = sizing;
    const previousPresenter = this.chevronPresenter;
    const nextPresenter = createChevronPresenter(this.chevronTemplateValue, sizing);
    this.chevronPresenter = nextPresenter;
    this.chevronHost.removeChildNode(previousPresenter.root);
    this.chevronHost.addChildNode(nextPresenter.root);
    previousPresenter.root.dispose();
    this.popupList.sizing(sizing);
    this.handleThemeChanged();
    return this;
  }

  colors(colors: DropdownColors | null): this {
    this.colorsValue = colors;
    this.popupList.colors(colors);
    this.handleThemeChanged();
    return this;
  }

  chevronTemplate(template: DropdownChevronTemplate | null): this {
    this.chevronTemplateValue = template;
    const previousPresenter = this.chevronPresenter;
    const nextPresenter = createChevronPresenter(template, this.sizingValue);
    this.chevronPresenter = nextPresenter;
    this.chevronHost.removeChildNode(previousPresenter.root);
    this.chevronHost.addChildNode(nextPresenter.root);
    previousPresenter.root.dispose();
    this.handleThemeChanged();
    return this;
  }

  optionRowTemplate(template: DropdownOptionRowTemplate | null): this {
    this.close();
    this.popupList.optionRowTemplate(template);
    return this;
  }

  selectIndex(index: i32): this {
    this.setSelectedIndex(index, false);
    return this;
  }

  onChanged(callback: ((event: ComboBoxChangedEventArgs<ComboBoxItem>) => void) | null): this {
    this.changedCallback = callback;
    this.changedBinding = null;
    return this;
  }

  bindChanged<Owner>(owner: Owner, handler: Handler1<Owner, ComboBoxChangedEventArgs<ComboBoxItem>>): this {
    this.changedCallback = null;
    this.changedBinding = bind1<Owner, ComboBoxChangedEventArgs<ComboBoxItem>>(owner, handler);
    return this;
  }

  onChangedWith<Owner>(owner: Owner, handler: Handler1<Owner, ComboBoxChangedEventArgs<ComboBoxItem>>): this {
    this.bindChanged(owner, handler);
    return this;
  }

  onTextChanged(callback: ((event: TextChangedEventArgs) => void) | null): this {
    this.textChangedCallback = callback;
    this.textChangedBinding = null;
    return this;
  }

  bindTextChanged<Owner>(owner: Owner, handler: Handler1<Owner, TextChangedEventArgs>): this {
    this.textChangedCallback = null;
    this.textChangedBinding = bind1<Owner, TextChangedEventArgs>(owner, handler);
    return this;
  }

  onTextChangedWith<Owner>(owner: Owner, handler: Handler1<Owner, TextChangedEventArgs>): this {
    this.bindTextChanged(owner, handler);
    return this;
  }

  focusNow(): this {
    super.focusNow();
    return this;
  }

  dispose(): void {
    this.close();
    this.disposeControl();
    super.dispose();
  }

  static hideActiveComboBox(): void {
    const comboBox = ComboBox.activeInstance;
    if (comboBox !== null) {
      comboBox.close();
    }
  }

  static dismissActiveComboBoxIfTriggerOutOfViewport(): void {
    const comboBox = ComboBox.activeInstance;
    if (comboBox === null) {
      return;
    }
    if (!comboBox.isTriggerVisibleInViewport()) {
      comboBox.close();
    }
  }

  private static ensureScrollHook(): void {
    if (ComboBox.scrollHookRegistered) {
      return;
    }
    registerScrollHook((): void => ComboBox.dismissActiveComboBoxIfTriggerOutOfViewport());
    ComboBox.scrollHookRegistered = true;
  }

  handleGlobalKeyEvent(eventType: KeyEventType, key: string, modifiers: u32): bool {
    if (!this.openState || modifiers != 0 || eventType != KeyEventType.Down) {
      return false;
    }
    if (key == "Escape") {
      this.close();
      return true;
    }
    if (key == "Enter") {
      this.selectHighlighted();
      return true;
    }
    if (key == "Home") {
      this.highlightIndex(0);
      return true;
    }
    if (key == "End") {
      this.highlightIndex(this.filteredIndices.length - 1);
      return true;
    }
    if (key == "ArrowDown") {
      this.moveHighlight(1);
      return true;
    }
    if (key == "ArrowUp") {
      this.moveHighlight(-1);
      return true;
    }
    return false;
  }

  _handlePointerEvent(eventType: PointerEventType, x: f32, y: f32, modifiers: u32 = 0): void {
    super._handlePointerEvent(eventType, x, y, modifiers);
    if (!this.isEnabled) {
      return;
    }
    if (eventType == PointerEventType.Enter) {
      this.hoveredState = true;
      this.handleThemeChanged();
      return;
    }
    if (eventType == PointerEventType.Leave) {
      this.pointerPressedState = false;
      this.hoveredState = false;
      this.handleThemeChanged();
      return;
    }
    if (eventType == PointerEventType.Down) {
      this.pointerPressedState = true;
      this.editor.focusNow();
      this.handleThemeChanged();
      return;
    }
    if (eventType == PointerEventType.Up && this.pointerPressedState) {
      this.pointerPressedState = false;
      this.toggleOpen();
      this.handleThemeChanged();
    }
  }

  private toggleFromChevron(): void {
    if (!this.isEnabled) {
      return;
    }
    this.focusEditorFromChevron();
    this.toggleOpen();
    this.handleThemeChanged();
  }

  private focusEditorFromChevron(): void {
    this.editor.caretToEnd();
    this.editor.focusNow();
    this.editor.caretToEnd();
  }

  private toggleOpen(): void {
    if (this.openState) {
      this.close();
      return;
    }
    this.open();
  }

  _handleKeyEvent(eventType: KeyEventType, key: string, modifiers: u32): bool {
    const callbackHandled = super._handleKeyEvent(eventType, key, modifiers);
    if (!this.isEnabled || modifiers != 0 || eventType != KeyEventType.Down) {
      return callbackHandled;
    }
    if (!this.openState && (key == "Enter" || key == " " || key == "ArrowDown")) {
      this.open();
      return true;
    }
    if (!this.openState && key == "ArrowUp") {
      this.open();
      this.moveHighlight(-1);
      return true;
    }
    return callbackHandled;
  }

  _handleFocusChanged(focused: bool): void {
    super._handleFocusChanged(focused);
    this.wrapperFocusedState = focused;
    if (!focused && !this.openState) {
      this.pointerPressedState = false;
    }
    this.syncFocusedState();
  }

  protected _onEffectiveEnabledChanged(_isEnabled: bool): void {
    this.editor.enabled(this.isEnabled);
    if (!this.isEnabled) {
      this.pointerPressedState = false;
      this.hoveredState = false;
      this.close();
    }
    this.handleThemeChanged();
  }

  private handleEditorKeyDown(key: string, modifiers: u32): bool {
    if (!this.isEnabled || modifiers != 0) {
      return this.isTextNavigationKey(key, modifiers);
    }
    if (key == "ArrowDown") {
      if (!this.openState) {
        this.open();
      } else {
        this.moveHighlight(1);
      }
      return true;
    }
    if (key == "ArrowUp") {
      if (!this.openState) {
        this.open();
      }
      this.moveHighlight(-1);
      return true;
    }
    if (key == "Enter" && this.openState) {
      this.selectHighlighted();
      return true;
    }
    if (key == "Escape" && this.openState) {
      this.close();
      return true;
    }
    return this.isTextNavigationKey(key, modifiers);
  }

  private isTextNavigationKey(key: string, modifiers: u32): bool {
    const nonShiftModifiers = modifiers & (<u32>KeyModifier.Ctrl | <u32>KeyModifier.Alt | <u32>KeyModifier.Meta);
    return nonShiftModifiers == 0 &&
      (
        key == "ArrowLeft" ||
        key == "ArrowRight" ||
        key == "ArrowUp" ||
        key == "ArrowDown" ||
        key == "Home" ||
        key == "End" ||
        key == "PageUp" ||
        key == "PageDown"
      );
  }

  private handleEditorTextChanged(value: string): void {
    if (this.suppressEditorChanged) {
      return;
    }
    let nextValue = value;
    let selectionStart: u32 = 0;
    let selectionEnd: u32 = 0;
    const deletingText = value.length < this.textValue.length;
    const shouldAutoComplete = this.autoCompleteValue &&
      value.length > 0 &&
      !deletingText &&
      value != this.lastAutoCompleteTextValue;
    this.lastAutoCompleteTextValue = "";
    if (shouldAutoComplete) {
      const autoCompleteIndex = this.findAutoCompleteMatch(value);
      if (autoCompleteIndex >= 0) {
        const completedValue = unchecked(this.itemsValue[autoCompleteIndex]).value;
        if (completedValue.length > value.length) {
          nextValue = completedValue;
          selectionStart = codePointCount(value);
          selectionEnd = codePointCount(completedValue);
          this.lastAutoCompleteTextValue = value;
          this.suppressEditorChanged = true;
          this.editor.text(completedValue);
          this.editor.selectionRange(selectionStart, selectionEnd);
          this.suppressEditorChanged = false;
        }
      }
    }
    this.textValue = nextValue;
    this.syncSelectionFromText();
    this.rebuildFilteredIndices();
    if (this.filteredIndices.length == 0) {
      this.close();
    } else if (this.staysOpenOnEditValue) {
      this.highlightedIndexValue = 0;
      if (this.openState) {
        this.refreshOpenPopup();
      } else {
        this.open();
      }
    }
    this.refreshPopupAfterFilter();
    this.syncOptionVisuals();
    this.syncSemanticLabel();
    this.emitTextChanged(nextValue);
  }

  private handleEditorFocusChanged(focused: bool): void {
    this.editorFocusedState = focused;
    if (focused && this.openOnFocusValue) {
      this.open();
    }
    if (!focused && !this.openState) {
      this.commitCurrentText();
      this.pointerPressedState = false;
    }
    this.syncFocusedState();
  }

  private syncFocusedState(): void {
    const nextFocused = this.wrapperFocusedState || this.editorFocusedState;
    if (!nextFocused && !this.popupPointerPressedState) {
      this.scheduleDeferredBlurClose();
    }
    if (this.focusedState == nextFocused) {
      return;
    }
    this.focusedState = nextFocused;
    this.handleThemeChanged();
  }

  private scheduleDeferredBlurClose(): void {
    if (this.deferredBlurClosePendingState) {
      return;
    }
    this.deferredBlurClosePendingState = true;
    afterNextCommitWith<ComboBox>(this, handleComboBoxDeferredBlurClose);
    markNeedsCommit();
  }

  fireDeferredBlurClose(): void {
    this.deferredBlurClosePendingState = false;
    const nextFocused = this.wrapperFocusedState || this.editorFocusedState;
    if (!nextFocused && !this.popupPointerPressedState) {
      this.pointerPressedState = false;
      this.close();
    }
  }

  private setText(value: string, emit: bool): this {
    if (this.textValue == value) {
      return this;
    }
    this.textValue = value;
    this.suppressEditorChanged = true;
    this.editor.text(value);
    this.suppressEditorChanged = false;
    this.syncSelectionFromText();
    this.rebuildFilteredIndices();
    this.refreshPopupAfterFilter();
    this.syncOptionVisuals();
    this.syncSemanticLabel();
    if (emit) {
      this.emitTextChanged(value);
    }
    return this;
  }

  private setSelectedIndex(index: i32, emit: bool): void {
    if (index == -1) {
      this.selectedIndexValue = -1;
      this.committedSelectedIndexValue = -1;
      this.highlightedIndexValue = -1;
      this.popupList.setHighlightedIndex(-1);
      this.syncSemanticLabel();
      return;
    }
    if (this.itemsValue.length == 0) {
      if (index != -1) {
        warn("Layout", "ComboBox.selectIndex() received " + index.toString() + " before any items were assigned.");
      }
      return;
    }
    const clampedIndex = index < 0
      ? 0
      : (index >= this.itemsValue.length ? this.itemsValue.length - 1 : index);
    if (clampedIndex != index) {
      warn(
        "Layout",
        "ComboBox.selectIndex() received " +
          index.toString() +
          "; clamping to " +
          clampedIndex.toString() +
          ".",
      );
    }
    const changed = this.selectedIndexValue != clampedIndex;
    this.selectedIndexValue = clampedIndex;
    this.committedSelectedIndexValue = clampedIndex;
    const item = unchecked(this.itemsValue[clampedIndex]);
    this.setText(item.value, false);
    this.editor.caretToEnd();
    this.rebuildFilteredIndices();
    const visibleIndex = this.findVisibleIndexForSourceIndex(clampedIndex);
    this.highlightedIndexValue = visibleIndex;
    this.popupList.setHighlightedIndex(visibleIndex);
    this.syncSemanticLabel();
    if (emit && changed) {
      this.requestSemanticAnnouncement();
      this.emitSelectionChanged();
    }
  }

  private syncSelectionFromText(): void {
    const exactIndex = this.findExactTextMatch(this.textValue);
    if (exactIndex >= 0) {
      this.selectedIndexValue = exactIndex;
      return;
    }
    if (this.allowCustomValue) {
      this.selectedIndexValue = -1;
    }
  }

  private commitCurrentText(): void {
    if (this.commitModeValue == ComboBoxCommitMode.KeepText) {
      return;
    }
    if (this.commitModeValue == ComboBoxCommitMode.SelectExactMatch) {
      const exactIndex = this.findExactTextMatch(this.textValue);
      if (exactIndex >= 0) {
        this.setSelectedIndex(exactIndex, true);
        return;
      }
    }
    if (this.commitModeValue == ComboBoxCommitMode.RevertToSelection) {
      if (this.committedSelectedIndexValue >= 0 && this.committedSelectedIndexValue < this.itemsValue.length) {
        this.setText(unchecked(this.itemsValue[this.committedSelectedIndexValue]).value, true);
        this.editor.caretToEnd();
        this.selectedIndexValue = this.committedSelectedIndexValue;
      }
    }
  }

  private emitSelectionChanged(): void {
    if (this.selectedIndexValue < 0 || this.selectedIndexValue >= this.itemsValue.length) {
      return;
    }
    const item = unchecked(this.itemsValue[this.selectedIndexValue]);
    const event = new ComboBoxChangedEventArgs<ComboBoxItem>(item, this.selectedIndexValue);
    const callback = this.changedCallback;
    if (callback !== null) {
      callback(event);
    }
    const binding = this.changedBinding;
    if (binding !== null) {
      binding.invoke(event);
    }
  }

  private emitTextChanged(value: string): void {
    const event = new TextChangedEventArgs(value);
    const callback = this.textChangedCallback;
    if (callback !== null) {
      callback(event);
    }
    const binding = this.textChangedBinding;
    if (binding !== null) {
      binding.invoke(event);
    }
  }

  private open(): void {
    if (this.openState || this.filteredIndices.length == 0 || this.builtHandle == 0) {
      return;
    }
    const initialHighlight = this.selectedIndexValue >= 0
      ? this.findVisibleIndexForSourceIndex(this.selectedIndexValue)
      : 0;
    this.popupList.setHighlightedIndex(initialHighlight);
    this.highlightedIndexValue = this.popupList.highlightedIndex;
    const bounds = this.tryGetViewportBounds();
    if (bounds !== null) {
      if (!this.popupList.open(unchecked(bounds[0]), unchecked(bounds[1]), unchecked(bounds[2]), unchecked(bounds[3]), initialHighlight)) {
        return;
      }
      this.highlightedIndexValue = this.popupList.highlightedIndex;
    }
    this.openState = true;
    ComboBox.activeInstance = this;
    this.semanticExpanded(true);
    this.requestSemanticAnnouncement();
    if (this.keyFilterToken == 0) {
      this.keyFilterToken = EventRouter.pushKeyFilter(this);
    }
    this.handleThemeChanged();
  }

  private close(): void {
    if (!this.openState && !this.popupList.isOpen) {
      return;
    }
    this.deferredBlurClosePendingState = false;
    this.popupPointerPressedState = false;
    this.popupList.close();
    this.openState = false;
    if (ComboBox.activeInstance === this) {
      ComboBox.activeInstance = null;
    }
    this.semanticExpanded(false);
    this.requestSemanticAnnouncement();
    if (this.keyFilterToken != 0) {
      EventRouter.removeKeyFilter(this.keyFilterToken);
      this.keyFilterToken = 0;
    }
    this.commitCurrentText();
    this.handleThemeChanged();
  }

  private tryGetViewportBounds(): Float32Array | null {
    if (this.builtHandle == 0) {
      return null;
    }
    return ui.tryGetBounds(this.builtHandle);
  }

  private findContainingScrollView(): ScrollView | null {
    let current: Node | null = this.parentNode;
    while (current !== null) {
      if (current instanceof ScrollView) {
        return current as ScrollView;
      }
      current = current.parentNode;
    }
    return null;
  }

  private isTriggerVisibleInViewport(): bool {
    const bounds = this.tryGetViewportBounds();
    if (bounds === null) {
      return true;
    }
    const x = unchecked(bounds[0]);
    const y = unchecked(bounds[1]);
    const width = unchecked(bounds[2]);
    const height = unchecked(bounds[3]);
    if (width <= 0.0 || height <= 0.0) {
      return true;
    }
    const right = x + width;
    const bottom = y + height;
    const scrollView = this.findContainingScrollView();
    if (scrollView === null) {
      const viewportWidth = ui.getViewportWidth();
      const viewportHeight = ui.getViewportHeight();
      return right > 0.0 && bottom > 0.0 && x < viewportWidth && y < viewportHeight;
    }
    const scrollViewBounds = ui.tryGetBounds(scrollView.builtHandle);
    if (scrollViewBounds === null) {
      const viewportWidth = ui.getViewportWidth();
      const viewportHeight = ui.getViewportHeight();
      return right > 0.0 && bottom > 0.0 && x < viewportWidth && y < viewportHeight;
    }
    const svX = unchecked(scrollViewBounds[0]);
    const svY = unchecked(scrollViewBounds[1]);
    const svWidth = unchecked(scrollViewBounds[2]);
    const svHeight = unchecked(scrollViewBounds[3]);
    return right > svX && bottom > svY && x < svX + svWidth && y < svY + svHeight;
  }

  private highlightIndex(index: i32): void {
    this.popupList.highlightIndex(index);
    this.highlightedIndexValue = this.popupList.highlightedIndex;
  }

  private moveHighlight(delta: i32): void {
    this.popupList.moveHighlight(delta);
    this.highlightedIndexValue = this.popupList.highlightedIndex;
  }

  private refreshPopupAfterFilter(): void {
    if (this.openState) {
      this.refreshOpenPopup();
      return;
    }
    this.popupList.refreshPanelLayout();
  }

  private refreshOpenPopup(): void {
    const bounds = this.tryGetViewportBounds();
    if (bounds === null) {
      this.popupList.refreshPanelLayout();
      return;
    }
    this.popupList.refreshOpen(
      unchecked(bounds[0]),
      unchecked(bounds[1]),
      unchecked(bounds[2]),
      unchecked(bounds[3]),
      this.highlightedIndexValue,
    );
    this.highlightedIndexValue = this.popupList.highlightedIndex;
  }

  private selectHighlighted(): void {
    if (this.highlightedIndexValue < 0 || this.highlightedIndexValue >= this.filteredIndices.length) {
      return;
    }
    this.setSelectedIndex(unchecked(this.filteredIndices[this.highlightedIndexValue]), true);
    this.close();
  }

  private rebuildFilteredIndices(): void {
    this.filteredIndices.length = 0;
    for (let index = 0; index < this.itemsValue.length; ++index) {
      if (this.shouldIncludeItem(unchecked(this.itemsValue[index]))) {
        this.filteredIndices.push(index);
      }
    }
    if (this.highlightedIndexValue >= this.filteredIndices.length) {
      this.highlightedIndexValue = this.filteredIndices.length > 0 ? this.filteredIndices.length - 1 : -1;
    }
  }

  private shouldIncludeItem(item: ComboBoxItem): bool {
    if (this.filterModeValue == ComboBoxFilterMode.None || this.textValue.length == 0) {
      return true;
    }
    if (this.filterModeValue == ComboBoxFilterMode.StartsWith) {
      return stringStartsWithIgnoreCase(item.value, this.textValue);
    }
    return stringContainsIgnoreCase(item.value, this.textValue);
  }

  private findAutoCompleteMatch(text: string): i32 {
    for (let index = 0; index < this.itemsValue.length; ++index) {
      if (stringStartsWithIgnoreCase(unchecked(this.itemsValue[index]).value, text)) {
        return index;
      }
    }
    return -1;
  }

  private findExactTextMatch(text: string): i32 {
    for (let index = 0; index < this.itemsValue.length; ++index) {
      const item = unchecked(this.itemsValue[index]);
      if (stringsEqualIgnoreCase(item.value, text)) {
        return index;
      }
    }
    return -1;
  }

  private findVisibleIndexForSourceIndex(sourceIndex: i32): i32 {
    for (let index = 0; index < this.filteredIndices.length; ++index) {
      if (unchecked(this.filteredIndices[index]) == sourceIndex) {
        return index;
      }
    }
    return this.filteredIndices.length > 0 ? 0 : -1;
  }

  private handleThemeChanged(): void {
    if (this.disposed) {
      return;
    }
    const theme = activeTheme.value;
    if (!this.popupPanelColorOverridden) {
      this.popupPanelColorValue = theme.contextMenu.panelBackground;
    }
    if (!this.popupPanelBackgroundBlurOverridden) {
      this.popupPanelBackgroundBlurSigmaValue = DEFAULT_PANEL_BACKGROUND_BLUR_SIGMA;
    }
    const sizing = this.sizingValue;
    const fieldHeight = sizing !== null && sizing.hasFieldHeight ? sizing.fieldHeightPx : 32.0;
    const chevronBoxSize = sizing !== null && sizing.hasChevronBoxSize ? sizing.chevronBoxSizePx : 32.0;
    const fieldFontSize = sizing !== null && sizing.hasFieldFontSize ? sizing.fieldFontSizePx : theme.fonts.sizeBody;
    const fieldBorderWidth: f32 = 2.0;
    const fieldContentHeight = <f32>Math.max(0.0, fieldHeight - (fieldBorderWidth * 2.0));
    this.cursor(this.isEnabled ? CursorStyle.Text : CursorStyle.Default);
    this.cornerRadius(0.0);
    this.border(0.0, 0x00000000);
    this.padding(0.0, 0.0, 0.0, 0.0);
    this.bgColor(0x00000000);
    this.opacity(this.isEnabled ? 1.0 : 0.6);
    const colors = this.colorsValue;
    const fieldBackground = colors !== null && colors.hasBackground ? colors.backgroundColor : theme.colors.surface;
    const fieldBorderColor = colors !== null && colors.hasBorder ? colors.borderColor : theme.colors.border;
    this.height(fieldHeight, Unit.Pixel);
    this.cornerRadius(theme.spacing.sm);
    this.border(fieldBorderWidth, fieldBorderColor);
    this.padding(16.0, 0.0, 8.0, 0.0);
    this.bgColor(fieldBackground);
    this.editor.height(fieldContentHeight, Unit.Pixel);
    this.editor
      .fontSize(fieldFontSize)
      .lineHeight(fieldContentHeight)
      .colors(resolveTextInputColors(this.colorsValue, theme));
    this.chevronHost
      .width(chevronBoxSize, Unit.Pixel)
      .height(fieldContentHeight, Unit.Pixel)
      .alignItems(AlignItems.Center)
      .justifyContent(JustifyContent.Center)
      .cursor(this.isEnabled ? CursorStyle.Pointer : CursorStyle.Default);
    this.chevronPresenter.apply(theme, new DropdownChevronVisualState(this.openState, this.hoveredState, this.isEnabled));
    this.popupList.panelNode
      .padding(
        SELECTABLE_POPUP_LIST_PANEL_PADDING,
        SELECTABLE_POPUP_LIST_PANEL_PADDING,
        SELECTABLE_POPUP_LIST_PANEL_PADDING,
        SELECTABLE_POPUP_LIST_PANEL_PADDING,
      )
      .cornerRadius(theme.spacing.sm)
      .bgColor(this.popupPanelColorValue)
      .border(1.0, theme.contextMenu.panelBorderColor)
      .backgroundBlur(this.popupPanelBackgroundBlurSigmaValue)
      .dropShadow(
        theme.contextMenu.panelShadowColor,
        0.0,
        theme.contextMenu.shadowOffsetY,
        theme.contextMenu.shadowBlur,
        theme.contextMenu.shadowSpread,
      );
    this.popupList.popupScrollBox.bgColor(0x00000000);
    this.syncOptionVisuals();
    this.syncFocusChrome(theme);
  }

  private syncOptionVisuals(): void {
    this.popupList.syncOptionVisuals();
  }

  private syncSemanticLabel(): void {
    if (this.textValue.length > 0) {
      this.setDefaultSemanticLabel(this.textValue);
      return;
    }
    this.setDefaultSemanticLabel("Combo box");
  }

  private syncFocusChrome(theme: Theme): void {
    if (this.focusedState && this.isEnabled && keyboardFocusVisible.value) {
      FocusAdornerManager.showStandard(this, theme.spacing.sm);
      return;
    }
    FocusAdornerManager.hideOwner(this);
  }

  private track(disposable: Disposable): void {
    this.disposables.push(disposable);
  }

  private disposeControl(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.popupList.dispose();
    disposeAll(this.disposables);
    FocusAdornerManager.hideOwner(this);
  }

  getPopupListItemCount(): i32 {
    return this.filteredIndices.length;
  }

  getPopupListItemLabel(index: i32): string {
    return unchecked(this.itemsValue[unchecked(this.filteredIndices[index])]).value;
  }

  isPopupListItemSelected(index: i32): bool {
    if (index < 0 || index >= this.filteredIndices.length) {
      return false;
    }
    return unchecked(this.filteredIndices[index]) == this.selectedIndexValue;
  }

  isPopupListEnabled(): bool {
    return this.isEnabled;
  }

  popupListHighlightIndex(index: i32): void {
    this.highlightIndex(index);
  }

  popupListActivateIndex(index: i32): void {
    this.highlightIndex(index);
    this.selectHighlighted();
  }

  popupListPointerDown(_index: i32): void {
    this.popupPointerPressedState = true;
  }

  popupListPointerUp(_index: i32): void {
    this.popupPointerPressedState = false;
    this.syncFocusedState();
  }

}
