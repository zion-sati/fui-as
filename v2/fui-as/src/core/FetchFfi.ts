@external("fui_fetch_host", "fui_fetch_start")
export declare function fui_fetch_start(
  requestId: u32,
  methodPtr: usize,
  methodLen: u32,
  urlPtr: usize,
  urlLen: u32,
  headersPtr: usize,
  headersLen: u32,
  bodyPtr: usize,
  bodyLen: u32,
): void;

@external("fui_fetch_host", "fui_fetch_cancel")
export declare function fui_fetch_cancel(requestId: u32): void;
