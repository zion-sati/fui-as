import { Application } from "../../src/core/Application";
import { cancelAllTimers, cancelTimer, handleTimer, hasTimer, scheduleTimer } from "../../src/core/Timers";
import { FlexBox, Text } from "../../src/nodes";
import {
  CALL_CANCEL_TIMER,
  CALL_START_TIMER,
  getCallArg,
  getCallSequence,
  resetCalls,
  setTimerNow,
} from "./FfiTestImports";

const firedTimerIds = new Array<u32>();
let firedFlag: bool = false;

function recordTimer4(): void {
  firedTimerIds.push(4);
}

function recordTimer9(): void {
  firedTimerIds.push(9);
}

function setFiredFlag(): void {
  firedFlag = true;
}

function countCalls(op: i32): i32 {
  const sequence = getCallSequence();
  let count = 0;
  for (let i = 0; i < sequence.length; ++i) {
    if (unchecked(sequence[i]) == op) {
      count += 1;
    }
  }
  return count;
}

function findLastCall(op: i32): i32 {
  const sequence = getCallSequence();
  let index = -1;
  for (let i = 0; i < sequence.length; ++i) {
    if (unchecked(sequence[i]) == op) {
      index = i;
    }
  }
  return index;
}

describe("Timers", () => {
  afterEach(() => {
    cancelAllTimers();
    Application.unmount();
    resetCalls();
    setTimerNow(0.0);
    firedTimerIds.length = 0;
    firedFlag = false;
  });

  it("rearms one shared host timer for the earliest logical deadline", () => {
    setTimerNow(1000.0);

    scheduleTimer(11, 240, () => {});
    scheduleTimer(12, 120, () => {});

    expect<i32>(countCalls(CALL_START_TIMER)).toBe(2);
    const lastStart = findLastCall(CALL_START_TIMER);
    expect<i32>(lastStart).toBeGreaterThan(-1);
    expect<f64>(getCallArg(lastStart, 0)).toBe(1.0);
    expect<f64>(getCallArg(lastStart, 1)).toBe(120.0);
  });

  it("fires due callbacks in deadline order and rearms the next pending timer", () => {
    setTimerNow(500.0);

    scheduleTimer(9, 60, recordTimer9);
    scheduleTimer(4, 20, recordTimer4);

    resetCalls();
    setTimerNow(520.0);
    handleTimer(1);

    expect<i32>(firedTimerIds.length).toBe(1);
    expect<u32>(unchecked(firedTimerIds[0])).toBe(4);
    expect<bool>(hasTimer(4)).toBe(false);
    expect<bool>(hasTimer(9)).toBe(true);

    const lastStart = findLastCall(CALL_START_TIMER);
    expect<i32>(lastStart).toBeGreaterThan(-1);
    expect<f64>(getCallArg(lastStart, 0)).toBe(1.0);
    expect<f64>(getCallArg(lastStart, 1)).toBe(40.0);
  });

  it("canceling the last logical timer disarms the shared host timer", () => {
    setTimerNow(0.0);

    scheduleTimer(7, 50, setFiredFlag);

    resetCalls();
    cancelTimer(7);
    handleTimer(1);

    const cancelIndex = findLastCall(CALL_CANCEL_TIMER);
    expect<i32>(cancelIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(cancelIndex, 0)).toBe(1.0);
    expect<bool>(firedFlag).toBe(false);
    expect<bool>(hasTimer(7)).toBe(false);
  });

  it("mounting a new application root clears pending timers", () => {
    setTimerNow(0.0);
    scheduleTimer(25, 75, () => {});

    resetCalls();
    Application.mount(new FlexBox().child(new Text("root")));

    expect<bool>(hasTimer(25)).toBe(false);
    const cancelIndex = findLastCall(CALL_CANCEL_TIMER);
    expect<i32>(cancelIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(cancelIndex, 0)).toBe(1.0);
  });
});
