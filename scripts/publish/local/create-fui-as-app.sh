#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/lib/common.sh"

PACKAGE_DIR="${REPO_ROOT}/v2/create-fui-as-app"
TEMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "${TEMP_DIR}"
}
trap cleanup EXIT

log_step "Running @effindomv2/create-fui-as-app publish checks"
ensure_npm_deps "${PACKAGE_DIR}" "npm install --silent"
run_in_dir "${PACKAGE_DIR}" npm test
run_in_dir "${PACKAGE_DIR}" npm pack --dry-run >/dev/null

SCAFFOLD_DIR="${TEMP_DIR}/scaffold-smoke"
run_in_dir "${PACKAGE_DIR}" node dist/src/cli.js "${SCAFFOLD_DIR}"
SCAFFOLD_MVC_DIR="${TEMP_DIR}/scaffold-mvc-smoke"
run_in_dir "${PACKAGE_DIR}" node dist/src/cli.js "${SCAFFOLD_MVC_DIR}" --template mvc

if [ -d "${REPO_ROOT}/v2/fui-as" ] && [ -d "${REPO_ROOT}/v2/browser-bridge" ]; then
  node --input-type=module -e '
import { readFileSync, writeFileSync } from "node:fs";
const [packageJsonPath, repoRoot] = process.argv.slice(1);
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
packageJson.dependencies = Object.assign({}, packageJson.dependencies, {
  "@effindomv2/fui-as": `file:${repoRoot}/v2/fui-as`,
  "@effindomv2/runtime": `file:${repoRoot}/v2/browser-bridge`,
});
writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
' "${SCAFFOLD_DIR}/package.json" "${REPO_ROOT}"
  node --input-type=module -e '
import { readFileSync, writeFileSync } from "node:fs";
const [packageJsonPath, repoRoot] = process.argv.slice(1);
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
packageJson.dependencies = Object.assign({}, packageJson.dependencies, {
  "@effindomv2/fui-as": `file:${repoRoot}/v2/fui-as`,
  "@effindomv2/runtime": `file:${repoRoot}/v2/browser-bridge`,
});
writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
' "${SCAFFOLD_MVC_DIR}/package.json" "${REPO_ROOT}"
fi

log_step "Running scaffolded-app smoke build"
run_in_dir "${SCAFFOLD_DIR}" npm install --silent
run_in_dir "${SCAFFOLD_DIR}" npm run build
run_in_dir "${SCAFFOLD_DIR}" npm run test

log_step "Running scaffolded MVC app smoke build"
run_in_dir "${SCAFFOLD_MVC_DIR}" npm install --silent
run_in_dir "${SCAFFOLD_MVC_DIR}" npm run build
run_in_dir "${SCAFFOLD_MVC_DIR}" npm run test
