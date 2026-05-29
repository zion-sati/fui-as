import { flushCommit, markNeedsCommit, resetCommitState } from "../../src/core/FrameScheduler";
import {
  CALL_COMMIT_FRAME,
  CALL_REQUEST_RENDER,
  getCallSequence,
  resetCalls,
} from "./FfiTestImports";

function countCalls(op: i32): i32 {
  const sequence = getCallSequence();
  let count = 0;
  for (let index = 0; index < sequence.length; ++index) {
    if (unchecked(sequence[index]) == op) {
      count += 1;
    }
  }
  return count;
}

describe("FrameScheduler", () => {
  afterEach(() => {
    resetCommitState();
    resetCalls();
  });

  it("coalesces repeated render requests until the pending commit is flushed", () => {
    markNeedsCommit();
    markNeedsCommit();
    markNeedsCommit();

    expect<i32>(countCalls(CALL_REQUEST_RENDER)).toBe(1);
    expect<i32>(countCalls(CALL_COMMIT_FRAME)).toBe(0);
  });

  it("commits once and rearms after a flush", () => {
    markNeedsCommit();
    const firstFlush = flushCommit();

    expect<bool>(firstFlush).toBe(true);
    expect<i32>(countCalls(CALL_REQUEST_RENDER)).toBe(1);
    expect<i32>(countCalls(CALL_COMMIT_FRAME)).toBe(1);

    resetCalls();
    markNeedsCommit();

    expect<i32>(countCalls(CALL_REQUEST_RENDER)).toBe(1);
    expect<i32>(countCalls(CALL_COMMIT_FRAME)).toBe(0);
  });
});
