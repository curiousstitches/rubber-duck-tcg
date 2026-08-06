#!/usr/bin/env python3
"""
fix_duck_art.py -- Getting Ducked art repair tool

What this does
---------------
408 ducks have a broken SHINY card (they all show the same recolored
placeholder instead of unique art). 128 designed ducks have a broken
EVOLVED card (2 recycled templates instead of unique art). This script
regenerates every one of those 536 images using the same free Pollinations
AI image service Studio already uses in your browser, and saves them
straight into public/cards/ducks/ with the correct filename.

Art style: this reuses duckdna.py and duckai.py from your duck-toolkit2
folder -- the exact same weapon phrasing, element language, scene, and
style tail used to generate every other card in the game -- so shiny and
evolved cards match the rest of the collection instead of using their own
separate look. Shiny/evolved always use a bright, front-facing pose so the
finish/armor is actually visible (never the random silhouette shot type).

Run it from inside your rubber-duck-tcg repo (same place Termux already
runs runduck from), then commit + push as usual -- or let it auto-commit
for you (see --commit below).

Requirements
------------
Only the Python standard library, plus duckdna.py and duckai.py, which
must already exist in ~/duck-toolkit2 (they do on your phone). No pip
installs needed. Works on plain Termux Python (pkg install python).

Usage
-----
    python3 scripts/fix_duck_art.py                 # fix everything (536 images)
    python3 scripts/fix_duck_art.py --only shiny     # just the 408 broken shiny cards
    python3 scripts/fix_duck_art.py --only evolved   # just the 128 broken evolved cards
    python3 scripts/fix_duck_art.py --limit 5        # test run: only first 5, no commit
    python3 scripts/fix_duck_art.py --commit         # auto git add/commit/push when done
    python3 scripts/fix_duck_art.py --dry-run        # print what it would do, fetch nothing

It's safe to stop and re-run -- already-fixed files are skipped unless you
pass --force.
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
    print("These are required so the art matches the rest of the collection.")
    print("Make sure duck-toolkit2 is installed on this phone, then try again.")
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


def _base_look(name):
    d = duckdna.dna(name)
    weapon = duckai.WEAPON_ART.get(d["weapon"], "wielding a gleaming sword")
    base = (f"a heroic battle rubber duck warrior named {name}, "
            f"fierce armoured rubber duck champion of the {d['elementLabel']} element, "
            f"{weapon}, front-facing dramatic hero pose with bright dynamic lighting "
            f"clearly showing off its reflective surface and armor detail, "
            f"surrounded by visible {d['elementLabel'].lower()} energy, "
            f"set in a {d['scene']}")
    return d, base


def shiny_prompt(name):
    d, base = _base_look(name)
    return (f"{base}, holographic chrome shiny foil card variant, prismatic "
            f"reflective metallic rainbow finish across the whole body, "
            f"{duckai.STYLE}")


def evolved_prompt(name):
    d, base = _base_look(name)
    return (f"{base}, evolved into a more powerful battle-hardened final "
            f"form, upgraded {d['weaponLabel'].lower()}, intensified "
            f"{d['elementLabel'].lower()} energy, channeling {d['abilityName']}, "
            f"ornate battle-worn armor, glowing aura, {duckai.STYLE}")


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
                raise ValueError(f"response too small ({len(data)} bytes) -- probably an error page")
            with open(dest, "wb") as f:
                f.write(data)
            return True
        except Exception as e:
            print(f"    attempt {attempt}/{retries} failed: {e}")
            time.sleep(3)
    return False


def main():
    ap = argparse.ArgumentParser(description="Regenerate broken Shiny/Evolved duck art.")
    ap.add_argument("--only", choices=["shiny", "evolved"], help="fix only one category")
    ap.add_argument("--limit", type=int, default=0, help="only process the first N ducks (0 = no limit)")
    ap.add_argument("--force", action="store_true", help="regenerate even if the file already looks fine")
    ap.add_argument("--dry-run", action="store_true", help="print the plan, fetch nothing")
    ap.add_argument("--commit", action="store_true", help="git add/commit/push when finished")
    ap.add_argument("--sleep", type=float, default=1.0, help="seconds to wait between requests (default 1.0)")
    args = ap.parse_args()

    root = find_repo_root()
    if not root:
        print(f"Couldn't find {MANIFEST} above the current directory.")
        print("Run this from inside your rubber-duck-tcg checkout (e.g. `cd rubber-duck-tcg && python3 scripts/fix_duck_art.py`).")
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
                print(f"[{i}/{len(jobs)}] SKIP {fname} -- already {size} bytes, looks fixed (use --force to redo)")
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
