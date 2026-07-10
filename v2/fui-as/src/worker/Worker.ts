import {
  fui_worker_complete_string,
  fui_worker_fail,
  fui_worker_is_cancelled,
  fui_worker_request_yield,
  fui_worker_request_yield_delay,
  fui_worker_report_progress,
} from "./ffi";
import { handleFetchComplete, handleFetchError } from "../core/Fetch";

let terminalSent = false;
const WORKER_CALLBACK_BUFFER = new Uint8Array(1024 * 1024);

function encodeUtf8(text: string): Uint8Array {
  return Uint8Array.wrap(String.UTF8.encode(text, false));
}

function sendText(text: string, callback: (ptr: usize, len: u32) => void): void {
  const bytes = encodeUtf8(text);
  callback(bytes.length > 0 ? bytes.dataStart : 0, <u32>bytes.length);
}

export class Worker {
  static entry(inputPtr: usize, inputLen: u32, handler: (input: string) => void): void {
    handler(inputPtr == 0 || inputLen == 0 ? "" : String.UTF8.decodeUnsafe(inputPtr, <usize>inputLen, false));
  }

  static reportProgress(progress: string): void {
    if (terminalSent) {
      return;
    }
    sendText(progress, (ptr, len) => {
      fui_worker_report_progress(ptr, len);
    });
  }

  static complete(result: string): void {
    if (terminalSent) {
      return;
    }
    terminalSent = true;
    sendText(result, (ptr, len) => {
      fui_worker_complete_string(ptr, len);
    });
  }

  static fail(message: string): void {
    if (terminalSent) {
      return;
    }
    terminalSent = true;
    sendText(message, (ptr, len) => {
      fui_worker_fail(ptr, len);
    });
  }

  static isCancelled(): bool {
    return fui_worker_is_cancelled();
  }

  static yield(delayMs: i32 = 0): bool {
    if (terminalSent) {
      return false;
    }
    if (delayMs > 0) {
      fui_worker_request_yield_delay(delayMs);
      return true;
    }
    fui_worker_request_yield();
    return true;
  }

  static yieldNow(delayMs: i32 = 0): bool {
    return Worker.yield(delayMs);
  }
}

function readWorkerTextParts(payloadPtr: usize, payloadLen: u32): Array<string> {
  const values = new Array<string>();
  if (payloadPtr == 0 || payloadLen < sizeof<u32>()) {
    return values;
  }
  const end = payloadPtr + <usize>payloadLen;
  let cursor = payloadPtr;
  const count = load<u32>(cursor);
  cursor += sizeof<u32>();
  for (let index: u32 = 0; index < count; index += 1) {
    if (cursor + sizeof<u32>() > end) {
      return values;
    }
    const partLen = load<u32>(cursor);
    cursor += sizeof<u32>();
    if (cursor + <usize>partLen > end) {
      return values;
    }
    values.push(partLen > 0 ? String.UTF8.decodeUnsafe(cursor, <usize>partLen, false) : "");
    cursor += <usize>partLen;
  }
  return values;
}

export function __fui_worker_text_buffer(): usize {
  return WORKER_CALLBACK_BUFFER.dataStart;
}

export function __fui_worker_text_buffer_size(): u32 {
  return <u32>WORKER_CALLBACK_BUFFER.length;
}

export function __fui_on_fetch_complete(
  requestId: u32,
  ok: bool,
  status: i32,
  payloadPtr: usize,
  payloadLen: u32,
): void {
  const payload = readWorkerTextParts(payloadPtr, payloadLen);
  handleFetchComplete(
    requestId,
    ok,
    status,
    payload.length > 0 ? unchecked(payload[0]) : "",
    payload.length > 1 ? unchecked(payload[1]) : "",
  );
}

export function __fui_on_fetch_error(requestId: u32, payloadPtr: usize, payloadLen: u32): void {
  handleFetchError(
    requestId,
    payloadPtr == 0 || payloadLen == 0 ? null : String.UTF8.decodeUnsafe(payloadPtr, <usize>payloadLen, false),
  );
}

export function resetWorkerRuntime(): void {
  terminalSent = false;
}
