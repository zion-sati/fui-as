import {
  AlignItems,
  ButtonColors,
  ButtonPresenter,
  ButtonTemplate,
  ButtonVisualState,
  CheckboxIndicatorPresenter,
  CheckboxIndicatorTemplate,
  CheckboxIndicatorVisualState,
  ControlTemplateSet,
  DropdownChevronPresenter,
  DropdownChevronTemplate,
  DropdownChevronVisualState,
  DropdownFieldPresenter,
  DropdownColors,
  DropdownSizing,
  DropdownFieldTemplate,
  DropdownFieldVisualState,
  DropdownOptionRowMetrics,
  DropdownOptionRowPresenter,
  DropdownOptionRowTemplate,
  DropdownOptionRowVisualState,
  FlexBox,
  FlexDirection,
  JustifyContent,
  LabeledControlColors,
  LabeledControlSizing,
  Orientation,
  PressableIndicatorMetrics,
  RadioIndicatorPresenter,
  RadioIndicatorTemplate,
  RadioIndicatorVisualState,
  SemanticCheckedState,
  SliderPresenter,
  SliderColors,
  SliderPresenterMetrics,
  SliderSizing,
  SliderTemplate,
  SliderVisualState,
  Svg,
  SwitchIndicatorPresenter,
  SwitchIndicatorTemplate,
  SwitchIndicatorVisualState,
  Theme,
  Text,
  TextInputPresenter,
  TextInputColors,
  TextInputTemplate,
  TextInputVisualState,
  TextVerticalAlign,
  Unit,
} from "../../../../src/Fui";

const HOUSE_DROPDOWN_CHEVRON_COLLAPSED_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14'><path d='M3.5 5.5 7 9l3.5-3.5' fill='none' stroke='%23000000' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/></svg>";
const HOUSE_DROPDOWN_CHEVRON_EXPANDED_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14'><path d='M3.5 8.5 7 5l3.5 3.5' fill='none' stroke='%23000000' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/></svg>";

function resolveAccent(theme: Theme, hovered: bool, pressed: bool): u32 {
  if (pressed) {
    return theme.colors.accentPressed;
  }
  if (hovered) {
    return theme.colors.accentHovered;
  }
  return theme.colors.accent;
}

class HouseCheckboxIndicatorPresenter extends CheckboxIndicatorPresenter {
  private readonly fillNode: FlexBox;

  constructor() {
    const root = new FlexBox()
      .width(24.0, Unit.Pixel)
      .height(24.0, Unit.Pixel)
      .alignItems(AlignItems.Center)
      .justifyContent(JustifyContent.Center);
    super(root, new PressableIndicatorMetrics(24.0, 24.0));
    const fillNode = new FlexBox()
      .width(12.0, Unit.Pixel)
      .height(12.0, Unit.Pixel);
    this.fillNode = fillNode;
    root.child(fillNode);
  }

  apply(theme: Theme, state: CheckboxIndicatorVisualState, colors: LabeledControlColors | null = null): void {
    const accent = colors !== null && colors.hasAccent ? colors.accentColor : resolveAccent(theme, state.hovered, state.pressed);
    const checked = state.checkedState != SemanticCheckedState.False;
    this.root
      .cornerRadius(8.0)
      .border(2.0, checked ? accent : (colors !== null && colors.hasBorder ? colors.borderColor : theme.colors.border))
      .bgColor(checked ? accent : (colors !== null && colors.hasBackground ? colors.backgroundColor : theme.colors.surface));
    this.fillNode
      .cornerRadius(state.checkedState == SemanticCheckedState.Mixed ? 3.0 : 6.0)
      .width(state.checkedState == SemanticCheckedState.Mixed ? 14.0 : 12.0, Unit.Pixel)
      .height(state.checkedState == SemanticCheckedState.Mixed ? 6.0 : 12.0, Unit.Pixel)
      .bgColor(colors !== null && colors.hasBackground ? colors.backgroundColor : theme.colors.surface)
      .opacity(checked ? 1.0 : 0.0);
  }
}

class HouseCheckboxIndicatorTemplate extends CheckboxIndicatorTemplate {
  create(_sizing: LabeledControlSizing | null = null): CheckboxIndicatorPresenter {
    return new HouseCheckboxIndicatorPresenter();
  }
}

class LocalOverrideCheckboxIndicatorPresenter extends CheckboxIndicatorPresenter {
  private readonly stripeNode: FlexBox;

