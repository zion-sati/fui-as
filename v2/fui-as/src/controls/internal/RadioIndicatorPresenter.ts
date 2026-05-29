import { BorderStyle, Unit } from "../../core/ffi";
import { Theme } from "../../core/Theme";
import { FlexBox } from "../../nodes";
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

class DefaultRadioIndicatorPresenter extends RadioIndicatorPresenter {
  private readonly dotNode: FlexBox;

  constructor() {
    const root = new FlexBox()
      .width(20.0, Unit.Pixel)
      .height(20.0, Unit.Pixel)
      .alignItems(1)
      .justifyContent(1);
    super(root, new PressableIndicatorMetrics(20.0, 20.0));
    const dotNode = new FlexBox()
      .positionAbsolute()
      .position(5.0, 5.0)
      .width(8.0, Unit.Pixel)
      .height(8.0, Unit.Pixel);
    this.dotNode = dotNode;
    root.child(dotNode);
  }

  apply(theme: Theme, state: RadioIndicatorVisualState): void {
    const outerColor = state.checked
      ? (state.pressed ? theme.colors.accentPressed : (state.hovered ? theme.colors.accentHovered : theme.colors.accent))
      : theme.colors.border;
    this.root.cornerRadius(10.0);
    this.root.border(1.0, outerColor, BorderStyle.Solid);
    this.root.bgColor(theme.colors.surface);
    this.dotNode.cornerRadius(4.0);
    this.dotNode.position(5.0, 5.0);
    this.dotNode.bgColor(outerColor);
    this.dotNode.opacity(state.checked ? 1.0 : 0.0);
  }
}

class DefaultRadioIndicatorTemplate extends RadioIndicatorTemplate {
  create(): RadioIndicatorPresenter {
    return new DefaultRadioIndicatorPresenter();
  }
}

export const defaultRadioIndicatorTemplate = new DefaultRadioIndicatorTemplate();
