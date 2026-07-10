import * as ui from "../bindings/ui";
import { PopupPresenter } from "../controls/internal/PopupPresenter";
import { FlexBox, Portal, TextCore } from "../nodes";
import { FlexDirection, HandleValue, Unit } from "./ffi";
import { flushCommit } from "./FrameScheduler";
import { keyboardFocusVisible } from "./FocusVisibility";
import { cancelTimer, scheduleTimer } from "./Timers";
import { activeTheme } from "./Theme";
import { Node } from "./Node";
import { ToolTip } from "./ToolTip";

const SHOW_TIMER_ID: u32 = 0x54545001;
const HIDE_TIMER_ID: u32 = 0x54545002;
const MIN_TOOLTIP_SURFACE_SIZE: f32 = 1.0;

enum ToolTipAnchorKind {
  None = 0,
  Owner = 1,
  Pointer = 2,
}

export class ToolTipManager {
  private static hostRoot: Portal | null = null;
  private static panelNode: FlexBox | null = null;
  private static labelNode: TextCore | null = null;
  private static presenter: PopupPresenter | null = null;
  private static activeOwner: Node | null = null;
  private static activeToolTip: ToolTip | null = null;
  private static pendingOwner: Node | null = null;
  private static pendingToolTip: ToolTip | null = null;
  private static hoveredOwner: Node | null = null;
  private static hoveredToolTip: ToolTip | null = null;
  private static suppressedHoverOwner: Node | null = null;
  private static focusedOwner: Node | null = null;
  private static focusedToolTip: ToolTip | null = null;
  private static quickShowUntilMs: f64 = -1.0;
  private static subscribedToFocusVisibility: bool = false;
  private static hoveredPointerX: f32 = NaN;
  private static hoveredPointerY: f32 = NaN;
  private static pendingAnchorKind: ToolTipAnchorKind = ToolTipAnchorKind.None;
  private static pendingPopupX: f32 = NaN;
  private static pendingPopupY: f32 = NaN;
  private static activeAnchorKind: ToolTipAnchorKind = ToolTipAnchorKind.None;
  private static activeAnchorX: f32 = NaN;
  private static activeAnchorY: f32 = NaN;
  private static activeAnchorWidth: f32 = NaN;
  private static activeAnchorHeight: f32 = NaN;
  private static activePopupX: f32 = NaN;
  private static activePopupY: f32 = NaN;

  static createDefaultHost(): Portal {
    const existingHost = this.hostRoot;
    if (existingHost !== null) {
      return existingHost;
    }
    const labelNode = new TextCore("");
    const panelNode = new FlexBox()
      .positionAbsolute()
      .flexDirection(FlexDirection.Column)
      .child(labelNode) as FlexBox;
    const hostRoot = new Portal()
      .positionAbsolute()
      .position(0.0, 0.0)
      .width(100.0, Unit.Percent)
      .height(100.0, Unit.Percent) as Portal;
    this.hostRoot = hostRoot;
    this.panelNode = panelNode;
    this.labelNode = labelNode;
    this.presenter = new PopupPresenter(hostRoot, panelNode, null);
    if (!this.subscribedToFocusVisibility) {
      this.subscribedToFocusVisibility = true;
      keyboardFocusVisible.subscribe(handleToolTipFocusVisibilityChanged);
    }
    return hostRoot;
  }

  static clear(): void {
    cancelTimer(SHOW_TIMER_ID);
    this.pendingOwner = null;
    this.pendingToolTip = null;
    this.hoveredOwner = null;
    this.hoveredToolTip = null;
    this.suppressedHoverOwner = null;
    this.hoveredPointerX = NaN;
    this.hoveredPointerY = NaN;
    this.focusedOwner = null;
    this.focusedToolTip = null;
    this.pendingAnchorKind = ToolTipAnchorKind.None;
    this.pendingPopupX = NaN;
    this.pendingPopupY = NaN;
    this.hideCurrent();
    this.quickShowUntilMs = -1.0;
  }

  static handleToolTipChanged(owner: Node, toolTip: ToolTip | null): void {
    if (toolTip === null) {
      this.clearOwner(owner);
      this.activateBestCandidate();
      return;
    }
    if (this.hoveredOwner === owner) {
      this.hoveredToolTip = toolTip;
    }
    if (this.focusedOwner === owner) {
      this.focusedToolTip = toolTip;
    }
    if (this.activeOwner === owner) {
      this.activeToolTip = toolTip;
      this.showNow(owner, toolTip, true);
      return;
    }
    if (this.pendingOwner === owner) {
      this.pendingToolTip = toolTip;
      this.activateBestCandidate();
    }
  }

