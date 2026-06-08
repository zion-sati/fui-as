#!/usr/bin/env bash

set -euo pipefail

PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "${PACKAGE_DIR}/../.." && pwd)"
DEMO_OUT_DIR="${REPO_ROOT}/public/v2/fui-as/demo"
HOST_SERVICE_GENERATOR_BUILD="${PACKAGE_DIR}/build/generate-host-services.mjs"
HOST_EVENT_GENERATOR_BUILD="${PACKAGE_DIR}/build/generate-host-events.mjs"
BUILD_TARGET="${1:-all}"

mkdir -p "${PACKAGE_DIR}/build" "${DEMO_OUT_DIR}"
cd "${PACKAGE_DIR}"

build_demo_app() {
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

generate_host_services "demo/src/host-services.ts" "demoHostServices" "demo/src/generated/HostServices.ts"
generate_host_events "demo/src/host-events.ts" "demoHostEvents" "demo/src/generated/HostEvents.ts"
generate_host_services "demo/src/worker-host-services.ts" "demoWorkerHostServices" "demo/src/generated/WorkerHostServices.ts"
generate_host_services "scripts/framework-host-services.ts" "frameworkHostServices" "src/core/generated/FrameworkHostServices.ts" "" "fui_host"

case "${BUILD_TARGET}" in
  all)
    build_demo_app "demo/src/dashboard.ts" "${DEMO_OUT_DIR}/demo.wasm"
    build_demo_app "demo/src/routes/demo_home.ts" "${DEMO_OUT_DIR}/home.wasm"
    build_demo_app "demo/src/routes/demo_advanced_controls.ts" "${DEMO_OUT_DIR}/advanced-controls.wasm"
    build_demo_app "demo/src/routes/templated-controls.ts" "${DEMO_OUT_DIR}/templated-controls.wasm"
    build_demo_app "demo/src/routes/demo_scrollbar_gutter.ts" "${DEMO_OUT_DIR}/scrollbar-gutter.wasm"
    ;;
  dashboard)
    build_demo_app "demo/src/dashboard.ts" "${DEMO_OUT_DIR}/demo.wasm"
    ;;
  home)
    build_demo_app "demo/src/routes/demo_home.ts" "${DEMO_OUT_DIR}/home.wasm"
    ;;
  advanced-controls|advanced)
    build_demo_app "demo/src/routes/demo_advanced_controls.ts" "${DEMO_OUT_DIR}/advanced-controls.wasm"
    ;;
  templated-controls|templated)
    build_demo_app "demo/src/routes/templated-controls.ts" "${DEMO_OUT_DIR}/templated-controls.wasm"
    ;;
  scrollbar-gutter)
    build_demo_app "demo/src/routes/demo_scrollbar_gutter.ts" "${DEMO_OUT_DIR}/scrollbar-gutter.wasm"
    ;;
  *)
    echo "Unknown build target: ${BUILD_TARGET}" >&2
    echo "Usage: bash scripts/build-demo-as.sh [all|dashboard|home|advanced-controls|templated-controls]" >&2
    exit 1
    ;;
esac
