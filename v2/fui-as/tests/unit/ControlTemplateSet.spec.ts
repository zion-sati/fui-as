import {
  Application,
  ApplicationRegistration,
  Button,
  ButtonPresenter,
  ButtonTemplate,
  ButtonVisualState,
  BorderStyle,
  Checkbox,
  CheckboxIndicatorPresenter,
  CheckboxIndicatorTemplate,
  CheckboxIndicatorVisualState,
  clearControlTemplates,
  ControlTemplateSet,
  Dropdown,
  DropdownFieldPresenter,
  DropdownFieldTemplate,
  DropdownFieldVisualState,
  DropdownItem,
  FlexBox,
  Node,
  PressableIndicatorMetrics,
  Theme,
  Text,
  TextArea,
  TextInput,
  TextInputPresenter,
  TextInputTemplate,
  TextInputVisualState,
  Unit,
} from "../../src/Fui";
import {
  CALL_SET_BOX_STYLE,
  CALL_SET_HEIGHT,
  CALL_SET_WIDTH,
  getCallArg,
  getCallSequence,
  resetCalls,
} from "./FfiTestImports";

let activeFixture: ControlTemplateSetFixture | null = null;

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

class AppDefaultCheckboxPresenter extends CheckboxIndicatorPresenter {
  constructor(private readonly size: f32) {
    const root = new FlexBox()
      .width(size, Unit.Pixel)
      .height(size, Unit.Pixel)
      .alignItems(1)
      .justifyContent(1);
    const fillNode = new FlexBox()
      .width(size - 12.0, Unit.Pixel)
      .height(size - 12.0, Unit.Pixel);
    root.child(fillNode);
    super(root, new PressableIndicatorMetrics(size, size));
  }

  apply(theme: Theme, state: CheckboxIndicatorVisualState): void {
    this.root
      .cornerRadius(this.size * 0.5)
      .border(2.0, theme.colors.accent, BorderStyle.Solid)
      .bgColor(state.checkedState == 0 ? theme.colors.surface : theme.colors.accent);
  }
}

class AppDefaultCheckboxTemplate extends CheckboxIndicatorTemplate {
  readonly created: Array<AppDefaultCheckboxPresenter> = new Array<AppDefaultCheckboxPresenter>();

  constructor(private readonly size: f32) {
    super();
  }

  create(): CheckboxIndicatorPresenter {
    const presenter = new AppDefaultCheckboxPresenter(this.size);
    this.created.push(presenter);
    return presenter;
  }
}

class AppDefaultDropdownFieldPresenter extends DropdownFieldPresenter {
  constructor(private readonly chevronWidth: f32) {
    const valueNode = new Text("")
      .selectable(false)
      .width(100.0, Unit.Percent)
      .maxLines(1)
      .wrapping(false) as Text;
    const valueHost = new FlexBox()
      .width(0.0, Unit.Pixel)
      .flexGrow(1.0)
      .child(valueNode) as FlexBox;
    const chevronHost = new FlexBox()
      .width(chevronWidth, Unit.Pixel)
      .height(chevronWidth, Unit.Pixel)
      .alignItems(1)
      .justifyContent(1);
    const root = new FlexBox()
      .child(valueHost)
      .child(chevronHost);
    super(root, valueHost, valueNode, chevronHost);
  }

  apply(theme: Theme, state: DropdownFieldVisualState): void {
    this.root
      .cornerRadius(14.0)
      .border(2.0, theme.colors.accent, BorderStyle.Solid)
      .padding(12.0, 8.0, 12.0, 8.0)
      .bgColor(state.open ? theme.colors.background : theme.colors.surface);
    this.valueHost
      .width(0.0, Unit.Pixel)
      .flexGrow(1.0);
    this.valueNode
      .font(theme.fonts.body, theme.fonts.sizeBody)
      .textColor(theme.colors.textPrimary);
    this.chevronHost
      .width(this.chevronWidth, Unit.Pixel)
      .height(this.chevronWidth, Unit.Pixel)
      .alignItems(1)
      .justifyContent(1);
  }
}

class AppDefaultDropdownFieldTemplate extends DropdownFieldTemplate {
  readonly created: Array<AppDefaultDropdownFieldPresenter> = new Array<AppDefaultDropdownFieldPresenter>();

