import { HandlerAction } from "../core/Action";
import { Disposable, disposeAll } from "../core/Disposable";
import { markNeedsCommit } from "../core/FrameScheduler";
import { FlexDirection, HandleValue, Unit } from "../core/ffi";
import { VirtualListItemBindingError } from "../core/Errors";
import { Node } from "../core/Node";
import { FlexBox } from "./FlexBox";
import { ScrollBox } from "./ScrollBox";
import { ScrollState } from "./ScrollState";
import { Text } from "./Text";
import * as ui from "../bindings/ui";
import { SelectionArea } from "../controls/SelectionArea";

const FULL_SIZE: f32 = 100.0;
const DEFAULT_MAX_VISIBLE_ITEMS: i32 = 20;
const POOL_OVERSCAN_ITEMS: i32 = 2;

export type VirtualListBinder = (container: FlexBox, index: i32) => void;

abstract class VirtualListBinderCallback {
  abstract invoke(container: FlexBox, index: i32): void;
}

class FunctionVirtualListBinderCallback extends VirtualListBinderCallback {
  private readonly handler: VirtualListBinder;

  constructor(handler: VirtualListBinder) {
    super();
    this.handler = handler;
  }

  invoke(container: FlexBox, index: i32): void {
    this.handler(container, index);
  }
}

class BoundVirtualListBinderCallback<Owner> extends VirtualListBinderCallback {
  private readonly owner: Owner;
  private readonly handler: (owner: Owner, container: FlexBox, index: i32) => void;

  constructor(owner: Owner, handler: (owner: Owner, container: FlexBox, index: i32) => void) {
    super();
    this.owner = owner;
    this.handler = handler;
  }

  invoke(container: FlexBox, index: i32): void {
    this.handler(this.owner, container, index);
  }
}

class MissingVirtualListBinderCallback extends VirtualListBinderCallback {
  invoke(_container: FlexBox, _index: i32): void {
    throw new VirtualListItemBindingError();
  }
}

export class VirtualList extends FlexBox {
  private totalItemsValue: i32;
  private readonly itemHeightValue: f32;
  private bindItemValue: VirtualListBinderCallback;
  private readonly scrollStateValue: ScrollState;
  private readonly scrollBoxValue: ScrollBox;
  private readonly topSpacerValue: FlexBox;
  private readonly bottomSpacerValue: FlexBox;
  private readonly poolSizeValue: i32;
  private readonly poolValue: Array<SelectionArea>;
  private readonly poolItemIndexByRow: Array<i32>;
  private readonly disposables: Array<Disposable>;
  private currentFirstVisibleIndex: i32 = -1;
  private currentLastVisibleIndex: i32 = -1;

  constructor(totalItems: i32, itemHeight: f32, maxVisible: i32 = DEFAULT_MAX_VISIBLE_ITEMS) {
    super();
    const scrollStateValue = new ScrollState();
    const poolValue = new Array<SelectionArea>();
    const poolItemIndexByRow = new Array<i32>();
    const disposables = new Array<Disposable>();
    const totalItemsValue = totalItems > 0 ? totalItems : 0;
    const itemHeightValue = itemHeight > 0.0 ? itemHeight : 1.0;
    const poolSizeValue = maxVisible > 0 ? maxVisible + POOL_OVERSCAN_ITEMS : POOL_OVERSCAN_ITEMS;
    this.totalItemsValue = totalItemsValue;
    this.itemHeightValue = itemHeightValue;
    this.bindItemValue = new MissingVirtualListBinderCallback();
    this.scrollStateValue = scrollStateValue;
    this.poolSizeValue = poolSizeValue;

    const topSpacerValue = new FlexBox()
      .width(FULL_SIZE, Unit.Percent)
      .height(0.0, Unit.Pixel);
    const bottomSpacerValue = new FlexBox()
      .width(FULL_SIZE, Unit.Percent)
      .height(0.0, Unit.Pixel);
    const contentValue = new FlexBox()
      .width(FULL_SIZE, Unit.Percent)
      .flexDirection(FlexDirection.Column)
      .child(topSpacerValue);

    for (let index = 0; index < poolSizeValue; ++index) {
      const container = new FlexBox().fillSize();
      const rowArea = new SelectionArea()
        .width(FULL_SIZE, Unit.Percent)
        .height(0.0, Unit.Pixel)
        .child(container) as SelectionArea;
      contentValue.child(rowArea);
      poolValue.push(rowArea);
      poolItemIndexByRow.push(-1);
    }

    contentValue.child(bottomSpacerValue);
    const scrollBoxValue = new ScrollBox(scrollStateValue)
      .scrollEnabledX(false)
      .scrollEnabledY(true)
      .scrollOffset(scrollStateValue.offsetX.value, scrollStateValue.offsetY.value)
      .scrollContentSize(-1.0, <f32>totalItemsValue * itemHeightValue)
      .fillSize()
      .child(contentValue) as ScrollBox;
    scrollStateValue.contentHeight.value = <f32>totalItemsValue * itemHeightValue;

    this.topSpacerValue = topSpacerValue;
    this.bottomSpacerValue = bottomSpacerValue;
    this.scrollBoxValue = scrollBoxValue;
    this.poolValue = poolValue;
    this.poolItemIndexByRow = poolItemIndexByRow;
    this.disposables = disposables;

    this.flexDirection(FlexDirection.Column)
      .child(this.scrollBoxValue)
      .fillSize();
    this.attachListeners();
  }

