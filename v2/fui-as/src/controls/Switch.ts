import { Callback1, Handler1 } from "../core/BoundCallback";
import { SemanticCheckedState, SemanticRole } from "../core/ffi";
import { SwitchChangedEventArgs } from "../core/Node";
import { PersistedBoolCodec, PersistedValueState } from "../core/PersistedState";
import { bind1 } from "../core/bind";
import { activeTheme } from "../core/Theme";
import { LabeledControlSizing } from "./ControlSizing";
import { getControlTemplates } from "./ControlTemplateSet";
import { PressableLabeledControl } from "./internal/PressableLabeledControl";
import {
  defaultSwitchIndicatorTemplate,
  SwitchIndicatorPresenter,
  SwitchIndicatorTemplate,
  SwitchIndicatorVisualState,
} from "./internal/SwitchIndicatorPresenter";

const SWITCH_PERSISTED_CODEC = new PersistedBoolCodec();

class PersistedSwitchState extends PersistedValueState<Switch, bool> {
  constructor() {
    super("switch-checked", SWITCH_PERSISTED_CODEC, 1);
  }

  protected captureValue(node: Switch): bool {
    return node.checked;
  }

  protected restoreValue(node: Switch, value: bool): void {
    node._applyPersistedChecked(value);
  }
}

const SWITCH_PERSISTED_STATE = new PersistedSwitchState();

function createIndicatorPresenter(template: SwitchIndicatorTemplate | null, sizing: LabeledControlSizing | null = null): SwitchIndicatorPresenter {
  if (template !== null) {
    return template.create(sizing);
  }
  const templateSet = getControlTemplates();
  const appTemplate = templateSet !== null ? templateSet.switchIndicator : null;
  return (appTemplate === null ? defaultSwitchIndicatorTemplate : appTemplate).create(sizing);
}

export class Switch extends PressableLabeledControl {
  private indicatorPresenter: SwitchIndicatorPresenter;
  private templateOverride: SwitchIndicatorTemplate | null = null;
  private sizingValue: LabeledControlSizing | null = null;
  private checkedValue: bool = false;
  private changedCallback: ((event: SwitchChangedEventArgs) => void) | null = null;
  private changedBinding: Callback1<SwitchChangedEventArgs> | null = null;

  constructor(label: string) {
    const indicatorPresenter = createIndicatorPresenter(null, null);
    super(SemanticRole.Switch, label, indicatorPresenter.root);
    this.indicatorPresenter = indicatorPresenter;
    this.semanticChecked(SemanticCheckedState.False);
    this.syncVisualState();
    this.persistState(SWITCH_PERSISTED_STATE);
  }

  get checked(): bool {
    return this.checkedValue;
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

  template(template: SwitchIndicatorTemplate | null): this {
    this.templateOverride = template;
    this.indicatorPresenter = createIndicatorPresenter(this.templateOverride, this.sizingValue);
    this.replaceIndicatorRoot(this.indicatorPresenter.root);
    this.syncVisualState();
    return this;
  }

  onChanged(callback: ((event: SwitchChangedEventArgs) => void) | null): this {
    this.changedCallback = callback;
    this.changedBinding = null;
    return this;
  }

  bindChanged<Owner>(owner: Owner, handler: Handler1<Owner, SwitchChangedEventArgs>): this {
    this.changedCallback = null;
    this.changedBinding = bind1<Owner, SwitchChangedEventArgs>(owner, handler);
    return this;
  }

  onChangedWith<Owner>(owner: Owner, handler: Handler1<Owner, SwitchChangedEventArgs>): this {
    this.bindChanged(owner, handler);
    return this;
  }

  protected handleActivated(): void {
    this.updateChecked(!this.checkedValue, true);
  }

  protected syncVisualState(): void {
    this.indicatorPresenter.apply(
      activeTheme.value,
      new SwitchIndicatorVisualState(
        this.checkedValue,
        this.hoveredState,
        this.pressedState,
        this.focusedState,
        this.isEnabled,
      ),
      this.colorsValue,
    );
  }

  _applyPersistedChecked(next: bool): void {
    this.updateChecked(next, true, false);
  }

  private updateChecked(next: bool, emit: bool, announce: bool = emit): void {
    if (this.checkedValue == next) {
      return;
    }
    this.checkedValue = next;
    this.semanticChecked(next ? SemanticCheckedState.True : SemanticCheckedState.False);
    this.syncVisualState();
    if (emit) {
      if (announce) {
        this.requestSemanticAnnouncement();
      }
      const event = new SwitchChangedEventArgs(next);
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
}
