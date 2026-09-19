#!/usr/bin/env bash
# Build the portrait plate from resources/binnicordova.png.
#
#   bash scrollcraft/builds/one-device/portrait.sh     (from the repository root)
#
# The first version of this page floated the bare cutout and faded its bottom
# edge out with a mask. Against a black page that fade reads as the photograph
# having been cut off, which is exactly what it looked like. A fade is only
# convincing when there is nothing behind it, and at the close there is: the
# device, the field, the glow.
#
# So he gets a plate instead. The cutout is composited onto its own ground, the
# bottom edge of the image becomes the bottom edge of an object, and the page
# rounds its corners in CSS. It reads as one more plate in a room already full
# of them, which is the one that happens to be him.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
HERE="$(cd "$(dirname "$0")" && pwd)"
A="$HERE/assets"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FF="${SCROLLCRAFT_FFMPEG:-$(command -v ffmpeg)}"
mkdir -p "$A"

SRC="$ROOT/resources/binnicordova.png"
[ -f "$SRC" ] || { echo "missing $SRC"; exit 1; }

# 1. Lift the subject. Vision, not a background-colour key: the original
#    backdrop is a busy geometric print and no key would survive it.
if [ ! -x "$HERE/tools/cutout" ]; then
  ( cd "$HERE/tools" && swiftc -O cutout.swift -o cutout )
fi
"$HERE/tools/cutout" "$SRC" "$TMP/cut.png"

# 2. Erode the alpha by two pixels and soften it by one. Vision leaves a violet
#    rim of the old background blended into the hair and shoulder, and on black
#    that rim is the first thing you see.
"$FF" -y -v error -i "$TMP/cut.png" -filter_complex \
  "[0:v]split[c][a];[a]alphaextract,erosion,erosion,boxblur=1:1[al];[c][al]alphamerge" \
  -frames:v 1 -update 1 "$TMP/clean.png"

# 3. The plate. 3:4, a burgundy-into-black ground that ties to the device, a
#    soft pool of light behind his head, and him anchored to the bottom edge
#    with the crop taken wide enough to keep both shoulders.
W=690; H=920
"$FF" -y -v error \
  -f lavfi -i "color=c=#07070a:s=${W}x${H}:d=1" \
  -f lavfi -i "color=c=#2a0f18:s=${W}x${H}:d=1" \
  -f lavfi -i "color=c=#000000:s=${W}x${H}:d=1" \
  -i "$TMP/clean.png" \
  -filter_complex "\
    [1:v]geq=lum='255*exp(-(pow((X-W*0.52)/(W*0.62),2)+pow((Y-H*0.30)/(H*0.52),2)))':cb=128:cr=128,format=gray[glowmask];\
    [1:v][0:v][glowmask]maskedmerge[ground];\
    [3:v]scale=-1:${H}*0.98:flags=lanczos[sub];\
    [ground][sub]overlay=x=(W-w)/2:y=H-h:format=auto,\
    vignette=PI/5,\
    format=yuv420p[out]" \
  -map "[out]" -frames:v 1 -update 1 -q:v 2 "$A/binni-plate.jpg"

echo "assets/binni-plate.jpg  $(du -h "$A/binni-plate.jpg" | cut -f1)"

# A square crop of the same plate, for the touch icon and structured data.
"$FF" -y -v error -i "$A/binni-plate.jpg" \
  -vf "crop=${W}:${W}:0:0,scale=512:512:flags=lanczos" \
  -frames:v 1 -update 1 -q:v 3 "$A/binni-square.jpg"
echo "assets/binni-square.jpg $(du -h "$A/binni-square.jpg" | cut -f1)"
