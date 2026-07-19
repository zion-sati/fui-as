import {
  AlignItems,
  Column,
  ContextMenu,
  Dialog,
  Form,
  SelectionArea,
  FlexBox,
  FlexDirection,
  FlexWrap,
  GestureEventArgs,
  GestureEventKind,
  GestureEventPhase,
  Image,
  LongPressEventArgs,
  LongPressGesture,
  Node,
  ObjectFit,
  Orientation,
  PanGestureEventArgs,
  PinchGestureEventArgs,
  PopupPlacement,
  PointerClickEventArgs,
  PointerEventArgs,
  PointerEventType,
  PointerType,
  Row,
  ScrollBarVisibility,
  ScrollBox,
  ScrollState,
  ScrollView,
  Svg,
  Text,
  TextOverflow,
  Theme,
  ToolTip,
  Unit,
  VirtualList,
  WheelEventArgs,
  activeTheme,
  Bitmap,
  rgba,
  viewportHeightSignal,
  viewportWidthSignal,
} from "../../../src/Fui";
import {
  DemoButton,
  DemoButtonTone,
  DemoCheckbox,
  DemoComboBox,
  DemoDropdown,
  DemoDropdownItem,
  DemoScrollBox,
  DemoSurface,
  DemoSurfaceRecipe,
  DemoText,
  DemoTextRecipe,
  DemoNavLink,
  DemoRadioButton,
  DemoRadioGroup,
  DemoSlider,
  DemoSwitch,
  DemoTextInput,
  applyDemoContextMenuRecipe,
  applyDemoDialogRecipe,
  applyDemoScrollBarTheme,
  applyDemoScrollBoxTheme,
  applyDemoSurfaceRecipe,
  configureDemoScrollBar,
  demoAdvancedControlsRoute,
  demoHomeRoute,
  demoScrollbarGutterRoute,
  demoImmediateDrawingRoute,
  demoTemplatedControlsRoute,
} from "../design-system";
import {
  ACCENT_SWATCH_HEIGHT,
  FULL_SIZE,
  MAIN_CONTENT_STARTUP_HEIGHT,
  MIN_SIDEBAR_LIST_VIEWPORT_HEIGHT,
  NESTED_SCROLL_CONTENT_HEIGHT,
  NESTED_SCROLL_CONTENT_WIDTH,
  NESTED_SCROLL_VIEWPORT_HEIGHT,
  NESTED_SCROLL_VIEWPORT_WIDTH,
  DEMO_ROOT_PADDING,
  SIDEBAR_DESCRIPTION_BLOCK_HEIGHT,
  SIDEBAR_LIST_BOTTOM_PADDING,
  SIDEBAR_LIST_ITEM_HEIGHT,
  SIDEBAR_LIST_TOTAL_ITEMS,
  SIDEBAR_TITLE_BLOCK_HEIGHT,
  SIDEBAR_WIDTH,
  SCROLLBAR_TRACK_WIDTH,
  SPACING_LARGE,
  SPACING_MEDIUM,
  SPACING_SMALL,
  SURFACE_RADIUS_MEDIUM,
  SURFACE_RADIUS_SMALL,
} from "../design-system";

const DEMO_TEXTURE_URL = "./demo-texture.png";
const DEMO_SVG_URL = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'><path d='M64 14 24 34v28c0 25 17 43 40 52 23-9 40-27 40-52V34L64 14Zm0 16 24 12v19c0 17-9 29-24 37-15-8-24-20-24-37V42l24-12Zm-8 22h16v16h16v12H72v16H56V80H40V68h16V52Z' fill='%23000000'/></svg>";
const DEMO_SECONDARY_TEXTURE_URL = "./demo-secondary-texture.png";
const DEMO_BITMAP_SIZE: i32 = 96;

function premultiplyChannel(channel: u8, alpha: u8): u8 {
  return <u8>((<u32>channel * <u32>alpha + 127) / 255);
}

function setPremultipliedPixel(pixels: Uint8Array, width: i32, x: i32, y: i32, red: u8, green: u8, blue: u8, alpha: u8): void {
  const offset = (x + (y * width)) * 4;
  pixels[offset + 0] = premultiplyChannel(red, alpha);
  pixels[offset + 1] = premultiplyChannel(green, alpha);
  pixels[offset + 2] = premultiplyChannel(blue, alpha);
  pixels[offset + 3] = alpha;
}

function createDashboardBitmap(): Bitmap {
  const bitmap = new Bitmap(<u32>DEMO_BITMAP_SIZE, <u32>DEMO_BITMAP_SIZE);
  const pixels = bitmap.pixels();
  const center = (<f32>DEMO_BITMAP_SIZE - 1.0) * 0.5;
  const radiusSquared = 34.0 * 34.0;
  memory.fill(pixels.dataStart, 0, pixels.length);
  for (let y = 0; y < DEMO_BITMAP_SIZE; ++y) {
    for (let x = 0; x < DEMO_BITMAP_SIZE; ++x) {
      const dx = <f32>x - center;
      const dy = <f32>y - center;
      const distanceSquared = (dx * dx) + (dy * dy);
      if (distanceSquared <= radiusSquared) {
        const falloff = 1.0 - (distanceSquared / radiusSquared);
        const alpha = <u8>(64.0 + (falloff * 144.0));
        setPremultipliedPixel(pixels, DEMO_BITMAP_SIZE, x, y, 0xff, 0x40, 0x40, alpha);
      }
      if (x >= 20 && x <= 76 && y >= 20 && y <= 76) {
        const diagonal = x + y;
        if (diagonal >= 93 && diagonal <= 99) {
          setPremultipliedPixel(pixels, DEMO_BITMAP_SIZE, x, y, 0xff, 0xff, 0xff, 0xd8);
        }
      }
    }
  }
  bitmap.commit();
  return bitmap;
}

function dashboardColumnGap(): f32 {
  return viewportWidthSignal.value < 480.0 ? 12.0 : SPACING_LARGE;
}

function dashboardSidebarWidth(): f32 {
  return viewportWidthSignal.value < 480.0 ? 272.0 : SIDEBAR_WIDTH;
}

const MAIN_CONTENT_SCROLLBAR_GUTTER: f32 = 12.0;
const MAIN_CONTENT_SCROLLBAR_RAIL_RESERVE: f32 = SCROLLBAR_TRACK_WIDTH + MAIN_CONTENT_SCROLLBAR_GUTTER + 4.0;

function requireDemoListItemText(container: FlexBox, childIndex: i32): Text {
  return container.getChildAt(childIndex)! as Text;
}

function ensureDemoListItemTemplate(container: FlexBox): void {
  if (container.childCount > 0) {
    return;
  }
  const primary = new DemoText("", DemoTextRecipe.ListTitle)
    .fontSize(17.0)
    .selectable();
  const detail = new DemoText("", DemoTextRecipe.ListMeta)
    .fontSize(13.0)
    .selectable();

  container
    .flexDirection(FlexDirection.Column)
    .width(FULL_SIZE, Unit.Percent)
    .padding(12.0, 12.0, 12.0, 12.0)
    .child(primary)
    .child(new FlexBox().width(FULL_SIZE, Unit.Percent).height(6.0, Unit.Pixel))
    .child(detail);
}

function bindDemoListItem(container: FlexBox, index: i32): void {
  ensureDemoListItemTemplate(container);
  const theme = activeTheme.value;
  applyDemoSurfaceRecipe(container, theme, (index & 1) == 0 ? DemoSurfaceRecipe.ListRow : DemoSurfaceRecipe.ListRowAlt);
  const primary = requireDemoListItemText(container, 0);
  const detail = requireDemoListItemText(container, 2);
  const primaryLabel = "Item " + index.toString();
  primary.text(primaryLabel);
  detail.text("Fixed height row.");
}

function computeSidebarListViewportHeight(): f32 {
  const rootInnerHeight = viewportHeightSignal.value - (DEMO_ROOT_PADDING * 2.0);
  const sidebarInnerHeight = rootInnerHeight - 32.0;
  const reservedHeight =
    SIDEBAR_TITLE_BLOCK_HEIGHT +
    SIDEBAR_DESCRIPTION_BLOCK_HEIGHT +
    SPACING_MEDIUM +
    SIDEBAR_LIST_BOTTOM_PADDING;
  const available = sidebarInnerHeight - reservedHeight;
  return available > MIN_SIDEBAR_LIST_VIEWPORT_HEIGHT
    ? available
    : MIN_SIDEBAR_LIST_VIEWPORT_HEIGHT;
}

