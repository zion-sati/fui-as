import { Callback1, Handler1 } from "./Callbacks";
import { Disposable } from "./Disposable";
import { throwNullArgument } from "./Errors";
import { fui_fetch_cancel, fui_fetch_start } from "./FetchFfi";
import { bind1 } from "./bind";

const FUNCTION_FETCH_REQUEST = "Fetch.request";
const FUNCTION_FETCH_METHOD = "FetchRequest.method";
const FUNCTION_FETCH_HEADER = "FetchRequest.header";
const FUNCTION_FETCH_BODY_BYTES = "FetchRequest.bodyBytes";
const FUNCTION_FETCH_BODY_TEXT = "FetchRequest.bodyText";

let nextFetchRequestId: u32 = 1;
const pendingFetchRequests = new Map<u32, FetchRequest>();

function encodeUtf8(text: string): Uint8Array {
  return Uint8Array.wrap(String.UTF8.encode(text, false));
}

function encodeTextParts(values: Array<string>): Uint8Array {
  const encodedValues = new Array<Uint8Array>(values.length);
  let totalBytes: usize = sizeof<u32>();
  for (let index = 0; index < values.length; index += 1) {
    const encoded = encodeUtf8(unchecked(values[index]));
    encodedValues[index] = encoded;
    totalBytes += sizeof<u32>() + <usize>encoded.length;
  }
  const bytes = new Uint8Array(<i32>totalBytes);
  let cursor = bytes.dataStart;
  store<u32>(cursor, <u32>values.length);
  cursor += sizeof<u32>();
  for (let index = 0; index < encodedValues.length; index += 1) {
    const encoded = unchecked(encodedValues[index]);
    store<u32>(cursor, <u32>encoded.length);
    cursor += sizeof<u32>();
    if (encoded.length > 0) {
      memory.copy(cursor, encoded.dataStart, <usize>encoded.length);
      cursor += <usize>encoded.length;
    }
  }
  return bytes;
}

function registerPendingFetchRequest(request: FetchRequest): u32 {
  const requestId = nextFetchRequestId++;
  pendingFetchRequests.set(requestId, request);
  return requestId;
}

function findPendingFetchRequest(requestId: u32): FetchRequest | null {
  return pendingFetchRequests.has(requestId) ? unchecked(pendingFetchRequests.get(requestId)) : null;
}

export class FetchResponse {
  readonly ok: bool;
  readonly status: i32;
  readonly statusText: string;
  readonly url: string;

  constructor(ok: bool, status: i32, statusText: string, url: string) {
    this.ok = ok;
    this.status = status;
    this.statusText = statusText;
    this.url = url;
  }
}

export class FetchRequest implements Disposable {
  private urlValue: string;
  private methodValue: string = "GET";
  private headerParts: Array<string> = new Array<string>();
  private bodyBytesValue: Uint8Array | null = null;
  private completeBinding: Callback1<FetchResponse> | null = null;
  private errorBinding: Callback1<string> | null = null;
  private requestId: u32 = 0;
  private started: bool = false;
  private finished: bool = false;

  constructor(url: string) {
    this.urlValue = url;
  }

  method(value: string): this {
    if (changetype<usize>(value) == 0) {
      throwNullArgument(FUNCTION_FETCH_METHOD, "value");
    }
    this.methodValue = value;
    return this;
  }

  header(name: string, value: string): this {
    if (changetype<usize>(name) == 0) {
      throwNullArgument(FUNCTION_FETCH_HEADER, "name");
    }
    if (changetype<usize>(value) == 0) {
      throwNullArgument(FUNCTION_FETCH_HEADER, "value");
    }
    this.headerParts.push(name);
    this.headerParts.push(value);
    return this;
  }

  bodyBytes(value: Uint8Array): this {
    if (changetype<usize>(value) == 0) {
      throwNullArgument(FUNCTION_FETCH_BODY_BYTES, "value");
    }
    this.bodyBytesValue = value;
    return this;
  }

  bodyText(value: string): this {
    if (changetype<usize>(value) == 0) {
      throwNullArgument(FUNCTION_FETCH_BODY_TEXT, "value");
    }
    this.bodyBytesValue = encodeUtf8(value);
    return this;
  }

