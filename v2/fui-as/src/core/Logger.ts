import { KeyEventType, PointerEventType, fui_log, fui_logs_enabled } from "./ffi";

function writeUtf8(text: string): Uint8Array {
  return Uint8Array.wrap(String.UTF8.encode(text, false));
}

export function describeValue<T>(value: T): string {
  if (isString<T>()) {
    return "\"" + changetype<string>(value) + "\"";
  }
  if (isBoolean<T>()) {
    return changetype<bool>(value) ? "true" : "false";
  }
  if (isInteger<T>() || isFloat<T>()) {
    return value.toString();
  }
  return "<type#" + idof<T>().toString() + ">";
}

export function log(category: string, message: string): void {
  if (!logsEnabled()) {
    return;
  }
  writeLog(category, message);
}

export function warn(category: string, message: string): void {
  writeLog("Warning/" + category, message);
}

export function error(category: string, message: string): void {
  writeLog("Error/" + category, message);
}

function writeLog(category: string, message: string): void {
  const cat = writeUtf8(category);
  const msg = writeUtf8(message);
  fui_log(
    cat.length > 0 ? cat.dataStart : 0,
    <u32>cat.length,
    msg.length > 0 ? msg.dataStart : 0,
    <u32>msg.length,
  );
}

function logsEnabled(): bool {
  return fui_logs_enabled();
}

export function describeHandle(handle: u64): string {
  return handle.toString();
}

export function describePointerEventType(eventType: PointerEventType): string {
  switch (eventType) {
    case PointerEventType.Down:
      return "down";
    case PointerEventType.Up:
      return "up";
    case PointerEventType.Move:
      return "move";
    case PointerEventType.Enter:
      return "enter";
    case PointerEventType.Leave:
      return "leave";
    case PointerEventType.Cancel:
      return "cancel";
    default:
      return "pointer(" + (<u32>eventType).toString() + ")";
  }
}

export function describeKeyEventType(eventType: KeyEventType): string {
  switch (eventType) {
    case KeyEventType.Down:
      return "down";
    case KeyEventType.Up:
      return "up";
    default:
      return "key(" + (<u32>eventType).toString() + ")";
  }
}
