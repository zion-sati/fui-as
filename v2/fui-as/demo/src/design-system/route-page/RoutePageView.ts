import { Column, FlexBox, Row, ScrollBarVisibility, ScrollBox, ScrollState, SelectionArea, SemanticRole, Text, Theme, Unit, viewportWidthSignal } from "../../../../src/Fui";
import { DemoButton, DemoButtonTone, DemoNavLink } from "../controls";
import { DemoScrollBox, applyDemoScrollBoxTheme } from "../scrollbar";
import { DemoSurface, DemoSurfaceRecipe } from "../surfaces";
import { DemoText, DemoTextRecipe } from "../text";
import { DEMO_ROOT_PADDING, PAGE_SHELL_FRAME_PADDING, ROUTE_PAGE_ROOT_PADDING, SCROLLBAR_TRACK_WIDTH } from "../tokens";
import { RoutePageModel } from "./RoutePageModel";
import { RoutePageSection } from "./RoutePageSection";

class NavItem {
  constructor(
    readonly routePath: string,
    readonly link: DemoNavLink,
  ) {}
}

function verticalSpacer(height: f32): FlexBox {
  return new FlexBox().fillWidth().height(height, Unit.Pixel);
}

function horizontalSpacer(width: f32): FlexBox {
  return new FlexBox().width(width, Unit.Pixel).height(1.0, Unit.Pixel);
}

function routePageRootPadding(): f32 {
  return viewportWidthSignal.value < 640.0 ? DEMO_ROOT_PADDING : ROUTE_PAGE_ROOT_PADDING;
}

function routePageContentPadding(): f32 {
  return viewportWidthSignal.value < 640.0 ? 24.0 : 28.0;
}

const ROUTE_PAGE_SCROLLBAR_GUTTER: f32 = 12.0;
const ROUTE_PAGE_SCROLLBAR_RAIL_RESERVE: f32 = SCROLLBAR_TRACK_WIDTH + ROUTE_PAGE_SCROLLBAR_GUTTER;

function routePageAvailableWidth(): f32 {
  const available = viewportWidthSignal.value - (routePageRootPadding() * 2.0);
  return available > 0.0 ? available : 0.0;
}

function routePageScrollBoxWidth(): f32 {
  const available = routePageAvailableWidth() - ROUTE_PAGE_SCROLLBAR_RAIL_RESERVE;
  return available > 0.0 ? available : routePageAvailableWidth();
}

export class RoutePageView {
  readonly actionButton!: DemoButton;

  private readonly contentScrollState: ScrollState = new ScrollState();
  private readonly contentScrollBox: ScrollBox = new DemoScrollBox(this.contentScrollState)
    .scrollEnabledX(true)
    .scrollEnabledY(true)
    .verticalScrollbarVisibility(ScrollBarVisibility.Always)
    .scrollbarGutter(ROUTE_PAGE_SCROLLBAR_GUTTER)
    .width(routePageScrollBoxWidth(), Unit.Pixel)
    .fillHeight() as ScrollBox;
  private readonly surface: FlexBox = new DemoSurface(DemoSurfaceRecipe.PageShell)
    .fillWidth() as FlexBox;
  private readonly surfaceFrame: FlexBox = new FlexBox()
    .fillWidth()
    .padding(PAGE_SHELL_FRAME_PADDING, PAGE_SHELL_FRAME_PADDING, PAGE_SHELL_FRAME_PADDING, PAGE_SHELL_FRAME_PADDING)
    .child(this.surface) as FlexBox;
  private readonly root: SelectionArea = new SelectionArea()
    .fillSize()
    .padding(routePageRootPadding(), routePageRootPadding(), routePageRootPadding(), routePageRootPadding())
    .child(this.contentScrollBox) as SelectionArea;
  private readonly titleText: Text;
  private readonly descriptionText: Text;
  private readonly routeStatusText: Text;
  private readonly counterStatusText: Text;
  private readonly contentColumn!: FlexBox;
  private readonly accentBadge!: FlexBox;
  private readonly accentBadgeText: Text;
  private readonly highlightCard!: FlexBox;
  private readonly notesHeadingText!: Text;
  private readonly highlightTexts: Array<Text> = new Array<Text>();
  private readonly navItems: Array<NavItem> = new Array<NavItem>();
  private readonly sections: Array<RoutePageSection> = new Array<RoutePageSection>();
  private activeRoute: string = "";

