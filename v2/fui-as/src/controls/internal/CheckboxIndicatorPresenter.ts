import { AlignItems, JustifyContent, SemanticCheckedState, Unit } from "../../core/ffi";
import { Theme } from "../../core/Theme";
import { FlexBox, Svg } from "../../nodes";
import { LabeledControlSizing } from "../ControlSizing";
import { LabeledControlColors } from "../LabeledControlColors";
import {
  PressableIndicatorMetrics,
  PressableIndicatorPresenter,
  PressableIndicatorVisualState,
} from "./PressableIndicatorPresenter";

const CHECKBOX_CHECK_SVG_URL = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 14 14'><path d='M2.25 7.15 5.35 10.25 11.75 3.85' fill='none' stroke='%23000000' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'/></svg>";

class CheckboxIndicatorMetrics extends PressableIndicatorMetrics {
  constructor(
    readonly indicatorSize: f32,
    readonly cornerRadius: f32,
    readonly checkMarkSize: f32,
  ) {
    super(indicatorSize, indicatorSize);
  }
}

const DEFAULT_CHECKBOX_METRICS = new CheckboxIndicatorMetrics(20.0, 4.0, 16.0);

function resolveCheckboxMetrics(sizing: LabeledControlSizing | null): CheckboxIndicatorMetrics {
  if (sizing === null || !sizing.hasIndicatorSize) {
    return DEFAULT_CHECKBOX_METRICS;
  }
  const indicatorSize = sizing.indicatorSizePx;
  return new CheckboxIndicatorMetrics(
    indicatorSize,
    indicatorSize * 0.2,
    indicatorSize * 0.8,
  );
}

export class CheckboxIndicatorVisualState extends PressableIndicatorVisualState {
  constructor(
    readonly checkedState: SemanticCheckedState,
    hovered: bool,
    pressed: bool,
    focused: bool,
    enabled: bool,
  ) {
    super(hovered, pressed, focused, enabled);
  }
}

export abstract class CheckboxIndicatorPresenter extends PressableIndicatorPresenter {
  protected constructor(root: FlexBox, metrics: PressableIndicatorMetrics) {
    super(root, metrics);
  }

  abstract apply(theme: Theme, state: CheckboxIndicatorVisualState, colors?: LabeledControlColors | null): void;
}

export abstract class CheckboxIndicatorTemplate {
  abstract create(sizing?: LabeledControlSizing | null): CheckboxIndicatorPresenter;
}

class DefaultCheckboxIndicatorPresenter extends CheckboxIndicatorPresenter {
  private readonly geometry: CheckboxIndicatorMetrics;
  private readonly markNode: Svg;

  constructor(metrics: CheckboxIndicatorMetrics = DEFAULT_CHECKBOX_METRICS) {
    const root = new FlexBox()
      .width(metrics.indicatorSize, Unit.Pixel)
      .height(metrics.indicatorSize, Unit.Pixel)
      .alignItems(AlignItems.Center)
      .justifyContent(JustifyContent.Center);
    super(root, metrics);
    this.geometry = metrics;
    const markHost = new FlexBox()
      .fillSize()
      .alignItems(AlignItems.Center)
      .justifyContent(JustifyContent.Center);
    const markNode = new Svg();
    markNode
      .width(metrics.checkMarkSize, Unit.Pixel)
      .height(metrics.checkMarkSize, Unit.Pixel);
    this.markNode = markNode;
    markHost.child(markNode);
    root.child(markHost);
  }

  apply(theme: Theme, state: CheckboxIndicatorVisualState, colors: LabeledControlColors | null = null): void {
    let background = colors !== null && colors.hasBackground ? colors.backgroundColor : theme.colors.surface;
    let borderColor = colors !== null && colors.hasBorder ? colors.borderColor : theme.colors.border;
    const geometry = this.geometry;
    let markVisible = false;
    let markColor = theme.colors.textPrimary;
    const accent = colors !== null && colors.hasAccent
      ? colors.accentColor
      : (state.pressed ? theme.colors.accentPressed : (state.hovered ? theme.colors.accentHovered : theme.colors.accent));
    if (state.checkedState == SemanticCheckedState.True || state.checkedState == SemanticCheckedState.Mixed) {
      background = accent;
      borderColor = background;
      markVisible = state.checkedState == SemanticCheckedState.True;
      markColor = theme.colors.textOnAccent;
    } else if (state.hovered && (colors === null || !colors.hasBackground)) {
      background = theme.colors.background;
    }
    this.root.cornerRadius(geometry.cornerRadius);
    this.root.border(1.0, borderColor);
    this.root.bgColor(background);
    if (markVisible) {
      this.markNode.source(CHECKBOX_CHECK_SVG_URL);
    } else {
      this.markNode.clearSource();
    }
    this.markNode
      .width(geometry.checkMarkSize, Unit.Pixel)
      .height(geometry.checkMarkSize, Unit.Pixel)
      .opacity(markVisible ? 1.0 : 0.0);
    const markNode = this.markNode as Svg;
    markNode.tint(markColor);
  }
}

class DefaultCheckboxIndicatorTemplate extends CheckboxIndicatorTemplate {
  create(sizing: LabeledControlSizing | null = null): CheckboxIndicatorPresenter {
    return createDefaultCheckboxIndicatorPresenter(sizing);
  }
}

export const defaultCheckboxIndicatorTemplate = new DefaultCheckboxIndicatorTemplate();

export function createDefaultCheckboxIndicatorPresenter(sizing: LabeledControlSizing | null = null): CheckboxIndicatorPresenter {
  return new DefaultCheckboxIndicatorPresenter(resolveCheckboxMetrics(sizing));
}
