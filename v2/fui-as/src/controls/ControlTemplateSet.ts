import { ButtonTemplate } from "./internal/ButtonPresenter";
import { CheckboxIndicatorTemplate } from "./internal/CheckboxIndicatorPresenter";
import { RadioIndicatorTemplate } from "./internal/RadioIndicatorPresenter";
import { SwitchIndicatorTemplate } from "./internal/SwitchIndicatorPresenter";
import { SliderTemplate } from "./internal/SliderPresenter";
import { DropdownFieldTemplate } from "./internal/DropdownFieldPresenter";
import { DropdownChevronTemplate } from "./internal/DropdownChevronPresenter";
import { DropdownOptionRowTemplate } from "./internal/DropdownOptionRowPresenter";
import { TextInputTemplate } from "./internal/TextInputPresenter";

export class ControlTemplateSet {
  button: ButtonTemplate | null = null;
  checkboxIndicator: CheckboxIndicatorTemplate | null = null;
  radioIndicator: RadioIndicatorTemplate | null = null;
  switchIndicator: SwitchIndicatorTemplate | null = null;
  slider: SliderTemplate | null = null;
  dropdownField: DropdownFieldTemplate | null = null;
  dropdownChevron: DropdownChevronTemplate | null = null;
  dropdownOptionRow: DropdownOptionRowTemplate | null = null;
  textInput: TextInputTemplate | null = null;
  textArea: TextInputTemplate | null = null;
}

let activeControlTemplatesValue: ControlTemplateSet | null = null;

export function getControlTemplates(): ControlTemplateSet | null {
  return activeControlTemplatesValue;
}

export function useControlTemplates(templates: ControlTemplateSet | null): ControlTemplateSet | null {
  activeControlTemplatesValue = templates;
  return activeControlTemplatesValue;
}

export function clearControlTemplates(): void {
  activeControlTemplatesValue = null;
}
