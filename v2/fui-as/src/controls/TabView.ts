import { Callback1, Handler1 } from "../core/BoundCallback";
import { throwNullArgument } from "../core/Errors";
import { FlexDirection, SemanticRole } from "../core/ffi";
import { warn } from "../core/Logger";
import { retainedView, RetainedView } from "../core/RetainedView";
import { bind1 } from "../core/bind";
import { FlexBox } from "../nodes";

const NO_PENDING_SELECTION: i32 = -2;

export type TabContentFactory = () => RetainedView;

export class TabSelectionChangedEventArgs {
  constructor(
    readonly previousIndex: i32,
    readonly selectedIndex: i32,
    readonly previousItem: TabItem | null,
    readonly selectedItem: TabItem | null,
  ) {}
}

export class TabItem {
  private labelValue: string;
  private descriptionValue: string = "";
  private enabledValue: bool = true;
  private factoryValue: TabContentFactory | null;
  private preparedViewValue: RetainedView | null = null;
  private retainedViewValue: RetainedView | null = null;
  private ownerValue: TabView | null = null;

  constructor(label: string, content: TabContentFactory | null = null) {
    this.labelValue = label;
    this.factoryValue = content;
  }

  get labelText(): string { return this.labelValue; }
  get descriptionText(): string { return this.descriptionValue; }
  get isEnabled(): bool { return this.enabledValue; }
  get isMaterialized(): bool { return this.retainedViewValue !== null; }

  label(value: string): this {
    this.labelValue = value;
    const owner = this.ownerValue;
    if (owner !== null) changetype<TabView>(owner)._itemMetadataChanged(this);
    return this;
  }

  description(value: string): this {
    this.descriptionValue = value;
    const owner = this.ownerValue;
    if (owner !== null) changetype<TabView>(owner)._itemMetadataChanged(this);
    return this;
  }

  enabled(flag: bool): this {
    if (this.enabledValue == flag) return this;
    this.enabledValue = flag;
    const owner = this.ownerValue;
    if (owner !== null) changetype<TabView>(owner)._itemEnabledChanged(this);
    return this;
  }

  content(factory: TabContentFactory): this {
    if (this.isMaterialized) {
      warn("Lifecycle", "TabItem.content() cannot replace content after the tab has been materialized.");
      return this;
    }
    this.preparedViewValue = null;
    this.factoryValue = factory;
    return this;
  }

  contentView(view: RetainedView): this {
    if (this.isMaterialized) {
      warn("Lifecycle", "TabItem.contentView() cannot replace content after the tab has been materialized.");
      return this;
    }
    this.preparedViewValue = view;
    this.factoryValue = null;
    return this;
  }

  _bindOwner(owner: TabView | null): void { this.ownerValue = owner; }

  _resolveView(): RetainedView {
    const retained = this.retainedViewValue;
    if (retained !== null) return changetype<RetainedView>(retained);
    const prepared = this.preparedViewValue;
    let resolved: RetainedView;
    if (prepared !== null) {
      resolved = changetype<RetainedView>(prepared);
    } else {
      const factory = this.factoryValue;
      resolved = factory === null
        ? retainedView(new FlexBox().fillSize())
        : changetype<TabContentFactory>(factory)();
    }
    this.preparedViewValue = null;
    this.retainedViewValue = resolved;
    return resolved;
  }

  _existingView(): RetainedView | null { return this.retainedViewValue; }

  _disposeContent(): void {
    const retained = this.retainedViewValue;
    if (retained !== null) changetype<RetainedView>(retained).dispose();
    const prepared = this.preparedViewValue;
    if (prepared !== null && prepared !== retained) changetype<RetainedView>(prepared).dispose();
    this.retainedViewValue = null;
    this.preparedViewValue = null;
  }
}

export class TabView extends FlexBox {
  private readonly itemsValue: Array<TabItem> = new Array<TabItem>();
  private selectedIndexValue: i32 = -1;
  private selectingValue: bool = false;
  private pendingSelectionValue: i32 = NO_PENDING_SELECTION;
  private pendingEmitValue: bool = false;
  private changedCallback: ((event: TabSelectionChangedEventArgs) => void) | null = null;
  private changedBinding: Callback1<TabSelectionChangedEventArgs> | null = null;
  readonly contentPresenter: FlexBox;

