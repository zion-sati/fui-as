import { SemanticCheckedState, Signal } from "../../../src/Fui";

export class DashboardModel {
  readonly clockTick: Signal<i32> = new Signal<i32>(0);
  readonly clickCount: Signal<i32> = new Signal<i32>(0);
  readonly counterHovered: Signal<bool> = new Signal<bool>(false);
  readonly keyTargetFocused: Signal<bool> = new Signal<bool>(false);
  readonly lastKey: Signal<string> = new Signal<string>("(none)");
  readonly foundationsScopeEnabled: Signal<bool> = new Signal<bool>(true);
  readonly foundationsScopedFocused: Signal<bool> = new Signal<bool>(false);
  readonly foundationsScopedActionCount: Signal<i32> = new Signal<i32>(0);
  darkModeValue: bool;
  commonCheckboxState: SemanticCheckedState = SemanticCheckedState.False;
  commonTriStateValue: SemanticCheckedState = SemanticCheckedState.Mixed;
  commonSwitchValue: bool = true;
  commonSwitchClickCount: i32 = 0;
  commonRadioValue: string = "system";
  commonHorizontalSliderValue: f32 = 40.0;
  commonVerticalSliderValue: f32 = 60.0;
  commonDropdownValue: string = "Balanced";
  commonComboBoxValue: string = "Melbourne";
  commonComboBoxText: string = "Melbourne";
  commonTextInputValue: string = "";
  commonTextInputSelectionStart: u32 = 0;
  commonTextInputSelectionEnd: u32 = 0;
  commonTextInputFocused: bool = false;

  constructor(initialDarkMode: bool) {
    this.darkModeValue = initialDarkMode;
  }
}