function computeMainContentViewportHeight(): f32 {
  const available = viewportHeightSignal.value - (DEMO_ROOT_PADDING * 2.0);
  return available > 0.0 ? available : 0.0;
}

class DashboardText extends DemoText {
  constructor(content: string = "", size: f32 = 14.0, recipe: DemoTextRecipe = DemoTextRecipe.Body, selectable: bool = true) {
    super(content, recipe, selectable);
    this.fontSize(size);
  }
}

class DashboardEventInspector extends FlexBox {
  private childHandlesWheel: bool = false;
  private parentHandlesWheel: bool = false;
  private childDisabled: bool = false;
  private childGesturePan: bool = false;
  private childGesturePinch: bool = false;
  private childGestureLongPress: bool = false;
  private fastLongPress: bool = false;
  private parentGesturePan: bool = false;
  private parentGesturePinch: bool = false;
  private parentGestureLongPress: bool = false;
  private readonly childHandledButton: DemoButton = new DemoButton("Child handled: off")
    .width(172.0, Unit.Pixel) as DemoButton;
  private readonly parentHandledButton: DemoButton = new DemoButton("Parent handled: off")
    .width(182.0, Unit.Pixel) as DemoButton;
  private readonly childDisabledButton: DemoButton = new DemoButton("Child disabled: off")
    .width(184.0, Unit.Pixel) as DemoButton;
  private readonly gesturePanButton: DemoButton = new DemoButton("Pan gesture: off")
    .width(156.0, Unit.Pixel) as DemoButton;
  private readonly gesturePinchButton: DemoButton = new DemoButton("Pinch gesture: off")
    .width(168.0, Unit.Pixel) as DemoButton;
  private readonly gestureLongPressButton: DemoButton = new DemoButton("Long press: off")
    .width(166.0, Unit.Pixel) as DemoButton;
  private readonly longPressConfigButton: DemoButton = new DemoButton("Long config: default")
    .width(206.0, Unit.Pixel) as DemoButton;
  private readonly parentGesturePanButton: DemoButton = new DemoButton("Parent pan: off")
    .width(166.0, Unit.Pixel) as DemoButton;
  private readonly parentGesturePinchButton: DemoButton = new DemoButton("Parent pinch: off")
    .width(178.0, Unit.Pixel) as DemoButton;
  private readonly parentGestureLongPressButton: DemoButton = new DemoButton("Parent long: off")
    .width(174.0, Unit.Pixel) as DemoButton;
  private readonly statusText: Text = new DashboardText("", 14.0, DemoTextRecipe.StatusValue);
  private readonly logText: Text = new DashboardText("", 13.0, DemoTextRecipe.Hint);
  private readonly childPanel: FlexBox = new DemoSurface(DemoSurfaceRecipe.CalloutInset)
    .width(FULL_SIZE, Unit.Percent)
    .height(70.0, Unit.Pixel)
    .padding(12.0, 12.0, 12.0, 12.0) as FlexBox;
  private readonly childLabel: Text = new DashboardText("", 14.0, DemoTextRecipe.StatusValue);
  private eventSerial: i32 = 0;
  private logA: string = "Wheel, click, drag, or touch the child panel";
  private logB: string = "Toggle child handled to stop bubbling";
  private logC: string = "Pointer logs include local coords and pointer metadata";
  private logD: string = "Right-click logs here, then opens context menu unless handled";
  private logE: string = "";
  private logF: string = "";

