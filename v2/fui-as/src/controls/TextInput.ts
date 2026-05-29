import { TextInputCore, singleLineTextInputProfile } from "./internal/TextInputCore";

export class TextInput extends TextInputCore {
  constructor(text: string = "") {
    super(singleLineTextInputProfile, text);
  }
}
