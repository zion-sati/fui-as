import {
  Colors,
  ContextMenuItemTheme,
  ContextMenuTheme,
  Fonts,
  Spacing,
  Theme,
  ToolTipTheme,
  generateTheme,
  mixColor,
  rgba,
} from "../../../src/Fui";

function isThemeDark(theme: Theme): bool {
  const background = theme.colors.background;
  const red = (background >>> 24) & 0xff;
  const green = (background >>> 16) & 0xff;
  const blue = (background >>> 8) & 0xff;
  const luminance =
    (<f32>red * 0.2126) +
    (<f32>green * 0.7152) +
    (<f32>blue * 0.0722);
  return luminance < 128.0;
}

function withAlpha(color: u32, alpha: u32): u32 {
  return (color & 0xffffff00) | (alpha & 0xff);
}

export function demoSectionBackground(theme: Theme): u32 {
  return mixColor(theme.colors.surface, theme.colors.background, isThemeDark(theme) ? 0.22 : 0.08);
}

export function demoHeaderBackground(theme: Theme): u32 {
  return mixColor(theme.colors.surface, theme.colors.accent, isThemeDark(theme) ? 0.22 : 0.08);
}

export function demoPanelBackground(theme: Theme): u32 {
  return mixColor(theme.colors.surface, theme.colors.background, isThemeDark(theme) ? 0.12 : 0.03);
}

export function demoPopupPanelBackground(theme: Theme): u32 {
  const tinted = mixColor(theme.colors.surface, theme.colors.accent, isThemeDark(theme) ? 0.16 : 0.05);
  return withAlpha(tinted, 0x99);
}

export function demoCardBackground(theme: Theme): u32 {
  return mixColor(theme.colors.surface, theme.colors.accent, isThemeDark(theme) ? 0.10 : 0.03);
}

export function demoCardBackgroundAlt(theme: Theme): u32 {
  return mixColor(theme.colors.surface, theme.colors.accent, isThemeDark(theme) ? 0.18 : 0.08);
}

export function demoPrimaryText(theme: Theme): u32 {
  return theme.colors.textPrimary;
}

export function demoMutedText(theme: Theme): u32 {
  return theme.colors.textMuted;
}

export function demoSubtleText(theme: Theme): u32 {
  return mixColor(theme.colors.textMuted, theme.colors.surface, isThemeDark(theme) ? 0.0 : 0.10);
}

export function demoDividerColor(theme: Theme): u32 {
  return theme.colors.border;
}

export function demoSurfaceBorder(theme: Theme): u32 {
  return mixColor(theme.colors.border, theme.colors.surface, isThemeDark(theme) ? 0.0 : 0.18);
}

export function demoSurfaceShadow(_theme: Theme): u32 {
  return isThemeDark(_theme) ? rgba(0, 0, 0, 0x58) : rgba(0x0f, 0x17, 0x2a, 0x18);
}

export function demoStrongSurfaceShadow(_theme: Theme): u32 {
  return isThemeDark(_theme) ? rgba(0, 0, 0, 0x68) : rgba(0x0f, 0x17, 0x2a, 0x20);
}

export function demoKeyTargetIdle(theme: Theme): u32 {
  return mixColor(theme.colors.surface, theme.colors.background, isThemeDark(theme) ? 0.18 : 0.06);
}

export function demoKeyTargetFocused(theme: Theme): u32 {
  return mixColor(theme.colors.surface, theme.colors.accent, isThemeDark(theme) ? 0.40 : 0.16);
}

export function demoButtonPrimaryBackground(theme: Theme): u32 {
  return mixColor(theme.colors.accent, theme.colors.surface, isThemeDark(theme) ? 0.04 : 0.10);
}

export function demoScrollbarTrackColor(theme: Theme): u32 {
  return theme.colors.background;
}

export function demoScrollbarThumbColor(theme: Theme): u32 {
  return demoButtonPrimaryBackground(theme);
}

export function demoButtonPrimaryHover(theme: Theme): u32 {
  return mixColor(theme.colors.accentHovered, theme.colors.surface, isThemeDark(theme) ? 0.02 : 0.08);
}

