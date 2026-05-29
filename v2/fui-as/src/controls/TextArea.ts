import { ScrollBarVisibility } from "../nodes";
import { TextInputCore, multilineTextAreaProfile } from "./internal/TextInputCore";

export class TextArea extends TextInputCore {
  constructor(text: string = "") {
    super(multilineTextAreaProfile, text);
  }

  wrapping(flag: bool = true): this {
    return changetype<this>(super.wrapping(flag));
  }

  verticalScrollbarVisibility(mode: ScrollBarVisibility): this {
    return changetype<this>(super.verticalScrollbarVisibility(mode));
  }

  horizontalScrollbarVisibility(mode: ScrollBarVisibility): this {
    return changetype<this>(super.horizontalScrollbarVisibility(mode));
  }
}
