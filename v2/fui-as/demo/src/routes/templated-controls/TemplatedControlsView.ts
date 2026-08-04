import {
  ButtonColors,
  Button,
  Checkbox,
  Column,
  DropdownColors,
  FlexBox,
  LabeledControlColors,
  mixColor,
  SliderColors,
  Text,
  TextArea,
  TextInput,
  TextInputColors,
  Theme,
  Unit,
} from "../../../../src/Fui";
import {
  DemoCheckbox,
  DemoDropdown,
  DemoDropdownItem,
  DemoRadioButton,
  DemoRadioGroup,
  DemoSlider,
  DemoSwitch,
  DemoText,
  DemoTextRecipe,
  RoutePageSection,
  createRoutePageSection,
} from "../../design-system";
import {
  createTemplatedControlsButtonTemplate,
  createTemplatedControlsCheckboxTemplate,
  createTemplatedControlsDropdownChevronTemplate,
  createTemplatedControlsDropdownFieldTemplate,
  createTemplatedControlsDropdownOptionTemplate,
  createTemplatedControlsLocalCheckboxTemplate,
  createTemplatedControlsRadioTemplate,
  createTemplatedControlsSliderTemplate,
  createTemplatedControlsSwitchTemplate,
  createTemplatedControlsTextAreaTemplate,
  createTemplatedControlsTextInputTemplate,
} from "./TemplatedControlsTemplates";

const HOUSE_DROPDOWN_ITEMS: Array<DemoDropdownItem> = [
  new DemoDropdownItem("rounded", "Rounded field"),
  new DemoDropdownItem("accent", "Accent field"),
  new DemoDropdownItem("minimal", "Minimal field"),
];

function verticalSpacer(height: f32): FlexBox {
  return new FlexBox().fillWidth().height(height, Unit.Pixel);
}

function createSummaryText(recipe: DemoTextRecipe): Text {
  return new DemoText("", recipe)
    .fontSize(15.0) as Text;
}

function createModeGroup(): DemoRadioGroup {
  return new DemoRadioGroup(true)
    .addOptions([
      new DemoRadioButton("balanced", "Balanced chrome", true).template(createTemplatedControlsRadioTemplate()) as DemoRadioButton,
      new DemoRadioButton("compact", "Compact chrome", true).template(createTemplatedControlsRadioTemplate()) as DemoRadioButton,
      new DemoRadioButton("bold", "Bold chrome", true).template(createTemplatedControlsRadioTemplate()) as DemoRadioButton,
    ])
    .selectIndex(1)
    .semanticLabel("House style mode") as DemoRadioGroup;
}

