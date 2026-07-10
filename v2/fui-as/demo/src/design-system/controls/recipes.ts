import { Border, BorderStyle, Button, ComboBox, ContextMenu, Dialog, Dropdown, NavLink, ProgressBar, Text, Theme, rgb } from "../../../../src/Fui";
import {
  HEADER_SHADOW_BLUR,
  SURFACE_BORDER_WIDTH,
  SURFACE_RADIUS_SMALL,
  SURFACE_SHADOW_OFFSET_Y,
} from "../tokens";
import {
  demoButtonPrimaryBackground,
  demoButtonPrimaryHover,
  demoButtonPrimaryPressed,
  demoButtonSecondaryBackground,
  demoButtonSecondaryHover,
  demoButtonSecondaryPressed,
  demoFieldBackground,
  demoFieldBorder,
  demoPanelBackground,
  demoPopupPanelBackground,
  demoPrimaryButtonBorder,
  demoPrimaryText,
  demoProgressFill,
  demoProgressTrack,
  demoSectionBackground,
  demoStrongSurfaceShadow,
  demoSurfaceBorder,
} from "../theme";

export enum DemoButtonRecipe {
  Primary = 0,
  Secondary = 1,
}

export class DemoButtonStyle {
  constructor(
    readonly background: u32,
    readonly hoverBackground: u32,
    readonly pressedBackground: u32,
    readonly borderWidth: f32,
    readonly borderColor: u32,
    readonly textColor: u32,
  ) {}
}

export function resolveDemoButtonRecipe(theme: Theme, recipe: DemoButtonRecipe): DemoButtonStyle {
  if (recipe == DemoButtonRecipe.Primary) {
    return new DemoButtonStyle(
      demoButtonPrimaryBackground(theme),
      demoButtonPrimaryHover(theme),
      demoButtonPrimaryPressed(theme),
      SURFACE_BORDER_WIDTH,
      demoPrimaryButtonBorder(theme),
      rgb(0xf8, 0xfb, 0xff),
    );
  }
  return new DemoButtonStyle(
    demoButtonSecondaryBackground(theme),
    demoButtonSecondaryHover(theme),
    demoButtonSecondaryPressed(theme),
    SURFACE_BORDER_WIDTH,
    demoSurfaceBorder(theme),
    demoPrimaryText(theme),
  );
}

export function applyDemoButtonRecipe(button: Button, theme: Theme, recipe: DemoButtonRecipe): void {
  const style = resolveDemoButtonRecipe(theme, recipe);
  button
    .bgColor(style.background)
    .hoverBgColor(style.hoverBackground)
    .pressedBgColor(style.pressedBackground)
    .border(style.borderWidth, style.borderColor)
    .textColor(style.textColor);
}

export enum DemoNavLinkRecipe {
  Inactive = 0,
  Active = 1,
}

export class DemoNavLinkStyle {
  constructor(
    readonly background: u32,
    readonly borderWidth: f32,
    readonly borderColor: u32,
    readonly borderStyle: BorderStyle,
    readonly textColor: u32,
  ) {}
}

export function resolveDemoNavLinkRecipe(theme: Theme, recipe: DemoNavLinkRecipe): DemoNavLinkStyle {
  if (recipe == DemoNavLinkRecipe.Active) {
    return new DemoNavLinkStyle(
      theme.colors.accent,
      SURFACE_BORDER_WIDTH,
      theme.colors.accentHovered,
      BorderStyle.Solid,
      rgb(0xf8, 0xfb, 0xff),
    );
  }
  return new DemoNavLinkStyle(
    demoButtonSecondaryBackground(theme),
    SURFACE_BORDER_WIDTH,
    demoSurfaceBorder(theme),
    BorderStyle.Solid,
    demoPrimaryText(theme),
  );
}

export function applyDemoNavLinkRecipe(link: NavLink, labelNode: Text, theme: Theme, recipe: DemoNavLinkRecipe): void {
  const style = resolveDemoNavLinkRecipe(theme, recipe);
  link
    .bgColor(style.background)
    .borderConfig(new Border(style.borderWidth, style.borderColor, style.borderStyle));
  labelNode.textColor(style.textColor);
}

export enum DemoFieldRecipe {
  Standard = 0,
}

export class DemoFieldStyle {
  constructor(
    readonly background: u32,
    readonly radius: f32,
    readonly borderWidth: f32,
    readonly borderColor: u32,
    readonly borderStyle: BorderStyle,
  ) {}
}

export function resolveDemoFieldRecipe(theme: Theme, _recipe: DemoFieldRecipe = DemoFieldRecipe.Standard): DemoFieldStyle {
  return new DemoFieldStyle(
    demoFieldBackground(theme),
    SURFACE_RADIUS_SMALL,
    SURFACE_BORDER_WIDTH,
    demoFieldBorder(theme),
    BorderStyle.Solid,
  );
}

