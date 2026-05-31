import * as ui from "../bindings/ui";
import {
  animateColorWith,
  animateFloatWith,
  Animation,
  AnimationTiming,
} from "../core/Animation";
import { Node } from "../core/Node";
import { warn } from "../core/Logger";
import { throwNullArgument } from "../core/Errors";
import { NodeTransitions } from "../core/Transitions";
import {
  AlignItems,
  BorderStyle,
  FlexDirection,
  HandleValue,
  JustifyContent,
  NodeType,
  PositionType,
  Unit,
} from "../core/ffi";
import { GradientStop } from "./GradientStop";

const LAYOUT_WARNING_FULL_MAIN_AXIS_PERCENT: u8 = 1 << 0;
const LAYOUT_WARNING_PERCENT_OVERFLOW: u8 = 1 << 1;
const MAIN_AXIS_PERCENT_FULL_THRESHOLD: f32 = 99.99;
const MAIN_AXIS_PERCENT_OVERFLOW_THRESHOLD: f32 = 100.01;

function applyAnimatedBackgroundColor(owner: FlexBox, color: u32): void {
  owner._applyAnimatedBackgroundColor(color);
}

function applyAnimatedOpacity(owner: FlexBox, value: f32): void {
  owner._applyAnimatedOpacity(value);
}

export class FlexBoxProps {
  widthValue: f32 = 0.0;
  widthUnit: Unit = Unit.Pixel;
  hasWidth: bool = false;
  hasFillWidth: bool = false;
  heightValue: f32 = 0.0;
  heightUnit: Unit = Unit.Pixel;
  hasHeight: bool = false;
  hasFillHeight: bool = false;
  flexBasisValue: f32 = 0.0;
  hasFlexBasis: bool = false;
  backgroundColor: u32 = 0;
  hasBackgroundColor: bool = false;
  flexDirectionValue: FlexDirection = FlexDirection.Column;
  hasFlexDirection: bool = false;
  justifyContentValue: JustifyContent = JustifyContent.Start;
  hasJustifyContent: bool = false;
  alignItemsValue: AlignItems = AlignItems.Start;
  hasAlignItems: bool = false;
  paddingTop: f32 = 0.0;
  paddingRight: f32 = 0.0;
  paddingBottom: f32 = 0.0;
  paddingLeft: f32 = 0.0;
  hasPadding: bool = false;
  marginTop: f32 = 0.0;
  marginRight: f32 = 0.0;
  marginBottom: f32 = 0.0;
  marginLeft: f32 = 0.0;
  hasMargin: bool = false;
  clipEnabled: bool = true;
  hasClip: bool = true;
  readonly childNodes: Array<Node> = new Array<Node>();
}

