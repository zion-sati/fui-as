import { AnimationTiming } from "./Animation";

export class NodeTransitions {
  private opacityTimingValue: AnimationTiming | null = null;
  private backgroundColorTimingValue: AnimationTiming | null = null;
  private scrollOffsetTimingValue: AnimationTiming | null = null;

  opacity(timing: AnimationTiming | null): this {
    this.opacityTimingValue = timing;
    return this;
  }

  bgColor(timing: AnimationTiming | null): this {
    this.backgroundColorTimingValue = timing;
    return this;
  }

  scrollOffset(timing: AnimationTiming | null): this {
    this.scrollOffsetTimingValue = timing;
    return this;
  }

  get opacityTiming(): AnimationTiming | null {
    return this.opacityTimingValue;
  }

  get backgroundColorTiming(): AnimationTiming | null {
    return this.backgroundColorTimingValue;
  }

  get scrollOffsetTiming(): AnimationTiming | null {
    return this.scrollOffsetTimingValue;
  }
}