export enum DemoDropdownRecipe {
  Popup = 0,
}

export class DemoDropdownStyle {
  constructor(
    readonly popupPanelColor: u32,
    readonly popupPanelBackgroundBlur: f32,
  ) {}
}

export function resolveDemoDropdownRecipe(theme: Theme, _recipe: DemoDropdownRecipe = DemoDropdownRecipe.Popup): DemoDropdownStyle {
  return new DemoDropdownStyle(
    demoPopupPanelBackground(theme),
    12.0,
  );
}

export function applyDemoDropdownRecipe(dropdown: Dropdown, theme: Theme, recipe: DemoDropdownRecipe = DemoDropdownRecipe.Popup): void {
  const style = resolveDemoDropdownRecipe(theme, recipe);
  dropdown
    .popupPanelColor(style.popupPanelColor)
    .popupPanelBackgroundBlur(style.popupPanelBackgroundBlur);
}

export function applyDemoComboBoxRecipe(comboBox: ComboBox, theme: Theme, recipe: DemoDropdownRecipe = DemoDropdownRecipe.Popup): void {
  const style = resolveDemoDropdownRecipe(theme, recipe);
  comboBox
    .popupPanelColor(style.popupPanelColor)
    .popupPanelBackgroundBlur(style.popupPanelBackgroundBlur);
}

export enum DemoProgressRecipe {
  Standard = 0,
}

export class DemoProgressStyle {
  constructor(
    readonly trackColor: u32,
    readonly fillColor: u32,
  ) {}
}

export function resolveDemoProgressRecipe(theme: Theme, _recipe: DemoProgressRecipe = DemoProgressRecipe.Standard): DemoProgressStyle {
  return new DemoProgressStyle(
    demoProgressTrack(theme),
    demoProgressFill(theme),
  );
}

export function applyDemoProgressRecipe(progressBar: ProgressBar, theme: Theme, recipe: DemoProgressRecipe = DemoProgressRecipe.Standard): void {
  const style = resolveDemoProgressRecipe(theme, recipe);
  progressBar
    .trackColor(style.trackColor)
    .fillColor(style.fillColor);
}

export enum DemoContextMenuRecipe {
  Popup = 0,
}

export class DemoContextMenuStyle {
  constructor(
    readonly panelColor: u32,
    readonly borderWidth: f32,
    readonly borderColor: u32,
    readonly itemHoverColor: u32,
    readonly separatorColor: u32,
  ) {}
}

export function resolveDemoContextMenuRecipe(theme: Theme, _recipe: DemoContextMenuRecipe = DemoContextMenuRecipe.Popup): DemoContextMenuStyle {
  const borderColor = demoSurfaceBorder(theme);
  return new DemoContextMenuStyle(
    demoPopupPanelBackground(theme),
    SURFACE_BORDER_WIDTH,
    borderColor,
    demoSectionBackground(theme),
    borderColor,
  );
}

export function applyDemoContextMenuRecipe(menu: ContextMenu, theme: Theme, recipe: DemoContextMenuRecipe = DemoContextMenuRecipe.Popup): void {
  const style = resolveDemoContextMenuRecipe(theme, recipe);
  menu
    .panelColor(style.panelColor)
    .panelBorder(style.borderWidth, style.borderColor)
    .itemHoverColor(style.itemHoverColor)
    .separatorColor(style.separatorColor);
}

export enum DemoDialogRecipe {
  Card = 0,
}

export class DemoDialogStyle {
  constructor(
    readonly cardColor: u32,
    readonly borderWidth: f32,
    readonly borderColor: u32,
    readonly shadowColor: u32,
    readonly shadowOffsetY: f32,
    readonly shadowBlur: f32,
    readonly shadowSpread: f32,
  ) {}
}

export function resolveDemoDialogRecipe(theme: Theme, _recipe: DemoDialogRecipe = DemoDialogRecipe.Card): DemoDialogStyle {
  return new DemoDialogStyle(
    demoPanelBackground(theme),
    SURFACE_BORDER_WIDTH,
    demoSurfaceBorder(theme),
    demoStrongSurfaceShadow(theme),
    SURFACE_SHADOW_OFFSET_Y,
    HEADER_SHADOW_BLUR,
    0.0,
  );
}

export function applyDemoDialogRecipe(dialog: Dialog, theme: Theme, recipe: DemoDialogRecipe = DemoDialogRecipe.Card): void {
  const style = resolveDemoDialogRecipe(theme, recipe);
  dialog
    .cardColor(style.cardColor)
    .cardBorder(style.borderWidth, style.borderColor)
    .cardShadow(style.shadowColor, 0.0, style.shadowOffsetY, style.shadowBlur, style.shadowSpread);
}
