import { rgb } from "../../src/color";
import { PointerEventType, TextVerticalAlign } from "../../src/core/ffi";
import { defaultDarkTheme, useCustomTheme } from "../../src/core/Theme";
import { ScrollBar, ScrollState } from "../../src/nodes";
import { DemoButton, DemoDropdown, DemoDropdownItem, DemoNavLink, DemoTextInput } from "../../demo/src/design-system/controls";
import {
  DemoButtonRecipe,
  DemoContextMenuRecipe,
  DemoDialogRecipe,
  DemoDropdownRecipe,
  DemoFieldRecipe,
  DemoNavLinkRecipe,
  DemoProgressRecipe,
  resolveDemoButtonRecipe,
  resolveDemoContextMenuRecipe,
  resolveDemoDialogRecipe,
  resolveDemoDropdownRecipe,
  resolveDemoFieldRecipe,
  resolveDemoNavLinkRecipe,
  resolveDemoProgressRecipe,
} from "../../demo/src/design-system/controls";
import {
  DemoScrollBarRecipe,
  DemoScrollBox,
  applyDemoScrollBarTheme,
  configureDemoScrollBar,
  resolveDemoScrollBarRecipe,
} from "../../demo/src/design-system/scrollbar";
import {
  DemoSurface,
  DemoSurfaceRecipe,
  demoSurfaceColor,
  isStatefulDemoSurfaceRecipe,
  resolveDemoSurfaceRecipe,
} from "../../demo/src/design-system/surfaces";
import { DemoText, DemoTextRecipe, demoTextRecipeColor, resolveDemoTextRecipe } from "../../demo/src/design-system/text";
import {
  demoButtonPrimaryBackground,
  demoButtonSecondaryBackground,
  demoButtonSecondaryHover,
  demoFieldBackground,
  demoFieldBorder,
  demoPanelBackground,
  demoPopupPanelBackground,
  demoPrimaryButtonBorder,
  demoProgressFill,
  demoProgressTrack,
  demoScrollbarThumbColor,
  demoScrollbarTrackColor,
  demoSectionBackground,
  demoStrongSurfaceShadow,
  generateDemoTheme,
  demoSurfaceBorder,
} from "../../demo/src/design-system/theme";
import {
  HEADER_SHADOW_BLUR,
  NAV_LINK_RADIUS,
  SCROLLBAR_THUMB_WIDTH,
  SCROLLBAR_TRACK_WIDTH,
  SURFACE_PANEL_MARGIN,
  SURFACE_BORDER_WIDTH,
  SURFACE_RADIUS_SMALL,
  SURFACE_SHADOW_OFFSET_Y,
} from "../../demo/src/design-system/tokens";
import {
  CALL_SET_BACKGROUND_COLOR,
  CALL_SET_BOX_STYLE,
  CALL_SET_MARGIN,
  CALL_SET_TEXT_COLOR,
  CALL_SET_TEXT_OVERFLOW_FADE,
  CALL_SET_TEXT_VERTICAL_ALIGN,
  CALL_SET_WIDTH,
  findCall,
  getCallArg,
  getCallCount,
  getCallSequence,
  resetCalls,
} from "./FfiTestImports";

function lastBackgroundColorCall(): u32 {
  const sequence = getCallSequence();
  for (let i = sequence.length - 1; i >= 0; --i) {
    const op = unchecked(sequence[i]);
    if (op == CALL_SET_BACKGROUND_COLOR || op == CALL_SET_BOX_STYLE) {
      return <u32>getCallArg(i, 1);
    }
  }
  unreachable();
  return 0;
}

