import * as ui from "../bindings/ui";
import {
  animateColorWith,
  animateFloatWith,
  Animation,
  AnimationTiming,
} from "../core/Animation";
import { PointerClickEventArgs, PointerEventArgs, Node } from "../core/Node";
import { warn } from "../core/Logger";
import { throwNullArgument } from "../core/Errors";
import { NodeTransitions } from "../core/Transitions";
import {
  AlignSelf,
  AlignItems,
  BorderStyle,
  FlexDirection,
  FlexWrap,
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
  fillWidthPercentValue: f32 = 0.0;
  hasFillWidthPercent: bool = false;
  heightValue: f32 = 0.0;
  heightUnit: Unit = Unit.Pixel;
  hasHeight: bool = false;
  hasFillHeight: bool = false;
  fillHeightPercentValue: f32 = 0.0;
  hasFillHeightPercent: bool = false;
  minWidthValue: f32 = 0.0;
  minWidthUnit: Unit = Unit.Auto;
  hasMinWidth: bool = false;
  maxWidthValue: f32 = 0.0;
  maxWidthUnit: Unit = Unit.Auto;
  hasMaxWidth: bool = false;
  minHeightValue: f32 = 0.0;
  minHeightUnit: Unit = Unit.Auto;
  hasMinHeight: bool = false;
  maxHeightValue: f32 = 0.0;
  maxHeightUnit: Unit = Unit.Auto;
  hasMaxHeight: bool = false;
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
  alignSelfValue: AlignSelf = AlignSelf.Auto;
  hasAlignSelf: bool = false;
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

export class Border {
  constructor(
    readonly width: f32,
    readonly color: u32,
    readonly style: BorderStyle = BorderStyle.Solid,
    readonly dashOn: f32 = 0.0,
    readonly dashOff: f32 = 0.0,
  ) {}

  static solid(width: f32, color: u32): Border {
    return new Border(width, color, BorderStyle.Solid);
  }

  static dashed(width: f32, color: u32, dashOn: f32, dashOff: f32): Border {
    return new Border(width, color, BorderStyle.Dashed, dashOn, dashOff);
  }

  static dotted(width: f32, color: u32, dashOn: f32, dashOff: f32): Border {
    return new Border(width, color, BorderStyle.Dotted, dashOn, dashOff);
  }
}

export class FlexBox extends Node {
  private widthValue: f32 = 0.0;
  private widthUnit: Unit = Unit.Pixel;
  private hasWidth: bool = false;
  private hasFillWidth: bool = false;
  private fillWidthPercentValue: f32 = 0.0;
  private hasFillWidthPercent: bool = false;
  private heightValue: f32 = 0.0;
  private heightUnit: Unit = Unit.Pixel;
  private hasHeight: bool = false;
  private hasFillHeight: bool = false;
  private fillHeightPercentValue: f32 = 0.0;
  private hasFillHeightPercent: bool = false;
  private minWidthValue: f32 = 0.0;
  private minWidthUnit: Unit = Unit.Auto;
  private hasMinWidth: bool = false;
  private maxWidthValue: f32 = 0.0;
  private maxWidthUnit: Unit = Unit.Auto;
  private hasMaxWidth: bool = false;
  private minHeightValue: f32 = 0.0;
  private minHeightUnit: Unit = Unit.Auto;
  private hasMinHeight: bool = false;
  private maxHeightValue: f32 = 0.0;
  private maxHeightUnit: Unit = Unit.Auto;
  private hasMaxHeight: bool = false;
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
  private hasFlexWrap: bool = false;
  private flexWrapValue: FlexWrap = FlexWrap.NoWrap;
  private hasFlexDirection: bool = false;
  private justifyContentValue: JustifyContent = JustifyContent.Start;
  private hasJustifyContent: bool = false;
  private alignItemsValue: AlignItems = AlignItems.Start;
  private hasAlignItems: bool = false;
  private alignSelfValue: AlignSelf = AlignSelf.Auto;
  private hasAlignSelf: bool = false;
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
    this.hasFillWidthPercent = false;
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
    this.hasFillHeightPercent = false;
    if (this.hasBuiltHandle()) {
      ui.setHeight(this.handle, value, <u32>unit);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  fillWidth(): this {
    this.hasWidth = false;
    this.hasFillWidth = true;
    this.hasFillWidthPercent = false;
    if (this.hasBuiltHandle()) {
      ui.setFillWidth(this.handle, true);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  fillHeight(): this {
    this.hasHeight = false;
    this.hasFillHeight = true;
    this.hasFillHeightPercent = false;
    if (this.hasBuiltHandle()) {
      ui.setFillHeight(this.handle, true);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  fillWidthPercent(percent: f32): this {
    this.hasWidth = false;
    this.hasFillWidth = false;
    this.hasFillWidthPercent = true;
    this.fillWidthPercentValue = percent;
    if (this.hasBuiltHandle()) {
      ui.setFillWidthPercent(this.handle, percent);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  fillHeightPercent(percent: f32): this {
    this.hasHeight = false;
    this.hasFillHeight = false;
    this.hasFillHeightPercent = true;
    this.fillHeightPercentValue = percent;
    if (this.hasBuiltHandle()) {
      ui.setFillHeightPercent(this.handle, percent);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  minWidth(value: f32, unit: Unit = Unit.Pixel): this {
    this.minWidthValue = value;
    this.minWidthUnit = unit;
    this.hasMinWidth = unit != Unit.Auto;
    if (this.hasBuiltHandle()) {
      ui.setMinWidth(this.handle, value, <u32>unit);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  maxWidth(value: f32, unit: Unit = Unit.Pixel): this {
    this.maxWidthValue = value;
    this.maxWidthUnit = unit;
    this.hasMaxWidth = unit != Unit.Auto;
    if (this.hasBuiltHandle()) {
      ui.setMaxWidth(this.handle, value, <u32>unit);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  minHeight(value: f32, unit: Unit = Unit.Pixel): this {
    this.minHeightValue = value;
    this.minHeightUnit = unit;
    this.hasMinHeight = unit != Unit.Auto;
    if (this.hasBuiltHandle()) {
      ui.setMinHeight(this.handle, value, <u32>unit);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  maxHeight(value: f32, unit: Unit = Unit.Pixel): this {
    this.maxHeightValue = value;
    this.maxHeightUnit = unit;
    this.hasMaxHeight = unit != Unit.Auto;
    if (this.hasBuiltHandle()) {
      ui.setMaxHeight(this.handle, value, <u32>unit);
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

  _cornerTopLeft(): f32 { return this.cornerTopLeft; }
  _cornerTopRight(): f32 { return this.cornerTopRight; }
  _cornerBottomRight(): f32 { return this.cornerBottomRight; }
  _cornerBottomLeft(): f32 { return this.cornerBottomLeft; }

  border(width: f32, color: u32): this {
    this.borderWidth = width;
    this.borderColor = color;
    this.borderStyle = BorderStyle.Solid;
    this.borderDashOn = 0.0;
    this.borderDashOff = 0.0;
    this.hasBoxStyle = true;
    if (this.hasBuiltHandle()) {
      this.applyVisualStyle();
      this.notifyRetainedMutation();
    }
    return this;
  }

  borderConfig(border: Border): this {
    this.borderWidth = border.width;
    this.borderColor = border.color;
    this.borderStyle = border.style;
    this.borderDashOn = border.dashOn;
    this.borderDashOff = border.dashOff;
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

  flexWrap(wrap: FlexWrap): this {
    this.flexWrapValue = wrap;
    this.hasFlexWrap = true;
    if (this.hasBuiltHandle()) {
      ui.setFlexWrap(this.handle, <u32>wrap);
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

  alignSelf(align: AlignSelf): this {
    this.alignSelfValue = align;
    this.hasAlignSelf = true;
    if (this.hasBuiltHandle()) {
      ui.setAlignSelf(this.handle, <u32>align);
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

  onPointerClick(cb: (event: PointerClickEventArgs) => void): this {
    super.onPointerClick(cb);
    return this;
  }

  onPointerEnter(cb: (event: PointerEventArgs) => void): this {
    super.onPointerEnter(cb);
    return this;
  }

  onPointerLeave(cb: (event: PointerEventArgs) => void): this {
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
    if (this.hasFillWidthPercent) {
      ui.setFillWidthPercent(this.handle, this.fillWidthPercentValue);
    }
    if (this.hasHeight) {
      ui.setHeight(this.handle, this.heightValue, <u32>this.heightUnit);
    }
    if (this.hasFillHeight) {
      ui.setFillHeight(this.handle, true);
    }
    if (this.hasFillHeightPercent) {
      ui.setFillHeightPercent(this.handle, this.fillHeightPercentValue);
    }
    if (this.hasMinWidth) {
      ui.setMinWidth(this.handle, this.minWidthValue, <u32>this.minWidthUnit);
    }
    if (this.hasMaxWidth) {
      ui.setMaxWidth(this.handle, this.maxWidthValue, <u32>this.maxWidthUnit);
    }
    if (this.hasMinHeight) {
      ui.setMinHeight(this.handle, this.minHeightValue, <u32>this.minHeightUnit);
    }
    if (this.hasMaxHeight) {
      ui.setMaxHeight(this.handle, this.maxHeightValue, <u32>this.maxHeightUnit);
    }
    if (this.hasFlexDirection) {
      ui.setFlexDirection(this.handle, <u32>this.flexDirectionValue);
    }
    if (this.hasFlexWrap) {
      ui.setFlexWrap(this.handle, <u32>this.flexWrapValue);
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
    if (this.hasAlignSelf) {
      ui.setAlignSelf(this.handle, <u32>this.alignSelfValue);
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
    if (props.hasFillWidthPercent) {
      this.fillWidthPercent(props.fillWidthPercentValue);
    }
    if (props.hasHeight) {
      this.height(props.heightValue, props.heightUnit);
    }
    if (props.hasFillHeight) {
      this.fillHeight();
    }
    if (props.hasFillHeightPercent) {
      this.fillHeightPercent(props.fillHeightPercentValue);
    }
    if (props.hasMinWidth) {
      this.minWidth(props.minWidthValue, props.minWidthUnit);
    }
    if (props.hasMaxWidth) {
      this.maxWidth(props.maxWidthValue, props.maxWidthUnit);
    }
    if (props.hasMinHeight) {
      this.minHeight(props.minHeightValue, props.minHeightUnit);
    }
    if (props.hasMaxHeight) {
      this.maxHeight(props.maxHeightValue, props.maxHeightUnit);
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
    if (props.hasAlignSelf) {
      this.alignSelf(props.alignSelfValue);
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
    let firstFullMainAxisPercentChild: Node | null = null;
    let firstFullMainAxisPercentChildIndex: i32 = -1;

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
        if (firstFullMainAxisPercentChild === null) {
          firstFullMainAxisPercentChild = child;
          firstFullMainAxisPercentChildIndex = i;
        }
      }
    }

    if (inFlowChildCount < 2) {
      return;
    }

    if (fullMainAxisPercentChildCount > 0) {
      if ((this.layoutWarningMask & LAYOUT_WARNING_FULL_MAIN_AXIS_PERCENT) == 0) {
        this.layoutWarningMask |= LAYOUT_WARNING_FULL_MAIN_AXIS_PERCENT;
        warn("Layout", this.buildFullMainAxisPercentWarning(
          isRow,
          firstFullMainAxisPercentChild,
          firstFullMainAxisPercentChildIndex,
        ));
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

  private buildFullMainAxisPercentWarning(isRow: bool, child: Node | null, childIndex: i32): string {
    let message = "";
    if (isRow) {
      message = "A row container has an in-flow child using width(100.0, Unit.Percent) alongside siblings. Unit.Percent is literal parent-relative sizing, not flex sharing. Use fillWidth() when the child should take remaining row space.";
    } else {
      message = "A column container has an in-flow child using height(100.0, Unit.Percent) alongside siblings. Unit.Percent is literal parent-relative sizing, not flex sharing. Use fillHeight() when the child should take remaining column space.";
    }
    return message + this.buildWarningContextSuffix(child, childIndex);
  }

  private buildMainAxisPercentOverflowWarning(isRow: bool): string {
    let message = "";
    if (isRow) {
      message = "A row container has in-flow children whose explicit width percentages exceed 100% in total. Unit.Percent is literal parent-relative sizing, not flex sharing. Use fillWidth() for the child that should expand, or reduce the percentages so they fit.";
    } else {
      message = "A column container has in-flow children whose explicit height percentages exceed 100% in total. Unit.Percent is literal parent-relative sizing, not flex sharing. Use fillHeight() for the child that should expand, or reduce the percentages so they fit.";
    }
    return message + this.buildWarningContextSuffix(null, -1);
  }

  private buildWarningContextSuffix(child: Node | null, childIndex: i32): string {
    const containerNodeId = this._debugNodeId();
    const childNodeId = child !== null ? child._debugNodeId() : null;
    const containerPath = this._debugTreePath();
    const childPath = child !== null ? child._debugTreePath() : null;
    const hasContainerNodeId = containerNodeId !== null && containerNodeId.length > 0;
    const hasChildNodeId = childNodeId !== null && childNodeId.length > 0;
    const hasChildPath = childPath !== null;
    const hasChildIndex = childIndex >= 0;
    let suffix = " [containerPath=" + containerPath;
    let needsSeparator = true;
    if (hasChildPath) {
      suffix += ", childPath=" + changetype<string>(childPath);
    }
    if (hasContainerNodeId) {
      suffix += ", containerNodeId=" + changetype<string>(containerNodeId);
      needsSeparator = true;
    }
    if (hasChildNodeId) {
      suffix += ", childNodeId=" + changetype<string>(childNodeId);
      needsSeparator = true;
    }
    if (hasChildIndex) {
      if (needsSeparator) {
        suffix += ", ";
      }
      suffix += "childIndex=" + childIndex.toString();
    }
    suffix += "]";
    return suffix;
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