  static handlePointerEnter(owner: Node, toolTip: ToolTip | null, x: f32, y: f32): void {
    if (toolTip === null || toolTip.contentText.length == 0) {
      return;
    }
    if (this.suppressedHoverOwner === owner) {
      this.suppressedHoverOwner = null;
    }
    this.hoveredOwner = owner;
    this.hoveredToolTip = toolTip;
    this.hoveredPointerX = x;
    this.hoveredPointerY = y;
    this.activateBestCandidate();
  }

  static handlePointerMove(owner: Node, x: f32, y: f32): void {
    if (this.hoveredOwner !== owner) {
      return;
    }
    this.hoveredPointerX = x;
    this.hoveredPointerY = y;
    if (this.pendingOwner === owner && this.pendingAnchorKind == ToolTipAnchorKind.Pointer) {
      this.pendingPopupX = x;
      this.pendingPopupY = y;
    }
  }

  static handlePointerLeave(owner: Node): void {
    if (this.hoveredOwner === owner) {
      this.hoveredOwner = null;
      this.hoveredToolTip = null;
      this.hoveredPointerX = NaN;
      this.hoveredPointerY = NaN;
    }
    if (this.suppressedHoverOwner === owner) {
      this.suppressedHoverOwner = null;
    }
    this.activateBestCandidate();
  }

  static handlePointerDown(owner: Node): void {
    if (this.activeOwner === owner || this.pendingOwner === owner) {
      cancelTimer(SHOW_TIMER_ID);
      this.hideCurrent();
      this.pendingOwner = null;
      this.pendingToolTip = null;
      this.pendingAnchorKind = ToolTipAnchorKind.None;
      this.pendingPopupX = NaN;
      this.pendingPopupY = NaN;
    }
  }

  static handleFocusChanged(owner: Node, toolTip: ToolTip | null, focused: bool): void {
    if (focused) {
      if (toolTip !== null && toolTip.opensOnFocus && toolTip.contentText.length > 0) {
        this.focusedOwner = owner;
        this.focusedToolTip = toolTip;
      }
    } else if (this.focusedOwner === owner) {
      this.focusedOwner = null;
      this.focusedToolTip = null;
    }
    this.activateBestCandidate();
  }

  static handleOwnerDestroyed(owner: Node): void {
    this.clearOwner(owner);
    this.activateBestCandidate();
  }

  static handleScroll(): void {
    if (this.activeAnchorKind != ToolTipAnchorKind.Pointer || this.activeOwner === null) {
      return;
    }
    this.suppressedHoverOwner = this.activeOwner;
    if (this.hoveredOwner === this.activeOwner) {
      this.hoveredOwner = null;
      this.hoveredToolTip = null;
      this.hoveredPointerX = NaN;
      this.hoveredPointerY = NaN;
    }
    this.pendingOwner = null;
    this.pendingToolTip = null;
    this.pendingAnchorKind = ToolTipAnchorKind.None;
    this.pendingPopupX = NaN;
    this.pendingPopupY = NaN;
    cancelTimer(SHOW_TIMER_ID);
    this.hideCurrent();
    this.activateBestCandidate();
  }

  private static clearOwner(owner: Node): void {
    if (this.hoveredOwner === owner) {
      this.hoveredOwner = null;
      this.hoveredToolTip = null;
      this.hoveredPointerX = NaN;
      this.hoveredPointerY = NaN;
    }
    if (this.suppressedHoverOwner === owner) {
      this.suppressedHoverOwner = null;
    }
    if (this.focusedOwner === owner) {
      this.focusedOwner = null;
      this.focusedToolTip = null;
    }
    if (this.pendingOwner === owner) {
      this.pendingOwner = null;
      this.pendingToolTip = null;
      cancelTimer(SHOW_TIMER_ID);
    }
    if (this.activeOwner === owner) {
      this.hideCurrent();
    }
  }

