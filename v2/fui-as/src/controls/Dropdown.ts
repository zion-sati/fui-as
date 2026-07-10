import * as ui from "../bindings/ui";
import { HandlerAction } from "../core/Action";
import { Callback1, Handler1 } from "../core/BoundCallback";
import { Disposable, disposeAll } from "../core/Disposable";
import { EventRouter, GlobalKeyHandler } from "../core/EventRouter";
import { FocusAdornerManager } from "../core/FocusAdornerManager";
import { keyboardFocusVisible } from "../core/FocusVisibility";
import {
  AlignItems,
  CursorStyle,
  FlexDirection,
  KeyEventType,
  PointerEventType,
  SemanticRole,
  Unit,
} from "../core/ffi";
import { Theme, activeTheme } from "../core/Theme";
import { warn } from "../core/Logger";
import { DropdownChangedEventArgs, Node } from "../core/Node";
import { PersistedInt32Codec, PersistedValueState } from "../core/PersistedState";
import { registerScrollHook } from "../core/ScrollHooks";
import { FlexBox, ScrollView } from "../nodes";
import { bind1 } from "../core/bind";
import { DropdownSizing } from "./ControlSizing";
import { DropdownColors } from "./DropdownColors";
import { getControlTemplates } from "./ControlTemplateSet";
import {
  createDefaultDropdownChevronPresenter,
  DropdownChevronPresenter,
  DropdownChevronTemplate,
  DropdownChevronVisualState,
} from "./internal/DropdownChevronPresenter";
import {
  createDefaultDropdownFieldPresenter,
  DropdownFieldPresenter,
  DropdownFieldTemplate,
  DropdownFieldVisualState,
} from "./internal/DropdownFieldPresenter";
import { DropdownOptionRowTemplate } from "./internal/DropdownOptionRowPresenter";
import {
  SELECTABLE_POPUP_LIST_PANEL_PADDING,
  SelectablePopupList,
  SelectablePopupListOwner,
} from "./internal/SelectablePopupList";

const DEFAULT_PANEL_BACKGROUND_BLUR_SIGMA: f32 = 10.0;
const DROPDOWN_PERSISTED_CODEC = new PersistedInt32Codec();

function isActivationKey(key: string): bool {
  return key == "Enter" || key == " " || key == "ArrowDown";
}

class PersistedDropdownState extends PersistedValueState<Dropdown, i32> {
  constructor() {
    super("dropdown-selected-index", DROPDOWN_PERSISTED_CODEC, 1);
  }

  protected shouldCaptureValue(node: Dropdown): bool {
    return node.selectedIndex >= 0;
  }

  protected captureValue(node: Dropdown): i32 {
    return node.selectedIndex;
  }

  protected restoreValue(node: Dropdown, value: i32): void {
    node._applyPersistedSelectedIndex(value);
  }
}

const DROPDOWN_PERSISTED_STATE = new PersistedDropdownState();

function createFieldPresenter(template: DropdownFieldTemplate | null, sizing: DropdownSizing | null = null): DropdownFieldPresenter {
  if (template !== null) {
    return template.create(sizing);
  }
  const templateSet = getControlTemplates();
  const appTemplate = templateSet !== null ? templateSet.dropdownField : null;
  return appTemplate === null
    ? createDefaultDropdownFieldPresenter(sizing)
    : appTemplate.create(sizing);
}

function createChevronPresenter(template: DropdownChevronTemplate | null, sizing: DropdownSizing | null = null): DropdownChevronPresenter {
  if (template !== null) {
    return template.create(sizing);
  }
  const templateSet = getControlTemplates();
  const appTemplate = templateSet !== null ? templateSet.dropdownChevron : null;
  return appTemplate === null
    ? createDefaultDropdownChevronPresenter(sizing)
    : appTemplate.create(sizing);
}

export class DropdownItem {
  constructor(readonly value: string, readonly label: string = value) {}
}

export class Dropdown extends FlexBox implements GlobalKeyHandler, SelectablePopupListOwner {
  private static activeInstance: Dropdown | null = null;
  private static scrollHookRegistered: bool = false;

