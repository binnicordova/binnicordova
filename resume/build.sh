#!/usr/bin/env bash
# Render resume.html to the PDF the site serves.
#
# The résumé used to exist only as an exported binary with no source in the
# repository. resume.html is the source now; this turns it back into the same
# two-page Letter document and drops it where the build and the hosting root
# both expect it.
#
# Chrome is the renderer because it is already the engine the site's own
# verification harness drives, so there is one browser to keep in sync rather
# than two. --no-pdf-header-footer matters: without it Chrome prints a URL and
# a date into the margins of a document that is going to recruiters.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/resume/resume.html"
BUILD="$ROOT/scrollcraft/builds/one-device/Binni_Cordova_Resume.pdf"
PUBLIC="$ROOT/public/Binni_Cordova_Resume.pdf"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

[ -x "$CHROME" ] || { echo "Chrome not found at $CHROME" >&2; exit 1; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

"$CHROME" --headless --disable-gpu --no-sandbox \
  --no-pdf-header-footer \
  --print-to-pdf="$TMP/resume.pdf" \
  "file://$SRC" 2>/dev/null

[ -s "$TMP/resume.pdf" ] || { echo "Chrome produced no PDF" >&2; exit 1; }

# Two pages is the contract. A third page means an edit overflowed and the
# document needs cutting, not shipping.
PAGES="$(pdfinfo "$TMP/resume.pdf" | awk '/^Pages:/{print $2}')"
if [ "$PAGES" != "2" ]; then
  echo "refusing to ship: résumé rendered to $PAGES pages, expected 2" >&2
  exit 1
fi

# The text layer is the only thing an ATS reads. If the PDF stops extracting,
# the document is broken no matter how it looks.
if ! pdftotext "$TMP/resume.pdf" - | grep -q "binnizenobiocordovaleandro"; then
  echo "refusing to ship: npm profile is not in the extracted text layer" >&2
  exit 1
fi

cp "$TMP/resume.pdf" "$BUILD"
cp "$TMP/resume.pdf" "$PUBLIC"

echo "résumé rebuilt: $PAGES pages, $(wc -c < "$BUILD" | tr -d ' ') bytes"
echo "  $BUILD"
echo "  $PUBLIC"
