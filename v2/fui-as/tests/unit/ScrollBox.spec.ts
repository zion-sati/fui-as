import * as ui from "../../src/bindings/ui";
import { Checkbox, Dropdown, DropdownItem } from "../../src/controls";
import { Application } from "../../src/core/Application";
import { Unit, FlexDirection } from "../../src/core/ffi";
import { FlexBox, ScrollBarVisibility, ScrollBox, Text } from "../../src/nodes";
import { CALL_SET_SCROLL_CONTENT_SIZE, findCall, getCallArg, resetCalls } from "./FfiTestImports";

function requireChild<T>(node: FlexBox, index: i32): T {
  return node.getChildAt(index)! as T;
}

describe("ScrollBox", () => {
  afterEach(() => {
    Application.unmount();
  });

  it("keeps auto scrollbars hidden when content fits the viewport", () => {
    ui.resizeWindow(320.0, 240.0);

    const content = new FlexBox()
      .width(220.0, Unit.Pixel)
      .height(120.0, Unit.Pixel)
      .child(new Text("fits"));
    const scrollBox = new ScrollBox()
      .scrollEnabledX(true)
      .scrollEnabledY(true)
      .verticalScrollbarVisibility(ScrollBarVisibility.Auto)
      .horizontalScrollbarVisibility(ScrollBarVisibility.Auto)
      .width(220.0, Unit.Pixel)
      .height(120.0, Unit.Pixel)
      .child(content) as ScrollBox;
    const root = new FlexBox()
      .width(320.0, Unit.Pixel)
      .height(240.0, Unit.Pixel)
      .child(scrollBox);

    Application.mount(root);
    ui.commitFrame();

    const verticalBounds = ui.tryGetBounds(scrollBox.verticalScrollBar.render().builtHandle);
    const horizontalBounds = ui.tryGetBounds(scrollBox.horizontalScrollBar.render().builtHandle);
    if (verticalBounds !== null) {
      expect<f32>(verticalBounds[2]).toBe(0.0);
    }
    if (horizontalBounds !== null) {
      expect<f32>(horizontalBounds[3]).toBe(0.0);
    }
  });

  it("keeps hidden auto rails hidden after scrollbar geometry is customized", () => {
    ui.resizeWindow(320.0, 240.0);

    const content = new FlexBox()
      .width(220.0, Unit.Pixel)
      .height(120.0, Unit.Pixel)
      .child(new Text("fits"));
    const scrollBox = new ScrollBox()
      .scrollEnabledX(true)
      .scrollEnabledY(true)
      .verticalScrollbarVisibility(ScrollBarVisibility.Auto)
      .horizontalScrollbarVisibility(ScrollBarVisibility.Auto)
      .width(220.0, Unit.Pixel)
      .height(120.0, Unit.Pixel)
      .child(content) as ScrollBox;
    const root = new FlexBox()
      .width(320.0, Unit.Pixel)
      .height(240.0, Unit.Pixel)
      .child(scrollBox);

    Application.mount(root);
    ui.commitFrame();

    scrollBox.verticalScrollBar.trackWidth(12.0);
    scrollBox.horizontalScrollBar.trackWidth(12.0);
    ui.commitFrame();

    const verticalBounds = ui.tryGetBounds(scrollBox.verticalScrollBar.render().builtHandle);
    const horizontalBounds = ui.tryGetBounds(scrollBox.horizontalScrollBar.render().builtHandle);
    if (verticalBounds !== null) {
      expect<f32>(verticalBounds[2]).toBe(0.0);
    }
    if (horizontalBounds !== null) {
      expect<f32>(horizontalBounds[3]).toBe(0.0);
    }
  });

  it("collapses hidden auto rail thumbs to zero bounds", () => {
    ui.resizeWindow(320.0, 240.0);

    const content = new FlexBox()
      .width(220.0, Unit.Pixel)
      .height(120.0, Unit.Pixel)
      .child(new Text("fits"));
    const scrollBox = new ScrollBox()
      .scrollEnabledX(true)
      .scrollEnabledY(true)
      .verticalScrollbarVisibility(ScrollBarVisibility.Auto)
      .horizontalScrollbarVisibility(ScrollBarVisibility.Auto)
      .width(220.0, Unit.Pixel)
      .height(120.0, Unit.Pixel)
      .child(content) as ScrollBox;
    const root = new FlexBox()
      .width(320.0, Unit.Pixel)
      .height(240.0, Unit.Pixel)
      .child(scrollBox);

    Application.mount(root);
    ui.commitFrame();

    const verticalTrack = scrollBox.verticalScrollBar.render();
    const horizontalTrack = scrollBox.horizontalScrollBar.render();
    const verticalThumb = requireChild<FlexBox>(requireChild<FlexBox>(verticalTrack, 0), 1);
    const horizontalThumb = requireChild<FlexBox>(requireChild<FlexBox>(horizontalTrack, 0), 1);
    const verticalThumbBounds = ui.tryGetBounds(verticalThumb.builtHandle);
    const horizontalThumbBounds = ui.tryGetBounds(horizontalThumb.builtHandle);
    if (verticalThumbBounds !== null) {
      expect<f32>(verticalThumbBounds[2]).toBe(0.0);
      expect<f32>(verticalThumbBounds[3]).toBe(0.0);
    }
    if (horizontalThumbBounds !== null) {
      expect<f32>(horizontalThumbBounds[2]).toBe(0.0);
      expect<f32>(horizontalThumbBounds[3]).toBe(0.0);
    }
  });

  it("keeps horizontal scrolling disabled even when content overflows on X", () => {
    ui.resizeWindow(320.0, 240.0);

    const content = new FlexBox()
      .width(420.0, Unit.Pixel)
      .height(120.0, Unit.Pixel)
      .child(new Text("wide"));
    const scrollBox = new ScrollBox()
      .scrollEnabledX(false)
      .scrollEnabledY(true)
      .verticalScrollbarVisibility(ScrollBarVisibility.Auto)
      .horizontalScrollbarVisibility(ScrollBarVisibility.Auto)
      .width(220.0, Unit.Pixel)
      .height(120.0, Unit.Pixel)
      .child(content) as ScrollBox;
    const root = new FlexBox()
      .width(320.0, Unit.Pixel)
      .height(240.0, Unit.Pixel)
      .child(scrollBox);

    Application.mount(root);
    ui.commitFrame();

    const horizontalBounds = ui.tryGetBounds(scrollBox.horizontalScrollBar.render().builtHandle);
    if (horizontalBounds !== null) {
      expect<f32>(horizontalBounds[3]).toBe(0.0);
    }
  });

  it("shows auto rails for both axes when scroll content uses intrinsic auto size", () => {
    ui.resizeWindow(480.0, 360.0);

    const intrinsicContent = new FlexBox()
      .width(0.0, Unit.Auto)
      .height(0.0, Unit.Auto)
      .child(
        new FlexBox()
          .width(420.0, Unit.Pixel)
          .height(280.0, Unit.Pixel)
          .child(new Text("oversized content")),
      );
    const scrollBox = new ScrollBox()
      .scrollEnabledX(true)
      .scrollEnabledY(true)
      .verticalScrollbarVisibility(ScrollBarVisibility.Auto)
      .horizontalScrollbarVisibility(ScrollBarVisibility.Auto)
      .width(220.0, Unit.Pixel)
      .height(120.0, Unit.Pixel)
      .child(intrinsicContent) as ScrollBox;
    const root = new FlexBox()
      .width(480.0, Unit.Pixel)
      .height(360.0, Unit.Pixel)
      .child(scrollBox);

    Application.mount(root);
    ui.commitFrame();

    const verticalBounds = ui.tryGetBounds(scrollBox.verticalScrollBar.render().builtHandle);
    const horizontalBounds = ui.tryGetBounds(scrollBox.horizontalScrollBar.render().builtHandle);
    if (verticalBounds !== null) {
      expect<f32>(verticalBounds[2]).toBeGreaterThan(0.0);
      expect<f32>(verticalBounds[3]).toBeGreaterThan(0.0);
    }
    if (horizontalBounds !== null) {
      expect<f32>(horizontalBounds[2]).toBeGreaterThan(0.0);
      expect<f32>(horizontalBounds[3]).toBeGreaterThan(0.0);
    }
  });

  it("lays out column children properly with auto width in scrollbox", () => {
    ui.resizeWindow(480.0, 360.0);

    const textItem1 = new Text("Item 1").fontSize(16.0) as Text;
    const textItem2 = new Text("Item 2").fontSize(16.0) as Text;
    const spacer = new FlexBox().height(20.0, Unit.Pixel);

    const columnContent = new FlexBox()
      .flexDirection(FlexDirection.Column)
      .width(0.0, Unit.Auto)
      .children([textItem1, spacer, textItem2]);

    const scrollBox = new ScrollBox()
      .scrollEnabledX(false)
      .scrollEnabledY(true)
      .verticalScrollbarVisibility(ScrollBarVisibility.Auto)
      .horizontalScrollbarVisibility(ScrollBarVisibility.Never)
      .width(220.0, Unit.Pixel)
      .height(200.0, Unit.Pixel)
      .child(columnContent) as ScrollBox;

    const root = new FlexBox()
      .width(480.0, Unit.Pixel)
      .height(360.0, Unit.Pixel)
      .child(scrollBox);

    Application.mount(root);
    ui.commitFrame();

    const item1Bounds = ui.tryGetBounds(textItem1.builtHandle);
    const item2Bounds = ui.tryGetBounds(textItem2.builtHandle);

    if (item1Bounds !== null && item2Bounds !== null) {
      const item1Y = unchecked(item1Bounds[1]);
      const item1Height = unchecked(item1Bounds[3]);
      const item2Y = unchecked(item2Bounds[1]);

      const expectedSpacing = item1Y + item1Height + 20.0;
      expect<f32>(<f32>Math.abs(item2Y - expectedSpacing)).toBeLessThan(2.0);
    }
  });

  it("lays out auto-sized column with padding and border in regular flexbox", () => {
    ui.resizeWindow(480.0, 360.0);

    const textItem1 = new Text("Item 1").fontSize(16.0) as Text;
    const textItem2 = new Text("Item 2").fontSize(16.0) as Text;
    const spacer = new FlexBox().height(12.0, Unit.Pixel);

    const columnContent = new FlexBox()
      .flexDirection(FlexDirection.Column)
      .width(0.0, Unit.Auto)
      .padding(16.0, 12.0, 16.0, 12.0)
      .children([textItem1, spacer, textItem2]);

    const root = new FlexBox()
      .width(480.0, Unit.Pixel)
      .height(360.0, Unit.Pixel)
      .child(columnContent);

    Application.mount(root);
    ui.commitFrame();

    const item1Bounds = ui.tryGetBounds(textItem1.builtHandle);
    const item2Bounds = ui.tryGetBounds(textItem2.builtHandle);

    if (item1Bounds !== null && item2Bounds !== null) {
      const item1Y = unchecked(item1Bounds[1]);
      const item1Height = unchecked(item1Bounds[3]);
      const item2Y = unchecked(item2Bounds[1]);

      const expectedSpacing = item1Y + item1Height + 12.0;
      expect<f32>(<f32>Math.abs(item2Y - expectedSpacing)).toBeLessThan(2.0);
    }
  });

  it("keeps checkbox heading-to-control spacing stable in auto-width scroll content", () => {
    ui.resizeWindow(640.0, 480.0);

    const dropdown = new Dropdown()
      .items([
        new DropdownItem("small", "Small"),
        new DropdownItem("medium", "Medium"),
      ])
      .selectIndex(1) as Dropdown;
    const heading = new Text("Checkboxes").fontSize(18.0) as Text;
    const triStateCheckbox = new Checkbox("Tri-state checkbox")
      .triState(true)
      .mixed(true) as Checkbox;

    const controlsSurface = new FlexBox()
      .flexDirection(FlexDirection.Column)
      .children([
        dropdown,
        new FlexBox().height(16.0, Unit.Pixel),
        heading,
        new FlexBox().height(8.0, Unit.Pixel),
        triStateCheckbox,
      ])
      .width(0.0, Unit.Auto);

    const scrollBox = new ScrollBox()
      .scrollEnabledX(false)
      .scrollEnabledY(true)
      .verticalScrollbarVisibility(ScrollBarVisibility.Auto)
      .horizontalScrollbarVisibility(ScrollBarVisibility.Never)
      .width(420.0, Unit.Pixel)
      .height(260.0, Unit.Pixel)
      .child(controlsSurface) as ScrollBox;

    const root = new FlexBox()
      .width(640.0, Unit.Pixel)
      .height(480.0, Unit.Pixel)
      .child(scrollBox);

    Application.mount(root);
    ui.commitFrame();

    const headingBounds = ui.tryGetBounds(heading.builtHandle);
    const checkboxBounds = ui.tryGetBounds(triStateCheckbox.builtHandle);

    if (headingBounds !== null && checkboxBounds !== null) {
      const headingBottom = unchecked(headingBounds[1]) + unchecked(headingBounds[3]);
      const actualGap = unchecked(checkboxBounds[1]) - headingBottom;
      expect<f32>(<f32>Math.abs(actualGap - 8.0)).toBeLessThan(2.0);
    }
  });

  it("updates the shared scroll state immediately for runtime scroll restores", () => {
    const scrollBox = new ScrollBox();

    scrollBox.setRuntimeScrollOffset(18.0, 64.0);

    expect<f32>(scrollBox.scrollState.offsetX.value).toBe(18.0);
    expect<f32>(scrollBox.scrollState.offsetY.value).toBe(64.0);
  });

  it("delegates explicit content size updates to the owned viewport", () => {
    resetCalls();

    const scrollBox = new ScrollBox()
      .scrollContentSize(-1.0, 640.0);
    scrollBox.build();

    const buildIndex = findCall(CALL_SET_SCROLL_CONTENT_SIZE);
    expect<i32>(buildIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(buildIndex, 1)).toBe(-1.0);
    expect<f64>(getCallArg(buildIndex, 2)).toBe(640.0);

    resetCalls();
    scrollBox.scrollContentSize(320.0, 960.0);

    const updateIndex = findCall(CALL_SET_SCROLL_CONTENT_SIZE);
    expect<i32>(updateIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(updateIndex, 1)).toBe(320.0);
    expect<f64>(getCallArg(updateIndex, 2)).toBe(960.0);
    expect<f32>(scrollBox.scrollState.contentWidth.value).toBe(320.0);
    expect<f32>(scrollBox.scrollState.contentHeight.value).toBe(960.0);
  });
});
