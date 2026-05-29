import { Disposable, TextInput, Theme, bindTheme, disposeAll } from "../../../../src/Fui";
import { DemoFieldRecipe, resolveDemoFieldRecipe } from "./recipes";

export class DemoTextInput extends TextInput {
  private readonly themeBindings: Array<Disposable> = new Array<Disposable>();
  private demoThemeDisposed: bool = false;

  constructor(text: string = "") {
    super(text);
    this.fontSize(15.0);
    this.trackDemoTheme(bindTheme(this, (control, theme): void => {
      control.applyDemoTheme(theme);
    }));
  }

  dispose(): void {
    this.disposeDemoThemeBindings();
    super.dispose();
  }

  private applyDemoTheme(theme: Theme): void {
    const style = resolveDemoFieldRecipe(theme, DemoFieldRecipe.Standard);
    this
      .bgColor(style.background)
      .cornerRadius(style.radius)
      .border(style.borderWidth, style.borderColor, style.borderStyle);
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
