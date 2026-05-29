import { FlexBox } from "../../nodes";

export class PressableIndicatorMetrics {
  constructor(
    readonly width: f32,
    readonly height: f32,
  ) {}
}

export class PressableIndicatorVisualState {
  constructor(
    readonly hovered: bool,
    readonly pressed: bool,
    readonly focused: bool,
    readonly enabled: bool,
  ) {}
}

export abstract class PressableIndicatorPresenter {
  protected constructor(
    private readonly rootValue: FlexBox,
    private readonly metricsValue: PressableIndicatorMetrics,
  ) {}

  get root(): FlexBox {
    return this.rootValue;
  }

  get metrics(): PressableIndicatorMetrics {
    return this.metricsValue;
  }
}
