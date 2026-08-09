#!/usr/bin/env python3
# =========================================================
#  🃏  DUCK CARD — two finished outputs per duck:
#    1. PRINTABLE : 750x1050 (2.5"x3.5" @300dpi) + foilmask
#    2. DIGITAL   : neon holo card, foil shifts on tilt/drag
#  Foil lives ONLY in the stamp zones. Art window stays clean.
# =========================================================
import hashlib, os, sys, base64
import random as _r
import duckdna as _dna
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HOME   = os.path.expanduser("~")
PROJ   = os.path.join(HOME, "rubber-duck-tcg")
ART    = os.path.join(PROJ, "public", "cards", "ducks")
PRESS  = os.path.join(PROJ, "cardpress")
ROSTER = os.path.join(HOME, "duck-toolkit2", "duckroster.txt")
TK     = os.path.join(HOME, "duck-toolkit2")
sys.path.insert(0, TK)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.makedirs(PRESS, exist_ok=True)

seed_for = _dna.seed_for

W, H = 750, 1050
NEON = [(0,255,242),(99,247,255),(255,255,255),(255,67,224),(255,216,61),(61,255,158),(0,195,255)]
GLOW = {"fire":"#ff9a3f","ice":"#9fe8ff","storm":"#ffe97a","leaf":"#8fe07a",
        "cosmic":"#d6b4ff","water":"#8fd6ff","music":"#ffd9f2","calm":"#00fff2"}

# ---- foil colour palettes, themed to the duck ----
FOIL_PALETTE = {
    "cosmic": [(58,40,160),(120,80,255),(200,150,255),(255,255,255),
               (90,180,255),(160,110,255),(40,60,180)],
    "fire":   [(255,90,20),(255,150,40),(255,214,90),(255,255,220),
               (220,50,30),(255,120,60),(180,40,20)],
    "ice":    [(180,240,255),(255,255,255),(140,210,255),(210,235,255),
               (110,180,240),(230,250,255),(90,160,220)],
    "storm":  [(255,240,120),(255,255,255),(120,200,255),(255,230,80),
               (80,140,240),(220,240,255),(255,210,60)],
    "leaf":   [(90,220,110),(180,255,140),(240,255,200),(60,180,120),
               (200,240,120),(120,255,180),(50,150,90)],
    "water":  [(60,190,255),(140,230,255),(255,255,255),(40,140,220),
               (110,255,240),(180,240,255),(30,110,190)],
    "music":  [(255,120,220),(255,190,240),(255,255,255),(255,90,170),
               (255,215,120),(230,140,255),(200,60,160)],
    "calm":   NEON,
}
# 6 foil textures, dealt deterministically per duck
# diamond is the signature look, so it's weighted heaviest; the rest add variety
FOIL_PATTERNS = ["diamond", "diamond", "diamond", "diamond", "diamond",
                 "honeycomb", "honeycomb", "shatter", "shatter",
                 "starburst", "prism", "linear"]



def _rgb2hsv(r, g, b):
    import colorsys
    return colorsys.rgb_to_hsv(r/255, g/255, b/255)


def _hsv2rgb(h, s, v):
    import colorsys
    r, g, b = colorsys.hsv_to_rgb(h % 1.0, s, v)
    return (int(r*255), int(g*255), int(b*255))


def contrast_palette(pal):
    """Same holographic look, opposite side of the colour wheel, always
    vivid enough to read. Pale or grey foils get a bold hue assigned
    instead of a useless rotation."""
    hs = [_rgb2hsv(*c) for c in pal]
    avg_s = sum(h[1] for h in hs) / len(hs)
    avg_h = sum(h[0] for h in hs) / len(hs)
    weak = avg_s < 0.34                      # white / silver / grey foil
    anchor = (avg_h + 0.5) % 1.0 if not weak else (0.09 if avg_h > 0.5 else 0.55)
    out = []
    for i, (h, s, v) in enumerate(hs):
        nh = anchor + (i - len(hs) / 2) * 0.035      # slight spread for the sheen
        ns = min(1.0, max(0.72, s * 1.35)) if not weak else 0.95
        nv = min(1.0, max(0.88, v * 1.1))
        out.append(_hsv2rgb(nh, ns, nv))
    return out


