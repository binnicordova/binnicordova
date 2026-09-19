#!/usr/bin/env bash
# Copy the built site into the Firebase Hosting root. The build folder is the
# source of truth; public/ is disposable and rebuilt from it.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SRC="$ROOT/scrollcraft/builds/one-device"
DST="$ROOT/public"

rm -rf "$DST"
mkdir -p "$DST"
cp "$SRC/index.html" "$SRC/world.css" "$SRC/world.js" \
   "$SRC/scrollcraft.css" "$SRC/scrollcraft.js" \
   "$SRC/robots.txt" "$SRC/sitemap.xml" "$SRC/llms.txt" "$SRC/index.md" \
   "$SRC/Binni_Cordova_Resume.pdf" "$DST/"
# the cutout still ships for the structured-data image and anything that wants
# a transparent portrait; the plate is what the page actually renders
cp -R "$SRC/assets" "$DST/assets"   # includes assets/skills

echo "public/ rebuilt:"
du -sh "$DST"
find "$DST" -type f | wc -l | xargs echo "files:"
