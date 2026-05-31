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

const DEFAULT_CHEVRON_BOX_SIZE: f32 = 16.0;

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

  abstract apply(theme: Theme, state: DropdownFieldVisualState): void;
}

export abstract class DropdownFieldTemplate {
  abstract create(): DropdownFieldPresenter;
}

class DefaultDropdownFieldPresenter extends DropdownFieldPresenter {
  constructor() {
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
      .width(DEFAULT_CHEVRON_BOX_SIZE, Unit.Pixel)
      .height(DEFAULT_CHEVRON_BOX_SIZE, Unit.Pixel)
      .alignItems(AlignItems.Center)
      .justifyContent(JustifyContent.Center);
    const root = new FlexBox()
      .flexDirection(FlexDirection.Row)
      .alignItems(AlignItems.Center)
      .child(valueHost)
      .child(chevronHost);
    super(root, valueHost, valueNode, chevronHost);
  }

  apply(theme: Theme, state: DropdownFieldVisualState): void {
    this.root
      .flexDirection(FlexDirection.Row)
      .alignItems(AlignItems.Center)
      .cornerRadius(theme.spacing.sm)
      .border(2.0, theme.colors.border, BorderStyle.Solid)
      .padding(theme.spacing.md, theme.spacing.sm, theme.spacing.md, theme.spacing.sm)
      .bgColor(state.pressed && state.enabled ? theme.colors.background : theme.colors.surface);
    this.valueHost
      .fillWidth();
    this.valueNode
      .font(theme.fonts.body, theme.fonts.sizeBody)
      .textColor(state.enabled ? theme.colors.textPrimary : theme.colors.textMuted);
    this.chevronHost
      .width(DEFAULT_CHEVRON_BOX_SIZE, Unit.Pixel)
      .height(DEFAULT_CHEVRON_BOX_SIZE, Unit.Pixel)
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
