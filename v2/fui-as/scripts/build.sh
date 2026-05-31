#!/usr/bin/env bash

set -euo pipefail

PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "${PACKAGE_DIR}/../.." && pwd)"
BROWSER_SRC_DIR="${PACKAGE_DIR}/browser/src"
SMOKE_FIXTURE_DIR="${PACKAGE_DIR}/tests/fixtures/smoke"
OUT_DIR="${REPO_ROOT}/public/v2/fui-as"
DEMO_OUT_DIR="${OUT_DIR}/demo"
WORKER_BUILD_DIR="${PACKAGE_DIR}/build/workers"
WORKER_BOOTSTRAP_BUILD="${PACKAGE_DIR}/build/worker-bootstrap.js"
WORKER_BOOTSTRAP_MAP_BUILD="${PACKAGE_DIR}/build/worker-bootstrap.js.map"
WORKER_HOST_SERVICES_BUILD="${PACKAGE_DIR}/build/worker-host-services.js"
WORKER_HOST_SERVICES_MAP_BUILD="${PACKAGE_DIR}/build/worker-host-services.js.map"
WORKER_MANIFEST_BUILD="${PACKAGE_DIR}/build/worker-manifest.json"
FILE_PROCESSING_WORKER_BUILD="${PACKAGE_DIR}/build/file-processing-worker.js"
FILE_PROCESSING_WORKER_MAP_BUILD="${PACKAGE_DIR}/build/file-processing-worker.js.map"
HOST_SERVICE_GENERATOR_BUILD="${PACKAGE_DIR}/build/generate-host-services.mjs"
HOST_EVENT_GENERATOR_BUILD="${PACKAGE_DIR}/build/generate-host-events.mjs"
RUNTIME_CONFIG_FILE="effindom-runtime-config.js"
DEFAULT_MANIFEST_PATH="./runtime/dist/effindom.v2.manifest.json"

rm -rf "${OUT_DIR}"
mkdir -p "${PACKAGE_DIR}/build" "${OUT_DIR}" "${DEMO_OUT_DIR}" "${WORKER_BUILD_DIR}"

cd "${PACKAGE_DIR}"

if [ -x "${PACKAGE_DIR}/node_modules/.bin/tsc" ]; then
  TSC_BIN="${PACKAGE_DIR}/node_modules/.bin/tsc"
elif [ -x "${REPO_ROOT}/node_modules/.bin/tsc" ]; then
  TSC_BIN="${REPO_ROOT}/node_modules/.bin/tsc"
else
  echo "Could not locate tsc in node_modules/.bin." >&2
  exit 1
fi

"${TSC_BIN}" -p tsconfig.json --noEmit

build_app() {
  local entry_file="$1"
  local wasm_out="$2"

  npx asc "${entry_file}" --config asconfig.json --target release
  cp "${PACKAGE_DIR}/build/app.wasm" "${wasm_out}"
  if [ -f "${PACKAGE_DIR}/build/app.wasm.map" ]; then
    cp "${PACKAGE_DIR}/build/app.wasm.map" "${wasm_out}.map"
  fi
}

build_worker() {
  local entry_file="$1"
  local wasm_out="$2"

  npx asc "${entry_file}" --config asconfig.json --target release
  cp "${PACKAGE_DIR}/build/app.wasm" "${wasm_out}"
  if [ -f "${PACKAGE_DIR}/build/app.wasm.map" ]; then
    cp "${PACKAGE_DIR}/build/app.wasm.map" "${wasm_out}.map"
  fi
}

generate_host_services() {
  local definition_file="$1"
  local export_name="$2"
  local output_file="$3"
  local primitives_import="${4:-}"
  local host_import_module="${5:-}"

  npx esbuild "${PACKAGE_DIR}/scripts/generate-host-services.ts" \
    --bundle \
    --format=esm \
    --platform=node \
    --target=node20 \
    --packages=external \
    --outfile="${HOST_SERVICE_GENERATOR_BUILD}"

  if [ -n "${primitives_import}" ] && [ -n "${host_import_module}" ]; then
    node "${HOST_SERVICE_GENERATOR_BUILD}" \
      "${definition_file}" "${export_name}" "${output_file}" "${primitives_import}" "${host_import_module}"
  elif [ -n "${primitives_import}" ]; then
    node "${HOST_SERVICE_GENERATOR_BUILD}" "${definition_file}" "${export_name}" "${output_file}" "${primitives_import}"
  elif [ -n "${host_import_module}" ]; then
    node "${HOST_SERVICE_GENERATOR_BUILD}" "${definition_file}" "${export_name}" "${output_file}" "" "${host_import_module}"
  else
    node "${HOST_SERVICE_GENERATOR_BUILD}" "${definition_file}" "${export_name}" "${output_file}"
  fi
}