def foil_style(name):
    d = _dna.dna(name)
    pal = [tuple(int(c.lstrip("#")[i:i+2], 16) for i in (0, 2, 4)) for c in d["palette"]]
    pat = FOIL_PATTERNS[(_dna.seed_for(name) // 11) % len(FOIL_PATTERNS)]
    return pal, pat


def hexs(rgb):
    return "#{:02x}{:02x}{:02x}".format(*rgb)


def card_data(name):
    d = _dna.dna(name)
    return {"name": name, "theme": d["element"], "rarity": d["rarity"],
            "atk": d["atk"], "def": d["def"], "spd": d["spd"],
            "icon": d["icon"], "badge": d["weaponLabel"], "move": d["move"],
            "glow": d["glow"], "dna": d}


def font(size):
    for p in ["/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
              "/system/fonts/Roboto-Bold.ttf"]:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


def foil_tile(size, strength, palette=None, pattern="diamond"):
    """Themed, patterned foil swatch. Diamond lattice by default."""
    w, h = size
    pal = palette or NEON
    t = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(t)
    a = int(250 * strength)
    band = max(9, w // 10)

    # base colour wash so the zone is never flat
    for i in range(-h, w + h, band):
        col = pal[(i // band) % len(pal)]
        d.line([(i, 0), (i - h, h)], fill=col + (int(a * 0.75),), width=band)
    t = t.filter(ImageFilter.GaussianBlur(max(2, band // 5)))
    d = ImageDraw.Draw(t)

    step = max(7, w // 13)
    if pattern in ("diamond", "honeycomb"):
        # crosshatch both diagonals -> diamond lattice
        lw = 2 if pattern == "diamond" else 3
        for i in range(-h, w + h, step):
            c1 = pal[(i // step) % len(pal)]
            c2 = pal[(i // step + 3) % len(pal)]
            d.line([(i, 0), (i - h, h)], fill=c1 + (int(a * .95),), width=lw)
            d.line([(i, 0), (i + h, h)], fill=c2 + (int(a * .95),), width=lw)
        # bright specks where the lattice crosses
        for y in range(0, h, step):
            for x in range((y // step % 2) * step // 2, w, step):
                d.ellipse([x - 1, y - 1, x + 1, y + 1],
                          fill=(255, 255, 255, int(a * .9)))
    elif pattern == "shatter":
        rng = _r.Random(w * 7 + h)
        for _ in range(max(14, w // 26)):
            x, y = rng.randrange(w), rng.randrange(h)
            col = pal[rng.randrange(len(pal))]
            pts = [(x, y)]
            for _ in range(3):
                x += rng.randint(-step * 3, step * 3)
                y += rng.randint(-step * 2, step * 2)
                pts.append((x, y))
            d.line(pts, fill=col + (int(a * .95),), width=2)
    elif pattern == "starburst":
        import math as _m
        cx, cy = w // 2, h // 2
        for k in range(28):
            ang = k * (360 / 28)
            col = pal[k % len(pal)]
            x2 = cx + int(w * _m.cos(_m.radians(ang)))
            y2 = cy + int(w * _m.sin(_m.radians(ang)))
            d.line([(cx, cy), (x2, y2)], fill=col + (int(a * .8),), width=2)
    elif pattern == "prism":
        for i in range(-h, w + h, max(4, step // 2)):
            col = pal[(i // 4) % len(pal)]
            d.line([(i, 0), (i - h, h)], fill=col + (int(a * .85),), width=1)
    else:  # linear
        for i in range(-h, w + h, step):
            col = pal[(i // step) % len(pal)]
            d.line([(i, 0), (i - h, h)], fill=col + (int(a * .9),), width=max(2, step // 3))

    return t.filter(ImageFilter.GaussianBlur(1.1))


def stamp(card, mask, box, radius, strength, glow_rgb, pal=None, pat='diamond'):
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    if w <= 0 or h <= 0:
        return
    shape = Image.new("L", (w, h), 0)
    ImageDraw.Draw(shape).rounded_rectangle([0, 0, w - 1, h - 1], radius, fill=255)
    # neon bloom halo
    pad = 22
    halo = Image.new("L", (w + pad * 2, h + pad * 2), 0)
    ImageDraw.Draw(halo).rounded_rectangle([pad, pad, w + pad - 1, h + pad - 1], radius, fill=255)
    halo = halo.filter(ImageFilter.GaussianBlur(14))
    tint = Image.new("RGBA", (w + pad * 2, h + pad * 2), glow_rgb + (int(160 * strength),))
    tint.putalpha(halo)
    card.alpha_composite(tint, (max(0, x0 - pad), max(0, y0 - pad)))
    # foil fill
    foil = foil_tile((w, h), strength, pal, pat)
    foil.putalpha(Image.composite(foil.split()[3], Image.new("L", (w, h), 0), shape))
    card.alpha_composite(foil, (x0, y0))
    mask.paste(255, (x0, y0), shape)
    ImageDraw.Draw(card).rounded_rectangle(box, radius, outline=(255, 255, 255, 90), width=2)



def holo_text(card, xy, text, font_obj, cpal, draw, glow=(0, 0, 0)):
    """Draw text filled with the contrast holo gradient, with a dark
    outline so it stays legible on any background."""
    from PIL import Image as _I, ImageDraw as _D
    bbox = draw.textbbox(xy, text, font=font_obj, stroke_width=4)
    w = int(max(1, bbox[2] - bbox[0] + 12))
    h = int(max(1, bbox[3] - bbox[1] + 12))
    ox, oy = int(bbox[0]) - 6, int(bbox[1]) - 6
    # gradient swatch
    grad = _I.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = _D.Draw(grad)
    band = max(6, w // 7)
    for i in range(-h, w + h, band):
        c = cpal[(i // band) % len(cpal)]
        gd.line([(i, 0), (i - h, h)], fill=c + (255,), width=band)
    grad = grad.filter(ImageFilter.GaussianBlur(max(1, band // 6)))
    # text mask
    mask = _I.new("L", (w, h), 0)
    _D.Draw(mask).text((xy[0] - ox, xy[1] - oy), text, font=font_obj, fill=255)
    # dark outline underneath
    draw.text(xy, text, font=font_obj, fill=(6, 8, 16, 255),
              stroke_width=4, stroke_fill=(6, 8, 16, 255))
    grad.putalpha(mask)
    card.alpha_composite(grad, (ox, oy))


def build_printable(name, force=False):
    out = os.path.join(PRESS, f"{name}_card.png")
    if os.path.exists(out) and not force:
        return False
    hero_p = os.path.join(ART, f"{name}_hero.png")
    if not os.path.exists(hero_p):
        return False
    d = card_data(name)
    r = d["rarity"]
    pal, pat = foil_style(name)
    cpal = contrast_palette(pal)
    strength = 0.44 + r * 0.12
    grgb = tuple(int(d["glow"].lstrip("#")[i:i+2], 16) for i in (0, 2, 4))

    card = Image.new("RGBA", (W, H), (12, 15, 27, 255))
    mask = Image.new("L", (W, H), 0)

    # art window — full bleed hero, never touched by foil
    ax0, ay0, ax1, ay1 = 42, 96, W - 42, 748
    aw, ah = ax1 - ax0, ay1 - ay0
    hero = Image.open(hero_p).convert("RGBA")
    hs = max(aw / hero.width, ah / hero.height)
    hero = hero.resize((int(hero.width * hs), int(hero.height * hs)))
    hero = hero.crop(((hero.width - aw) // 2, (hero.height - ah) // 2,
                      (hero.width - aw) // 2 + aw, (hero.height - ah) // 2 + ah))
    rounded = Image.new("L", (aw, ah), 0)
    ImageDraw.Draw(rounded).rounded_rectangle([0, 0, aw - 1, ah - 1], 14, fill=255)
    card.paste(hero, (ax0, ay0), rounded)
    ImageDraw.Draw(card).rounded_rectangle([ax0, ay0, ax1, ay1], 14,
                                           outline=(40, 50, 88, 255), width=4)

    dr = ImageDraw.Draw(card)
    f_name, f_stat, f_star, f_badge, f_move = font(58), font(36), font(38), font(31), font(27)

    # zone 1: outer frame
    fw = 12 + r * 2
    fshape = Image.new("L", (W, H), 0)
    fd = ImageDraw.Draw(fshape)
    fd.rounded_rectangle([8, 8, W - 8, H - 8], 30, fill=255)
    fd.rounded_rectangle([8 + fw, 8 + fw, W - 8 - fw, H - 8 - fw], 22, fill=0)
    ftile = foil_tile((W, H), strength, pal, pat)
    ftile.putalpha(Image.composite(ftile.split()[3], Image.new("L", (W, H), 0), fshape))
    card.alpha_composite(ftile)
    mask.paste(255, (0, 0), fshape)

    # zone 2: name plate
    nb = (42, 20, W - 42, 86)
    dr.rounded_rectangle(nb, 12, fill=(16, 20, 37, 255))
    stamp(card, mask, nb, 12, strength, grgb, pal, pat)
    nm = name.upper()
    holo_text(card, ((W - dr.textlength(nm, font=f_name)) / 2, 30), nm, f_name, cpal, dr)

    # zone 3: stat bar
    sb = (42, 764, W - 42, 838)
    dr.rounded_rectangle(sb, 12, fill=(15, 19, 35, 255))
    stamp(card, mask, sb, 12, strength, grgb, pal, pat)
    for i, (lbl, val, col) in enumerate([("ATK", d["atk"], (255, 190, 90)),
                                          ("DEF", d["def"], (140, 220, 255)),
                                          ("SPD", d["spd"], (170, 255, 160))]):
        holo_text(card, (78 + i * 222, 782), f"{lbl} {val}", f_stat, cpal, dr)

    # zone 4: rarity stars
    stars = "★" * r + "☆" * (5 - r)
    rb = (42, 850, int(42 + dr.textlength(stars, font=f_star) + 40), 910)
    dr.rounded_rectangle(rb, 12, fill=(15, 19, 35, 255))
    stamp(card, mask, rb, 12, strength, grgb, pal, pat)
    holo_text(card, (62, 860), stars, f_star, cpal, dr)

    # zone 5: move box
    mb = (42, 922, W - 42, 1016)
    dr.rounded_rectangle(mb, 12, fill=(13, 17, 32, 255))
    stamp(card, mask, mb, 12, strength, grgb, pal, pat)
    holo_text(card, (62, 936), f"{d['icon']} {d['badge']}", f_badge, cpal, dr)
    holo_text(card, (62, 976), d["move"], f_move, cpal, dr)

    card.convert("RGB").save(out, "PNG", optimize=True)
    mask.save(os.path.join(PRESS, f"{name}_foilmask.png"))
    return True


# ---------------- digital neon card ----------------

def card_css():
    return """
.dwrap{perspective:1000px;width:min(88vw,420px);touch-action:pan-y;
 padding:14% 12% 12%;margin:-14% -12% -12%}
/* 3D stage — the card and the pop-out share this space but the orb is NOT clipped */
.dscene{position:relative;width:100%;aspect-ratio:5/7;transform-style:preserve-3d;
 transform:rotateY(calc(var(--tx,0)*13deg)) rotateX(calc(var(--ty,0)*-10deg));
 will-change:transform}
.dcard{position:relative;width:100%;height:100%;border-radius:20px;overflow:hidden;
 background:#0c0f1b;isolation:isolate;
 box-shadow:0 16px 46px rgba(0,0,0,.7)}
.dart{position:absolute;left:5.5%;right:5.5%;top:9%;height:62%;border-radius:10px;
 overflow:hidden;border:2px solid #28325a}
.dart img{width:100%;height:100%;object-fit:cover;display:block;
 transform:scale(1.06) translate(calc(var(--tx,0)*-1.6%),calc(var(--ty,0)*-1.6%));
 will-change:transform}
.foilzone{position:relative;isolation:isolate;overflow:hidden;
 box-shadow:0 0 calc(7px + var(--neon,6px)) var(--gcol,#00fff2),
            0 0 calc(18px + var(--neon,6px)) rgba(255,67,224,.35)}
/* themed colour wash */
.foilzone::after{content:"";position:absolute;inset:0;pointer-events:none;
 mix-blend-mode:color-dodge;opacity:var(--foil,.6);
 background:var(--wash);
 background-size:340% 340%;filter:saturate(1.9) brightness(1.5);
 background-position:calc(50% + var(--tx,0)*54%) calc(50% + var(--ty,0)*54%)}
/* diamond lattice texture layer */
.foilzone .lattice{position:absolute;inset:0;pointer-events:none;z-index:2;
 mix-blend-mode:color-dodge;opacity:calc(var(--foil,.6)*.95);
 background:var(--pat);background-size:var(--patsize,22px) var(--patsize,22px);
 background-position:calc(var(--tx,0)*14px) calc(var(--ty,0)*14px);
 filter:saturate(1.7) brightness(1.5)}
.foilzone::before{content:"";position:absolute;inset:0;pointer-events:none;z-index:1;
 mix-blend-mode:screen;opacity:calc(var(--foil,.6)*.75);
 background:linear-gradient(100deg,transparent 41%,rgba(255,255,255,.95) 49%,
  rgba(150,255,255,.8) 53%,transparent 61%);
 background-size:300% 300%;
 background-position:calc(50% + var(--tx,0)*76%) calc(50% + var(--ty,0)*76%);
 animation:neonStreak calc(var(--shim,6s)) linear infinite}
@keyframes neonStreak{0%{transform:translateX(-13%)}100%{transform:translateX(13%)}}
.dframe{position:absolute;inset:0;border-radius:20px;pointer-events:none;
 border:var(--fw,8px) solid #151b31}
.dframe::after{content:"";position:absolute;inset:0;border-radius:13px;pointer-events:none;
 mix-blend-mode:color-dodge;opacity:calc(var(--foil,.6)*1.18);
 border:var(--fw,8px) solid transparent;
 background:var(--wash) border-box;
 background-size:340% 340%;filter:saturate(2.0) brightness(1.6);
 background-position:calc(50% + var(--tx,0)*54%) calc(50% + var(--ty,0)*54%);
 -webkit-mask:linear-gradient(#000 0 0) padding-box,linear-gradient(#000 0 0);
 -webkit-mask-composite:xor;mask-composite:exclude}
.dframe::before{content:"";position:absolute;inset:0;border-radius:20px;pointer-events:none;
 box-shadow:0 0 calc(11px + var(--neon,6px)) var(--gcol,#00fff2),
            0 0 calc(28px + var(--neon,6px)*2) rgba(255,67,224,.35),
            inset 0 0 calc(9px + var(--neon,6px)) rgba(130,255,255,.32);
 animation:neonPulse calc(var(--shim,6s)*.85) ease-in-out infinite}
@keyframes neonPulse{0%,100%{opacity:.7}50%{opacity:1}}

/* ============ EDGE-LIGHT SYSTEM ============
   No objects sit on the art. Instead a travelling light traces the
   linework — the art window border, the frame, and the foil zones —
   with a pulse rhythm matched to each duck's weapon. */

/* travelling light around the art window */
.ringmask{position:absolute;inset:0;border-radius:10px;pointer-events:none;
 border:2px solid transparent;overflow:hidden;
 -webkit-mask:linear-gradient(#000 0 0) padding-box,linear-gradient(#000 0 0);
 -webkit-mask-composite:xor;mask-composite:exclude;
 opacity:var(--edge,.85)}
.ringmask .tracer{position:absolute;inset:-60%;
 background:conic-gradient(from 0deg,transparent 0 62%,var(--o3) 72%,
  var(--o1) 80%,#ffffff 85%,var(--o1) 90%,var(--o2) 95%,transparent 100%);
 filter:saturate(1.6) brightness(1.35);
 animation:traceSpin var(--ocyc,4s) linear infinite}
@keyframes traceSpin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}

/* second, slower counter-tracer for depth */
.ringmask.slow{border-width:1px;opacity:calc(var(--edge,.85)*.55)}
.ringmask.slow .tracer{animation-duration:calc(var(--ocyc,4s)*2.1);
 animation-direction:reverse}

/* inner rim glow that breathes with the duck's rhythm */
.rimlight{position:absolute;inset:0;border-radius:10px;pointer-events:none;
 box-shadow:inset 0 0 calc(9px + var(--neon,6px)) var(--o1),
            inset 0 0 calc(22px + var(--neon,6px)) var(--o2);
 opacity:0;mix-blend-mode:screen}

/* ---- per-weapon pulse rhythm (opacity only — nothing covers the art) ---- */
.pr-cradle .rimlight   {animation:rhCradle  var(--ocyc) ease-in-out infinite}
.pr-swing .rimlight,
.pr-chop .rimlight,
.pr-reap .rimlight     {animation:rhSwing   var(--ocyc) cubic-bezier(.5,0,.2,1) infinite}
.pr-draw-slash .rimlight{animation:rhDrawSlash var(--ocyc) cubic-bezier(.7,0,.2,1) infinite}
.pr-thrust .rimlight,
.pr-bash .rimlight,
.pr-jab .rimlight      {animation:rhThrust  var(--ocyc) cubic-bezier(.5,0,.15,1) infinite}
.pr-slam .rimlight,
.pr-bonk .rimlight     {animation:rhSlam    var(--ocyc) cubic-bezier(.4,0,.1,1) infinite}
.pr-lash .rimlight,
.pr-whirl .rimlight    {animation:rhLash    var(--ocyc) ease-in-out infinite}
.pr-flurry .rimlight   {animation:rhFlurry  calc(var(--ocyc)*.5) ease-in-out infinite}
.pr-beamswing .rimlight{animation:rhSwing   var(--ocyc) cubic-bezier(.5,0,.2,1) infinite}
.pr-fire-burst .rimlight,
.pr-charge-fire .rimlight,
.pr-click-fire .rimlight{animation:rhFire   var(--ocyc) ease-out infinite}
.pr-fire-reload .rimlight{animation:rhReload var(--ocyc) ease-out infinite}
.pr-spray .rimlight    {animation:rhSpray   var(--ocyc) ease-in-out infinite}
.pr-pull-release .rimlight,
.pr-draw-loose .rimlight{animation:rhDraw   var(--ocyc) ease-out infinite}
.pr-pop .rimlight,
.pr-honk .rimlight     {animation:rhPop     var(--ocyc) ease-out infinite}
.pr-throw-return .rimlight,
.pr-hook-pull .rimlight{animation:rhThrow   var(--ocyc) ease-in-out infinite}
.pr-yo .rimlight       {animation:rhYo      var(--ocyc) cubic-bezier(.4,0,.4,1) infinite}
.pr-rev .rimlight      {animation:rhRev     calc(var(--ocyc)*.22) ease-in-out infinite}
.pr-channel .rimlight,
.pr-page-cast .rimlight{animation:rhChannel var(--ocyc) ease-in-out infinite}
.pr-orbit-fire .rimlight{animation:rhOrbit  var(--ocyc) linear infinite}
.pr-boost .rimlight    {animation:rhBoost   var(--ocyc) ease-in-out infinite}
.pr-blow .rimlight     {animation:rhBlow    var(--ocyc) ease-out infinite}

@keyframes rhCradle {0%,100%{opacity:.22}50%{opacity:.62}}
@keyframes rhSwing  {0%,40%{opacity:.14}56%{opacity:.9}72%{opacity:.3}100%{opacity:.14}}
@keyframes rhDrawSlash{0%,52%{opacity:.1}60%{opacity:1}70%{opacity:.2}100%{opacity:.1}}
@keyframes rhThrust {0%,46%{opacity:.16}57%{opacity:.88}70%{opacity:.24}100%{opacity:.16}}
@keyframes rhSlam   {0%,40%{opacity:.12}53%{opacity:.95}60%{opacity:.55}74%{opacity:.18}100%{opacity:.12}}
@keyframes rhLash   {0%,42%{opacity:.14}53%{opacity:.85}62%{opacity:.3}100%{opacity:.14}}
@keyframes rhFlurry {0%,100%{opacity:.2}50%{opacity:.7}}
@keyframes rhFire   {0%,48%{opacity:.14}53%{opacity:.95}59%{opacity:.3}64%{opacity:.85}
 74%{opacity:.2}100%{opacity:.14}}
@keyframes rhReload {0%,32%{opacity:.14}
 37%{opacity:.95}43%{opacity:.28}49%{opacity:.95}55%{opacity:.2}
 66%{opacity:.5}72%{opacity:.24}78%{opacity:.5}
 90%{opacity:.14}100%{opacity:.14}}
@keyframes rhSpray  {0%,42%{opacity:.18}58%{opacity:.72}74%{opacity:.26}100%{opacity:.18}}
@keyframes rhDraw   {0%,36%{opacity:.12}56%{opacity:.34}62%{opacity:.95}76%{opacity:.18}100%{opacity:.12}}
@keyframes rhPop    {0%,50%{opacity:.14}57%{opacity:1}70%{opacity:.2}100%{opacity:.14}}
@keyframes rhThrow  {0%,36%{opacity:.16}58%{opacity:.8}86%{opacity:.3}100%{opacity:.16}}
@keyframes rhYo     {0%,100%{opacity:.2}50%{opacity:.75}}
@keyframes rhRev    {0%,100%{opacity:.3}50%{opacity:.6}}
@keyframes rhChannel{0%,100%{opacity:.2}50%{opacity:.8}}
@keyframes rhOrbit  {0%{opacity:.2}25%{opacity:.7}50%{opacity:.28}75%{opacity:.7}100%{opacity:.2}}
@keyframes rhBoost  {0%,100%{opacity:.18}40%{opacity:.9}70%{opacity:.34}}
@keyframes rhBlow   {0%,46%{opacity:.16}62%{opacity:.8}76%{opacity:.2}100%{opacity:.16}}

/* elemental motes — tiny, drifting along the edges only */
.edgemotes{position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:10px}
.edgemotes i{position:absolute;width:3px;height:3px;border-radius:50%;
 background:var(--o1);box-shadow:0 0 6px var(--o1);opacity:0}
@keyframes emRise{0%{opacity:0;transform:translateY(0)}18%{opacity:.85}
 100%{opacity:0;transform:translateY(-210px)}}
@keyframes emFall{0%{opacity:.8;transform:translateY(0)}100%{opacity:0;transform:translateY(240px)}}
@keyframes emTwinkle{0%,100%{opacity:.1}50%{opacity:.9}}
@keyframes emFlash{0%,58%{opacity:0}62%{opacity:.9}68%{opacity:0}100%{opacity:0}}
/* ---- holographic lettering (contrast hue so it always reads) ---- */
.dname,.dstats,.dstars,.dmove{--txtholo:linear-gradient(112deg,var(--t1),var(--t2) 30%,
 #ffffff 48%,var(--t3) 66%,var(--t1));}
.holotext{background:var(--txtholo);background-size:220% 220%;
 background-position:calc(50% + var(--tx,0)*40%) calc(50% + var(--ty,0)*40%);
 -webkit-background-clip:text;background-clip:text;color:transparent;
 -webkit-text-stroke:.5px rgba(4,6,14,.85);
 filter:drop-shadow(0 1px 0 rgba(0,0,0,.95)) drop-shadow(0 0 5px rgba(0,0,0,.75))
        drop-shadow(0 0 9px var(--t1));
 position:relative;z-index:3}
.dname{position:absolute;left:5.5%;right:5.5%;top:2.4%;height:5.6%;border-radius:9px;
 background:#0d1122;display:flex;align-items:center;justify-content:center;
 font:800 clamp(.8rem,4.2vw,1.28rem)/1 system-ui,sans-serif;
 text-transform:uppercase;letter-spacing:.06em;border:2px solid #2c3660}
.dstats{position:absolute;left:5.5%;right:5.5%;top:73%;height:7%;border-radius:9px;
 background:#0c1020;display:flex;align-items:center;justify-content:space-around;
 font:800 clamp(.68rem,3.4vw,1rem)/1 system-ui,sans-serif;
 border:2px solid #283260}
.dstars{position:absolute;left:5.5%;top:81.4%;height:5.4%;padding:0 12px;border-radius:9px;
 background:#0c1020;display:flex;align-items:center;
 font:800 clamp(.72rem,3.5vw,1.05rem)/1 system-ui,sans-serif;
 letter-spacing:.13em;border:2px solid #283260}
.dmove{position:absolute;left:5.5%;right:5.5%;top:88%;height:8.6%;border-radius:9px;
 background:#0b0f1e;padding:6px 11px;border:2px solid #283260;
 display:flex;flex-direction:column;justify-content:center;gap:3px}
.dmove b{font:800 clamp(.66rem,3.2vw,.96rem)/1 system-ui,sans-serif}
.dmove span{font:600 clamp(.6rem,2.9vw,.86rem)/1 system-ui,sans-serif}

/* ---- rarity banner ribbon, 4-5 star cards only ---- */
.rband{position:absolute;top:9%;left:-14%;width:48%;padding:4px 0;z-index:6;
 transform:rotate(-40deg);text-align:center;pointer-events:none;
 background:linear-gradient(100deg,var(--gcol,#ffd83d),#fff 50%,var(--gcol,#ffd83d));
 background-size:220% 100%;
 box-shadow:0 2px 12px rgba(0,0,0,.55);
 font:800 .64rem 'Chakra Petch',system-ui,sans-serif;letter-spacing:.1em;color:#06070d;
 text-transform:uppercase;
 animation:rbandShine 2.4s linear infinite}
@keyframes rbandShine{0%{background-position:0% 50%}100%{background-position:220% 50%}}

/* ---- staggered pop-in reveal ---- */
@keyframes popIn{0%{opacity:0;transform:scale(.4) rotate(-6deg)}
 60%{opacity:1;transform:scale(1.12) rotate(1deg)}
 100%{opacity:1;transform:scale(1) rotate(0)}}
@keyframes artPopIn{0%{opacity:0;transform:scale(1.25)}100%{opacity:1;transform:scale(1)}}
.dart.popin{animation:artPopIn .6s cubic-bezier(.2,1,.4,1) both}
.dname.popin{animation:popIn .5s cubic-bezier(.2,1.4,.4,1) both}
.dstats.popin{animation:popIn .5s cubic-bezier(.2,1.4,.4,1) .08s both}
.dstars.popin{animation:popIn .5s cubic-bezier(.2,1.4,.4,1) .16s both}
.dmove.popin{animation:popIn .5s cubic-bezier(.2,1.4,.4,1) .24s both}
.rband.popin{animation:popIn .5s cubic-bezier(.2,1.4,.4,1) .3s both}
"""


TILT_JS = """
(function(){
  var DRAGGING = false;      // finger wins: gyro ignored while dragging
  var cards = [];

  function reg(wrap, card){
    var o = {wrap:wrap, card:card, tx:0, ty:0, gx:0, gy:0};
    cards.push(o);
    return o;
  }

  // one shared animation loop = buttery smooth on every card
  function loop(){
    for (var i=0;i<cards.length;i++){
      var o = cards[i];
      // ease toward target (higher = snappier, lower = smoother)
      o.tx += (o.gx - o.tx) * 0.16;
      o.ty += (o.gy - o.ty) * 0.16;
      if (Math.abs(o.gx-o.tx) < 0.0006) o.tx = o.gx;
      if (Math.abs(o.gy-o.ty) < 0.0006) o.ty = o.gy;
      o.card.style.setProperty('--tx', o.tx.toFixed(4));
      o.card.style.setProperty('--ty', o.ty.toFixed(4));
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.bindTilt = function(wrap){
    if (wrap.dataset.tilt) return;
    wrap.dataset.tilt = "1";
    var card = wrap.querySelector('.dscene') || wrap.querySelector('.dcard');
    if (!card) return;
    var o = reg(wrap, card);
    var down = false;

    function target(x, y){
      o.gx = Math.max(-1, Math.min(1, x));
      o.gy = Math.max(-1, Math.min(1, y));
    }
    function fromEvent(e){
      var r = wrap.getBoundingClientRect();
      target(((e.clientX-r.left)/r.width-0.5)*2, ((e.clientY-r.top)/r.height-0.5)*2);
    }
    wrap.addEventListener('pointerdown', function(e){
      down = true; DRAGGING = true;
      try { wrap.setPointerCapture(e.pointerId); } catch(_){}
      fromEvent(e);
      e.preventDefault();
    }, {passive:false});
    wrap.addEventListener('pointermove', function(e){
      if (down) { fromEvent(e); e.preventDefault(); }
      else if (e.pointerType === 'mouse') fromEvent(e);
    }, {passive:false});
    function release(){
      if (!down) return;
      down = false; DRAGGING = false;
      target(0, 0);            // glide back to rest
    }
    wrap.addEventListener('pointerup', release);
    wrap.addEventListener('pointercancel', release);
    wrap.addEventListener('pointerleave', function(e){
      if (!down && e.pointerType === 'mouse') target(0,0);
    });
    o.setGyro = function(x, y){ if (!DRAGGING && !down) target(x, y); };
  };

  window.enableGyro = function(){
    function handle(ev){
      if (DRAGGING) return;                     // finger always wins
      var g = (ev.gamma||0)/30, b = ((ev.beta||0)-42)/30;
      for (var i=0;i<cards.length;i++){
        if (cards[i].setGyro) cards[i].setGyro(g, b);
      }
    }
    function start(){ window.addEventListener('deviceorientation', handle); }
    if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission){
      DeviceOrientationEvent.requestPermission().then(function(s){ if (s==='granted') start(); });
    } else { start(); }
    return true;
  };
})();
"""


def css_wash(pal):
    """Themed multi-stop gradient used as the foil colour wash."""
    n = len(pal)
    stops = []
    for i, c in enumerate(pal):
        pct = 12 + int(i * (76 / max(1, n - 1)))
        stops.append(f"{hexs(c)} {pct}%")
    return f"linear-gradient(115deg,transparent 4%,{','.join(stops)},transparent 96%)"


def css_pattern(pal, pat):
    """The texture layer — diamond lattice and friends."""
    a, b = hexs(pal[0]), hexs(pal[min(2, len(pal)-1)])
    w = hexs(pal[min(3, len(pal)-1)])
    if pat == "diamond":
        return (f"repeating-linear-gradient(45deg,{a} 0 1px,transparent 1px 11px),"
                f"repeating-linear-gradient(-45deg,{b} 0 1px,transparent 1px 11px)")
    if pat == "honeycomb":
        return (f"repeating-linear-gradient(60deg,{a} 0 1px,transparent 1px 13px),"
                f"repeating-linear-gradient(-60deg,{b} 0 1px,transparent 1px 13px),"
                f"repeating-linear-gradient(0deg,{w} 0 1px,transparent 1px 13px)")
    if pat == "shatter":
        return (f"repeating-linear-gradient(28deg,{a} 0 1px,transparent 1px 9px),"
                f"repeating-linear-gradient(-67deg,{b} 0 1px,transparent 1px 15px)")
    if pat == "starburst":
        return f"repeating-conic-gradient({a} 0deg 3deg,transparent 3deg 9deg)"
    if pat == "prism":
        return f"repeating-linear-gradient(72deg,{a} 0 1px,transparent 1px 5px)"
    return f"repeating-linear-gradient(115deg,{a} 0 2px,transparent 2px 12px)"


def card_html(d, hero_src):
    r = d["rarity"]
    foil = round(0.40 + r * 0.13, 2)
    fw   = 6 + r
    neon = 3 + r * 3
    shim = round(7.2 - r * 0.75, 2)
    stars = "★" * r + "☆" * (5 - r)
    D = d.get("dna") or _dna.dna(d["name"])
    pal, pat = foil_style(d["name"])
    wash = css_wash(pal)
    patt = css_pattern(pal, pat)
    psize = {"diamond":22,"honeycomb":26,"shatter":18,
             "starburst":140,"prism":14,"linear":24}[pat]
    o1, o2, o3 = hexs(pal[1]), hexs(pal[0]), hexs(pal[min(2, len(pal)-1)])
    cpal = contrast_palette(pal)
    t1, t2, t3 = hexs(cpal[1]), hexs(cpal[3 % len(cpal)]), hexs(cpal[0])
    ocyc = D["cycle"]
    pr   = "pr-" + D["prop"]
    edge = round(0.55 + r * 0.09, 2)      # rarer = brighter tracing
    L = '<i class="lattice"></i>'

    # a few tiny motes that drift along the edges only
    kind = D["pkind"]
    anim = {"rise":"emRise","fall":"emFall","flash":"emFlash"}.get(kind, "emTwinkle")
    motes = []
    for k in range(4 + r):
        left = (k * 83) % 92 + 4
        dly  = round((k * 0.53) % 3.1, 2)
        dur  = round(2.9 + (k % 4) * 0.6, 2)
        pos  = "bottom:-3%" if kind == "rise" else ("top:-3%" if kind == "fall"
               else f"top:{(k*37)%80+6}%")
        motes.append(f'<i style="left:{left}%;{pos};'
                     f'animation:{anim} {dur}s linear {dly}s infinite"></i>')

    return (
        f'<div class="dwrap">'
        f'<div class="dscene {pr}" style="--foil:{foil};--fw:{fw}px;--neon:{neon}px;'
        f'--shim:{shim}s;--gcol:{d["glow"]};--wash:{wash};--pat:{patt};--patsize:{psize}px;'
        f'--o1:{o1};--o2:{o2};--o3:{o3};--ocyc:{ocyc}s;--edge:{edge}">'
        f'<div class="dcard">'
        f'<div class="dart">'
        f'<img src="{hero_src}" alt="{d["name"]}">'
        f'<div class="edgemotes">{"".join(motes)}</div>'
        f'<div class="rimlight"></div>'
        f'<div class="ringmask slow"><i class="tracer"></i></div>'
        f'<div class="ringmask"><i class="tracer"></i></div>'
        f'</div>'
        f'<div class="dname foilzone">{L}{d["name"]}</div>'
        f'<div class="dstats foilzone">{L}<span>ATK {d["atk"]}</span>'
        f'<span>DEF {d["def"]}</span><span>SPD {d["spd"]}</span></div>'
        f'<div class="dstars foilzone">{L}{stars}</div>'
        f'<div class="dmove foilzone">{L}<b>{d["icon"]} {d["badge"]}</b>'
        f'<span>{d["move"]}</span></div>'
        f'<div class="dframe"></div>'
        f'</div></div></div>'
    )


PREVIEW = """<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{name}</title><style>
body{{margin:0;background:#06080f;color:#e8ebf5;font-family:system-ui,sans-serif;
display:flex;flex-direction:column;align-items:center;justify-content:center;
min-height:100vh;gap:15px;padding:18px}}
.tag{{color:#8f98b8;font-size:.82rem;text-align:center;max-width:400px}}
button{{background:#2c3660;color:#fff;border:0;border-radius:11px;padding:12px 20px;
font:700 .9rem system-ui}}
{css}</style></head><body>
{card}
<button onclick="enableGyro()">📱 Enable tilt shimmer</button>
<div class="tag">Drag your finger across the card — the neon foil on the frame,
name, stars, stats and move box shifts like real holographic stock.</div>
<script>{js}
document.querySelectorAll('.dwrap').forEach(bindTilt);</script>
</body></html>"""


def build_digital(name):
    hero_p = os.path.join(ART, f"{name}_hero.png")
    if not os.path.exists(hero_p):
        return False
    d = card_data(name)
    with open(hero_p, "rb") as f:
        src = "data:image/png;base64," + base64.b64encode(f.read()).decode()
    html = PREVIEW.format(name=name, css=card_css(), js=TILT_JS,
                          card=card_html(d, src))
    with open(os.path.join(ART, f"{name}_card.html"), "w") as f:
        f.write(html)
    return True


def write_assets():
    pub = os.path.join(PROJ, "public")
    os.makedirs(pub, exist_ok=True)
    with open(os.path.join(pub, "duckcard.css"), "w") as f:
        f.write(card_css())
    with open(os.path.join(pub, "ducktilt.js"), "w") as f:
        f.write(TILT_JS)


def complete(name):
    return (os.path.exists(os.path.join(ART, f"{name}_hero.png")) and
            os.path.exists(os.path.join(PRESS, f"{name}_card.png")) and
            os.path.exists(os.path.join(ART, f"{name}_card.html")))


def main():
    import time as _t
    force = "--force" in sys.argv
    quiet = "--quiet" in sys.argv
    only = None
    for i, a in enumerate(sys.argv):
        if a == "--only" and i + 1 < len(sys.argv):
            only = sys.argv[i + 1].strip().lower()
    roster = [only] if only else [l.strip() for l in open(ROSTER) if l.strip()]
    # only cards whose art actually exists
    todo = [n for n in roster if os.path.exists(os.path.join(ART, f"{n}_hero.png"))]
    total = len(todo)
    if total == 0:
        print("🃏 no painted ducks yet — nothing to refresh")
        return
    t0 = _t.time()
    n = 0
    for name in todo:
        if build_printable(name, force=force):
            build_digital(name)
        elif force:
            build_digital(name)
        n += 1
        if not quiet and (n == 1 or n % 5 == 0 or n == total):
            pct = n * 100 // total
            fill = pct * 24 // 100
            bar = "█" * fill + "░" * (24 - fill)
            el = _t.time() - t0
            eta = (el / n) * (total - n)
            m, s = int(eta // 60), int(eta % 60)
            left = f"{m}m {s:02d}s" if m else f"{s}s"
            print(f"\r   [{bar}] {n}/{total}  {pct}%  ·  ~{left} left      ",
                  end="", flush=True)
    write_assets()
    if not quiet:
        el = int(_t.time() - t0)
        print(f"\n🃏 {total} cards refreshed in {el // 60}m {el % 60:02d}s")


if __name__ == "__main__":
    main()
