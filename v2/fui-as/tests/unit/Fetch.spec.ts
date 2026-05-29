import { Application } from "../../src/core/Application";
import {
  __resetFetchForTests,
  Fetch,
  handleFetchComplete,
  handleFetchError,
} from "../../src/core/Fetch";
import { Fetch as WorkerFetch } from "../../src/FuiWorker";
import {
  CALL_FETCH_CANCEL,
  CALL_FETCH_START,
  findCall,
  getCallArg,
  lastFetchMethodEquals,
  lastFetchUrlEquals,
  resetCalls,
} from "./FfiTestImports";

class FetchOwner {
  completeCount: i32 = 0;
  errorCount: i32 = 0;
  lastOk: bool = false;
  lastStatus: i32 = 0;
  lastStatusText: string = "";
  lastUrl: string = "";
  lastMessage: string = "";
}

describe("Fetch", () => {
  afterEach(() => {
    __resetFetchForTests();
    Application.unmount();
    resetCalls();
  });

  it("starts a POST request through the host surface", () => {
    Fetch.request("/upload")
      .method("POST")
      .header("Content-Type", "application/octet-stream")
      .bodyBytes(Uint8Array.wrap(String.UTF8.encode("abc", false)))
      .start();

    const startCall = findCall(CALL_FETCH_START);
    expect<i32>(startCall).toBeGreaterThan(-1);
    expect<bool>(lastFetchMethodEquals("POST")).toBe(true);
    expect<bool>(lastFetchUrlEquals("/upload")).toBe(true);
    expect<f64>(getCallArg(startCall, 1)).toBeGreaterThan(0);
    expect<f64>(getCallArg(startCall, 2)).toBe(3);
  });

  it("routes fetch completion metadata to owner-bound callbacks", () => {
    const owner = new FetchOwner();

    Fetch.request("/upload")
      .method("PUT")
      .onCompleteWith<FetchOwner>(owner, (target, response) => {
        target.completeCount += 1;
        target.lastOk = response.ok;
        target.lastStatus = response.status;
        target.lastStatusText = response.statusText;
        target.lastUrl = response.url;
      })
      .start();

    handleFetchComplete(1, true, 201, "Created", "https://example.test/upload");
    handleFetchComplete(1, false, 500, "ignored", "ignored");

    expect<i32>(owner.completeCount).toBe(1);
    expect<bool>(owner.lastOk).toBe(true);
    expect<i32>(owner.lastStatus).toBe(201);
    expect<string>(owner.lastStatusText).toBe("Created");
    expect<string>(owner.lastUrl).toBe("https://example.test/upload");
  });

  it("routes fetch failures to the bound error callback", () => {
    const owner = new FetchOwner();

    Fetch.request("/upload")
      .onErrorWith<FetchOwner>(owner, (target, message) => {
        target.errorCount += 1;
        target.lastMessage = message;
      })
      .start();

    handleFetchError(1, "Network request failed.");
    handleFetchError(1, "ignored");

    expect<i32>(owner.errorCount).toBe(1);
    expect<string>(owner.lastMessage).toBe("Network request failed.");
  });

  it("supports eager disposal for in-flight fetch requests", () => {
    const request = Fetch.request("/upload")
      .method("POST")
      .bodyText("payload")
      .start();

    request.dispose();
    handleFetchError(1, "ignored after dispose");

    expect<i32>(findCall(CALL_FETCH_CANCEL)).toBeGreaterThan(-1);
  });

  it("is available from FuiWorker for worker-side requests too", () => {
    WorkerFetch.request("/worker-upload")
      .method("PATCH")
      .bodyText("chunk")
      .start();

    expect<i32>(findCall(CALL_FETCH_START)).toBeGreaterThan(-1);
    expect<bool>(lastFetchMethodEquals("PATCH")).toBe(true);
    expect<bool>(lastFetchUrlEquals("/worker-upload")).toBe(true);
  });
});
