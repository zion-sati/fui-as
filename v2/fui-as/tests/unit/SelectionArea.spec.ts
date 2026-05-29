import { Button, SelectionArea } from "../../src/controls";
import { EventRouter } from "../../src/core/EventRouter";
import { __fui_on_cross_selection_changed } from "../../src/core/event_exports";
import { Text } from "../../src/nodes";
import {
  CALL_SET_SELECTABLE,
  CALL_SET_SELECTION_AREA,
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

describe("SelectionArea", () => {
  it("marks the area node while plain text stays selectable by default", () => {
    EventRouter.reset();
    resetCalls();

    const area = new SelectionArea()
      .child(new Text("Alpha"))
      .child(new Button("Press"));

    area.build();

    expect<i32>(countCalls(CALL_SET_SELECTION_AREA)).toBe(1);
    expect<i32>(countCalls(CALL_SET_SELECTABLE)).toBe(1);

    area.dispose();
  });

  it("respects explicit text selection opt-out", () => {
    EventRouter.reset();
    resetCalls();

    const area = new SelectionArea()
      .child(new Text("Alpha").selectable(false))
      .child(new Button("Press"));

    area.build();

    expect<i32>(countCalls(CALL_SET_SELECTION_AREA)).toBe(1);
    expect<i32>(countCalls(CALL_SET_SELECTABLE)).toBe(1);

    area.dispose();
  });

  it("updates selectedText when the router dispatches a cross-selection change", () => {
    EventRouter.reset();
    resetCalls();

    const area = new SelectionArea().child(new Text("Alpha"));
    const handle = area.build();

    EventRouter.dispatchCrossSelectionChanged(handle, "Alpha");

    expect<string>(area.selectedText.value).toBe("Alpha");

    area.dispose();
  });

  it("decodes exported cross-selection callbacks from the shared text buffer", () => {
    EventRouter.reset();
    resetCalls();

    const area = new SelectionArea().child(new Text("Reverse drag"));
    const handle = area.build();
    const encoded = Uint8Array.wrap(String.UTF8.encode("Reverse drag", false));

    __fui_on_cross_selection_changed(handle, encoded.length > 0 ? encoded.dataStart : 0, <u32>encoded.length);

    expect<string>(area.selectedText.value).toBe("Reverse drag");

    area.dispose();
  });
});