  static activateBestCandidate(): void {
    const hoveredCandidateOwner = this.hoveredOwner !== this.suppressedHoverOwner
      ? this.hoveredOwner
      : null;
    const candidateOwner = hoveredCandidateOwner !== null
      ? hoveredCandidateOwner
      : (keyboardFocusVisible.value ? this.focusedOwner : null);
    const candidateToolTip = hoveredCandidateOwner !== null
      ? this.hoveredToolTip
      : (keyboardFocusVisible.value ? this.focusedToolTip : null);
    const candidateAnchorKind = hoveredCandidateOwner !== null
      ? ToolTipAnchorKind.Pointer
      : ToolTipAnchorKind.Owner;
    if (candidateOwner === null || candidateToolTip === null || candidateToolTip.contentText.length == 0) {
      this.pendingOwner = null;
      this.pendingToolTip = null;
      this.pendingAnchorKind = ToolTipAnchorKind.None;
      this.pendingPopupX = NaN;
      this.pendingPopupY = NaN;
      cancelTimer(SHOW_TIMER_ID);
      this.hideCurrent();
      return;
    }
    if (
      this.activeOwner === candidateOwner &&
      this.activeToolTip === candidateToolTip
    ) {
      return;
    }
    this.requestShow(candidateOwner, candidateToolTip, candidateAnchorKind);
  }

  private static requestShow(owner: Node, toolTip: ToolTip, anchorKind: ToolTipAnchorKind): void {
    this.pendingOwner = owner;
    this.pendingToolTip = toolTip;
    this.pendingAnchorKind = anchorKind;
    this.pendingPopupX = anchorKind == ToolTipAnchorKind.Pointer ? this.hoveredPointerX : NaN;
    this.pendingPopupY = anchorKind == ToolTipAnchorKind.Pointer ? this.hoveredPointerY : NaN;
    cancelTimer(HIDE_TIMER_ID);
    const now = this.nowMs();
    const delayMs = now <= this.quickShowUntilMs ? 0 : toolTip.initialShowDelayMs;
    cancelTimer(SHOW_TIMER_ID);
    if (delayMs <= 0) {
      this.commitPendingShow();
      return;
    }
    scheduleTimer(SHOW_TIMER_ID, delayMs, handleToolTipShowTimer);
  }

  static commitPendingShow(): void {
    const owner = this.pendingOwner;
    const toolTip = this.pendingToolTip;
    if (owner === null || toolTip === null) {
      return;
    }
    this.pendingOwner = null;
    this.pendingToolTip = null;
    const anchorKind = this.pendingAnchorKind;
    this.pendingAnchorKind = ToolTipAnchorKind.None;
    this.showNow(owner, toolTip, false, anchorKind);
  }

  private static showNow(
    owner: Node,
    toolTip: ToolTip,
    preserveCurrentPopupAnchor: bool = false,
    anchorKind: ToolTipAnchorKind = ToolTipAnchorKind.Owner,
  ): void {
    const presenter = this.presenter;
    const panelNode = this.panelNode;
    const labelNode = this.labelNode;
    const hostRoot = this.hostRoot;
    if (presenter === null || panelNode === null || labelNode === null || hostRoot === null) {
      return;
    }
    if (owner.builtHandle == <u64>HandleValue.Invalid || hostRoot.builtHandle == <u64>HandleValue.Invalid) {
      return;
    }
    if (hostRoot.parentNode !== owner) {
      owner.addChildNode(hostRoot);
    }
    const theme = activeTheme.value.toolTip;
    const panelBackground = toolTip.hasPanelColorOverride ? toolTip.panelBackgroundColor : theme.panelBackground;
    const textColor = toolTip.hasTextColorOverride ? toolTip.tooltipTextColor : theme.textColor;
    labelNode.text(toolTip.contentText)
      .fontFamily(theme.fontFamily)
      .fontSize(theme.fontSize)
      .textColor(textColor)
      .width(0.0, Unit.Auto)
      .height(0.0, Unit.Auto);
    panelNode.padding(theme.paddingLeft, theme.paddingTop, theme.paddingRight, theme.paddingBottom)
      .cornerRadius(theme.panelCornerRadius)
      .border(1.0, theme.panelBorderColor)
      .dropShadow(theme.panelShadowColor, 0.0, theme.shadowOffsetY, theme.shadowBlur, theme.shadowSpread)
      .bgColor(panelBackground)
      .width(0.0, Unit.Auto)
      .height(0.0, Unit.Auto);
    presenter.placement(toolTip.popupPlacement);
    presenter.anchorGap(8.0);
    if (!preserveCurrentPopupAnchor || this.activeOwner !== owner) {
      if (
        anchorKind == ToolTipAnchorKind.Pointer &&
        this.pendingPopupX == this.pendingPopupX &&
        this.pendingPopupY == this.pendingPopupY
      ) {
        this.activeAnchorKind = ToolTipAnchorKind.Pointer;
        this.activePopupX = this.pendingPopupX + toolTip.horizontalOffsetValuePx;
        this.activePopupY = this.pendingPopupY + toolTip.verticalOffsetValuePx;
        this.activeAnchorX = NaN;
        this.activeAnchorY = NaN;
        this.activeAnchorWidth = NaN;
        this.activeAnchorHeight = NaN;
      } else {
        const bounds = this.estimateToolTipBounds(owner);
        if (bounds === null) {
          return;
        }
        this.activeAnchorKind = ToolTipAnchorKind.Owner;
        this.activeAnchorX = unchecked(bounds[0]) + toolTip.horizontalOffsetValuePx;
        this.activeAnchorY = unchecked(bounds[1]) + toolTip.verticalOffsetValuePx;
        this.activeAnchorWidth = unchecked(bounds[2]);
        this.activeAnchorHeight = unchecked(bounds[3]);
        this.activePopupX = NaN;
        this.activePopupY = NaN;
      }
    }
    this.showAtResolvedAnchor(presenter, toolTip, MIN_TOOLTIP_SURFACE_SIZE, MIN_TOOLTIP_SURFACE_SIZE);
    flushCommit();
    const measuredBounds = panelNode.builtHandle != <u64>HandleValue.Invalid
      ? ui.tryGetBounds(panelNode.builtHandle)
      : null;
    const measuredWidth = measuredBounds !== null
      ? <f32>Math.max(MIN_TOOLTIP_SURFACE_SIZE, unchecked(measuredBounds[2]))
      : MIN_TOOLTIP_SURFACE_SIZE;
    const measuredHeight = measuredBounds !== null
      ? <f32>Math.max(MIN_TOOLTIP_SURFACE_SIZE, unchecked(measuredBounds[3]))
      : MIN_TOOLTIP_SURFACE_SIZE;
    this.showAtResolvedAnchor(presenter, toolTip, measuredWidth, measuredHeight);
    flushCommit();
    this.activeOwner = owner;
    this.activeToolTip = toolTip;
    this.quickShowUntilMs = this.nowMs() + toolTip.betweenShowDelayMs;
    cancelTimer(HIDE_TIMER_ID);
    if (toolTip.showDurationMs > 0) {
      scheduleTimer(HIDE_TIMER_ID, toolTip.showDurationMs, handleToolTipHideTimer);
    }
  }

