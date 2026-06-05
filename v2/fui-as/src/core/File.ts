import { Callback1, Handler1 } from "./Callbacks";
import { Disposable } from "./Disposable";
import { throwNullArgument } from "./Errors";
import {
  fui_file_capabilities,
  fui_file_create_writer,
  fui_file_pick,
  fui_file_process_worker_cancel,
  fui_file_process_worker_start,
  fui_file_read_chunk,
  fui_file_save_bytes,
  fui_file_save_text,
  fui_file_writer_finish,
  fui_file_writer_write_bytes,
  fui_file_writer_write_text,
} from "./ffi";
import { warn } from "./Logger";
import { bind1 } from "./bind";

const FUNCTION_PICK_WITH = "FileOpenRequest.pickWith";
const FUNCTION_READ_BYTES_CHUNK_WITH = "BrowserFile.readBytesChunkWith";
const FUNCTION_SAVE_TEXT_WITH = "FileSaveRequest.saveTextWith";
const FUNCTION_SAVE_BYTES_WITH = "FileSaveRequest.saveBytesWith";
const FUNCTION_CREATE_WRITER_WITH = "FileSaveRequest.createWriterWith";
const FUNCTION_FILE_WORKER_PROCESS_START = "FileWorkerProcessRequest.start";
const FUNCTION_WRITE_TEXT_CHUNK_WITH = "BrowserFileWriter.writeTextChunkWith";
const FUNCTION_WRITE_BYTES_CHUNK_WITH = "BrowserFileWriter.writeBytesChunkWith";
const FUNCTION_FINISH_WITH = "BrowserFileWriter.finishWith";

const FILE_STATUS_SUCCESS: u32 = 1;
const FILE_STATUS_CANCELLED: u32 = 2;
const FILE_STATUS_ERROR: u32 = 3;

const FILE_CAPABILITY_OPEN: u32 = 1 << 0;
const FILE_CAPABILITY_READ: u32 = 1 << 1;
const FILE_CAPABILITY_SAVE: u32 = 1 << 2;
const FILE_CAPABILITY_CHUNKED_READ: u32 = 1 << 3;
const FILE_CAPABILITY_CHUNKED_WRITE: u32 = 1 << 4;
const FILE_CAPABILITY_NATIVE_SAVE_PICKER: u32 = 1 << 5;
const FILE_CAPABILITY_PROCESS_WORKER_SAVE: u32 = 1 << 6;
const REQUEST_KIND_OPEN: u32 = 1;
const REQUEST_KIND_READ: u32 = 2;
const REQUEST_KIND_SAVE: u32 = 3;
const REQUEST_KIND_CREATE_WRITER: u32 = 4;
const REQUEST_KIND_WRITE: u32 = 5;
const REQUEST_KIND_FINISH: u32 = 6;

let nextFileRequestId: u32 = 1;
const browserFiles = new Map<string, BrowserFile>();
const pendingOpenRequests = new Map<u32, PendingOpenRequest>();
const pendingReadRequests = new Map<u32, PendingReadRequest>();
const pendingSaveRequests = new Map<u32, PendingSaveRequest>();
const pendingWriterCreateRequests = new Map<u32, PendingWriterCreateRequest>();
const pendingWriterWriteRequests = new Map<u32, PendingWriterWriteRequest>();
const pendingWriterFinishRequests = new Map<u32, PendingWriterFinishRequest>();
const pendingWorkerProcessRequests = new Map<u32, FileWorkerProcessRequest>();

function encodeUtf8(text: string): Uint8Array {
  return Uint8Array.wrap(String.UTF8.encode(text, false));
}

function nextRequestId(): u32 {
  return nextFileRequestId++;
}

function describeFileFailure(status: u32, fallback: string): string {
  if (status == FILE_STATUS_CANCELLED) {
    return "File operation was cancelled.";
  }
  return fallback;
}

function dispatchFileError(binding: Callback1<string> | null, message: string): void {
  if (binding !== null) {
    binding.invoke(message);
    return;
  }
  warn("File", message);
}

function registerPendingOpenRequest(request: PendingOpenRequest): u32 {
  const requestId = nextRequestId();
  pendingOpenRequests.set(requestId, request);
  return requestId;
}

function registerPendingReadRequest(request: PendingReadRequest): u32 {
  const requestId = nextRequestId();
  pendingReadRequests.set(requestId, request);
  return requestId;
}

function registerPendingSaveRequest(request: PendingSaveRequest): u32 {
  const requestId = nextRequestId();
  pendingSaveRequests.set(requestId, request);
  return requestId;
}