  constructor(private readonly chevronWidth: f32) {
    super();
  }

  create(): DropdownFieldPresenter {
    const presenter = new AppDefaultDropdownFieldPresenter(this.chevronWidth);
    this.created.push(presenter);
    return presenter;
  }
}

class AppDefaultButtonPresenter extends ButtonPresenter {
  constructor(private readonly contentWidth: f32) {
    const labelNode = new Text("");
    const contentRoot = new FlexBox()
      .width(contentWidth, Unit.Pixel)
      .height(24.0, Unit.Pixel)
      .alignItems(1)
      .justifyContent(1)
      .child(labelNode);
    super(contentRoot, labelNode);
  }

  apply(theme: Theme, _state: ButtonVisualState): void {
    this.host
      .cornerRadius(14.0)
      .border(2.0, theme.colors.accent, BorderStyle.Solid)
      .padding(12.0, 8.0, 12.0, 8.0)
      .bgColor(theme.colors.surface);
    this.contentRoot
      .width(this.contentWidth, Unit.Pixel)
      .height(24.0, Unit.Pixel)
      .alignItems(1)
      .justifyContent(1);
    this.labelNode
      .font(theme.fonts.body, theme.fonts.sizeBody)
      .textColor(theme.colors.accent);
  }
}

class AppDefaultButtonTemplate extends ButtonTemplate {
  readonly created: Array<AppDefaultButtonPresenter> = new Array<AppDefaultButtonPresenter>();

  constructor(private readonly contentWidth: f32) {
    super();
  }

  create(): ButtonPresenter {
    const presenter = new AppDefaultButtonPresenter(this.contentWidth);
    this.created.push(presenter);
    return presenter;
  }
}

class AppDefaultTextInputPresenter extends TextInputPresenter {
  lastState: TextInputVisualState | null = null;

  constructor(private readonly inset: f32) {
    super();
  }

  apply(theme: Theme, state: TextInputVisualState): void {
    this.lastState = state;
    this.host
      .cornerRadius(state.multiline ? 18.0 : 14.0)
      .border(2.0, theme.colors.accent, BorderStyle.Solid)
      .padding(this.inset, this.inset, this.inset, this.inset)
      .bgColor(theme.colors.surface);
    this.placeholderHost
      .position(this.inset, this.inset)
      .width(100.0, Unit.Percent);
  }
}

class AppDefaultTextInputTemplate extends TextInputTemplate {
  readonly created: Array<AppDefaultTextInputPresenter> = new Array<AppDefaultTextInputPresenter>();

  constructor(private readonly inset: f32) {
    super();
  }

  create(): TextInputPresenter {
    const presenter = new AppDefaultTextInputPresenter(this.inset);
    this.created.push(presenter);
    return presenter;
  }
}

function buildPageForFixture(): Node {
  return activeFixture!.buildPage();
}

function registerFixtureWithDefaults(registration: ApplicationRegistration): void {
  registration
    .page(buildPageForFixture)
    .controlTemplates(activeFixture!.defaults);
}

function registerFixtureWithoutDefaults(registration: ApplicationRegistration): void {
  registration.page(buildPageForFixture);
}

class ControlTemplateSetFixture {
  readonly defaults: ControlTemplateSet = new ControlTemplateSet();
  readonly localOverride: AppDefaultCheckboxTemplate = new AppDefaultCheckboxTemplate(36.0);
  defaultButton: Button | null = null;
  defaultCheckbox: Checkbox | null = null;
  overrideCheckbox: Checkbox | null = null;
  dropdown: Dropdown | null = null;
  textInput: TextInput | null = null;
  textArea: TextArea | null = null;
  includeOverride: bool;

  constructor(includeDefaults: bool, includeOverride: bool = true) {
    activeFixture = this;
    this.includeOverride = includeOverride;
    if (includeDefaults) {
      this.defaults.button = new AppDefaultButtonTemplate(84.0);
      this.defaults.checkboxIndicator = new AppDefaultCheckboxTemplate(30.0);
      this.defaults.dropdownField = new AppDefaultDropdownFieldTemplate(24.0);
      this.defaults.textInput = new AppDefaultTextInputTemplate(10.0);
      this.defaults.textArea = new AppDefaultTextInputTemplate(16.0);
    }
  }

