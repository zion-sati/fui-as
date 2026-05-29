import { SemanticCheckedState, Theme } from "../../../../src/Fui";
import { DemoCheckbox, RoutePageLifecycleOwner, RoutePageSection } from "../../design-system";
import { TemplatedControlsView } from "./TemplatedControlsView";

function checkedLabel(control: DemoCheckbox): string {
  if (control.checkedState == SemanticCheckedState.Mixed) {
    return "mixed";
  }
  return control.checkedState == SemanticCheckedState.True ? "on" : "off";
}

export class TemplatedControlsController implements RoutePageLifecycleOwner {
  readonly view: TemplatedControlsView = new TemplatedControlsView();
  private houseButtonClicks: i32 = 0;

  constructor() {
    this.view.houseButton.onClickWith(this, (controller) => {
      controller.houseButtonClicks += 1;
      controller.syncSummary();
    });
    this.view.houseCheckbox.onChangedWith(this, (controller, _state) => {
      controller.syncSummary();
    });
    this.view.overrideCheckbox.onChangedWith(this, (controller, _state) => {
      controller.syncSummary();
    });
    this.view.houseSwitch.onChangedWith(this, (controller, _checked) => {
      controller.syncSummary();
    });
    this.view.modeGroup.onChangedWith(this, (controller, _value) => {
      controller.syncSummary();
    });
    this.view.intensitySlider.onChangedWith(this, (controller, _value) => {
      controller.syncSummary();
    });
    this.view.houseDropdown.onChangedWith(this, (controller, _item, _index) => {
      controller.syncSummary();
    });
    this.view.houseTextInput.onChangedWith(this, (controller, _value) => {
      controller.syncSummary();
    });
    this.view.houseTextArea.onChangedWith(this, (controller, _value) => {
      controller.syncSummary();
    });
    this.syncSummary();
  }

  buildSections(): Array<RoutePageSection> {
    return this.view.buildSections();
  }

  applyTheme(theme: Theme): void {
    this.view.applyTheme(theme);
  }

  dispose(): void {}

  private syncSummary(): void {
    this.view.defaultsStatusText.text(
      "Defaults: button taps " +
      this.houseButtonClicks.toString() +
      ", checkbox " +
      checkedLabel(this.view.houseCheckbox) +
      ", switch " +
      (this.view.houseSwitch.checked ? "on" : "off") +
      ", mode " +
      this.view.modeGroup.selectedValue +
      ", intensity " +
      Math.round(this.view.intensitySlider.value).toString() +
      ", dropdown " +
      this.view.getHouseDropdownSelectionLabel() +
      ", input " +
      this.view.houseTextInput.value.length.toString() +
      " chars, area " +
      this.view.houseTextArea.value.length.toString() +
      " chars" +
      ".",
    );
    this.view.overrideStatusText.text(
      "Override checkbox stays " +
      checkedLabel(this.view.overrideCheckbox) +
      " while keeping local template precedence over the app-level defaults.",
    );
  }
}
