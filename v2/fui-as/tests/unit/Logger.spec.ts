import { error, warn } from "../../src/core/Logger";
import { CALL_LOG, findCall, lastLogCategoryEquals, lastLogMessageEquals, resetCalls, setLogsEnabled } from "./FfiTestImports";

describe("Logger", () => {
  it("emits warning categories through the harness", () => {
    resetCalls();
    setLogsEnabled(true);

    warn("Typography", "FontFamily.resolve() could not resolve a font face for weight 700 and style 1; the text will use font id 0.");

    expect<i32>(findCall(CALL_LOG)).toBeGreaterThan(-1);
    expect<bool>(lastLogCategoryEquals("Warning/Typography")).toBe(true);
    expect<bool>(lastLogMessageEquals("FontFamily.resolve() could not resolve a font face for weight 700 and style 1; the text will use font id 0.")).toBe(true);
  });

  it("emits error categories through the harness", () => {
    resetCalls();
    setLogsEnabled(true);

    error("Validation", "FlexBox.child: node must not be null");

    expect<i32>(findCall(CALL_LOG)).toBeGreaterThan(-1);
    expect<bool>(lastLogCategoryEquals("Error/Validation")).toBe(true);
    expect<bool>(lastLogMessageEquals("FlexBox.child: node must not be null")).toBe(true);
  });
});
