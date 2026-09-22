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

# Typographic hygiene. Two separate problems, one gate:
#
#   - Em dashes, en dashes and curly quotes are the characters a word processor
#     or a language model inserts on your behalf. On a resume they read as
#     machine-written, and nothing in this document needs them - a colon, a
#     comma, parentheses or a plain hyphen always says the same thing.
#   - Zero-width spaces, non-breaking spaces, soft hyphens and a stray BOM are
#     invisible on the page but land in the text layer, where an ATS tokenises
#     them into the middle of a word and quietly mangles a keyword.
#
# Accented letters are NOT in this list and must never be: "Itau" and
# "Tecnologico" are misspellings of a bank and a school.
if ! pdftotext "$TMP/resume.pdf" - | python3 -c '
import sys, unicodedata
BAD = {0x2014:"em dash", 0x2013:"en dash", 0x2018:"curly quote",
       0x2019:"curly quote", 0x201C:"curly double quote",
       0x201D:"curly double quote", 0x2026:"ellipsis", 0x00B7:"middle dot",
       0x2022:"bullet char", 0x2212:"minus sign", 0x00A0:"non-breaking space",
       0x202F:"narrow no-break space", 0x00AD:"soft hyphen",
       0x200B:"zero-width space", 0x200C:"zero-width non-joiner",
       0x200D:"zero-width joiner", 0x2060:"word joiner", 0xFEFF:"byte-order mark",
       0x200E:"left-to-right mark", 0x200F:"right-to-left mark"}
text = sys.stdin.read()
hits = {}
for ch in text:
    if ord(ch) in BAD:
        hits[ch] = hits.get(ch, 0) + 1
if hits:
    for ch, n in sorted(hits.items(), key=lambda kv: -kv[1]):
        line = next((l.strip() for l in text.splitlines() if ch in l), "")
        print(f"  U+{ord(ch):04X} {BAD[ord(ch)]} x{n}: {line[:78]}", file=sys.stderr)
    sys.exit(1)
'; then
  echo "refusing to ship: resume contains machine-inserted or invisible characters" >&2
  exit 1
fi

cp "$TMP/resume.pdf" "$BUILD"
cp "$TMP/resume.pdf" "$PUBLIC"

echo "résumé rebuilt: $PAGES pages, $(wc -c < "$BUILD" | tr -d ' ') bytes"
echo "  $BUILD"
echo "  $PUBLIC"
