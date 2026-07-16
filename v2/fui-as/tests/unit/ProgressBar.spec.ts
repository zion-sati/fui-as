import { ProgressBar } from "../../src/controls";
import { Node } from "../../src/core/Node";
import { activeTheme, defaultDarkTheme, generateTheme } from "../../src/core/Theme";
import { Orientation } from "../../src/core/ffi";
import {
  CALL_SET_BOX_STYLE,
  CALL_SET_HEIGHT,
  CALL_SET_SEMANTIC_VALUE_RANGE,
  CALL_SET_WIDTH,
  getCallArg,
  getCallSequence,
  resetCalls,
} from "./FfiTestImports";

function requireChild<T>(node: Node, index: i32): T {
  return node.getChildAt(index)! as T;
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

describe("ProgressBar", () => {
  afterEach(() => {
    activeTheme.value = defaultDarkTheme;
  });

  it("builds default geometry, colors, and semantic range", () => {
    resetCalls();

    const bar = new ProgressBar();
    const handle = bar.build();
    const fillHandle = requireChild<Node>(bar, 0).builtHandle;

    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, handle), 1)).toBe(220.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, handle), 1)).toBe(14.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, fillHandle), 1)).toBe(0.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, fillHandle), 1)).toBe(14.0);

    const rootBoxIndex = lastCallIndexForHandle(CALL_SET_BOX_STYLE, handle);
    const fillBoxIndex = lastCallIndexForHandle(CALL_SET_BOX_STYLE, fillHandle);
    expect<f64>(getCallArg(rootBoxIndex, 1)).toBe(<f64>defaultDarkTheme.colors.scrollbarTrack);
    expect<f64>(getCallArg(fillBoxIndex, 1)).toBe(<f64>defaultDarkTheme.colors.accent);

    const semanticIndex = lastCallIndexForHandle(CALL_SET_SEMANTIC_VALUE_RANGE, handle);
    expect<f64>(getCallArg(semanticIndex, 1)).toBe(1.0);
    expect<f64>(getCallArg(semanticIndex, 2)).toBe(0.0);
    expect<f64>(getCallArg(semanticIndex, 3)).toBe(0.0);
    expect<f64>(getCallArg(semanticIndex, 4)).toBe(100.0);

    bar.dispose();
  });

  it("updates fill geometry and clamps value changes against the configured range", () => {
    resetCalls();

    const bar = new ProgressBar(25.0).max(200.0).length(300.0);
    const handle = bar.build();
    const fillHandle = requireChild<Node>(bar, 0).builtHandle;

    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, fillHandle), 1)).toBe(37.5);

    resetCalls();
    bar.value(250.0);

    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, fillHandle), 1)).toBe(300.0);
    const semanticIndex = lastCallIndexForHandle(CALL_SET_SEMANTIC_VALUE_RANGE, handle);
    expect<f64>(getCallArg(semanticIndex, 2)).toBe(200.0);
    expect<f64>(getCallArg(semanticIndex, 3)).toBe(0.0);
    expect<f64>(getCallArg(semanticIndex, 4)).toBe(200.0);

    bar.dispose();
  });

  it("maps length and thickness to the selected orientation", () => {
    resetCalls();

    const bar = new ProgressBar(25.0)
      .length(300.0)
      .thickness(18.0)
      .orientation(Orientation.Vertical);
    const handle = bar.build();
    const fillHandle = requireChild<Node>(bar, 0).builtHandle;

    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, handle), 1)).toBe(18.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, handle), 1)).toBe(300.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, fillHandle), 1)).toBe(18.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, fillHandle), 1)).toBe(75.0);

    resetCalls();
    bar.orientation(Orientation.Horizontal);

    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, handle), 1)).toBe(300.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, handle), 1)).toBe(18.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, fillHandle), 1)).toBe(75.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, fillHandle), 1)).toBe(18.0);

    bar.dispose();
  });

  it("tracks theme colors by default", () => {
    resetCalls();

    const bar = new ProgressBar(50.0);
    const handle = bar.build();
    const fillHandle = requireChild<Node>(bar, 0).builtHandle;
    const nextTheme = generateTheme(false, 0xdb2777ff);

    resetCalls();
    activeTheme.value = nextTheme;

    const rootBoxIndex = lastCallIndexForHandle(CALL_SET_BOX_STYLE, handle);
    const fillBoxIndex = lastCallIndexForHandle(CALL_SET_BOX_STYLE, fillHandle);
    expect<f64>(getCallArg(rootBoxIndex, 1)).toBe(<f64>nextTheme.colors.scrollbarTrack);
    expect<f64>(getCallArg(fillBoxIndex, 1)).toBe(<f64>nextTheme.colors.accent);

    bar.dispose();
  });

  it("preserves explicit track and fill overrides across theme changes", () => {
    resetCalls();

    const bar = new ProgressBar(50.0)
      .trackColor(0x11223344)
      .fillColor(0x55667788);
    const handle = bar.build();
    const fillHandle = requireChild<Node>(bar, 0).builtHandle;

    resetCalls();
    activeTheme.value = generateTheme(false, 0xdb2777ff);

    const rootBoxIndex = lastCallIndexForHandle(CALL_SET_BOX_STYLE, handle);
    const fillBoxIndex = lastCallIndexForHandle(CALL_SET_BOX_STYLE, fillHandle);
    expect<f64>(getCallArg(rootBoxIndex, 1)).toBe(0x11223344);
    expect<f64>(getCallArg(fillBoxIndex, 1)).toBe(0x55667788);

    bar.dispose();
  });
});
