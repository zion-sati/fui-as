import { Callback1, Handler1 } from "../core/BoundCallback";
import { KeyEventType, SemanticCheckedState, SemanticRole } from "../core/ffi";
import { RadioButtonChangedEventArgs } from "../core/Node";
import { activeTheme } from "../core/Theme";
import { bind1 } from "../core/bind";
import { LabeledControlSizing } from "./ControlSizing";
import { PressableLabeledControl } from "./internal/PressableLabeledControl";
import { getControlTemplates } from "./ControlTemplateSet";
import { RadioGroup } from "./RadioGroup";
import {
  createDefaultRadioIndicatorPresenter,
  RadioIndicatorPresenter,
  RadioIndicatorTemplate,
  RadioIndicatorVisualState,
} from "./internal/RadioIndicatorPresenter";

function createIndicatorPresenter(template: RadioIndicatorTemplate | null, sizing: LabeledControlSizing | null = null): RadioIndicatorPresenter {
  if (template !== null) {
    return template.create(sizing);
  }
  const templateSet = getControlTemplates();
  const appTemplate = templateSet !== null ? templateSet.radioIndicator : null;
  return appTemplate === null
    ? createDefaultRadioIndicatorPresenter(sizing)
    : appTemplate.create(sizing);
}

export class RadioButton extends PressableLabeledControl {
  private indicatorPresenter: RadioIndicatorPresenter;
  private templateOverride: RadioIndicatorTemplate | null = null;
  private sizingValue: LabeledControlSizing | null = null;
  private readonly valueText: string;
  private checkedValue: bool = false;
  private changedCallback: ((event: RadioButtonChangedEventArgs) => void) | null = null;
  private changedBinding: Callback1<RadioButtonChangedEventArgs> | null = null;
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
    this.updateChecked(flag, true, false);
    return this;
  }

  sizing(sizing: LabeledControlSizing | null): this {
    this.sizingValue = sizing;
    this.setLabelFontSizeOverride(
      sizing !== null && sizing.hasLabelFontSize ? sizing.labelFontSizePx : 0.0,
    );
    this.indicatorPresenter = createIndicatorPresenter(this.templateOverride, this.sizingValue);
    this.replaceIndicatorRoot(this.indicatorPresenter.root);
    this.syncVisualState();
    return this;
  }

  template(template: RadioIndicatorTemplate | null): this {
    this.templateOverride = template;
    this.indicatorPresenter = createIndicatorPresenter(this.templateOverride, this.sizingValue);
    this.replaceIndicatorRoot(this.indicatorPresenter.root);
    this.syncVisualState();
    return this;
  }

  onChanged(callback: ((event: RadioButtonChangedEventArgs) => void) | null): this {
    this.changedCallback = callback;
    this.changedBinding = null;
    return this;
  }

  bindChanged<Owner>(owner: Owner, handler: Handler1<Owner, RadioButtonChangedEventArgs>): this {
    this.changedCallback = null;
    this.changedBinding = bind1<Owner, RadioButtonChangedEventArgs>(owner, handler);
    return this;
  }

  onChangedWith<Owner>(owner: Owner, handler: Handler1<Owner, RadioButtonChangedEventArgs>): this {
    this.bindChanged(owner, handler);
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
      this.colorsValue,
    );
  }

  updateChecked(flag: bool, emit: bool, announce: bool = emit): void {
    if (this.checkedValue == flag) {
      return;
    }
    this.checkedValue = flag;
    this.semanticChecked(flag ? SemanticCheckedState.True : SemanticCheckedState.False);
    this.syncVisualState();
    if (emit) {
      if (announce) {
        this.requestSemanticAnnouncement();
      }
      const event = new RadioButtonChangedEventArgs(flag);
      const callback = this.changedCallback;
      if (callback !== null) {
        callback(event);
      }
      const binding = this.changedBinding;
      if (binding !== null) {
        binding.invoke(event);
      }
    }
  }

  private usesDefaultIndicatorPresenter(): bool {
    if (this.templateOverride !== null) {
      return false;
    }
    const templateSet = getControlTemplates();
    return templateSet === null || templateSet.radioIndicator === null;
  }
}
