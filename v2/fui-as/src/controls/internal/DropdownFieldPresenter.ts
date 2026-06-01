import {
  AlignItems,
  BorderStyle,
  FlexDirection,
  JustifyContent,
  TextVerticalAlign,
  Unit,
} from "../../core/ffi";
import { Theme } from "../../core/Theme";
import { FlexBox, Text } from "../../nodes";
import { DropdownSizing } from "../ControlSizing";

const DEFAULT_CHEVRON_BOX_SIZE: f32 = 16.0;
const DEFAULT_FIELD_PADDING_X: f32 = 16.0;
const DEFAULT_FIELD_PADDING_Y: f32 = 8.0;
const DEFAULT_FIELD_FONT_SIZE: f32 = 16.0;
const DEFAULT_FIELD_HEIGHT: f32 = 32.0;

export class DropdownFieldMetrics {
  constructor(
    readonly height: f32,
    readonly fontSize: f32,
    readonly chevronBoxSize: f32,
    readonly paddingLeft: f32,
    readonly paddingTop: f32,
    readonly paddingRight: f32,
    readonly paddingBottom: f32,
  ) {}
}

const DEFAULT_DROPDOWN_FIELD_METRICS = new DropdownFieldMetrics(
  DEFAULT_FIELD_HEIGHT,
  DEFAULT_FIELD_FONT_SIZE,
  DEFAULT_CHEVRON_BOX_SIZE,
  DEFAULT_FIELD_PADDING_X,
  DEFAULT_FIELD_PADDING_Y,
  DEFAULT_FIELD_PADDING_X,
  DEFAULT_FIELD_PADDING_Y,
);

function resolveFieldMetrics(sizing: DropdownSizing | null): DropdownFieldMetrics {
  if (
    sizing === null ||
    (!sizing.hasFieldHeight && !sizing.hasFieldFontSize && !sizing.hasChevronBoxSize)
  ) {
    return DEFAULT_DROPDOWN_FIELD_METRICS;
  }
  const fontSize = sizing.hasFieldFontSize ? sizing.fieldFontSizePx : DEFAULT_DROPDOWN_FIELD_METRICS.fontSize;
  const chevronBoxSize = sizing.hasChevronBoxSize ? sizing.chevronBoxSizePx : DEFAULT_DROPDOWN_FIELD_METRICS.chevronBoxSize;
  const contentHeight = fontSize > chevronBoxSize ? fontSize : chevronBoxSize;
  const height = sizing.hasFieldHeight ? sizing.fieldHeightPx : contentHeight + (DEFAULT_FIELD_PADDING_Y * 2.0);
  const verticalPadding = height > contentHeight ? (height - contentHeight) * 0.5 : 0.0;
  return new DropdownFieldMetrics(
    height,
    fontSize,
    chevronBoxSize,
    DEFAULT_FIELD_PADDING_X,
    verticalPadding,
    DEFAULT_FIELD_PADDING_X,
    verticalPadding,
  );
}

export class DropdownFieldVisualState {
  constructor(
    readonly open: bool,
    readonly focused: bool,
    readonly enabled: bool,
    readonly pressed: bool,
    readonly selectedLabel: string,
  ) {}
}

export abstract class DropdownFieldPresenter {
  protected constructor(
    private readonly rootValue: FlexBox,
    private readonly valueHostValue: FlexBox,
    private readonly valueNodeValue: Text,
    private readonly chevronHostValue: FlexBox,
    private readonly metricsValue: DropdownFieldMetrics = DEFAULT_DROPDOWN_FIELD_METRICS,
  ) {}

  get root(): FlexBox {
    return this.rootValue;
  }

  get valueHost(): FlexBox {
    return this.valueHostValue;
  }

  get valueNode(): Text {
    return this.valueNodeValue;
  }

  get chevronHost(): FlexBox {
    return this.chevronHostValue;
  }

  get metrics(): DropdownFieldMetrics {
    return this.metricsValue;
  }

  abstract apply(theme: Theme, state: DropdownFieldVisualState): void;
}

export abstract class DropdownFieldTemplate {
  abstract create(): DropdownFieldPresenter;
}

class DefaultDropdownFieldPresenter extends DropdownFieldPresenter {
  constructor(metrics: DropdownFieldMetrics = DEFAULT_DROPDOWN_FIELD_METRICS) {
    const valueNode = new Text("")
      .selectable(false)
      .width(100.0, Unit.Percent)
      .maxLines(1)
      .wrapping(false) as Text;
    valueNode
      .overflowFade(true, false)
      .verticalAlign(TextVerticalAlign.Center);
    const valueHost = new FlexBox()
      .fillWidth()
      .child(valueNode) as FlexBox;
    const chevronHost = new FlexBox()
      .width(metrics.chevronBoxSize, Unit.Pixel)
      .height(metrics.chevronBoxSize, Unit.Pixel)
      .alignItems(AlignItems.Center)
      .justifyContent(JustifyContent.Center);
    const root = new FlexBox()
      .flexDirection(FlexDirection.Row)
      .alignItems(AlignItems.Center)
      .child(valueHost)
      .child(chevronHost);
    super(root, valueHost, valueNode, chevronHost, metrics);
  }

  apply(theme: Theme, state: DropdownFieldVisualState): void {
    const metrics = this.metrics;
    this.root
      .flexDirection(FlexDirection.Row)
      .alignItems(AlignItems.Center)
      .height(metrics.height, Unit.Pixel)
      .cornerRadius(theme.spacing.sm)
      .border(2.0, theme.colors.border, BorderStyle.Solid)
      .padding(metrics.paddingLeft, metrics.paddingTop, metrics.paddingRight, metrics.paddingBottom)
      .bgColor(state.pressed && state.enabled ? theme.colors.background : theme.colors.surface);
    this.valueHost
      .fillWidth();
    this.valueNode
      .font(theme.fonts.body, metrics.fontSize)
      .textColor(state.enabled ? theme.colors.textPrimary : theme.colors.textMuted);
    this.chevronHost
      .width(metrics.chevronBoxSize, Unit.Pixel)
      .height(metrics.chevronBoxSize, Unit.Pixel)
      .alignItems(AlignItems.Center)
      .justifyContent(JustifyContent.Center);
  }
}

class DefaultDropdownFieldTemplate extends DropdownFieldTemplate {
  create(): DropdownFieldPresenter {
    return new DefaultDropdownFieldPresenter();
  }
}

export const defaultDropdownFieldTemplate = new DefaultDropdownFieldTemplate();

export function createDefaultDropdownFieldPresenter(sizing: DropdownSizing | null = null): DropdownFieldPresenter {
  return new DefaultDropdownFieldPresenter(resolveFieldMetrics(sizing));
}
