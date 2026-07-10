import { Application, Disposable, Node, Theme, bindTheme, currentRoute, disposeAll, rgb, useCustomTheme, viewportWidthSignal } from "../../../../src/Fui";
import { bind1 } from "../../../../src/FuiPrimitives";
import {
  clearDemoShellAccentColorChanged,
  clearDemoShellDarkModeChanged,
  onDemoShellAccentColorChanged,
  onDemoShellDarkModeChanged,
} from "../../generated/HostEvents";
import { demoShellAccentColorHex, demoShellIsDarkMode } from "../../generated/HostServices";
import { generateDemoTheme } from "../theme";
import { RoutePageModel } from "./RoutePageModel";
import { RoutePageSection } from "./RoutePageSection";
import { RoutePageView } from "./RoutePageView";

export interface RoutePageThemeObserver {
  applyTheme(theme: Theme): void;
}

export interface RoutePageLifecycleOwner extends RoutePageThemeObserver {
  dispose(): void;
}

function parseHexDigit(code: i32): i32 {
  if (code >= 48 && code <= 57) {
    return code - 48;
  }
  if (code >= 65 && code <= 70) {
    return code - 55;
  }
  if (code >= 97 && code <= 102) {
    return code - 87;
  }
  return -1;
}

function parseShellAccentColor(value: string, fallback: u32): u32 {
  if (value.length != 7 || value.charCodeAt(0) != 35) {
    return fallback;
  }
  const redHigh = parseHexDigit(value.charCodeAt(1));
  const redLow = parseHexDigit(value.charCodeAt(2));
  const greenHigh = parseHexDigit(value.charCodeAt(3));
  const greenLow = parseHexDigit(value.charCodeAt(4));
  const blueHigh = parseHexDigit(value.charCodeAt(5));
  const blueLow = parseHexDigit(value.charCodeAt(6));
  if (redHigh < 0 || redLow < 0 || greenHigh < 0 || greenLow < 0 || blueHigh < 0 || blueLow < 0) {
    return fallback;
  }
  return rgb(
    (redHigh << 4) | redLow,
    (greenHigh << 4) | greenLow,
    (blueHigh << 4) | blueLow,
  );
}

function resolveShellAccentColor(fallback: u32): u32 {
  return parseShellAccentColor(demoShellAccentColorHex(), fallback);
}

export class RoutePageController {
  readonly view: RoutePageView;
  private readonly disposables: Array<Disposable> = new Array<Disposable>();
  private readonly lifecycleOwner: RoutePageLifecycleOwner | null;
  private darkModeValue: bool;
  private accentColorValue: u32;

  constructor(
    readonly model: RoutePageModel,
    sections: Array<RoutePageSection>,
    lifecycleOwner: RoutePageLifecycleOwner | null = null,
  ) {
    this.lifecycleOwner = lifecycleOwner;
    this.darkModeValue = demoShellIsDarkMode();
    this.accentColorValue = resolveShellAccentColor(model.accentColor);
    this.view = new RoutePageView(model, sections);
    this.view.syncViewportLayout();
    this.view.actionButton.onClickWith(this, (controller, _event) => {
      controller.model.actionCount.value += 1;
    });
    onDemoShellAccentColorChanged(bind1<RoutePageController, u32>(this, (controller, next) => {
      controller.setAccentColor(next);
    }));
    onDemoShellDarkModeChanged(bind1<RoutePageController, bool>(this, (controller, flag) => {
      controller.setDarkMode(flag);
    }));
    this.syncTheme();
    this.track(bindTheme(this, (controller, theme): void => {
      controller.applyTheme(theme);
    }));
    this.track(currentRoute.bind(this, (controller, route): void => {
      controller.view.setCurrentRoute(route);
    }));
    this.track(viewportWidthSignal.bind(this, (controller, _nextWidth): void => {
      controller.view.syncViewportLayout();
    }));
    this.track(model.actionCount.bind(this, (controller, count): void => {
      controller.view.setActionCount(count);
    }));
    this.view.setCurrentRoute(currentRoute.value);
    this.view.setActionCount(model.actionCount.value);
  }

  getRoot(): Node {
    return this.view.getRoot();
  }

  getActionCount(): i32 {
    return this.model.actionCount.value;
  }

  mount(): void {
    Application.mount(this.view.getRoot());
  }

  dispose(): void {
    clearDemoShellAccentColorChanged();
    clearDemoShellDarkModeChanged();
    disposeAll(this.disposables);
    const lifecycleOwner = this.lifecycleOwner;
    if (lifecycleOwner !== null) {
      lifecycleOwner.dispose();
    }
    this.view.dispose();
    Application.unmount();
  }

  private applyTheme(theme: Theme): void {
    this.view.applyTheme(theme);
    const lifecycleOwner = this.lifecycleOwner;
    if (lifecycleOwner !== null) {
      lifecycleOwner.applyTheme(theme);
    }
  }

  private setDarkMode(flag: bool): void {
    if (this.darkModeValue == flag) {
      return;
    }
    this.darkModeValue = flag;
    this.syncTheme();
  }

  private setAccentColor(next: u32): void {
    this.accentColorValue = next;
    this.syncTheme();
  }

  private track(disposable: Disposable): void {
    this.disposables.push(disposable);
  }

  private syncTheme(): void {
    useCustomTheme(generateDemoTheme(this.darkModeValue, this.accentColorValue));
  }
}
