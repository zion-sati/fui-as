interface DemoShellState {
  tick: number;
  accentColor: number;
  darkMode: boolean;
}

type TickListener = (tick: number) => void;
type AccentColorListener = (accentColor: number) => void;
type DarkModeListener = (darkMode: boolean) => void;

const state: DemoShellState = {
  tick: 0,
  accentColor: 0x2563ebff,
  darkMode: false,
};

const tickListeners = new Set<TickListener>();
const accentColorListeners = new Set<AccentColorListener>();
const darkModeListeners = new Set<DarkModeListener>();

function emitTick(tick: number): void {
  for (const listener of tickListeners) {
    listener(tick);
  }
}

function emitAccentColor(accentColor: number): void {
  for (const listener of accentColorListeners) {
    listener(accentColor);
  }
}

function emitDarkMode(darkMode: boolean): void {
  for (const listener of darkModeListeners) {
    listener(darkMode);
  }
}

export function setDemoShellTick(tick: number): void {
  const normalized = tick | 0;
  if (state.tick === normalized) {
    return;
  }
  state.tick = normalized;
  emitTick(normalized);
}

export function setDemoShellAccentColor(accentColor: number): void {
  const normalized = accentColor >>> 0;
  if (state.accentColor === normalized) {
    return;
  }
  state.accentColor = normalized;
  emitAccentColor(normalized);
}

export function setDemoShellDarkMode(darkMode: boolean): void {
  if (state.darkMode === darkMode) {
    return;
  }
  state.darkMode = darkMode;
  emitDarkMode(darkMode);
}

export function readDemoShellState(): Readonly<DemoShellState> {
  return state;
}

export function subscribeDemoShellClockTick(listener: TickListener): () => void {
  tickListeners.add(listener);
  return () => {
    tickListeners.delete(listener);
  };
}

export function subscribeDemoShellAccentColor(listener: AccentColorListener): () => void {
  accentColorListeners.add(listener);
  return () => {
    accentColorListeners.delete(listener);
  };
}

export function subscribeDemoShellDarkMode(listener: DarkModeListener): () => void {
  darkModeListeners.add(listener);
  return () => {
    darkModeListeners.delete(listener);
  };
}
