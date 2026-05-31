import * as ui from "../bindings/ui";
import { HandlerAction } from "../core/Action";
import { Callback2, Handler2 } from "../core/BoundCallback";
import { Disposable, disposeAll } from "../core/Disposable";
import { EventRouter, GlobalKeyHandler } from "../core/EventRouter";
import { FocusAdornerManager } from "../core/FocusAdornerManager";
import { keyboardFocusVisible } from "../core/FocusVisibility";
import {
  AlignItems,
  BorderStyle,
  CursorStyle,
  FlexDirection,
  KeyEventType,
  PointerEventType,
  SemanticRole,
  Unit,
} from "../core/ffi";
import { Theme, activeTheme } from "../core/Theme";
import { warn } from "../core/Logger";
import { Node } from "../core/Node";
import { PersistedInt32Codec, PersistedValueState } from "../core/PersistedState";
import { FlexBox, Portal, ScrollBarVisibility, ScrollBox } from "../nodes";
import { bind2 } from "../core/bind";
import { getControlTemplates } from "./ControlTemplateSet";
import {
  defaultDropdownChevronTemplate,
  DropdownChevronPresenter,
  DropdownChevronTemplate,
  DropdownChevronVisualState,
} from "./internal/DropdownChevronPresenter";
import {
  defaultDropdownFieldTemplate,
  DropdownFieldPresenter,
  DropdownFieldTemplate,
  DropdownFieldVisualState,
} from "./internal/DropdownFieldPresenter";
import {
  defaultDropdownOptionRowTemplate,
  DropdownOptionRowPresenter,
  DropdownOptionRowTemplate,
  DropdownOptionRowVisualState,
} from "./internal/DropdownOptionRowPresenter";
import { PopupPresenter } from "./internal/PopupPresenter";

const PANEL_EDGE_PADDING: f32 = 8.0;
const OPTION_HEIGHT: f32 = 34.0;
const PANEL_PADDING: f32 = 4.0;
const UNLIMITED_VISIBLE_ITEMS: i32 = 0;
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

function createFieldPresenter(template: DropdownFieldTemplate | null): DropdownFieldPresenter {
  if (template !== null) {
    return template.create();
  }
  const templateSet = getControlTemplates();
  const appTemplate = templateSet !== null ? templateSet.dropdownField : null;
  return (appTemplate === null ? defaultDropdownFieldTemplate : appTemplate).create();
}

function createChevronPresenter(template: DropdownChevronTemplate | null): DropdownChevronPresenter {
  if (template !== null) {
    return template.create();
  }
  const templateSet = getControlTemplates();
  const appTemplate = templateSet !== null ? templateSet.dropdownChevron : null;
  return (appTemplate === null ? defaultDropdownChevronTemplate : appTemplate).create();
}

function createOptionRowPresenter(template: DropdownOptionRowTemplate | null): DropdownOptionRowPresenter {
  if (template !== null) {
    return template.create();
  }
  const templateSet = getControlTemplates();
  const appTemplate = templateSet !== null ? templateSet.dropdownOptionRow : null;
  return (appTemplate === null ? defaultDropdownOptionRowTemplate : appTemplate).create();
}

export class DropdownItem {
  constructor(readonly value: string, readonly label: string = value) {}
}

class DropdownOptionNode extends FlexBox {
  private presenter: DropdownOptionRowPresenter;
  private owner: Dropdown | null = null;
  private slotIndex: i32 = -1;
  private currentLabel: string = "";

  constructor(template: DropdownOptionRowTemplate | null) {
    super();
    this.presenter = createOptionRowPresenter(template);
    this.semanticRole(SemanticRole.ListItem);
    this.width(100.0, Unit.Percent);
    this.cursor(CursorStyle.Pointer);
    this.focusable(false);
    this.requireInteractive();
    this.child(this.presenter.root);
    this.syncPresenterLayout();
  }

  bindOwner(owner: Dropdown, slotIndex: i32): this {
    this.owner = owner;
    this.slotIndex = slotIndex;
    return this;
  }

