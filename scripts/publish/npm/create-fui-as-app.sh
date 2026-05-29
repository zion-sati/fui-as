#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/lib/common.sh"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="${REPO_ROOT}/v2/create-fui-as-app"

bash "${SCRIPT_DIR}/../local/create-fui-as-app.sh"
publish_package "${PACKAGE_DIR}" "$@"