function registerPendingWriterCreateRequest(request: PendingWriterCreateRequest): u32 {
  const requestId = nextRequestId();
  pendingWriterCreateRequests.set(requestId, request);
  return requestId;
}

function registerPendingWriterWriteRequest(request: PendingWriterWriteRequest): u32 {
  const requestId = nextRequestId();
  pendingWriterWriteRequests.set(requestId, request);
  return requestId;
}

function registerPendingWriterFinishRequest(request: PendingWriterFinishRequest): u32 {
  const requestId = nextRequestId();
  pendingWriterFinishRequests.set(requestId, request);
  return requestId;
}

function registerPendingWorkerProcessRequest(request: FileWorkerProcessRequest): u32 {
  const requestId = nextRequestId();
  pendingWorkerProcessRequests.set(requestId, request);
  return requestId;
}

class FileRequestDisposable implements Disposable {
  private requestId: u32;
  private readonly kind: u32;

  constructor(kind: u32, requestId: u32) {
    this.kind = kind;
    this.requestId = requestId;
  }

  dispose(): void {
    if (this.requestId == 0) {
      return;
    }
    const requestId = this.requestId;
    this.requestId = 0;
    if (this.kind == REQUEST_KIND_OPEN) {
      pendingOpenRequests.delete(requestId);
      return;
    }
    if (this.kind == REQUEST_KIND_READ) {
      pendingReadRequests.delete(requestId);
      return;
    }
    if (this.kind == REQUEST_KIND_SAVE) {
      pendingSaveRequests.delete(requestId);
      return;
    }
    if (this.kind == REQUEST_KIND_CREATE_WRITER) {
      pendingWriterCreateRequests.delete(requestId);
      return;
    }
    if (this.kind == REQUEST_KIND_WRITE) {
      pendingWriterWriteRequests.delete(requestId);
      return;
    }
    if (this.kind == REQUEST_KIND_FINISH) {
      pendingWriterFinishRequests.delete(requestId);
    }
  }
}

class PendingOpenRequest {
  constructor(
    readonly completeBinding: Callback1<Array<BrowserFile>>,
    readonly errorBinding: Callback1<string> | null,
  ) {}
}

class PendingReadRequest {
  constructor(
    readonly completeBinding: Callback1<FileReadChunk>,
    readonly errorBinding: Callback1<string> | null,
  ) {}
}

class PendingSaveRequest {
  constructor(
    readonly completeBinding: Callback1<FileSaveResult>,
    readonly errorBinding: Callback1<string> | null,
  ) {}
}

class PendingWriterCreateRequest {
  constructor(
    readonly completeBinding: Callback1<BrowserFileWriter>,
    readonly errorBinding: Callback1<string> | null,
  ) {}
}

class PendingWriterWriteRequest {
  constructor(
    readonly completeBinding: Callback1<FileWriteProgress>,
    readonly errorBinding: Callback1<string> | null,
  ) {}
}

class PendingWriterFinishRequest {
  constructor(
    readonly completeBinding: Callback1<FileSaveResult>,
    readonly errorBinding: Callback1<string> | null,
  ) {}
}

export enum FileSaveMode {
  Download = 1,
  NativePicker = 2,
}

export class FileCapabilities {
  readonly canPickOpen: bool;
  readonly canRead: bool;
  readonly canSave: bool;
  readonly canReadChunks: bool;
  readonly canWriteChunks: bool;
  readonly canUseNativeSavePicker: bool;
  readonly canProcessInWorkerToPickedFile: bool;

  constructor(bits: u32) {
    this.canPickOpen = (bits & FILE_CAPABILITY_OPEN) != 0;
    this.canRead = (bits & FILE_CAPABILITY_READ) != 0;
    this.canSave = (bits & FILE_CAPABILITY_SAVE) != 0;
    this.canReadChunks = (bits & FILE_CAPABILITY_CHUNKED_READ) != 0;
    this.canWriteChunks = (bits & FILE_CAPABILITY_CHUNKED_WRITE) != 0;
    this.canUseNativeSavePicker = (bits & FILE_CAPABILITY_NATIVE_SAVE_PICKER) != 0;
    this.canProcessInWorkerToPickedFile = (bits & FILE_CAPABILITY_PROCESS_WORKER_SAVE) != 0;
  }
}

export class FileReadChunk {
  readonly offsetBytes: u64;
  readonly fileSizeBytes: u64;
  readonly bytes: Uint8Array;

  constructor(offsetBytes: u64, fileSizeBytes: u64, bytes: Uint8Array) {
    this.offsetBytes = offsetBytes;
    this.fileSizeBytes = fileSizeBytes;
    this.bytes = bytes;
  }

