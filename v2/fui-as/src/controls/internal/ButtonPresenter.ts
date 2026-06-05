import {
  AlignItems,
  BorderStyle,
  FlexDirection,
  JustifyContent,
} from "../../core/ffi";
import { Theme } from "../../core/Theme";
import { FontStyle, FontWeight } from "../../core/Typography";
import { FlexBox, TextCore } from "../../nodes";
import { ButtonColors } from "../ButtonColors";

export class ButtonVisualState {
  constructor(
    readonly hovered: bool,
    readonly pressed: bool,
    readonly focused: bool,
    readonly enabled: bool,
  ) {}
}

export abstract class ButtonPresenter {
  private hostValue: FlexBox | null = null;

  protected constructor(
    private readonly contentRootValue: FlexBox,
    private readonly labelNodeValue: TextCore,
  ) {}

  bindHost(host: FlexBox): this {
    this.hostValue = host;
    return this;
  }

  get contentRoot(): FlexBox {
    return this.contentRootValue;
  }

  get labelNode(): TextCore {
    return this.labelNodeValue;
  }

  protected get host(): FlexBox {
    return changetype<FlexBox>(this.hostValue);
  }

  abstract apply(theme: Theme, state: ButtonVisualState, colors?: ButtonColors | null): void;
}

export abstract class ButtonTemplate {
  abstract create(): ButtonPresenter;
}

class DefaultButtonPresenter extends ButtonPresenter {
  constructor() {
    const labelNode = new TextCore("");
    const contentRoot = new FlexBox()
      .flexDirection(FlexDirection.Row)
      .alignItems(AlignItems.Center)
      .justifyContent(JustifyContent.Center)
      .child(labelNode);
    super(contentRoot, labelNode);
  }

  apply(theme: Theme, state: ButtonVisualState, _colors: ButtonColors | null = null): void {
    const background = state.pressed
      ? theme.colors.accentPressed
      : (state.hovered ? theme.colors.accentHovered : theme.colors.accent);
    this.host
      .flexDirection(FlexDirection.Row)
      .justifyContent(JustifyContent.Center)
      .alignItems(AlignItems.Center)
      .cornerRadius(theme.spacing.sm)
      .border(1.0, theme.colors.border, BorderStyle.Solid)
      .padding(theme.spacing.md, theme.spacing.sm, theme.spacing.md, theme.spacing.sm)
      .dropShadow(0x00000000, 0.0, 0.0, 0.0, 0.0)
      .bgColor(background);
    this.contentRoot
      .flexDirection(FlexDirection.Row)
      .alignItems(AlignItems.Center)
      .justifyContent(JustifyContent.Center);
    this.labelNode
      .fontFamily(theme.fonts.bodyFamily)
      .fontWeight(FontWeight.Regular)
      .fontStyle(FontStyle.Normal)
      .fontSize(theme.fonts.sizeBody)
      .textColor(theme.colors.textOnAccent);
  }
}

class DefaultButtonTemplate extends ButtonTemplate {
  create(): ButtonPresenter {
    return new DefaultButtonPresenter();
  }
}

export const defaultButtonTemplate = new DefaultButtonTemplate();
