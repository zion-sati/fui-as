import { BorderStyle, Orientation, Unit } from "../../core/ffi";
import { Theme } from "../../core/Theme";
import { FlexBox } from "../../nodes";
import { SliderSizing } from "../ControlSizing";

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

  abstract layout(state: SliderVisualState, length: f32): void;
  abstract apply(theme: Theme, state: SliderVisualState): void;
}

export abstract class SliderTemplate {
  abstract create(): SliderPresenter;
}

class DefaultSliderPresenter extends SliderPresenter {
  private readonly trackNode: FlexBox;
  private readonly fillNode: FlexBox;
  private readonly thumbNode: FlexBox;

  constructor(metrics: SliderPresenterMetrics = DEFAULT_SLIDER_METRICS) {
    const root = new FlexBox();
    super(root, metrics);
    const trackNode = new FlexBox().positionAbsolute();
    const fillNode = new FlexBox().positionAbsolute();
    const thumbNode = new FlexBox()
      .positionAbsolute()
      .width(metrics.thumbSize, Unit.Pixel)
      .height(metrics.thumbSize, Unit.Pixel);
    this.trackNode = trackNode;
    this.fillNode = fillNode;
    this.thumbNode = thumbNode;
    root
      .child(trackNode)
      .child(fillNode)
      .child(thumbNode);
  }

  layout(state: SliderVisualState, length: f32): void {
    const metrics = this.metrics;
    const thumbSize = resolveThumbSize(metrics);
    const trackThickness = resolveTrackThickness(metrics);
    const crossAxisExtra = resolveCrossAxisExtra(metrics);
    const available = length > thumbSize ? length - thumbSize : 0.0;
    const fraction = clamp(state.normalizedValue, 0.0, 1.0);
    const crossAxisInset = crossAxisExtra * 0.5;
    const trackOffset = crossAxisInset + ((thumbSize - trackThickness) * 0.5);
    if (state.orientation == Orientation.Vertical) {
      this.root
        .width(thumbSize + crossAxisExtra, Unit.Pixel)
        .height(length, Unit.Pixel);
      this.trackNode
        .width(trackThickness, Unit.Pixel)
        .height(available, Unit.Pixel)
        .position(
          trackOffset,
          thumbSize * 0.5,
        );
      this.fillNode
        .width(trackThickness, Unit.Pixel)
        .height(available * fraction, Unit.Pixel)
        .position(
          trackOffset,
          thumbSize * 0.5 + (available * (1.0 - fraction)),
        );
      this.thumbNode.position(
        crossAxisInset,
        available - (available * fraction),
      );
      return;
    }

    this.root
      .width(length, Unit.Pixel)
      .height(thumbSize + crossAxisExtra, Unit.Pixel);
    this.trackNode
      .width(available, Unit.Pixel)
      .height(trackThickness, Unit.Pixel)
      .position(
        thumbSize * 0.5,
        trackOffset,
      );
    this.fillNode
      .width(available * fraction, Unit.Pixel)
      .height(trackThickness, Unit.Pixel)
      .position(
        thumbSize * 0.5,
        trackOffset,
      );
    this.thumbNode.position(
      available * fraction,
      crossAxisInset,
    );
  }

  apply(theme: Theme, state: SliderVisualState): void {
    const accent = state.dragging
      ? theme.colors.accentPressed
      : (state.hovered ? theme.colors.accentHovered : theme.colors.accent);
    const metrics = this.metrics;
    const thumbSize = resolveThumbSize(metrics);
    const trackThickness = resolveTrackThickness(metrics);
    const trackRadius = trackThickness * 0.5;
    this.trackNode.cornerRadius(trackRadius);
    this.trackNode.bgColor(theme.colors.scrollbarTrack);
    this.fillNode.cornerRadius(trackRadius);
    this.fillNode.bgColor(accent);
    this.thumbNode
      .width(thumbSize, Unit.Pixel)
      .height(thumbSize, Unit.Pixel)
      .cornerRadius(thumbSize * 0.5);
    this.thumbNode.bgColor(accent);
    this.thumbNode.border(1.0, theme.colors.surface, BorderStyle.Solid);
  }
}

class DefaultSliderTemplate extends SliderTemplate {
  create(): SliderPresenter {
    return new DefaultSliderPresenter();
  }
}

export const defaultSliderTemplate = new DefaultSliderTemplate();

export function createDefaultSliderPresenter(sizing: SliderSizing | null = null): SliderPresenter {
  return new DefaultSliderPresenter(resolveSliderMetrics(sizing));
}