generate_host_events() {
  local definition_file="$1"
  local export_name="$2"
  local output_file="$3"
  local primitives_import="${4:-}"

  npx esbuild "${PACKAGE_DIR}/scripts/generate-host-events.ts" \
    --bundle \
    --format=esm \
    --platform=node \
    --target=node20 \
    --packages=external \
    --outfile="${HOST_EVENT_GENERATOR_BUILD}"

  if [ -n "${primitives_import}" ]; then
    node "${HOST_EVENT_GENERATOR_BUILD}" "${definition_file}" "${export_name}" "${output_file}" "${primitives_import}"
  else
    node "${HOST_EVENT_GENERATOR_BUILD}" "${definition_file}" "${export_name}" "${output_file}"
  fi
}

find_worker_entries() {
  find \
    "${PACKAGE_DIR}/src/workers" \
    "${PACKAGE_DIR}/demo/src/workers" \
    "${SMOKE_FIXTURE_DIR}/workers" \
    -maxdepth 1 -type f -name '*.ts' 2>/dev/null | sort
}

resolve_runtime_dist_dir() {
  local candidate=""
  local candidates=()

  if [ -n "${EFFINDOM_RUNTIME_DIST_DIR:-}" ]; then
    candidates+=("${EFFINDOM_RUNTIME_DIST_DIR}")
  fi

  candidates+=(
    "${REPO_ROOT}/public/v2/browser-bridge"
    "${REPO_ROOT}/v2/browser-bridge/dist"
    "${PACKAGE_DIR}/node_modules/@effindomv2/runtime/dist"
    "${REPO_ROOT}/node_modules/@effindomv2/runtime/dist"
  )

  for candidate in "${candidates[@]}"; do
    if [ -f "${candidate}/bridge.js" ] && [ -f "${candidate}/effindom.v2.manifest.json" ] && [ -d "${candidate}/runtime" ]; then
      printf '%s\n' "${candidate}"
      return 0
    fi
  done

  echo "Could not locate runtime dist assets." >&2
  echo "Expected one of:" >&2
  echo "  - \$EFFINDOM_RUNTIME_DIST_DIR" >&2
  echo "  - ${PACKAGE_DIR}/node_modules/@effindomv2/runtime/dist" >&2
  echo "  - ${REPO_ROOT}/node_modules/@effindomv2/runtime/dist" >&2
  echo "  - ${REPO_ROOT}/v2/browser-bridge/dist" >&2
  echo "  - ${REPO_ROOT}/public/v2/browser-bridge" >&2
  echo "Install @effindomv2/runtime or build runtime assets first." >&2
  exit 1
}

RUNTIME_DIST_DIR="$(resolve_runtime_dist_dir)"

write_runtime_config() {
  local destination="$1"
  local manifest_url="$2"

  cat > "${destination}/${RUNTIME_CONFIG_FILE}" <<EOF
window.__effindomRuntime = Object.assign({}, window.__effindomRuntime, {
  manifestUrl: '${manifest_url}',
});
EOF
}

