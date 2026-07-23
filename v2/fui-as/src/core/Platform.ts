import {
  fui_get_host_capabilities,
  fui_get_host_environment,
  fui_get_platform_family,
  fui_is_coarse_pointer,
  HostCapability,
  HostEnvironment,
  KeyModifier,
  PlatformFamily,
} from "./ffi";

export { HostCapability, HostEnvironment, PlatformFamily } from "./ffi";

const KNOWN_HOST_CAPABILITIES: u32 =
  HostCapability.BrowserHistory |
  HostCapability.Reload |
  HostCapability.NewBrowsingContext |
  HostCapability.OpenExternalUri |
  HostCapability.ClipboardRead |
  HostCapability.ClipboardWrite |
  HostCapability.FileDialogs;

function resolvePlatformFamily(value: u32): PlatformFamily {
  if (value <= <u32>PlatformFamily.Linux) {
    return <PlatformFamily>value;
  }
  return PlatformFamily.Unknown;
}

function resolveHostEnvironment(value: u32): HostEnvironment {
  if (value <= <u32>HostEnvironment.Headless) {
    return <HostEnvironment>value;
  }
  return HostEnvironment.Unknown;
}

const detectedPlatformFamily = resolvePlatformFamily(fui_get_platform_family());
const detectedHostEnvironment = resolveHostEnvironment(fui_get_host_environment());
const detectedHostCapabilities = fui_get_host_capabilities() & KNOWN_HOST_CAPABILITIES;

export class HostContext {
  readonly platformFamily: PlatformFamily;
  readonly environment: HostEnvironment;
  private readonly capabilities: u32;

  constructor(platformFamily: PlatformFamily, environment: HostEnvironment, capabilities: u32) {
    this.platformFamily = resolvePlatformFamily(<u32>platformFamily);
    this.environment = resolveHostEnvironment(<u32>environment);
    this.capabilities = capabilities & KNOWN_HOST_CAPABILITIES;
  }

  supports(capability: HostCapability): bool {
    return (this.capabilities & <u32>capability) != 0;
  }
}

class KeyboardPolicy {
  constructor(
    readonly primaryShortcutModifier: KeyModifier,
    readonly wordNavigationModifier: KeyModifier,
    readonly lineBoundaryModifier: KeyModifier,
    readonly documentBoundaryModifier: KeyModifier,
    readonly redoUsesPrimaryY: bool,
    readonly redoUsesShiftedPrimaryZ: bool,
  ) {}
}

const APPLE_KEYBOARD_POLICY = new KeyboardPolicy(
  KeyModifier.Meta,
  KeyModifier.Alt,
  KeyModifier.Meta,
  KeyModifier.Meta,
  false,
  true,
);
const DEFAULT_KEYBOARD_POLICY = new KeyboardPolicy(
  KeyModifier.Ctrl,
  KeyModifier.Ctrl,
  0,
  KeyModifier.Ctrl,
  true,
  true,
);

function resolveKeyboardPolicy(platformFamily: PlatformFamily = detectedPlatformFamily): KeyboardPolicy {
  if (platformFamily == PlatformFamily.Apple) {
    return APPLE_KEYBOARD_POLICY;
  }
  return DEFAULT_KEYBOARD_POLICY;
}

function matchesShortcutKey(key: string, expected: string): bool {
  return key.length == expected.length && key.toLowerCase() == expected;
}

function formatShortcutKeyToken(key: string, platformFamily: PlatformFamily): string {
  if (key == "ArrowLeft") {
    return platformFamily == PlatformFamily.Apple ? "←" : "Left";
  }
  if (key == "ArrowRight") {
    return platformFamily == PlatformFamily.Apple ? "→" : "Right";
  }
  if (key == "ArrowUp") {
    return platformFamily == PlatformFamily.Apple ? "↑" : "Up";
  }
  if (key == "ArrowDown") {
    return platformFamily == PlatformFamily.Apple ? "↓" : "Down";
  }
  if (key == "PageUp") {
    return "PgUp";
  }
  if (key == "PageDown") {
    return "PgDn";
  }
  if (key.length == 1) {
    return key.toUpperCase();
  }
  return key;
}

function appendShortcutModifierTokens(tokens: Array<string>, modifiers: KeyModifier, platformFamily: PlatformFamily): void {
  if (platformFamily == PlatformFamily.Apple) {
    if ((modifiers & KeyModifier.Ctrl) != 0) {
      tokens.push("⌃");
    }
    if ((modifiers & KeyModifier.Alt) != 0) {
      tokens.push("⌥");
    }
    if ((modifiers & KeyModifier.Shift) != 0) {
      tokens.push("⇧");
    }
    if ((modifiers & KeyModifier.Meta) != 0) {
      tokens.push("⌘");
    }
    return;
  }

  if ((modifiers & KeyModifier.Ctrl) != 0) {
    tokens.push("Ctrl");
  }
  if ((modifiers & KeyModifier.Alt) != 0) {
    tokens.push("Alt");
  }
  if ((modifiers & KeyModifier.Shift) != 0) {
    tokens.push("Shift");
  }
  if ((modifiers & KeyModifier.Meta) != 0) {
    tokens.push("Meta");
  }
}

