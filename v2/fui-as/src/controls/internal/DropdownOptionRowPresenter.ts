import { AlignItems, TextVerticalAlign } from "../../core/ffi";
import { Theme } from "../../core/Theme";
import { FlexBox, Text } from "../../nodes";
import { DropdownSizing } from "../ControlSizing";
import { DropdownColors } from "../DropdownColors";

export class DropdownOptionRowMetrics {
  constructor(
    readonly height: f32,
    readonly paddingLeft: f32 = 10.0,
    readonly paddingRight: f32 = 10.0,
    readonly fontSize: f32 = 16.0,
  ) {}
}

const DEFAULT_DROPDOWN_OPTION_ROW_METRICS = new DropdownOptionRowMetrics(34.0, 10.0, 10.0, 16.0);

function resolveOptionRowMetrics(sizing: DropdownSizing | null): DropdownOptionRowMetrics {
  if (sizing === null || (!sizing.hasOptionHeight && !sizing.hasOptionFontSize)) {
    return DEFAULT_DROPDOWN_OPTION_ROW_METRICS;
  }
  const fontSize = sizing.hasOptionFontSize ? sizing.optionFontSizePx : DEFAULT_DROPDOWN_OPTION_ROW_METRICS.fontSize;
  const height = sizing.hasOptionHeight ? sizing.optionHeightPx : DEFAULT_DROPDOWN_OPTION_ROW_METRICS.height;
  return new DropdownOptionRowMetrics(
    height,
    DEFAULT_DROPDOWN_OPTION_ROW_METRICS.paddingLeft,
    DEFAULT_DROPDOWN_OPTION_ROW_METRICS.paddingRight,
    fontSize,
  );
}

export class DropdownOptionRowVisualState {
  constructor(
    readonly highlighted: bool,
    readonly selected: bool,
    readonly enabled: bool,
  ) {}
}

export abstract class DropdownOptionRowPresenter {
  protected constructor(
    private readonly rootValue: FlexBox,
    private readonly labelNodeValue: Text,
    private readonly metricsValue: DropdownOptionRowMetrics,
  ) {}

  get root(): FlexBox {
    return this.rootValue;
  }

  get labelNode(): Text {
    return this.labelNodeValue;
  }

  get metrics(): DropdownOptionRowMetrics {
    return this.metricsValue;
  }

  abstract apply(theme: Theme, state: DropdownOptionRowVisualState, colors?: DropdownColors | null): void;
}

export abstract class DropdownOptionRowTemplate {
  abstract create(): DropdownOptionRowPresenter;
}

class DefaultDropdownOptionRowPresenter extends DropdownOptionRowPresenter {
  constructor(metrics: DropdownOptionRowMetrics = DEFAULT_DROPDOWN_OPTION_ROW_METRICS) {
    const labelNode = new Text("")
      .selectable(false)
      .fillSize()
      .maxLines(1)
      .wrapping(false) as Text;
    labelNode
      .overflowFade(true, false)
      .verticalAlign(TextVerticalAlign.Center);
    const root = new FlexBox()
      .fillSize()
      .alignItems(AlignItems.Center)
      .child(labelNode);
    super(root, labelNode, metrics);
  }

  apply(theme: Theme, state: DropdownOptionRowVisualState, colors: DropdownColors | null = null): void {
    const metrics = this.metrics;
    this.root
      .padding(metrics.paddingLeft, 0.0, metrics.paddingRight, 0.0)
      .cornerRadius(theme.spacing.xs)
      .bgColor(state.highlighted ? theme.contextMenu.item.hoverBackground : 0x00000000);
    const labelColor = !state.enabled
      ? theme.colors.textMuted
      : (state.selected
         ? (colors !== null && colors.hasAccent ? colors.accentColor : theme.colors.accent)
         : (colors !== null && colors.hasTextPrimary ? colors.textPrimaryColor : theme.colors.textPrimary));
    this.labelNode
      .font(theme.fonts.body, metrics.fontSize)
      .textColor(labelColor);
  }
}

class DefaultDropdownOptionRowTemplate extends DropdownOptionRowTemplate {
  create(): DropdownOptionRowPresenter {
    return new DefaultDropdownOptionRowPresenter();
  }
}

export const defaultDropdownOptionRowTemplate = new DefaultDropdownOptionRowTemplate();

export function createDefaultDropdownOptionRowPresenter(sizing: DropdownSizing | null = null): DropdownOptionRowPresenter {
  return new DefaultDropdownOptionRowPresenter(resolveOptionRowMetrics(sizing));
}
