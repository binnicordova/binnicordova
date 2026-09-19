#!/usr/bin/env bash
# Rebuild assets/ from resources/. Encoded files are not committed: they are a
# pure function of the source recordings and this script, and they ship in
# public/ once published.
#
#   bash scrollcraft/builds/one-device/encode.sh      (from the repository root)
#
# ---------------------------------------------------------------------------
# THE ORDER IS THE RESUME
# ---------------------------------------------------------------------------
# The four enterprise legs run in the order the resume prints them, newest
# first: Coca-Cola, NFL+, Itau, Platanitos. Gruppo GPI has no recording, so it
# gets a card without a leg, on the way into the peak. Everything under
# demo-own-* is his own work and lands together in the field at the end.
#
# ---------------------------------------------------------------------------
# REDACTION. These are real production recordings and they carry real data.
# ---------------------------------------------------------------------------
#   * miMarket is a Coca-Cola B2B field-sales app. Its record rows carry
#     customer names, account numbers and street addresses, and its Home screen
#     carries a salesperson's name. The recording also has a device frame baked
#     into it, so the screen is cropped out of it first and the whole content
#     band is blurred, leaving the app chrome sharp. The clip stops before the
#     client-detail screen, which puts a customer's name in the title bar where
#     no band blur can reach it.
#   * Itau is clean for 2.9 seconds only. At 3.2s it starts typing a personal
#     email into a form, and it ends on an error screen. The leg uses the login
#     and consent screens and is slowed to fill its span.
#   * Platanitos stops before the account screen (full legal name, email).
#   * cocap's photo picker holds personal family photographs including
#     children. The leg uses the onboarding carousel and the event form only,
#     and stops before the picker opens.
#   * placaok's share sheet exposes a phone number; only an early frame is used.
#
# ---------------------------------------------------------------------------
# SEEKING. `-ss` on a GIF lands on the wrong content, because GIF frame delays
# are variable and the timestamps do not map linearly. The `trim` filter is
# worse. Anything needing an accurate window is decoded to a constant-frame-rate
# intermediate first, and seeked in that.
# ---------------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
R="$ROOT/resources"
A="$(cd "$(dirname "$0")" && pwd)/assets"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FF="${SCROLLCRAFT_FFMPEG:-$(command -v ffmpeg)}"
FP="$(dirname "$FF")/ffprobe"; [ -x "$FP" ] || FP="$(command -v ffprobe)"
mkdir -p "$A"

# The screen canvas: 1206x2622 reduced, the real capture aspect of the device
# the own-work recordings came off, so those need no cropping at all.
DW=460; DH=1000; MW=300; MH=652

# leg <name> <src> <ss> <dur> <setpts>
#   Dense GOP because scrubbing is random access: a sparse-GOP file plays
#   perfectly and scrubs like mud. Audio stripped; these are never played.
leg () {
  local name=$1 src=$2 ss=$3 dur=$4 pts=${5:-1} wake=${6:-}
  local v W H G C F SF fade=""
  # WAKE. The first leg opens the page, and its app is a redacted enterprise
  # screen that is mostly white. The device wakes into it rather than starting
  # on it: a black screen that comes up as the camera closes.
  [ -n "$wake" ] && fade="fade=t=in:st=0:d=${wake}:color=black,"
  for v in d m; do
    if [ "$v" = d ]; then W=$DW; H=$DH; G=8; C=21; F=25; SF=""
    else                  W=$MW; H=$MH; G=4; C=25; F=20; SF="-m"; fi
    "$FF" -y -v error -ss "$ss" -t "$dur" -i "$src" -an \
      -vf "setpts=${pts}*PTS,${fade}scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H}:(iw-${W})/2:(ih-${H})*0.5,fps=${F},format=yuv420p" \
      -c:v libx264 -profile:v high -preset slow -crf $C \
      -g $G -keyint_min $G -sc_threshold 0 -movflags +faststart \
      "$A/${name}${SF}.mp4"
  done
  # Poster from the ENCODED file: the encode changes the pixels, so a still
  # taken from the master does not match the frame the browser decodes.
  "$FF" -y -v error -i "$A/${name}.mp4" -frames:v 1 -update 1 -q:v 4 "$A/${name}.jpg"
  printf '%-13s %-7s %-7s %ss\n' "$name" \
    "$(du -h "$A/${name}.mp4" | cut -f1)" "$(du -h "$A/${name}-m.mp4" | cut -f1)" \
    "$("$FP" -v error -show_entries format=duration -of csv=p=0 "$A/${name}.mp4")"
}