export function getPlatformFamily(): PlatformFamily {
  return detectedPlatformFamily;
}

export function getHostEnvironment(): HostEnvironment {
  return detectedHostEnvironment;
}

export function getHostContext(): HostContext {
  return new HostContext(detectedPlatformFamily, detectedHostEnvironment, detectedHostCapabilities);
}

export function hasHostCapability(capability: HostCapability): bool {
  return (detectedHostCapabilities & <u32>capability) != 0;
}

export function isCoarsePointer(): bool {
  return fui_is_coarse_pointer();
}

export function resolvePrimaryShortcutModifier(platformFamily: PlatformFamily): KeyModifier {
  return resolveKeyboardPolicy(platformFamily).primaryShortcutModifier;
}

export function hasPrimaryShortcutModifier(
  modifiers: KeyModifier,
  platformFamily: PlatformFamily = detectedPlatformFamily,
): bool {
  return (modifiers & resolvePrimaryShortcutModifier(platformFamily)) != 0;
}

export function resolveWordNavigationModifier(platformFamily: PlatformFamily = detectedPlatformFamily): KeyModifier {
  return resolveKeyboardPolicy(platformFamily).wordNavigationModifier;
}

export function hasWordNavigationModifier(
  modifiers: KeyModifier,
  platformFamily: PlatformFamily = detectedPlatformFamily,
): bool {
  return (modifiers & resolveWordNavigationModifier(platformFamily)) != 0;
}

export function resolveLineBoundaryModifier(platformFamily: PlatformFamily = detectedPlatformFamily): KeyModifier {
  return resolveKeyboardPolicy(platformFamily).lineBoundaryModifier;
}

export function hasLineBoundaryModifier(
  modifiers: KeyModifier,
  platformFamily: PlatformFamily = detectedPlatformFamily,
): bool {
  const modifier = resolveLineBoundaryModifier(platformFamily);
  return modifier != 0 && (modifiers & modifier) != 0;
}

export function resolveDocumentBoundaryModifier(platformFamily: PlatformFamily = detectedPlatformFamily): KeyModifier {
  return resolveKeyboardPolicy(platformFamily).documentBoundaryModifier;
}

export function hasDocumentBoundaryModifier(
  modifiers: KeyModifier,
  platformFamily: PlatformFamily = detectedPlatformFamily,
): bool {
  return (modifiers & resolveDocumentBoundaryModifier(platformFamily)) != 0;
}

export function isUndoShortcut(
  key: string,
  modifiers: KeyModifier,
  platformFamily: PlatformFamily = detectedPlatformFamily,
): bool {
  return (modifiers & KeyModifier.Shift) == 0 &&
    hasPrimaryShortcutModifier(modifiers, platformFamily) &&
    matchesShortcutKey(key, "z");
}

export function isRedoShortcut(
  key: string,
  modifiers: KeyModifier,
  platformFamily: PlatformFamily = detectedPlatformFamily,
): bool {
  const policy = resolveKeyboardPolicy(platformFamily);
  const hasPrimaryModifier = hasPrimaryShortcutModifier(modifiers, platformFamily);
  if (!hasPrimaryModifier) {
    return false;
  }
  if (policy.redoUsesPrimaryY && matchesShortcutKey(key, "y")) {
    return true;
  }
  return policy.redoUsesShiftedPrimaryZ &&
    (modifiers & KeyModifier.Shift) != 0 &&
    matchesShortcutKey(key, "z");
}

export function formatShortcutLabel(
  key: string,
  modifiers: KeyModifier,
  platformFamily: PlatformFamily = detectedPlatformFamily,
): string {
  const tokens = new Array<string>();
  appendShortcutModifierTokens(tokens, modifiers, platformFamily);
  tokens.push(formatShortcutKeyToken(key, platformFamily));
  if (platformFamily == PlatformFamily.Apple) {
    return tokens.join("");
  }
  return tokens.join("+");
}

export function formatPrimaryShortcutLabel(
  key: string,
  platformFamily: PlatformFamily = detectedPlatformFamily,
): string {
  return formatShortcutLabel(key, resolvePrimaryShortcutModifier(platformFamily), platformFamily);
}

export function formatUndoShortcutLabel(platformFamily: PlatformFamily = detectedPlatformFamily): string {
  return formatPrimaryShortcutLabel("z", platformFamily);
}

export function formatRedoShortcutLabel(platformFamily: PlatformFamily = detectedPlatformFamily): string {
  const policy = resolveKeyboardPolicy(platformFamily);
  if (policy.redoUsesPrimaryY) {
    return formatPrimaryShortcutLabel("y", platformFamily);
  }
  return formatShortcutLabel("z", policy.primaryShortcutModifier | KeyModifier.Shift, platformFamily);
}
