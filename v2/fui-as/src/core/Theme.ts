import { rgb, rgba } from "../color";
import { Action, SignalHandler } from "./Action";
import * as ffi from "./ffi";
import { Signal } from "./Signal";
import { FontFamily, FontStack } from "./Typography";

const DEFAULT_ACCENT_COLOR: u32 = rgb(0x25, 0x63, 0xeb);
const WHITE: u32 = rgb(0xff, 0xff, 0xff);
const BLACK: u32 = rgb(0x00, 0x00, 0x00);

enum ThemeSource {
  System = 0,
  Custom = 1,
}

export class Theme {
  constructor(
    readonly colors: Colors,
    readonly spacing: Spacing,
    readonly fonts: Fonts,
    readonly contextMenu: ContextMenuTheme,
    readonly toolTip: ToolTipTheme,
  ) {}
}

export class Colors {
  constructor(
    readonly background: u32,
    readonly surface: u32,
    readonly textPrimary: u32,
    readonly textMuted: u32,
    readonly accent: u32,
    readonly accentPressed: u32,
    readonly accentHovered: u32,
    readonly border: u32,
    readonly selection: u32,
    readonly scrollbarTrack: u32,
    readonly scrollbarThumb: u32,
    readonly dialogBackdrop: u32,
    readonly dialogShadow: u32,
    readonly focusRing: u32,
  ) {}
}

export class Spacing {
  constructor(
    readonly xs: f32,
    readonly sm: f32,
    readonly md: f32,
    readonly lg: f32,
    readonly xl: f32,
  ) {}
}

export class Fonts {
  readonly bodyFamily: FontFamily;
  readonly headingFamily: FontFamily;
  readonly monoFamily: FontFamily;

  constructor(
    readonly body: u32,
    readonly heading: u32,
    readonly sizeBody: f32,
    readonly sizeHeading: f32,
    readonly mono: u32 = 5,
    readonly monoBold: u32 = 6,
    readonly sizeMono: f32 = sizeBody,
    bodyFamily: FontFamily | null = null,
    headingFamily: FontFamily | null = null,
    monoFamily: FontFamily | null = null,
  ) {
    this.bodyFamily = bodyFamily !== null ? changetype<FontFamily>(bodyFamily) : FontFamily.regularBold(body, heading);
    this.headingFamily = headingFamily !== null ? changetype<FontFamily>(headingFamily) : FontFamily.regularBold(heading, heading);
    this.monoFamily = monoFamily !== null ? changetype<FontFamily>(monoFamily) : FontFamily.regularBold(mono, monoBold);
  }
}

export class ContextMenuItemTheme {
  constructor(
    readonly background: u32,
    readonly hoverBackground: u32,
    readonly textColor: u32,
    readonly cornerRadius: f32,
    readonly fontId: u32,
    readonly fontFamily: FontFamily,
    readonly fontSize: f32,
    readonly height: f32,
    readonly paddingLeft: f32,
    readonly paddingTop: f32,
    readonly paddingRight: f32,
    readonly paddingBottom: f32,
  ) {}
}

export class ContextMenuTheme {
  constructor(
    readonly panelBackground: u32,
    readonly panelBorderColor: u32,
    readonly panelShadowColor: u32,
    readonly panelCornerRadius: f32,
    readonly separatorColor: u32,
    readonly shadowOffsetY: f32,
    readonly shadowBlur: f32,
    readonly shadowSpread: f32,
    readonly item: ContextMenuItemTheme,
  ) {}
}

export class ToolTipTheme {
  constructor(
    readonly panelBackground: u32,
    readonly panelBorderColor: u32,
    readonly panelShadowColor: u32,
    readonly panelCornerRadius: f32,
    readonly textColor: u32,
    readonly fontId: u32,
    readonly fontFamily: FontFamily,
    readonly fontSize: f32,
    readonly maxWidth: f32,
    readonly paddingLeft: f32,
    readonly paddingTop: f32,
    readonly paddingRight: f32,
    readonly paddingBottom: f32,
    readonly shadowOffsetY: f32,
    readonly shadowBlur: f32,
    readonly shadowSpread: f32,
  ) {}
}

function colorRed(color: u32): u32 {
  return (color >>> 24) & 0xff;
}

function colorGreen(color: u32): u32 {
  return (color >>> 16) & 0xff;
}

function colorBlue(color: u32): u32 {
  return (color >>> 8) & 0xff;
}

function colorAlpha(color: u32): u32 {
  return color & 0xff;
}

function clampUnit(value: f32): f32 {
  if (value < 0.0) {
    return 0.0;
  }
  if (value > 1.0) {
    return 1.0;
  }
  return value;
}