  get scrollState(): ScrollState {
    return this.scrollStateValue;
  }

  get totalItems(): i32 {
    return this.totalItemsValue;
  }

  get scrollBox(): ScrollBox {
    return this.scrollBoxValue;
  }

  get itemHeight(): f32 {
    return this.itemHeightValue;
  }

  get totalContentHeight(): f32 {
    return <f32>this.totalItemsValue * this.itemHeightValue;
  }

  get firstVisibleIndex(): i32 {
    return this.currentFirstVisibleIndex >= 0 ? this.currentFirstVisibleIndex : 0;
  }

  get renderedItemCount(): i32 {
    if (this.currentFirstVisibleIndex < 0 || this.currentLastVisibleIndex < this.currentFirstVisibleIndex) {
      return 0;
    }
    return this.currentLastVisibleIndex - this.currentFirstVisibleIndex;
  }

  get isSelectionBarrier(): bool {
    return true;
  }

  nodeId(id: string): this {
    this.scrollBoxValue.nodeId(id);
    return this;
  }

  persistScroll(flag: bool = true): this {
    this.scrollBoxValue.persistScroll(flag);
    return this;
  }

  build(): u64 {
    if (this.builtHandle != <u64>HandleValue.Invalid) {
      return this.builtHandle;
    }
    const handle = super.build();
    if (this.currentFirstVisibleIndex < 0 && this.totalItemsValue > 0) {
      this.rebuildVisibleRange(false);
    }
    ui.setSelectionAreaBarrier(handle, true);
    return handle;
  }

  width(value: f32, unit: Unit = Unit.Pixel): this {
    super.width(value, unit);
    if (unit == Unit.Pixel) {
      this.scrollStateValue.viewportWidth.value = value;
    }
    return this;
  }

  height(value: f32, unit: Unit = Unit.Pixel): this {
    super.height(value, unit);
    if (unit == Unit.Pixel) {
      this.scrollStateValue.viewportHeight.value = value;
    }
    return this;
  }

  render(): this {
    return this;
  }

  onBindItem(renderer: VirtualListBinder): this {
    this.bindItemValue = new FunctionVirtualListBinderCallback(renderer);
    this.currentFirstVisibleIndex = -1;
    this.currentLastVisibleIndex = -1;
    this.rebuildVisibleRange(true);
    return this;
  }

  onBindItemWith<Owner>(owner: Owner, renderer: (owner: Owner, container: FlexBox, index: i32) => void): this {
    this.bindItemValue = new BoundVirtualListBinderCallback<Owner>(owner, renderer);
    this.currentFirstVisibleIndex = -1;
    this.currentLastVisibleIndex = -1;
    this.rebuildVisibleRange(true);
    return this;
  }

  updateItemCount(next: i32): void {
    this.totalItemsValue = next > 0 ? next : 0;
    this.scrollStateValue.contentHeight.value = this.totalContentHeight;
    this.scrollBoxValue.scrollContentSize(-1.0, this.totalContentHeight);
    this.currentFirstVisibleIndex = -1;
    this.currentLastVisibleIndex = -1;

    const clampedOffset = this.maxOffsetForCurrentViewport();
    if (this.scrollStateValue.offsetY.value > clampedOffset) {
      this.scrollBoxValue.scrollOffset(this.scrollStateValue.offsetX.value, clampedOffset);
      return;
    }
    this.rebuildVisibleRange(true);
  }

  private disposeControl(): void {
    disposeAll(this.disposables);
    this.scrollBoxValue.dispose();
  }

  dispose(): void {
    this.disposeControl();
    super.dispose();
  }