  static hideCurrent(): void {
    cancelTimer(HIDE_TIMER_ID);
    const presenter = this.presenter;
    if (presenter !== null) {
      presenter.hide();
    }
    const hostRoot = this.hostRoot;
    const hostParent = hostRoot !== null ? hostRoot.parentNode : null;
    if (hostParent !== null) {
      hostParent.removeChildNode(changetype<Portal>(hostRoot));
    }
    this.activeOwner = null;
    this.activeToolTip = null;
    this.activeAnchorKind = ToolTipAnchorKind.None;
    this.activeAnchorX = NaN;
    this.activeAnchorY = NaN;
    this.activeAnchorWidth = NaN;
    this.activeAnchorHeight = NaN;
    this.activePopupX = NaN;
    this.activePopupY = NaN;
  }

  private static estimateToolTipBounds(owner: Node): Float32Array | null {
    if (owner.builtHandle == <u64>HandleValue.Invalid) {
      return null;
    }
    const bounds = ui.tryGetBounds(owner.builtHandle);
    if (bounds !== null) {
      return bounds;
    }
    const fallback = new Float32Array(4);
    unchecked(fallback[0] = 0.0);
    unchecked(fallback[1] = 0.0);
    unchecked(fallback[2] = 1.0);
    unchecked(fallback[3] = 1.0);
    return fallback;
  }

  private static showAtResolvedAnchor(
    presenter: PopupPresenter,
    toolTip: ToolTip,
    width: f32,
    height: f32,
  ): void {
    if (
      this.activeAnchorKind == ToolTipAnchorKind.Pointer &&
      this.activePopupX == this.activePopupX &&
      this.activePopupY == this.activePopupY
    ) {
      presenter.showAtPoint(this.activePopupX, this.activePopupY, width, height);
      return;
    }
    presenter.showAnchored(
      this.activeAnchorX,
      this.activeAnchorY,
      this.activeAnchorWidth,
      this.activeAnchorHeight,
      width,
      height,
      toolTip.popupPlacement,
    );
  }

  private static nowMs(): f64 {
    return ui.nowMs();
  }
}

function handleToolTipShowTimer(): void {
  ToolTipManager.commitPendingShow();
}

function handleToolTipHideTimer(): void {
  ToolTipManager.hideCurrent();
  ToolTipManager.activateBestCandidate();
}

function handleToolTipFocusVisibilityChanged(): void {
  ToolTipManager.activateBestCandidate();
}
