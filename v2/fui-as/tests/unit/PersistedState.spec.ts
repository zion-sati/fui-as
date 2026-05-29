import { Application } from "../../src/core/Application";
import { PersistedNodeState, PersistedStringCodec, PersistedValueState } from "../../src/core/PersistedState";
import { FlexBox, Text } from "../../src/nodes";

class PersistedTitleState extends PersistedValueState<PersistedCard, string> {
  constructor() {
    super("card-title", new PersistedStringCodec(), 2);
  }

  protected shouldCaptureValue(node: PersistedCard): bool {
    return node.title.length > 0;
  }

  protected captureValue(node: PersistedCard): string {
    return node.title;
  }

  protected restoreValue(node: PersistedCard, value: string): void {
    node.title = value;
  }
}

class PersistedBadgeState extends PersistedNodeState<PersistedCard> {
  restoredVersion: u32 = 0;

  constructor() {
    super("card-badge", 7);
  }

  protected captureSerialized(node: PersistedCard): string | null {
    return node.badge.length == 0 ? null : node.badge;
  }

  protected restoreSerialized(node: PersistedCard, payload: string, version: u32): void {
    this.restoredVersion = version;
    node.badge = payload;
  }
}

class PersistedCard extends FlexBox {
  title: string = "";
  badge: string = "";
  readonly badgeState: PersistedBadgeState = new PersistedBadgeState();

  constructor(id: string) {
    super();
    this.nodeId(id);
    this.persistState(new PersistedTitleState());
    this.persistState(this.badgeState);
    this.child(new Text("card"));
  }
}

describe("PersistedState", () => {
  afterEach(() => {
    Application.unmount();
  });

  it("captures and restores user-defined persisted values through the root traversal", () => {
    const initialCard = new PersistedCard("persisted-card");
    initialCard.title = "Ready";
    initialCard.badge = "Beta";

    Application.mount(initialCard);
    Application.capturePersistedUiState();
    Application.unmount();

    const restoredCard = new PersistedCard("persisted-card");
    Application.mount(restoredCard);
    Application.restorePersistedUiState();

    expect<string>(restoredCard.title).toBe("Ready");
    expect<string>(restoredCard.badge).toBe("Beta");
    expect<u32>(restoredCard.badgeState.restoredVersion).toBe(7);
  });

  it("skips restoring user-defined state when the node id changes", () => {
    const initialCard = new PersistedCard("persisted-card-source");
    initialCard.title = "Source";
    initialCard.badge = "SourceBadge";

    Application.mount(initialCard);
    Application.capturePersistedUiState();
    Application.unmount();

    const restoredCard = new PersistedCard("persisted-card-target");
    Application.mount(restoredCard);
    Application.restorePersistedUiState();

    expect<string>(restoredCard.title).toBe("");
    expect<string>(restoredCard.badge).toBe("");
    expect<u32>(restoredCard.badgeState.restoredVersion).toBe(0);
  });
});
