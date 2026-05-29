import { Checkbox, RadioButton, RadioGroup, Slider, Switch, Unit } from "../../../../src/Fui";

export class DemoCheckbox extends Checkbox {
  constructor(label: string, fullWidth: bool = false) {
    super(label);
    if (fullWidth) {
      this.width(100.0, Unit.Percent);
    }
  }

  fullWidth(flag: bool = true): this {
    if (flag) {
      this.width(100.0, Unit.Percent);
    }
    return this;
  }
}

export class DemoSwitch extends Switch {
  constructor(label: string, fullWidth: bool = false) {
    super(label);
    if (fullWidth) {
      this.width(100.0, Unit.Percent);
    }
  }

  fullWidth(flag: bool = true): this {
    if (flag) {
      this.width(100.0, Unit.Percent);
    }
    return this;
  }
}

export class DemoRadioButton extends RadioButton {
  constructor(value: string, label: string = value, fullWidth: bool = false) {
    super(value, label);
    if (fullWidth) {
      this.width(100.0, Unit.Percent);
    }
  }

  fullWidth(flag: bool = true): this {
    if (flag) {
      this.width(100.0, Unit.Percent);
    }
    return this;
  }
}

export class DemoRadioGroup extends RadioGroup {
  constructor(fullWidth: bool = false) {
    super();
    if (fullWidth) {
      this.width(100.0, Unit.Percent);
    }
  }

  fullWidth(flag: bool = true): this {
    if (flag) {
      this.width(100.0, Unit.Percent);
    }
    return this;
  }
}

export class DemoSlider extends Slider {
  constructor(value: f32 = 0.0) {
    super(value);
  }
}
