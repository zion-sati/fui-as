import { mixColor } from "../color";
import { Handler1 } from "./BoundCallback";
import { Disposable } from "./Disposable";
import { markNeedsCommit } from "./FrameScheduler";

const MAX_FRAME_DELTA_MS: f64 = 100.0;

function clampUnit(value: f32): f32 {
  if (value < 0.0) {
    return 0.0;
  }
  if (value > 1.0) {
    return 1.0;
  }
  return value;
}

function clampFrameDelta(deltaMs: f64): f64 {
  if (deltaMs < 0.0) {
    return 0.0;
  }
  if (deltaMs > MAX_FRAME_DELTA_MS) {
    return MAX_FRAME_DELTA_MS;
  }
  return deltaMs;
}

function mixFloat(from: f32, to: f32, amount: f32): f32 {
  return from + ((to - from) * clampUnit(amount));
}

export abstract class Easing {
  abstract sample(progress: f32): f32;
}

export class LinearEasing extends Easing {
  sample(progress: f32): f32 {
    return clampUnit(progress);
  }
}

export class CubicInEasing extends Easing {
  sample(progress: f32): f32 {
    const t = clampUnit(progress);
    return t * t * t;
  }
}

export class CubicOutEasing extends Easing {
  sample(progress: f32): f32 {
    const t = clampUnit(progress) - 1.0;
    return (t * t * t) + 1.0;
  }
}

export class CubicInOutEasing extends Easing {
  sample(progress: f32): f32 {
    const t = clampUnit(progress);
    if (t < 0.5) {
      return 4.0 * t * t * t;
    }
    const offset = (-2.0 * t) + 2.0;
    return <f32>(1.0 - ((offset * offset * offset) * 0.5));
  }
}

export class QuadOutEasing extends Easing {
  sample(progress: f32): f32 {
    const t = 1.0 - clampUnit(progress);
    return <f32>(1.0 - (t * t));
  }
}

const LINEAR_EASING: Easing = new LinearEasing();
const CUBIC_IN_EASING: Easing = new CubicInEasing();
const CUBIC_OUT_EASING: Easing = new CubicOutEasing();
const CUBIC_IN_OUT_EASING: Easing = new CubicInOutEasing();
const QUAD_OUT_EASING: Easing = new QuadOutEasing();

export class Easings {
  static readonly linear: Easing = LINEAR_EASING;
  static readonly cubicIn: Easing = CUBIC_IN_EASING;
  static readonly cubicOut: Easing = CUBIC_OUT_EASING;
  static readonly cubicInOut: Easing = CUBIC_IN_OUT_EASING;
  static readonly quadOut: Easing = QUAD_OUT_EASING;
}

export class AnimationTiming {
  readonly durationMs: f64;
  readonly easing: Easing;

  constructor(durationMs: f64, easing: Easing = LINEAR_EASING) {
    this.durationMs = durationMs > 0.0 ? durationMs : 0.0;
    this.easing = easing;
  }
}

export abstract class Animation implements Disposable {
  private managerValue: AnimationManager | null = null;
  private runningValue: bool = false;
  private startedValue: bool = false;
  private lastTimestampMs: f64 = 0.0;
  private elapsedMs: f64 = 0.0;

  protected constructor(readonly timing: AnimationTiming) {}

  get isRunning(): bool {
    return this.runningValue;
  }

  cancel(): void {
    const manager = this.managerValue;
    if (manager !== null) {
      manager.cancel(this);
      return;
    }
    this._cancel();
  }

  finish(): void {
    const manager = this.managerValue;
    if (manager !== null) {
      manager.finish(this);
      return;
    }
    this._finish();
  }

  dispose(): void {
    this.cancel();
  }

  protected onStart(_timestampMs: f64): void {}

  protected abstract onSample(easedProgress: f32, linearProgress: f32): void;

  protected onStop(_finished: bool): void {}