copy_runtime_assets() {
  local destination="$1"
  cp "${RUNTIME_DIST_DIR}/bridge.js" "${destination}/bridge.js"
  if [ -f "${RUNTIME_DIST_DIR}/bridge.js.map" ]; then
    cp "${RUNTIME_DIST_DIR}/bridge.js.map" "${destination}/bridge.js.map"
  else
    rm -f "${destination}/bridge.js.map"
  fi
  rm -f "${destination}/effindom.v2.manifest.json" "${destination}/icu-asset.json"
  rm -rf "${destination}/runtime"
  mkdir -p "${destination}/runtime/dist"
  cp "${RUNTIME_DIST_DIR}/effindom.v2.manifest.json" "${destination}/runtime/dist/effindom.v2.manifest.json"
  if [ -f "${RUNTIME_DIST_DIR}/icu-asset.json" ]; then
    cp "${RUNTIME_DIST_DIR}/icu-asset.json" "${destination}/runtime/dist/icu-asset.json"
  fi
  cp -R "${RUNTIME_DIST_DIR}/runtime" "${destination}/runtime/dist/runtime"
  mkdir -p "${destination}/runtime/fonts"
  if [ -d "${REPO_ROOT}/public/v2/fonts" ]; then
    cp -R "${REPO_ROOT}/public/v2/fonts/." "${destination}/runtime/fonts/"
  elif [ -d "${RUNTIME_DIST_DIR}/fonts" ]; then
    cp -R "${RUNTIME_DIST_DIR}/fonts/." "${destination}/runtime/fonts/"
  fi
}

build_workers() {
  rm -rf "${WORKER_BUILD_DIR}"
  mkdir -p "${WORKER_BUILD_DIR}"

  local worker_entry=""
  while IFS= read -r worker_entry; do
    [ -n "${worker_entry}" ] || continue
    local worker_name
    worker_name="$(basename "${worker_entry}" .ts)"
    build_worker "${worker_entry}" "${WORKER_BUILD_DIR}/${worker_name}.wasm"
  done < <(find_worker_entries)
}

write_worker_manifest() {
  declare -A worker_entries=()
  local worker_entry=""
  while IFS= read -r worker_entry; do
    [ -n "${worker_entry}" ] || continue
    local worker_name
    worker_name="$(basename "${worker_entry}" .ts)"
    local export_name=""
    while IFS= read -r export_name; do
      [ -n "${export_name}" ] || continue
      if [ -n "${worker_entries[$export_name]:-}" ]; then
        echo "Duplicate worker export name: ${export_name}" >&2
        exit 1
      fi
      worker_entries["${export_name}"]="./workers/${worker_name}.wasm"
    done < <(rg 'export function ([A-Za-z_][A-Za-z0-9_]*)\s*\(' "${worker_entry}" -or '$1')
  done < <(find_worker_entries)

  {
    printf '{\n  "version": 1,\n  "entries": {\n'
    local first=1
    local entry_name=""
    while IFS= read -r entry_name; do
      [ -n "${entry_name}" ] || continue
      if [ "${first}" -eq 0 ]; then
        printf ',\n'
      fi
      first=0
      printf '    "%s": "%s"' "${entry_name}" "${worker_entries[$entry_name]}"
    done < <(printf '%s\n' "${!worker_entries[@]}" | sort)
    printf '\n  }\n}\n'
  } > "${WORKER_MANIFEST_BUILD}"
}

