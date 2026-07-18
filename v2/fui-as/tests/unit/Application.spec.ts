import { Application } from "../../src/core/Application";
import { HandleValue } from "../../src/core/ffi";
import { activeTheme, generateTheme, useCustomTheme } from "../../src/core/Theme";
import { FlexBox, Text } from "../../src/nodes";
import {
  CALL_SET_BOX_STYLE,
  getCallArg,
  getCallCount,
  getCallSequence,
  resetCalls,
} from "./FfiTestImports";

const captureOrder = new Array<string>();
const restoreOrder = new Array<string>();

class RecordingBox extends FlexBox {
  constructor(private readonly name: string) {
    super();
  }

  protected capturePersistedState(): void {
    captureOrder.push(this.name);
  }

  protected restorePersistedState(): void {
    restoreOrder.push(this.name);
  }
}

describe("Application", () => {
  it("mounts and replaces retained roots", () => {
    const first = new FlexBox().child(new Text("first"));
    const second = new FlexBox().child(new Text("second"));

    Application.mount(first);
    expect<u64>(first.builtHandle).not.toBe(<u64>HandleValue.Invalid);

    Application.mount(second);

    expect<u64>(first.builtHandle).toBe(<u64>HandleValue.Invalid);
    expect<u64>(second.builtHandle).not.toBe(<u64>HandleValue.Invalid);
    Application.unmount();
  });

  it("unmounts the retained root", () => {
    const root = new FlexBox().child(new Text("root"));

    Application.mount(root);
    Application.unmount();

    expect<u64>(root.builtHandle).toBe(<u64>HandleValue.Invalid);
  });

  it("walks persisted state root-to-leaf on capture and leaf-to-root on restore", () => {
    captureOrder.length = 0;
    restoreOrder.length = 0;

    const leaf = new RecordingBox("leaf");
    const child = new RecordingBox("child").child(leaf);
    const root = new RecordingBox("root").child(child);

    Application.mount(root);
    Application.capturePersistedUiState();
    Application.restorePersistedUiState();

    expect<string>(captureOrder.join("|")).toBe("root|child|leaf");
    expect<string>(restoreOrder.join("|")).toBe("leaf|child|root");
    Application.unmount();
  });

  it("themes the application shell without overriding an explicit root background", () => {
    const previousTheme = activeTheme.value;
    const explicitRootColor: u32 = 0x123456ff;
    const root = new FlexBox().bgColor(explicitRootColor) as FlexBox;

    Application.mount(root);
    resetCalls();

    const changedTheme = generateTheme(false, 0x2468acff);
    useCustomTheme(changedTheme);

    const callCount = getCallCount();
    const sequence = getCallSequence();
    let foundThemedShell = false;
    for (let index = 0; index < callCount; ++index) {
      if (unchecked(sequence[index]) != CALL_SET_BOX_STYLE) {
        continue;
      }
      if (<u32>getCallArg(index, 1) != changedTheme.colors.background) {
        continue;
      }
      expect<u64>(<u64>getCallArg(index, 0)).not.toBe(root.builtHandle);
      foundThemedShell = true;
    }
    expect<bool>(foundThemedShell).toBe(true);

    Application.unmount();
    useCustomTheme(previousTheme);
  });
});
