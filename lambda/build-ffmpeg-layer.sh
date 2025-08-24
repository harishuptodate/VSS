#!/usr/bin/env bash
set -euo pipefail

# Choose CPU arch for your Lambda: x86_64 (this script uses x86_64 static build)
# If your Lambda is arm64, see Option B below.
ARCH="x86_64"

# Workspace setup
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAYER_DIR="${ROOT_DIR}/layer-ffmpeg"
BIN_DIR="${LAYER_DIR}/bin"
ZIP_OUT="${ROOT_DIR}/ffmpeg-layer.zip"

rm -f "$ZIP_OUT"
rm -rf "$LAYER_DIR"
mkdir -p "$BIN_DIR"

echo "==> Downloading static ffmpeg/ffprobe (Linux ${ARCH})"
# Source: John Van Sickle’s static Linux builds (x86_64)
# (These URLs change per release; “latest” always points to current)
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o /tmp/ffmpeg-static.tar.xz

echo "==> Extracting"
mkdir -p /tmp/ffmpeg-static
tar -xJf /tmp/ffmpeg-static.tar.xz -C /tmp/ffmpeg-static

# Find extracted dir (it contains ffmpeg and ffprobe)
EXTRACT_DIR="$(find /tmp/ffmpeg-static -maxdepth 1 -type d -name 'ffmpeg-*amd64-static' | head -n1)"
if [[ -z "$EXTRACT_DIR" ]]; then
  echo "Could not find extracted ffmpeg dir" >&2
  exit 1
fi

echo "==> Copying binaries to layer-ffmpeg/bin/"
cp "${EXTRACT_DIR}/ffmpeg"  "${BIN_DIR}/ffmpeg"
cp "${EXTRACT_DIR}/ffprobe" "${BIN_DIR}/ffprobe"
chmod +x "${BIN_DIR}/ffmpeg" "${BIN_DIR}/ffprobe"

echo "==> Verifying runtime paths"
# These become /opt/bin/{ffmpeg,ffprobe} at runtime
ls -l "${BIN_DIR}"

echo "==> Zipping layer to ${ZIP_OUT}"
cd "${LAYER_DIR}"
zip -r "${ZIP_OUT}" .
cd "${ROOT_DIR}"

echo "==> Done. Layer zip at: ${ZIP_OUT}"
