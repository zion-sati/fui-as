import * as ui from "../../src/bindings/ui";
import { Application } from "../../src/core/Application";
import { Unit } from "../../src/core/ffi";
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
