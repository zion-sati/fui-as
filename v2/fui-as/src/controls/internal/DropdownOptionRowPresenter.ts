import { AlignItems, Unit } from "../../core/ffi";
import { Theme } from "../../core/Theme";
import { FlexBox, Text } from "../../nodes";

export class DropdownOptionRowMetrics {
  constructor(
    readonly height: f32,
  ) {}
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

  abstract apply(theme: Theme, state: DropdownOptionRowVisualState): void;
}

export abstract class DropdownOptionRowTemplate {
  abstract create(): DropdownOptionRowPresenter;
}

class DefaultDropdownOptionRowPresenter extends DropdownOptionRowPresenter {
  constructor() {
    const labelNode = new Text("")
      .selectable(false)
      .width(100.0, Unit.Percent)
      .maxLines(1)
      .wrapping(false) as Text;
    labelNode.overflowFade(true, false);
    const root = new FlexBox()
      .fillSize()
      .alignItems(AlignItems.Center)
      .child(labelNode);
    super(root, labelNode, new DropdownOptionRowMetrics(34.0));
  }

  apply(theme: Theme, state: DropdownOptionRowVisualState): void {
    this.root
      .padding(10.0, 6.0, 10.0, 6.0)
      .cornerRadius(theme.spacing.xs)
      .bgColor(state.highlighted ? theme.contextMenu.item.hoverBackground : 0x00000000);
    this.labelNode
      .font(theme.fonts.body, theme.fonts.sizeBody)
      .textColor(
        !state.enabled
          ? theme.colors.textMuted
          : (state.selected ? theme.colors.accent : theme.colors.textPrimary),
      );
  }
}

class DefaultDropdownOptionRowTemplate extends DropdownOptionRowTemplate {
  create(): DropdownOptionRowPresenter {
    return new DefaultDropdownOptionRowPresenter();
  }
}

export const defaultDropdownOptionRowTemplate = new DefaultDropdownOptionRowTemplate();
