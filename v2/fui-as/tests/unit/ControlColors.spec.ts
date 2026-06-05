import {
  Application,
  Button,
  ButtonColors,
  ButtonPresenter,
  ButtonTemplate,
  ButtonVisualState,
  Checkbox,
  CheckboxIndicatorPresenter,
  CheckboxIndicatorTemplate,
  CheckboxIndicatorVisualState,
  Dropdown,
  DropdownFieldPresenter,
  DropdownFieldTemplate,
  DropdownFieldVisualState,
  DropdownItem,
  DropdownColors,
  FlexBox,
  LabeledControlColors,
  PointerEventType,
  PressableIndicatorMetrics,
  RadioButton,
  RadioIndicatorPresenter,
  RadioIndicatorTemplate,
  RadioIndicatorVisualState,
  Switch,
  SwitchIndicatorPresenter,
  SwitchIndicatorTemplate,
  SwitchIndicatorVisualState,
  Text,
  TextInput,
  TextInputColors,
  Theme,
  Unit,
} from "../../src/Fui";
import {
  CALL_SET_CARET_COLOR,
  CALL_SET_BOX_STYLE,
  CALL_SET_TEXT_COLOR,
  findCall,
  getCallArg,
  resetCalls,
} from "./FfiTestImports";
import { lastBackgroundColor, lastBorderColor, lastCallIndex } from "./ButtonTestUtils";

class Recorder extends DropdownFieldPresenter {
  lastColors: DropdownColors | null = null;
  applyCount: i32 = 0;

  constructor() {
    const valueNode = new Text("")
      .selectable(false)
      .fillWidth()
      .maxLines(1)
      .wrapping(false) as Text;
    const valueHost = new FlexBox()
      .fillWidth()
      .child(valueNode) as FlexBox;
    const chevronHost = new FlexBox()
      .width(20.0, Unit.Pixel)
      .height(20.0, Unit.Pixel)
      .alignItems(1)
      .justifyContent(1);
    const root = new FlexBox()
      .child(valueHost)
      .child(chevronHost);
    super(root, valueHost, valueNode, chevronHost);
  }

  apply(theme: Theme, state: DropdownFieldVisualState, colors: DropdownColors | null = null): void {
    this.applyCount += 1;
    this.lastColors = colors;
    this.root.cornerRadius(4.0);
  }
}

class RecorderTemplate extends DropdownFieldTemplate {
  created: Array<Recorder> = new Array<Recorder>();
  create(): DropdownFieldPresenter {
    const p = new Recorder();
    this.created.push(p);
    return p;
  }
}

class ButtonRecorder extends ButtonPresenter {
  lastColors: ButtonColors | null = null;
  applyCount: i32 = 0;

  constructor() {
    const labelNode = new Text("");
    const contentRoot = new FlexBox()
      .alignItems(1)
      .justifyContent(1)
      .child(labelNode);
    super(contentRoot, labelNode);
  }

  apply(_theme: Theme, _state: ButtonVisualState, colors: ButtonColors | null = null): void {
    this.applyCount += 1;
    this.lastColors = colors;
  }
}

class ButtonRecorderTemplate extends ButtonTemplate {
  created: Array<ButtonRecorder> = new Array<ButtonRecorder>();

  create(): ButtonPresenter {
    const presenter = new ButtonRecorder();
    this.created.push(presenter);
    return presenter;
  }
}

class CheckboxRecorder extends CheckboxIndicatorPresenter {
  lastColors: LabeledControlColors | null = null;
  applyCount: i32 = 0;

  constructor() {
    const root = new FlexBox()
      .width(20.0, Unit.Pixel)
      .height(20.0, Unit.Pixel);
    super(root, new PressableIndicatorMetrics(20.0, 20.0));
  }

  apply(_theme: Theme, _state: CheckboxIndicatorVisualState, colors: LabeledControlColors | null = null): void {
    this.applyCount += 1;
    this.lastColors = colors;
  }
}

class CheckboxRecorderTemplate extends CheckboxIndicatorTemplate {
  created: Array<CheckboxRecorder> = new Array<CheckboxRecorder>();

