import re

# Uppercase-only and on purpose: physics/math content is often a single
# lowercase letter (e.g. "a" for acceleration, "m" for mass), which must
# never be mistaken for an option marker. Real option markers are A-D.
_LABEL_LINE_RE = re.compile(r"^([A-D])[.)]?$")

# Characters Word/Office equation editors emit as grouping delimiters when an
# equation (e.g. "10 (m/s)^2") is copy-pasted as plain text ("Unicode linear
# format"), along with the stray straight-quote marks it wraps around any
# plain-text run inside the equation (e.g. a unit like "N/kg").
_MATH_BRACKET_CHARS_RE = re.compile(r"\[\[|\]\]|[〖〗⟦⟧]")
_MULTI_SPACE_RE = re.compile(r"[ \t]{2,}")
_SPACE_BEFORE_CARET_RE = re.compile(r"\s+(\^)")
# Only matches a quote pair glued directly to a preceding number, e.g. the
# Word-equation-paste artifact '10" N/kg "' or '0.5" N"' - never a normal
# prose quote like she said "I will go", since that's not preceded by a digit.
_QUOTED_UNIT_RE = re.compile(r'(\d[\d.]*) ?"(\s*[^"\n]*?)"')


def clean_math_artifacts(text: str) -> str:
    """Strip Word-equation copy-paste artifacts so units/values print as typed,
    e.g. '10" N/kg "' -> '10 N/kg', 'g=10〖" m/s "〗^2' -> 'g=10 m/s^2'.
    Leaves ordinary quotation marks elsewhere in the question untouched.
    """
    cleaned = _MATH_BRACKET_CHARS_RE.sub("", text)
    cleaned = _QUOTED_UNIT_RE.sub(r"\1\2", cleaned)
    cleaned = _SPACE_BEFORE_CARET_RE.sub(r"\1", cleaned)
    cleaned = _MULTI_SPACE_RE.sub(" ", cleaned)
    return "\n".join(line.rstrip() for line in cleaned.split("\n"))


def remove_duplicate_option_labels(text: str) -> str:
    """Drop a standalone option-letter line (e.g. "A") when it repeats the
    label that just introduced the option above it, e.g.:

        A
        Some option text.
        A          <- duplicate, removed
        B
        Other option text.
        B          <- duplicate, removed
    """
    lines = text.split("\n")
    cleaned = []
    last_label = None

    for line in lines:
        match = _LABEL_LINE_RE.match(line.strip())
        if match:
            letter = match.group(1).upper()
            if letter == last_label:
                continue
            last_label = letter
        cleaned.append(line)

    return "\n".join(cleaned)
