import { __fui_text_buffer, __fui_text_buffer_size } from "../core/event_exports";

export function hostServiceResultBufferPtr(): usize {
  return __fui_text_buffer();
}

export function hostServiceResultBufferSize(): u32 {
  return __fui_text_buffer_size();
}

function assertResultByteLength(resultLen: u32, importName: string): void {
  const capacity = __fui_text_buffer_size();
  if (resultLen > capacity) {
    throw new Error(
      "Host service " +
      importName +
      " returned " +
      resultLen.toString() +
      " bytes but the shared result buffer only holds " +
      capacity.toString() +
      ".",
    );
  }
}

export function decodeHostServiceStringResult(resultPtr: usize, resultLen: u32, importName: string): string {
  assertResultByteLength(resultLen, importName);
  return resultLen == 0 ? "" : String.UTF8.decodeUnsafe(resultPtr, <usize>resultLen, false);
}

export function decodeHostServiceBytesResult(resultPtr: usize, resultLen: u32, importName: string): Uint8Array {
  assertResultByteLength(resultLen, importName);
  const bytes = new Uint8Array(<i32>resultLen);
  if (resultLen > 0) {
    memory.copy(bytes.dataStart, resultPtr, <usize>resultLen);
  }
  return bytes;
}

export function decodeHostServiceI32ArrayResult(resultPtr: usize, resultLen: u32, importName: string): Int32Array {
  assertResultByteLength(resultLen, importName);
  if ((resultLen & 3) != 0) {
    throw new Error("Host service " + importName + " returned misaligned Int32Array byte length.");
  }
  const values = new Int32Array(<i32>(resultLen >> 2));
  if (resultLen > 0) {
    memory.copy(values.dataStart, resultPtr, <usize>resultLen);
  }
  return values;
}

export function decodeHostServiceF64ArrayResult(resultPtr: usize, resultLen: u32, importName: string): Float64Array {
  assertResultByteLength(resultLen, importName);
  if ((resultLen & 7) != 0) {
    throw new Error("Host service " + importName + " returned misaligned Float64Array byte length.");
  }
  const values = new Float64Array(<i32>(resultLen >> 3));
  if (resultLen > 0) {
    memory.copy(values.dataStart, resultPtr, <usize>resultLen);
  }
  return values;
}
