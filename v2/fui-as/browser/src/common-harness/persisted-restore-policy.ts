export type BrowserNavigationType = 'navigate' | 'reload' | 'back_forward' | 'prerender' | 'unknown';

interface LegacyPerformanceNavigationLike {
  readonly type?: number;
}

interface LegacyPerformanceLike {
  readonly navigation?: LegacyPerformanceNavigationLike;
}

export function readBrowserNavigationType(
  performanceLike: (Performance & LegacyPerformanceLike) | undefined = globalThis.performance as (Performance & LegacyPerformanceLike) | undefined,
): BrowserNavigationType {
  const navigationEntry = performanceLike?.getEntriesByType?.('navigation')?.[0] as PerformanceNavigationTiming | undefined;
  if (navigationEntry !== undefined) {
    switch (navigationEntry.type) {
      case 'navigate':
      case 'reload':
      case 'back_forward':
      case 'prerender':
        return navigationEntry.type;
      default:
        return 'unknown';
    }
  }

  switch (performanceLike?.navigation?.type) {
    case 0:
      return 'navigate';
    case 1:
      return 'reload';
    case 2:
      return 'back_forward';
    default:
      return 'unknown';
  }
}

export function shouldRestoreInitialHistorySnapshot(
  navigationType: BrowserNavigationType,
  hasHistorySnapshotId: boolean,
): boolean {
  if (navigationType === 'back_forward') {
    return true;
  }
  if (navigationType === 'navigate') {
    return hasHistorySnapshotId;
  }
  return false;
}
