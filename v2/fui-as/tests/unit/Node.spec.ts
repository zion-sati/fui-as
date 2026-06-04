import {
  AlignSelf,
  AlignItems,
  BorderStyle,
  FlexDirection,
  GridUnit,
  JustifyContent,
  NodeType,
  SemanticRole,
  Orientation,
  TextAlign,
  TextVerticalAlign,
  TextOverflow,
  Unit,
  Visibility,
} from "../../src/core/ffi";
import { activeTheme, defaultDarkTheme, generateTheme, useCustomTheme } from "../../src/core/Theme";
import { FontFace, FontFamily, FontStack, FontStyle, FontWeight } from "../../src/core/Typography";
import { FlexBox, GradientStop, Grid, Portal, ScrollBar, ScrollBox, ScrollState, ScrollView, Text, TextCore } from "../../src/nodes";
import {
  CALL_ADD_CHILD,
  CALL_CREATE_NODE,
  CALL_GRID_SET_COLUMNS,
  CALL_GRID_SET_COLUMN_SHARED_SIZE_GROUP,
  CALL_LOG,
  CALL_REGISTER_FONT_FALLBACK,
  CALL_GRID_SET_ROWS,
  CALL_GRID_SET_ROW_SHARED_SIZE_GROUP,
  CALL_LOAD_FONT,
  CALL_SET_ALIGN_ITEMS,
  CALL_SET_ALIGN_SELF,
  CALL_SET_BOX_STYLE,
  CALL_SET_BACKGROUND_BLUR,
  CALL_SET_CLIP_TO_BOUNDS,
  CALL_SET_FILL_HEIGHT,
  CALL_SET_FILL_WIDTH,
  CALL_SET_FILL_HEIGHT_PERCENT,
  CALL_SET_FILL_WIDTH_PERCENT,
  CALL_SET_VISIBILITY,
  CALL_SET_CARET_COLOR,
  CALL_SET_EDITABLE,
  CALL_SET_DROP_SHADOW,
  CALL_SET_FLEX_DIRECTION,
  CALL_SET_FLEX_BASIS,
  CALL_SET_FOCUSABLE,
  CALL_SET_FONT,
  CALL_SET_GRID_PLACEMENT,
  CALL_SET_HEIGHT,
  CALL_SET_INTERACTIVE,
  CALL_SET_JUSTIFY_CONTENT,
  CALL_SET_LAYER_EFFECT,
  CALL_SET_LINEAR_GRADIENT,
  CALL_SET_MARGIN,
  CALL_SET_MAX_HEIGHT,
  CALL_SET_MAX_WIDTH,
  CALL_SET_MIN_HEIGHT,
  CALL_SET_MIN_WIDTH,
  CALL_SET_PADDING,
  CALL_SET_POSITION,
  CALL_SET_POSITION_TYPE,
  CALL_SET_PORTAL,
  CALL_SET_IS_SHARED_SIZE_SCOPE,
  CALL_SET_LINE_HEIGHT,
  CALL_SET_SELECTABLE,
  CALL_SET_SCROLL_OFFSET,
  CALL_SET_SCROLL_CONTENT_SIZE,
  CALL_SET_SEMANTIC_LABEL,
  CALL_SET_SEMANTIC_ROLE,
  CALL_SET_TEXT,
  CALL_SET_TEXT_ALIGN,
  CALL_SET_TEXT_VERTICAL_ALIGN,
  CALL_SET_TEXT_COLOR,
  CALL_SET_TEXT_LIMITS,
  CALL_SET_TEXT_WRAPPING,
  CALL_SET_TEXT_OBSCURED,
  CALL_SET_TEXT_OVERFLOW,
  CALL_SET_TEXT_OVERFLOW_FADE,
  CALL_SET_WIDTH,
  findCall,
  getCallArg,
  getCallCount,
  getCallSequence,
  setNodeBounds,
  lastFontUrlEquals,
  lastTextEquals,
  lastTextLength,
  lastLogCategoryEquals,
  lastLogMessageEquals,
  resetCalls,
  setLogsEnabled,
} from "./FfiTestImports";

function hasHandleArg(op: i32, handle: u64, argIndex: i32, value: f64): bool {
  const callCount = getCallCount();
  const sequence = getCallSequence();
  for (let index = 0; index < callCount; ++index) {
    if (unchecked(sequence[index]) != op) {
      continue;
    }
    if (getCallArg(index, 0) == <f64>handle && getCallArg(index, argIndex) == value) {
      return true;
    }
  }
  return false;
}

function findCallWithArgs(op: i32, first: f64, second: f64): i32 {
  const callCount = getCallCount();
  const sequence = getCallSequence();
  for (let index = 0; index < callCount; ++index) {
    if (unchecked(sequence[index]) != op) {
      continue;
    }
    if (getCallArg(index, 0) == first && getCallArg(index, 1) == second) {
      return index;
    }
  }
  return -1;
}