  _attach(manager: AnimationManager, knownTimestampMs: f64, hasKnownTimestamp: bool): void {
    this.managerValue = manager;
    this.runningValue = true;
    this.startedValue = false;
    this.lastTimestampMs = 0.0;
    this.elapsedMs = 0.0;
    if (hasKnownTimestamp) {
      this.startInternal(knownTimestampMs);
    }
  }

  _tick(timestampMs: f64): void {
    if (!this.runningValue) {
      return;
    }
    if (!this.startedValue) {
      this.startInternal(timestampMs);
      return;
    }
    const durationMs = this.timing.durationMs;
    const deltaMs = clampFrameDelta(timestampMs - this.lastTimestampMs);
    this.lastTimestampMs = timestampMs;
    this.elapsedMs += deltaMs;
    const linearProgress = durationMs <= 0.0
      ? <f32>1.0
      : clampUnit(<f32>(this.elapsedMs / durationMs));
    this.onSample(this.timing.easing.sample(linearProgress), linearProgress);
    if (linearProgress >= 1.0) {
      this.stop(true);
    }
  }

  _cancel(): void {
    if (!this.runningValue) {
      return;
    }
    this.stop(false);
  }

  _finish(): void {
    if (!this.runningValue) {
      return;
    }
    if (!this.startedValue) {
      this.startedValue = true;
      this.lastTimestampMs = 0.0;
      this.elapsedMs = this.timing.durationMs;
      this.onStart(0.0);
    }
    this.onSample(1.0, 1.0);
    this.stop(true);
  }

  private startInternal(timestampMs: f64): void {
    this.startedValue = true;
    this.lastTimestampMs = timestampMs;
    this.elapsedMs = 0.0;
    this.onStart(timestampMs);
    if (this.timing.durationMs <= 0.0) {
      this.onSample(1.0, 1.0);
      this.stop(true);
      return;
    }
    this.onSample(this.timing.easing.sample(0.0), 0.0);
  }

  private stop(finished: bool): void {
    this.runningValue = false;
    this.managerValue = null;
    this.onStop(finished);
  }
}

export class AnimationManager {
  private readonly activeAnimations: Array<Animation> = new Array<Animation>();
  private lastTimestampMs: f64 = 0.0;
  private hasLastTimestamp: bool = false;

  start(animation: Animation): Animation {
    this.cancel(animation);
    animation._attach(this, this.lastTimestampMs, this.hasLastTimestamp);
    if (animation.isRunning) {
      this.activeAnimations.push(animation);
    }
    markNeedsCommit();
    return animation;
  }

  cancel(animation: Animation): void {
    const index = this.indexOf(animation);
    if (index < 0) {
      return;
    }
    this.removeAt(index);
    animation._cancel();
  }

  finish(animation: Animation): void {
    const index = this.indexOf(animation);
    if (index < 0) {
      return;
    }
    this.removeAt(index);
    animation._finish();
  }

  tick(timestampMs: f64): void {
    this.lastTimestampMs = timestampMs;
    this.hasLastTimestamp = true;
    let hasActive = false;
    for (let index = this.activeAnimations.length - 1; index >= 0; --index) {
      const animation = unchecked(this.activeAnimations[index]);
      animation._tick(timestampMs);
      if (!animation.isRunning) {
        this.removeAt(index);
        continue;
      }
      hasActive = true;
    }
    if (hasActive) {
      markNeedsCommit();
    }
  }

  hasActiveAnimations(): bool {
    return this.activeAnimations.length > 0;
  }

  reset(): void {
    for (let index = this.activeAnimations.length - 1; index >= 0; --index) {
      unchecked(this.activeAnimations[index])._cancel();
    }
    this.activeAnimations.length = 0;
    this.lastTimestampMs = 0.0;
    this.hasLastTimestamp = false;
  }