copy_worker_assets() {
  local destination="$1"
  rm -rf "${destination}/workers"
  mkdir -p "${destination}/workers"
  shopt -s nullglob
  local worker_asset=""
  for worker_asset in "${WORKER_BUILD_DIR}"/*; do
    cp "${worker_asset}" "${destination}/workers/$(basename "${worker_asset}")"
  done
  shopt -u nullglob
  cp "${WORKER_BOOTSTRAP_BUILD}" "${destination}/worker-bootstrap.js"
  cp "${WORKER_BOOTSTRAP_MAP_BUILD}" "${destination}/worker-bootstrap.js.map"
  cp "${WORKER_HOST_SERVICES_BUILD}" "${destination}/worker-host-services.js"
  cp "${WORKER_HOST_SERVICES_MAP_BUILD}" "${destination}/worker-host-services.js.map"
  cp "${WORKER_MANIFEST_BUILD}" "${destination}/worker-manifest.json"
}

generate_host_services "demo/src/host-services.ts" "demoHostServices" "demo/src/generated/HostServices.ts"
generate_host_events "demo/src/host-events.ts" "demoHostEvents" "demo/src/generated/HostEvents.ts"
generate_host_services "demo/src/worker-host-services.ts" "demoWorkerHostServices" "demo/src/generated/WorkerHostServices.ts"
generate_host_services "scripts/framework-host-services.ts" "frameworkHostServices" "src/core/generated/FrameworkHostServices.ts" "" "fui_host"

build_app "tests/fixtures/smoke/app.ts" "${OUT_DIR}/app.wasm"
build_app "demo/src/dashboard.ts" "${DEMO_OUT_DIR}/demo.wasm"
build_app "demo/src/routes/demo_home.ts" "${DEMO_OUT_DIR}/home.wasm"
build_app "demo/src/routes/demo_advanced_controls.ts" "${DEMO_OUT_DIR}/advanced-controls.wasm"
build_app "demo/src/routes/templated-controls.ts" "${DEMO_OUT_DIR}/templated-controls.wasm"
build_workers
write_worker_manifest

npx esbuild "${SMOKE_FIXTURE_DIR}/harness.ts" \
  --bundle \
  --format=esm \
  --platform=browser \
  --target=es2020 \
  --minify \
  --outfile="${OUT_DIR}/harness.js" \
  --sourcemap

npx esbuild "${PACKAGE_DIR}/demo/harness.ts" \
  --bundle \
  --format=esm \
  --platform=browser \
  --target=es2020 \
  --minify \
  --outfile="${DEMO_OUT_DIR}/harness.js" \
  --sourcemap

npx esbuild "${BROWSER_SRC_DIR}/file-processing-worker.ts" \
  --bundle \
  --format=iife \
  --platform=browser \
  --target=es2020 \
  --minify \
  --outfile="${FILE_PROCESSING_WORKER_BUILD}" \
  --sourcemap

cp "${FILE_PROCESSING_WORKER_BUILD}" "${OUT_DIR}/file-processing-worker.js"
cp "${FILE_PROCESSING_WORKER_MAP_BUILD}" "${OUT_DIR}/file-processing-worker.js.map"
cp "${FILE_PROCESSING_WORKER_BUILD}" "${DEMO_OUT_DIR}/file-processing-worker.js"
cp "${FILE_PROCESSING_WORKER_MAP_BUILD}" "${DEMO_OUT_DIR}/file-processing-worker.js.map"

npx esbuild "${BROWSER_SRC_DIR}/worker-bootstrap.ts" \
  --bundle \
  --format=iife \
  --platform=browser \
  --target=es2020 \
  --minify \
  --outfile="${WORKER_BOOTSTRAP_BUILD}" \
  --sourcemap

npx esbuild "${PACKAGE_DIR}/demo/worker-host-services.ts" \
  --bundle \
  --format=iife \
  --platform=browser \
  --target=es2020 \
  --minify \
  --outfile="${WORKER_HOST_SERVICES_BUILD}" \
  --sourcemap

cp "${SMOKE_FIXTURE_DIR}/index.html" "${OUT_DIR}/index.html"
cp "${PACKAGE_DIR}/demo/index.html" "${DEMO_OUT_DIR}/index.html"
cp "${PACKAGE_DIR}/demo/demo-texture.png" "${DEMO_OUT_DIR}/demo-texture.png"
cp "${PACKAGE_DIR}/demo/demo-secondary-texture.png" "${DEMO_OUT_DIR}/demo-secondary-texture.png"

mkdir -p "${DEMO_OUT_DIR}/advanced-controls" "${DEMO_OUT_DIR}/templated-controls"
cp "${PACKAGE_DIR}/demo/route-shell.html" "${DEMO_OUT_DIR}/advanced-controls/index.html"
cp "${PACKAGE_DIR}/demo/route-shell.html" "${DEMO_OUT_DIR}/templated-controls/index.html"

copy_runtime_assets "${OUT_DIR}"
copy_runtime_assets "${DEMO_OUT_DIR}"
copy_worker_assets "${OUT_DIR}"
copy_worker_assets "${DEMO_OUT_DIR}"
write_runtime_config "${OUT_DIR}" "${DEFAULT_MANIFEST_PATH}"
write_runtime_config "${DEMO_OUT_DIR}" "${DEFAULT_MANIFEST_PATH}"
write_runtime_config "${DEMO_OUT_DIR}/advanced-controls" "../runtime/dist/effindom.v2.manifest.json"
write_runtime_config "${DEMO_OUT_DIR}/templated-controls" "../runtime/dist/effindom.v2.manifest.json"
