export class LabeledControlColors {
  private textPrimarySet: bool = false;
  private textPrimaryValue: u32 = 0;

  private textMutedSet: bool = false;
  private textMutedValue: u32 = 0;

  textPrimary(color: u32): this {
    this.textPrimaryValue = color;
    this.textPrimarySet = true;
    return this;
  }

  textMuted(color: u32): this {
    this.textMutedValue = color;
    this.textMutedSet = true;
    return this;
  }

  get hasTextPrimary(): bool { return this.textPrimarySet; }
  get textPrimaryColor(): u32 { return this.textPrimaryValue; }

  get hasTextMuted(): bool { return this.textMutedSet; }
  get textMutedColor(): u32 { return this.textMutedValue; }
}