  onComplete<Owner>(owner: Owner, handler: Handler1<Owner, FetchResponse>): this {
    if (changetype<usize>(handler) == 0) {
      throwNullArgument("FetchRequest.onComplete", "handler");
    }
    this.completeBinding = bind1<Owner, FetchResponse>(owner, handler);
    return this;
  }

  onCompleteWith<Owner>(owner: Owner, handler: Handler1<Owner, FetchResponse>): this {
    return this.onComplete<Owner>(owner, handler);
  }

  onError<Owner>(owner: Owner, handler: Handler1<Owner, string>): this {
    if (changetype<usize>(handler) == 0) {
      throwNullArgument("FetchRequest.onError", "handler");
    }
    this.errorBinding = bind1<Owner, string>(owner, handler);
    return this;
  }

  onErrorWith<Owner>(owner: Owner, handler: Handler1<Owner, string>): this {
    return this.onError<Owner>(owner, handler);
  }

  start(): this {
    if (this.finished || this.started) {
      return this;
    }
    if (this.urlValue.length == 0) {
      const binding = this.errorBinding;
      if (binding !== null) {
        binding.invoke("FetchRequest.start: url must not be empty.");
      }
      return this;
    }
    const requestId = registerPendingFetchRequest(this);
    const methodBytes = encodeUtf8(this.methodValue);
    const urlBytes = encodeUtf8(this.urlValue);
    const headerBytes = encodeTextParts(this.headerParts);
    const bodyBytes = this.bodyBytesValue;
    this.requestId = requestId;
    this.started = true;
    fui_fetch_start(
      requestId,
      methodBytes.length > 0 ? methodBytes.dataStart : 0,
      <u32>methodBytes.length,
      urlBytes.length > 0 ? urlBytes.dataStart : 0,
      <u32>urlBytes.length,
      headerBytes.length > 0 ? headerBytes.dataStart : 0,
      <u32>headerBytes.length,
      bodyBytes !== null && bodyBytes.length > 0 ? bodyBytes.dataStart : 0,
      bodyBytes === null ? 0 : <u32>bodyBytes.length,
    );
    return this;
  }

  cancel(): void {
    if (!this.started || this.finished) {
      return;
    }
    fui_fetch_cancel(this.requestId);
    this.finish();
  }

  dispose(): void {
    this.cancel();
  }

  private finish(): void {
    if (this.finished) {
      return;
    }
    if (this.requestId != 0) {
      pendingFetchRequests.delete(this.requestId);
      this.requestId = 0;
    }
    this.finished = true;
    this.completeBinding = null;
    this.errorBinding = null;
  }

  dispatchComplete(response: FetchResponse): void {
    if (this.finished) {
      return;
    }
    const binding = this.completeBinding;
    this.finish();
    if (binding !== null) {
      binding.invoke(response);
    }
  }

  dispatchError(message: string): void {
    if (this.finished) {
      return;
    }
    const binding = this.errorBinding;
    this.finish();
    if (binding !== null) {
      binding.invoke(message);
    }
  }
}

export class Fetch {
  static request(url: string): FetchRequest {
    if (changetype<usize>(url) == 0) {
      throwNullArgument(FUNCTION_FETCH_REQUEST, "url");
    }
    return new FetchRequest(url);
  }
}

export function handleFetchComplete(
  requestId: u32,
  ok: bool,
  status: i32,
  statusText: string,
  url: string,
): void {
  const request = findPendingFetchRequest(requestId);
  if (request === null) {
    return;
  }
  request.dispatchComplete(new FetchResponse(ok, status, statusText, url));
}

export function handleFetchError(requestId: u32, message: string | null): void {
  const request = findPendingFetchRequest(requestId);
  if (request === null) {
    return;
  }
  request.dispatchError(message === null ? "Fetch request failed." : message);
}

export function disposeAllFetchRequests(): void {
  const requests = pendingFetchRequests.values();
  for (let index = 0; index < requests.length; index += 1) {
    unchecked(requests[index]).dispose();
  }
}

export function __resetFetchForTests(): void {
  disposeAllFetchRequests();
  nextFetchRequestId = 1;
}
