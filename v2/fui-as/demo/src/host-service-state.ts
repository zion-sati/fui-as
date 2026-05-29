interface DemoShellState {
  tick: number;
  hue: number;
  darkMode: boolean;
}

type TickListener = (tick: number) => void;
type HueListener = (hue: number) => void;
type DarkModeListener = (darkMode: boolean) => void;

const state: DemoShellState = {
  tick: 0,
  hue: 210,
  darkMode: false,
};

const tickListeners = new Set<TickListener>();
const hueListeners = new Set<HueListener>();
const darkModeListeners = new Set<DarkModeListener>();

function emitTick(tick: number): void {
  for (const listener of tickListeners) {
    listener(tick);
  }
}

function emitHue(hue: number): void {
  for (const listener of hueListeners) {
    listener(hue);
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

export function setDemoShellHue(hue: number): void {
  let normalized = hue % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  normalized |= 0;
  if (state.hue === normalized) {
    return;
  }
  state.hue = normalized;
  emitHue(normalized);
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

export function subscribeDemoShellHue(listener: HueListener): () => void {
  hueListeners.add(listener);
  return () => {
    hueListeners.delete(listener);
  };
}

export function subscribeDemoShellDarkMode(listener: DarkModeListener): () => void {
  darkModeListeners.add(listener);
  return () => {
    darkModeListeners.delete(listener);
  };
}
