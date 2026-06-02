import * as ui from "../../src/bindings/ui";
import {
  Checkbox,
  CheckboxIndicatorPresenter,
  CheckboxIndicatorTemplate,
  CheckboxIndicatorVisualState,
  Button,
  Dropdown,
  DropdownFieldMetrics,
  DropdownFieldPresenter,
  DropdownFieldTemplate,
  DropdownFieldVisualState,
  DropdownItem,
  DropdownSizing,
  LabeledControlSizing,
  PressableIndicatorMetrics,
  RadioButton,
  RadioGroup,
  Slider,
  SliderPresenter,
  SliderPresenterMetrics,
  SliderSizing,
  SliderTemplate,
  SliderVisualState,
  Switch,
  TextArea,
  TextInput,
} from "../../src/controls";
import { Application } from "../../src/core/Application";
import { Node } from "../../src/core/Node";
import { EventRouter } from "../../src/core/EventRouter";
import { AlignSelf, CursorStyle, FlexDirection, KeyEventType, Orientation, PointerEventType, SemanticCheckedState, SemanticRole, TextVerticalAlign, Unit } from "../../src/core/ffi";
import { activeTheme, Colors, defaultDarkTheme, Theme, useCustomTheme } from "../../src/core/Theme";
import { rgb } from "../../src/color";
import { __fui_on_selection_changed, __fui_on_text_changed, __fui_on_text_replaced, __fui_text_buffer } from "../../src/core/event_exports";
import { FlexBox, ScrollBarVisibility, ScrollBox, Text } from "../../src/nodes";
import {
  CALL_SET_FLEX_BASIS,
  CALL_SET_FILL_HEIGHT,
  CALL_SET_FONT,
  CALL_SET_LINE_HEIGHT,
  CALL_SET_TEXT_VERTICAL_ALIGN,
  CALL_ADD_CHILD,
  CALL_REMOVE_CHILD,
  CALL_SET_EDITABLE,
  CALL_SET_BOX_STYLE,
  CALL_SET_SELECTABLE,
  CALL_SET_POSITION,
  CALL_SET_SELECTION_AREA_BARRIER,
  CALL_SET_SVG,
  CALL_SET_TEXT_SELECTION_RANGE,
  CALL_REQUEST_FOCUS,
  CALL_SET_SEMANTIC_LABEL,
  CALL_SET_SEMANTIC_ROLE,
  CALL_SET_SEMANTIC_CHECKED,
  CALL_SET_SEMANTIC_EXPANDED,
  CALL_SET_SEMANTIC_ORIENTATION,
  CALL_SET_SEMANTIC_VALUE_RANGE,
  CALL_SET_TEXT_LIMITS,
  CALL_SET_TEXT_WRAPPING,
  CALL_SET_TEXT_OBSCURED,
  CALL_SET_TEXT_COLOR,
  CALL_SET_ALIGN_SELF,
  CALL_SET_DROP_SHADOW,
  CALL_SET_FILL_WIDTH,
  getCallArg,
  getCallSequence,
  lastTextEquals,
  lastTextLength,
  findCall,
  resetCalls,
  setNodeBounds,
  CALL_SET_WIDTH,
  CALL_SET_HEIGHT,
  CALL_REQUEST_SEMANTIC_ANNOUNCEMENT,
} from "./FfiTestImports";

function requireChild<T>(node: Node, index: i32): T {
  return node.getChildAt(index)! as T;
}

function resetTheme(): void {
  activeTheme.value = defaultDarkTheme;
}

let checkboxChangedState: SemanticCheckedState = SemanticCheckedState.None;
let dropdownSelectedValue = "";

function handleCheckboxChanged(state: SemanticCheckedState): void {
  checkboxChangedState = state;
}

function handleDropdownChanged(item: DropdownItem, _index: i32): void {
  dropdownSelectedValue = item.value;
}

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

function findCallWithArg(op: i32, argIndex: i32, value: f64): i32 {
  const sequence = getCallSequence();
  for (let i = 0; i < sequence.length; ++i) {
    if (unchecked(sequence[i]) == op && getCallArg(i, argIndex) == value) {
      return i;
    }
  }
  return -1;
}

function findPositionCall(left: f64, top: f64): i32 {
  const sequence = getCallSequence();
  for (let i = 0; i < sequence.length; ++i) {
    if (unchecked(sequence[i]) != CALL_SET_POSITION) {
      continue;
    }
    if (getCallArg(i, 1) == left && getCallArg(i, 2) == top) {
      return i;
    }
  }
  return -1;
}

function requireChildHandle(node: Node, index: i32): u64 {
  return requireChild<Node>(node, index).builtHandle;
}

class FixedCheckboxIndicatorPresenter extends CheckboxIndicatorPresenter {
  constructor() {
    const root = new FlexBox()
      .width(33.0, Unit.Pixel)
      .height(33.0, Unit.Pixel);
    super(root, new PressableIndicatorMetrics(33.0, 33.0));
  }

  apply(_theme: Theme, _state: CheckboxIndicatorVisualState): void {
    this.root
      .width(33.0, Unit.Pixel)
      .height(33.0, Unit.Pixel);
  }
}