export class FlexBox extends Node {
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
  private backgroundColor: u32 = 0;
  private hasBackgroundColor: bool = false;
  private cornerTopLeft: f32 = 0.0;
  private cornerTopRight: f32 = 0.0;
  private cornerBottomRight: f32 = 0.0;
  private cornerBottomLeft: f32 = 0.0;
  private hasBoxStyle: bool = false;
  private borderWidth: f32 = 0.0;
  private borderColor: u32 = 0;
  private borderStyle: BorderStyle = BorderStyle.Solid;
  private borderDashOn: f32 = 0.0;
  private borderDashOff: f32 = 0.0;
  private flexDirectionValue: FlexDirection = FlexDirection.Column;
  private hasFlexDirection: bool = false;
  private justifyContentValue: JustifyContent = JustifyContent.Start;
  private hasJustifyContent: bool = false;
  private alignItemsValue: AlignItems = AlignItems.Start;
  private hasAlignItems: bool = false;
  private paddingTop: f32 = 0.0;
  private paddingRight: f32 = 0.0;
  private paddingBottom: f32 = 0.0;
  private paddingLeft: f32 = 0.0;
  private hasPadding: bool = false;
  private marginTop: f32 = 0.0;
  private marginRight: f32 = 0.0;
  private marginBottom: f32 = 0.0;
  private marginLeft: f32 = 0.0;
  private hasMargin: bool = false;
  private positionTypeValue: PositionType = PositionType.Relative;
  private hasPositionType: bool = false;
  private positionTop: f32 = NaN;
  private positionRight: f32 = NaN;
  private positionBottom: f32 = NaN;
  private positionLeft: f32 = NaN;
  private hasPosition: bool = false;
  private clipEnabled: bool = true;
  private hasClip: bool = true;
  private opacityValue: f32 = 1.0;
  private blurSigmaValue: f32 = 0.0;
  private dropShadowColorValue: u32 = 0;
  private dropShadowOffsetXValue: f32 = 0.0;
  private dropShadowOffsetYValue: f32 = 0.0;
  private dropShadowBlurSigmaValue: f32 = 0.0;
  private dropShadowSpreadValue: f32 = 0.0;
  private backgroundBlurSigmaValue: f32 = 0.0;
  private blendModeValue: u32 = 0;
  private hasLayerEffect: bool = false;
  private hasDropShadow: bool = false;
  private hasBackgroundBlur: bool = false;
  private gradientStartX: f32 = 0.0;
  private gradientStartY: f32 = 0.0;
  private gradientEndX: f32 = 0.0;
  private gradientEndY: f32 = 0.0;
  private gradientOffsets: Float32Array | null = null;
  private gradientColors: Uint32Array | null = null;
  private hasGradient: bool = false;
  private layoutWarningMask: u8 = 0;
  private transitionsValue: NodeTransitions | null = null;
  private opacityTransitionAnimation: Animation | null = null;
  private backgroundColorTransitionAnimation: Animation | null = null;

  static from(props: FlexBoxProps): FlexBox {
    const box = new FlexBox();
    return box.applyProps(props);
  }

