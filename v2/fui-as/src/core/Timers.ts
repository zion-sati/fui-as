import * as ui from "../bindings/ui";

type TimerCallback = () => void;

const HOST_TIMER_ID: u32 = 1;

class TimerEntry {
  constructor(
    public timerId: u32,
    public dueAtMs: f64,
    public callback: TimerCallback,
  ) {}
}

const activeTimers = new Map<u32, TimerEntry>();
let hostTimerArmed: bool = false;

function findNextDueAt(): f64 {
  let nextDueAt = f64.MAX_VALUE;
  const entries = activeTimers.values();
  for (let i = 0; i < entries.length; ++i) {
    const entry = unchecked(entries[i]);
    if (entry.dueAtMs < nextDueAt) {
      nextDueAt = entry.dueAtMs;
    }
  }
  return nextDueAt;
}

function rearmHostTimer(): void {
  if (activeTimers.size == 0) {
    if (hostTimerArmed) {
      ui.cancelTimer(HOST_TIMER_ID);
      hostTimerArmed = false;
    }
    return;
  }
  const nextDueAt = findNextDueAt();
  const now = ui.nowMs();
  const delayMs = nextDueAt <= now ? 0 : <i32>Math.ceil(nextDueAt - now);
  ui.startTimer(HOST_TIMER_ID, delayMs);
  hostTimerArmed = true;
}

function sortDueTimerIds(timerIds: Array<u32>): void {
  for (let i = 0; i < timerIds.length; ++i) {
    let bestIndex = i;
    let bestDueAt = f64.MAX_VALUE;
    let bestTimerId = u32.MAX_VALUE;
    for (let j = i; j < timerIds.length; ++j) {
      const timerId = unchecked(timerIds[j]);
      const entry = activeTimers.get(timerId);
      if (entry === null) {
        continue;
      }
      const dueAt = entry.dueAtMs;
      if (dueAt < bestDueAt || (dueAt == bestDueAt && timerId < bestTimerId)) {
        bestDueAt = dueAt;
        bestTimerId = timerId;
        bestIndex = j;
      }
    }
    if (bestIndex != i) {
      const current = unchecked(timerIds[i]);
      unchecked(timerIds[i] = unchecked(timerIds[bestIndex]));
      unchecked(timerIds[bestIndex] = current);
    }
  }
}

export function scheduleTimer(timerId: u32, delayMs: i32, callback: TimerCallback): void {
  const dueAtMs = ui.nowMs() + <f64>(delayMs >= 0 ? delayMs : 0);
  activeTimers.set(timerId, new TimerEntry(timerId, dueAtMs, callback));
  rearmHostTimer();
}

export function cancelTimer(timerId: u32): void {
  if (!activeTimers.delete(timerId)) {
    return;
  }
  rearmHostTimer();
}

export function cancelAllTimers(): void {
  activeTimers.clear();
  if (!hostTimerArmed) {
    return;
  }
  ui.cancelTimer(HOST_TIMER_ID);
  hostTimerArmed = false;
}

export function hasTimer(timerId: u32): bool {
  return activeTimers.has(timerId);
}

export function handleTimer(timerId: u32): void {
  if (timerId != HOST_TIMER_ID) {
    return;
  }
  hostTimerArmed = false;
  if (activeTimers.size == 0) {
    return;
  }
  const now = ui.nowMs();
  const dueTimerIds = new Array<u32>();
  const entries = activeTimers.values();
  for (let i = 0; i < entries.length; ++i) {
    const entry = unchecked(entries[i]);
    if (entry.dueAtMs <= now) {
      dueTimerIds.push(entry.timerId);
    }
  }
  if (dueTimerIds.length == 0) {
    rearmHostTimer();
    return;
  }
  sortDueTimerIds(dueTimerIds);
  for (let i = 0; i < dueTimerIds.length; ++i) {
    const logicalTimerId = unchecked(dueTimerIds[i]);
    const entry = activeTimers.get(logicalTimerId);
    if (entry === null || entry.dueAtMs > now) {
      continue;
    }
    activeTimers.delete(logicalTimerId);
    entry.callback();
  }
  rearmHostTimer();
}
