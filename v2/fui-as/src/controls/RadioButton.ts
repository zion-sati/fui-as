import { KeyEventType, SemanticCheckedState, SemanticRole } from "../core/ffi";
import { activeTheme } from "../core/Theme";
import { PressableLabeledControl } from "./internal/PressableLabeledControl";
import { getControlTemplates } from "./ControlTemplateSet";
import { RadioGroup } from "./RadioGroup";
import {
  defaultRadioIndicatorTemplate,
  RadioIndicatorPresenter,
  RadioIndicatorTemplate,
  RadioIndicatorVisualState,
} from "./internal/RadioIndicatorPresenter";

function createIndicatorPresenter(template: RadioIndicatorTemplate | null): RadioIndicatorPresenter {
  if (template !== null) {
    return template.create();
  }
  const templateSet = getControlTemplates();
  const appTemplate = templateSet !== null ? templateSet.radioIndicator : null;
  return (appTemplate === null ? defaultRadioIndicatorTemplate : appTemplate).create();
}

export class RadioButton extends PressableLabeledControl {
  private indicatorPresenter: RadioIndicatorPresenter;
  private templateOverride: RadioIndicatorTemplate | null = null;
  private readonly valueText: string;
  private checkedValue: bool = false;
  private changedCallback: ((checked: bool) => void) | null = null;
  private ownerGroup: RadioGroup | null = null;

  constructor(value: string, label: string = value) {
    const indicatorPresenter = createIndicatorPresenter(null);
    super(SemanticRole.Radio, label, indicatorPresenter.root);
    this.indicatorPresenter = indicatorPresenter;
    this.valueText = value;
    this.semanticChecked(SemanticCheckedState.False);
    this.syncVisualState();
  }

  get value(): string {
    return this.valueText;
  }

  get checked(): bool {
    return this.checkedValue;
  }

  bindGroup(group: RadioGroup): this {
    this.ownerGroup = group;
    return this;
  }

  check(flag: bool): this {
    this.updateChecked(flag, false);
    return this;
  }

  template(template: RadioIndicatorTemplate | null): this {
    this.templateOverride = template;
    this.indicatorPresenter = createIndicatorPresenter(this.templateOverride);
    this.replaceIndicatorRoot(this.indicatorPresenter.root);
    this.syncVisualState();
    return this;
  }

  onChanged(callback: ((checked: bool) => void) | null): this {
    this.changedCallback = callback;
    return this;
  }

  _handleKeyEvent(eventType: KeyEventType, key: string, modifiers: u32): bool {
    const callbackHandled = super._handleKeyEvent(eventType, key, modifiers);
    if (!this.isEnabled || eventType != KeyEventType.Down || modifiers != 0) {
      return callbackHandled;
    }
    const group = this.ownerGroup;
    if (group === null) {
      return callbackHandled;
    }
    if (key == "ArrowLeft" || key == "ArrowUp") {
      group.moveSelectionFrom(this, -1);
      return true;
    }
    if (key == "ArrowRight" || key == "ArrowDown") {
      group.moveSelectionFrom(this, 1);
      return true;
    }
    if (key == "Home") {
      group.selectFirstEnabled(true);
      return true;
    }
    if (key == "End") {
      group.selectLastEnabled(true);
      return true;
    }
    return callbackHandled;
  }

  protected handleActivated(): void {
    const group = this.ownerGroup;
    if (group !== null) {
      group.selectRadio(this, true);
      return;
    }
    this.updateChecked(true, true);
  }

  protected syncVisualState(): void {
    this.indicatorPresenter.apply(
      activeTheme.value,
      new RadioIndicatorVisualState(
        this.checkedValue,
        this.hoveredState,
        this.pressedState,
        this.focusedState,
        this.isEnabled,
      ),
    );
  }

  updateChecked(flag: bool, emit: bool): void {
    if (this.checkedValue == flag) {
      return;
    }
    this.checkedValue = flag;
    this.semanticChecked(flag ? SemanticCheckedState.True : SemanticCheckedState.False);
    this.syncVisualState();
    if (emit) {
      this.requestSemanticAnnouncement();
      const callback = this.changedCallback;
      if (callback !== null) {
        callback(flag);
      }
    }
  }
}
