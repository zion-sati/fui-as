import { Disposable, Text, Theme, activeTheme, bindTheme, disposeAll } from "../../../src/Fui";
import { demoMutedText, demoPrimaryText, demoSubtleText } from "./theme";

export enum DemoTextRecipe {
  Body = 0,
  Supporting = 1,
  Hint = 2,
  InverseLabel = 3,
  PageTitle = 4,
  SectionTitle = 5,
  StatusValue = 6,
  StatusSupporting = 7,
  ListTitle = 8,
  ListMeta = 9,
  Accent = 10,
  Error = 11,
}

export class DemoTextStyle {
  constructor(readonly color: u32) {}
}

export function resolveDemoTextRecipe(theme: Theme, recipe: DemoTextRecipe): DemoTextStyle {
  if (recipe == DemoTextRecipe.Accent) {
    return new DemoTextStyle(theme.colors.accent);
  }
  if (recipe == DemoTextRecipe.Error) {
    return new DemoTextStyle(theme.colors.accentPressed);
  }
  if (recipe == DemoTextRecipe.Supporting || recipe == DemoTextRecipe.StatusSupporting) {
    return new DemoTextStyle(demoMutedText(theme));
  }
  if (recipe == DemoTextRecipe.Hint || recipe == DemoTextRecipe.ListMeta) {
    return new DemoTextStyle(demoSubtleText(theme));
  }
  if (recipe == DemoTextRecipe.InverseLabel) {
    return new DemoTextStyle(0xf8fbffff);
  }
  return new DemoTextStyle(demoPrimaryText(theme));
}

export function demoTextRecipeColor(theme: Theme, recipe: DemoTextRecipe): u32 {
  return resolveDemoTextRecipe(theme, recipe).color;
}

export function applyDemoTextRecipe(text: Text, theme: Theme, recipe: DemoTextRecipe): void {
  text.textColor(demoTextRecipeColor(theme, recipe));
}

export class DemoText extends Text {
  private readonly themeBindings: Array<Disposable> = new Array<Disposable>();
  private demoThemeDisposed: bool = false;

  constructor(
    content: string = "",
    private recipeValue: DemoTextRecipe = DemoTextRecipe.Body,
    selectable: bool = true,
  ) {
    super(content);
    this.selectable(selectable);
    this.overflowFade(true, true);
    this.trackDemoTheme(bindTheme(this, (text, theme): void => {
      text.applyDemoTheme(theme);
    }));
  }

  recipe(next: DemoTextRecipe): this {
    this.recipeValue = next;
    this.applyDemoTheme(activeTheme.value);
    return this;
  }

  dispose(): void {
    this.disposeDemoThemeBindings();
    super.dispose();
  }

  private applyDemoTheme(theme: Theme): void {
    applyDemoTextRecipe(this, theme, this.recipeValue);
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
