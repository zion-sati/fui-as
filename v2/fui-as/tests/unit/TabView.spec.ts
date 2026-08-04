import { SemanticRole } from "../../src/core/ffi";
import { retainedView, RetainedView } from "../../src/core/RetainedView";
import { TabItem, TabSelectionChangedEventArgs, TabView } from "../../src/controls/TabView";
import { FlexBox } from "../../src/nodes/FlexBox";
import {
  CALL_SET_SEMANTIC_ROLE,
  getCallArg,
  getCallSequence,
  resetCalls,
} from "./FfiTestImports";

let firstCreated = 0;
let firstActivated = 0;
let firstDeactivated = 0;
let secondCreated = 0;
let changedCount = 0;
let lastSelectedIndex = -1;
let reentrantTabs: TabView | null = null;

function recordFirstActivate(_view: RetainedView): void { firstActivated += 1; }
function recordFirstDeactivate(_view: RetainedView): void { firstDeactivated += 1; }

function createFirst(): RetainedView {
  firstCreated += 1;
  return retainedView(new FlexBox().fillSize())
    .onActivate(recordFirstActivate)
    .onDeactivate(recordFirstDeactivate);
}

function createSecond(): RetainedView {
  secondCreated += 1;
  return retainedView(new FlexBox().fillSize());
}

function recordChanged(event: TabSelectionChangedEventArgs): void {
  changedCount += 1;
  lastSelectedIndex = event.selectedIndex;
}

function selectThirdAfterSecond(event: TabSelectionChangedEventArgs): void {
  changedCount += 1;
  if (event.selectedIndex == 1) changetype<TabView>(reentrantTabs).selectIndex(2);
}

function resetState(): void {
  firstCreated = 0;
  firstActivated = 0;
  firstDeactivated = 0;
  secondCreated = 0;
  changedCount = 0;
  lastSelectedIndex = -1;
  reentrantTabs = null;
  resetCalls();
}

describe("TabView", () => {
  it("materializes each page once and deactivates before detaching", () => {
    resetState();
    const tabs = new TabView([
      new TabItem("First", createFirst),
      new TabItem("Second", createSecond),
    ]);
    tabs.build();

    expect<i32>(tabs.selectedIndex).toBe(0);
    expect<i32>(firstCreated).toBe(1);
    expect<i32>(firstActivated).toBe(1);
    expect<i32>(secondCreated).toBe(0);
    expect<i32>(tabs.childCount).toBe(1);
    expect<i32>(tabs.contentPresenter.childCount).toBe(1);

    tabs.selectIndex(1);
    expect<i32>(firstDeactivated).toBe(1);
    expect<i32>(secondCreated).toBe(1);
    expect<i32>(tabs.contentPresenter.childCount).toBe(1);

    tabs.selectIndex(0);
    expect<i32>(firstCreated).toBe(1);
    expect<i32>(firstActivated).toBe(2);
    tabs.dispose();
  });

  it("projects only the selected content panel and no selector chrome", () => {
    resetState();
    const tabs = new TabView([
      new TabItem("First", createFirst),
      new TabItem("Second", createSecond),
    ]);
    tabs.build();

    let sawTabList = false;
    let sawTab = false;
    let sawTabPanel = false;
    const sequence = getCallSequence();
    for (let index = 0; index < sequence.length; ++index) {
      if (unchecked(sequence[index]) != CALL_SET_SEMANTIC_ROLE) continue;
      const role = <u32>getCallArg(index, 1);
      if (role == <u32>SemanticRole.TabList) sawTabList = true;
      if (role == <u32>SemanticRole.Tab) sawTab = true;
      if (role == <u32>SemanticRole.TabPanel) sawTabPanel = true;
    }

    expect<i32>(tabs.childCount).toBe(1);
    expect<bool>(sawTabList).toBe(false);
    expect<bool>(sawTab).toBe(false);
    expect<bool>(sawTabPanel).toBe(true);
    tabs.dispose();
  });

  it("replaces disabled and removed selections deterministically", () => {
    resetState();
    const first = new TabItem("First", createFirst);
    const second = new TabItem("Second", createSecond);
    const third = new TabItem("Third", createSecond);
    const tabs = new TabView([first, second, third]).onSelectionChanged(recordChanged);
    tabs.build();

    tabs.selectIndex(1);
    expect<i32>(lastSelectedIndex).toBe(1);
    second.enabled(false);
    expect<i32>(tabs.selectedIndex).toBe(2);
    tabs.removeItemAt(2);
    expect<i32>(tabs.selectedIndex).toBe(0);
    expect<i32>(tabs.itemCount).toBe(2);
    tabs.dispose();
  });

  it("serializes re-entrant selection changes", () => {
    resetState();
    const tabs = new TabView([
      new TabItem("First", createFirst),
      new TabItem("Second", createSecond),
      new TabItem("Third", createSecond),
    ]).onSelectionChanged(selectThirdAfterSecond);
    reentrantTabs = tabs;
    tabs.build();

    tabs.selectIndex(1);
    expect<i32>(tabs.selectedIndex).toBe(2);
    expect<i32>(changedCount).toBe(2);
    tabs.dispose();
    reentrantTabs = null;
  });
});
