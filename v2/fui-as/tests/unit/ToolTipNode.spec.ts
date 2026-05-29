import { ToolTip } from "../../src/core/ToolTip";
import { FlexBox } from "../../src/nodes";
import { CALL_SET_INTERACTIVE, findCall, resetCalls } from "./FfiTestImports";

describe("ToolTipNode", () => {
  it("marks built nodes interactive when a tooltip is attached", () => {
    resetCalls();

    const node = new FlexBox();
    node.build();

    resetCalls();
    node.toolTip(ToolTip.text("Helpful"));

    expect<i32>(findCall(CALL_SET_INTERACTIVE)).toBeGreaterThan(-1);

    node.dispose();
  });
});
