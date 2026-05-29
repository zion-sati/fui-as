import { Callback1, Handler1 } from "../core/BoundCallback";
import { SemanticCheckedState, SemanticRole } from "../core/ffi";
import { PersistedBoolCodec, PersistedValueState } from "../core/PersistedState";
import { bind1 } from "../core/bind";
import { activeTheme } from "../core/Theme";
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

function createIndicatorPresenter(template: SwitchIndicatorTemplate | null): SwitchIndicatorPresenter {
  if (template !== null) {
    return template.create();
  }
  const templateSet = getControlTemplates();
  const appTemplate = templateSet !== null ? templateSet.switchIndicator : null;
  return (appTemplate === null ? defaultSwitchIndicatorTemplate : appTemplate).create();
}

export class Switch extends PressableLabeledControl {
  private indicatorPresenter: SwitchIndicatorPresenter;
  private templateOverride: SwitchIndicatorTemplate | null = null;
  private checkedValue: bool = false;
  private changedCallback: ((checked: bool) => void) | null = null;
  private changedBinding: Callback1<bool> | null = null;

  constructor(label: string) {
    const indicatorPresenter = createIndicatorPresenter(null);
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
    this.updateChecked(flag, false);
    return this;
  }

  template(template: SwitchIndicatorTemplate | null): this {
    this.templateOverride = template;
    this.indicatorPresenter = createIndicatorPresenter(this.templateOverride);
    this.replaceIndicatorRoot(this.indicatorPresenter.root);
    this.syncVisualState();
    return this;
  }

  onChanged(callback: ((checked: bool) => void) | null): this {
    this.changedCallback = callback;
    this.changedBinding = null;
    return this;
  }

  bindChanged<Owner>(owner: Owner, handler: Handler1<Owner, bool>): this {
    this.changedCallback = null;
    this.changedBinding = bind1<Owner, bool>(owner, handler);
    return this;
  }

  onChangedWith<Owner>(owner: Owner, handler: Handler1<Owner, bool>): this {
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
    );
  }

  _applyPersistedChecked(next: bool): void {
    this.updateChecked(next, true);
  }

  private updateChecked(next: bool, emit: bool): void {
    if (this.checkedValue == next) {
      return;
    }
    this.checkedValue = next;
    this.semanticChecked(next ? SemanticCheckedState.True : SemanticCheckedState.False);
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
