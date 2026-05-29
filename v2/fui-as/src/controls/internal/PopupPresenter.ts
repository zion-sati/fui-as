import * as ui from "../../bindings/ui";
import { HandleValue, Unit } from "../../core/ffi";
import { warn } from "../../core/Logger";
import { FlexBox, Portal } from "../../nodes";

export enum PopupPlacement {
  Auto = 0,
  Bottom = 1,
  Top = 2,
  Overlap = 3,
}

export class PopupPresenter {
  readonly overlayNode: FlexBox;
  private openState: bool = false;
  private semanticScopeToken: u32 = 0;
  private edgePaddingValue: f32 = 8.0;
  private anchorGapValue: f32 = 4.0;
  private placementValue: PopupPlacement = PopupPlacement.Auto;
  private backdropColorValue: u32 = 0x00000000;
  private backgroundBlurSigmaValue: f32 = 0.0;
  private surfaceXValue: f32 = 0.0;
  private surfaceYValue: f32 = 0.0;

  constructor(
    private readonly root: Portal,
    private readonly surfaceNode: FlexBox,
    private readonly semanticScopeNode: FlexBox | null = surfaceNode,
  ) {
    this.overlayNode = new FlexBox()
      .positionAbsolute()
      .position(0.0, 0.0)
      .width(100.0, Unit.Percent)
      .height(100.0, Unit.Percent)
      .child(surfaceNode);
    this.surfaceNode.positionAbsolute();
    this.applyBackdropStyle();
  }

  get isOpen(): bool {
    return this.openState;
  }

  get surfaceX(): f32 {
    return this.surfaceXValue;
  }

  get surfaceY(): f32 {
    return this.surfaceYValue;
  }

  placement(value: PopupPlacement): this {
    this.placementValue = value;
    return this;
  }

  edgePadding(value: f32): this {
    if (value < 0.0) {
      warn("Layout", "PopupPresenter.edgePadding() received " + value.toString() + "; clamping to 0.0.");
    }
    this.edgePaddingValue = value >= 0.0 ? value : 0.0;
    return this;
  }

  anchorGap(value: f32): this {
    if (value < 0.0) {
      warn("Layout", "PopupPresenter.anchorGap() received " + value.toString() + "; clamping to 0.0.");
    }
    this.anchorGapValue = value >= 0.0 ? value : 0.0;
    return this;
  }

  backdropColor(color: u32): this {
    this.backdropColorValue = color;
    this.applyBackdropStyle();
    return this;
  }

  backgroundBlur(sigma: f32): this {
    if (sigma < 0.0) {
      warn("Layout", "PopupPresenter.backgroundBlur() received " + sigma.toString() + "; clamping to 0.0.");
    }
    this.backgroundBlurSigmaValue = sigma >= 0.0 ? sigma : 0.0;
    this.applyBackdropStyle();
    return this;
  }

  syncOverlayBounds(): void {
    const popupBounds = this.root.builtHandle != <u64>HandleValue.Invalid
      ? ui.tryGetBounds(this.root.builtHandle)
      : null;
    const overlayX = popupBounds !== null ? -unchecked(popupBounds[0]) : 0.0;
    const overlayY = popupBounds !== null ? -unchecked(popupBounds[1]) : 0.0;
    this.overlayNode
      .position(overlayX, overlayY)
      .width(ui.getViewportWidth(), Unit.Pixel)
      .height(ui.getViewportHeight(), Unit.Pixel);
  }

  showAnchored(
    anchorX: f32,
    anchorY: f32,
    anchorWidth: f32,
    anchorHeight: f32,
    surfaceWidth: f32,
    surfaceHeight: f32,
    placement: PopupPlacement = this.placementValue,
  ): void {
    if (this.root.builtHandle == <u64>HandleValue.Invalid) {
      warn("Layout", "PopupPresenter.showAnchored() was called before the root was built.");
      return;
    }
    this.syncOverlayBounds();
    const clampedWidth = surfaceWidth > 0.0 ? surfaceWidth : 1.0;
    const clampedHeight = surfaceHeight > 0.0 ? surfaceHeight : 1.0;
    const maxX = <f32>Math.max(this.edgePaddingValue, ui.getViewportWidth() - clampedWidth - this.edgePaddingValue);
    const maxY = <f32>Math.max(this.edgePaddingValue, ui.getViewportHeight() - clampedHeight - this.edgePaddingValue);
    const belowY = anchorY + anchorHeight + this.anchorGapValue;
    const aboveY = anchorY - clampedHeight - this.anchorGapValue;
    const fitsBelow = belowY <= maxY;
    const fitsAbove = aboveY >= this.edgePaddingValue;
    let panelY = belowY;
    if (placement == PopupPlacement.Top) {
      panelY = aboveY;
    } else if (placement == PopupPlacement.Overlap) {
      panelY = anchorY;
    } else if (placement == PopupPlacement.Auto) {
      if (!fitsBelow && fitsAbove) {
        panelY = aboveY;
      }
    }
    this.setSurfacePosition(
      <f32>Math.max(this.edgePaddingValue, Math.min(anchorX, maxX)),
      <f32>Math.max(this.edgePaddingValue, Math.min(panelY, maxY)),
    );
    this.attach();
  }

  showAtPoint(x: f32, y: f32, surfaceWidth: f32, surfaceHeight: f32): void {
    if (this.root.builtHandle == <u64>HandleValue.Invalid) {
      warn("Layout", "PopupPresenter.showAtPoint() was called before the root was built.");
      return;
    }
    this.syncOverlayBounds();
    const clampedWidth = surfaceWidth > 0.0 ? surfaceWidth : 1.0;
    const clampedHeight = surfaceHeight > 0.0 ? surfaceHeight : 1.0;
    const maxX = <f32>Math.max(this.edgePaddingValue, ui.getViewportWidth() - clampedWidth - this.edgePaddingValue);
    const maxY = <f32>Math.max(this.edgePaddingValue, ui.getViewportHeight() - clampedHeight - this.edgePaddingValue);
    this.setSurfacePosition(
      <f32>Math.max(this.edgePaddingValue, Math.min(x, maxX)),
      <f32>Math.max(this.edgePaddingValue, Math.min(y, maxY)),
    );
    this.attach();
  }

  hide(): void {
    if (!this.openState && this.overlayNode.parentNode === null) {
      return;
    }
    this.root.removeChildNode(this.overlayNode);
    this.openState = false;
    if (this.semanticScopeToken != 0) {
      ui.removeSemanticScope(this.semanticScopeToken);
      this.semanticScopeToken = 0;
    }
  }

  dispose(): void {
    this.hide();
    if (this.overlayNode.builtHandle != <u64>HandleValue.Invalid) {
      this.overlayNode.dispose();
    }
  }

  private attach(): void {
    this.root.addChildNode(this.overlayNode);
    this.openState = true;
    const semanticScopeNode = this.semanticScopeNode;
    if (
      this.semanticScopeToken == 0 &&
      semanticScopeNode !== null &&
      semanticScopeNode.builtHandle != <u64>HandleValue.Invalid
    ) {
      this.semanticScopeToken = ui.pushSemanticScope(semanticScopeNode.builtHandle);
    }
  }

  private applyBackdropStyle(): void {
    this.overlayNode.bgColor(this.backdropColorValue);
    this.overlayNode.backgroundBlur(this.backgroundBlurSigmaValue);
  }

  private setSurfacePosition(x: f32, y: f32): void {
    this.surfaceXValue = x;
    this.surfaceYValue = y;
    this.surfaceNode.position(x, y);
  }
}
