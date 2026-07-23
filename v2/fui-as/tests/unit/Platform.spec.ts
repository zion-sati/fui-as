import { KeyModifier } from "../../src/core/ffi";
import {
  formatPrimaryShortcutLabel,
  formatRedoShortcutLabel,
  formatShortcutLabel,
  formatUndoShortcutLabel,
  hasDocumentBoundaryModifier,
  hasLineBoundaryModifier,
  hasPrimaryShortcutModifier,
  hasWordNavigationModifier,
  getHostContext,
  getHostEnvironment,
  hasHostCapability,
  HostCapability,
  HostContext,
  HostEnvironment,
  isCoarsePointer,
  isRedoShortcut,
  isUndoShortcut,
  PlatformFamily,
  resolveDocumentBoundaryModifier,
  resolveLineBoundaryModifier,
  resolvePrimaryShortcutModifier,
  resolveWordNavigationModifier,
} from "../../src/core/Platform";
import { setCoarsePointer } from "./FfiTestImports";

describe("Platform", () => {
  it("uses Meta as the primary shortcut modifier on Apple platforms", () => {
    expect<u32>(resolvePrimaryShortcutModifier(PlatformFamily.Apple)).toBe(KeyModifier.Meta);
    expect<bool>(hasPrimaryShortcutModifier(KeyModifier.Meta, PlatformFamily.Apple)).toBe(true);
    expect<bool>(hasPrimaryShortcutModifier(KeyModifier.Ctrl, PlatformFamily.Apple)).toBe(false);
  });

  it("uses Control as the primary shortcut modifier on non-Apple platforms", () => {
    expect<u32>(resolvePrimaryShortcutModifier(PlatformFamily.Windows)).toBe(KeyModifier.Ctrl);
    expect<u32>(resolvePrimaryShortcutModifier(PlatformFamily.Linux)).toBe(KeyModifier.Ctrl);
    expect<bool>(hasPrimaryShortcutModifier(KeyModifier.Ctrl, PlatformFamily.Windows)).toBe(true);
    expect<bool>(hasPrimaryShortcutModifier(KeyModifier.Meta, PlatformFamily.Windows)).toBe(false);
  });

  it("maps word and document navigation modifiers per platform", () => {
    expect<u32>(resolveWordNavigationModifier(PlatformFamily.Apple)).toBe(KeyModifier.Alt);
    expect<u32>(resolveWordNavigationModifier(PlatformFamily.Windows)).toBe(KeyModifier.Ctrl);
    expect<bool>(hasWordNavigationModifier(KeyModifier.Alt, PlatformFamily.Apple)).toBe(true);
    expect<bool>(hasWordNavigationModifier(KeyModifier.Ctrl, PlatformFamily.Apple)).toBe(false);
    expect<u32>(resolveDocumentBoundaryModifier(PlatformFamily.Apple)).toBe(KeyModifier.Meta);
    expect<u32>(resolveDocumentBoundaryModifier(PlatformFamily.Windows)).toBe(KeyModifier.Ctrl);
    expect<bool>(hasDocumentBoundaryModifier(KeyModifier.Meta, PlatformFamily.Apple)).toBe(true);
    expect<bool>(hasDocumentBoundaryModifier(KeyModifier.Ctrl, PlatformFamily.Windows)).toBe(true);
  });

  it("maps line boundary and redo shortcuts per platform", () => {
    expect<u32>(resolveLineBoundaryModifier(PlatformFamily.Apple)).toBe(KeyModifier.Meta);
    expect<u32>(resolveLineBoundaryModifier(PlatformFamily.Windows)).toBe(0);
    expect<bool>(hasLineBoundaryModifier(KeyModifier.Meta, PlatformFamily.Apple)).toBe(true);
    expect<bool>(hasLineBoundaryModifier(KeyModifier.Ctrl, PlatformFamily.Windows)).toBe(false);
    expect<bool>(isUndoShortcut("z", KeyModifier.Meta, PlatformFamily.Apple)).toBe(true);
    expect<bool>(isRedoShortcut("z", KeyModifier.Meta | KeyModifier.Shift, PlatformFamily.Apple)).toBe(true);
    expect<bool>(isRedoShortcut("y", KeyModifier.Meta, PlatformFamily.Apple)).toBe(false);
    expect<bool>(isRedoShortcut("y", KeyModifier.Ctrl, PlatformFamily.Windows)).toBe(true);
    expect<bool>(isRedoShortcut("z", KeyModifier.Ctrl | KeyModifier.Shift, PlatformFamily.Windows)).toBe(true);
  });

  it("formats Apple shortcut labels with native glyphs", () => {
    expect<string>(formatUndoShortcutLabel(PlatformFamily.Apple)).toBe("⌘Z");
    expect<string>(formatRedoShortcutLabel(PlatformFamily.Apple)).toBe("⇧⌘Z");
    expect<string>(formatShortcutLabel("ArrowLeft", KeyModifier.Alt, PlatformFamily.Apple)).toBe("⌥←");
  });

  it("formats non-Apple shortcut labels with modifier names", () => {
    expect<string>(formatPrimaryShortcutLabel("a", PlatformFamily.Windows)).toBe("Ctrl+A");
    expect<string>(formatRedoShortcutLabel(PlatformFamily.Windows)).toBe("Ctrl+Y");
    expect<string>(formatShortcutLabel("ArrowRight", KeyModifier.Alt, PlatformFamily.Windows)).toBe("Alt+Right");
  });

  it("reports coarse-pointer capability from the host", () => {
    setCoarsePointer(false);
    expect<bool>(isCoarsePointer()).toBe(false);

    setCoarsePointer(true);
    expect<bool>(isCoarsePointer()).toBe(true);

    setCoarsePointer(false);
  });

  it("reports browser host context and operation capabilities", () => {
    expect<HostEnvironment>(getHostEnvironment()).toBe(HostEnvironment.Browser);
    expect<PlatformFamily>(getHostContext().platformFamily).toBe(PlatformFamily.Apple);
    expect<bool>(hasHostCapability(HostCapability.NewBrowsingContext)).toBe(true);
    expect<bool>(hasHostCapability(HostCapability.FileDialogs)).toBe(true);
  });

  it("keeps platform family and host environment orthogonal", () => {
    const browser = new HostContext(PlatformFamily.Apple, HostEnvironment.Browser, HostCapability.Reload);
    const desktop = new HostContext(PlatformFamily.Apple, HostEnvironment.Desktop, HostCapability.OpenExternalUri);
    const windowsBrowser = new HostContext(PlatformFamily.Windows, HostEnvironment.Browser, 0);
    const windowsDesktop = new HostContext(PlatformFamily.Windows, HostEnvironment.Desktop, 0);
    expect<PlatformFamily>(browser.platformFamily).toBe(desktop.platformFamily);
    expect<HostEnvironment>(browser.environment).not.toBe(desktop.environment);
    expect<PlatformFamily>(windowsBrowser.platformFamily).toBe(windowsDesktop.platformFamily);
    expect<HostEnvironment>(windowsBrowser.environment).not.toBe(windowsDesktop.environment);
    expect<bool>(browser.supports(HostCapability.Reload)).toBe(true);
    expect<bool>(desktop.supports(HostCapability.Reload)).toBe(false);
    expect<bool>(desktop.supports(HostCapability.OpenExternalUri)).toBe(true);
  });

  it("ignores unknown capability bits", () => {
    const context = new HostContext(<PlatformFamily>99, <HostEnvironment>99, 0x80000000);
    expect<PlatformFamily>(context.platformFamily).toBe(PlatformFamily.Unknown);
    expect<HostEnvironment>(context.environment).toBe(HostEnvironment.Unknown);
    expect<bool>(context.supports(HostCapability.BrowserHistory)).toBe(false);
    expect<bool>(context.supports(HostCapability.FileDialogs)).toBe(false);
  });
});