  constructor() {
    const root = new FlexBox()
      .width(24.0, Unit.Pixel)
      .height(24.0, Unit.Pixel)
      .alignItems(AlignItems.Center)
      .justifyContent(JustifyContent.Center);
    super(root, new PressableIndicatorMetrics(24.0, 24.0));
    const stripeNode = new FlexBox()
      .width(14.0, Unit.Pixel)
      .height(10.0, Unit.Pixel);
    this.stripeNode = stripeNode;
    root.child(stripeNode);
  }

  apply(theme: Theme, state: CheckboxIndicatorVisualState, colors: LabeledControlColors | null = null): void {
    const accent = colors !== null && colors.hasAccent ? colors.accentColor : resolveAccent(theme, state.hovered, state.pressed);
    const checked = state.checkedState != SemanticCheckedState.False;
    this.root
      .cornerRadius(4.0)
      .border(2.0, accent)
      .bgColor(checked ? (colors !== null && colors.hasBackground ? colors.backgroundColor : theme.colors.background) : (colors !== null && colors.hasBackground ? colors.backgroundColor : theme.colors.surface));
    this.stripeNode
      .cornerRadius(state.checkedState == SemanticCheckedState.Mixed ? 2.0 : 5.0)
      .width(state.checkedState == SemanticCheckedState.Mixed ? 14.0 : 10.0, Unit.Pixel)
      .height(state.checkedState == SemanticCheckedState.Mixed ? 6.0 : 14.0, Unit.Pixel)
      .bgColor(accent)
      .opacity(checked ? 1.0 : 0.0);
  }
}

class LocalOverrideCheckboxIndicatorTemplate extends CheckboxIndicatorTemplate {
  create(_sizing: LabeledControlSizing | null = null): CheckboxIndicatorPresenter {
    return new LocalOverrideCheckboxIndicatorPresenter();
  }
}

class HouseRadioIndicatorPresenter extends RadioIndicatorPresenter {
  private readonly dotNode: FlexBox;

  constructor() {
    const root = new FlexBox()
      .width(24.0, Unit.Pixel)
      .height(24.0, Unit.Pixel)
      .alignItems(AlignItems.Center)
      .justifyContent(JustifyContent.Center);
    super(root, new PressableIndicatorMetrics(24.0, 24.0));
    const dotNode = new FlexBox()
      .width(10.0, Unit.Pixel)
      .height(10.0, Unit.Pixel);
    this.dotNode = dotNode;
    root.child(dotNode);
  }

  apply(theme: Theme, state: RadioIndicatorVisualState, colors: LabeledControlColors | null = null): void {
    const accent = colors !== null && colors.hasAccent ? colors.accentColor : resolveAccent(theme, state.hovered, state.pressed);
    const borderColor = state.checked ? accent : (colors !== null && colors.hasBorder ? colors.borderColor : theme.colors.border);
    this.root
      .cornerRadius(12.0)
      .border(2.0, borderColor)
      .bgColor(colors !== null && colors.hasBackground ? colors.backgroundColor : theme.colors.surface);
    this.dotNode
      .cornerRadius(5.0)
      .bgColor(accent)
      .opacity(state.checked ? 1.0 : 0.0);
  }
}

class HouseRadioIndicatorTemplate extends RadioIndicatorTemplate {
  create(_sizing: LabeledControlSizing | null = null): RadioIndicatorPresenter {
    return new HouseRadioIndicatorPresenter();
  }
}

class HouseSwitchIndicatorPresenter extends SwitchIndicatorPresenter {
  private readonly thumbNode: FlexBox;

  constructor() {
    const root = new FlexBox()
      .width(52.0, Unit.Pixel)
      .height(30.0, Unit.Pixel)
      .clipToBounds(true);
    super(root, new PressableIndicatorMetrics(52.0, 30.0));
    const thumbNode = new FlexBox()
      .positionAbsolute()
      .position(4.0, 4.0)
      .width(22.0, Unit.Pixel)
      .height(22.0, Unit.Pixel);
    this.thumbNode = thumbNode;
    root.child(thumbNode);
  }

  apply(theme: Theme, state: SwitchIndicatorVisualState, colors: LabeledControlColors | null = null): void {
    const accent = colors !== null && colors.hasAccent ? colors.accentColor : resolveAccent(theme, state.hovered, state.pressed);
    const background = colors !== null && colors.hasBackground ? colors.backgroundColor : theme.colors.surface;
    const border = colors !== null && colors.hasBorder ? colors.borderColor : theme.colors.border;
    const trackColor = state.checked ? accent : background;
    this.root
      .cornerRadius(15.0)
      .border(2.0, state.checked ? accent : border)
      .bgColor(trackColor);
    this.thumbNode
      .position(state.checked ? 26.0 : 4.0, 4.0)
      .cornerRadius(11.0)
      .bgColor(state.checked ? background : theme.colors.background)
      .border(1.0, state.checked ? accent : border);
  }
}