export function demoButtonPrimaryPressed(theme: Theme): u32 {
  return mixColor(theme.colors.accentPressed, theme.colors.surface, isThemeDark(theme) ? 0.0 : 0.06);
}

export function demoButtonSecondaryBackground(theme: Theme): u32 {
  return mixColor(theme.colors.surface, theme.colors.background, isThemeDark(theme) ? 0.26 : 0.06);
}

export function demoButtonSecondaryHover(theme: Theme): u32 {
  return mixColor(theme.colors.surface, theme.colors.accent, isThemeDark(theme) ? 0.16 : 0.08);
}

export function demoButtonSecondaryPressed(theme: Theme): u32 {
  return mixColor(theme.colors.surface, theme.colors.accent, isThemeDark(theme) ? 0.24 : 0.12);
}

export function demoFieldBackground(theme: Theme): u32 {
  return mixColor(theme.colors.surface, theme.colors.background, isThemeDark(theme) ? 0.28 : 0.05);
}

export function demoFieldBorder(theme: Theme): u32 {
  return mixColor(theme.colors.border, theme.colors.accent, isThemeDark(theme) ? 0.16 : 0.08);
}

export function demoPrimaryButtonBorder(theme: Theme): u32 {
  return mixColor(theme.colors.accent, theme.colors.surface, isThemeDark(theme) ? 0.28 : 0.46);
}

export function demoProgressTrack(theme: Theme): u32 {
  return demoSectionBackground(theme);
}

export function demoProgressFill(theme: Theme): u32 {
  return demoButtonPrimaryBackground(theme);
}

export function generateDemoTheme(isDark: bool, accentColor: u32): Theme {
  const base = generateTheme(isDark, accentColor);
  const spacing = new Spacing(6.0, 10.0, 16.0, 24.0, 34.0);
  const fonts = new Fonts(
    base.fonts.body,
    base.fonts.heading,
    16.0,
    26.0,
    base.fonts.mono,
    base.fonts.monoBold,
    15.0,
    base.fonts.bodyFamily,
    base.fonts.headingFamily,
    base.fonts.monoFamily,
  );
  const colors = new Colors(
    mixColor(base.colors.background, base.colors.accent, isDark ? 0.04 : 0.01),
    mixColor(base.colors.surface, base.colors.accent, isDark ? 0.05 : 0.02),
    base.colors.textPrimary,
    base.colors.textMuted,
    base.colors.accent,
    base.colors.accentPressed,
    base.colors.accentHovered,
    mixColor(base.colors.border, base.colors.accent, isDark ? 0.10 : 0.05),
    base.colors.selection,
    demoSectionBackground(base),
    demoButtonPrimaryBackground(base),
    base.colors.dialogBackdrop,
    demoStrongSurfaceShadow(base),
    demoSurfaceShadow(base),
    base.colors.focusRing,
  );

  return new Theme(
    colors,
    spacing,
    fonts,
    new ContextMenuTheme(
      demoPopupPanelBackground(base),
      demoSurfaceBorder(base),
      demoStrongSurfaceShadow(base),
      isDark ? 18.0 : 16.0,
      demoDividerColor(base),
      12.0,
      30.0,
      0.0,
      new ContextMenuItemTheme(
        0x00000000,
        demoSectionBackground(base),
        demoPrimaryText(base),
        isDark ? 12.0 : 10.0,
        fonts.body,
        fonts.bodyFamily,
        14.0,
        36.0,
        14.0,
        8.0,
        14.0,
        8.0,
      ),
    ),
    new ToolTipTheme(
      demoPopupPanelBackground(base),
      demoSurfaceBorder(base),
      demoStrongSurfaceShadow(base),
      isDark ? 14.0 : 12.0,
      demoPrimaryText(base),
      fonts.body,
      fonts.bodyFamily,
      14.0,
      320.0,
      12.0,
      8.0,
      12.0,
      8.0,
      12.0,
      28.0,
      0.0,
    ),
  );
}