  get nextOffsetBytes(): u64 {
    return this.offsetBytes + <u64>this.bytes.length;
  }

  get reachedEof(): bool {
    return this.nextOffsetBytes >= this.fileSizeBytes;
  }
}

export class FileWriteProgress {
  readonly writtenBytes: u64;
  readonly totalWrittenBytes: u64;

  constructor(writtenBytes: u64, totalWrittenBytes: u64) {
    this.writtenBytes = writtenBytes;
    this.totalWrittenBytes = totalWrittenBytes;
  }
}

export class FileSaveResult {
  readonly fileName: string;
  readonly mode: FileSaveMode;
  readonly writtenBytes: u64;

  constructor(fileName: string, mode: FileSaveMode, writtenBytes: u64) {
    this.fileName = fileName;
    this.mode = mode;
    this.writtenBytes = writtenBytes;
  }
}

export class FileWorkerProcessProgress {
  readonly processedBytes: u64;
  readonly totalBytes: u64;
  readonly outputFileName: string | null;

  constructor(processedBytes: u64, totalBytes: u64, outputFileName: string | null) {
    this.processedBytes = processedBytes;
    this.totalBytes = totalBytes;
    this.outputFileName = outputFileName;
  }
}

export class FileWorkerProcessResult {
  readonly processedBytes: u64;
  readonly outputFileName: string | null;
  readonly workerResult: string | null;

  constructor(processedBytes: u64, outputFileName: string | null, workerResult: string | null = null) {
    this.processedBytes = processedBytes;
    this.outputFileName = outputFileName;
    this.workerResult = workerResult;
  }
}

export class BrowserFile {
  readonly id: string;
  name: string;
  mimeType: string | null;
  sizeBytes: u64;
  lastModifiedMs: u64;

  constructor(id: string, name: string, mimeType: string | null, sizeBytes: u64, lastModifiedMs: u64 = 0) {
    this.id = id;
    this.name = name;
    this.mimeType = mimeType;
    this.sizeBytes = sizeBytes;
    this.lastModifiedMs = lastModifiedMs;
  }

  readBytesChunkWith<Owner>(
    owner: Owner,
    offsetBytes: u64,
    maxBytes: u32,
    handler: Handler1<Owner, FileReadChunk>,
    errorHandler: Handler1<Owner, string> | null = null,
  ): Disposable {
    if (changetype<usize>(handler) == 0) {
      throwNullArgument(FUNCTION_READ_BYTES_CHUNK_WITH, "handler");
    }
    if (maxBytes == 0) {
      dispatchFileError(
        errorHandler === null ? null : bind1<Owner, string>(owner, errorHandler),
        "BrowserFile.readBytesChunkWith: maxBytes must be greater than zero.",
      );
      return new FileRequestDisposable(REQUEST_KIND_READ, 0);
    }
    const fileIdBytes = encodeUtf8(this.id);
    const requestId = registerPendingReadRequest(new PendingReadRequest(
      bind1<Owner, FileReadChunk>(owner, handler),
      errorHandler === null ? null : bind1<Owner, string>(owner, errorHandler),
    ));
    fui_file_read_chunk(
      requestId,
      fileIdBytes.length > 0 ? fileIdBytes.dataStart : 0,
      <u32>fileIdBytes.length,
      offsetBytes,
      maxBytes,
    );
    return new FileRequestDisposable(REQUEST_KIND_READ, requestId);
  }
}

export class FileWorkerProcessRequest implements Disposable {
  private readonly file: BrowserFile;
  private suggestedNameValue: string;
  private saveToPickedFileEnabled: bool = false;
  private chunkBytesValue: u32 = 64 * 1024;
  private chunkBinding: Callback1<FileReadChunk> | null = null;
  private progressBinding: Callback1<FileWorkerProcessProgress> | null = null;
  private completeBinding: Callback1<FileWorkerProcessResult> | null = null;
  private errorBinding: Callback1<string> | null = null;
  private requestId: u32 = 0;
  private started: bool = false;
  private finished: bool = false;

  constructor(file: BrowserFile) {
    this.file = file;
    this.suggestedNameValue = file.name;
  }

  suggestedName(value: string): this {
    if (changetype<usize>(value) == 0) {
      throwNullArgument("FileWorkerProcessRequest.suggestedName", "value");
    }
    this.suggestedNameValue = value;
    return this;
  }

  saveToPickedFile(value: string): this {
    this.saveToPickedFileEnabled = true;
    return this.suggestedName(value);
  }

  chunkBytes(value: u32): this {
    this.chunkBytesValue = value;
    return this;
  }

