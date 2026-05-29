import { FlexDirection, Unit } from "../core/ffi";
import { Node } from "../core/Node";
import { FlexBox } from "./FlexBox";

export function px(value: f32): StaticArray<f32> {
  const pair = new StaticArray<f32>(2);
  unchecked(pair[0] = value);
  unchecked(pair[1] = <f32>Unit.Pixel);
  return pair;
}

export function pct(value: f32): StaticArray<f32> {
  const pair = new StaticArray<f32>(2);
  unchecked(pair[0] = value);
  unchecked(pair[1] = <f32>Unit.Percent);
  return pair;
}

export function Row(...children: Node[]): FlexBox {
  return new FlexBox().flexDirection(FlexDirection.Row).children(children);
}

export function Column(...children: Node[]): FlexBox {
  return new FlexBox().flexDirection(FlexDirection.Column).children(children);
}