export class TemplatedControlsView {
  readonly houseCheckbox: DemoCheckbox = new DemoCheckbox("House style notifications", true)
    .template(createTemplatedControlsCheckboxTemplate())
    .nodeId("templated-controls:house-checkbox") as DemoCheckbox;
  readonly overrideCheckbox: DemoCheckbox = new DemoCheckbox("Local override emphasis", true)
    .template(createTemplatedControlsLocalCheckboxTemplate())
    .check(true)
    .nodeId("templated-controls:override-checkbox") as DemoCheckbox;
  readonly houseSwitch: DemoSwitch = new DemoSwitch("House style quick actions", true)
    .template(createTemplatedControlsSwitchTemplate())
    .check(true)
    .nodeId("templated-controls:house-switch") as DemoSwitch;
  readonly modeGroup: DemoRadioGroup = createModeGroup()
    .nodeId("templated-controls:mode-group") as DemoRadioGroup;
  readonly intensitySlider: DemoSlider = new DemoSlider(40.0)
    .template(createTemplatedControlsSliderTemplate())
    .min(0.0)
    .max(100.0)
    .step(5.0)
    .length(240.0)
    .semanticLabel("House style intensity")
    .nodeId("templated-controls:intensity-slider") as DemoSlider;
  readonly houseDropdown: DemoDropdown = new DemoDropdown()
    .fieldTemplate(createTemplatedControlsDropdownFieldTemplate())
    .chevronTemplate(createTemplatedControlsDropdownChevronTemplate())
    .optionRowTemplate(createTemplatedControlsDropdownOptionTemplate())
    .items(HOUSE_DROPDOWN_ITEMS)
    .selectIndex(1)
    .fillWidth()
    .nodeId("templated-controls:house-dropdown") as DemoDropdown;
  readonly houseButton: Button = new Button("Run house action")
    .template(createTemplatedControlsButtonTemplate())
    as Button;
  readonly houseTextInput: TextInput = new TextInput("Palette")
    .template(createTemplatedControlsTextInputTemplate())
    .placeholder("House style input")
    .fillWidth()
    .nodeId("templated-controls:house-text-input") as TextInput;
  readonly houseTextArea: TextArea = new TextArea("Presenter-owned chrome.\nControl-owned behavior.")
    .template(createTemplatedControlsTextAreaTemplate())
    .placeholder("House style text area")
    .fillWidth()
    .height(120.0, Unit.Pixel)
    .nodeId("templated-controls:house-text-area") as TextArea;
  readonly colorButton: Button = new Button("Run tinted action")
    .template(createTemplatedControlsButtonTemplate())
    .nodeId("templated-controls:color-button") as Button;
  readonly colorCheckbox: DemoCheckbox = new DemoCheckbox("Tinted checkbox chrome", true)
    .template(createTemplatedControlsCheckboxTemplate())
    .check(true)
    .nodeId("templated-controls:color-checkbox") as DemoCheckbox;
  readonly colorSwitch: DemoSwitch = new DemoSwitch("Tinted switch chrome", true)
    .template(createTemplatedControlsSwitchTemplate())
    .check(true)
    .nodeId("templated-controls:color-switch") as DemoSwitch;
  readonly coolRadio: DemoRadioButton = new DemoRadioButton("cool", "Cool accent radio", true)
    .template(createTemplatedControlsRadioTemplate())
    .nodeId("templated-controls:color-radio-cool") as DemoRadioButton;
  readonly warmRadio: DemoRadioButton = new DemoRadioButton("warm", "Warm accent radio", true)
    .template(createTemplatedControlsRadioTemplate())
    .nodeId("templated-controls:color-radio-warm") as DemoRadioButton;
  readonly colorRadioGroup: DemoRadioGroup = new DemoRadioGroup(true)
    .addOptions([this.coolRadio, this.warmRadio])
    .selectIndex(0)
    .nodeId("templated-controls:color-radio-group") as DemoRadioGroup;
  readonly colorSlider: DemoSlider = new DemoSlider(72.0)
    .template(createTemplatedControlsSliderTemplate())
    .min(0.0)
    .max(100.0)
    .step(2.0)
    .length(240.0)
    .semanticLabel("Tinted slider")
    .nodeId("templated-controls:color-slider") as DemoSlider;
  readonly colorDropdown: DemoDropdown = new DemoDropdown()
    .fieldTemplate(createTemplatedControlsDropdownFieldTemplate())
    .chevronTemplate(createTemplatedControlsDropdownChevronTemplate())
    .optionRowTemplate(createTemplatedControlsDropdownOptionTemplate())
    .items(HOUSE_DROPDOWN_ITEMS)
    .selectIndex(2)
    .fillWidth()
    .nodeId("templated-controls:color-dropdown") as DemoDropdown;
  readonly colorTextInput: TextInput = new TextInput("Palette")
    .template(createTemplatedControlsTextInputTemplate())
    .placeholder("Tinted text input")
    .fillWidth()
    .nodeId("templated-controls:color-text-input") as TextInput;
  readonly colorTextArea: TextArea = new TextArea("Control colors flow through presenter-owned chrome too.")
    .template(createTemplatedControlsTextAreaTemplate())
    .placeholder("Tinted text area")
    .fillWidth()
    .height(96.0, Unit.Pixel)
    .nodeId("templated-controls:color-text-area") as TextArea;
  readonly defaultsStatusText: Text = createSummaryText(DemoTextRecipe.StatusValue);
  readonly overrideStatusText: Text = createSummaryText(DemoTextRecipe.StatusSupporting);
  readonly defaultsHintText: Text = new DemoText(
    "The demo design system applies explicit templates to Button, Checkbox, Switch, RadioButton, Slider, Dropdown, TextInput, and TextArea.",
    DemoTextRecipe.Hint,
  )
    .fontSize(15.0)
    .maxLines(3) as Text;
  readonly overrideHintText: Text = new DemoText(
    "The square override checkbox supplies a different explicit indicator template.",
    DemoTextRecipe.Hint,
  )
    .fontSize(15.0)
    .maxLines(3) as Text;
  readonly colorHintText: Text = new DemoText(
    "Per-instance control color objects tint the shipped presenters and the house templates on this route without changing the built-in control behavior.",
    DemoTextRecipe.Hint,
  )
    .fontSize(15.0)
    .maxLines(4) as Text;

