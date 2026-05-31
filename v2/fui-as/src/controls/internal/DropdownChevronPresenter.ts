import { AlignItems, JustifyContent, Unit } from "../../core/ffi";
import { Theme } from "../../core/Theme";
import { FlexBox, Svg } from "../../nodes";

const DROPDOWN_CHEVRON_COLLAPSED_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'><path d='M3 4.5 6 7.5 9 4.5' fill='none' stroke='%23000000' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/></svg>";
const DROPDOWN_CHEVRON_EXPANDED_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'><path d='M3 7.5 6 4.5 9 7.5' fill='none' stroke='%23000000' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/></svg>";

export class DropdownChevronVisualState {
  constructor(
    readonly open: bool,
    readonly hovered: bool,
    readonly enabled: bool,
  ) {}
}

export abstract class DropdownChevronPresenter {
  protected constructor(
    private readonly rootValue: FlexBox,
  ) {}

  get root(): FlexBox {
    return this.rootValue;
  }

  abstract apply(theme: Theme, state: DropdownChevronVisualState): void;
}

export abstract class DropdownChevronTemplate {
  abstract create(): DropdownChevronPresenter;
}

class DefaultDropdownChevronPresenter extends DropdownChevronPresenter {
  private readonly iconNode: Svg;

  constructor() {
    const root = new FlexBox()
      .fillSize()
      .alignItems(AlignItems.Center)
      .justifyContent(JustifyContent.Center);
    const iconNode = new Svg()
      .width(12.0, Unit.Pixel)
      .height(12.0, Unit.Pixel) as Svg;
    root.child(iconNode);
    super(root);
    this.iconNode = iconNode;
  }

  apply(theme: Theme, state: DropdownChevronVisualState): void {
    this.root
      .fillSize()
      .alignItems(AlignItems.Center)
      .justifyContent(JustifyContent.Center);
    this.iconNode
      .source(state.open ? DROPDOWN_CHEVRON_EXPANDED_SVG : DROPDOWN_CHEVRON_COLLAPSED_SVG)
      .tint(!state.enabled ? theme.colors.textMuted : (state.hovered ? theme.colors.textPrimary : theme.colors.textMuted));
  }
}

class DefaultDropdownChevronTemplate extends DropdownChevronTemplate {
  create(): DropdownChevronPresenter {
    return new DefaultDropdownChevronPresenter();
  }
}

export const defaultDropdownChevronTemplate = new DefaultDropdownChevronTemplate();