class FixedCheckboxIndicatorTemplate extends CheckboxIndicatorTemplate {
  create(): CheckboxIndicatorPresenter {
    return new FixedCheckboxIndicatorPresenter();
  }
}

class FixedSliderPresenter extends SliderPresenter {
  constructor() {
    super(new FlexBox(), new SliderPresenterMetrics(25.0, 9.0, 0.0));
  }

  layout(_state: SliderVisualState, _length: f32): void {
    this.root
      .width(25.0, Unit.Pixel)
      .height(25.0, Unit.Pixel);
  }

  apply(_theme: Theme, _state: SliderVisualState): void {}
}

class FixedSliderTemplate extends SliderTemplate {
  create(): SliderPresenter {
    return new FixedSliderPresenter();
  }
}

class FixedDropdownFieldPresenter extends DropdownFieldPresenter {
  constructor() {
    const valueNode = new Text("")
      .selectable(false)
      .width(100.0, Unit.Percent)
      .maxLines(1)
      .wrapping(false) as Text;
    const valueHost = new FlexBox()
      .fillWidth()
      .child(valueNode) as FlexBox;
    const chevronHost = new FlexBox()
      .width(19.0, Unit.Pixel)
      .height(19.0, Unit.Pixel);
    const root = new FlexBox()
      .flexDirection(FlexDirection.Row)
      .alignItems(1)
      .height(44.0, Unit.Pixel)
      .child(valueHost)
      .child(chevronHost);
    super(root, valueHost, valueNode, chevronHost, new DropdownFieldMetrics(44.0, 18.0, 19.0, 6.0, 6.0, 6.0, 6.0));
  }

  apply(theme: Theme, _state: DropdownFieldVisualState): void {
    this.root.height(44.0, Unit.Pixel);
    this.valueNode.font(theme.fonts.body, 18.0);
    this.chevronHost
      .width(19.0, Unit.Pixel)
      .height(19.0, Unit.Pixel);
  }
}

class FixedDropdownFieldTemplate extends DropdownFieldTemplate {
  create(): DropdownFieldPresenter {
    return new FixedDropdownFieldPresenter();
  }
}

let textInputChangedValue = "";
let textInputFocusChangedCount = 0;
let textInputSelectionStart = 0;
let textInputSelectionEnd = 0;

function handleTextInputChanged(text: string): void {
  textInputChangedValue = text;
}

function handleTextInputSelectionChanged(start: u32, end: u32): void {
  textInputSelectionStart = start;
  textInputSelectionEnd = end;
}

function handleTextInputFocusChanged(_focused: bool): void {
  textInputFocusChangedCount += 1;
}