  constructor() {
    super();
    this.width(FULL_SIZE, Unit.Percent)
      .semanticLabel("Wheel event inspector");

    const title = new DashboardText("Input event inspector", 20.0, DemoTextRecipe.SectionTitle);
    const subtitle = new DashboardText("A child panel bubbles pointer, wheel, and gesture events to its parent until a handler marks e.handled.", 14.0, DemoTextRecipe.Supporting);
    const toggles = new FlexBox()
      .flexDirection(FlexDirection.Row)
      .flexWrap(FlexWrap.Wrap)
      .width(FULL_SIZE, Unit.Percent)
      .child(this.childHandledButton.margin(0.0, 6.0, 6.0, 0.0))
      .child(this.parentHandledButton.margin(0.0, 6.0, 6.0, 0.0))
      .child(this.childDisabledButton.margin(0.0, 6.0, 6.0, 0.0))
      .child(this.gesturePanButton.margin(0.0, 6.0, 6.0, 0.0))
      .child(this.gesturePinchButton.margin(0.0, 6.0, 6.0, 0.0))
      .child(this.gestureLongPressButton.margin(0.0, 6.0, 6.0, 0.0))
      .child(this.longPressConfigButton.margin(0.0, 6.0, 6.0, 0.0))
      .child(this.parentGesturePanButton.margin(0.0, 6.0, 6.0, 0.0))
      .child(this.parentGesturePinchButton.margin(0.0, 6.0, 6.0, 0.0))
      .child(this.parentGestureLongPressButton.margin(0.0, 6.0, 6.0, 0.0));

    this.statusText.height(94.0, Unit.Pixel);
    this.logText.height(148.0, Unit.Pixel);
    this.childHandledButton.onClickWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, _event): void => {
      owner.toggleChildHandled();
    });
    this.parentHandledButton.onClickWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, _event): void => {
      owner.toggleParentHandled();
    });
    this.childDisabledButton.onClickWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, _event): void => {
      owner.toggleChildDisabled();
    });
    this.gesturePanButton.onClickWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, _event): void => {
      owner.toggleGesturePan();
    });
    this.gesturePinchButton.onClickWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, _event): void => {
      owner.toggleGesturePinch();
    });
    this.gestureLongPressButton.onClickWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, _event): void => {
      owner.toggleGestureLongPress();
    });
    this.longPressConfigButton.onClickWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, _event): void => {
      owner.toggleLongPressConfig();
    });
    this.parentGesturePanButton.onClickWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, _event): void => {
      owner.toggleParentGesturePan();
    });
    this.parentGesturePinchButton.onClickWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, _event): void => {
      owner.toggleParentGesturePinch();
    });
    this.parentGestureLongPressButton.onClickWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, _event): void => {
      owner.toggleParentGestureLongPress();
    });
    this.childPanel
      .child(this.childLabel)
      .onWheelWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, event: WheelEventArgs): void => {
        owner.handleChildWheel(event);
      })
      .onPointerDownWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, event: PointerEventArgs): void => {
        owner.handleChildPointer(event);
      })
      .onPointerMoveWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, event: PointerEventArgs): void => {
        owner.handleChildPointer(event);
      })
      .onPointerUpWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, event: PointerEventArgs): void => {
        owner.handleChildPointer(event);
      })
      .onPointerCancelWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, event: PointerEventArgs): void => {
        owner.handleChildPointer(event);
      })
      .onPointerClickWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, event: PointerClickEventArgs): void => {
        owner.pushLog("child raw click count=" + event.clickCount.toString());
      })
      .onPointerDoubleClickWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, _event: PointerClickEventArgs): void => {
        owner.pushLog("child exact raw double-click");
      })
      .onPointerTripleClickWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, _event: PointerClickEventArgs): void => {
        owner.pushLog("child exact raw triple-click");
      });

    this.onWheelWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, event: WheelEventArgs): void => {
      owner.handleParentWheel(event);
    })
      .onPointerDownWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, event: PointerEventArgs): void => {
        owner.handleParentPointer(event);
      })
      .onPointerMoveWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, event: PointerEventArgs): void => {
        owner.handleParentPointer(event);
      })
      .onPointerUpWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, event: PointerEventArgs): void => {
        owner.handleParentPointer(event);
      })
      .onPointerCancelWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, event: PointerEventArgs): void => {
        owner.handleParentPointer(event);
    });

    this.child(
      Column(
        title,
        new FlexBox().height(8.0, Unit.Pixel),
        subtitle,
        new FlexBox().height(12.0, Unit.Pixel),
        toggles,
        new FlexBox().height(8.0, Unit.Pixel),
        this.statusText,
        this.childPanel,
        new FlexBox().height(10.0, Unit.Pixel),
        this.logText,
      ).width(FULL_SIZE, Unit.Percent),
    );
    this.refresh();
  }

  private toggleChildHandled(): void {
    this.childHandlesWheel = !this.childHandlesWheel;
    this.refresh();
  }

  private toggleParentHandled(): void {
    this.parentHandlesWheel = !this.parentHandlesWheel;
    this.refresh();
  }

  private toggleChildDisabled(): void {
    this.childDisabled = !this.childDisabled;
    this.childPanel.enabled(!this.childDisabled);
    this.refresh();
  }

  private toggleGesturePan(): void {
    this.childGesturePan = !this.childGesturePan;
    this.refresh();
  }

  private toggleGesturePinch(): void {
    this.childGesturePinch = !this.childGesturePinch;
    this.refresh();
  }

  private toggleGestureLongPress(): void {
    this.childGestureLongPress = !this.childGestureLongPress;
    this.refresh();
  }

  private toggleLongPressConfig(): void {
    this.fastLongPress = !this.fastLongPress;
    this.refresh();
  }

  private toggleParentGesturePan(): void {
    this.parentGesturePan = !this.parentGesturePan;
    this.refresh();
  }

  private toggleParentGesturePinch(): void {
    this.parentGesturePinch = !this.parentGesturePinch;
    this.refresh();
  }

  private toggleParentGestureLongPress(): void {
    this.parentGestureLongPress = !this.parentGestureLongPress;
    this.refresh();
  }

  private handleChildWheel(event: WheelEventArgs): void {
    this.pushLog(
      "child wheel x=" + (<i32>event.x).toString() +
      " y=" + (<i32>event.y).toString() +
      " dx=" + (<i32>event.deltaX).toString() +
      " dy=" + (<i32>event.deltaY).toString() +
      (this.childHandlesWheel ? " handled" : " unhandled"),
    );
    if (this.childHandlesWheel) {
      event.handled = true;
    }
  }

  private handleParentWheel(event: WheelEventArgs): void {
    this.pushLog(
      "parent wheel x=" + (<i32>event.x).toString() +
      " y=" + (<i32>event.y).toString() +
      " dx=" + (<i32>event.deltaX).toString() +
      " dy=" + (<i32>event.deltaY).toString() +
      (this.parentHandlesWheel ? " handled" : " unhandled"),
    );
    if (this.parentHandlesWheel) {
      event.handled = true;
    }
  }

  private handleChildPointer(event: PointerEventArgs): void {
    this.pushLog(
      "child " + this.pointerEventName(event.eventType) +
      " x=" + (<i32>event.x).toString() +
      " y=" + (<i32>event.y).toString() +
      " id=" + event.pointerId.toString() +
      " " + this.pointerTypeName(event.pointerType) +
      " b=" + event.button.toString() +
      " bs=" + event.buttons.toString() +
      " p=" + this.formatPointerFloat(event.pressure) +
      this.formatClickCount(event) +
      (this.childHandlesWheel ? " handled" : " unhandled"),
    );
    if (this.childHandlesWheel) {
      event.handled = true;
    }
  }

  private handleParentPointer(event: PointerEventArgs): void {
    this.pushLog(
      "parent " + this.pointerEventName(event.eventType) +
      " x=" + (<i32>event.x).toString() +
      " y=" + (<i32>event.y).toString() +
      " id=" + event.pointerId.toString() +
      " " + this.pointerTypeName(event.pointerType) +
      " b=" + event.button.toString() +
      " bs=" + event.buttons.toString() +
      " p=" + this.formatPointerFloat(event.pressure) +
      this.formatClickCount(event) +
      (this.parentHandlesWheel ? " handled" : " unhandled"),
    );
    if (this.parentHandlesWheel) {
      event.handled = true;
    }
  }

  private handleChildGesture(event: GestureEventArgs): void {
    this.pushLog(
      "child gesture " + this.gesturePhaseName(event.phase) +
      " " + this.gestureKindName(event) +
      " x=" + (<i32>event.x).toString() +
      " y=" + (<i32>event.y).toString() +
      " dx=" + (<i32>event.deltaX).toString() +
      " dy=" + (<i32>event.deltaY).toString() +
      " s=" + this.formatGestureScale(event.scale) +
      (this.childHandlesWheel ? " handled" : " unhandled"),
    );
    if (this.childHandlesWheel) {
      event.handled = true;
    }
  }

  private handleParentGesture(event: GestureEventArgs): void {
    this.pushLog(
      "parent gesture " + this.gesturePhaseName(event.phase) +
      " " + this.gestureKindName(event) +
      " x=" + (<i32>event.x).toString() +
      " y=" + (<i32>event.y).toString() +
      " dx=" + (<i32>event.deltaX).toString() +
      " dy=" + (<i32>event.deltaY).toString() +
      " s=" + this.formatGestureScale(event.scale) +
      (this.parentHandlesWheel ? " handled" : " unhandled"),
    );
    if (this.parentHandlesWheel) {
      event.handled = true;
    }
  }

  private handleChildLongPress(event: LongPressEventArgs): void {
    this.pushLog(
      "child long press x=" + (<i32>event.x).toString() +
      " y=" + (<i32>event.y).toString() +
      " id=" + event.pointerId.toString() +
      " " + this.pointerTypeName(event.pointerType) +
      " ms=" + event.durationMs.toString() +
      (this.childHandlesWheel ? " handled" : " unhandled"),
    );
    if (this.childHandlesWheel) {
      event.handled = true;
    }
  }

  private handleParentLongPress(event: LongPressEventArgs): void {
    this.pushLog(
      "parent long press x=" + (<i32>event.x).toString() +
      " y=" + (<i32>event.y).toString() +
      " id=" + event.pointerId.toString() +
      " " + this.pointerTypeName(event.pointerType) +
      " ms=" + event.durationMs.toString() +
      (this.parentHandlesWheel ? " handled" : " unhandled"),
    );
    if (this.parentHandlesWheel) {
      event.handled = true;
    }
  }

  private pointerEventName(eventType: PointerEventType): string {
    if (eventType === PointerEventType.Down) return "down";
    if (eventType === PointerEventType.Move) return "move";
    if (eventType === PointerEventType.Up) return "up";
    if (eventType === PointerEventType.Enter) return "enter";
    if (eventType === PointerEventType.Leave) return "leave";
    if (eventType === PointerEventType.Cancel) return "cancel";
    return "pointer";
  }

  private gesturePhaseName(phase: GestureEventPhase): string {
    if (phase === GestureEventPhase.Begin) return "begin";
    if (phase === GestureEventPhase.Update) return "update";
    if (phase === GestureEventPhase.End) return "end";
    if (phase === GestureEventPhase.Cancel) return "cancel";
    return "gesture";
  }

  private gestureKindName(event: GestureEventArgs): string {
    if (event.kind == GestureEventKind.Pan) return "pan";
    if (event.kind == GestureEventKind.Pinch) return "pinch";
    return "gesture";
  }

  private pointerTypeName(pointerType: PointerType): string {
    if (pointerType === PointerType.Mouse) return "mouse";
    if (pointerType === PointerType.Touch) return "touch";
    if (pointerType === PointerType.Pen) return "pen";
    return "unknown";
  }

  private formatPointerFloat(value: f32): string {
    return (<i32>(value * 100.0)).toString();
  }

  private formatClickCount(event: PointerEventArgs): string {
    return event.eventType === PointerEventType.Down && event.clickCount > 0
      ? " count=" + event.clickCount.toString()
      : "";
  }

  private formatGestureScale(value: f32): string {
    return (<i32>(value * 100.0)).toString();
  }

  private pushLog(line: string): void {
    this.eventSerial += 1;
    this.logF = this.logE;
    this.logE = this.logD;
    this.logD = this.logC;
    this.logC = this.logB;
    this.logB = this.logA;
    this.logA = "#" + this.eventSerial.toString() + " " + line;
    this.refresh();
  }

  private refresh(): void {
    const childState = this.childDisabled
      ? "disabled"
      : (this.childHandlesWheel ? "handles events" : "does not handle");
    const parentState = this.parentHandlesWheel ? "parent handles" : "parent observes";
    if (this.childGesturePan) {
      this.childPanel.panGestureWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, event: PanGestureEventArgs): void => {
        owner.handleChildGesture(event);
      });
    } else {
      this.childPanel.panGesture(null);
    }
    if (this.childGesturePinch) {
      this.childPanel.pinchGestureWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, event: PinchGestureEventArgs): void => {
        owner.handleChildGesture(event);
      });
    } else {
      this.childPanel.pinchGesture(null);
    }
    if (this.childGestureLongPress) {
      this.childPanel.longPressRecognizer(this.createLongPressGesture(true));
    } else {
      this.childPanel.longPressRecognizer(null);
    }
    if (this.parentGesturePan) {
      this.panGestureWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, event: PanGestureEventArgs): void => {
        owner.handleParentGesture(event);
      });
    } else {
      this.panGesture(null);
    }
    if (this.parentGesturePinch) {
      this.pinchGestureWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, event: PinchGestureEventArgs): void => {
        owner.handleParentGesture(event);
      });
    } else {
      this.pinchGesture(null);
    }
    if (this.parentGestureLongPress) {
      this.longPressRecognizer(this.createLongPressGesture(false));
    } else {
      this.longPressRecognizer(null);
    }
    this.childHandledButton.label(this.childHandlesWheel ? "Child handled: on" : "Child handled: off");
    this.parentHandledButton.label(this.parentHandlesWheel ? "Parent handled: on" : "Parent handled: off");
    this.childDisabledButton.label(this.childDisabled ? "Child disabled: on" : "Child disabled: off");
    this.gesturePanButton.label(this.childGesturePan ? "Child pan: on" : "Child pan: off");
    this.gesturePinchButton.label(this.childGesturePinch ? "Child pinch: on" : "Child pinch: off");
    this.gestureLongPressButton.label(this.childGestureLongPress ? "Child long: on" : "Child long: off");
    this.longPressConfigButton.label(this.fastLongPress ? "Long config: fast" : "Long config: default");
    this.parentGesturePanButton.label(this.parentGesturePan ? "Parent pan: on" : "Parent pan: off");
    this.parentGesturePinchButton.label(this.parentGesturePinch ? "Parent pinch: on" : "Parent pinch: off");
    this.parentGestureLongPressButton.label(this.parentGestureLongPress ? "Parent long: on" : "Parent long: off");
    this.statusText.text(
      "Child: " + childState +
      "\nParent: " + parentState +
      "\nChild rec: " + this.childGestureRecognizerName() +
      "\nParent rec: " + this.parentGestureRecognizerName() +
      "\nLong press: " + (this.fastLongPress ? "250ms / 18px" : "500ms / 10px"),
    );
    this.childLabel.text(this.childDisabled ? "Disabled child: events start at parent" : "Child wheel, pointer, and gesture zone");
    this.logText.text(this.logA + "\n" + this.logB + "\n" + this.logC + "\n" + this.logD + "\n" + this.logE + "\n" + this.logF);
  }

  private createLongPressGesture(child: bool): LongPressGesture {
    const gesture = LongPressGesture.create();
    if (this.fastLongPress) {
      gesture.minimumDuration(250).movementTolerance(18.0);
    }
    if (child) {
      gesture.onRecognizedWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, event: LongPressEventArgs): void => {
        owner.handleChildLongPress(event);
      });
    } else {
      gesture.onRecognizedWith<DashboardEventInspector>(this, (owner: DashboardEventInspector, event: LongPressEventArgs): void => {
        owner.handleParentLongPress(event);
      });
    }
    return gesture;
  }

  private childGestureRecognizerName(): string {
    return this.gestureRecognizerName(this.childGesturePan, this.childGesturePinch, this.childGestureLongPress);
  }

  private parentGestureRecognizerName(): string {
    return this.gestureRecognizerName(this.parentGesturePan, this.parentGesturePinch, this.parentGestureLongPress);
  }

  private gestureRecognizerName(pan: bool, pinch: bool, longPress: bool): string {
    if (pan && pinch && longPress) return "pan + pinch + long";
    if (pan && pinch) return "pan + pinch";
    if (pan && longPress) return "pan + long";
    if (pinch && longPress) return "pinch + long";
    if (pan) return "pan";
    if (pinch) return "pinch";
    if (longPress) return "long press";
    return "none";
  }

}