  onChunk<Owner>(owner: Owner, handler: Handler1<Owner, FileReadChunk>): this {
    if (changetype<usize>(handler) == 0) {
      throwNullArgument("FileWorkerProcessRequest.onChunk", "handler");
    }
    this.chunkBinding = bind1<Owner, FileReadChunk>(owner, handler);
    return this;
  }

  onChunkWith<Owner>(owner: Owner, handler: Handler1<Owner, FileReadChunk>): this {
    return this.onChunk<Owner>(owner, handler);
  }

  onProgress<Owner>(owner: Owner, handler: Handler1<Owner, FileWorkerProcessProgress>): this {
    if (changetype<usize>(handler) == 0) {
      throwNullArgument("FileWorkerProcessRequest.onProgress", "handler");
    }
    this.progressBinding = bind1<Owner, FileWorkerProcessProgress>(owner, handler);
    return this;
  }

  onProgressWith<Owner>(owner: Owner, handler: Handler1<Owner, FileWorkerProcessProgress>): this {
    return this.onProgress<Owner>(owner, handler);
  }

  onComplete<Owner>(owner: Owner, handler: Handler1<Owner, FileWorkerProcessResult>): this {
    if (changetype<usize>(handler) == 0) {
      throwNullArgument("FileWorkerProcessRequest.onComplete", "handler");
    }
    this.completeBinding = bind1<Owner, FileWorkerProcessResult>(owner, handler);
    return this;
  }

  onCompleteWith<Owner>(owner: Owner, handler: Handler1<Owner, FileWorkerProcessResult>): this {
    return this.onComplete<Owner>(owner, handler);
  }

  onError<Owner>(owner: Owner, handler: Handler1<Owner, string>): this {
    if (changetype<usize>(handler) == 0) {
      throwNullArgument("FileWorkerProcessRequest.onError", "handler");
    }
    this.errorBinding = bind1<Owner, string>(owner, handler);
    return this;
  }

  onErrorWith<Owner>(owner: Owner, handler: Handler1<Owner, string>): this {
    return this.onError<Owner>(owner, handler);
  }

  start(): this {
    if (this.finished) {
      warn("File", "FileWorkerProcessRequest.start ignored after the worker process already finished.");
      return this;
    }
    if (this.started) {
      warn("File", "FileWorkerProcessRequest.start ignored because the request already started.");
      return this;
    }
    if (this.chunkBytesValue == 0) {
      dispatchFileError(this.errorBinding, "FileWorkerProcessRequest.start: chunkBytes must be greater than zero.");
      return this;
    }
    if (!this.saveToPickedFileEnabled && this.chunkBinding === null) {
      dispatchFileError(this.errorBinding, "FileWorkerProcessRequest.start: either saveToPickedFile(...) or onChunk(...) is required.");
      return this;
    }
    const fileIdBytes = encodeUtf8(this.file.id);
    const suggestedNameBytes = encodeUtf8(this.suggestedNameValue);
    this.requestId = registerPendingWorkerProcessRequest(this);
    this.started = true;
    fui_file_process_worker_start(
      this.requestId,
      fileIdBytes.length > 0 ? fileIdBytes.dataStart : 0,
      <u32>fileIdBytes.length,
      suggestedNameBytes.length > 0 ? suggestedNameBytes.dataStart : 0,
      <u32>suggestedNameBytes.length,
      this.chunkBytesValue,
      this.saveToPickedFileEnabled,
    );
    return this;
  }

  cancel(): void {
    this.dispose();
  }

  dispose(): void {
    if (this.finished) {
      return;
    }
    if (this.requestId != 0) {
      const requestId = this.requestId;
      this.requestId = 0;
      pendingWorkerProcessRequests.delete(requestId);
      fui_file_process_worker_cancel(requestId);
    }
    this.finished = true;
    this.chunkBinding = null;
    this.progressBinding = null;
    this.completeBinding = null;
    this.errorBinding = null;
  }

  dispatchChunk(chunk: FileReadChunk): void {
    if (this.finished) {
      return;
    }
    const binding = this.chunkBinding;
    if (binding !== null) {
      binding.invoke(chunk);
    }
  }

  dispatchProgress(progress: FileWorkerProcessProgress): void {
    if (this.finished) {
      return;
    }
    const binding = this.progressBinding;
    if (binding !== null) {
      binding.invoke(progress);
    }
  }

  dispatchComplete(result: FileWorkerProcessResult): void {
    if (this.finished) {
      return;
    }
    const binding = this.completeBinding;
    this.finish();
    if (binding !== null) {
      binding.invoke(result);
    }
  }

