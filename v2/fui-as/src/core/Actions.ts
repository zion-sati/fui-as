import { NodeAction } from "./Action";
import { FlexBox } from "../nodes/FlexBox";
import { Text } from "../nodes/Text";

export class SetTextAction extends NodeAction<string> {
  private readonly textNode: Text;

  constructor(node: Text) {
    super(node);
    this.textNode = node;
  }

  invoke(value: string): void {
    this.textNode.text(value);
  }

  debugName(): string {
    return "SetTextAction";
  }
}

export class SetBackgroundAction extends NodeAction<u32> {
  private readonly boxNode: FlexBox;

  constructor(node: FlexBox) {
    super(node);
    this.boxNode = node;
  }

  invoke(value: u32): void {
    this.boxNode.bgColor(value);
  }

  debugName(): string {
    return "SetBackgroundAction";
  }
}