function createDashboardMainContentScrollState(): ScrollState {
  const state = new ScrollState();
  state.viewportHeight.value = computeMainContentViewportHeight();
  state.contentHeight.value = MAIN_CONTENT_STARTUP_HEIGHT;
  return state;
}

export class DashboardView {
  readonly sidebarList: VirtualList = new VirtualList(
    SIDEBAR_LIST_TOTAL_ITEMS,
    SIDEBAR_LIST_ITEM_HEIGHT,
  )
    .onBindItem(bindDemoListItem)
    .nodeId("demo-dashboard:sidebar-list")
    .width(FULL_SIZE, Unit.Percent)
    .height(computeSidebarListViewportHeight(), Unit.Pixel) as VirtualList;
  readonly counterButton: DemoButton = new DemoButton("Click me", DemoButtonTone.Primary)
    .width(196.0, Unit.Pixel) as DemoButton;
  readonly dialogButton: DemoButton = new DemoButton("Open dialog")
    .width(196.0, Unit.Pixel) as DemoButton;
  readonly toolTipSampleButton: DemoButton = new DemoButton("Tooltip sample")
    .width(196.0, Unit.Pixel)
    .toolTip(
      ToolTip.text(
        "Shared retained tooltip host.\nHover or focus here to test delayed open.\nPress Escape to leave keyboard tab mode.",
      )
        .initialShowDelay(250)
        .betweenShowDelay(75)
        .showDuration(0)
        .placement(PopupPlacement.Bottom),
    ) as DemoButton;
  readonly foundationsToggleButton: DemoButton = new DemoButton("Disable scoped child")
    .width(220.0, Unit.Pixel) as DemoButton;
  readonly foundationsScopedButton: DemoButton = new DemoButton("Scoped child action", DemoButtonTone.Primary)
    .width(220.0, Unit.Pixel) as DemoButton;
  readonly contextMenu: ContextMenu = new ContextMenu()
    .menuWidth(236.0)
    .itemHeight(40.0)
    .itemPadding(14.0, 10.0, 14.0, 10.0)
    .panelCornerRadius(SURFACE_RADIUS_SMALL)
    .itemCornerRadius(14.0) as ContextMenu;
  readonly dialogUsernameInput: DemoTextInput = new DemoTextInput()
    .semanticLabel("Username")
    .placeholder("Username or email")
    .hostAutofill("username")
    .width(100.0, Unit.Percent)
    .nodeId("username") as DemoTextInput;
  readonly dialogPasswordInput: DemoTextInput = new DemoTextInput()
    .semanticLabel("Password")
    .placeholder("Password")
    .password()
    .hostAutofill("current-password")
    .width(100.0, Unit.Percent)
    .nodeId("dialog-current-password") as DemoTextInput;
  readonly dialogCredentialsContent: Form = (new Form())
    .child(Column(
      new DashboardText("Username", 14.0, DemoTextRecipe.Hint),
      this.verticalSpacer(6.0),
      this.dialogUsernameInput,
      this.verticalSpacer(12.0),
      new DashboardText("Password", 14.0, DemoTextRecipe.Hint),
      this.verticalSpacer(6.0),
      this.dialogPasswordInput,
    )
      .width(100.0, Unit.Percent) as FlexBox) as Form;
  readonly dialog: Dialog = new Dialog(
    "Confirm action",
    "Press Enter to accept, Escape to cancel, or click the backdrop to dismiss this dialog.",
  )
    .bodyContent(this.dialogCredentialsContent)
    .onShownWith(this, (view, _event): void => {
      view.dialogUsernameInput.focusNow();
    })
    .backdropColor(0x00000024)
    .backgroundBlur(10.0)
    .cardCornerRadius(SURFACE_RADIUS_MEDIUM)
    .cardShadow(rgba(0, 0, 0, 0x90), 0.0, 0.0, 15.0, 15.0) as Dialog;
  readonly root: SelectionArea = new SelectionArea()
    .width(viewportWidthSignal.value, Unit.Pixel)
    .height(viewportHeightSignal.value, Unit.Pixel)
    .padding(DEMO_ROOT_PADDING, DEMO_ROOT_PADDING, DEMO_ROOT_PADDING, DEMO_ROOT_PADDING) as SelectionArea;
  readonly headerStatusText: Text = new DashboardText("", 15.0, DemoTextRecipe.Hint);
  readonly selectionStatusText: Text = new DashboardText("", 14.0, DemoTextRecipe.StatusSupporting)
    .maxLines(1)
    .overflow(TextOverflow.Ellipsis) as Text;
  readonly accentSwatch: FlexBox = new FlexBox()
    .width(FULL_SIZE, Unit.Percent)
    .height(ACCENT_SWATCH_HEIGHT, Unit.Pixel) as FlexBox;
  readonly viewportText: Text = new DashboardText("", 15.0);
  readonly clickCountText: Text = new DashboardText("", 17.0);
  readonly pointerStatusText: Text = new DashboardText("", 15.0);
  readonly keyTargetText: Text = new DashboardText("", 14.0, DemoTextRecipe.StatusValue, false);
  readonly focusStatusText: Text = new DashboardText("", 14.0, DemoTextRecipe.StatusValue);
  readonly toolTipSampleHintText: Text = new DashboardText("Hover or Tab onto the tooltip sample to inspect the shared retained tooltip host.", 14.0, DemoTextRecipe.Hint);
  readonly demoScopeBadgeText: Text = new DashboardText("Dashboard sample", 13.0, DemoTextRecipe.InverseLabel);
  readonly demoScopeBadge: FlexBox = new FlexBox()
    .child(this.demoScopeBadgeText)
    .padding(12.0, 6.0, 12.0, 6.0)
    .cornerRadius(999.0) as FlexBox;
  readonly demoScopeHeadingText: Text = new DashboardText("SDK samples are routed", 22.0, DemoTextRecipe.SectionTitle);
  readonly demoScopeDescriptionText: Text = new DashboardText("This page is the dashboard route in the sample shell, and both Advanced controls and Templated controls open on their own routed pages.", 15.0, DemoTextRecipe.Supporting);
  readonly demoScopeSummaryText: Text = new DashboardText("Use the NavLinks below to jump between the three demo MFEs without leaving the shared runtime shell.", 14.0, DemoTextRecipe.Hint);
  readonly advancedControlsLink: DemoNavLink = new DemoNavLink(demoAdvancedControlsRoute(), "Advanced controls") as DemoNavLink;
  readonly templatedControlsLink: DemoNavLink = new DemoNavLink(demoTemplatedControlsRoute(), "Templated controls") as DemoNavLink;
  readonly scrollbarGutterLink: DemoNavLink = new DemoNavLink(demoScrollbarGutterRoute(), "Scrollbar gutter bug") as DemoNavLink;
  readonly immediateDrawingLink: DemoNavLink = new DemoNavLink(demoImmediateDrawingRoute(), "Immediate-mode drawing") as DemoNavLink;
  readonly demoScopeNavRow: FlexBox = Row(
    this.advancedControlsLink,
    this.horizontalSpacer(10.0),
    this.templatedControlsLink,
    this.horizontalSpacer(10.0),
    this.scrollbarGutterLink,
    this.horizontalSpacer(10.0),
    this.immediateDrawingLink,
  ).width(FULL_SIZE, Unit.Percent) as FlexBox;
  readonly demoScopeCard: FlexBox = new DemoSurface(DemoSurfaceRecipe.SectionPanel)
    .padding(16.0, 16.0, 16.0, 16.0)
    .child(
      Column(
        this.demoScopeBadge,
        this.verticalSpacer(10.0),
        this.demoScopeHeadingText,
        this.verticalSpacer(8.0),
        this.demoScopeDescriptionText,
        this.verticalSpacer(10.0),
        this.demoScopeSummaryText,
        this.verticalSpacer(12.0),
        this.demoScopeNavRow,
      ).width(FULL_SIZE, Unit.Percent),
    ) as FlexBox;
  readonly keyTargetBox: FlexBox = new FlexBox()
    .width(280.0, Unit.Pixel)
    .padding(12.0, 10.0, 12.0, 10.0)
    .child(this.keyTargetText)
    .nodeId("demo-key-target")
    .focusable(true) as FlexBox;
  readonly clockText: Text = new DashboardText("", 16.0, DemoTextRecipe.StatusValue);
  readonly listOffsetText: Text = new DashboardText("", 16.0, DemoTextRecipe.StatusValue);
  readonly firstVisibleText: Text = new DashboardText("", 16.0, DemoTextRecipe.StatusValue);
  readonly renderedCountText: Text = new DashboardText("", 16.0, DemoTextRecipe.StatusValue);
  readonly dialogStatusText: Text = new DashboardText("", 15.0, DemoTextRecipe.StatusValue);
  readonly mainPanel: FlexBox = new FlexBox()
    .flexDirection(FlexDirection.Column)
    .height(FULL_SIZE, Unit.Percent) as FlexBox;
  readonly mainHeaderPanel: FlexBox = new DemoSurface(DemoSurfaceRecipe.SectionPanel)
    .padding(18.0, 16.0, 18.0, 16.0) as FlexBox;
  readonly mainHeaderContent: FlexBox = new FlexBox()
    .width(FULL_SIZE, Unit.Percent) as FlexBox;
  readonly inspectorDivider: FlexBox = new FlexBox()
    .width(FULL_SIZE, Unit.Percent)
    .height(2.0, Unit.Pixel) as FlexBox;
  readonly sidebarHeadingText: Text = new DashboardText("Scrollable list", 22.0, DemoTextRecipe.SectionTitle);
  readonly sidebarDescriptionText: Text = new DashboardText("This pooled retained list rebinds rows in place so scrolling stays stable while item content changes.", 14.0, DemoTextRecipe.Hint);
  readonly sidebarShell: FlexBox = new DemoSurface(DemoSurfaceRecipe.SectionPanel)
    .width(dashboardSidebarWidth(), Unit.Pixel)
    .height(FULL_SIZE, Unit.Percent)
    .padding(16.0, 16.0, 16.0, 16.0)
    .child(
      Column(
        this.sidebarHeadingText,
        this.verticalSpacer(8.0),
        this.sidebarDescriptionText,
        this.verticalSpacer(SPACING_MEDIUM),
        this.sidebarList,
        this.verticalSpacer(SIDEBAR_LIST_BOTTOM_PADDING),
      )
        .width(FULL_SIZE, Unit.Percent)
        .height(FULL_SIZE, Unit.Percent),
    ) as FlexBox;
  readonly previewHeadingText: Text = new DashboardText("Interactive color preview", 24.0, DemoTextRecipe.SectionTitle);
  readonly previewDescriptionText: Text = new DashboardText("The hue slider drives a single accent plate so the preview reads as one deliberate color target instead of nested boxes.", 15.0, DemoTextRecipe.Supporting);
  readonly previewFooterText: Text = new DashboardText("Resize the browser or drag the slider to explore layout, derived state, and resize handling together.", 15.0, DemoTextRecipe.Hint);
  readonly foundationsHeadingText: Text = new DashboardText("Control foundations", 20.0, DemoTextRecipe.SectionTitle);
  readonly foundationsDescriptionText: Text = new DashboardText("Tab onto these buttons to see the focus ring. Use the outer toggle to disable the parent scope and watch the child button dim and stop activating.", 14.0, DemoTextRecipe.Supporting);
  readonly foundationsStatusText: Text = new DashboardText("", 14.0, DemoTextRecipe.StatusValue);
  readonly foundationsScopedHintText: Text = new DashboardText("This child button inherits enabled/disabled from its parent scope.", 14.0, DemoTextRecipe.Hint);
  readonly foundationsFocusText: Text = new DashboardText("", 14.0, DemoTextRecipe.StatusValue);
  readonly foundationsScopedActionText: Text = new DashboardText("", 14.0, DemoTextRecipe.StatusValue);
  readonly foundationsScopeBox: FlexBox = new DemoSurface(DemoSurfaceRecipe.InsetPanel)
    .width(FULL_SIZE, Unit.Percent)
    .padding(14.0, 14.0, 14.0, 14.0) as FlexBox;
  readonly foundationsCard: FlexBox = new DemoSurface(DemoSurfaceRecipe.SectionPanel)
    .padding(16.0, 16.0, 16.0, 16.0)
    .child(
      Column(
        this.foundationsHeadingText,
        this.verticalSpacer(8.0),
        this.foundationsDescriptionText,
        this.verticalSpacer(12.0),
        this.foundationsStatusText,
        this.verticalSpacer(12.0),
        this.foundationsToggleButton,
        this.verticalSpacer(10.0),
        this.foundationsScopeBox.child(
          Column(
            this.foundationsScopedHintText,
            this.verticalSpacer(10.0),
            this.foundationsScopedButton,
            this.verticalSpacer(8.0),
            this.foundationsFocusText,
            this.verticalSpacer(8.0),
            this.foundationsScopedActionText,
          )
            .width(FULL_SIZE, Unit.Percent),
        ),
      )
        .width(FULL_SIZE, Unit.Percent),
    ) as FlexBox;
  readonly commonControlsHeadingText: Text = new DashboardText("Common controls", 20.0, DemoTextRecipe.SectionTitle);
  readonly commonControlsDescriptionText: Text = new DashboardText("Checkbox, switch, radio, slider, dropdown, combobox, and text input samples all sit on the same retained semantic and focus foundation.", 14.0, DemoTextRecipe.Supporting);
  readonly commonToggleStatusText: Text = new DashboardText("", 14.0, DemoTextRecipe.StatusValue);
  readonly commonRadioStatusText: Text = new DashboardText("", 14.0, DemoTextRecipe.StatusValue);
  readonly commonSliderStatusText: Text = new DashboardText("", 14.0, DemoTextRecipe.StatusValue);
  readonly commonDropdownStatusText: Text = new DashboardText("", 14.0, DemoTextRecipe.StatusValue);
  readonly commonComboBoxStatusText: Text = new DashboardText("", 14.0, DemoTextRecipe.StatusValue);
  readonly commonTextInputStatusText: Text = new DashboardText("", 14.0, DemoTextRecipe.StatusValue);
  readonly mediaHeadingText: Text = new DashboardText("Media assets", 20.0, DemoTextRecipe.SectionTitle);
  readonly mediaDescriptionText: Text = new DashboardText("Compare texture-backed images with SVG-backed assets and an app-owned premultiplied RGBA bitmap upload.", 14.0, DemoTextRecipe.Supporting);
  readonly mediaTextureCaptionText: Text = new DashboardText("Texture-backed image", 14.0, DemoTextRecipe.StatusValue);
  readonly mediaSvgCaptionText: Text = new DashboardText("SVG-backed icon", 14.0, DemoTextRecipe.StatusValue);
  readonly mediaSecondaryTextureCaptionText: Text = new DashboardText("Second texture-backed image", 14.0, DemoTextRecipe.StatusValue);
  readonly mediaBitmapCaptionText: Text = new DashboardText("Custom drawn bitmap", 14.0, DemoTextRecipe.StatusValue);
  readonly mediaTextureFrame: FlexBox = new DemoSurface(DemoSurfaceRecipe.InsetPanel)
    .width(0.0, Unit.Auto)
    .padding(24.0, 24.0, 24.0, 24.0) as FlexBox;
  readonly mediaSvgFrame: FlexBox = new DemoSurface(DemoSurfaceRecipe.InsetPanel)
    .width(0.0, Unit.Auto)
    .padding(24.0, 24.0, 24.0, 24.0) as FlexBox;
  readonly mediaSecondaryTextureFrame: FlexBox = new DemoSurface(DemoSurfaceRecipe.FlatFrame)
    .width(0.0, Unit.Auto)
    .padding(24.0, 24.0, 24.0, 28.0) as FlexBox;
  readonly mediaBitmapFrame: FlexBox = new DemoSurface(DemoSurfaceRecipe.FlatFrame)
    .width(216.0, Unit.Pixel)
    .height(195.0, Unit.Pixel) as FlexBox;
  readonly mediaBitmap: Bitmap = createDashboardBitmap();
  readonly mediaTextureImage: Image = Image.load(DEMO_TEXTURE_URL, ObjectFit.Cover)
    .altText("Bridge loaded texture sample")
    .width(16.0, Unit.Pixel)
    .height(16.0, Unit.Pixel)
    .cornerRadius(SURFACE_RADIUS_SMALL) as Image;
  readonly mediaSvgImage: Svg = Svg.load(DEMO_SVG_URL)
    .altText("Bridge loaded SVG sample")
    .width(16.0, Unit.Pixel)
    .height(16.0, Unit.Pixel)
    .cornerRadius(SURFACE_RADIUS_SMALL) as Svg;
  readonly mediaSecondaryTextureImage: Image = Image.load(DEMO_SECONDARY_TEXTURE_URL, ObjectFit.Cover)
    .altText("Bridge loaded secondary texture sample")
    .width(16.0, Unit.Pixel)
    .height(16.0, Unit.Pixel)
    .cornerRadius(SURFACE_RADIUS_SMALL) as Image;
  readonly mediaBitmapImage: Image = new Image(this.mediaBitmap.textureId, ObjectFit.Contain)
    .altText("App-owned premultiplied RGBA bitmap sample")
    .width(<f32>DEMO_BITMAP_SIZE, Unit.Pixel)
    .height(<f32>DEMO_BITMAP_SIZE, Unit.Pixel)
    .cornerRadius(SURFACE_RADIUS_SMALL) as Image;
  readonly nestedScrollHeadingText: Text = new DashboardText("Nested scroll sandbox", 20.0, DemoTextRecipe.SectionTitle);
  readonly nestedScrollDescriptionText: Text = new DashboardText("A fixed inner viewport overflows in both directions so you can test nested wheel and touch scrolling without the outer page taking over.", 14.0, DemoTextRecipe.Supporting);
  readonly nestedScrollOriginText: Text = new DashboardText("Nested origin marker", 16.0, DemoTextRecipe.StatusValue);
  readonly nestedScrollMiddleText: Text = new DashboardText("Long horizontal note: diagonal wheel and touch gestures should keep this inner viewport moving on both axes while the outer dashboard stays put.", 16.0, DemoTextRecipe.Hint);
  readonly nestedScrollFarText: Text = new DashboardText("Nested far marker", 16.0, DemoTextRecipe.StatusValue);
  readonly nestedScrollContent: FlexBox = new DemoSurface(DemoSurfaceRecipe.CalloutInset)
    .width(NESTED_SCROLL_CONTENT_WIDTH, Unit.Pixel)
    .height(NESTED_SCROLL_CONTENT_HEIGHT, Unit.Pixel)
    .padding(16.0, 16.0, 16.0, 16.0)
    .child(
      Column(
        this.nestedScrollOriginText,
        this.verticalSpacer(72.0),
        this.nestedScrollMiddleText,
        this.verticalSpacer(116.0),
        this.nestedScrollFarText,
      ).width(FULL_SIZE, Unit.Percent),
    ) as FlexBox;
  readonly nestedScrollBox: ScrollBox = new DemoScrollBox()
    .scrollEnabledX(true)
    .scrollEnabledY(true)
    .horizontalScrollbarVisibility(ScrollBarVisibility.Always)
    .verticalScrollbarVisibility(ScrollBarVisibility.Always)
    .scrollbarGutter(8.0)
    .width(NESTED_SCROLL_VIEWPORT_WIDTH, Unit.Pixel)
    .height(NESTED_SCROLL_VIEWPORT_HEIGHT, Unit.Pixel)
    .child(this.nestedScrollContent) as ScrollBox;
  readonly nestedScrollViewportFrame: FlexBox = new DemoSurface(DemoSurfaceRecipe.InsetPanel)
    .width(NESTED_SCROLL_VIEWPORT_WIDTH + 8.0, Unit.Pixel)
    .padding(4.0, 4.0, 4.0, 4.0)
    .child(this.nestedScrollBox) as FlexBox;
  readonly nestedScrollCard: FlexBox = new DemoSurface(DemoSurfaceRecipe.SectionPanel)
    .padding(16.0, 16.0, 16.0, 16.0)
    .child(
      Column(
        this.nestedScrollHeadingText,
        this.verticalSpacer(8.0),
        this.nestedScrollDescriptionText,
        this.verticalSpacer(12.0),
        this.nestedScrollViewportFrame,
      ).width(FULL_SIZE, Unit.Percent),
    ) as FlexBox;
  readonly eventInspectorCard: DashboardEventInspector = new DashboardEventInspector();
  readonly commonCheckbox: DemoCheckbox = new DemoCheckbox("Email updates", true)
    .nodeId("demo-dashboard:email-updates-checkbox") as DemoCheckbox;
  readonly commonTriStateCheckbox: DemoCheckbox = new DemoCheckbox("Review state", true)
    .triState(true)
    .mixed(true)
    .nodeId("demo-dashboard:review-state-checkbox") as DemoCheckbox;
  readonly commonSwitch: DemoSwitch = new DemoSwitch("Focus mode", true)
    .check(true)
    .nodeId("demo-dashboard:focus-mode-switch")
    as DemoSwitch;
  readonly commonRadioGroup: DemoRadioGroup = new DemoRadioGroup(true)
    .addOptions([
      new DemoRadioButton("system", "System", true),
      new DemoRadioButton("compact", "Compact", true),
      new DemoRadioButton("immersive", "Immersive", true),
    ])
    .selectIndex(0)
    .nodeId("demo-dashboard:mode-radio-group") as DemoRadioGroup;
  readonly commonHorizontalSlider: DemoSlider = new DemoSlider(40.0)
    .min(0.0)
    .max(100.0)
    .step(5.0)
    .length(220.0)
    .nodeId("demo-dashboard:horizontal-slider") as DemoSlider;
  readonly commonVerticalSlider: DemoSlider = new DemoSlider(60.0)
    .min(0.0)
    .max(100.0)
    .step(10.0)
    .orientation(Orientation.Vertical)
    .length(140.0)
    .nodeId("demo-dashboard:vertical-slider") as DemoSlider;
  readonly commonDropdown: DemoDropdown = new DemoDropdown()
    .items([
      new DemoDropdownItem("balanced", "Balanced"),
      new DemoDropdownItem("quality", "Quality first"),
      new DemoDropdownItem("speed", "Speed first"),
    ])
    .selectIndex(0)
    .width(220.0, Unit.Pixel)
    .nodeId("demo-dashboard:render-mode-dropdown") as DemoDropdown;
  readonly commonComboBox: DemoComboBox = new DemoComboBox()
    .placeholder("Search city")
    .items([
      "Melbourne",
      "Sydney",
      "Singapore",
      "San Francisco",
      "Seattle",
      "Tokyo",
      "Osaka",
      "London",
      "Paris",
      "Berlin",
      "Toronto",
      "Vancouver",
      "Auckland",
      "Wellington",
      "Hong Kong",
      "Bangkok",
      "Seoul",
      "Taipei",
      "New York",
      "Chicago",
    ])
    .selectIndex(0)
    .width(220.0, Unit.Pixel)
    .nodeId("demo-dashboard:city-combobox") as DemoComboBox;
  readonly commonTextInput: DemoTextInput = new DemoTextInput()
    .placeholder("Type here")
    .maxChars(32)
    .hostAutofill("username")
    .width(220.0, Unit.Pixel)
    .nodeId("demo-dashboard:text-input") as DemoTextInput;
  readonly commonPasswordInput: DemoTextInput = new DemoTextInput("super-secret")
    .password()
    .hostAutofill("current-password")
    .width(220.0, Unit.Pixel)
    .nodeId("current-password") as DemoTextInput;
  readonly commonReadOnlyInput: DemoTextInput = new DemoTextInput("Read-only selection sample")
    .readOnly()
    .width(220.0, Unit.Pixel) as DemoTextInput;
  readonly commonControlsCard: FlexBox = new DemoSurface(DemoSurfaceRecipe.SectionPanel)
    .padding(16.0, 16.0, 16.0, 16.0)
    .child(
      Column(
        this.commonControlsHeadingText,
        this.verticalSpacer(8.0),
        this.commonControlsDescriptionText,
        this.verticalSpacer(12.0),
        this.commonCheckbox,
        this.verticalSpacer(8.0),
        this.commonTriStateCheckbox,
        this.verticalSpacer(8.0),
        this.commonSwitch,
        this.verticalSpacer(12.0),
        this.commonRadioGroup.width(FULL_SIZE, Unit.Percent),
        this.verticalSpacer(12.0),
        Row(
          this.commonHorizontalSlider,
          this.horizontalSpacer(18.0),
          this.commonVerticalSlider,
        ).alignItems(AlignItems.Center),
        this.verticalSpacer(12.0),
        this.commonDropdown,
        this.verticalSpacer(12.0),
        this.commonComboBox,
        this.verticalSpacer(12.0),
        this.commonTextInput,
        this.verticalSpacer(8.0),
        this.commonPasswordInput,
        this.verticalSpacer(8.0),
        this.commonReadOnlyInput,
        this.verticalSpacer(12.0),
        this.commonTextInputStatusText,
        this.verticalSpacer(6.0),
        this.commonToggleStatusText,
        this.verticalSpacer(6.0),
        this.commonRadioStatusText,
        this.verticalSpacer(6.0),
        this.commonSliderStatusText,
        this.verticalSpacer(6.0),
        this.commonDropdownStatusText,
        this.verticalSpacer(6.0),
        this.commonComboBoxStatusText,
      ).width(FULL_SIZE, Unit.Percent),
    ) as FlexBox;
  readonly mediaCard: FlexBox = new DemoSurface(DemoSurfaceRecipe.SectionPanel)
    .padding(16.0, 16.0, 16.0, 24.0)
    .child(
      Column(
        this.mediaHeadingText,
        this.verticalSpacer(8.0),
        this.mediaDescriptionText,
        this.verticalSpacer(12.0),
        Row(
          this.mediaTextureFrame
            .child(Column(this.mediaTextureImage, this.verticalSpacer(8.0), this.mediaTextureCaptionText)),
          this.horizontalSpacer(12.0),
          this.mediaSvgFrame
            .child(Column(this.mediaSvgImage, this.verticalSpacer(8.0), this.mediaSvgCaptionText)),
        ).width(FULL_SIZE, Unit.Percent),
        this.verticalSpacer(12.0),
        Row(
          this.mediaSecondaryTextureFrame
            .child(Column(this.mediaSecondaryTextureImage, this.verticalSpacer(8.0), this.mediaSecondaryTextureCaptionText)),
          this.horizontalSpacer(12.0),
          this.mediaBitmapFrame
            .child(Column(this.mediaBitmapImage, this.verticalSpacer(8.0), this.mediaBitmapCaptionText)),
        ).width(FULL_SIZE, Unit.Percent),
      ).width(FULL_SIZE, Unit.Percent),
    ) as FlexBox;
  readonly previewPanel: FlexBox = new DemoSurface(DemoSurfaceRecipe.SectionPanel)
    .padding(20.0, 20.0, 20.0, 20.0)
    .child(
      Column(
        this.previewHeadingText,
        this.verticalSpacer(12.0),
        this.previewDescriptionText,
        this.verticalSpacer(12.0),
        this.accentSwatch,
        this.verticalSpacer(4.0),
        this.viewportText,
        this.verticalSpacer(4.0),
        this.clickCountText,
        this.verticalSpacer(4.0),
        this.pointerStatusText,
        this.verticalSpacer(12.0),
        this.counterButton,
        this.verticalSpacer(6.0),
        this.dialogButton,
        this.verticalSpacer(6.0),
        this.toolTipSampleButton,
        this.verticalSpacer(6.0),
        this.toolTipSampleHintText,
        this.verticalSpacer(6.0),
        this.dialogStatusText,
        this.verticalSpacer(8.0),
        this.foundationsCard,
        this.verticalSpacer(8.0),
        this.commonControlsCard,
        this.verticalSpacer(8.0),
        this.mediaCard,
        this.verticalSpacer(8.0),
        this.nestedScrollCard,
        this.verticalSpacer(6.0),
        this.keyTargetBox,
        this.verticalSpacer(6.0),
        this.focusStatusText,
        this.verticalSpacer(6.0),
        this.previewFooterText,
      )
        .width(FULL_SIZE, Unit.Percent),
    ) as FlexBox;
  readonly inspectorHeadingText: Text = new DashboardText("Inspector", 24.0, DemoTextRecipe.SectionTitle);
  readonly inspectorLinkText: Text = new DashboardText("Open " + demoHomeRoute() + " for the dashboard sample, " + demoAdvancedControlsRoute() + " for Advanced controls, or " + demoTemplatedControlsRoute() + " for the templated-controls showcase.", 15.0, DemoTextRecipe.Supporting);
  readonly inspectorDescriptionText: Text = new DashboardText("This page favors predictable FlexBox, Row, and Column sizing so you can inspect layout behavior while Grid and additional ScrollView scenarios continue to expand.", 15.0, DemoTextRecipe.Hint);
  readonly inspectorPanel: FlexBox = new DemoSurface(DemoSurfaceRecipe.SectionPanel)
    .padding(20.0, 20.0, 20.0, 20.0)
    .child(
      Column(
        this.inspectorHeadingText,
        this.verticalSpacer(SPACING_MEDIUM),
        this.clockText,
        this.verticalSpacer(SPACING_SMALL),
        this.listOffsetText,
        this.verticalSpacer(SPACING_SMALL),
        this.firstVisibleText,
        this.verticalSpacer(SPACING_SMALL),
        this.renderedCountText,
        this.verticalSpacer(SPACING_SMALL),
        this.inspectorLinkText,
        this.verticalSpacer(SPACING_MEDIUM),
        this.inspectorDivider,
        this.verticalSpacer(SPACING_MEDIUM),
        this.inspectorDescriptionText,
        this.verticalSpacer(SPACING_MEDIUM),
        this.eventInspectorCard,
      ).width(FULL_SIZE, Unit.Percent),
    ) as FlexBox;
  readonly mainHeadingText: Text = new DashboardText("EffinDom FUI-AS Demo", 30.0, DemoTextRecipe.PageTitle);
  readonly mainDescriptionText: Text = new DashboardText("Explore layout, scrolling, state, media, and input behavior in one retained scene.", 16.0, DemoTextRecipe.Supporting);
  readonly dashboardScrollState: ScrollState = new ScrollState();
  readonly dashboardContentRow: FlexBox = new FlexBox()
    .flexDirection(FlexDirection.Row)
    .height(FULL_SIZE, Unit.Percent) as FlexBox;
  readonly dashboardGapSpacer: FlexBox = this.horizontalSpacer(dashboardColumnGap());
  readonly dashboardScrollBox: ScrollBox = new DemoScrollBox(this.dashboardScrollState)
    .scrollEnabledX(true)
    .scrollEnabledY(false)
    .nodeId("demo-dashboard-shell-scroll")
    .width(FULL_SIZE, Unit.Percent)
    .height(FULL_SIZE, Unit.Percent)
    .child(this.dashboardContentRow) as ScrollBox;
  readonly mainContentScrollState: ScrollState = createDashboardMainContentScrollState();
  readonly mainContentScrollBox: ScrollBox = new DemoScrollBox(this.mainContentScrollState)
    .scrollEnabledX(true)
    .scrollEnabledY(true)
    .verticalScrollbarVisibility(ScrollBarVisibility.Always)
    .nodeId("demo-dashboard-main-scroll")
    .scrollbarGutter(MAIN_CONTENT_SCROLLBAR_GUTTER) as ScrollBox;
  mainContentViewport: ScrollView | null = null;
  mainContentColumn: FlexBox | null = null;