  dispatchError(status: u32, message: string | null = null): void {
    if (this.finished) {
      return;
    }
    const binding = this.errorBinding;
    this.finish();
    dispatchFileError(binding, message === null ? describeFileFailure(status, "Worker file processing failed.") : message);
  }

  private finish(): void {
    const requestId = this.requestId;
    this.requestId = 0;
    if (requestId != 0) {
      pendingWorkerProcessRequests.delete(requestId);
    }
    this.started = false;
    this.finished = true;
    this.chunkBinding = null;
    this.progressBinding = null;
    this.completeBinding = null;
    this.errorBinding = null;
  }
}

export class BrowserFileWriter {
  readonly fileName: string;
  readonly mode: FileSaveMode;
  private readonly writerId: string;

  constructor(writerId: string, fileName: string, mode: FileSaveMode) {
    this.writerId = writerId;
    this.fileName = fileName;
    this.mode = mode;
  }

  writeTextChunkWith<Owner>(
    owner: Owner,
    text: string,
    handler: Handler1<Owner, FileWriteProgress>,
    errorHandler: Handler1<Owner, string> | null = null,
  ): Disposable {
    if (changetype<usize>(text) == 0) {
      throwNullArgument(FUNCTION_WRITE_TEXT_CHUNK_WITH, "text");
    }
    if (changetype<usize>(handler) == 0) {
      throwNullArgument(FUNCTION_WRITE_TEXT_CHUNK_WITH, "handler");
    }
    const writerIdBytes = encodeUtf8(this.writerId);
    const textBytes = encodeUtf8(text);
    const requestId = registerPendingWriterWriteRequest(new PendingWriterWriteRequest(
      bind1<Owner, FileWriteProgress>(owner, handler),
      errorHandler === null ? null : bind1<Owner, string>(owner, errorHandler),
    ));
    fui_file_writer_write_text(
      requestId,
      writerIdBytes.length > 0 ? writerIdBytes.dataStart : 0,
      <u32>writerIdBytes.length,
      textBytes.length > 0 ? textBytes.dataStart : 0,
      <u32>textBytes.length,
    );
    return new FileRequestDisposable(REQUEST_KIND_WRITE, requestId);
  }

  writeBytesChunkWith<Owner>(
    owner: Owner,
    bytes: Uint8Array,
    handler: Handler1<Owner, FileWriteProgress>,
    errorHandler: Handler1<Owner, string> | null = null,
  ): Disposable {
    if (changetype<usize>(bytes) == 0) {
      throwNullArgument(FUNCTION_WRITE_BYTES_CHUNK_WITH, "bytes");
    }
    if (changetype<usize>(handler) == 0) {
      throwNullArgument(FUNCTION_WRITE_BYTES_CHUNK_WITH, "handler");
    }
    const writerIdBytes = encodeUtf8(this.writerId);
    const requestId = registerPendingWriterWriteRequest(new PendingWriterWriteRequest(
      bind1<Owner, FileWriteProgress>(owner, handler),
      errorHandler === null ? null : bind1<Owner, string>(owner, errorHandler),
    ));
    fui_file_writer_write_bytes(
      requestId,
      writerIdBytes.length > 0 ? writerIdBytes.dataStart : 0,
      <u32>writerIdBytes.length,
      bytes.length > 0 ? bytes.dataStart : 0,
      <u32>bytes.length,
    );
    return new FileRequestDisposable(REQUEST_KIND_WRITE, requestId);
  }

  finishWith<Owner>(
    owner: Owner,
    handler: Handler1<Owner, FileSaveResult>,
    errorHandler: Handler1<Owner, string> | null = null,
  ): Disposable {
    if (changetype<usize>(handler) == 0) {
      throwNullArgument(FUNCTION_FINISH_WITH, "handler");
    }
    const writerIdBytes = encodeUtf8(this.writerId);
    const requestId = registerPendingWriterFinishRequest(new PendingWriterFinishRequest(
      bind1<Owner, FileSaveResult>(owner, handler),
      errorHandler === null ? null : bind1<Owner, string>(owner, errorHandler),
    ));
    fui_file_writer_finish(
      requestId,
      writerIdBytes.length > 0 ? writerIdBytes.dataStart : 0,
      <u32>writerIdBytes.length,
    );
    return new FileRequestDisposable(REQUEST_KIND_FINISH, requestId);
  }
}

export class FileOpenRequest {
  private acceptValue: string = "";
  private multipleValue: bool = false;

  accept(value: string): this {
    if (changetype<usize>(value) == 0) {
      throwNullArgument("FileOpenRequest.accept", "value");
    }
    this.acceptValue = value;
    return this;
  }

  multiple(flag: bool = true): this {
    this.multipleValue = flag;
    return this;
  }