describe("Node builders", () => {
  afterEach(() => {
    useCustomTheme(defaultDarkTheme);
  });

  it("builds box nodes with layout styling", () => {
    resetCalls();

    const box = new FlexBox()
      .width(320.0, Unit.Pixel)
      .height(120.0, Unit.Percent)
      .bgColor(0xff336699)
      .flexDirection(FlexDirection.Row)
      .flexBasis(48.0)
      .justifyContent(JustifyContent.Center)
      .alignItems(AlignItems.Center)
      .alignSelf(AlignSelf.End)
      .margin(5.0, 6.0, 7.0, 8.0)
      .padding(1.0, 2.0, 3.0, 4.0)
      .clipToBounds(true);

    box.build();

    const createIndex = findCall(CALL_CREATE_NODE);
    expect<i32>(createIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(createIndex, 0)).toBe(<f64>NodeType.FlexBox);
    expect<i32>(findCall(CALL_SET_WIDTH)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_HEIGHT)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_BOX_STYLE)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_FLEX_DIRECTION)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_FLEX_BASIS)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_JUSTIFY_CONTENT)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_ALIGN_ITEMS)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_ALIGN_SELF)).toBeGreaterThan(-1);
    const marginIndex = findCall(CALL_SET_MARGIN);
    expect<i32>(marginIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(marginIndex, 1)).toBe(5.0);
    expect<f64>(getCallArg(marginIndex, 2)).toBe(6.0);
    expect<f64>(getCallArg(marginIndex, 3)).toBe(7.0);
    expect<f64>(getCallArg(marginIndex, 4)).toBe(8.0);
    const paddingIndex = findCall(CALL_SET_PADDING);
    expect<i32>(paddingIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(paddingIndex, 1)).toBe(1.0);
    expect<f64>(getCallArg(paddingIndex, 2)).toBe(2.0);
    expect<f64>(getCallArg(paddingIndex, 3)).toBe(3.0);
    expect<f64>(getCallArg(paddingIndex, 4)).toBe(4.0);
    expect<i32>(findCall(CALL_SET_CLIP_TO_BOUNDS)).toBeGreaterThan(-1);
  });

  it("lets a parent opt out of cross-axis alignment with none", () => {
    resetCalls();

    const child = new FlexBox()
      .width(40.0, Unit.Pixel)
      .height(20.0, Unit.Pixel)
      .alignSelf(AlignSelf.End);
    const box = new FlexBox()
      .width(200.0, Unit.Pixel)
      .height(100.0, Unit.Pixel)
      .flexDirection(FlexDirection.Row)
      .alignItems(AlignItems.None)
      .child(child);

    box.build();

    const alignItemsIndex = findCall(CALL_SET_ALIGN_ITEMS);
    expect<i32>(alignItemsIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(alignItemsIndex, 1)).toBe(<f64>AlignItems.None);
    expect<bool>(hasHandleArg(CALL_SET_ALIGN_SELF, child.builtHandle, 1, <f64>AlignSelf.End)).toBe(true);
  });

  it("exposes fill sizing helpers", () => {
    resetCalls();

    new FlexBox()
      .fillWidth()
      .fillHeight()
      .build();

    expect<i32>(findCall(CALL_SET_WIDTH)).toBe(-1);
    expect<i32>(findCall(CALL_SET_HEIGHT)).toBe(-1);
    expect<i32>(findCall(CALL_SET_FILL_WIDTH)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_FILL_HEIGHT)).toBeGreaterThan(-1);
  });

  it("exposes fill sizing helpers on text nodes", () => {
    resetCalls();

    new Text("Hello")
      .fillWidth()
      .fillHeight()
      .build();

    expect<i32>(findCall(CALL_SET_WIDTH)).toBe(-1);
    expect<i32>(findCall(CALL_SET_HEIGHT)).toBe(-1);
    expect<i32>(findCall(CALL_SET_FILL_WIDTH)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_FILL_HEIGHT)).toBeGreaterThan(-1);
  });

  it("exposes available-space percent fill and min/max sizing helpers", () => {
    resetCalls();

    new FlexBox()
      .fillWidthPercent(50.0)
      .fillHeightPercent(25.0)
      .minWidth(120.0)
      .maxWidth(60.0, Unit.Percent)
      .minHeight(32.0)
      .maxHeight(40.0, Unit.Percent)
      .build();

    const fillWidthPercentIndex = findCall(CALL_SET_FILL_WIDTH_PERCENT);
    expect<i32>(fillWidthPercentIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(fillWidthPercentIndex, 1)).toBe(50.0);

    const fillHeightPercentIndex = findCall(CALL_SET_FILL_HEIGHT_PERCENT);
    expect<i32>(fillHeightPercentIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(fillHeightPercentIndex, 1)).toBe(25.0);

    const minWidthIndex = findCall(CALL_SET_MIN_WIDTH);
    expect<i32>(minWidthIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(minWidthIndex, 1)).toBe(120.0);
    expect<f64>(getCallArg(minWidthIndex, 2)).toBe(<f64>Unit.Pixel);

    const maxWidthIndex = findCall(CALL_SET_MAX_WIDTH);
    expect<i32>(maxWidthIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(maxWidthIndex, 1)).toBe(60.0);
    expect<f64>(getCallArg(maxWidthIndex, 2)).toBe(<f64>Unit.Percent);

    const minHeightIndex = findCall(CALL_SET_MIN_HEIGHT);
    expect<i32>(minHeightIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(minHeightIndex, 1)).toBe(32.0);
    expect<f64>(getCallArg(minHeightIndex, 2)).toBe(<f64>Unit.Pixel);

    const maxHeightIndex = findCall(CALL_SET_MAX_HEIGHT);
    expect<i32>(maxHeightIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(maxHeightIndex, 1)).toBe(40.0);
    expect<f64>(getCallArg(maxHeightIndex, 2)).toBe(<f64>Unit.Percent);
  });

  it("exposes percent fill and min/max sizing helpers on text and scroll nodes", () => {
    resetCalls();

    new Text("Hello")
      .fillWidthPercent(65.0)
      .minHeight(24.0)
      .build();

    expect<i32>(findCall(CALL_SET_FILL_WIDTH_PERCENT)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_MIN_HEIGHT)).toBeGreaterThan(-1);

    resetCalls();

    new ScrollView()
      .fillHeightPercent(70.0)
      .maxWidth(320.0)
      .build();

    expect<i32>(findCall(CALL_SET_FILL_HEIGHT_PERCENT)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_MAX_WIDTH)).toBeGreaterThan(-1);
  });

  it("keeps only the final sizing mode per axis before build", () => {
    resetCalls();

    new FlexBox()
      .width(100.0, Unit.Percent)
      .fillWidthPercent(50.0)
      .fillWidth()
      .height(100.0, Unit.Percent)
      .fillHeightPercent(40.0)
      .fillHeight()
      .build();

    expect<i32>(findCall(CALL_SET_WIDTH)).toBe(-1);
    expect<i32>(findCall(CALL_SET_HEIGHT)).toBe(-1);
    expect<i32>(findCall(CALL_SET_FILL_WIDTH_PERCENT)).toBe(-1);
    expect<i32>(findCall(CALL_SET_FILL_HEIGHT_PERCENT)).toBe(-1);
    expect<i32>(findCall(CALL_SET_FILL_WIDTH)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_FILL_HEIGHT)).toBeGreaterThan(-1);

    resetCalls();

    new FlexBox()
      .fillWidth()
      .width(75.0, Unit.Percent)
      .fillHeight()
      .height(55.0, Unit.Percent)
      .build();

    expect<i32>(findCall(CALL_SET_FILL_WIDTH)).toBe(-1);
    expect<i32>(findCall(CALL_SET_FILL_HEIGHT)).toBe(-1);
    expect<i32>(findCall(CALL_SET_WIDTH)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_HEIGHT)).toBeGreaterThan(-1);
  });

  it("exposes flexBasis helpers on FlexBox and ScrollView", () => {
    resetCalls();

    new FlexBox()
      .flexBasis(24.0)
      .build();

    const boxBasisIndex = findCall(CALL_SET_FLEX_BASIS);
    expect<i32>(boxBasisIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(boxBasisIndex, 1)).toBe(24.0);

    resetCalls();

    new ScrollView()
      .flexBasis(36.0)
      .build();

    const scrollBasisIndex = findCall(CALL_SET_FLEX_BASIS);
    expect<i32>(scrollBasisIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(scrollBasisIndex, 1)).toBe(36.0);
  });

  it("warns when a row child claims 100 percent width alongside siblings", () => {
    resetCalls();
    setLogsEnabled(true);

    new FlexBox()
      .flexDirection(FlexDirection.Row)
      .child(new FlexBox().width(100.0, Unit.Percent))
      .child(new FlexBox().width(100.0, Unit.Percent))
      .build();

    expect<i32>(findCall(CALL_LOG)).toBeGreaterThan(-1);
    expect<bool>(lastLogCategoryEquals("Warning/Layout")).toBe(true);
    expect<bool>(lastLogMessageEquals(
      "A row container has an in-flow child using width(100.0, Unit.Percent) alongside siblings. Unit.Percent is literal parent-relative sizing, not flex sharing. Use fillWidth() when the child should take remaining row space. [containerPath=root, childPath=root/0, childIndex=0]",
    )).toBe(true);
  });

  it("includes node ids in full-percent layout warnings when available", () => {
    resetCalls();
    setLogsEnabled(true);

    const parent = new FlexBox()
      .nodeId("LayoutRoot") as FlexBox;
    parent.flexDirection(FlexDirection.Row);
    const mainPane = new FlexBox()
      .nodeId("MainPane") as FlexBox;
    parent
      .child(mainPane.width(100.0, Unit.Percent))
      .child(new FlexBox().width(48.0, Unit.Pixel))
      .build();

    expect<i32>(findCall(CALL_LOG)).toBeGreaterThan(-1);
    expect<bool>(lastLogCategoryEquals("Warning/Layout")).toBe(true);
    expect<bool>(lastLogMessageEquals(
      "A row container has an in-flow child using width(100.0, Unit.Percent) alongside siblings. Unit.Percent is literal parent-relative sizing, not flex sharing. Use fillWidth() when the child should take remaining row space. [containerPath=root, childPath=root/0, containerNodeId=LayoutRoot, childNodeId=MainPane, childIndex=0]",
    )).toBe(true);
  });

  it("warns when a column's explicit height percentages exceed 100 percent", () => {
    resetCalls();
    setLogsEnabled(true);

    new FlexBox()
      .child(new FlexBox().height(60.0, Unit.Percent))
      .child(new FlexBox().height(60.0, Unit.Percent))
      .build();

    expect<i32>(findCall(CALL_LOG)).toBeGreaterThan(-1);
    expect<bool>(lastLogCategoryEquals("Warning/Layout")).toBe(true);
    expect<bool>(lastLogMessageEquals(
      "A column container has in-flow children whose explicit height percentages exceed 100% in total. Unit.Percent is literal parent-relative sizing, not flex sharing. Use fillHeight() for the child that should expand, or reduce the percentages so they fit. [containerPath=root]",
    )).toBe(true);
  });

  it("clips flex containers by default and allows opting out explicitly", () => {
    resetCalls();

    new FlexBox().build();

    let clipIndex = findCall(CALL_SET_CLIP_TO_BOUNDS);
    expect<i32>(clipIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(clipIndex, 1)).toBe(1.0);

    resetCalls();

    new FlexBox().clipToBounds(false).build();

    clipIndex = findCall(CALL_SET_CLIP_TO_BOUNDS);
    expect<i32>(clipIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(clipIndex, 1)).toBe(0.0);
  });

  it("emits retained box styling for radii and border", () => {
    resetCalls();

    new FlexBox()
      .bgColor(0xff336699)
      .cornerRadius(12.0)
      .border(2.0, 0xff0000ff, BorderStyle.Dashed)
      .borderDashed(6.0, 3.0)
      .build();

    const styleIndex = findCall(CALL_SET_BOX_STYLE);
    expect<i32>(styleIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(styleIndex, 1)).toBe(0xff336699);
    expect<f64>(getCallArg(styleIndex, 2)).toBe(12.0);
    expect<f64>(getCallArg(styleIndex, 3)).toBe(12.0);
    expect<f64>(getCallArg(styleIndex, 4)).toBe(12.0);
    expect<f64>(getCallArg(styleIndex, 5)).toBe(12.0);
    expect<f64>(getCallArg(styleIndex, 6)).toBe(2.0);
    expect<f64>(getCallArg(styleIndex, 7)).toBe(0xff0000ff);
    expect<f64>(getCallArg(styleIndex, 8)).toBe(<f64>BorderStyle.Dashed);
    expect<f64>(getCallArg(styleIndex, 9)).toBe(6.0);
    expect<f64>(getCallArg(styleIndex, 10)).toBe(3.0);
  });

  it("emits layer effects for opacity and blur", () => {
    resetCalls();

    new FlexBox()
      .opacity(0.5)
      .blur(4.0)
      .build();

    const effectIndex = findCall(CALL_SET_LAYER_EFFECT);
    expect<i32>(effectIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(effectIndex, 1)).toBe(0.5);
    expect<f64>(getCallArg(effectIndex, 2)).toBe(4.0);
    expect<f64>(getCallArg(effectIndex, 3)).toBe(0.0);
  });

  it("emits background blur effects separately from foreground layer blur", () => {
    resetCalls();

    new FlexBox()
      .backgroundBlur(12.0)
      .build();

    const blurIndex = findCall(CALL_SET_BACKGROUND_BLUR);
    expect<i32>(blurIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(blurIndex, 1)).toBe(12.0);
  });

  it("emits retained drop shadow styling", () => {
    resetCalls();

    new FlexBox()
      .dropShadow(0x00000044, 2.0, 6.0, 18.0, 4.0)
      .build();

    const shadowIndex = findCall(CALL_SET_DROP_SHADOW);
    expect<i32>(shadowIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(shadowIndex, 1)).toBe(0x00000044);
    expect<f64>(getCallArg(shadowIndex, 2)).toBe(2.0);
    expect<f64>(getCallArg(shadowIndex, 3)).toBe(6.0);
    expect<f64>(getCallArg(shadowIndex, 4)).toBe(18.0);
    expect<f64>(getCallArg(shadowIndex, 5)).toBe(4.0);
  });

  it("packs gradient stops for linear gradients", () => {
    resetCalls();

    const stops = new Array<GradientStop>();
    stops.push(new GradientStop(0.0, 0xff0000ff));
    stops.push(new GradientStop(1.0, 0x0000ffff));
    expect<u32>(unchecked(stops[0]).color).toBe(0xff0000ff);
    expect<u32>(unchecked(stops[1]).color).toBe(0x0000ffff);

    new FlexBox()
      .linearGradient(0.0, 10.0, 20.0, 30.0, stops)
      .build();

    const gradientIndex = findCall(CALL_SET_LINEAR_GRADIENT);
    expect<i32>(gradientIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(gradientIndex, 1)).toBe(0.0);
    expect<f64>(getCallArg(gradientIndex, 2)).toBe(10.0);
    expect<f64>(getCallArg(gradientIndex, 3)).toBe(20.0);
    expect<f64>(getCallArg(gradientIndex, 4)).toBe(30.0);
    expect<f64>(getCallArg(gradientIndex, 5)).toBe(2.0);
    expect<f64>(getCallArg(gradientIndex, 6)).toBe(0.0);
    expect<f64>(getCallArg(gradientIndex, 7)).toBe(0xff0000ff);
    expect<f64>(getCallArg(gradientIndex, 8)).toBe(1.0);
    expect<f64>(getCallArg(gradientIndex, 9)).toBe(0x0000ffff);
  });

  it("builds text nodes and forwards text payloads", () => {
    resetCalls();

    const text = new Text("hello");
    text
      .width(80.0, Unit.Pixel)
      .height(24.0, Unit.Pixel)
      .font(7, 18.0)
      .textColor(0xff00ff00)
      .textAlign(TextAlign.Right)
      .verticalAlign(TextVerticalAlign.Bottom)
      .maxLines(2)
      .wrapping(false)
      .overflow(TextOverflow.Ellipsis)
      .obscured(true);
    text.overflowFade(true, true);

    text.build();

    const createIndex = findCall(CALL_CREATE_NODE);
    expect<i32>(createIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(createIndex, 0)).toBe(<f64>NodeType.Text);
    expect<i32>(findCall(CALL_SET_TEXT)).toBeGreaterThan(-1);
    expect<i32>(lastTextLength()).toBe(5);
    expect<bool>(lastTextEquals("hello")).toBe(true);
    expect<i32>(findCall(CALL_SET_WIDTH)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_HEIGHT)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_FONT)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_TEXT_COLOR)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_TEXT_ALIGN)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_TEXT_VERTICAL_ALIGN)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_TEXT_LIMITS)).toBeGreaterThan(-1);
    const wrappingIndex = findCall(CALL_SET_TEXT_WRAPPING);
    expect<i32>(wrappingIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(wrappingIndex, 1)).toBe(0.0);
    expect<i32>(findCall(CALL_SET_TEXT_OVERFLOW)).toBeGreaterThan(-1);
    const fadeIndex = findCall(CALL_SET_TEXT_OVERFLOW_FADE);
    expect<i32>(fadeIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(fadeIndex, 1)).toBe(1.0);
    expect<f64>(getCallArg(fadeIndex, 2)).toBe(1.0);
    expect<i32>(findCall(CALL_SET_TEXT_OBSCURED)).toBeGreaterThan(-1);
  });

  it("builds editable text nodes with caret styling", () => {
    resetCalls();

    const text = new Text("hello")
      .editable()
      .caretColor(0xff123456);

    text.build();

    const editableIndex = findCall(CALL_SET_EDITABLE);
    expect<i32>(editableIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(editableIndex, 1)).toBe(1.0);
    const caretIndex = findCall(CALL_SET_CARET_COLOR);
    expect<i32>(caretIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(caretIndex, 1)).toBe(0xff123456);
    expect<i32>(findCall(CALL_SET_SELECTABLE)).toBeGreaterThan(-1);
  });

  it("builds and updates explicit text line height", () => {
    resetCalls();

    const text = new Text("hello").font(7, 18.0).lineHeight(28.0);
    text.build();

    const lineHeightIndex = findCall(CALL_SET_LINE_HEIGHT);
    expect<i32>(lineHeightIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(lineHeightIndex, 1)).toBe(28.0);

    resetCalls();
    text.lineHeight(22.0);

    const updatedLineHeightIndex = findCall(CALL_SET_LINE_HEIGHT);
    expect<i32>(updatedLineHeightIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(updatedLineHeightIndex, 1)).toBe(22.0);
  });

  it("promotes labeled text into static text semantics by default", () => {
    resetCalls();

    const text = new Text("hello").semanticLabel("Greeting");

    text.build();

    const roleIndex = findCall(CALL_SET_SEMANTIC_ROLE);
    expect<i32>(roleIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(roleIndex, 1)).toBe(<f64>SemanticRole.StaticText);
    expect<i32>(findCall(CALL_SET_SEMANTIC_LABEL)).toBeGreaterThan(-1);
  });

  it("emits static text semantics from plain text content by default", () => {
    resetCalls();

    const text = new Text("hello");

    text.build();

    const roleIndex = findCall(CALL_SET_SEMANTIC_ROLE);
    expect<i32>(roleIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(roleIndex, 1)).toBe(<f64>SemanticRole.StaticText);
    expect<i32>(findCall(CALL_SET_SEMANTIC_LABEL)).toBeGreaterThan(-1);
    expect<bool>(lastTextEquals("hello")).toBe(true);
  });

  it("suppresses automatic text semantics beneath semantic ancestors", () => {
    resetCalls();

    const box = new FlexBox();
    box.semanticRole(SemanticRole.Button);
    box.child(new Text("Inner label"));
    box.build();

    expect<i32>(findCall(CALL_SET_SEMANTIC_LABEL)).toBe(-1);
  });

  it("keeps internal TextCore nodes out of automatic plain text semantics", () => {
    resetCalls();

    new TextCore("Decorative").build();

    expect<i32>(findCall(CALL_SET_SEMANTIC_ROLE)).toBe(-1);
    expect<i32>(findCall(CALL_SET_SEMANTIC_LABEL)).toBe(-1);
  });

  it("updates built text nodes through retained setters", () => {
    const text = new Text("hello").font(7, 18.0).textColor(0xff00ff00);
    text.build();

    resetCalls();
    text.text("updated").textColor(0xff112233);

    expect<i32>(findCall(CALL_SET_TEXT)).toBeGreaterThan(-1);
    expect<bool>(lastTextEquals("updated")).toBe(true);
    expect<i32>(findCall(CALL_SET_TEXT_COLOR)).toBeGreaterThan(-1);
  });

  it("resolves family, weight, and style to concrete font ids", () => {
    resetCalls();

    const family = new FontFamily(1, 2, 3, 4);
    const text = new Text("hello")
      .fontFamily(family)
      .fontWeight(FontWeight.Bold)
      .fontStyle(FontStyle.Italic)
      .fontSize(18.0);

    text.build();

    const fontIndex = findCall(CALL_SET_FONT);
    expect<i32>(fontIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(fontIndex, 1)).toBe(4.0);
    expect<f64>(getCallArg(fontIndex, 2)).toBe(18.0);
  });

  it("falls back to the nearest available face when a variant is missing", () => {
    resetCalls();

    const text = new Text("hello")
      .fontFamily(FontFamily.regularBold(1, 2))
      .fontStyle(FontStyle.Italic)
      .fontSize(18.0);

    text.build();

    const fontIndex = findCall(CALL_SET_FONT);
    expect<i32>(fontIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(fontIndex, 1)).toBe(1.0);
  });

  it("uses the active theme body font when only font size is set", () => {
    resetCalls();

    const text = new Text("hello")
      .fontSize(18.0);

    text.build();

    const fontIndex = findCall(CALL_SET_FONT);
    expect<i32>(fontIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(fontIndex, 1)).toBe(
      <f64>activeTheme.value.fonts.bodyFamily.resolve(FontWeight.Regular, FontStyle.Normal),
    );
    expect<f64>(getCallArg(fontIndex, 2)).toBe(18.0);
  });

  it("defaults text color to the active theme primary text color", () => {
    resetCalls();

    const text = new Text("hello");

    text.build();

    const colorIndex = findCall(CALL_SET_TEXT_COLOR);
    expect<i32>(colorIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(colorIndex, 1)).toBe(<f64>activeTheme.value.colors.textPrimary);
  });

  it("registers font stack fallbacks while text still uses the primary font id", () => {
    resetCalls();

    const stack = new FontStack(1).fallback(2).fallback(3);
    const text = new Text("hello").font(stack.id, 18.0);

    text.build();

    expect<i32>(findCallWithArgs(CALL_REGISTER_FONT_FALLBACK, 1.0, 2.0)).toBeGreaterThan(-1);
    expect<i32>(findCallWithArgs(CALL_REGISTER_FONT_FALLBACK, 1.0, 3.0)).toBeGreaterThan(-1);
    const fontIndex = findCall(CALL_SET_FONT);
    expect<i32>(fontIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(fontIndex, 1)).toBe(1.0);
    expect<f64>(getCallArg(fontIndex, 2)).toBe(18.0);
  });

  it("loads custom font stacks through fui_host without exposing bridge APIs", () => {
    resetCalls();

    const emoji = FontFace.load("/fonts/NotoColorEmoji.ttf");
    const stack = FontStack.load("/fonts/Inter-Regular.ttf")
      .fallbackFace(emoji)
      .fallbackLoaded("/fonts/NotoSansSymbols2-Regular.ttf");
    const text = new Text("hello 🌍").fontStack(stack, 18.0);

    text.build();

    const sequence = getCallSequence();
    let fontLoadCount = 0;
    for (let index = 0; index < sequence.length; ++index) {
      if (unchecked(sequence[index]) == CALL_LOAD_FONT) {
        fontLoadCount += 1;
      }
    }
    expect<i32>(fontLoadCount).toBe(3);
    expect<bool>(lastFontUrlEquals("/fonts/NotoSansSymbols2-Regular.ttf")).toBe(true);
    expect<i32>(findCallWithArgs(CALL_REGISTER_FONT_FALLBACK, <f64>stack.id, <f64>emoji.id)).toBeGreaterThan(-1);
    const fontIndex = findCall(CALL_SET_FONT);
    expect<i32>(fontIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(fontIndex, 1)).toBe(<f64>stack.id);
    expect<f64>(getCallArg(fontIndex, 2)).toBe(18.0);
  });

  it("updates built box layout and paint through retained setters", () => {
    const box = new FlexBox().width(120.0, Unit.Pixel).bgColor(0xff336699);
    box.build();

    resetCalls();
    box.width(240.0, Unit.Pixel).bgColor(0xff112233);

    const widthIndex = findCall(CALL_SET_WIDTH);
    expect<i32>(widthIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(widthIndex, 1)).toBe(240.0);
    const styleIndex = findCall(CALL_SET_BOX_STYLE);
    expect<i32>(styleIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(styleIndex, 1)).toBe(0xff112233);
  });

  it("returns default bounds and coordinate transforms before build", () => {
    const box = new FlexBox();
    const bounds = box.getBounds();
    expect<f32>(unchecked(bounds[0])).toBe(0.0);
    expect<f32>(unchecked(bounds[1])).toBe(0.0);
    expect<f32>(unchecked(bounds[2])).toBe(0.0);
    expect<f32>(unchecked(bounds[3])).toBe(0.0);

    const local = box.absoluteToLocalPosition(12.0, 18.0);
    expect<f32>(unchecked(local[0])).toBe(12.0);
    expect<f32>(unchecked(local[1])).toBe(18.0);

    const absolute = box.localToAbsolutePosition(12.0, 18.0);
    expect<f32>(unchecked(absolute[0])).toBe(12.0);
    expect<f32>(unchecked(absolute[1])).toBe(18.0);
  });

  it("exposes bounds plus absolute/local coordinate transforms after build", () => {
    resetCalls();

    const node = new FlexBox();
    node.build();
    setNodeBounds(node.builtHandle, 100.0, 50.0, 300.0, 200.0);

    const bounds = node.getBounds();
    expect<f32>(unchecked(bounds[0])).toBe(100.0);
    expect<f32>(unchecked(bounds[1])).toBe(50.0);
    expect<f32>(unchecked(bounds[2])).toBe(300.0);
    expect<f32>(unchecked(bounds[3])).toBe(200.0);

    const local = node.absoluteToLocalPosition(148.0, 86.0);
    expect<f32>(unchecked(local[0])).toBe(48.0);
    expect<f32>(unchecked(local[1])).toBe(36.0);

    const absolute = node.localToAbsolutePosition(12.0, 20.0);
    expect<f32>(unchecked(absolute[0])).toBe(112.0);
    expect<f32>(unchecked(absolute[1])).toBe(70.0);
  });

  it("emits retained absolute positioning updates", () => {
    const box = new FlexBox().width(120.0, Unit.Pixel);
    box.build();

    resetCalls();
    box.positionAbsolute().position(24.0, 36.0);

    const positionTypeIndex = findCall(CALL_SET_POSITION_TYPE);
    expect<i32>(positionTypeIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(positionTypeIndex, 1)).toBe(1.0);
    const positionIndex = findCall(CALL_SET_POSITION);
    expect<i32>(positionIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(positionIndex, 1)).toBe(24.0);
    expect<f64>(getCallArg(positionIndex, 2)).toBe(36.0);
  });

  it("builds scroll views with child content and scroll offsets", () => {
    resetCalls();

    new ScrollView()
      .width(100.0, Unit.Percent)
      .height(180.0, Unit.Pixel)
      .scrollOffset(12.0, 24.0)
      .child(new FlexBox().width(10.0))
      .build();

    const createIndex = findCall(CALL_CREATE_NODE);
    expect<i32>(createIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(createIndex, 0)).toBe(<f64>NodeType.ScrollView);
    expect<i32>(findCall(CALL_SET_WIDTH)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_HEIGHT)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_SCROLL_OFFSET)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_ADD_CHILD)).toBeGreaterThan(-1);
  });

  it("emits explicit scroll content size updates for scroll views", () => {
    resetCalls();

    const scrollView = new ScrollView()
      .scrollContentSize(-1.0, 480.0)
      .height(180.0, Unit.Pixel);
    scrollView.build();

    const buildIndex = findCall(CALL_SET_SCROLL_CONTENT_SIZE);
    expect<i32>(buildIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(buildIndex, 0)).toBe(<f64>scrollView.builtHandle);
    expect<f64>(getCallArg(buildIndex, 1)).toBe(-1.0);
    expect<f64>(getCallArg(buildIndex, 2)).toBe(480.0);

    resetCalls();
    scrollView.scrollContentSize(240.0, 720.0);

    const updateIndex = findCall(CALL_SET_SCROLL_CONTENT_SIZE);
    expect<i32>(updateIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(updateIndex, 1)).toBe(240.0);
    expect<f64>(getCallArg(updateIndex, 2)).toBe(720.0);
    expect<f32>(scrollView.scrollState.contentWidth.value).toBe(240.0);
    expect<f32>(scrollView.scrollState.contentHeight.value).toBe(720.0);
  });

  it("keeps raw scroll views hit-testable while ScrollBox root itself stays non-interactive", () => {
    resetCalls();

    const rawScrollView = new ScrollView()
      .width(100.0, Unit.Percent)
      .height(180.0, Unit.Pixel)
      .child(new FlexBox().width(10.0))
      .build();
    expect<bool>(hasHandleArg(CALL_SET_INTERACTIVE, rawScrollView, 1, 1)).toBe(true);
    expect<bool>(hasHandleArg(CALL_SET_INTERACTIVE, rawScrollView, 1, 0)).toBe(false);

    resetCalls();

    const scrollBox = new ScrollBox()
      .width(100.0, Unit.Percent)
      .height(180.0, Unit.Pixel)
      .child(new FlexBox().width(10.0))
      .build();

    expect<bool>(hasHandleArg(CALL_SET_INTERACTIVE, scrollBox, 1, 1)).toBe(false);
    expect<bool>(hasHandleArg(CALL_SET_INTERACTIVE, scrollBox, 1, 0)).toBe(false);
  });

  it("tracks scroll state from configured offsets", () => {
    const scrollView = new ScrollView()
      .width(100.0, Unit.Pixel)
      .height(80.0, Unit.Pixel)
      .scrollOffset(6.0, 24.0);
    expect<f32>(scrollView.scrollState.offsetX.value).toBe(6.0);
    expect<f32>(scrollView.scrollState.offsetY.value).toBe(24.0);
    expect<f32>(scrollView.scrollState.viewportWidth.value).toBe(100.0);
    expect<f32>(scrollView.scrollState.viewportHeight.value).toBe(80.0);
  });

  it("reuses the same scrollbar node and updates built thumb metrics", () => {
    resetCalls();

    const state = new ScrollState();
    const scrollBar = new ScrollBar(state);
    const firstNode = scrollBar.render();
    const secondNode = scrollBar.render();
    expect<bool>(firstNode === secondNode).toBe(true);

    firstNode.build();
    resetCalls();

    state.viewportHeight.value = 100.0;
    state.contentHeight.value = 500.0;
    state.offsetY.value = 100.0;

    const sequence = getCallSequence();
    let heightCalls = 0;
    for (let index = 0; index < sequence.length; index += 1) {
      if (unchecked(sequence[index]) == CALL_SET_HEIGHT) {
        heightCalls += 1;
      }
    }
    expect<i32>(heightCalls).toBeGreaterThan(0);
  });

  it("updates built horizontal scrollbar thumb metrics", () => {
    resetCalls();

    const state = new ScrollState();
    const scrollBar = new ScrollBar(state, Orientation.Horizontal);
    scrollBar.render().build();
    resetCalls();

    state.viewportWidth.value = 120.0;
    state.contentWidth.value = 480.0;
    state.offsetX.value = 60.0;

    const sequence = getCallSequence();
    let widthCalls = 0;
    for (let index = 0; index < sequence.length; index += 1) {
      if (unchecked(sequence[index]) == CALL_SET_WIDTH) {
        widthCalls += 1;
      }
    }
    expect<i32>(widthCalls).toBeGreaterThan(0);
  });

  it("updates built selectable text when the theme selection color changes", () => {
    resetCalls();

    const text = new Text("Selectable");
    text.selectable();
    text.build();
    resetCalls();

    const nextTheme = generateTheme(false, 0xdb2777ff);
    useCustomTheme(nextTheme);

    let foundSelectableUpdate = false;
    const callCount = getCallCount();
    const sequence = getCallSequence();
    for (let index = 0; index < callCount; ++index) {
      if (unchecked(sequence[index]) == CALL_SET_SELECTABLE && <u32>getCallArg(index, 2) == nextTheme.colors.selection) {
        foundSelectableUpdate = true;
        break;
      }
    }
    expect<bool>(foundSelectableUpdate).toBe(true);

    text.dispose();
  });

  it("updates built scrollbar colors when the theme changes", () => {
    resetCalls();

    const state = new ScrollState();
    const scrollBar = new ScrollBar(state);
    const node = scrollBar.render();
    node.build();
    resetCalls();

    const nextTheme = generateTheme(false, 0xdb2777ff);
    useCustomTheme(nextTheme);

    let foundTrackColor = false;
    let foundThumbColor = false;
    const callCount = getCallCount();
    const sequence = getCallSequence();
    for (let index = 0; index < callCount; ++index) {
      if (unchecked(sequence[index]) != CALL_SET_BOX_STYLE) {
        continue;
      }
      const background = <u32>getCallArg(index, 1);
      if (background == nextTheme.colors.scrollbarTrack) {
        foundTrackColor = true;
      }
      if (background == nextTheme.colors.scrollbarThumb) {
        foundThumbColor = true;
      }
    }

    expect<bool>(foundTrackColor).toBe(true);
    expect<bool>(foundThumbColor).toBe(true);
  });

  it("supports explicit scrollbar sizing and visual overrides", () => {
    resetCalls();

    const state = new ScrollState();
    const scrollBar = new ScrollBar(state)
      .trackWidth(14.0)
      .thumbWidth(6.0)
      .thumbMinHeight(24.0)
      .trackCornerRadius(7.0)
      .thumbCornerRadius(3.0)
      .trackColor(0x11223344)
      .thumbColor(0x22334455);
    scrollBar.render().build();

    let foundTrackWidth = false;
    let foundThumbWidth = false;
    let foundTrackStyle = false;
    let foundThumbStyle = false;
    const callCount = getCallCount();
    const sequence = getCallSequence();
    for (let index = 0; index < callCount; ++index) {
      const op = unchecked(sequence[index]);
      if (op == CALL_SET_WIDTH) {
        const width = getCallArg(index, 1);
        if (width == 14.0) {
          foundTrackWidth = true;
        }
        if (width == 6.0) {
          foundThumbWidth = true;
        }
      }
      if (op != CALL_SET_BOX_STYLE) {
        continue;
      }
      const background = <u32>getCallArg(index, 1);
      if (background == 0x11223344 && getCallArg(index, 2) == 7.0) {
        foundTrackStyle = true;
      }
      if (background == 0x22334455 && getCallArg(index, 2) == 3.0) {
        foundThumbStyle = true;
      }
    }

    expect<bool>(foundTrackWidth).toBe(true);
    expect<bool>(foundThumbWidth).toBe(true);
    expect<bool>(foundTrackStyle).toBe(true);
    expect<bool>(foundThumbStyle).toBe(true);

    resetCalls();
    useCustomTheme(generateTheme(false, 0xdb2777ff));
    let keptTrackColor = false;
    let keptThumbColor = false;
    const nextSequence = getCallSequence();
    for (let index = 0; index < nextSequence.length; ++index) {
      if (unchecked(nextSequence[index]) != CALL_SET_BOX_STYLE) {
        continue;
      }
      const background = <u32>getCallArg(index, 1);
      if (background == 0x11223344) {
        keptTrackColor = true;
      }
      if (background == 0x22334455) {
        keptThumbColor = true;
      }
    }
    expect<bool>(keptTrackColor).toBe(true);
    expect<bool>(keptThumbColor).toBe(true);
  });

  it("can bind an external scroll state", () => {
    const externalState = new ScrollState();
    const scrollView = new ScrollView()
      .bindScrollState(externalState)
      .width(100.0, Unit.Pixel)
      .height(80.0, Unit.Pixel)
      .scrollOffset(6.0, 24.0);

    expect<bool>(scrollView.scrollState === externalState).toBe(true);
    expect<f32>(externalState.offsetX.value).toBe(6.0);
    expect<f32>(externalState.offsetY.value).toBe(24.0);
    expect<f32>(externalState.viewportWidth.value).toBe(100.0);
    expect<f32>(externalState.viewportHeight.value).toBe(80.0);
  });

  it("builds grids with track definitions and placements", () => {
    resetCalls();

    const columnValues = new Array<f32>();
    columnValues.push(100.0);
    columnValues.push(1.0);
    const columnTypes = new Array<GridUnit>();
    columnTypes.push(GridUnit.Pixel);
    columnTypes.push(GridUnit.Star);

    const rowValues = new Array<f32>();
    rowValues.push(1.0);
    const rowTypes = new Array<GridUnit>();
    rowTypes.push(GridUnit.Star);

    new Grid()
      .columns(2, columnValues, columnTypes)
      .rows(1, rowValues, rowTypes)
      .placeChild(new Text("cell"), 0, 0)
      .build();

    const createIndex = findCall(CALL_CREATE_NODE);
    expect<i32>(createIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(createIndex, 0)).toBe(<f64>NodeType.Grid);
    expect<i32>(findCall(CALL_GRID_SET_COLUMNS)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_GRID_SET_ROWS)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_GRID_PLACEMENT)).toBeGreaterThan(-1);
  });

  it("applies grid shared-size attached properties and track groups", () => {
    resetCalls();

    const host = new FlexBox();
    Grid.sharedSizeScope(host, true);
    host.child(
      new Grid()
        .columnSharedSizeGroup(1, "Shortcut")
        .rowSharedSizeGroup(0, "MenuRow"),
    );

    host.build();

    expect<i32>(findCall(CALL_SET_IS_SHARED_SIZE_SCOPE)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_GRID_SET_COLUMN_SHARED_SIZE_GROUP)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_GRID_SET_ROW_SHARED_SIZE_GROUP)).toBeGreaterThan(-1);
  });

  it("marks portals on top of the box container node", () => {
    resetCalls();

    new Portal().child(new Text("overlay")).build();

    expect<i32>(findCall(CALL_SET_PORTAL)).toBeGreaterThan(-1);
  });

  it("keeps portals overflow-visible by default", () => {
    resetCalls();

    new Portal().child(new Text("overlay")).build();

    const clipIndex = findCall(CALL_SET_CLIP_TO_BOUNDS);
    expect<i32>(clipIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(clipIndex, 1)).toBe(0.0);
  });

  it("builds child nodes before adding them to the parent", () => {
    resetCalls();

    new FlexBox().child(new Text("child")).build();

    const sequence = getCallSequence();
    let addChildIndex = -1;
    let latestCreateIndex = -1;
    for (let i = 0; i < sequence.length; ++i) {
      const op = unchecked(sequence[i]);
      if (op == CALL_CREATE_NODE) {
        latestCreateIndex = i;
      }
      if (addChildIndex == -1 && op == CALL_ADD_CHILD) {
        addChildIndex = i;
      }
    }

    expect<i32>(latestCreateIndex).toBeGreaterThan(-1);
    expect<i32>(addChildIndex).toBeGreaterThan(-1);
    expect<i32>(latestCreateIndex).toBeLessThan(addChildIndex);
  });

  it("marks interactive nodes when pointer callbacks are registered", () => {
    resetCalls();

    new FlexBox()
      .onClick(() => {})
      .build();

    const interactiveIndex = findCall(CALL_SET_INTERACTIVE);
    expect<i32>(interactiveIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(interactiveIndex, 1)).toBe(1);
  });

  it("marks focusable nodes with configured tab order", () => {
    resetCalls();

    new FlexBox()
      .focusable(true, 3)
      .build();

    const focusableIndex = findCall(CALL_SET_FOCUSABLE);
    expect<i32>(focusableIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(focusableIndex, 1)).toBe(1);
    expect<f64>(getCallArg(focusableIndex, 2)).toBe(3);
  });

  it("disables built interactive and focusable nodes", () => {
    resetCalls();

    const box = new FlexBox()
      .onClick(() => {})
      .focusable(true, 3);
    const handle = box.build();
    resetCalls();

    box.enabled(false);

    expect<bool>(hasHandleArg(CALL_SET_INTERACTIVE, handle, 1, 0)).toBe(true);
    expect<bool>(hasHandleArg(CALL_SET_FOCUSABLE, handle, 1, 0)).toBe(true);
  });

  it("suppresses interactive setup during build when pre-disabled", () => {
    resetCalls();

    new FlexBox()
      .onClick(() => {})
      .focusable(true, 3)
      .enabled(false)
      .build();

    expect<i32>(findCall(CALL_SET_INTERACTIVE)).toBe(-1);
    expect<i32>(findCall(CALL_SET_FOCUSABLE)).toBe(-1);
  });

  it("applies visibility state and disables interaction while hidden", () => {
    resetCalls();

    const box = new FlexBox()
      .onClick(() => {})
      .focusable(true, 3);
    const handle = box.build();
    resetCalls();

    box.visibility(Visibility.Hidden);

    expect<bool>(box.isVisible).toBe(false);
    expect<bool>(hasHandleArg(CALL_SET_VISIBILITY, handle, 1, <f64>Visibility.Hidden)).toBe(true);
    expect<bool>(hasHandleArg(CALL_SET_INTERACTIVE, handle, 1, 0)).toBe(true);
    expect<bool>(hasHandleArg(CALL_SET_FOCUSABLE, handle, 1, 0)).toBe(true);
  });

  it("inherits parent visibility and restores on detach", () => {
    resetCalls();

    const parent = new FlexBox();
    parent.visibility(Visibility.Hidden);
    const child = new FlexBox()
      .onClick(() => {})
      .focusable(true, 1);
    parent.child(child);
    parent.build();
    const childHandle = child.builtHandle;
    resetCalls();

    parent.visibility(Visibility.Normal);

    expect<bool>(child.isVisible).toBe(true);
    expect<bool>(hasHandleArg(CALL_SET_VISIBILITY, childHandle, 1, <f64>Visibility.Normal)).toBe(true);
    expect<bool>(hasHandleArg(CALL_SET_INTERACTIVE, childHandle, 1, 1)).toBe(true);
    expect<bool>(hasHandleArg(CALL_SET_FOCUSABLE, childHandle, 1, 1)).toBe(true);

    resetCalls();
    parent.visibility(Visibility.Hidden);
    parent.removeChildNode(child);
    expect<bool>(child.isVisible).toBe(true);
    expect<bool>(hasHandleArg(CALL_SET_VISIBILITY, childHandle, 1, <f64>Visibility.Normal)).toBe(true);
  });

  it("propagates disabled state to existing children", () => {
    resetCalls();

    const parent = new FlexBox();
    const child = new FlexBox()
      .onClick(() => {})
      .focusable(true, 1);
    parent.child(child);
    parent.build();
    const childHandle = child.builtHandle;
    resetCalls();

    parent.enabled(false);

    expect<bool>(hasHandleArg(CALL_SET_INTERACTIVE, childHandle, 1, 0)).toBe(true);
    expect<bool>(hasHandleArg(CALL_SET_FOCUSABLE, childHandle, 1, 0)).toBe(true);
    expect<bool>(child.isEnabled).toBe(false);
  });

  it("inherits disabled state when added to a disabled parent", () => {
    resetCalls();

    const parent = new FlexBox();
    parent.enabled(false);
    parent.build();
    resetCalls();

    const child = new FlexBox()
      .onClick(() => {})
      .focusable(true, 1);
    parent.child(child);

    expect<bool>(child.isEnabled).toBe(false);
    expect<i32>(findCall(CALL_ADD_CHILD)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_INTERACTIVE)).toBe(-1);
    expect<i32>(findCall(CALL_SET_FOCUSABLE)).toBe(-1);
  });

  it("re-enables children when a parent is restored", () => {
    resetCalls();

    const parent = new FlexBox();
    const child = new FlexBox()
      .onClick(() => {})
      .focusable(true, 1);
    parent.child(child);
    parent.build();
    const childHandle = child.builtHandle;

    parent.enabled(false);
    resetCalls();
    parent.enabled(true);

    expect<bool>(hasHandleArg(CALL_SET_INTERACTIVE, childHandle, 1, 1)).toBe(true);
    expect<bool>(hasHandleArg(CALL_SET_FOCUSABLE, childHandle, 1, 1)).toBe(true);
    expect<bool>(child.isEnabled).toBe(true);
  });

  it("keeps child-owned disabled state when a parent re-enables", () => {
    resetCalls();

    const parent = new FlexBox();
    const child = new FlexBox()
      .onClick(() => {})
      .focusable(true, 1);
    parent.child(child);
    parent.build();
    const childHandle = child.builtHandle;

    child.enabled(false);
    parent.enabled(false);
    resetCalls();
    parent.enabled(true);

    expect<bool>(child.isEnabled).toBe(false);
    expect<bool>(hasHandleArg(CALL_SET_INTERACTIVE, childHandle, 1, 1)).toBe(false);
    expect<bool>(hasHandleArg(CALL_SET_FOCUSABLE, childHandle, 1, 1)).toBe(false);
  });

  it("restores inherited enabled state when removing a child from a disabled parent", () => {
    resetCalls();

    const parent = new FlexBox();
    const child = new FlexBox()
      .onClick(() => {})
      .focusable(true, 1);
    parent.child(child);
    parent.build();
    const childHandle = child.builtHandle;

    parent.enabled(false);
    resetCalls();
    parent.removeChildNode(child);

    expect<bool>(child.isEnabled).toBe(true);
    expect<bool>(hasHandleArg(CALL_SET_INTERACTIVE, childHandle, 1, 1)).toBe(true);
    expect<bool>(hasHandleArg(CALL_SET_FOCUSABLE, childHandle, 1, 1)).toBe(true);
  });
});