  private fieldTemplateValue: DropdownFieldTemplate | null = null;
  private chevronTemplateValue: DropdownChevronTemplate | null = null;
  private optionRowTemplateValue: DropdownOptionRowTemplate | null = null;
  private sizingValue: DropdownSizing | null = null;
  private colorsValue: DropdownColors | null = null;
  private fieldPresenter: DropdownFieldPresenter = changetype<DropdownFieldPresenter>(0);
  private chevronPresenter: DropdownChevronPresenter = changetype<DropdownChevronPresenter>(0);
  private popupList: SelectablePopupList = changetype<SelectablePopupList>(0);
  private readonly itemsValue: Array<DropdownItem> = new Array<DropdownItem>();
  private readonly disposables: Array<Disposable> = new Array<Disposable>();
  private disposed: bool = false;
  private openState: bool = false;
  private pointerPressedState: bool = false;
  private hoveredState: bool = false;
  private focusedState: bool = false;
  private keyFilterToken: u32 = 0;
  private selectedIndexValue: i32 = -1;
  private highlightedIndexValue: i32 = -1;
  private popupPanelColorValue: u32 = 0x00000000;
  private popupPanelBackgroundBlurSigmaValue: f32 = DEFAULT_PANEL_BACKGROUND_BLUR_SIGMA;
  private popupPanelColorOverridden: bool = false;
  private popupPanelBackgroundBlurOverridden: bool = false;
  private changedCallback: ((event: DropdownChangedEventArgs<DropdownItem>) => void) | null = null;
  private changedBinding: Callback1<DropdownChangedEventArgs<DropdownItem>> | null = null;

  constructor() {
    super();
    Dropdown.ensureScrollHook();
    const fieldPresenter = createFieldPresenter(null, null);
    const chevronPresenter = createChevronPresenter(null, null);
    const popupList = new SelectablePopupList(this);
    this.fieldPresenter = fieldPresenter;
    this.chevronPresenter = chevronPresenter;
    this.popupList = popupList;
    popupList.popupPresenter.overlayNode.onPointerClickWith(this, (dropdown, _event) => dropdown.close());
    this.semanticRole(SemanticRole.ComboBox);
    this.focusable(true);
    this.requireInteractive();
    this.reflectSemanticDisabledFromEnabled();
    this.cursor(CursorStyle.Pointer);
    this.flexDirection(FlexDirection.Row);
    this.alignItems(AlignItems.Center);
    fieldPresenter.root.fillWidth();
    fieldPresenter.chevronHost.child(chevronPresenter.root);
    this.child(fieldPresenter.root);
    this.child(this.popupList.root);
    this.track(activeTheme.addAction(new HandlerAction<Dropdown, Theme>(this, (dropdown: Dropdown, _theme: Theme): void => {
      dropdown.handleThemeChanged();
    })));
    this.track(keyboardFocusVisible.addAction(new HandlerAction<Dropdown, bool>(this, (dropdown: Dropdown, _visible: bool): void => {
      dropdown.handleThemeChanged();
    })));
    this.semanticExpanded(false);
    this.setDefaultSemanticLabel("Dropdown");
    this.handleThemeChanged();
    this.persistState(DROPDOWN_PERSISTED_STATE);
  }

  get selectedIndex(): i32 {
    return this.selectedIndexValue;
  }

  items(items: Array<DropdownItem>): this {
    this.clearItems();
    for (let index = 0; index < items.length; ++index) {
      this.itemsValue.push(unchecked(items[index]));
    }
    if (this.selectedIndexValue >= this.itemsValue.length) {
      this.selectedIndexValue = this.itemsValue.length > 0 ? 0 : -1;
    } else if (this.selectedIndexValue < 0 && this.itemsValue.length > 0) {
      this.selectedIndexValue = 0;
    }
    this.popupList.refreshPanelLayout();
    this.syncValueLabel();
    this.handleThemeChanged();
    return this;
  }

  onChanged(callback: ((event: DropdownChangedEventArgs<DropdownItem>) => void) | null): this {
    this.changedCallback = callback;
    this.changedBinding = null;
    return this;
  }

  bindChanged<Owner>(owner: Owner, handler: Handler1<Owner, DropdownChangedEventArgs<DropdownItem>>): this {
    this.changedCallback = null;
    this.changedBinding = bind1<Owner, DropdownChangedEventArgs<DropdownItem>>(owner, handler);
    return this;
  }