  pickWith<Owner>(
    owner: Owner,
    handler: Handler1<Owner, Array<BrowserFile>>,
    errorHandler: Handler1<Owner, string> | null = null,
  ): Disposable {
    if (changetype<usize>(handler) == 0) {
      throwNullArgument(FUNCTION_PICK_WITH, "handler");
    }
    const acceptBytes = encodeUtf8(this.acceptValue);
    const requestId = registerPendingOpenRequest(new PendingOpenRequest(
      bind1<Owner, Array<BrowserFile>>(owner, handler),
      errorHandler === null ? null : bind1<Owner, string>(owner, errorHandler),
    ));
    fui_file_pick(
      requestId,
      acceptBytes.length > 0 ? acceptBytes.dataStart : 0,
      <u32>acceptBytes.length,
      this.multipleValue,
    );
    return new FileRequestDisposable(REQUEST_KIND_OPEN, requestId);
  }
}

export class FileSaveRequest {
  private suggestedNameValue: string = "";
  private mimeTypeValue: string = "";
  private fileExtensionValue: string = "";

  suggestedName(value: string): this {
    if (changetype<usize>(value) == 0) {
      throwNullArgument("FileSaveRequest.suggestedName", "value");
    }
    this.suggestedNameValue = value;
    return this;
  }

  mimeType(value: string): this {
    if (changetype<usize>(value) == 0) {
      throwNullArgument("FileSaveRequest.mimeType", "value");
    }
    this.mimeTypeValue = value;
    return this;
  }

  fileExtension(value: string): this {
    if (changetype<usize>(value) == 0) {
      throwNullArgument("FileSaveRequest.fileExtension", "value");
    }
    this.fileExtensionValue = value;
    return this;
  }

  saveTextWith<Owner>(
    owner: Owner,
    text: string,
    handler: Handler1<Owner, FileSaveResult>,
    errorHandler: Handler1<Owner, string> | null = null,
  ): Disposable {
    if (changetype<usize>(text) == 0) {
      throwNullArgument(FUNCTION_SAVE_TEXT_WITH, "text");
    }
    if (changetype<usize>(handler) == 0) {
      throwNullArgument(FUNCTION_SAVE_TEXT_WITH, "handler");
    }
    const suggestedNameBytes = encodeUtf8(this.suggestedNameValue);
    const mimeTypeBytes = encodeUtf8(this.mimeTypeValue);
    const extensionBytes = encodeUtf8(this.fileExtensionValue);
    const textBytes = encodeUtf8(text);
    const requestId = registerPendingSaveRequest(new PendingSaveRequest(
      bind1<Owner, FileSaveResult>(owner, handler),
      errorHandler === null ? null : bind1<Owner, string>(owner, errorHandler),
    ));
    fui_file_save_text(
      requestId,
      suggestedNameBytes.length > 0 ? suggestedNameBytes.dataStart : 0,
      <u32>suggestedNameBytes.length,
      mimeTypeBytes.length > 0 ? mimeTypeBytes.dataStart : 0,
      <u32>mimeTypeBytes.length,
      extensionBytes.length > 0 ? extensionBytes.dataStart : 0,
      <u32>extensionBytes.length,
      textBytes.length > 0 ? textBytes.dataStart : 0,
      <u32>textBytes.length,
    );
    return new FileRequestDisposable(REQUEST_KIND_SAVE, requestId);
  }

  saveBytesWith<Owner>(
    owner: Owner,
    bytes: Uint8Array,
    handler: Handler1<Owner, FileSaveResult>,
    errorHandler: Handler1<Owner, string> | null = null,
  ): Disposable {
    if (changetype<usize>(bytes) == 0) {
      throwNullArgument(FUNCTION_SAVE_BYTES_WITH, "bytes");
    }
    if (changetype<usize>(handler) == 0) {
      throwNullArgument(FUNCTION_SAVE_BYTES_WITH, "handler");
    }
    const suggestedNameBytes = encodeUtf8(this.suggestedNameValue);
    const mimeTypeBytes = encodeUtf8(this.mimeTypeValue);
    const extensionBytes = encodeUtf8(this.fileExtensionValue);
    const requestId = registerPendingSaveRequest(new PendingSaveRequest(
      bind1<Owner, FileSaveResult>(owner, handler),
      errorHandler === null ? null : bind1<Owner, string>(owner, errorHandler),
    ));
    fui_file_save_bytes(
      requestId,
      suggestedNameBytes.length > 0 ? suggestedNameBytes.dataStart : 0,
      <u32>suggestedNameBytes.length,
      mimeTypeBytes.length > 0 ? mimeTypeBytes.dataStart : 0,
      <u32>mimeTypeBytes.length,
      extensionBytes.length > 0 ? extensionBytes.dataStart : 0,
      <u32>extensionBytes.length,
      bytes.length > 0 ? bytes.dataStart : 0,
      <u32>bytes.length,
    );
    return new FileRequestDisposable(REQUEST_KIND_SAVE, requestId);
  }

