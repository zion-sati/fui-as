import { Disposable, NavLink, Theme, activeTheme, bindTheme, disposeAll } from "../../../../src/Fui";
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

  constructor(href: string, label: string = href, openInNewTab: bool = false) {
    super(href, label, openInNewTab);
    this.labelNode.fontSize(15.0);
    this
      .cornerRadius(NAV_LINK_RADIUS)
      .padding(NAV_LINK_PADDING_X, NAV_LINK_PADDING_Y, NAV_LINK_PADDING_X, NAV_LINK_PADDING_Y);
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
    return this.text(label);
  }

  dispose(): void {
    this.disposeDemoThemeBindings();
    super.dispose();
  }

  private applyDemoTheme(theme: Theme): void {
    applyDemoNavLinkRecipe(
      this,
      theme,
      this.activeValue ? DemoNavLinkRecipe.Active : DemoNavLinkRecipe.Inactive,
    );
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
