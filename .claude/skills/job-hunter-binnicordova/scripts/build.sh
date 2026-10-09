#!/usr/bin/env bash
# Render a tailored resume variant to PDF and refuse to ship it unless the audit passes.
#
#   build.sh <slug>
#     resume/resume_<slug>.html  ->  resume/Binni_Cordova_Resume_<slug>.pdf
#
# Self-contained on purpose: it does not depend on resume/build.sh, which only
# knows the public resume. Chrome renders (same engine as the site's checks), and
# --no-pdf-header-footer keeps Chrome from printing a URL and a date into the
# margins of a document that goes to recruiters.
#
# The audit (audit.py) reads the NEW PDF's text layer, which is all an ATS sees,
# and compares it to the current public/Binni_Cordova_Resume.pdf. If it fails,
# nothing is written to the output path.
set -euo pipefail

SLUG="${1:?usage: build.sh <slug>   (company name, lowercase, no spaces)}"
# The skill lives in <repo>/.claude/skills/job-hunter-binnicordova, so the repo root is four levels up from
# scripts/. pwd -P resolves symlinks, so this also works when called through a linked path.
# TAILOR_RESUME_ROOT overrides it (for a checkout somewhere unusual).
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
ROOT="${TAILOR_RESUME_ROOT:-$(cd "$HERE/../../../.." && pwd -P)}"
SRC="$ROOT/resume/resume_$SLUG.html"
OUT="$ROOT/resume/Binni_Cordova_Resume_$SLUG.pdf"
KEYWORDS="$ROOT/resume/keywords_$SLUG.txt"
BASE="$ROOT/public/Binni_Cordova_Resume.pdf"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

[ -d "$ROOT/resume" ] || { echo "not a resume repo: $ROOT (set TAILOR_RESUME_ROOT)" >&2; exit 1; }
[ -f "$SRC" ] || { echo "no such source: $SRC" >&2; exit 1; }
[ -f "$BASE" ] || { echo "no base resume at $BASE" >&2; exit 1; }
[ -x "$CHROME" ] || { echo "Chrome not found at $CHROME" >&2; exit 1; }
[ -f "$KEYWORDS" ] || echo "  note: no $KEYWORDS, so no keyword gate runs (write one from the posting)" >&2

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

"$CHROME" --headless --disable-gpu --no-sandbox --no-pdf-header-footer \
  --print-to-pdf="$TMP/resume.pdf" "file://$SRC" 2>/dev/null
[ -s "$TMP/resume.pdf" ] || { echo "Chrome produced no PDF" >&2; exit 1; }

ARGS=(--base "$BASE")
[ -f "$KEYWORDS" ] && ARGS+=(--keywords "$KEYWORDS")
if ! python3 "$HERE/audit.py" "$TMP/resume.pdf" "${ARGS[@]}"; then
  echo "refusing to ship $SLUG: fix the FAIL lines above and rebuild" >&2
  exit 1
fi

cp "$TMP/resume.pdf" "$OUT"
echo "built $(pdfinfo "$OUT" | awk '/^Pages:/{print $2}') pages, $(wc -c < "$OUT" | tr -d ' ') bytes"
echo "  $OUT"
