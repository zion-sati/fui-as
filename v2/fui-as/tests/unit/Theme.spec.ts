import { rgb } from "../../src/color";
import { __fui_on_system_dark_mode_changed } from "../../src/core/event_exports";
import {
  activeTheme,
  bindTheme,
  defaultDarkTheme,
  defaultLightTheme,
  generateTheme,
  isDarkMode,
  isUsingSystemTheme,
  setAccentColor,
  useCustomTheme,
  useSystemTheme,
} from "../../src/core/Theme";

class ThemeObserver {
  count: i32 = 0;
  lastAccent: u32 = 0;
  lastBackground: u32 = 0;
}

describe("Theme", () => {
  afterEach(() => {
    useCustomTheme(defaultDarkTheme);
  });

  it("uses the host system theme when requested", () => {
    useSystemTheme();

    expect<bool>(isUsingSystemTheme()).toBe(true);
    expect<bool>(isDarkMode()).toBe(false);
    expect<u32>(activeTheme.value.colors.background).toBe(defaultLightTheme.colors.background);
    expect<u32>(activeTheme.value.colors.accent).toBe(0x2563ebff);
  });

  it("updates the system theme when dark mode changes", () => {
    useSystemTheme();
    __fui_on_system_dark_mode_changed(true);

    expect<bool>(isUsingSystemTheme()).toBe(true);
    expect<bool>(isDarkMode()).toBe(true);
    expect<u32>(activeTheme.value.colors.background).toBe(defaultDarkTheme.colors.background);
  });

  it("ignores system dark mode changes while a custom theme is active", () => {
    const customAccent = rgb(0xea, 0x58, 0x0c);
    useCustomTheme(generateTheme(true, customAccent));

    __fui_on_system_dark_mode_changed(false);

    expect<bool>(isUsingSystemTheme()).toBe(false);
    expect<bool>(isDarkMode()).toBe(true);
    expect<u32>(activeTheme.value.colors.accent).toBe(customAccent);
    expect<u32>(activeTheme.value.colors.background).toBe(defaultDarkTheme.colors.background);
  });

  it("setAccentColor creates a custom theme using the current mode", () => {
    const customAccent = rgb(0xdb, 0x27, 0x77);
    useSystemTheme();

    setAccentColor(customAccent);

    expect<bool>(isUsingSystemTheme()).toBe(false);
    expect<bool>(isDarkMode()).toBe(false);
    expect<u32>(activeTheme.value.colors.accent).toBe(customAccent);
    expect<u32>(activeTheme.value.colors.background).toBe(defaultLightTheme.colors.background);
  });

  it("bindTheme immediately applies the current theme to the owner", () => {
    const owner = new ThemeObserver();

    bindTheme(owner, (target: ThemeObserver, theme): void => {
      target.count += 1;
      target.lastAccent = theme.colors.accent;
      target.lastBackground = theme.colors.background;
    });

    expect<i32>(owner.count).toBe(1);
    expect<u32>(owner.lastAccent).toBe(activeTheme.value.colors.accent);
    expect<u32>(owner.lastBackground).toBe(activeTheme.value.colors.background);
  });

  it("bindTheme returns a disposable subscription that stops after dispose", () => {
    const owner = new ThemeObserver();
    const firstAccent = rgb(0xdb, 0x27, 0x77);
    const secondAccent = rgb(0x0f, 0x76, 0xe4);

    const action = bindTheme(owner, (target: ThemeObserver, theme): void => {
      target.count += 1;
      target.lastAccent = theme.colors.accent;
    });

    setAccentColor(firstAccent);
    expect<i32>(owner.count).toBe(2);
    expect<u32>(owner.lastAccent).toBe(firstAccent);

    action.dispose();
    setAccentColor(secondAccent);
    expect<i32>(owner.count).toBe(2);
    expect<u32>(owner.lastAccent).toBe(firstAccent);
  });

  it("exposes a dedicated context menu theme with smaller native-like typography", () => {
    const theme = generateTheme(true, rgb(0x25, 0x63, 0xeb));

    expect<f32>(theme.contextMenu.item.fontSize).toBe(13.0);
    expect<f32>(theme.contextMenu.item.height).toBe(30.0);
    expect<u32>(theme.contextMenu.panelShadowColor).not.toBe(0);
  });

  it("exposes a dedicated tooltip theme with timing-friendly popup sizing defaults", () => {
    const theme = generateTheme(true, rgb(0x25, 0x63, 0xeb));

    expect<f32>(theme.toolTip.fontSize).toBe(13.0);
    expect<f32>(theme.toolTip.maxWidth).toBe(280.0);
    expect<u32>(theme.toolTip.panelBackground).not.toBe(0);
  });

  it("exposes a focus ring token in both light and dark themes", () => {
    const light = generateTheme(false, rgb(0x25, 0x63, 0xeb));
    const dark = generateTheme(true, rgb(0x25, 0x63, 0xeb));

    expect<u32>(light.colors.focusRing).not.toBe(0);
    expect<u32>(dark.colors.focusRing).not.toBe(0);
  });

  it("exposes a bundled mono family without changing the default body stacks", () => {
    const theme = generateTheme(true, rgb(0x25, 0x63, 0xeb));

    expect<u32>(theme.fonts.body).toBe(1);
    expect<u32>(theme.fonts.heading).toBe(2);
    expect<u32>(theme.fonts.mono).toBe(5);
    expect<u32>(theme.fonts.monoBold).toBe(6);
    expect<f32>(theme.fonts.sizeMono).toBe(15.0);
    expect<u32>(theme.fonts.monoFamily.resolve()).toBe(5);
    expect<u32>(theme.fonts.monoFamily.resolve(700)).toBe(6);
  });
});