function mixChannel(from: u32, to: u32, amount: f32): u32 {
  const weight = clampUnit(amount);
  return <u32>Math.round(<f32>from + ((<f32>to - <f32>from) * weight));
}

function mixColor(from: u32, to: u32, amount: f32): u32 {
  return rgba(
    mixChannel(colorRed(from), colorRed(to), amount),
    mixChannel(colorGreen(from), colorGreen(to), amount),
    mixChannel(colorBlue(from), colorBlue(to), amount),
    mixChannel(colorAlpha(from), colorAlpha(to), amount),
  );
}

function withAlpha(color: u32, alpha: u32): u32 {
  return rgba(colorRed(color), colorGreen(color), colorBlue(color), alpha);
}

function normalizeAccentColor(color: u32): u32 {
  const normalized = color >>> 0;
  if (normalized == 0) {
    return DEFAULT_ACCENT_COLOR;
  }
  const alpha = colorAlpha(normalized);
  if (alpha == 0) {
    return withAlpha(normalized, 0xff);
  }
  return normalized;
}

function estimateThemeDark(theme: Theme): bool {
  const background = theme.colors.background;
  const luminance =
    (<f32>colorRed(background) * 0.2126) +
    (<f32>colorGreen(background) * 0.7152) +
    (<f32>colorBlue(background) * 0.0722);
  return luminance < 128.0;
}

const DEFAULT_SPACING = new Spacing(4.0, 8.0, 16.0, 24.0, 32.0);
const DEFAULT_BODY_STACK = new FontStack(1).fallback(3);
const DEFAULT_HEADING_STACK = new FontStack(2).fallback(3);
const DEFAULT_MONO_STACK = new FontStack(5).fallback(4).fallback(3);
const DEFAULT_MONO_BOLD_STACK = new FontStack(6).fallback(4).fallback(3);

const DEFAULT_FONTS = new Fonts(
  1,
  2,
  16.0,
  24.0,
  5,
  6,
  15.0,
  new FontFamily(1, 2, 9, 10),
  FontFamily.regularBoldStacks(DEFAULT_HEADING_STACK, DEFAULT_HEADING_STACK),
  FontFamily.regularBoldStacks(DEFAULT_MONO_STACK, DEFAULT_MONO_BOLD_STACK),
);