  private attachListeners(): void {
    this.disposables.push(
      this.scrollStateValue.offsetY.addAction(
        new HandlerAction<VirtualList, f32>(this, (list, _value): void => list.handleScrollOffsetChanged()),
      ),
    );
    this.disposables.push(
      this.scrollStateValue.viewportHeight.addAction(
        new HandlerAction<VirtualList, f32>(this, (list, _value): void => list.handleMetricsChanged()),
      ),
    );
    this.disposables.push(
      this.scrollStateValue.contentHeight.addAction(
        new HandlerAction<VirtualList, f32>(this, (list, _value): void => list.handleMetricsChanged()),
      ),
    );
  }

  private handleMetricsChanged(): void {
    this.rebuildVisibleRange(true);
  }

  private handleScrollOffsetChanged(): void {
    this.rebuildVisibleRange(true);
  }

  private rebuildVisibleRange(commit: bool = true): void {
    const totalItems = this.totalItemsValue;
    if (totalItems <= 0) {
      if (this.currentFirstVisibleIndex == 0 && this.currentLastVisibleIndex == 0) {
        return;
      }
      this.currentFirstVisibleIndex = 0;
      this.currentLastVisibleIndex = 0;
      this.topSpacerValue.height(0.0, Unit.Pixel);
      this.bottomSpacerValue.height(0.0, Unit.Pixel);
      for (let index = 0; index < this.poolSizeValue; ++index) {
        this.hidePoolItem(unchecked(this.poolValue[index]), index);
      }
      this.commitIfBuilt(commit);
      return;
    }

    let firstVisibleIndex = <i32>Math.floor(this.scrollStateValue.offsetY.value / this.itemHeightValue);
    if (firstVisibleIndex < 0) {
      firstVisibleIndex = 0;
    }
    if (firstVisibleIndex > totalItems) {
      firstVisibleIndex = totalItems;
    }

    const viewportHeight = this.scrollStateValue.viewportHeight.value > 0.0
      ? this.scrollStateValue.viewportHeight.value
      : this.itemHeightValue;
    let visibleCount = <i32>Math.ceil(viewportHeight / this.itemHeightValue) + 1;
    if (visibleCount < 1) {
      visibleCount = 1;
    }
    if (visibleCount > this.poolSizeValue) {
      visibleCount = this.poolSizeValue;
    }

    let lastVisibleIndex = firstVisibleIndex + visibleCount;
    if (lastVisibleIndex > totalItems) {
      lastVisibleIndex = totalItems;
    }

    if (firstVisibleIndex == this.currentFirstVisibleIndex && lastVisibleIndex == this.currentLastVisibleIndex) {
      return;
    }

    this.currentFirstVisibleIndex = firstVisibleIndex;
    this.currentLastVisibleIndex = lastVisibleIndex;

    const topSpacerHeight = <f32>firstVisibleIndex * this.itemHeightValue;
    let bottomSpacerHeight = this.totalContentHeight - (<f32>lastVisibleIndex * this.itemHeightValue);
    if (bottomSpacerHeight < 0.0) {
      bottomSpacerHeight = 0.0;
    }

    this.topSpacerValue.height(topSpacerHeight, Unit.Pixel);
    this.bottomSpacerValue.height(bottomSpacerHeight, Unit.Pixel);

    const previousItemIndexByRow = new Array<i32>(this.poolSizeValue);
    for (let poolIndex = 0; poolIndex < this.poolSizeValue; ++poolIndex) {
      unchecked(previousItemIndexByRow[poolIndex] = this.poolItemIndexByRow[poolIndex]);
    }

    const visibleItems = lastVisibleIndex - firstVisibleIndex;
    for (let poolIndex = 0; poolIndex < this.poolSizeValue; ++poolIndex) {
      const previousItemIndex = unchecked(previousItemIndexByRow[poolIndex]);
      if (previousItemIndex != -1 && (previousItemIndex < firstVisibleIndex || previousItemIndex >= lastVisibleIndex)) {
        this.clearRowSelection(unchecked(this.poolValue[poolIndex]));
      }
    }

    for (let poolIndex = 0; poolIndex < this.poolSizeValue; ++poolIndex) {
      const rowArea = unchecked(this.poolValue[poolIndex]);
      if (poolIndex < visibleItems) {
        const nextItemIndex = firstVisibleIndex + poolIndex;
        rowArea.height(this.itemHeightValue, Unit.Pixel);
        const container = changetype<FlexBox>(rowArea.getChildAt(0));
        this.renderItem(container, nextItemIndex);
        unchecked(this.poolItemIndexByRow[poolIndex] = nextItemIndex);
      } else {
        this.hidePoolItem(rowArea, poolIndex);
      }
    }

    for (let poolIndex = 0; poolIndex < visibleItems; ++poolIndex) {
      const nextItemIndex = firstVisibleIndex + poolIndex;
      const previousPoolIndex = this.findPoolIndexForItem(previousItemIndexByRow, nextItemIndex);
      if (previousPoolIndex != -1 && previousPoolIndex != poolIndex) {
        this.retargetRowSelection(
          unchecked(this.poolValue[previousPoolIndex]),
          unchecked(this.poolValue[poolIndex]),
        );
      }
    }

    this.commitIfBuilt(commit);
  }

