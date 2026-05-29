import {
  Application,
  BorderStyle,
  Dropdown,
  DropdownChevronPresenter,
  DropdownChevronTemplate,
  DropdownChevronVisualState,
  DropdownFieldPresenter,
  DropdownFieldTemplate,
  DropdownFieldVisualState,
  DropdownItem,
  DropdownOptionRowMetrics,
  DropdownOptionRowPresenter,
  DropdownOptionRowTemplate,
  DropdownOptionRowVisualState,
  FlexBox,
  KeyEventType,
  Text,
  Theme,
  Unit,
} from "../../src/Fui";
import {
  CALL_SET_BOX_STYLE,
  CALL_SET_HEIGHT,
  CALL_SET_SEMANTIC_EXPANDED,
  CALL_SET_SVG,
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

class TrackingDropdownFieldPresenter extends DropdownFieldPresenter {
  applyCount: i32 = 0;
  lastState: DropdownFieldVisualState | null = null;

  constructor() {
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
      .width(20.0, Unit.Pixel)
      .height(20.0, Unit.Pixel)
      .alignItems(1)
      .justifyContent(1);
    const root = new FlexBox()
      .child(valueHost)
      .child(chevronHost);
    super(root, valueHost, valueNode, chevronHost);
  }

  apply(theme: Theme, state: DropdownFieldVisualState): void {
    this.applyCount += 1;
    this.lastState = state;
    this.root
      .cornerRadius(14.0)
      .border(2.0, theme.colors.accent, BorderStyle.Solid)
      .padding(12.0, 8.0, 12.0, 8.0)
      .bgColor(state.pressed ? theme.colors.background : theme.colors.surface);
    this.valueHost
      .width(0.0, Unit.Pixel)
      .flexGrow(1.0);
    this.valueNode
      .font(theme.fonts.body, theme.fonts.sizeBody)
      .textColor(theme.colors.textPrimary);
    this.chevronHost
      .width(20.0, Unit.Pixel)
      .height(20.0, Unit.Pixel)
      .alignItems(1)
      .justifyContent(1);
  }
}

class TrackingDropdownFieldTemplate extends DropdownFieldTemplate {
  readonly created: Array<TrackingDropdownFieldPresenter> = new Array<TrackingDropdownFieldPresenter>();

  create(): DropdownFieldPresenter {
    const presenter = new TrackingDropdownFieldPresenter();
    this.created.push(presenter);
    return presenter;
  }
}

class TrackingDropdownChevronPresenter extends DropdownChevronPresenter {
  readonly markerNode: FlexBox;
  applyCount: i32 = 0;
  lastState: DropdownChevronVisualState | null = null;

  constructor() {
    const root = new FlexBox()
      .width(100.0, Unit.Percent)
      .height(100.0, Unit.Percent)
      .alignItems(1)
      .justifyContent(1);
    const markerNode = new FlexBox()
      .width(10.0, Unit.Pixel)
      .height(10.0, Unit.Pixel);
    root.child(markerNode);
    super(root);
    this.markerNode = markerNode;
  }

  apply(theme: Theme, state: DropdownChevronVisualState): void {
    this.applyCount += 1;
    this.lastState = state;
    this.root
      .width(100.0, Unit.Percent)
      .height(100.0, Unit.Percent)
      .alignItems(1)
      .justifyContent(1);
    this.markerNode
      .cornerRadius(state.open ? 2.0 : 5.0)
      .bgColor(state.hovered ? theme.colors.accentHovered : theme.colors.accent);
  }
}

class TrackingDropdownChevronTemplate extends DropdownChevronTemplate {
  readonly created: Array<TrackingDropdownChevronPresenter> = new Array<TrackingDropdownChevronPresenter>();

  create(): DropdownChevronPresenter {
    const presenter = new TrackingDropdownChevronPresenter();
    this.created.push(presenter);
    return presenter;
  }
}

class TrackingDropdownOptionRowPresenter extends DropdownOptionRowPresenter {
  applyCount: i32 = 0;
  lastState: DropdownOptionRowVisualState | null = null;

  constructor() {
    const labelNode = new Text("")
      .selectable(false)
      .width(100.0, Unit.Percent)
      .maxLines(1)
      .wrapping(false) as Text;
    const root = new FlexBox()
      .width(100.0, Unit.Percent)
      .height(100.0, Unit.Percent)
      .alignItems(1)
      .child(labelNode);
    super(root, labelNode, new DropdownOptionRowMetrics(40.0));
  }

  apply(theme: Theme, state: DropdownOptionRowVisualState): void {
    this.applyCount += 1;
    this.lastState = state;
    this.root
      .padding(12.0, 8.0, 12.0, 8.0)
      .cornerRadius(10.0)
      .bgColor(state.highlighted ? theme.colors.accentHovered : theme.colors.surface);
    this.labelNode
      .font(theme.fonts.body, theme.fonts.sizeBody)
      .textColor(state.selected ? theme.colors.accent : theme.colors.textPrimary);
  }
}

class TrackingDropdownOptionRowTemplate extends DropdownOptionRowTemplate {
  readonly created: Array<TrackingDropdownOptionRowPresenter> = new Array<TrackingDropdownOptionRowPresenter>();

  create(): DropdownOptionRowPresenter {
    const presenter = new TrackingDropdownOptionRowPresenter();
    this.created.push(presenter);
    return presenter;
  }
}

describe("Dropdown templating", () => {
  afterEach(() => {
    Application.unmount();
  });

  it("dropdown supports custom field, chevron, and option-row templates without breaking selection or persisted restore", () => {
    resetCalls();

    const fieldTemplate = new TrackingDropdownFieldTemplate();
    const chevronTemplate = new TrackingDropdownChevronTemplate();
    const optionTemplate = new TrackingDropdownOptionRowTemplate();
    const dropdown = new Dropdown()
      .items([
        new DropdownItem("balanced", "Balanced"),
        new DropdownItem("quality", "Quality first"),
        new DropdownItem("speed", "Speed first"),
      ])
      .fieldTemplate(fieldTemplate)
      .chevronTemplate(chevronTemplate)
      .optionRowTemplate(optionTemplate)
      .nodeId("template-dropdown") as Dropdown;
    Application.mount(dropdown);

    const fieldPresenter = unchecked(fieldTemplate.created[0]);
    const chevronPresenter = unchecked(chevronTemplate.created[0]);
    const fieldHandle = dropdown.getChildAt(0)!.builtHandle;
    expect<i32>(lastCallIndexForHandle(CALL_SET_BOX_STYLE, fieldHandle)).toBeGreaterThan(-1);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, fieldPresenter.chevronHost.builtHandle), 1)).toBe(20.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, fieldPresenter.chevronHost.builtHandle), 1)).toBe(20.0);

    resetCalls();
    dropdown._handleKeyEvent(KeyEventType.Down, "ArrowDown", 0);
    expect<i32>(lastCallIndex(CALL_SET_SEMANTIC_EXPANDED)).toBeGreaterThan(-1);
    expect<bool>(chevronPresenter.lastState!.open).toBe(true);
    expect<i32>(optionTemplate.created.length).toBe(3);
    expect<bool>(unchecked(optionTemplate.created[0]).lastState!.highlighted).toBe(true);

    dropdown.handleGlobalKeyEvent(KeyEventType.Down, "ArrowDown", 0);
    dropdown.handleGlobalKeyEvent(KeyEventType.Down, "Enter", 0);
    expect<i32>(dropdown.selectedIndex).toBe(1);
    expect<string>(fieldPresenter.lastState!.selectedLabel).toBe("Quality first");
    expect<bool>(unchecked(optionTemplate.created[1]).lastState!.selected).toBe(true);

    Application.capturePersistedUiState();
    Application.unmount();

    const restoredFieldTemplate = new TrackingDropdownFieldTemplate();
    const restoredChevronTemplate = new TrackingDropdownChevronTemplate();
    const restoredOptionTemplate = new TrackingDropdownOptionRowTemplate();
    const restoredDropdown = new Dropdown()
      .items([
        new DropdownItem("balanced", "Balanced"),
        new DropdownItem("quality", "Quality first"),
        new DropdownItem("speed", "Speed first"),
      ])
      .fieldTemplate(restoredFieldTemplate)
      .chevronTemplate(restoredChevronTemplate)
      .optionRowTemplate(restoredOptionTemplate)
      .nodeId("template-dropdown") as Dropdown;
    Application.mount(restoredDropdown);
    Application.restorePersistedUiState();

    const restoredFieldPresenter = unchecked(restoredFieldTemplate.created[0]);
    expect<i32>(restoredDropdown.selectedIndex).toBe(1);
    expect<string>(restoredFieldPresenter.lastState!.selectedLabel).toBe("Quality first");
    expect<string>(restoredFieldPresenter.lastState!.selectedLabel).toBe("Quality first");
  });

  it("dropdown can swap the field template after build and keep keyboard selection behavior", () => {
    resetCalls();

    const dropdown = new Dropdown()
      .items([
        new DropdownItem("alpha", "Alpha"),
        new DropdownItem("beta", "Beta"),
      ]) as Dropdown;
    dropdown.build();
    const originalFieldHandle = dropdown.getChildAt(0)!.builtHandle;

    resetCalls();
    const template = new TrackingDropdownFieldTemplate();
    dropdown.fieldTemplate(template);

    const presenter = unchecked(template.created[0]);
    const fieldHandle = dropdown.getChildAt(0)!.builtHandle;
    expect<u64>(fieldHandle).not.toBe(originalFieldHandle);
    expect<i32>(lastCallIndexForHandle(CALL_SET_BOX_STYLE, fieldHandle)).toBeGreaterThan(-1);

    resetCalls();
    dropdown._handleKeyEvent(KeyEventType.Down, "ArrowDown", 0);
    dropdown.handleGlobalKeyEvent(KeyEventType.Down, "ArrowDown", 0);
    dropdown.handleGlobalKeyEvent(KeyEventType.Down, "Enter", 0);

    expect<i32>(dropdown.selectedIndex).toBe(1);
    expect<string>(presenter.lastState!.selectedLabel).toBe("Beta");
    dropdown.dispose();
  });

  it("default dropdown chevron uses svg visuals instead of text glyphs", () => {
    resetCalls();

    const dropdown = new Dropdown()
      .items([
        new DropdownItem("one", "One"),
        new DropdownItem("two", "Two"),
      ]) as Dropdown;
    dropdown.build();

    expect<i32>(lastCallIndex(CALL_SET_SVG)).toBeGreaterThan(-1);
    dropdown.dispose();
  });
});
