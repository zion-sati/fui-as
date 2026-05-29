import { Signal } from "../core/Signal";

export class ScrollState {
  readonly offsetX: Signal<f32> = new Signal<f32>(0.0);
  readonly offsetY: Signal<f32> = new Signal<f32>(0.0);
  readonly contentWidth: Signal<f32> = new Signal<f32>(0.0);
  readonly contentHeight: Signal<f32> = new Signal<f32>(0.0);
  readonly viewportWidth: Signal<f32> = new Signal<f32>(0.0);
  readonly viewportHeight: Signal<f32> = new Signal<f32>(0.0);
}
