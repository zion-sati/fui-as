import { HandlerAction } from "../core/Action";
import { AnimationTiming } from "../core/Animation";
import { Disposable, disposeAll } from "../core/Disposable";
import { HandleValue, Orientation, Unit } from "../core/ffi";
import { Node } from "../core/Node";
import { throwNullArgument } from "../core/Errors";
import {
  canRestorePersistedScrollOffset,
  clampPersistedScrollOffset,
  storePersistedScrollOffset,
  tryLoadPersistedScrollOffset,
} from "../core/PersistedUiState";
import { FlexBox } from "./FlexBox";
import { Row } from "./helpers";
import { ScrollBar, ScrollBarVisibility } from "./ScrollBar";
import { ScrollState } from "./ScrollState";
import { ScrollView } from "./ScrollView";
import { NodeTransitions } from "../core/Transitions";

const DEFAULT_SCROLLBAR_GUTTER: f32 = 6.0;
const OVERFLOW_TOLERANCE: f32 = 0.5;

function noopPointerCallback(_x: f32, _y: f32): void {}

export class ScrollBox extends FlexBox {
  private readonly scrollStateValue: ScrollState;
  private readonly viewportValue: ScrollView;
  private readonly topRowValue: FlexBox;
  private readonly bottomRowValue: FlexBox;
  private readonly verticalGutterValue: FlexBox;
  private readonly cornerValue: FlexBox;
  private readonly verticalScrollBarValue: ScrollBar;
  private readonly horizontalScrollBarValue: ScrollBar;
  private readonly disposables: Array<Disposable> = new Array<Disposable>();
  private verticalVisibilityValue: ScrollBarVisibility = ScrollBarVisibility.Auto;
  private horizontalVisibilityValue: ScrollBarVisibility = ScrollBarVisibility.Auto;
  private verticalScrollEnabledValue: bool = true;
  private horizontalScrollEnabledValue: bool = true;
  private scrollbarGutterValue: f32 = DEFAULT_SCROLLBAR_GUTTER;
  private verticalChromeVisibleValue: bool = false;
  private horizontalChromeVisibleValue: bool = false;
  private persistScrollValue: bool = false;
  private persistedScrollRestorePending: bool = false;

  constructor(scrollState: ScrollState = new ScrollState(), viewportOverride: ScrollView | null = null) {
    super();
    this.scrollStateValue = scrollState;

    const viewportValue = (viewportOverride === null ? new ScrollView() : viewportOverride)
      .bindScrollState(scrollState)
      .showScrollbars(false)
      .width(0.0, Unit.Pixel)
      .height(100.0, Unit.Percent)
      .flexGrow(1.0);
    const verticalGutterValue = new FlexBox()
      .width(DEFAULT_SCROLLBAR_GUTTER, Unit.Pixel)
      .height(100.0, Unit.Percent)
      .onPointerDown(noopPointerCallback) as FlexBox;
    const verticalScrollBarValue = new ScrollBar(scrollState, Orientation.Vertical);
    const cornerValue = new FlexBox()
      .width(0.0, Unit.Pixel)
      .height(0.0, Unit.Pixel)
      .onPointerDown(noopPointerCallback) as FlexBox;
    const horizontalScrollBarValue = new ScrollBar(scrollState, Orientation.Horizontal);
    const topRowValue = Row(
      viewportValue,
      verticalGutterValue,
      verticalScrollBarValue.render(),
    );
    topRowValue.onPointerDown(noopPointerCallback);
    topRowValue.width(100.0, Unit.Percent).height(0.0, Unit.Pixel).flexGrow(1.0);
    const bottomRowValue = Row(
      horizontalScrollBarValue.render(),
      cornerValue,
    );
    bottomRowValue.onPointerDown(noopPointerCallback);
    bottomRowValue.width(100.0, Unit.Percent).height(0.0, Unit.Pixel);

    this.viewportValue = viewportValue;
    this.topRowValue = topRowValue;
    this.bottomRowValue = bottomRowValue;
    this.verticalGutterValue = verticalGutterValue;
    this.cornerValue = cornerValue;
    this.verticalScrollBarValue = verticalScrollBarValue;
    this.horizontalScrollBarValue = horizontalScrollBarValue;

    super.child(topRowValue);
    super.child(bottomRowValue);
    this.attachListeners();
    this.refreshChrome();
  }

