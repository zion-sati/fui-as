import { BorderStyle, Orientation, Unit } from "../../core/ffi";
import { Theme } from "../../core/Theme";
import { FlexBox } from "../../nodes";

function clamp(value: f32, min: f32, max: f32): f32 {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

export class SliderPresenterMetrics {
  constructor(
    readonly thumbSize: f32,
    readonly trackThickness: f32,
    readonly crossAxisExtra: f32 = 2.0,
  ) {}
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

  constructor() {
    const root = new FlexBox();
    super(root, new SliderPresenterMetrics(18.0, 6.0, 2.0));
    const trackNode = new FlexBox().positionAbsolute();
    const fillNode = new FlexBox().positionAbsolute();
    const thumbNode = new FlexBox()
      .positionAbsolute()
      .width(18.0, Unit.Pixel)
      .height(18.0, Unit.Pixel);
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
    const available = length > metrics.thumbSize ? length - metrics.thumbSize : 0.0;
    const fraction = clamp(state.normalizedValue, 0.0, 1.0);
    const crossAxisInset = metrics.crossAxisExtra * 0.5;
    if (state.orientation == Orientation.Vertical) {
      this.root
        .width(metrics.thumbSize + metrics.crossAxisExtra, Unit.Pixel)
        .height(length, Unit.Pixel);
      this.trackNode
        .width(metrics.trackThickness, Unit.Pixel)
        .height(available, Unit.Pixel)
        .position(
          crossAxisInset + ((metrics.thumbSize - metrics.trackThickness) * 0.5),
          metrics.thumbSize * 0.5,
        );
      this.fillNode
        .width(metrics.trackThickness, Unit.Pixel)
        .height(available * fraction, Unit.Pixel)
        .position(
          crossAxisInset + ((metrics.thumbSize - metrics.trackThickness) * 0.5),
          metrics.thumbSize * 0.5 + (available * (1.0 - fraction)),
        );
      this.thumbNode.position(
        crossAxisInset,
        available - (available * fraction),
      );
      return;
    }

    this.root
      .width(length, Unit.Pixel)
      .height(metrics.thumbSize + metrics.crossAxisExtra, Unit.Pixel);
    this.trackNode
      .width(available, Unit.Pixel)
      .height(metrics.trackThickness, Unit.Pixel)
      .position(
        metrics.thumbSize * 0.5,
        crossAxisInset + ((metrics.thumbSize - metrics.trackThickness) * 0.5),
      );
    this.fillNode
      .width(available * fraction, Unit.Pixel)
      .height(metrics.trackThickness, Unit.Pixel)
      .position(
        metrics.thumbSize * 0.5,
        crossAxisInset + ((metrics.thumbSize - metrics.trackThickness) * 0.5),
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
    const trackRadius = metrics.trackThickness * 0.5;
    this.trackNode.cornerRadius(trackRadius);
    this.trackNode.bgColor(theme.colors.scrollbarTrack);
    this.fillNode.cornerRadius(trackRadius);
    this.fillNode.bgColor(accent);
    this.thumbNode.cornerRadius(metrics.thumbSize * 0.5);
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
