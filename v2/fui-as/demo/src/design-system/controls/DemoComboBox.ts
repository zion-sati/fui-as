import { ComboBox, Disposable, Theme, bindTheme, disposeAll } from "../../../../src/Fui";
import { applyDemoComboBoxRecipe } from "./recipes";

export class DemoComboBox extends ComboBox {
  private readonly themeBindings: Array<Disposable> = new Array<Disposable>();
  private demoThemeDisposed: bool = false;

  constructor(text: string = "") {
    super(text);
    this.maxVisibleItems(5);
    this.trackDemoTheme(bindTheme(this, (comboBox, theme): void => {
      comboBox.applyDemoTheme(theme);
    }));
  }

  dispose(): void {
    this.disposeDemoThemeBindings();
    super.dispose();
  }

  private applyDemoTheme(theme: Theme): void {
    applyDemoComboBoxRecipe(this, theme);
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