  private indexOf(target: Animation): i32 {
    for (let index = 0; index < this.activeAnimations.length; index += 1) {
      if (unchecked(this.activeAnimations[index]) === target) {
        return index;
      }
    }
    return -1;
  }

  private removeAt(index: i32): void {
    const lastIndex = this.activeAnimations.length - 1;
    if (index < 0 || index > lastIndex) {
      return;
    }
    if (index != lastIndex) {
      unchecked(this.activeAnimations[index] = this.activeAnimations[lastIndex]);
    }
    this.activeAnimations.pop();
  }
}

export type FloatAnimationHandler = (value: f32) => void;
export type ColorAnimationHandler = (value: u32) => void;

class CallbackFloatAnimation extends Animation {
  constructor(
    private readonly fromValue: f32,
    private readonly toValue: f32,
    timing: AnimationTiming,
    private readonly handler: FloatAnimationHandler,
  ) {
    super(timing);
  }

  protected onSample(easedProgress: f32, _linearProgress: f32): void {
    this.handler(mixFloat(this.fromValue, this.toValue, easedProgress));
  }
}

class OwnerFloatAnimation<Owner> extends Animation {
  constructor(
    private readonly owner: Owner,
    private readonly fromValue: f32,
    private readonly toValue: f32,
    timing: AnimationTiming,
    private readonly handler: Handler1<Owner, f32>,
  ) {
    super(timing);
  }

  protected onSample(easedProgress: f32, _linearProgress: f32): void {
    this.handler(this.owner, mixFloat(this.fromValue, this.toValue, easedProgress));
  }
}

class CallbackColorAnimation extends Animation {
  constructor(
    private readonly fromValue: u32,
    private readonly toValue: u32,
    timing: AnimationTiming,
    private readonly handler: ColorAnimationHandler,
  ) {
    super(timing);
  }

  protected onSample(easedProgress: f32, _linearProgress: f32): void {
    this.handler(mixColor(this.fromValue, this.toValue, easedProgress));
  }
}

class OwnerColorAnimation<Owner> extends Animation {
  constructor(
    private readonly owner: Owner,
    private readonly fromValue: u32,
    private readonly toValue: u32,
    timing: AnimationTiming,
    private readonly handler: Handler1<Owner, u32>,
  ) {
    super(timing);
  }

  protected onSample(easedProgress: f32, _linearProgress: f32): void {
    this.handler(this.owner, mixColor(this.fromValue, this.toValue, easedProgress));
  }
}

const sharedAnimationManager = new AnimationManager();

export function getAnimationManager(): AnimationManager {
  return sharedAnimationManager;
}

export function tickAnimations(timestampMs: f64): void {
  sharedAnimationManager.tick(timestampMs);
}

export function resetAnimations(): void {
  sharedAnimationManager.reset();
}

export function animateFloat(
  fromValue: f32,
  toValue: f32,
  timing: AnimationTiming,
  handler: FloatAnimationHandler,
): Animation {
  return sharedAnimationManager.start(new CallbackFloatAnimation(fromValue, toValue, timing, handler));
}

export function animateFloatWith<Owner>(
  owner: Owner,
  fromValue: f32,
  toValue: f32,
  timing: AnimationTiming,
  handler: Handler1<Owner, f32>,
): Animation {
  return sharedAnimationManager.start(new OwnerFloatAnimation<Owner>(owner, fromValue, toValue, timing, handler));
}

export function animateColor(
  fromValue: u32,
  toValue: u32,
  timing: AnimationTiming,
  handler: ColorAnimationHandler,
): Animation {
  return sharedAnimationManager.start(new CallbackColorAnimation(fromValue, toValue, timing, handler));
}

export function animateColorWith<Owner>(
  owner: Owner,
  fromValue: u32,
  toValue: u32,
  timing: AnimationTiming,
  handler: Handler1<Owner, u32>,
): Animation {
  return sharedAnimationManager.start(new OwnerColorAnimation<Owner>(owner, fromValue, toValue, timing, handler));
}
