import * as ui from "../bindings/ui";
import { Animation, AnimationTiming, getAnimationManager } from "../core/Animation";
import { Node } from "../core/Node";
import { throwNullArgument } from "../core/Errors";
import { NodeTransitions } from "../core/Transitions";
import {
  canRestorePersistedScrollOffset,
  clampPersistedScrollOffset,
  storePersistedScrollOffset,
  tryLoadPersistedScrollOffset,
} from "../core/PersistedUiState";
import { HandleValue, NodeType, Unit } from "../core/ffi";
import { ScrollState } from "./ScrollState";

const PROGRAMMATIC_SCROLL_ACK_TOLERANCE: f32 = 0.5;

class ScrollOffsetTransitionAnimation extends Animation {
  constructor(
    private readonly owner: ScrollView,
    private readonly fromX: f32,
    private readonly fromY: f32,
    private readonly toX: f32,
    private readonly toY: f32,
    timing: AnimationTiming,
  ) {
    super(timing);
  }

  protected onSample(easedProgress: f32, _linearProgress: f32): void {
    this.owner._applyAnimatedScrollOffset(
      this.fromX + ((this.toX - this.fromX) * easedProgress),
      this.fromY + ((this.toY - this.fromY) * easedProgress),
    );
  }
}

export class ScrollView extends Node {
  private widthValue: f32 = 0.0;
  private widthUnit: Unit = Unit.Pixel;
  private hasWidth: bool = false;
  private hasFillWidth: bool = false;
  private heightValue: f32 = 0.0;
  private heightUnit: Unit = Unit.Pixel;
  private hasHeight: bool = false;
  private hasFillHeight: bool = false;
  private flexBasisValue: f32 = 0.0;
  private hasFlexBasis: bool = false;
  private enableScrollX: bool = true;
  private enableScrollY: bool = true;
  private showScrollbarsValue: bool = true;
  private frictionValue: f32 = 0.0;
  private scrollOffsetX: f32 = 0.0;
  private scrollOffsetY: f32 = 0.0;
  private hasScrollOffset: bool = false;
  private explicitContentWidth: f32 = -1.0;
  private explicitContentHeight: f32 = -1.0;
  private hasExplicitScrollContentSize: bool = false;
  private hasPendingProgrammaticScroll: bool = false;
  private pendingProgrammaticOffsetX: f32 = 0.0;
  private pendingProgrammaticOffsetY: f32 = 0.0;
  private hasFriction: bool = false;
  private _scrollState: ScrollState = new ScrollState();
  private persistScrollValue: bool = true;
  private persistedScrollRestorePending: bool = false;
  private transitionsValue: NodeTransitions | null = null;
  private scrollOffsetTransitionAnimation: Animation | null = null;

  get scrollState(): ScrollState {
    return this._scrollState;
  }

  get isVerticalScrollEnabled(): bool {
    return this.enableScrollY;
  }

  get isHorizontalScrollEnabled(): bool {
    return this.enableScrollX;
  }

  constructor() {
    super();
    // Make the viewport hit-testable so blank interior/padding starts resolve to this
    // scroll surface instead of only working over interactive descendants.
    this.onPointerDown((_x: f32, _y: f32): void => {});
  }

  bindScrollState(state: ScrollState): this {
    this._scrollState = state;
    this.persistedScrollRestorePending = false;
    return this;
  }

  nodeId(id: string): this {
    super.nodeId(id);
    return this;
  }

