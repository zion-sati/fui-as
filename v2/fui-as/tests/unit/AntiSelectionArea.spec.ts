import { AntiSelectionArea, SelectionArea } from "../../src/controls";
import { EventRouter } from "../../src/core/EventRouter";
import { Text } from "../../src/nodes";
import {
  CALL_SET_SELECTION_AREA,
  CALL_SET_SELECTION_AREA_BARRIER,
  CALL_SET_SELECTABLE,
  findCall,
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

describe("AntiSelectionArea", () => {
  it("marks the node as a selection barrier on build", () => {
    EventRouter.reset();
    resetCalls();

    const barrier = new AntiSelectionArea().child(new Text("Blocked"));
    barrier.build();

    expect<i32>(countCalls(CALL_SET_SELECTION_AREA_BARRIER)).toBe(1);

    barrier.dispose();
  });

  it("does not mark itself as a selection area", () => {
    EventRouter.reset();
    resetCalls();

    const barrier = new AntiSelectionArea().child(new Text("Blocked"));
    barrier.build();

    expect<i32>(countCalls(CALL_SET_SELECTION_AREA)).toBe(0);

    barrier.dispose();
  });

  it("barrier is set after the node is created", () => {
    EventRouter.reset();
    resetCalls();

    const barrier = new AntiSelectionArea();
    barrier.build();

    const barrierCallIndex = findCall(CALL_SET_SELECTION_AREA_BARRIER);
    expect<bool>(barrierCallIndex >= 0).toBe(true);

    barrier.dispose();
  });

  it("does not suppress public Text default selection inside the barrier", () => {
    EventRouter.reset();
    resetCalls();

    // Public Text stays selectable by default even without a surrounding
    // SelectionArea. AntiSelectionArea only blocks inherited area behavior.
    const barrier = new AntiSelectionArea().child(new Text("Blocked"));
    barrier.build();

    expect<i32>(countCalls(CALL_SET_SELECTABLE)).toBe(1);

    barrier.dispose();
  });

  it("SelectionArea wrapping AntiSelectionArea still marks its own node", () => {
    EventRouter.reset();
    resetCalls();

    const barrier = new AntiSelectionArea().child(new Text("Inside barrier"));
    const outerText = new Text("Outside");
    const area = new SelectionArea().child(barrier).child(outerText);
    area.build();

    // Outer SelectionArea is registered
    expect<i32>(countCalls(CALL_SET_SELECTION_AREA)).toBe(1);
    // Barrier is registered
    expect<i32>(countCalls(CALL_SET_SELECTION_AREA_BARRIER)).toBe(1);
    // Both public Text nodes stay selectable by default; the barrier only
    // affects parent area collection behavior.
    expect<i32>(countCalls(CALL_SET_SELECTABLE)).toBe(2);

    area.dispose();
  });

  it("nested SelectionArea inside AntiSelectionArea still registers itself", () => {
    EventRouter.reset();
    resetCalls();

    const innerText = new Text("Inner island");
    const innerArea = new SelectionArea().child(innerText);
    const barrier = new AntiSelectionArea().child(innerArea);
    barrier.build();

    // The inner SelectionArea registers itself as a selection area
    expect<i32>(countCalls(CALL_SET_SELECTION_AREA)).toBe(1);
    // The inner SelectionArea makes its own text selectable
    expect<i32>(countCalls(CALL_SET_SELECTABLE)).toBe(1);
    // The barrier is still registered
    expect<i32>(countCalls(CALL_SET_SELECTION_AREA_BARRIER)).toBe(1);

    barrier.dispose();
  });

  it("build is idempotent", () => {
    EventRouter.reset();
    resetCalls();

    const barrier = new AntiSelectionArea();
    barrier.build();
    resetCalls();
    barrier.build();

    expect<i32>(countCalls(CALL_SET_SELECTION_AREA_BARRIER)).toBe(0);

    barrier.dispose();
  });
});
