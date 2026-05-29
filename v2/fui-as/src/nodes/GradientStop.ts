export class GradientStop {
  offset: f32;
  color: u32;

  constructor(offset: f32, color: u32) {
    this.offset = offset;
    this.color = color;
  }
}