  constructor(
    private readonly model: RoutePageModel,
    sections: Array<RoutePageSection>,
  ) {
    this.titleText = new DemoText(model.title, DemoTextRecipe.PageTitle)
      .fontSize(34.0)
      .semanticRole(SemanticRole.Heading) as Text;

    this.descriptionText = new DemoText(model.description, DemoTextRecipe.Supporting)
      .fontSize(17.0)
      .maxLines(3) as Text;

    this.routeStatusText = new DemoText("", DemoTextRecipe.StatusValue)
      .fontSize(16.0) as Text;

    this.counterStatusText = new DemoText("", DemoTextRecipe.StatusSupporting)
      .fontSize(16.0) as Text;

    this.accentBadgeText = new DemoText(model.badge, DemoTextRecipe.InverseLabel)
      .fontSize(14.0) as Text;
    this.accentBadge = new FlexBox()
      .padding(14.0, 8.0, 14.0, 8.0)
      .cornerRadius(999.0)
      .child(this.accentBadgeText) as FlexBox;

    this.notesHeadingText = new DemoText("Hot-swap notes", DemoTextRecipe.SectionTitle)
      .fontSize(18.0) as Text;

    this.actionButton = new DemoButton(model.buttonLabel, DemoButtonTone.Primary)
      .width(180.0, Unit.Pixel) as DemoButton;

    this.contentScrollBox
      .nodeId("route-page-scroll:" + model.title.toLowerCase());

    const highlightColumn = Column();
    for (let i = 0; i < model.highlights.length; i += 1) {
      if (i > 0) {
        highlightColumn.child(verticalSpacer(10.0));
      }
      const highlightText = new DemoText(model.highlights[i], DemoTextRecipe.Supporting)
        .fontSize(16.0) as Text;
      this.highlightTexts.push(highlightText);
      highlightColumn.child(highlightText);
    }

    this.highlightCard = new DemoSurface(DemoSurfaceRecipe.SectionPanel)
      .padding(18.0, 18.0, 18.0, 18.0)
      .child(
        Column(
          this.notesHeadingText,
          verticalSpacer(12.0),
          highlightColumn,
        ),
      ) as FlexBox;

    const navBar = Row().fillWidth();
    for (let i = 0; i < model.navItems.length; i += 1) {
      const item = unchecked(model.navItems[i]);
      if (i > 0) {
        navBar.child(horizontalSpacer(10.0));
      }
      navBar.child(this.createNavLink(item.routePath, item.label));
    }

    this.contentColumn = Column(
      navBar,
      verticalSpacer(24.0),
      this.accentBadge,
      verticalSpacer(16.0),
      this.titleText,
      verticalSpacer(10.0),
      this.descriptionText,
      verticalSpacer(18.0),
      this.routeStatusText,
      verticalSpacer(10.0),
      this.counterStatusText,
      verticalSpacer(18.0),
      this.actionButton,
      verticalSpacer(22.0),
      this.highlightCard,
    ).fillWidth();
    this.contentColumn.padding(routePageContentPadding(), routePageContentPadding(), routePageContentPadding(), routePageContentPadding());

    for (let i = 0; i < sections.length; i += 1) {
      const section = unchecked(sections[i]);
      this.sections.push(section);
      this.contentColumn.child(verticalSpacer(22.0));
      this.contentColumn.child(section.card);
    }
    this.surface.child(this.contentColumn);
    this.contentScrollBox.child(this.surfaceFrame);
  }

  getRoot(): SelectionArea {
    return this.root;
  }

  dispose(): void {
    this.contentScrollBox.dispose();
  }

  applyTheme(theme: Theme): void {
    applyDemoScrollBoxTheme(this.contentScrollBox, theme);
    this.accentBadge.bgColor(theme.colors.accent);
    this.syncNavItems();
  }

  syncViewportLayout(): void {
    const rootPadding = routePageRootPadding();
    const contentPadding = routePageContentPadding();
    this.root.padding(rootPadding, rootPadding, rootPadding, rootPadding);
    this.contentScrollBox.width(routePageScrollBoxWidth(), Unit.Pixel);
    this.contentColumn.padding(contentPadding, contentPadding, contentPadding, contentPadding);
  }

  setCurrentRoute(route: string): void {
    this.activeRoute = route;
    this.routeStatusText.text("Current route: " + (route.length > 0 ? route : "(waiting for host route)"));
    this.syncNavItems();
  }

  setActionCount(count: i32): void {
    this.counterStatusText.text(this.model.counterLabel + ": " + count.toString());
  }

  private createNavLink(routePath: string, label: string): DemoNavLink {
    const link = new DemoNavLink(routePath, label);
    this.navItems.push(new NavItem(routePath, link));
    return link;
  }

  private syncNavItems(): void {
    for (let i = 0; i < this.navItems.length; i += 1) {
      const item = unchecked(this.navItems[i]);
      item.link.active(this.activeRoute == item.routePath);
    }
  }
}
