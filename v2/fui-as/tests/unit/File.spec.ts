import { Application } from "../../src/core/Application";
import {
  __resetFileForTests,
  File,
  handleFileWorkerProcessChunk,
  handleFileWorkerProcessComplete,
  handleFileWorkerProcessError,
  handleFileWorkerProcessProgress,
  FileReadChunk,
  registerBrowserFile,
} from "../../src/core/File";
import {
  CALL_FILE_WORKER_PROCESS_CANCEL,
  CALL_FILE_WORKER_PROCESS_START,
  findCall,
  getCallArg,
  resetCalls,
} from "./FfiTestImports";

class FileWorkerProcessOwner {
  chunkCount: i32 = 0;
  progressCount: i32 = 0;
  completeCount: i32 = 0;
  errorCount: i32 = 0;
  lastFileName: string | null = null;
  lastProcessedBytes: u64 = 0;
  lastTotalBytes: u64 = 0;
  lastMessage: string = "";
  lastChunkText: string = "";
  lastChunkOffset: u64 = 0;
}

describe("File worker processing", () => {
  afterEach(() => {
    __resetFileForTests();
    Application.unmount();
    resetCalls();
  });

  it("starts a picked-file worker processing request through the host surface", () => {
    const file = registerBrowserFile("picked-file-1", "todo.txt", "text/plain", 10);
    const capabilities = File.capabilities();

    File.processFileInWorker(file)
      .saveToPickedFile("todo-copy.txt")
      .chunkBytes(32768)
      .start();

    const startCall = findCall(CALL_FILE_WORKER_PROCESS_START);
    expect<bool>(capabilities.canProcessInWorkerToPickedFile).toBe(true);
    expect<i32>(startCall).toBeGreaterThan(-1);
    expect<f64>(getCallArg(startCall, 1)).toBe(32768);
    expect<f64>(getCallArg(startCall, 2)).toBe(1);
  });

  it("routes worker-process progress and completion to owner-bound callbacks", () => {
    const owner = new FileWorkerProcessOwner();
    const file = registerBrowserFile("picked-file-1", "todo.txt", "text/plain", 10);

    File.processFileInWorker(file)
      .saveToPickedFile("todo-copy.txt")
      .onProgressWith<FileWorkerProcessOwner>(owner, (target, progress) => {
        target.progressCount += 1;
        target.lastProcessedBytes = progress.processedBytes;
        target.lastTotalBytes = progress.totalBytes;
        target.lastFileName = progress.outputFileName;
      })
      .onCompleteWith<FileWorkerProcessOwner>(owner, (target, result) => {
        target.completeCount += 1;
        target.lastProcessedBytes = result.processedBytes;
        target.lastFileName = result.outputFileName;
      })
      .start();

    handleFileWorkerProcessProgress(1, 4, 10, "todo-copy.txt");
    handleFileWorkerProcessComplete(1, 10, "todo-copy.txt");
    handleFileWorkerProcessProgress(1, 10, 10, "ignored.txt");

    expect<i32>(owner.progressCount).toBe(1);
    expect<i32>(owner.completeCount).toBe(1);
    expect<u64>(owner.lastProcessedBytes).toBe(10);
    expect<u64>(owner.lastTotalBytes).toBe(10);
    expect<string>(owner.lastFileName === null ? "" : changetype<string>(owner.lastFileName)).toBe("todo-copy.txt");
  });

  it("streams worker chunks without opening the picked-file path", () => {
    const owner = new FileWorkerProcessOwner();
    const file = registerBrowserFile("picked-file-1", "todo.txt", "text/plain", 10);

    File.processFileInWorker(file)
      .chunkBytes(4)
      .onChunkWith<FileWorkerProcessOwner>(owner, (target, chunk) => {
        target.chunkCount += 1;
        target.lastChunkOffset = chunk.offsetBytes;
        target.lastChunkText = String.UTF8.decodeUnsafe(chunk.bytes.dataStart, chunk.bytes.length, false);
      })
      .onProgressWith<FileWorkerProcessOwner>(owner, (target, progress) => {
        target.progressCount += 1;
        target.lastProcessedBytes = progress.processedBytes;
        target.lastTotalBytes = progress.totalBytes;
        target.lastFileName = progress.outputFileName;
      })
      .onCompleteWith<FileWorkerProcessOwner>(owner, (target, result) => {
        target.completeCount += 1;
        target.lastProcessedBytes = result.processedBytes;
        target.lastFileName = result.outputFileName;
      })
      .start();

    handleFileWorkerProcessChunk(1, new FileReadChunk(0, 10, Uint8Array.wrap(String.UTF8.encode("todo", false))));
    handleFileWorkerProcessProgress(1, 4, 10, null);
    handleFileWorkerProcessChunk(1, new FileReadChunk(4, 10, Uint8Array.wrap(String.UTF8.encode(".txt", false))));
    handleFileWorkerProcessProgress(1, 8, 10, null);
    handleFileWorkerProcessChunk(1, new FileReadChunk(8, 10, Uint8Array.wrap(String.UTF8.encode("!!", false))));
    handleFileWorkerProcessProgress(1, 10, 10, null);
    handleFileWorkerProcessComplete(1, 10, null);

    const startCall = findCall(CALL_FILE_WORKER_PROCESS_START);
    expect<i32>(owner.chunkCount).toBe(3);
    expect<i32>(owner.progressCount).toBe(3);
    expect<i32>(owner.completeCount).toBe(1);
    expect<string>(owner.lastChunkText).toBe("!!");
    expect<u64>(owner.lastChunkOffset).toBe(8);
    expect<u64>(owner.lastProcessedBytes).toBe(10);
    expect<string>(owner.lastFileName === null ? "" : changetype<string>(owner.lastFileName)).toBe("");
    expect<f64>(getCallArg(startCall, 2)).toBe(0);
  });

  it("rejects worker processing without a sink or chunk callback", () => {
    const owner = new FileWorkerProcessOwner();
    const file = registerBrowserFile("picked-file-1", "todo.txt", "text/plain", 10);

    File.processFileInWorker(file)
      .onErrorWith<FileWorkerProcessOwner>(owner, (target, message) => {
        target.errorCount += 1;
        target.lastMessage = message;
      })
      .start();

    expect<i32>(findCall(CALL_FILE_WORKER_PROCESS_START)).toBe(-1);
    expect<i32>(owner.errorCount).toBe(1);
    expect<bool>(owner.lastMessage.indexOf("saveToPickedFile") >= 0).toBe(true);
  });

  it("supports eager disposal for worker-process requests", () => {
    const owner = new FileWorkerProcessOwner();
    const file = registerBrowserFile("picked-file-1", "todo.txt", "text/plain", 10);
    const request = File.processFileInWorker(file)
      .saveToPickedFile("todo-copy.txt")
      .onErrorWith<FileWorkerProcessOwner>(owner, (target, message) => {
        target.errorCount += 1;
        target.lastMessage = message;
      })
      .start();

    request.dispose();
    handleFileWorkerProcessError(1, 3, "ignored after dispose");

    expect<i32>(findCall(CALL_FILE_WORKER_PROCESS_CANCEL)).toBeGreaterThan(-1);
    expect<i32>(owner.errorCount).toBe(0);
  });
});