  create(): CheckboxIndicatorPresenter {
    const presenter = new CheckboxRecorder();
    this.created.push(presenter);
    return presenter;
  }
}

class RadioRecorder extends RadioIndicatorPresenter {
  lastColors: LabeledControlColors | null = null;
  applyCount: i32 = 0;

  constructor() {
    const root = new FlexBox()
      .width(20.0, Unit.Pixel)
      .height(20.0, Unit.Pixel);
    super(root, new PressableIndicatorMetrics(20.0, 20.0));
  }

  apply(_theme: Theme, _state: RadioIndicatorVisualState, colors: LabeledControlColors | null = null): void {
    this.applyCount += 1;
    this.lastColors = colors;
  }
}

class RadioRecorderTemplate extends RadioIndicatorTemplate {
  created: Array<RadioRecorder> = new Array<RadioRecorder>();

  create(): RadioIndicatorPresenter {
    const presenter = new RadioRecorder();
    this.created.push(presenter);
    return presenter;
  }
}

class SwitchRecorder extends SwitchIndicatorPresenter {
  lastColors: LabeledControlColors | null = null;
  applyCount: i32 = 0;

  constructor() {
    const root = new FlexBox()
      .width(36.0, Unit.Pixel)
      .height(20.0, Unit.Pixel);
    super(root, new PressableIndicatorMetrics(36.0, 20.0));
  }

  apply(_theme: Theme, _state: SwitchIndicatorVisualState, colors: LabeledControlColors | null = null): void {
    this.applyCount += 1;
    this.lastColors = colors;
  }
}

class SwitchRecorderTemplate extends SwitchIndicatorTemplate {
  created: Array<SwitchRecorder> = new Array<SwitchRecorder>();

  create(): SwitchIndicatorPresenter {
    const presenter = new SwitchRecorder();
    this.created.push(presenter);
    return presenter;
  }
}

