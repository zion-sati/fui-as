import { ScrollBar, ScrollBox, ScrollState, Theme } from "../../../src/Fui";
import {
  SCROLLBAR_THUMB_MIN_HEIGHT,
  SCROLLBAR_THUMB_WIDTH,
  SCROLLBAR_TRACK_WIDTH,
} from "./tokens";
import { demoScrollbarThumbColor, demoScrollbarTrackColor } from "./theme";

export enum DemoScrollBarRecipe {
  Panel = 0,
}

export class DemoScrollBarStyle {
  constructor(
    readonly trackColor: u32,
    readonly thumbColor: u32,
  ) {}
}

export function configureDemoScrollBar(scrollBar: ScrollBar): void {
  scrollBar
    .trackWidth(SCROLLBAR_TRACK_WIDTH)
    .thumbWidth(SCROLLBAR_THUMB_WIDTH)
    .thumbMinHeight(SCROLLBAR_THUMB_MIN_HEIGHT)
    .trackCornerRadius(SCROLLBAR_TRACK_WIDTH * 0.5)
    .thumbCornerRadius(SCROLLBAR_THUMB_WIDTH * 0.5);
}

export function configureDemoScrollBox(scrollBox: ScrollBox): void {
  configureDemoScrollBar(scrollBox.verticalScrollBar);
  configureDemoScrollBar(scrollBox.horizontalScrollBar);
}

export class DemoScrollBox extends ScrollBox {
  constructor(scrollState: ScrollState = new ScrollState()) {
    super(scrollState);
    configureDemoScrollBox(this);
  }
}

export function resolveDemoScrollBarRecipe(
  theme: Theme,
  _recipe: DemoScrollBarRecipe = DemoScrollBarRecipe.Panel,
  trackColor: u32 = demoScrollbarTrackColor(theme),
): DemoScrollBarStyle {
  return new DemoScrollBarStyle(
    trackColor,
    demoScrollbarThumbColor(theme),
  );
}

export function applyDemoScrollBarTheme(
  scrollBar: ScrollBar,
  theme: Theme,
  trackColor: u32 = demoScrollbarTrackColor(theme),
): void {
  const style = resolveDemoScrollBarRecipe(theme, DemoScrollBarRecipe.Panel, trackColor);
  scrollBar
    .trackColor(style.trackColor)
    .thumbColor(style.thumbColor);
}

export function applyDemoScrollBoxTheme(
  scrollBox: ScrollBox,
  theme: Theme,
  trackColor: u32 = demoScrollbarTrackColor(theme),
): void {
  applyDemoScrollBarTheme(scrollBox.verticalScrollBar, theme, trackColor);
  applyDemoScrollBarTheme(scrollBox.horizontalScrollBar, theme, trackColor);
}
