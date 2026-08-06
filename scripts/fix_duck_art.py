#!/usr/bin/env python3
"""
fix_duck_art.py -- Getting Ducked art repair tool

Regenerates broken Shiny/Evolved duck art using the exact same style
system as hero art (duckdna.py + duckai.py). No fake "holographic/chrome"
material is painted into the image -- that shine effect is drawn by the
website itself over the card frame, never touching the artwork. Shiny is
simply alternate-art (same duck, different pose). Evolved keeps its real
content difference: upgraded gear and final battle form.
"""

import argparse
import hashlib
import json
import os
import subprocess
import sys
import time
import urllib.request
import urllib.parse

MANIFEST = "public/cards/ducks/manifest.json"
VARIANTS = "public/cards/ducks/variants.json"
DUCKS_DIR = "public/cards/ducks"
POLLI = "https://image.pollinations.ai/prompt/"

TOOLKIT = os.path.join(os.path.expanduser("~"), "duck-toolkit2")
if TOOLKIT not in sys.path:
    sys.path.insert(0, TOOLKIT)
try:
    import duckdna
    import duckai
except ImportError:
    print(f"Couldn't find duckdna.py / duckai.py in {TOOLKIT}.")
    sys.exit(1)


def find_repo_root():
    d = os.getcwd()
    for _ in range(6):
        if os.path.isfile(os.path.join(d, MANIFEST)):
            return d
        parent = os.path.dirname(d)
        if parent == d:
            break
        d = parent
    return None


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def seed_for(name, tag):
    h = hashlib.sha1(f"{name}:{tag}".encode("utf-8")).hexdigest()
    return int(h[:8], 16) % 900000 + 1


def shiny_prompt(name):
    """Alternate-art version of the exact same duck -- same style, same
    everything, just a different shot/angle so it's genuinely a new piece
    of art rather than a duplicate. No special finish painted in."""
    d = duckdna.dna(name)
    weapon = duckai.WEAPON_ART.get(d["weapon"], "wielding a gleaming sword")
    other_shots = [s for s in duckdna.SHOTS if s != d["shot"]]
    alt_shot = other_shots[seed_for(name, "shiny") % len(other_shots)]
    return (f"a heroic battle rubber duck warrior named {name}, "
            f"fierce armoured rubber duck champion of the {d['elementLabel']} element, "
            f"{weapon}, {alt_shot}, "
            f"surrounded by visible {d['elementLabel'].lower()} energy, "
            f"set in a {d['scene']}, {duckai.STYLE}")


def evolved_prompt(name):
    """Same duck, genuinely upgraded -- final battle form, better gear,
    stronger elemental power. A real content change, still the same
    style system as everything else."""
    d = duckdna.dna(name)
    weapon = duckai.WEAPON_ART.get(d["weapon"], "wielding a gleaming sword")
    return (f"a heroic battle rubber duck warrior named {name}, evolved into "
            f"a more powerful battle-hardened final form, fierce armoured "
            f"rubber duck champion of the {d['elementLabel']} element, "
            f"{weapon}, upgraded {d['weaponLabel'].lower()}, {d['shot']}, "
            f"surrounded by intensified visible {d['elementLabel'].lower()} energy, "
            f"channeling {d['abilityName']}, ornate battle-worn armor, "
            f"set in a {d['scene']}, {duckai.STYLE}")


def pollinations_url(prompt, seed):
    return (
        POLLI + urllib.parse.quote(prompt)
        + f"?width=832&height=832&seed={seed}&nologo=true&model=flux&enhance=true"
    )


def fetch(url, dest, retries=3):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                data = r.read()
            if len(data) < 5000:
                raise ValueError(f"response too small ({len(data)} bytes)")
            with open(dest, "wb") as f:
                f.write(data)
            return True
        except Exception as e:
            print(f"    attempt {attempt}/{retries} failed: {e}")
            time.sleep(3)
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", choices=["shiny", "evolved"])
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--commit", action="store_true")
    ap.add_argument("--sleep", type=float, default=1.0)
    args = ap.parse_args()

    root = find_repo_root()
    if not root:
        print(f"Couldn't find {MANIFEST} above the current directory.")
        sys.exit(1)
    os.chdir(root)
    print(f"Repo root: {root}")

    manifest = load_json(MANIFEST)
    variants = load_json(VARIANTS)
    ducks_by_name = {d["name"]: d for d in manifest.get("ducks", [])}
    vmap = variants.get("ducks", {})

    shiny_only = sorted([n for n, v in vmap.items() if v == ["shiny"]])
    evolved_needed = sorted([n for n, v in vmap.items() if set(v) == {"evolved", "glossy", "shiny"}])

    jobs = []
    if args.only in (None, "shiny"):
        for n in shiny_only:
            jobs.append((n, "shiny", f"{n}_shiny.png", shiny_prompt))
    if args.only in (None, "evolved"):
        for n in evolved_needed:
            jobs.append((n, "evolved", f"{n}_evolved.png", evolved_prompt))

    if args.limit:
        jobs = jobs[: args.limit]

    print(f"Planned: {len(jobs)} image(s) "
          f"({sum(1 for j in jobs if j[1]=='shiny')} shiny, "
          f"{sum(1 for j in jobs if j[1]=='evolved')} evolved)")

    if args.dry_run:
        for name, tag, fname, prompt_fn in jobs[:10]:
            if name not in ducks_by_name:
                print(f"  [{tag}] {fname}  -- SKIP, not in manifest")
                continue
            print(f"  [{tag}] {fname}")
            print(f"     prompt: {prompt_fn(name)}")
        if len(jobs) > 10:
            print(f"  ...and {len(jobs) - 10} more")
        return

    done, skipped, failed = 0, 0, 0
    for i, (name, tag, fname, prompt_fn) in enumerate(jobs, 1):
        if name not in ducks_by_name:
            print(f"[{i}/{len(jobs)}] SKIP {fname} -- not found in manifest")
            skipped += 1
            continue
        dest = os.path.join(DUCKS_DIR, fname)
        if os.path.isfile(dest) and not args.force:
            size = os.path.getsize(dest)
            if size > 150_000:
                print(f"[{i}/{len(jobs)}] SKIP {fname} -- already {size} bytes")
                skipped += 1
                continue

        prompt = prompt_fn(name)
        seed = seed_for(name, tag)
        url = pollinations_url(prompt, seed)
        print(f"[{i}/{len(jobs)}] {fname} ...")
        ok = fetch(url, dest)
        if ok:
            done += 1
            print(f"    saved ({os.path.getsize(dest)} bytes)")
        else:
            failed += 1
            print(f"    FAILED after retries -- left untouched")
        time.sleep(args.sleep)

    print(f"\nDone. {done} saved, {skipped} skipped, {failed} failed.")

    if args.commit and done:
        print("\nCommitting...")
        subprocess.run(["git", "add", DUCKS_DIR], check=False)
        msg = f"Regenerate {done} broken Shiny/Evolved duck art files"
        r = subprocess.run(["git", "commit", "-m", msg], check=False)
        if r.returncode == 0:
            subprocess.run(["git", "push"], check=False)
            print("Committed and pushed.")
        else:
            print("Nothing to commit or commit failed -- check `git status`.")


if __name__ == "__main__":
    main()
