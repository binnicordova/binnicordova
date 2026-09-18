#!/usr/bin/env bash
# Rebuild assets/ from resources/. The encoded files are not committed: they are
# a pure function of the source recordings and this script, and they also live
# in public/ once published.
#
#   bash scrollcraft/builds/one-device/encode.sh      (from the repository root)
#
# Two things here are not cosmetic.
#
# REDACTION. These are real production recordings and they carry real data.
#   * miMarket is a Coca-Cola B2B field-sales app. Its record rows carry
#     customer names, account numbers and street addresses, and its Home screen
#     carries a salesperson's name. The recording also has a device frame baked
#     into it, so the screen is cropped out of it first and the whole content
#     band is blurred, leaving the app chrome sharp. The clip stops before the
#     client-detail screen, which puts a customer's name in the title bar where
#     no band blur can reach it.
#   * Platanitos stops before the account screen (full legal name, email).
#   * PlacaOk stops before the share sheet (phone number).
#   * PickPointer is used as a still only, taken before its Google sign-in
#     screen (full legal name, email).
#   * The Itaú recording is not used as a leg at all: it types a personal email
#     into a form, ends on an error screen, and runs at 4fps. Only its login
#     screen survives, as a still.
#
# SEEKING. `-ss` on a GIF lands on the wrong content, because GIF frame delays
# are variable and the timestamps do not map linearly. The `trim` filter is
# worse. Anything needing an accurate window is decoded to a constant-frame-rate
# intermediate first, and seeked in that.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
R="$ROOT/resources"
A="$(cd "$(dirname "$0")" && pwd)/assets"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FF="${SCROLLCRAFT_FFMPEG:-$(command -v ffmpeg)}"
FP="$(dirname "$FF")/ffprobe"; [ -x "$FP" ] || FP="$(command -v ffprobe)"
mkdir -p "$A"

# The screen canvas. Every leg is normalised to it, so object-fit never has to
# crop anything at runtime.
DW=440; DH=880; MW=300; MH=600

# leg <name> <src> <ss> <dur> <setpts>
#   Dense GOP because scrubbing is random access: a sparse-GOP file plays
#   perfectly and scrubs like mud. Audio stripped; these are never played.
leg () {
  local name=$1 src=$2 ss=$3 dur=$4 pts=${5:-1}
  local v W H G C F SF
  for v in d m; do
    if [ "$v" = d ]; then W=$DW; H=$DH; G=8; C=20; F=25; SF=""
    else                  W=$MW; H=$MH; G=4; C=24; F=20; SF="-m"; fi
    "$FF" -y -v error -ss "$ss" -t "$dur" -i "$src" -an \
      -vf "setpts=${pts}*PTS,scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H}:(iw-${W})/2:(ih-${H})*0.7,fps=${F},format=yuv420p" \
      -c:v libx264 -profile:v high -preset slow -crf $C \
      -g $G -keyint_min $G -sc_threshold 0 -movflags +faststart \
      "$A/${name}${SF}.mp4"
  done
  # Poster from the ENCODED file: the encode changes the pixels, so a still
  # taken from the master does not match the frame the browser decodes.
  "$FF" -y -v error -i "$A/${name}.mp4" -frames:v 1 -update 1 -q:v 4 "$A/${name}.jpg"
  printf '%-11s %-7s %-7s %ss\n' "$name" \
    "$(du -h "$A/${name}.mp4" | cut -f1)" "$(du -h "$A/${name}-m.mp4" | cut -f1)" \
    "$("$FP" -v error -show_entries format=duration -of csv=p=0 "$A/${name}.mp4")"
}

plate () {
  "$FF" -y -v error -ss "$3" -i "$2" -frames:v 1 -update 1 \
    -vf "scale=220:440:force_original_aspect_ratio=increase:flags=lanczos,crop=220:440:(iw-220)/2:(ih-440)*0.6" \
    -q:v 4 "$A/plate-$1.jpg"
}

echo "intermediates"
# Screen cropped out of the baked-in device frame, then the content band blurred.
"$FF" -y -v error -i "$R/demo-miMarket.gif" -filter_complex \
  "[0:v]crop=196:446:15:19,split[base][t];[t]crop=196:298:0:84,boxblur=luma_radius=8:luma_power=2[b];[base][b]overlay=0:84,format=yuv420p[v]" \
  -map "[v]" -an -c:v libx264 -crf 12 -preset fast "$TMP/mimarket.mp4"
# Constant frame rate, so the trim window below lands where it says it does.
"$FF" -y -v error -i "$R/demo-platanitos-app.gif" -vf "fps=25,crop=246:440:0:0,format=yuv420p" \
  -c:v libx264 -crf 12 -preset fast "$TMP/platanitos.mp4"

echo
printf '%-11s %-7s %-7s %s\n' leg desktop mobile duration
# Pace is weight / clip_seconds, held at ~0.214 across every leg so the world
# never surges or drags. Weights live in index.html as data-sc-w.
leg 01-signal  "$TMP/platanitos.mp4"      0.5  6.6  1.0606   # 1.5vh
leg 02-surface "$R/demo-nfl.gif"         27.2  7.0  1         # 1.5vh
leg 03-inside  "$R/demo-saludables.gif"   1.5 14.9  1         # 3.2vh  the peak
leg 04-record  "$R/demo-vifacilita.gif"   0.05 5.4  1.5556    # 1.8vh
leg 05-range   "$TMP/mimarket.mp4"        3.0  6.2  1.3548    # 1.8vh
leg 06-arrival "$R/demo-placaok.gif"      0.5  7.0  1         # 1.5vh

echo
echo "plates"
plate itu         "$R/demo-itu-app.gif"          0.2
plate pickpointer "$R/demo-pickpointer-app.gif"  0.2
plate tokai       "$R/demo-tokai.gif"            0.1
plate hablando    "$R/demo-hablandohuevadas.gif" 0.3
plate aguaviva    "$R/demo-aguaviva-702x1600.png" 0
plate pittigo     "$R/demo-pittigo-1424x2880.png" 0

echo
echo "portrait"
# Subject lifted with macOS Vision (see cutout.swift), alpha eroded to kill the
# violet fringe the original background left on the shoulder and hair edges.
if [ -f "$A/binni.png" ]; then echo "  assets/binni.png present, left alone"
else echo "  MISSING assets/binni.png - run cutout.swift, see its header"; fi

echo
echo "social card"
[ -f "$A/og.jpg" ] || echo "  MISSING assets/og.jpg - screenshot the hero at 1200x630"

du -sh "$A"