  constructor() {
    configureDemoScrollBar(this.sidebarList.scrollBox.verticalScrollBar);

    this.configureMainPanel();
    const columnGap = dashboardColumnGap();
    this.dashboardContentRow
      .width(dashboardSidebarWidth() + columnGap + this.mainColumnWidth(), Unit.Pixel)
      .children([
        this.sidebarShell,
        this.dashboardGapSpacer.width(columnGap, Unit.Pixel),
        this.mainPanel,
      ]);
    this.root
      .width(viewportWidthSignal.value, Unit.Pixel)
      .height(viewportHeightSignal.value, Unit.Pixel)
      .padding(DEMO_ROOT_PADDING, DEMO_ROOT_PADDING, DEMO_ROOT_PADDING, DEMO_ROOT_PADDING)
      .child(this.dashboardScrollBox)
      .child(this.dialog)
      .child(this.contextMenu);
  }

  getRoot(): SelectionArea {
    return this.root;
  }

  applyTheme(theme: Theme): void {
    const panelColor = theme.colors.background;
    this.root.bgColor(panelColor);
    applyDemoSurfaceRecipe(this.accentSwatch, theme, DemoSurfaceRecipe.AccentSwatch);
    applyDemoSurfaceRecipe(this.inspectorDivider, theme, DemoSurfaceRecipe.Divider);
    applyDemoSurfaceRecipe(this.keyTargetBox, theme, DemoSurfaceRecipe.KeyTargetIdle);
    this.mediaSvgImage.tint(theme.colors.accent);
    applyDemoSurfaceRecipe(this.demoScopeBadge, theme, DemoSurfaceRecipe.AccentBadge);
    applyDemoScrollBarTheme(this.sidebarList.scrollBox.verticalScrollBar, theme, panelColor);
    applyDemoScrollBoxTheme(this.mainContentScrollBox, theme, panelColor);
    applyDemoScrollBoxTheme(this.nestedScrollBox, theme, panelColor);
    applyDemoScrollBoxTheme(this.dashboardScrollBox, theme, panelColor);
    applyDemoContextMenuRecipe(this.contextMenu, theme);
    applyDemoDialogRecipe(this.dialog, theme);
    this.sidebarList.updateItemCount(this.sidebarList.totalItems);
  }

