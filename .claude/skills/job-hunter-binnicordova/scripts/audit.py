#!/usr/bin/env python3
"""Audit a tailored resume PDF against Binni's CURRENT base resume PDF.

    audit.py VARIANT.pdf [--base BASE.pdf] [--keywords FILE]

Exit 0 means the variant may ship (warnings are allowed and must be read).
Exit 1 means refuse. Everything here is checkable on the PDF text layer, which
is the only thing an ATS reads, so the checks stand in for the "100 ATS points"
that no real system publishes.

FAIL
  - 3+ pages, or a different phone number / email than the base PDF
  - an em or en dash, curly quote, ellipsis, or an invisible character
  - a number that is not in the base PDF and not declared with "#number" in the
    keywords file (numbers are load-bearing; every one must be real)
  - wording the candidate has ruled out (architect as a verb or title,
    "Redesigned", "zero downtime", ...)
  - an interest-only term outside the Summary, or in the Summary without a
    sentence that reads as interest
  - a keyword from the keywords file that is missing from the text layer
WARN
  - vocabulary that is in neither the base PDF, an ordinary English dictionary,
    nor confirmed_terms.txt: the "did I just invent a skill?" list
  - the App Store search link (unverified), a role split across the page break,
    one-word orphan lines, a nearly empty page 2
"""
import argparse, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
# <repo>/.claude/skills/job-hunter-binnicordova/scripts/audit.py -> the repo root is four levels up.
REPO = os.environ.get("TAILOR_RESUME_ROOT") or os.path.abspath(os.path.join(os.path.realpath(HERE), "..", "..", "..", ".."))
BASE_DEFAULT = os.path.join(REPO, "public", "Binni_Cordova_Resume.pdf")

BAD_CHARS = {
    0x2014: "em dash", 0x2013: "en dash", 0x2018: "curly quote", 0x2019: "curly quote",
    0x201C: "curly double quote", 0x201D: "curly double quote", 0x2026: "ellipsis",
    0x00B7: "middle dot", 0x2022: "bullet char", 0x2212: "minus sign",
    0x00A0: "non-breaking space", 0x202F: "narrow no-break space", 0x00AD: "soft hyphen",
    0x200B: "zero-width space", 0x200C: "zero-width non-joiner", 0x200D: "zero-width joiner",
    0x2060: "word joiner", 0xFEFF: "byte-order mark", 0x200E: "left-to-right mark",
    0x200F: "right-to-left mark",
}

# Wording ruled out by the candidate (memory: architect-role-boundary, and the
# comment at the top of resume/resume.html). Case-sensitive on purpose:
# lowercase "a software architect" is how the allowed wording refers to the
# person who validates his designs.
FORBIDDEN = [
    (r"\bArchitect(?:ed|s|ing)?\b", "'Architect' as a verb or title (he proposes and implements; an architect validates)"),
    (r"\b(?:Solutions?|Mobile|Principal|Software|Staff|Lead) Architect\b", "an architect job title"),
    (r"(?i)\blea(?:d|ds|ding) (?:the )?architecture\b", "'leads architecture'"),
    (r"(?i)\bled (?:the )?architecture\b", "'led architecture'"),
    (r"\bRedesigned\b", "'Redesigned' (his choice is 'Rebuilt')"),
    (r"(?i)zero[- ]downtime", "'zero downtime' (he said 'while 1,500+ sellers kept using the app', not that)"),
    (r"(?i)seeking .{0,40}roles?", "a 'seeking ... roles' headline (removed from the base on 2026-10-02)"),
]
WARN_PATTERNS = [
    (r"apps\.apple\.com", "App Store link: his 13 apps could not be found on the App Store; omit until he gives a developer URL"),
]

# Terms he removed on purpose or never confirmed. They may appear ONLY inside
# the Summary, in a sentence that reads as interest. Mirror of the
# "OMITTED ON PURPOSE" paragraph in resume/resume.html plus the unconfirmed
# list in memory (confirmed-ios-experience). Add to it when those change.
INTEREST_ONLY = [
    "Python", "Backend-for-Frontend", "LangGraph", "Codex", "Cursor", "New Architecture",
    "TurboModules", "Fabric", "JSI", "Kubernetes", "Docker", "Turborepo", "Detox",
    "certificate pinning", "SSL pinning", "Fastlane", "Xcode Cloud", "GitHub Copilot",
]
INTEREST_CUE = re.compile(
    r"\b(eager|wants?|ready|keen|interested|interest|learning|learn|grow|growing|excited|"
    r"looking to|deepen|extend|add|explore|build on|bring)\b", re.I)

