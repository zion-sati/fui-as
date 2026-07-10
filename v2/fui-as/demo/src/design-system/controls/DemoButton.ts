import { Button, Disposable, Theme, activeTheme, bindTheme, disposeAll } from "../../../../src/Fui";
import {
  BUTTON_PADDING_X,
  BUTTON_PADDING_Y,
  BUTTON_RADIUS,
} from "../tokens";
import { DemoButtonRecipe, applyDemoButtonRecipe } from "./recipes";

export enum DemoButtonTone {
  Primary = 0,
  Secondary = 1,
}

function resolveToneRecipe(tone: DemoButtonTone): DemoButtonRecipe {
  return tone == DemoButtonTone.Primary ? DemoButtonRecipe.Primary : DemoButtonRecipe.Secondary;
}

export class DemoButton extends Button {
  private readonly themeBindings: Array<Disposable> = new Array<Disposable>();
  private demoThemeDisposed: bool = false;

  constructor(
    label: string,
    private toneValue: DemoButtonTone = DemoButtonTone.Secondary,
  ) {
    super(label);
    this
      .cornerRadius(BUTTON_RADIUS)
      .padding(BUTTON_PADDING_X, BUTTON_PADDING_Y, BUTTON_PADDING_X, BUTTON_PADDING_Y)
      .fontSize(16.0);
    this.trackDemoTheme(bindTheme(this, (button, theme): void => {
      button.applyDemoTheme(theme);
    }));
  }

  tone(next: DemoButtonTone): this {
    this.toneValue = next;
    this.applyDemoTheme(activeTheme.value);
    return this;
  }

  dispose(): void {
    this.disposeDemoThemeBindings();
    super.dispose();
  }

  private applyDemoTheme(theme: Theme): void {
    applyDemoButtonRecipe(this, theme, resolveToneRecipe(this.toneValue));
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
