import * as ui from "../../bindings/ui";
import { CursorStyle, FlexDirection, HandleValue, PointerEventType, SemanticRole, Unit } from "../../core/ffi";
import { warn } from "../../core/Logger";
import { PointerEventArgs } from "../../core/Node";
import { Theme, activeTheme } from "../../core/Theme";
import { FlexBox, Portal, ScrollBarVisibility, ScrollBox } from "../../nodes";
import { DropdownSizing } from "../ControlSizing";
import { DropdownColors } from "../DropdownColors";
import {
  createDefaultDropdownOptionRowPresenter,
  DropdownOptionRowPresenter,
  DropdownOptionRowTemplate,
  DropdownOptionRowVisualState,
} from "./DropdownOptionRowPresenter";
import { PopupPresenter } from "./PopupPresenter";

const PANEL_EDGE_PADDING: f32 = 8.0;
const OPTION_HEIGHT: f32 = 34.0;
export const SELECTABLE_POPUP_LIST_PANEL_PADDING: f32 = 4.0;
const UNLIMITED_VISIBLE_ITEMS: i32 = 0;

export interface SelectablePopupListOwner {
  getPopupListItemCount(): i32;
  getPopupListItemLabel(index: i32): string;
  isPopupListItemSelected(index: i32): bool;
  isPopupListEnabled(): bool;
  popupListHighlightIndex(index: i32): void;
  popupListActivateIndex(index: i32): void;
  popupListPointerDown(index: i32): void;
  popupListPointerUp(index: i32): void;
}

function createOptionRowPresenter(template: DropdownOptionRowTemplate | null, sizing: DropdownSizing | null = null): DropdownOptionRowPresenter {
  if (template !== null) {
    return template.create(sizing);
  }
  return createDefaultDropdownOptionRowPresenter(sizing);
}

class SelectablePopupListOptionNode extends FlexBox {
  private presenter: DropdownOptionRowPresenter;
  private owner: SelectablePopupListOwner | null = null;
  private slotIndex: i32 = -1;
  private currentLabel: string = "";

  constructor(template: DropdownOptionRowTemplate | null, sizing: DropdownSizing | null) {
    super();
    this.presenter = createOptionRowPresenter(template, sizing);
    this.semanticRole(SemanticRole.ListItem);
    this.width(100.0, Unit.Percent);
    this.cursor(CursorStyle.Pointer);
    this.focusable(false);
    this.requireInteractive();
    this.bindPresenterPointerEvents();
    this.child(this.presenter.root);
    this.syncPresenterLayout();
  }