  label(label: string): this {
    this.currentLabel = label;
    this.semanticLabel(label);
    this.presenter.labelNode.text(label);
    return this;
  }

  template(template: DropdownOptionRowTemplate | null): void {
    const previousPresenter = this.presenter;
    const nextPresenter = createOptionRowPresenter(template);
    this.presenter = nextPresenter;
    this.removeChildNode(previousPresenter.root);
    this.addChildNode(nextPresenter.root);
    previousPresenter.root.dispose();
    nextPresenter.labelNode.text(this.currentLabel);
    this.syncPresenterLayout();
  }

  get rowHeight(): f32 {
    return this.presenter.metrics.height;
  }

  applyTheme(theme: Theme, highlighted: bool, selected: bool, enabled: bool): void {
    this.semanticSelected(selected);
    this.semanticDisabled(!enabled);
    this.presenter.apply(theme, new DropdownOptionRowVisualState(highlighted, selected, enabled));
  }

  _handlePointerEvent(eventType: PointerEventType, x: f32, y: f32, modifiers: u32 = 0): void {
    super._handlePointerEvent(eventType, x, y, modifiers);
    const owner = this.owner;
    if (owner === null) {
      return;
    }
    if (eventType == PointerEventType.Enter) {
      owner.highlightIndex(this.slotIndex);
      return;
    }
    if (eventType == PointerEventType.Up) {
      owner.selectHighlighted();
    }
  }

  private syncPresenterLayout(): void {
    this.height(this.presenter.metrics.height, Unit.Pixel);
    this.presenter.root.fillSize();
  }
}

export class Dropdown extends FlexBox implements GlobalKeyHandler {
  private static activeInstance: Dropdown | null = null;

  private fieldTemplateValue: DropdownFieldTemplate | null = null;
  private chevronTemplateValue: DropdownChevronTemplate | null = null;
  private optionRowTemplateValue: DropdownOptionRowTemplate | null = null;
  private fieldPresenter: DropdownFieldPresenter;
  private chevronPresenter: DropdownChevronPresenter;
  private readonly popupRoot: Portal;
  private readonly panelNode: FlexBox;
  private readonly popupPresenter: PopupPresenter;
  private readonly popupScrollBox: ScrollBox;
  private readonly optionsHost: FlexBox;
  private readonly optionNodes: Array<DropdownOptionNode> = new Array<DropdownOptionNode>();
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
  private maxVisibleItemsValue: i32 = UNLIMITED_VISIBLE_ITEMS;
  private popupWidthValue: f32 = 0.0;
  private popupPanelColorValue: u32 = 0x00000000;
  private popupPanelBackgroundBlurSigmaValue: f32 = DEFAULT_PANEL_BACKGROUND_BLUR_SIGMA;
  private popupPanelColorOverridden: bool = false;
  private popupPanelBackgroundBlurOverridden: bool = false;
  private changedCallback: ((item: DropdownItem, index: i32) => void) | null = null;
  private changedBinding: Callback2<DropdownItem, i32> | null = null;

  constructor() {
    super();
    const fieldPresenter = createFieldPresenter(null);
    const chevronPresenter = createChevronPresenter(null);
    const popupRoot = new Portal()
      .positionAbsolute()
      .position(0.0, 0.0)
      .width(100.0, Unit.Percent)
      .height(100.0, Unit.Percent) as Portal;
    const popupScrollBox = new ScrollBox()
      .scrollEnabledX(false)
      .scrollEnabledY(true)
      .horizontalScrollbarVisibility(ScrollBarVisibility.Never)
      .verticalScrollbarVisibility(ScrollBarVisibility.Auto);
    const optionsHost = new FlexBox()
      .flexDirection(FlexDirection.Column);
    const panelNode = new FlexBox()
      .positionAbsolute()
      .flexDirection(FlexDirection.Column);
    const popupPresenter = new PopupPresenter(popupRoot, panelNode);
    this.fieldPresenter = fieldPresenter;
    this.chevronPresenter = chevronPresenter;
    this.popupRoot = popupRoot;
    this.panelNode = panelNode;
    this.popupPresenter = popupPresenter;
    this.popupScrollBox = popupScrollBox;
    this.optionsHost = optionsHost;
    popupPresenter.overlayNode.onClickWith(this, (dropdown) => dropdown.close());
    optionsHost.semanticRole(SemanticRole.List);
    optionsHost.semanticLabel("Dropdown options");
    popupScrollBox.child(optionsHost);
    panelNode.child(popupScrollBox);
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
    this.child(this.popupRoot);
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
    this.ensureOptionNodes();
    this.syncValueLabel();
    this.handleThemeChanged();
    return this;
  }

