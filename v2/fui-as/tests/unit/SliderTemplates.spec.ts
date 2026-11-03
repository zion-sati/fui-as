import {
  Application,
  BorderStyle,
  FlexBox,
  FlexDirection,
  KeyEventType,
  PointerEventType,
  Slider,
  SliderPresenter,
  SliderPresenterMetrics,
  SliderSizing,
  SliderTemplate,
  SliderVisualState,
  SliderColors,
  Theme,
  Unit,
} from "../../src/Fui";
import {
  CALL_SET_FILL_HEIGHT,
  CALL_SET_FILL_WIDTH,
  CALL_SET_HEIGHT,
  CALL_SET_POSITION,
  CALL_SET_SEMANTIC_VALUE_RANGE,
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

class TrackingSliderPresenter extends SliderPresenter {
  readonly trackNode: FlexBox;
  readonly fillNode: FlexBox;
  readonly spacerNode: FlexBox;
  readonly thumbNode: FlexBox;
  layoutCount: i32 = 0;
  applyCount: i32 = 0;
  lastState: SliderVisualState | null = null;

  constructor() {
    const root = new FlexBox();
    super(root, new SliderPresenterMetrics(24.0, 10.0, 6.0));
    const trackNode = new FlexBox().positionAbsolute();
    const fillNode = new FlexBox().positionAbsolute();
    const spacerNode = new FlexBox();
    const thumbNode = new FlexBox()
      .width(24.0, Unit.Pixel)
      .height(24.0, Unit.Pixel);
    this.trackNode = trackNode;
    this.fillNode = fillNode;
    this.spacerNode = spacerNode;
    this.thumbNode = thumbNode;
    root.child(
      new FlexBox()
        .flexDirection(FlexDirection.Row)
        .height(24.0, Unit.Pixel)
        .fillWidth()
        .margin(12.0, 3.0, 12.0, 3.0)
        .child(trackNode)
        .child(fillNode)
        .child(spacerNode)
        .child(thumbNode),
    );
  }

  layout(state: SliderVisualState): void {
    this.layoutCount += 1;
    this.lastState = state;
    const fraction = state.normalizedValue;
    const trackOffset = (this.metrics.thumbSize - this.metrics.trackThickness) * 0.5;
    this.trackNode
      .width(100.0, Unit.Percent)
      .height(this.metrics.trackThickness, Unit.Pixel)
      .position(0.0, trackOffset);
    this.fillNode
      .width(fraction * 100.0, Unit.Percent)
      .height(this.metrics.trackThickness, Unit.Pixel)
      .position(0.0, trackOffset);
    this.spacerNode.width(fraction * 100.0, Unit.Percent);
    this.thumbNode.position(-12.0, 0.0);
  }

  apply(theme: Theme, state: SliderVisualState, _colors: SliderColors | null = null): void {
    this.applyCount += 1;
    this.lastState = state;
    const accent = state.dragging ? theme.colors.accentPressed : theme.colors.accent;
    this.trackNode.cornerRadius(this.metrics.trackThickness * 0.5);
    this.trackNode.bgColor(theme.colors.border);
    this.fillNode.cornerRadius(this.metrics.trackThickness * 0.5);
    this.fillNode.bgColor(accent);
    this.thumbNode.cornerRadius(7.0);
    this.thumbNode.bgColor(theme.colors.surface);
    this.thumbNode.border(2.0, accent);
  }
}

class TrackingSliderTemplate extends SliderTemplate {
  readonly created: Array<TrackingSliderPresenter> = new Array<TrackingSliderPresenter>();

  create(_sizing: SliderSizing | null = null): SliderPresenter {
    const presenter = new TrackingSliderPresenter();
    this.created.push(presenter);
    return presenter;
  }
}

describe("Slider templating", () => {
  afterEach(() => {
    Application.unmount();
  });

  it("slider supports a custom presenter template without breaking pointer math or persisted restore", () => {
    resetCalls();

    const initialTemplate = new TrackingSliderTemplate();
    const slider = new Slider(20.0)
      .min(0.0)
      .max(100.0)
      .step(5.0)
      .length(200.0)
      .template(initialTemplate)
      .nodeId("template-slider") as Slider;
    Application.mount(slider);

    const initialPresenter = unchecked(initialTemplate.created[0]);
    const presenterRoot = slider.getChildAt(0)!;
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, slider.builtHandle), 1)).toBe(210.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, slider.builtHandle), 1)).toBe(40.0);
    // The presenter's root fills the slider inside its chrome; the presenter lays out relative to it.
    expect<i32>(lastCallIndexForHandle(CALL_SET_FILL_WIDTH, presenterRoot.builtHandle)).toBeGreaterThan(-1);
    expect<i32>(lastCallIndexForHandle(CALL_SET_FILL_HEIGHT, presenterRoot.builtHandle)).toBeGreaterThan(-1);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, initialPresenter.trackNode.builtHandle), 1)).toBe(100.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, initialPresenter.trackNode.builtHandle), 2)).toBe(<f64>Unit.Percent);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, initialPresenter.trackNode.builtHandle), 1)).toBe(10.0);

    resetCalls();
    slider._handlePointerEvent(PointerEventType.Down, 149.0, 20.0, 0);
    slider._handlePointerEvent(PointerEventType.Up, 149.0, 20.0, 0);
    expect<f32>(slider.value).toBe(75.0);
    expect<f32>(initialPresenter.lastState!.value).toBe(75.0);
    expect<f32>(initialPresenter.lastState!.normalizedValue).toBe(0.75);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, initialPresenter.spacerNode.builtHandle), 1)).toBe(75.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, initialPresenter.spacerNode.builtHandle), 2)).toBe(<f64>Unit.Percent);
    expect<i32>(lastCallIndex(CALL_SET_SEMANTIC_VALUE_RANGE)).toBeGreaterThan(-1);

    Application.capturePersistedUiState();
    Application.unmount();

    const restoredTemplate = new TrackingSliderTemplate();
    const restoredSlider = new Slider(0.0)
      .min(0.0)
      .max(100.0)
      .step(5.0)
      .length(200.0)
      .template(restoredTemplate)
      .nodeId("template-slider") as Slider;
    Application.mount(restoredSlider);
    Application.restorePersistedUiState();

    const restoredPresenter = unchecked(restoredTemplate.created[0]);
    expect<f32>(restoredSlider.value).toBe(75.0);
    expect<f32>(restoredPresenter.lastState!.value).toBe(75.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, restoredPresenter.spacerNode.builtHandle), 1)).toBe(75.0);
  });

  it("slider can swap templates after build and keep keyboard stepping behavior", () => {
    resetCalls();

    const slider = new Slider(30.0)
      .min(0.0)
      .max(100.0)
      .step(10.0) as Slider;
    slider.build();
    const originalPresenterHandle = slider.getChildAt(0)!.builtHandle;

    resetCalls();
    const template = new TrackingSliderTemplate();
    slider.template(template);

    const presenter = unchecked(template.created[0]);
    const presenterHandle = slider.getChildAt(0)!.builtHandle;
    expect<u64>(presenterHandle).not.toBe(originalPresenterHandle);
    expect<i32>(lastCallIndexForHandle(CALL_SET_FILL_WIDTH, presenterHandle)).toBeGreaterThan(-1);
    expect<f32>(presenter.lastState!.value).toBe(30.0);

    resetCalls();
    slider._handleKeyEvent(KeyEventType.Down, "ArrowRight", 0);
    expect<f32>(slider.value).toBe(40.0);
    expect<f32>(presenter.lastState!.value).toBe(40.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, presenter.spacerNode.builtHandle), 1)).toBe(40.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_POSITION, presenter.thumbNode.builtHandle), 1)).toBe(-12.0);

    slider.dispose();
  });
});
