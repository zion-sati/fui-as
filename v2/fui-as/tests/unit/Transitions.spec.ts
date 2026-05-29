import {
  AnimationTiming,
  FlexBox,
  getAnimationManager,
  mixColor,
  NodeTransitions,
  rgb,
  ScrollView,
} from "../../src/Fui";
import { resetAnimations } from "../../src/core/Animation";
import { resetCommitState } from "../../src/core/FrameScheduler";
import {
  CALL_SET_BOX_STYLE,
  CALL_SET_LAYER_EFFECT,
  CALL_SET_SCROLL_OFFSET,
  getCallArg,
  getCallSequence,
  resetCalls,
} from "./FfiTestImports";

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

describe("NodeTransitions", () => {
  afterEach(() => {
    resetAnimations();
    resetCommitState();
    resetCalls();
  });

  it("animates opacity transitions on FlexBox", () => {
    const manager = getAnimationManager();
    const box = new FlexBox().opacity(0.2);
    const handle = box.build();

    box.transitions(new NodeTransitions().opacity(new AnimationTiming(100.0)));
    resetCalls();

    box.opacity(0.8);
    manager.tick(1000.0);
    resetCalls();
    manager.tick(1050.0);

    const effectIndex = lastCallIndexForHandle(CALL_SET_LAYER_EFFECT, handle);
    expect<i32>(effectIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(effectIndex, 1)).toBe(0.5);
  });

  it("replaces only the targeted transition slot", () => {
    const manager = getAnimationManager();
    const box = new FlexBox()
      .bgColor(rgb(0, 0, 0))
      .opacity(0.0);
    const handle = box.build();

    box.transitions(new NodeTransitions()
      .bgColor(new AnimationTiming(100.0))
      .opacity(new AnimationTiming(100.0)));
    resetCalls();

    box.bgColor(rgb(255, 0, 0));
    box.opacity(1.0);
    manager.tick(1000.0);
    resetCalls();
    manager.tick(1050.0);

    box.bgColor(rgb(0, 0, 255));
    resetCalls();
    manager.tick(1100.0);

    const effectIndex = lastCallIndexForHandle(CALL_SET_LAYER_EFFECT, handle);
    expect<i32>(effectIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(effectIndex, 1)).toBe(1.0);

    const boxStyleIndex = lastCallIndexForHandle(CALL_SET_BOX_STYLE, handle);
    expect<i32>(boxStyleIndex).toBeGreaterThan(-1);
    expect<u32>(<u32>getCallArg(boxStyleIndex, 1)).toBe(
      mixColor(rgb(128, 0, 0), rgb(0, 0, 255), 0.5),
    );
  });

  it("animates scroll offset transitions on ScrollView from the current displayed offset", () => {
    const manager = getAnimationManager();
    const scrollView = new ScrollView().scrollOffset(10.0, 20.0);
    const handle = scrollView.build();

    scrollView.transitions(new NodeTransitions().scrollOffset(new AnimationTiming(100.0)));
    resetCalls();

    scrollView.scrollOffset(30.0, 40.0);
    manager.tick(1000.0);
    resetCalls();
    manager.tick(1050.0);

    expect<f32>(scrollView.scrollState.offsetX.value).toBe(20.0);
    expect<f32>(scrollView.scrollState.offsetY.value).toBe(30.0);

    scrollView.scrollOffset(40.0, 50.0);
    resetCalls();
    manager.tick(1100.0);

    expect<f32>(scrollView.scrollState.offsetX.value).toBe(30.0);
    expect<f32>(scrollView.scrollState.offsetY.value).toBe(40.0);

    const scrollIndex = lastCallIndexForHandle(CALL_SET_SCROLL_OFFSET, handle);
    expect<i32>(scrollIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(scrollIndex, 1)).toBe(30.0);
    expect<f64>(getCallArg(scrollIndex, 2)).toBe(40.0);
  });
});