  width(value: f32, unit: Unit = Unit.Pixel): this {
    this.widthValue = value;
    this.widthUnit = unit;
    this.hasWidth = true;
    this.hasFillWidth = false;
    if (unit == Unit.Pixel) {
      this._scrollState.viewportWidth.value = value;
    }
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
    if (unit == Unit.Pixel) {
      this._scrollState.viewportHeight.value = value;
    }
    if (this.hasBuiltHandle()) {
      ui.setHeight(this.handle, value, <u32>unit);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  fillWidth(): this {
    this.hasFillWidth = true;
    if (this.hasBuiltHandle()) {
      ui.setFillWidth(this.handle, true);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  fillHeight(): this {
    this.hasFillHeight = true;
    if (this.hasBuiltHandle()) {
      ui.setFillHeight(this.handle, true);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  fillSize(): this {
    this.fillWidth();
    this.fillHeight();
    return this;
  }

  flexBasis(value: f32): this {
    this.flexBasisValue = value;
    this.hasFlexBasis = true;
    if (this.hasBuiltHandle()) {
      ui.setFlexBasis(this.handle, value);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  scrollEnabledX(flag: bool): this {
    this.enableScrollX = flag;
    if (this.hasBuiltHandle()) {
      ui.setScrollEnabled(this.handle, this.enableScrollX, this.enableScrollY);
      this.notifyRetainedMutation();
    }
    return this;
  }

  scrollEnabledY(flag: bool): this {
    this.enableScrollY = flag;
    if (this.hasBuiltHandle()) {
      ui.setScrollEnabled(this.handle, this.enableScrollX, this.enableScrollY);
      this.notifyRetainedMutation();
    }
    return this;
  }

  showScrollbars(flag: bool): this {
    this.showScrollbarsValue = flag;
    if (this.hasBuiltHandle()) {
      ui.setShowScrollbars(this.handle, flag);
      this.notifyRetainedMutation();
    }
    return this;
  }

  friction(value: f32): this {
    this.frictionValue = value;
    this.hasFriction = true;
    if (this.hasBuiltHandle()) {
      ui.setScrollFriction(this.handle, value);
      this.notifyRetainedMutation();
    }
    return this;
  }

  persistScroll(flag: bool = true): this {
    this.persistScrollValue = flag;
    if (!flag) {
      this.persistedScrollRestorePending = false;
    }
    return this;
  }

  transitions(transitions: NodeTransitions | null): this {
    this.transitionsValue = transitions;
    return this;
  }

  scrollTo(x: f32, y: f32): this {
    this.cancelScrollOffsetTransition();
    if (this.hasBuiltHandle() && (this.scrollOffsetX != x || this.scrollOffsetY != y)) {
      this.takeProgrammaticScrollOwnership();
    }
    this._applyAnimatedScrollOffset(x, y);
    return this;
  }

  scrollToAnimated(x: f32, y: f32, timing: AnimationTiming): this {
    this.cancelScrollOffsetTransition();
    if (!this.hasBuiltHandle() || (this.scrollOffsetX == x && this.scrollOffsetY == y)) {
      this._applyAnimatedScrollOffset(x, y);
      return this;
    }
    this.takeProgrammaticScrollOwnership();
    this.startScrollOffsetAnimation(x, y, timing);
    return this;
  }

  scrollOffset(x: f32, y: f32): this {
    this.cancelScrollOffsetTransition();
    if (this.shouldAnimateScrollOffset(x, y)) {
      const transitions = changetype<NodeTransitions>(this.transitionsValue);
      const timing = changetype<AnimationTiming>(transitions.scrollOffsetTiming);
      this.takeProgrammaticScrollOwnership();
      this.startScrollOffsetAnimation(x, y, timing);
      return this;
    }
    if (this.hasBuiltHandle() && (this.scrollOffsetX != x || this.scrollOffsetY != y)) {
      this.takeProgrammaticScrollOwnership();
    }
    this._applyAnimatedScrollOffset(x, y);
    return this;
  }

  scrollContentSize(contentWidth: f32 = -1.0, contentHeight: f32 = -1.0): this {
    this.explicitContentWidth = contentWidth;
    this.explicitContentHeight = contentHeight;
    this.hasExplicitScrollContentSize = true;
    if (contentWidth >= 0.0) {
      this._scrollState.contentWidth.value = contentWidth;
    }
    if (contentHeight >= 0.0) {
      this._scrollState.contentHeight.value = contentHeight;
    }
    if (this.hasBuiltHandle()) {
      ui.setScrollContentSize(this.handle, contentWidth, contentHeight);
      this.notifyRetainedMutation();
    }
    return this;
  }

  setRuntimeScrollOffset(x: f32, y: f32): void {
    this.cancelScrollOffsetTransition();
    this._applyAnimatedScrollOffset(x, y);
  }

  onClick(cb: () => void): this {
    super.onClick(cb);
    return this;
  }

  onPointerEnter(cb: () => void): this {
    super.onPointerEnter(cb);
    return this;
  }

  onPointerLeave(cb: () => void): this {
    super.onPointerLeave(cb);
    return this;
  }

  child(node: Node): this {
    if (node == null) {
      throwNullArgument("ScrollView.child", "node");
    }
    this.appendChild(node);
    return this;
  }

  children(nodes: Array<Node>): this {
    this.replaceChildren(nodes);
    return this;
  }

  build(): u64 {
    if (this.hasBuiltHandle()) {
      return this.handle;
    }

    this.handle = ui.createNode(<u32>NodeType.ScrollView);
    this.applyNodeMetadata();
    this.finishBuild();
    ui.setScrollEnabled(this.handle, this.enableScrollX, this.enableScrollY);
    ui.setShowScrollbars(this.handle, this.showScrollbarsValue);
    if (this.hasFriction) {
      ui.setScrollFriction(this.handle, this.frictionValue);
    }
    if (this.hasExplicitScrollContentSize) {
      ui.setScrollContentSize(this.handle, this.explicitContentWidth, this.explicitContentHeight);
    }
    if (this.hasWidth) {
      ui.setWidth(this.handle, this.widthValue, <u32>this.widthUnit);
    }
    if (this.hasFillWidth) {
      ui.setFillWidth(this.handle, true);
    }
    if (this.hasHeight) {
      ui.setHeight(this.handle, this.heightValue, <u32>this.heightUnit);
    }
    if (this.hasFillHeight) {
      ui.setFillHeight(this.handle, true);
    }
    if (this.hasFlexBasis) {
      ui.setFlexBasis(this.handle, this.flexBasisValue);
    }
    if (this.hasScrollOffset) {
      this.prepareProgrammaticScroll(this.scrollOffsetX, this.scrollOffsetY);
      ui.setScrollOffset(this.handle, this.scrollOffsetX, this.scrollOffsetY);
    }
    this.buildChildren();
    return this.handle;
  }

  dispose(): void {
    this.cancelScrollOffsetTransition();
    this.disposeTree();
  }

  _debugMainAxisPercentValue(isHorizontal: bool): f32 {
    if (isHorizontal) {
      return this.hasWidth && this.widthUnit == Unit.Percent ? this.widthValue : -1.0;
    }
    return this.hasHeight && this.heightUnit == Unit.Percent ? this.heightValue : -1.0;
  }

  _handleScroll(
    offsetX: f32,
    offsetY: f32,
    contentWidth: f32,
    contentHeight: f32,
    viewportWidth: f32,
    viewportHeight: f32,
  ): void {
    this.syncScrollMetrics(contentWidth, contentHeight, viewportWidth, viewportHeight);
    if (this.tryRestorePersistedScrollOffset()) {
      return;
    }
    if (this.hasPendingProgrammaticScroll) {
      this.hasPendingProgrammaticScroll = false;
      if (this.matchesPendingProgrammaticScroll(offsetX, offsetY)) {
        return;
      }
    }
    this.cancelScrollOffsetTransition();
    this.updateRetainedScrollOffset(offsetX, offsetY);
    this._scrollState.offsetX.value = offsetX;
    this._scrollState.offsetY.value = offsetY;
  }

  protected capturePersistedState(): void {
    super.capturePersistedState();
    if (!this.persistScrollValue) {
      return;
    }
    this.storePersistedScrollOffset(this.scrollOffsetX, this.scrollOffsetY);
  }

  protected restorePersistedState(): void {
    super.restorePersistedState();
    if (!this.persistScrollValue) {
      return;
    }
    this.persistedScrollRestorePending = true;
    this.tryRestorePersistedScrollOffset();
  }

  private syncScrollMetrics(
    contentWidth: f32,
    contentHeight: f32,
    viewportWidth: f32,
    viewportHeight: f32,
  ): void {
    this._scrollState.contentWidth.value = contentWidth;
    this._scrollState.contentHeight.value = contentHeight;
    this._scrollState.viewportWidth.value = viewportWidth;
    this._scrollState.viewportHeight.value = viewportHeight;
  }

  private updateRetainedScrollOffset(x: f32, y: f32): void {
    this.scrollOffsetX = x;
    this.scrollOffsetY = y;
    this.hasScrollOffset = true;
  }

  _applyAnimatedScrollOffset(x: f32, y: f32): void {
    this.updateRetainedScrollOffset(x, y);
    this._scrollState.offsetX.value = x;
    this._scrollState.offsetY.value = y;
    if (this.hasBuiltHandle()) {
      this.prepareProgrammaticScroll(x, y);
      ui.setScrollOffset(this.handle, x, y);
      this.notifyRetainedMutation();
    }
  }

  private shouldAnimateScrollOffset(x: f32, y: f32): bool {
    const transitions = this.transitionsValue;
    if (transitions === null || transitions.scrollOffsetTiming === null) {
      return false;
    }
    if (!this.hasBuiltHandle()) {
      return false;
    }
    return this.scrollOffsetX != x || this.scrollOffsetY != y;
  }

  private cancelScrollOffsetTransition(): void {
    const animation = this.scrollOffsetTransitionAnimation;
    if (animation !== null) {
      animation.cancel();
    }
  }

  private startScrollOffsetAnimation(x: f32, y: f32, timing: AnimationTiming): void {
    this.scrollOffsetTransitionAnimation = getAnimationManager().start(
      new ScrollOffsetTransitionAnimation(
        this,
        this.scrollOffsetX,
        this.scrollOffsetY,
        x,
        y,
        timing,
      ),
    );
  }

  private takeProgrammaticScrollOwnership(): void {
    ui.clearMomentumScroll();
  }

  private prepareProgrammaticScroll(x: f32, y: f32): void {
    this.hasPendingProgrammaticScroll = true;
    this.pendingProgrammaticOffsetX = x;
    this.pendingProgrammaticOffsetY = y;
  }

  private matchesPendingProgrammaticScroll(offsetX: f32, offsetY: f32): bool {
    let deltaX = offsetX - this.pendingProgrammaticOffsetX;
    if (deltaX < 0.0) {
      deltaX = -deltaX;
    }
    if (deltaX > PROGRAMMATIC_SCROLL_ACK_TOLERANCE) {
      return false;
    }

    let deltaY = offsetY - this.pendingProgrammaticOffsetY;
    if (deltaY < 0.0) {
      deltaY = -deltaY;
    }
    return deltaY <= PROGRAMMATIC_SCROLL_ACK_TOLERANCE;
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
    if (!canRestorePersistedScrollOffset(this._scrollState, restored, this.enableScrollX, this.enableScrollY)) {
      return false;
    }
    this.persistedScrollRestorePending = false;
    const clamped = clampPersistedScrollOffset(this._scrollState, restored, this.enableScrollX, this.enableScrollY);
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
