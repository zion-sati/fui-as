import { expect, test } from '@playwright/test';

import {
  shouldRestoreInitialHistorySnapshot,
  type BrowserNavigationType,
} from '../browser/src/common-harness/persisted-restore-policy';

test('initial persisted restore only runs for back-forward and duplicated-tab loads', () => {
  const cases: Array<{
    navigationType: BrowserNavigationType;
    hasHistorySnapshotId: boolean;
    expected: boolean;
  }> = [
    { navigationType: 'back_forward', hasHistorySnapshotId: false, expected: true },
    { navigationType: 'back_forward', hasHistorySnapshotId: true, expected: true },
    { navigationType: 'navigate', hasHistorySnapshotId: true, expected: true },
    { navigationType: 'navigate', hasHistorySnapshotId: false, expected: false },
    { navigationType: 'reload', hasHistorySnapshotId: true, expected: false },
    { navigationType: 'reload', hasHistorySnapshotId: false, expected: false },
    { navigationType: 'unknown', hasHistorySnapshotId: true, expected: false },
  ];

  for (const testCase of cases) {
    expect(
      shouldRestoreInitialHistorySnapshot(testCase.navigationType, testCase.hasHistorySnapshotId),
      `${testCase.navigationType}:${String(testCase.hasHistorySnapshotId)}`,
    ).toBe(testCase.expected);
  }
});
