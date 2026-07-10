import { Border, BorderStyle, Disposable, FlexBox, Theme, activeTheme, bindTheme, disposeAll } from "../../../src/Fui";
import {
  SURFACE_PANEL_MARGIN,
  SURFACE_BORDER_WIDTH,
  SURFACE_RADIUS_LARGE,
  SURFACE_RADIUS_MEDIUM,
  SURFACE_RADIUS_SMALL,
} from "./tokens";
import {
  demoCardBackground,
  demoCardBackgroundAlt,
  demoKeyTargetFocused,
  demoKeyTargetIdle,
  demoSectionBackground,
  demoSurfaceBorder,
  demoSurfaceShadow,
} from "./theme";

export enum DemoSurfaceRecipe {
  PageShell = 0,
  SectionPanel = 1,
  InsetPanel = 2,
  FlatFrame = 3,
  ListRow = 4,
  ListRowAlt = 5,
  CalloutInset = 6,
  AccentBadge = 7,
  AccentSwatch = 8,
  Divider = 9,
  KeyTargetIdle = 10,
  KeyTargetFocused = 11,
}

export class DemoSurfaceStyle {
  constructor(
    readonly background: u32,
    readonly radius: f32,
    readonly borderWidth: f32,
    readonly borderColor: u32,
    readonly borderStyle: BorderStyle,
    readonly margin: f32,
    readonly shadowColor: u32,
    readonly shadowOffsetX: f32,
    readonly shadowOffsetY: f32,
    readonly shadowBlur: f32,
    readonly shadowSpread: f32,
  ) {}
}

type DemoSurfaceResolver = (theme: Theme) => DemoSurfaceStyle;

const SURFACE_RECIPE_BORDERLESS_RADIUS: f32 = 999.0;
const FIRST_STATEFUL_DEMO_SURFACE_RECIPE: i32 = DemoSurfaceRecipe.KeyTargetIdle;

function createDemoSurfaceStyle(
  theme: Theme,
  background: u32 = theme.colors.background,
  radius: f32 = SURFACE_RADIUS_MEDIUM,
  borderWidth: f32 = SURFACE_BORDER_WIDTH,
  borderColor: u32 = demoSurfaceBorder(theme),
  borderStyle: BorderStyle = BorderStyle.Solid,
  margin: f32 = 0.0,
  shadowColor: u32 = 0x00000000,
  shadowOffsetX: f32 = 0.0,
  shadowOffsetY: f32 = 0.0,
  shadowBlur: f32 = 0.0,
  shadowSpread: f32 = 0.0,
): DemoSurfaceStyle {
  return new DemoSurfaceStyle(
    background,
    radius,
    borderWidth,
    borderColor,
    borderStyle,
    margin,
    shadowColor,
    shadowOffsetX,
    shadowOffsetY,
    shadowBlur,
    shadowSpread,
  );
}

function resolvePageShellSurface(theme: Theme): DemoSurfaceStyle {
  return createDemoSurfaceStyle(
    theme,
    theme.colors.background,
    SURFACE_RADIUS_LARGE,
    SURFACE_BORDER_WIDTH,
    demoSurfaceBorder(theme),
    BorderStyle.Solid,
    0.0,
    demoSurfaceShadow(theme),
    0.0,
    4.0,
    14.0,
  );
}

function resolveSectionPanelSurface(theme: Theme): DemoSurfaceStyle {
  return createDemoSurfaceStyle(
    theme,
    theme.colors.background,
    SURFACE_RADIUS_MEDIUM,
    SURFACE_BORDER_WIDTH,
    demoSurfaceBorder(theme),
    BorderStyle.Solid,
    SURFACE_PANEL_MARGIN,
    demoSurfaceShadow(theme),
    0.0,
    2.0,
    10.0,
  );
}

function resolveInsetPanelSurface(theme: Theme): DemoSurfaceStyle {
  return createDemoSurfaceStyle(theme, theme.colors.background, SURFACE_RADIUS_SMALL);
}

function resolveFlatFrameSurface(theme: Theme): DemoSurfaceStyle {
  return createDemoSurfaceStyle(theme, theme.colors.background, 0.0);
}

function resolveListRowSurface(theme: Theme): DemoSurfaceStyle {
  return createDemoSurfaceStyle(theme, demoCardBackground(theme), SURFACE_RADIUS_SMALL);
}

function resolveListRowAltSurface(theme: Theme): DemoSurfaceStyle {
  return createDemoSurfaceStyle(theme, demoCardBackgroundAlt(theme), SURFACE_RADIUS_SMALL);
}

function resolveCalloutInsetSurface(theme: Theme): DemoSurfaceStyle {
  return createDemoSurfaceStyle(theme, demoCardBackgroundAlt(theme), SURFACE_RADIUS_SMALL);
}

