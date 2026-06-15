import re, base64, os

SRC = "index.html"
OUTDIR = "img"
os.makedirs(OUTDIR, exist_ok=True)

with open(SRC, "r", encoding="utf-8") as f:
    html = f.read()

# Match data:image/...;base64,<payload> inside url('...')
pattern = re.compile(r"data:image/(?P<ext>[a-zA-Z]+);base64,(?P<data>[A-Za-z0-9+/=]+)")

# Map each occurrence to a filename based on the CSS selector preceding it
matches = list(pattern.finditer(html))
print(f"Found {len(matches)} embedded images")

names = []
for i, m in enumerate(matches):
    # find a nearby selector id (#something) before the match
    start = m.start()
    head = html[max(0, start-600):start]
    ids = re.findall(r"#([a-zA-Z0-9_-]+)", head)
    base = ids[-1] if ids else f"image{i+1}"
    ext = m.group("ext").lower()
    if ext == "jpeg":
        ext = "jpg"
    fname = f"{base}-bg.{ext}"
    names.append(fname)
    raw = base64.b64decode(m.group("data"))
    with open(os.path.join(OUTDIR, fname), "wb") as out:
        out.write(raw)
    print(f"  -> {OUTDIR}/{fname}  ({len(raw)//1024} KB)")

# Replace each data URI with its path (do from last to first to keep indices valid)
for m, fname in sorted(zip(matches, names), key=lambda t: t[0].start(), reverse=True):
    html = html[:m.start()] + f"img/{fname}" + html[m.end():]

with open(SRC, "w", encoding="utf-8") as f:
    f.write(html)

print(f"Done. New {SRC} size: {os.path.getsize(SRC)//1024} KB")