  get scrollState(): ScrollState {
    return this.scrollStateValue;
  }

  get viewport(): ScrollView {
    return this.viewportValue;
  }

  get verticalScrollBar(): ScrollBar {
    return this.verticalScrollBarValue;
  }

  get horizontalScrollBar(): ScrollBar {
    return this.horizontalScrollBarValue;
  }

  nodeId(id: string): this {
    super.nodeId(id);
    return this;
  }

  child(node: Node): this {
    if (node == null) {
      throwNullArgument("ScrollBox.child", "node");
    }
    this.clearContentScrollProxyTargets();
    this.viewportValue.child(node);
    this.bindContentScrollProxyTargets();
    return this;
  }

  children(nodes: Array<Node>): this {
    this.clearContentScrollProxyTargets();
    this.viewportValue.children(nodes);
    this.bindContentScrollProxyTargets();
    return this;
  }

  scrollEnabledX(flag: bool): this {
    this.horizontalScrollEnabledValue = flag;
    this.viewportValue.scrollEnabledX(flag);
    this.refreshChrome();
    return this;
  }

  scrollEnabledY(flag: bool): this {
    this.verticalScrollEnabledValue = flag;
    this.viewportValue.scrollEnabledY(flag);
    this.refreshChrome();
    return this;
  }

  persistScroll(flag: bool = true): this {
    this.persistScrollValue = flag;
    if (!flag) {
      this.persistedScrollRestorePending = false;
    }
    return this;
  }

  scrollOffset(x: f32, y: f32): this {
    this.viewportValue.scrollOffset(x, y);
    return this;
  }

  scrollContentSize(contentWidth: f32 = -1.0, contentHeight: f32 = -1.0): this {
    this.viewportValue.scrollContentSize(contentWidth, contentHeight);
    return this;
  }

  scrollTo(x: f32, y: f32): this {
    this.viewportValue.scrollTo(x, y);
    return this;
  }

  scrollToAnimated(x: f32, y: f32, timing: AnimationTiming): this {
    this.viewportValue.scrollToAnimated(x, y, timing);
    return this;
  }

  transitions(transitions: NodeTransitions | null): this {
    this.viewportValue.transitions(transitions);
    return this;
  }

  setRuntimeScrollOffset(x: f32, y: f32): void {
    this.viewportValue.setRuntimeScrollOffset(x, y);
  }

  verticalScrollbarVisibility(mode: ScrollBarVisibility): this {
    this.verticalVisibilityValue = mode;
    this.refreshChrome();
    return this;
  }

  horizontalScrollbarVisibility(mode: ScrollBarVisibility): this {
    this.horizontalVisibilityValue = mode;
    this.refreshChrome();
    return this;
  }

  scrollbarGutter(value: f32): this {
    this.scrollbarGutterValue = value > 0.0 ? value : 0.0;
    this.refreshChrome();
    return this;
  }

  build(): u64 {
    const handle = super.build();
    this.bindScrollChrome();
    this.refreshChrome();
    return handle;
  }

  private disposeControl(): void {
    this.verticalScrollBarValue.dispose();
    this.horizontalScrollBarValue.dispose();
    disposeAll(this.disposables);
  }

  dispose(): void {
    const viewportHandle = this.viewportValue.builtHandle;
    this.verticalScrollBarValue.clearScrollHandle(viewportHandle);
    this.horizontalScrollBarValue.clearScrollHandle(viewportHandle);
    this._bindScrollProxyTarget(0);
    this.topRowValue._bindScrollProxyTarget(0);
    this.bottomRowValue._bindScrollProxyTarget(0);
    this.verticalGutterValue._bindScrollProxyTarget(0);
    this.cornerValue._bindScrollProxyTarget(0);
    this.clearContentScrollProxyTargets();
    this.disposeControl();
    super.dispose();
  }

