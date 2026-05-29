import { BorderStyle, SemanticCheckedState, Unit } from "../../core/ffi";
import { Theme } from "../../core/Theme";
import { FlexBox, Svg } from "../../nodes";
import {
  PressableIndicatorMetrics,
  PressableIndicatorPresenter,
  PressableIndicatorVisualState,
} from "./PressableIndicatorPresenter";

const CHECKBOX_CHECK_SVG_URL = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 14 14'><path d='M3.25 8.25 6.35 11.35 12.75 4.95' fill='none' stroke='%23000000' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'/></svg>";

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

  abstract apply(theme: Theme, state: CheckboxIndicatorVisualState): void;
}

export abstract class CheckboxIndicatorTemplate {
  abstract create(): CheckboxIndicatorPresenter;
}

class DefaultCheckboxIndicatorPresenter extends CheckboxIndicatorPresenter {
  private readonly markNode: Svg;

  constructor() {
    const root = new FlexBox()
      .width(20.0, Unit.Pixel)
      .height(20.0, Unit.Pixel)
      .alignItems(1)
      .justifyContent(1);
    super(root, new PressableIndicatorMetrics(20.0, 20.0));
    const markHost = new FlexBox()
      .width(100.0, Unit.Percent)
      .height(100.0, Unit.Percent)
      .alignItems(1)
      .justifyContent(1);
    const markNode = new Svg();
    markNode
      .width(16.0, Unit.Pixel)
      .height(16.0, Unit.Pixel);
    this.markNode = markNode;
    markHost.child(markNode);
    root.child(markHost);
  }

  apply(theme: Theme, state: CheckboxIndicatorVisualState): void {
    let background = theme.colors.surface;
    let borderColor = theme.colors.border;
    let markVisible = false;
    let markColor = theme.colors.textPrimary;
    if (state.checkedState == SemanticCheckedState.True || state.checkedState == SemanticCheckedState.Mixed) {
      background = state.pressed
        ? theme.colors.accentPressed
        : (state.hovered ? theme.colors.accentHovered : theme.colors.accent);
      borderColor = background;
      markVisible = state.checkedState == SemanticCheckedState.True;
      markColor = theme.colors.surface;
    } else if (state.hovered) {
      background = theme.colors.background;
    }
    this.root.cornerRadius(theme.spacing.xs);
    this.root.border(1.0, borderColor, BorderStyle.Solid);
    this.root.bgColor(background);
    if (markVisible) {
      this.markNode.source(CHECKBOX_CHECK_SVG_URL);
    } else {
      this.markNode.clearSource();
    }
    this.markNode.tint(markColor);
  }
}

class DefaultCheckboxIndicatorTemplate extends CheckboxIndicatorTemplate {
  create(): CheckboxIndicatorPresenter {
    return new DefaultCheckboxIndicatorPresenter();
  }
}

export const defaultCheckboxIndicatorTemplate = new DefaultCheckboxIndicatorTemplate();
