import { BorderStyle, Unit } from "../../core/ffi";
import { Theme } from "../../core/Theme";
import { FlexBox } from "../../nodes";
import { LabeledControlSizing } from "../ControlSizing";
import {
  PressableIndicatorMetrics,
  PressableIndicatorPresenter,
  PressableIndicatorVisualState,
} from "./PressableIndicatorPresenter";

export class RadioIndicatorVisualState extends PressableIndicatorVisualState {
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

export abstract class RadioIndicatorPresenter extends PressableIndicatorPresenter {
  protected constructor(root: FlexBox, metrics: PressableIndicatorMetrics) {
    super(root, metrics);
  }

  abstract apply(theme: Theme, state: RadioIndicatorVisualState): void;
}

export abstract class RadioIndicatorTemplate {
  abstract create(): RadioIndicatorPresenter;
}

class RadioIndicatorMetrics extends PressableIndicatorMetrics {
  constructor(
    readonly indicatorSize: f32,
    readonly dotSize: f32,
    readonly borderWidth: f32,
  ) {
    super(indicatorSize, indicatorSize);
  }
}

function centeredInset(outerSize: f32, innerSize: f32): f32 {
  return outerSize > innerSize ? (outerSize - innerSize) * 0.5 : 0.0;
}

function dotInset(metrics: RadioIndicatorMetrics): f32 {
  const inset = centeredInset(metrics.indicatorSize, metrics.dotSize);
  return inset > metrics.borderWidth
    ? inset - metrics.borderWidth
    : 0.0;
}

const DEFAULT_RADIO_METRICS = new RadioIndicatorMetrics(20.0, 8.0, 1.0);

function resolveRadioMetrics(sizing: LabeledControlSizing | null): RadioIndicatorMetrics {
  if (sizing === null || !sizing.hasIndicatorSize) {
    return DEFAULT_RADIO_METRICS;
  }
  const indicatorSize = sizing.indicatorSizePx;
  return new RadioIndicatorMetrics(
    indicatorSize,
    indicatorSize * 0.4,
    indicatorSize >= 24.0 ? 2.0 : 1.0,
  );
}

class DefaultRadioIndicatorPresenter extends RadioIndicatorPresenter {
  private readonly geometry: RadioIndicatorMetrics;
  private readonly dotNode: FlexBox;

  constructor(metrics: RadioIndicatorMetrics = DEFAULT_RADIO_METRICS) {
    const root = new FlexBox()
      .width(metrics.indicatorSize, Unit.Pixel)
      .height(metrics.indicatorSize, Unit.Pixel)
      .alignItems(1)
      .justifyContent(1);
    super(root, metrics);
    this.geometry = metrics;
    const dotNode = new FlexBox()
      .positionAbsolute()
      .position(dotInset(metrics), dotInset(metrics))
      .width(metrics.dotSize, Unit.Pixel)
      .height(metrics.dotSize, Unit.Pixel);
    this.dotNode = dotNode;
    root.child(dotNode);
  }

  apply(theme: Theme, state: RadioIndicatorVisualState): void {
    const geometry = this.geometry;
    const outerColor = state.checked
      ? (state.pressed ? theme.colors.accentPressed : (state.hovered ? theme.colors.accentHovered : theme.colors.accent))
      : theme.colors.border;
    this.root.cornerRadius(geometry.indicatorSize * 0.5);
    this.root.border(geometry.borderWidth, outerColor, BorderStyle.Solid);
    this.root.bgColor(theme.colors.surface);
    this.dotNode
      .cornerRadius(geometry.dotSize * 0.5)
      .position(dotInset(geometry), dotInset(geometry))
      .width(geometry.dotSize, Unit.Pixel)
      .height(geometry.dotSize, Unit.Pixel)
      .bgColor(outerColor)
      .opacity(state.checked ? 1.0 : 0.0);
  }
}

class DefaultRadioIndicatorTemplate extends RadioIndicatorTemplate {
  create(): RadioIndicatorPresenter {
    return new DefaultRadioIndicatorPresenter();
  }
}

export const defaultRadioIndicatorTemplate = new DefaultRadioIndicatorTemplate();

export function createDefaultRadioIndicatorPresenter(sizing: LabeledControlSizing | null = null): RadioIndicatorPresenter {
  return new DefaultRadioIndicatorPresenter(resolveRadioMetrics(sizing));
}
