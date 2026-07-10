import { promises as fs } from "node:fs";
import path from "node:path";
import { listHostServiceMethods, type HostServiceTypeName } from "./registry";
import { loadModuleExport, relativeImport, sourcePathForHeader } from "./common";

function asTypeName(type: HostServiceTypeName): string {
  switch (type) {
    case "string":
      return "string";
    case "bool":
      return "bool";
    case "i32":
      return "i32";
    case "u32":
      return "u32";
    case "i64":
      return "i64";
    case "u64":
      return "u64";
    case "f64":
      return "f64";
    case "bytes":
      return "Uint8Array";
    case "i32_array":
      return "Int32Array";
    case "u32_array":
      return "Uint32Array";
    case "i64_array":
      return "Int64Array";
    case "u64_array":
      return "Uint64Array";
    case "f64_array":
      return "Float64Array";
    case "void":
      return "void";
  }
}

function isPointerLengthType(type: HostServiceTypeName): boolean {
  return (
    type === "string" ||
    type === "bytes" ||
    type === "i32_array" ||
    type === "u32_array" ||
    type === "i64_array" ||
    type === "u64_array" ||
    type === "f64_array"
  );
}

function returnsBufferType(type: HostServiceTypeName): boolean {
  return isPointerLengthType(type);
}

function emitExternalSignature(
  importName: string,
  args: readonly HostServiceTypeName[],
  returns: HostServiceTypeName,
  moduleName: string,
): string {
  const signatureParts: string[] = [];
  args.forEach((type, index) => {
    if (isPointerLengthType(type)) {
      signatureParts.push(`arg${String(index)}Ptr: usize`, `arg${String(index)}Len: u32`);
      return;
    }
    signatureParts.push(`arg${String(index)}: ${asTypeName(type)}`);
  });
  if (returnsBufferType(returns)) {
    signatureParts.push("resultPtr: usize", "resultCap: u32");
  }
  const returnType = returnsBufferType(returns) ? "u32" : asTypeName(returns);
  return [
    `@external("${moduleName}", "${importName}")`,
    `declare function __host_${importName}(${signatureParts.join(", ")}): ${returnType};`,
  ].join("\n");
}

function emitWrapper(
  importName: string,
  args: readonly HostServiceTypeName[],
  returns: HostServiceTypeName,
): string {
  const wrapperArgs = args.map((type, index) => `arg${String(index)}: ${asTypeName(type)}`);
  const lines: string[] = [];
  args.forEach((type, index) => {
    if (type === "string") {
      lines.push(
        `  const arg${String(index)}Bytes = Uint8Array.wrap(String.UTF8.encode(arg${String(index)}, false));`,
      );
      return;
    }
    if (
      type === "bytes" ||
      type === "i32_array" ||
      type === "u32_array" ||
      type === "i64_array" ||
      type === "u64_array" ||
      type === "f64_array"
    ) {
      lines.push(`  const arg${String(index)}Bytes = arg${String(index)};`);
    }
  });
  const callArgs: string[] = [];
  args.forEach((type, index) => {
    if (type === "string" || type === "bytes") {
      callArgs.push(`arg${String(index)}Bytes.length > 0 ? arg${String(index)}Bytes.dataStart : 0`);
      callArgs.push(`<u32>arg${String(index)}Bytes.length`);
      return;
    }
    if (
      type === "i32_array" ||
      type === "u32_array" ||
      type === "i64_array" ||
      type === "u64_array" ||
      type === "f64_array"
    ) {
      callArgs.push(`arg${String(index)}Bytes.length > 0 ? arg${String(index)}Bytes.dataStart : 0`);
      callArgs.push(`<u32>arg${String(index)}Bytes.length`);
      return;
    }
    callArgs.push(`arg${String(index)}`);
  });
  if (returnsBufferType(returns)) {
    lines.push("  const resultPtr = hostServiceResultBufferPtr();");
    lines.push("  const resultCap = hostServiceResultBufferSize();");
    callArgs.push("resultPtr", "resultCap");
    lines.push(`  const resultLen = __host_${importName}(${callArgs.join(", ")});`);
    if (returns === "string") {
      lines.push(`  return decodeHostServiceStringResult(resultPtr, resultLen, "${importName}");`);
    } else if (returns === "bytes") {
      lines.push(`  return decodeHostServiceBytesResult(resultPtr, resultLen, "${importName}");`);
    } else if (returns === "i32_array") {
      lines.push(`  return decodeHostServiceI32ArrayResult(resultPtr, resultLen, "${importName}");`);
    } else if (returns === "u32_array") {
      lines.push(`  return decodeHostServiceU32ArrayResult(resultPtr, resultLen, "${importName}");`);
    } else if (returns === "i64_array") {
      lines.push(`  return decodeHostServiceI64ArrayResult(resultPtr, resultLen, "${importName}");`);
    } else if (returns === "u64_array") {
      lines.push(`  return decodeHostServiceU64ArrayResult(resultPtr, resultLen, "${importName}");`);
    } else {
      lines.push(`  return decodeHostServiceF64ArrayResult(resultPtr, resultLen, "${importName}");`);
    }
  } else if (returns === "void") {
    lines.push(`  __host_${importName}(${callArgs.join(", ")});`);
  } else {
    lines.push(`  return __host_${importName}(${callArgs.join(", ")});`);
  }
  return [
    `export function ${importName}(${wrapperArgs.join(", ")}): ${returns === "string" ? "string" : asTypeName(returns)} {`,
    ...lines,
    "}",
  ].join("\n");
}

export async function generateAssemblyScriptHostServicesFile(
  modulePath: string,
  exportName: string,
  outputPath: string,
  primitivesImportOverride: string | undefined,
  moduleName: string,
): Promise<void> {
  const registry = await loadModuleExport(modulePath, exportName, "fui-host-services-");
  const methods = listHostServiceMethods(registry as never);
  const runtimeImport =
    primitivesImportOverride ??
    relativeImport(outputPath, path.resolve(path.dirname(modulePath), "..", "..", "src/FuiPrimitives.ts"));
  const blocks: string[] = [
    "// @ts-nocheck",
    `// Generated by hostgen from ${sourcePathForHeader(modulePath)}#${exportName}.`,
  ];
  if (methods.some((method) => returnsBufferType(method.returns))) {
    const helpers = [
      "hostServiceResultBufferPtr",
      "hostServiceResultBufferSize",
      ...new Set(
        methods
          .map((method) => method.returns)
          .filter((type) => returnsBufferType(type))
          .map((type) => {
            if (type === "string") return "decodeHostServiceStringResult";
            if (type === "bytes") return "decodeHostServiceBytesResult";
            if (type === "i32_array") return "decodeHostServiceI32ArrayResult";
            if (type === "u32_array") return "decodeHostServiceU32ArrayResult";
            if (type === "i64_array") return "decodeHostServiceI64ArrayResult";
            if (type === "u64_array") return "decodeHostServiceU64ArrayResult";
            return "decodeHostServiceF64ArrayResult";
          }),
      ),
    ];
    blocks.push(`import { ${helpers.join(", ")} } from "${runtimeImport}";`);
    blocks.push("");
  } else {
    blocks.push("");
  }
  methods.forEach((method, index) => {
    blocks.push(emitExternalSignature(method.importName, method.args, method.returns, moduleName));
    blocks.push("");
    blocks.push(emitWrapper(method.importName, method.args, method.returns));
    if (index + 1 < methods.length) {
      blocks.push("");
    }
  });
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${blocks.join("\n")}\n`, "utf8");
}

