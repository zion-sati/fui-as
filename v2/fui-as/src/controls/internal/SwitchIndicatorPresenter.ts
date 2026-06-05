import { BorderStyle, Unit } from "../../core/ffi";
import { Theme } from "../../core/Theme";
import { FlexBox } from "../../nodes";
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
  abstract create(): SwitchIndicatorPresenter;
}

class DefaultSwitchIndicatorPresenter extends SwitchIndicatorPresenter {
  private readonly thumbNode: FlexBox;

  constructor() {
    const root = new FlexBox()
      .width(44.0, Unit.Pixel)
      .height(26.0, Unit.Pixel)
      .clipToBounds(true);
    super(root, new PressableIndicatorMetrics(44.0, 26.0));
    const thumbNode = new FlexBox()
      .positionAbsolute()
      .position(3.0, 2.0)
      .width(20.0, Unit.Pixel)
      .height(20.0, Unit.Pixel);
    this.thumbNode = thumbNode;
    root.alignItems(1).child(thumbNode);
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
    this.root.cornerRadius(13.0);
    this.root.border(1.0, borderColor, BorderStyle.Solid);
    this.root.bgColor(trackColor);
    this.thumbNode.position(state.checked ? 21.0 : 3.0, 2.0);
    this.thumbNode.cornerRadius(10.0);
    this.thumbNode.bgColor(colors !== null && colors.hasBackground ? colors.backgroundColor : theme.colors.surface);
    this.thumbNode.border(1.0, borderColor, BorderStyle.Solid);
  }
}

class DefaultSwitchIndicatorTemplate extends SwitchIndicatorTemplate {
  create(): SwitchIndicatorPresenter {
    return new DefaultSwitchIndicatorPresenter();
  }
}

export const defaultSwitchIndicatorTemplate = new DefaultSwitchIndicatorTemplate();