  private attachListeners(): void {
    this.track(this.scrollStateValue.contentWidth.addAction(new HandlerAction<ScrollBox, f32>(this, (scrollBox: ScrollBox, _value: f32): void => {
      scrollBox.refreshChrome();
      scrollBox.tryRestorePersistedScrollOffset();
    })));
    this.track(this.scrollStateValue.contentHeight.addAction(new HandlerAction<ScrollBox, f32>(this, (scrollBox: ScrollBox, _value: f32): void => {
      scrollBox.refreshChrome();
      scrollBox.tryRestorePersistedScrollOffset();
    })));
    this.track(this.scrollStateValue.viewportWidth.addAction(new HandlerAction<ScrollBox, f32>(this, (scrollBox: ScrollBox, _value: f32): void => {
      scrollBox.refreshChrome();
      scrollBox.tryRestorePersistedScrollOffset();
    })));
    this.track(this.scrollStateValue.viewportHeight.addAction(new HandlerAction<ScrollBox, f32>(this, (scrollBox: ScrollBox, _value: f32): void => {
      scrollBox.refreshChrome();
      scrollBox.tryRestorePersistedScrollOffset();
    })));
    this.track(this.verticalScrollBarValue.chromeMetricVersion.addAction(new HandlerAction<ScrollBox, i32>(this, (scrollBox: ScrollBox, _value: i32): void => {
      scrollBox.refreshChrome();
    })));
    this.track(this.horizontalScrollBarValue.chromeMetricVersion.addAction(new HandlerAction<ScrollBox, i32>(this, (scrollBox: ScrollBox, _value: i32): void => {
      scrollBox.refreshChrome();
    })));
    this.track(this.scrollStateValue.offsetX.addAction(new HandlerAction<ScrollBox, f32>(this, (scrollBox: ScrollBox, _value: f32): void => {
      scrollBox.tryRestorePersistedScrollOffset();
    })));
    this.track(this.scrollStateValue.offsetY.addAction(new HandlerAction<ScrollBox, f32>(this, (scrollBox: ScrollBox, _value: f32): void => {
      scrollBox.tryRestorePersistedScrollOffset();
    })));
  }

  private track(disposable: Disposable): void {
    this.disposables.push(disposable);
  }

  private bindScrollChrome(): void {
    const viewportHandle = this.viewportValue.builtHandle;
    this.verticalScrollBarValue.bindScrollHandle(viewportHandle);
    this.horizontalScrollBarValue.bindScrollHandle(viewportHandle);
    this._bindScrollProxyTarget(viewportHandle);
    this.topRowValue._bindScrollProxyTarget(viewportHandle);
    this.bottomRowValue._bindScrollProxyTarget(viewportHandle);
    this.verticalGutterValue._bindScrollProxyTarget(viewportHandle);
    this.cornerValue._bindScrollProxyTarget(viewportHandle);
    this.bindContentScrollProxyTargets();
  }

  private bindContentScrollProxyTargets(): void {
    const viewportHandle = this.viewportValue.builtHandle;
    if (viewportHandle == <u64>HandleValue.Invalid) {
      return;
    }
    for (let index = 0; index < this.viewportValue.childCount; index += 1) {
      const child = this.viewportValue.getChildAt(index);
      if (child !== null) {
        child._bindScrollProxyTarget(viewportHandle);
      }
    }
  }

  private clearContentScrollProxyTargets(): void {
    for (let index = 0; index < this.viewportValue.childCount; index += 1) {
      const child = this.viewportValue.getChildAt(index);
      if (child !== null) {
        child._bindScrollProxyTarget(<u64>HandleValue.Invalid);
      }
    }
  }