describe("Control colors", () => {
  afterEach(() => {
    Application.unmount();
  });

  it("TextInput respects colors overrides", () => {
    resetCalls();

    const input = new TextInput("value");
    input.colors(new TextInputColors()
      .background(0x11223344)
      .textPrimary(0x22334455)
      .caret(0x33445566)
      .placeholder(0x44556677)
      .border(0x55667788));
    input.build();

    const boxIndex = lastCallIndex(CALL_SET_BOX_STYLE);
    expect<i32>(boxIndex).toBeGreaterThan(-1);
    expect<u32>(<u32>getCallArg(boxIndex, 1)).toBe(0x11223344);

    const caretIndex = findCall(CALL_SET_CARET_COLOR);
    expect<i32>(caretIndex).toBeGreaterThan(-1);
    expect<u32>(<u32>getCallArg(caretIndex, 1)).toBe(0x33445566);

    input.dispose();
  });

  it("Dropdown field presenter receives colors overrides", () => {
    resetCalls();

    const template = new RecorderTemplate();
    const dropdown = new Dropdown()
      .items([new DropdownItem("one", "One")])
      .fieldTemplate(template)
      .colors(new DropdownColors().background(0x99AABBCC).textPrimary(0x55667788));
    dropdown.build();

    const p = unchecked(template.created[0]);
    expect<i32>(p.applyCount).toBeGreaterThan(0);
    const colors = p.lastColors;
    if (colors === null) {
      unreachable();
    }
    expect<u32>((<DropdownColors>colors).backgroundColor).toBe(0x99AABBCC);
    expect<u32>((<DropdownColors>colors).textPrimaryColor).toBe(0x55667788);

    dropdown.dispose();
  });

  it("Button respects colors overrides", () => {
    resetCalls();

    const button = new Button("Launch")
      .colors(new ButtonColors()
        .background(0x11223344)
        .backgroundHover(0x22334455)
        .backgroundPressed(0x33445566)
        .textPrimary(0x44556677)
        .border(0x55667788));
    button.build();

    const boxIndex = lastCallIndex(CALL_SET_BOX_STYLE);
    expect<i32>(boxIndex).toBeGreaterThan(-1);
    expect<u32>(<u32>getCallArg(boxIndex, 1)).toBe(0x11223344);
    expect<u32>(lastBorderColor()).toBe(0x55667788);
    const textColorIndex = findCall(CALL_SET_TEXT_COLOR);
    expect<i32>(textColorIndex).toBeGreaterThan(-1);
    expect<u32>(<u32>getCallArg(textColorIndex, 1)).toBe(0x44556677);

    resetCalls();
    button._handlePointerEvent(PointerEventType.Enter, 4.0, 4.0, 0);
    expect<u32>(lastBackgroundColor()).toBe(0x22334455);

    resetCalls();
    button._handlePointerEvent(PointerEventType.Down, 4.0, 4.0, 0);
    expect<u32>(lastBackgroundColor()).toBe(0x33445566);

    button.dispose();
  });

  it("Button presenter receives colors overrides", () => {
    resetCalls();

    const template = new ButtonRecorderTemplate();
    const button = new Button("Launch")
      .template(template)
      .colors(new ButtonColors().background(0x89ABCDEF).textPrimary(0x12345678));
    button.build();

    const presenter = unchecked(template.created[0]);
    expect<i32>(presenter.applyCount).toBeGreaterThan(0);
    const colors = presenter.lastColors;
    if (colors === null) {
      unreachable();
    }
    expect<u32>((<ButtonColors>colors).backgroundColor).toBe(0x89ABCDEF);
    expect<u32>((<ButtonColors>colors).textPrimaryColor).toBe(0x12345678);

    button.dispose();
  });

  it("Checkbox indicator presenter receives colors overrides", () => {
    resetCalls();

    const template = new CheckboxRecorderTemplate();
    const checkbox = new Checkbox("Remember me")
      .template(template)
      .colors(new LabeledControlColors().background(0x10203040).border(0x20304050).accent(0x30405060));
    checkbox.build();

    const presenter = unchecked(template.created[0]);
    expect<i32>(presenter.applyCount).toBeGreaterThan(0);
    const colors = presenter.lastColors;
    if (colors === null) {
      unreachable();
    }
    expect<u32>((<LabeledControlColors>colors).backgroundColor).toBe(0x10203040);
    expect<u32>((<LabeledControlColors>colors).borderColor).toBe(0x20304050);
    expect<u32>((<LabeledControlColors>colors).accentColor).toBe(0x30405060);

    checkbox.dispose();
  });

  it("Radio indicator presenter receives colors overrides", () => {
    resetCalls();

    const template = new RadioRecorderTemplate();
    const radio = new RadioButton("alpha", "Alpha")
      .template(template)
      .colors(new LabeledControlColors().background(0x11224466).border(0x22335577).accent(0x33446688));
    radio.build();

    const presenter = unchecked(template.created[0]);
    expect<i32>(presenter.applyCount).toBeGreaterThan(0);
    const colors = presenter.lastColors;
    if (colors === null) {
      unreachable();
    }
    expect<u32>((<LabeledControlColors>colors).backgroundColor).toBe(0x11224466);
    expect<u32>((<LabeledControlColors>colors).borderColor).toBe(0x22335577);
    expect<u32>((<LabeledControlColors>colors).accentColor).toBe(0x33446688);

    radio.dispose();
  });

  it("Switch indicator presenter receives colors overrides", () => {
    resetCalls();

    const template = new SwitchRecorderTemplate();
    const control = new Switch("Quick actions")
      .template(template)
      .colors(new LabeledControlColors().background(0x99AABBCC).border(0xAABBCCDD).accent(0xBBCCDDEE));
    control.build();

    const presenter = unchecked(template.created[0]);
    expect<i32>(presenter.applyCount).toBeGreaterThan(0);
    const colors = presenter.lastColors;
    if (colors === null) {
      unreachable();
    }
    expect<u32>((<LabeledControlColors>colors).backgroundColor).toBe(0x99AABBCC);
    expect<u32>((<LabeledControlColors>colors).borderColor).toBe(0xAABBCCDD);
    expect<u32>((<LabeledControlColors>colors).accentColor).toBe(0xBBCCDDEE);

    control.dispose();
  });
});