# plate <name> <src> <ss>   a still of one own-work product for the field
plate () {
  "$FF" -y -v error -ss "$3" -i "$2" -frames:v 1 -update 1 \
    -vf "scale=230:500:force_original_aspect_ratio=increase:flags=lanczos,crop=230:500:(iw-230)/2:(ih-500)*0.45" \
    -q:v 4 "$A/plate-$1.jpg"
}

echo "intermediates"
# Screen cropped out of the baked-in device frame, content band blurred.
"$FF" -y -v error -i "$R/demo-enterprise-miMarket.gif" -filter_complex \
  "[0:v]crop=196:446:15:19,split[base][t];[t]crop=196:298:0:84,boxblur=luma_radius=8:luma_power=2[b];[base][b]overlay=0:84,format=yuv420p[v]" \
  -map "[v]" -an -c:v libx264 -crf 12 -preset fast "$TMP/mimarket.mp4"
# Constant frame rate, so the windows below land where they say they do.
"$FF" -y -v error -i "$R/demo-enterprise-platanitos-app.gif" -vf "fps=25,crop=246:440:0:0,format=yuv420p" \
  -c:v libx264 -crf 12 -preset fast "$TMP/platanitos.mp4"
"$FF" -y -v error -i "$R/demo-enterprise-itu-app.gif" -vf "fps=25,crop=246:440:0:0,format=yuv420p" \
  -c:v libx264 -crf 12 -preset fast "$TMP/itu.mp4"

echo
printf '%-13s %-7s %-7s %s\n' leg desktop mobile duration
# Pace is weight / clip_seconds, held at ~0.214 everywhere so the world never
# surges or drags. Weights live in index.html as data-sc-w.
leg 1-cocacola   "$TMP/mimarket.mp4"                    3.0  6.2  1.129 1.1 # 1.5vh  wakes from black
leg 2-nfl        "$R/demo-enterprise-nfl.gif"          27.2  8.0  1       # 1.7vh
leg 3-itau       "$TMP/itu.mp4"                         0.0  2.9  1.931   # 1.2vh
leg 4-platanitos "$TMP/platanitos.mp4"                  0.5  6.6  1.273   # 1.8vh
leg 5-inside     "$R/demo-own-expo.MP4"                 6.0 15.9  1       # 3.4vh  the peak
leg 6-own        "$R/demo-own-saludables.mov"          39.5  9.35 1       # 2.0vh
leg 7-arrival    "$R/demo-own-cocap.MP4"                0.5  7.0  1       # 1.5vh

echo
echo "field plates, his own work"
plate jobync     "$R/demo-own-jobync.png"            0
plate vigiia     "$R/demo-own-vigiia.png"            0
plate tappro     "$R/demo-own-tappro.png"            0
plate moto       "$R/demo-own-moto.png"              0
plate bolidon    "$R/demo-own-bolidon.png"           0
plate motolisto  "$R/demo-own-motolisto.png"         0
plate tokai      "$R/demo-own-tokai.gif"             0.1
plate pickpointer "$R/demo-own-pickpointer.gif"      0.2
plate placaok    "$R/demo-own-placaok.MP4"           6
plate hablando   "$R/demo-own-hablandohuevadas.MP4"  8

echo
for f in "$A"/binni-plate.jpg "$A"/og.jpg; do
  [ -f "$f" ] || echo "  MISSING $(basename "$f") - see portrait.sh"
done
du -sh "$A"
