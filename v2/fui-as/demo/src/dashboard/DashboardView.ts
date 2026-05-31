import {
  Column,
  ContextMenu,
  Dialog,
  SelectionArea,
  FlexBox,
  FlexDirection,
  Image,
  Node,
  ObjectFit,
  Orientation,
  PopupPlacement,
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
  demoTemplatedControlsRoute,
} from "../design-system";
import {
  ACCENT_SWATCH_HEIGHT,
  FONT_REGULAR,
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
    .font(FONT_REGULAR, 17.0)
    .selectable();
  const detail = new DemoText("", DemoTextRecipe.ListMeta)
    .font(FONT_REGULAR, 13.0)
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
    this.font(FONT_REGULAR, size);
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
  readonly dialog: Dialog = new Dialog(
    "Confirm action",
    "Press Enter to accept, Escape to cancel, or click the backdrop to dismiss this dialog.",
  )
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
  readonly hueText: Text = new DashboardText("", 17.0);
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
  readonly demoScopeNavRow: FlexBox = Row(
    this.advancedControlsLink,
    this.horizontalSpacer(10.0),
    this.templatedControlsLink,
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
  readonly commonControlsDescriptionText: Text = new DashboardText("Checkbox, switch, radio, slider, dropdown, and text input samples all sit on the same retained semantic and focus foundation.", 14.0, DemoTextRecipe.Supporting);
  readonly commonToggleStatusText: Text = new DashboardText("", 14.0, DemoTextRecipe.StatusValue);
  readonly commonRadioStatusText: Text = new DashboardText("", 14.0, DemoTextRecipe.StatusValue);
  readonly commonSliderStatusText: Text = new DashboardText("", 14.0, DemoTextRecipe.StatusValue);
  readonly commonDropdownStatusText: Text = new DashboardText("", 14.0, DemoTextRecipe.StatusValue);
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
  readonly commonTextInput: DemoTextInput = new DemoTextInput()
    .placeholder("Type here")
    .maxChars(32)
    .width(220.0, Unit.Pixel)
    .nodeId("demo-dashboard:text-input") as DemoTextInput;
  readonly commonPasswordInput: DemoTextInput = new DemoTextInput("super-secret")
    .password()
    .width(220.0, Unit.Pixel) as DemoTextInput;
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
        ).alignItems(2),
        this.verticalSpacer(12.0),
        this.commonDropdown,
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
        this.verticalSpacer(8.0),
        this.hueText,
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
      ).width(FULL_SIZE, Unit.Percent),
    ) as FlexBox;
  readonly mainHeadingText: Text = new DashboardText("EffinDom FUI-AS Samples", 30.0, DemoTextRecipe.PageTitle);
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
    configureDemoScrollBar(this.sidebarList.scrollBar);

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
    applyDemoScrollBarTheme(this.sidebarList.scrollBar, theme, panelColor);
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
