import { EventRouter, GlobalKeyHandler } from "../core/EventRouter";
import { FlexDirection, KeyEventType, SemanticRole } from "../core/ffi";
import { FlexBox } from "../nodes";
import { Button } from "./Button";

export class Form extends FlexBox implements GlobalKeyHandler {
  private defaultButton: Button | null = null;
  private cancelButton: Button | null = null;
  private keyFilterToken: u32 = 0;
  private armedKey: string | null = null;
  private armedButton: Button | null = null;

  constructor() {
    super();
    this.flexDirection(FlexDirection.Column);
    this.semanticRole(SemanticRole.Form);
  }

  defaultBtn(button: Button): this {
    this.defaultButton = button;
    return this;
  }

  cancelBtn(button: Button): this {
    this.cancelButton = button;
    return this;
  }

  activate(): void {
    if (this.keyFilterToken != 0 || (this.defaultButton === null && this.cancelButton === null)) {
      return;
    }
    this.keyFilterToken = EventRouter.pushKeyFilter(this);
  }

  deactivate(): void {
    this.cancelArmedButton();
    if (this.keyFilterToken != 0) {
      EventRouter.removeKeyFilter(this.keyFilterToken);
      this.keyFilterToken = 0;
    }
  }

  handleGlobalKeyEvent(eventType: KeyEventType, key: string, modifiers: u32): bool {
    if (key == "Enter" && this.shouldDeferEnterToFocusedButton(modifiers)) {
      return false;
    }
    if (eventType == KeyEventType.Down) {
      return this.handleKeyDown(key);
    }
    if (eventType == KeyEventType.Up) {
      return this.handleKeyUp(key);
    }
    return false;
  }

  private handleKeyDown(key: string): bool {
    const button = this.resolveButtonForKey(key);
    if (button === null) {
      return false;
    }
    if (this.armedKey !== null) {
      return changetype<string>(this.armedKey) == key;
    }
    this.armedKey = key;
    this.armedButton = button;
    button.beginPress();
    return true;
  }

  private handleKeyUp(key: string): bool {
    if (this.armedKey === null || changetype<string>(this.armedKey) != key) {
      return false;
    }
    const button = this.armedButton;
    this.armedKey = null;
    this.armedButton = null;
    if (button !== null) {
      button.endPress(true);
    }
    return true;
  }

  private cancelArmedButton(): void {
    const button = this.armedButton;
    this.armedKey = null;
    this.armedButton = null;
    if (button !== null) {
      button.cancelPress();
    }
  }

  private resolveButtonForKey(key: string): Button | null {
    if (key == "Enter") {
      return this.defaultButton;
    }
    if (key == "Escape") {
      return this.cancelButton;
    }
    return null;
  }

  private shouldDeferEnterToFocusedButton(modifiers: u32): bool {
    if (modifiers != 0) {
      return false;
    }
    const focusedNode = EventRouter.getFocusedNode();
    return focusedNode !== null && focusedNode instanceof Button && focusedNode.isEnabled;
  }
}