describe("Demo design system", () => {
  afterEach(() => {
    useCustomTheme(defaultDarkTheme);
  });

  it("configures shared demo scrollbar chrome", () => {
    const theme = generateDemoTheme(false, rgb(0x25, 0x63, 0xeb));
    useCustomTheme(theme);
    resetCalls();

    const scrollBar = new ScrollBar(new ScrollState());
    configureDemoScrollBar(scrollBar);
    applyDemoScrollBarTheme(scrollBar, theme);
    scrollBar.render().build();

    let foundTrackWidth = false;
    let foundThumbWidth = false;
    let foundTrackStyle = false;
    let foundThumbStyle = false;
    const callCount = getCallCount();
    const sequence = getCallSequence();
    for (let index = 0; index < callCount; index += 1) {
      const op = unchecked(sequence[index]);
      if (op == CALL_SET_WIDTH) {
        const width = getCallArg(index, 1);
        if (width == SCROLLBAR_TRACK_WIDTH) {
          foundTrackWidth = true;
        }
        if (width == SCROLLBAR_THUMB_WIDTH) {
          foundThumbWidth = true;
        }
      }
      if (op != CALL_SET_BOX_STYLE) {
        continue;
      }
      const background = <u32>getCallArg(index, 1);
      const radius = getCallArg(index, 2);
      if (background == demoScrollbarTrackColor(theme) && radius == SCROLLBAR_TRACK_WIDTH * 0.5) {
        foundTrackStyle = true;
      }
      if (background == demoScrollbarThumbColor(theme) && radius == SCROLLBAR_THUMB_WIDTH * 0.5) {
        foundThumbStyle = true;
      }
    }

    expect<bool>(foundTrackWidth).toBe(true);
    expect<bool>(foundThumbWidth).toBe(true);
    expect<bool>(foundTrackStyle).toBe(true);
    expect<bool>(foundThumbStyle).toBe(true);
  });

  it("styles demo nav links with rounded pill chrome", () => {
    const theme = generateDemoTheme(false, rgb(0xdb, 0x27, 0x77));
    useCustomTheme(theme);
    resetCalls();

    new DemoNavLink("/docs", "Docs").build();

    let foundRoundedLinkChrome = false;
    const callCount = getCallCount();
    const sequence = getCallSequence();
    for (let index = 0; index < callCount; index += 1) {
      if (unchecked(sequence[index]) != CALL_SET_BOX_STYLE) {
        continue;
      }
      if (
        <u32>getCallArg(index, 1) == demoButtonSecondaryBackground(theme) &&
        getCallArg(index, 2) == NAV_LINK_RADIUS &&
        getCallArg(index, 6) == SURFACE_BORDER_WIDTH
      ) {
        foundRoundedLinkChrome = true;
        break;
      }
    }

    expect<bool>(foundRoundedLinkChrome).toBe(true);
  });

  it("styles themed demo surfaces and text from shared primitives", () => {
    const theme = generateDemoTheme(false, rgb(0x25, 0x63, 0xeb));
    useCustomTheme(theme);
    resetCalls();

    const scrollBox = new DemoScrollBox(new ScrollState());
    scrollBox.child(
      new DemoSurface(DemoSurfaceRecipe.CalloutInset)
        .child(new DemoText("Muted helper text", DemoTextRecipe.Hint)),
    );
    scrollBox.build();

    let foundSurfaceStyle = false;
    let foundTextColor = false;
    const expectedSurface = resolveDemoSurfaceRecipe(theme, DemoSurfaceRecipe.CalloutInset);
    const expectedText = resolveDemoTextRecipe(theme, DemoTextRecipe.Hint);
    const callCount = getCallCount();
    const sequence = getCallSequence();
    for (let index = 0; index < callCount; index += 1) {
      const op = unchecked(sequence[index]);
      if (op == CALL_SET_BOX_STYLE) {
        if (
          <u32>getCallArg(index, 1) == demoSurfaceColor(theme, DemoSurfaceRecipe.CalloutInset) &&
          getCallArg(index, 2) == expectedSurface.radius
        ) {
          foundSurfaceStyle = true;
        }
        continue;
      }
      if (op == CALL_SET_TEXT_COLOR && <u32>getCallArg(index, 1) == demoTextRecipeColor(theme, DemoTextRecipe.Hint)) {
        foundTextColor = true;
      }
    }

    expect<bool>(foundSurfaceStyle).toBe(true);
    expect<bool>(foundTextColor).toBe(true);
    expect<u32>(expectedText.color).toBe(demoTextRecipeColor(theme, DemoTextRecipe.Hint));
  });

  it("keeps section panels lightly shadowed through the recipe resolver", () => {
    const theme = generateDemoTheme(false, rgb(0x25, 0x63, 0xeb));
    const panel = resolveDemoSurfaceRecipe(theme, DemoSurfaceRecipe.SectionPanel);
    const shell = resolveDemoSurfaceRecipe(theme, DemoSurfaceRecipe.PageShell);

    expect<f32>(panel.margin).toBe(SURFACE_PANEL_MARGIN);
    expect<u32>(panel.shadowColor).not.toBe(0);
    expect<f32>(panel.shadowBlur).toBeGreaterThan(0.0);
    expect<u32>(shell.shadowColor).not.toBe(0);
    expect<f32>(shell.shadowBlur).toBeGreaterThan(panel.shadowBlur);
  });

  it("applies demo panel margins and text fades through shared primitives", () => {
    const theme = generateDemoTheme(false, rgb(0x25, 0x63, 0xeb));
    useCustomTheme(theme);
    resetCalls();

    const surface = new DemoSurface(DemoSurfaceRecipe.SectionPanel);
    surface.child(new DemoText("Overflow helper text", DemoTextRecipe.Hint));
    new DemoScrollBox(new ScrollState()).child(surface).build();

    const marginIndex = findCall(CALL_SET_MARGIN);
    expect<i32>(marginIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(marginIndex, 1)).toBe(SURFACE_PANEL_MARGIN);
    expect<f64>(getCallArg(marginIndex, 2)).toBe(SURFACE_PANEL_MARGIN);
    expect<f64>(getCallArg(marginIndex, 3)).toBe(SURFACE_PANEL_MARGIN);
    expect<f64>(getCallArg(marginIndex, 4)).toBe(SURFACE_PANEL_MARGIN);

    const fadeIndex = findCall(CALL_SET_TEXT_OVERFLOW_FADE);
    expect<i32>(fadeIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(fadeIndex, 1)).toBe(1.0);
    expect<f64>(getCallArg(fadeIndex, 2)).toBe(1.0);
  });

  it("centers single-line field text and fades clipped dropdown labels", () => {
    const theme = generateDemoTheme(false, rgb(0x25, 0x63, 0xeb));
    useCustomTheme(theme);

    resetCalls();
    const dropdown = new DemoDropdown()
      .items([
        new DemoDropdownItem("normal", "Visibility: Normal - keep layout reserved and content rendered"),
        new DemoDropdownItem("hidden", "Visibility: Hidden - keep layout reserved but stop painting content"),
      ])
      .width(220.0);
    dropdown.build();

    let fadeIndex = findCall(CALL_SET_TEXT_OVERFLOW_FADE);
    expect<i32>(fadeIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(fadeIndex, 1)).toBe(1.0);
    expect<f64>(getCallArg(fadeIndex, 2)).toBe(0.0);
    dropdown.dispose();

    resetCalls();
    const input = new DemoTextInput()
      .placeholder("Type here")
      .width(220.0);
    input.build();

    const verticalAlignIndex = findCall(CALL_SET_TEXT_VERTICAL_ALIGN);
    expect<i32>(verticalAlignIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(verticalAlignIndex, 1)).toBe(<f64>TextVerticalAlign.Center);
    input.dispose();
  });

  it("splits surface recipes into static and stateful registries", () => {
    const theme = generateDemoTheme(false, rgb(0x25, 0x63, 0xeb));
    const divider = resolveDemoSurfaceRecipe(theme, DemoSurfaceRecipe.Divider);
    const focusedKeyTarget = resolveDemoSurfaceRecipe(theme, DemoSurfaceRecipe.KeyTargetFocused);

    expect<bool>(isStatefulDemoSurfaceRecipe(DemoSurfaceRecipe.Divider)).toBe(false);
    expect<bool>(isStatefulDemoSurfaceRecipe(DemoSurfaceRecipe.KeyTargetFocused)).toBe(true);
    expect<f32>(divider.borderWidth).toBe(0.0);
    expect<f32>(focusedKeyTarget.radius).toBe(SURFACE_RADIUS_SMALL);
  });

  it("resolves control chrome through shared recipes", () => {
    const theme = generateDemoTheme(false, rgb(0xdb, 0x27, 0x77));

    const primaryButton = resolveDemoButtonRecipe(theme, DemoButtonRecipe.Primary);
    const inactiveNavLink = resolveDemoNavLinkRecipe(theme, DemoNavLinkRecipe.Inactive);
    const field = resolveDemoFieldRecipe(theme, DemoFieldRecipe.Standard);
    const dropdown = resolveDemoDropdownRecipe(theme, DemoDropdownRecipe.Popup);
    const progress = resolveDemoProgressRecipe(theme, DemoProgressRecipe.Standard);
    const scrollBar = resolveDemoScrollBarRecipe(theme, DemoScrollBarRecipe.Panel, theme.colors.background);
    const contextMenu = resolveDemoContextMenuRecipe(theme, DemoContextMenuRecipe.Popup);
    const dialog = resolveDemoDialogRecipe(theme, DemoDialogRecipe.Card);

    expect<u32>(primaryButton.background).toBe(demoButtonPrimaryBackground(theme));
    expect<u32>(primaryButton.borderColor).toBe(demoPrimaryButtonBorder(theme));
    expect<u32>(inactiveNavLink.background).toBe(demoButtonSecondaryBackground(theme));
    expect<f32>(inactiveNavLink.borderWidth).toBe(SURFACE_BORDER_WIDTH);
    expect<u32>(field.background).toBe(demoFieldBackground(theme));
    expect<u32>(field.borderColor).toBe(demoFieldBorder(theme));
    expect<f32>(field.radius).toBe(SURFACE_RADIUS_SMALL);
    expect<u32>(dropdown.popupPanelColor).toBe(demoPopupPanelBackground(theme));
    expect<u32>(progress.trackColor).toBe(demoProgressTrack(theme));
    expect<u32>(progress.fillColor).toBe(demoProgressFill(theme));
    expect<u32>(scrollBar.trackColor).toBe(theme.colors.background);
    expect<u32>(scrollBar.thumbColor).toBe(demoScrollbarThumbColor(theme));
    expect<u32>(contextMenu.itemHoverColor).toBe(demoSectionBackground(theme));
    expect<u32>(contextMenu.borderColor).toBe(demoSurfaceBorder(theme));
    expect<u32>(dialog.cardColor).toBe(demoPanelBackground(theme));
    expect<u32>(dialog.shadowColor).toBe(demoStrongSurfaceShadow(theme));
    expect<f32>(dialog.shadowOffsetY).toBe(SURFACE_SHADOW_OFFSET_Y);
    expect<f32>(dialog.shadowBlur).toBe(HEADER_SHADOW_BLUR);
  });

  it("keeps secondary demo button fills stable across theme updates and hover churn", () => {
    const lightTheme = generateDemoTheme(false, rgb(0x25, 0x63, 0xeb));
    useCustomTheme(lightTheme);
    resetCalls();

    const button = new DemoButton("Set calm preview");
    button.build();
    expect<u32>(lastBackgroundColorCall()).toBe(demoButtonSecondaryBackground(lightTheme));

    const darkTheme = generateDemoTheme(true, rgb(0xdb, 0x27, 0x77));
    resetCalls();
    useCustomTheme(darkTheme);
    expect<u32>(lastBackgroundColorCall()).toBe(demoButtonSecondaryBackground(darkTheme));

    resetCalls();
    button._handlePointerEvent(PointerEventType.Enter, 12.0, 24.0, 0);
    expect<u32>(lastBackgroundColorCall()).toBe(demoButtonSecondaryHover(darkTheme));

    resetCalls();
    button._handlePointerEvent(PointerEventType.Leave, 12.0, 24.0, 0);
    expect<u32>(lastBackgroundColorCall()).toBe(demoButtonSecondaryBackground(darkTheme));

    button.dispose();
    button.dispose();
  });

  it("resolves accent and error text recipes for dynamic status styling", () => {
    const theme = generateDemoTheme(false, rgb(0x25, 0x63, 0xeb));

    expect<u32>(demoTextRecipeColor(theme, DemoTextRecipe.Accent)).toBe(theme.colors.accent);
    expect<u32>(demoTextRecipeColor(theme, DemoTextRecipe.Error)).toBe(theme.colors.accentPressed);
  });
});
