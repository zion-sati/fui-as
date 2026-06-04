export class SliderColors {
  private trackSet: bool = false;
  private trackValue: u32 = 0;

  private fillSet: bool = false;
  private fillValue: u32 = 0;

  private thumbSet: bool = false;
  private thumbValue: u32 = 0;

  track(color: u32): this {
    this.trackValue = color;
    this.trackSet = true;
    return this;
  }

  fill(color: u32): this {
    this.fillValue = color;
    this.fillSet = true;
    return this;
  }

  thumb(color: u32): this {
    this.thumbValue = color;
    this.thumbSet = true;
    return this;
  }

  get hasTrack(): bool { return this.trackSet; }
  get trackColor(): u32 { return this.trackValue; }

  get hasFill(): bool { return this.fillSet; }
  get fillColor(): u32 { return this.fillValue; }

  get hasThumb(): bool { return this.thumbSet; }
  get thumbColor(): u32 { return this.thumbValue; }
}