export function generateTheme(isDark: bool, accentColor: u32 = DEFAULT_ACCENT_COLOR): Theme {
  const accent = normalizeAccentColor(accentColor);
  const background = isDark ? rgb(0x04, 0x0a, 0x14) : rgb(0xf8, 0xfa, 0xfc);
  const surface = isDark ? rgb(0x0f, 0x17, 0x28) : rgb(0xff, 0xff, 0xff);
  const textPrimary = isDark ? rgb(0xf8, 0xfa, 0xfc) : rgb(0x0f, 0x17, 0x2a);
  const textMuted = isDark ? rgb(0x94, 0xa3, 0xb8) : rgb(0x47, 0x55, 0x69);
  const border = isDark ? rgb(0x24, 0x3b, 0x53) : rgb(0xcb, 0xd5, 0xe1);
  const accentHovered = isDark
    ? mixColor(accent, WHITE, 0.14)
    : mixColor(accent, WHITE, 0.10);
  const accentPressed = isDark
    ? mixColor(accent, BLACK, 0.24)
    : mixColor(accent, BLACK, 0.16);
  const selection = withAlpha(accent, isDark ? 0x40 : 0x33);
  const scrollbarTrack = isDark ? rgb(0x12, 0x21, 0x33) : rgb(0xe2, 0xe8, 0xf0);
  const scrollbarThumb = isDark
    ? mixColor(accent, surface, 0.55)
    : mixColor(accent, surface, 0.40);
  const dialogBackdrop = isDark ? rgba(0x00, 0x00, 0x00, 0x24) : rgba(0x00, 0x00, 0x00, 0x18);
  const dialogShadow = isDark ? rgba(0x00, 0x00, 0x00, 0xd8) : rgba(0x00, 0x00, 0x00, 0x88);
  const focusRing = accent;
  const contextMenuPanelBackground = isDark ? rgba(0x18, 0x1d, 0x26, 0xd8) : rgba(0xff, 0xff, 0xff, 0xdc);
  const contextMenuPanelBorderColor = isDark ? rgba(0xff, 0xff, 0xff, 0x10) : rgba(0x0f, 0x17, 0x2a, 0x14);
  const contextMenuPanelShadowColor = isDark ? rgba(0x00, 0x00, 0x00, 0xb0) : rgba(0x0f, 0x17, 0x2a, 0x24);
  const contextMenuItemBackground = rgba(0x00, 0x00, 0x00, 0x00);
  const contextMenuItemHover = isDark ? rgba(0xff, 0xff, 0xff, 0x0c) : rgba(0x0f, 0x17, 0x2a, 0x08);
  const contextMenuSeparatorColor = isDark ? rgba(0xff, 0xff, 0xff, 0x10) : rgba(0x0f, 0x17, 0x2a, 0x12);
  const toolTipPanelBackground = isDark ? rgba(0x11, 0x17, 0x20, 0xf0) : rgba(0xff, 0xff, 0xff, 0xf8);
  const toolTipPanelBorderColor = isDark ? rgba(0xff, 0xff, 0xff, 0x12) : rgba(0x0f, 0x17, 0x2a, 0x12);
  const toolTipPanelShadowColor = isDark ? rgba(0x00, 0x00, 0x00, 0xb8) : rgba(0x0f, 0x17, 0x2a, 0x22);

  return new Theme(
    new Colors(
      background,
      surface,
      textPrimary,
      textMuted,
      accent,
      accentPressed,
      accentHovered,
      border,
      selection,
      scrollbarTrack,
      scrollbarThumb,
      dialogBackdrop,
      dialogShadow,
      focusRing,
    ),
    DEFAULT_SPACING,
    DEFAULT_FONTS,
    new ContextMenuTheme(
      contextMenuPanelBackground,
      contextMenuPanelBorderColor,
      contextMenuPanelShadowColor,
      isDark ? 16.0 : 14.0,
      contextMenuSeparatorColor,
      12.0,
      28.0,
      0.0,
      new ContextMenuItemTheme(
        contextMenuItemBackground,
        contextMenuItemHover,
        textPrimary,
        isDark ? 10.0 : 9.0,
        DEFAULT_FONTS.body,
        DEFAULT_FONTS.bodyFamily,
        13.0,
        30.0,
        12.0,
        6.0,
        12.0,
        6.0,
      ),
    ),
    new ToolTipTheme(
      toolTipPanelBackground,
      toolTipPanelBorderColor,
      toolTipPanelShadowColor,
      isDark ? 12.0 : 10.0,
      textPrimary,
      DEFAULT_FONTS.body,
      DEFAULT_FONTS.bodyFamily,
      13.0,
      280.0,
      10.0,
      7.0,
      10.0,
      7.0,
      10.0,
      24.0,
      0.0,
    ),
  );
}

export const defaultLightTheme = generateTheme(false, DEFAULT_ACCENT_COLOR);
export const defaultDarkTheme = generateTheme(true, DEFAULT_ACCENT_COLOR);

let themeSource: ThemeSource = ThemeSource.System;
let systemDarkMode: bool = true;
let systemAccentColor: u32 = DEFAULT_ACCENT_COLOR;
let currentDarkMode: bool = true;

export const activeTheme = new Signal<Theme>(defaultDarkTheme);

export function bindTheme<Owner>(owner: Owner, handler: SignalHandler<Owner, Theme>): Action<Theme> {
  const action = activeTheme.bind(owner, handler);
  handler(owner, activeTheme.value);
  return action;
}

function applyTheme(theme: Theme, source: ThemeSource, isDark: bool): Theme {
  themeSource = source;
  currentDarkMode = isDark;
  activeTheme.value = theme;
  return theme;
}

function applySystemTheme(): Theme {
  return applyTheme(generateTheme(systemDarkMode, systemAccentColor), ThemeSource.System, systemDarkMode);
}

export function useSystemTheme(): Theme {
  systemDarkMode = ffi.fui_is_dark_mode();
  systemAccentColor = normalizeAccentColor(ffi.fui_get_accent_color());
  return applySystemTheme();
}

export function useCustomTheme(theme: Theme): Theme {
  return applyTheme(theme, ThemeSource.Custom, estimateThemeDark(theme));
}

export function setAccentColor(color: u32): Theme {
  return useCustomTheme(generateTheme(currentDarkMode, color));
}

export function isDarkMode(): bool {
  return currentDarkMode;
}

export function isUsingSystemTheme(): bool {
  return themeSource == ThemeSource.System;
}

export function handleSystemDarkModeChanged(isDark: bool): Theme {
  systemDarkMode = isDark;
  if (themeSource != ThemeSource.System) {
    return activeTheme.value;
  }
  systemAccentColor = normalizeAccentColor(ffi.fui_get_accent_color());
  return applySystemTheme();
}