  bindOwner(owner: SelectablePopupListOwner, slotIndex: i32): this {
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

  template(template: DropdownOptionRowTemplate | null, sizing: DropdownSizing | null): void {
    const previousPresenter = this.presenter;
    const nextPresenter = createOptionRowPresenter(template, sizing);
    this.presenter = nextPresenter;
    this.removeChildNode(previousPresenter.root);
    this.addChildNode(nextPresenter.root);
    previousPresenter.root.dispose();
    nextPresenter.labelNode.text(this.currentLabel);
    this.bindPresenterPointerEvents();
    this.syncPresenterLayout();
  }

  get rowHeight(): f32 {
    return this.presenter.metrics.height;
  }

  applyTheme(theme: Theme, highlighted: bool, selected: bool, enabled: bool, colors: DropdownColors | null): void {
    this.semanticSelected(selected);
    this.semanticDisabled(!enabled);
    this.presenter.apply(theme, new DropdownOptionRowVisualState(highlighted, selected, enabled), colors);
  }

  _handlePointerEvent(eventType: PointerEventType, x: f32, y: f32, modifiers: u32 = 0): void {
    super._handlePointerEvent(eventType, x, y, modifiers);
    const owner = this.owner;
    if (owner === null) {
      return;
    }
    if (eventType == PointerEventType.Enter) {
      owner.popupListHighlightIndex(this.slotIndex);
      return;
    }
    if (eventType == PointerEventType.Down) {
      this.capturePointer();
      owner.popupListPointerDown(this.slotIndex);
      return;
    }
    if (eventType == PointerEventType.Up) {
      this.releasePointer();
      owner.popupListPointerUp(this.slotIndex);
      owner.popupListActivateIndex(this.slotIndex);
      return;
    }
    if (eventType == PointerEventType.Cancel) {
      this.releasePointer();
      owner.popupListPointerUp(this.slotIndex);
    }
  }

  private bindPresenterPointerEvents(): void {
    this.presenter.root.cursor(CursorStyle.Pointer);
    this.presenter.labelNode.cursor(CursorStyle.Pointer);
    this.presenter.root
      .onPointerEnterWith(this, (node, event): void => node.handleNestedPointerEnter(event))
      .onPointerDownWith(this, (node, event): void => node.handleNestedPointerDown(event))
      .onPointerUpWith(this, (node, event): void => node.handleNestedPointerUp(event))
      .onPointerCancelWith(this, (node, event): void => node.handleNestedPointerCancel(event));
    this.presenter.labelNode
      .onPointerEnterWith(this, (node, event): void => node.handleNestedPointerEnter(event))
      .onPointerDownWith(this, (node, event): void => node.handleNestedPointerDown(event))
      .onPointerUpWith(this, (node, event): void => node.handleNestedPointerUp(event))
      .onPointerCancelWith(this, (node, event): void => node.handleNestedPointerCancel(event));
  }

  private handleNestedPointerEnter(event: PointerEventArgs): void {
    const owner = this.owner;
    if (owner !== null) {
      owner.popupListHighlightIndex(this.slotIndex);
    }
    event.handled = true;
  }

  private handleNestedPointerDown(event: PointerEventArgs): void {
    const owner = this.owner;
    if (owner !== null) {
      this.capturePointer();
      owner.popupListPointerDown(this.slotIndex);
    }
    event.handled = true;
  }

  private handleNestedPointerUp(event: PointerEventArgs): void {
    const owner = this.owner;
    if (owner !== null) {
      this.releasePointer();
      owner.popupListPointerUp(this.slotIndex);
      owner.popupListActivateIndex(this.slotIndex);
    }
    event.handled = true;
  }

  private handleNestedPointerCancel(event: PointerEventArgs): void {
    const owner = this.owner;
    if (owner !== null) {
      this.releasePointer();
      owner.popupListPointerUp(this.slotIndex);
    }
    event.handled = true;
  }

  private syncPresenterLayout(): void {
    this.height(this.presenter.metrics.height, Unit.Pixel);
    this.presenter.root.fillSize();
  }
}

export class SelectablePopupList {
  readonly root: Portal;
  readonly panelNode: FlexBox;
  readonly popupPresenter: PopupPresenter;
  readonly popupScrollBox: ScrollBox;
  readonly optionsHost: FlexBox;

  private readonly optionNodes: Array<SelectablePopupListOptionNode> = new Array<SelectablePopupListOptionNode>();
  private optionRowTemplateValue: DropdownOptionRowTemplate | null = null;
  private sizingValue: DropdownSizing | null = null;
  private colorsValue: DropdownColors | null = null;
  private highlightedIndexValue: i32 = -1;
  private maxVisibleItemsValue: i32 = UNLIMITED_VISIBLE_ITEMS;
  private popupWidthValue: f32 = 0.0;

  constructor(private readonly owner: SelectablePopupListOwner) {
    const root = new Portal()
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
    // Dropdown and combobox popups should add list semantics without replacing
    // the trigger/editor subtree from the active semantic tree.
    const popupPresenter = new PopupPresenter(root, panelNode, null);
    optionsHost.semanticRole(SemanticRole.List);
    optionsHost.semanticLabel("Dropdown options");
    popupScrollBox.child(optionsHost);
    panelNode.child(popupScrollBox);
    this.root = root;
    this.panelNode = panelNode;
    this.popupPresenter = popupPresenter;
    this.popupScrollBox = popupScrollBox;
    this.optionsHost = optionsHost;
  }

  get isOpen(): bool {
    return this.popupPresenter.isOpen;
  }

  get highlightedIndex(): i32 {
    return this.highlightedIndexValue;
  }