  onChanged(callback: ((item: DropdownItem, index: i32) => void) | null): this {
    this.changedCallback = callback;
    this.changedBinding = null;
    return this;
  }

  bindChanged<Owner>(owner: Owner, handler: Handler2<Owner, DropdownItem, i32>): this {
    this.changedCallback = null;
    this.changedBinding = bind2<Owner, DropdownItem, i32>(owner, handler);
    return this;
  }

  onChangedWith<Owner>(owner: Owner, handler: Handler2<Owner, DropdownItem, i32>): this {
    this.bindChanged(owner, handler);
    return this;
  }

  maxVisibleItems(count: i32): this {
    if (count <= 0) {
      warn("Layout", "Dropdown.maxVisibleItems() received " + count.toString() + "; using unlimited visible items.");
    }
    this.maxVisibleItemsValue = count > 0 ? count : UNLIMITED_VISIBLE_ITEMS;
    this.refreshPanelLayout();
    return this;
  }

  popupWidth(value: f32): this {
    if (value <= 0.0) {
      warn("Layout", "Dropdown.popupWidth() received " + value.toString() + "; clamping to 0.0.");
    }
    this.popupWidthValue = value > 0.0 ? value : 0.0;
    this.refreshPanelLayout();
    return this;
  }

  popupPanelColor(color: u32): this {
    this.popupPanelColorOverridden = true;
    this.popupPanelColorValue = color;
    this.panelNode.bgColor(color);
    return this;
  }

  popupPanelBackgroundBlur(sigma: f32): this {
    this.popupPanelBackgroundBlurOverridden = true;
    if (sigma < 0.0) {
      warn("Layout", "Dropdown.popupPanelBackgroundBlur() received " + sigma.toString() + "; clamping to 0.0.");
    }
    this.popupPanelBackgroundBlurSigmaValue = sigma >= 0.0 ? sigma : 0.0;
    this.panelNode.backgroundBlur(this.popupPanelBackgroundBlurSigmaValue);
    return this;
  }

  fieldTemplate(template: DropdownFieldTemplate | null): this {
    this.close();
    this.fieldTemplateValue = template;
    const nextFieldPresenter = createFieldPresenter(template);
    const nextChevronPresenter = createChevronPresenter(this.chevronTemplateValue);
    this.replaceFieldPresenter(nextFieldPresenter, nextChevronPresenter);
    this.syncValueLabel();
    this.handleThemeChanged();
    return this;
  }

