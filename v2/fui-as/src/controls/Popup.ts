import { BorderStyle, FlexDirection, Unit } from "../core/ffi";
import { Node } from "../core/Node";
import { throwNullArgument } from "../core/Errors";
import { FlexBox, Portal } from "../nodes";
import { PopupPlacement, PopupPresenter } from "./internal/PopupPresenter";

export { PopupPlacement } from "./internal/PopupPresenter";

export class Popup extends Portal {
  private readonly surfaceNode: FlexBox;
  private readonly presenter!: PopupPresenter;
  private dismissOnBackdropClickValue: bool = true;

  constructor() {
    super();
    this.surfaceNode = new FlexBox()
      .positionAbsolute()
      .flexDirection(FlexDirection.Column);
    this.presenter = new PopupPresenter(this, this.surfaceNode);
    this.positionAbsolute()
      .position(0.0, 0.0)
      .width(100.0, Unit.Percent)
      .height(100.0, Unit.Percent);
    this.presenter.overlayNode.onClickWith(this, (popup) => popup.handleBackdropClick());
  }

  get isOpen(): bool {
    return this.presenter.isOpen;
  }

  get surface(): FlexBox {
    return this.surfaceNode;
  }

  placement(value: PopupPlacement): this {
    this.presenter.placement(value);
    return this;
  }

  edgePadding(value: f32): this {
    this.presenter.edgePadding(value);
    return this;
  }

  anchorGap(value: f32): this {
    this.presenter.anchorGap(value);
    return this;
  }

  dismissOnBackdropClick(flag: bool = true): this {
    this.dismissOnBackdropClickValue = flag;
    return this;
  }

  backdropColor(color: u32): this {
    this.presenter.backdropColor(color);
    return this;
  }

  backgroundBlur(sigma: f32): this {
    this.presenter.backgroundBlur(sigma);
    return this;
  }

  child(node: Node): this {
    if (node == null) {
      throwNullArgument("Popup.child", "node");
    }
    this.surfaceNode.child(node);
    return this;
  }

  children(nodes: Array<Node>): this {
    this.surfaceNode.children(nodes);
    return this;
  }

  panelColor(color: u32): this {
    this.surfaceNode.bgColor(color);
    return this;
  }

  panelBackgroundBlur(sigma: f32): this {
    this.surfaceNode.backgroundBlur(sigma);
    return this;
  }

  panelCornerRadius(radius: f32): this {
    this.surfaceNode.cornerRadius(radius);
    return this;
  }

  panelBorder(width: f32, color: u32, style: BorderStyle = BorderStyle.Solid): this {
    this.surfaceNode.border(width, color, style);
    return this;
  }

  panelShadow(color: u32, offsetX: f32, offsetY: f32, blurSigma: f32, spread: f32 = 0.0): this {
    this.surfaceNode.dropShadow(color, offsetX, offsetY, blurSigma, spread);
    return this;
  }

  showAnchored(anchorX: f32, anchorY: f32, anchorWidth: f32, anchorHeight: f32, width: f32, height: f32): void {
    this.surfaceNode.width(width, Unit.Pixel);
    this.surfaceNode.height(height, Unit.Pixel);
    this.presenter.showAnchored(anchorX, anchorY, anchorWidth, anchorHeight, width, height);
  }

  showAtPoint(x: f32, y: f32, width: f32, height: f32): void {
    this.surfaceNode.width(width, Unit.Pixel);
    this.surfaceNode.height(height, Unit.Pixel);
    this.presenter.showAtPoint(x, y, width, height);
  }

  hide(): void {
    this.presenter.hide();
  }

  dispose(): void {
    this.presenter.dispose();
    super.dispose();
  }

  private handleBackdropClick(): void {
    if (this.dismissOnBackdropClickValue) {
      this.hide();
    }
  }
}