class HouseSwitchIndicatorTemplate extends SwitchIndicatorTemplate {
  create(_sizing: LabeledControlSizing | null = null): SwitchIndicatorPresenter {
    return new HouseSwitchIndicatorPresenter();
  }
}

class HouseSliderPresenter extends SliderPresenter {
  private readonly trackNode: FlexBox;
  private readonly fillNode: FlexBox;
  private readonly thumbNode: FlexBox;

  constructor() {
    const root = new FlexBox();
    super(root, new SliderPresenterMetrics(22.0, 8.0, 6.0));
    const trackNode = new FlexBox().positionAbsolute();
    const fillNode = new FlexBox().positionAbsolute();
    const thumbNode = new FlexBox()
      .positionAbsolute()
      .width(22.0, Unit.Pixel)
      .height(22.0, Unit.Pixel);
    this.trackNode = trackNode;
    this.fillNode = fillNode;
    this.thumbNode = thumbNode;
    root
      .child(trackNode)
      .child(fillNode)
      .child(thumbNode);
  }

  layout(state: SliderVisualState, length: f32): void {
    const metrics = this.metrics;
    const available = length > metrics.thumbSize ? length - metrics.thumbSize : 0.0;
    const fraction = state.normalizedValue;
    const crossAxisInset = metrics.crossAxisExtra * 0.5;
    if (state.orientation == Orientation.Vertical) {
      this.root
        .width(metrics.thumbSize + metrics.crossAxisExtra, Unit.Pixel)
        .height(length, Unit.Pixel);
      this.trackNode
        .width(metrics.trackThickness, Unit.Pixel)
        .height(available, Unit.Pixel)
        .position(
          crossAxisInset + ((metrics.thumbSize - metrics.trackThickness) * 0.5),
          metrics.thumbSize * 0.5,
        );
      this.fillNode
        .width(metrics.trackThickness, Unit.Pixel)
        .height(available * fraction, Unit.Pixel)
        .position(
          crossAxisInset + ((metrics.thumbSize - metrics.trackThickness) * 0.5),
          metrics.thumbSize * 0.5 + (available * (1.0 - fraction)),
        );
      this.thumbNode.position(
        crossAxisInset,
        available - (available * fraction),
      );
      return;
    }

    this.root
      .width(length, Unit.Pixel)
      .height(metrics.thumbSize + metrics.crossAxisExtra, Unit.Pixel);
    this.trackNode
      .width(available, Unit.Pixel)
      .height(metrics.trackThickness, Unit.Pixel)
      .position(
        metrics.thumbSize * 0.5,
        crossAxisInset + ((metrics.thumbSize - metrics.trackThickness) * 0.5),
      );
    this.fillNode
      .width(available * fraction, Unit.Pixel)
      .height(metrics.trackThickness, Unit.Pixel)
      .position(
        metrics.thumbSize * 0.5,
        crossAxisInset + ((metrics.thumbSize - metrics.trackThickness) * 0.5),
      );
    this.thumbNode.position(
      available * fraction,
      crossAxisInset,
    );
  }

  apply(theme: Theme, state: SliderVisualState, colors: SliderColors | null): void {
    const accent = colors !== null && colors.hasFill
      ? colors.fillColor
      : (state.dragging ? theme.colors.accentPressed : resolveAccent(theme, state.hovered, false));
    this.trackNode
      .cornerRadius(4.0)
      .bgColor(colors !== null && colors.hasTrack ? colors.trackColor : theme.colors.background)
      .border(1.0, theme.colors.border);
    this.fillNode
      .cornerRadius(4.0)
      .bgColor(accent);
    this.thumbNode
      .cornerRadius(11.0)
      .bgColor(colors !== null && colors.hasThumb ? colors.thumbColor : theme.colors.surface)
      .border(2.0, accent);
  }
}

class HouseSliderTemplate extends SliderTemplate {
  create(_sizing: SliderSizing | null = null): SliderPresenter {
    return new HouseSliderPresenter();
  }
}

