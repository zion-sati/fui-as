import type { HarnessAppSession } from './managed-harness-session';
import type { ExternalHarnessDropItem, StoredFileRecord } from './managed-harness-file-types';
import { EXTERNAL_DROP_ITEM_KIND_FILE } from './managed-harness-file-types';

const encoder = new TextEncoder();

export function encodeLengthPrefixedText(value: string): Uint8Array {
  return encoder.encode(value);
}

export function measureLengthPrefixedText(encoded: Uint8Array): number {
  return 4 + encoded.length;
}

export function writeLengthPrefixedText(
  memory: WebAssembly.Memory,
  basePtr: number,
  byteOffset: number,
  encoded: Uint8Array,
): number {
  const view = new DataView(memory.buffer, basePtr, byteOffset + 4 + encoded.length);
  view.setUint32(byteOffset, encoded.length >>> 0, true);
  let nextOffset = byteOffset + 4;
  if (encoded.length > 0) {
    new Uint8Array(memory.buffer, basePtr + nextOffset, encoded.length).set(encoded);
    nextOffset += encoded.length;
  }
  return nextOffset;
}

export function writeFileListPayload(session: HarnessAppSession, files: readonly StoredFileRecord[]): number {
  let totalBytes = 4;
  const encodedIds = new Array<Uint8Array>(files.length);
  const encodedNames = new Array<Uint8Array>(files.length);
  const encodedMimeTypes = new Array<Uint8Array>(files.length);
  for (let index = 0; index < files.length; index += 1) {
    const entry = files[index];
    const encodedId = encodeLengthPrefixedText(entry?.id ?? '');
    const encodedName = encodeLengthPrefixedText(entry?.file.name ?? '');
    const encodedMimeType = encodeLengthPrefixedText(entry?.file.type ?? '');
    encodedIds[index] = encodedId;
    encodedNames[index] = encodedName;
    encodedMimeTypes[index] = encodedMimeType;
    totalBytes += measureLengthPrefixedText(encodedId) + 8 + 8 + measureLengthPrefixedText(encodedName) + measureLengthPrefixedText(encodedMimeType);
  }
  if (totalBytes > session.textBufferSize) {
    throw new Error('File picker payload exceeds the shared AssemblyScript text buffer.');
  }
  const dataView = new DataView(session.memory.buffer, session.textBufferPtr, totalBytes);
  let byteOffset = 0;
  dataView.setUint32(byteOffset, files.length >>> 0, true);
  byteOffset += 4;
  for (let index = 0; index < files.length; index += 1) {
    const entry = files[index];
    const encodedId = encodedIds[index] ?? new Uint8Array();
    const encodedName = encodedNames[index] ?? new Uint8Array();
    const encodedMimeType = encodedMimeTypes[index] ?? new Uint8Array();
    byteOffset = writeLengthPrefixedText(session.memory, session.textBufferPtr, byteOffset, encodedId);
    dataView.setBigUint64(byteOffset, BigInt(entry?.file.size ?? 0), true);
    byteOffset += 8;
    dataView.setBigUint64(byteOffset, BigInt(Math.max(0, Math.trunc(entry?.file.lastModified ?? 0))), true);
    byteOffset += 8;
    byteOffset = writeLengthPrefixedText(session.memory, session.textBufferPtr, byteOffset, encodedName);
    byteOffset = writeLengthPrefixedText(session.memory, session.textBufferPtr, byteOffset, encodedMimeType);
  }
  return totalBytes;
}

export function writeWriterPayload(
  session: HarnessAppSession,
  mode: number,
  first: string,
  second: string | null = null,
): number {
  const encodedFirst = encodeLengthPrefixedText(first);
  const encodedSecond = second === null ? null : encodeLengthPrefixedText(second);
  const totalBytes = 4 + measureLengthPrefixedText(encodedFirst) + (encodedSecond === null ? 0 : measureLengthPrefixedText(encodedSecond));
  if (totalBytes > session.textBufferSize) {
    throw new Error('File bridge metadata exceeds the shared AssemblyScript text buffer.');
  }
  const dataView = new DataView(session.memory.buffer, session.textBufferPtr, totalBytes);
  let byteOffset = 0;
  dataView.setUint32(byteOffset, mode >>> 0, true);
  byteOffset += 4;
  byteOffset = writeLengthPrefixedText(session.memory, session.textBufferPtr, byteOffset, encodedFirst);
  if (encodedSecond !== null) {
    byteOffset = writeLengthPrefixedText(session.memory, session.textBufferPtr, byteOffset, encodedSecond);
  }
  return totalBytes;
}

export function writeExternalDropPayload(session: HarnessAppSession, items: readonly ExternalHarnessDropItem[]): number {
  let totalBytes = 4;
  const encodedIds = new Array<Uint8Array>(items.length);
  const encodedNames = new Array<Uint8Array>(items.length);
  const encodedMimeTypes = new Array<Uint8Array>(items.length);
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const encodedId = encoder.encode(item?.id ?? '');
    const encodedName = encoder.encode(item?.name ?? '');
    const encodedMimeType = encoder.encode(item?.mimeType ?? '');
    encodedIds[index] = encodedId;
    encodedNames[index] = encodedName;
    encodedMimeTypes[index] = encodedMimeType;
    totalBytes += 4 + 8 + 4 + encodedId.length + 4 + encodedName.length + 4 + encodedMimeType.length;
  }
  if (totalBytes > session.textBufferSize) {
    throw new Error('External drop payload exceeds the shared AssemblyScript text buffer.');
  }
  const dataView = new DataView(session.memory.buffer, session.textBufferPtr, totalBytes);
  let byteOffset = 0;
  dataView.setUint32(byteOffset, items.length >>> 0, true);
  byteOffset += 4;
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const encodedId = encodedIds[index] ?? new Uint8Array();
    const encodedName = encodedNames[index] ?? new Uint8Array();
    const encodedMimeType = encodedMimeTypes[index] ?? new Uint8Array();
    dataView.setUint32(byteOffset, (item?.kind ?? EXTERNAL_DROP_ITEM_KIND_FILE) >>> 0, true);
    byteOffset += 4;
    dataView.setFloat64(byteOffset, item?.sizeBytes ?? 0, true);
    byteOffset += 8;
    dataView.setUint32(byteOffset, encodedId.length >>> 0, true);
    byteOffset += 4;
    if (encodedId.length > 0) {
      new Uint8Array(session.memory.buffer, session.textBufferPtr + byteOffset, encodedId.length).set(encodedId);
      byteOffset += encodedId.length;
    }
    dataView.setUint32(byteOffset, encodedName.length >>> 0, true);
    byteOffset += 4;
    if (encodedName.length > 0) {
      new Uint8Array(session.memory.buffer, session.textBufferPtr + byteOffset, encodedName.length).set(encodedName);
      byteOffset += encodedName.length;
    }
    dataView.setUint32(byteOffset, encodedMimeType.length >>> 0, true);
    byteOffset += 4;
    if (encodedMimeType.length > 0) {
      new Uint8Array(session.memory.buffer, session.textBufferPtr + byteOffset, encodedMimeType.length).set(encodedMimeType);
      byteOffset += encodedMimeType.length;
    }
  }
  return totalBytes;
}