HEADINGS = ["SUMMARY OF QUALIFICATIONS", "PROFESSIONAL EXPERIENCE", "EDUCATION", "SKILLS"]


def pdftext(path, layout=False):
    cmd = ["pdftotext"] + (["-layout"] if layout else []) + [path, "-"]
    return subprocess.run(cmd, capture_output=True, text=True, check=True).stdout


def pages(path):
    out = subprocess.run(["pdfinfo", path], capture_output=True, text=True, check=True).stdout
    return int(re.search(r"^Pages:\s+(\d+)", out, re.M).group(1))


def squash(t):
    t = re.sub(r"-\s*\n\s*", "-", t)  # a hyphen broken across a line rejoins
    return re.sub(r"\s+", " ", t)


def number_tokens(t):
    return set(m.group(0).rstrip(".,") for m in re.finditer(r"(?<![\w.])\d[\d,]*(?:\.\d+)?\+?%?", t))


def parse_keywords(path):
    terms, interest, numbers, in_interest = [], [], [], False
    if not path or not os.path.exists(path):
        return terms, interest, numbers
    for raw in open(path, encoding="utf-8"):
        line = raw.strip()
        if not line:
            continue
        if line.lower().startswith("#number"):
            numbers.append(line.split()[1])
            continue
        if line.startswith("#"):
            in_interest = "interest" in line.lower()
            continue
        terms.append(line)
        if in_interest:
            interest.append(line)
    return terms, interest, numbers


def dictionary():
    for p in ("/usr/share/dict/words", "/usr/share/dict/web2"):
        if os.path.exists(p):
            return set(w.strip().lower() for w in open(p, encoding="latin-1"))
    return set()


