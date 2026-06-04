export class DropdownColors {
  private backgroundSet: bool = false;
  private backgroundValue: u32 = 0;

  private textPrimarySet: bool = false;
  private textPrimaryValue: u32 = 0;

  private placeholderSet: bool = false;
  private placeholderValue: u32 = 0;

  private borderSet: bool = false;
  private borderValue: u32 = 0;

  private accentSet: bool = false;
  private accentValue: u32 = 0;

  background(color: u32): this {
    this.backgroundValue = color;
    this.backgroundSet = true;
    return this;
  }

  textPrimary(color: u32): this {
    this.textPrimaryValue = color;
    this.textPrimarySet = true;
    return this;
  }

  placeholder(color: u32): this {
    this.placeholderValue = color;
    this.placeholderSet = true;
    return this;
  }

  border(color: u32): this {
    this.borderValue = color;
    this.borderSet = true;
    return this;
  }

  accent(color: u32): this {
    this.accentValue = color;
    this.accentSet = true;
    return this;
  }

  get hasBackground(): bool { return this.backgroundSet; }
  get backgroundColor(): u32 { return this.backgroundValue; }

  get hasTextPrimary(): bool { return this.textPrimarySet; }
  get textPrimaryColor(): u32 { return this.textPrimaryValue; }

  get hasPlaceholder(): bool { return this.placeholderSet; }
  get placeholderColor(): u32 { return this.placeholderValue; }

  get hasBorder(): bool { return this.borderSet; }
  get borderColor(): u32 { return this.borderValue; }

  get hasAccent(): bool { return this.accentSet; }
  get accentColor(): u32 { return this.accentValue; }
}
