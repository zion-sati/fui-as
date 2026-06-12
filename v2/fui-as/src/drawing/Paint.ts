/**
 * Paint descriptor for DrawContext drawing operations.
 *
 * Models fill and stroke properties as a lightweight value type.
 * Color encoding is 0xRRGGBBAA (matching the repo's Color type).
 */
export class Paint {
  constructor(
    public fillColor: u32 = 0,       // 0xRRGGBBAA; 0 = transparent (no fill)
    public strokeColor: u32 = 0,     // 0xRRGGBBAA; 0 = no stroke
    public strokeWidth: f32 = 0,     // stroke width in logical pixels
  ) {}

  static fill(color: u32): Paint {
    return new Paint(color, 0, 0);
  }

  static stroke(color: u32, width: f32): Paint {
    return new Paint(0, color, width);
  }

  static filledStroke(fillColor: u32, strokeColor: u32, strokeWidth: f32): Paint {
    return new Paint(fillColor, strokeColor, strokeWidth);
  }

  /** Returns true if this paint produces any visible output. */
  hasFill(): bool {
    return (this.fillColor & 0xff) !== 0;
  }

  hasStroke(): bool {
    return this.strokeWidth > 0 && (this.strokeColor & 0xff) !== 0;
  }
}
