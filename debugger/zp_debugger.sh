#!/bin/bash
TMP_DIR="/tmp/zp_debugger"
CUR_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
FLAGS="--disable-web-security --allow-file-access-from-files --user-data-dir=$TMP_DIR --load-extension=$CUR_DIR/extension file://$CUR_DIR/zp_debugger.html"

function cleanTmpDir {
    rm -rf $TMP_DIR > /dev/null
    mkdir  $TMP_DIR > /dev/null
}

function checkChromeRunning {
    if [ "$(ps ax | grep "$1" | grep -v "grep $1")" != "" ]; then
        echo "Google Chrome is already running. Please close it to continue"
        exit 1
    fi
}

if [ "$(uname)" == "Darwin" ]; then
    checkChromeRunning "Chrome Helper"
    cleanTmpDir
    open -a Google\ Chrome --args $FLAGS > /dev/null
    exit $?
else
    checkChromeRunning "google-chrome"
    cleanTmpDir
    google-chrome $FLAGS > /dev/null
    exit $?
fi
