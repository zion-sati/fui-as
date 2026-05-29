import type { BridgeRuntime } from '@effindomv2/runtime';
import { writeBytesToHeap } from '@effindomv2/runtime';

interface CustomBitmapRecord {
  readonly width: number;
  readonly height: number;
  readonly bytes: Uint8Array;
}

interface ManagedHarnessBitmapHostDependencies {
  getRuntime(): BridgeRuntime;
  readAppBytes(ptr: number, len: number): Uint8Array;
  notifyBitmapChanged(): void;
}

export function createManagedHarnessBitmapHost(dependencies: ManagedHarnessBitmapHostDependencies) {
  const customBitmapTextures = new Map<number, CustomBitmapRecord>();
  const customBitmapReplayRuntimes = new WeakSet<BridgeRuntime>();

  function uploadCustomBitmap(targetRuntime: BridgeRuntime, textureId: number, record: CustomBitmapRecord): void {
    const textureBytes = writeBytesToHeap(targetRuntime.core, record.bytes);
    try {
      targetRuntime.core._ed_register_texture_rgba(
        textureId,
        textureBytes.ptr,
        record.width,
        record.height,
        textureBytes.len,
      );
    } finally {
      textureBytes.dispose();
    }
  }

  function installReplay(targetRuntime: BridgeRuntime): void {
    if (customBitmapReplayRuntimes.has(targetRuntime)) {
      return;
    }
    const replayLoadedAssets = targetRuntime.replayLoadedAssets.bind(targetRuntime);
    targetRuntime.replayLoadedAssets = async (): Promise<void> => {
      await replayLoadedAssets();
      for (const [textureId, record] of customBitmapTextures.entries()) {
        uploadCustomBitmap(targetRuntime, textureId, record);
      }
    };
    customBitmapReplayRuntimes.add(targetRuntime);
  }

  function clearTextures(targetRuntime: BridgeRuntime): void {
    for (const textureId of customBitmapTextures.keys()) {
      targetRuntime.core._ed_unregister_texture(textureId);
    }
    customBitmapTextures.clear();
  }

  return {
    installReplay,
    clearTextures,
    imports: {
      fui_bitmap_commit(textureId: number, ptr: number, len: number, width: number, height: number): void {
        if (!Number.isInteger(textureId) || textureId <= 0) {
          throw new Error('Bitmap commit requires a non-zero texture ID.');
        }
        if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
          throw new Error('Bitmap commit requires positive integer dimensions.');
        }
        const expectedLength = width * height * 4;
        if (len !== expectedLength) {
          throw new Error(
            `Bitmap commit byte length mismatch: expected ${String(expectedLength)} bytes for ${String(width)}x${String(height)}, received ${String(len)}.`,
          );
        }
        const record: CustomBitmapRecord = {
          width,
          height,
          bytes: dependencies.readAppBytes(ptr, len),
        };
        customBitmapTextures.set(textureId, record);
        uploadCustomBitmap(dependencies.getRuntime(), textureId, record);
        dependencies.notifyBitmapChanged();
      },
      fui_bitmap_release(textureId: number): void {
        if (!Number.isInteger(textureId) || textureId <= 0) {
          return;
        }
        customBitmapTextures.delete(textureId);
        dependencies.getRuntime().core._ed_unregister_texture(textureId);
        dependencies.notifyBitmapChanged();
      },
    },
  };
}