  createWriterWith<Owner>(
    owner: Owner,
    handler: Handler1<Owner, BrowserFileWriter>,
    errorHandler: Handler1<Owner, string> | null = null,
  ): Disposable {
    if (changetype<usize>(handler) == 0) {
      throwNullArgument(FUNCTION_CREATE_WRITER_WITH, "handler");
    }
    const suggestedNameBytes = encodeUtf8(this.suggestedNameValue);
    const mimeTypeBytes = encodeUtf8(this.mimeTypeValue);
    const extensionBytes = encodeUtf8(this.fileExtensionValue);
    const requestId = registerPendingWriterCreateRequest(new PendingWriterCreateRequest(
      bind1<Owner, BrowserFileWriter>(owner, handler),
      errorHandler === null ? null : bind1<Owner, string>(owner, errorHandler),
    ));
    fui_file_create_writer(
      requestId,
      suggestedNameBytes.length > 0 ? suggestedNameBytes.dataStart : 0,
      <u32>suggestedNameBytes.length,
      mimeTypeBytes.length > 0 ? mimeTypeBytes.dataStart : 0,
      <u32>mimeTypeBytes.length,
      extensionBytes.length > 0 ? extensionBytes.dataStart : 0,
      <u32>extensionBytes.length,
    );
    return new FileRequestDisposable(REQUEST_KIND_CREATE_WRITER, requestId);
  }
}

export class File {
  static open(): FileOpenRequest {
    return new FileOpenRequest();
  }

  static save(): FileSaveRequest {
    return new FileSaveRequest();
  }

  static processFileInWorker(file: BrowserFile): FileWorkerProcessRequest {
    if (changetype<usize>(file) == 0) {
      throwNullArgument(FUNCTION_FILE_WORKER_PROCESS_START, "file");
    }
    return new FileWorkerProcessRequest(file);
  }

  static capabilities(): FileCapabilities {
    return new FileCapabilities(fui_file_capabilities());
  }

  static tryGetFile(id: string): BrowserFile | null {
    if (browserFiles.has(id)) {
      return unchecked(browserFiles.get(id));
    }
    return null;
  }
}

export function registerBrowserFile(
  id: string,
  name: string,
  mimeType: string | null,
  sizeBytes: u64,
  lastModifiedMs: u64 = 0,
): BrowserFile {
  if (browserFiles.has(id)) {
    const existing = unchecked(browserFiles.get(id));
    existing.name = name;
    existing.mimeType = mimeType;
    existing.sizeBytes = sizeBytes;
    existing.lastModifiedMs = lastModifiedMs;
    return existing;
  }
  const file = new BrowserFile(id, name, mimeType, sizeBytes, lastModifiedMs);
  browserFiles.set(id, file);
  return file;
}

export function handleFilePickResult(requestId: u32, status: u32, files: Array<BrowserFile>, message: string | null = null): void {
  const request = pendingOpenRequests.has(requestId) ? unchecked(pendingOpenRequests.get(requestId)) : null;
  pendingOpenRequests.delete(requestId);
  if (request === null) {
    return;
  }
  if (status == FILE_STATUS_SUCCESS) {
    request.completeBinding.invoke(files);
    return;
  }
  dispatchFileError(request.errorBinding, message === null ? describeFileFailure(status, "File picker failed.") : message);
}

export function handleFileReadChunkResult(
  requestId: u32,
  status: u32,
  chunk: FileReadChunk | null,
  message: string | null = null,
): void {
  const request = pendingReadRequests.has(requestId) ? unchecked(pendingReadRequests.get(requestId)) : null;
  pendingReadRequests.delete(requestId);
  if (request === null) {
    return;
  }
  if (status == FILE_STATUS_SUCCESS && chunk !== null) {
    request.completeBinding.invoke(chunk);
    return;
  }
  dispatchFileError(request.errorBinding, message === null ? describeFileFailure(status, "File read failed.") : message);
}

export function handleFileSaveResult(
  requestId: u32,
  status: u32,
  result: FileSaveResult | null,
  message: string | null = null,
): void {
  const request = pendingSaveRequests.has(requestId) ? unchecked(pendingSaveRequests.get(requestId)) : null;
  pendingSaveRequests.delete(requestId);
  if (request === null) {
    return;
  }
  if (status == FILE_STATUS_SUCCESS && result !== null) {
    request.completeBinding.invoke(result);
    return;
  }
  dispatchFileError(request.errorBinding, message === null ? describeFileFailure(status, "File save failed.") : message);
}

