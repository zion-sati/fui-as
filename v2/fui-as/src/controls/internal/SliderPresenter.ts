import { AlignItems, FlexDirection, JustifyContent, Orientation, Unit } from "../../core/ffi";
import { Theme } from "../../core/Theme";
import { FlexBox } from "../../nodes";
import { SliderSizing } from "../ControlSizing";
import { SliderColors } from "../SliderColors";

function clamp(value: f32, min: f32, max: f32): f32 {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

function resolveThumbSize(metrics: SliderPresenterMetrics): f32 {
  return metrics.thumbSize > 1.0 ? metrics.thumbSize : 1.0;
}

function resolveTrackThickness(metrics: SliderPresenterMetrics): f32 {
  return clamp(metrics.trackThickness, 1.0, resolveThumbSize(metrics));
}

function resolveCrossAxisExtra(metrics: SliderPresenterMetrics): f32 {
  return metrics.crossAxisExtra > 0.0 ? metrics.crossAxisExtra : 0.0;
}

export class SliderPresenterMetrics {
  constructor(
    readonly thumbSize: f32,
    readonly trackThickness: f32,
    readonly crossAxisExtra: f32 = 2.0,
  ) {}
}

const DEFAULT_SLIDER_METRICS = new SliderPresenterMetrics(18.0, 6.0, 2.0);

function resolveSliderMetrics(sizing: SliderSizing | null): SliderPresenterMetrics {
  if (sizing === null) {
    return DEFAULT_SLIDER_METRICS;
  }
  const thumbSize = sizing.hasThumbSize ? sizing.thumbSizePx : DEFAULT_SLIDER_METRICS.thumbSize;
  const trackThickness = sizing.hasTrackThickness ? sizing.trackThicknessPx : DEFAULT_SLIDER_METRICS.trackThickness;
  if (thumbSize == DEFAULT_SLIDER_METRICS.thumbSize && trackThickness == DEFAULT_SLIDER_METRICS.trackThickness) {
    return DEFAULT_SLIDER_METRICS;
  }
  return new SliderPresenterMetrics(thumbSize, trackThickness, DEFAULT_SLIDER_METRICS.crossAxisExtra);
}

export class SliderVisualState {
  constructor(
    readonly value: f32,
    readonly min: f32,
    readonly max: f32,
    readonly normalizedValue: f32,
    readonly orientation: Orientation,
    readonly hovered: bool,
    readonly dragging: bool,
    readonly focused: bool,
    readonly enabled: bool,
  ) {}
}

/**
 * A slider's visuals. The slider sizes the presenter's root to its track area, a fixed length or the length it fills,
 * so a presenter lays out relative to its root rather than in pixels along the track.
 */
export abstract class SliderPresenter {
  protected constructor(
    private readonly rootValue: FlexBox,
    private readonly metricsValue: SliderPresenterMetrics,
  ) {}

  get root(): FlexBox {
    return this.rootValue;
  }

  get metrics(): SliderPresenterMetrics {
    return this.metricsValue;
  }

  abstract layout(state: SliderVisualState): void;
  abstract apply(theme: Theme, state: SliderVisualState, colors?: SliderColors | null): void;
}

export abstract class SliderTemplate {
  abstract create(sizing?: SliderSizing | null): SliderPresenter;
}

class DefaultSliderPresenter extends SliderPresenter {
  private readonly rail: FlexBox;
  private readonly trackNode: FlexBox;
  private readonly fillBox: FlexBox;
  private readonly fillNode: FlexBox;
  private readonly spacer: FlexBox;
  private readonly thumbNode: FlexBox;

  constructor(metrics: SliderPresenterMetrics = DEFAULT_SLIDER_METRICS) {
    const root = new FlexBox();
    super(root, metrics);
    // The rail runs between the thumb's centre at each end. The track and fill lie on it; a spacer as long as the
    // value's share of the rail puts the thumb, shifted back half its size onto the spacer's end, where the value is.
    const trackNode = new FlexBox().positionAbsolute();
    const fillNode = new FlexBox();
    const fillBox = new FlexBox().positionAbsolute().child(fillNode) as FlexBox;
    const spacer = new FlexBox();
    const thumbNode = new FlexBox()
      .width(metrics.thumbSize, Unit.Pixel)
      .height(metrics.thumbSize, Unit.Pixel);
    const rail = new FlexBox()
      .alignItems(AlignItems.Center)
      .child(trackNode)
      .child(fillBox)
      .child(spacer)
      .child(thumbNode) as FlexBox;
    this.rail = rail;
    this.trackNode = trackNode;
    this.fillBox = fillBox;
    this.fillNode = fillNode;
    this.spacer = spacer;
    this.thumbNode = thumbNode;
    root.child(rail);
  }

  layout(state: SliderVisualState): void {
    const metrics = this.metrics;
    const thumbSize = resolveThumbSize(metrics);
    const trackThickness = resolveTrackThickness(metrics);
    const crossAxisInset = resolveCrossAxisExtra(metrics) * 0.5;
    const fraction = clamp(state.normalizedValue, 0.0, 1.0);
    const halfThumb = thumbSize * 0.5;
    const trackOffset = (thumbSize - trackThickness) * 0.5;
    if (state.orientation == Orientation.Vertical) {
      this.root.flexDirection(FlexDirection.Row);
      this.rail
        .flexDirection(FlexDirection.Column)
        .width(thumbSize, Unit.Pixel)
        .fillHeight()
        .margin(crossAxisInset, halfThumb, crossAxisInset, halfThumb);
      this.trackNode
        .width(trackThickness, Unit.Pixel)
        .height(100.0, Unit.Percent)
        .position(trackOffset, 0.0);
      // The fill grows up from the rail's bottom.
      this.fillBox
        .flexDirection(FlexDirection.Column)
        .justifyContent(JustifyContent.End)
        .width(trackThickness, Unit.Pixel)
        .height(100.0, Unit.Percent)
        .position(trackOffset, 0.0);
      this.fillNode
        .width(100.0, Unit.Percent)
        .height(fraction * 100.0, Unit.Percent);
      this.spacer
        .width(1.0, Unit.Pixel)
        .height((1.0 - fraction) * 100.0, Unit.Percent);
      this.thumbNode.position(0.0, -halfThumb);
      return;
    }

    this.root.flexDirection(FlexDirection.Column);
    this.rail
      .flexDirection(FlexDirection.Row)
      .height(thumbSize, Unit.Pixel)
      .fillWidth()
      .margin(halfThumb, crossAxisInset, halfThumb, crossAxisInset);
    this.trackNode
      .width(100.0, Unit.Percent)
      .height(trackThickness, Unit.Pixel)
      .position(0.0, trackOffset);
    this.fillBox
      .flexDirection(FlexDirection.Row)
      .justifyContent(JustifyContent.Start)
      .width(100.0, Unit.Percent)
      .height(trackThickness, Unit.Pixel)
      .position(0.0, trackOffset);
    this.fillNode
      .width(fraction * 100.0, Unit.Percent)
      .height(100.0, Unit.Percent);
    this.spacer
      .width(fraction * 100.0, Unit.Percent)
      .height(1.0, Unit.Pixel);
    this.thumbNode.position(-halfThumb, 0.0);
  }

  apply(theme: Theme, state: SliderVisualState, colors: SliderColors | null = null): void {
    const accent = state.dragging
      ? theme.colors.accentPressed
      : (state.hovered ? theme.colors.accentHovered : theme.colors.accent);
    const metrics = this.metrics;
    const thumbSize = resolveThumbSize(metrics);
    const trackThickness = resolveTrackThickness(metrics);
    const trackRadius = trackThickness * 0.5;
    this.trackNode.cornerRadius(trackRadius);
    const trackColor = colors !== null && colors.hasTrack ? colors.trackColor : theme.colors.scrollbarTrack;
    this.trackNode.bgColor(trackColor);
    this.fillNode.cornerRadius(trackRadius);
    const fillColor = colors !== null && colors.hasFill ? colors.fillColor : accent;
    this.fillNode.bgColor(fillColor);
    this.thumbNode
      .width(thumbSize, Unit.Pixel)
      .height(thumbSize, Unit.Pixel)
      .cornerRadius(thumbSize * 0.5);
    const thumbColor = colors !== null && colors.hasThumb ? colors.thumbColor : accent;
    this.thumbNode.bgColor(thumbColor);
    this.thumbNode.border(1.0, theme.colors.surface);
  }
}

class DefaultSliderTemplate extends SliderTemplate {
  create(sizing: SliderSizing | null = null): SliderPresenter {
    return createDefaultSliderPresenter(sizing);
  }
}

export const defaultSliderTemplate = new DefaultSliderTemplate();

export function createDefaultSliderPresenter(sizing: SliderSizing | null = null): SliderPresenter {
  return new DefaultSliderPresenter(resolveSliderMetrics(sizing));
}
