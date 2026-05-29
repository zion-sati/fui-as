import { Application } from "../../src/core/Application";
import { EventRouter } from "../../src/core/EventRouter";
import { KeyEventType, PointerEventType, SemanticRole, Unit } from "../../src/core/ffi";
import { activeTheme, defaultDarkTheme, Theme } from "../../src/core/Theme";
import { FlexBox } from "../../src/nodes";
import { PressableLabeledControl } from "../../src/controls/internal/PressableLabeledControl";
import {
  PressableIndicatorMetrics,
} from "../../src/controls/internal/PressableIndicatorPresenter";
import {
  SwitchIndicatorPresenter,
  SwitchIndicatorTemplate,
  SwitchIndicatorVisualState,
} from "../../src/controls/internal/SwitchIndicatorPresenter";
import {
  CALL_SET_BOX_STYLE,
  CALL_SET_HEIGHT,
  CALL_SET_WIDTH,
  getCallArg,
  getCallSequence,
  resetCalls,
} from "./FfiTestImports";

function lastCallIndex(op: i32): i32 {
  const sequence = getCallSequence();
  let index = -1;
  for (let i = 0; i < sequence.length; ++i) {
    if (unchecked(sequence[i]) == op) {
      index = i;
    }
  }
  return index;
}

function lastCallIndexForHandle(op: i32, handle: u64): i32 {
  const sequence = getCallSequence();
  let index = -1;
  for (let i = 0; i < sequence.length; ++i) {
    if (unchecked(sequence[i]) != op) {
      continue;
    }
    if (getCallArg(i, 0) == <f64>handle) {
      index = i;
    }
  }
  return index;
}

class TrackingSwitchPresenter extends SwitchIndicatorPresenter {
  applyCount: i32 = 0;
  lastState: SwitchIndicatorVisualState | null = null;

  constructor() {
    const root = new FlexBox()
      .width(60.0, Unit.Pixel)
      .height(24.0, Unit.Pixel);
    super(root, new PressableIndicatorMetrics(60.0, 24.0));
  }

  apply(_theme: Theme, state: SwitchIndicatorVisualState): void {
    this.applyCount += 1;
    this.lastState = state;
    this.root.bgColor(state.checked ? 0xff00ffff : 0xff0000ff);
  }
}

class TrackingSwitchTemplate extends SwitchIndicatorTemplate {
  readonly created: Array<TrackingSwitchPresenter> = new Array<TrackingSwitchPresenter>();

  create(): SwitchIndicatorPresenter {
    const presenter = new TrackingSwitchPresenter();
    this.created.push(presenter);
    return presenter;
  }
}

class TestTemplatedSwitch extends PressableLabeledControl {
  readonly presenter: TrackingSwitchPresenter;
  checked: bool = false;
  activationCount: i32 = 0;

  constructor(label: string, template: TrackingSwitchTemplate) {
    const presenter = changetype<TrackingSwitchPresenter>(template.create());
    super(SemanticRole.Switch, label, presenter.root);
    this.presenter = presenter;
    this.syncVisualState();
  }

  protected handleActivated(): void {
    this.checked = !this.checked;
    this.activationCount += 1;
    this.syncVisualState();
  }

  protected syncVisualState(): void {
    this.presenter.apply(
      activeTheme.value,
      new SwitchIndicatorVisualState(
        this.checked,
        this.hoveredState,
        this.pressedState,
        this.focusedState,
        this.isEnabled,
      ),
    );
  }
}

describe("Pressable indicator presenters", () => {
  afterEach(() => {
    Application.unmount();
    activeTheme.value = defaultDarkTheme;
  });

  it("lets a pressable control host a replacement indicator presenter without changing activation behavior", () => {
    EventRouter.reset();
    resetCalls();

    const template = new TrackingSwitchTemplate();
    const control = new TestTemplatedSwitch("Custom switch", template);
    control.build();
    const presenter = control.presenter;
    expect<i32>(template.created.length).toBe(1);
    expect<f32>(presenter.metrics.width).toBe(60.0);
    expect<f32>(presenter.metrics.height).toBe(24.0);

    const indicatorHandle = control.getChildAt(0)!.builtHandle;
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, indicatorHandle), 1)).toBe(60.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, indicatorHandle), 1)).toBe(24.0);
    expect<i32>(presenter.applyCount).toBeGreaterThan(0);
    expect<bool>(presenter.lastState!.checked).toBe(false);

    resetCalls();
    control._handlePointerEvent(PointerEventType.Down, 6.0, 6.0, 0);
    control._handlePointerEvent(PointerEventType.Up, 6.0, 6.0, 0);

    expect<i32>(control.activationCount).toBe(1);
    expect<bool>(control.checked).toBe(true);
    expect<bool>(presenter.lastState!.checked).toBe(true);
    expect<i32>(lastCallIndexForHandle(CALL_SET_BOX_STYLE, indicatorHandle)).toBeGreaterThan(-1);
  });

  it("preserves keyboard activation semantics when a replacement indicator presenter is used", () => {
    EventRouter.reset();
    resetCalls();

    const control = new TestTemplatedSwitch("Custom switch", new TrackingSwitchTemplate());
    const handle = control.build();
    resetCalls();

    EventRouter.dispatchKeyEvent(handle, KeyEventType.Down, " ", 0);
    EventRouter.dispatchKeyEvent(handle, KeyEventType.Up, " ", 0);

    expect<bool>(control.checked).toBe(true);
    expect<i32>(control.activationCount).toBe(1);
    expect<bool>(control.presenter.lastState!.pressed).toBe(false);
    expect<bool>(control.presenter.lastState!.checked).toBe(true);
  });
});