  private refreshChrome(): void {
    const verticalRailThickness = this.scrollbarGutterValue + this.verticalScrollBarValue.thickness;
    const horizontalRailThickness = this.horizontalScrollBarValue.thickness;
    const outerViewportWidth = this.scrollStateValue.viewportWidth.value + (this.verticalChromeVisibleValue ? verticalRailThickness : 0.0);
    const outerViewportHeight = this.scrollStateValue.viewportHeight.value + (this.horizontalChromeVisibleValue ? horizontalRailThickness : 0.0);
    let showVertical = this.verticalChromeVisibleValue;
    let showHorizontal = this.horizontalChromeVisibleValue;
    for (let pass = 0; pass < 3; pass += 1) {
      const availableWidth = outerViewportWidth - (showVertical ? verticalRailThickness : 0.0);
      const availableHeight = outerViewportHeight - (showHorizontal ? horizontalRailThickness : 0.0);
      const nextVertical = this.shouldShow(
        this.verticalVisibilityValue,
        this.verticalScrollEnabledValue,
        this.scrollStateValue.contentHeight.value,
        availableHeight,
      );
      const nextHorizontal = this.shouldShow(
        this.horizontalVisibilityValue,
        this.horizontalScrollEnabledValue,
        this.scrollStateValue.contentWidth.value,
        availableWidth,
      );
      if (nextVertical == showVertical && nextHorizontal == showHorizontal) {
        break;
      }
      showVertical = nextVertical;
      showHorizontal = nextHorizontal;
    }
    this.verticalChromeVisibleValue = showVertical;
    this.horizontalChromeVisibleValue = showHorizontal;
    this.verticalScrollBarValue.chromeVisible(showVertical);
    this.horizontalScrollBarValue.chromeVisible(showHorizontal);
    const verticalRailWidth = showVertical ? verticalRailThickness : 0.0;
    const horizontalRailHeight = showHorizontal ? horizontalRailThickness : 0.0;

    this.verticalGutterValue.width(showVertical ? this.scrollbarGutterValue : 0.0, Unit.Pixel);
    this.verticalScrollBarValue.render().width(
      showVertical ? this.verticalScrollBarValue.thickness : 0.0,
      Unit.Pixel,
    );
    this.bottomRowValue.height(horizontalRailHeight, Unit.Pixel);
    this.horizontalScrollBarValue.render().height(showHorizontal ? this.horizontalScrollBarValue.thickness : 0.0, Unit.Pixel);
    this.cornerValue.width(showVertical ? verticalRailWidth : 0.0, Unit.Pixel);
    this.cornerValue.height(showHorizontal ? horizontalRailHeight : 0.0, Unit.Pixel);
  }

  private shouldShow(mode: ScrollBarVisibility, enabled: bool, contentSize: f32, viewportSize: f32): bool {
    if (!enabled || mode == ScrollBarVisibility.Never) {
      return false;
    }
    if (mode == ScrollBarVisibility.Always) {
      return true;
    }
    if (viewportSize <= 0.0 || contentSize <= 0.0) {
      return false;
    }
    return contentSize > viewportSize + OVERFLOW_TOLERANCE;
  }

  protected capturePersistedState(): void {
    super.capturePersistedState();
    if (!this.persistScrollValue) {
      return;
    }
    this.storePersistedScrollOffset(this.scrollStateValue.offsetX.value, this.scrollStateValue.offsetY.value);
  }

  protected restorePersistedState(): void {
    super.restorePersistedState();
    if (!this.persistScrollValue) {
      return;
    }
    this.persistedScrollRestorePending = true;
    this.tryRestorePersistedScrollOffset();
  }

  private tryRestorePersistedScrollOffset(): bool {
    if (!this.persistedScrollRestorePending || !this.persistScrollValue) {
      return false;
    }
    const nodeId = this.getNodeId();
    if (nodeId === null || nodeId.length == 0) {
      this.persistedScrollRestorePending = false;
      return false;
    }
    const restored = tryLoadPersistedScrollOffset(nodeId);
    if (restored === null) {
      this.persistedScrollRestorePending = false;
      return false;
    }
    if (!canRestorePersistedScrollOffset(
      this.scrollStateValue,
      restored,
      this.horizontalScrollEnabledValue,
      this.verticalScrollEnabledValue,
    )) {
      return false;
    }
    this.persistedScrollRestorePending = false;
    const clamped = clampPersistedScrollOffset(
      this.scrollStateValue,
      restored,
      this.horizontalScrollEnabledValue,
      this.verticalScrollEnabledValue,
    );
    this.setRuntimeScrollOffset(clamped.x, clamped.y);
    return true;
  }

  private storePersistedScrollOffset(x: f32, y: f32): void {
    if (!this.persistScrollValue) {
      return;
    }
    const nodeId = this.getNodeId();
    if (nodeId === null || nodeId.length == 0) {
      return;
    }
    storePersistedScrollOffset(nodeId, x, y);
  }
}
