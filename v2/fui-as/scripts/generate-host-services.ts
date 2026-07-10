import path from "node:path";
import { generateAssemblyScriptHostServicesFile } from "./hostgen/assemblyscript-host-services";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    throw new Error(
      "Usage: generate-host-services <module-path> <export-name> <output-path> [primitives-import] [host-import-module]",
    );
  }
  const [moduleArg, exportName, outputArg, primitivesImportArg, hostModuleArg] = args as [
    string,
    string,
    string,
    string | undefined,
    string | undefined,
  ];
  await generateAssemblyScriptHostServicesFile(
    path.resolve(process.cwd(), moduleArg),
    exportName,
    path.resolve(process.cwd(), outputArg),
    primitivesImportArg,
    hostModuleArg ?? "fui_host_service",
  );
}

await main();
