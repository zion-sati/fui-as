import { ContextMenu } from "../../src/controls/ContextMenu";
import { Dropdown, DropdownItem } from "../../src/controls/Dropdown";
import { ScrollBar } from "../../src/nodes/ScrollBar";
import { ScrollState } from "../../src/nodes/ScrollState";
import { Slider } from "../../src/controls/Slider";
import { CALL_LOG, findCall, lastLogCategoryEquals, lastLogMessageEquals, resetCalls, setLogsEnabled } from "./FfiTestImports";

describe("Setup warnings", () => {
  it("warns when menu sizing is invalid or truncated", () => {
    resetCalls();
    setLogsEnabled(true);

    new ContextMenu()
      .menuWidth(0.0)
      .itemHeight(-4.0);

    expect<i32>(findCall(CALL_LOG)).toBeGreaterThan(-1);
    expect<bool>(lastLogCategoryEquals("Warning/Layout")).toBe(true);
  });

  it("warns when dropdown selection is clamped", () => {
    resetCalls();
    setLogsEnabled(true);

    new Dropdown()
      .items([new DropdownItem("One"), new DropdownItem("Two")])
      .selectIndex(8);

    expect<bool>(lastLogCategoryEquals("Warning/Layout")).toBe(true);
    expect<bool>(lastLogMessageEquals("Dropdown.selectIndex() received 8; clamping to 1.")).toBe(true);
  });

  it("warns when slider values are invalid", () => {
    resetCalls();
    setLogsEnabled(true);

    new Slider()
      .step(0.0)
      .length(0.5);

    expect<bool>(lastLogCategoryEquals("Warning/Layout")).toBe(true);
    expect<bool>(lastLogMessageEquals("Slider.length() received 0.5; clamping to a value above the thumb size.")).toBe(true);
  });

  it("warns when scrollbar geometry inputs are invalid", () => {
    resetCalls();
    setLogsEnabled(true);

    new ScrollBar(new ScrollState())
      .trackThickness(0.0)
      .thumbThickness(-1.0)
      .thumbMinHeight(0.0);

    expect<i32>(findCall(CALL_LOG)).toBeGreaterThan(-1);
    expect<bool>(lastLogCategoryEquals("Warning/Layout")).toBe(true);
  });
});