  applyTheme(theme: Theme): void {
    const fieldBackground = mixColor(theme.colors.surface, theme.colors.background, 0.20);
    const fieldBorder = mixColor(theme.colors.border, theme.colors.accent, 0.28);
    const accentSoft = mixColor(theme.colors.accent, theme.colors.surface, 0.22);
    const accentHover = mixColor(theme.colors.accentHovered, theme.colors.surface, 0.14);
    const accentPressed = mixColor(theme.colors.accentPressed, theme.colors.surface, 0.08);
    const secondaryAccent = mixColor(theme.colors.accentHovered, theme.colors.selection, 0.28);
    const secondaryBorder = mixColor(theme.colors.border, theme.colors.accentHovered, 0.38);

    this.colorButton.colors(new ButtonColors()
      .background(accentSoft)
      .backgroundHover(accentHover)
      .backgroundPressed(accentPressed)
      .border(fieldBorder)
      .textPrimary(theme.colors.textPrimary));
    this.colorCheckbox.colors(new LabeledControlColors()
      .background(fieldBackground)
      .border(fieldBorder)
      .accent(theme.colors.accent)
      .textPrimary(theme.colors.textPrimary)
      .textMuted(theme.colors.textMuted));
    this.colorSwitch.colors(new LabeledControlColors()
      .background(fieldBackground)
      .border(fieldBorder)
      .accent(theme.colors.accent)
      .textPrimary(theme.colors.textPrimary)
      .textMuted(theme.colors.textMuted));
    this.coolRadio.colors(new LabeledControlColors()
      .background(fieldBackground)
      .border(fieldBorder)
      .accent(theme.colors.accent)
      .textPrimary(theme.colors.textPrimary)
      .textMuted(theme.colors.textMuted));
    this.warmRadio.colors(new LabeledControlColors()
      .background(fieldBackground)
      .border(secondaryBorder)
      .accent(secondaryAccent)
      .textPrimary(theme.colors.textPrimary)
      .textMuted(theme.colors.textMuted));
    this.colorSlider.colors(new SliderColors()
      .track(fieldBackground)
      .fill(theme.colors.accent)
      .thumb(theme.colors.surface));
    this.colorDropdown.colors(new DropdownColors()
      .background(fieldBackground)
      .border(fieldBorder)
      .textPrimary(theme.colors.textPrimary)
      .accent(theme.colors.accent));
    this.colorTextInput.colors(new TextInputColors()
      .background(fieldBackground)
      .border(fieldBorder)
      .textPrimary(theme.colors.textPrimary)
      .placeholder(theme.colors.textMuted)
      .caret(theme.colors.accent)
      .accent(theme.colors.accent));
    this.colorTextArea.colors(new TextInputColors()
      .background(fieldBackground)
      .border(fieldBorder)
      .textPrimary(theme.colors.textPrimary)
      .placeholder(theme.colors.textMuted)
      .caret(theme.colors.accent)
      .accent(theme.colors.accent));
  }

  getHouseDropdownSelectionLabel(): string {
    const selectedIndex = this.houseDropdown.selectedIndex;
    return selectedIndex >= 0 && selectedIndex < HOUSE_DROPDOWN_ITEMS.length
      ? unchecked(HOUSE_DROPDOWN_ITEMS[selectedIndex]).label
      : "(none)";
  }

  buildSections(): Array<RoutePageSection> {
    return [
      this.buildDefaultsSection(),
      this.buildOverrideSection(),
      this.buildColorSection(),
      this.buildSummarySection(),
    ];
  }

  private buildDefaultsSection(): RoutePageSection {
    const body = Column(
      this.houseCheckbox,
      verticalSpacer(10.0),
      this.houseSwitch,
      verticalSpacer(12.0),
      this.modeGroup,
      verticalSpacer(14.0),
      this.intensitySlider,
      verticalSpacer(14.0),
      this.houseDropdown,
      verticalSpacer(14.0),
      this.houseButton,
      verticalSpacer(14.0),
      this.houseTextInput,
      verticalSpacer(14.0),
      this.houseTextArea,
      verticalSpacer(10.0),
      this.defaultsHintText,
    ).fillWidth();
    return createRoutePageSection(
      "Design-system templates",
      "These controls receive explicit templates from the route design system while retaining their built-in semantics, persistence, and interaction behavior.",
      body,
    );
  }

  private buildOverrideSection(): RoutePageSection {
    const body = Column(
      this.overrideCheckbox,
      verticalSpacer(10.0),
      this.overrideHintText,
    ).fillWidth();
    return createRoutePageSection(
      "Alternative local template",
      "This control uses a different local template, so it stays distinct from the route's house controls.",
      body,
    );
  }

  private buildColorSection(): RoutePageSection {
    const body = Column(
      this.colorButton,
      verticalSpacer(10.0),
      this.colorCheckbox,
      verticalSpacer(10.0),
      this.colorSwitch,
      verticalSpacer(12.0),
      this.colorRadioGroup,
      verticalSpacer(14.0),
      this.colorSlider,
      verticalSpacer(14.0),
      this.colorDropdown,
      verticalSpacer(14.0),
      this.colorTextInput,
      verticalSpacer(14.0),
      this.colorTextArea,
      verticalSpacer(10.0),
      this.colorHintText,
    ).fillWidth();
    return createRoutePageSection(
      "Per-instance color overrides",
      "Color objects tint button, labeled, slider, dropdown, and text-entry presenters while leaving semantics and interaction behavior with the built-in controls.",
      body,
    );
  }

  private buildSummarySection(): RoutePageSection {
    const body = Column(
      this.defaultsStatusText,
      verticalSpacer(8.0),
      this.overrideStatusText,
    ).fillWidth();
    return createRoutePageSection(
      "Live state summary",
      "Use the controls above and confirm the summary updates without any custom behavior leaking into the presenter classes.",
      body,
    );
  }
}
