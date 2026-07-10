import { HandlerAction } from "../core/Action";
import { Disposable, disposeAll } from "../core/Disposable";
import { Theme, activeTheme } from "../core/Theme";
import { warn } from "../core/Logger";
import { FlexBox } from "../nodes";

function clamp(value: f32, min: f32, max: f32): f32 {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

export class ProgressBar extends FlexBox {
  private readonly fillNode: FlexBox;
  private readonly disposables: Array<Disposable> = new Array<Disposable>();
  private disposed: bool = false;
  private minValue: f32 = 0.0;
  private maxValue: f32 = 100.0;
  private currentValue: f32 = 0.0;
  private lengthValue: f32 = 220.0;
  private thicknessValue: f32 = 14.0;
  private trackColorValue: u32 = 0;
  private fillColorValue: u32 = 0;
  private trackColorOverridden: bool = false;
  private fillColorOverridden: bool = false;
  private cornerRadiusOverridden: bool = false;

  constructor(value: f32 = 0.0) {
    super();
    this.fillNode = new FlexBox();
    this.child(this.fillNode);
    this.track(activeTheme.addAction(new HandlerAction<ProgressBar, Theme>(this, (bar: ProgressBar, _theme: Theme): void => {
      bar.handleThemeChanged();
    })));
    this.setValue(value);
    this.handleThemeChanged();
  }

  get valueNow(): f32 {
    return this.currentValue;
  }

  min(value: f32): this {
    this.minValue = value;
    if (this.maxValue < value) {
      this.maxValue = value;
    }
    this.setValue(this.currentValue);
    return this;
  }

  max(value: f32): this {
    this.maxValue = value;
    if (this.minValue > value) {
      this.minValue = value;
    }
    this.setValue(this.currentValue);
    return this;
  }

  value(value: f32): this {
    this.setValue(value);
    return this;
  }

  length(value: f32): this {
    if (value <= 0.0) {
      warn("Layout", "ProgressBar.length() received " + value.toString() + "; clamping to 1.0.");
    }
    this.lengthValue = value > 0.0 ? value : 1.0;
    this.syncGeometry();
    return this;
  }

  thickness(value: f32): this {
    if (value <= 0.0) {
      warn("Layout", "ProgressBar.thickness() received " + value.toString() + "; clamping to 1.0.");
    }
    this.thicknessValue = value > 0.0 ? value : 1.0;
    if (!this.cornerRadiusOverridden) {
      super.cornerRadius(this.thicknessValue * 0.5);
    }
    this.syncGeometry();
    this.syncVisualState();
    return this;
  }

  trackColor(color: u32): this {
    this.trackColorOverridden = true;
    this.trackColorValue = color;
    this.syncVisualState();
    return this;
  }

  fillColor(color: u32): this {
    this.fillColorOverridden = true;
    this.fillColorValue = color;
    this.syncVisualState();
    return this;
  }

  cornerRadius(radius: f32): this {
    this.cornerRadiusOverridden = true;
    super.cornerRadius(radius);
    this.fillNode.cornerRadius(radius);
    return this;
  }

  dispose(): void {
    this.disposeControl();
    super.dispose();
  }

  private normalizeValue(value: f32): f32 {
    return clamp(value, this.minValue, this.maxValue);
  }

  private setValue(value: f32): void {
    this.currentValue = this.normalizeValue(value);
    this.syncGeometry();
  }

  private syncGeometry(): void {
    const range = this.maxValue - this.minValue;
    const fraction = range > 0.0 ? clamp((this.currentValue - this.minValue) / range, 0.0, 1.0) : 0.0;
    const fillLength = this.lengthValue * fraction;
    this.width(this.lengthValue);
    this.height(this.thicknessValue);
    this.fillNode.width(fillLength);
    this.fillNode.height(this.thicknessValue);
    this.semanticValueRange(this.currentValue, this.minValue, this.maxValue);
    this.syncSemanticLabel();
  }

  private syncSemanticLabel(): void {
    this.setDefaultSemanticLabel(
      "Progress bar, value " + this.currentValue.toString() +
      ", range " + this.minValue.toString() +
      " to " + this.maxValue.toString(),
    );
  }

  private syncVisualState(): void {
    const theme = activeTheme.value;
    const trackColor = this.trackColorOverridden ? this.trackColorValue : theme.colors.scrollbarTrack;
    const fillColor = this.fillColorOverridden ? this.fillColorValue : theme.colors.accent;
    if (!this.cornerRadiusOverridden) {
      super.cornerRadius(this.thicknessValue * 0.5);
      this.fillNode.cornerRadius(this.thicknessValue * 0.5);
    }
    super.bgColor(trackColor);
    super.border(1.0, theme.colors.border);
    this.fillNode.bgColor(fillColor);
  }

  private handleThemeChanged(): void {
    if (this.disposed) {
      return;
    }
    this.syncVisualState();
    this.syncGeometry();
  }

  private track(disposable: Disposable): void {
    this.disposables.push(disposable);
  }

  private disposeControl(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    disposeAll(this.disposables);
  }
}
