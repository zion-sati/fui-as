import { Callback1, Handler1 } from "../core/BoundCallback";
import { SemanticCheckedState, SemanticRole } from "../core/ffi";
import { PersistedInt32Codec, PersistedValueState } from "../core/PersistedState";
import { bind1 } from "../core/bind";
import { getControlTemplates } from "./ControlTemplateSet";
import { activeTheme } from "../core/Theme";
import { PressableLabeledControl } from "./internal/PressableLabeledControl";
import {
  CheckboxIndicatorPresenter,
  CheckboxIndicatorTemplate,
  CheckboxIndicatorVisualState,
  defaultCheckboxIndicatorTemplate,
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

function createIndicatorPresenter(template: CheckboxIndicatorTemplate | null): CheckboxIndicatorPresenter {
  if (template !== null) {
    return template.create();
  }
  const templateSet = getControlTemplates();
  const appTemplate = templateSet !== null ? templateSet.checkboxIndicator : null;
  return (appTemplate === null ? defaultCheckboxIndicatorTemplate : appTemplate).create();
}

export class Checkbox extends PressableLabeledControl {
  private indicatorPresenter: CheckboxIndicatorPresenter;
  private templateOverride: CheckboxIndicatorTemplate | null = null;
  private checkedStateValue: SemanticCheckedState = SemanticCheckedState.False;
  private triStateEnabled: bool = false;
  private changedCallback: ((state: SemanticCheckedState) => void) | null = null;
  private changedBinding: Callback1<SemanticCheckedState> | null = null;

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
      this.setCheckedState(SemanticCheckedState.False, false);
    }
    return this;
  }

  check(flag: bool): this {
    this.setCheckedState(flag ? SemanticCheckedState.True : SemanticCheckedState.False, false);
    return this;
  }

  mixed(flag: bool): this {
    if (!this.triStateEnabled) {
      return this;
    }
    this.setCheckedState(flag ? SemanticCheckedState.Mixed : SemanticCheckedState.False, false);
    return this;
  }

  template(template: CheckboxIndicatorTemplate | null): this {
    this.templateOverride = template;
    this.indicatorPresenter = createIndicatorPresenter(this.templateOverride);
    this.replaceIndicatorRoot(this.indicatorPresenter.root);
    this.syncVisualState();
    return this;
  }

  onChanged(callback: ((state: SemanticCheckedState) => void) | null): this {
    this.changedCallback = callback;
    this.changedBinding = null;
    return this;
  }

  bindChanged<Owner>(owner: Owner, handler: Handler1<Owner, SemanticCheckedState>): this {
    this.changedCallback = null;
    this.changedBinding = bind1<Owner, SemanticCheckedState>(owner, handler);
    return this;
  }

  onChangedWith<Owner>(owner: Owner, handler: Handler1<Owner, SemanticCheckedState>): this {
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
    );
  }

  _applyPersistedCheckedState(next: SemanticCheckedState): void {
    this.setCheckedState(next, true);
  }

  private setCheckedState(next: SemanticCheckedState, emit: bool): void {
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
      this.requestSemanticAnnouncement();
      const callback = this.changedCallback;
      if (callback !== null) {
        callback(next);
      }
      const binding = this.changedBinding;
      if (binding !== null) {
        binding.invoke(next);
      }
    }
  }

}