function resolveAccentBadgeSurface(theme: Theme): DemoSurfaceStyle {
  return createDemoSurfaceStyle(
    theme,
    theme.colors.accent,
    SURFACE_RECIPE_BORDERLESS_RADIUS,
    0.0,
    0x00000000,
  );
}

function resolveAccentSwatchSurface(theme: Theme): DemoSurfaceStyle {
  return createDemoSurfaceStyle(theme, theme.colors.accent);
}

function resolveDividerSurface(theme: Theme): DemoSurfaceStyle {
  return createDemoSurfaceStyle(
    theme,
    demoSectionBackground(theme),
    SURFACE_RECIPE_BORDERLESS_RADIUS,
    0.0,
    0x00000000,
  );
}

function resolveKeyTargetIdleSurface(theme: Theme): DemoSurfaceStyle {
  return createDemoSurfaceStyle(theme, demoKeyTargetIdle(theme), SURFACE_RADIUS_SMALL);
}

function resolveKeyTargetFocusedSurface(theme: Theme): DemoSurfaceStyle {
  return createDemoSurfaceStyle(theme, demoKeyTargetFocused(theme), SURFACE_RADIUS_SMALL);
}

const STATIC_DEMO_SURFACE_RECIPE_RESOLVERS: Array<DemoSurfaceResolver> = [
  resolvePageShellSurface,
  resolveSectionPanelSurface,
  resolveInsetPanelSurface,
  resolveFlatFrameSurface,
  resolveListRowSurface,
  resolveListRowAltSurface,
  resolveCalloutInsetSurface,
  resolveAccentBadgeSurface,
  resolveAccentSwatchSurface,
  resolveDividerSurface,
];

const STATEFUL_DEMO_SURFACE_RECIPE_RESOLVERS: Array<DemoSurfaceResolver> = [
  resolveKeyTargetIdleSurface,
  resolveKeyTargetFocusedSurface,
];

export function isStatefulDemoSurfaceRecipe(recipe: DemoSurfaceRecipe): bool {
  return recipe >= FIRST_STATEFUL_DEMO_SURFACE_RECIPE;
}

function resolveDemoSurfaceRecipeFromRegistry(
  theme: Theme,
  recipeIndex: i32,
  resolvers: Array<DemoSurfaceResolver>,
): DemoSurfaceStyle {
  if (recipeIndex < 0 || recipeIndex >= resolvers.length) {
    return createDemoSurfaceStyle(theme);
  }
  return unchecked(resolvers[recipeIndex])(theme);
}

export function resolveDemoSurfaceRecipe(theme: Theme, recipe: DemoSurfaceRecipe): DemoSurfaceStyle {
  if (isStatefulDemoSurfaceRecipe(recipe)) {
    return resolveDemoSurfaceRecipeFromRegistry(
      theme,
      recipe - FIRST_STATEFUL_DEMO_SURFACE_RECIPE,
      STATEFUL_DEMO_SURFACE_RECIPE_RESOLVERS,
    );
  }
  return resolveDemoSurfaceRecipeFromRegistry(
    theme,
    recipe,
    STATIC_DEMO_SURFACE_RECIPE_RESOLVERS,
  );
}

export function demoSurfaceColor(theme: Theme, recipe: DemoSurfaceRecipe): u32 {
  return resolveDemoSurfaceRecipe(theme, recipe).background;
}

export function applyDemoSurfaceRecipe(
  surface: FlexBox,
  theme: Theme,
  recipe: DemoSurfaceRecipe = DemoSurfaceRecipe.SectionPanel,
): void {
  const style = resolveDemoSurfaceRecipe(theme, recipe);
  surface
    .bgColor(style.background)
    .cornerRadius(style.radius)
    .borderConfig(new Border(style.borderWidth, style.borderColor, style.borderStyle))
    .margin(style.margin)
    .dropShadow(style.shadowColor, style.shadowOffsetX, style.shadowOffsetY, style.shadowBlur, style.shadowSpread);
}

export class DemoSurface extends FlexBox {
  private readonly themeBindings: Array<Disposable> = new Array<Disposable>();
  private demoThemeDisposed: bool = false;

  constructor(
    private recipeValue: DemoSurfaceRecipe = DemoSurfaceRecipe.SectionPanel,
  ) {
    super();
    this.trackDemoTheme(bindTheme(this, (surface, theme): void => {
      surface.applyDemoTheme(theme);
    }));
  }

  recipe(next: DemoSurfaceRecipe): this {
    this.recipeValue = next;
    this.applyDemoTheme(activeTheme.value);
    return this;
  }

  dispose(): void {
    this.disposeDemoThemeBindings();
    super.dispose();
  }

  private applyDemoTheme(theme: Theme): void {
    applyDemoSurfaceRecipe(this, theme, this.recipeValue);
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