  maxVisibleItems(count: i32): void {
    if (count <= 0) {
      warn("Layout", "Dropdown.maxVisibleItems() received " + count.toString() + "; using unlimited visible items.");
    }
    this.maxVisibleItemsValue = count > 0 ? count : UNLIMITED_VISIBLE_ITEMS;
    this.refreshPanelLayout();
  }

  popupWidth(value: f32): void {
    if (value <= 0.0) {
      warn("Layout", "Dropdown.popupWidth() received " + value.toString() + "; clamping to 0.0.");
    }
    this.popupWidthValue = value > 0.0 ? value : 0.0;
    this.refreshPanelLayout();
  }

  sizing(sizing: DropdownSizing | null): void {
    this.sizingValue = sizing;
    for (let index = 0; index < this.optionNodes.length; ++index) {
      unchecked(this.optionNodes[index]).template(this.optionRowTemplateValue, this.sizingValue);
    }
    this.refreshPanelLayout();
  }

  colors(colors: DropdownColors | null): void {
    this.colorsValue = colors;
    this.syncOptionVisuals();
  }

  optionRowTemplate(template: DropdownOptionRowTemplate | null): void {
    this.optionRowTemplateValue = template;
    for (let index = 0; index < this.optionNodes.length; ++index) {
      unchecked(this.optionNodes[index]).template(template, this.sizingValue);
    }
    this.refreshPanelLayout();
    this.syncOptionVisuals();
  }

  open(triggerX: f32, triggerY: f32, triggerWidth: f32, triggerHeight: f32, initialHighlightIndex: i32): bool {
    if (this.isOpen || this.owner.getPopupListItemCount() == 0 || this.root.builtHandle == <u64>HandleValue.Invalid) {
      return false;
    }
    this.ensureOptionNodes();
    this.rebuildPanel();
    this.setHighlightedIndex(initialHighlightIndex);
    this.positionPanel(triggerX, triggerY, triggerWidth, triggerHeight);
    return true;
  }

  refreshOpen(triggerX: f32, triggerY: f32, triggerWidth: f32, triggerHeight: f32, highlightedIndex: i32): void {
    if (!this.isOpen) {
      return;
    }
    this.ensureOptionNodes();
    this.rebuildPanel();
    const count = this.owner.getPopupListItemCount();
    let nextHighlight = highlightedIndex;
    if (nextHighlight >= count) {
      nextHighlight = count > 0 ? count - 1 : -1;
    }
    if (nextHighlight < 0 && count > 0) {
      nextHighlight = 0;
    }
    this.setHighlightedIndex(nextHighlight);
    this.positionPanel(triggerX, triggerY, triggerWidth, triggerHeight);
  }

  close(): void {
    this.popupPresenter.hide();
  }

  dispose(): void {
    this.popupPresenter.dispose();
  }

  clear(): void {
    this.close();
    this.highlightedIndexValue = -1;
  }

  setHighlightedIndex(index: i32): void {
    this.highlightedIndexValue = index;
    this.syncOptionVisuals();
    this.ensureHighlightedVisible();
  }

  highlightIndex(index: i32): void {
    if (index < 0 || index >= this.owner.getPopupListItemCount() || this.highlightedIndexValue == index) {
      if (index < 0 || index >= this.owner.getPopupListItemCount()) {
        warn("Layout", "Dropdown.highlightIndex() received " + index.toString() + " outside the available item range.");
      }
      return;
    }
    this.highlightedIndexValue = index;
    this.syncOptionVisuals();
    this.ensureHighlightedVisible();
  }

  moveHighlight(delta: i32): void {
    const count = this.owner.getPopupListItemCount();
    if (count == 0) {
      return;
    }
    let nextIndex = this.highlightedIndexValue;
    if (nextIndex < 0) {
      nextIndex = 0;
    }
    nextIndex += delta;
    if (nextIndex < 0) {
      nextIndex = count - 1;
    } else if (nextIndex >= count) {
      nextIndex = 0;
    }
    this.highlightIndex(nextIndex);
  }

  refreshPanelLayout(): void {
    const count = this.owner.getPopupListItemCount();
    this.optionsHost.width(100.0, Unit.Percent);
    this.optionsHost.height(<f32>count * this.resolveOptionRowHeight(), Unit.Pixel);
    this.popupScrollBox.width(100.0, Unit.Percent);
    this.popupScrollBox.height(
      <f32>Math.max(0.0, this.resolveViewportClampedPanelOuterHeight() - (SELECTABLE_POPUP_LIST_PANEL_PADDING * 2.0)),
      Unit.Pixel,
    );
    if (this.isOpen) {
      this.ensureHighlightedVisible();
    }
  }

