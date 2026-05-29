import {
  Application,
  Button,
  ButtonPresenter,
  ButtonTemplate,
  ButtonVisualState,
  BorderStyle,
  Checkbox,
  CheckboxIndicatorPresenter,
  CheckboxIndicatorTemplate,
  CheckboxIndicatorVisualState,
  FlexBox,
  CursorStyle,
  KeyEventType,
  PointerEventType,
  PressableIndicatorMetrics,
  RadioButton,
  RadioGroup,
  RadioIndicatorPresenter,
  RadioIndicatorTemplate,
  RadioIndicatorVisualState,
  SemanticCheckedState,
  Switch,
  SwitchIndicatorPresenter,
  SwitchIndicatorTemplate,
  SwitchIndicatorVisualState,
  Text,
  TextArea,
  TextInput,
  TextInputPresenter,
  TextInputTemplate,
  TextInputVisualState,
  Theme,
  Unit,
} from "../../src/Fui";
import {
  CALL_SET_BOX_STYLE,
  CALL_SET_HEIGHT,
  CALL_SET_POSITION,
  CALL_SET_SEMANTIC_CHECKED,
  CALL_SET_TEXT,
  CALL_SET_WIDTH,
  getCallArg,
  getCallSequence,
  lastTextEquals,
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

class TrackingCheckboxPresenter extends CheckboxIndicatorPresenter {
  readonly fillNode: FlexBox;
  applyCount: i32 = 0;
  lastState: CheckboxIndicatorVisualState | null = null;

  constructor() {
    const root = new FlexBox()
      .width(28.0, Unit.Pixel)
      .height(28.0, Unit.Pixel)
      .alignItems(1)
      .justifyContent(1);
    super(root, new PressableIndicatorMetrics(28.0, 28.0));
    const fillNode = new FlexBox()
      .width(12.0, Unit.Pixel)
      .height(12.0, Unit.Pixel);
    this.fillNode = fillNode;
    root.child(fillNode);
  }

  apply(theme: Theme, state: CheckboxIndicatorVisualState): void {
    this.applyCount += 1;
    this.lastState = state;
    const accent = state.pressed ? theme.colors.accentPressed : (state.hovered ? theme.colors.accentHovered : theme.colors.accent);
    this.root.cornerRadius(14.0);
    this.root.border(2.0, accent, BorderStyle.Solid);
    this.root.bgColor(theme.colors.surface);
    this.fillNode.cornerRadius(state.checkedState == SemanticCheckedState.Mixed ? 3.0 : 6.0);
    this.fillNode.width(state.checkedState == SemanticCheckedState.Mixed ? 14.0 : 12.0, Unit.Pixel);
    this.fillNode.height(state.checkedState == SemanticCheckedState.Mixed ? 6.0 : 12.0, Unit.Pixel);
    this.fillNode.bgColor(accent);
    this.fillNode.opacity(state.checkedState == SemanticCheckedState.False ? 0.0 : 1.0);
  }
}

class TrackingCheckboxTemplate extends CheckboxIndicatorTemplate {
  readonly created: Array<TrackingCheckboxPresenter> = new Array<TrackingCheckboxPresenter>();

  create(): CheckboxIndicatorPresenter {
    const presenter = new TrackingCheckboxPresenter();
    this.created.push(presenter);
    return presenter;
  }
}

class TrackingRadioPresenter extends RadioIndicatorPresenter {
  readonly dotNode: FlexBox;
  applyCount: i32 = 0;
  lastState: RadioIndicatorVisualState | null = null;

  constructor() {
    const root = new FlexBox()
      .width(26.0, Unit.Pixel)
      .height(26.0, Unit.Pixel)
      .alignItems(1)
      .justifyContent(1);
    super(root, new PressableIndicatorMetrics(26.0, 26.0));
    const dotNode = new FlexBox()
      .width(10.0, Unit.Pixel)
      .height(10.0, Unit.Pixel);
    this.dotNode = dotNode;
    root.child(dotNode);
  }

  apply(theme: Theme, state: RadioIndicatorVisualState): void {
    this.applyCount += 1;
    this.lastState = state;
    const accent = state.checked
      ? (state.pressed ? theme.colors.accentPressed : (state.hovered ? theme.colors.accentHovered : theme.colors.accent))
      : theme.colors.border;
    this.root.cornerRadius(13.0);
    this.root.border(2.0, accent, BorderStyle.Solid);
    this.root.bgColor(theme.colors.surface);
    this.dotNode.cornerRadius(5.0);
    this.dotNode.bgColor(accent);
    this.dotNode.opacity(state.checked ? 1.0 : 0.0);
  }
}

class TrackingRadioTemplate extends RadioIndicatorTemplate {
  readonly created: Array<TrackingRadioPresenter> = new Array<TrackingRadioPresenter>();

  create(): RadioIndicatorPresenter {
    const presenter = new TrackingRadioPresenter();
    this.created.push(presenter);
    return presenter;
  }
}

class TrackingSwitchPresenter extends SwitchIndicatorPresenter {
  readonly thumbNode: FlexBox;
  applyCount: i32 = 0;
  lastState: SwitchIndicatorVisualState | null = null;

  constructor() {
    const root = new FlexBox()
      .width(52.0, Unit.Pixel)
      .height(30.0, Unit.Pixel);
    super(root, new PressableIndicatorMetrics(52.0, 30.0));
    const thumbNode = new FlexBox()
      .positionAbsolute()
      .position(4.0, 3.0)
      .width(18.0, Unit.Pixel)
      .height(18.0, Unit.Pixel);
    this.thumbNode = thumbNode;
    root.child(thumbNode);
  }

  apply(theme: Theme, state: SwitchIndicatorVisualState): void {
    this.applyCount += 1;
    this.lastState = state;
    const accent = state.checked
      ? (state.pressed ? theme.colors.accentPressed : (state.hovered ? theme.colors.accentHovered : theme.colors.accent))
      : theme.colors.border;
    this.root.cornerRadius(15.0);
    this.root.border(2.0, accent, BorderStyle.Solid);
    this.root.bgColor(theme.colors.surface);
    this.thumbNode.position(state.checked ? 30.0 : 4.0, 3.0);
    this.thumbNode.cornerRadius(9.0);
    this.thumbNode.bgColor(accent);
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

class TrackingButtonPresenter extends ButtonPresenter {
  applyCount: i32 = 0;
  lastState: ButtonVisualState | null = null;

  constructor(private readonly contentWidth: f32) {
    const labelNode = new Text("");
    const contentRoot = new FlexBox()
      .width(contentWidth, Unit.Pixel)
      .height(26.0, Unit.Pixel)
      .alignItems(1)
      .justifyContent(1)
      .child(labelNode);
    super(contentRoot, labelNode);
  }

  apply(theme: Theme, state: ButtonVisualState): void {
    this.applyCount += 1;
    this.lastState = state;
    const accent = state.pressed
      ? theme.colors.accentPressed
      : (state.hovered ? theme.colors.accentHovered : theme.colors.accent);
    this.host
      .cornerRadius(14.0)
      .border(2.0, accent, BorderStyle.Solid)
      .padding(12.0, 8.0, 12.0, 8.0)
      .bgColor(theme.colors.surface);
    this.contentRoot
      .width(this.contentWidth, Unit.Pixel)
      .height(26.0, Unit.Pixel)
      .alignItems(1)
      .justifyContent(1);
    this.labelNode
      .font(theme.fonts.body, theme.fonts.sizeBody)
      .textColor(accent);
  }
}

class TrackingButtonTemplate extends ButtonTemplate {
  readonly created: Array<TrackingButtonPresenter> = new Array<TrackingButtonPresenter>();

  constructor(private readonly contentWidth: f32) {
    super();
  }

  create(): ButtonPresenter {
    const presenter = new TrackingButtonPresenter(this.contentWidth);
    this.created.push(presenter);
    return presenter;
  }
}

class TrackingTextInputPresenter extends TextInputPresenter {
  applyCount: i32 = 0;
  lastState: TextInputVisualState | null = null;

  constructor(private readonly inset: f32) {
    super();
  }

  apply(theme: Theme, state: TextInputVisualState): void {
    this.applyCount += 1;
    this.lastState = state;
    this.host
      .cornerRadius(state.multiline ? 18.0 : 14.0)
      .border(2.0, theme.colors.accent, BorderStyle.Solid)
      .padding(this.inset, this.inset, this.inset, this.inset)
      .bgColor(theme.colors.surface);
    this.editorHost.cursor(state.enabled ? CursorStyle.Text : CursorStyle.Default);
    this.placeholderHost
      .position(this.inset, this.inset)
      .width(100.0, Unit.Percent);
  }
}

class TrackingTextInputTemplate extends TextInputTemplate {
  readonly created: Array<TrackingTextInputPresenter> = new Array<TrackingTextInputPresenter>();

  constructor(private readonly inset: f32) {
    super();
  }

  create(): TextInputPresenter {
    const presenter = new TrackingTextInputPresenter(this.inset);
    this.created.push(presenter);
    return presenter;
  }
}

describe("Public control templates", () => {
  afterEach(() => {
    Application.unmount();
  });

  it("checkbox supports a custom indicator template without breaking semantics or persisted restore", () => {
    resetCalls();

    const initialTemplate = new TrackingCheckboxTemplate();
    const checkbox = new Checkbox("Custom checkbox")
      .template(initialTemplate)
      .nodeId("template-checkbox") as Checkbox;
    Application.mount(checkbox);

    const initialPresenter = unchecked(initialTemplate.created[0]);
    const indicatorHandle = checkbox.getChildAt(0)!.builtHandle;
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, indicatorHandle), 1)).toBe(28.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, indicatorHandle), 1)).toBe(28.0);

    resetCalls();
    checkbox._handlePointerEvent(PointerEventType.Down, 6.0, 6.0, 0);
    checkbox._handlePointerEvent(PointerEventType.Up, 6.0, 6.0, 0);
    expect<SemanticCheckedState>(checkbox.checkedState).toBe(SemanticCheckedState.True);
    expect<bool>(initialPresenter.lastState!.checkedState == SemanticCheckedState.True).toBe(true);
    expect<i32>(lastCallIndex(CALL_SET_SEMANTIC_CHECKED)).toBeGreaterThan(-1);

    Application.capturePersistedUiState();
    Application.unmount();

    const restoredTemplate = new TrackingCheckboxTemplate();
    const restoredCheckbox = new Checkbox("Custom checkbox")
      .template(restoredTemplate)
      .nodeId("template-checkbox") as Checkbox;
    Application.mount(restoredCheckbox);
    Application.restorePersistedUiState();

    const restoredPresenter = unchecked(restoredTemplate.created[0]);
    expect<SemanticCheckedState>(restoredCheckbox.checkedState).toBe(SemanticCheckedState.True);
    expect<bool>(restoredPresenter.lastState!.checkedState == SemanticCheckedState.True).toBe(true);
  });

  it("radio buttons keep grouped selection behavior with custom indicator templates", () => {
    resetCalls();

    const alphaTemplate = new TrackingRadioTemplate();
    const betaTemplate = new TrackingRadioTemplate();
    const alpha = new RadioButton("alpha", "Alpha").template(alphaTemplate) as RadioButton;
    const beta = new RadioButton("beta", "Beta").template(betaTemplate) as RadioButton;
    const group = new RadioGroup()
      .addOptions([alpha, beta])
      .selectIndex(0) as RadioGroup;
    group.build();

    const betaIndicatorHandle = beta.getChildAt(0)!.builtHandle;
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, betaIndicatorHandle), 1)).toBe(26.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, betaIndicatorHandle), 1)).toBe(26.0);

    resetCalls();
    alpha._handleKeyEvent(KeyEventType.Down, "ArrowDown", 0);
    expect<string>(group.selectedValue).toBe("beta");
    expect<bool>(unchecked(betaTemplate.created[0]).lastState!.checked).toBe(true);
    expect<i32>(lastCallIndex(CALL_SET_SEMANTIC_CHECKED)).toBeGreaterThan(-1);

    group.dispose();
  });

  it("switch can swap to a custom template after build and keep keyboard activation behavior", () => {
    resetCalls();

    const control = new Switch("Custom switch");
    const handle = control.build();
    const originalIndicatorHandle = control.getChildAt(0)!.builtHandle;

    control.check(true);
    resetCalls();

    const template = new TrackingSwitchTemplate();
    control.template(template);

    const presenter = unchecked(template.created[0]);
    const indicatorHandle = control.getChildAt(0)!.builtHandle;
    expect<u64>(indicatorHandle).not.toBe(originalIndicatorHandle);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, indicatorHandle), 1)).toBe(52.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, indicatorHandle), 1)).toBe(30.0);
    expect<bool>(presenter.lastState!.checked).toBe(true);
    expect<i32>(lastCallIndexForHandle(CALL_SET_BOX_STYLE, indicatorHandle)).toBeGreaterThan(-1);
    expect<i32>(lastCallIndexForHandle(CALL_SET_POSITION, presenter.thumbNode.builtHandle)).toBeGreaterThan(-1);

    resetCalls();
    control._handleKeyEvent(KeyEventType.Down, " ", 0);
    control._handleKeyEvent(KeyEventType.Up, " ", 0);

    expect<bool>(control.checked).toBe(false);
    expect<bool>(presenter.lastState!.checked).toBe(false);
    control.dispose();
  });

  it("button can swap to a custom template after build and keep label/state wiring", () => {
    resetCalls();

    const button = new Button("Launch");
    button.build();
    const originalContentHandle = button.getChildAt(0)!.builtHandle;

    resetCalls();
    const template = new TrackingButtonTemplate(92.0);
    button.template(template);

    const presenter = unchecked(template.created[0]);
    const contentHandle = button.getChildAt(0)!.builtHandle;
    expect<u64>(contentHandle).not.toBe(originalContentHandle);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, contentHandle), 1)).toBe(92.0);

    resetCalls();
    button.label("Relaunch");
    expect<i32>(lastCallIndex(CALL_SET_TEXT)).toBeGreaterThan(-1);
    expect<bool>(lastTextEquals("Relaunch")).toBe(true);

    resetCalls();
    button._handlePointerEvent(PointerEventType.Down, 8.0, 8.0, 0);
    expect<bool>(presenter.lastState!.pressed).toBe(true);

    resetCalls();
    button._handlePointerEvent(PointerEventType.Up, 8.0, 8.0, 0);
    expect<bool>(presenter.lastState!.pressed).toBe(false);
    button.dispose();
  });

  it("text input and text area accept custom templates without breaking their control-specific state", () => {
    resetCalls();
    const inputTemplate = new TrackingTextInputTemplate(11.0);
    const input = new TextInput("Alpha");
    const inputHandle = input.build();
    input.template(inputTemplate);
    const inputPresenter = unchecked(inputTemplate.created[0]);
    expect<bool>(inputPresenter.lastState!.multiline).toBe(false);
    expect<bool>(inputPresenter.lastState!.wrapping).toBe(false);
    expect<i32>(lastCallIndexForHandle(CALL_SET_BOX_STYLE, inputHandle)).toBeGreaterThan(-1);

    resetCalls();
    const areaTemplate = new TrackingTextInputTemplate(16.0);
    const area = new TextArea("Bravo").wrapping(false);
    area.template(areaTemplate);
    area.build();
    const areaPresenter = unchecked(areaTemplate.created[0]);
    expect<bool>(areaPresenter.lastState!.multiline).toBe(true);
    expect<bool>(areaPresenter.lastState!.wrapping).toBe(false);

    resetCalls();
    area.wrapping(true);
    expect<bool>(areaPresenter.lastState!.wrapping).toBe(true);

    input.dispose();
    area.dispose();
  });
});
