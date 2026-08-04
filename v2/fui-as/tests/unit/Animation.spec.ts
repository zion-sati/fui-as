import {
  animateColorWith,
  animateFloat,
  animateFloatWith,
  Animation,
  AnimationManager,
  AnimationTiming,
  Easings,
  getAnimationManager,
  rgb,
} from "../../src/Fui";
import { __fui_needs_animation_frame, __fui_on_frame, frameTimeSignal } from "../../src/core/event_exports";
import { resetAnimations } from "../../src/core/Animation";
import { resetCommitState } from "../../src/core/FrameScheduler";
import {
  CALL_REQUEST_RENDER,
  getCallSequence,
  resetCalls,
} from "./FfiTestImports";

let floatValue: f32 = -1.0;

function captureFloat(value: f32): void {
  floatValue = value;
}

function countCalls(op: i32): i32 {
  const sequence = getCallSequence();
  let count = 0;
  for (let index = 0; index < sequence.length; index += 1) {
    if (unchecked(sequence[index]) == op) {
      count += 1;
    }
  }
  return count;
}

class FloatOwner {
  value: f32 = -1.0;
}

function writeOwnerFloat(owner: FloatOwner, value: f32): void {
  owner.value = value;
}

class ColorOwner {
  value: u32 = 0;
}

function writeOwnerColor(owner: ColorOwner, value: u32): void {
  owner.value = value;
}

class TrackingAnimation extends Animation {
  sampleCount: i32 = 0;
  lastLinearProgress: f32 = -1.0;
  finished: bool = false;

  constructor(timing: AnimationTiming) {
    super(timing);
  }

  protected onSample(_easedProgress: f32, linearProgress: f32): void {
    this.sampleCount += 1;
    this.lastLinearProgress = linearProgress;
  }

  protected onStop(finished: bool): void {
    this.finished = finished;
  }
}

describe("Animation", () => {
  afterEach(() => {
    resetAnimations();
    resetCommitState();
    resetCalls();
    floatValue = -1.0;
  });

  it("advances float animations from frame timestamps instead of frame counts", () => {
    const animation = animateFloat(10.0, 30.0, new AnimationTiming(200.0), captureFloat);
    const manager = getAnimationManager();

    manager.tick(1000.0);
    expect<f32>(floatValue).toBe(10.0);
    expect<bool>(animation.isRunning).toBe(true);

    manager.tick(1050.0);
    expect<f32>(floatValue).toBe(15.0);

    manager.tick(1150.0);
    expect<f32>(floatValue).toBe(25.0);

    manager.tick(1250.0);
    expect<f32>(floatValue).toBe(30.0);
    expect<bool>(animation.isRunning).toBe(false);
    expect<bool>(manager.hasActiveAnimations()).toBe(false);
  });

  it("clamps stale frame gaps instead of jumping an animation to completion", () => {
    const manager = getAnimationManager();
    animateFloat(0.0, 100.0, new AnimationTiming(200.0), captureFloat);

    manager.tick(1000.0);
    manager.tick(1800.0);

    expect<f32>(floatValue).toBe(50.0);
    expect<bool>(manager.hasActiveAnimations()).toBe(true);
  });

  it("supports owner-bound float and color helpers", () => {
    const floatOwner = new FloatOwner();
    const colorOwner = new ColorOwner();
    const manager = getAnimationManager();

    animateFloatWith(floatOwner, 4.0, 12.0, new AnimationTiming(80.0), writeOwnerFloat);
    animateColorWith(colorOwner, rgb(0, 0, 0), rgb(255, 0, 0), new AnimationTiming(80.0), writeOwnerColor);

    manager.tick(500.0);
    expect<f32>(floatOwner.value).toBe(4.0);
    expect<u32>(colorOwner.value).toBe(rgb(0, 0, 0));

    manager.tick(540.0);
    expect<f32>(floatOwner.value).toBe(8.0);
    expect<u32>(colorOwner.value).toBe(rgb(128, 0, 0));

    manager.tick(580.0);
    expect<f32>(floatOwner.value).toBe(12.0);
    expect<u32>(colorOwner.value).toBe(rgb(255, 0, 0));
  });

  it("cancels and finishes animations through the animation object", () => {
    const manager = getAnimationManager();
    const animation = animateFloat(0.0, 100.0, new AnimationTiming(100.0), captureFloat);

    manager.tick(100.0);
    manager.tick(140.0);
    expect<f32>(floatValue).toBe(40.0);

    animation.cancel();
    manager.tick(200.0);
    expect<f32>(floatValue).toBe(40.0);
    expect<bool>(animation.isRunning).toBe(false);

    const second = animateFloat(0.0, 100.0, new AnimationTiming(100.0), captureFloat);
    manager.tick(300.0);
    second.finish();
    expect<f32>(floatValue).toBe(100.0);
    expect<bool>(second.isRunning).toBe(false);
    expect<bool>(manager.hasActiveAnimations()).toBe(false);
  });

  it("starts, cancels, and finishes custom animations through the manager using Animation objects", () => {
    const manager = new AnimationManager();
    const first = new TrackingAnimation(new AnimationTiming(120.0));
    const second = new TrackingAnimation(new AnimationTiming(120.0, Easings.cubicOut));

    expect<bool>(manager.start(first) === first).toBe(true);
    manager.tick(10.0);
    expect<i32>(first.sampleCount).toBe(1);

    manager.cancel(first);
    expect<bool>(first.isRunning).toBe(false);
    expect<bool>(first.finished).toBe(false);

    manager.start(second);
    manager.tick(20.0);
    manager.finish(second);
    expect<bool>(second.isRunning).toBe(false);
    expect<bool>(second.finished).toBe(true);
    expect<f32>(second.lastLinearProgress).toBe(1.0);
  });

  it("uses the shared frame hook to tick active animations", () => {
    const owner = new FloatOwner();
    animateFloatWith(owner, 2.0, 6.0, new AnimationTiming(100.0), writeOwnerFloat);
    expect<bool>(__fui_needs_animation_frame()).toBe(true);

    __fui_on_frame(1000.0);
    expect<f64>(frameTimeSignal.value).toBe(1000.0);
    expect<f32>(owner.value).toBe(2.0);

    __fui_on_frame(1050.0);
    expect<f32>(owner.value).toBe(4.0);
    expect<bool>(__fui_needs_animation_frame()).toBe(true);
    resetAnimations();
    expect<bool>(__fui_needs_animation_frame()).toBe(false);
  });

  it("requests a render when an animation starts", () => {
    animateFloat(0.0, 1.0, new AnimationTiming(50.0), captureFloat);

    expect<i32>(countCalls(CALL_REQUEST_RENDER)).toBe(1);
  });
});