  onChangedWith<Owner>(owner: Owner, handler: Handler1<Owner, DropdownChangedEventArgs<DropdownItem>>): this {
    this.bindChanged(owner, handler);
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
      warn("Layout", "Dropdown.popupPanelBackgroundBlur() received " + sigma.toString() + "; clamping to 0.0.");
    }
    this.popupPanelBackgroundBlurSigmaValue = sigma >= 0.0 ? sigma : 0.0;
    this.popupList.panelNode.backgroundBlur(this.popupPanelBackgroundBlurSigmaValue);
    return this;
  }

  sizing(sizing: DropdownSizing | null): this {
    this.close();
    this.sizingValue = sizing;
    if (this.usesDefaultFieldPresenter()) {
      this.replaceFieldPresenter(
        createFieldPresenter(this.fieldTemplateValue, this.sizingValue),
        createChevronPresenter(this.chevronTemplateValue, this.sizingValue),
      );
    } else if (this.usesDefaultChevronPresenter()) {
      const previousPresenter = this.chevronPresenter;
      const nextPresenter = createChevronPresenter(this.chevronTemplateValue, this.sizingValue);
      this.chevronPresenter = nextPresenter;
      this.fieldPresenter.chevronHost.removeChildNode(previousPresenter.root);
      this.fieldPresenter.chevronHost.addChildNode(nextPresenter.root);
      previousPresenter.root.dispose();
    }
    this.popupList.sizing(this.sizingValue);
    this.syncValueLabel();
    this.handleThemeChanged();
    return this;
  }

  colors(colors: DropdownColors | null): this {
    this.colorsValue = colors;
    this.popupList.colors(colors);
    this.handleThemeChanged();
    return this;
  }

  fieldTemplate(template: DropdownFieldTemplate | null): this {
    this.close();
    this.fieldTemplateValue = template;
    const nextFieldPresenter = createFieldPresenter(template, this.sizingValue);
    const nextChevronPresenter = createChevronPresenter(this.chevronTemplateValue, this.sizingValue);
    this.replaceFieldPresenter(nextFieldPresenter, nextChevronPresenter);
    this.syncValueLabel();
    this.handleThemeChanged();
    return this;
  }

  chevronTemplate(template: DropdownChevronTemplate | null): this {
    this.close();
    this.chevronTemplateValue = template;
    const previousPresenter = this.chevronPresenter;
    const nextPresenter = createChevronPresenter(template, this.sizingValue);
    this.chevronPresenter = nextPresenter;
    this.fieldPresenter.chevronHost.removeChildNode(previousPresenter.root);
    this.fieldPresenter.chevronHost.addChildNode(nextPresenter.root);
    previousPresenter.root.dispose();
    this.handleThemeChanged();
    return this;
  }

  optionRowTemplate(template: DropdownOptionRowTemplate | null): this {
    this.close();
    this.optionRowTemplateValue = template;
    this.popupList.optionRowTemplate(template);
    return this;
  }

  selectIndex(index: i32): this {
    this.setSelectedIndex(index, false);
    return this;
  }

  _applyPersistedSelectedIndex(index: i32): void {
    this.setSelectedIndex(index, true);
  }

  dispose(): void {
    this.close();
    this.disposeControl();
    super.dispose();
  }

  static hideActiveDropdown(): void {
    const dropdown = Dropdown.activeInstance;
    if (dropdown !== null) {
      dropdown.close();
    }
  }

  static dismissActiveDropdownIfTriggerOutOfViewport(): void {
    const dropdown = Dropdown.activeInstance;
    if (dropdown === null) {
      return;
    }
    if (!dropdown.isTriggerVisibleInViewport()) {
      dropdown.close();
    }
  }

  private static ensureScrollHook(): void {
    if (Dropdown.scrollHookRegistered) {
      return;
    }
    registerScrollHook((): void => Dropdown.dismissActiveDropdownIfTriggerOutOfViewport());
    Dropdown.scrollHookRegistered = true;
  }

  highlightIndex(index: i32): void {
    this.popupList.highlightIndex(index);
    this.highlightedIndexValue = this.popupList.highlightedIndex;
  }

  selectHighlighted(): void {
    if (this.highlightedIndexValue < 0 || this.highlightedIndexValue >= this.itemsValue.length) {
      return;
    }
    this.setSelectedIndex(this.highlightedIndexValue, true);
    this.close();
  }

  handleGlobalKeyEvent(eventType: KeyEventType, key: string, modifiers: u32): bool {
    if (!this.openState || modifiers != 0) {
      return false;
    }
    if (eventType != KeyEventType.Down) {
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
      this.highlightIndex(this.itemsValue.length - 1);
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
      this.handleThemeChanged();
      return;
    }
    if (eventType == PointerEventType.Up && this.pointerPressedState) {
      this.pointerPressedState = false;
      if (this.openState) {
        this.close();
      } else {
        this.open();
      }
      this.handleThemeChanged();
    }
  }

  _handleKeyEvent(eventType: KeyEventType, key: string, modifiers: u32): bool {
    const callbackHandled = super._handleKeyEvent(eventType, key, modifiers);
    if (!this.isEnabled || modifiers != 0 || eventType != KeyEventType.Down) {
      return callbackHandled;
    }
    if (!this.openState && isActivationKey(key)) {
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
    this.focusedState = focused;
    if (!focused && !this.openState) {
      this.pointerPressedState = false;
    }
    this.handleThemeChanged();
  }

  protected _onEffectiveEnabledChanged(_isEnabled: bool): void {
    if (!this.isEnabled) {
      this.pointerPressedState = false;
      this.hoveredState = false;
      this.close();
    }
    this.handleThemeChanged();
  }

  private setSelectedIndex(index: i32, emit: bool): void {
    if (index == -1) {
      this.selectedIndexValue = -1;
      this.highlightedIndexValue = -1;
      this.popupList.setHighlightedIndex(-1);
      this.syncValueLabel();
      this.handleThemeChanged();
      return;
    }
    if (this.itemsValue.length == 0) {
      if (index != -1) {
        warn("Layout", "Dropdown.selectIndex() received " + index.toString() + " before any items were assigned.");
      }
      return;
    }
    const clampedIndex = index < 0
      ? 0
      : (index >= this.itemsValue.length ? this.itemsValue.length - 1 : index);
    if (clampedIndex != index) {
      warn(
        "Layout",
        "Dropdown.selectIndex() received " +
          index.toString() +
          "; clamping to " +
          clampedIndex.toString() +
          ".",
      );
    }
    const changed = this.selectedIndexValue != clampedIndex;
    this.selectedIndexValue = clampedIndex;
    this.highlightedIndexValue = clampedIndex;
    this.popupList.setHighlightedIndex(clampedIndex);
    this.syncValueLabel();
    this.handleThemeChanged();
    if (emit && changed) {
      this.requestSemanticAnnouncement();
      this.emitSelectionChanged();
    }
  }

  private emitSelectionChanged(): void {
    if (this.selectedIndexValue < 0 || this.selectedIndexValue >= this.itemsValue.length) {
      return;
    }
    const item = unchecked(this.itemsValue[this.selectedIndexValue]);
    const event = new DropdownChangedEventArgs<DropdownItem>(item, this.selectedIndexValue);
    const callback = this.changedCallback;
    if (callback !== null) {
      callback(event);
    }
    const binding = this.changedBinding;
    if (binding !== null) {
      binding.invoke(event);
    }
  }

  private open(): void {
    if (this.openState || this.itemsValue.length == 0 || this.builtHandle == 0) {
      return;
    }
    const initialHighlight = this.selectedIndexValue >= 0
      ? this.selectedIndexValue
      : (this.itemsValue.length > 0 ? 0 : -1);
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
    Dropdown.activeInstance = this;
    this.semanticExpanded(true);
    this.requestSemanticAnnouncement();
    if (this.keyFilterToken == 0) {
      this.keyFilterToken = EventRouter.pushKeyFilter(this);
    }
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
    const svRight = svX + svWidth;
    const svBottom = svY + svHeight;
    
    return right > svX && bottom > svY && x < svRight && y < svBottom;
  }

  private close(): void {
    if (!this.openState && !this.popupList.isOpen) {
      return;
    }
    this.popupList.close();
    this.openState = false;
    if (Dropdown.activeInstance === this) {
      Dropdown.activeInstance = null;
    }
    this.semanticExpanded(false);
    this.requestSemanticAnnouncement();
    if (this.keyFilterToken != 0) {
      EventRouter.removeKeyFilter(this.keyFilterToken);
      this.keyFilterToken = 0;
    }
    this.handleThemeChanged();
  }

  private syncValueLabel(): void {
    if (this.selectedIndexValue >= 0 && this.selectedIndexValue < this.itemsValue.length) {
      const label = unchecked(this.itemsValue[this.selectedIndexValue]).label;
      this.fieldPresenter.valueNode.text(label);
      this.setDefaultSemanticLabel(label);
      return;
    }
    this.fieldPresenter.valueNode.text("");
    this.setDefaultSemanticLabel("Dropdown");
  }

  private syncOptionVisuals(): void {
    this.popupList.syncOptionVisuals();
  }

  private moveHighlight(delta: i32): void {
    if (this.popupList.highlightedIndex < 0 && this.selectedIndexValue >= 0) {
      this.popupList.setHighlightedIndex(this.selectedIndexValue);
    }
    this.popupList.moveHighlight(delta);
    this.highlightedIndexValue = this.popupList.highlightedIndex;
  }

  private clearItems(): void {
    this.close();
    this.itemsValue.length = 0;
    this.selectedIndexValue = -1;
    this.highlightedIndexValue = -1;
    this.popupList.clear();
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
    this.cursor(this.isEnabled ? CursorStyle.Pointer : CursorStyle.Default);
    this.cornerRadius(0.0);
    this.border(0.0, 0x00000000);
    this.padding(0.0, 0.0, 0.0, 0.0);
    this.bgColor(0x00000000);
    this.opacity(this.isEnabled ? 1.0 : 0.6);
    this.fieldPresenter.root.fillWidth();
    this.fieldPresenter.apply(
      theme,
      new DropdownFieldVisualState(
        this.openState,
        this.focusedState,
        this.isEnabled,
        this.pointerPressedState,
        this.selectedIndexValue >= 0 && this.selectedIndexValue < this.itemsValue.length
          ? unchecked(this.itemsValue[this.selectedIndexValue]).label
          : "",
      ),
      this.colorsValue,
    );
    this.chevronPresenter.apply(
      theme,
      new DropdownChevronVisualState(
        this.openState,
        this.hoveredState,
        this.isEnabled,
      ),
    );
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

  private syncFocusChrome(theme: Theme): void {
    if (this.focusedState && this.isEnabled && keyboardFocusVisible.value) {
      FocusAdornerManager.showStandard(this, theme.spacing.sm);
      return;
    }
    FocusAdornerManager.hideOwner(this);
  }

  private replaceFieldPresenter(nextFieldPresenter: DropdownFieldPresenter, nextChevronPresenter: DropdownChevronPresenter): void {
    const previousFieldRoot = this.fieldPresenter.root;
    this.fieldPresenter = nextFieldPresenter;
    this.chevronPresenter = nextChevronPresenter;
    nextFieldPresenter.root.fillWidth();
    nextFieldPresenter.chevronHost.addChildNode(nextChevronPresenter.root);
    const children = new Array<Node>();
    children.push(nextFieldPresenter.root);
    children.push(this.popupList.root);
    this.replaceChildren(children);
    previousFieldRoot.dispose();
  }

  private usesDefaultFieldPresenter(): bool {
    if (this.fieldTemplateValue !== null) {
      return false;
    }
    const templateSet = getControlTemplates();
    return templateSet === null || templateSet.dropdownField === null;
  }

  private usesDefaultChevronPresenter(): bool {
    if (this.chevronTemplateValue !== null) {
      return false;
    }
    const templateSet = getControlTemplates();
    return templateSet === null || templateSet.dropdownChevron === null;
  }

  getPopupListItemCount(): i32 {
    return this.itemsValue.length;
  }

  getPopupListItemLabel(index: i32): string {
    return unchecked(this.itemsValue[index]).label;
  }

  isPopupListItemSelected(index: i32): bool {
    return index == this.selectedIndexValue;
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
  }

  popupListPointerUp(_index: i32): void {
  }
}
