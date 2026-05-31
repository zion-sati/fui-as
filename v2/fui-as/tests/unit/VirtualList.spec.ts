import { Unit } from "../../src/core/ffi";
import { FlexBox, Text, VirtualList } from "../../src/nodes";
import {
  CALL_CLEAR_SELECTION,
  CALL_CREATE_NODE,
  CALL_DELETE_NODE,
  CALL_RETARGET_SELECTION,
  CALL_SET_HEIGHT,
  CALL_SET_TEXT,
  findCall,
  resetCalls,
} from "./FfiTestImports";

let renderedIndices = new Array<i32>();

function trackedBindVirtualListItem(container: FlexBox, index: i32): void {
  renderedIndices.push(index);
  if (container.childCount == 0) {
    container.child(new Text(""));
  }
  const textNode = container.getChildAt(0);
  const text = textNode! as Text;
  const label = "Item " + index.toString();
  text.text(label);
  text.semanticLabel(label);
}

function staticBindVirtualListItem(container: FlexBox, index: i32): void {
  if (container.childCount == 0) {
    container.child(new Text(""));
  }
  const textNode = container.getChildAt(0);
  (textNode! as Text).text("row " + index.toString());
}

describe("VirtualList", () => {
  it("binds only the visible window for a fixed-height list", () => {
    renderedIndices.length = 0;
    const list = new VirtualList(10000, 20.0).onBindItem(trackedBindVirtualListItem);
    list.width(180.0, Unit.Pixel);
    list.height(100.0, Unit.Pixel);

    list.build();

    const lastWindowStart = renderedIndices.length - 6;
    expect<i32>(unchecked(renderedIndices[lastWindowStart])).toBe(0);
    expect<i32>(unchecked(renderedIndices[lastWindowStart + 5])).toBe(5);
    expect<i32>(list.firstVisibleIndex).toBe(0);
    expect<i32>(list.renderedItemCount).toBe(6);
    list.dispose();
  });

  it("rebinds pooled rows without recreating nodes when the scroll offset changes", () => {
    renderedIndices.length = 0;
    const list = new VirtualList(10000, 20.0).onBindItem(trackedBindVirtualListItem);
    list.width(180.0, Unit.Pixel);
    list.height(100.0, Unit.Pixel);
    list.build();

    renderedIndices.length = 0;
    resetCalls();
    list.scrollState.offsetY.value = 60.0;

    expect<i32>(renderedIndices.length).toBe(6);
    expect<i32>(unchecked(renderedIndices[0])).toBe(3);
    expect<i32>(unchecked(renderedIndices[5])).toBe(8);
    expect<i32>(list.firstVisibleIndex).toBe(3);
    expect<i32>(findCall(CALL_CREATE_NODE)).toBe(-1);
    expect<i32>(findCall(CALL_DELETE_NODE)).toBe(-1);
    expect<i32>(findCall(CALL_SET_TEXT)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_HEIGHT)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_CLEAR_SELECTION)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_RETARGET_SELECTION)).toBeGreaterThan(-1);
    list.dispose();
  });

  it("tracks content height and clamps the visible window when the item count changes", () => {
    const list = new VirtualList(10000, 24.0).onBindItem(staticBindVirtualListItem);
    list.height(120.0, Unit.Pixel);

    expect<f32>(list.scrollState.contentHeight.value).toBe(240000.0);
    expect<i32>(list.renderedItemCount).toBe(6);

    list.updateItemCount(5);

    expect<f32>(list.scrollState.contentHeight.value).toBe(120.0);
    expect<i32>(list.renderedItemCount).toBe(5);
    list.dispose();
  });
});