  constructor(items: Array<TabItem> = new Array<TabItem>()) {
    super();
    this.contentPresenter = new FlexBox().fillSize() as FlexBox;
    this.contentPresenter.semanticRole(SemanticRole.TabPanel);
    this.contentPresenter.semanticLabel("Tab panel");
    this.flexDirection(FlexDirection.Column);
    this.addChildNode(this.contentPresenter);
    this.items(items);
  }

  get selectedIndex(): i32 { return this.selectedIndexValue; }
  get selectedItem(): TabItem | null {
    return this.selectedIndexValue >= 0 && this.selectedIndexValue < this.itemsValue.length
      ? unchecked(this.itemsValue[this.selectedIndexValue])
      : null;
  }
  get itemCount(): i32 { return this.itemsValue.length; }

  itemAt(index: i32): TabItem | null {
    return index >= 0 && index < this.itemsValue.length ? unchecked(this.itemsValue[index]) : null;
  }

  items(items: Array<TabItem>): this {
    this.clearItems();
    for (let index = 0; index < items.length; ++index) this.addItem(unchecked(items[index]));
    return this;
  }

  addItem(item: TabItem): this {
    if (item == null) throwNullArgument("TabView.addItem", "item");
    if (this.indexOfItem(item) >= 0) return this;
    item._bindOwner(this);
    const index = this.itemsValue.length;
    this.itemsValue.push(item);
    if (this.selectedIndexValue < 0 && item.isEnabled) this.selectIndexInternal(index, false, null);
    return this;
  }

  removeItem(item: TabItem): this {
    const index = this.indexOfItem(item);
    if (index >= 0) this.removeItemAt(index);
    return this;
  }

  removeItemAt(index: i32): this {
    if (index < 0 || index >= this.itemsValue.length) return this;
    const removed = unchecked(this.itemsValue[index]);
    const wasSelected = index == this.selectedIndexValue;
    if (wasSelected) this.detachActiveView();
    removed._bindOwner(null);
    for (let cursor = index; cursor < this.itemsValue.length - 1; ++cursor) {
      unchecked(this.itemsValue[cursor] = unchecked(this.itemsValue[cursor + 1]));
    }
    this.itemsValue.length -= 1;
    if (wasSelected) {
      const previousIndex = this.selectedIndexValue;
      this.selectedIndexValue = -1;
      const replacement = this.findReplacementIndex(index);
      if (replacement >= 0) this.selectIndexInternal(replacement, true, removed, previousIndex);
      else this.emitChanged(previousIndex, -1, removed, null);
    } else if (this.selectedIndexValue > index) {
      this.selectedIndexValue -= 1;
    }
    removed._disposeContent();
    return this;
  }

  clearItems(): this {
    const previousIndex = this.selectedIndexValue;
    const previousItem = this.selectedItem;
    this.detachActiveView();
    for (let index = 0; index < this.itemsValue.length; ++index) {
      const item = unchecked(this.itemsValue[index]);
      item._bindOwner(null);
      item._disposeContent();
    }
    this.itemsValue.length = 0;
    this.selectedIndexValue = -1;
    if (previousItem !== null) this.emitChanged(previousIndex, -1, previousItem, null);
    return this;
  }

  selectIndex(index: i32): this {
    this.selectIndexInternal(index, true, null);
    return this;
  }

  onSelectionChanged(callback: ((event: TabSelectionChangedEventArgs) => void) | null): this {
    this.changedCallback = callback;
    this.changedBinding = null;
    return this;
  }

  bindSelectionChanged<Owner>(owner: Owner, handler: Handler1<Owner, TabSelectionChangedEventArgs>): this {
    this.changedCallback = null;
    this.changedBinding = bind1<Owner, TabSelectionChangedEventArgs>(owner, handler);
    return this;
  }

  onSelectionChangedWith<Owner>(owner: Owner, handler: Handler1<Owner, TabSelectionChangedEventArgs>): this {
    return this.bindSelectionChanged(owner, handler);
  }

