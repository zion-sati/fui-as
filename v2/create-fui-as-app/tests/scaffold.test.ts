import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { createProject } from "../src/scaffold.js";

test("createProject writes hello-world scaffold including AssemblyScript tsconfig", () => {
  const root = mkdtempSync(join(tmpdir(), "create-fui-as-app-"));
  const target = join(root, "my-app");
  try {
    createProject({
      targetDirectory: target,
      projectName: "my-app",
    });

    const tsconfig = JSON.parse(readFileSync(join(target, "tsconfig.json"), "utf8")) as {
      extends: string;
      include: string[];
    };
    assert.equal(tsconfig.extends, "assemblyscript/std/assembly.json");
    assert.deepEqual(tsconfig.include, ["src/**/*.ts"]);

    const packageJson = JSON.parse(readFileSync(join(target, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    assert.equal(typeof packageJson.scripts.dev, "string");
    assert.equal(typeof packageJson.scripts.build, "string");
    assert.equal(typeof packageJson.scripts.test, "string");
    assert.equal(typeof packageJson.scripts["generate:host"], "string");
    assert.equal(readFileSync(join(target, "src", "HelloWorld.ts"), "utf8").includes("Hello world"), true);
    assert.equal(readFileSync(join(target, "README.md"), "utf8").includes("Hello World scaffold guide"), true);
    assert.equal(readFileSync(join(target, "src", "fui", "Fui.ts"), "utf8").includes("@effindomv2/fui-as/src/Fui"), true);
    assert.equal(readFileSync(join(target, "src", "host", "host-events.ts"), "utf8").includes("appHostEvents"), true);
    assert.equal(readFileSync(join(target, "src", "host", "host-services.ts"), "utf8").includes("appHostServices"), true);
    assert.equal(readFileSync(join(target, "src", "host", "generated", "HostEvents.ts"), "utf8").includes("onAppClockTick"), true);
    assert.equal(
      readFileSync(join(target, "src", "host", "generated", "HostServices.ts"), "utf8").includes("appClockNowUnixSeconds"),
      true,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("createProject writes mvc scaffold when template is mvc", () => {
  const root = mkdtempSync(join(tmpdir(), "create-fui-as-app-"));
  const target = join(root, "my-mvc-app");
  try {
    createProject({
      targetDirectory: target,
      projectName: "my-mvc-app",
      template: "mvc",
    });

    const packageJson = JSON.parse(readFileSync(join(target, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    assert.equal(typeof packageJson.scripts["build:wasm:home"], "string");
    assert.equal(typeof packageJson.scripts["build:wasm:settings"], "string");
    assert.equal(typeof packageJson.scripts["generate:host"], "string");
    assert.equal(
      readFileSync(join(target, "src", "routes", "home", "HomeController.ts"), "utf8").includes(
        "HomeController",
      ),
      true,
    );
    assert.equal(readFileSync(join(target, "src", "routes", "HomeApp.ts"), "utf8").includes("createManagedApplication"), true);
    assert.equal(readFileSync(join(target, "README.md"), "utf8").includes("MVC scaffold guide"), true);
    assert.equal(readFileSync(join(target, "src", "host", "host-events.ts"), "utf8").includes("appHostEvents"), true);
    assert.equal(readFileSync(join(target, "src", "host", "host-services.ts"), "utf8").includes("appHostServices"), true);
    assert.equal(readFileSync(join(target, "src", "fui", "Fui.ts"), "utf8").includes("@effindomv2/fui-as/src/Fui"), true);
    assert.equal(readFileSync(join(target, "src", "host", "generated", "HostEvents.ts"), "utf8").includes("onAppClockTick"), true);
    assert.equal(
      readFileSync(join(target, "src", "host", "generated", "HostServices.ts"), "utf8").includes("appClockNowUnixSeconds"),
      true,
    );
    assert.equal(readFileSync(join(target, "route-shell.html"), "utf8").includes("FUI-AS Routed Demo"), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("createProject fails on non-empty target directory", () => {
  const root = mkdtempSync(join(tmpdir(), "create-fui-as-app-"));
  const target = join(root, "existing-app");
  try {
    createProject({
      targetDirectory: target,
      projectName: "existing-app",
    });
    writeFileSync(join(target, "README.txt"), "occupied", "utf8");

    assert.throws(() =>
      createProject({
        targetDirectory: target,
        projectName: "existing-app",
      }),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