  dispose(): void {
    this.mediaBitmap.dispose();
    this.sidebarList.dispose();
    this.mainContentScrollBox.dispose();
    this.dashboardScrollBox.dispose();
    this.counterButton.dispose();
    this.dialogButton.dispose();
    this.toolTipSampleButton.dispose();
    this.foundationsToggleButton.dispose();
    this.foundationsScopedButton.dispose();
    this.dialog.dispose();
  }

  mainColumnWidth(): f32 {
    const available = viewportWidthSignal.value - (DEMO_ROOT_PADDING * 2.0) - dashboardSidebarWidth() - dashboardColumnGap();
    return available > 320.0 ? available : 320.0;
  }

  mainContentScrollBoxWidth(): f32 {
    const available = this.mainColumnWidth() - MAIN_CONTENT_SCROLLBAR_RAIL_RESERVE;
    return available > 0.0 ? available : this.mainColumnWidth();
  }

  sidebarListViewportHeight(): f32 {
    return computeSidebarListViewportHeight();
  }

  syncViewportLayout(): void {
    const columnGap = dashboardColumnGap();
    this.root.width(viewportWidthSignal.value, Unit.Pixel);
    this.root.height(viewportHeightSignal.value, Unit.Pixel);
    this.sidebarShell.width(dashboardSidebarWidth(), Unit.Pixel);
    this.mainPanel.width(this.mainColumnWidth(), Unit.Pixel);
    this.mainContentScrollBox.width(this.mainContentScrollBoxWidth(), Unit.Pixel);
    this.dashboardContentRow.width(dashboardSidebarWidth() + columnGap + this.mainColumnWidth(), Unit.Pixel);
    this.dashboardGapSpacer.width(columnGap, Unit.Pixel);
    this.mainContentScrollState.viewportHeight.value = computeMainContentViewportHeight();
    this.sidebarList.height(this.sidebarListViewportHeight(), Unit.Pixel);
  }