  buildPage(): Node {
    this.defaultButton = new Button("Default button");
    this.defaultCheckbox = new Checkbox("Default checkbox");
    this.textInput = new TextInput("Alpha");
    this.textArea = new TextArea("Bravo");
    const root = new FlexBox()
      .child(this.defaultButton!)
      .child(this.defaultCheckbox!)
      .child(this.textInput!)
      .child(this.textArea!);
    if (this.includeOverride) {
      this.overrideCheckbox = new Checkbox("Override checkbox").template(this.localOverride) as Checkbox;
      root.child(this.overrideCheckbox!);
    }
    this.dropdown = new Dropdown()
      .items([
        new DropdownItem("balanced", "Balanced"),
        new DropdownItem("quality", "Quality first"),
      ])
      .selectIndex(0) as Dropdown;
    root.child(this.dropdown!);
    return root;
  }
}

describe("Control template set", () => {
  afterEach(() => {
    Application.unmount();
    clearControlTemplates();
  });

  it("registration applies app-level defaults while per-instance overrides still win", () => {
    resetCalls();

    const fixture = new ControlTemplateSetFixture(true);
    const app = Application.register(registerFixtureWithDefaults);

    expect<bool>(app.getControlTemplates() === fixture.defaults).toBe(true);
    app.run();

    const defaultIndicatorHandle = fixture.defaultCheckbox!.getChildAt(0)!.builtHandle;
    const overrideIndicatorHandle = fixture.overrideCheckbox!.getChildAt(0)!.builtHandle;
    const defaultButtonHandle = fixture.defaultButton!.getChildAt(0)!.builtHandle;
    const dropdownFieldTemplate = changetype<AppDefaultDropdownFieldTemplate>(fixture.defaults.dropdownField);
    const dropdownFieldPresenter = unchecked(dropdownFieldTemplate.created[0]);
    const buttonTemplate = changetype<AppDefaultButtonTemplate>(fixture.defaults.button);
    const textInputTemplate = changetype<AppDefaultTextInputTemplate>(fixture.defaults.textInput);
    const textAreaTemplate = changetype<AppDefaultTextInputTemplate>(fixture.defaults.textArea);

    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, defaultButtonHandle), 1)).toBe(84.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, defaultIndicatorHandle), 1)).toBe(30.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, defaultIndicatorHandle), 1)).toBe(30.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, overrideIndicatorHandle), 1)).toBe(36.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, overrideIndicatorHandle), 1)).toBe(36.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, dropdownFieldPresenter.chevronHost.builtHandle), 1)).toBe(24.0);
    expect<bool>(unchecked(buttonTemplate.created[0]) !== null).toBe(true);
    expect<bool>(unchecked(textInputTemplate.created[0]).lastState!.multiline).toBe(false);
    expect<bool>(unchecked(textAreaTemplate.created[0]).lastState!.multiline).toBe(true);
    expect<i32>(lastCallIndexForHandle(CALL_SET_BOX_STYLE, fixture.dropdown!.getChildAt(0)!.builtHandle)).toBeGreaterThan(-1);

    app.dispose();
  });

  it("registration without a template set clears prior defaults back to built-ins", () => {
    resetCalls();

    const defaultsFixture = new ControlTemplateSetFixture(true, false);
    const appWithDefaults = Application.register(registerFixtureWithDefaults);
    appWithDefaults.run();
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, defaultsFixture.defaultCheckbox!.getChildAt(0)!.builtHandle), 1)).toBe(30.0);
    appWithDefaults.dispose();

    const builtinFixture = new ControlTemplateSetFixture(false, false);
    const appWithoutDefaults = Application.register(registerFixtureWithoutDefaults);
    expect<bool>(appWithoutDefaults.getControlTemplates() === null).toBe(true);
    appWithoutDefaults.run();
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, builtinFixture.defaultCheckbox!.getChildAt(0)!.builtHandle), 1)).toBe(20.0);
    appWithoutDefaults.dispose();
  });
});
