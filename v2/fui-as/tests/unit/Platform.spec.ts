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
});
