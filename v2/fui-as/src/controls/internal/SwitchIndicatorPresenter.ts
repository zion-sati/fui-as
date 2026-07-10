import { AlignItems, Unit } from "../../core/ffi";
import { Theme } from "../../core/Theme";
import { FlexBox } from "../../nodes";
import { LabeledControlSizing } from "../ControlSizing";
import { LabeledControlColors } from "../LabeledControlColors";
import {
  PressableIndicatorMetrics,
  PressableIndicatorPresenter,
  PressableIndicatorVisualState,
} from "./PressableIndicatorPresenter";

export class SwitchIndicatorVisualState extends PressableIndicatorVisualState {
  constructor(
    readonly checked: bool,
    hovered: bool,
    pressed: bool,
    focused: bool,
    enabled: bool,
  ) {
    super(hovered, pressed, focused, enabled);
  }
}

export abstract class SwitchIndicatorPresenter extends PressableIndicatorPresenter {
  protected constructor(root: FlexBox, metrics: PressableIndicatorMetrics) {
    super(root, metrics);
  }

  abstract apply(theme: Theme, state: SwitchIndicatorVisualState, colors?: LabeledControlColors | null): void;
}

export abstract class SwitchIndicatorTemplate {
  abstract create(sizing?: LabeledControlSizing | null): SwitchIndicatorPresenter;
}

class SwitchIndicatorMetrics extends PressableIndicatorMetrics {
  constructor(
    readonly trackWidth: f32,
    readonly trackHeight: f32,
    readonly thumbSize: f32,
    readonly thumbX: f32,
    readonly thumbCheckedX: f32,
    readonly thumbY: f32,
  ) {
    super(trackWidth, trackHeight);
  }
}

const DEFAULT_SWITCH_METRICS = new SwitchIndicatorMetrics(44.0, 26.0, 20.0, 3.0, 21.0, 2.0);

function resolveSwitchMetrics(sizing: LabeledControlSizing | null): SwitchIndicatorMetrics {
  if (sizing === null || !sizing.hasIndicatorSize) {
    return DEFAULT_SWITCH_METRICS;
  }
  const scale = sizing.indicatorSizePx / DEFAULT_SWITCH_METRICS.trackHeight;
  const trackWidth = DEFAULT_SWITCH_METRICS.trackWidth * scale;
  const trackHeight = DEFAULT_SWITCH_METRICS.trackHeight * scale;
  const thumbSize = DEFAULT_SWITCH_METRICS.thumbSize * scale;
  const thumbX = DEFAULT_SWITCH_METRICS.thumbX * scale;
  const thumbY = DEFAULT_SWITCH_METRICS.thumbY * scale;
  return new SwitchIndicatorMetrics(
    trackWidth,
    trackHeight,
    thumbSize,
    thumbX,
    trackWidth - thumbSize - thumbX,
    thumbY,
  );
}

class DefaultSwitchIndicatorPresenter extends SwitchIndicatorPresenter {
  private readonly geometry: SwitchIndicatorMetrics;
  private readonly thumbNode: FlexBox;

  constructor(metrics: SwitchIndicatorMetrics = DEFAULT_SWITCH_METRICS) {
    const root = new FlexBox()
      .width(metrics.trackWidth, Unit.Pixel)
      .height(metrics.trackHeight, Unit.Pixel)
      .clipToBounds(true);
    super(root, metrics);
    this.geometry = metrics;
    const thumbNode = new FlexBox()
      .positionAbsolute()
      .position(metrics.thumbX, metrics.thumbY)
      .width(metrics.thumbSize, Unit.Pixel)
      .height(metrics.thumbSize, Unit.Pixel);
    this.thumbNode = thumbNode;
    root.alignItems(AlignItems.Center).child(thumbNode);
  }

  apply(theme: Theme, state: SwitchIndicatorVisualState, colors: LabeledControlColors | null = null): void {
    const accent = colors !== null && colors.hasAccent
      ? colors.accentColor
      : (state.pressed ? theme.colors.accentPressed : (state.hovered ? theme.colors.accentHovered : theme.colors.accent));
    const trackColor = state.checked
      ? accent
      : (colors !== null && colors.hasBackground
        ? colors.backgroundColor
        : (state.hovered ? theme.colors.background : theme.colors.surface));
    const borderColor = colors !== null && colors.hasBorder
      ? colors.borderColor
      : (state.checked ? trackColor : theme.colors.border);
    const geometry = this.geometry;
    this.root.cornerRadius(geometry.trackHeight * 0.5);
    this.root.border(1.0, borderColor);
    this.root.bgColor(trackColor);
    this.thumbNode
      .position(state.checked ? geometry.thumbCheckedX : geometry.thumbX, geometry.thumbY)
      .width(geometry.thumbSize, Unit.Pixel)
      .height(geometry.thumbSize, Unit.Pixel);
    this.thumbNode.cornerRadius(geometry.thumbSize * 0.5);
    this.thumbNode.bgColor(colors !== null && colors.hasBackground ? colors.backgroundColor : theme.colors.surface);
    this.thumbNode.border(1.0, borderColor);
  }
}

class DefaultSwitchIndicatorTemplate extends SwitchIndicatorTemplate {
  create(sizing: LabeledControlSizing | null = null): SwitchIndicatorPresenter {
    return createDefaultSwitchIndicatorPresenter(sizing);
  }
}

export const defaultSwitchIndicatorTemplate = new DefaultSwitchIndicatorTemplate();

export function createDefaultSwitchIndicatorPresenter(sizing: LabeledControlSizing | null = null): SwitchIndicatorPresenter {
  return new DefaultSwitchIndicatorPresenter(resolveSwitchMetrics(sizing));
}
