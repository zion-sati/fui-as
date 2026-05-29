import {
  Button,
  Checkbox,
  Column,
  FlexBox,
  Text,
  TextArea,
  TextInput,
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
import { createTemplatedControlsLocalCheckboxTemplate } from "./TemplatedControlsTemplates";

const FONT_REGULAR: u32 = 1;
const HOUSE_DROPDOWN_ITEMS: Array<DemoDropdownItem> = [
  new DemoDropdownItem("rounded", "Rounded field"),
  new DemoDropdownItem("accent", "Accent field"),
  new DemoDropdownItem("minimal", "Minimal field"),
];

function verticalSpacer(height: f32): FlexBox {
  return new FlexBox().width(100.0, Unit.Percent).height(height, Unit.Pixel);
}

function createSummaryText(recipe: DemoTextRecipe): Text {
  return new DemoText("", recipe)
    .font(FONT_REGULAR, 15.0) as Text;
}

function createModeGroup(): DemoRadioGroup {
  return new DemoRadioGroup(true)
    .addOptions([
      new DemoRadioButton("balanced", "Balanced chrome", true),
      new DemoRadioButton("compact", "Compact chrome", true),
      new DemoRadioButton("bold", "Bold chrome", true),
    ])
    .selectIndex(1)
    .semanticLabel("House style mode") as DemoRadioGroup;
}

export class TemplatedControlsView {
  readonly houseCheckbox: DemoCheckbox = new DemoCheckbox("House style notifications", true)
    .nodeId("templated-controls:house-checkbox") as DemoCheckbox;
  readonly overrideCheckbox: DemoCheckbox = new DemoCheckbox("Local override emphasis", true)
    .template(createTemplatedControlsLocalCheckboxTemplate())
    .check(true)
    .nodeId("templated-controls:override-checkbox") as DemoCheckbox;
  readonly houseSwitch: DemoSwitch = new DemoSwitch("House style quick actions", true)
    .check(true)
    .nodeId("templated-controls:house-switch") as DemoSwitch;
  readonly modeGroup: DemoRadioGroup = createModeGroup()
    .nodeId("templated-controls:mode-group") as DemoRadioGroup;
  readonly intensitySlider: DemoSlider = new DemoSlider(40.0)
    .min(0.0)
    .max(100.0)
    .step(5.0)
    .length(240.0)
    .semanticLabel("House style intensity")
    .nodeId("templated-controls:intensity-slider") as DemoSlider;
  readonly houseDropdown: DemoDropdown = new DemoDropdown()
    .items(HOUSE_DROPDOWN_ITEMS)
    .selectIndex(1)
    .width(100.0, Unit.Percent)
    .nodeId("templated-controls:house-dropdown") as DemoDropdown;
  readonly houseButton: Button = new Button("Run house action")
    as Button;
  readonly houseTextInput: TextInput = new TextInput("Palette")
    .placeholder("House style input")
    .width(100.0, Unit.Percent)
    .nodeId("templated-controls:house-text-input") as TextInput;
  readonly houseTextArea: TextArea = new TextArea("Presenter-owned chrome.\nControl-owned behavior.")
    .placeholder("House style text area")
    .width(100.0, Unit.Percent)
    .height(120.0, Unit.Pixel)
    .nodeId("templated-controls:house-text-area") as TextArea;
  readonly defaultsStatusText: Text = createSummaryText(DemoTextRecipe.StatusValue);
  readonly overrideStatusText: Text = createSummaryText(DemoTextRecipe.StatusSupporting);
  readonly defaultsHintText: Text = new DemoText(
    "Button, Checkbox, Switch, RadioButton, Slider, Dropdown, TextInput, and TextArea pick up the route-wide template set without per-instance calls.",
    DemoTextRecipe.Hint,
  )
    .font(FONT_REGULAR, 15.0)
    .maxLines(3) as Text;
  readonly overrideHintText: Text = new DemoText(
    "The square override checkbox keeps its own indicator template even though the route supplies app-level defaults.",
    DemoTextRecipe.Hint,
  )
    .font(FONT_REGULAR, 15.0)
    .maxLines(3) as Text;

  applyTheme(_theme: Theme): void {}

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
    ).width(100.0, Unit.Percent);
    return createRoutePageSection(
      "App-level defaults",
      "These controls use the route-wide ControlTemplateSet and keep their built-in semantics, persistence, and interaction behavior.",
      body,
    );
  }

  private buildOverrideSection(): RoutePageSection {
    const body = Column(
      this.overrideCheckbox,
      verticalSpacer(10.0),
      this.overrideHintText,
    ).width(100.0, Unit.Percent);
    return createRoutePageSection(
      "Per-instance override precedence",
      "This control uses a local template override, so it stays distinct from the route's house defaults.",
      body,
    );
  }

  private buildSummarySection(): RoutePageSection {
    const body = Column(
      this.defaultsStatusText,
      verticalSpacer(8.0),
      this.overrideStatusText,
    ).width(100.0, Unit.Percent);
    return createRoutePageSection(
      "Live state summary",
      "Use the controls above and confirm the summary updates without any custom behavior leaking into the presenter classes.",
      body,
    );
  }
}
