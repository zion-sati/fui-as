import {
  Disposable,
  NavLink,
  NavLinkInteractionState,
  Text,
  Theme,
  activeTheme,
  bindTheme,
  disposeAll,
} from "../../../../src/Fui";
import {
  NAV_LINK_RADIUS,
  NAV_LINK_PADDING_X,
  NAV_LINK_PADDING_Y,
} from "../tokens";
import { DemoNavLinkRecipe, applyDemoNavLinkRecipe } from "./recipes";

export class DemoNavLink extends NavLink {
  private readonly themeBindings: Array<Disposable> = new Array<Disposable>();
  private demoThemeDisposed: bool = false;
  private activeValue: bool = false;
  private hoveredValue: bool = false;
  readonly labelNode: Text;

  constructor(href: string, label: string = href, openInNewTab: bool = false) {
    super(href, openInNewTab);
    this.labelNode = new Text(label).fontSize(15.0).selectable(false) as Text;
    this
      .cornerRadius(NAV_LINK_RADIUS)
      .padding(NAV_LINK_PADDING_X, NAV_LINK_PADDING_Y, NAV_LINK_PADDING_X, NAV_LINK_PADDING_Y);
    this.child(this.labelNode).semanticLabel(label);
    this.bindInteractionState<DemoNavLink>(this, applyDemoNavLinkInteractionState);
    this.trackDemoTheme(bindTheme(this, (link, theme): void => {
      link.applyDemoTheme(theme);
    }));
  }

  active(flag: bool = true): this {
    this.activeValue = flag;
    this.applyDemoTheme(activeTheme.value);
    return this;
  }

  label(label: string): this {
    this.labelNode.text(label);
    this.semanticLabel(label);
    return this;
  }

  dispose(): void {
    this.disposeDemoThemeBindings();
    super.dispose();
  }

  private applyDemoTheme(theme: Theme): void {
    applyDemoNavLinkRecipe(
      this,
      this.labelNode,
      theme,
      this.activeValue || this.hoveredValue ? DemoNavLinkRecipe.Active : DemoNavLinkRecipe.Inactive,
    );
  }

  applyInteractionState(state: NavLinkInteractionState, theme: Theme): void {
    this.hoveredValue = state.hovered || state.pressed;
    this.applyDemoTheme(theme);
  }

  private trackDemoTheme(disposable: Disposable): void {
    this.themeBindings.push(disposable);
  }

  private disposeDemoThemeBindings(): void {
    if (this.demoThemeDisposed) {
      return;
    }
    this.demoThemeDisposed = true;
    disposeAll(this.themeBindings);
  }
}

function applyDemoNavLinkInteractionState(
  link: DemoNavLink,
  state: NavLinkInteractionState,
  theme: Theme,
): void {
  link.applyInteractionState(state, theme);
}