export function handleFileWriterCreated(
  requestId: u32,
  status: u32,
  writer: BrowserFileWriter | null,
  message: string | null = null,
): void {
  const request = pendingWriterCreateRequests.has(requestId) ? unchecked(pendingWriterCreateRequests.get(requestId)) : null;
  pendingWriterCreateRequests.delete(requestId);
  if (request === null) {
    return;
  }
  if (status == FILE_STATUS_SUCCESS && writer !== null) {
    request.completeBinding.invoke(writer);
    return;
  }
  dispatchFileError(request.errorBinding, message === null ? describeFileFailure(status, "Creating a file writer failed.") : message);
}

export function handleFileWriterProgress(
  requestId: u32,
  status: u32,
  progress: FileWriteProgress | null,
  message: string | null = null,
): void {
  const request = pendingWriterWriteRequests.has(requestId) ? unchecked(pendingWriterWriteRequests.get(requestId)) : null;
  pendingWriterWriteRequests.delete(requestId);
  if (request === null) {
    return;
  }
  if (status == FILE_STATUS_SUCCESS && progress !== null) {
    request.completeBinding.invoke(progress);
    return;
  }
  dispatchFileError(request.errorBinding, message === null ? describeFileFailure(status, "File write failed.") : message);
}

export function handleFileWriterFinished(
  requestId: u32,
  status: u32,
  result: FileSaveResult | null,
  message: string | null = null,
): void {
  const request = pendingWriterFinishRequests.has(requestId) ? unchecked(pendingWriterFinishRequests.get(requestId)) : null;
  pendingWriterFinishRequests.delete(requestId);
  if (request === null) {
    return;
  }
  if (status == FILE_STATUS_SUCCESS && result !== null) {
    request.completeBinding.invoke(result);
    return;
  }
  dispatchFileError(request.errorBinding, message === null ? describeFileFailure(status, "Finishing the file writer failed.") : message);
}

export function handleFileWorkerProcessProgress(
  requestId: u32,
  processedBytes: u64,
  totalBytes: u64,
  outputFileName: string | null,
): void {
  const request = pendingWorkerProcessRequests.has(requestId) ? unchecked(pendingWorkerProcessRequests.get(requestId)) : null;
  if (request === null) {
    return;
  }
  request.dispatchProgress(new FileWorkerProcessProgress(processedBytes, totalBytes, outputFileName));
}

export function handleFileWorkerProcessChunk(requestId: u32, chunk: FileReadChunk | null): void {
  const request = pendingWorkerProcessRequests.has(requestId) ? unchecked(pendingWorkerProcessRequests.get(requestId)) : null;
  if (request === null || chunk === null) {
    return;
  }
  request.dispatchChunk(chunk);
}

export function handleFileWorkerProcessComplete(
  requestId: u32,
  processedBytes: u64,
  outputFileName: string | null,
  workerResult: string | null = null,
): void {
  const request = pendingWorkerProcessRequests.has(requestId) ? unchecked(pendingWorkerProcessRequests.get(requestId)) : null;
  if (request === null) {
    return;
  }
  request.dispatchComplete(new FileWorkerProcessResult(processedBytes, outputFileName, workerResult));
}

export function handleFileWorkerProcessError(requestId: u32, status: u32, message: string | null = null): void {
  const request = pendingWorkerProcessRequests.has(requestId) ? unchecked(pendingWorkerProcessRequests.get(requestId)) : null;
  if (request === null) {
    return;
  }
  request.dispatchError(status, message);
}

export function createBrowserFileWriter(writerId: string, fileName: string, mode: FileSaveMode): BrowserFileWriter {
  return new BrowserFileWriter(writerId, fileName, mode);
}

export function disposeAllFileRequests(): void {
  const workerProcessRequests = pendingWorkerProcessRequests.values();
  for (let index = 0; index < workerProcessRequests.length; ++index) {
    unchecked(workerProcessRequests[index]).dispose();
  }
  pendingOpenRequests.clear();
  pendingReadRequests.clear();
  pendingSaveRequests.clear();
  pendingWriterCreateRequests.clear();
  pendingWriterWriteRequests.clear();
  pendingWriterFinishRequests.clear();
  pendingWorkerProcessRequests.clear();
}

export function __resetFileForTests(): void {
  disposeAllFileRequests();
  browserFiles.clear();
  nextFileRequestId = 1;
}
