import * as ui from "../bindings/ui";
import { Unit } from "./ffi";
import { Node } from "./Node";
import { activeTheme } from "./Theme";
import { Portal, FlexBox } from "../nodes";

const STANDARD_FOCUS_RING_WIDTH: f32 = 2.0;
const STANDARD_FOCUS_RING_OUTSET: f32 = 2.0;

class FocusAdornerStyle {
  constructor(
    readonly topLeftRadius: f32,
    readonly topRightRadius: f32,
    readonly bottomRightRadius: f32,
    readonly bottomLeftRadius: f32,
  ) {}
}

class FocusAdornerRect {
  constructor(
    readonly x: f32,
    readonly y: f32,
    readonly width: f32,
    readonly height: f32,
  ) {}
}

export class FocusAdornerManager {
  private static hostRoot: Portal | null = null;
  private static ringNode: FlexBox | null = null;
  private static activeOwner: Node | null = null;
  private static activeStyle: FocusAdornerStyle | null = null;
  private static attached: bool = false;
  private static lastHostX: f32 = NaN;
  private static lastHostY: f32 = NaN;
  private static lastHostWidth: f32 = NaN;
  private static lastHostHeight: f32 = NaN;
  private static lastRingX: f32 = NaN;
  private static lastRingY: f32 = NaN;
  private static lastRingWidth: f32 = NaN;
  private static lastRingHeight: f32 = NaN;
  private static lastColor: u32 = 0;
  private static lastTopLeftRadius: f32 = NaN;
  private static lastTopRightRadius: f32 = NaN;
  private static lastBottomRightRadius: f32 = NaN;
  private static lastBottomLeftRadius: f32 = NaN;

  static createDefaultHost(): Portal {
    const existingHost = this.hostRoot;
    if (existingHost !== null) {
      return existingHost;
    }
    const ringNode = new FlexBox()
      .positionAbsolute()
      .bgColor(0x00000000)
      .border(STANDARD_FOCUS_RING_WIDTH, 0x00000000);
    const hostRoot = new Portal()
      .positionAbsolute()
      .position(0.0, 0.0)
      .width(0.0, Unit.Pixel)
      .height(0.0, Unit.Pixel)
      .clipToBounds(false) as Portal;
    this.hostRoot = hostRoot;
    this.ringNode = ringNode;
    return hostRoot;
  }

  static clear(): void {
    this.hide();
    this.activeOwner = null;
    this.activeStyle = null;
  }

  static showStandard(owner: Node, cornerRadius: f32): void {
    this.showStandardCorners(owner, cornerRadius, cornerRadius, cornerRadius, cornerRadius);
  }

  static showStandardCorners(owner: Node, tl: f32, tr: f32, br: f32, bl: f32): void {
    this.activeOwner = owner;
    this.activeStyle = new FocusAdornerStyle(
      tl + STANDARD_FOCUS_RING_OUTSET,
      tr + STANDARD_FOCUS_RING_OUTSET,
      br + STANDARD_FOCUS_RING_OUTSET,
      bl + STANDARD_FOCUS_RING_OUTSET,
    );
    this.sync();
  }

  static hideOwner(owner: Node): void {
    if (this.activeOwner !== owner) {
      return;
    }
    this.activeOwner = null;
    this.activeStyle = null;
    this.hide();
  }

  static handleOwnerDestroyed(owner: Node): void {
    this.hideOwner(owner);
  }

  static refreshAfterCommit(): bool {
    return this.sync();
  }