  chevronTemplate(template: DropdownChevronTemplate | null): this {
    this.close();
    this.chevronTemplateValue = template;
    const previousPresenter = this.chevronPresenter;
    const nextPresenter = createChevronPresenter(template);
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
    for (let index = 0; index < this.optionNodes.length; ++index) {
      unchecked(this.optionNodes[index]).template(template);
    }
    this.refreshPanelLayout();
    this.syncOptionVisuals();
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

  highlightIndex(index: i32): void {
    if (index < 0 || index >= this.itemsValue.length || this.highlightedIndexValue == index) {
      if (index < 0 || index >= this.itemsValue.length) {
        warn("Layout", "Dropdown.highlightIndex() received " + index.toString() + " outside the available item range.");
      }
      return;
    }
    this.highlightedIndexValue = index;
    this.syncOptionVisuals();
    this.ensureHighlightedVisible();
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
    const callback = this.changedCallback;
    if (callback !== null) {
      callback(item, this.selectedIndexValue);
    }
    const binding = this.changedBinding;
    if (binding !== null) {
      binding.invoke(item, this.selectedIndexValue);
    }
  }

  private open(): void {
    if (this.openState || this.itemsValue.length == 0 || this.builtHandle == 0) {
      return;
    }
    this.ensureOptionNodes();
    this.rebuildPanel();
    const bounds = this.tryGetViewportBounds();
    if (bounds !== null) {
      const width = unchecked(bounds[2]);
      const height = unchecked(bounds[3]);
      this.positionPanel(unchecked(bounds[0]), unchecked(bounds[1]), width, height);
    }
    this.openState = true;
    Dropdown.activeInstance = this;
    this.semanticExpanded(true);
    this.requestSemanticAnnouncement();
    if (this.selectedIndexValue >= 0) {
      this.highlightedIndexValue = this.selectedIndexValue;
    } else if (this.itemsValue.length > 0) {
      this.highlightedIndexValue = 0;
    }
    this.syncOptionVisuals();
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

  private positionPanel(triggerX: f32, triggerY: f32, triggerWidth: f32, triggerHeight: f32): void {
    const popupWidth = this.resolvePopupWidth(triggerWidth);
    const panelHeight = this.resolveViewportClampedPanelOuterHeight();
    this.panelNode.width(popupWidth, Unit.Pixel);
    this.panelNode.height(panelHeight, Unit.Pixel);
    this.popupScrollBox.width(100.0, Unit.Percent);
    this.popupScrollBox.height(<f32>Math.max(0.0, panelHeight - (PANEL_PADDING * 2.0)), Unit.Pixel);
    this.popupPresenter.showAnchored(triggerX, triggerY, triggerWidth, triggerHeight, popupWidth, panelHeight);
  }

  private close(): void {
    if (!this.openState && !this.popupPresenter.isOpen) {
      return;
    }
    this.popupPresenter.hide();
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

  private rebuildPanel(): void {
    for (let index = 0; index < this.optionNodes.length; ++index) {
      this.optionsHost.removeChildNode(unchecked(this.optionNodes[index]));
    }
    for (let index = 0; index < this.itemsValue.length; ++index) {
      const optionNode = unchecked(this.optionNodes[index]);
      optionNode.label(unchecked(this.itemsValue[index]).label);
      this.optionsHost.addChildNode(optionNode);
    }
    this.refreshPanelLayout();
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
    const theme = activeTheme.value;
    for (let index = 0; index < this.itemsValue.length; ++index) {
      unchecked(this.optionNodes[index]).applyTheme(
        theme,
        index == this.highlightedIndexValue,
        index == this.selectedIndexValue,
        this.isEnabled,
      );
    }
  }

  private moveHighlight(delta: i32): void {
    if (this.itemsValue.length == 0) {
      return;
    }
    let nextIndex = this.highlightedIndexValue;
    if (nextIndex < 0) {
      nextIndex = this.selectedIndexValue >= 0 ? this.selectedIndexValue : 0;
    }
    nextIndex += delta;
    if (nextIndex < 0) {
      nextIndex = this.itemsValue.length - 1;
    } else if (nextIndex >= this.itemsValue.length) {
      nextIndex = 0;
    }
    this.highlightIndex(nextIndex);
  }

  private clearItems(): void {
    this.close();
    this.itemsValue.length = 0;
    this.selectedIndexValue = -1;
    this.highlightedIndexValue = -1;
  }

  private ensureOptionNodes(): void {
    while (this.optionNodes.length < this.itemsValue.length) {
      const optionNode = new DropdownOptionNode(this.optionRowTemplateValue).bindOwner(this, this.optionNodes.length);
      this.optionNodes.push(optionNode);
    }
  }

  private resolveOptionRowHeight(): f32 {
    if (this.optionNodes.length == 0) {
      return OPTION_HEIGHT;
    }
    return unchecked(this.optionNodes[0]).rowHeight;
  }

  private resolveVisibleItemCount(): i32 {
    if (this.maxVisibleItemsValue <= 0 || this.itemsValue.length <= this.maxVisibleItemsValue) {
      return this.itemsValue.length;
    }
    return this.maxVisibleItemsValue;
  }

  private resolvePanelOuterHeight(): f32 {
    return <f32>this.resolveVisibleItemCount() * this.resolveOptionRowHeight() + (PANEL_PADDING * 2.0);
  }

  private resolveViewportClampedPanelOuterHeight(): f32 {
    const maxHeight = <f32>Math.max(PANEL_EDGE_PADDING, ui.getViewportHeight() - (PANEL_EDGE_PADDING * 2.0));
    return <f32>Math.min(this.resolvePanelOuterHeight(), maxHeight);
  }

  private resolvePopupWidth(triggerWidth: f32): f32 {
    return this.popupWidthValue > 0.0 ? this.popupWidthValue : triggerWidth;
  }

  private refreshPanelLayout(): void {
    this.optionsHost.width(100.0, Unit.Percent);
    this.optionsHost.height(<f32>this.itemsValue.length * this.resolveOptionRowHeight(), Unit.Pixel);
    this.popupScrollBox.width(100.0, Unit.Percent);
    this.popupScrollBox.height(
      <f32>Math.max(0.0, this.resolveViewportClampedPanelOuterHeight() - (PANEL_PADDING * 2.0)),
      Unit.Pixel,
    );
    if (this.openState) {
      const bounds = this.tryGetViewportBounds();
      if (bounds !== null) {
        this.positionPanel(unchecked(bounds[0]), unchecked(bounds[1]), unchecked(bounds[2]), unchecked(bounds[3]));
      }
      this.ensureHighlightedVisible();
    }
  }

  private ensureHighlightedVisible(): void {
    if (!this.openState || this.highlightedIndexValue < 0) {
      return;
    }
    const visibleHeight = <f32>Math.max(0.0, this.resolveViewportClampedPanelOuterHeight() - (PANEL_PADDING * 2.0));
    if (visibleHeight <= 0.0) {
      return;
    }
    const rowHeight = this.resolveOptionRowHeight();
    const itemTop = <f32>this.highlightedIndexValue * rowHeight;
    const itemBottom = itemTop + rowHeight;
    let nextOffset = this.popupScrollBox.scrollState.offsetY.value;
    if (itemTop < nextOffset) {
      nextOffset = itemTop;
    } else if (itemBottom > nextOffset + visibleHeight) {
      nextOffset = itemBottom - visibleHeight;
    }
    this.popupScrollBox.setRuntimeScrollOffset(0.0, nextOffset);
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
    this.border(0.0, 0x00000000, BorderStyle.Solid);
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
    );
    this.chevronPresenter.apply(
      theme,
      new DropdownChevronVisualState(
        this.openState,
        this.hoveredState,
        this.isEnabled,
      ),
    );
    this.panelNode
      .padding(PANEL_PADDING, PANEL_PADDING, PANEL_PADDING, PANEL_PADDING)
      .cornerRadius(theme.spacing.sm)
      .bgColor(this.popupPanelColorValue)
      .border(1.0, theme.contextMenu.panelBorderColor, BorderStyle.Solid)
      .backgroundBlur(this.popupPanelBackgroundBlurSigmaValue)
      .dropShadow(
        theme.contextMenu.panelShadowColor,
        0.0,
        theme.contextMenu.shadowOffsetY,
        theme.contextMenu.shadowBlur,
        theme.contextMenu.shadowSpread,
      );
    this.popupScrollBox.bgColor(0x00000000);
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
    this.popupPresenter.dispose();
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
    children.push(this.popupRoot);
    this.replaceChildren(children);
    previousFieldRoot.dispose();
  }
}
