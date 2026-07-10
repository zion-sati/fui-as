import { Callback1, Handler1 } from "../core/BoundCallback";
import { FlexDirection, SemanticRole } from "../core/ffi";
import { RadioGroupChangedEventArgs } from "../core/Node";
import { PersistedInt32Codec, PersistedValueState } from "../core/PersistedState";
import { bind1 } from "../core/bind";
import { warn } from "../core/Logger";
import { FlexBox } from "../nodes";
import { RadioButton } from "./RadioButton";

const RADIO_GROUP_PERSISTED_CODEC = new PersistedInt32Codec();

class PersistedRadioGroupState extends PersistedValueState<RadioGroup, i32> {
  constructor() {
    super("radio-group-selected-index", RADIO_GROUP_PERSISTED_CODEC, 1);
  }

  protected shouldCaptureValue(node: RadioGroup): bool {
    return node.selectedIndex >= 0;
  }

  protected captureValue(node: RadioGroup): i32 {
    return node.selectedIndex;
  }

  protected restoreValue(node: RadioGroup, value: i32): void {
    node._applyPersistedSelectedIndex(value);
  }
}

const RADIO_GROUP_PERSISTED_STATE = new PersistedRadioGroupState();

export class RadioGroup extends FlexBox {
  private readonly radios: Array<RadioButton> = new Array<RadioButton>();
  private selectedIndexValue: i32 = -1;
  private changedCallback: ((event: RadioGroupChangedEventArgs) => void) | null = null;
  private changedBinding: Callback1<RadioGroupChangedEventArgs> | null = null;

  constructor() {
    super();
    this.semanticRole(SemanticRole.RadioGroup);
    this.flexDirection(FlexDirection.Column);
    this.persistState(RADIO_GROUP_PERSISTED_STATE);
  }

  get selectedIndex(): i32 {
    return this.selectedIndexValue;
  }

  get selectedValue(): string {
    if (this.selectedIndexValue < 0 || this.selectedIndexValue >= this.radios.length) {
      return "";
    }
    return unchecked(this.radios[this.selectedIndexValue]).value;
  }

  addRadio(radio: RadioButton): this {
    radio.bindGroup(this);
    this.radios.push(radio);
    this.addChildNode(radio);
    if (this.selectedIndexValue < 0 && radio.checked) {
      this.selectedIndexValue = this.radios.length - 1;
    }
    return this;
  }

  addOption(value: string, label: string = value): RadioButton {
    const radio = new RadioButton(value, label);
    this.addRadio(radio);
    return radio;
  }

  addOptions(radios: RadioButton[]): this {
    for (let index = 0; index < radios.length; ++index) {
      this.addRadio(radios[index]);
    }
    return this;
  }

  onChanged(callback: ((event: RadioGroupChangedEventArgs) => void) | null): this {
    this.changedCallback = callback;
    this.changedBinding = null;
    return this;
  }

  bindChanged<Owner>(owner: Owner, handler: Handler1<Owner, RadioGroupChangedEventArgs>): this {
    this.changedCallback = null;
    this.changedBinding = bind1<Owner, RadioGroupChangedEventArgs>(owner, handler);
    return this;
  }

  onChangedWith<Owner>(owner: Owner, handler: Handler1<Owner, RadioGroupChangedEventArgs>): this {
    this.bindChanged(owner, handler);
    return this;
  }

  selectRadio(radio: RadioButton, focus: bool): void {
    const index = this.indexOfRadio(radio);
    if (index >= 0) {
      this.selectIndexInternal(index, focus, true, true);
    }
  }

  moveSelectionFrom(radio: RadioButton, delta: i32): void {
    const startIndex = this.indexOfRadio(radio);
    if (startIndex < 0 || this.radios.length == 0) {
      return;
    }
    const nextIndex = this.findEnabledIndex(startIndex, delta);
    if (nextIndex >= 0) {
      this.selectIndexInternal(nextIndex, true, true, true);
    }
  }