  private static sync(): bool {
    const owner = this.activeOwner;
    const style = this.activeStyle;
    if (owner === null || style === null) {
      return this.hide();
    }
    const hostRoot = this.hostRoot;
    const ringNode = this.ringNode;
    if (hostRoot === null || ringNode === null) {
      return false;
    }
    if (owner.builtHandle == 0 || hostRoot.builtHandle == 0) {
      return this.hide();
    }
    const ringRect = this.resolveRingRect(owner);
    if (ringRect === null) {
      return this.hide();
    }
    const visibleRect = this.resolveVisibleRect(owner, ringRect);
    if (visibleRect === null) {
      return this.hide();
    }
    const color = activeTheme.value.colors.focusRing;
    let changed = false;
    if (!this.attached) {
      hostRoot.addChildNode(ringNode);
      this.attached = true;
      changed = true;
    }
    if (
      visibleRect.x != this.lastHostX ||
      visibleRect.y != this.lastHostY ||
      visibleRect.width != this.lastHostWidth ||
      visibleRect.height != this.lastHostHeight ||
      (ringRect.x - visibleRect.x) != this.lastRingX ||
      (ringRect.y - visibleRect.y) != this.lastRingY ||
      ringRect.width != this.lastRingWidth ||
      ringRect.height != this.lastRingHeight
    ) {
      const relativeRingX = ringRect.x - visibleRect.x;
      const relativeRingY = ringRect.y - visibleRect.y;
      hostRoot.position(visibleRect.x, visibleRect.y);
      hostRoot.width(visibleRect.width, Unit.Pixel);
      hostRoot.height(visibleRect.height, Unit.Pixel);
      ringNode.position(relativeRingX, relativeRingY);
      ringNode.width(ringRect.width, Unit.Pixel);
      ringNode.height(ringRect.height, Unit.Pixel);
      this.lastHostX = visibleRect.x;
      this.lastHostY = visibleRect.y;
      this.lastHostWidth = visibleRect.width;
      this.lastHostHeight = visibleRect.height;
      this.lastRingX = relativeRingX;
      this.lastRingY = relativeRingY;
      this.lastRingWidth = ringRect.width;
      this.lastRingHeight = ringRect.height;
      changed = true;
    }
    if (
      color != this.lastColor ||
      style.topLeftRadius != this.lastTopLeftRadius ||
      style.topRightRadius != this.lastTopRightRadius ||
      style.bottomRightRadius != this.lastBottomRightRadius ||
      style.bottomLeftRadius != this.lastBottomLeftRadius
    ) {
      ringNode.corners(style.topLeftRadius, style.topRightRadius, style.bottomRightRadius, style.bottomLeftRadius);
      ringNode.border(STANDARD_FOCUS_RING_WIDTH, color);
      this.lastColor = color;
      this.lastTopLeftRadius = style.topLeftRadius;
      this.lastTopRightRadius = style.topRightRadius;
      this.lastBottomRightRadius = style.bottomRightRadius;
      this.lastBottomLeftRadius = style.bottomLeftRadius;
      changed = true;
    }
    return changed;
  }

  private static hide(): bool {
    const hostRoot = this.hostRoot;
    const ringNode = this.ringNode;
    if (!this.attached || hostRoot === null || ringNode === null) {
      this.attached = false;
      this.resetCachedGeometry();
      return false;
    }
    hostRoot.removeChildNode(ringNode);
    hostRoot.position(0.0, 0.0);
    hostRoot.width(0.0, Unit.Pixel);
    hostRoot.height(0.0, Unit.Pixel);
    this.attached = false;
    this.resetCachedGeometry();
    return true;
  }

  private static resetCachedGeometry(): void {
    this.lastHostX = NaN;
    this.lastHostY = NaN;
    this.lastHostWidth = NaN;
    this.lastHostHeight = NaN;
    this.lastRingX = NaN;
    this.lastRingY = NaN;
    this.lastRingWidth = NaN;
    this.lastRingHeight = NaN;
    this.lastColor = 0;
    this.lastTopLeftRadius = NaN;
    this.lastTopRightRadius = NaN;
    this.lastBottomRightRadius = NaN;
    this.lastBottomLeftRadius = NaN;
  }

  private static resolveRingRect(owner: Node): FocusAdornerRect | null {
    if (owner.builtHandle == 0) {
      return null;
    }
    const bounds = ui.tryGetBounds(owner.builtHandle);
    if (bounds === null) {
      return null;
    }
    return new FocusAdornerRect(
      unchecked(bounds[0]) - STANDARD_FOCUS_RING_OUTSET,
      unchecked(bounds[1]) - STANDARD_FOCUS_RING_OUTSET,
      unchecked(bounds[2]) + (STANDARD_FOCUS_RING_OUTSET * 2.0),
      unchecked(bounds[3]) + (STANDARD_FOCUS_RING_OUTSET * 2.0),
    );
  }

  private static resolveVisibleRect(owner: Node, ringRect: FocusAdornerRect): FocusAdornerRect | null {
    let minX = ringRect.x;
    let minY = ringRect.y;
    let maxX = ringRect.x + ringRect.width;
    let maxY = ringRect.y + ringRect.height;

    minX = <f32>Math.max(minX, 0.0);
    minY = <f32>Math.max(minY, 0.0);
    maxX = <f32>Math.min(maxX, ui.getViewportWidth());
    maxY = <f32>Math.min(maxY, ui.getViewportHeight());

    const width = maxX - minX;
    const height = maxY - minY;
    if (width <= 0.0 || height <= 0.0) {
      return null;
    }
    return new FocusAdornerRect(minX, minY, width, height);
  }
}
