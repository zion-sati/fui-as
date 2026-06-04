import { BorderStyle, CursorStyle, Unit } from "../../core/ffi";
import { Node } from "../../core/Node";
import { Theme } from "../../core/Theme";
import { FlexBox } from "../../nodes";
import { TextInputColors } from "../TextInputColors";

export class TextInputVisualState {
  constructor(
    readonly multiline: bool,
    readonly enabled: bool,
    readonly wrapping: bool,
  ) {}
}

export abstract class TextInputPresenter {
  private hostValue: FlexBox | null = null;
  private editorHostValue: Node | null = null;
  private placeholderHostValue: FlexBox | null = null;

  bind(host: FlexBox, editorHost: Node, placeholderHost: FlexBox): this {
    this.hostValue = host;
    this.editorHostValue = editorHost;
    this.placeholderHostValue = placeholderHost;
    return this;
  }

  protected get host(): FlexBox {
    return changetype<FlexBox>(this.hostValue);
  }

  protected get editorHost(): Node {
    return changetype<Node>(this.editorHostValue);
  }

  protected get placeholderHost(): FlexBox {
    return changetype<FlexBox>(this.placeholderHostValue);
  }

  abstract apply(theme: Theme, state: TextInputVisualState, colors?: TextInputColors | null): void;
}

export abstract class TextInputTemplate {
  abstract create(): TextInputPresenter;
}

class DefaultTextInputPresenter extends TextInputPresenter {
  apply(theme: Theme, state: TextInputVisualState, colors: TextInputColors | null = null): void {
    const horizontalPadding = theme.spacing.md;
    const verticalPadding = theme.spacing.sm;
    const editableCursor = state.enabled ? CursorStyle.Text : CursorStyle.Default;
    const shellCursor = !state.multiline && state.enabled ? CursorStyle.Text : CursorStyle.Default;
    const bg = colors !== null && colors.hasBackground ? colors.backgroundColor : theme.colors.surface;
    const borderColor = colors !== null && colors.hasBorder ? colors.borderColor : theme.colors.border;
    this.host
      .bgColor(bg)
      .cornerRadius(theme.spacing.sm)
      .border(1.0, borderColor, BorderStyle.Solid)
      .padding(horizontalPadding, verticalPadding, horizontalPadding, verticalPadding)
      .cursor(shellCursor);
    this.host.opacity(state.enabled ? 1.0 : 0.6);
    this.editorHost.cursor(editableCursor);
    this.placeholderHost
      .position(horizontalPadding, verticalPadding)
      .width(100.0, Unit.Percent)
      .cursor(editableCursor);
  }
}

class DefaultTextInputTemplate extends TextInputTemplate {
  create(): TextInputPresenter {
    return new DefaultTextInputPresenter();
  }
}

export const defaultTextInputTemplate = new DefaultTextInputTemplate();
