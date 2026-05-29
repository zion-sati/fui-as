import { Node } from "./Node";

export abstract class PersistedStateAdapter {
  readonly kind: string;
  readonly version: u32;

  constructor(kind: string, version: u32 = 1) {
    if (kind.length == 0) {
      throw new Error("PersistedStateAdapter requires a non-empty kind.");
    }
    this.kind = kind;
    this.version = version;
  }

  abstract capture(node: Node): string | null;
  abstract restore(node: Node, payload: string, version: u32): void;
}

export abstract class PersistedNodeState<TNode extends Node> extends PersistedStateAdapter {
  capture(node: Node): string | null {
    return this.captureSerialized(changetype<TNode>(node));
  }

  restore(node: Node, payload: string, version: u32): void {
    this.restoreSerialized(changetype<TNode>(node), payload, version);
  }

  protected abstract captureSerialized(node: TNode): string | null;
  protected abstract restoreSerialized(node: TNode, payload: string, version: u32): void;
}

export abstract class PersistedStateCodec<TValue> {
  abstract encode(value: TValue): string;
  abstract decode(payload: string, version: u32): TValue;
}

export abstract class PersistedValueState<TNode extends Node, TValue> extends PersistedNodeState<TNode> {
  protected readonly codec: PersistedStateCodec<TValue>;

  constructor(kind: string, codec: PersistedStateCodec<TValue>, version: u32 = 1) {
    super(kind, version);
    this.codec = codec;
  }

  protected shouldCaptureValue(_node: TNode): bool {
    return true;
  }

  protected captureSerialized(node: TNode): string | null {
    if (!this.shouldCaptureValue(node)) {
      return null;
    }
    return this.codec.encode(this.captureValue(node));
  }

  protected restoreSerialized(node: TNode, payload: string, version: u32): void {
    this.restoreValue(node, this.codec.decode(payload, version));
  }

  protected abstract captureValue(node: TNode): TValue;
  protected abstract restoreValue(node: TNode, value: TValue): void;
}

export class PersistedStringCodec extends PersistedStateCodec<string> {
  encode(value: string): string {
    return value;
  }

  decode(payload: string, _version: u32): string {
    return payload;
  }
}

export class PersistedBoolCodec extends PersistedStateCodec<bool> {
  encode(value: bool): string {
    return value.toString();
  }

  decode(payload: string, _version: u32): bool {
    return bool.parse(payload);
  }
}

export class PersistedInt32Codec extends PersistedStateCodec<i32> {
  encode(value: i32): string {
    return value.toString();
  }

  decode(payload: string, _version: u32): i32 {
    return i32.parse(payload);
  }
}

export class PersistedFloat32Codec extends PersistedStateCodec<f32> {
  encode(value: f32): string {
    return value.toString();
  }

  decode(payload: string, _version: u32): f32 {
    return f32.parse(payload);
  }
}
