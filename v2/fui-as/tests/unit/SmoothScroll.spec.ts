import {
  AnimationTiming,
  getAnimationManager,
  NodeTransitions,
  ScrollBox,
  ScrollView,
} from "../../src/Fui";
import { resetAnimations } from "../../src/core/Animation";
import { __fui_on_scroll } from "../../src/core/event_exports";
import { resetCommitState } from "../../src/core/FrameScheduler";
import {
  CALL_CLEAR_MOMENTUM_SCROLL,
  CALL_SET_SCROLL_OFFSET,
  getCallArg,
  getCallSequence,
  resetCalls,
} from "./FfiTestImports";

function lastCallIndex(op: i32): i32 {
  const sequence = getCallSequence();
  let index = -1;
  for (let i = 0; i < sequence.length; ++i) {
    if (unchecked(sequence[i]) == op) {
      index = i;
    }
  }
  return index;
}

function lastCallIndexForHandle(op: i32, handle: u64): i32 {
  const sequence = getCallSequence();
  let index = -1;
  for (let i = 0; i < sequence.length; ++i) {
    if (unchecked(sequence[i]) != op) {
      continue;
    }
    if (getCallArg(i, 0) == <f64>handle) {
      index = i;
    }
  }
  return index;
}

describe("Smooth scroll", () => {
  afterEach(() => {
    resetAnimations();
    resetCommitState();
    resetCalls();
  });

  it("keeps scrollTo immediate even when scroll transitions are configured", () => {
    const manager = getAnimationManager();
    const scrollView = new ScrollView().scrollOffset(10.0, 20.0);
    scrollView.build();

    scrollView.transitions(new NodeTransitions().scrollOffset(new AnimationTiming(100.0)));
    resetCalls();

    scrollView.scrollTo(30.0, 40.0);

    expect<f32>(scrollView.scrollState.offsetX.value).toBe(30.0);
    expect<f32>(scrollView.scrollState.offsetY.value).toBe(40.0);
    expect<bool>(manager.hasActiveAnimations()).toBe(false);
  });

  it("clears Ui momentum before starting an animated programmatic scroll", () => {
    const manager = getAnimationManager();
    const scrollView = new ScrollView().scrollOffset(10.0, 20.0);
    const handle = scrollView.build();
    resetCalls();

    scrollView.scrollToAnimated(50.0, 70.0, new AnimationTiming(100.0));

    expect<i32>(lastCallIndex(CALL_CLEAR_MOMENTUM_SCROLL)).toBeGreaterThan(-1);

    manager.tick(1000.0);
    resetCalls();
    manager.tick(1050.0);

    expect<f32>(scrollView.scrollState.offsetX.value).toBe(30.0);
    expect<f32>(scrollView.scrollState.offsetY.value).toBe(45.0);

    const scrollIndex = lastCallIndexForHandle(CALL_SET_SCROLL_OFFSET, handle);
    expect<i32>(scrollIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(scrollIndex, 1)).toBe(30.0);
    expect<f64>(getCallArg(scrollIndex, 2)).toBe(45.0);
  });

  it("lets user scrolling cancel an active programmatic smooth scroll", () => {
    const manager = getAnimationManager();
    const scrollView = new ScrollView().scrollOffset(10.0, 20.0);
    const handle = scrollView.build();

    scrollView.scrollToAnimated(50.0, 70.0, new AnimationTiming(100.0));
    manager.tick(1000.0);
    resetCalls();
    manager.tick(1050.0);

    __fui_on_scroll(handle, 68.0, 92.0, 200.0, 300.0, 100.0, 120.0);

    expect<f32>(scrollView.scrollState.offsetX.value).toBe(68.0);
    expect<f32>(scrollView.scrollState.offsetY.value).toBe(92.0);
    expect<bool>(manager.hasActiveAnimations()).toBe(false);

    resetCalls();
    manager.tick(1100.0);
    expect<i32>(lastCallIndex(CALL_SET_SCROLL_OFFSET)).toBe(-1);
  });

  it("delegates scrollToAnimated through ScrollBox to the owned viewport", () => {
    const manager = getAnimationManager();
    const scrollBox = new ScrollBox();
    scrollBox.build();
    resetCalls();

    scrollBox.scrollToAnimated(0.0, 60.0, new AnimationTiming(120.0));
    manager.tick(1000.0);
    resetCalls();
    manager.tick(1060.0);

    expect<f32>(scrollBox.scrollState.offsetY.value).toBe(30.0);

    const scrollIndex = lastCallIndexForHandle(CALL_SET_SCROLL_OFFSET, scrollBox.viewport.builtHandle);
    expect<i32>(scrollIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(scrollIndex, 2)).toBe(30.0);
  });
});