  rebuildMainHeaderContent(): void {
    const children = new Array<Node>();
    children.push(this.mainHeadingText);
    children.push(this.verticalSpacer(6.0));
    children.push(this.mainDescriptionText);
    children.push(this.verticalSpacer(12.0));
    children.push(this.demoScopeCard);
    children.push(this.verticalSpacer(10.0));
    children.push(this.headerStatusText);
    children.push(this.verticalSpacer(6.0));
    children.push(this.selectionStatusText);
    this.mainHeaderContent
      .children(children);
  }

  private verticalSpacer(height: f32): FlexBox {
    return new FlexBox().width(FULL_SIZE, Unit.Percent).height(height, Unit.Pixel);
  }

  private horizontalSpacer(width: f32): FlexBox {
    return new FlexBox().width(width, Unit.Pixel).height(FULL_SIZE, Unit.Percent);
  }

  private configureMainPanel(): void {
    this.rebuildMainHeaderContent();
    const mainColumn = Column(
      this.mainHeaderPanel
        .child(this.mainHeaderContent),
      this.verticalSpacer(SPACING_LARGE),
      this.previewPanel,
      this.verticalSpacer(SPACING_LARGE),
      this.inspectorPanel,
    )
      .width(FULL_SIZE, Unit.Percent)
      .padding(0.0, 0.0, 0.0, SPACING_MEDIUM);

    const mainPanelViewport = this.mainContentScrollBox;
    mainPanelViewport.width(this.mainContentScrollBoxWidth(), Unit.Pixel);
    mainPanelViewport.height(FULL_SIZE, Unit.Percent);
    mainPanelViewport.scrollOffset(this.mainContentScrollState.offsetX.value, this.mainContentScrollState.offsetY.value);
    mainPanelViewport.child(mainColumn);

    this.mainContentColumn = mainColumn;
    this.mainContentViewport = mainPanelViewport.viewport;

    this.mainPanel
      .child(mainPanelViewport)
      .width(this.mainColumnWidth(), Unit.Pixel)
      ;
  }

}
