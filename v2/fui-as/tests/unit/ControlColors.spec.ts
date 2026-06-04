import {
  Application,
  Dropdown,
  DropdownFieldPresenter,
  DropdownFieldTemplate,
  DropdownFieldVisualState,
  DropdownItem,
  DropdownColors,
  FlexBox,
  Text,
  TextInput,
  TextInputColors,
  Theme,
  Unit,
} from "../../src/Fui";
import {
  CALL_SET_CARET_COLOR,
  CALL_SET_BOX_STYLE,
  findCall,
  getCallArg,
  resetCalls,
} from "./FfiTestImports";
import { lastBackgroundColor, lastCallIndex } from "./ButtonTestUtils";

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
});
