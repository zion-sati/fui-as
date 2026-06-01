import { warn } from "../core/Logger";

function sanitizePositive(owner: string, property: string, value: f32): f32 {
  if (value <= 0.0) {
    warn("Layout", owner + "." + property + "() received " + value.toString() + "; ignoring.");
    return 0.0;
  }
  return value;
}

export class LabeledControlSizing {
  private indicatorSizeValue: f32 = 0.0;
  private labelFontSizeValue: f32 = 0.0;

  indicatorSize(value: f32): this {
    this.indicatorSizeValue = sanitizePositive("LabeledControlSizing", "indicatorSize", value);
    return this;
  }

  labelFontSize(value: f32): this {
    this.labelFontSizeValue = sanitizePositive("LabeledControlSizing", "labelFontSize", value);
    return this;
  }

  get hasIndicatorSize(): bool {
    return this.indicatorSizeValue > 0.0;
  }

  get hasLabelFontSize(): bool {
    return this.labelFontSizeValue > 0.0;
  }

  get indicatorSizePx(): f32 {
    return this.indicatorSizeValue;
  }

  get labelFontSizePx(): f32 {
    return this.labelFontSizeValue;
  }
}

export class SliderSizing {
  private thumbSizeValue: f32 = 0.0;
  private trackThicknessValue: f32 = 0.0;

  thumbSize(value: f32): this {
    this.thumbSizeValue = sanitizePositive("SliderSizing", "thumbSize", value);
    return this;
  }

  trackThickness(value: f32): this {
    this.trackThicknessValue = sanitizePositive("SliderSizing", "trackThickness", value);
    return this;
  }

  get hasThumbSize(): bool {
    return this.thumbSizeValue > 0.0;
  }

  get hasTrackThickness(): bool {
    return this.trackThicknessValue > 0.0;
  }

  get thumbSizePx(): f32 {
    return this.thumbSizeValue;
  }

  get trackThicknessPx(): f32 {
    return this.trackThicknessValue;
  }
}

export class DropdownSizing {
  private fieldFontSizeValue: f32 = 0.0;
  private optionFontSizeValue: f32 = 0.0;
  private fieldHeightValue: f32 = 0.0;
  private optionHeightValue: f32 = 0.0;
  private chevronBoxSizeValue: f32 = 0.0;
  private chevronIconSizeValue: f32 = 0.0;

  fieldFontSize(value: f32): this {
    this.fieldFontSizeValue = sanitizePositive("DropdownSizing", "fieldFontSize", value);
    return this;
  }

  optionFontSize(value: f32): this {
    this.optionFontSizeValue = sanitizePositive("DropdownSizing", "optionFontSize", value);
    return this;
  }

  fieldHeight(value: f32): this {
    this.fieldHeightValue = sanitizePositive("DropdownSizing", "fieldHeight", value);
    return this;
  }

  optionHeight(value: f32): this {
    this.optionHeightValue = sanitizePositive("DropdownSizing", "optionHeight", value);
    return this;
  }

  chevronBoxSize(value: f32): this {
    this.chevronBoxSizeValue = sanitizePositive("DropdownSizing", "chevronBoxSize", value);
    return this;
  }

  chevronIconSize(value: f32): this {
    this.chevronIconSizeValue = sanitizePositive("DropdownSizing", "chevronIconSize", value);
    return this;
  }

  get hasFieldFontSize(): bool {
    return this.fieldFontSizeValue > 0.0;
  }

  get hasOptionFontSize(): bool {
    return this.optionFontSizeValue > 0.0;
  }

  get hasFieldHeight(): bool {
    return this.fieldHeightValue > 0.0;
  }

  get hasOptionHeight(): bool {
    return this.optionHeightValue > 0.0;
  }

  get hasChevronBoxSize(): bool {
    return this.chevronBoxSizeValue > 0.0;
  }

  get hasChevronIconSize(): bool {
    return this.chevronIconSizeValue > 0.0;
  }

  get fieldFontSizePx(): f32 {
    return this.fieldFontSizeValue;
  }

  get optionFontSizePx(): f32 {
    return this.optionFontSizeValue;
  }

  get fieldHeightPx(): f32 {
    return this.fieldHeightValue;
  }

  get optionHeightPx(): f32 {
    return this.optionHeightValue;
  }

  get chevronBoxSizePx(): f32 {
    return this.chevronBoxSizeValue;
  }

  get chevronIconSizePx(): f32 {
    return this.chevronIconSizeValue;
  }
}
