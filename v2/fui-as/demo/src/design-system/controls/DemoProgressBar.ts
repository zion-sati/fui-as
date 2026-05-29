import { Disposable, ProgressBar, Theme, bindTheme, disposeAll } from "../../../../src/Fui";
import { applyDemoProgressRecipe } from "./recipes";

export class DemoProgressBar extends ProgressBar {
  private readonly themeBindings: Array<Disposable> = new Array<Disposable>();
  private demoThemeDisposed: bool = false;

  constructor(value: f32 = 0.0) {
    super(value);
    this.thickness(18.0);
    this.trackDemoTheme(bindTheme(this, (bar, theme): void => {
      bar.applyDemoTheme(theme);
    }));
  }

  dispose(): void {
    this.disposeDemoThemeBindings();
    super.dispose();
  }

  private applyDemoTheme(theme: Theme): void {
    applyDemoProgressRecipe(this, theme);
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