  width(value: f32, unit: Unit = Unit.Pixel): this {
    this.widthValue = value;
    this.widthUnit = unit;
    this.hasWidth = true;
    this.hasFillWidth = false;
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

  bgColor(color: u32): this {
    this.cancelBackgroundColorTransition();
    if (this.shouldAnimateBackgroundColor(color)) {
      const transitions = changetype<NodeTransitions>(this.transitionsValue);
      const timing = changetype<AnimationTiming>(transitions.backgroundColorTiming);
      this.backgroundColorTransitionAnimation = animateColorWith(
        this,
        this.backgroundColor,
        color,
        timing,
        applyAnimatedBackgroundColor,
      );
      return this;
    }
    this._applyAnimatedBackgroundColor(color);
    return this;
  }

  cornerRadius(radius: f32): this {
    this.cornerTopLeft = radius;
    this.cornerTopRight = radius;
    this.cornerBottomRight = radius;
    this.cornerBottomLeft = radius;
    this.hasBoxStyle = true;
    if (this.hasBuiltHandle()) {
      this.applyVisualStyle();
      this.notifyRetainedMutation();
    }
    return this;
  }

  corners(tl: f32, tr: f32, br: f32, bl: f32): this {
    this.cornerTopLeft = tl;
    this.cornerTopRight = tr;
    this.cornerBottomRight = br;
    this.cornerBottomLeft = bl;
    this.hasBoxStyle = true;
    if (this.hasBuiltHandle()) {
      this.applyVisualStyle();
      this.notifyRetainedMutation();
    }
    return this;
  }

  border(width: f32, color: u32, style: BorderStyle = BorderStyle.Solid): this {
    this.borderWidth = width;
    this.borderColor = color;
    this.borderStyle = style;
    this.borderDashOn = 0.0;
    this.borderDashOff = 0.0;
    this.hasBoxStyle = true;
    if (this.hasBuiltHandle()) {
      this.applyVisualStyle();
      this.notifyRetainedMutation();
    }
    return this;
  }

  borderDashed(on: f32, off: f32): this {
    this.borderStyle = BorderStyle.Dashed;
    this.borderDashOn = on;
    this.borderDashOff = off;
    this.hasBoxStyle = true;
    if (this.hasBuiltHandle()) {
      this.applyVisualStyle();
      this.notifyRetainedMutation();
    }
    return this;
  }

  flexDirection(direction: FlexDirection): this {
    this.flexDirectionValue = direction;
    this.hasFlexDirection = true;
    if (this.hasBuiltHandle()) {
      ui.setFlexDirection(this.handle, <u32>direction);
      this.notifyRetainedLayoutMutation();
      this.onRetainedChildLayoutChanged();
    }
    return this;
  }

  justifyContent(justify: JustifyContent): this {
    this.justifyContentValue = justify;
    this.hasJustifyContent = true;
    if (this.hasBuiltHandle()) {
      ui.setJustifyContent(this.handle, <u32>justify);
      this.notifyRetainedMutation();
    }
    return this;
  }

  alignItems(align: AlignItems): this {
    this.alignItemsValue = align;
    this.hasAlignItems = true;
    if (this.hasBuiltHandle()) {
      ui.setAlignItems(this.handle, <u32>align);
      this.notifyRetainedMutation();
    }
    return this;
  }

  padding(left: f32, top: f32, right: f32, bottom: f32): this {
    this.paddingLeft = left;
    this.paddingTop = top;
    this.paddingRight = right;
    this.paddingBottom = bottom;
    this.hasPadding = true;
    if (this.hasBuiltHandle()) {
      ui.setPadding(this.handle, left, top, right, bottom);
      this.notifyRetainedMutation();
    }
    return this;
  }

  margin(left: f32, top: f32 = left, right: f32 = left, bottom: f32 = top): this {
    this.marginLeft = left;
    this.marginTop = top;
    this.marginRight = right;
    this.marginBottom = bottom;
    this.hasMargin = true;
    if (this.hasBuiltHandle()) {
      ui.setMargin(this.handle, left, top, right, bottom);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  positionType(positionType: PositionType): this {
    this.positionTypeValue = positionType;
    this.hasPositionType = true;
    if (this.hasBuiltHandle()) {
      ui.setPositionType(this.handle, <u32>positionType);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  positionAbsolute(): this {
    this.positionType(PositionType.Absolute);
    return this;
  }

  position(left: f32, top: f32): this {
    this.positionLeft = left;
    this.positionTop = top;
    this.positionRight = NaN;
    this.positionBottom = NaN;
    this.hasPosition = true;
    if (this.hasBuiltHandle()) {
      ui.setPosition(this.handle, left, top, NaN, NaN);
      this.notifyRetainedMutation();
    }
    return this;
  }

  clipToBounds(flag: bool): this {
    this.clipEnabled = flag;
    this.hasClip = true;
    if (this.hasBuiltHandle()) {
      ui.setClipToBounds(this.handle, flag);
      this.notifyRetainedMutation();
    }
    return this;
  }

  opacity(value: f32): this {
    this.cancelOpacityTransition();
    if (this.shouldAnimateOpacity(value)) {
      const transitions = changetype<NodeTransitions>(this.transitionsValue);
      const timing = changetype<AnimationTiming>(transitions.opacityTiming);
      this.opacityTransitionAnimation = animateFloatWith(
        this,
        this.opacityValue,
        value,
        timing,
        applyAnimatedOpacity,
      );
      return this;
    }
    this._applyAnimatedOpacity(value);
    return this;
  }

  protected get currentOpacity(): f32 {
    return this.opacityValue;
  }

  blur(sigma: f32): this {
    this.blurSigmaValue = sigma;
    this.hasLayerEffect = true;
    if (this.hasBuiltHandle()) {
      this.applyVisualStyle();
      this.notifyRetainedMutation();
    }
    return this;
  }

  dropShadow(color: u32, offsetX: f32, offsetY: f32, blurSigma: f32, spread: f32 = 0.0): this {
    this.dropShadowColorValue = color;
    this.dropShadowOffsetXValue = offsetX;
    this.dropShadowOffsetYValue = offsetY;
    this.dropShadowBlurSigmaValue = blurSigma;
    this.dropShadowSpreadValue = spread;
    this.hasDropShadow = true;
    if (this.hasBuiltHandle()) {
      this.applyVisualStyle();
      this.notifyRetainedMutation();
    }
    return this;
  }

  backgroundBlur(sigma: f32): this {
    this.backgroundBlurSigmaValue = sigma;
    this.hasBackgroundBlur = true;
    if (this.hasBuiltHandle()) {
      this.applyVisualStyle();
      this.notifyRetainedMutation();
    }
    return this;
  }

  linearGradient(startX: f32, startY: f32, endX: f32, endY: f32, stops: Array<GradientStop>): this {
    if (stops.length == 0) {
      warn("Layout", "FlexBox.linearGradient() received an empty stop list.");
      return this;
    }
    const offsets = new Float32Array(stops.length);
    const colors = new Uint32Array(stops.length);
    for (let i = 0; i < stops.length; ++i) {
      const stop = unchecked(stops[i]);
      unchecked(offsets[i] = stop.offset);
      unchecked(colors[i] = stop.color);
    }
    this.gradientStartX = startX;
    this.gradientStartY = startY;
    this.gradientEndX = endX;
    this.gradientEndY = endY;
    this.gradientOffsets = offsets;
    this.gradientColors = colors;
    this.hasGradient = true;
    if (this.hasBuiltHandle()) {
      this.applyVisualStyle();
      this.notifyRetainedMutation();
    }
    return this;
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

  transitions(transitions: NodeTransitions | null): this {
    this.transitionsValue = transitions;
    return this;
  }

  child(node: Node): this {
    if (node == null) {
      throwNullArgument("FlexBox.child", "node");
    }
    this.addChildNode(node);
    return this;
  }

  children(nodes: Array<Node>): this {
    this.replaceChildren(nodes);
    return this;
  }

  build(): u64 {
    this.buildStyledNode(NodeType.FlexBox);
    return this.handle;
  }

  protected buildStyledNode(type: NodeType, includeChildren: bool = true): u64 {
    if (this.hasBuiltHandle()) {
      return this.handle;
    }

    this.handle = ui.createNode(<u32>type);
    this.applyNodeMetadata();
    this.finishBuild();
    this.applyLayoutStyle();
    this.applyVisualStyle();
    this.emitDeveloperLayoutWarnings();
    if (includeChildren) {
      this.buildChildren();
    }
    return this.handle;
  }

  dispose(): void {
    this.cancelActiveTransitions();
    this.disposeTree();
  }

  _debugMainAxisPercentValue(isHorizontal: bool): f32 {
    if (isHorizontal) {
      return this.hasWidth && this.widthUnit == Unit.Percent ? this.widthValue : -1.0;
    }
    return this.hasHeight && this.heightUnit == Unit.Percent ? this.heightValue : -1.0;
  }

  _debugIsAbsolutelyPositioned(): bool {
    return this.hasPositionType && this.positionTypeValue == PositionType.Absolute;
  }

  protected applyLayoutStyle(): void {
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
    if (this.hasFlexDirection) {
      ui.setFlexDirection(this.handle, <u32>this.flexDirectionValue);
    }
    if (this.hasFlexBasis) {
      ui.setFlexBasis(this.handle, this.flexBasisValue);
    }
    if (this.hasJustifyContent) {
      ui.setJustifyContent(this.handle, <u32>this.justifyContentValue);
    }
    if (this.hasAlignItems) {
      ui.setAlignItems(this.handle, <u32>this.alignItemsValue);
    }
    if (this.hasMargin) {
      ui.setMargin(this.handle, this.marginLeft, this.marginTop, this.marginRight, this.marginBottom);
    }
    if (this.hasPadding) {
      ui.setPadding(this.handle, this.paddingLeft, this.paddingTop, this.paddingRight, this.paddingBottom);
    }
    if (this.hasPositionType) {
      ui.setPositionType(this.handle, <u32>this.positionTypeValue);
    }
    if (this.hasPosition) {
      ui.setPosition(this.handle, this.positionLeft, this.positionTop, this.positionRight, this.positionBottom);
    }
    if (this.hasClip) {
      ui.setClipToBounds(this.handle, this.clipEnabled);
    }
  }

  protected applyProps(props: FlexBoxProps): this {
    if (props.hasWidth) {
      this.width(props.widthValue, props.widthUnit);
    }
    if (props.hasFillWidth) {
      this.fillWidth();
    }
    if (props.hasHeight) {
      this.height(props.heightValue, props.heightUnit);
    }
    if (props.hasFillHeight) {
      this.fillHeight();
    }
    if (props.hasFlexBasis) {
      this.flexBasis(props.flexBasisValue);
    }
    if (props.hasBackgroundColor) {
      this.bgColor(props.backgroundColor);
    }
    if (props.hasFlexDirection) {
      this.flexDirection(props.flexDirectionValue);
    }
    if (props.hasJustifyContent) {
      this.justifyContent(props.justifyContentValue);
    }
    if (props.hasAlignItems) {
      this.alignItems(props.alignItemsValue);
    }
    if (props.hasPadding) {
      this.padding(props.paddingLeft, props.paddingTop, props.paddingRight, props.paddingBottom);
    }
    if (props.hasMargin) {
      this.margin(props.marginLeft, props.marginTop, props.marginRight, props.marginBottom);
    }
    if (props.hasClip) {
      this.clipToBounds(props.clipEnabled);
    }
    if (props.childNodes.length > 0) {
      this.children(props.childNodes);
    }
    return this;
  }

  protected usesFlexChildLayoutDiagnostics(): bool {
    return true;
  }

  protected onRetainedChildLayoutChanged(): void {
    this.emitDeveloperLayoutWarnings();
  }

  private emitDeveloperLayoutWarnings(): void {
    if (!this.usesFlexChildLayoutDiagnostics()) {
      return;
    }

    const isRow = this.flexDirectionValue == FlexDirection.Row;
    let inFlowChildCount = 0;
    let fullMainAxisPercentChildCount = 0;
    let mainAxisPercentTotal: f32 = 0.0;

    for (let i = 0; i < this.childNodes.length; ++i) {
      const child = unchecked(this.childNodes[i]);
      if (child._debugIsAbsolutelyPositioned()) {
        continue;
      }

      inFlowChildCount += 1;
      const percent = child._debugMainAxisPercentValue(isRow);
      if (percent < 0.0) {
        continue;
      }

      mainAxisPercentTotal += percent;
      if (percent >= MAIN_AXIS_PERCENT_FULL_THRESHOLD) {
        fullMainAxisPercentChildCount += 1;
      }
    }

    if (inFlowChildCount < 2) {
      return;
    }

    if (fullMainAxisPercentChildCount > 0) {
      if ((this.layoutWarningMask & LAYOUT_WARNING_FULL_MAIN_AXIS_PERCENT) == 0) {
        this.layoutWarningMask |= LAYOUT_WARNING_FULL_MAIN_AXIS_PERCENT;
        warn("Layout", this.buildFullMainAxisPercentWarning(isRow));
      }
      return;
    }

    if (mainAxisPercentTotal > MAIN_AXIS_PERCENT_OVERFLOW_THRESHOLD
      && (this.layoutWarningMask & LAYOUT_WARNING_PERCENT_OVERFLOW) == 0) {
      this.layoutWarningMask |= LAYOUT_WARNING_PERCENT_OVERFLOW;
      warn("Layout", this.buildMainAxisPercentOverflowWarning(isRow));
    }
  }

  _applyAnimatedBackgroundColor(color: u32): void {
    this.backgroundColor = color;
    this.hasBackgroundColor = true;
    this.hasBoxStyle = true;
    if (this.hasBuiltHandle()) {
      this.applyVisualStyle();
      this.notifyRetainedMutation();
    }
  }

  _applyAnimatedOpacity(value: f32): void {
    this.opacityValue = value;
    this.hasLayerEffect = true;
    if (this.hasBuiltHandle()) {
      this.applyVisualStyle();
      this.notifyRetainedMutation();
    }
  }

  private shouldAnimateOpacity(nextValue: f32): bool {
    const transitions = this.transitionsValue;
    if (transitions === null || transitions.opacityTiming === null) {
      return false;
    }
    if (!this.hasBuiltHandle()) {
      return false;
    }
    return this.opacityValue != nextValue;
  }

  private shouldAnimateBackgroundColor(nextColor: u32): bool {
    const transitions = this.transitionsValue;
    if (transitions === null || transitions.backgroundColorTiming === null) {
      return false;
    }
    if (!this.hasBuiltHandle()) {
      return false;
    }
    return this.backgroundColor != nextColor;
  }

  private cancelOpacityTransition(): void {
    const animation = this.opacityTransitionAnimation;
    if (animation !== null) {
      animation.cancel();
    }
  }

  private cancelBackgroundColorTransition(): void {
    const animation = this.backgroundColorTransitionAnimation;
    if (animation !== null) {
      animation.cancel();
    }
  }

  private cancelActiveTransitions(): void {
    this.cancelOpacityTransition();
    this.cancelBackgroundColorTransition();
  }

  private buildFullMainAxisPercentWarning(isRow: bool): string {
    if (isRow) {
      return "A row container has an in-flow child using width(100.0, Unit.Percent) alongside siblings. Unit.Percent is literal parent-relative sizing, not flex sharing. Use fillWidth() when the child should take remaining row space.";
    }
    return "A column container has an in-flow child using height(100.0, Unit.Percent) alongside siblings. Unit.Percent is literal parent-relative sizing, not flex sharing. Use fillHeight() when the child should take remaining column space.";
  }

  private buildMainAxisPercentOverflowWarning(isRow: bool): string {
    if (isRow) {
      return "A row container has in-flow children whose explicit width percentages exceed 100% in total. Unit.Percent is literal parent-relative sizing, not flex sharing. Use fillWidth() for the child that should expand, or reduce the percentages so they fit.";
    }
    return "A column container has in-flow children whose explicit height percentages exceed 100% in total. Unit.Percent is literal parent-relative sizing, not flex sharing. Use fillHeight() for the child that should expand, or reduce the percentages so they fit.";
  }

  protected applyVisualStyle(): void {
    if (this.hasBoxStyle) {
      ui.setBoxStyle(
        this.handle,
        this.backgroundColor,
        this.cornerTopLeft,
        this.cornerTopRight,
        this.cornerBottomRight,
        this.cornerBottomLeft,
        this.borderWidth,
        this.borderColor,
        <u32>this.borderStyle,
        this.borderDashOn,
        this.borderDashOff,
      );
    } else if (this.hasBackgroundColor) {
      ui.setBackgroundColor(this.handle, this.backgroundColor);
    }

    if (this.hasLayerEffect) {
      ui.setLayerEffect(this.handle, this.opacityValue, this.blurSigmaValue, this.blendModeValue);
    }

    if (this.hasDropShadow) {
      ui.setDropShadow(
        this.handle,
        this.dropShadowColorValue,
        this.dropShadowOffsetXValue,
        this.dropShadowOffsetYValue,
        this.dropShadowBlurSigmaValue,
        this.dropShadowSpreadValue,
      );
    }

    if (this.hasBackgroundBlur) {
      ui.setBackgroundBlur(this.handle, this.backgroundBlurSigmaValue);
    }

    const gradientOffsets = this.gradientOffsets;
    const gradientColors = this.gradientColors;
    if (this.hasGradient && gradientOffsets !== null && gradientColors !== null) {
      ui.setLinearGradient(
        this.handle,
        this.gradientStartX,
        this.gradientStartY,
        this.gradientEndX,
        this.gradientEndY,
        gradientOffsets,
        gradientColors,
      );
    }
  }
}
