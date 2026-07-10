import { AlignItems, JustifyContent, Unit } from "../../core/ffi";
import { Theme } from "../../core/Theme";
import { FlexBox, Svg } from "../../nodes";
import { DropdownSizing } from "../ControlSizing";

const DROPDOWN_CHEVRON_COLLAPSED_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'><path d='M3 4.5 6 7.5 9 4.5' fill='none' stroke='%23000000' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/></svg>";
const DROPDOWN_CHEVRON_EXPANDED_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'><path d='M3 7.5 6 4.5 9 7.5' fill='none' stroke='%23000000' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/></svg>";
const DEFAULT_DROPDOWN_CHEVRON_ICON_SIZE: f32 = 12.0;

class DropdownChevronMetrics {
  constructor(
    readonly iconSize: f32,
  ) {}
}

const DEFAULT_DROPDOWN_CHEVRON_METRICS = new DropdownChevronMetrics(DEFAULT_DROPDOWN_CHEVRON_ICON_SIZE);

function resolveChevronMetrics(sizing: DropdownSizing | null): DropdownChevronMetrics {
  if (sizing === null || !sizing.hasChevronIconSize) {
    return DEFAULT_DROPDOWN_CHEVRON_METRICS;
  }
  return new DropdownChevronMetrics(sizing.chevronIconSizePx);
}

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
  abstract create(sizing?: DropdownSizing | null): DropdownChevronPresenter;
}

class DefaultDropdownChevronPresenter extends DropdownChevronPresenter {
  private readonly metrics: DropdownChevronMetrics;
  private readonly iconNode: Svg;

  constructor(metrics: DropdownChevronMetrics = DEFAULT_DROPDOWN_CHEVRON_METRICS) {
    const root = new FlexBox()
      .fillSize()
      .alignItems(AlignItems.Center)
      .justifyContent(JustifyContent.Center);
    const iconNode = new Svg()
      .width(metrics.iconSize, Unit.Pixel)
      .height(metrics.iconSize, Unit.Pixel) as Svg;
    root.child(iconNode);
    super(root);
    this.metrics = metrics;
    this.iconNode = iconNode;
  }

  apply(theme: Theme, state: DropdownChevronVisualState): void {
    const metrics = this.metrics;
    this.root
      .fillSize()
      .alignItems(AlignItems.Center)
      .justifyContent(JustifyContent.Center);
    this.iconNode
      .width(metrics.iconSize, Unit.Pixel)
      .height(metrics.iconSize, Unit.Pixel);
    const iconNode = this.iconNode as Svg;
    iconNode.source(state.open ? DROPDOWN_CHEVRON_EXPANDED_SVG : DROPDOWN_CHEVRON_COLLAPSED_SVG);
    iconNode.tint(!state.enabled ? theme.colors.textMuted : (state.hovered ? theme.colors.textPrimary : theme.colors.textMuted));
  }
}

class DefaultDropdownChevronTemplate extends DropdownChevronTemplate {
  create(sizing: DropdownSizing | null = null): DropdownChevronPresenter {
    return createDefaultDropdownChevronPresenter(sizing);
  }
}

export const defaultDropdownChevronTemplate = new DefaultDropdownChevronTemplate();

export function createDefaultDropdownChevronPresenter(sizing: DropdownSizing | null = null): DropdownChevronPresenter {
  return new DefaultDropdownChevronPresenter(resolveChevronMetrics(sizing));
}
