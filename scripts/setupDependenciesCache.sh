#!/bin/bash
set -e
set -o pipefail

cd "${CI_PROJECT_DIR:-$(pwd)}"

REQUESTED_CACHE_ROOT="${SHARED_CACHE_ROOT:-/opt/plugins-cache}"
LOCAL_CACHE_ROOT="${CI_PROJECT_DIR:-$(pwd)}/.shared-cache"

function prepareCacheRoot {
    local requested="$1"
    if mkdir -p "${requested}" 2>/dev/null && [[ -w "${requested}" ]]; then
        echo "${requested}"
        return
    fi

    mkdir -p "${LOCAL_CACHE_ROOT}"
    echo "Cache root ${requested} is unavailable, using ${LOCAL_CACHE_ROOT}" >&2
    echo "${LOCAL_CACHE_ROOT}"
}

CACHE_ROOT="$(prepareCacheRoot "${REQUESTED_CACHE_ROOT}")"
YARN_CACHE_DIR="${YARN_CACHE_FOLDER:-${CACHE_ROOT}/yarn}"
NODE_MODULES_CACHE_ROOT="${NODE_MODULES_CACHE_ROOT:-${CACHE_ROOT}/node_modules}"

mkdir -p "${YARN_CACHE_DIR}" "${NODE_MODULES_CACHE_ROOT}"

if [[ "${CI:-}" == "true" ]]; then
    printf 'cache-folder "%s"\n' "${YARN_CACHE_DIR}" > .yarnrc
fi

NODE_CACHE_KEY="$(node -p "process.platform + '-' + process.arch + '-modules-' + process.versions.modules")"
NODE_MODULES_HASH="$({
    printf '%s\n' "${NODE_CACHE_KEY}"
    sha256sum package.json yarn.lock
} | sha256sum | cut -d ' ' -f 1)"
NODE_MODULES_CACHE_ENTRY="${NODE_MODULES_CACHE_ROOT}/${NODE_MODULES_HASH}"
NODE_MODULES_CACHE_DIR="${NODE_MODULES_CACHE_ENTRY}/node_modules"
NODE_MODULES_CACHE_MARKER="${NODE_MODULES_CACHE_ENTRY}/.install-complete"

mkdir -p "${NODE_MODULES_CACHE_DIR}"
rm -rf node_modules
ln -s "${NODE_MODULES_CACHE_DIR}" node_modules

echo "Using Yarn cache: ${YARN_CACHE_DIR}"
echo "Using node_modules cache: ${NODE_MODULES_CACHE_DIR}"

function installDependencies {
    if [[ -f "${NODE_MODULES_CACHE_MARKER}" ]]; then
        echo "node_modules cache hit"
        return
    fi

    echo "node_modules cache miss"
    yarn install --frozen-lockfile --cache-folder "${YARN_CACHE_DIR}"
    touch "${NODE_MODULES_CACHE_MARKER}"
}

if command -v flock >/dev/null 2>&1; then
    (
        # 9 is a file descriptor number, not a timeout.
        exec 9>"${CACHE_ROOT}/dependencies-install.lock"
        flock 9
        installDependencies
    )
elif [[ "${CI:-}" == "true" ]]; then
    echo "flock is required for concurrent CI dependency cache access"
    exit 1
else
    installDependencies
fi
