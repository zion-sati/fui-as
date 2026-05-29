import * as ui from "../bindings/ui";
import { CursorStyle, HandleValue } from "../core/ffi";
import { Node } from "../core/Node";
import { Signal } from "../core/Signal";
import { throwNullArgument } from "../core/Errors";
import { FlexBox } from "../nodes/FlexBox";
import { Text } from "../nodes/Text";

export class SelectionArea extends FlexBox {
  readonly selectedText: Signal<string> = new Signal<string>("");

  child(node: Node): this {
    if (node == null) {
      throwNullArgument("SelectionArea.child", "node");
    }
    this.prepareSelectionDefaults(node, false);
    super.child(node);
    return this;
  }

  children(nodes: Array<Node>): this {
    for (let index = 0; index < nodes.length; ++index) {
      this.prepareSelectionDefaults(unchecked(nodes[index]), false);
    }
    super.children(nodes);
    return this;
  }

  build(): u64 {
    if (this.builtHandle != <u64>HandleValue.Invalid) {
      return this.builtHandle;
    }
    this.prepareExistingChildren();
    const handle = super.build();
    ui.setSelectionArea(handle, true);
    return handle;
  }

  _handleCrossSelectionChanged(text: string): void {
    this.selectedText.value = text;
  }

  private prepareExistingChildren(): void {
    for (let index = 0; index < this.childCount; ++index) {
      const child = this.getChildAt(index);
      if (child === null) {
        continue;
      }
      this.prepareSelectionDefaults(changetype<Node>(child), false);
    }
  }

  private prepareSelectionDefaults(node: Node, ancestorOwnsCursor: bool): void {
    if (node instanceof Text) {
      const textNode = changetype<Text>(node);
      if (!ancestorOwnsCursor && textNode.cursorStyle == CursorStyle.Default && textNode.usesDefaultSelectionBehavior) {
        textNode.selectable();
      }
      return;
    }

    if (node.isSelectionBarrier) {
      return;
    }

    const childAncestorOwnsCursor = ancestorOwnsCursor || node.cursorStyle != CursorStyle.Default;
    for (let index = 0; index < node.childCount; ++index) {
      const child = node.getChildAt(index);
      if (child === null) {
        continue;
      }
      this.prepareSelectionDefaults(changetype<Node>(child), childAncestorOwnsCursor);
    }
  }
}
