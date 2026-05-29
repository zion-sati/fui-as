import { Disposable, Dropdown, Theme, bindTheme, disposeAll } from "../../../../src/Fui";
import { applyDemoDropdownRecipe } from "./recipes";

export class DemoDropdown extends Dropdown {
  private readonly themeBindings: Array<Disposable> = new Array<Disposable>();
  private demoThemeDisposed: bool = false;

  constructor() {
    super();
    this.maxVisibleItems(6);
    this.trackDemoTheme(bindTheme(this, (dropdown, theme): void => {
      dropdown.applyDemoTheme(theme);
    }));
  }

  dispose(): void {
    this.disposeDemoThemeBindings();
    super.dispose();
  }

  private applyDemoTheme(theme: Theme): void {
    applyDemoDropdownRecipe(this, theme);
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