class HouseDropdownFieldPresenter extends DropdownFieldPresenter {
  constructor() {
    const valueNode = new Text("")
      .selectable(false)
      .fillWidth()
      .maxLines(1)
      .wrapping(false) as Text;
    valueNode
      .overflowFade(true, false)
      .verticalAlign(TextVerticalAlign.Center);
    const valueHost = new FlexBox()
      .fillWidth()
      .child(valueNode) as FlexBox;
    const chevronHost = new FlexBox()
      .width(28.0, Unit.Pixel)
      .height(28.0, Unit.Pixel)
      .alignItems(AlignItems.Center)
      .justifyContent(JustifyContent.Center);
    const root = new FlexBox()
      .flexDirection(FlexDirection.Row)
      .alignItems(AlignItems.Center)
      .child(valueHost)
      .child(chevronHost);
    super(root, valueHost, valueNode, chevronHost);
  }

  apply(theme: Theme, state: DropdownFieldVisualState, colors: DropdownColors | null): void {
    const accentBase = colors !== null && colors.hasAccent ? colors.accentColor : theme.colors.accent;
    const accent = state.open || state.focused ? accentBase : (colors !== null && colors.hasBorder ? colors.borderColor : theme.colors.border);
    this.root
      .flexDirection(FlexDirection.Row)
      .alignItems(AlignItems.Center)
      .cornerRadius(16.0)
      .border(2.0, accent)
      .padding(14.0, 10.0, 14.0, 10.0)
      .bgColor(
        colors !== null && colors.hasBackground
          ? colors.backgroundColor
          : (state.open ? theme.colors.background : theme.colors.surface),
      );
    this.valueHost
      .fillWidth();
    this.valueNode
      .fontFamily(theme.fonts.bodyFamily).fontSize(theme.fonts.sizeBody)
      .textColor(
        state.enabled
          ? (colors !== null && colors.hasTextPrimary ? colors.textPrimaryColor : theme.colors.textPrimary)
          : theme.colors.textMuted,
      );
    this.chevronHost
      .width(28.0, Unit.Pixel)
      .height(28.0, Unit.Pixel)
      .cornerRadius(14.0)
      .alignItems(AlignItems.Center)
      .justifyContent(JustifyContent.Center)
      .bgColor(state.enabled ? accentBase : theme.colors.border);
  }
}

class HouseDropdownFieldTemplate extends DropdownFieldTemplate {
  create(_sizing: DropdownSizing | null = null): DropdownFieldPresenter {
    return new HouseDropdownFieldPresenter();
  }
}

class HouseDropdownChevronPresenter extends DropdownChevronPresenter {
  private readonly iconNode: Svg;

  constructor() {
    const root = new FlexBox()
      .fillSize()
      .alignItems(AlignItems.Center)
      .justifyContent(JustifyContent.Center);
    const iconNode = new Svg()
      .width(14.0, Unit.Pixel)
      .height(14.0, Unit.Pixel) as Svg;
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
      .source(state.open ? HOUSE_DROPDOWN_CHEVRON_EXPANDED_SVG : HOUSE_DROPDOWN_CHEVRON_COLLAPSED_SVG)
      .tint(state.enabled ? theme.colors.surface : theme.colors.textMuted);
  }
}

class HouseDropdownChevronTemplate extends DropdownChevronTemplate {
  create(_sizing: DropdownSizing | null = null): DropdownChevronPresenter {
    return new HouseDropdownChevronPresenter();
  }
}

class HouseDropdownOptionRowPresenter extends DropdownOptionRowPresenter {
  constructor() {
    const labelNode = new Text("")
      .selectable(false)
      .fillWidth()
      .maxLines(1)
      .wrapping(false) as Text;
    labelNode.overflowFade(true, false);
    const root = new FlexBox()
      .fillSize()
      .alignItems(AlignItems.Center)
      .child(labelNode);
    super(root, labelNode, new DropdownOptionRowMetrics(38.0));
  }

  apply(theme: Theme, state: DropdownOptionRowVisualState, colors: DropdownColors | null): void {
    const accent = colors !== null && colors.hasAccent ? colors.accentColor : theme.colors.accent;
    const accentPressed = colors !== null && colors.hasAccent ? colors.accentColor : theme.colors.accentPressed;
    const rowBackground = colors !== null && colors.hasBackground ? colors.backgroundColor : theme.colors.background;
    this.root
      .padding(12.0, 8.0, 12.0, 8.0)
      .cornerRadius(12.0)
      .bgColor(
        state.selected
          ? accent
          : (state.highlighted ? rowBackground : 0x00000000),
      )
      .border(
        state.selected || state.highlighted ? 1.0 : 0.0,
        state.selected ? accentPressed : theme.colors.border
      );
    this.labelNode
      .fontFamily(theme.fonts.bodyFamily).fontSize(theme.fonts.sizeBody)
      .textColor(
        !state.enabled
          ? theme.colors.textMuted
          : (state.selected
            ? theme.colors.surface
            : (colors !== null && colors.hasTextPrimary ? colors.textPrimaryColor : theme.colors.textPrimary)),
      );
  }
}

