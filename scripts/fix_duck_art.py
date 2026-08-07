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
separate look.

Run it from inside your rubber-duck-tcg repo, then commit + push as usual
-- or let it auto-commit for you (see --commit below).

Usage
-----
    python3 scripts/fix_duck_art.py                 # fix everything (536 images)
    python3 scripts/fix_duck_art.py --only shiny     # just the 408 broken shiny cards
    python3 scripts/fix_duck_art.py --only evolved   # just the 128 broken evolved cards
    python3 scripts/fix_duck_art.py --limit 5        # test run: only first 5, no commit
    python3 scripts/fix_duck_art.py --commit         # auto git add/commit/push when done
    python3 scripts/fix_duck_art.py --dry-run        # print what it would do, fetch nothing
    python3 scripts/fix_duck_art.py --reroll NAME --tag shiny --commit   # redo one dud

Safe to stop (Ctrl+C) and re-run anytime -- already-fixed files are
skipped, and skipped ones print as one compact line instead of spamming
your terminal.
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
    ap = argparse.ArgumentParser(description="Regenerate broken Shiny/Evolved duck art.")
    ap.add_argument("--only", choices=["shiny", "evolved"])
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--commit", action="store_true")
    ap.add_argument("--sleep", type=float, default=1.0)
    ap.add_argument("--reroll", help="regenerate ONE duck with a fresh random variation")
    ap.add_argument("--tag", choices=["shiny", "evolved"], default="shiny", help="which variant to reroll")
    args = ap.parse_args()

    root = find_repo_root()
    if not root:
        print(f"Couldn't find {MANIFEST} above the current directory.")
        sys.exit(1)
    os.chdir(root)
    print(f"Repo root: {root}")

    if args.reroll:
        name = args.reroll
        tag = args.tag
        fname = f"{name}_{tag}.png"
        dest = os.path.join(DUCKS_DIR, fname)
        prompt_fn = shiny_prompt if tag == "shiny" else evolved_prompt
        bump = int(time.time()) % 100000
        seed = (seed_for(name, tag) + bump) % 900000 + 1
        print(f"Rerolling {fname} with a fresh variation...")
        ok = fetch(pollinations_url(prompt_fn(name), seed), dest)
        if ok:
            print(f"    saved ({os.path.getsize(dest)} bytes)")
            if args.commit:
                subprocess.run(["git", "add", dest], check=False)
                subprocess.run(["git", "commit", "-m", f"Reroll {fname}"], check=False)
                subprocess.run(["git", "push"], check=False)
        else:
            print("    FAILED -- try again")
        return

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
    pending = 0
    for i, (name, tag, fname, prompt_fn) in enumerate(jobs, 1):
        if name not in ducks_by_name:
            skipped += 1
            pending += 1
            continue
        dest = os.path.join(DUCKS_DIR, fname)
        if os.path.isfile(dest) and not args.force:
            size = os.path.getsize(dest)
            if size > 150_000:
                skipped += 1
                pending += 1
                continue

        if pending:
            print(f"(skipped {pending} already-fixed image(s))")
            pending = 0

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

    if pending:
        print(f"(skipped {pending} already-fixed image(s) -- nothing left to do)")

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
