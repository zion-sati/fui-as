import * as ui from "../bindings/ui";
import { HandleValue } from "../core/ffi";
import { FlexBox } from "../nodes/FlexBox";

/**
 * Prevents a parent SelectionArea from collecting selectable nodes inside
 * this subtree. Nested SelectionArea islands within AntiSelectionArea are
 * unaffected and become independent cross-selection roots.
 */
export class AntiSelectionArea extends FlexBox {
  get isSelectionBarrier(): bool {
    return true;
  }

  build(): u64 {
    if (this.builtHandle != <u64>HandleValue.Invalid) {
      return this.builtHandle;
    }
    const handle = super.build();
    ui.setSelectionAreaBarrier(handle, true);
    return handle;
  }
}