class HouseDropdownOptionRowTemplate extends DropdownOptionRowTemplate {
  create(_sizing: DropdownSizing | null = null): DropdownOptionRowPresenter {
    return new HouseDropdownOptionRowPresenter();
  }
}

class HouseButtonPresenter extends ButtonPresenter {
  constructor() {
    const labelNode = new Text("")
      .selectable(false)
      .maxLines(1)
      .wrapping(false) as Text;
    const contentRoot = new FlexBox()
      .alignItems(AlignItems.Center)
      .justifyContent(JustifyContent.Center)
      .child(labelNode);
    super(contentRoot, labelNode);
  }

  apply(theme: Theme, state: ButtonVisualState, colors: ButtonColors | null = null): void {
    const accent = resolveAccent(theme, state.hovered, state.pressed);
    const border = colors !== null && colors.hasBorder ? colors.borderColor : accent;
    const textColor = !state.enabled && colors !== null && colors.hasTextMuted
      ? colors.textMutedColor
      : (colors !== null && colors.hasTextPrimary ? colors.textPrimaryColor : (state.enabled ? accent : theme.colors.textMuted));
    const background = state.enabled
      ? (colors !== null && colors.hasBackground ? colors.backgroundColor : theme.colors.surface)
      : (colors !== null && colors.hasBackground ? colors.backgroundColor : theme.colors.background);
    this.host
      .cornerRadius(18.0)
      .border(2.0, state.focused ? theme.colors.accent : border)
      .padding(16.0, 10.0, 16.0, 10.0)
      .bgColor(background);
    this.contentRoot
      .alignItems(AlignItems.Center)
      .justifyContent(JustifyContent.Center);
    this.labelNode
      .fontFamily(theme.fonts.bodyFamily).fontSize(theme.fonts.sizeBody)
      .textColor(textColor);
  }
}

class HouseButtonTemplate extends ButtonTemplate {
  create(): ButtonPresenter {
    return new HouseButtonPresenter();
  }
}

class HouseTextInputPresenter extends TextInputPresenter {
  constructor(private readonly multiline: bool) {
    super();
  }

  apply(theme: Theme, state: TextInputVisualState, colors: TextInputColors | null): void {
    const insetX: f32 = 14.0;
    const insetY: f32 = state.multiline ? 12.0 : 10.0;
    this.host
      .cornerRadius(this.multiline ? 20.0 : 16.0)
      .border(2.0, colors !== null && colors.hasBorder ? colors.borderColor : theme.colors.accent)
      .padding(insetX, insetY, insetX, insetY)
      .bgColor(colors !== null && colors.hasBackground ? colors.backgroundColor : theme.colors.surface);
    this.placeholderHost
      .position(insetX, insetY)
      .fillWidth();
  }
}

class HouseTextInputTemplate extends TextInputTemplate {
  create(): TextInputPresenter {
    return new HouseTextInputPresenter(false);
  }
}

class HouseTextAreaTemplate extends TextInputTemplate {
  create(): TextInputPresenter {
    return new HouseTextInputPresenter(true);
  }
}

export function createTemplatedControlsTemplateSet(): ControlTemplateSet {
  const templates = new ControlTemplateSet();
  templates.button = new HouseButtonTemplate();
  templates.checkboxIndicator = new HouseCheckboxIndicatorTemplate();
  templates.radioIndicator = new HouseRadioIndicatorTemplate();
  templates.switchIndicator = new HouseSwitchIndicatorTemplate();
  templates.slider = new HouseSliderTemplate();
  templates.dropdownField = new HouseDropdownFieldTemplate();
  templates.dropdownChevron = new HouseDropdownChevronTemplate();
  templates.dropdownOptionRow = new HouseDropdownOptionRowTemplate();
  templates.textInput = new HouseTextInputTemplate();
  templates.textArea = new HouseTextAreaTemplate();
  return templates;
}

export function createTemplatedControlsLocalCheckboxTemplate(): CheckboxIndicatorTemplate {
  return new LocalOverrideCheckboxIndicatorTemplate();
}
