import { error } from "./Logger";

export class ObjectDisposedError extends Error {
  constructor(functionName: string, objectName: string) {
    const message = functionName + ": " + objectName + " was disposed";
    super(message);
    this.name = "ObjectDisposedError";
  }
}

export class VirtualListItemBindingError extends Error {
  constructor() {
    const message = "VirtualList: item renderer not configured. Call .onBindItem() or .onBindItemWith() after construction.";
    super(message);
    this.name = "VirtualListItemBindingError";
  }
}

export function throwNullArgument(functionName: string, argumentName: string): void {
  error("Validation", functionName + ": " + argumentName + " must not be null");
  throw new TypeError(functionName + ": " + argumentName + " must not be null");
}

export function throwRangeError(functionName: string, argumentName: string, index: i32, min: i32, max: i32): void {
  error(
    "Validation",
    functionName +
      ": " +
      argumentName +
      " must be between " +
      min.toString() +
      " and " +
      max.toString() +
      " (received " +
      index.toString() +
      ")",
  );
  throw new RangeError(
    functionName +
      ": " +
      argumentName +
      " must be between " +
      min.toString() +
      " and " +
      max.toString() +
      " (received " +
      index.toString() +
      ")",
  );
}

export function throwObjectDisposed(functionName: string, objectName: string): void {
  const message = functionName + ": " + objectName + " was disposed";
  error("Lifecycle", message);
  throw new ObjectDisposedError(functionName, objectName);
}