  private hidePoolItem(rowArea: SelectionArea, poolIndex: i32): void {
    if (unchecked(this.poolItemIndexByRow[poolIndex]) != -1) {
      this.clearRowSelection(rowArea);
      unchecked(this.poolItemIndexByRow[poolIndex] = -1);
    }
    rowArea.height(0.0, Unit.Pixel);
    const container = rowArea.getChildAt(0);
    if (container !== null) {
      this.clearItemNode(container);
    }
  }

  private clearRowSelection(rowArea: SelectionArea): void {
    if (this.builtHandle == <u64>HandleValue.Invalid) {
      return;
    }
    this.clearSelectionNode(rowArea);
  }

  private retargetRowSelection(fromRowArea: SelectionArea, toRowArea: SelectionArea): void {
    if (this.builtHandle == <u64>HandleValue.Invalid) {
      return;
    }
    const fromTexts = new Array<Text>();
    const toTexts = new Array<Text>();
    this.collectTextNodes(fromRowArea, fromTexts);
    this.collectTextNodes(toRowArea, toTexts);
    const pairCount = fromTexts.length < toTexts.length ? fromTexts.length : toTexts.length;
    for (let index = 0; index < pairCount; ++index) {
      const fromText = unchecked(fromTexts[index]);
      const toText = unchecked(toTexts[index]);
      if (
        fromText.builtHandle != <u64>HandleValue.Invalid &&
        toText.builtHandle != <u64>HandleValue.Invalid &&
        fromText.builtHandle != toText.builtHandle
      ) {
        ui.retargetSelection(fromText.builtHandle, toText.builtHandle);
      }
    }
  }

  private collectTextNodes(node: Node, out: Array<Text>): void {
    if (node instanceof Text) {
      out.push(changetype<Text>(node));
      return;
    }
    for (let index = 0; index < node.childCount; ++index) {
      const child = node.getChildAt(index);
      if (child !== null) {
        this.collectTextNodes(changetype<Node>(child), out);
      }
    }
  }

  private findPoolIndexForItem(previousItemIndexByRow: Array<i32>, itemIndex: i32): i32 {
    for (let poolIndex = 0; poolIndex < this.poolSizeValue; ++poolIndex) {
      if (unchecked(previousItemIndexByRow[poolIndex]) == itemIndex) {
        return poolIndex;
      }
    }
    return -1;
  }

  private clearSelectionNode(node: Node): void {
    if (node instanceof Text) {
      const textNode = changetype<Text>(node);
      if (textNode.builtHandle != <u64>HandleValue.Invalid) {
        ui.clearSelection(textNode.builtHandle);
      }
      return;
    }
    for (let index = 0; index < node.childCount; ++index) {
      const child = node.getChildAt(index);
      if (child !== null) {
        this.clearSelectionNode(changetype<Node>(child));
      }
    }
  }

  private clearItemNode(node: Node): void {
    node.semanticLabel("");
    if (node instanceof Text) {
      changetype<Text>(node).text("");
    }
    for (let index = 0; index < node.childCount; ++index) {
      const child = node.getChildAt(index);
      if (child !== null) {
        this.clearItemNode(changetype<Node>(child));
      }
    }
  }

  private commitIfBuilt(commit: bool): void {
    if (!commit || this.builtHandle == <u64>HandleValue.Invalid) {
      return;
    }
    markNeedsCommit();
  }

  private renderItem(container: FlexBox, index: i32): void {
    this.bindItemValue.invoke(container, index);
  }

  private maxOffsetForCurrentViewport(): f32 {
    const viewportHeight = this.scrollStateValue.viewportHeight.value > 0.0
      ? this.scrollStateValue.viewportHeight.value
      : 0.0;
    const maxOffset = this.totalContentHeight - viewportHeight;
    return maxOffset > 0.0 ? maxOffset : 0.0;
  }
}
