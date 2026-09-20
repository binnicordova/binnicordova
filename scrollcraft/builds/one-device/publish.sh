#!/usr/bin/env bash
# Copy the built site into the Firebase Hosting root. The build folder is the
# source of truth; public/ is disposable and rebuilt from it.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SRC="$ROOT/scrollcraft/builds/one-device"
DST="$ROOT/public"

# The rm below is only safe if this really is the source of truth. It was not:
# the encoded media is gitignored here, so a checkout without a prior encode.sh
# run leaves this folder holding the markup and none of the video, and the copy
# would publish a site whose every clip and poster 404s. Nothing is deleted
# until the source can account for every file the destination already has.
if [ -d "$DST/assets" ]; then
  MISSING="$(comm -23 \
    <(cd "$DST/assets" && find . -type f | sort) \
    <(cd "$SRC/assets" 2>/dev/null && find . -type f | sort || true))"
  if [ -n "$MISSING" ]; then
    echo "refusing to publish: the build folder is missing files that public/ has." >&2
    echo "$MISSING" | sed 's|^\./|  assets/|' >&2
    echo "run encode.sh, or copy them across, before publishing." >&2
    exit 1
  fi
fi

rm -rf "$DST"
mkdir -p "$DST"
# 404.html is served by Firebase Hosting for any path that matches no file.
# It has to be in this list: the rm -rf above means anything missing here is
# not stale in public/, it is gone.
cp "$SRC/index.html" "$SRC/404.html" "$SRC/world.css" "$SRC/world.js" \
   "$SRC/scrollcraft.css" "$SRC/scrollcraft.js" \
   "$SRC/robots.txt" "$SRC/sitemap.xml" "$SRC/llms.txt" "$SRC/index.md" \
   "$SRC/Binni_Cordova_Resume.pdf" "$DST/"
# the cutout still ships for the structured-data image and anything that wants
# a transparent portrait; the plate is what the page actually renders
cp -R "$SRC/assets" "$DST/assets"   # includes assets/skills

echo "public/ rebuilt:"
du -sh "$DST"
find "$DST" -type f | wc -l | xargs echo "files:"