describe("Common controls", () => {
  afterEach(() => {
    Application.unmount();
    resetTheme();
  });

  it("checkbox toggles on pointer release and updates semantic checked state", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    checkboxChangedState = SemanticCheckedState.None;
    const checkbox = new Checkbox("Accept terms").onChanged(handleCheckboxChanged);
    const handle = checkbox.build();
    resetCalls();

    checkbox._handlePointerEvent(PointerEventType.Down, 8.0, 8.0, 0);
    checkbox._handlePointerEvent(PointerEventType.Up, 8.0, 8.0, 0);

    const checkedIndex = lastCallIndex(CALL_SET_SEMANTIC_CHECKED);
    expect<i32>(checkedIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(checkedIndex, 1)).toBe(<f64>SemanticCheckedState.True);
    const announcementIndex = lastCallIndex(CALL_REQUEST_SEMANTIC_ANNOUNCEMENT);
    expect<i32>(announcementIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(announcementIndex, 0)).toBe(<f64>handle);
    expect<SemanticCheckedState>(checkboxChangedState).toBe(SemanticCheckedState.True);

    checkbox.dispose();
  });

  it("button default label color follows the accent foreground token", () => {
    resetTheme();
    useCustomTheme(new Theme(
      new Colors(
        activeTheme.value.colors.background,
        activeTheme.value.colors.surface,
        activeTheme.value.colors.textPrimary,
        activeTheme.value.colors.textMuted,
        rgb(0xff, 0xff, 0xff),
        activeTheme.value.colors.accent,
        activeTheme.value.colors.accentPressed,
        activeTheme.value.colors.accentHovered,
        activeTheme.value.colors.border,
        activeTheme.value.colors.selection,
        activeTheme.value.colors.scrollbarTrack,
        activeTheme.value.colors.scrollbarThumb,
        activeTheme.value.colors.dialogBackdrop,
        activeTheme.value.colors.dialogShadow,
        activeTheme.value.colors.panelShadow,
        activeTheme.value.colors.focusRing,
      ),
      activeTheme.value.spacing,
      activeTheme.value.fonts,
      activeTheme.value.contextMenu,
      activeTheme.value.toolTip,
    ));
    resetCalls();

    const button = new Button("Launch");
    button.build();

    const colorCall = findCall(CALL_SET_TEXT_COLOR);
    expect<bool>(colorCall >= 0).toBe(true);
    expect<u32>(<u32>getCallArg(colorCall, 1)).toBe(activeTheme.value.colors.textOnAccent);
    const alignSelfCall = lastCallIndexForHandle(CALL_SET_ALIGN_SELF, button.builtHandle);
    expect<bool>(alignSelfCall >= 0).toBe(true);
    expect<u32>(<u32>getCallArg(alignSelfCall, 1)).toBe(<u32>AlignSelf.Start);
  });

  it("checkbox tri-state cycles false to true to mixed to false on space", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const checkbox = new Checkbox("Tri-state").triState(true) as Checkbox;
    const handle = checkbox.build();

    EventRouter.dispatchKeyEvent(handle, KeyEventType.Down, " ", 0);
    EventRouter.dispatchKeyEvent(handle, KeyEventType.Up, " ", 0);
    expect<SemanticCheckedState>(checkbox.checkedState).toBe(SemanticCheckedState.True);

    EventRouter.dispatchKeyEvent(handle, KeyEventType.Down, " ", 0);
    EventRouter.dispatchKeyEvent(handle, KeyEventType.Up, " ", 0);
    expect<SemanticCheckedState>(checkbox.checkedState).toBe(SemanticCheckedState.Mixed);

    EventRouter.dispatchKeyEvent(handle, KeyEventType.Down, " ", 0);
    EventRouter.dispatchKeyEvent(handle, KeyEventType.Up, " ", 0);
    expect<SemanticCheckedState>(checkbox.checkedState).toBe(SemanticCheckedState.False);

    checkbox.dispose();
  });

  it("checkbox uses an svg checkmark and leaves mixed state as a blank filled box", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const checkbox = new Checkbox("Tri-state").triState(true) as Checkbox;
    const handle = checkbox.build();
    const indicatorNode = requireChild<Node>(checkbox, 0);
    const markHostNode = requireChild<Node>(indicatorNode, 0);
    const markHandle = requireChildHandle(markHostNode, 0);

    resetCalls();
    EventRouter.dispatchKeyEvent(handle, KeyEventType.Down, " ", 0);
    EventRouter.dispatchKeyEvent(handle, KeyEventType.Up, " ", 0);
    let svgIndex = lastCallIndexForHandle(CALL_SET_SVG, markHandle);
    expect<i32>(svgIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(svgIndex, 1)).toBeGreaterThan(0.0);
    expect<f64>(getCallArg(svgIndex, 2)).toBe(<f64>defaultDarkTheme.colors.textOnAccent);

    resetCalls();
    EventRouter.dispatchKeyEvent(handle, KeyEventType.Down, " ", 0);
    EventRouter.dispatchKeyEvent(handle, KeyEventType.Up, " ", 0);
    expect<SemanticCheckedState>(checkbox.checkedState).toBe(SemanticCheckedState.Mixed);
    svgIndex = lastCallIndexForHandle(CALL_SET_SVG, markHandle);
    expect<i32>(svgIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(svgIndex, 1)).toBe(0.0);

    checkbox.dispose();
  });

  it("checkbox mark tint resolves against the active accent foreground token", () => {
    EventRouter.reset();
    resetCalls();

    const customTextOnAccent: u32 = 0x112233ff;
    useCustomTheme(new Theme(
      new Colors(
        defaultDarkTheme.colors.background,
        defaultDarkTheme.colors.surface,
        defaultDarkTheme.colors.textPrimary,
        defaultDarkTheme.colors.textMuted,
        customTextOnAccent,
        defaultDarkTheme.colors.accent,
        defaultDarkTheme.colors.accentPressed,
        defaultDarkTheme.colors.accentHovered,
        defaultDarkTheme.colors.border,
        defaultDarkTheme.colors.selection,
        defaultDarkTheme.colors.scrollbarTrack,
        defaultDarkTheme.colors.scrollbarThumb,
        defaultDarkTheme.colors.dialogBackdrop,
        defaultDarkTheme.colors.dialogShadow,
        defaultDarkTheme.colors.panelShadow,
        defaultDarkTheme.colors.focusRing,
      ),
      defaultDarkTheme.spacing,
      defaultDarkTheme.fonts,
      defaultDarkTheme.contextMenu,
      defaultDarkTheme.toolTip,
    ));

    const checkbox = new Checkbox("Accept terms");
    checkbox.build();
    resetCalls();

    checkbox.check(true);

    const svgIndex = lastCallIndex(CALL_SET_SVG);
    expect<i32>(svgIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(svgIndex, 1)).toBeGreaterThan(0.0);
    expect<f64>(getCallArg(svgIndex, 2)).toBe(<f64>customTextOnAccent);

    checkbox.dispose();
  });

  it("keeps checkbox intrinsic height in auto-width containers", () => {
    ui.resizeWindow(800.0, 600.0);

    const checkbox = new Checkbox("Tri-state checkbox label that should stay on one line");
    const autoColumn = new FlexBox()
      .flexDirection(FlexDirection.Column)
      .width(0.0, Unit.Auto)
      .child(checkbox);
    const root = new FlexBox()
      .width(800.0, Unit.Pixel)
      .height(600.0, Unit.Pixel)
      .child(autoColumn);

    Application.mount(root);
    ui.commitFrame();

    const checkboxBounds = ui.tryGetBounds(checkbox.builtHandle);
    if (checkboxBounds !== null) {
      expect<f32>(unchecked(checkboxBounds[2])).toBeGreaterThan(200.0);
      expect<f32>(unchecked(checkboxBounds[3])).toBeLessThan(60.0);
    }
  });

  it("checkbox sizing updates the built-in indicator and label font size", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const checkbox = new Checkbox("Compact")
      .sizing(new LabeledControlSizing().indicatorSize(16.0).labelFontSize(14.0));
    checkbox.build();
    const indicatorHandle = requireChildHandle(checkbox, 0);
    const labelHandle = requireChildHandle(requireChild<Node>(checkbox, 2), 0);

    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, indicatorHandle), 1)).toBe(16.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, indicatorHandle), 1)).toBe(16.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_FONT, labelHandle), 2)).toBe(14.0);

    checkbox.dispose();
  });

  it("checkbox sizing leaves custom indicator templates authoritative", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const checkbox = new Checkbox("Compact")
      .sizing(new LabeledControlSizing().indicatorSize(16.0).labelFontSize(14.0))
      .template(new FixedCheckboxIndicatorTemplate());
    checkbox.build();
    const indicatorHandle = requireChildHandle(checkbox, 0);

    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, indicatorHandle), 1)).toBe(33.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, indicatorHandle), 1)).toBe(33.0);

    checkbox.dispose();
  });

  it("keeps radio group option height stable in auto-width containers", () => {
    ui.resizeWindow(800.0, 600.0);

    const group = new RadioGroup();
    group.addOption("balanced", "Balanced profile option label");
    group.addOption("quality", "Quality first option label");
    const autoColumn = new FlexBox()
      .flexDirection(FlexDirection.Column)
      .width(0.0, Unit.Auto)
      .child(group);
    const root = new FlexBox()
      .width(800.0, Unit.Pixel)
      .height(600.0, Unit.Pixel)
      .child(autoColumn);

    Application.mount(root);
    ui.commitFrame();

    const firstRadio = group.getChildAt(0) as RadioButton;
    const radioBounds = ui.tryGetBounds(firstRadio.builtHandle);
    if (radioBounds !== null) {
      expect<f32>(unchecked(radioBounds[2])).toBeGreaterThan(200.0);
      expect<f32>(unchecked(radioBounds[3])).toBeLessThan(60.0);
    }
  });

  it("switch toggles on space and exposes switch semantics through checked state", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const control = new Switch("Notifications");
    const handle = control.build();
    resetCalls();

    EventRouter.dispatchKeyEvent(handle, KeyEventType.Down, " ", 0);
    EventRouter.dispatchKeyEvent(handle, KeyEventType.Up, " ", 0);

    expect<bool>(control.checked).toBe(true);
    const checkedIndex = lastCallIndex(CALL_SET_SEMANTIC_CHECKED);
    expect<i32>(checkedIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(checkedIndex, 1)).toBe(<f64>SemanticCheckedState.True);
    const announcementIndex = lastCallIndex(CALL_REQUEST_SEMANTIC_ANNOUNCEMENT);
    expect<i32>(announcementIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(announcementIndex, 0)).toBe(<f64>handle);

    control.dispose();
  });

  it("switch repositions the thumb when toggled on", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const control = new Switch("Notifications");
    control.build();
    resetCalls();

    control.check(true);

    expect<i32>(findPositionCall(21.0, 2.0)).toBeGreaterThan(-1);
    control.dispose();
  });

  it("common control indicator shells keep their pre-inset outer sizes", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const checkbox = new Checkbox("Accept terms");
    checkbox.build();
    const checkboxIndicatorHandle = requireChildHandle(checkbox, 0);
    expect<i32>(lastCallIndexForHandle(CALL_SET_WIDTH, checkboxIndicatorHandle)).toBeGreaterThan(-1);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, checkboxIndicatorHandle), 1)).toBe(20.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, checkboxIndicatorHandle), 1)).toBe(20.0);

    const group = new RadioGroup();
    const radio = group.addOption("alpha", "Alpha");
    group.build();
    const radioIndicatorHandle = requireChildHandle(radio, 0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, radioIndicatorHandle), 1)).toBe(20.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, radioIndicatorHandle), 1)).toBe(20.0);

    const control = new Switch("Notifications");
    control.build();
    const switchTrackHandle = requireChildHandle(control, 0);
    const switchTrackNode = requireChild<Node>(control, 0);
    const switchThumbHandle = requireChildHandle(switchTrackNode, 0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, switchTrackHandle), 1)).toBe(44.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, switchTrackHandle), 1)).toBe(26.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, switchThumbHandle), 1)).toBe(20.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, switchThumbHandle), 1)).toBe(20.0);

    checkbox.dispose();
    group.dispose();
    control.dispose();
  });

  it("checkbox and radio labels keep intrinsic sizing without forcing percent width", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const checkbox = new Checkbox("Always show vertical scrollbar");
    checkbox.build();
    const checkboxLabelHostHandle = requireChildHandle(checkbox, 2);
    const checkboxLabelWidthIndex = lastCallIndexForHandle(CALL_SET_WIDTH, checkboxLabelHostHandle);
    expect<i32>(checkboxLabelWidthIndex).toBe(-1);
    expect<i32>(lastCallIndexForHandle(CALL_SET_FILL_WIDTH, checkboxLabelHostHandle)).toBe(-1);
    const checkboxLabelHandle = requireChildHandle(requireChild<Node>(checkbox, 2), 0);
    const checkboxLabelTextWidthIndex = lastCallIndexForHandle(CALL_SET_WIDTH, checkboxLabelHandle);
    expect<i32>(checkboxLabelTextWidthIndex).toBe(-1);

    const radioGroup = new RadioGroup();
    radioGroup.addOption("auto", "Vertical scrollbar: Auto");
    radioGroup.build();
    const radioButton = requireChild<Node>(radioGroup, 0);
    const radioLabelHostHandle = requireChildHandle(radioButton, 2);
    const radioLabelWidthIndex = lastCallIndexForHandle(CALL_SET_WIDTH, radioLabelHostHandle);
    expect<i32>(radioLabelWidthIndex).toBe(-1);
    expect<i32>(lastCallIndexForHandle(CALL_SET_FILL_WIDTH, radioLabelHostHandle)).toBe(-1);
    const radioLabelHandle = requireChildHandle(requireChild<Node>(radioButton, 2), 0);
    const radioLabelTextWidthIndex = lastCallIndexForHandle(CALL_SET_WIDTH, radioLabelHandle);
    expect<i32>(radioLabelTextWidthIndex).toBe(-1);

    checkbox.dispose();
    radioGroup.dispose();
  });

  it("checkbox keeps its shell border transparent while focus is delegated to the shared overlay", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const checkbox = new Checkbox("Accept terms");
    const handle = checkbox.build();
    resetCalls();

    EventRouter.dispatchFocusChanged(handle, true);

    const boxStyleIndex = lastCallIndexForHandle(CALL_SET_BOX_STYLE, handle);
    expect<i32>(boxStyleIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(boxStyleIndex, 7)).toBe(0.0);

    checkbox.dispose();
  });

  it("radio group arrow navigation skips disabled radios and requests focus for the new selection", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const group = new RadioGroup();
    const first = group.addOption("alpha", "Alpha");
    const second = group.addOption("beta", "Beta");
    second.enabled(false);
    const third = group.addOption("gamma", "Gamma");
    group.selectIndex(0);
    group.build();
    const firstHandle = first.builtHandle;
    const thirdHandle = third.builtHandle;
    resetCalls();

    EventRouter.dispatchKeyEvent(firstHandle, KeyEventType.Down, "ArrowRight", 0);

    expect<string>(group.selectedValue).toBe("gamma");
    const focusIndex = lastCallIndex(CALL_REQUEST_FOCUS);
    expect<i32>(focusIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(focusIndex, 0)).toBe(<f64>thirdHandle);
    const announcementIndex = lastCallIndex(CALL_REQUEST_SEMANTIC_ANNOUNCEMENT);
    expect<i32>(announcementIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(announcementIndex, 0)).toBe(<f64>thirdHandle);
    expect<bool>(second.checked).toBe(false);
    group.dispose();
    group.dispose();
  });

  it("radio group addOptions batches preconfigured radios", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const group = new RadioGroup()
      .addOptions([
        new RadioButton("alpha", "Alpha").width(100.0, Unit.Percent) as RadioButton,
        new RadioButton("beta", "Beta").width(100.0, Unit.Percent) as RadioButton,
      ])
      .selectIndex(1) as RadioGroup;
    group.build();

    expect<string>(group.selectedValue).toBe("beta");
    const firstRadio = requireChild<Node>(group, 0);
    const secondRadio = requireChild<Node>(group, 1);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, firstRadio.builtHandle), 1)).toBe(100.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, secondRadio.builtHandle), 1)).toBe(100.0);

    group.selectIndex(-1);
    expect<string>(group.selectedValue).toBe("");
    expect<bool>((firstRadio as RadioButton).checked).toBe(false);
    expect<bool>((secondRadio as RadioButton).checked).toBe(false);

    group.selectIndex(999);
    expect<string>(group.selectedValue).toBe("beta");
    expect<bool>((firstRadio as RadioButton).checked).toBe(false);
    expect<bool>((secondRadio as RadioButton).checked).toBe(true);

    group.dispose();
  });

  it("radio buttons optically center the selection dot when checked", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const group = new RadioGroup();
    const radio = group.addOption("alpha", "Alpha");
    group.build();
    resetCalls();

    radio.check(true);

    expect<i32>(findPositionCall(5.0, 5.0)).toBeGreaterThan(-1);
    group.dispose();
  });

  it("radio sizing updates the built-in indicator and label font size", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const radio = new RadioButton("alpha", "Alpha")
      .sizing(new LabeledControlSizing().indicatorSize(16.0).labelFontSize(14.0));
    radio.build();
    const indicatorHandle = requireChildHandle(radio, 0);
    const labelHandle = requireChildHandle(requireChild<Node>(radio, 2), 0);

    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, indicatorHandle), 1)).toBe(16.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, indicatorHandle), 1)).toBe(16.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_FONT, labelHandle), 2)).toBe(14.0);

    radio.dispose();
  });

  it("slider reserves shell space outside the track and thumb geometry", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const slider = new Slider();
    slider.build();
    const presenterRoot = requireChild<Node>(slider, 0);
    const presenterRootHandle = presenterRoot.builtHandle;
    const trackHandle = requireChildHandle(presenterRoot, 0);
    const thumbHandle = requireChildHandle(presenterRoot, 2);

    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, slider.builtHandle), 1)).toBe(190.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, slider.builtHandle), 1)).toBe(30.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, presenterRootHandle), 1)).toBe(180.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, presenterRootHandle), 1)).toBe(20.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, trackHandle), 1)).toBe(162.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, trackHandle), 1)).toBe(6.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, thumbHandle), 1)).toBe(18.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, thumbHandle), 1)).toBe(18.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, slider.builtHandle), 1)).toBe(30.0);
    expect<i32>(findPositionCall(3.0, 3.0)).toBeGreaterThan(-1);
    expect<i32>(findPositionCall(9.0, 7.0)).toBeGreaterThan(-1);
    expect<i32>(findPositionCall(0.0, 1.0)).toBeGreaterThan(-1);

    slider.dispose();
  });

  it("vertical sliders keep the same metric model on the y axis", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const slider = new Slider(50.0)
      .orientation(Orientation.Vertical);
    slider.build();
    const presenterRoot = requireChild<Node>(slider, 0);
    const presenterRootHandle = presenterRoot.builtHandle;
    const trackHandle = requireChildHandle(presenterRoot, 0);
    const thumbHandle = requireChildHandle(presenterRoot, 2);

    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, slider.builtHandle), 1)).toBe(30.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, slider.builtHandle), 1)).toBe(190.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, presenterRootHandle), 1)).toBe(20.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, presenterRootHandle), 1)).toBe(180.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, trackHandle), 1)).toBe(6.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, trackHandle), 1)).toBe(162.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, thumbHandle), 1)).toBe(18.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, thumbHandle), 1)).toBe(18.0);
    expect<i32>(findPositionCall(7.0, 9.0)).toBeGreaterThan(-1);
    expect<i32>(findPositionCall(1.0, 81.0)).toBeGreaterThan(-1);

    slider.dispose();
  });

  it("slider sizing updates built-in thumb and track geometry", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const slider = new Slider()
      .sizing(new SliderSizing().thumbSize(16.0).trackThickness(4.0));
    slider.build();
    const presenterRoot = requireChild<Node>(slider, 0);
    const presenterRootHandle = presenterRoot.builtHandle;
    const trackHandle = requireChildHandle(presenterRoot, 0);
    const thumbHandle = requireChildHandle(presenterRoot, 2);

    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, slider.builtHandle), 1)).toBe(28.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, presenterRootHandle), 1)).toBe(18.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, trackHandle), 1)).toBe(4.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, thumbHandle), 1)).toBe(16.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, thumbHandle), 1)).toBe(16.0);

    slider.dispose();
  });

  it("slider sizing leaves custom templates authoritative", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const slider = new Slider()
      .sizing(new SliderSizing().thumbSize(16.0).trackThickness(4.0))
      .template(new FixedSliderTemplate());
    slider.build();

    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, slider.builtHandle), 1)).toBe(35.0);

    slider.dispose();
  });

  it("slider updates value semantics and orientation through keyboard interaction", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const slider = new Slider(25.0)
      .min(0.0)
      .max(100.0)
      .step(5.0)
      .orientation(Orientation.Vertical);
    const handle = slider.build();

    const orientationIndex = lastCallIndexForHandle(CALL_SET_SEMANTIC_ORIENTATION, handle);
    expect<i32>(orientationIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(orientationIndex, 1)).toBe(<f64>Orientation.Vertical);

    resetCalls();
    EventRouter.dispatchKeyEvent(handle, KeyEventType.Down, "End", 0);
    let valueRangeIndex = lastCallIndexForHandle(CALL_SET_SEMANTIC_VALUE_RANGE, handle);
    expect<i32>(valueRangeIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(valueRangeIndex, 2)).toBe(100.0);
    let announcementIndex = lastCallIndex(CALL_REQUEST_SEMANTIC_ANNOUNCEMENT);
    expect<i32>(announcementIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(announcementIndex, 0)).toBe(<f64>handle);

    resetCalls();
    EventRouter.dispatchKeyEvent(handle, KeyEventType.Down, "Home", 0);
    valueRangeIndex = lastCallIndexForHandle(CALL_SET_SEMANTIC_VALUE_RANGE, handle);
    expect<i32>(valueRangeIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(valueRangeIndex, 2)).toBe(0.0);
    announcementIndex = lastCallIndex(CALL_REQUEST_SEMANTIC_ANNOUNCEMENT);
    expect<i32>(announcementIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(announcementIndex, 0)).toBe(<f64>handle);

    slider.dispose();
  });

  it("slider emits default semantic labels for horizontal and vertical variants", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const slider = new Slider();
    const handle = slider.build();
    let labelIndex = lastCallIndexForHandle(CALL_SET_SEMANTIC_LABEL, handle);
    expect<i32>(labelIndex).toBeGreaterThan(-1);

    resetCalls();
    slider.orientation(Orientation.Vertical);
    labelIndex = lastCallIndexForHandle(CALL_SET_SEMANTIC_LABEL, handle);
    expect<i32>(labelIndex).toBeGreaterThan(-1);

    slider.dispose();
  });

  it("slider keeps its border color stable while focus is delegated to the shared overlay", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const slider = new Slider();
    slider.width(180.0);
    const handle = slider.build();
    resetCalls();

    EventRouter.dispatchFocusChanged(handle, true);

    const boxStyleIndex = lastCallIndexForHandle(CALL_SET_BOX_STYLE, handle);
    expect<i32>(boxStyleIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(boxStyleIndex, 7)).toBe(<f64>defaultDarkTheme.colors.background);

    slider.dispose();
  });

  it("dropdown opens, updates expanded semantics, and selects the highlighted item from keyboard navigation", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    dropdownSelectedValue = "";
    const items = new Array<DropdownItem>();
    items.push(new DropdownItem("one", "One"));
    items.push(new DropdownItem("two", "Two"));
    items.push(new DropdownItem("three", "Three"));

    const dropdown = new Dropdown()
      .items(items)
      .onChanged(handleDropdownChanged);
    const handle = dropdown.build();
    resetCalls();

    EventRouter.dispatchKeyEvent(handle, KeyEventType.Down, "ArrowDown", 0);
    let expandedIndex = lastCallIndex(CALL_SET_SEMANTIC_EXPANDED);
    expect<i32>(expandedIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(expandedIndex, 2)).toBe(1.0);
    let announcementIndex = lastCallIndex(CALL_REQUEST_SEMANTIC_ANNOUNCEMENT);
    expect<i32>(announcementIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(announcementIndex, 0)).toBe(<f64>handle);

    resetCalls();
    EventRouter.dispatchGlobalKeyEvent(KeyEventType.Down, "ArrowDown", 0);
    EventRouter.dispatchGlobalKeyEvent(KeyEventType.Down, "Enter", 0);

    expect<string>(dropdownSelectedValue).toBe("two");
    expandedIndex = lastCallIndex(CALL_SET_SEMANTIC_EXPANDED);
    expect<i32>(expandedIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(expandedIndex, 2)).toBe(0.0);
    announcementIndex = lastCallIndex(CALL_REQUEST_SEMANTIC_ANNOUNCEMENT);
    expect<i32>(announcementIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(announcementIndex, 0)).toBe(<f64>handle);

    dropdown.dispose();
  });

  it("dropdown uses a down-arrow indicator glyph", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const items = new Array<DropdownItem>();
    items.push(new DropdownItem("one", "One"));
    items.push(new DropdownItem("two", "Two"));
    const dropdown = new Dropdown().items(items) as Dropdown;
    dropdown.build();

    let svgIndex = lastCallIndex(CALL_SET_SVG);
    expect<i32>(svgIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(svgIndex, 1)).toBeGreaterThan(0.0);

    resetCalls();
    EventRouter.dispatchKeyEvent(dropdown.builtHandle, KeyEventType.Down, "ArrowDown", 0);
    svgIndex = lastCallIndex(CALL_SET_SVG);
    expect<i32>(svgIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(svgIndex, 1)).toBeGreaterThan(0.0);

    resetCalls();
    EventRouter.dispatchGlobalKeyEvent(KeyEventType.Down, "Escape", 0);
    svgIndex = lastCallIndex(CALL_SET_SVG);
    expect<i32>(svgIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(svgIndex, 1)).toBeGreaterThan(0.0);

    dropdown.dispose();
  });

  it("dropdown sizing updates the built-in trigger and option-row geometry", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const items = new Array<DropdownItem>();
    items.push(new DropdownItem("one", "One"));
    items.push(new DropdownItem("two", "Two"));
    items.push(new DropdownItem("three", "Three"));
    const dropdown = new Dropdown()
      .maxVisibleItems(2)
      .sizing(
        new DropdownSizing()
          .fieldFontSize(14.0)
          .optionFontSize(14.0)
          .fieldHeight(28.0)
          .optionHeight(28.0)
          .chevronBoxSize(14.0)
          .chevronIconSize(10.0),
      )
      .items(items);
    const handle = dropdown.build();
    setNodeBounds(handle, 20.0, 20.0, 180.0, 28.0);
    const fieldHandle = requireChildHandle(dropdown, 0);
    const valueHost = requireChild<Node>(requireChild<Node>(dropdown, 0), 0);
    const valueLabelHandle = requireChildHandle(valueHost, 0);
    const chevronHostHandle = requireChildHandle(requireChild<Node>(dropdown, 0), 1);

    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, fieldHandle), 1)).toBe(28.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_FONT, valueLabelHandle), 2)).toBe(14.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_FILL_HEIGHT, valueLabelHandle), 1)).toBe(1.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_LINE_HEIGHT, valueLabelHandle), 1)).toBe(28.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_TEXT_VERTICAL_ALIGN, valueLabelHandle), 1)).toBe(<f64>TextVerticalAlign.Center);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_WIDTH, chevronHostHandle), 1)).toBe(14.0);
    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, chevronHostHandle), 1)).toBe(14.0);
    expect<i32>(findCallWithArg(CALL_SET_WIDTH, 1, 10.0)).toBeGreaterThan(-1);
    expect<i32>(findCallWithArg(CALL_SET_HEIGHT, 1, 10.0)).toBeGreaterThan(-1);

    resetCalls();
    EventRouter.dispatchKeyEvent(handle, KeyEventType.Down, "ArrowDown", 0);
    expect<i32>(findCallWithArg(CALL_SET_HEIGHT, 1, 28.0)).toBeGreaterThan(-1);

    dropdown.dispose();
  });

  it("dropdown sizing leaves custom field templates authoritative", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const items = new Array<DropdownItem>();
    items.push(new DropdownItem("one", "One"));
    items.push(new DropdownItem("two", "Two"));
    const dropdown = new Dropdown()
      .sizing(new DropdownSizing().fieldHeight(28.0).fieldFontSize(14.0))
      .fieldTemplate(new FixedDropdownFieldTemplate())
      .items(items);
    dropdown.build();
    const fieldHandle = requireChildHandle(dropdown, 0);

    expect<f64>(getCallArg(lastCallIndexForHandle(CALL_SET_HEIGHT, fieldHandle), 1)).toBe(44.0);

    dropdown.dispose();
  });

  it("dropdown maxVisibleItems still allows keyboard selection beyond the initially visible rows", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    dropdownSelectedValue = "";
    const items = new Array<DropdownItem>();
    items.push(new DropdownItem("one", "One"));
    items.push(new DropdownItem("two", "Two"));
    items.push(new DropdownItem("three", "Three"));
    items.push(new DropdownItem("four", "Four"));
    items.push(new DropdownItem("five", "Five"));

    const dropdown = new Dropdown()
      .popupWidth(240.0)
      .maxVisibleItems(3)
      .items(items)
      .onChanged(handleDropdownChanged);
    const handle = dropdown.build();
    resetCalls();

    EventRouter.dispatchKeyEvent(handle, KeyEventType.Down, "ArrowDown", 0);
    EventRouter.dispatchGlobalKeyEvent(KeyEventType.Down, "ArrowDown", 0);
    EventRouter.dispatchGlobalKeyEvent(KeyEventType.Down, "ArrowDown", 0);
    EventRouter.dispatchGlobalKeyEvent(KeyEventType.Down, "ArrowDown", 0);
    EventRouter.dispatchGlobalKeyEvent(KeyEventType.Down, "ArrowDown", 0);
    EventRouter.dispatchGlobalKeyEvent(KeyEventType.Down, "Enter", 0);

    expect<string>(dropdownSelectedValue).toBe("five");

    dropdown.dispose();
  });

  it("dropdown keeps its border color stable while focus is delegated to the shared overlay", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const items = new Array<DropdownItem>();
    items.push(new DropdownItem("one", "One"));
    items.push(new DropdownItem("two", "Two"));
    const dropdown = new Dropdown()
      .items(items)
      .width(180.0) as Dropdown;
    const handle = dropdown.build();
    const fieldHandle = requireChildHandle(dropdown, 0);
    resetCalls();

    EventRouter.dispatchFocusChanged(handle, true);

    const boxStyleIndex = lastCallIndexForHandle(CALL_SET_BOX_STYLE, fieldHandle);
    expect<i32>(boxStyleIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(boxStyleIndex, 7)).toBe(<f64>defaultDarkTheme.colors.border);

    dropdown.dispose();
  });

  it("dropdown updates its default semantic label from the selected item without clobbering explicit labels", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const items = new Array<DropdownItem>();
    items.push(new DropdownItem("one", "One"));
    items.push(new DropdownItem("two", "Two"));

    const dropdown = new Dropdown().items(items) as Dropdown;
    const handle = dropdown.build();
    let labelIndex = lastCallIndexForHandle(CALL_SET_SEMANTIC_LABEL, handle);
    expect<i32>(labelIndex).toBeGreaterThan(-1);

    dropdown.semanticLabel("Priority");
    resetCalls();
    dropdown.selectIndex(1);
    labelIndex = lastCallIndexForHandle(CALL_SET_SEMANTIC_LABEL, handle);
    expect<i32>(labelIndex).toBe(-1);

    dropdown.dispose();
  });

  it("dropdown clamps selected index to the available item range", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const items = new Array<DropdownItem>();
    items.push(new DropdownItem("one", "One"));
    items.push(new DropdownItem("two", "Two"));

    const dropdown = new Dropdown().items(items) as Dropdown;
    dropdown.selectIndex(-1);
    expect<i32>(dropdown.selectedIndex).toBe(-1);
    dropdown.selectIndex(-10);
    expect<i32>(dropdown.selectedIndex).toBe(0);
    dropdown.selectIndex(999);
    expect<i32>(dropdown.selectedIndex).toBe(1);
  });
});