  positionPanel(triggerX: f32, triggerY: f32, triggerWidth: f32, triggerHeight: f32): void {
    const popupWidth = this.resolvePopupWidth(triggerWidth);
    const panelHeight = this.resolveViewportClampedPanelOuterHeight();
    this.panelNode.width(popupWidth, Unit.Pixel);
    this.panelNode.height(panelHeight, Unit.Pixel);
    this.popupScrollBox.width(100.0, Unit.Percent);
    this.popupScrollBox.height(<f32>Math.max(0.0, panelHeight - (SELECTABLE_POPUP_LIST_PANEL_PADDING * 2.0)), Unit.Pixel);
    this.popupPresenter.showAnchored(triggerX, triggerY, triggerWidth, triggerHeight, popupWidth, panelHeight);
  }

  syncOptionVisuals(): void {
    this.ensureOptionNodes();
    const theme = activeTheme.value;
    const count = this.owner.getPopupListItemCount();
    for (let index = 0; index < count; ++index) {
      unchecked(this.optionNodes[index]).applyTheme(
        theme,
        index == this.highlightedIndexValue,
        this.owner.isPopupListItemSelected(index),
        this.owner.isPopupListEnabled(),
        this.colorsValue,
      );
    }
  }

  private rebuildPanel(): void {
    for (let index = 0; index < this.optionNodes.length; ++index) {
      this.optionsHost.removeChildNode(unchecked(this.optionNodes[index]));
    }
    const count = this.owner.getPopupListItemCount();
    for (let index = 0; index < count; ++index) {
      const optionNode = unchecked(this.optionNodes[index]);
      optionNode.label(this.owner.getPopupListItemLabel(index));
      this.optionsHost.addChildNode(optionNode);
    }
    this.refreshPanelLayout();
  }

  private ensureOptionNodes(): void {
    const count = this.owner.getPopupListItemCount();
    while (this.optionNodes.length < count) {
      const optionNode = new SelectablePopupListOptionNode(this.optionRowTemplateValue, this.sizingValue).bindOwner(this.owner, this.optionNodes.length);
      this.optionNodes.push(optionNode);
    }
  }

  private resolveOptionRowHeight(): f32 {
    if (this.optionNodes.length == 0) {
      const sizing = this.sizingValue;
      if (sizing !== null && sizing.hasOptionHeight && this.optionRowTemplateValue === null) {
        return sizing.optionHeightPx;
      }
      return OPTION_HEIGHT;
    }
    return unchecked(this.optionNodes[0]).rowHeight;
  }

  private resolveVisibleItemCount(): i32 {
    const count = this.owner.getPopupListItemCount();
    if (this.maxVisibleItemsValue <= 0 || count <= this.maxVisibleItemsValue) {
      return count;
    }
    return this.maxVisibleItemsValue;
  }

  private resolvePanelOuterHeight(): f32 {
    return <f32>this.resolveVisibleItemCount() * this.resolveOptionRowHeight() + (SELECTABLE_POPUP_LIST_PANEL_PADDING * 2.0);
  }

  private resolveViewportClampedPanelOuterHeight(): f32 {
    const maxHeight = <f32>Math.max(PANEL_EDGE_PADDING, ui.getViewportHeight() - (PANEL_EDGE_PADDING * 2.0));
    return <f32>Math.min(this.resolvePanelOuterHeight(), maxHeight);
  }

  private resolvePopupWidth(triggerWidth: f32): f32 {
    return this.popupWidthValue > 0.0 ? this.popupWidthValue : triggerWidth;
  }

  private ensureHighlightedVisible(): void {
    if (!this.isOpen || this.highlightedIndexValue < 0) {
      return;
    }
    const visibleHeight = <f32>Math.max(0.0, this.resolveViewportClampedPanelOuterHeight() - (SELECTABLE_POPUP_LIST_PANEL_PADDING * 2.0));
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
}