  selectFirstEnabled(focus: bool): void {
    const nextIndex = this.findBoundaryIndex(true);
    if (nextIndex >= 0) {
      this.selectIndexInternal(nextIndex, focus, true, true);
    }
  }

  selectLastEnabled(focus: bool): void {
    const nextIndex = this.findBoundaryIndex(false);
    if (nextIndex >= 0) {
      this.selectIndexInternal(nextIndex, focus, true, true);
    }
  }

  selectIndex(index: i32): this {
    if (index == -1) {
      const changed = this.selectedIndexValue != -1;
      if (this.selectedIndexValue >= 0 && this.selectedIndexValue < this.radios.length) {
        unchecked(this.radios[this.selectedIndexValue]).updateChecked(false, true, false);
      }
      this.selectedIndexValue = -1;
      if (changed) {
        const event = new RadioGroupChangedEventArgs("");
        const callback = this.changedCallback;
        if (callback !== null) {
          callback(event);
        }
        const binding = this.changedBinding;
        if (binding !== null) {
          binding.invoke(event);
        }
      }
      return this;
    }
    if (this.radios.length == 0) {
      if (index != -1) {
        warn("Layout", "RadioGroup.selectIndex() received " + index.toString() + " before any radios were added.");
      }
      return this;
    }
    const clampedIndex = index < 0
      ? 0
      : (index >= this.radios.length ? this.radios.length - 1 : index);
    if (clampedIndex != index) {
      warn(
        "Layout",
        "RadioGroup.selectIndex() received " +
          index.toString() +
          "; clamping to " +
          clampedIndex.toString() +
          ".",
      );
    }
    this.selectIndexInternal(clampedIndex, false, true, false);
    return this;
  }

  _applyPersistedSelectedIndex(index: i32): void {
    if (index < 0) {
      return;
    }
    this.selectIndexInternal(index, false, true, false);
  }

  private selectIndexInternal(index: i32, focus: bool, emit: bool, announce: bool = emit): void {
    if (index < 0 || index >= this.radios.length) {
      return;
    }
    const radio = unchecked(this.radios[index]);
    if (!radio.isEnabled) {
      return;
    }
    if (this.selectedIndexValue == index) {
      if (focus) {
        radio.focusNow();
      }
      return;
    }
    if (this.selectedIndexValue >= 0 && this.selectedIndexValue < this.radios.length) {
      unchecked(this.radios[this.selectedIndexValue]).updateChecked(false, emit, false);
    }
    this.selectedIndexValue = index;
    radio.updateChecked(true, emit, announce);
    if (focus) {
      radio.focusNow();
    }
    if (emit) {
      const event = new RadioGroupChangedEventArgs(radio.value);
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

  private indexOfRadio(target: RadioButton): i32 {
    for (let index = 0; index < this.radios.length; ++index) {
      if (unchecked(this.radios[index]) === target) {
        return index;
      }
    }
    return -1;
  }

  private findEnabledIndex(startIndex: i32, delta: i32): i32 {
    if (this.radios.length == 0) {
      return -1;
    }
    let cursor = startIndex;
    for (let step = 0; step < this.radios.length; ++step) {
      cursor += delta;
      if (cursor < 0) {
        cursor = this.radios.length - 1;
      } else if (cursor >= this.radios.length) {
        cursor = 0;
      }
      if (unchecked(this.radios[cursor]).isEnabled) {
        return cursor;
      }
    }
    return -1;
  }

  private findBoundaryIndex(first: bool): i32 {
    if (first) {
      for (let index = 0; index < this.radios.length; ++index) {
        if (unchecked(this.radios[index]).isEnabled) {
          return index;
        }
      }
      return -1;
    }
    for (let index = this.radios.length - 1; index >= 0; --index) {
      if (unchecked(this.radios[index]).isEnabled) {
        return index;
      }
    }
    return -1;
  }
}