  _itemEnabledChanged(item: TabItem): void {
    const index = this.indexOfItem(item);
    if (index < 0) return;
    if (!item.isEnabled && index == this.selectedIndexValue) {
      const previousIndex = this.selectedIndexValue;
      this.detachActiveView();
      this.selectedIndexValue = -1;
      const replacement = this.findReplacementIndex(index);
      if (replacement >= 0) this.selectIndexInternal(replacement, true, item, previousIndex);
      else this.emitChanged(previousIndex, -1, item, null);
    } else if (item.isEnabled && this.selectedIndexValue < 0) {
      this.selectIndexInternal(index, true, null);
    }
  }

  _itemMetadataChanged(item: TabItem): void {
    const index = this.indexOfItem(item);
    if (index < 0) return;
    if (index == this.selectedIndexValue) this.contentPresenter.semanticLabel(item.labelText + " tab panel");
  }

  dispose(): void {
    this.detachActiveView();
    for (let index = 0; index < this.itemsValue.length; ++index) {
      const item = unchecked(this.itemsValue[index]);
      item._bindOwner(null);
      item._disposeContent();
    }
    super.dispose();
  }

  private selectIndexInternal(
    index: i32,
    emit: bool,
    previousItemOverride: TabItem | null,
    previousIndexOverride: i32 = -1,
  ): void {
    if (!this.isEnabledIndex(index)) return;
    if (this.selectingValue) {
      this.pendingSelectionValue = index;
      this.pendingEmitValue = emit;
      return;
    }
    this.selectingValue = true;
    let requestedIndex = index;
    let requestedEmit = emit;
    let overrideItem = previousItemOverride;
    let overrideIndex = previousIndexOverride;
    let iterations = 0;
    while (requestedIndex >= 0 && this.isEnabledIndex(requestedIndex)) {
      const previousIndex = overrideItem !== null ? overrideIndex : this.selectedIndexValue;
      const previousItem = overrideItem !== null ? overrideItem : this.selectedItem;
      overrideItem = null;
      overrideIndex = -1;
      if (this.selectedIndexValue != requestedIndex) {
        this.detachActiveView();
        this.selectedIndexValue = requestedIndex;
        const item = unchecked(this.itemsValue[requestedIndex]);
        const view = item._resolveView();
        this.contentPresenter.addChildNode(view.root);
        this.contentPresenter.semanticLabel(item.labelText + " tab panel");
        view.activate();
        if (requestedEmit) this.emitChanged(previousIndex, requestedIndex, previousItem, item);
      }
      if (this.pendingSelectionValue == NO_PENDING_SELECTION) break;
      requestedIndex = this.pendingSelectionValue;
      requestedEmit = this.pendingEmitValue;
      this.pendingSelectionValue = NO_PENDING_SELECTION;
      iterations += 1;
      if (iterations > this.itemsValue.length + 8) {
        warn("Lifecycle", "TabView stopped a re-entrant selection loop.");
        break;
      }
    }
    this.pendingSelectionValue = NO_PENDING_SELECTION;
    this.selectingValue = false;
  }

  private detachActiveView(): void {
    const item = this.selectedItem;
    if (item === null) return;
    const view = changetype<TabItem>(item)._existingView();
    if (view === null) return;
    const retained = changetype<RetainedView>(view);
    retained.deactivate();
    this.contentPresenter.removeChildNode(retained.root);
  }

  private emitChanged(
    previousIndex: i32,
    selectedIndex: i32,
    previousItem: TabItem | null,
    selectedItem: TabItem | null,
  ): void {
    const event = new TabSelectionChangedEventArgs(previousIndex, selectedIndex, previousItem, selectedItem);
    const callback = this.changedCallback;
    if (callback !== null) callback(event);
    const binding = this.changedBinding;
    if (binding !== null) binding.invoke(event);
  }

  private indexOfItem(item: TabItem): i32 {
    for (let index = 0; index < this.itemsValue.length; ++index) {
      if (unchecked(this.itemsValue[index]) === item) return index;
    }
    return -1;
  }

  private isEnabledIndex(index: i32): bool {
    return index >= 0 && index < this.itemsValue.length && unchecked(this.itemsValue[index]).isEnabled;
  }

  private findReplacementIndex(index: i32): i32 {
    for (let cursor = index; cursor < this.itemsValue.length; ++cursor) if (this.isEnabledIndex(cursor)) return cursor;
    for (let cursor = index - 1; cursor >= 0; --cursor) if (this.isEnabledIndex(cursor)) return cursor;
    return -1;
  }
}