def stems(w):
    out = {w}
    for suf, rep in (("ies", "y"), ("ied", "y"), ("ing", ""), ("ing", "e"), ("ed", ""), ("ed", "e"),
                     ("es", ""), ("s", ""), ("ly", ""), ("ers", ""), ("er", ""), ("ize", ""),
                     ("izes", ""), ("ized", ""), ("ization", ""), ("ability", ""), ("ment", "")):
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            out.add(w[: -len(suf)] + rep)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("variant")
    ap.add_argument("--base", default=BASE_DEFAULT)
    ap.add_argument("--keywords")
    a = ap.parse_args()

    fails, warns, infos = [], [], []
    raw = pdftext(a.variant)
    flat = squash(raw)
    base_raw = pdftext(a.base)
    base_flat = squash(base_raw)

    # 1. pages and contact line
    n = pages(a.variant)
    if n > 2:
        fails.append(f"{n} pages; the contract is 2 (cut content, do not shrink the type)")
    phone = re.search(r"\+\d[\d ]{8,}\d", base_flat)
    if phone and phone.group(0) not in flat:
        fails.append(f"phone {phone.group(0)} from the base PDF is not in the variant (the base changed; copy its header)")
    email = re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", base_flat)
    if email and email.group(0) not in flat:
        fails.append(f"email {email.group(0)} from the base PDF is not in the variant")

    # 2. typography
    seen = {}
    for ch in raw:
        if ord(ch) in BAD_CHARS:
            seen[ch] = seen.get(ch, 0) + 1
    for ch, c in seen.items():
        line = next((l.strip() for l in raw.splitlines() if ch in l), "")
        fails.append(f"U+{ord(ch):04X} {BAD_CHARS[ord(ch)]} x{c}: {line[:70]}")

    # 3. numbers
    terms, interest, declared = parse_keywords(a.keywords)
    no_phone = lambda t: re.sub(r"\+\d[\d ]{8,}\d", " ", t)  # the phone has its own check above

    def no_terms(t):  # digits inside a posting keyword ("SOC 2") are part of its name, not a metric
        for term in terms:
            if re.search(r"\d", term):
                t = re.sub(re.escape(term), " ", t, flags=re.I)
        return t
    base_nums = number_tokens(no_phone(base_flat))
    for tok in sorted(number_tokens(no_terms(no_phone(flat))) - base_nums - set(declared)):
        ctx = re.search(r".{0,40}(?<![\w.])" + re.escape(tok) + r".{0,30}", flat)
        fails.append(f"number '{tok}' is not in the base PDF; declare it with '#number {tok}  (why)' if it is derivable: ...{ctx.group(0) if ctx else ''}...")
    for tok in declared:
        infos.append(f"derived number declared: {tok} (state how it is derived in the report)")

    # 4. ruled-out wording
    for pat, why in FORBIDDEN:
        for m in re.finditer(pat, flat):
            ctx = flat[max(0, m.start() - 35): m.end() + 35]
            fails.append(f"ruled-out wording, {why}: ...{ctx}...")
    for pat, why in WARN_PATTERNS:
        if re.search(pat, flat):
            warns.append(why)

    # 5. interest-only terms live in the Summary only, and read as interest
    s0 = flat.find(HEADINGS[0])
    s1 = flat.find(HEADINGS[1])
    summary = flat[s0:s1] if 0 <= s0 < s1 else ""
    rest = flat[:s0] + flat[s1:] if summary else flat
    for term in sorted(set(INTEREST_ONLY) | set(interest), key=str.lower):
        pat = re.compile(r"(?<![\w-])" + re.escape(term) + r"(?![\w-])", re.I)
        if pat.search(rest):
            ctx = pat.search(rest)
            fails.append(f"interest-only term '{term}' appears outside the Summary: ...{rest[max(0, ctx.start()-30): ctx.end()+30]}...")
        for m in pat.finditer(summary):
            start = summary.rfind(". ", 0, m.start()) + 1
            end = summary.find(". ", m.end())
            sentence = summary[start: end if end > 0 else len(summary)]
            if not INTEREST_CUE.search(sentence):
                fails.append(f"'{term}' is in the Summary but not in a sentence that reads as interest: {sentence.strip()[:90]}")
            else:
                infos.append(f"interest-only term in Summary: {term}")

    # 6. keyword coverage
    nohy = lambda t: t.lower().replace("-", "")
    missing = [t for t in terms if nohy(re.sub(r"\s+", " ", t)) not in nohy(flat)]
    if terms:
        infos.append(f"keyword coverage: {len(terms) - len(missing)}/{len(terms)}")
    for t in missing:
        fails.append(f"posting keyword missing from the text layer: {t}")

    # 7. new vocabulary: neither in the base PDF, the dictionary, nor confirmed
    confirmed = set()
    cf = os.path.join(HERE, "confirmed_terms.txt")
    if os.path.exists(cf):
        for l in open(cf, encoding="utf-8"):
            l = l.strip()
            if l and not l.startswith("#"):
                confirmed |= set(re.findall(r"[a-z0-9+#./-]+", l.lower()))
    tok = lambda t: set(w.strip(".-/").lower() for w in re.findall(r"[A-Za-z][A-Za-z0-9+#.-]*", t.replace("/", " ")))
    known = (tok(base_flat) | confirmed | tok(" ".join(terms)) | tok(" ".join(INTEREST_ONLY)))
    d = dictionary()
    new = []
    known_nohy = set(k.replace("-", "") for k in known)
    for w in sorted(tok(flat)):
        if len(w) < 3 or w in known or w.replace("-", "") in known_nohy:
            continue
        if any(s in known or s in d for s in stems(w)):
            continue
        # a hyphenated compound is fine when every part is a known or ordinary word
        parts = [x for x in w.split("-") if x]
        if len(parts) > 1 and all(len(x) < 3 or x in known or any(t in known or t in d for t in stems(x)) for x in parts):
            continue
        new.append(w)
    if new:
        warns.append("NEW TERMS not in the base PDF, the dictionary, or confirmed_terms.txt (each must be a "
                     "confirmed skill, a posting term stated as interest in the Summary, or removed): " + ", ".join(new))

    # 8. layout
    lay = pdftext(a.variant, layout=True)
    pg = lay.split("\f")
    if len(pg) >= 2 and pg[1].strip():
        lines2 = [l for l in pg[1].splitlines() if l.strip()]
        if len(lines2) < 12:
            warns.append(f"page 2 has only {len(lines2)} lines; it will look unfinished")
        if lines2 and re.match(r"^\s{4,}\S", lines2[0]):
            warns.append("page 2 starts mid-role (a bullet, not an employer); keep the role together with a break-inside: avoid class")
    for i, l in enumerate(lay.splitlines()):
        if re.match(r"^\s{3,}[A-Za-z0-9,.&/()-]{1,16}\s*$", l):
            warns.append(f"one-word orphan line: '{l.strip()}' (tighten the line above it)")

    for x in infos:
        print("  info:", x)
    for x in warns:
        print("  WARN:", x, file=sys.stderr)
    for x in fails:
        print("  FAIL:", x, file=sys.stderr)
    if fails:
        sys.exit(1)


if __name__ == "__main__":
    main()
