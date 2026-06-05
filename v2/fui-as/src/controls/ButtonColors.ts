export class ButtonColors {
  private backgroundSet: bool = false;
  private backgroundValue: u32 = 0;

  private backgroundHoverSet: bool = false;
  private backgroundHoverValue: u32 = 0;

  private backgroundPressedSet: bool = false;
  private backgroundPressedValue: u32 = 0;

  private textPrimarySet: bool = false;
  private textPrimaryValue: u32 = 0;

  private textMutedSet: bool = false;
  private textMutedValue: u32 = 0;

  private borderSet: bool = false;
  private borderValue: u32 = 0;

  background(color: u32): this {
    this.backgroundValue = color;
    this.backgroundSet = true;
    return this;
  }

  backgroundHover(color: u32): this {
    this.backgroundHoverValue = color;
    this.backgroundHoverSet = true;
    return this;
  }

  backgroundPressed(color: u32): this {
    this.backgroundPressedValue = color;
    this.backgroundPressedSet = true;
    return this;
  }

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

  border(color: u32): this {
    this.borderValue = color;
    this.borderSet = true;
    return this;
  }

  get hasBackground(): bool { return this.backgroundSet; }
  get backgroundColor(): u32 { return this.backgroundValue; }

  get hasBackgroundHover(): bool { return this.backgroundHoverSet; }
  get backgroundHoverColor(): u32 { return this.backgroundHoverValue; }

  get hasBackgroundPressed(): bool { return this.backgroundPressedSet; }
  get backgroundPressedColor(): u32 { return this.backgroundPressedValue; }

  get hasTextPrimary(): bool { return this.textPrimarySet; }
  get textPrimaryColor(): u32 { return this.textPrimaryValue; }

  get hasTextMuted(): bool { return this.textMutedSet; }
  get textMutedColor(): u32 { return this.textMutedValue; }

  get hasBorder(): bool { return this.borderSet; }
  get borderColor(): u32 { return this.borderValue; }
}
