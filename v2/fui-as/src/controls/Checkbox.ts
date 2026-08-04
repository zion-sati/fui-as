import { Callback1, Handler1 } from "../core/BoundCallback";
import { SemanticCheckedState, SemanticRole } from "../core/ffi";
import { CheckboxChangedEventArgs, ClickEventArgs } from "../core/Node";
import { PersistedInt32Codec, PersistedValueState } from "../core/PersistedState";
import { bind1 } from "../core/bind";
import { LabeledControlSizing } from "./ControlSizing";
import { activeTheme } from "../core/Theme";
import { PressableLabeledControl } from "./internal/PressableLabeledControl";
import {
  CheckboxIndicatorPresenter,
  CheckboxIndicatorTemplate,
  CheckboxIndicatorVisualState,
  createDefaultCheckboxIndicatorPresenter,
} from "./internal/CheckboxIndicatorPresenter";
const CHECKBOX_PERSISTED_CODEC = new PersistedInt32Codec();

function clampPersistedCheckedState(value: i32): SemanticCheckedState {
  if (value == <i32>SemanticCheckedState.True) {
    return SemanticCheckedState.True;
  }
  if (value == <i32>SemanticCheckedState.Mixed) {
    return SemanticCheckedState.Mixed;
  }
  return SemanticCheckedState.False;
}

class PersistedCheckboxState extends PersistedValueState<Checkbox, i32> {
  constructor() {
    super("checkbox-checked-state", CHECKBOX_PERSISTED_CODEC, 1);
  }

  protected captureValue(node: Checkbox): i32 {
    return <i32>node.checkedState;
  }

  protected restoreValue(node: Checkbox, value: i32): void {
    node._applyPersistedCheckedState(clampPersistedCheckedState(value));
  }
}

const CHECKBOX_PERSISTED_STATE = new PersistedCheckboxState();

function createIndicatorPresenter(template: CheckboxIndicatorTemplate | null, sizing: LabeledControlSizing | null = null): CheckboxIndicatorPresenter {
  if (template !== null) {
    return template.create(sizing);
  }
  return createDefaultCheckboxIndicatorPresenter(sizing);
}

export class Checkbox extends PressableLabeledControl {
  private indicatorPresenter: CheckboxIndicatorPresenter;
  private templateOverride: CheckboxIndicatorTemplate | null = null;
  private sizingValue: LabeledControlSizing | null = null;
  private checkedStateValue: SemanticCheckedState = SemanticCheckedState.False;
  private triStateEnabled: bool = false;
  private changedCallback: ((event: CheckboxChangedEventArgs) => void) | null = null;
  private changedBinding: Callback1<CheckboxChangedEventArgs> | null = null;

  constructor(label: string) {
    const indicatorPresenter = createIndicatorPresenter(null);
    super(SemanticRole.Checkbox, label, indicatorPresenter.root);
    this.indicatorPresenter = indicatorPresenter;
    this.semanticChecked(this.checkedStateValue);
    this.syncVisualState();
    this.persistState(CHECKBOX_PERSISTED_STATE);
  }

  get checkedState(): SemanticCheckedState {
    return this.checkedStateValue;
  }

  get checked(): bool {
    return this.checkedStateValue == SemanticCheckedState.True;
  }

  triState(flag: bool = true): this {
    this.triStateEnabled = flag;
    if (!flag && this.checkedStateValue == SemanticCheckedState.Mixed) {
      this.setCheckedState(SemanticCheckedState.False, true, false);
    }
    return this;
  }

  check(flag: bool): this {
    this.setCheckedState(flag ? SemanticCheckedState.True : SemanticCheckedState.False, true, false);
    return this;
  }

  mixed(flag: bool): this {
    if (!this.triStateEnabled) {
      return this;
    }
    this.setCheckedState(flag ? SemanticCheckedState.Mixed : SemanticCheckedState.False, true, false);
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

  template(template: CheckboxIndicatorTemplate | null): this {
    this.templateOverride = template;
    this.indicatorPresenter = createIndicatorPresenter(this.templateOverride, this.sizingValue);
    this.replaceIndicatorRoot(this.indicatorPresenter.root);
    this.syncVisualState();
    return this;
  }

  onChanged(callback: ((event: CheckboxChangedEventArgs) => void) | null): this {
    this.changedCallback = callback;
    this.changedBinding = null;
    return this;
  }

  onClick(callback: (event: ClickEventArgs) => void): this {
    super.onClick(callback);
    return this;
  }

  bindClick<Owner>(owner: Owner, handler: Handler1<Owner, ClickEventArgs>): this {
    super.bindClick(owner, handler);
    return this;
  }

  onClickWith<Owner>(owner: Owner, handler: Handler1<Owner, ClickEventArgs>): this {
    super.onClickWith(owner, handler);
    return this;
  }

  bindChanged<Owner>(owner: Owner, handler: Handler1<Owner, CheckboxChangedEventArgs>): this {
    this.changedCallback = null;
    this.changedBinding = bind1<Owner, CheckboxChangedEventArgs>(owner, handler);
    return this;
  }

  onChangedWith<Owner>(owner: Owner, handler: Handler1<Owner, CheckboxChangedEventArgs>): this {
    this.bindChanged(owner, handler);
    return this;
  }

  protected handleActivated(): void {
    if (this.triStateEnabled) {
      if (this.checkedStateValue == SemanticCheckedState.False) {
        this.setCheckedState(SemanticCheckedState.True, true);
        return;
      }
      if (this.checkedStateValue == SemanticCheckedState.True) {
        this.setCheckedState(SemanticCheckedState.Mixed, true);
        return;
      }
      this.setCheckedState(SemanticCheckedState.False, true);
      return;
    }
    this.setCheckedState(
      this.checkedStateValue == SemanticCheckedState.True ? SemanticCheckedState.False : SemanticCheckedState.True,
      true,
    );
  }

  protected syncVisualState(): void {
    this.indicatorPresenter.apply(
      activeTheme.value,
      new CheckboxIndicatorVisualState(
        this.checkedStateValue,
        this.hoveredState,
        this.pressedState,
        this.focusedState,
        this.isEnabled,
      ),
      this.colorsValue,
    );
  }

  _applyPersistedCheckedState(next: SemanticCheckedState): void {
    this.setCheckedState(next, true, false);
  }

  private setCheckedState(next: SemanticCheckedState, emit: bool, announce: bool = emit): void {
    if (!this.triStateEnabled && next == SemanticCheckedState.Mixed) {
      next = SemanticCheckedState.False;
    }
    if (this.checkedStateValue == next) {
      return;
    }
    this.checkedStateValue = next;
    this.semanticChecked(next);
    this.syncVisualState();
    if (emit) {
      if (announce) {
        this.requestSemanticAnnouncement();
      }
      const event = new CheckboxChangedEventArgs(next);
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
    return this.templateOverride === null;
  }

}
